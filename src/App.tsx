import { useMemo } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { AuthProvider } from './auth/AuthContext';
import { ConsoleLayout } from './components/ConsoleLayout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { usePersistentState } from './hooks/usePersistentState';
import { useSyncedThemeMode } from './hooks/useSyncedThemeMode';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskFormPage } from './pages/TaskFormPage';
import { TasksPage } from './pages/TasksPage';
import { LoginPage } from './pages/LoginPage';
import { RoleFormPage } from './pages/RoleFormPage';
import { RolesPage } from './pages/RolesPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserFormPage } from './pages/UserFormPage';
import { UsersPage } from './pages/UsersPage';
import { TaxonomyPage } from './pages/TaxonomyPage';
import type { ThemeMode } from './types';

export function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = usePersistentState<ThemeMode>('backend.themeMode', 'system');
  let paletteMode: 'light' | 'dark';
  if (themeMode === 'system') paletteMode = prefersDark ? 'dark' : 'light';
  else paletteMode = themeMode;
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: paletteMode,
          primary: { main: paletteMode === 'dark' ? '#7cc7a4' : '#25624f' },
          secondary: { main: '#c16a3f' },
          background: {
            default: paletteMode === 'dark' ? '#121816' : '#f5f2eb',
            paper: paletteMode === 'dark' ? '#18211e' : '#fffdf8',
          },
        },
        typography: {
          fontFamily: '"Aptos", "Segoe UI", sans-serif',
          h4: { fontWeight: 700 },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 700 },
        },
        shape: { borderRadius: 8 },
        components: { MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } } },
      }),
    [paletteMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ConsoleRoutes themeMode={themeMode} setLocalThemeMode={setThemeMode} />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

type ConsoleRoutesProps = Readonly<{
  themeMode: ThemeMode;
  setLocalThemeMode: (mode: ThemeMode) => void;
}>;

function ConsoleRoutes({ themeMode, setLocalThemeMode }: ConsoleRoutesProps) {
  const setThemeMode = useSyncedThemeMode(setLocalThemeMode);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/downloads" element={<DownloadsPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <ConsoleLayout themeMode={themeMode} setThemeMode={setThemeMode}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/new" element={<TaskFormPage mode="create" />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
                <Route path="/tasks/:id/edit" element={<TaskFormPage mode="edit" />} />
                <Route path="/tags" element={<TaxonomyPage key="tags" kind="tag" />} />
                <Route
                  path="/nomenclatures"
                  element={<TaxonomyPage key="nomenclatures" kind="nomenclature" />}
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users/new"
                  element={
                    <AdminRoute>
                      <UserFormPage mode="create" />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users/:id/edit"
                  element={
                    <AdminRoute>
                      <UserFormPage mode="edit" />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <AdminRoute>
                      <RolesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/roles/new"
                  element={
                    <AdminRoute>
                      <RoleFormPage mode="create" />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/roles/:id/edit"
                  element={
                    <AdminRoute>
                      <RoleFormPage mode="edit" />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={<SettingsPage themeMode={themeMode} setThemeMode={setThemeMode} />}
                />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </ConsoleLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
