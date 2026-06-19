import { type Page } from '@playwright/test';
import { SELECTORS } from '../selectors/common.selectors.js';
import { waitForSpinner } from './common.helpers.js';

export interface SearchModifier {
  not?: boolean;
  contains?: boolean;
}

function parseSearchValue(value: string): { cleanValue: string; modifier: SearchModifier } {
  let cleanValue = value;
  const modifier: SearchModifier = {};

  if (cleanValue.startsWith('#NOT ')) {
    modifier.not = true;
    cleanValue = cleanValue.replace('#NOT ', '');
  }
  if (cleanValue.startsWith('#CONTAINS ')) {
    modifier.contains = true;
    cleanValue = cleanValue.replace('#CONTAINS ', '');
  }

  return { cleanValue, modifier };
}

function matchesCell(cellText: string, searchValue: string, modifier: SearchModifier): boolean {
  const normalized = cellText.trim();
  if (modifier.contains) {
    const matches = normalized.includes(searchValue);
    return modifier.not ? !matches : matches;
  }
  const matches = normalized === searchValue;
  return modifier.not ? !matches : matches;
}

function buildRowData(headers: string[], cells: string[]): Record<string, string> {
  const data: Record<string, string> = {};
  headers.forEach((header, i) => {
    const key = header.trim() || `#empty-${i + 1}`;
    data[key] = cells[i]?.trim() || '';
  });
  return data;
}

function matchesRowCriteria(
  cells: string[],
  headers: string[],
  searchParams: Record<string, string>,
): boolean {
  for (const [column, rawValue] of Object.entries(searchParams)) {
    const colIndex = headers.findIndex(h => h.trim() === column);
    if (colIndex === -1) return false;
    const { cleanValue, modifier } = parseSearchValue(rawValue);
    if (!matchesCell(cells[colIndex] || '', cleanValue, modifier)) return false;
  }
  return true;
}

export async function getTableHeaders(page: Page): Promise<string[]> {
  return page.locator(SELECTORS.tableHeader).allTextContents();
}

/**
 * Normalizes a table header text by stripping sort-indicator unicode arrows
 * (▲ ▼ △ ▽ ↑ ↓) and trimming whitespace. Case is preserved.
 *
 * Used by Origination column-order tests (task #1295) where header text on
 * sortable columns is appended with a unicode arrow (qa1 finding, SPEC § 0.5).
 */
export function normalizeHeader(text: string): string {
  return text.replace(/[▲▼△▽↑↓]/g, '').trim();
}

/**
 * Returns the index of the FIRST header whose normalized text matches `label`.
 * Case-insensitive equality.
 *
 * @returns -1 when no header matches.
 */
export function getColumnIndexByHeaderText(headers: string[], label: string): number {
  const target = label.toLowerCase();
  return headers.findIndex(h => normalizeHeader(h).toLowerCase() === target);
}

/**
 * Returns cleaned + normalized table headers (sort indicators stripped, trimmed).
 * Convenience wrapper around `getTableHeaders` + `normalizeHeader`.
 */
export async function getNormalizedHeaders(page: Page): Promise<string[]> {
  const raw = await getTableHeaders(page);
  return raw.map(normalizeHeader);
}

/**
 * Reads the value of column `header` for every visible row, in order.
 * Pure column extraction (não checa empty-state — o caller decide). Retorna []
 * quando o header não existe na tabela. Usado pelas report pages de Origination
 * (antes reimplementado inline em ≥4 page objects).
 */
export async function getColumnValues(page: Page, header: string): Promise<string[]> {
  const headers = await getNormalizedHeaders(page);
  const colIdx = getColumnIndexByHeaderText(headers, header);
  if (colIdx === -1) return [];
  const rows = page.locator(SELECTORS.tableRow);
  const rowCount = await rows.count();
  const values: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells = await rows.nth(i).locator(SELECTORS.tableCell).allTextContents();
    values.push((cells[colIdx] ?? '').trim());
  }
  return values;
}

export async function getRowDataByIndex(page: Page, rowIndex: number): Promise<Record<string, string>> {
  const headers = await getTableHeaders(page);
  const row = page.locator(`${SELECTORS.tableRow}:nth-child(${rowIndex + 1})`);
  const cells = await row.locator(SELECTORS.tableCell).allTextContents();

  return buildRowData(headers, cells);
}

export async function findFirstMatchingRow(
  page: Page,
  searchParams: Record<string, string>,
): Promise<Record<string, string> | null> {
  const headers = await getTableHeaders(page);

  const rows = page.locator(SELECTORS.tableRow);
  const rowCount = await rows.count();

  for (let r = 0; r < rowCount; r++) {
    const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();

    if (matchesRowCriteria(cells, headers, searchParams)) {
      return buildRowData(headers, cells);
    }
  }
  return null;
}

export async function findAllMatchingRows(
  page: Page,
  searchParams: Record<string, string>,
): Promise<Record<string, string>[]> {
  const results: Record<string, string>[] = [];
  const headers = await getTableHeaders(page);
  const rows = page.locator(SELECTORS.tableRow);
  const rowCount = await rows.count();

  for (let r = 0; r < rowCount; r++) {
    const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();

    if (matchesRowCriteria(cells, headers, searchParams)) {
      results.push(buildRowData(headers, cells));
    }
  }
  return results;
}

export async function selectMaxRowsPerPage(page: Page): Promise<void> {
  const dropdown = page.locator(SELECTORS.rowsPerPageDropdown);
  if (await dropdown.isVisible()) {
    const options = await dropdown.locator('option').allTextContents();
    if (options.length > 0) {
      await dropdown.selectOption({ index: options.length - 1 });
      await waitForSpinner(page);
    }
  }
}

export async function goToNextPage(page: Page): Promise<boolean> {
  const nextBtn = page.locator(SELECTORS.paginationNext);
  if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
    await nextBtn.click();
    await waitForSpinner(page);
    return true;
  }
  return false;
}
