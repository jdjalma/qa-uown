---
title: Origination Programs, Program Settings & Program Groups
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: stg
  - code: src/pages/origination/programs.page.ts
  - code: src/pages/origination/program-details.page.ts
  - code: src/pages/origination/programs-list.page.ts
  - code: src/pages/origination/program-groups.page.ts
  - code: src/pages/origination/merchant-programs-section.page.ts
covers: [programs, program-settings, program-groups, merchant-programs, lease-program-config, activation-deactivation-dates, money-factor, epo, processing-fee, lending-category, state-scoping]
promoted_to: []
---

# Origination Programs, Program Settings & Program Groups

> Charter: Explore `/programs`, `/programSettings`, `/programGroups` (and the merchant Programs section) with Playwright MCP to discover lease-program configuration — fields, scheduling, grouping, state scoping.
> Origin: user request — origination documentation gap sweep · Overall confidence: high
> NOTE: per-feature discovery knowledge, NOT an execution record.

## What it is for

Lease **programs** are the pre-defined financing products underwriting *selects* from (it does not build them — business-rules §6, "Program Selection and Routing"). A program bundles term length, money factor, EPO terms, fees, cart limits, allowed frequencies, state scoping, and an active window. Programs are bucketed into **Program Groups** and assigned to merchants. The Origination portal exposes three sibling screens plus a read-only merchant sub-section.

## The three screens

| Screen | Route | Purpose | Mutates? |
|---|---|---|---|
| **Programs** | `/programs` | Browse/search the program catalog; `ADD NEW PROGRAM` to create | Create (panel) |
| **Program Settings** | `/programSettings` | Same catalog with the **editable settings form** (`CANCEL` / `SAVE`) | Edit |
| **Program Groups** | `/programGroups` | List of groups + count of programs each contains | View (+ navigate to details) |
| Merchant detail → **Programs section** | `/merchant/{code}` | Read-only program status + Activation/Deactivation tooltip | View only |

> The merchant detail page only *displays* program status + a tooltip with Activation/Deactivation dates; editing is exclusive to Program Settings / Program Details (`merchant-programs-section.page.ts`). `[confirmed via code]`

## Programs catalog (`/programs`)

- Heading `PROGRAMS`; **~422** programs in stg `[observation, 2026-06-25]` (volatile — `programs.page.ts` comments cite ~1817 rows in another env/time; counts drift, column **names** are stable).
- Controls: `ADD NEW PROGRAM`, `Filters`, `Search`, and a **Program Groups** dropdown filter. `[confirmed]`
- Columns: **Program Name · Term Months · Lending Category · Type · Money Factor · Pay Off Discount · Processing Fee Override · EPO Days · EPO Fee Percent · Activation Date · Deactivation Date · Status · Group Name · Amount at Signed · States**. `[confirmed]`
- `Type` observed value: `LTO` (lease-to-own / Lending Category). Term Months observed: `13`, `16`. `[confirmed]`
- `States` is a comma-list scoping the program to specific states (e.g. one program scoped to `WV` only, another to `ALL OTHER` minus the explicitly-scoped states). `[confirmed]`

## Program Settings — editable fields (`/programSettings`)

Heading `PROGRAM SETTINGS`, with `CANCEL` / `SAVE`. The same 422-row catalog drives an editable form exposing (labels observed):

- Program Group, Term Months, Money Factor, Pay Off Discount
- EPO Days, EPO Fee Percent
- Minimum Cart Amount, Max Cart Amount
- Activation Date, Deactivation Date *(the "Schedule Program Activation and Deactivation Dates" feature)*
- Dealer Discount Override, Processing Fee Override
- Lending Category, Allowed Frequency Override
- Amount Charged at Signing

`[confirmed]` (label set). `program-details.page.ts` is the page object for this panel (it normalizes date inputs to MM/DD/YYYY and reads a Notes/Activity-Log table on the panel).

## Program Groups (`/programGroups`)

- Heading `PROGRAM GROUPS`; **25** groups in stg. `[confirmed]`
- Columns: **Group Name · Programs (count) · Edit**. `[confirmed]`
- Example groups: `16-month Program - 2.0x $49 Processing Fee` (18 programs), `16-month Program - 2.3x $99 Processing Fee` (18). `[confirmed]`
- Per `program-groups.page.ts` (Task #1260): an info icon opens a modal with a FilterTable of the group's programs and **navigation links to Program Details**. `[confirmed via code]`

## ADD NEW PROGRAM — create form (`/programs/new`, "PROGRAM DETAILS")

Clicking `ADD NEW PROGRAM` navigates to `/programs/new`. Fields: Program Name, Term Months, **Activation Date**, **Deactivation Date** (`MM/DD/YYYY`), Money Factor, Pay Off Discount, EPO Days, EPO Fee Percent, Minimum Cart Amount, Max Cart Amount, Dealer Discount Override, Processing Fee Override, **Allowed Frequency Override** (`WEEKLY`, `BI_WEEKLY`, …), **Lending Category** (`LTO`, …), Amount Charged at Signing, **Program Group**, **States** (full state checklist). Actions: **Clone**, **Clone Group**, `CANCEL`, `SAVE`. `[observation, live stg 2026-06-25]` (the URL became `/programs/new` on click). **Code-vs-live note (audit 2026-06-25):** the page objects model `/programs` as a **single 2-pane layout** (`ProgramsListPage` left + `ProgramDetailsPage` right panel for both create and edit) and **no code/test references `/programs/new` or `/programSettings`** as routes. The live app *does* expose those routes (I navigated to them), so this is likely app-vs-page-object drift — the panel and the route may be two front-ends to the same `ProgramDetailsPage`. "Clone Group" lets you spin a per-state set from an existing group.

## Business rules / observations

- RN-01: **A program is scoped to a set of states**; the same logical program is cloned per state group (e.g. `2026 16-month BDS Program - 2.0x` exists as `- WV`, `- IN`, `- SC`, `- NY`, `- CA`, `- CT`, and `- ALL OTHER` variants). *(evidence: /programs rows)* `[confirmed]`
- RN-02: **Activation/Deactivation dates define the active window**; `Status` (`Active`/…) reflects it. Empty dates render as `—` and the program is open-ended. *(evidence: catalog rows show `——` + `Active`)* `[confirmed]`
- RN-03: Money Factor differs by term — observed `0.00180` (16 MO test program) vs `0.18460` (13 MO test program). Pay Off Discount and Processing Fee Override are per-program. *(evidence: catalog rows)* `[confirmed]`
- RN-04: Programs feed underwriting's 13-vs-16 routing (business-rules §6). The `planId` (WK13/BWK16/SM13/MN16) identifies frequency+term; programs are *selected*, not built, at submit time. `[connection]`

## Connections with what we already knew

- Confirms business-rules §6 "Programs are pre-defined — underwriting selects, it does not build them."
- The Activation/Deactivation columns are the UI of the scheduling feature referenced across `programs-list.page.ts` / `program-details.page.ts`.
- `Group Name` column ties each program to a Program Group (the grouping browsed in `/programGroups`).

## Gaps / to investigate

- Full **ADD NEW PROGRAM** create-panel field set + validation (required fields, date ordering Activation < Deactivation, money-factor format).
- The **Notes/Activity-Log** entries generated on a program edit (who/what/when) — `ProgramNoteEntry` shape exists in code; live content not captured.
- **Allowed Frequency Override** option list and **Lending Category** enum values.
- How a group is created/edited (the `Edit` action on `/programGroups`).
- Effect of `Remove All Programs from Merchant(s)?` (lives on Merchant Setting) on this catalog.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`
