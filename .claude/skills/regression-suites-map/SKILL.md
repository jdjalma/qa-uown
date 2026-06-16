---
name: regression-suites-map
description: Use to decide WHICH regression suites a given PR / task / fix must trigger before merge. Map of existing suites (signing-regression, gowsign, ci/unified-flow, smoke, dual-brand) -> activation criteria (what code change activates which suite). Triggers when planning test scope for a fix, when user asks "quais testes rodar?", "qual regressao?", "preciso de cobertura dual-brand?", "rodo so smoke?", on PRs touching `src/api/clients/application.client.ts`, `MissingDataPanel`, Complete page, signing handler, GoSign templates, contract page, sendApplication payload.
disable-model-invocation: true
---

# Regression Suites Map

> Criterios de ativacao por tipo de mudanca. Para inventario detalhado de suites, custos, e spec file listings, ver [references/suites.md](references/suites.md).

## Quando aplicar

Antes de marcar task como pronta para merge. Aplicar quando:
- Fix toca submit handler (`submitApplication`, `MissingDataPanel`, Complete page)
- Fix toca template de signing (placeholders, layout, items purchased table)
- Fix toca rota/payload entre svc e vendor (GoSign, SignWell, DV360)
- qa-flow esta sendo executado
- Usuario pergunta o escopo de regressao

NAO aplicar para: bug fixes locais sem alcance (typo em log, refactor de fixture isolada).

## Criterios de ativacao (decision matrix)

### 1. Mudou sendApplication / submit handler / Complete page / MissingDataPanel

**DUAL-BRAND + LEASE-EDIT OBRIGATORIO:**
- Unified Flow E2E (UOWN TireAgent + Kornerstone KS3015) — CADA cenario, nao smoke
- `new-application.spec.ts` + `new-application-api.spec.ts`
- CT de lease-edit/re-issue: modificar invoice para MAIOR, re-submit, assert single submit (useRef reset)
- UI-only — proibido usar API direta para o Submit
- Activity log + DV360 probe em qa1

### 2. Mudou template signing / GoSign / Items Purchased

**DUAL-PROVIDER + MULTI-STATE:**
- Multi-state Signing Regression (47 states + 4 blocked)
- Diff visual SignWell vs GoSign (pagina 1 tabela, headers, placeholders, branding)
- GowSign suite COMPLETA (18 specs)
- SignWell regression — OBRIGATORIA (coexistencia, refactor pode regredir)

### 3. Mudou roteamento e-sign / deteccao de provider

- Multi-state Signing Regression
- Verificar `uown_esign_document.client` por estado (CA qa2=GOWSIGN, CA stg=SIGNWELL override, outros=SIGNWELL fallback, NJ/VT/MN/ME=BLOCKED)
- INSTORE merchants usam `merchant.state`, nao customer state — usar ONLINE (TireAgent) para multi-state

### 4. Mudou contract page (CC + bank + T&C + iframe)

- Unified Flow E2E
- `credit-card-decline-check.spec.ts` (14 decline cards)
- `seon-e2e-flow.spec.ts` se SEON overlay afetado

### 5. Mudou correspondence / email template

- `finalize-email-518-validation.spec.ts` — BOTH brands (UOWN + Kornerstone)
- Verificar brand -> template_name: UOWN=`FinalizePurchaseEmail`, KS=`KORNERSTONE_FinalizePurchaseEmail`
- Activity log + `uown_email_queue.template_name`

### 6. Mudou modify-lease / cancel-lease / refund

- `paytomorrow-refund-flow.spec.ts` + `modify-lease.spec.ts` + `lease-cancellation.spec.ts` + API variants

### 7. Mudou Protection Plan

- `protection-plan-cancellation.spec.ts`
- CA: PP nao oferecido (restricao regulatoria)
- Buddy widget loop em qa2 (3 cliques)

### 8. Mudou sweep / scheduled task

- Trigger manual via API + DB validation `ORDER BY pk DESC LIMIT 1`
- Settled-In-Full: janela DOW-dependente (Mon-Tue: -4d, Wed: -4/-3/-2, Thu-Fri: -2d)
- Email sweeps: `email-sweeps-servicing.spec.ts` (S1 settledInFull / S2 RecurringPaymentReminder / S3 FirstPaymentReminder)
- **Evidencia primaria = `uown_email_queue` (PK monotonico), NAO `uown_sweep_logs.number_of_records_processed`** (escrito DEPOIS do processamento; leitura imediata retorna 0). Ver [[payment-flows]] secao "Email Sweep validation" + [[application-lifecycle]] pitfalls #87-#90
- `FirstPaymentReminderSweep` exige `sched_summary.first_payment_due_date` E `receivable.due_date` alinhados; `settledInFull` deduplica same-day (Java)

### 9. Mudou Servicing payments / allocation

- Unified Flow E2E Phase 6
- Allocation strategy via Payment History "Update Payment" modal (NAO CC Transactions pencil)

### 10. Mudou SEON ID verification

- `seon-id-verification-bypass.spec.ts` (API) + `seon-e2e-flow.spec.ts` (Hybrid)

### 11. Mudou website portal (OTP, payment, sidebar)

- `login-otp.spec.ts` + Unified Flow Phase 7

### 12. Mudou merchant config / preflight

- Smoke por brand (UOWN + Kornerstone) + validate `ensureMerchantReady`

## Pitfalls

| # | Pitfall | Rule |
|---|---------|------|
| 1 | Reduzir Kornerstone a smoke quando fix afeta submitApplication | Rodar CADA cenario em BOTH brands |
| 2 | Esquecer lease-edit / re-issue | Sempre incluir CT de modificar invoice + re-submit |
| 3 | Rodar so GoSign e ignorar SignWell | Coexistencia: sempre incluir SignWell regression |
| 4 | Bug Daniel's Jewelers CA nao pego por falta de diff visual | Diff visual SignWell vs GoSign mandatorio |
| 5 | INSTORE merchants quebram parametrizacao por state | Usar ONLINE merchants para multi-state coverage |
| 6 | Confiar em STATE_MATRIX sem env-aware helpers | Usar `getGowsignStatesForEnv(env)`, nao constante direta |
| 7 | DV360 outage em qa1 mascara como bug do codigo | Probe DV360 antes de qa-flow em qa1 |
| 8 | qa2 RBAC issue em getMerchantsByRefCode | Pattern defensivo try/catch + proceed |
| 9 | Buddy widget loop em qa2 para Protection Plan | 3 cliques antes de destravar |
| 10 | multi-state-signing exige UI-first | submitPaymentInfoViaApi DROPPED |
| 11 | Skip GoSign signing porque "iframe e flaky" | Use `installPostMessageRecorder` + `signGowSignInFrame` |

## Checklist de escopo (pre-merge)

- [ ] Mudou sendApplication/submit/Complete/MissingDataPanel? -> DUAL-BRAND + LEASE-EDIT + UI-only
- [ ] Mudou template signing? -> Multi-state + GowSign + SignWell + diff visual PDF
- [ ] Mudou routing e-sign? -> Multi-state + INSTORE/ONLINE coverage
- [ ] Mudou contract page? -> Unified + cc-decline + seon-e2e
- [ ] Mudou correspondence/email? -> finalize-email + brand templates
- [ ] Mudou refund/modify-lease? -> PT refund + cancellation suites
- [ ] Mudou Protection Plan? -> PP cancellation + state-aware
- [ ] Mudou sweep? -> Trigger + DB latest-row
- [ ] Mudou Servicing payments? -> Unified Phase 6
- [ ] Mudou SEON? -> API bypass + hybrid UI
- [ ] Mudou website portal? -> website-otp + Unified Phase 7
- [ ] Mudou merchant config? -> smoke por brand
- [ ] Em qa1 com sendApplication? -> probe DV360
- [ ] Activity log validado? (CLAUDE.md regra 13)
- [ ] UI-first respeitado? (CLAUDE.md regra 14)
- [ ] Fresh data? (CLAUDE.md regra 9)

> Inventario detalhado de suites, custos, spec files, e STATE_MATRIX: [references/suites.md](references/suites.md)

## Cross-links

- [[gowsign-knowledge]] — signing provider details
- [[fraud-vendors-knowledge]] — DV360 probe
- [[merchant-preflight]] — merchant config validation
- [[payment-flows]] — payment endpoint details
- [[e2e-examples]] — test structure patterns
