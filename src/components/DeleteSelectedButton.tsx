import { useState } from 'react';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface DeleteSelectedButtonProps {
  count: number;
  entityLabel: string;
  onConfirm: () => Promise<void>;
}

export function DeleteSelectedButton({ count, entityLabel, onConfirm }: DeleteSelectedButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button color="error" startIcon={<DeleteSweepIcon />} disabled={count === 0} onClick={() => setOpen(true)}>
        Delete selected ({count})
      </Button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)}>
        <DialogTitle>Delete selected {entityLabel}</DialogTitle>
        <DialogContent>
          <DialogContentText>Delete {count} selected {entityLabel}? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={() => void confirm()}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function deleteSelectedMessage(entityLabel: string, deleted: number, skipped: number) {
  const base = `Deleted ${deleted} ${entityLabel}.`;
  return skipped > 0 ? `${base} ${skipped} skipped (not found or protected).` : base;
}
