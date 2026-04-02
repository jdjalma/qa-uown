# MEMORY — subagent-spec-test

## Origination Filter Patterns (discovered 2026-03-31, task #1205)

### React Select types used in Origination portal:
- **multi-select**: Overview (Merchant + Location), Open to Buy (Merchant + Location)
- **single select (type: 'select')**: Leads (Merchant + Location), New Application (Merchant + Location), Sales Rep panel (Merchant + Location)

### Select All mutual exclusivity (multi-select only):
- Source: `../origination/pages/openToBuy/index.tsx` lines 57-80 (`handleMerchantChange`)
- Pattern: `prevHadAllOnly` → selecting specific removes Select All; not having Select All → selecting "all" removes specifics
- `value === 'all'` identifies the Select All option

### Location → Merchant auto-populate (single-select):
- Source: `../origination/utils/get-leads-by-criteria-table-config/index.tsx` lines 255-278
- Uses `merchantObject.find(m => m.location === locationValue)` → auto-sets `merchantName` field

### Clear Merchant → reset Location (single-select):
- Source: same file lines 233-236
- `setLocationNames([])` + `formik.setFieldValue('location', '')`

### Sales Rep panel (`CollapsableEditLayout`):
- Source: `../origination/components/customer-info-panels/sales-rep.tsx`
- Must enter write mode (click edit icon) before dropdowns become editable
- `isWriteMode` state controls read-only vs editable
- `getLocationNamesByMerchant` API call on merchant change

### Key file locations:
- Overview filter config: `../origination/utils/overview-table-config/index.tsx`
- Leads filter config: `../origination/utils/get-leads-by-criteria-table-config/index.tsx`
- New Application filter: `../origination/utils/new-application-table-config/index.tsx`
- Open to Buy page: `../origination/pages/openToBuy/index.tsx`
- Sales Rep panel: `../origination/components/customer-info-panels/sales-rep.tsx`

## Origination Auth in task-testing
- `tests/auth.setup.ts` has origination auth COMMENTED OUT
- task-testing project does NOT use pre-existing storageState
- Tests must login inline or handle auth within the test

## UI-only tasks and Triple Validation
- When a task is purely UI filter behavior (no new API endpoint, no DB table change), triple validation does NOT apply
- Document explicitly in SPEC why it's N/A
- Still validate: UI rendering + UI state (dropdown values, placeholder text, auto-populated fields)
