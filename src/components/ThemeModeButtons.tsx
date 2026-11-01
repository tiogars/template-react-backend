import type { ReactElement } from 'react';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton, Stack, Tooltip } from '@mui/material';
import type { ThemeMode } from '../types';

type Props = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

export function ThemeModeButtons({ themeMode, setThemeMode }: Props) {
  const modes: Array<{ mode: ThemeMode; label: string; icon: ReactElement }> = [
    { mode: 'light', label: 'Bright mode', icon: <LightModeIcon /> },
    { mode: 'dark', label: 'Dark mode', icon: <DarkModeIcon /> },
    { mode: 'system', label: 'System mode', icon: <BrightnessAutoIcon /> },
  ];

  return (
    <Stack direction="row" spacing={0.5} aria-label="View mode">
      {modes.map((item) => (
        <Tooltip title={item.label} key={item.mode}>
          <IconButton
            color={themeMode === item.mode ? 'primary' : 'default'}
            onClick={() => setThemeMode(item.mode)}
            aria-label={item.label}
            aria-pressed={themeMode === item.mode}
          >
            {item.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}