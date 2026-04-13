/**
 * SEON Identity Verification — Response Types
 *
 * Mirrors com.uownleasing.svc.pojo.SeonInfo returned by
 * POST /uown/los/seon/createOrUpdate
 */

export interface SeonInfoResponseBody {
  seonIdPk?: number;
  leadPk?: number;
  referenceId?: string;
  fullName?: string;
  status?: string;
  success?: boolean;
  idVerifySuccess?: boolean;
  documentType?: string;
  nameMatchCheckResult?: string;
  stateCheckResult?: string;
  postalCodeResult?: string;
  dateOfBirthResult?: string;
  birthDate?: string;
  documentExpirationDate?: string;
  error?: string;
}
