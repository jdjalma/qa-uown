/**
 * Response types for SvcContactClient.
 *
 * NOTE: ContactInformationResponse is defined in svc-email.response.ts and re-exported here
 * for convenience. The GET /getPrimaryCustomerContactInfo and POST /createOrUpdatePrimaryCustomerContactInfo
 * endpoints both return the same ContactInformation shape.
 */
export type { ContactInformationResponse } from './svc-email.response.js';
