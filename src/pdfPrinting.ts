/**
 * Opens the viewer during the click gesture to avoid popup blocking while the PDF is fetched.
 * The viewer exposes the browser's native PDF print control.
 */
export async function openPdfForPrinting(loadPdf: () => Promise<Blob>): Promise<void> {
  const viewer = window.open('', '_blank');
  if (!viewer) throw new Error('Allow popups for this site to open the printable PDF.');
  let url: string | undefined;

  try {
    viewer.opener = null;
    viewer.document.title = 'Preparing printable PDF';
    const pdf = await loadPdf();
    if (viewer.closed) throw new Error('The PDF viewer was closed before the document was ready.');
    url = URL.createObjectURL(pdf);
    viewer.location.replace(url);
    const pdfUrl = url;
    const timer = window.setInterval(() => {
      if (viewer.closed) {
        URL.revokeObjectURL(pdfUrl);
        window.clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    viewer.close();
    throw error;
  }
}
