import Papa from 'papaparse';
import { normalizeRawRows } from './normalizer';
import type { ParsedFinancials } from '../engine/types';

export function parseCSV(file: File): Promise<ParsedFinancials> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = normalizeRawRows(results.data as Record<string, unknown>[]);
        resolve(parsed);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

export function parseCSVFromString(csv: string): Promise<ParsedFinancials> {
  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      download: false,
      complete: (results) => {
        const parsed = normalizeRawRows(results.data as Record<string, unknown>[]);
        resolve(parsed);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
