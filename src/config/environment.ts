import { randomInt } from 'node:crypto';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export type UserRole = 'admin' | 'manager' | 'readonly' | 'merchant' | 'supervisor' | 'agent';

export interface Credentials {
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  env: string;
  originationUrl: string;
  servicingUrl: string;
  websiteUrl: string;
  amsUrl: string;
  email: string;
  emailPassword: string;
  dbConnectionString: string;
  apiKey: string;
  apiAuthorization: string;
  svcApiKey: string;
}

const AMS_ENV_SLUGS: Record<string, string> = {
  qa1: 'qa1',
  qa2: 'qa2',
  stg: 'stg',
  dev1: 'dev1',
  dev2: 'dev2',
  dev3: 'dev3',
  sandbox: 'sandbox'
};

/**
 * Maps environment names to their DB variable suffix.
 * e.g. 'qa1' -> 'QA1', 'sandbox' -> 'SBX', 'stg' -> 'STG'
 */
const DB_ENV_SUFFIXES: Record<string, string[]> = {
  qa1: ['QA1', 'QA'],
  qa2: ['QA2', 'QA'],
  stg: ['STG'],
  staging: ['STG'],
  dev1: ['DEV1'],
  dev2: ['DEV2'],
  dev3: ['DEV3'],
  sandbox: ['SBX', 'SANDBOX']
};

export class ConfigEnvironment {
  private config: EnvironmentConfig;
  private credentials: Map<UserRole, Credentials> = new Map();
  private emailBase: string = '';
  private uniqueEmailAlias: string = '';

  constructor(env: string) {
    const envFilePath = path.resolve(process.cwd(), `.env.${env}`);
    const baseEnvPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(baseEnvPath)) {
      dotenv.config({ path: baseEnvPath });
    }
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath, override: true });
    }

    const amsSlug = AMS_ENV_SLUGS[env] || env;

    this.config = {
      env,
      originationUrl: process.env.ORIGINATION_URL || `https://origination-${env}.uownleasing.com/`,
      servicingUrl: process.env.SERVICING_URL || `https://svc-website-${env}.uownleasing.com/`,
      websiteUrl: process.env.WEBSITE_URL || `https://website-${env}.uownleasing.com/`,
      amsUrl: process.env.AMS_URL || `https://ams-website-${amsSlug}.uownleasing.com/`,
      email: process.env.EMAIL || '',
      emailPassword: process.env.EMAIL_PASSWORD || '',
      dbConnectionString: process.env.DB_CONNECTION_STRING || this.resolveDbConnectionString(env),
      apiKey: process.env.UOWN_API_KEY || '',
      apiAuthorization: process.env.UOWN_API_AUTHORIZATION || '',
      svcApiKey: process.env.UOWN_SVC_API_KEY || process.env.UOWN_API_KEY || '',
    };

    this.emailBase = this.config.email;
    this.loadCredentials();
  }

  /**
   * Builds a PostgreSQL connection string from per-environment variables.
   * Reads UOWN_DB_URL_{SUFFIX}, UOWN_DB_USER_{SUFFIX}, UOWN_DB_PASS_{SUFFIX}
   * and converts JDBC URLs to node-pg format.
   */
  private resolveDbConnectionString(env: string): string {
    const suffixes = DB_ENV_SUFFIXES[env] || [env.toUpperCase()];

    for (const suffix of suffixes) {
      const jdbcUrl = process.env[`UOWN_DB_URL_${suffix}`];
      const user = process.env[`UOWN_DB_USER_${suffix}`];
      const pass = process.env[`UOWN_DB_PASS_${suffix}`];

      if (jdbcUrl && user) {
        // Convert JDBC URL to node-pg format:
        // jdbc:postgresql://host:port/db -> postgresql://user:pass@host:port/db
        const pgUrl = jdbcUrl.replace(/^jdbc:/, '');
        const urlObj = new URL(pgUrl);
        urlObj.username = user;
        urlObj.password = pass || '';
        return urlObj.toString();
      }
    }

    return '';
  }

  private loadCredentials(): void {
    const roles: UserRole[] = ['admin', 'manager', 'readonly', 'merchant', 'supervisor', 'agent'];
    for (const role of roles) {
      const prefix = role.toUpperCase();
      const username = process.env[`${prefix}_USERNAME`] || '';
      const password = process.env[`${prefix}_PASSWORD`] || '';
      if (username) {
        this.credentials.set(role, { username, password });
      }
    }
  }

  get env(): string { return this.config.env; }
  get originationUrl(): string { return this.config.originationUrl; }
  get servicingUrl(): string { return this.config.servicingUrl; }
  get websiteUrl(): string { return this.config.websiteUrl; }
  get amsUrl(): string { return this.config.amsUrl; }
  get email(): string { return this.config.email; }
  get emailPassword(): string { return this.config.emailPassword; }
  get dbConnectionString(): string { return this.config.dbConnectionString; }
  get apiKey(): string { return this.config.apiKey; }
  get apiAuthorization(): string { return this.config.apiAuthorization; }
  get svcApiKey(): string { return this.config.svcApiKey; }

  getCredentials(role: UserRole): Credentials {
    const creds = this.credentials.get(role);
    if (!creds) throw new Error(`No credentials found for role: ${role}`);
    return creds;
  }

  generateUniqueEmailAlias(): string {
    const timestamp = Date.now();
    const random = randomInt(10000);
    const [localPart, domain] = this.emailBase.split('@');
    this.uniqueEmailAlias = `${localPart}+${timestamp}-${random}@${domain}`;
    return this.uniqueEmailAlias;
  }

  getUniqueEmailAlias(): string {
    return this.uniqueEmailAlias || this.generateUniqueEmailAlias();
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
