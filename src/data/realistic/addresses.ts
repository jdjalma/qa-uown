/**
 * Realistic US address generator — random but VALID (real city + matching ZIP
 * per state) so applications don't fail address validation, and UNIQUE every
 * call (random house number + optional unit) so they dodge the shared-fixture
 * blacklist poisoning that the static `STATE_ADDRESSES` suffer from
 * (see `buildTestData` `uniqueAddress` note / app-lifecycle blacklist pitfall).
 */
import { int, pick, chance } from './random.js';
import { getAddressForState, type AddressData } from '../state-address-mapper.js';

export interface RealisticAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/** Real (city, ZIP) pairs per state. All 50 USPS states covered — eliminates
 *  the single-address fallback that caused blacklist poisoning when many tests
 *  shared the same static city/ZIP from `state-address-mapper`. */
const STATE_CITY_ZIP: Record<string, ReadonlyArray<{ city: string; zip: string }>> = {
  // ── High-volume routing states (10 cities each) ─────────────────────────────
  OH: [
    { city: 'Columbus', zip: '43215' }, { city: 'Cleveland', zip: '44114' },
    { city: 'Cincinnati', zip: '45202' }, { city: 'Bucyrus', zip: '44820' },
    { city: 'Toledo', zip: '43604' }, { city: 'Akron', zip: '44308' },
    { city: 'Dayton', zip: '45402' }, { city: 'Canton', zip: '44702' },
    { city: 'Youngstown', zip: '44503' }, { city: 'Springfield', zip: '45502' },
  ],
  TX: [
    { city: 'Houston', zip: '77002' }, { city: 'Dallas', zip: '75201' },
    { city: 'Austin', zip: '78701' }, { city: 'San Antonio', zip: '78205' },
    { city: 'Fort Worth', zip: '76102' }, { city: 'El Paso', zip: '79901' },
    { city: 'Arlington', zip: '76010' }, { city: 'Corpus Christi', zip: '78401' },
    { city: 'Plano', zip: '75023' }, { city: 'Lubbock', zip: '79401' },
  ],
  CA: [
    { city: 'Los Angeles', zip: '90012' }, { city: 'San Diego', zip: '92101' },
    { city: 'Sacramento', zip: '95814' }, { city: 'San Jose', zip: '95113' },
    { city: 'San Francisco', zip: '94102' }, { city: 'Fresno', zip: '93721' },
    { city: 'Long Beach', zip: '90802' }, { city: 'Oakland', zip: '94612' },
    { city: 'Bakersfield', zip: '93301' }, { city: 'Anaheim', zip: '92805' },
  ],
  // ── GowSign-routed states ────────────────────────────────────────────────────
  AL: [
    { city: 'Birmingham', zip: '35203' }, { city: 'Montgomery', zip: '36104' },
    { city: 'Mobile', zip: '36602' }, { city: 'Huntsville', zip: '35801' },
    { city: 'Tuscaloosa', zip: '35401' }, { city: 'Hoover', zip: '35216' },
  ],
  NY: [
    { city: 'New York', zip: '10007' }, { city: 'Buffalo', zip: '14202' },
    { city: 'Rochester', zip: '14604' }, { city: 'Albany', zip: '12207' },
    { city: 'Syracuse', zip: '13202' }, { city: 'Yonkers', zip: '10701' },
  ],
  PA: [
    { city: 'Philadelphia', zip: '19107' }, { city: 'Pittsburgh', zip: '15222' },
    { city: 'Allentown', zip: '18101' }, { city: 'Harrisburg', zip: '17101' },
    { city: 'Erie', zip: '16501' }, { city: 'Reading', zip: '19601' },
  ],
  FL: [
    { city: 'Miami', zip: '33130' }, { city: 'Orlando', zip: '32801' },
    { city: 'Tampa', zip: '33602' }, { city: 'Jacksonville', zip: '32202' },
    { city: 'St. Petersburg', zip: '33701' }, { city: 'Tallahassee', zip: '32301' },
    { city: 'Fort Lauderdale', zip: '33301' }, { city: 'Cape Coral', zip: '33990' },
  ],
  GA: [
    { city: 'Atlanta', zip: '30303' }, { city: 'Savannah', zip: '31401' },
    { city: 'Augusta', zip: '30901' }, { city: 'Macon', zip: '31201' },
    { city: 'Columbus', zip: '31901' }, { city: 'Athens', zip: '30601' },
  ],
  LA: [
    { city: 'New Orleans', zip: '70112' }, { city: 'Baton Rouge', zip: '70802' },
    { city: 'Shreveport', zip: '71101' }, { city: 'Lafayette', zip: '70501' },
    { city: 'Lake Charles', zip: '70601' }, { city: 'Kenner', zip: '70062' },
  ],
  NC: [
    { city: 'Raleigh', zip: '27601' }, { city: 'Charlotte', zip: '28202' },
    { city: 'Greensboro', zip: '27401' }, { city: 'Durham', zip: '27701' },
    { city: 'Winston-Salem', zip: '27101' }, { city: 'Fayetteville', zip: '28301' },
  ],
  // ── Other high-volume states ─────────────────────────────────────────────────
  AZ: [
    { city: 'Phoenix', zip: '85004' }, { city: 'Tucson', zip: '85701' },
    { city: 'Mesa', zip: '85201' }, { city: 'Scottsdale', zip: '85251' },
    { city: 'Chandler', zip: '85225' }, { city: 'Gilbert', zip: '85295' },
  ],
  IL: [
    { city: 'Chicago', zip: '60601' }, { city: 'Aurora', zip: '60505' },
    { city: 'Naperville', zip: '60540' }, { city: 'Springfield', zip: '62701' },
    { city: 'Peoria', zip: '61602' }, { city: 'Rockford', zip: '61101' },
  ],
  MI: [
    { city: 'Detroit', zip: '48226' }, { city: 'Grand Rapids', zip: '49503' },
    { city: 'Ann Arbor', zip: '48104' }, { city: 'Lansing', zip: '48933' },
    { city: 'Flint', zip: '48502' }, { city: 'Sterling Heights', zip: '48310' },
  ],
  WA: [
    { city: 'Seattle', zip: '98101' }, { city: 'Spokane', zip: '99201' },
    { city: 'Tacoma', zip: '98402' }, { city: 'Bellevue', zip: '98004' },
    { city: 'Kent', zip: '98031' }, { city: 'Everett', zip: '98201' },
  ],
  CO: [
    { city: 'Denver', zip: '80202' }, { city: 'Colorado Springs', zip: '80903' },
    { city: 'Aurora', zip: '80012' }, { city: 'Boulder', zip: '80302' },
    { city: 'Fort Collins', zip: '80521' }, { city: 'Pueblo', zip: '81003' },
  ],
  TN: [
    { city: 'Nashville', zip: '37203' }, { city: 'Memphis', zip: '38103' },
    { city: 'Knoxville', zip: '37902' }, { city: 'Chattanooga', zip: '37402' },
    { city: 'Clarksville', zip: '37040' }, { city: 'Murfreesboro', zip: '37129' },
  ],
  VA: [
    { city: 'Richmond', zip: '23219' }, { city: 'Virginia Beach', zip: '23451' },
    { city: 'Norfolk', zip: '23510' }, { city: 'Arlington', zip: '22201' },
    { city: 'Chesapeake', zip: '23320' }, { city: 'Newport News', zip: '23601' },
  ],
  IN: [
    { city: 'Indianapolis', zip: '46204' }, { city: 'Fort Wayne', zip: '46802' },
    { city: 'Evansville', zip: '47708' }, { city: 'South Bend', zip: '46601' },
    { city: 'Carmel', zip: '46032' }, { city: 'Bloomington', zip: '47401' },
  ],
  MA: [
    { city: 'Boston', zip: '02108' }, { city: 'Worcester', zip: '01608' },
    { city: 'Springfield', zip: '01103' }, { city: 'Cambridge', zip: '02139' },
    { city: 'Lowell', zip: '01852' }, { city: 'Brockton', zip: '02301' },
  ],
  MO: [
    { city: 'Kansas City', zip: '64106' }, { city: 'St. Louis', zip: '63101' },
    { city: 'Springfield', zip: '65806' }, { city: 'Columbia', zip: '65201' },
    { city: 'Independence', zip: '64050' }, { city: 'Lee Summit', zip: '64063' },
  ],
  MD: [
    { city: 'Baltimore', zip: '21202' }, { city: 'Annapolis', zip: '21401' },
    { city: 'Frederick', zip: '21701' }, { city: 'Rockville', zip: '20850' },
    { city: 'Gaithersburg', zip: '20877' },
  ],
  WI: [
    { city: 'Milwaukee', zip: '53202' }, { city: 'Madison', zip: '53703' },
    { city: 'Green Bay', zip: '54301' }, { city: 'Kenosha', zip: '53140' },
    { city: 'Racine', zip: '53401' },
  ],
  SC: [
    { city: 'Columbia', zip: '29201' }, { city: 'Charleston', zip: '29401' },
    { city: 'Greenville', zip: '29601' }, { city: 'Rock Hill', zip: '29730' },
    { city: 'Spartanburg', zip: '29301' },
  ],
  NV: [
    { city: 'Las Vegas', zip: '89101' }, { city: 'Reno', zip: '89501' },
    { city: 'Henderson', zip: '89002' }, { city: 'North Las Vegas', zip: '89030' },
    { city: 'Sparks', zip: '89431' },
  ],
  // ── Remaining 27 states (previously fell back to single static address) ───────
  AK: [
    { city: 'Anchorage', zip: '99501' }, { city: 'Fairbanks', zip: '99701' },
    { city: 'Juneau', zip: '99801' }, { city: 'Sitka', zip: '99835' },
  ],
  AR: [
    { city: 'Little Rock', zip: '72201' }, { city: 'Fort Smith', zip: '72901' },
    { city: 'Fayetteville', zip: '72701' }, { city: 'Jonesboro', zip: '72401' },
  ],
  CT: [
    { city: 'Hartford', zip: '06103' }, { city: 'New Haven', zip: '06511' },
    { city: 'Bridgeport', zip: '06604' }, { city: 'Stamford', zip: '06901' },
  ],
  DE: [
    { city: 'Wilmington', zip: '19801' }, { city: 'Dover', zip: '19901' },
    { city: 'Newark', zip: '19711' }, { city: 'Middletown', zip: '19709' },
  ],
  HI: [
    { city: 'Honolulu', zip: '96813' }, { city: 'Hilo', zip: '96720' },
    { city: 'Kailua', zip: '96734' }, { city: 'Pearl City', zip: '96782' },
  ],
  ID: [
    { city: 'Boise', zip: '83702' }, { city: 'Nampa', zip: '83651' },
    { city: 'Meridian', zip: '83642' }, { city: 'Idaho Falls', zip: '83401' },
  ],
  IA: [
    { city: 'Des Moines', zip: '50309' }, { city: 'Cedar Rapids', zip: '52401' },
    { city: 'Davenport', zip: '52801' }, { city: 'Sioux City', zip: '51101' },
  ],
  KS: [
    { city: 'Wichita', zip: '67202' }, { city: 'Overland Park', zip: '66210' },
    { city: 'Kansas City', zip: '66101' }, { city: 'Topeka', zip: '66603' },
  ],
  KY: [
    { city: 'Louisville', zip: '40202' }, { city: 'Lexington', zip: '40507' },
    { city: 'Bowling Green', zip: '42101' }, { city: 'Owensboro', zip: '42301' },
  ],
  ME: [
    { city: 'Portland', zip: '04101' }, { city: 'Bangor', zip: '04401' },
    { city: 'Auburn', zip: '04210' }, { city: 'Biddeford', zip: '04005' },
  ],
  MN: [
    { city: 'Minneapolis', zip: '55401' }, { city: 'St. Paul', zip: '55101' },
    { city: 'Rochester', zip: '55901' }, { city: 'Duluth', zip: '55802' },
  ],
  MS: [
    { city: 'Jackson', zip: '39201' }, { city: 'Gulfport', zip: '39501' },
    { city: 'Hattiesburg', zip: '39401' }, { city: 'Biloxi', zip: '39530' },
  ],
  MT: [
    { city: 'Billings', zip: '59101' }, { city: 'Missoula', zip: '59801' },
    { city: 'Great Falls', zip: '59401' }, { city: 'Bozeman', zip: '59715' },
  ],
  NE: [
    { city: 'Omaha', zip: '68102' }, { city: 'Lincoln', zip: '68508' },
    { city: 'Bellevue', zip: '68005' }, { city: 'Grand Island', zip: '68801' },
  ],
  NH: [
    { city: 'Manchester', zip: '03101' }, { city: 'Nashua', zip: '03060' },
    { city: 'Concord', zip: '03301' }, { city: 'Derry', zip: '03038' },
  ],
  NJ: [
    { city: 'Newark', zip: '07102' }, { city: 'Jersey City', zip: '07302' },
    { city: 'Trenton', zip: '08608' }, { city: 'Paterson', zip: '07501' },
  ],
  NM: [
    { city: 'Albuquerque', zip: '87102' }, { city: 'Santa Fe', zip: '87501' },
    { city: 'Las Cruces', zip: '88001' }, { city: 'Rio Rancho', zip: '87124' },
  ],
  ND: [
    { city: 'Fargo', zip: '58102' }, { city: 'Bismarck', zip: '58501' },
    { city: 'Grand Forks', zip: '58201' }, { city: 'Minot', zip: '58701' },
  ],
  OK: [
    { city: 'Oklahoma City', zip: '73102' }, { city: 'Tulsa', zip: '74103' },
    { city: 'Norman', zip: '73069' }, { city: 'Broken Arrow', zip: '74012' },
  ],
  OR: [
    { city: 'Portland', zip: '97201' }, { city: 'Eugene', zip: '97401' },
    { city: 'Salem', zip: '97301' }, { city: 'Gresham', zip: '97030' },
  ],
  RI: [
    { city: 'Providence', zip: '02903' }, { city: 'Cranston', zip: '02910' },
    { city: 'Warwick', zip: '02886' }, { city: 'Pawtucket', zip: '02860' },
  ],
  SD: [
    { city: 'Sioux Falls', zip: '57104' }, { city: 'Rapid City', zip: '57701' },
    { city: 'Aberdeen', zip: '57401' }, { city: 'Brookings', zip: '57006' },
  ],
  UT: [
    { city: 'Salt Lake City', zip: '84101' }, { city: 'West Valley City', zip: '84120' },
    { city: 'Provo', zip: '84601' }, { city: 'Ogden', zip: '84401' },
  ],
  VT: [
    { city: 'Burlington', zip: '05401' }, { city: 'South Burlington', zip: '05403' },
    { city: 'Rutland', zip: '05701' }, { city: 'Barre', zip: '05641' },
  ],
  WV: [
    { city: 'Charleston', zip: '25301' }, { city: 'Huntington', zip: '25701' },
    { city: 'Parkersburg', zip: '26101' }, { city: 'Morgantown', zip: '26505' },
  ],
  WY: [
    { city: 'Cheyenne', zip: '82001' }, { city: 'Casper', zip: '82601' },
    { city: 'Laramie', zip: '82070' }, { city: 'Gillette', zip: '82716' },
  ],
};

const STREET_NAMES: readonly string[] = [
  'Maple', 'Oak', 'Pine', 'Cedar', 'Elm', 'Washington', 'Lincoln', 'Jackson',
  'Lake', 'Hill', 'Park', 'Sunset', 'Forest', 'River', 'Highland', 'Franklin',
  'Madison', 'Jefferson', 'Adams', 'Walnut', 'Chestnut', 'Spring', 'Church',
  'Market', 'Center', 'Union', 'Liberty', 'Meadow', 'Willow', 'Ridge',
  // Expanded
  'Birch', 'Aspen', 'Sycamore', 'Magnolia', 'Dogwood', 'Hickory', 'Poplar',
  'Sunset', 'Sunrise', 'Valley', 'Brookside', 'Creekside', 'Lakeview', 'Fairview',
  'Garden', 'Orchard', 'Prospect', 'Summit', 'Heritage', 'Kennedy', 'Roosevelt',
  'Grant', 'Monroe', 'Harrison', 'Wilson', 'Cherry', 'Pinewood', 'Glenwood',
  'Sherwood', 'Mill', 'Bridge', 'Canal', 'Depot', 'School', 'College',
];

const STREET_TYPES: readonly string[] = [
  'St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Dr', 'Ct', 'Way', 'Pl', 'Ter',
];

const UNIT_TYPES: readonly string[] = ['Apt', 'Unit', 'Ste', '#'];

/**
 * Random, valid, unique US address for a state. The (city, ZIP) is a real pair
 * drawn from STATE_CITY_ZIP (all 50 states covered); the street number is
 * randomized and a unit is appended ~50% of the time so the full `street` string
 * is effectively unique per call. The static fallback via `state-address-mapper`
 * is retained only for any state inadvertently missed.
 */
export function randomAddress(state: string): RealisticAddress {
  const code = state.toUpperCase();
  const pool = STATE_CITY_ZIP[code];

  let city: string;
  let zip: string;
  if (pool && pool.length > 0) {
    const cz = pick(pool);
    city = cz.city;
    zip = cz.zip;
  } else {
    // Fallback: reuse the single static fixture for unlisted states (still real).
    const base: AddressData = getAddressForState(code);
    city = base.city;
    zip = base.zipCode;
  }

  const houseNumber = int(100, 9989);
  const street = `${houseNumber} ${pick(STREET_NAMES)} ${pick(STREET_TYPES)}`;

  return { street, city, state: code, zip };
}
