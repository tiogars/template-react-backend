import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { taskClient, tagClient, nomenclatureClient } = vi.hoisted(() => ({
  taskClient: { create: vi.fn(), update: vi.fn(), findById: vi.fn() },
  tagClient: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  nomenclatureClient: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@organization_template/react-client', () => ({
  taskClient,
  tagClient,
  nomenclatureClient,
}));

import { TaskForm } from './forms/TaskForm';
import { TaxonomyPage } from './pages/TaxonomyPage';
import { TaskDetailPage } from './pages/TaskDetailPage';

const audit = {
  createdDate: '2026-10-01T00:00:00Z',
  lastModifiedDate: '2026-10-02T00:00:00Z',
  createdBy: 'admin',
  lastModifiedBy: 'editor',
};
const tags = [{ ...audit, id: 1, code: 'OPS', label: 'Operations', description: null }];
const nodes = [
  { ...audit, id: 2, code: 'WORK', label: 'Work', description: null, parentId: null },
  { ...audit, id: 3, code: 'ENG', label: 'Engineering', description: null, parentId: 2 },
];
const task = {
  ...audit,
  id: 8,
  code: 'SHIP',
  label: 'Ship release',
  description: 'Release work',
  status: 'IN_PROGRESS',
  priority: 'URGENT',
  dueDate: '2026-12-01',
  assignedTo: 'alice',
  tagIds: [1],
  nomenclatureId: 3,
};
const renderForm = (edit = false) =>
  render(
    <MemoryRouter initialEntries={[edit ? '/tasks/8/edit' : '/tasks/new']}>
      <Routes>
        <Route path="/tasks/new" element={<TaskForm mode="create" />} />
        <Route path="/tasks/:id/edit" element={<TaskForm mode="edit" />} />
        <Route path="/tasks/:id" element={<div>Saved task</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('Task and taxonomy management', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tagClient.findAll.mockResolvedValue(tags);
    nomenclatureClient.findAll.mockResolvedValue(nodes);
    taskClient.findById.mockResolvedValue(task);
    taskClient.create.mockResolvedValue(task);
    taskClient.update.mockResolvedValue(task);
  });
  afterEach(cleanup);

  it('creates a task with editable extras and human-readable relationship options', async () => {
    renderForm();
    expect(await screen.findByRole('option', { name: 'Operations (OPS)' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Work / Engineering' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'SHIP' } });
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Ship release' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Release work' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'IN_PROGRESS' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'URGENT' } });
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText('Assigned to'), { target: { value: 'alice' } });
    const tagSelect = screen.getByLabelText('Tags') as HTMLSelectElement;
    tagSelect.options[0].selected = true;
    fireEvent.change(tagSelect);
    fireEvent.change(screen.getByLabelText('Nomenclature'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(taskClient.create).toHaveBeenCalledWith({
        code: 'SHIP',
        label: 'Ship release',
        description: 'Release work',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: '2026-12-01',
        assignedTo: 'alice',
        tagIds: [1],
        nomenclatureId: 3,
      }),
    );
    expect(await screen.findByText('Saved task')).toBeVisible();
  });

  it('edits existing extras without submitting immutable code and can clear relationships', async () => {
    renderForm(true);
    expect(await screen.findByDisplayValue('Ship release')).toBeVisible();
    expect(screen.getByLabelText('Code')).toBeDisabled();
    expect(screen.getByLabelText('Status')).toHaveValue('IN_PROGRESS');
    expect(screen.getByLabelText('Priority')).toHaveValue('URGENT');
    expect(screen.getByLabelText('Nomenclature')).toHaveValue('3');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Assigned to'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Nomenclature'), { target: { value: '' } });
    const tagSelect = screen.getByLabelText('Tags') as HTMLSelectElement;
    tagSelect.options[0].selected = false;
    fireEvent.change(tagSelect);
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() =>
      expect(taskClient.update).toHaveBeenCalledWith(8, {
        label: 'Ship release',
        description: 'Release work',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: null,
        assignedTo: null,
        tagIds: [],
        nomenclatureId: null,
      }),
    );
  });

  it('displays task extras and resolved taxonomy labels on detail pages', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/8']}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('IN PROGRESS')).toBeVisible();
    expect(screen.getByText('URGENT')).toBeVisible();
    expect(screen.getByText('2026-12-01')).toBeVisible();
    expect(screen.getByText('alice')).toBeVisible();
    expect(await screen.findByText('Operations')).toBeVisible();
    expect(screen.getByText('Work / Engineering')).toBeVisible();
  });

  it('keeps existing relationships selected when options load after the task', async () => {
    let resolveNodes!: (value: typeof nodes) => void;
    nomenclatureClient.findAll.mockReturnValue(
      new Promise((resolve) => {
        resolveNodes = resolve;
      }),
    );
    renderForm(true);
    expect(await screen.findByDisplayValue('Ship release')).toBeVisible();
    resolveNodes(nodes);
    expect(await screen.findByRole('option', { name: 'Work / Engineering' })).toBeVisible();
    expect(screen.getByLabelText('Nomenclature')).toHaveValue('3');
    expect(screen.getByLabelText('Tags')).toHaveValue(['1']);
  });

  it('creates tags and surfaces referenced-delete failures without removing records', async () => {
    tagClient.create.mockResolvedValue(tags[0]);
    tagClient.delete.mockRejectedValue({ status: 409 });
    render(<TaxonomyPage kind="tag" />);
    expect(await screen.findByRole('button', { name: 'Edit Operations' })).toBeVisible();
    fireEvent.change(screen.getByLabelText(/^Code/), { target: { value: 'NEW' } });
    fireEvent.change(screen.getByLabelText(/^Label/), { target: { value: 'New tag' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(tagClient.create).toHaveBeenCalledWith({
        code: 'NEW',
        label: 'New tag',
        description: null,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Operations' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Referenced records cannot be deleted.',
    );
    expect(screen.getByRole('button', { name: 'Edit Operations' })).toBeVisible();
  });

  it('edits nomenclature parents, excludes cycles, and sends no immutable code', async () => {
    nomenclatureClient.update.mockResolvedValue(nodes[1]);
    render(<TaxonomyPage kind="nomenclature" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Engineering' }));
    const parentSelect = screen.getByLabelText('Parent');
    expect(
      within(parentSelect).queryByRole('option', { name: 'Work / Engineering' }),
    ).not.toBeInTheDocument();
    expect(within(parentSelect).getByRole('option', { name: 'Work' })).toBeVisible();
    fireEvent.change(parentSelect, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() =>
      expect(nomenclatureClient.update).toHaveBeenCalledWith(3, {
        label: 'Engineering',
        description: null,
        parentId: null,
      }),
    );
  });
});
