import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { client, openPdfForPrinting } = vi.hoisted(() => ({
  client: {
    findById: vi.fn(),
    print: vi.fn(),
    printAll: vi.fn(),
    printSelected: vi.fn(),
  },
  openPdfForPrinting: vi.fn(),
}));

vi.mock('@organization_template/react-client', () => ({ taskClient: client }));
vi.mock('./pdfPrinting', () => ({ openPdfForPrinting }));
vi.mock('./hooks/useTaxonomies', () => ({
  useTaxonomies: () => ({ tags: [], nomenclatures: [], error: null, loading: false }),
}));

const templates = [1, 2, 3].map((id) => ({
  id,
  code: `CODE${id}`,
  label: `Template ${id}`,
  description: `Description ${id}`,
  createdDate: '2026-08-01T10:00:00Z',
  lastModifiedDate: '2026-08-02T10:00:00Z',
  createdBy: 'creator',
  lastModifiedBy: 'editor',
}));

let rows = templates;

vi.mock('./hooks/useTasks', () => ({
  useTasks: () => ({ templates: rows, loading: false, error: null, refresh: vi.fn() }),
}));

import { TaskDetailPage } from './pages/TaskDetailPage';
import { TasksPage } from './pages/TasksPage';

function renderPage(path = '/tasks') {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Task PDF printing actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    rows = templates;
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    client.findById.mockResolvedValue(templates[1]);
    client.print.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
    client.printAll.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
    client.printSelected.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
    openPdfForPrinting.mockImplementation((loadPdf: () => Promise<Blob>) =>
      loadPdf().then(() => undefined),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('disables printing an empty selection and prints all independently', async () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Print selected (0)' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Print all' }));

    await waitFor(() => expect(client.printAll).toHaveBeenCalledOnce());
    expect(client.printSelected).not.toHaveBeenCalled();
  });

  it('prints only checkbox-selected grid rows', async () => {
    renderPage();
    fireEvent.click(within(screen.getByRole('row', { name: /CODE2/ })).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Print selected (1)' }));

    await waitFor(() => expect(client.printSelected).toHaveBeenCalledWith([2]));
    expect(client.printAll).not.toHaveBeenCalled();
  });

  it('resolves select-all and exclusions to concrete selected IDs', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    fireEvent.click(within(screen.getByRole('row', { name: /CODE2/ })).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Print selected (2)' }));

    await waitFor(() => expect(client.printSelected).toHaveBeenCalledWith([1, 3]));
  });

  it('prints selected rows across grid pages, not just the current page', async () => {
    rows = Array.from({ length: 12 }, (_, index) => ({
      ...templates[0],
      id: index + 1,
      code: `CODE${index + 1}`,
      label: `Template ${index + 1}`,
    }));
    renderPage();
    fireEvent.click(within(screen.getByRole('row', { name: /CODE1\b/ })).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    fireEvent.click(
      within(await screen.findByRole('row', { name: /CODE11\b/ })).getByRole('checkbox'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Print selected (2)' }));

    await waitFor(() => expect(client.printSelected).toHaveBeenCalledWith([1, 11]));
  });

  it('prints the current opened Task rather than the HTML page', async () => {
    renderPage('/tasks/2');
    fireEvent.click(await screen.findByRole('button', { name: 'Print' }));

    await waitFor(() => expect(client.print).toHaveBeenCalledWith(2));
    expect(client.printAll).not.toHaveBeenCalled();
    expect(client.printSelected).not.toHaveBeenCalled();
  });

  it('shows print errors without replacing the current detail view', async () => {
    client.print.mockRejectedValue(new Error('Unable to generate PDF.'));
    renderPage('/tasks/2');
    fireEvent.click(await screen.findByRole('button', { name: 'Print' }));

    expect(await screen.findByText('Unable to generate PDF.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Template 2' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Print' })).toBeEnabled();
  });

  it('preserves the actionable missing-selection error instead of silently dropping IDs', async () => {
    const message = 'One or more Tasks no longer exist. Refresh the list before printing.';
    client.printSelected.mockRejectedValue(Object.assign(new Error(message), { status: 404 }));
    renderPage();
    fireEvent.click(within(screen.getByRole('row', { name: /CODE2/ })).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Print selected (1)' }));

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Print selected (1)' })).toBeEnabled();
  });

  it('disables the print action while generation is pending', async () => {
    let resolvePdf!: (value: Blob) => void;
    client.printAll.mockReturnValue(
      new Promise<Blob>((resolve) => {
        resolvePdf = resolve;
      }),
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Print all' }));

    expect(screen.getByRole('button', { name: 'Print all' })).toBeDisabled();
    resolvePdf(new Blob(['%PDF'], { type: 'application/pdf' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Print all' })).toBeEnabled());
  });
});
