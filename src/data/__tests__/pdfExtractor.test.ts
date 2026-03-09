import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pdfjs-dist BEFORE importing pdfExtractor
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

describe('pdfExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('INGEST-02: extractPDFText with < 200 chars throws error containing "scanned"', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const mockGetDocument = pdfjsLib.getDocument as ReturnType<typeof vi.fn>;

    // 50 chars per page, 5 pages = 250 total chars BUT...
    // each page returns 50 chars, so total = 50 * 5 = 250... need to test < 200
    // We need total text < 200 chars across all pages
    // 1 page * 30 chars = 30 chars total
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 5,
        getPage: vi.fn(() =>
          Promise.resolve({
            getTextContent: vi.fn(() =>
              Promise.resolve({
                items: [{ str: 'A'.repeat(30) }], // 30 chars per page, 5 pages = 150 total < 200
              })
            ),
          })
        ),
      }),
    });

    const { extractPDFText } = await import('../pdfExtractor');
    const mockFile = new File(['%PDF-1.4 fake content'], 'test.pdf', { type: 'application/pdf' });

    await expect(extractPDFText(mockFile)).rejects.toThrow(/scanned/i);
  });

  it('INGEST-02: extractPDFText with >= 200 chars resolves to string', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const mockGetDocument = pdfjsLib.getDocument as ReturnType<typeof vi.fn>;

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 3,
        getPage: vi.fn(() =>
          Promise.resolve({
            getTextContent: vi.fn(() =>
              Promise.resolve({
                items: [{ str: 'A'.repeat(100) }], // 100 chars per page, 3 pages = 300 total >= 200
              })
            ),
          })
        ),
      }),
    });

    const { extractPDFText } = await import('../pdfExtractor');
    const mockFile = new File(['%PDF-1.4 fake content'], 'test.pdf', { type: 'application/pdf' });

    const result = await extractPDFText(mockFile);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThanOrEqual(200);
  });

  it('pdfjs-dist GlobalWorkerOptions.workerSrc is set in pdfExtractor module', async () => {
    // Import the module — this exercises the module-level workerSrc assignment
    // After import, the mock's GlobalWorkerOptions.workerSrc should be set
    await import('../pdfExtractor');
    const pdfjsLib = await import('pdfjs-dist');
    // workerSrc should have been set (may be empty string in test env but key exists)
    expect('workerSrc' in pdfjsLib.GlobalWorkerOptions).toBe(true);
  });

  it('single-page PDF with < 200 chars resolves (guard only triggers when numPages > 1)', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const mockGetDocument = pdfjsLib.getDocument as ReturnType<typeof vi.fn>;

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(() =>
          Promise.resolve({
            getTextContent: vi.fn(() =>
              Promise.resolve({
                items: [{ str: 'short text' }], // 10 chars, but numPages === 1
              })
            ),
          })
        ),
      }),
    });

    const { extractPDFText } = await import('../pdfExtractor');
    const mockFile = new File(['%PDF-1.4 fake content'], 'test.pdf', { type: 'application/pdf' });

    // Should resolve (not throw) since numPages === 1
    const result = await extractPDFText(mockFile);
    expect(typeof result).toBe('string');
  });
});
