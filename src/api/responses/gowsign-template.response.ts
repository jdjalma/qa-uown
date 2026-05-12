/**
 * GowSign Template — Response Types
 *
 * Backend entity: com.uownleasing.svc.db.entity.GowSignTemplate
 * REST endpoints: /uown/svc/gowsign-templates[/{templateId}]
 *
 * `clientType` and `footerTemplate` are nullable. `clientType` is a CSV string
 * (uppercased + whitespace-stripped by the backend) — e.g. 'DANIELS_JEWELERS,JEWELRY'.
 *
 * Used by RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505 (CT-08, CT-09).
 */
export interface GowSignTemplate {
  pk: number;
  templateId: string;
  name: string;
  /** Raw text payload (TEXT column). */
  variables: string;
  sender: string;
  state: string;
  /** CSV of client-type tokens; null = template applies to all client types. */
  clientType: string | null;
  /** Optional footer markup (TEXT column). */
  footerTemplate: string | null;
  rowCreatedTimestamp?: string;
  rowUpdatedTimestamp?: string | null;
}
