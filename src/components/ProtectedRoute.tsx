import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loading, user } = useAuth();
  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading session" /></Box>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { hasRole } = useAuth();
  return hasRole('ADMIN') ? children : <Navigate to="/" replace />;
}