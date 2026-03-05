/**
 * Base interface shared by most API response bodies.
 * Provides the common `status` and optional `message` fields.
 */
export interface BaseResponseBody {
  status: string;
  message?: string;
}
