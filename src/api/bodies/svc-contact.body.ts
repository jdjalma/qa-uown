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

/** Nested email info object for createOrUpdatePrimaryCustomerContactInfo */
export interface ContactEmailInfo {
  emailInfo: {
    /** 0 or omitted = create new; > 0 = update existing */
    emailPk?: number;
    emailAddress: string;
    accountPk?: number;
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
