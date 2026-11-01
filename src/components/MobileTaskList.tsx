import type { Task, TagRead, NomenclatureRead } from '@organization_template/react-client';
import { Link as RouterLink } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Button, CircularProgress, List, ListItem, Paper, Stack, Typography } from '@mui/material';
import { formatDate } from '../taskUtils';
import { nomenclaturePath, taxonomyLabel } from '../taxonomyUtils';

type Props = {
  templates: Task[];
  loading: boolean;
  onDelete: (template: Task) => void;
  tags: TagRead[];
  nomenclatures: NomenclatureRead[];
};

export function MobileTaskList({ templates, loading, onDelete, tags, nomenclatures }: Props) {
  if (loading) return <CircularProgress aria-label="Loading Tasks" />;

  return (
    <List component={Paper} disablePadding>
      {templates.map((template) => (
        <ListItem key={template.id} divider alignItems="flex-start">
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {template.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {template.code} · ID {template.id}
            </Typography>
            <Typography variant="body2">{template.description || 'No description'}</Typography>
            <Typography variant="body2">
              Status: {(template.status ?? 'TODO').replaceAll('_', ' ')} · Priority:{' '}
              {template.priority ?? 'NORMAL'}
            </Typography>
            <Typography variant="body2">
              Due date: {template.dueDate || 'None'} · Assigned to:{' '}
              {template.assignedTo || 'Unassigned'}
            </Typography>
            <Typography variant="body2">
              Tags:{' '}
              {(template.tagIds ?? []).map((id) => taxonomyLabel(id, tags)).join(', ') || 'None'}
            </Typography>
            <Typography variant="body2">
              Nomenclature: {nomenclaturePath(template.nomenclatureId, nomenclatures)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated {formatDate(template.lastModifiedDate)}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to={`/tasks/${template.id}`}
                size="small"
                startIcon={<VisibilityIcon />}
              >
                View
              </Button>
              <Button
                component={RouterLink}
                to={`/tasks/${template.id}/edit`}
                size="small"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(template)}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
}
