/**
 * GowSign Template — Request Bodies
 *
 * Backend DTOs:
 *   - Create: com.uownleasing.svc.pojo.GowSignTemplateInfo (record)
 *   - Patch:  com.uownleasing.svc.pojo.GowSignTemplatePatchInfo (record, all nullable)
 *
 * Used by RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505 (CT-08, CT-09).
 */

/**
 * Body for POST /uown/svc/gowsign-templates.
 *
 * `templateId`, `name`, `variables`, `sender`, `state` are required by the backend
 * (validated server-side; blank values yield a 4xx with field-level error list).
 */
export interface GowSignTemplateCreateBody {
  templateId: string;
  name: string;
  variables: string;
  sender: string;
  state: string;
  /** CSV string (e.g., 'DANIELS_JEWELERS,JEWELRY'). Backend uppercases + strips whitespace. */
  clientType?: string | null;
  footerTemplate?: string | null;
}

/**
 * Body for PATCH /uown/svc/gowsign-templates/{templateId}.
 *
 * All fields are optional — only present keys are applied. Omitting a key leaves
 * the existing value unchanged.
 */
export interface GowSignTemplatePatchBody {
  name?: string;
  variables?: string;
  sender?: string;
  state?: string;
  /** Backend normalizes to uppercase and strips whitespace. */
  clientType?: string;
  footerTemplate?: string;
}
