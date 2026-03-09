import * as pdfjsLib from 'pdfjs-dist';

// Set worker source at module load time — required for Vite builds
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // In test environments, import.meta.url may not resolve correctly — set a fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

export async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? (item.str ?? '') : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  const fullText = pageTexts.join(' ');

  // Scanned PDF guard: if extracted text is very short on a multi-page document,
  // the PDF is likely scanned (image-based) rather than digital
  if (fullText.length < 200 && pdf.numPages > 1) {
    throw new Error(
      'This PDF appears to be a scanned document. Please upload a digital PDF or export financials as CSV.'
    );
  }

  return fullText;
}
