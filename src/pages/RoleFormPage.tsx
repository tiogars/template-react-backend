import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material';
import { authClient } from '@organization_template/react-client';
import { parseTaskId, toErrorMessage } from '../taskUtils';

type FormValues = { code: string; label: string };

export function RoleFormPage({ mode }: Readonly<{ mode: 'create' | 'edit' }>) {
  const { id } = useParams();
  const roleId = parseTaskId(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ defaultValues: { code: '', label: '' } });

  useEffect(() => {
    if (mode !== 'edit') return;
    if (roleId === null) {
      setError('Invalid role id.');
      setLoading(false);
      return;
    }
    let active = true;
    authClient
      .role(roleId)
      .then((role) => {
        if (active) reset({ code: role.code, label: role.label });
      })
      .catch((caught) => setError(toErrorMessage(caught)))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, reset, roleId]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (mode === 'create')
        await authClient.createRole({ code: values.code.trim(), label: values.label.trim() });
      else {
        if (roleId === null) throw new Error('Invalid role id.');
        await authClient.updateRole(roleId, { label: values.label.trim() });
      }
      navigate('/admin/roles');
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  };

  if (loading) return <CircularProgress aria-label="Loading role" />;

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
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
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
              <Button component={RouterLink} to="/admin/roles">
                Cancel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
