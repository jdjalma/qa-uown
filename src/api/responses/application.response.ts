export interface SendApplicationResponseBody {
  appApprovalStatus?: string;
  authorizationNumber?: string;
  accountNumber?: string;
  transactionMessage?: string;
  paymentDetailsList?: Array<{
    redirectUrl?: string;
    regularPaymentWithTax?: string;
    planId?: string;
    termInMonths?: number;
  }>;
  code?: string;
  error?: string;
  message?: string;
}

export interface ApplicationStatusResponseBody {
  status?: string;
  uwStatus?: string;
  appApprovalStatus?: string;
  currentStatus?: string;
  approvedAmount?: number;
  openToBuy?: number;
  creditLimit?: number;
  leadUuid?: string;
  accountNumber?: string;
  leadPk?: number;
  message?: string;
  contractStatus?: string;
  leaseStatus?: string;
  contractUrl?: string;
  paymentDetailsList?: Array<{
    redirectUrl?: string;
    regularPaymentWithTax?: string;
    planId?: string;
    termInMonths?: number;
  }>;
  merchantDiscountPercent?: number;
  merchantDiscountAmount?: number;
  merchantRebatePercent?: number;
  merchantRebateAmount?: number;
  merchantRebateType?: string;
  applicationFound?: boolean;
  hasSignedLease?: boolean;
  canContinue?: boolean;
  fundRequestDateTime?: string;
  fundedDateTime?: string | null;
  amountToBeFunded?: number;
}

export interface SubmitApplicationResponseBody {
  status?: string;
  message?: string;
  error?: string;
  embeddedSigningUrl?: string;
  termInMonths?: number;
}

export interface CanContinueApplicationResponseBody {
  canContinue?: boolean;
  merchantNumber?: string;
  merchantName?: string;
  plaidEligible?: boolean;
  message?: string;
  status?: string;
}

export interface FinalApprovalDetailsResponseBody {
  status?: string;
  message?: string;
  requiredFields?: string[];
  nextPayDate?: string;
  payFrequency?: string;
  employer?: string;
}

export interface MissingFieldsResponseBody {
  missingFields?: string[];
  calculatedFees?: number;
  securityDeposit?: number;
  firstPaymentDate?: string;
  insuranceEligible?: boolean;
  status?: string;
  message?: string;
}
