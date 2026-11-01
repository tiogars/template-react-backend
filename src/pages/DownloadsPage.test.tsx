import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DownloadsPage } from './DownloadsPage';
import { formatBytes } from '../releases';

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DownloadsPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DownloadsPage', () => {
  it('lists published builds and marks missing platforms as unavailable', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          generatedAt: '2026-10-15T10:00:00Z',
          artifacts: [
            {
              platform: 'android',
              fileName: 'application-android.apk',
              path: 'android/application-android.apk',
              size: 2048,
              sha256: 'abc123',
              version: '1.0.0+1',
              apiBaseUrl: 'https://api.example.test',
              builtAt: '2026-10-15T10:00:00Z',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    renderPage();

    const androidLink = await screen.findByRole('link', { name: /download for android/i });
    expect(androidLink).toHaveAttribute('href', '/releases/android/application-android.apk');
    expect(screen.getByRole('img', { name: 'Android logo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Linux logo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Windows logo' })).toBeInTheDocument();
    expect(screen.getByText('https://api.example.test')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0+1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download for linux/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /download for windows/i })).toBeDisabled();
    expect(screen.getAllByText('Not available')).toHaveLength(2);
  });

  it('shows an empty state when no manifest is published', async () => {
    mockFetch(new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }));

    renderPage();

    expect(await screen.findByText('No application build has been published yet.')).toBeInTheDocument();
  });

  it('reports loading errors', async () => {
    mockFetch(new Response('', { status: 500 }));

    renderPage();

    expect(await screen.findByText('Unable to load the release list (HTTP 500).')).toBeInTheDocument();
  });
});

describe('formatBytes', () => {
  it('formats sizes with binary units', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(25 * 1024 * 1024)).toBe('25.0 MB');
  });
});
