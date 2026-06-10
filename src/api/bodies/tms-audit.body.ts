/**
 * Request bodies for TMS audit-trail testing (WI-525).
 *
 * Targets the legacy `TmsController` (S1) and the modern RESTful
 * controllers under `com.uownleasing.svc.rest.tms.*` (S2):
 *   - `TmsAccountController` (`/uown/tms/v1/accounts/{id}/...`)
 *   - `TmsPaymentController` (`/uown/tms/v1/accounts/{id}/payment-methods/...`)
 *   - `TmsDueDateController` (`/uown/tms/v1/accounts/{id}/activity-logs`,
 *     `/due-dates/move`)
 *
 * The aspect `AspectInboundApiLog` extracts `source_uuid` from the literal
 * string `"uuid":` in POST bodies — every POST helper below MUST include a
 * `uuid` field for correlation in `uown_sv_inbound_api_log`.
 */

/** Body for `POST /uown/tms/v1/accounts/{accountId}/activity-logs`. */
export interface AddActivityLogBody {
  /** Correlation marker — captured by aspect into `source_uuid`. */
  uuid: string;
  /** Log type (free text; matches `uown_sv_activity_log.log_type`). */
  logType?: string;
  /** Note body persisted on `uown_sv_activity_log.notes`. */
  logNote: string;
}

/** Body for the legacy `POST /uown/tms/addLogNote` endpoint (S1). */
export interface AddLogNoteLegacyBody {
  /** Correlation marker — captured by aspect into `source_uuid`. */
  uuid: string;
  /** Numeric account PK. */
  accountPk: number | string;
  /** Log type (matches `uown_sv_activity_log.log_type`). */
  logType?: string;
  /** Note body persisted on `uown_sv_activity_log.notes`. */
  logNote: string;
}
