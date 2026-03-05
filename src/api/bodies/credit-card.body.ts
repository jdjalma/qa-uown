import { TEST_CARDS } from '@data/index.js';

export interface AuthorizeCreditCardBody {
  leadPk: string;
  ccNumber: string;
  ccExp: string;
  cvc: string;
  ccFirstName: string;
  ccLastName: string;
}

export interface AuthorizeCreditCardOptions {
  ccNumber?: string;
  ccExp?: string;
  cvc?: string;
}

export function buildAuthorizeCreditCardBody(
  leadPk: string,
  firstName: string,
  lastName: string,
  options: AuthorizeCreditCardOptions = {},
): AuthorizeCreditCardBody {
  return {
    leadPk,
    ccNumber: options.ccNumber ?? TEST_CARDS.VISA_APPROVED.number,
    ccExp: options.ccExp ?? TEST_CARDS.VISA_APPROVED.expirationDate,
    cvc: options.cvc ?? TEST_CARDS.VISA_APPROVED.cvv,
    ccFirstName: firstName,
    ccLastName: lastName,
  };
}
