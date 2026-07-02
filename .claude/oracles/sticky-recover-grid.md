---
operation: sticky-recover-grid
description: Renderização (leitura) das 4 colunas Sticky no grid CC Transactions do portal Servicing (/credit-card-history/{accountPk}) — Sticky Recovery Status, Sticky Txn ID, Sticky Attempts, Last Sticky Retry — mais o contrato da API GET /uown/svc/accounts/{accountPk}/sticky-recoveries que abastece esses valores. svc#485 / RU05.26.1.52.0, CT-11.
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8
covers:
  - tests/e2e/RU05.26.1.52.0_stickyRecoverTransactions-ui.spec.ts
  - src/pages/servicing/credit-card-history.page.ts
  - src/selectors/common.selectors.ts
  - src/helpers/sticky.helpers.ts
  - src/api/clients/sticky-recover.client.ts
  - src/api/responses/sticky-recover.response.ts
  - docs/business-rules/05-pagamentos.md
  - docs/knowledge-base/sticky-payment-refund.md
---

# Oracle BDD — Grid de Recuperação Sticky (CC Transactions grid rendering)

> **Gatilho:** qualquer visualização do grid **CC Transactions** no portal Servicing
> (`/credit-card-history/{accountPk}`) para uma conta que tenha (ou não) uma sessão Sticky, e qualquer chamada a
> `GET /uown/svc/accounts/{accountPk}/sticky-recoveries` que abasteça as 4 colunas Sticky. Inclui rodar o spec
> `RU05.26.1.52.0_stickyRecoverTransactions-ui.spec.ts` — executar o spec É executar a operação de leitura do
> grid (regra #19, sem isenção para leitura pura, decisão 2026-06-30).
>
> **Fronteira vs `sticky-reverse-refund.md` (leia antes de confundir os dois oráculos):** este oráculo cobre
> **APENAS a RENDERIZAÇÃO/leitura** dos dados de recuperação Sticky no grid CC Transactions (uma operação de
> **visualização read-only** — nenhuma mutação). O oráculo irmão `.claude/oracles/sticky-reverse-refund.md`
> cobre a **AÇÃO** de Reverse/Fully Refund em uma linha Sticky no Payment History (mutação de ledger/Sticky).
> Sob a regra #19 (decisão 2026-06-30, sem isenção de read-only), uma leitura/visualização é uma operação que
> exige oráculo próprio — por isso este arquivo existe separado do de reverse/refund. Retroativo (regra #19b):
> o spec já existe e passa; este oráculo formaliza o contrato de aceitação a partir dos `expect()` reais do
> spec + regras de negócio canônicas, sem inventar comportamento novo.
>
> **Verificação de obsolescência:**
> ```bash
> git log cd2d2c8..HEAD -- \
>   tests/e2e/RU05.26.1.52.0_stickyRecoverTransactions-ui.spec.ts \
>   src/pages/servicing/credit-card-history.page.ts \
>   src/selectors/common.selectors.ts \
>   src/helpers/sticky.helpers.ts \
>   src/api/clients/sticky-recover.client.ts \
>   src/api/responses/sticky-recover.response.ts \
>   docs/business-rules/05-pagamentos.md \
>   docs/knowledge-base/sticky-payment-refund.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Viewport:** Servicing é portal interno voltado para agentes → obrigatório **1440×900** (regra #15).
>
> **Ambiente:** **SANDBOX ONLY.** Sessões Sticky (`uown_sticky`) só existem e o webhook só decripta em sandbox;
> qa2/dev2 têm o schema mas a tabela está vazia (memória `sticky-refund-tests-sandbox-only`; KB
> `sticky-payment-refund.md` "How to run this discovery"). O setup reutiliza contas produzidas por
> `tests/api/sticky-recover-rating-setup.spec.ts` (rating `'M'`) — exceção justificada de dado: uma sessão
> `RECOVERED` não é criável 100% via automação (#485 nunca produziu uma organicamente).
>
> **Activity Log (regra #13):** N/A para todos os CTs abaixo — operação puramente de leitura, nenhuma ação de
> negócio é disparada, portanto nenhum log é gerado (exceção read-only explícita da regra #13 / testing.md).

---

## CT-01 — Grid CC Transactions expõe as 4 colunas dedicadas do Sticky

```gherkin
Dado que o agente está autenticado no portal Servicing com viewport 1440×900
E que existe uma conta (rating "M") com ao menos uma transação de cartão submetida ao Sticky
Quando o agente abre o grid CC Transactions da conta
Então o cabeçalho do grid exibe as quatro colunas dedicadas do Sticky
E os textos exatos dos cabeçalhos são "Sticky Recovery Status", "Sticky Txn ID", "Sticky Attempts" e "Last Sticky Retry"
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `ccHistory.hasStickyColumns()` | `true` (as 4 colunas presentes no header) | `RU05.26.1.52.0_stickyRecoverTransactions-ui.spec.ts:131-137`; `credit-card-history.page.ts:428-439` |
| Texto exato do header 1 | `Sticky Recovery Status` | `common.selectors.ts:850` (`stickyStatusColumnName`) |
| Texto exato do header 2 | `Sticky Txn ID` | `common.selectors.ts:851` (`stickyTxnIdColumnName`) |
| Texto exato do header 3 | `Sticky Attempts` | `common.selectors.ts:852` (`stickyAttemptsColumnName`) |
| Texto exato do header 4 | `Last Sticky Retry` | `common.selectors.ts:853` (`stickyLastRetryColumnName`) |
| Estratégia de localização da coluna | índice resolvido dinamicamente por texto do `div[role="columnheader"]` — NÃO hardcoded; header ausente → `getStickyColumnIndex` retorna -1 e o spec falha com instrução de rodar o protocolo DOM-first (regra #16), NÃO bumpar timeout | `credit-card-history.page.ts:383-405` |

---

## CT-02 — Uma cct com sessão Sticky renderiza valores significativos nas colunas Sticky

```gherkin
Dado que o agente está no grid CC Transactions de uma conta cuja transação de cartão tem uma sessão Sticky ativa
Quando o grid termina de carregar os dados de recuperação Sticky para aquela linha
Então a coluna "Sticky Recovery Status" da linha exibe um status não vazio que contém o texto "RECOVERY"
E a coluna "Sticky Txn ID" da linha exibe um identificador não vazio (pode aparecer truncado)
E a coluna "Sticky Attempts" exibe ou vazio (quando ainda não houve tentativa, numberOfAttempts=0) ou um número inteiro válido
E a coluna "Last Sticky Retry" pode estar vazia quando nenhuma retentativa foi disparada ainda
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `getStickyRecoveryStatus(cctPk)` | comprimento > 0 **E** `.toUpperCase()` contém `RECOVERY` (casa com `RECOVERY_STARTED`/`RECOVERED` do enum `StickyRecoveryStatus`) | `spec:151-152`; `credit-card-history.page.ts:407-410`; enum em `docs/knowledge-base/sticky-payment-refund.md` §"Confirmed Run" |
| `getStickyTransactionId(cctPk)` | comprimento > 0 (valor pode estar truncado na célula) | `spec:153`; `credit-card-history.page.ts:412-415` |
| `getStickyAttempts(cctPk)` | vazio **OU** casa `/^\d+$/` — react-data-table-component renderiza `numberOfAttempts=0` (RECOVERY_STARTED antes da 1ª retentativa) como string vazia | `spec:154-159`; `credit-card-history.page.ts:417-420` |
| `getLastStickyRetry(cctPk)` | pode ser vazio se nenhuma retentativa disparou (apenas logado, não assertado como obrigatório) | `spec:160`; `credit-card-history.page.ts:422-425` |
| Prontidão da célula antes de assertar | `waitForStickyCellPopulated(cctPk, 15_000)` — espera a célula sair de `—`/vazio (a resposta `/sticky-recoveries` chega DEPOIS de `/getCCTransactions` e o MobX re-renderiza) | `spec:142`; `credit-card-history.page.ts:488-495` |

```sql
-- Precondição/cross-check CT-02 (a linha do grid espelha uown_sticky)
SELECT cct.pk AS cct_pk, cct.account_pk, st.sticky_transaction_id, st.recovery_status
  FROM uown_sv_credit_card_transaction cct
  JOIN uown_sticky st ON st.cc_transaction_pk = cct.pk
  JOIN uown_sv_account a ON a.pk = cct.account_pk
 WHERE a.rating = 'M' AND st.sticky_transaction_id IS NOT NULL
 ORDER BY cct.pk DESC LIMIT 1;
```

---

## CT-03 — [regressão UI-03] Linha sem sessão Sticky renderiza um "—" gracioso, sem erro

```gherkin
Dado que o agente está no grid CC Transactions de uma conta que tem tanto transações com sessão Sticky quanto transações sem
Quando o agente localiza a linha de uma transação de cartão que NÃO possui sessão Sticky
Então as quatro células Sticky dessa linha exibem um "—" gracioso (em-dash), não células vazias nem um erro de JavaScript
E o valor Sticky da linha com sessão continua sendo exibido corretamente na sua própria linha, sem colisão entre linhas
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Célula Sticky de linha sem sessão | renderiza `—` (em-dash) — react-data-table trata valor ausente como em-dash; `waitForStickyCellPopulated` distingue explicitamente `—`/`''` de valor real | `credit-card-history.page.ts:490-493` (trata `—` e `''` como não-populado) |
| Isolamento de linha (não colidir por substring) | `getRowByTxPk` casa a linha pelo id do DOM `#row-{cctPk}` (exato/determinístico), com fallback de célula `getByRole('cell', { exact: true })` — evita que uma linha PENDING sem sessão resolva `.first()` errado e devolva `—` para todas as 4 células | `credit-card-history.page.ts:73-104`; `common.selectors.ts:130` (`tableRowById`) |
| Objetivo declarado do spec (regressão UI-03) | "rows without a sticky session render a graceful '—' rather than empty cells / JS error" | `spec:14-15` (cabeçalho do arquivo, R11) |
| `[HYPOTHESIS]` — asserção direta em linha SEM sessão | O spec **não** possui um `expect()` dedicado sobre uma linha não-Sticky exibindo `—`; a garantia vem (a) do objetivo declarado no cabeçalho + (b) do fix determinístico de `getRowByTxPk` + (c) da ausência de toast de erro (CT-04). Um `qa-implementer` deveria adicionar um `expect(getStickyRecoveryStatus(nonStickyCctPk)).toBe('—')` para fechar essa lacuna. | Inferido do cabeçalho `spec:14-15` + `credit-card-history.page.ts:73-104` — **não há assert direto** |

---

## CT-04 — Nenhum erro de JS / toast de 500 no grid CC Transactions

```gherkin
Dado que o agente está no grid CC Transactions de uma conta com dados de recuperação Sticky
Quando o grid termina de renderizar as colunas e células Sticky
Então nenhum toast de erro é exibido na página
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Toast de erro visível | `false` — `SELECTORS.toastError` não visível em janela de 1 s | `spec:163-169`; `common.selectors.ts:20` (`.Toastify__toast--error, .toast-error, .alert-danger`) |
| Rede monitorada para diagnóstico | respostas casando `/sticky-recoveries\|getCCTransactions/` são logadas (status + preview do body) — não é assert, é instrumentação para depurar rendering FE | `spec:107-120` |

---

## CT-05 — Contrato da API GET /sticky-recoveries (fonte que abastece o grid)

```gherkin
Dado que uma conta possui ao menos uma sessão de recuperação Sticky
Quando GET /uown/svc/accounts/{accountPk}/sticky-recoveries é chamado
Então a resposta é HTTP 200
E a resposta traz ao menos uma sessão (payload no formato Spring Page — sessões em content[])
E, quando a sessão do stickyTransactionId sob teste é encontrada, seu recoveryStatus e accountPk batem com a linha uown_sticky correspondente
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `resp.ok` | `true` (HTTP 200) | `spec:172-174`; `sticky-recover.client.ts:54-60` |
| `unwrapStickyRecoveries(resp.body).length` | > 0 (ao menos uma sessão para a conta) | `spec:176-177`; `sticky-recover.client.ts:72-81` |
| Forma do payload | Spring `Page<StickyRecoverySession>` — sessões em `content[]`; fallbacks defensivos `recoveries[]` / array puro mantidos | `sticky-recover.response.ts:51-66`; confirmado empiricamente sandbox 2026-05-20 conta 17176 |
| Casing do campo id da transação Sticky | endpoint pode NÃO ecoar o `stickyTransactionId` no topo — se ausente, apenas loga as keys do payload (contrato descoberto empiricamente, Q3 do SPEC), não falha | `spec:180-191`; `sticky-recover.response.ts:59-62` |
| Cross-check quando a sessão é achada — `recoveryStatus` | igual a `uown_sticky.recovery_status` da linha do `stickyTransactionId` | `spec:204-206` |
| Cross-check quando a sessão é achada — `accountPk` | igual a `uown_sticky.account_pk` | `spec:207-209` |

```sql
-- Cross-check CT-05 (substituir $stickyTxnId)
SELECT recovery_status, account_pk, dunning_profile_id
  FROM uown_sticky WHERE sticky_transaction_id = $stickyTxnId;
```

---

## CT-06 — Hidratação MobX: as células Sticky só populam via customer-information + após /sticky-recoveries chegar

```gherkin
Dado que o agente quer ver o grid CC Transactions de uma conta com sessão Sticky
Quando o agente navega primeiro pela tela de customer-information e então abre a aba CC Transactions
E o grid aguarda a resposta de /sticky-recoveries chegar
Então as células das colunas Sticky exibem os valores da sessão (não ficam congeladas em "—")
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Caminho de navegação obrigatório | `navigateToCcHistoryByUrl` navega `/customer-information/{accountPk}` PRIMEIRO (hidrata `customerStore.accountPk`), depois a aba CC Transactions — navegação direta a `/credit-card-history/{pk}` gera uma corrida MobX em que as células ficam em `—` mesmo após os dados chegarem | `spec:122-129`; `credit-card-history.page.ts:24-43` |
| Espera pela resposta Sticky | `waitForStickyRecoveriesResponse(30_000)` — a FE chama `/sticky-recoveries` em paralelo com `/getCCTransactions` (`Promise.all`); o grid renderiza ao resolver as transações, mas as 4 células Sticky ficam em `—` até a resposta Sticky landar e o MobX re-renderizar | `spec:128`; `credit-card-history.page.ts:450-458` |
| Padrão do endpoint aguardado | resposta casando `/\/uown\/svc\/accounts\/\d+\/sticky-recoveries/` com status 200 | `credit-card-history.page.ts:451-453` |
| `[HYPOTHESIS]`/observação — componente sem `observer()` | `credit-card-history.page.ts:460-481` documenta um bug FE conhecido (`CreditCardHistoryTable` não envolto em `observer()`, commit `9c2e651`) que exige `reloadAfterStickyDataReady` como workaround; o spec CT-11 usa o caminho customer-information + `waitForStickyCellPopulated` e NÃO precisou do reload — mas a existência do workaround indica que, dependendo do timing, as células podem congelar. Comportamento FE, não coberto por assert positivo no spec. | `credit-card-history.page.ts:460-481` (comentário/workaround) — **não exercitado neste spec** |

---

## Pré-condições

- **Ambiente:** sandbox apenas (sessão Sticky `RECOVERED`/`SUBMITTED` só existe lá; tunnel DB sandbox `127.0.0.1:5445`, ver KB `sticky-payment-refund.md` "How to run this discovery").
- **Dado:** reutiliza contas de `tests/api/sticky-recover-rating-setup.spec.ts` (rating `'M'`). Se rodado isolado, o spec faz fail-fast pedindo o setup + um trigger de sweep. Reuso de sessão `RECOVERED` é exceção justificada de dado (não criável 100% via automação).
- **Descoberta da cct alvo:** `findEligibleStickyCct(db, 'M')` (helper) → se `null` (já existe sessão), query direta na `uown_sticky` JOIN `uown_sv_credit_card_transaction` pela cct com `sticky_transaction_id IS NOT NULL`; caso contrário `waitForStickyTransactionId(db, cctPk, 30_000)` (`sticky.helpers.ts:142`, `:450`).
- **Viewport:** `1440×900` (regra #15) — portal interno de agente.
- **Login:** role `manager`, sem OTP (Servicing sandbox).

## Log de Atividade (Regra #13)

**N/A — operação read-only.** Nenhum CT deste oráculo dispara ação de negócio; visualizar o grid e chamar
`GET /sticky-recoveries` não geram nota em `uown_sv_activity_log`. Esta é a exceção read-only explícita da
regra #13 (ver `.claude/rules/testing.md` "Activity Log Validation → Exception"). A mutação que gera log
(Reverse/Refund) é coberta pelo oráculo irmão `sticky-reverse-refund.md`, não por este.
