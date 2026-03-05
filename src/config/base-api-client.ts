import { APIRequestContext, APIResponse } from '@playwright/test';
import { ConfigEnvironment } from './environment.js';
import { buildRequestBody } from '../helpers/template-engine.js';

export interface ApiClientOptions {
  injectAuth?: boolean;
  injectApiKey?: boolean;
  tryGetOn405?: boolean;
  apiKeyHeaderNames?: string[];
}

export class BaseApiClient {
  private headers: Record<string, string> = {};

  constructor(
    private request: APIRequestContext,
    private env: ConfigEnvironment,
    private options: ApiClientOptions = {},
  ) {
    this.options = {
      injectAuth: true,
      injectApiKey: true,
      tryGetOn405: false,
      apiKeyHeaderNames: ['x-api-key', 'X-API-KEY', 'api-key', 'Api-Key'],
      ...options,
    };

    if (this.options.injectAuth && env.apiAuthorization) {
      this.headers['Authorization'] = env.apiAuthorization;
    }
    if (this.options.injectApiKey && env.apiKey) {
      for (const headerName of this.options.apiKeyHeaderNames!) {
        this.headers[headerName] = env.apiKey;
      }
    }
  }

  withHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url.replace(/<env>/g, this.env.env);
    }
    return `https://svc-${this.env.env}.uownleasing.com${url.startsWith('/') ? '' : '/'}${url}`;
  }

  async post(url: string, body?: object | string): Promise<APIResponse> {
    const resolvedUrl = this.resolveUrl(url);
    const data = typeof body === 'string' ? JSON.parse(body) : body;
    const response = await this.request.post(resolvedUrl, {
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      data,
    });

    if (response.status() === 405 && this.options.tryGetOn405) {
      return this.get(url);
    }

    return response;
  }

  async get(url: string): Promise<APIResponse> {
    const resolvedUrl = this.resolveUrl(url);
    return this.request.get(resolvedUrl, { headers: this.headers });
  }

  async submitApplication(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('submitApplication', vars);
    return this.post(`/uown/api/submitApplication`, body);
  }

  async getApplicationStatus(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('getApplicationStatus', vars);
    return this.post(`/uown/api/getApplicationStatus`, body);
  }

  async settleApplication(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('settleApplication', vars);
    return this.post(`/uown/api/settleApplication`, body);
  }

  async changeLeadStatus(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('changeLeadStatus', vars);
    return this.post(`/uown/api/changeLeadStatus`, body);
  }

  async sendInvoice(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('sendInvoice', vars);
    return this.post(`/uown/api/sendInvoice`, body);
  }

  async authorizeCreditCard(vars: Record<string, string>): Promise<APIResponse> {
    const body = buildRequestBody('authorizeCreditCard', vars);
    return this.post(`/uown/api/authorizeCreditCard`, body);
  }

  async triggerScheduledTask(taskName: string): Promise<APIResponse> {
    const url = `https://svc-${this.env.env}.uownleasing.com/uown/svc/triggerScheduledTask/${taskName}`;
    return this.post(url);
  }
}
