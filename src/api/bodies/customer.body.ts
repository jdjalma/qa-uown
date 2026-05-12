/**
 * Request body for the IVR/TMS customer search endpoints (Task #510).
 *
 * Used by:
 *  - POST /uown/tms/v1/accounts/search    (legacy — Servicing only)
 *  - POST /uown/tms/v2/customers/search   (new — Servicing + Origination fallback)
 *
 * All fields are optional individually, but the backend requires at least one
 * combination sufficient to identify a customer (typically phone + last4SSN,
 * with dob used to disambiguate on first hit).
 */
export interface FindCustomerBody {
  /** Customer phone number (E.164 or 10-digit). */
  phone?: string;
  /** Last 4 digits of the customer's SSN. */
  last4SSN?: string;
  /** Date of birth in ISO format (YYYY-MM-DD) — used to confirm on first hit. */
  dob?: string;
}
