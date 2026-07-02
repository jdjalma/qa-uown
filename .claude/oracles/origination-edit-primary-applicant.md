---
last-reviewed: 2026-06-29
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - origination/pages/customers/[leadPk].tsx
  - origination/domain/stores/customer.tsx
---

# Oracle: Edit Primary Applicant (Origination Portal)

> Operation: click the edit pencil on the Primary Applicant card of `/customers/{leadPk}` in the Origination portal, change one or more fields, and save.

## Pre-conditions

- Lead must be in a **pre-signing status** (e.g. UW_APPROVED, NEW, APPROVED). Leads in post-signing states (FUNDING, FUNDED, SIGNED) do **not** expose the edit pencil — fields are rendered read-only.
- Agent must have `create_or_update_primary_customer_info` permission (controls pencil visibility).
- Sub-permissions `dob` and `ssn` gate those specific fields (same as Servicing counterpart).

## Checkpoints

### Oracle

| CT | Description | Expected |
|---|---|---|
| CT-01 | Pencil icon visible in Primary Applicant card header (pre-signing lead) | `<span id="PrimaryApplicant-edit">` with `data-icon="pen"` SVG is present and visible |
| CT-02 | Clicking pencil enters edit mode | All 7 readOnly `inputField__readOnly` divs replaced by `<input>` elements; `readOnlyFields` count = 0; CANCEL and SAVE buttons appear |
| CT-03 | Middle Name field appears only in edit mode | `#applicantMiddleName` input visible in edit mode; not rendered in read view |
| CT-04 | Fields pre-populated with current values | `#applicantFirstName`, `#applicantLastName`, `#applicantDOB`, `#applicantSSN` have existing values on form open |
| CT-05 | CANCEL restores read mode with no network call | Clicking CANCEL: inputs disappear, readOnly divs return, no POST to `createOrUpdatePrimaryCustomerInfo` fired |
| CT-06 | SAVE triggers `POST /uown/los/createOrUpdatePrimaryCustomerInfo` | Network: POST to `/uown/los/createOrUpdatePrimaryCustomerInfo` returns 200; payload contains `primaryCustomerInformation.leadPk` |
| CT-07 | Panel refreshes after SAVE with updated values | `GET /uown/los/getPrimaryCustomerInfo/{leadPk}` fires after POST 200; panel returns to read mode showing new values |
| CT-08 | Success toast appears | Toast "success" variant displayed after save [gap — exact message not confirmed; observe on execution] |
| CT-09 | No activity log entry created (Origination differs from Servicing) | **No** DATA_CHANGE entry is written to `uown_los_activity_log` after a Primary Applicant edit in the Origination portal. The only log created during the flow is the automatic REVIEW ("Lead has been reviewed") on page open. This is a confirmed behavioral difference vs the Servicing portal, which writes DATA_CHANGE on every panel edit. `[confirmed stg 2026-06-29 lead 7218266]` |
| CT-10 | No pencil on post-signing lead | For leads in FUNDING/FUNDED/SIGNED status, Primary Applicant card header has **no** `pen` SVG — only `chevron-down` |

### Staleness check command

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- origination/pages/customers/\[leadPk\].tsx origination/domain/stores/customer.tsx
```

> Run from the root of the origination app repo. No output = BDD current. Output = prepend `[BDD MAY BE STALE]`.
