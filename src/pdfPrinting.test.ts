import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openPdfForPrinting } from './pdfPrinting';

describe('openPdfForPrinting', () => {
  const viewer = {
    opener: {},
    document: { title: '' },
    closed: false,
    location: { replace: vi.fn() },
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    viewer.closed = false;
    vi.stubGlobal('open', vi.fn().mockReturnValue(viewer));
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = vi.fn().mockReturnValue('blob:printable-pdf');
        static revokeObjectURL = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens the viewer before fetching and keeps the URL usable until the tab closes', async () => {
    const pdf = new Blob(['%PDF'], { type: 'application/pdf' });
    const loadPdf = vi.fn().mockImplementation(async () => {
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      return pdf;
    });

    await openPdfForPrinting(loadPdf);

    expect(viewer.opener).toBeNull();
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
    expect(viewer.location.replace).toHaveBeenCalledWith('blob:printable-pdf');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    viewer.closed = true;
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:printable-pdf');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports popup blocking without fetching a PDF', async () => {
    vi.mocked(window.open).mockReturnValue(null);
    const loadPdf = vi.fn();

    await expect(openPdfForPrinting(loadPdf)).rejects.toThrow('Allow popups');
    expect(loadPdf).not.toHaveBeenCalled();
  });

  it('closes the blank viewer and propagates API failures', async () => {
    await expect(openPdfForPrinting(() => Promise.reject(new Error('HTTP 403')))).rejects.toThrow(
      'HTTP 403',
    );
    expect(viewer.close).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('reports a viewer closed during generation without creating an object URL', async () => {
    await expect(
      openPdfForPrinting(async () => {
        viewer.closed = true;
        return new Blob(['%PDF']);
      }),
    ).rejects.toThrow('closed before the document was ready');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
