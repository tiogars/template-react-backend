import { Fragment, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DownloadIcon from '@mui/icons-material/Download';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import type { ThemeMode } from '../types';
import { ThemeModeButtons } from './ThemeModeButtons';

const drawerWidth = 264;
const navigation = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Tasks', path: '/tasks', icon: <ArticleIcon /> },
  { label: 'Tags', path: '/tags', icon: <ArticleIcon /> },
  { label: 'Nomenclatures', path: '/nomenclatures', icon: <ArticleIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  { label: 'Downloads', path: '/downloads', icon: <DownloadIcon /> },
  { label: 'About', path: '/about', icon: <InfoIcon /> },
];
const permissionsNavigation = [
  { label: 'Users', path: '/admin/users', icon: <GroupIcon /> },
  { label: 'Roles', path: '/admin/roles', icon: <AdminPanelSettingsIcon /> },
];

type Props = Readonly<{
  children: ReactNode;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}>;

export function ConsoleLayout({ children, themeMode, setThemeMode }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const { user, logout, hasRole } = useAuth();
  const canManagePermissions = hasRole('ADMIN');
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Box>
          <Typography variant="h6">Task</Typography>
          <Typography variant="body2" color="text.secondary">
            Management console
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ p: 1 }}>
        {navigation.map((item) => (
          <Fragment key={item.path}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 1,
                  '&.active': { bgcolor: 'action.selected', color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
            {item.path === '/settings' && canManagePermissions ? (
              <>
                <ListItem sx={{ pl: 7, py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Permisssions
                  </Typography>
                </ListItem>
                {permissionsNavigation.map((permissionItem) => (
                  <ListItem key={permissionItem.path} disablePadding sx={{ mb: 0.5, pl: 2 }}>
                    <ListItemButton
                      component={NavLink}
                      to={permissionItem.path}
                      onClick={() => setMobileOpen(false)}
                      sx={{
                        borderRadius: 1,
                        '&.active': { bgcolor: 'action.selected', color: 'primary.main' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        {permissionItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={permissionItem.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            ) : null}
          </Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Tasks Console
          </Typography>
          <ThemeModeButtons themeMode={themeMode} setThemeMode={setThemeMode} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout} sx={{ ml: 1 }}>
            {user?.username ?? 'Logout'}
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
