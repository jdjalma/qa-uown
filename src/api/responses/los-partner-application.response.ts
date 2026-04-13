/**
 * Response from LOS partner merchant application endpoints (v2).
 * Shape varies by endpoint — common fields listed; extras captured by index signature.
 */
export interface LosPartnerApplicationResponse {
  accountNumber?: string;
  authorizationNumber?: number;
  error?: string;
  [key: string]: unknown;
}
