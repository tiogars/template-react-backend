import { useCallback, useEffect } from 'react';
import { userSettingsClient } from '@organization_template/react-client';
import { useAuth } from '../auth/AuthContext';
import type { ThemeMode } from '../types';

/**
 * Keeps the local (browser cached) view mode in sync with the API user settings:
 * the signed-in user's own settings, or the ANONYMOUS role settings otherwise.
 */
export function useSyncedThemeMode(setLocalThemeMode: (mode: ThemeMode) => void) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    let active = true;
    const request = user ? userSettingsClient.mine() : userSettingsClient.anonymous();
    Promise.resolve(request)
      .then((settings) => { if (active && settings?.viewMode) setLocalThemeMode(settings.viewMode); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [loading, setLocalThemeMode, user]);

  return useCallback((mode: ThemeMode) => {
    setLocalThemeMode(mode);
    if (user) void Promise.resolve(userSettingsClient.updateMine({ viewMode: mode })).catch(() => undefined);
  }, [setLocalThemeMode, user]);
}
