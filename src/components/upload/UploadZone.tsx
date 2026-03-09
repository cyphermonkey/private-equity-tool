import { useRef, useState } from 'react';
import { parseCSV } from '../../data/csvParser';
import { extractPDFText } from '../../data/pdfExtractor';
import { useDataStore } from '../../stores/dataStore';
import type { ParsedFinancials } from '../../engine/types';

export function UploadZone() {
  const setFinancials = useDataStore((s) => s.setFinancials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.csv') || file.type === 'text/csv') {
        const result = await parseCSV(file);
        setFinancials(result);
        setSuccess(`CSV parsed — ${result.years.length} years loaded.`);
      } else if (ext.endsWith('.pdf') || file.type === 'application/pdf') {
        const rawText = await extractPDFText(file);
        // Create stub ParsedFinancials — actual PDF field extraction handled in Phase 2
        const stub: ParsedFinancials = {
          years: [],
          revenue: [],
          ebitda: [],
          capex: [],
          da: [],
          source: 'pdf',
          confidence: {},
          rawText,
          parseWarnings: ['PDF text extracted. Please review and enter values manually.'],
        };
        setFinancials(stub);
        setSuccess('PDF text extracted. Review values in the panel below.');
      } else {
        setError('Unsupported file type. Please upload a .csv or .pdf file.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-950/30'
            : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={onInputChange}
          className="hidden"
        />
        <div className="text-gray-400 text-sm">
          {loading ? (
            <span className="text-blue-400 font-medium">Parsing file...</span>
          ) : (
            <>
              <p className="font-medium text-gray-300 mb-1">Drop CSV or PDF here</p>
              <p>or click to select</p>
              <p className="mt-2 text-xs text-gray-500">Accepts .csv and .pdf files</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-700 rounded-md px-4 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && !error && (
        <div className="bg-green-950/60 border border-green-700 rounded-md px-4 py-2 text-green-300 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
