export interface SendApplicationResponseBody {
  appApprovalStatus?: string;
  authorizationNumber?: string;
  accountNumber?: string;
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
}

export interface SubmitApplicationResponseBody {
  status?: string;
  message?: string;
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
