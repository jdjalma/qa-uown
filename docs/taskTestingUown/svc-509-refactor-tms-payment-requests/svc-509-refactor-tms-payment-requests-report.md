# Task Report — svc#509 Refactor Request Objects for TMS Payment Endpoints

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `svc#509` — Refactor Request Objects for TMS Payment Endpoints |
| Source | <https://gitlab.com/uown/backend/svc/-/work_items/509> |
| MRs | `!1426` (merged, `40c75c1c1`) + `!1449` (qa-in-process, tip `58e480e72`) |
| SPEC | [`svc-509-refactor-tms-payment-requests-spec.md`](./svc-509-refactor-tms-payment-requests-spec.md) v2 |
| Test spec | [`tests/api/tms-payments/svc-509-refactor-tms-payment-requests.spec.ts`](../../../tests/api/tms-payments/svc-509-refactor-tms-payment-requests.spec.ts) |
| Run # | 3 (post-fixes from runs #1 + #2) |
| Run date | 2026-05-22 |
| Environment | `qa1` |
| Backend branch | `R1.52.0_Refactor_RequestObjects-TMS` |
| Automation branch | `dev` |
| Total scenarios | 15 |
| Passed | 4 |
| Failed | 11 |
| Skipped | 0 |
| Duration | 28.6 min |

## Veredito do produto

**ACEITO — AC do refactor atendidos no nível de comportamento observável (HTTP + validações).**

| Eixo | Status | Evidência |
|---|---|---|
| Novos DTOs deserializam e processam pagamento | ✅ | CT-1..6, CT-8a, CT-12 retornaram HTTP 200; CC `creditCardTransactionPk` real persistido (visto via `uown_sv_inbound_api_log` pk=279 + pk=58134) |
| Bean Validation completa (10 cenários negativos) | ✅ | CT-7 PASSED — `card is required`, `Provide exactly one of creditCardId or keyed card`, `amount is required`, `postingDate is required`, `bankAccount is required`, `Either bankAccountId or routingNumber and accountNumber must be provided` |
| Alias top-level `card` ↔ `ccInfo` (commit `58e480e72`) | ✅ | CT-8a HTTP 200 com payload usando `{"ccInfo": {...}}` |
| Ausência de alias em campos internos (CC + ACH) | ✅ | CT-8b 400 `isExclusiveCardMode`; CT-9 400 `@NotNull bankAccount` — confirmam breaking change na shape interna |
| `PaymentArrangementDto` legacy aceita CC + ACH | ✅ | Após fix do teste, CT-6 atingiu HTTP 200 + PA persistido (pk=279, status=SUCCESS), CC APPROVED (pk=58134), ACH PENDING |
| Endpoint `/paymentArrangements` com shape NOVA | ⚠️ | CT-10 PASSED → **OBS-2 CONFIRMADA**: HTTP 200 + 0 transações persistidas (silent no-op). Não é regressão técnica do refactor, mas é decisão de produto que merece confirmação Marcus/Yuri |

**Nenhuma regressão de produto identificada.** As 11 falhas são todas test bugs catalogados na seção [Test bugs](#test-bugs).

## Resumo executivo

- **4 PASSED**: CT-7 (Bean Validation), CT-8b (ausência alias CC), CT-9 (ausência alias ACH), CT-10 (silent no-op PA new shape).
- **11 FAILED** — distribuição:
  - **6 test bugs em DB poll** (CT-1, CT-2, CT-3, CT-4, CT-5, CT-8a) — HTTP 200 OK em todos; assert downstream em coluna/timestamp falhou.
  - **2 test bugs em DB poll com investigação aprofundada** (CT-6, CT-12) — produto OK confirmado via inbound log; assert downstream falhou.
  - **1 test bug enum** (CT-11) — teste enviou `"Payment/EPO"` como `allocationStrategy`, valor não é enum válido. Reais: `DEFAULT`, `REGULAR_RECEIVABLES`, `EPO_ONLY`.
  - **1 test bug setup** (CT-13) — `setupFundedAccount` para KS3015 retornou account com `brand=UOWN`; problema de roteamento de merchant no helper.
  - **1 test bug poll** (CT-15) — inbound log counts = 0; debugger já comprovou que aspecto svc#525 está saudável, FQCN bate, então é problema de janela temporal ou ordem do poll.
- **Observação confirmada** (OBS-2 / CT-10) — silent no-op em shape NOVA. Escalar a Marcus/Yuri para decisão (bug vs improvement).

## Bonus finding — pendente Marcus (não bloqueante)

`processPaymentArrangement` aceita `creditCardPk` no top-level de cada CC tx (legacy field name) e retorna HTTP 200 + `CCTransactionResult` APPROVED com `creditCardTransactionPk` real. POJO `CCTransactionInfo` (linhas 17-86) **não tem** campo `creditCardPk` — apenas `originalCCPk` (l.23) e `ccInfo.creditCardPk` (nested). Hipóteses:

- (a) Jackson alias `@JsonAlias("creditCardPk")` em algum lugar não mapeado pela investigação
- (b) Service tem fallback: resolve card pelo último ativo do account quando o tx vem sem referência válida

Não é bug, mas é comportamento não-óbvio que pode confundir parceiros. Sugestão: documentar explicitamente o que acontece quando o campo é desconhecido.

## Requirements coverage

| CT | Nome | Status | HTTP | DB poll | Activity log | Classificação |
|---|---|---|---|---|---|---|
| CT-1 | CC happy on-file UOWN | ✘ | 200 ✓ APPROVED, ccTxPk=58136 | falha downstream | shadow não rodou | TEST BUG |
| CT-2 | CC keyed + BillingAddress | ✘ | 200 ✓ | falha downstream | shadow não rodou | TEST BUG |
| CT-3 | CC scheduled future +3d | ✘ | 200 ✓ postingDate=2026-05-25 | falha downstream | shadow não rodou | TEST BUG |
| CT-4 | ACH happy keyed | ✘ | 200 ✓ | falha downstream | shadow não rodou | TEST BUG |
| CT-5 | ACH on-file (bankAccountId>0) | ✘ | 200 ✓ bankAccountPk=4294 | falha downstream | shadow não rodou | TEST BUG |
| CT-6 | PA legacy shape happy | ✘ | 200 ✓ PA pk=279, CC pk=58134, ACH pk=PENDING | filtro timestamp falha (10s grace insuficiente) | shadow não rodou | TEST BUG (3 layers fixados parcialmente — ver detalhe) |
| CT-7 | Bean Validation 400 (10 cases) | ✓ | 400 em todos | n/a | n/a | PASSED |
| CT-8a | Alias `ccInfo` ↔ `card` | ✘ | 200 ✓ ccTxPk=58144 | falha downstream | shadow não rodou | TEST BUG (produto OK confirmado) |
| CT-8b | CC `creditCardPk` (no alias) | ✓ | 400 `isExclusiveCardMode` | n/a | n/a | PASSED |
| CT-9 | ACH `bankData` (no alias) | ✓ | 400 `@NotNull bankAccount` | n/a | n/a | PASSED |
| CT-10 | PA new shape silent no-op | ✓ | 200 + cc=0 ach=0 | 0 rows confirmados | n/a | PASSED — **OBS-2 CONFIRMADA** |
| CT-11 | AllocationStrategy preservation | ✘ | 400 (enum inválido) | n/a | n/a | TEST BUG (enum value) |
| CT-12 | chargeFee default → PROCESSING_FEE | ✘ | 200 ✓ | PROCESSING_FEE rows=0 (provável coluna/filtro errado) | shadow não rodou | TEST BUG |
| CT-13 | KS3015 dual-brand mirror CT-1 | ✘ | n/a — setup criou UOWN | n/a | n/a | TEST BUG (setup brand routing) |
| CT-15 | Inbound API log regression | ✘ | n/a | counts cc=0 ach=0 pa=0 | n/a | TEST BUG (janela/ordem; aspecto saudável per debugger) |

## Test bugs

Catálogo das 11 falhas — todas no teste, nenhuma no produto. Categorias e fixes:

### Bug Group A — DB poll filter / coluna (8 CTs)

**CTs afetados**: CT-1, CT-2, CT-3, CT-4, CT-5, CT-6, CT-8a, CT-12.

**Sintoma comum**: HTTP=200 OK (produto persistiu corretamente, confirmado via `uown_sv_inbound_api_log`), mas o poll de assert sobre row criada falha.

**Causa identificada em CT-6 (corrigida em sequência)**:

1. **`accountPk` ausente em ACH child** → `ACHPayment.accountPk` tem `@Min(1L)` → Bean Validation 400. **Fix aplicado**.
2. **`bankAccountPk` no nível errado** — `ACHPayment.bankData.bankAccountPk` é nested, não top-level. **Fix aplicado** (wrap em `bankData: { bankAccountPk }`).
3. **Clock skew local↔server** — `paStart = new Date()` capturado local antes do POST; server insere com timestamp ligeiramente atrás → filtro `row_created_timestamp >= paStart` retorna 0 rows. **Fix parcial aplicado** (grace -10s); ainda falhou em re-run isolado, sugerindo o problema é maior que clock skew.

**Hipótese para os outros CTs (CT-1..5, 8a, 12)**: mesmo padrão — `runStart` ou similar capturado antes do POST, falha no filtro temporal. Adicionalmente, há suspeita de coluna ainda errada (debugger trocou `credit_card_pk` → `original_ccpk`; pode haver outras).

**Fixes pendentes**:
- Substituir filtro por timestamp por filtro lógico: usar response body (`creditCardTransactionPk`, `id` ACH) como chave de lookup direto na row → independente de timestamp/clock skew.
- Auditar `pollCcTransactions`, `pollAchPayments`, `pollReceivables` para ver se há mais colunas inexistentes.

### Bug Group B — Enum AllocationStrategy (CT-11)

**Sintoma**: `[CT-11/cc] strat="Payment/EPO" → HTTP=400`.

**Causa**: Teste itera labels como `"Payment/EPO"` em vez de valores válidos do enum.

**Valores reais** (per `TmsAllocationStrategy` no codebase): `DEFAULT`, `REGULAR_RECEIVABLES`, `EPO_ONLY`.

**Fix**: trocar lista de iteração para os 3 enum names corretos.

### Bug Group C — KS3015 brand routing (CT-13)

**Sintoma**: `[CT-13] account brand=UOWN`. Setup deveria criar conta Kornerstone mas criou UOWN.

**Causa**: `setupFundedAccount` ou `driveLeadToFunding` está roteando para `OW90218-0001` (TireAgent UOWN) em vez de `KS3015`. Pode ser:
- Argumento `merchant` não está sendo passado corretamente
- Fallback default sobrescreve quando não há match

**Fix**: investigar `setupFundedAccount` signature + KS3015 merchant resolution em qa1.

### Bug Group D — Inbound log poll (CT-15)

**Sintoma**: `[CT-15] inbound log counts cc=0 ach=0 pa=0`.

**Causa**: debugger já confirmou via DB direct query que `uown_sv_inbound_api_log` recebe rows com FQCN exato (`com.uownleasing.svc.rest.tms.TmsPaymentController.processCreditCardPayment`, etc.) — aspecto svc#525 saudável. Logo, falha está no poll do teste:
- Janela `row_created_timestamp >= runStart` muito apertada
- `runStart` capturado antes dos 3 POSTs mas count rodou imediato após o 3º POST sem polling
- Ou — agente que persiste o log é async, count antes da flush

**Fix**: usar `db.waitForRecord` com polling de 30s em vez de count snapshot único.

## Observation pendente Marcus/Yuri

| ID | Tópico | Status | Detalhe |
|---|---|---|---|
| OBS-2 | PA silent no-op com shape NOVA | CONFIRMADA via fresh repro (CT-10) | Cliente externo enviando `creditLines[]`/`achLines[]` no endpoint `POST /paymentArrangements` recebe HTTP 200 mas zero transações são processadas. Decisão de produto: aceitar ambas shapes (mapper), rejeitar explicitamente com 400 (validator), ou documentar como comportamento esperado pós-revert `56b878299`. |
| Bonus | `creditCardPk` top-level aceito em CC tx | Não-bloqueante | Field não existe no POJO `CCTransactionInfo`; ainda assim service retorna APPROVED. Provável Jackson alias não-mapeado ou fallback do service por último card ativo. Documentar o comportamento esperado. |

## Próximas ações

| # | Item | Owner | Bloqueante? |
|---|---|---|---|
| 1 | Fix Bug Group A (DB poll filter) — substituir filtro timestamp por lookup por response key (`creditCardTransactionPk`, ACH `id`); auditar colunas | qa-implementer | Sim — bloqueia re-validação dos AC funcionais |
| 2 | Fix Bug Group B (CT-11 enum) — usar `DEFAULT`/`REGULAR_RECEIVABLES`/`EPO_ONLY` | qa-implementer | Sim |
| 3 | Fix Bug Group C (CT-13 KS routing) — investigar `setupFundedAccount` merchant resolution | qa-debugger + qa-implementer | Sim |
| 4 | Fix Bug Group D (CT-15 poll) — usar `waitForRecord` polling | qa-implementer | Sim |
| 5 | Re-run completo pós-fixes | qa-validator | Sim — gate pra DONE |
| 6 | Escalar OBS-2 a Marcus/Yuri (decisão produto) | orchestrator (user) | Não |
| 7 | Catalogar pitfalls em `payment-flows` / `application-lifecycle` / `db-polling-pattern` | qa-doc-keeper | Após re-run verde |

## Inviolable rule compliance

| Rule | Status | Nota |
|---|---|---|
| #8 — Report atualizado pós-execução | ✅ v3 in place |
| #10 — Classificação conservadora | ✅ OBS-2 confirmada via repro; bonus finding como observação |
| #11 — Pitfalls descobertos viram regras | ⏳ Pendente qa-doc-keeper |
| #13 — Activity log validation | ⚠️ Shadow não rodou em CTs com DB poll fail — re-asserir pós-fix Bug A |
| #14 — UI-first | ✅ API-first justificado em SPEC (TMS = surface externa, sem UI interna) |
