import { useEffect, useState } from 'react';
import {
  nomenclatureClient,
  tagClient,
  type NomenclatureRead,
  type TagRead,
} from '@organization_template/react-client';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { DetailField } from '../components/DetailField';
import { emptyToNull, formatDate, toErrorMessage } from '../taskUtils';
import { nomenclaturePath, parentOptions } from '../taxonomyUtils';

export function TaxonomyPage({ kind }: { kind: 'tag' | 'nomenclature' }) {
  const hierarchical = kind === 'nomenclature';
  const title = hierarchical ? 'Nomenclatures' : 'Tags';
  const client = hierarchical ? nomenclatureClient : tagClient;
  const [records, setRecords] = useState<(TagRead | NomenclatureRead)[]>([]);
  const [editing, setEditing] = useState<TagRead | NomenclatureRead | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TagRead | null>(null);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setRecords(await client.findAll());
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, [kind]);

  const reset = () => {
    setEditing(null);
    setCode('');
    setLabel('');
    setDescription('');
    setParentId('');
  };
  const edit = (record: TagRead | NomenclatureRead) => {
    setEditing(record);
    setCode(record.code);
    setLabel(record.label);
    setDescription(record.description ?? '');
    setParentId('parentId' in record && record.parentId != null ? String(record.parentId) : '');
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const fields = {
        label: label.trim(),
        description: emptyToNull(description),
        ...(hierarchical ? { parentId: parentId ? Number(parentId) : null } : {}),
      };
      if (editing) await client.update(editing.id, fields);
      else await client.create({ code: code.trim(), ...fields });
      reset();
      await refresh();
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    setError(null);
    try {
      await client.delete(pendingDelete.id);
      if (editing?.id === pendingDelete.id) reset();
      setPendingDelete(null);
      await refresh();
    } catch (caught) {
      setPendingDelete(null);
      setError(`${toErrorMessage(caught)} Referenced records cannot be deleted.`);
    } finally {
      setSaving(false);
    }
  };
  const nodes = records as NomenclatureRead[];
  const ordered = hierarchical
    ? parentOptions(nodes)
    : [...records].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Stack spacing={3}>
      <PageHeader
        title={title}
        description={
          hierarchical
            ? 'Organize tasks in a hierarchy. Select a parent or leave a root node.'
            : 'Categorize tasks with reusable tags.'
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Card component="form" onSubmit={(event) => void save(event)}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              {editing ? `Edit ${editing.label}` : `Create ${kind}`}
            </Typography>
            <TextField
              label="Code"
              required
              value={code}
              disabled={Boolean(editing)}
              onChange={(event) => setCode(event.target.value)}
              helperText={editing ? 'Code cannot be changed.' : undefined}
            />
            <TextField
              label="Label"
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
            <TextField
              label="Description"
              multiline
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {hierarchical && (
              <TextField
                label="Parent"
                select
                value={parentId}
                slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="">None (root)</option>
                {parentOptions(nodes, editing?.id).map((node) => (
                  <option key={node.id} value={node.id}>
                    {nomenclaturePath(node.id, nodes)}
                  </option>
                ))}
              </TextField>
            )}
            <Stack direction="row" spacing={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving || loading || !label.trim() || !code.trim()}
              >
                {editing ? 'Update' : 'Create'}
              </Button>
              {editing && <Button onClick={reset}>Cancel edit</Button>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      {loading && <CircularProgress aria-label={`Loading ${title}`} />}
      {!loading && records.length === 0 && <Typography>No {title.toLowerCase()} yet.</Typography>}
      {ordered.map((record) => (
        <Card key={record.id}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h6">
                {hierarchical ? nomenclaturePath(record.id, nodes) : record.label}
              </Typography>
              <Typography>
                {record.code} · ID {record.id}
              </Typography>
              <Typography>{record.description || 'No description'}</Typography>
              {hierarchical && (
                <DetailField
                  label="Parent"
                  value={nomenclaturePath((record as NomenclatureRead).parentId, nodes)}
                />
              )}
              <DetailField
                label="Created"
                value={`${formatDate(record.createdDate)} · ${record.createdBy ?? 'Not available'}`}
              />
              <DetailField
                label="Last modified"
                value={`${formatDate(record.lastModifiedDate)} · ${record.lastModifiedBy ?? 'Not available'}`}
              />
              <Stack direction="row" spacing={1}>
                <Button onClick={() => edit(record)} aria-label={`Edit ${record.label}`}>
                  Edit
                </Button>
                <Button
                  color="error"
                  onClick={() => setPendingDelete(record)}
                  aria-label={`Delete ${record.label}`}
                >
                  Delete
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete {kind}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {pendingDelete?.label}? Referenced records cannot be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)} disabled={saving}>
            Cancel
          </Button>
          <Button color="error" onClick={() => void remove()} disabled={saving}>
            Confirm delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
