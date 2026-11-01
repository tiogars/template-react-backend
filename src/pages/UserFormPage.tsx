import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  authClient,
  userSettingsClient,
  UserSettingsError,
  type Role,
  type UpdateUserSettingsRequest,
} from '@organization_template/react-client';
import { UserSettingsEditor } from '../components/UserSettingsEditor';
import { parseTaskId, toErrorMessage } from '../taskUtils';

type FormValues = { username: string; password: string; enabled: boolean; roles: string[] };

export function UserFormPage({ mode }: Readonly<{ mode: 'create' | 'edit' }>) {
  const { id } = useParams();
  const userId = parseTaskId(id);
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'account' | 'settings'>('account');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { username: '', password: '', enabled: true, roles: ['USER'] },
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const availableRoles = await authClient.roles();
        if (!active) return;
        setRoles(availableRoles);
        if (mode === 'edit') {
          if (userId === null) throw new Error('Invalid user id.');
          const user = await authClient.user(userId);
          if (active)
            reset({
              username: user.username,
              password: '',
              enabled: user.enabled,
              roles: user.roles.map((role) => role.code),
            });
        }
      } catch (error_) {
        if (active) setError(toErrorMessage(error_));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [mode, reset, userId]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (mode === 'create') {
        await authClient.createUser({
          username: values.username.trim(),
          password: values.password,
          enabled: values.enabled,
          roles: values.roles,
        });
      } else {
        if (userId === null) throw new Error('Invalid user id.');
        await authClient.updateUser(userId, {
          username: values.username.trim(),
          password: values.password.trim() ? values.password : undefined,
          enabled: values.enabled,
          roles: values.roles,
        });
      }
      navigate('/admin/users');
    } catch (error_) {
      setError(toErrorMessage(error_));
    }
  };

  if (loading) return <CircularProgress aria-label="Loading user" />;

  const accountForm = (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <Card component="form" onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Username"
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              {...register('username', { required: 'Username is required.' })}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              helperText={
                errors.password?.message ??
                (mode === 'edit' ? 'Leave blank to keep the current password.' : undefined)
              }
              {...register('password', {
                required: mode === 'create' ? 'Password is required.' : false,
              })}
            />
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Enabled"
                />
              )}
            />
            <Controller
              name="roles"
              control={control}
              rules={{ validate: (value) => value.length > 0 || 'Select at least one role.' }}
              render={({ field }) => (
                <FormControl error={Boolean(errors.roles)}>
                  <InputLabel id="roles-label">Roles</InputLabel>
                  <Select
                    labelId="roles-label"
                    multiple
                    value={field.value}
                    onChange={field.onChange}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.code} value={role.code}>
                        {role.label} ({role.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
              <Button component={RouterLink} to="/admin/users">
                Cancel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );

  if (mode === 'create' || userId === null) return accountForm;

  return (
    <Stack spacing={2}>
      <Tabs
        value={tab}
        onChange={(_event, value: 'account' | 'settings') => setTab(value)}
        aria-label="User tabs"
      >
        <Tab
          label="Account"
          value="account"
          id="user-tab-account"
          aria-controls="user-tabpanel-account"
        />
        <Tab
          label="Settings"
          value="settings"
          id="user-tab-settings"
          aria-controls="user-tabpanel-settings"
        />
      </Tabs>
      {/* The account form stays mounted so unsaved edits survive tab switches. */}
      <Box
        role="tabpanel"
        id="user-tabpanel-account"
        aria-labelledby="user-tab-account"
        hidden={tab !== 'account'}
      >
        {accountForm}
      </Box>
      {tab === 'settings' && (
        <Box role="tabpanel" id="user-tabpanel-settings" aria-labelledby="user-tab-settings">
          <UserSettingsTab userId={userId} />
        </Box>
      )}
    </Stack>
  );
}

function UserSettingsTab({ userId }: Readonly<{ userId: number }>) {
  const load = useCallback(() => userSettingsClient.user(userId), [userId]);
  const save = useCallback(
    (request: UpdateUserSettingsRequest) => userSettingsClient.updateUser(userId, request),
    [userId],
  );
  const onLoadError = useCallback(
    (caught: unknown) =>
      caught instanceof UserSettingsError && caught.status === 404
        ? 'Settings are only available for users with the USER role.'
        : null,
    [],
  );

  return (
    <Card>
      <CardContent>
        <UserSettingsEditor id="user-view-mode" load={load} save={save} onLoadError={onLoadError} />
      </CardContent>
    </Card>
  );
}
