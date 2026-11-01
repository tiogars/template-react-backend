import { useState } from 'react';
import PrintIcon from '@mui/icons-material/Print';
import { Alert, Button, Snackbar } from '@mui/material';
import { toErrorMessage } from '../taskUtils';
import { openPdfForPrinting } from '../pdfPrinting';

type PrintPdfButtonProps = {
  label: string;
  loadPdf: () => Promise<Blob>;
  disabled?: boolean;
};

export function PrintPdfButton({ label, loadPdf, disabled = false }: PrintPdfButtonProps) {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    setPrinting(true);
    setError(null);
    try {
      await openPdfForPrinting(loadPdf);
    } catch (caught) {
      setError(
        caught instanceof Error &&
          'status' in caught &&
          (caught.status === 404 || caught.status === 422)
          ? caught.message
          : toErrorMessage(caught),
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PrintIcon />}
        disabled={disabled}
        loading={printing}
        onClick={() => void handlePrint()}
      >
        {label}
      </Button>
      <Snackbar open={error !== null} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
