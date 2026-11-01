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
import { authClient, type Role } from '@organization_template/react-client';
import { PageHeader } from '../components/PageHeader';
import { DeleteSelectedButton, deleteSelectedMessage } from '../components/DeleteSelectedButton';
import { useRowSelection } from '../hooks/useRowSelection';
import { formatDate, toErrorMessage } from '../taskUtils';
import type { SnackbarState } from '../types';

const systemRoles = new Set(['ANONYMOUS', 'ADMIN', 'USER']);
const isDeletableRole = (role: Role) => !systemRoles.has(role.code);

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const navigate = useNavigate();
  const { selectionModel, setSelectionModel, selectedIds, clearSelection } = useRowSelection(
    roles,
    isDeletableRole,
  );

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await authClient.roles());
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
      await authClient.deleteRole(pendingDelete.id);
      setPendingDelete(null);
      setSnackbar({ message: 'Role deleted.', severity: 'success' });
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const result = await authClient.deleteRoles(selectedIds);
      setSnackbar({
        message: deleteSelectedMessage('roles', result.deletedIds.length, result.skippedIds.length),
        severity: result.skippedIds.length > 0 ? 'warning' : 'success',
      });
      clearSelection();
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const columns: GridColDef<Role>[] = [
    { field: 'id', headerName: 'ID', width: 90, type: 'number' },
    { field: 'code', headerName: 'Code', flex: 1, minWidth: 160 },
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 180 },
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
      renderCell: (params: GridRenderCellParams<Role>) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title="Edit">
            <IconButton
              aria-label={`Edit ${params.row.code}`}
              onClick={() => navigate(`/admin/roles/${params.row.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={systemRoles.has(params.row.code) ? 'System role' : 'Delete'}>
            <span>
              <IconButton
                disabled={systemRoles.has(params.row.code)}
                aria-label={`Delete ${params.row.code}`}
                onClick={() => setPendingDelete(params.row)}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Roles"
        description="Manage available authorization roles."
        action={
          <Stack direction="row" spacing={1}>
            <DeleteSelectedButton
              count={selectedIds.length}
              entityLabel="roles"
              onConfirm={handleDeleteSelected}
            />
            <Button
              component={RouterLink}
              to="/admin/roles/new"
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
          rows={roles}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          checkboxSelection
          isRowSelectable={(params) => isDeletableRole(params.row)}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
        />
      </Paper>
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete role</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {pendingDelete?.label} ({pendingDelete?.code})?
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
