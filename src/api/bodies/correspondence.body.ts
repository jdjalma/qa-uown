/**
 * Request body for POST /uown/sendFinalizeEmailToCustomer.
 *
 * Mirrors the Java DTO consumed by
 * `com.uownleasing.svc.rest.MerchantPortalController#sendFinalizeEmailToCustomer`
 * and forwarded to `SendFinalizeService#sendFinalizeEmailToCustomer(long, String)`.
 */
export interface FinalizeEmailRequest {
  /** PK of the lead in `uown_los_lead` that should receive the finalize purchase email/SMS. */
  leadPk: number;
  /** URL the customer is sent to after completing the finalize flow. */
  redirectUrl: string;
}
