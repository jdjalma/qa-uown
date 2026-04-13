/**
 * SEON Identity Verification — Request Bodies
 *
 * Used to bypass SEON ID verification in automated tests by creating
 * an approved verification record via the /uown/los/seon/createOrUpdate endpoint.
 *
 * Backend reference: com.uownleasing.svc.pojo.SeonInfo (JPA @Embeddable)
 */

export interface SeonCreateOrUpdateBody {
  leadPk: number;
  referenceId: string;
  fullName: string;
  status: string;
  success: boolean;
  idVerifySuccess: boolean;
  documentType: string;
  nameMatchCheckResult: string;
  stateCheckResult: string;
  postalCodeResult: string;
  dateOfBirthResult: string;
  /** ISO format: YYYY-MM-DD (Java LocalDate) */
  birthDate: string;
  /** ISO format: YYYY-MM-DD (Java LocalDate) */
  documentExpirationDate: string;
}

export interface BuildSeonApprovedOptions {
  leadPk: number;
  /** Full name as it appears on the document (must match application first+last) */
  fullName: string;
  /** Date of birth in YYYY-MM-DD (must match application DOB) */
  birthDate: string;
  /** Document expiration date in YYYY-MM-DD (must be in the future) */
  documentExpirationDate?: string;
  /** Document type (default: DRIVERS_LICENSE) */
  documentType?: string;
}

/**
 * Builds an APPROVED SEON verification body.
 *
 * Sets `idVerifySuccess: true` which causes IdVerificationService.verifySeon()
 * to short-circuit (line 173-175) and skip all validation checks.
 */
export function buildSeonApprovedBody(options: BuildSeonApprovedOptions): SeonCreateOrUpdateBody {
  return {
    leadPk: options.leadPk,
    referenceId: crypto.randomUUID(),
    fullName: options.fullName,
    status: 'APPROVED',
    success: true,
    idVerifySuccess: true,
    documentType: options.documentType ?? 'DRIVERS_LICENSE',
    nameMatchCheckResult: 'PASS',
    stateCheckResult: 'PASS',
    postalCodeResult: 'PASS',
    dateOfBirthResult: 'PASS',
    birthDate: options.birthDate,
    documentExpirationDate: options.documentExpirationDate ?? '2030-01-01',
  };
}
