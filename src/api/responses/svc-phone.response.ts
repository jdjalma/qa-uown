/** PhoneInfo embedded object inside SvPhone (from Java @Embedded PhoneInfo) */
export interface PhoneInfoResponse {
  phonePK: number;
  customerPK: number;
  phoneType: string;
  areaCode: string;
  phoneNumber: number;
  phoneExtension: string | null;
  doNotCall: boolean;
  reasonForDnc: string | null;
  doNotText: boolean;
  reasonForDnt: string | null;
  lastContactTimestamp: string | null;
  /** Added by migration V20260318174113 — null until backend R1.50.0 deployed */
  optOutAi?: boolean;
  optOutAiReason?: string | null;
}

/** SvPhone entity returned by POST /uown/svc/updateOptOutAi, updateDnc, updateDnt */
export interface SvPhoneResponse {
  pk: number;
  /** Nested phoneInfo object (Java @Embedded serialized by Jackson) */
  phoneInfo: PhoneInfoResponse;
}
