import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import type {
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
} from '@organization_template/react-client';
import { taskClient } from '@organization_template/react-client';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material';
import { emptyToNull, parseTaskId, toErrorMessage } from '../taskUtils';
import { useTaxonomies } from '../hooks/useTaxonomies';
import { nomenclaturePath, parentOptions } from '../taxonomyUtils';

type FormValues = {
  code: string;
  label: string;
  description: string;
  status: NonNullable<CreateTaskRequest['status']>;
  priority: NonNullable<CreateTaskRequest['priority']>;
  dueDate: string;
  assignedTo: string;
  tagIds: string[];
  nomenclatureId: string;
};

export function TaskForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const templateId = parseTaskId(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const taxonomy = useTaxonomies();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      code: '',
      label: '',
      description: '',
      status: 'TODO',
      priority: 'NORMAL',
      dueDate: '',
      assignedTo: '',
      tagIds: [],
      nomenclatureId: '',
    },
  });

  useEffect(() => {
    if (mode !== 'edit') return;
    if (templateId === null) {
      setError('Invalid Task id.');
      setLoading(false);
      return;
    }
    let active = true;
    taskClient
      .findById(templateId)
      .then((template) => {
        if (active)
          reset({
            code: template.code,
            label: template.label,
            description: template.description ?? '',
            status: template.status ?? 'TODO',
            priority: template.priority ?? 'NORMAL',
            dueDate: template.dueDate ?? '',
            assignedTo: template.assignedTo ?? '',
            tagIds: (template.tagIds ?? []).map(String),
            nomenclatureId: template.nomenclatureId == null ? '' : String(template.nomenclatureId),
          });
      })
      .catch((caught) => setError(toErrorMessage(caught)))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, reset, templateId]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      let saved: Task;
      const fields: UpdateTaskRequest = {
        label: values.label.trim(),
        description: emptyToNull(values.description),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
        assignedTo: emptyToNull(values.assignedTo),
        tagIds: values.tagIds.map(Number),
        nomenclatureId: values.nomenclatureId ? Number(values.nomenclatureId) : null,
      };
      if (mode === 'create') {
        const request: CreateTaskRequest = {
          ...fields,
          code: values.code.trim(),
        };
        saved = await taskClient.create(request);
      } else {
        if (templateId === null) throw new Error('Invalid Task id.');
        const request: UpdateTaskRequest = fields;
        saved = await taskClient.update(templateId, request);
      }
      navigate(`/tasks/${saved.id}`);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  };

  if (loading) return <CircularProgress aria-label="Loading Task" />;

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {taxonomy.error && (
        <Alert severity="error">{taxonomy.error} Relationship options could not be loaded.</Alert>
      )}
      <Card component="form" onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Code"
              disabled={mode === 'edit'}
              error={Boolean(errors.code)}
              helperText={
                errors.code?.message ?? (mode === 'edit' ? 'Code cannot be changed.' : undefined)
              }
              {...register('code', { required: 'Code is required.' })}
            />
            <TextField
              label="Label"
              error={Boolean(errors.label)}
              helperText={errors.label?.message}
              {...register('label', { required: 'Label is required.' })}
            />
            <TextField label="Description" multiline minRows={5} {...register('description')} />
            <TextField
              label="Status"
              select
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              {...register('status')}
              value={watch('status')}
            >
              {['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </TextField>
            <TextField
              label="Priority"
              select
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              {...register('priority')}
              value={watch('priority')}
            >
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </TextField>
            <TextField
              label="Due date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('dueDate')}
            />
            <TextField label="Assigned to" {...register('assignedTo')} />
            <Stack spacing={1}>
              <label htmlFor="task-tags">Tags</label>
              <Box
                component="select"
                id="task-tags"
                multiple
                {...register('tagIds')}
                value={watch('tagIds')}
                disabled={taxonomy.loading || Boolean(taxonomy.error)}
                sx={{
                  p: 1.5,
                  minHeight: 100,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: 1,
                }}
              >
                {taxonomy.tags.map((tag) => (
                  <option key={tag.id} value={String(tag.id)}>
                    {tag.label} ({tag.code})
                  </option>
                ))}
              </Box>
            </Stack>
            <TextField
              label="Nomenclature"
              select
              disabled={taxonomy.loading || Boolean(taxonomy.error)}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              {...register('nomenclatureId')}
              value={watch('nomenclatureId')}
            >
              <option value="">None</option>
              {parentOptions(taxonomy.nomenclatures).map((entry) => (
                <option key={entry.id} value={String(entry.id)}>
                  {nomenclaturePath(entry.id, taxonomy.nomenclatures)}
                </option>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || (templateId === null && mode === 'edit')}
              >
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
              <Button component={RouterLink} to="/tasks">
                Cancel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
