export interface AddressData {
  street: string;
  city: string;
  zipCode: string;
}

export const STATE_ADDRESSES: Record<string, AddressData> = {
  AL: { street: '123 Main St', city: 'Birmingham', zipCode: '35203' },
  AK: { street: '456 Northern Lights Blvd', city: 'Anchorage', zipCode: '99503' },
  AZ: { street: '789 Desert View Dr', city: 'Phoenix', zipCode: '85001' },
  AR: { street: '321 Central Ave', city: 'Little Rock', zipCode: '72201' },
  CA: { street: '654 Sunset Blvd', city: 'Los Angeles', zipCode: '90028' },
  CO: { street: '987 Mountain Rd', city: 'Denver', zipCode: '80202' },
  CT: { street: '147 Harbor Dr', city: 'Hartford', zipCode: '06103' },
  DE: { street: '258 Colonial Way', city: 'Wilmington', zipCode: '19801' },
  FL: { street: '369 Palm Ave', city: 'Miami', zipCode: '33101' },
  GA: { street: '741 Peachtree St', city: 'Atlanta', zipCode: '30301' },
  HI: { street: '852 Aloha Blvd', city: 'Honolulu', zipCode: '96801' },
  ID: { street: '963 River Rd', city: 'Boise', zipCode: '83701' },
  IL: { street: '159 Lake Shore Dr', city: 'Chicago', zipCode: '60601' },
  IN: { street: '753 Hoosier Ln', city: 'Indianapolis', zipCode: '46201' },
  IA: { street: '486 Corn Field Rd', city: 'Des Moines', zipCode: '50301' },
  KS: { street: '624 Prairie View Dr', city: 'Topeka', zipCode: '66601' },
  KY: { street: '135 Bluegrass Pkwy', city: 'Louisville', zipCode: '40201' },
  LA: { street: '246 Bayou Ln', city: 'New Orleans', zipCode: '70112' },
  ME: { street: '357 Pine Tree Rd', city: 'Portland', zipCode: '04101' },
  MD: { street: '468 Chesapeake Ave', city: 'Baltimore', zipCode: '21201' },
  MA: { street: '579 Commonwealth Ave', city: 'Boston', zipCode: '02101' },
  MI: { street: '681 Motor City Dr', city: 'Detroit', zipCode: '48201' },
  MN: { street: '792 Lake Wobegon Trail', city: 'Minneapolis', zipCode: '55401' },
  MS: { street: '813 Magnolia St', city: 'Jackson', zipCode: '39201' },
  MO: { street: '924 Gateway Arch Dr', city: 'St. Louis', zipCode: '63101' },
  MT: { street: '135 Big Sky Rd', city: 'Helena', zipCode: '59601' },
  NE: { street: '246 Cornhusker Hwy', city: 'Lincoln', zipCode: '68501' },
  NV: { street: '357 Las Vegas Blvd', city: 'Las Vegas', zipCode: '89101' },
  NH: { street: '468 Granite State Rd', city: 'Concord', zipCode: '03301' },
  NJ: { street: '579 Garden State Pkwy', city: 'Trenton', zipCode: '08601' },
  NM: { street: '681 Adobe Way', city: 'Santa Fe', zipCode: '87501' },
  NY: { street: '792 Broadway', city: 'New York', zipCode: '10001' },
  NC: { street: '813 Tar Heel Ln', city: 'Raleigh', zipCode: '27601' },
  ND: { street: '924 Peace Garden Rd', city: 'Bismarck', zipCode: '58501' },
  OH: { street: '135 Buckeye Blvd', city: 'Columbus', zipCode: '43201' },
  OK: { street: '246 Sooner St', city: 'Oklahoma City', zipCode: '73101' },
  OR: { street: '357 Beaver Creek Rd', city: 'Portland', zipCode: '97201' },
  PA: { street: '468 Liberty Bell Ave', city: 'Philadelphia', zipCode: '19101' },
  RI: { street: '579 Ocean State Dr', city: 'Providence', zipCode: '02901' },
  SC: { street: '681 Palmetto St', city: 'Columbia', zipCode: '29201' },
  SD: { street: '792 Mount Rushmore Rd', city: 'Pierre', zipCode: '57501' },
  TN: { street: '813 Music Row', city: 'Nashville', zipCode: '37201' },
  TX: { street: '924 Lone Star Trail', city: 'Austin', zipCode: '78701' },
  UT: { street: '135 Temple View Dr', city: 'Salt Lake City', zipCode: '84101' },
  VT: { street: '246 Green Mountain Rd', city: 'Montpelier', zipCode: '05601' },
  VA: { street: '357 Colonial Hwy', city: 'Richmond', zipCode: '23219' },
  WA: { street: '468 Evergreen Way', city: 'Seattle', zipCode: '98101' },
  WV: { street: '579 Mountain State Rd', city: 'Charleston', zipCode: '25301' },
  WI: { street: '681 Badger Ln', city: 'Madison', zipCode: '53701' },
  WY: { street: '200 W 17th St', city: 'Cheyenne', zipCode: '82001' },
};

export function getAddressForState(stateCode: string): AddressData {
  const address = STATE_ADDRESSES[stateCode.toUpperCase()];
  if (!address) throw new Error(`No address data for state: ${stateCode}`);
  return address;
}
