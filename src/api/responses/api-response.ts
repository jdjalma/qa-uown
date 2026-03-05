import { APIResponse } from '@playwright/test';

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

export async function parseResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
  let body: T;
  const contentType = response.headers()['content-type'] || '';

  if (contentType.includes('application/json')) {
    body = await response.json() as T;
  } else {
    body = (await response.text()) as unknown as T;
  }

  return {
    ok: response.ok(),
    status: response.status(),
    statusText: response.statusText(),
    headers: response.headers(),
    body,
    raw: response,
  };
}
