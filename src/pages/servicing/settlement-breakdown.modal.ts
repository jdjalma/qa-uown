/**
 * Settlement Breakdown modal page object — Servicing portal.
 *
 * Feature: uown/frontend/servicing#512 — Settlement Amount display in
 * "Account & Contract Overview". Clicking the "Settlement Amount" label
 * opens a Bootstrap modal titled "Settlement Breakdown" listing the
 * per-line items used to compute the offer.
 *
 * Extends `BasePage` (cross-portal pattern — the modal layout is reused
 * outside of any single Servicing page, but instances are constructed
 * from Servicing flows). Selectors live in `SELECTORS` per
 * `.claude/rules/selectors.md`.
 *
 * DOM-first compliance (CLAUDE.md #16): the "Settlement Amount" label is
 * a non-semantic `<div>` (NOT a `<button>` or `<a>`) with
 * `cursor: pointer`. `getByRole` would NOT match — we use
 * `getByText(..., { exact: true })` filtered by the clickable cursor
 * ancestor. Validated in qa1 via MCP Playwright (SPEC §7).
 */
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { dismissCustomerInfoConfirmation } from '../../helpers/servicing-dialogs.helpers.js';

export interface SettlementBreakdownRow {
  label: string;
  value: string;
}

export class SettlementBreakdownModal extends BasePage {
  /** "Settlement Amount" clickable label in the Servicing Information panel. */
  readonly settlementLabel = this.page
    .getByText('Settlement Amount', { exact: true })
    .first();

  /** The opened modal container (Bootstrap `.modal.show`). */
  readonly modal = this.page.locator(SELECTORS.settlementBreakdownModal).first();

  /**
   * Modal title — Servicing custom modal does NOT use Bootstrap `.modal-header`
   * or `.modal-title`. Title is a `<div>` with index-module classes containing
   * the text "Settlement Breakdown". Scope by modal + text only.
   */
  readonly modalTitle = this.modal.getByText('Settlement Breakdown', { exact: true }).first();

  /** Close (X) button for the modal. */
  readonly closeButton = this.page.locator(SELECTORS.settlementBreakdownClose).first();

  /**
   * Returns the raw rendered value next to the "Settlement Amount" label
   * in the panel (NOT the modal). Format: `$X.XX` or `$X,XXX.XX` (panel
   * uses thousand separators; modal may not — BUG-5).
   *
   * Strategy: find the closest sibling/descendant value of the label —
   * implementer-friendly by reading the label's parent text and stripping
   * the label prefix. Robust to DOM reshape.
   */
  async getPanelValueText(): Promise<string> {
    await dismissCustomerInfoConfirmation(this.page);
    const label = this.settlementLabel;
    await label.waitFor({ state: 'visible', timeout: 10_000 });
    // Read the label's parent (.row / .col / wrapper div) and subtract the
    // label text — what remains is the value.
    const containerText = await label.locator('xpath=..').textContent();
    const cleaned = (containerText ?? '').replace(/\s+/g, ' ').trim();
    const stripped = cleaned.replace(/^Settlement Amount[:\s]*/i, '').trim();
    return stripped;
  }

  /**
   * Returns true if the "Settlement Amount" label is visible in the panel.
   * Bounded wait (default 5 s) so callers can branch on visibility without
   * blowing the test budget.
   */
  async isLabelVisible(timeoutMs = 5_000): Promise<boolean> {
    await dismissCustomerInfoConfirmation(this.page);
    return this.settlementLabel.isVisible({ timeout: timeoutMs }).catch(() => false);
  }

  /**
   * Clicks the "Settlement Amount" label and waits for the modal to open.
   * No `force: true` — if the click fails, run the DOM-first protocol
   * (CLAUDE.md #16) before bumping the timeout.
   */
  async openModal(): Promise<void> {
    // Dismiss the "Customer Information Confirmation" modal that auto-renders
    // on every Servicing customer-information page load. Without this, the
    // overlay intercepts the click on the Settlement Amount label and the
    // modal under test never opens (root cause of 18/18 spec failures —
    // see qa-debugger findings 2026-05-22).
    await dismissCustomerInfoConfirmation(this.page);
    await this.settlementLabel.waitFor({ state: 'visible', timeout: 10_000 });
    await this.settlementLabel.click();
    await this.modal.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Returns true if the modal contains AT LEAST one breakdown row.
   * Used to reproduce BUG-1 (modal opens empty on $0.00 — ineligible
   * accounts). Bounded wait to avoid hanging the test on the bug.
   */
  async hasBreakdownContent(timeoutMs = 3_000): Promise<boolean> {
    const rows = this.modal.locator(SELECTORS.settlementBreakdownRow);
    return rows.first().isVisible({ timeout: timeoutMs }).catch(() => false);
  }

  /**
   * Extracts all rows from the open modal as `{ label, value }` tuples.
   * Order preserved (top → bottom). Used to:
   *   - assert presence of required lines (TCA / Total Payments / Days
   *     Delinquent / Offer % / Total Fees / Settlement Amount)
   *   - assert presence of Protection Plan Fee line when applicable
   *   - capture currency formatting for BUG-4 / BUG-5
   *
   * Each row is either a `<tr>` (modal uses a table) or `<li>` — the
   * row selector covers both; we read the row's full text and split on
   * the first colon or whitespace cluster heuristically. When the row is
   * a `<tr>`, we prefer `<th>` (label) / `<td>` (value) split.
   */
  async getBreakdownRows(): Promise<SettlementBreakdownRow[]> {
    await this.modal.waitFor({ state: 'visible', timeout: 10_000 });
    const rows = this.modal.locator(SELECTORS.settlementBreakdownRow);
    const count = await rows.count();
    const out: SettlementBreakdownRow[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // Try table layout first: <th> + <td>
      const th = row.locator('th, [scope="row"]').first();
      const td = row.locator('td').first();
      const hasTh = await th.count() > 0;
      const hasTd = await td.count() > 0;
      if (hasTh && hasTd) {
        const label = ((await th.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        const value = ((await td.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        if (label || value) out.push({ label, value });
        continue;
      }
      // Fallback: full row text split on first ":" or "  " gap
      const full = ((await row.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (!full) continue;
      const colonIdx = full.indexOf(':');
      if (colonIdx > 0) {
        out.push({
          label: full.slice(0, colonIdx).trim(),
          value: full.slice(colonIdx + 1).trim(),
        });
      } else {
        // Last resort — treat entire text as label (caller assertion
        // can still match by substring).
        out.push({ label: full, value: '' });
      }
    }
    return out;
  }

  /**
   * Returns the value text for the row whose label matches `labelSubstring`
   * (case-insensitive contains). Returns `null` when no such row exists
   * — caller decides whether absence is expected (e.g., PP Fee line on
   * accounts without Protection Plan).
   */
  async getRowValue(labelSubstring: string): Promise<string | null> {
    const rows = await this.getBreakdownRows();
    const needle = labelSubstring.toLowerCase();
    const row = rows.find(r => r.label.toLowerCase().includes(needle));
    return row ? row.value : null;
  }

  /**
   * Closes the modal via the X button and waits for it to detach.
   * Safe to call when modal is already closed (no-op).
   */
  async close(): Promise<void> {
    if (!(await this.modal.isVisible({ timeout: 1_000 }).catch(() => false))) {
      return;
    }
    if (await this.closeButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.closeButton.click();
    }
    await this.modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }
}
