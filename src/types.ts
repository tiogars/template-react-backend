export type ThemeMode = 'light' | 'dark' | 'system';

export type SnackbarState = {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};