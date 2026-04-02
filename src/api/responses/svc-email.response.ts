import type { PhoneInfoResponse } from './svc-phone.response.js';

/** EmailInfo embedded object inside SvEmail (from Java @Embedded EmailInfo) */
export interface EmailInfoResponse {
  emailPK: number;
  customerPK: number;
  emailAddress: string;
  /** Email type — e.g. 'PRIMARY' | 'SECONDARY' | 'WORK' | 'OTHER' */
  emailType: string;
  doNotEmail: boolean;
  reasonForDnc?: string | null;
}

/** SvEmail entity with nested emailInfo (Java @Embedded serialized by Jackson) */
export interface SvEmailResponse {
  pk: number;
  /** Nested emailInfo object (Java @Embedded serialized by Jackson) */
  emailInfo: EmailInfoResponse;
}

/** SvPhone shape as returned inside ContactInformation */
export interface SvPhoneInContactResponse {
  pk: number;
  phoneInfo: PhoneInfoResponse;
}

/**
 * Response for GET /uown/svc/getPrimaryCustomerContactInfo/{accountPk}
 * Maps to Java ContactInformation class.
 */
export interface ContactInformationResponse {
  accountPk: number;
  leadPk?: number;
  emailList: SvEmailResponse[];
  phoneList: SvPhoneInContactResponse[];
}

/**
 * Response for POST /uown/svc/createOrUpdateEmail
 * Returns the updated SvEmail entity.
 */
export type SvEmailUpdateResponse = SvEmailResponse;
