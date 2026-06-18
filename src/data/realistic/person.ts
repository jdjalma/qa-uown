/**
 * Realistic applicant/person generator — assembles names + address + a valid
 * test SSN + phone + adult DOB + income into the shapes the platform consumes.
 *
 * Imports are taken from leaf modules (not barrels) to avoid a data↔helpers
 * import cycle (`@helpers/index` re-exports `test-data.helpers` which imports
 * `@data/index`).
 */
import { generateTestSSN, generateTestPhone } from '../../config/constants.js';
import { ConfigEnvironment } from '../../config/environment.js';
import { RUN_ID } from '../../helpers/worker-id.helper.js';
import type { ApplicantInfo } from '../../api/bodies/application.body.js';
import type { PayPairPersonalInfo } from '../tire-agent.data.js';
import { randomFullName } from './names.js';
import { randomAddress } from './addresses.js';
import { int, pick } from './random.js';

/** Real US employer names (for `mainEmployerName`). */
export const EMPLOYERS: readonly string[] = [
  'Walmart', 'Amazon', 'Target', 'Home Depot', 'Kroger', 'UPS', 'FedEx',
  'Costco', "Lowe's", 'Starbucks', "McDonald's", 'Bank of America', 'Wells Fargo',
  'AT&T', 'Verizon', 'CVS Health', 'Walgreens', 'Best Buy', 'General Motors',
  'Ford Motor Company', 'Delta Air Lines', 'Marriott', 'PepsiCo', 'Comcast',
  'IBM', 'Oracle', 'Intel', 'Boeing', 'Nike', 'Publix',
  // Expanded
  'Cisco Systems', 'Coca-Cola', 'Johnson & Johnson', 'Procter & Gamble',
  'Chase Bank', 'Capital One', 'American Airlines', 'Southwest Airlines',
  'Lockheed Martin', 'Caterpillar', 'John Deere', '3M', 'Honeywell', 'GE',
  'Dell Technologies', 'Salesforce', 'Adobe', 'Netflix', 'PayPal', 'Square',
  'Whole Foods Market', 'Trader Joes', 'Aldi', 'Dollar General', 'AutoZone',
  'OReilly Auto Parts', 'Sherwin-Williams', 'Tyson Foods', 'Kraft Heinz',
  'United Parcel Service', 'Kaiser Permanente', 'HCA Healthcare', 'Cleveland Clinic',
  'Ohio State University', 'Nationwide Insurance', 'Progressive', 'State Farm',
];

export function randomEmployer(): string {
  return pick(EMPLOYERS);
}

/** SSN strategy. `'approve'`/`'deny'` use the random test generator; `'sticky16m'`
 *  reuses the qa2 sticky-UW SSN that forces EligibleTerms 16; any other string is
 *  treated as a literal SSN. */
export type SsnStrategy = 'approve' | 'deny' | 'sticky16m' | (string & {});

const STICKY_16M_SSN = '082390916';

export function resolveSsn(strategy: SsnStrategy = 'approve'): string {
  switch (strategy) {
    case 'approve': return generateTestSSN(true);
    case 'deny': return generateTestSSN(false);
    case 'sticky16m': return STICKY_16M_SSN;
    default: return strategy; // literal SSN
  }
}

/** Adult DOB as MM/DD/YYYY (age in [minAge, maxAge]). Day capped at 28 for safety. */
export function randomAdultDob(minAge = 22, maxAge = 70): string {
  const year = new Date().getFullYear() - int(minAge, maxAge);
  const month = int(1, 12);
  const day = int(1, 28);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(month)}/${pad(day)}/${year}`;
}

/** Realistic annual income, rounded to the nearest $1,000. */
export function randomIncome(min = 35_000, max = 140_000): number {
  return int(min / 1000, max / 1000) * 1000;
}

export interface RandomPersonOptions {
  /** Required — drives the address (real city/zip) and template routing. */
  state: string;
  /** SSN strategy or literal (default `'approve'`). */
  ssn?: SsnStrategy;
  /** Override DOB (MM/DD/YYYY). Default: random adult. */
  dob?: string;
  /** Override email. Default: worker-unique alias on the test inbox. */
  email?: string;
  /** Override income. Default: random realistic. */
  income?: number;
  /** Override employer. Default: random real employer. */
  employer?: string;
}

export interface RandomPerson extends ApplicantInfo {
  /** Annual income — pass to `buildSendApplicationBody` overrides `mainAnnualIncome`. */
  annualIncome: number;
  /** Employer name — pass to `buildSendApplicationBody` overrides `employerName`. */
  employerName: string;
}

// Derive the real test-inbox base (e.g. `fintechgroup777@gmail.com`) from the
// env config's idempotent alias, then mint our OWN unique aliases with a
// monotonic counter so MANY applicants in one run each get a distinct, VALID
// address. (worker-id's `uniqueEmail()` yields an `@e2e.test` domain that the
// application backend rejects with "EmailAddress is invalid".)
let _emailBase: string | null = null;
function emailBase(): string {
  if (_emailBase) return _emailBase;
  const alias = new ConfigEnvironment(process.env.ENV ?? 'sandbox').uniqueEmailAlias;
  const at = alias.indexOf('@');
  const local = alias.slice(0, at).split('+')[0];
  _emailBase = `${local}@${alias.slice(at + 1)}`;
  return _emailBase;
}

let emailSeq = 0;
function realisticEmail(): string {
  const [local, domain] = emailBase().split('@');
  return `${local}+${RUN_ID}_${emailSeq++}_${Date.now().toString().slice(-6)}@${domain}`;
}

/** Full random person (applicant fields + income). */
export function randomPerson(opts: RandomPersonOptions): RandomPerson {
  const { firstName, lastName } = randomFullName();
  const addr = randomAddress(opts.state);
  return {
    firstName,
    lastName,
    email: opts.email ?? realisticEmail(),
    ssn: resolveSsn(opts.ssn),
    phone: generateTestPhone(),
    address: addr.street,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    dob: opts.dob ?? randomAdultDob(),
    annualIncome: opts.income ?? randomIncome(),
    employerName: opts.employer ?? randomEmployer(),
  };
}

/** Just the `ApplicantInfo` (no income) — drop-in for `buildSendApplicationBody`. */
export function randomApplicant(opts: RandomPersonOptions): ApplicantInfo {
  const { annualIncome, employerName, ...applicant } = randomPerson(opts);
  void annualIncome;
  void employerName;
  return applicant;
}

/** PayPair partner-portal `personalInfo` object (no SSN/phone — collected later in the widget). */
export function randomPayPairPersonalInfo(opts: RandomPersonOptions): PayPairPersonalInfo {
  const p = randomPerson(opts);
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    street: p.address,
    city: p.city,
    state: p.state,
    postalCode: p.zip,
    country: 'US',
  };
}
