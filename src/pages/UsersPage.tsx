import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { authClient, type UserAccount } from '@organization_template/react-client';
import { PageHeader } from '../components/PageHeader';
import { DeleteSelectedButton, deleteSelectedMessage } from '../components/DeleteSelectedButton';
import { useRowSelection } from '../hooks/useRowSelection';
import { formatDate, toErrorMessage } from '../taskUtils';
import type { SnackbarState } from '../types';

export function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserAccount | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const navigate = useNavigate();
  const { selectionModel, setSelectionModel, selectedIds, clearSelection } = useRowSelection(users);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await authClient.users());
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await authClient.deleteUser(pendingDelete.id);
      setPendingDelete(null);
      setSnackbar({ message: 'User deleted.', severity: 'success' });
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const result = await authClient.deleteUsers(selectedIds);
      setSnackbar({
        message: deleteSelectedMessage('users', result.deletedIds.length, result.skippedIds.length),
        severity: result.skippedIds.length > 0 ? 'warning' : 'success',
      });
      clearSelection();
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const columns: GridColDef<UserAccount>[] = [
    { field: 'id', headerName: 'ID', width: 90, type: 'number' },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 180 },
    { field: 'enabled', headerName: 'Enabled', width: 120, type: 'boolean' },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.roles.map((role) => role.code).join(', '),
    },
    {
      field: 'lastModifiedDate',
      headerName: 'Last modified',
      flex: 1,
      minWidth: 190,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams<UserAccount>) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title="Edit">
            <IconButton
              aria-label={`Edit ${params.row.username}`}
              onClick={() => navigate(`/admin/users/${params.row.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              aria-label={`Delete ${params.row.username}`}
              onClick={() => setPendingDelete(params.row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Users"
        description="Manage local accounts and role assignments."
        action={
          <Stack direction="row" spacing={1}>
            <DeleteSelectedButton
              count={selectedIds.length}
              entityLabel="users"
              onConfirm={handleDeleteSelected}
            />
            <Button
              component={RouterLink}
              to="/admin/users/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ height: 560 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          checkboxSelection
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
        />
      </Paper>
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {pendingDelete?.username}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar !== null} autoHideDuration={5000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : undefined}
      </Snackbar>
    </Stack>
  );
}
