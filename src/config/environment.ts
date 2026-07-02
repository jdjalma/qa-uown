import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { RUN_ID } from '@helpers/worker-id.helper.js';

export type UserRole = 'admin' | 'manager' | 'readonly' | 'merchant' | 'supervisor' | 'agent';

export const VALID_ENVS = ['sandbox', 'qa1', 'qa2', 'qa3', 'stg', 'dev1', 'dev2', 'dev3'] as const;
export type EnvName = (typeof VALID_ENVS)[number];

export interface Credentials {
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  env: EnvName;
  originationUrl: string;
  servicingUrl: string;
  websiteUrl: string;
  amsUrl: string;
  amsApiUrl: string;
  email: string;
  emailPassword: string;
  dbConnectionString: string;
  svcApiUrl: string;
  apiKey: string;
  apiAuthorization: string;
  svcApiKey: string;
  tmsApiKey: string;
  losPartnerUsername: string;
  losPartnerPassword: string;
}

/**
 * Maps environment names to their DB variable suffix.
 * e.g. 'qa1' -> 'QA1', 'sandbox' -> 'SBX'
 * Variables expected in .env: UOWN_DB_URL_{SUFFIX}, UOWN_DB_USER_{SUFFIX}, UOWN_DB_PASS_{SUFFIX}
 */
const DB_ENV_SUFFIXES: Record<EnvName, string> = {
  qa1: 'QA1',
  qa2: 'QA2',
  qa3: 'QA3',
  stg: 'STG',
  dev1: 'DEV1',
  dev2: 'DEV2',
  dev3: 'DEV3',
  sandbox: 'SBX',
};

export class ConfigEnvironment {
  private config: EnvironmentConfig;
  private credentials: Map<UserRole, Credentials> = new Map();
  private emailBase: string = '';
  private _uniqueEmailAlias: string = '';

  constructor(env: string) {
    if (!VALID_ENVS.includes(env as EnvName)) {
      throw new Error(`Unknown environment: "${env}". Valid values: ${VALID_ENVS.join(', ')}`);
    }
    const validEnv = env as EnvName;

    // Single file load — all config lives in .env
    const baseEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(baseEnvPath)) {
      dotenv.config({ path: baseEnvPath });
    }

    // Env-specific prefix for variable resolution (e.g. 'QA1', 'SANDBOX')
    const envUpper = validEnv.toUpperCase();

    this.config = {
      env: validEnv,
      // URL resolution order: {ENV}_URL → global URL → auto-generated from env name
      originationUrl: process.env[`${envUpper}_ORIGINATION_URL`]
        || process.env.ORIGINATION_URL
        || `https://origination-${validEnv}.uownleasing.com/`,
      servicingUrl: process.env[`${envUpper}_SERVICING_URL`]
        || process.env.SERVICING_URL
        || `https://svc-website-${validEnv}.uownleasing.com/`,
      websiteUrl: process.env[`${envUpper}_WEBSITE_URL`]
        || process.env.WEBSITE_URL
        || `https://website-${validEnv}.uownleasing.com/`,
      amsUrl: process.env[`${envUpper}_AMS_URL`]
        || process.env.AMS_URL
        || `https://ams-website-${validEnv}.uownleasing.com/`,
      amsApiUrl: process.env[`${envUpper}_AMS_API_URL`]
        || process.env.AMS_API_URL
        || `https://ams-${validEnv}.uownleasing.com`,
      // SVC API URL: {ENV}_SVC_API_URL → SVC_API_URL → auto-generated
      svcApiUrl: process.env[`${envUpper}_SVC_API_URL`]
        || process.env.SVC_API_URL
        || `https://svc-${validEnv}.uownleasing.com`,
      // Email resolution: {ENV}_EMAIL → EMAIL
      email: process.env[`${envUpper}_EMAIL`] || process.env.EMAIL || '',
      emailPassword: process.env[`${envUpper}_EMAIL_PASSWORD`] || process.env.EMAIL_PASSWORD || '',
      dbConnectionString: process.env.DB_CONNECTION_STRING || this.resolveDbConnectionString(validEnv),
      apiKey: process.env.UOWN_API_KEY || '',
      apiAuthorization: process.env.UOWN_API_AUTHORIZATION || '',
      // svcApiKey falls back to apiKey when UOWN_SVC_API_KEY is not set (same key in most envs)
      svcApiKey: process.env.UOWN_SVC_API_KEY || process.env.UOWN_API_KEY || '',
      tmsApiKey: process.env.FIVE9_TMS_API_KEY || '',
      losPartnerUsername: process.env.LOS_PARTNER_USERNAME || '',
      losPartnerPassword: process.env.LOS_PARTNER_PASSWORD || '',
    };

    this.emailBase = this.config.email;
    this.loadCredentials(envUpper);
  }

  /**
   * Builds a PostgreSQL connection string from per-environment variables.
   * Reads UOWN_DB_URL_{SUFFIX}, UOWN_DB_USER_{SUFFIX}, UOWN_DB_PASS_{SUFFIX}
   * and converts JDBC URLs to node-pg format.
   */
  private resolveDbConnectionString(env: EnvName): string {
    const suffix = DB_ENV_SUFFIXES[env];
    const jdbcUrl = process.env[`UOWN_DB_URL_${suffix}`];
    const user = process.env[`UOWN_DB_USER_${suffix}`];
    const pass = process.env[`UOWN_DB_PASS_${suffix}`];

    if (!jdbcUrl || !user) return '';

    // Convert JDBC URL to node-pg format:
    // jdbc:postgresql://host:port/db -> postgresql://user:pass@host:port/db
    const pgUrl = jdbcUrl.replace(/^jdbc:/, '');
    const urlObj = new URL(pgUrl);
    urlObj.username = user;
    urlObj.password = pass || '';
    return urlObj.toString();
  }

  /**
   * Loads credentials with two-level fallback:
   *   1. {ENV_UPPER}_{ROLE}_USERNAME  — env-specific override
   *   2. DEFAULT_{ROLE}_USERNAME      — shared default for all envs
   *
   * Only set DEFAULT_* once in .env. Add {ENV}_* only for exceptions.
   */
  private loadCredentials(envUpper: string): void {
    const roles: UserRole[] = ['admin', 'manager', 'readonly', 'merchant', 'supervisor', 'agent'];
    for (const role of roles) {
      const roleKey = role.toUpperCase();
      const username = process.env[`${envUpper}_${roleKey}_USERNAME`]
        || process.env[`DEFAULT_${roleKey}_USERNAME`]
        || '';
      const password = process.env[`${envUpper}_${roleKey}_PASSWORD`]
        || process.env[`DEFAULT_${roleKey}_PASSWORD`]
        || '';
      if (username) {
        this.credentials.set(role, { username, password });
      }
    }
  }

  get env(): EnvName { return this.config.env; }
  get originationUrl(): string { return this.config.originationUrl; }
  get servicingUrl(): string { return this.config.servicingUrl; }
  get websiteUrl(): string { return this.config.websiteUrl; }
  get amsUrl(): string { return this.config.amsUrl; }
  get amsApiUrl(): string { return this.config.amsApiUrl; }
  get svcApiUrl(): string { return this.config.svcApiUrl; }
  get email(): string { return this.config.email; }
  get emailPassword(): string { return this.config.emailPassword; }
  get dbConnectionString(): string { return this.config.dbConnectionString; }
  get apiKey(): string { return this.config.apiKey; }
  get apiAuthorization(): string { return this.config.apiAuthorization; }
  get svcApiKey(): string { return this.config.svcApiKey; }
  get tmsApiKey(): string { return this.config.tmsApiKey; }
  get losPartnerUsername(): string { return this.config.losPartnerUsername; }
  get losPartnerPassword(): string { return this.config.losPartnerPassword; }

  getCredentials(role: UserRole): Credentials {
    const creds = this.credentials.get(role);
    if (!creds) throw new Error(`No credentials found for role: ${role}`);
    return creds;
  }

  /**
   * Generates a unique email alias for this test run.
   * Combines RUN_ID (worker-scoped pid+index) with a timestamp suffix.
   * Idempotent within a single test — same alias is returned on subsequent calls.
   */
  get uniqueEmailAlias(): string {
    if (!this._uniqueEmailAlias) {
      const timestamp = Date.now().toString().slice(-6);
      const [localPart, domain] = this.emailBase.split('@');
      this._uniqueEmailAlias = `${localPart}+${RUN_ID}_${timestamp}@${domain}`;
    }
    return this._uniqueEmailAlias;
  }

  /** @deprecated Use uniqueEmailAlias getter instead */
  generateUniqueEmailAlias(): string {
    const timestamp = Date.now().toString().slice(-6);
    const [localPart, domain] = this.emailBase.split('@');
    this._uniqueEmailAlias = `${localPart}+${RUN_ID}_${timestamp}@${domain}`;
    return this._uniqueEmailAlias;
  }

  /** @deprecated Use uniqueEmailAlias getter instead */
  getUniqueEmailAlias(): string {
    return this.uniqueEmailAlias;
  }

  getPortalUrl(portal: 'origination' | 'servicing' | 'website' | 'ams'): string {
    switch (portal) {
      case 'origination': return this.originationUrl;
      case 'servicing': return this.servicingUrl;
      case 'website': return this.websiteUrl;
      case 'ams': return this.amsUrl;
    }
  }
}
