---
title: "Appendix G: Lease Risk Scenarios"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/state-merchant-matrix.ts
  - env: qa2
covers: [risco, lease, rto, estados, merchant-routing, online, instore, blocked-states, ssn]
---

# Appendix G: Lease Risk Scenarios — Knowledge Base for Testing
## UOwn Leasing - SVC Platform

A knowledge base that correlates the risk factors of the US lease market with the business rules implemented on the UOWN platform, for direct use in creating and parameterizing automated tests.

---

## Overview: Real Market ↔ UOWN Implementation

UOWN's business model is **lease-to-own** (RTO — Rent-to-Own). In the US market, this type of operation:
- Is **exempt from usury laws** in most states (technically it is not credit)
- Is regulated by specific RTO legislation in ~40 states
- Applies **differentiated taxation** by state (Sales Tax on Lease)
- Assesses risk via multiple layers (fraud + credit + alternative data)

UOWN implements exactly this layered structure:
```
Fraud (Sentilink → Neustar → LexisNexis → SEON)
    ↓
Credit (GDS → Taktile → ABB/BlackBox)
    ↓
Taxation by state (TaxCloud / TaxJar)
    ↓
EPO with per-state rules
    ↓
Regulatory compliance (blocked states, per-state programs)
```

---

## 1. State Dimension in UOWN

### 1.1 How the State Is Determined

| Merchant Type | State Used | Impact |
|-----------------|-------------|---------|
| **ONLINE** (code starts with OL, ON, or OW90218) | **Customer's** state | Taxes, programs, EPO |
| **INSTORE** (other codes) | **Merchant's** state | Taxes, programs, EPO |

**Impact on tests:** For online merchants (e.g., TerraceFinance `OL90202-0001`), the state of the customer's address in `sendApplication` determines everything. For instore merchants (e.g., Bridge `B082922-0001`), the state is fixed.

### 1.2 Blocked States (No Business)

**Configuration:** `no.business.in.state` — default: **NJ, VT, MN, ME**

```
Pipeline Step 1 → State Check → DECLINED
Lead Status: DENIED
Internal Status: NO_BUSINESS_IN_STATE | NO_PROGRAM_IN_STATE
```

**"Blocked state" test scenario:**
- Customer address in NJ (or VT, MN, ME)
- ONLINE merchant → customer state = NJ
- Pipeline stops at Step 1 → no denial email

### 1.3 Taxation by State — System Behavior

The system uses **TaxCloud or TaxJar** (configurable via `useTaxCloudApi`) to calculate taxes on the lease.

| State | Behavior | Impact on the Calculation |
|--------|--------------|-------------------|
| **OR, AK, DE, MT, NH** | No Sales Tax | `taxAmount = 0` → `baseCost = totalInvoiceAmount` |
| **TX** | Tax upfront on the total amount | High tax can increase the calculated `baseCost` |
| **CA** | Tax on installments + special EPO rule | `EPO = cost × (remainingPayments / totalPayments)` |
| **NY** | Tax on installments + special EPO rule | Same proportional formula as CA |
| **HI, WV** | Special EPO rule | Same proportional formula |
| **NC** | Minimum last payment (11% baseCost) + EPO ≥ last payment | `lastPayment >= baseCost × 0.11` |
| **IL (Chicago)** | Personal Property Lease Tax 15% (since Jan/2026) | Very high tax burden |

### 1.4 Per-State EPO Rules (Priority Cascade)

```
1. epo.discount.for.state.{STATE}         → fixed discount on the amount paid
2. epo.remaining.amount.discount.{STATE}  → discount on the remaining balance
3. epo.discount.on.remaining.for.state.{STATE} → percentage on the balance
4. CA, HI, NY, WV (hardcoded)             → EPO = cost × (remaining/total)
5. merchantProgram.payoffDiscount          → program fallback
```

### 1.5 Security Deposit by State

The `securityDeposit` is configured per state in `state_configurations`. It is charged when:
- Merchant has `holdDeposit = true` **AND** the state has a configured value, **OR**
- Merchant has `checkUwForVerification = true` **AND** UW returned `chargeProcessingFee = true` **AND** the state has a configured value

**Hierarchy (only ONE is charged):**
```
amountChargedAtSigning > processingFee > securityDeposit
```

---

## 2. Risk Scenarios — Complete Mapping

### Scenario 1: Low Risk (Prime/Super-prime)

#### Real Profile (Market)
- FICO: 720+
- DTI: < 36%
- PTI (installment/income): < 5%
- Employment: W-2, 2+ years
- RTO history: clean

#### UOWN Test Data

| Field | Value | Reason |
|-------|-------|-------|
| **SSN** | does NOT end in 9 (e.g., `XXX-XX-0001`) | `UW_APPROVED` in sandbox |
| **State** | CA, TX, FL, GA, CO | Active programs, no blocking |
| **Merchant** | `TerraceFinance` (OL90202-0001) | ONLINE, non-Kornerstone, stable sandbox |
| **Lease amount** | $800–$1,500 | Within the program's `minCartAmount`–`maxCartAmount` |
| **Frequency** | WEEKLY or BI_WEEKLY | More installments = lower perceived PTI |
| **Routing/BIN** | Provide bank data + eligible BIN | Activates the Kornerstone flow (16 months) if the merchant supports it |

#### Expected Pipeline
```
Step 1: State Check          → PASS (active state)
Step 4: Blacklist            → PASS (new/unique data)
Step 11: NeuroID             → PASS (sandbox usually ignores)
Step 12: UW (BlackBox)       → UW_APPROVED (SSN does not end in 9)
Step 17: Calculator          → schedule generated

→ UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

#### DB Checks
```sql
SELECT lead_status, internal_status FROM uown_los_lead WHERE pk = $leadPk;
-- Expected: FUNDED

SELECT lambda_segment, risk_type, max_approved_amount_cr
FROM uown_los_uwdata WHERE lead_pk = $leadPk;
-- Expected: low lambda_segment (1-3), risk_type PRIME or GOOD
```

#### Financial Calculation (Example)
```
Product: $1,000 (state CA, no taxUpfront)
MoneyFactor: 0.15/month × 13 months = 1.95 total
Contract: $1,000 × 1.95 = $1,950
EPO (CA): $1,000 × (remainingPayments / totalPayments)
```

---

### Scenario 2: Medium Risk (Near-prime)

#### Real Profile (Market)
- FICO: 620–659
- DTI: 38–45%
- PTI: 5–10%
- Employment: 1099, < 1 year
- RTO history: 1–2 resolved late payments

#### UOWN Test Data

| Field | Value | Reason |
|-------|-------|-------|
| **SSN** | does NOT end in 9 | Approved by UW, but with a lower limit |
| **State** | TX, OH, GA | Available programs, no special EPO rule (simpler) |
| **Merchant** | `TerraceFinance` or `BuyOnTrust` (OL90544-0001) | ONLINE, accepts more varied profiles |
| **Lease amount** | $400–$800 | Conservative range for the near-prime segment |
| **Frequency** | MONTHLY | Larger monthly installments reveal the real PTI |
| **Bank data** | Present but BIN without long history | May fall into the UOWN flow (13 months) |
| **Employment** | `nextPayDate` near, `payFrequency` configured | Validates the employment Step in Missing Fields |

#### Difference vs. Low Risk
- Higher `lambdaSegment` (4–7) → lower `maxApprovedAmountCR`
- May trigger **Plaid** as a second chance if `UW_REVIEW` (lambda in the configured range)
- Approval limit may be lower than the cart amount → Step 15 triggers (item split or partial denial)

#### Expected Pipeline
```
Step 12: UW → UW_APPROVED (SSN does not end in 9)
             OR UW_REVIEW → Plaid (if the merchant enables it and lambda is in range)

→ UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

#### DB Checks
```sql
-- Check the risk segment
SELECT lambda_segment, risk_type, credit_limit
FROM uown_los_uwdata WHERE lead_pk = $leadPk;
-- Expected: lambda_segment 4-7, risk_type FAIR or GOOD

-- Check whether Plaid was triggered
SELECT lead_status FROM uown_los_lead WHERE pk = $leadPk;
-- Expected intermediate: UW_REVIEW (before Plaid) → UW_APPROVED (after Plaid)
```

#### Financial Calculation (Example — TX)
```
Product: $600 (state TX — tax upfront)
TX Tax: ~8.25% = $49.50 upfront
baseCost = $600 - $49.50 = $550.50 (used in the calculation)
Contract: $550.50 × 0.15 × 13 = $1,073.47
```

---

### Scenario 3: High Risk / Denial (Subprime/Denied)

#### Real Profile (Market)
- FICO: < 580 or thin file
- DTI: > 50%
- PTI: > 10%
- Employment: gig/informal, irregular income
- RTO history: repossession or active collections

#### UOWN Test Data

| Field | Value | Reason |
|-------|-------|-------|
| **SSN** | **Ends in 9** (e.g., `XXX-XX-0009`) | `UW_DENIED` in sandbox |
| **State** | Any active state | State does not matter — UW denies first |
| **Merchant** | Any | UW is step 12, does not depend on the merchant |

#### Denial Sub-scenarios

| Sub-scenario | Trigger | Step | Final Status |
|-------------|---------|------|-------------|
| **UW Denied (SSN 9)** | SSN ends in 9 | Step 12 | `UW_DENIED` + email sent |
| **Blocked state** | Address in NJ/VT/MN/ME (ONLINE merchant) | Step 1 | `DENIED` / `NO_BUSINESS_IN_STATE` — no email |
| **Blacklist** | Data in the `uown_blacklist_*` table | Step 4 | `DENIED` / `BLACKLIST_DENIED` — no email |
| **No program in state** | Merchant without an active program for the state | Step 1 | `DENIED` / `NO_PROGRAM_IN_STATE` — no email |
| **Amount below minimum** | Cart < `minimumLeaseAmount` ($250 default) | `sendApplication` | Error 400, lead not created |
| **Amount above approval** | Cart > UW `creditLimit`, no item split | Step 15 | `DENIED` / `NO_REMAINING_AMOUNT` |
| **Duplicate** | Same email/phone in 3+ leads | Step 9 | `DENIED` / `EMAIL_COUNT_FAILED` |
| **Re-approval denied** | Existing delinquent account | Step 10 | `DENIED` / ineligible |
| **Prior UW denied** | Recently denied, no override | Step 7 | `UW_DENIED` + email |

#### DB Checks
```sql
-- Confirm UW denial
SELECT lead_status, internal_status
FROM uown_los_lead WHERE pk = $leadPk;
-- Expected: lead_status = UW_DENIED, internal_status = UW_DENIED

-- Confirm denial email sent
SELECT * FROM uown_email_queue
WHERE lead_pk = $leadPk AND email_type LIKE '%DENIED%'
ORDER BY row_created_timestamp DESC LIMIT 1;
-- Present for UW_DENIED; ABSENT for BLACKLIST_DENIED, STATE_DENIED
```

---

## 3. Decision Matrix: Risk × State × Merchant

| Combination | Expected Result | Note |
|-----------|-------------------|-----------|
| SSN≠9 + CA + TerraceFinance | `FUNDED` + proportional CA EPO | Standard low-risk flow |
| SSN≠9 + NC + TerraceFinance | `FUNDED` + last payment ≥ 11% baseCost | NC minimum-payment rule |
| SSN≠9 + NJ + TerraceFinance (ONLINE) | `DENIED` / NO_BUSINESS_IN_STATE | NJ blocked — Step 1 |
| SSN=9 + TX + any merchant | `UW_DENIED` + email | Step 12 — SSN 9 = sandbox denial |
| SSN≠9 + KS3015 (FifthAveFurnitureNY) + banking+BIN | `FUNDED` via Kornerstone 16 months | KW flow — special EPO formula |
| SSN≠9 + KS3015 + no banking | `FUNDED` via UOWN 13 months | Fallback without bank data |
| Cart $249.99 + merchant min $250 | Error 400 in `sendApplication` | Pre-pipeline validation |

---

## 4. Program Routing (13 vs 16 Months)

The program selection after UW determines the flow and the money factor:

```
Condition 1: banking data present AND eligible BIN
    → Kornerstone flow
    → Tries the 16-month program first
    → Fallback to 13 months if 16 is not available/valid
    → Merchant: FifthAveFurnitureNY (KS3015), Kornerstone (GOW-0003_clone_fer_ks)

Condition 2: no banking OR BIN not eligible
    → UOWN flow
    → Only 13 months
    → Merchant: TerraceFinance, BuyOnTrust, etc.
```

**Generated planId:**
| Frequency + Term | planId |
|-------------------|--------|
| Weekly 13 months | `WK13` |
| Bi-weekly 16 months | `BWK16` |
| Semi-monthly 13 months | `SM13` |
| Monthly 16 months | `MN16` |

---

## 5. Fraud Detection Layers (Specific Scenarios)

For tests that verify fraud rejection (beyond SSN 9):

| Service | What it tests | How to simulate in sandbox |
|---------|------------|------------------------|
| **Sentilink** | Synthetic identity | Scores configured per threshold per merchant |
| **Neustar** | Contact inconsistency | Prepaid phone, new email, invalid address |
| **LexisNexis** | Public records | Score configured per threshold |
| **SEON** | Digital footprint | VPN IP, disposable email, VoIP phone |
| **NeuroID** | Behavioral biometrics | Copy/paste in the form, abnormal speed |
| **Kount** | Card fraud | BIN of a stolen/compromised card |
| **Blacklist** | Previously flagged data | Insert data into `uown_blacklist_*` via Admin |

---

## 6. Impact of Taxation on Test Calculations

When writing assertions about financial values, consider:

```typescript
// ONLINE merchant → the customer's address state defines the tax
// baseCost = totalInvoiceAmount - taxAmount - depositAmount
// contractAmount = baseCost × moneyFactor × termMonths

// States without tax (OR, AK, DE, MT, NH):
// taxAmount = 0 → baseCost = totalInvoiceAmount → maximum contract

// TX (high tax upfront):
// high taxAmount → lower baseCost → smaller contract than in OR

// CA/NY/HI/WV (proportional EPO rule):
// EPO = cost × (remainingPayments / totalPayments)
// Do NOT use fixed epoDays in assertions in these states
```

---

## 7. Quick Merchant Reference for Each Risk Scenario

| Scenario | Recommended Merchant | Number | Flow | Reason |
|---------|---------------------|--------|-------|--------|
| Low risk — standard | `TerraceFinance` | OL90202-0001 | UOWN 13m | ONLINE, stable, non-KS |
| Low risk — Kornerstone | `FifthAveFurnitureNY` | KS3015 | KS 16m/13m | Requires banking+BIN |
| Medium risk | `TerraceFinance` or `BuyOnTrust` | OL90202-0001 / OL90544-0001 | UOWN 13m | Accepts SSN≠9 with a lower limit |
| High risk / UW denial | Any | Any | Stops at Step 12 | SSN ends in 9 |
| Blocked state | `TerraceFinance` | OL90202-0001 | Stops at Step 1 | Customer address NJ/VT/MN/ME |
| CA EPO rule | `TerraceFinance` | OL90202-0001 | Proportional EPO | Customer address CA |
| NC rule | `TerraceFinance` | OL90202-0001 | Last payment ≥ 11% | Customer address NC |

---

## 8. Critical Fields in `sendApplication` by Scenario

```typescript
// Low Risk
{
  ssn: '123-45-0001',          // does NOT end in 9
  state: 'CA',                  // active state, proportional EPO
  merchandiseSubtotal: 1000,    // above the minimum ($250)
  routingNumber: '021000021',   // bank data present
  accountNumber: '12345678'     // for the Kornerstone flow (if the merchant supports it)
}

// Medium Risk
{
  ssn: '123-45-0002',           // does NOT end in 9
  state: 'TX',                  // no special EPO rule, tax upfront
  merchandiseSubtotal: 600,     // conservative range
  routingNumber: undefined,     // no banking → UOWN 13m
}

// High Risk (Denial)
{
  ssn: '123-45-0009',           // ENDS IN 9 → UW_DENIED
  state: 'FL',                  // any active state
  merchandiseSubtotal: 900,
}

// Blocked State
{
  ssn: '123-45-0001',           // SSN OK, but the state blocks
  state: 'NJ',                  // NO_BUSINESS_IN_STATE
  merchantNumber: 'OL90202-0001' // ONLINE → uses the customer's state
}
```

---

## 9. Sources and Cross-References

| Topic | File |
|--------|---------|
| Pipeline 17 steps | `docs/business-rules/02-originacao-pipeline.md` |
| Money factor, security deposit, processing fee | `docs/business-rules/01-fundamentos.md` |
| EPO calculation and per-state rules | `docs/business-rules/04-calculos-financeiros.md` |
| Contracts and e-sign | `docs/business-rules/03-contratos-esign.md` |
| Payments and sweeps | `docs/business-rules/05-pagamentos.md` |
| Enums and constants (lead status, etc.) | `docs/business-rules/appendix-d-constantes-enums.md` |
| UW campaigns by client type | `docs/business-rules/appendix-e-campanhas-uw.md` |
| DB tables for verification | `docs/business-rules/appendix-c-tabelas-banco.md` |
| Catalog of test merchants | `src/data/merchants.ts` |
| DB helpers for assertions | `src/helpers/database.helpers.ts` |
