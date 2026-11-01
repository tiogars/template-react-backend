import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { toErrorMessage } from '../taskUtils';

type FormValues = { username: string; password: string };

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { username: '', password: '' },
  });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.username.trim(), values.password);
      navigate('/', { replace: true });
    } catch (caught) {
      setError(toErrorMessage(caught, 'Login failed.'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: '100%', maxWidth: 420 }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h4">Sign in</Typography>
              <Typography color="text.secondary">Tasks Console</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              autoComplete="username"
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              {...register('username', { required: 'Username is required.' })}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password', { required: 'Password is required.' })}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Sign in
            </Button>
            <Button component={RouterLink} to="/downloads" startIcon={<DownloadIcon />}>
              Download the application
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
