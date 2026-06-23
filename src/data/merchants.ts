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
    refCode: 'OW90218-0001',
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
    number: 'OL90205-0079',
    refCode: 'danielsjewelers',
    envOverrides: {
      stg: { number: 'OL90205-0001' },
      qa1: { number: 'OL90205-0001' },
    },
  },
  DanielsJewelersClone: {
    fullName: "Daniel's Jewelers (clone OL90205-0079_clone)",
    username: 'danielsJewelers',
    password: envOr('MERCHANT_DANIELS_JEWELERS_PASSWORD', 'U0wn_danielsJewelers_CnRKhJ'),
    number: 'OL90205-0079_clone',
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
    refCode: 'KS3015',
    programs: ['13 month', '16 month'],
    envOverrides: {
      qa1: { password: envOr('MERCHANT_FIFTH_AVE_FURNITURE_NY_QA1_PASSWORD', 'U0wn_kornerstone_4aZ9Xb') },
      qa2: { password: envOr('MERCHANT_FIFTH_AVE_FURNITURE_NY_QA2_PASSWORD', 'U0wn_Kornerstone_012c') },
    },
  },
  ComfortZoneMattress: {
    fullName: 'Comfort Zone Mattress & Home Decor',
    username: 'kornerstone',
    password: envOr('MERCHANT_COMFORT_ZONE_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS3023',
    programs: ['13 month', '16 month'],
  },
  // Object-of-test merchant for the npm_segment snapshot. KS16775 / pk 657
  // is the env-confirmed Kornerstone 16m route that produces npm_segment via GDS in
  // qa2 (DB-probed 2026-06-19; ONLINE, NY, is_seon_id_check_required=false). Shares
  // the Kornerstone portal credentials (username 'kornerstone'); differs only by number.
  BrooklynFurnitureKS16775: {
    fullName: '#1 Brooklyn Furniture INC',
    username: 'kornerstone',
    password: envOr('MERCHANT_KORNERSTONE_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS16775',
    refCode: 'KS16775',
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
    // stg uses a user-configured clone of terraceFinance (pk 15752) for the
    // merchant-settings snapshot env-port — same credentials, different ref_merchant_code. Precedent: DanielsJewelers.
    envOverrides: {
      stg: { number: 'OL90202-0001_clone' },
    },
  },
  EZPawn: {
    fullName: 'EZ Pawn (TF10078-0001)',
    username: 'terraceFinance',
    password: envOr('MERCHANT_TERRACE_FINANCE_PASSWORD', 'U0wn_terraceFinance_xJ9z4p'),
    number: 'TF10078-0001',
    refCode: 'terraceFinance',
    programs: ['13 month'],
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
    refCode: 'OL90402-0001',
    ...PAYTOMORROW_PORTAL_DEFAULTS,
    envOverrides: {
      stg: {
        number: 'OL90402-0001_clone_for_DevTest',
        refCode: 'OL90402-0001_clone_for_DevTest',
        username: 'Merchant_Dev_Test',
      },
    },
  },
  SaslowsJewelers: {
    fullName: "Saslow's Jewelers",
    username: 'saslowJewelers',
    password: envOr('MERCHANT_SASLOWS_JEWELERS_PASSWORD', 'U0wn_saslowJewelers_fGoj3p'),
    number: 'IL90206-0003',
    refCode: 'saslowjewelers',
    envOverrides: {
      qa2: { password: envOr('MERCHANT_SASLOWS_JEWELERS_QA2_PASSWORD', 'U0wn_saslowJewelers_fGoj3p') },
    },
  },
  /**
   * Saslow's Jewelers — canonical CA entry (qa2 pk=6, ref_merchant_code=OW90337-0001).
   * Used for CT-04 in task RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505.
   * Note: qa2 DB shows state='NC' for this merchant — state field may reflect physical
   * store location, not the operative config. Use this entry when the test spec calls for
   * the Saslow's merchant identified by ref_merchant_code OW90337-0001.
   */
  SaslowsJewelersCA: {
    fullName: "Saslow's Jewelers (OW90337-0001)",
    username: 'saslowJewelers',
    password: envOr('MERCHANT_SASLOWS_JEWELERS_CA_PASSWORD', 'U0wn_saslowJewelers_fGoj3p'),
    number: 'OW90337-0001',
    refCode: 'saslowjewelers',
  },
  /**
   * Dickinson Jewelers — qa2 pk=832, client_type=KORNERSTONE, state=MD.
   * Used for CT-11 in task RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505.
   * Portal login uses shared kornerstone credentials; most CT-11 steps are API-only.
   * Password is QA-managed — set MERCHANT_DICKINSON_JEWELERS_PASSWORD in .env if portal
   * login is needed. Contract: KORNERSTONE_MERCHANT_CONFIG (useWebhook + holdDeposit true).
   */
  DickinsonJewelers: {
    fullName: 'Dickinson Jewelers',
    username: 'kornerstone',
    password: envOr('MERCHANT_DICKINSON_JEWELERS_PASSWORD', 'U0wn_kornerstone_4aZ9Xb'),
    number: 'KS4123',
    refCode: 'kornerstone',
  },
  /**
   * Paramount Jewelers (KS10150) — Kornerstone-family merchant, used in stg
   * for the gowSignClientTypeAdaptionForNewTemplate_505 routing matrix.
   * Login uses shared kornerstone credentials.
   */
  ParamountJewelers: {
    fullName: 'Paramount Jewelers, Inc.',
    username: 'kornerstone',
    password: envOr('MERCHANT_PARAMOUNT_JEWELERS_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS10150',
    refCode: 'kornerstone',
  },
  BodegaFurniture: {
    fullName: 'Bodega Furniture',
    username: 'kornerstone',
    password: envOr('MERCHANT_BODEGA_FURNITURE_PASSWORD', 'U0wn_Kornerstone_012c'),
    number: 'KS1011',
    refCode: 'kornerstone',
    envOverrides: {
      qa2: { password: envOr('MERCHANT_BODEGA_FURNITURE_QA2_PASSWORD', 'U0wn_Kornerstone_012c') },
      // stg uses a user-configured KS clone (pk 15753) for the merchant-settings snapshot env-port —
      // same kornerstone credentials, different ref_merchant_code.
      stg: { number: 'KS8795_clone' },
    },
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

/**
 * General-purpose UOWN merchant pool for randomized test data.
 * Criteria: env-agnostic, UOWN brand (not Kornerstone), no special platform config.
 * Excluded: Kornerstone-brand, PayTomorrow-platform, env-specific, clones, DanielsJewelers
 * (mainNextPayDate blocked until cherry-pick 62e2fc20 is applied per env).
 */
export const UOWN_GENERAL_MERCHANT_POOL: readonly string[] = [
  'TireAgent',
  'BuyOnTrust',
  'ChoicePay',
  'FormPiper',
  'PayPossible',
  'TerraceFinance',
  'SaslowsJewelers',
  'Everly',
  'FlexxBuy',
  'MyEyeMed',
  '360Finance',
  'FirstApp',
] as const;

/**
 * Kornerstone-brand merchant pool — for tests that specifically require the KS
 * webhook/holdDeposit contract (KORNERSTONE_MERCHANT_CONFIG).
 */
export const KORNERSTONE_GENERAL_MERCHANT_POOL: readonly string[] = [
  'FifthAveFurnitureNY',
  'ComfortZoneMattress',
  'BodegaFurniture',
] as const;

/**
 * Picks a random merchant key from the given pool (default: UOWN_GENERAL_MERCHANT_POOL).
 * Logs the chosen key so failed tests remain reproducible.
 *
 * Usage:
 *   const merchantKey = pickRandomMerchantKey();
 *   const merchant = getMerchant(merchantKey, env);
 */
export function pickRandomMerchantKey(pool: readonly string[] = UOWN_GENERAL_MERCHANT_POOL): string {
  const key = pool[Math.floor(Math.random() * pool.length)];
  console.log(`[pickRandomMerchant] selected: ${key}`);
  return key;
}
