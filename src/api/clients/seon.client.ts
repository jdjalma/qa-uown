import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { SeonInfoResponseBody } from '../responses/seon.response.js';
import type { SeonCreateOrUpdateBody, BuildSeonApprovedOptions } from '../bodies/seon.body.js';
import { buildSeonApprovedBody } from '../bodies/seon.body.js';

export class SeonClient extends BaseClient {

  /**
   * Create or update a SEON verification record.
   * Endpoint: POST /uown/los/seon/createOrUpdate
   *
   * Used in tests to bypass SEON ID verification by inserting an APPROVED
   * record before calling submitApplication.
   */
  async createOrUpdate(body: SeonCreateOrUpdateBody): Promise<ApiResponse<SeonInfoResponseBody>> {
    return this.post<SeonInfoResponseBody>('/uown/los/seon/createOrUpdate', body);
  }

  /**
   * Convenience: creates an APPROVED SEON record that short-circuits verification.
   *
   * IdVerificationService.verifySeon() checks `idVerifySuccess == true` early (line 173)
   * and returns null (= success) immediately, skipping all name/DOB/expiration checks.
   */
  async approveVerification(options: BuildSeonApprovedOptions): Promise<ApiResponse<SeonInfoResponseBody>> {
    return this.createOrUpdate(buildSeonApprovedBody(options));
  }
}
