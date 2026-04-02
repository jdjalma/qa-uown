/** Request body for POST /uown/svc/createOrUpdateEmail */
export interface CreateOrUpdateEmailBody {
  emailPK: number;
  customerPK: number;
  emailAddress: string;
  /** Email type — e.g. 'PRIMARY' | 'SECONDARY' | 'WORK' | 'OTHER' */
  emailType: string;
  doNotEmail: boolean;
  reasonForDnc?: string;
}
