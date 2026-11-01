import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authClient,
  taskClient,
  tagClient,
  nomenclatureClient,
  userSettingsClient,
  UserSettingsError,
} = vi.hoisted(() => ({
  tagClient: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  nomenclatureClient: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  authClient: {
    login: vi.fn(),
    me: vi.fn(),
    role: vi.fn(),
    roles: vi.fn(),
    user: vi.fn(),
    users: vi.fn(),
    createRole: vi.fn(),
    createUser: vi.fn(),
    updateRole: vi.fn(),
    updateUser: vi.fn(),
    deleteRole: vi.fn(),
    deleteUser: vi.fn(),
  },
  taskClient: {
    create: vi.fn(),
    delete: vi.fn(),
    exportCsv: vi.fn(),
    exportJson: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    importCsv: vi.fn(),
    importJson: vi.fn(),
    seed: vi.fn(),
    update: vi.fn(),
  },
  userSettingsClient: {
    mine: vi.fn(),
    updateMine: vi.fn(),
    user: vi.fn(),
    updateUser: vi.fn(),
    anonymous: vi.fn(),
    updateAnonymous: vi.fn(),
  },
  UserSettingsError: class extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock('@organization_template/react-client', () => ({
  authClient,
  taskClient,
  tagClient,
  nomenclatureClient,
  userSettingsClient,
  UserSettingsError,
}));

import { App } from './App';

const adminUser = {
  id: 1,
  username: 'admin',
  enabled: true,
  roles: [
    {
      id: 1,
      code: 'ADMIN',
      label: 'Administrator',
      createdDate: '2026-08-01T10:00:00Z',
      lastModifiedDate: '2026-08-01T10:00:00Z',
    },
  ],
  createdDate: '2026-08-01T10:00:00Z',
  lastModifiedDate: '2026-08-01T10:00:00Z',
};

describe('App', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    vi.clearAllMocks();
    authClient.me.mockResolvedValue(adminUser);
    authClient.roles.mockResolvedValue(adminUser.roles);
    taskClient.findAll.mockResolvedValue([]);
    tagClient.findAll.mockResolvedValue([]);
    nomenclatureClient.findAll.mockResolvedValue([]);
    userSettingsClient.mine.mockResolvedValue({ viewMode: 'system' });
    userSettingsClient.anonymous.mockResolvedValue({ roleCode: 'ANONYMOUS', viewMode: 'system' });
  });

  it('redirects anonymous users to login', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders the global Task dashboard', async () => {
    window.localStorage.setItem('backend.authToken', 'token');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Tasks Console' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute('href', '/tasks/new');
    expect(screen.getByLabelText('Bright mode')).toBeVisible();
    expect(screen.getByLabelText('Dark mode')).toBeVisible();
    expect(screen.getByLabelText('System mode')).toBeVisible();

    await waitFor(() => expect(taskClient.findAll).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByLabelText('Open navigation'));
    expect(screen.getByText('Permisssions')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: 'Roles' })).toHaveAttribute('href', '/admin/roles');
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
  });

  it('renders the create form with Task fields only', async () => {
    window.history.pushState({}, '', '/tasks/new');
    window.localStorage.setItem('backend.authToken', 'token');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Create Task' })).toBeVisible();
    expect(screen.getByLabelText('Code')).toBeVisible();
    expect(screen.getByLabelText('Label')).toBeVisible();
    expect(screen.getByLabelText('Description')).toBeVisible();
    expect(screen.getByLabelText('Status')).toHaveValue('TODO');
    expect(screen.getByLabelText('Priority')).toHaveValue('NORMAL');
    expect(screen.getByLabelText('Due date')).toBeVisible();
    expect(screen.getByLabelText('Assigned to')).toBeVisible();
    expect(screen.getByLabelText('Tags')).toBeVisible();
    expect(screen.getByLabelText('Nomenclature')).toBeVisible();
    expect(screen.queryByLabelText('Version')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Payload JSON')).not.toBeInTheDocument();
  });

  it('loads Task details by id', async () => {
    window.history.pushState({}, '', '/tasks/7');
    window.localStorage.setItem('backend.authToken', 'token');
    taskClient.findById.mockResolvedValue({
      id: 7,
      code: 'customer',
      label: 'Customer',
      description: 'Customer template',
      createdDate: '2026-08-01T10:00:00Z',
      lastModifiedDate: '2026-08-02T10:00:00Z',
      createdBy: 'creator',
      lastModifiedBy: 'editor',
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Customer' })).toBeVisible();
    expect(screen.getByText('Customer template')).toBeVisible();
    const auditSection = screen.getByRole('button', { name: 'Audit information' });
    expect(auditSection).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('creator')).not.toBeVisible();
    expect(screen.queryByText('editor')).not.toBeVisible();

    fireEvent.click(auditSection);

    expect(auditSection).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Created by')).toBeVisible();
    expect(screen.getByText('creator')).toBeVisible();
    expect(screen.getByText('Last modified by')).toBeVisible();
    expect(screen.getByText('editor')).toBeVisible();
    expect(taskClient.findById).toHaveBeenCalledWith(7);
  });

  it('shows unavailable audit actors for older API responses', async () => {
    window.history.pushState({}, '', '/tasks/7');
    window.localStorage.setItem('backend.authToken', 'token');
    taskClient.findById.mockResolvedValue({
      id: 7,
      code: 'customer',
      label: 'Customer',
      description: null,
      createdDate: '2026-08-01T10:00:00Z',
      lastModifiedDate: '2026-08-02T10:00:00Z',
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Customer' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Audit information' }));
    expect(screen.getAllByText('Not available')).toHaveLength(2);
  });

  it('applies and saves the view mode from the user settings', async () => {
    window.history.pushState({}, '', '/settings');
    window.localStorage.setItem('backend.authToken', 'token');
    userSettingsClient.mine.mockResolvedValue({ viewMode: 'dark' });
    userSettingsClient.updateMine.mockResolvedValue({ viewMode: 'light' });

    render(<App />);

    expect(await screen.findByText('Anonymous settings')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByLabelText('Dark mode')).toHaveAttribute('aria-pressed', 'true'),
    );

    fireEvent.click(screen.getByLabelText('Bright mode'));

    await waitFor(() =>
      expect(userSettingsClient.updateMine).toHaveBeenCalledWith({ viewMode: 'light' }),
    );
    expect(userSettingsClient.anonymous).toHaveBeenCalled();
  });

  it('manages a user settings from the Settings tab of the user edit page', async () => {
    window.history.pushState({}, '', '/admin/users/2/edit');
    window.localStorage.setItem('backend.authToken', 'token');
    authClient.user.mockResolvedValue({ ...adminUser, id: 2, username: 'jane', roles: [] });
    userSettingsClient.user.mockResolvedValue({ userId: 2, viewMode: 'dark' });
    userSettingsClient.updateUser.mockResolvedValue({ userId: 2, viewMode: 'dark' });

    render(<App />);

    expect(await screen.findByRole('tab', { name: 'Account' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByLabelText('Username')).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Save settings' }));

    await waitFor(() =>
      expect(userSettingsClient.updateUser).toHaveBeenCalledWith(2, { viewMode: 'dark' }),
    );
    expect(userSettingsClient.user).toHaveBeenCalledWith(2);
    expect(await screen.findByText('Settings saved.')).toBeVisible();
  });

  it('explains when a user has no settings', async () => {
    window.history.pushState({}, '', '/admin/users/1/edit');
    window.localStorage.setItem('backend.authToken', 'token');
    authClient.user.mockResolvedValue(adminUser);
    userSettingsClient.user.mockRejectedValue(new UserSettingsError('Not found', 404));

    render(<App />);

    fireEvent.click(await screen.findByRole('tab', { name: 'Settings' }));

    expect(
      await screen.findByText('Settings are only available for users with the USER role.'),
    ).toBeVisible();
  });
});
