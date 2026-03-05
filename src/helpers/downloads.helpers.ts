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
