import { type Locator } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Payment History Page — Servicing portal
 *
 * URL: /payment-history/{accountPk} (History menu → "Payments").
 *
 * This is where the Reverse / Refund affordance lives. The /payment-transaction
 * page has no per-row reverse icon — the action svg is rendered only on the
 * payment-history grid (DOM-first verified on svc-website-dev3 account 94,
 * 2026-06-01; selectors source-tagged in common.selectors.ts).
 *
 * Reverse Reason is a React Select (`#reverseReason` is a DIV container, not a
 * native <select>) so the reason is chosen via the open menu, not selectOption().
 * Options observed: "Reverse", "Fully Refund", "Partially Refund".
 */
export class PaymentHistoryPage extends ServicingBasePage {
  readonly reverseModal = this.page.locator(SELECTORS.modalContent);
  readonly reverseReasonControl = this.page.locator(SELECTORS.reverseReasonControl);
  readonly reverseAmountInput = this.page.locator(SELECTORS.reversePaymentAmountInput);
  readonly reverseRefundFeeCheckbox = this.page.locator(SELECTORS.reverseRefundFeeCheckbox);
  readonly reverseCommentTextarea = this.page.locator(SELECTORS.reverseCommentTextarea);
  readonly reverseSaveButton = this.page.locator(SELECTORS.reverseModalSaveButton);
  readonly reverseCancelButton = this.page.locator(SELECTORS.reverseModalCancelButton);

  async navigateByUrl(baseUrl: string, accountPk: string | number): Promise<void> {
    // Hydrate customerStore.accountPk via customer-information first, then the
    // History → Payments tab — same race-avoidance pattern as CreditCardHistoryPage.
    await this.page.goto(`${baseUrl}/customer-information/${accountPk}`, { waitUntil: 'domcontentloaded' });
    await this.waitForSpinner();
    await this.topMenuNavigateTo('payments');
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.paymentHistoryRows).first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {});
    await this.selectMaxRowsPerPage().catch(() => {});
  }

  private rows(): Locator {
    // Body-scoped: excludes the column-header row (.rdt_TableHeadRow lives in a
    // separate rowgroup). The previous `.rdt_TableRow` selector matched the head
    // row too, so first().waitFor() resolved on the header while the data row was
    // still hydrating → count() saw no data row → "No payment row found".
    return this.page.locator(SELECTORS.paymentHistoryBodyRows);
  }

  async getRowCount(): Promise<number> {
    return this.rows().count();
  }

  /** Open the Reverse/Refund modal for the first payment row matching the given amount. */
  async openReverseForPaymentByAmount(amount: string): Promise<void> {
    const target = amount.replace('$', '');
    const rows = this.rows();
    // The payment-history grid hydrates via an async API call after the menu
    // navigation resolves. Iterating rows.count() immediately races the fetch:
    // a slow response leaves count()=0, the loop is skipped, and we throw
    // "No payment row found" even though the row renders ~1-2s later.
    // DOM-first verified via failure snapshot (svc-website-dev3 account 141,
    // 2026-06-01): the grid renders a single BODY row
    // "06/01/2026 $100.00 CC PAID REGULAR_RECEIVABLES" carrying the
    // arrow-rotate-left reverse icon. Wait for the row that actually carries the
    // target amount to be visible before iterating — waiting for any first row
    // resolved on the (always-present) head row and raced the body hydration.
    await rows.filter({ hasText: target }).first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text && text.includes(target)) {
        await rows.nth(i).locator(SELECTORS.paymentHistoryReverseIcon).first().click();
        await this.waitForModalOpen();
        return;
      }
    }
    throw new Error(`No payment row found with amount: ${amount}`);
  }

  /**
   * Select a Reverse Reason from the React Select menu.
   * @param reason exact option text — "Reverse" | "Fully Refund" | "Partially Refund"
   */
  async setReverseReason(reason: string): Promise<void> {
    await this.reverseReasonControl.click();
    await this.page.locator(SELECTORS.reverseReasonOption)
      .filter({ hasText: reason }).first().click();
  }

  /** Type the refund amount (only visible after choosing "Partially Refund"). */
  async typeReverseAmount(amount: string): Promise<void> {
    await this.reverseAmountInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.reverseAmountInput.fill('');
    await this.reverseAmountInput.fill(amount);
  }

  async typeReverseComment(comment: string): Promise<void> {
    await this.reverseCommentTextarea.fill(comment);
  }

  async submitReverse(): Promise<void> {
    await this.clickAndWaitForSpinner(this.reverseSaveButton);
  }

  async cancelReverse(): Promise<void> {
    await this.reverseCancelButton.click();
    await this.page.locator(SELECTORS.modalContent).waitFor({ state: 'hidden' });
  }
}
