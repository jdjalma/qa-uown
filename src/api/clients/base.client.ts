import { APIRequestContext, APIResponse } from '@playwright/test';
import { ConfigEnvironment } from '../../config/environment.js';
import { type ApiResponse, parseResponse } from '../responses/api-response.js';

export type ApiHost = 'svc' | 'origination';

export interface ClientOptions {
  injectAuth?: boolean;
  injectApiKey?: boolean;
  apiKeyHeaderNames?: string[];
}

export class BaseClient {
  protected headers: Record<string, string> = {};

  constructor(
    protected request: APIRequestContext,
    protected env: ConfigEnvironment,
    options: ClientOptions = {},
  ) {
    const opts: Required<ClientOptions> = {
      injectAuth: true,
      injectApiKey: true,
      apiKeyHeaderNames: ['x-api-key', 'X-API-KEY', 'api-key', 'Api-Key'],
      ...options,
    };

    this.headers['Accept'] = 'application/json';

    if (opts.injectAuth && env.apiAuthorization) {
      this.headers['Authorization'] = env.apiAuthorization;
    }
    if (opts.injectApiKey && env.apiKey) {
      for (const headerName of opts.apiKeyHeaderNames) {
        this.headers[headerName] = env.apiKey;
      }
    }
  }

  withHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  protected resolveUrl(url: string, host: ApiHost = 'svc'): string {
    if (url.startsWith('http')) {
      return url.replace(/<env>/g, this.env.env);
    }
    const base = host === 'origination'
      ? `https://origination-${this.env.env}.uownleasing.com`
      : this.env.svcApiUrl;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  protected async postRaw(url: string, body?: object | string, host?: ApiHost): Promise<APIResponse> {
    const resolvedUrl = this.resolveUrl(url, host);
    const data = typeof body === 'string' ? JSON.parse(body) : body;
    return this.request.post(resolvedUrl, {
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      data,
      timeout: 120_000,
    });
  }

  protected async getRaw(url: string, host?: ApiHost): Promise<APIResponse> {
    const resolvedUrl = this.resolveUrl(url, host);
    return this.request.get(resolvedUrl, { headers: this.headers });
  }

  protected async post<T>(url: string, body?: object | string, host?: ApiHost): Promise<ApiResponse<T>> {
    const response = await this.postRaw(url, body, host);
    return parseResponse<T>(response);
  }

  protected async get<T>(url: string, host?: ApiHost): Promise<ApiResponse<T>> {
    const response = await this.getRaw(url, host);
    return parseResponse<T>(response);
  }

  protected async put<T>(url: string, body?: object | string, host?: ApiHost): Promise<ApiResponse<T>> {
    const resolvedUrl = this.resolveUrl(url, host);
    const data = typeof body === 'string' ? JSON.parse(body) : body;
    const response = await this.request.put(resolvedUrl, {
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      data,
      timeout: 120_000,
    });
    return parseResponse<T>(response);
  }
}
