import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import type { GowSignDocumentStatus } from '../../api/responses/gowsign.response.js';

/**
 * GowSign Document Viewer — page object for the contract viewer rendered by
 * the external GowSign provider. Used by:
 *   - US-EMB-01..11 (iframe + postMessage + browser matrix + Start gate)
 *   - US-DOC-01..15 (contract content validation: Property Price Tag, LESSOR/LESSEE,
 *     EPO chart, ACH grid, Download)
 *   - US-RES-04..05 (re-access after signed, multiple downloads)
 *
 * GowSign is a cross-portal / external embed, therefore this page object extends
 * `BasePage` directly (per `.claude/rules/page-objects.md` hierarchy rules).
 *
 * Selector reference: docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md
 *                     § Apendice A — Seletores HTML — GowSign Document Viewer
 */

export interface PropertyPriceTag {
  totalOfPayments: string;
  costOfLease: string;
  cashPrice: string;
  amountOfEachPayment: string;
  paymentFrequency: string;
  numberOfPayments: number;
  renewalPeriod: string;
}

export interface LessorInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface LesseeInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface LeaseItem {
  itemCode: string;
  description: string;
  serialNumber: string;
  totalPrice: string;
}

export interface InitialPaymentBreakdown {
  initialLeasePayment: string;
  processingFee: string;
  tax: string;
  totalInitialPayment: string;
}

export interface EpoChartRow {
  paymentNumber: number;
  payment: string;
  epo: string;
}

export interface AchGridRow {
  frequency: string;
  numberOfPayments: number;
  paymentAmount: string;
  totalCost: string;
  isSelected: boolean;
}

const VALID_STATUSES: ReadonlyArray<GowSignDocumentStatus> = [
  'CREATED',
  'OUTSTANDING',
  'SIGNED',
  'COMPLETED',
  'EXPIRED',
  'CANCELED',
];

export class GowSignDocumentViewerPage extends BasePage {
  // ── Header / Toolbar ────────────────────────────────────────────────
  readonly viewerRoot: Locator = this.page.locator(SELECTORS.gsViewerRoot);
  readonly documentTitle: Locator = this.page.locator(SELECTORS.gsDocumentTitle).first();
  readonly startSignatureButton: Locator = this.page.locator(SELECTORS.gsStartSignatureButton);
  readonly downloadButton: Locator = this.page.locator(SELECTORS.gsDownloadButton).first();
  readonly closeDocumentButton: Locator = this.page.locator(SELECTORS.gsCloseDocumentButton);
  readonly readingModeToggle: Locator = this.page.getByLabel('Reading mode');

  // ── Pre-signature metadata ──────────────────────────────────────────
  readonly statusBadge: Locator = this.page.locator(SELECTORS.gsStatusBadge);
  readonly recipientEmailCell: Locator = this.page.locator(SELECTORS.gsRecipientEmailCell);

  // ── Document body anchors ───────────────────────────────────────────
  readonly priceTagTable: Locator = this.page.locator(SELECTORS.gsPriceTagTable);
  readonly lessorLesseeTable: Locator = this.page.locator(SELECTORS.gsLessorLesseeTable);
  readonly leaseItemsTable: Locator = this.page.locator(SELECTORS.gsLeaseItemsTable).first();
  readonly epoChartTable: Locator = this.page.locator(SELECTORS.gsEpoChartTable);
  readonly achGridTable: Locator = this.page.locator(SELECTORS.gsAchGridTable);

  // ── Dates / agreement metadata ──────────────────────────────────────
  readonly agreementNumberValue: Locator = this.page.locator(SELECTORS.gsAgreementNumberValue).first();
  readonly accountNumberValue: Locator = this.page.locator(SELECTORS.gsAccountNumberValue).first();
  readonly contractDateValue: Locator = this.page.locator(SELECTORS.gsContractDateValue).first();
  readonly initialPaymentDueDateRow: Locator = this.page.locator(SELECTORS.gsInitialPaymentDueDateRow).first();
  readonly promoExpirationRow: Locator = this.page.locator(SELECTORS.gsPromoExpirationRow).first();

  // ── Initial Payment Breakdown ──────────────────────────────────────
  readonly initialLeasePaymentValue: Locator = this.page.locator(SELECTORS.gsInitialLeasePaymentRow).first();
  readonly processingFeeValue: Locator = this.page.locator(SELECTORS.gsProcessingFeeRow).first();
  readonly taxValue: Locator = this.page.locator(SELECTORS.gsTaxRow).first();
  readonly totalInitialPaymentValue: Locator = this.page.locator(SELECTORS.gsTotalInitialPaymentRow).first();

  // ── Page footer (pagination on rendered PDF) ───────────────────────
  readonly pageNumberLabel: Locator = this.page.locator(SELECTORS.gsPageNumber).first();

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════
  // Header / Toolbar actions
  // ════════════════════════════════════════════════════════════════════

  async clickStartSignature(): Promise<void> {
    await this.startSignatureButton.waitFor({ state: 'visible' });
    await this.startSignatureButton.click();
  }

  async clickDownload(): Promise<void> {
    await this.downloadButton.waitFor({ state: 'visible' });
    await this.downloadButton.click();
  }

  async clickCloseDocument(): Promise<void> {
    await this.closeDocumentButton.waitFor({ state: 'visible' });
    await this.closeDocumentButton.click();
  }

  async toggleReadingMode(): Promise<void> {
    await this.readingModeToggle.waitFor({ state: 'visible' });
    await this.readingModeToggle.click();
  }

  async getDocumentTitle(): Promise<string> {
    return this.getTextContent(this.documentTitle);
  }

  async isStartButtonVisible(): Promise<boolean> {
    return this.startSignatureButton.isVisible().catch(() => false);
  }

  async isStartButtonEnabled(): Promise<boolean> {
    if (!(await this.isStartButtonVisible())) return false;
    return !(await this.startSignatureButton.isDisabled().catch(() => true));
  }

  // ════════════════════════════════════════════════════════════════════
  // Pre-signature metadata
  // ════════════════════════════════════════════════════════════════════

  async getDocumentId(): Promise<string> {
    const cell = this.page.locator(SELECTORS.gsDocumentIdValue).first();
    const raw = await this.getTextContent(cell);
    // Extract UUID v4 if present; fallback to trimmed cell text
    const uuidMatch = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return uuidMatch ? uuidMatch[0] : raw;
  }

  async getRecipientName(): Promise<string> {
    const cell = this.page.locator(SELECTORS.gsRecipientNameCell).first();
    const raw = await this.getTextContent(cell);
    // Cell may contain both name and email; strip email portion if present
    return raw.replace(/\S+@\S+\.\S+/g, '').replace(/\s+/g, ' ').trim();
  }

  async getRecipientEmail(): Promise<string> {
    const text = await this.getTextContent(this.recipientEmailCell);
    const emailMatch = text.match(/\S+@\S+\.\S+/);
    return emailMatch ? emailMatch[0] : text;
  }

  async getStatusBadge(): Promise<GowSignDocumentStatus> {
    await this.statusBadge.first().waitFor({ state: 'visible' });
    const count = await this.statusBadge.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.statusBadge.nth(i).textContent())?.trim().toUpperCase() ?? '';
      const match = VALID_STATUSES.find((s) => text === s || text.includes(s));
      if (match) return match;
    }
    throw new Error(
      `[GowSignDocumentViewer] Could not determine status badge — no badge text matched ${VALID_STATUSES.join('|')}`,
    );
  }

  async getCreatedDate(): Promise<string> {
    // "Created on Mon DD, YYYY" — extract the date suffix
    const node = this.page.getByText(/Created on\s+\w+\s+\d{1,2},\s+\d{4}/).first();
    const raw = await this.getTextContent(node);
    const match = raw.match(/Created on\s+(\w+\s+\d{1,2},\s+\d{4})/);
    return match ? match[1] : raw.replace(/^Created on\s*/i, '').trim();
  }

  async getSenderEmail(): Promise<string> {
    const node = this.page.getByText(/Document sent by[\s\S]*?@/).first();
    const raw = await this.getTextContent(node);
    const emailMatch = raw.match(/\S+@\S+\.\S+/);
    return emailMatch ? emailMatch[0] : raw;
  }

  // ════════════════════════════════════════════════════════════════════
  // Property Price Tag (US-DOC-01)
  // ════════════════════════════════════════════════════════════════════

  async getPropertyPriceTag(): Promise<PropertyPriceTag> {
    await this.priceTagTable.first().waitFor({ state: 'visible' });

    const totalOfPayments = await this.getTextContent(
      this.page.locator(SELECTORS.gsPriceTagTotalOfPayments).first(),
    );
    const costOfLease = await this.getTextContent(
      this.page.locator(SELECTORS.gsPriceTagCostOfLease).first(),
    );
    const cashPriceLocator = this.page.locator(SELECTORS.gsPriceTagCashPrice).first();
    const cashPrice = (await cashPriceLocator.count()) > 0
      ? await this.getTextContent(cashPriceLocator)
      : '';

    const amountRaw = await this.getTextContent(
      this.page.locator(SELECTORS.gsPriceTagAmountOfEachPayment).first(),
    );
    // "$23.06 (WEEKLY)" → split into amount + frequency
    const amountMatch = amountRaw.match(/(\$[\d,.]+)\s*(?:\(([A-Z_]+)\))?/);
    const amountOfEachPayment = amountMatch?.[1] ?? amountRaw;
    const paymentFrequency = amountMatch?.[2] ?? '';

    const numberRaw = await this.getTextContent(
      this.page.locator(SELECTORS.gsPriceTagNumberOfPayments).first(),
    );
    const numberOfPayments = Number.parseInt(numberRaw.replace(/[^\d]/g, ''), 10) || 0;

    const renewalPeriod = await this.getTextContent(
      this.page.locator(SELECTORS.gsPriceTagRenewalPeriod).first(),
    );

    return {
      totalOfPayments,
      costOfLease,
      cashPrice,
      amountOfEachPayment,
      paymentFrequency,
      numberOfPayments,
      renewalPeriod,
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // LESSOR / LESSEE (US-DOC-02, DOC-03)
  // ════════════════════════════════════════════════════════════════════

  async getLessor(): Promise<LessorInfo> {
    const cell = this.page.locator(SELECTORS.gsLessorCell).first();
    const text = await this.getTextContent(cell);
    return this.parsePartyBlock(text, /* withEmail */ true) as LessorInfo;
  }

  async getLessee(): Promise<LesseeInfo> {
    const cell = this.page.locator(SELECTORS.gsLesseeCell).first();
    const text = await this.getTextContent(cell);
    const parsed = this.parsePartyBlock(text, /* withEmail */ false);
    return {
      name: parsed.name,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      phone: parsed.phone,
    };
  }

  /**
   * Parse a LESSOR/LESSEE block of text in the form:
   *   "LESSOR: <name> <address> <city>, <state> <zip> Telephone: <phone> [Email: <email>]"
   *
   * The block has line breaks in HTML <p> tags collapsed by textContent into spaces.
   * We use targeted regexes per field; missing fields fall back to empty strings.
   */
  private parsePartyBlock(raw: string, withEmail: boolean): LessorInfo {
    const text = raw.replace(/\s+/g, ' ').trim();

    // Strip the "LESSOR:" / "LESSEE:" prefix
    const body = text.replace(/^LESS(OR|EE)\s*:\s*/i, '');

    const phoneMatch = body.match(/Telephone:\s*([+()\d\s\-.x]+?)(?=\s+Email:|\s*$)/i);
    const phone = phoneMatch?.[1]?.trim() ?? '';

    const emailMatch = body.match(/Email:\s*(\S+@\S+\.\S+)/i);
    const email = withEmail ? (emailMatch?.[1] ?? '') : '';

    // Strip phone and email tail to leave name + address line
    let beforePhone = body;
    if (phoneMatch?.index !== undefined) beforePhone = body.slice(0, phoneMatch.index).trim();

    // city, state zip is the trailing chunk before phone
    const cityStateZipMatch = beforePhone.match(/([A-Za-z .'\-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/);
    let city = '';
    let state = '';
    let zip = '';
    let nameAndAddress = beforePhone;
    if (cityStateZipMatch) {
      city = cityStateZipMatch[1].trim();
      state = cityStateZipMatch[2].trim();
      zip = cityStateZipMatch[3].trim();
      nameAndAddress = beforePhone.slice(0, cityStateZipMatch.index).trim();
    }

    // First "word group" up to a number or comma is treated as name; rest is address.
    // Address typically starts with a number (e.g. "1234 Main St").
    const addressStart = nameAndAddress.search(/\d/);
    let name = nameAndAddress;
    let address = '';
    if (addressStart > 0) {
      name = nameAndAddress.slice(0, addressStart).trim();
      address = nameAndAddress.slice(addressStart).trim();
    }

    return { name, address, city, state, zip, phone, email };
  }

  // ════════════════════════════════════════════════════════════════════
  // Items (US-DOC-04)
  // ════════════════════════════════════════════════════════════════════

  async getLeaseItems(): Promise<LeaseItem[]> {
    await this.leaseItemsTable.waitFor({ state: 'visible' });
    const rows = this.page.locator(SELECTORS.gsLeaseItemsRow);
    const count = await rows.count();
    const items: LeaseItem[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      // Expected 4 columns: itemCode, description, serialNumber, totalPrice
      if (cellCount < 4) continue;
      items.push({
        itemCode: await this.getTextContent(cells.nth(0)),
        description: await this.getTextContent(cells.nth(1)),
        serialNumber: await this.getTextContent(cells.nth(2)),
        totalPrice: await this.getTextContent(cells.nth(3)),
      });
    }
    return items;
  }

  async getTotalDeliveryFee(): Promise<string> {
    const node = this.page.locator(SELECTORS.gsTotalDeliveryFee).first();
    return this.getTextContent(node);
  }

  // ════════════════════════════════════════════════════════════════════
  // Initial Payment Breakdown (US-DOC-05)
  // ════════════════════════════════════════════════════════════════════

  async getInitialPaymentBreakdown(): Promise<InitialPaymentBreakdown> {
    return {
      initialLeasePayment: await this.getTextContent(this.initialLeasePaymentValue),
      processingFee: await this.getTextContent(this.processingFeeValue),
      tax: await this.getTextContent(this.taxValue),
      totalInitialPayment: await this.getTextContent(this.totalInitialPaymentValue),
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // Dates / Agreement metadata (US-DOC-09)
  // ════════════════════════════════════════════════════════════════════

  async getAgreementNumber(): Promise<string> {
    return this.getTextContent(this.agreementNumberValue);
  }

  async getAccountNumber(): Promise<string> {
    return this.getTextContent(this.accountNumberValue);
  }

  async getContractDate(): Promise<string> {
    return this.getTextContent(this.contractDateValue);
  }

  async getInitialPaymentDueDate(): Promise<string> {
    const raw = await this.getTextContent(this.initialPaymentDueDateRow);
    // "...initial Lease payment due on MM/DD/YYYY..." — extract date
    const match = raw.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    return match ? match[1] : raw;
  }

  async getPromoExpirationDate(): Promise<string> {
    const raw = await this.getTextContent(this.promoExpirationRow);
    const match = raw.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    return match ? match[1] : raw;
  }

  // ════════════════════════════════════════════════════════════════════
  // EPO Chart (US-DOC-06)
  // ════════════════════════════════════════════════════════════════════

  /** Number of EPO data rows (excludes the header row). */
  async getEpoChartRowCount(): Promise<number> {
    const rows = this.page.locator(SELECTORS.gsEpoChartRows);
    return rows.count();
  }

  /** Get a specific EPO row by 1-based index (1 = first data row, header excluded). */
  async getEpoChartRow(rowNumber: number): Promise<EpoChartRow> {
    const rows = this.page.locator(SELECTORS.gsEpoChartRows);
    const row = rows.nth(rowNumber - 1);
    await row.waitFor({ state: 'visible' });
    const cells = row.locator('td');
    const paymentNumberRaw = await this.getTextContent(cells.nth(0));
    const payment = await this.getTextContent(cells.nth(1));
    const epo = await this.getTextContent(cells.nth(2));
    return {
      paymentNumber: Number.parseInt(paymentNumberRaw.replace(/[^\d]/g, ''), 10) || 0,
      payment,
      epo,
    };
  }

  async getAllEpoRows(): Promise<EpoChartRow[]> {
    const total = await this.getEpoChartRowCount();
    const out: EpoChartRow[] = [];
    for (let i = 1; i <= total; i++) {
      out.push(await this.getEpoChartRow(i));
    }
    return out;
  }

  // ════════════════════════════════════════════════════════════════════
  // ACH Grid (US-DOC-08)
  // ════════════════════════════════════════════════════════════════════

  async getAchGrid(): Promise<AchGridRow[]> {
    await this.achGridTable.waitFor({ state: 'visible' });
    const rows = this.page.locator(SELECTORS.gsAchGridRows);
    const count = await rows.count();
    const result: AchGridRow[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      if (cellCount < 4) continue;
      const frequency = await this.getTextContent(cells.nth(0));
      const numberOfPaymentsRaw = await this.getTextContent(cells.nth(1));
      const paymentAmount = await this.getTextContent(cells.nth(2));
      const totalCost = await this.getTextContent(cells.nth(3));

      // A row is "selected" when it contains an X mark (initial signature placeholder).
      const rowText = (await row.textContent())?.toUpperCase() ?? '';
      const isSelected = /\bX\s*INITIAL\b/.test(rowText) || /[✓✔]/.test(rowText);

      result.push({
        frequency,
        numberOfPayments: Number.parseInt(numberOfPaymentsRaw.replace(/[^\d]/g, ''), 10) || 0,
        paymentAmount,
        totalCost,
        isSelected,
      });
    }
    return result;
  }

  // ════════════════════════════════════════════════════════════════════
  // Pages
  // ════════════════════════════════════════════════════════════════════

  async getCurrentPageNumber(): Promise<number> {
    const raw = await this.getTextContent(this.pageNumberLabel);
    // "Page N of M"
    const match = raw.match(/Page\s+(\d+)\s+of\s+\d+/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  async getTotalPages(): Promise<number> {
    const raw = await this.getTextContent(this.pageNumberLabel);
    const match = raw.match(/Page\s+\d+\s+of\s+(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  // ════════════════════════════════════════════════════════════════════
  // State / waiters
  // ════════════════════════════════════════════════════════════════════

  /** Wait for the viewer to fully render — anchors on the document container + Start button visibility. */
  async waitForLoaded(timeoutMs = 30_000): Promise<void> {
    await this.viewerRoot.first().waitFor({ state: 'visible', timeout: timeoutMs });
    await this.startSignatureButton.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /**
   * Polls `getStatusBadge()` until the badge equals the expected status or the timeout expires.
   * Avoids `waitForTimeout` — uses a polling loop with `waitFor` semantics.
   */
  async waitForStatus(status: GowSignDocumentStatus, timeoutMs = 30_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let last: GowSignDocumentStatus | null = null;
    while (Date.now() < deadline) {
      try {
        last = await this.getStatusBadge();
        if (last === status) return;
      } catch {
        // badge not yet rendered — keep polling
      }
      await this.page.locator(SELECTORS.gsStatusBadge).first()
        .waitFor({ state: 'visible', timeout: 1_000 })
        .catch(() => {});
    }
    throw new Error(
      `[GowSignDocumentViewer] Timed out waiting for status='${status}' after ${timeoutMs}ms (last seen='${last ?? 'n/a'}')`,
    );
  }
}
