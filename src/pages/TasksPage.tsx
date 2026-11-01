import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { Task } from '@organization_template/react-client';
import { taskClient } from '@organization_template/react-client';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DeleteSelectedButton, deleteSelectedMessage } from '../components/DeleteSelectedButton';
import { MobileTaskList } from '../components/MobileTaskList';
import { PageHeader } from '../components/PageHeader';
import { PrintPdfButton } from '../components/PrintPdfButton';
import { seedRequests } from '../config';
import {
  downloadFile,
  formatDate,
  handleFileChange,
  parseJsonImport,
  toErrorMessage,
} from '../taskUtils';
import { useTasks } from '../hooks/useTasks';
import { useRowSelection } from '../hooks/useRowSelection';
import type { SnackbarState } from '../types';
import { useTaxonomies } from '../hooks/useTaxonomies';
import { nomenclaturePath, taxonomyLabel } from '../taxonomyUtils';

export function TasksPage() {
  const taxonomy = useTaxonomies();
  const { templates, loading, error, refresh } = useTasks();
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { selectionModel, setSelectionModel, selectedIds, clearSelection } =
    useRowSelection(templates);

  const runAndRefresh = async (operation: () => Promise<Task[]>, verb: string) => {
    try {
      const result = await operation();
      setSnackbar({ message: `${verb} ${result.length} Tasks.`, severity: 'success' });
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await taskClient.delete(pendingDelete.id);
      setPendingDelete(null);
      setSnackbar({ message: 'Task deleted.', severity: 'success' });
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const result = await taskClient.deleteSelected(selectedIds);
      setSnackbar({
        message: deleteSelectedMessage('Tasks', result.deletedIds.length, result.skippedIds.length),
        severity: result.skippedIds.length > 0 ? 'warning' : 'success',
      });
      clearSelection();
      await refresh();
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const exportFile = async (format: 'json' | 'csv') => {
    try {
      const content =
        format === 'json'
          ? JSON.stringify(await taskClient.exportJson(), null, 2)
          : await taskClient.exportCsv();
      downloadFile(`tasks.${format}`, content, format === 'json' ? 'application/json' : 'text/csv');
    } catch (caught) {
      setSnackbar({ message: toErrorMessage(caught), severity: 'error' });
    }
  };

  const columns: GridColDef<Task>[] = [
    { field: 'id', headerName: 'ID', width: 90, type: 'number' },
    { field: 'code', headerName: 'Code', flex: 1, minWidth: 150 },
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 180 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 220 },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 150,
      valueFormatter: (value: string) => (value ?? 'TODO').replaceAll('_', ' '),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      minWidth: 120,
      valueFormatter: (value: string) => value ?? 'NORMAL',
    },
    { field: 'dueDate', headerName: 'Due date', minWidth: 130 },
    { field: 'assignedTo', headerName: 'Assigned to', minWidth: 150 },
    {
      field: 'tagIds',
      headerName: 'Tags',
      minWidth: 180,
      valueGetter: (value: number[]) =>
        (value ?? []).map((id) => taxonomyLabel(id, taxonomy.tags)).join(', ') || 'None',
    },
    {
      field: 'nomenclatureId',
      headerName: 'Nomenclature',
      minWidth: 220,
      valueGetter: (value: number | null) => nomenclaturePath(value, taxonomy.nomenclatures),
    },
    {
      field: 'createdDate',
      headerName: 'Created',
      flex: 1,
      minWidth: 190,
      valueFormatter: (value: string) => formatDate(value),
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
      minWidth: 170,
      renderCell: (params: GridRenderCellParams<Task>) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title="View">
            <IconButton
              aria-label={`View ${params.row.code}`}
              onClick={() => navigate(`/tasks/${params.row.id}`)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              aria-label={`Edit ${params.row.code}`}
              onClick={() => navigate(`/tasks/${params.row.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              aria-label={`Delete ${params.row.code}`}
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
        title="Tasks"
        description="Create, review, import, and export all Tasks."
        action={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/tasks/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create
            </Button>
            <Button
              startIcon={<RestartAltIcon />}
              onClick={() => void runAndRefresh(() => taskClient.seed(seedRequests), 'Seeded')}
            >
              Seed
            </Button>
            <Button startIcon={<UploadIcon />} onClick={() => jsonInputRef.current?.click()}>
              Import JSON
            </Button>
            <Button startIcon={<UploadIcon />} onClick={() => csvInputRef.current?.click()}>
              Import CSV
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={() => void exportFile('json')}>
              Export JSON
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={() => void exportFile('csv')}>
              Export CSV
            </Button>
            <PrintPdfButton
              label="Print all"
              loadPdf={() => taskClient.printAll()}
              disabled={loading}
            />
            {isDesktop && (
              <PrintPdfButton
                label={`Print selected (${selectedIds.length})`}
                loadPdf={() => taskClient.printSelected(selectedIds)}
                disabled={loading || selectedIds.length === 0}
              />
            )}
            {isDesktop && (
              <DeleteSelectedButton
                count={selectedIds.length}
                entityLabel="Tasks"
                onConfirm={handleDeleteSelected}
              />
            )}
          </Stack>
        }
      />
      <input
        ref={jsonInputRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(event) =>
          handleFileChange(event, async (file) =>
            runAndRefresh(
              () =>
                file
                  .text()
                  .then(parseJsonImport)
                  .then((requests) => taskClient.importJson(requests)),
              'Imported',
            ),
          )
        }
      />
      <input
        ref={csvInputRef}
        hidden
        type="file"
        accept="text/csv,.csv"
        onChange={(event) =>
          handleFileChange(event, async (file) =>
            runAndRefresh(() => file.text().then((csv) => taskClient.importCsv(csv)), 'Imported'),
          )
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      {taxonomy.error && (
        <Alert severity="error">{taxonomy.error} Relationship labels could not be loaded.</Alert>
      )}
      {isDesktop ? (
        <Paper sx={{ height: 560 }}>
          <DataGrid
            rows={templates}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            checkboxSelection
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Paper>
      ) : (
        <MobileTaskList
          templates={templates}
          loading={loading}
          onDelete={setPendingDelete}
          tags={taxonomy.tags}
          nomenclatures={taxonomy.nomenclatures}
        />
      )}
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {pendingDelete?.label} ({pendingDelete?.code})? This cannot be undone.
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
