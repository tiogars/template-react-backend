import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UpdateUserSettingsRequest, UserSettings } from '@organization_template/react-client';
import { toErrorMessage } from '../taskUtils';
import type { ThemeMode } from '../types';

type ViewModeSelectProps = Readonly<{
  id: string;
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  disabled?: boolean;
}>;

export function ViewModeSelect({ id, value, onChange, disabled }: ViewModeSelectProps) {
  return (
    <FormControl fullWidth>
      <Typography id={`${id}-label`} component="label" variant="subtitle2" sx={{ mb: 1 }}>
        View mode
      </Typography>
      <Select
        labelId={`${id}-label`}
        value={value}
        disabled={disabled}
        onChange={(event: SelectChangeEvent) => onChange(event.target.value as ThemeMode)}
      >
        <MenuItem value="light">Bright</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
        <MenuItem value="system">System</MenuItem>
      </Select>
    </FormControl>
  );
}

type UserSettingsEditorProps = Readonly<{
  id: string;
  load: () => Promise<UserSettings>;
  save: (request: UpdateUserSettingsRequest) => Promise<UserSettings>;
  onLoadError?: (error: unknown) => string | null;
}>;

export function UserSettingsEditor({ id, load, save, onLoadError }: UserSettingsEditorProps) {
  const [viewMode, setViewMode] = useState<ThemeMode>('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .then((settings) => {
        if (active) setViewMode(settings.viewMode);
      })
      .catch((error_: unknown) => {
        if (!active) return;
        const message = onLoadError?.(error_) ?? null;
        if (message) setUnavailable(message);
        else setError(toErrorMessage(error_));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, onLoadError]);

  const onSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const settings = await save({ viewMode });
      setViewMode(settings.viewMode);
      setSaved(true);
    } catch (error_) {
      setError(toErrorMessage(error_));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress aria-label="Loading settings" />;
  if (unavailable) return <Alert severity="info">{unavailable}</Alert>;

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">Settings saved.</Alert>}
      <ViewModeSelect
        id={id}
        value={viewMode}
        onChange={(mode) => {
          setSaved(false);
          setViewMode(mode);
        }}
        disabled={saving}
      />
      <Stack direction="row">
        <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
          Save settings
        </Button>
      </Stack>
    </Stack>
  );
}
