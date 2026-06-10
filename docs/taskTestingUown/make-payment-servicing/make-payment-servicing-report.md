> **Este arquivo é registro de execução, NÃO fonte de padrão.** (CLAUDE.md regra #16)
> Reports em `docs/taskTestingUown/` são histórico. NÃO inferir selectors, helpers,
> classificações ou page objects a partir deste arquivo — patterns vivem em
> `.claude/skills/` e no código (`src/`, `tests/`). leadPk/accountPk listados aqui
> são voláteis (categoria volatile — podem ter sumido do DB). Toda asserção técnica
> carrega source-tag fresca desta execução.

# Task Report — make-payment-servicing

## Metadata
- **Task ID:** make-payment-servicing (suite em `tests/e2e/servicing/`, não-task GitLab)
- **Source:** N/A (E2E suite interna)
- **Implementer:** qa-implementer / qa-debugger
- **Run date:** 2026-06-01 17:00 (dev3)
- **Environment:** dev3
- **Branch:** dev
- **Ciclo de validação:** 2/3

## Status final
**PASS** — Os 3 cenários passaram com dados fresh por teste (lead/account novos via
automação, happy path completo até ACTIVE). Evidência real (accountPk, leadPk, DB
values, activity log) capturada por cenário. Duas descobertas confirmadas e
documentadas (ACH assíncrono; overpayment aceito intencionalmente).

## Test Suite
- **Spec file:** `tests/e2e/servicing/make-payment-servicing.spec.ts`
- **Project:** `servicing-ui`
- **Total scenarios:** 3 (+2 auth.setup)
- **Passed:** 5 (2 auth.setup + S1 + S2 + S3) / **Failed:** 0 / **Skipped:** 0
- **Duration:** 3.6m (S1 1.1m, S2 47.8s, S3 1.5m)
- **Comando:** `ENV=dev3 npx playwright test tests/e2e/servicing/make-payment-servicing.spec.ts --reporter=list --timeout=300000`

## Scenarios

### Scenario 1 — Make CC Payment (happy path) of $100
- **Status:** ✅ PASS
- **Persona:** agent (manager)
- **Setup (beforeEach):** ✅ OK — `leadPk=1329`, `leadUuid=a1363906-d72c-4024-8fcd-05994408d571`, `accountPk=156`, merchant `OL90294-0001` (preflight bypassed via `MERCHANT_PREFLIGHT_SKIP=true`), `esignClient=SIGNWELL`, `totalContractAmount=8700.32`, applicant `TestFNeye TestLNeye` / CA.
- **Evidence (fresh, esta execução):**
  - Toast: `"Payment successful."`
  - `uown_sv_payment` pk=2556, paymentType=CC, amount=100.00, is_credit_card=true
  - CC SALE tx pk=3319, amount=100.00, status=APPROVED
  - CC grid (UI, regra #14): tx 3319 status=APPROVED renderizado
  - Activity log DATA_CHANGE: `ADDED : Payment[ paymentType=CC , paymentAmount=100.0 , paymentDate=2026-06-01 ]`
  - Activity log CREDIT_CARD: `Updated Credit Card Transaction Type : SALE, postingDate : 2026-06-01, Amount : $100.0, Status : APPROVED, On Card 0055, Charge Fee : true`
  - Activity log CORRESPONDENCE: `Created PaymentReceiptEmail to be sent as EMAIL`
- **Coverage assessment:** Adequate — UI (toast + grid) + DB (payment + CC SALE) + activity log (3 trilhas) cobertos.

### Scenario 2 — Make ACH Payment (one-time bank) of $100
- **Status:** ✅ PASS
- **Persona:** agent (manager)
- **Setup (beforeEach):** ✅ OK — `leadPk=1330`, `accountPk=157`, applicant `TestFNjj TestLNjj` / CA, `totalContractAmount=5095.12`.
- **Evidence (fresh, esta execução):**
  - Toast: `"Payment successful."`
  - `uown_sv_achpayment` pk=137, status=PENDING, amount=100.00, achProcessType=REQUEST
  - Activity log: `ADDED : ACHPayment[ customerFirstName=Testfnjj , customerLastName=Testlnjj , status=PENDING , achProcessType=REQUEST , amount=100 , postingDate=2026-06-01 ]`
- **Coverage assessment:** Adequate para o efeito síncrono. Efeito pós-sweep (PICKED_TO_SEND + `uown_sv_payment`) é intencionalmente fora de escopo (ver Descoberta 1).

### Scenario 3 — Overpayment é aceito (comportamento esperado)
- **Status:** ✅ PASS
- **Persona:** agent (manager)
- **Setup (beforeEach):** ✅ OK — `leadPk=1331`, `accountPk=158`, applicant `TestFNglb TestLNglb` / CA, `totalContractAmount=7707.04`.
- **Evidence (fresh, esta execução):**
  - Contract balance lido do painel = `7707.04` → overpayment amount = `7708.04` (balance + buffer 1)
  - Toast: `"Payment successful."` (sem erro)
  - `uown_sv_payment` pk=2557, paymentType=CC, amount=7708.04 (= valor submetido, acima do saldo)
  - CC SALE tx pk=3321, amount=7708.04, status=APPROVED
  - Activity log DATA_CHANGE: `ADDED : Payment[ paymentType=CC , paymentAmount=7708.04 , paymentDate=2026-06-01 ]`
- **Coverage assessment:** Adequate — confirma que o portal aceita pagamento > saldo, cria a `uown_sv_payment`, gera CC SALE APPROVED e registra o log. Reembolso do excedente é tratado por processo separado de back-office (fora do escopo deste fluxo de portal).

## Descobertas documentadas

### Descoberta 1 — ACH é assíncrono
O efeito imediato e determinístico de um submit ACH via UI é uma row em
`uown_sv_achpayment` inserida SINCRONAMENTE em `status='PENDING'` (amount=100.00,
achProcessType=REQUEST). O daily ACH sweep (~16:45 dev3 / ~19h prod) é quem depois
promove para `PICKED_TO_SEND`, atribui a PROFITUITY e cria a row `uown_sv_payment`
para ACH. **Asserção correta:** `PENDING` em `uown_sv_achpayment` — NÃO
`PICKED_TO_SEND` (dependeria do batch agendado) e NÃO `uown_sv_payment` (só pós-sweep).
Activity log síncrono é `ADDED : ACHPayment[...status=PENDING...]`, NÃO
`ADDED : Payment[paymentType=ACH]` (essa forma DATA_CHANGE é CC/pós-sweep).
- **Fonte primária:** execução fresh dev3 acct 157 / achpayment pk 137 (toast + DB + log capturados acima).

### Descoberta 2 — Overpayment é aceito intencionalmente
Decisão do usuário (2026-06-01): submeter CC com amount > saldo **deve funcionar**.
O portal aceita o pagamento, processa o CC SALE (APPROVED) e o reembolso do excedente
acontece em processo separado de back-office. **Não é bug.** S3 foi invertido de
"overpayment rejeitado" (negativo) para "overpayment aceito" (positivo) e agora
assere: toast de sucesso, `uown_sv_payment` no valor submetido, CC SALE APPROVED e
activity log `ADDED : Payment[paymentType=CC]`.
- **Fonte primária:** execução fresh dev3 acct 158 — overpayment $7708.04 sobre saldo
  $7707.04 → toast "Payment successful.", payment pk=2557, SALE tx pk=3321 APPROVED,
  DATA_CHANGE log capturado acima.

## Findings

| ID | Type | Severity | Priority | Description |
|----|------|----------|----------|-------------|
| — | — | — | — | Nenhum bug de produto. S3 reclassificado de negativo→positivo por decisão do usuário (comportamento esperado). |

## Coverage assessment vs Risk

| Risk area | Risk level | Scenarios covering | Adequate? |
|-----------|------------|--------------------|-----------|
| CC payment happy path | High | S1 | ✅ UI + DB + 3 activity logs |
| ACH payment (síncrono PENDING) | Medium | S2 | ✅ UI + DB (achpayment) + activity log |
| Overpayment aceito (esperado) | High | S3 | ✅ UI + DB (payment + CC SALE) + activity log |
| Activity log (regra #13) | High | S1, S2, S3 | ✅ validado em todos |

## Decisions
- **Bugs de produto levantados:** nenhum.
- **Bugs raised (ticket):** nenhum.
- **Observations:** ACH síncrono é PENDING (sweep promove depois); overpayment é aceito por design.
- **Hipótese do implementer (overpayment):** RESOLVIDA — comportamento confirmado como aceitação intencional pelo usuário.

## Handoff
**Ready for: qa-doc-keeper** — pipeline fechado com PASS. As duas descobertas (ACH
assíncrono / overpayment aceito) devem ser catalogadas em [[application-lifecycle]]
e/ou [[payment-flows]] como pitfalls de pagamento Servicing.

Pipeline loop: ciclo 2/3 (validator→debugger). Resolvido neste ciclo.
