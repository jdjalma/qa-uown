import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SearchPage } from '../search.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';


export class ServicingCustomerPage extends ServicingBasePage {
  readonly customerSummary = this.page.locator(SELECTORS.customerSummary);
  readonly customerStatusValue = this.page.locator(SELECTORS.customerStatusValue);
  readonly merchantName = this.page.locator("xpath=//div[@id='customer-summary']/../following-sibling::div/div[1]/div[3]//div[@class='card-body']//*[contains(text(),'Merchant')]/parent::label/following-sibling::div/div[1]");
  readonly saveButton = this.page.locator(SELECTORS.saveButton);
  readonly cancelButton = this.page.locator(SELECTORS.cancelButton);
  readonly noteInput = this.page.locator('#logNote');
  readonly addLogIcon = this.page.locator('.fa-file-plus');
  readonly notesTable = this.page.locator(SELECTORS.paymentTable);

  // Add Card elements
  readonly addCardButton = this.page.locator(SELECTORS.addCardButton);
  readonly saveCardButton = this.page.locator(SELECTORS.saveCardButton);

  async navigateToCustomer(searchTerm: string): Promise<void> {
    // In servicing, enter the search term in the quick search bar.
    // The quick search autocomplete may not find the account, so we fall back to:
    //   1. Pressing Enter to submit the search
    //   2. Clicking the FIRST column "Account #" link (NOT "Ref Account" which links to origination)
    const searchPage = new SearchPage(this.page);
    await searchPage.ensureSearchVisible();
    await searchPage.quickSearchInput.clear();
    await searchPage.quickSearchInput.fill(searchTerm);

    // Try autocomplete first
    const autocompleteLink = this.page.locator('[class*="searchBarQuickSearchResultItem"], nav a[href*="/customer-information/"]').first();
    if (await autocompleteLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await autocompleteLink.click();
      await this.waitForSpinner();
    } else {
      // Press Enter to submit search and go to search results page
      await searchPage.quickSearchInput.press('Enter');
      await this.waitForSpinner();

      // IMPORTANT: Click the "Account #" column link (first <a> in each row, href="/customer-information/...")
      // NOT the "Ref Account" link which points to the origination portal!
      const firstAccountLink = this.page.locator('a[href*="/customer-information/"]').first();
      await firstAccountLink.waitFor({ state: 'visible', timeout: 10_000 });
      await firstAccountLink.click();
      await this.waitForSpinner();
    }

    console.log(`[ServicingCustomer] Navigated to customer page. URL: ${this.page.url()}`);
  }

  async getAccountStatus(): Promise<string> {
    // Try origination-style #customer-summary first
    if (await this.customerStatusValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(this.customerStatusValue);
    }

    // Servicing portal: find "Status" label and read its parent text
    const statusFromLabel = await this.getStatusFromLabel();
    if (statusFromLabel) return statusFromLabel;

    // Broader fallback: read header area text and extract with regex
    const statusFromHeader = await this.getStatusFromHeaderArea();
    if (statusFromHeader) return statusFromHeader;

    // Last resort: search full body text
    const fullText = await this.page.locator('body').textContent() || '';
    const fullMatch = fullText.match(/Status[\s:]+([A-Z_]{3,})/);
    if (fullMatch) return fullMatch[1].trim();

    console.log('[ServicingCustomer] Could not find account status');
    return '';
  }

  /** Extract status from the "Status" label's parent element text */
  private async getStatusFromLabel(): Promise<string | null> {
    const statusLabel = this.page.locator('xpath=//*[normalize-space(text())="Status"]').first();
    if (!await statusLabel.isVisible({ timeout: 3_000 }).catch(() => false)) return null;

    const parent = statusLabel.locator('..');
    const parentText = await parent.textContent() || '';
    const cleaned = parentText.replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/^Status\s+(.+)/i);
    return match ? match[1].trim() : null;
  }

  /** Extract status from the top 120px of the page using DOM tree walker */
  private async getStatusFromHeaderArea(): Promise<string | null> {
    const bodyText = await this.page.locator('body').first().evaluate(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const rect = (node.parentElement as HTMLElement)?.getBoundingClientRect();
        if (rect && rect.top < 120) {
          const t = node.textContent?.trim();
          if (t) texts.push(t);
        }
      }
      return texts.join(' ');
    });
    const statusMatch = bodyText.match(/\bStatus\s+(ACTIVE|FUNDED|FUNDING|CLOSED|SUSPENDED|DELINQUENT|SETTLED|CHARGED_OFF|APPROVED|SIGNED|CONTRACT_CREATED|PENDING|CANCELLED|CANCELED)\b/i);
    return statusMatch ? statusMatch[1].trim() : null;
  }

  async getMerchantName(): Promise<string> {
    return this.getTextContent(this.merchantName);
  }

  async navigateToSection(section: string): Promise<void> {
    await this.sideMenuNavigateTo(section);
  }

  async clickSave(): Promise<void> {
    await this.clickAndWaitForSpinner(this.saveButton);
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async addNote(noteText: string): Promise<void> {
    await this.addLogIcon.click();
    await this.noteInput.fill(noteText);
    await this.clickSave();
  }

  /**
   * Adds a credit card to the customer's payment methods.
   * Mirrors UownServicingSteps.addNewValidCC() from the Java project.
   */
  async addCreditCard(cardDetails: {
    firstName: string;
    lastName: string;
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  }): Promise<void> {
    await this.addCardButton.click();
    await this.waitForModalOpen();

    const ccFirstName = this.page.locator(SELECTORS.ccFirstName);
    const ccLastName = this.page.locator(SELECTORS.ccLastName);

    if (await ccFirstName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await ccFirstName.fill(cardDetails.firstName);
    }
    if (await ccLastName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await ccLastName.fill(cardDetails.lastName);
    }

    await this.ccNumber.fill(cardDetails.cardNumber);

    // React Select dropdowns — type + Enter to commit selection
    await this.ccExpMonth.fill(cardDetails.expMonth);
    await this.ccExpMonth.press('Enter');
    await this.ccExpYear.fill(cardDetails.expYear);
    await this.ccExpYear.press('Enter');

    await this.ccCsc.fill(cardDetails.cvc);

    await this.saveCardButton.click();
    await this.waitForSpinner();

    // Verify success toast before dismissing modal
    // Check for error first
    await this.assertNoErrorToast('[AddCard] Failed to add credit card');

    // Wait for modal to close after save
    const modal = this.page.locator(SELECTORS.modalShow);
    await modal.first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      console.log('[AddCard] Modal still visible after save — dismissing');
    });

    // Force-dismiss any lingering modals and backdrops
    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * Navigates to CC history and verifies a payment with the given amount exists.
   */
  async verifyCcPaymentExists(amount: string): Promise<void> {
    await this.topMenuNavigateTo('cc history');
    const row = this.page.locator(SELECTORS.tableRow).filter({ hasText: amount });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  }
}
