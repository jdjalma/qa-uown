# Playbook de reprodução manual — riscos descobertos no svc#552 (Sticky refund)

> Guia passo a passo para **reproduzir manualmente** cada risco que o QA descobriu ao validar a tarefa #552. Pensado para quem **não acompanhou a investigação** — cada risco traz contexto, o que é esperado (correto) vs o que acontece (bug), os passos e como verificar.
> Complementa: relatório executivo `docs/reports/552-sticky-refund-report.md` · matriz de risco `docs/scenarios/552-sticky-refund-scenarios.md` · conhecimento `docs/knowledge-base/sticky-payment-refund.md`.
> ⚠️ **Sticky só funciona no sandbox** ([[sticky-refund-tests-sandbox-only]]) — qa2/dev2 têm o schema mas não têm dados e os webhooks não descriptografam.

---

## 1. Contexto — o que é o "Sticky refund" (leia se for novo no assunto)

**Sticky.io** é o fornecedor de **recovery/dunning** da UOWN: quando uma **cobrança de cartão agendada é NEGADA** (autopay falhou), um sweep (`StickyRecoverSweep`) inscreve essa transação na Sticky, que **retenta a cobrança** ao longo de dias (dunning). Se a Sticky consegue capturar, o dinheiro entra **pelo gateway da Sticky** (não pelo gateway nativo da UOWN).

A tarefa **#552** adiciona a capacidade de **ESTORNAR (refund)** um pagamento que foi recuperado pela Sticky — algo que o estorno normal não consegue, porque o dinheiro está do lado da Sticky.

**Ciclo de vida de uma recovery (o que cada estado significa):**
```
cobrança CC NEGADA
   └─ StickyRecoverSweep cria a sessão  → uown_sticky.recovery_status = RECOVERY_STARTED
        └─ Sticky retenta (webhooks: recovery.started → attempt_failed → successful)
             └─ captura com sucesso          → RECOVERED   (agora é estornável)
                  └─ agente dá refund (#552)  → REFUND_SUBMITTED
                       └─ webhook refund.successful → REFUNDED + SvPayment REVERSED
   (caminhos alternativos: CANCELED, FAILED, REFUND_FAILED)
```

**Por que tudo é em sandbox:** só lá os webhooks da Sticky descriptografam e a API sandbox da Sticky responde. A captura real (`RECOVERED`) **não é reproduzível organicamente** (o gateway sandbox nega as retentativas) — por isso as sessões `RECOVERED` são um **pool fixo e escasso**.

---

## 2. Glossário rápido

| Termo | O que é |
|-------|---------|
| **Sticky session** (`uown_sticky`) | O registro de uma recovery. Uma por cobrança negada inscrita. |
| **`recovery_status`** | Estado da recovery: `RECOVERY_STARTED` → `RECOVERED` → `REFUND_SUBMITTED` → `REFUNDED` (ou `CANCELED`/`FAILED`). |
| **`gateway_transaction_id` / `cc_vendor_transaction_id`** | O id da transação **no gateway**. A Sticky precisa dele para retentar/estornar. **Sem um id real, a recovery falha** (`"gatewayTransactionId is required"`). |
| **`StickyRecoverSweep`** | Cria sessões para cobranças NEGADAS elegíveis (status DENIED, SCHEDULED, SALE, posting=hoje-7, conta ACTIVE, rating ∉ P/C/D/B, etc.). |
| **`StickyRecoverCancelSweep`** | Cancela sessões em andamento — **mas só quando a conta deixa de ser ACTIVE** (não olha rating). |
| **dunning profile** | Cadência das retentativas: 223=weekly, 224=biweekly, 225=monthly. |
| **`STICKY_REFUND`** | `source` da linha em `uown_sticky_outbound_log` quando um refund é enviado à Sticky. |
| **Rating P/C/D/B** | Rating letter da conta: P=payment arrangement (acordo), C/D/B=falência. Excluem a conta do `StickyRecoverSweep`. |

---

## 3. Contas de teste de referência (sandbox)

| Conta | Para que serve | Estado |
|-------|----------------|--------|
| **5084** | Risco **N-1** (dinheiro capturado inestornável) | payment $218.18 PAID + session CANCELED · conta PAID_OUT · **congelada** |
| **17204** | Risco **D-1** (refund travado) | payment $39.92 PAID + session REFUNDED · **congelada** |
| **6169** | Riscos **C-2/C-3** (sem state guard) | **último** candidato RECOVERED+PAID limpo ($34.79) |
| **17177 / 17176** | Risco **H-2** (Fraud/Sold não excluídos) | rating F / rating M, ambas com session Sticky |
| **17277 / 17278 / 17279** | Contas novas criadas pelo QA com sessões Sticky ativas (para exercitar o fluxo de refund) | sessões em RECOVERY_STARTED |

> "Congelada" = exemplo permanente; o passo não devolve dinheiro nem consome o registro, pode repetir à vontade.

---

## Pré-requisitos (faça sempre, antes de qualquer passo)

1. **Confirme que o tunnel de DB aponta para o sandbox.** A porta do `kubectl port-forward` (`127.0.0.1:5445`) é **reusada entre ambientes ao longo do dia** — se apontar para o env errado, você vai ler/escrever no lugar errado.
   ```bash
   set -a; source .env; set +a
   export DB_CONNECTION_STRING="postgresql://${UOWN_DB_USER_SBX}:${UOWN_DB_PASS_SBX}@127.0.0.1:5445/svc"
   # canário do sandbox — TEM que voltar account_pk=5084, recovery_status=CANCELED:
   npx tsx src/scripts/_probe_552_verify.ts sandbox 5084 83562 2190619 36
   ```
   Auth-fail ou dados diferentes = tunnel no env errado → re-aponte para o sandbox.
2. **Login** no portal Servicing: `https://svc-website-sandbox.uownleasing.com` com o role **manager** (sem OTP).
3. **Para achar um candidato refundável** (quando o risco precisar): `npx tsx src/scripts/_probe_552_refund.ts sandbox` lista as sessões RECOVERED + STICKY/PAID disponíveis.

> **Dica de UI (MCP/manual):** o portal sandbox dispara toasts e spinners que travam cliques automatizados; ao reproduzir manualmente no navegador isso não atrapalha. Os botões `Reverse Payment` aparecem só em linhas com status `PAID`.

---

## Risco N-1 — Dinheiro capturado que NÃO pode ser estornado  🔴
*(fixture 5084 · só UI · não devolve dinheiro · pode repetir)*

**O que é:** a Sticky capturou um pagamento, mas depois a sessão foi marcada `CANCELED` (o cancel-sweep tentou cancelar tarde demais, quando a Sticky já tinha capturado). Como o refund exige `recovery_status = RECOVERED`, esse dinheiro **fica preso — não há caminho de devolução pela UI**.
**Por que importa:** é dinheiro real do cliente que o agente não consegue devolver pela feature.

**Passos:**
1. Login → `/payment-history/5084`.
2. Ache a linha **`STICKY · $218.18 · PAID`** → repare que **o ícone Reverse Payment APARECE** (a UI oferece o refund, dando a impressão de que dá pra estornar).
3. Clique → modal (reason já em "Fully Refund") → digite um comentário → **Submit**.

**Esperado (correto):** ou a UI não deveria oferecer refund, ou deveria devolver o dinheiro.
**Atual (bug):** toast breve **"Unable to refund payment."**, o modal **fica aberto**, **nada é devolvido**.

**Verifique:** `npx tsx src/scripts/_probe_552_verify.ts sandbox 5084 83562 2190619 36` → payment continua `PAID`; aparece um activity log `"Sticky refund failed … not in RECOVERED status"`; **nenhum** novo outbound `STICKY_REFUND`. (Sem cleanup — nada mudou.)

> **✅ Revalidado 2026-06-22:** `uown_sticky` pk=36 `recovery_status=CANCELED` · payment 2190619 `status=PAID, reverse_date=null` ($218.18). Os $218.18 seguem inestornáveis.

---

## Risco D-1 — Refund travado, sem reconciliação  🔴
*(fixture 17204 · só UI)*

**O que é:** a Sticky **já reembolsou** o dinheiro (sessão `REFUNDED`), mas o webhook de confirmação se perdeu, então a UOWN nunca reverteu o pagamento (continua `PAID`). A conta fica **inconsistente para sempre** — e re-estornar **não corrige**.
**Por que importa:** descasamento permanente entre o que a Sticky fez e o que a UOWN registra. Em qa2 isso é pior (webhooks nunca descriptografam).

**Passos:**
1. Login → `/payment-history/17204` → linha **`STICKY · $39.92 · PAID`** → Reverse Payment → Fully Refund → comentário → Submit.

**Esperado:** algum sweep/guardião deveria reconciliar a sessão `REFUND_SUBMITTED`/`REFUNDED` presa.
**Atual (bug):** toast **"Unable to refund payment."** (idempotência bloqueia a 2ª chamada → também prova o risco **A-1**: sem dinheiro em dobro). O payment **continua `PAID`** (preso).

**Verifique:** `_probe_552_verify.ts sandbox 17204 83244 2190591 34` → sessão `REFUNDED`, payment `PAID`.

> **✅ Revalidado 2026-06-22:** `uown_sticky` pk=34 `recovery_status=REFUNDED` · payment 2190591 `status=PAID, reverse_date=null` ($39.92) — descasamento permanente.

---

## Riscos C-2 / C-3 — Refund permitido em conta fechada (sem guard de estado)  🔴
*(precisa do candidato RECOVERED `6169` + um flip de estado no DB)*

**O que é:** o refund **não verifica o estado da conta**. Dá pra estornar um pagamento numa conta `SETTLED_IN_FULL` (acordo quitado), `CHARGED_OFF` (baixada), `CANCELLED` (encerrada) ou `SOLD` (vendida a terceiro).
**Por que importa:** reabre dívida quitada (SETTLED reverte para ACTIVE), ou devolve dinheiro numa dívida baixada/vendida (risco contábil/legal).

⚠️ **Só resta UM candidato limpo: a conta `6169`** ($34.79, sticky 25, cc 69258) — verificado 2026-06-22. Um **Submit consome** ele (a captura RECOVERED não é reproduzível). **Use a variante não-destrutiva** abaixo, que prova o gap sem queimar o candidato. (A prova destrutiva completa já foi executada pelo QA em 6158/6228/6214/6166.)

**Não-destrutivo (preserva o 6169):**
1. `npx tsx src/scripts/_probe_552_terminal.ts sandbox set 6169 SETTLED_IN_FULL`  *(ou CHARGED_OFF | CANCELLED | SOLD)*
2. Login → `/payment-history/6169` → linha STICKY/PAID `$34.79` → **o ícone de refund continua aparecendo mesmo numa conta em estado terminal** ← este é o gap.
3. Abra Reverse Payment → confirme "Fully Refund" + comentário → **Cancel** (NÃO dê Submit).
4. **Cleanup:** `npx tsx src/scripts/_probe_552_terminal.ts sandbox restore 6169`.

**Destrutivo (consome 6169 — só se precisar do dano ao vivo):** em vez do Cancel, dê **Submit** → "Successfully refunded payment." Depois verifique com `_probe_552_terminal.ts sandbox show 6169`:
- **SETTLED_IN_FULL** → conta **volta para ACTIVE** (des-quitada), `settled_in_full_date_time` fica órfão, delinquency reabre.
- **CHARGED_OFF / CANCELLED / SOLD** → conta **continua terminal** mas o payment vira `REVERSED` (dinheiro devolvido numa dívida baixada/encerrada/vendida).
Cleanup: `_probe_552_terminal.ts sandbox restore 6169`.

> **✅ Confirmado ao vivo (QA 2026-06-21):** prova destrutiva executada — refund passou ("Successfully refunded payment.") em **SETTLED_IN_FULL** (6158 → reverteu p/ ACTIVE, des-quitada) · **CHARGED_OFF** (6228 → continuou CHARGED_OFF) · **CANCELLED** (6214 → continuou CANCELLED) · **SOLD** (6166 → continuou SOLD). Nenhum guard de estado no caminho `RefundPaymentService → StickyRefundPaymentService → RefundService`.

---

## Risco H-3 — Recovery em andamento não é cancelada quando o cliente entra em acordo/falência  🔴
*(um comando, auto-limpante — prova por SQL)*

**O que é:** o gate de entrada exclui rating P/C/D/B (uma recovery **nova** não inicia numa conta em acordo). **Mas** o `StickyRecoverCancelSweep` **não tem cláusula de rating** — ele só cancela quando a conta deixa de ser ACTIVE. Então, se o cliente entra em **acordo (P)** ou **falência (C/D/B)** *depois* que a recovery já foi submetida (e a conta segue ACTIVE), **nada cancela a cobrança** e a Sticky continua retentando.
**Por que importa:** em produção (onde o gateway captura), isso cobra um cliente em violação do acordo / do *automatic stay* de falência.

```bash
npx tsx src/scripts/_probe_552_repro_h3.ts sandbox     # cria conta nova, prova gate + ausência de guardião, e limpa sozinho
npx tsx src/scripts/_probe_552_sweepsql.ts sandbox      # (opcional) dump dos 2 sweeps: confirme que o cancel sweep não filtra rating
```
**Leitura do resultado:** gate seleciona rating NULL ✅ / exclui P,C ✅ / **inclui F** ⚠️; cancel-sweep **não pega** sessão em andamento com rating P/C enquanto ACTIVE, **só pega** quando `account_status<>ACTIVE`.

> **✅ Revalidado 2026-06-22 (conta fresca):** ARM 1 — `rating=NULL→selected=true`, `P→false`, `C→false`, **`F→true`**. ARM 2 — sessão em andamento simulada: `ACTIVE+P→cancelada? false`, `ACTIVE+C→false`, `account CANCELLED→true`. Veredito: gate respeita P/C ✅, **não exclui F** ⚠️, guardião ignora rating ⚠️ (só reage a `account_status<>ACTIVE`).

---

## Risco N-3 / C-7 — Imposto do refund não vai para o TaxCloud  🔴
*(observação no DB)*

**O que é:** quando uma recovery é estornada, o imposto coletado **não é reportado de volta** ao TaxCloud, e a reversão ainda **apaga as linhas de allocation** (de onde o sync de imposto leria).
**Por que importa:** over-remessa fiscal — a empresa remeteu imposto de um pagamento que foi devolvido, sem crédito.

```bash
npx tsx src/scripts/_probe_552_newscenarios.ts sandbox   # dailyTaxCloudRefundsSync → is_active=false (o de pagamentos está ativo)
npx tsx src/scripts/_probe_552_alloc_pp.ts  sandbox      # payments REVERSED têm 0 linhas em uown_sv_allocation (tax apagado)
```

> **✅ Revalidado 2026-06-22:** `dailyTaxCloudPaymentsSync.is_active=true` **vs `dailyTaxCloudRefundsSync.is_active=false`**. Os payments REVERSED 2190283 / 2190284 / 2190467 têm **0 linhas** em `uown_sv_allocation` (o `taxable_amount` foi apagado na reversão) — o sync de imposto, mesmo que ativo, leria allocations que não existem mais.

---

## Risco H-2 — Contas Fraud / Sold não são excluídas da recovery  🟡
*(observação no DB)*

**O que é:** o gate só exclui P/C/D/B. Contas com rating **F (fraude confirmada)** ou **S (vendida)** **entram** no recovery — a Sticky recobra clientes fraudulentos/vendidos.
**Por que importa:** inconsistente com outros sweeps (o `DelinquencyRerunCC` exclui B,C,P,S,D,E,F,G,L,U) e questionável recobrar uma dívida vendida/fraudulenta.

```bash
npx tsx src/scripts/_probe_552_rating.ts sandbox     # contas 17177 (F) e 17176 (M) têm session Sticky
```

> **✅ Revalidado 2026-06-22:** cláusula do gate = `AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))`. Conta **17177 (rating F)** e **17176 (rating M)** têm sessão Sticky (`RECOVERY_STARTED`) — F/M/S não são excluídos.

---

## Limitação L-1 — O refund só funciona em recovery REALMENTE capturada (não dá pra "ativar" num RECOVERY_STARTED)  🔴
*(confirmado ao vivo 2026-06-22 — demonstração com estado forçado)*

**O que é:** o refund da #552 exige `recovery_status = RECOVERED` **+** uma retentativa aprovada **+** um `SvPayment` STICKY/PAID — tudo criado quando a Sticky **captura de verdade** (`recovery.successful`). Em sandbox o gateway nega as retentativas, então as sessões ficam em `RECOVERY_STARTED` e **não há o que estornar**. Mesmo **forçando** o estado RECOVERED no banco, a **API da Sticky rejeita o refund** porque a transação nunca foi capturada do lado dela.
**Por que importa:** explica por que não dá para "ativar o refund" em contas novas (17277/17278/17279) — elas têm sessões `RECOVERY_STARTED`, não `RECOVERED`. Refund só é testável em cima do pool real de RECOVERED (6169) ou via "Send Test Event" no painel da Sticky.

**Reprodução (demonstra a parede):**
1. Numa sessão `RECOVERY_STARTED` (ex.: 17279 sticky pk=50 / cct 85949), force o estado:
   ```bash
   npx tsx src/scripts/_probe_552_force.ts 50 85949      # insere retry APPROVED + SvPayment STICKY/PAID + marca RECOVERED; imprime o novo paymentPk
   ```
2. Login → `/payment-history/17279` → a row **`STICKY · $13.95 · PAID`** aparece com ícone de refund → Reverse Payment → Fully Refund → comentário → **Submit**.
3. **Observe:** modal fica aberto, sem sucesso.
4. **Verifique** (DB): `uown_sticky_outbound_log` ganha uma linha `source=STICKY_REFUND` cuja resposta é **HTTP 400 `{"status":"BAD_REQUEST","stickyErrorCode":400,"title":"Error processing refund"}`**; activity log `"Sticky refund failed … error=HTTP 400 …"`; sessão segue `RECOVERED`, payment segue `PAID`.
5. **Cleanup:** `npx tsx src/scripts/_probe_552_unforce.ts`   *(remove o SvPayment + retry fabricados e reverte a sessão para RECOVERY_STARTED)*.

> **✅ Evidência 2026-06-22:** outbound `STICKY_REFUND` enviado (`stickyTransactionId=a41e26b1…`, `amount="1395"`, `authorizationId=edbf0190…`) → Sticky respondeu **HTTP 400 "Error processing refund"** → `Sticky refund failed`. Confirma que o refund **não pode ser ativado** numa recovery que não foi capturada de verdade.

---

## Referência rápida

| Risco | Severidade | Tipo de repro | Precisa de | Onde |
|-------|-----------|---------------|-----------|------|
| **N-1** dinheiro inestornável | 🔴 | UI | nada (5084) | `/payment-history/5084` |
| **D-1** refund travado | 🔴 | UI | nada (17204) | `/payment-history/17204` |
| **A-1** idempotência (sem dinheiro em dobro) | 🔴 | UI | nada (17204) | re-refund em 17204 |
| **C-2/C-3** sem state guard | 🔴 | UI + flip DB | candidato 6169 | `_probe_552_terminal.ts` + UI |
| **H-3** guardião de rating | 🔴 | script SQL | — | `_probe_552_repro_h3.ts` |
| **N-3/C-7** imposto/de-allocation | 🔴 | observação DB | — | `_probe_552_newscenarios.ts` · `_alloc_pp.ts` |
| **H-2** fraud/sold não excluídos | 🟡 | observação DB | — | `_probe_552_rating.ts` |
| **L-1** refund só em RECOVERED real | 🔴 | DB force + UI | sessão RECOVERY_STARTED | `_probe_552_force.ts` + UI + `_unforce.ts` |

> **Todos os pontos acima foram revalidados ao vivo em 2026-06-22** — cada seção traz o bloco `✅ Revalidado/Evidência` com os valores confirmados.

---

## Apêndice — como CRIAR uma sessão Sticky do zero (para gerar candidatos novos)

Os candidatos RECOVERED são escassos. Para **disparar o Sticky** numa conta nova com pagamentos reais (ex.: 17277/17278/17279):

1. A conta precisa de uma **cobrança CC que passou pelo gateway** (tem `gateway_transaction_id` real). Pagamento manual aprovado serve; cobrança agendada também **se a conta estiver delinquente** (senão o `SendCreditCardPaymentsSweep` cancela antes de ir ao gateway → fica sem txn id → `"gatewayTransactionId is required"`).
2. Torne a cobrança elegível (morph para `DENIED` / `SCHEDULED` / `SALE`, `posting=hoje-7`, `cc_vendor_transaction_id` = a parte limpa do gateway txn) e **limpe rating P** se houver acordo (senão o sweep exclui a conta).
3. Dispare: `POST https://svc-sandbox.uownleasing.com/uown/svc/triggerScheduledTask/StickyRecoverSweep` (headers `x-api-key` + `Authorization`).

Script que faz isso para uma lista de ccts com gateway txn real: `npx tsx src/scripts/_probe_552_morphauth.ts <accountPk> <cctPk,cctPk,...>` (morfa + limpa rating + dispara o sweep + reporta as sessões criadas).
