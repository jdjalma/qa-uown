import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  MerchantSettingsResponse,
  MerchantSearchCriteria,
  MerchantSearchResponse,
  UpdateMerchantsPayload,
  SubmitApplicationErrorLogSearchResults,
  MerchantApiErrorLogSearchResults,
  MerchantProgramsResponse,
  MerchantProgram,
} from '../responses/merchant.response.js';
import type { BaseResponseBody } from '../responses/base.response.js';
import type { ProgramInfoBody } from '../bodies/program-info.body.js';

export class MerchantClient extends BaseClient {
  async getMerchantsByRefCode(merchantRefCodes: string): Promise<ApiResponse<MerchantSettingsResponse>> {
    // reason: defined in svc LosLeadController.java:315 (@RequestMapping "/uown/los").
    // Previous call with host='origination' hit the Next.js proxy which returns 404
    // without a browser session (merchant.sid cookie + usertoken JWT). svc direct
    // works with the apiAuthorization header BaseClient already injects.
    return this.post<MerchantSettingsResponse>(
      '/uown/los/getMerchantsByRefCode',
      { merchantRefCodes },
      'svc',
    );
  }

  async isSignedToFundingEnabled(merchantRefCode: string): Promise<boolean> {
    const response = await this.getMerchantsByRefCode(merchantRefCode);
    const merchant = Array.isArray(response.body) ? response.body[0] : undefined;
    return merchant?.merchantInfo?.isSignedToFunding === true;
  }

  async getMerchantsByCriteria(criteria: MerchantSearchCriteria): Promise<ApiResponse<MerchantSearchResponse>> {
    return this.post<MerchantSearchResponse>(
      '/uown/getMerchantsByCriteria',
      criteria,
      'origination',
    );
  }

  async updateMerchants(payload: UpdateMerchantsPayload): Promise<ApiResponse<BaseResponseBody>> {
    return this.post<BaseResponseBody>(
      '/uown/updateMerchants',
      payload,
      'svc',
    );
  }

  async getSubmitApplicationErrorLogs(
    from: string,
    to: string,
    options?: { search?: string; pageNumber?: number; maxResults?: number },
  ): Promise<ApiResponse<SubmitApplicationErrorLogSearchResults>> {
    const params = new URLSearchParams({ from, to });
    if (options?.search) params.set('search', options.search);
    if (options?.pageNumber !== undefined) params.set('pageNumber', String(options.pageNumber));
    if (options?.maxResults !== undefined) params.set('maxResults', String(options.maxResults));
    return this.get<SubmitApplicationErrorLogSearchResults>(
      `/uown/getSubmitApplicationErrorLogs?${params.toString()}`,
    );
  }

  async createOrUpdateMerchant(merchantInfo: Record<string, unknown>): Promise<ApiResponse<BaseResponseBody>> {
    // reason: defined in svc AdminController.java:111 (@RequestMapping "/uown").
    return this.post<BaseResponseBody>(
      '/uown/createOrUpdateMerchant',
      merchantInfo,
      'svc',
    );
  }

  /**
   * Returns the programs associated with a specific merchant.
   * Backend: svc MerchantProgramController @GetMapping("/uown/getMerchantProgramsByMerchant/{merchantPk}").
   * Note: the global program search is `getAllMerchantPrograms` — don't confuse the two.
   */
  async getMerchantProgramsByMerchantPk(merchantPk: number): Promise<ApiResponse<MerchantProgramsResponse>> {
    return this.get<MerchantProgramsResponse>(
      `/uown/getMerchantProgramsByMerchant/${merchantPk}`,
      'svc',
    );
  }

  /**
   * Global program search across the svc catalog (not filtered by merchant).
   * Backend: MerchantProgramController.java:81 — POST /uown/getAllMerchantPrograms
   * with MerchantProgramSearchFilter {searchKey, pageNumber, maxResults, groupName}.
   * Response: MerchantProgramSearchResult { merchantPrograms, totalCount, ... }.
   */
  async getAllMerchantPrograms(filter: {
    searchKey?: string;
    pageNumber?: number;
    maxResults?: number;
    groupName?: string;
  } = {}): Promise<ApiResponse<{ merchantPrograms?: unknown[]; totalCount?: number }>> {
    return this.post<{ merchantPrograms?: unknown[]; totalCount?: number }>(
      '/uown/getAllMerchantPrograms',
      {
        searchKey: filter.searchKey ?? '',
        pageNumber: filter.pageNumber ?? 0,
        maxResults: filter.maxResults ?? 500,
        groupName: filter.groupName ?? null,
      },
      'svc',
    );
  }

  async addProgramsToMerchant(
    merchantPk: number,
    programPks: number[],
    removeOld = false,
  ): Promise<ApiResponse<BaseResponseBody>> {
    // reason: svc MerchantProgramController.java:63 — @RequestParam merchantPk, removeOld, programPks (CSV string).
    const params = new URLSearchParams({
      merchantPk: String(merchantPk),
      removeOld: String(removeOld),
      programPks: programPks.join(','),
    });
    return this.post<BaseResponseBody>(
      `/uown/addProgramsToMerchant?${params.toString()}`,
      {},
      'svc',
    );
  }

  /**
   * Creates a new merchant program or updates an existing one.
   * Backend: svc `MerchantProgramController.java:130` —
   *   `@PostMapping("/uown/createOrUpdateProgram")` returns `MerchantProgram`
   *   (wraps the persisted `ProgramInfo`).
   * Service: `MerchantProgramService.createOrUpdate` validates
   *   `activationDate <= deactivationDate` (400 otherwise) and recomputes
   *   the `active` flag from the date window on every save — dates are the
   *   source of truth, not the boolean.
   *
   * Omit `programPk` (or pass 0) to create; pass an existing PK to update.
   */
  async createOrUpdateProgram(body: ProgramInfoBody): Promise<ApiResponse<MerchantProgram>> {
    return this.post<MerchantProgram>(
      '/uown/createOrUpdateProgram',
      body,
      'svc',
    );
  }

  async getMerchantApiErrorLogs(
    from: string,
    to: string,
    options?: { search?: string; pageNumber?: number; maxResults?: number },
  ): Promise<ApiResponse<MerchantApiErrorLogSearchResults>> {
    const params = new URLSearchParams({ from, to });
    if (options?.search) params.set('search', options.search);
    if (options?.pageNumber !== undefined) params.set('pageNumber', String(options.pageNumber));
    if (options?.maxResults !== undefined) params.set('maxResults', String(options.maxResults));
    return this.get<MerchantApiErrorLogSearchResults>(
      `/uown/getMerchantApiErrorLogs?${params.toString()}`,
    );
  }
}
