/**
 * Barrel export for src/config/
 *
 * Centralizes configuration exports: environment config, constants,
 * test options, and the legacy BaseApiClient.
 */
export * from './environment.js';
export * from './constants.js';
export * from './test-options.js';
export { BaseApiClient, type ApiClientOptions } from './base-api-client.js';
