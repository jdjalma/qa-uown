import { OriginationBasePage } from './origination-base.page.js';
import { MerchantLocationReportControls } from '../../helpers/merchant-location-report.helper.js';

/**
 * Page object for the Origination Merchant Modification History page.
 *
 * Filters: Log Type, Start/End Date, Merchant Ref Code, Merchant, Location
 *          (dependent on Merchant), User Name.
 *
 * Endpoint: POST /uown/getMerchantDataChangeResults
 *
 * O filtro multi-select Merchant/Location (#1319), a paginação e a leitura de
 * coluna são compartilhados via {@link MerchantLocationReportControls} (campo
 * `report`) — os métodos abaixo delegam, preservando a API pública.
 */
export class MerchantModHistoryPage extends OriginationBasePage {
  private readonly report = new MerchantLocationReportControls(this.page);

  async navigateToMerchantModHistory(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}/merchantModificationHistory`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  // ── Delegação ao MerchantLocationReportControls (#1319) ──────────────
  expandFilters(): Promise<void> { return this.report.expandFilters(); }
  filterByMerchant(name: string): Promise<void> { return this.report.filterByMerchant(name); }
  filterByLocation(name: string): Promise<void> { return this.report.filterByLocation(name); }
  submitFilters(): Promise<void> { return this.report.submitFilters(); }
  getVisibleRowCount(): Promise<number> { return this.report.getVisibleRowCount(); }
  filterByMerchants(merchants: string[]): Promise<void> { return this.report.filterByMerchants(merchants); }
  filterByLocations(locations: string[]): Promise<void> { return this.report.filterByLocations(locations); }
  applyFilters(): Promise<void> { return this.report.applyFilters(); }
  getMerchantSelectedCount(): Promise<number> { return this.report.getMerchantSelectedCount(); }
  getLocationSelectedCount(): Promise<number> { return this.report.getLocationSelectedCount(); }
  getCheckedMerchants(): Promise<string[]> { return this.report.getCheckedMerchants(); }
  listAvailableMerchants(): Promise<string[]> { return this.report.listAvailableMerchants(); }
  listAvailableLocations(): Promise<string[]> { return this.report.listAvailableLocations(); }
  getMerchantColumnValues(): Promise<string[]> { return this.report.getMerchantColumnValues(); }
  getVisiblePageInfo(): Promise<string> { return this.report.getVisiblePageInfo(); }
  goToNextPage(): Promise<void> { return this.report.goToNextPage(); }
  goToPreviousPage(): Promise<void> { return this.report.goToPreviousPage(); }
}
