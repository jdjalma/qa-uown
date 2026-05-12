/**
 * Nested phone info object for createOrUpdatePrimaryCustomerContactInfo.
 * Field names must match the Java PhoneInfo @Embeddable class (Jackson serialization).
 * phonePK and customerPK are capitalized to match the Java field names.
 */
export interface ContactPhoneInfo {
  /** Outer SvPhone entity pk. > 0 = update existing; omit or 0 = create new */
  pk?: number;
  phoneInfo: {
    /** PhoneInfo embedded pk. Match SvPhone.pk for updates. */
    phonePK?: number;
    /** Customer pk associated with this phone */
    customerPK?: number;
    areaCode: string;
    /** Must be a number (Long in Java) — not a string */
    phoneNumber: number;
    /** e.g. 'CELL', 'HOME', 'WORK', 'MOBILE' */
    phoneType?: string;
    doNotCall?: boolean;
    doNotText?: boolean;
    phoneExtension?: string | null;
  };
}

/**
 * Nested email info object for createOrUpdatePrimaryCustomerContactInfo.
 * Mirrors Java SvEmail + EmailInfo @Embeddable (Jackson serialization).
 * emailPK and customerPK are capitalized to match the Java field names —
 * sending lowercase variants causes Jackson to ignore them and the endpoint
 * inserts a NEW row instead of updating.
 */
export interface ContactEmailInfo {
  /** Outer SvEmail entity pk. > 0 = update existing; omit or 0 = create new */
  pk?: number;
  emailInfo: {
    /** EmailInfo embedded pk. Match SvEmail.pk for updates. */
    emailPK?: number;
    /** Customer pk associated with this email */
    customerPK?: number;
    emailAddress: string;
    /** e.g. 'PRIMARY', 'SECONDARY', 'WORK', 'OTHER' — preserve original on update */
    emailType?: string;
    doNotEmail?: boolean;
    reasonForDnc?: string | null;
  };
}

/**
 * Request body for POST /uown/svc/createOrUpdatePrimaryCustomerContactInfo
 * Maps to Java ContactInformation class used as @RequestBody.
 */
export interface CreateOrUpdateContactInfoBody {
  accountPk?: number;
  phoneList?: ContactPhoneInfo[];
  emailList?: ContactEmailInfo[];
}
