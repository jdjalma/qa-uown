import { type Page, type Download } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DOWNLOAD_DIR = path.resolve(process.cwd(), 'test-results', 'downloads');

export async function waitForDownload(page: Page, triggerAction: () => Promise<void>): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    triggerAction(),
  ]);
  return download;
}

export async function saveDownload(download: Download, filename?: string): Promise<string> {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
  const savePath = path.join(DOWNLOAD_DIR, filename || download.suggestedFilename());
  await download.saveAs(savePath);
  return savePath;
}

export async function downloadAndReadContent(page: Page, triggerAction: () => Promise<void>): Promise<string> {
  const download = await waitForDownload(page, triggerAction);
  const filePath = await saveDownload(download);
  return fs.readFileSync(filePath, 'utf-8');
}

export function getLastDownloadedFile(): string | null {
  if (!fs.existsSync(DOWNLOAD_DIR)) return null;
  const files = fs.readdirSync(DOWNLOAD_DIR)
    .map(f => ({ name: f, time: fs.statSync(path.join(DOWNLOAD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  return files[0] ? path.join(DOWNLOAD_DIR, files[0].name) : null;
}

// ── CSV parsing (task #1321 — Overview/Leads export validation) ──────────

export interface ParsedCsv {
  /** Header column names (first row), order-preserving. */
  headers: string[];
  /** Number of data rows (total lines minus the header). */
  dataRowCount: number;
}

/**
 * Parses CSV header + data-row count from raw text. RFC-4180-aware enough for
 * the Origination export: respects double-quoted fields that contain commas
 * or embedded newlines (so a value like `"Smith, Jr"` counts as one column and
 * a quoted multi-line cell does not inflate the row count).
 *
 * Used to assert the downloaded file's column SET and row count against the
 * portal total — not just "a file arrived" ([[check-points]] consequence oracle).
 * Does NOT log cell content (the Leads file carries SSN — PII hygiene).
 */
export function parseCsv(content: string): ParsedCsv {
  const records = splitCsvRecords(content);
  const nonEmpty = records.filter(r => r.trim().length > 0);
  if (nonEmpty.length === 0) return { headers: [], dataRowCount: 0 };
  const headers = splitCsvFields(nonEmpty[0]).map(h => h.trim());
  return { headers, dataRowCount: nonEmpty.length - 1 };
}

/** Splits CSV text into logical records, honoring quoted fields that span lines. */
function splitCsvRecords(content: string): string[] {
  const text = content.replace(/^﻿/, ''); // strip BOM
  const records: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '""'; i++; continue; }
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      records.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) records.push(current);
  return records;
}

/** Splits one CSV record into fields, honoring quoted commas. */
function splitCsvFields(record: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < record.length; i++) {
    const ch = record[i];
    if (ch === '"') {
      if (inQuotes && record[i + 1] === '"') { current += '"'; i++; continue; }
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Deletes a downloaded artifact (PII hygiene — the Leads CSV contains SSN).
 * Silently no-ops if the path is missing. Never logs the file content.
 */
export function deleteDownloadedFile(filePath: string | null): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // best-effort cleanup; a leftover artifact in test-results is non-fatal
  }
}
