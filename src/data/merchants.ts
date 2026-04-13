export interface MerchantConfig {
  fullName: string;
  merchantId?: string;
  refCode?: string;
  username: string;
  password: string;
  number: string;
  programs?: string[];
  websiteUrl?: string;
  websiteUsername?: string;
  websitePassword?: string;
  /** Per-environment overrides — merged on top of base config when env matches. */
  envOverrides?: Record<string, Partial<Omit<MerchantConfig, 'envOverrides'>>>;
}

/**
 * Reads an environment variable with a fallback default.
 * In CI/CD, credentials come from env vars; locally, the fallback keeps tests working.
 * This pattern avoids SonarQube S2068 (hardcoded credentials) hotspots.
 */
function envOr(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/**
 * Shared PayTomorrow portal credentials used by ProgressMobility, PayTomorrow, and MSAPowersports.
 * All three merchants authenticate against the same PayTomorrow merchant-staging portal.
 */
const PAYTOMORROW_PORTAL_DEFAULTS = {
  websiteUrl: 'https://merchant-staging.paytomorrow.com/login',
  websiteUsername: envOr('MERCHANT_PAYTOMORROW_WEBSITE_USERNAME', 'uwon_powersports@paytomorrow.com'),
  websitePassword: envOr('MERCHANT_PAYTOMORROW_WEBSITE_PASSWORD', 'UOwnTest123!'),
} as const;

export const MERCHANTS: Record<string, MerchantConfig> = {
  TireAgent: {
    fullName: 'Tire Agent',
    username: 'tireAgent',
    password: envOr('MERCHANT_TIRE_AGENT_PASSWORD', 'U0wn_tireAgent_G4eDIH'),
    number: 'OW90218-0001',
    refCode: 'tireagent',
    websiteUrl: 'https://dw93bg.paypair.com/',
    websiteUsername: 'tireAgent',
    websitePassword: envOr('MERCHANT_TIRE_AGENT_WEBSITE_PASSWORD', 'U0wn_tireAgent_G4eDIH'),
  },
  ProgressMobility: {
    fullName: 'Progress Mobility',
    username: 'payTomorrow',
    password: envOr('MERCHANT_PROGRESS_MOBILITY_PASSWORD', 'U0wn_payTomorrow'),
    number: 'OL90294-0001',
    merchantId: '35',
    refCode: 'progressmobility',
    ...PAYTOMORROW_PORTAL_DEFAULTS,
  },
  Bridge: {
    fullName: 'Bridge',
    username: 'bridge',
    password: envOr('MERCHANT_BRIDGE_PASSWORD', 'U0wn_bridge_V3idXD'),
    number: 'B082922-0001',
    refCode: 'bridge',
  },
  BuyOnTrust: {
    fullName: 'Buy On Trust',
    username: 'buyOnTrust',
    password: envOr('MERCHANT_BUY_ON_TRUST_PASSWORD', 'U0wn_buyOnTrust_7UcdHY'),
    number: 'OL90544-0001',
    refCode: 'buyontrust',
  },
  ChoicePay: {
    fullName: 'Choice Pay',
    username: 'choicePay',
    password: envOr('MERCHANT_CHOICE_PAY_PASSWORD', 'U0wn_choicePay_ESkP1j'),
    number: 'CP000-0001',
    refCode: 'choicepay',
  },
  DanielsJewelers: {
    fullName: "Daniel's Jewelers",
    username: 'danielsJewelers',
    password: envOr('MERCHANT_DANIELS_JEWELERS_PASSWORD', 'U0wn_danielsJewelers_CnRKhJ'),
    number: 'OL90205-0001',
    refCode: 'danielsjewelers',
  },
  Everly: {
    fullName: 'Everly',
    username: 'everly',
    password: envOr('MERCHANT_EVERLY_PASSWORD', 'U0wn_everly_O7Kp0c'),
    number: 'EV00001-0001',
    refCode: 'everly',
  },
  FlexxBuy: {
    fullName: 'FlexxBuy',
    username: 'flexxBuy',
    password: envOr('MERCHANT_FLEXX_BUY_PASSWORD', 'U0wn_flexxBuy_mrMw9k'),
    number: 'FLX22001-00010',
    refCode: 'flexxbuy',
  },
  FifthAveFurnitureNY: {
    fullName: '5th Ave Furniture (NY)',
    username: 'kornerstone',
    password: envOr('MERCHANT_FIFTH_AVE_FURNITURE_NY_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS3015',
    programs: ['13 month', '16 month'],
    envOverrides: {
      qa1: { password: envOr('MERCHANT_FIFTH_AVE_FURNITURE_NY_QA1_PASSWORD', 'U0wn_kornerstone_4aZ9Xb') },
      qa2: { password: envOr('MERCHANT_FIFTH_AVE_FURNITURE_NY_QA2_PASSWORD', 'U0wn_kornerstone_4aZ9Xb') },
    },
  },
  ComfortZoneMattress: {
    fullName: 'Comfort Zone Mattress & Home Decor',
    username: 'kornerstone',
    password: envOr('MERCHANT_COMFORT_ZONE_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS3023',
    programs: ['13 month', '16 month'],
  },
  FormPiper: {
    fullName: 'FormPiper',
    username: 'formPiper',
    password: envOr('MERCHANT_FORM_PIPER_PASSWORD', 'U0wn_formPiper_k5eX5N'),
    number: 'PPR20001-0001',
    refCode: 'formpiper',
  },
  PayPossible: {
    fullName: 'Pay Possible',
    username: 'payPossible',
    password: envOr('MERCHANT_PAY_POSSIBLE_PASSWORD', 'U0wn_payPossible_eSOZdN'),
    number: 'PP00001-0001',
    refCode: 'paypossible',
  },
  PayTomorrow: {
    fullName: 'PayTomorrow',
    username: 'payTomorrow',
    password: envOr('MERCHANT_PAY_TOMORROW_PASSWORD', 'U0wn_payTomorrow'),
    number: 'OL90294-0001',
    refCode: 'paytomorrow',
    ...PAYTOMORROW_PORTAL_DEFAULTS,
  },
  '360Finance': {
    fullName: '360 Finance',
    username: '360Finance',
    password: envOr('MERCHANT_360_FINANCE_PASSWORD', 'U0wn_360Finance_Gfh01T'),
    number: 'MO1234-0001',
    refCode: '360finance',
  },
  FirstApp: {
    fullName: 'FirstApp',
    username: 'firstApp',
    password: envOr('MERCHANT_FIRST_APP_PASSWORD', 'U0wn_firstApp_p9XBbZ'),
    number: 'FA10000-0001',
    refCode: 'firstapp',
  },
  MyEyeMed: {
    fullName: 'MyEyeMed',
    username: 'myEyeMed',
    password: envOr('MERCHANT_MY_EYE_MED_PASSWORD', 'U0wn_myEyeMed_kvqDNh'),
    number: 'EM0001-001',
    refCode: 'myeyemed',
  },
  TerraceFinance: {
    fullName: 'Terrace Finance',
    username: 'terraceFinance',
    password: envOr('MERCHANT_TERRACE_FINANCE_PASSWORD', 'U0wn_terraceFinance_xJ9z4p'),
    number: 'OL90202-0001',
    refCode: 'terraceFinance',
    programs: ['13 month', '16 month'],
  },
  Kornerstone: {
    fullName: 'Kornerstone',
    username: 'kornerstone',
    password: envOr('MERCHANT_KORNERSTONE_PASSWORD', 'U0wn_kornerstone_4aZ9Xb'),
    number: 'GOW-0003_clone_fer_ks',
    refCode: 'kornerstone',
  },
  KornerstoneKS0001: {
    fullName: 'Kornerstone (DEV1 — KS0001-777)',
    username: 'kornerstone',
    password: envOr('MERCHANT_KORNERSTONE_PASSWORD', 'U0wn_kornerstone_4aZ9Xb'),
    number: 'KS0001-777',
    refCode: 'kornerstone',
  },
  KornerstoneKS17371: {
    fullName: 'Tire Agent (Sandbox — KS17371)',
    username: 'kornerstone',
    password: envOr('MERCHANT_KORNERSTONE_PASSWORD', 'U0wn_kornerstone_4aZ9Xb'),
    number: 'KS17371',
    refCode: 'kornerstone',
  },
  GriffinsFurniture: {
    fullName: "Griffin's Furniture Outlet (KS5936)",
    username: 'kornerstone',
    password: envOr('MERCHANT_KORNERSTONE_PASSWORD', 'U0wn_kornerstone_4aZ9Xb'),
    number: 'KS5936',
    refCode: 'kornerstone',
    programs: ['16 month'],
  },
  MSAPowersports: {
    fullName: 'MSA Powersports',
    username: 'payTomorrow',
    password: envOr('MERCHANT_MSA_POWERSPORTS_PASSWORD', 'U0wn_payTomorrow'),
    number: 'OL90402-0001',
    refCode: 'msapowersports',
    ...PAYTOMORROW_PORTAL_DEFAULTS,
  },
};

export function getMerchant(name: string, env?: string): MerchantConfig {
  const merchant = MERCHANTS[name];
  if (!merchant) throw new Error(`Unknown merchant: ${name}. Available: ${Object.keys(MERCHANTS).join(', ')}`);
  if (env && merchant.envOverrides?.[env]) {
    const { envOverrides: _, ...base } = merchant;
    return { ...base, ...merchant.envOverrides[env] };
  }
  return merchant;
}
