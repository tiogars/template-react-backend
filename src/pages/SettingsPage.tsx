import { useCallback } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { userSettingsClient, type UpdateUserSettingsRequest } from '@organization_template/react-client';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { UserSettingsEditor, ViewModeSelect } from '../components/UserSettingsEditor';
import type { ThemeMode } from '../types';

type Props = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

export function SettingsPage({ themeMode, setThemeMode }: Props) {
  const { hasRole } = useAuth();
  const loadAnonymous = useCallback(() => userSettingsClient.anonymous(), []);
  const saveAnonymous = useCallback(
    (request: UpdateUserSettingsRequest) => userSettingsClient.updateAnonymous(request),
    [],
  );

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <PageHeader title="Settings" description="Manage your console settings. They are saved to your account." />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">My settings</Typography>
            <ViewModeSelect id="my-view-mode" value={themeMode} onChange={setThemeMode} />
          </Stack>
        </CardContent>
      </Card>
      {hasRole('ADMIN') && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Anonymous settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Default settings applied to visitors who are not signed in (ANONYMOUS role).
              </Typography>
              <UserSettingsEditor id="anonymous-view-mode" load={loadAnonymous} save={saveAnonymous} />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
