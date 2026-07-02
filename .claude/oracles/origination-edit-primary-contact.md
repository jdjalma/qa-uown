---
last-reviewed: 2026-06-30
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - origination/pages/customers/[leadPk].tsx
  - origination/domain/stores/customer.tsx
---

# Oracle: Edit Primary Contact (Origination Portal)

> Operation: click the edit pencil on the Primary Contact card (`#PrimaryContact-edit`) of `/customers/{leadPk}` in the Origination portal — covers Address (Line 1/2, City, State, ZIP), Primary Email, Mobile Phone, do-not-contact flags, and communication preferences — change one or more fields, and save. Distinct card/operation from [[origination-edit-primary-applicant]] (name/DOB/SSN/license), which sits in the same page but has its own pencil and endpoint.

## Pre-conditions

- Pre-signing/post-signing pencil gating analogous to Primary Applicant is plausible but NOT verified for this card in this session — treat as `[HYPOTHESIS]` until observed on a FUNDING/FUNDED/SIGNED lead.
- Agent must have permission to edit contact info (exact permission key not confirmed; assumed analogous to `create_or_update_primary_customer_info`).

## Checkpoints

### Oracle

| CT | Description | Expected |
|---|---|---|
| CT-01 | Pencil icon visible in Primary Contact card header | `<span id="PrimaryContact-edit">` SVG present; the card header also has a separate chevron-collapse control — clicking the wrong icon collapses the card instead of entering edit mode |
| CT-02 | Clicking pencil enters edit mode | Address Line 1/2, City, ZIP, Primary Email, Mobile Phone become `<input>` textboxes; State becomes a combobox; Preferred communication channel / Preferred language become comboboxes; CANCEL and SAVE buttons appear |
| CT-03 | Fields pre-populated with current values | All fields show existing values on form open `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-04 | CANCEL restores read mode with no network call | Clicking CANCEL: inputs disappear, read-only divs return, no POST to `createOrUpdatePrimaryCustomerContactInfo` fired `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-05 | SAVE triggers `POST /uown/los/createOrUpdatePrimaryCustomerContactInfo` | Network: POST returns 200; payload contains `leadAddresses[].addressInfo`, `leadEmails[].emailInfo`, `leadPhones[].phoneInfo`, `leadPk` `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-06 | Panel refreshes after SAVE with updated values | `GET /uown/los/getPrimaryCustomerContactInfo/{leadPk}` fires after POST 200; panel returns to read mode showing new values `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-07 | DB persists the change | `uown_los_address` row for the lead's customer shows the new `street_address1`/`city`/`state`/`zip_code` and a bumped `row_updated_timestamp` `[confirmed stg 2026-06-30 lead 7218266, address pk 6863041: streetAddress1 "3579 Cherry Ave" → "482 Magnolia Court"]` |
| CT-08 | Activity log entry IS created (differs from Primary Applicant) | A `DATA_CHANGE` entry IS written to `uown_los_activity_log` after a Primary Contact edit — confirmed behavioral DIFFERENCE vs the Primary Applicant card on the same page ([[origination-edit-primary-applicant]] CT-09), which writes none. `[confirmed stg 2026-06-30 lead 7218266: "UPDATED : Address[ zipCode9 changed from null to 93721 ]"]` |
| CT-08b | `[OBSERVATION]` Log message content does not name the field actually edited | The DATA_CHANGE note text references `zipCode9` (null → 93721) even though the field the user changed and that persisted was `streetAddress1`; the note never mentions `streetAddress1`. Single observation, not isolated/reproduced against an edit of only one field — not classified as a bug. Re-check if Primary Contact is tested again, ideally changing one field at a time. |
| CT-09 | UI "Notes" activity panel does not auto-refresh after save | The on-page Notes grid still showed the same top-10 rows immediately after SAVE; the new DATA_CHANGE row was visible via DB query but not in the rendered grid without a manual reload `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-10 | Success toast appears | `[gap — not confirmed this session; toast timing not captured]` |

### Staleness check command

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- origination/pages/customers/\[leadPk\].tsx origination/domain/stores/customer.tsx
```

> Run from the root of the origination app repo. No output = BDD current. Output = prepend `[BDD MAY BE STALE]`.
