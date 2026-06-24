import { BaseClient } from './base.client.js';
import { type ApiResponse } from '../responses/api-response.js';
import type { GowSignTemplate } from '../responses/gowsign-template.response.js';
import type {
  GowSignTemplateCreateBody,
  GowSignTemplatePatchBody,
} from '../bodies/gowsign-template.body.js';

/**
 * Typed client for /uown/svc/gowsign-templates.
 *
 * Backend feature flag context: RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505.
 * Endpoints (svc host):
 *   - POST   /uown/svc/gowsign-templates                — create (or upsert by templateId)
 *   - GET    /uown/svc/gowsign-templates                — list all
 *   - GET    /uown/svc/gowsign-templates/{templateId}   — fetch one
 *   - PATCH  /uown/svc/gowsign-templates/{templateId}   — partial update
 *   - DELETE /uown/svc/gowsign-templates/{templateId}   — delete
 *
 * All methods return the framework-standard `ApiResponse<T>` envelope so callers
 * can inspect `.status` (e.g. CT-09 expects 404 on PATCH of a missing template).
 * No method throws on non-2xx — assertions live in tests.
 */
export class GowSignTemplateClient extends BaseClient {

  /** POST /uown/svc/gowsign-templates — create (server upserts by templateId). */
  async createTemplate(body: GowSignTemplateCreateBody): Promise<ApiResponse<GowSignTemplate>> {
    return this.post<GowSignTemplate>('/uown/svc/gowsign-templates', body);
  }

  /** GET /uown/svc/gowsign-templates — list all templates. */
  async listTemplates(): Promise<ApiResponse<GowSignTemplate[]>> {
    return this.get<GowSignTemplate[]>('/uown/svc/gowsign-templates');
  }

  /**
   * GET /uown/svc/gowsign-templates/{templateId} — fetch one by templateId.
   * Returns the raw envelope; check `.status === 404` for the not-found case.
   */
  async getTemplate(templateId: string): Promise<ApiResponse<GowSignTemplate>> {
    return this.get<GowSignTemplate>(`/uown/svc/gowsign-templates/${encodeURIComponent(templateId)}`);
  }

  /**
   * PATCH /uown/svc/gowsign-templates/{templateId} — partial update.
   * Backend normalizes `clientType` (uppercase + strip whitespace).
   * 404 on unknown templateId; envelope is returned, not thrown (CT-09).
   */
  async patchTemplate(
    templateId: string,
    body: GowSignTemplatePatchBody,
  ): Promise<ApiResponse<GowSignTemplate>> {
    return this.patch<GowSignTemplate>(
      `/uown/svc/gowsign-templates/${encodeURIComponent(templateId)}`,
      body,
    );
  }

  /** DELETE /uown/svc/gowsign-templates/{templateId} — used in CT-08 afterAll cleanup. */
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/uown/svc/gowsign-templates/${encodeURIComponent(templateId)}`);
  }
}
