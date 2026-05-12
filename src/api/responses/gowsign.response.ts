/**
 * GowSign API — Response Types
 *
 * Every response is wrapped in a standard envelope:
 *   { data, meta, error, valid, responseData }
 *
 * Source: docs/external/gowsign-api.md
 */

// ── Envelope ───────────────────────────────────────────────────────

export interface GowSignError {
  type: number;
  message: string;
}

export interface GowSignPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface GowSignMeta {
  pagination?: GowSignPagination;
  [key: string]: unknown;
}

/**
 * Standard GowSign response envelope. Always present at the root level.
 * `data` contains the endpoint-specific payload (or null on error).
 */
export interface GowSignEnvelope<T> {
  data: T | null;
  meta: GowSignMeta | null;
  error: GowSignError | null;
  valid: boolean;
  responseData: unknown | null;
}

// ── Status enums ───────────────────────────────────────────────────

export type GowSignDocumentStatus =
  | 'CREATED'
  | 'OUTSTANDING'
  | 'SIGNED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELED';

export type GowSignPdfStatus =
  | 'CREATED_PENDING'
  | 'CREATED_GENERATED'
  | 'SIGNED_PENDING'
  | 'SIGNED_GENERATED'
  | 'AUDIT_TRAIL_PENDING'
  | 'AUDIT_TRAIL_GENERATED';

// ── Document payload — POST + List item ────────────────────────────

export interface GowSignRequesterInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
}

export interface GowSignSignatureField {
  term: string;
  type: 'signature' | 'initial' | 'check';
  signer: number;
  required: boolean;
  /** Only present for type "check" after signing — true/false. */
  value?: boolean;
}

export interface GowSignDocumentMetadata {
  clientName?: string;
  email?: string;
  userDateTime?: string;
  deviceInfo?: string;
  geoLocation?: string;
  [key: string]: unknown;
}

/**
 * Slim document shape returned by POST /api/document and items in List Documents.
 */
export interface GowSignDocument {
  id: string;
  url: string | null;
  status: GowSignDocumentStatus;
  strapiTemplateTitle?: string;
  createdDate?: string;
  signedDate?: string | null;
  lastUpdateDate?: string | null;
  callback?: Record<string, unknown> | null;
  Requester: GowSignRequesterInfo;
}

/**
 * Full document detail returned by GET /api/document/{id}.
 * Superset of GowSignDocument with hashes, fields, metadata, pdfStatus.
 */
export interface GowSignDocumentDetail extends GowSignDocument {
  variables?: Record<string, unknown>;
  strapiTemplateId?: string;
  createdPdfHash?: string | null;
  signedPdfHash?: string | null;
  signatureImage?: string | null;
  rubricaImage?: string | null;
  isSandbox?: boolean;
  pdfStatus?: GowSignPdfStatus;
  redirect?: string | null;
  idRequester?: string;
  hasCustomTemplate?: boolean;
  expirationDate?: string | null;
  mustRemind?: boolean;
  reminderDaysAmount?: number | null;
  docxBlobUrl?: string | null;
  signatureFields?: GowSignSignatureField[] | null;
  Metadata?: GowSignDocumentMetadata | null;
  pdfUrl?: string;
}

// ── List response ──────────────────────────────────────────────────

export type ListDocumentsResponse = GowSignDocument[];
