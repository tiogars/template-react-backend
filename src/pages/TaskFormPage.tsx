import { useParams } from 'react-router-dom';
import { Stack } from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { TaskForm } from '../forms/TaskForm';

export function TaskFormPage({ mode }: Readonly<{ mode: 'create' | 'edit' }>) {
  const { id } = useParams();

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <PageHeader
        title={mode === 'create' ? 'Create Task' : 'Update Task'}
        description={
          mode === 'create'
            ? 'Define a new task and its categorization.'
            : `Editing task ID ${id ?? ''}.`
        }
      />
      <TaskForm mode={mode} />
    </Stack>
  );
}
