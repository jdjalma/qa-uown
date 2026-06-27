/**
 * ServicingAccountSummaryPage
 *
 * Reads the EPO/contract-overview labelled values on the Servicing
 * `/customer-information/{accountPk}` page. Introduced for svc#531
 * (R1.52.0 — 16-month EPO for CA). The Account & Contract Overview and
 * Early Payoff / 90-Day Pay Off sub-panels expose flat label-then-value
 * pairs: each label `<div>` is followed by a sibling `<div>` carrying the
 * value. We read the pair via `xpath=following-sibling::div[1]`.
 *
 * DOM strategy validated via MCP Playwright on qa1 account 4745 (2026-05-24,
 * screenshot `issue-531-servicing-account-4745-epo-section.png`).
 *
 * Pre-condition: the Customer Information Confirmation modal (auto-rendered
 * by the Servicing portal on every account page load) MUST be dismissed
 * via its Confirm button before any locator interaction — `readEpoPanel()`
 * calls `dismissCustomerInfoConfirmation` automatically. See memory
 * `reference_verify_customer_info_modal`.
 *
 * Viewport: 1440x900 (agent-facing portal — Bootstrap d-lg-block ≥992px).
 */
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { dismissCustomerInfoConfirmation } from '../../helpers/servicing-dialogs.helpers.js';
import { parseMoney } from '../../helpers/common.helpers.js';

/**
 * Shape returned by {@link ServicingAccountSummaryPage.readEpoPanel}.
 *
 * Monetary fields are parsed via `parseMoney` (NaN if unparseable). The
 * `eligible` boolean derives from the "Eligible for 90-day Pay Off" label.
 * `expirationDate` is the RAW visible text (e.g. "08/22/2026") — callers
 * decide whether to convert to ISO via `date.helpers`.
 */
export interface ServicingEpoPanelReading {
  epoBalance: number;
  ninetyDayTotal: number;
  cashPrice: number;
  processingFee: number;
  buyoutFee: number;
  taxRate: number;
  expirationDate: string;
  eligible: boolean;
  totalContractAmount: number;
  contractBalance: number;
  settlementAmount: number;
  epoFeePercent: number;
}

export class ServicingAccountSummaryPage extends ServicingBasePage {
  /**
   * Navigates to /customer-information/{accountPk} and dismisses the
   * verification modal. Idempotent — safe to call after another helper
   * already opened the same page.
   */
  async open(accountPk: number | string): Promise<void> {
    await this.page.goto(`/customer-information/${accountPk}`);
    await this.waitForSpinner();
    await dismissCustomerInfoConfirmation(this.page);
  }

  /**
   * Navigates to /customer-information/{accountPk} using an ABSOLUTE base URL,
   * then dismisses the verification modal. Idempotent.
   *
   * Prefer this over {@link open} in specs: `open` issues a RELATIVE goto that
   * depends on the Playwright project `baseURL` (`process.env.SERVICING_URL`),
   * which is not guaranteed to be set in every environment (e.g. dev3 has no
   * `SERVICING_URL` in `.env`). Passing the resolved `testEnv.servicingUrl`
   * fixture (which has an auto-generated fallback) makes navigation
   * environment-independent. Mirrors the
   * `CreditCardHistoryPage.navigateToCcHistoryByUrl(baseUrl, accountPk)`
   * convention already used across Servicing page objects.
   */
  async navigateToCustomerInformation(
    baseUrl: string,
    accountPk: number | string,
  ): Promise<void> {
    await this.page.goto(`${baseUrl}/customer-information/${accountPk}`, {
      waitUntil: 'domcontentloaded',
    });
    await this.waitForSpinner();
    await dismissCustomerInfoConfirmation(this.page);
  }

  /**
   * Reads ALL EPO/contract-overview values in one pass via `page.evaluate`.
   * The Servicing portal renders labels and values in non-sibling DOM
   * positions (sometimes label-then-value, sometimes value-then-label,
   * sometimes nested in different cards). Walking siblings via XPath is
   * unreliable — adjacent xpath nodes often land on the previous card's
   * value, contaminating the read (e.g. `90-day Expiration Date` returning
   * `"EPO Balance $3,813.43"` from a neighbouring card).
   *
   * Strategy: scan ALL text nodes for the EXACT label string, then find
   * the nearest container that holds BOTH the label and a money- or
   * percent- or date- shaped sibling text node. This is resilient to grid
   * vs table vs flex layouts.
   */
  async readEpoPanel(): Promise<ServicingEpoPanelReading> {
    await dismissCustomerInfoConfirmation(this.page);
    await this.waitForSpinner();

    const labels = {
      epoBalance: 'EPO Balance',
      ninetyDayTotal: '90-day Total',
      cashPrice: 'Cost/Cash Price',
      processingFee: 'Processing Fee',
      buyoutFee: 'Buyout Fee',
      taxRate: 'Tax Rate (%)',
      expirationDate: '90-day Expiration Date',
      eligible: 'Eligible for 90-day Pay Off',
      totalContractAmount: 'Total Contract Amount',
      contractBalance: 'Contract Balance',
      settlementAmount: 'Settlement Amount',
      epoFeePercent: 'EPO Fee %',
    } as const;

    const raw = await this.page.evaluate((labelMap: Record<string, string>) => {
      const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
      const isValueShape = (s: string): boolean => {
        const t = s.trim();
        if (!t) return false;
        if (/^\$?[-]?[0-9][0-9,]*(\.[0-9]+)?\s*%?$/.test(t)) return true;
        if (/^[A-Z][a-z]{2}-\s*\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return true;
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return true;
        if (/^(yes|no|true|false)$/i.test(t)) return true;
        return false;
      };

      const out: Record<string, string> = {};
      const all = Array.from(document.querySelectorAll('*'));

      for (const [key, label] of Object.entries(labelMap)) {
        let foundValue: string | null = null;
        for (const el of all) {
          if (norm(el.textContent ?? '') !== label) continue;
          // Walk up the tree, at each ancestor scan its descendants for a
          // value-shaped text node that is NOT the label itself.
          let cursor: Element | null = el;
          for (let depth = 0; depth < 6 && cursor && !foundValue; depth++) {
            const candidates = Array.from(cursor.querySelectorAll('*'))
              .filter((c) => !c.contains(el) && el !== c && !el.contains(c));
            for (const cand of candidates) {
              const text = norm(cand.textContent ?? '');
              if (!text || text === label) continue;
              if (isValueShape(text)) {
                foundValue = text;
                break;
              }
            }
            cursor = cursor.parentElement;
          }
          if (foundValue) break;
        }
        out[key] = foundValue ?? '';
      }
      return out;
    }, labels as unknown as Record<string, string>);

    const taxRate = parseMoney((raw.taxRate ?? '').replace(/%/g, ''));
    const epoFeePercent = parseMoney((raw.epoFeePercent ?? '').replace(/%/g, ''));
    const eligibleText = (raw.eligible ?? '').toLowerCase().trim();

    return {
      epoBalance: parseMoney(raw.epoBalance ?? ''),
      ninetyDayTotal: parseMoney(raw.ninetyDayTotal ?? ''),
      cashPrice: parseMoney(raw.cashPrice ?? ''),
      processingFee: parseMoney(raw.processingFee ?? ''),
      buyoutFee: parseMoney(raw.buyoutFee ?? ''),
      taxRate,
      expirationDate: raw.expirationDate ?? '',
      eligible: eligibleText === 'yes' || eligibleText === 'true',
      totalContractAmount: parseMoney(raw.totalContractAmount ?? ''),
      contractBalance: parseMoney(raw.contractBalance ?? ''),
      settlementAmount: parseMoney(raw.settlementAmount ?? ''),
      epoFeePercent,
    };
  }

  /**
   * Resolves the value cell adjacent to a label matched by `labelSelector`.
   * Tries siblings in BOTH directions because the Servicing portal mixes
   * conventions: some cards render `label → value` (e.g. EPO panel), others
   * render `value → label` (e.g. Customer Portal-style cards reused on the
   * agent side). Also walks one level up + first matching sibling to handle
   * cards where label and value share a wrapper.
   *
   * Returns the first non-empty trimmed text; empty string when nothing
   * resolves (caller decides whether to treat as NaN or hard failure).
   */
  async readTextByLabel(labelSelector: string, timeoutMs = 10_000): Promise<string> {
    const label = this.page.locator(labelSelector).first();
    if (!(await label.isVisible({ timeout: timeoutMs }).catch(() => false))) {
      return '';
    }
    const strategies: string[] = [
      'xpath=following-sibling::div[1]',
      'xpath=preceding-sibling::div[1]',
      'xpath=../div[normalize-space()][1]',
      'xpath=../../div[normalize-space()][position()<=2]',
    ];
    for (const xp of strategies) {
      const candidate = label.locator(xp).first();
      const raw = await candidate.textContent().catch(() => null);
      if (raw == null) continue;
      const text = raw.replace(/\s+/g, ' ').trim();
      // Skip the label cell itself echoing back.
      if (!text) continue;
      if (text.toLowerCase() === (await label.textContent().catch(() => ''))?.toLowerCase().trim()) continue;
      return text;
    }
    return '';
  }

  /** Convenience wrapper around {@link readTextByLabel} + `parseMoney`. */
  async readMoneyByLabel(labelSelector: string, timeoutMs = 10_000): Promise<number> {
    const text = await this.readTextByLabel(labelSelector, timeoutMs);
    return parseMoney(text);
  }

  /**
   * Reads the current account status surfaced in the Account Summary Bar via the value of
   * the "New Status" <select>. Stable UI signal (confirmed selector, KB scheduled-payments.md
   * §Account Summary Bar) used to assert the account is unchanged after a read-only operation
   * such as the Prorated Amount calculation.
   */
  async getAccountStatusFromSummaryBar(): Promise<string> {
    return this.page.locator(SELECTORS.svcAccountNewStatusSelect).inputValue();
  }
}
