---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
status: live-validated-2026-07-01-paytomorrow+tireagent-gowsign+signwell
source-repo: ../uown/origination
source-ref: origin/R1.53.2
source-sha: 175a82b4575645bed4644f2cf97655d48d268be5
covers:
  # A implementação real vive no repo do FE de origination (irmão ../uown/origination),
  # mergeada via MR !1498 em R1.53.2. A verificação de staleness roda NAQUELE repo (comando abaixo),
  # não no qa-uown — este arquivo ainda não tem artefato de código no qa-uown.
  - ../uown/origination/hooks/useEsignCompletionRedirect.ts
  - ../uown/origination/utils/helper.tsx
  - ../uown/origination/lib/analytics/events.ts
  - ../uown/origination/pages/[shortCode]/complete/index.tsx
  - ../uown/origination/pages/completeEsign/index.tsx
  - ../uown/origination/pages/appComplete/index.tsx
  # Roteamento no backend que decide qual ramo roda (flag postMessage por merchant):
  - ../uown/svc/src/main/java/com/uownleasing/svc/service/esign/EsignRedirectService.java
---

# Oráculo: Loop de reenvio de postMessage no e-sign (Origination `#1341`)

> **STATUS: VALIDADO AO VIVO no sandbox em 2026-07-01** (núcleo postMessage / GowSign / PayTomorrow
> embedado). Feature mergeada via MR `!1498` (`R1.53.2_post_message_retry` → `R1.53.2`), card
> `origination#1341`, milestone `RU07.26.1.54.1` (HotFix), `workflow::qa-in-process`. Cada checkpoint está
> ancorado **byte a byte no código mergeado** (`origin/R1.53.2` @ `175a82b4`) e agora também em captura de
> console real (ver "Validação ao vivo" abaixo). A validação é **guiada por console log** (rule #14
> UI-first: a UX observável — toast, overlay, tempo de redirect, pai recebendo a mensagem — é primária).
> Ainda PENDENTES: linha SignWell + TireAgent (PayPair), CT-07 (UOWN standalone/não-postMessage), CT-09
> (`completeEsign`), CT-13 (checkout 1×), CT-14 (Sentry), CT-16 (reabrir/retomar).

## Validação ao vivo (2026-07-01, sandbox)

Spec: `docs/taskTestingUown/RU07.26.1.54.1_esignPostMessageResendLoop/` (projeto `task-testing-origination`).
Entrada **embedada real**: portal PayTomorrow → MSA Powersports `OL90402-0001` → TX → **GowSign** → iframe
`secure-sandbox.uownleasing.com/{token}/complete` (source `completeApplication`). Stream capturado (2 runs):

```
[esign][redirect] preparing completion handoff
[esign][postMessage] starting resend loop (interval=1000ms, max=10000ms) from completeApplication
[esign][postMessage] attempt 1 dispatched from completeApplication      ← ANTES de "scheduled" (brief errado)
[esign][postMessage] resend loop scheduled; redirect in 10000ms
[esign][postMessage] attempt 2 dispatched … (Δ ~1000ms) … attempt N
[esign][redirect] navigating to redirect URL
```

**Casos validados ao vivo (3, todos PASS — CT-01/02/03/04/05/06/11/12):**

| Caso | Parceiro / entrada | Estado → provedor | attempts observados | handoff→navigate |
|---|---|---|---|---|
| 1 | PayTomorrow (`OL90402-0001`) | TX → **GowSign** | 5 e 3 (2 runs) | ~2.5s / ~2.5s |
| 2 | PayTomorrow (`OL90402-0001`) | CO → **SignWell** (CO sem template GowSign) | 2 | ~1.7s |
| 3 | **TireAgent** via PayPair (pt-iframe) | OH → **SignWell** | 1 | ~0.5s |

CT-05 PASS em todos (pai recebeu `uown_success` = **N attempts × 2** — `top`+`parent`). **CT-11 PASS
exercitado NATURALMENTE:** o parceiro avança ao receber a mensagem e destrói o iframe → `pagehide` para o
loop cedo E ainda navega. Consequência: **o nº de attempts é NÃO-DETERMINÍSTICO no fluxo embedado real
(observado 5, 3, 2 e até 1)** — sempre sequencial a partir de 1, ~1000ms; o caminho de **10 attempts / 10s
completo só ocorre se o pai NÃO destruir o iframe**. Não falhar por contagem; assertar sequência + cadência
+ navegação. Provedor é **agnóstico** ao handoff — confirmado idêntico pós-GowSign e pós-SignWell, em ambos
os parceiros. SignWell emite também `[esign][signwell] opening/embed opened/completed {id}` antes do handoff.

**CT-07 (não-postMessage / UOWN standalone) — PASS.** TerraceFinance `OL90202-0001` (clientType
`TERRACE_FINANCE`, fora da lista → `postMessage=false`), entrada pela contract URL direta (seed via API,
aba standalone). Stream: `preparing completion handoff` → `navigating in 2000ms (no postMessage)` →
`navigating to redirect URL` **+2001ms exatos**; **zero** `[esign][postMessage] attempt`, **zero**
recebimento no pai. (NB: o `sendApplication` direto funciona para TerraceFinance; o 500 do GDS era
específico do MSA/PayTomorrow, que usa a prequalificação do portal, não a API direta.)

**Demais CTs:** **CT-14 (Sentry) PASS** — `Rep flush failed integration reference is null` **ausente** nos 4
runs (sessão saudável; o código só loga no erro, então só o negativo é verificável). **CT-13 PASS
(observacional)** — o parceiro recebeu N×2 msgs e avançou **uma vez** (um único `pagehide`/navegação; o
refund-flow confirma 1 lead) — idempotência é responsabilidade do merchant, evidenciada. **CT-09 (`completeEsign`)
— code-confirmed + entrada mapeada, runtime PENDENTE.** Discovery 2026-07-01: a rota `/completeEsign` **não
é alcançada pelo fluxo do parceiro** (que sempre embeda `/{token}/complete` → source `completeApplication`;
provado com MSA + `verifyPhoneBeforeSigning=true` → ainda `completeApplication`). A entrada real é
`LeadService.sendFinalizeEmailAfterVerification()` → email **`FinalizeVerifiedPurchaseEmail`** com link
`secure-{env}.uownleasing.com/completeEsign?uuid={uuid}_{id}`, disparado **após verificação de banco**.
Navegação direta a esse link (lead TireAgent seedado) **renderiza** o passo Personal Verification (phone) e
a seleção de payment program, mas **crasha (MobX `Reaction` error → tela em branco) ao escolher o programa**
— artefato do estado pós-bank-verification ausente na entrada não-canônica (rule #10: **NÃO** classificado
como bug). O hook é byte-idêntico (`sourcePage:'completeEsign'`); validar o handoff em runtime exige o fluxo
**genuíno de verificação de banco** (que popula o `customerStore`), não a navegação direta. **CT-16 (reabrir/retomar) — SKIPPED (não
automatizável de forma limpa):** reabrir a contract URL **reinicia** o fluxo (não retoma no sub-passo de
e-sign) E o único merchant postMessage seedável por API (TireAgent) **não** renderiza SignWell embedado no
`/complete` standalone (usa link de email) → `completeESign` nunca acha o iframe. A resiliência a
interrupção que o CT-16 mira **já está provada pelo CT-11** (pagehide destrói o iframe no meio do loop →
para de postar E a filha ainda navega; observado em todo run de parceiro, attempts até 1). `test.describe.skip`
com justificativa na spec.

## Validação ao vivo — STG (2026-07-01)

Deploy **CONFIRMED** (bundle `origination-stg` build `2026-07-01T20:47:55Z`: strings novas presentes, 6
legadas ausentes). Runtime standalone em `ENV=stg` (seed via `svc-stg` → iframe `secure-stg`; `sendApplication`
**não** é WAF-bloqueado deste box no stg; GDS stg refreshado):

- **CT-07 (não-postMessage, TerraceFinance/CA) — PASS no stg:** `preparing completion handoff` →
  `navigating in 2000ms (no postMessage)` → `navigating to redirect URL` (+2002ms exatos); zero attempts.
- **Ramo postMessage no stg — não exercitável em runtime deste box (deploy-confirmed):** os testes de
  portal de parceiro rodados com `ENV=stg` ainda embedaram **`secure-sandbox.uownleasing.com/{token}/complete`**
  — o **portal PayTomorrow staging (`merchant-staging.paytomorrow.com`) está fixado no UOWN sandbox**; `ENV`
  só muda as URLs do framework, não a integração parceiro→UOWN (falha 120s = artefato do mismatch, NÃO bug —
  rule #10). E não há merchant postMessage seedável por API que renderize signing embedado standalone
  (TireAgent usa link de email; PayTomorrow 500 no GDS). Como o **bundle stg é byte-idêntico ao sandbox**
  (ambos confirmados por inspeção), e o ramo postMessage foi exaustivamente validado no sandbox (5 runs,
  ambos parceiros × ambos provedores), a confiança no stg é **deploy-confirmed + código idêntico**, não
  runtime independente. Para runtime postMessage no stg seria preciso um portal de parceiro apontando para
  stg (ex.: Kornerstone tem URL stg própria: `secure-stg.kornerstoneliving.com`).

> Operação: após uma assinatura bem-sucedida, a Origination envia `uown_success` à janela-pai **a cada 1s
> por até 10s** (um loop de reenvio) e então redireciona — substituindo o antigo postMessage de disparo
> único. Roda tanto no handoff de conclusão de aplicação quanto no handoff dedicado de conclusão de
> e-sign, dentro do iframe do parceiro (PayTomorrow, TireAgent — demais parceiros postMessage, ex.:
> Kornerstone, seguem o mesmo caminho). Validado a partir do DevTools Console + o checkout do parceiro.

## Resumo da demanda

- **Ator:** cliente/aplicante (dispara ao finalizar a assinatura) · página do merchant parceiro (consome
  o relay de `uown_success` para avançar seu checkout) · QA (observa console + UX).
- **Objetivo:** tornar o handoff pós-assinatura **confiável** nos fluxos embedados. Um `postMessage`
  único podia ser perdido pela janela-pai (iframe não pronto para receber) → checkout do parceiro travado
  depois de o cliente já ter assinado.
- **Valor:** a janela-pai recebe `uown_success` repetidamente enquanto a página filha ainda está viva,
  então o checkout do parceiro avança de forma confiável; a filha ainda redireciona em seguida.

## Brief vs código (correções — "confiar no código", usuário 2026-07-01)

O brief de QA do card está direcionalmente certo, mas errado em três detalhes; este oráculo segue o código:

1. **O título diz "Thrice" — o código reenvia até ~10 vezes, não 3.** `POST_MESSAGE_MAX_DURATION_MS = 10000`,
   `POST_MESSAGE_INTERVAL_MS = 1000`. A tentativa 1 dispara imediatamente, depois uma por segundo. O padrão
   `attempt N/3` é explicitamente **proibido**. O título é "apenas representativo" (usuário).
2. **Ordem dos logs:** o brief lista `resend loop scheduled` **antes** de `attempt 1`. No código, `tick()`
   (que loga `attempt 1`) roda **antes** do log `resend loop scheduled`. Ordem real: `starting resend loop`
   → `attempt 1 dispatched` → `resend loop scheduled; redirect in 10000ms` → `attempt 2…`.
3. **O redirect de falha de assinatura é REALMENTE imediato (0ms), não 2s.** `scheduleEsignRedirect`
   faz um curto-circuito quando a URL é `/signingFailure`: `analytics.endCurrentSession()` e então
   `location.href = redirectUrl` **na hora** — sem loop de reenvio, sem log `navigating in 2000ms`, sem log
   `navigating to redirect URL`. O caminho de 2000ms se aplica apenas ao caso de **sucesso não-postMessage**.

## Análise de impacto

| Regra / fato | Impacto nesta feature | Fonte |
|---|---|---|
| **O ramo é decidido pelo `clientType` do merchant, NÃO por uma coluna por-merchant.** `MerchantService` seta `postMessage=TRUE` quando `clientType.name()` está **contido** (`containsIgnoreCase`) na config `post.message.merchant.client.type` (default `"TIRE_AGENT"`); só então `EsignRedirectService` acrescenta `&postMessage=true` à URL. **Não há coluna `postMessage` no DB do merchant.** | Merchants cujo clientType está na lista (`TIRE_AGENT` e — no sandbox — `PAY_TOMORROW`) → loop de reenvio. Merchants cujo clientType NÃO está (ex.: `V1_UOWN` / UOWN first-party) → `postMessage=false` → ramo de 2s. As duas classes de equivalência são dirigidas por esta pertinência. A config efetiva pode vir do **Vault** — `getConfig` (tabela DB) retornou `N/A` no sandbox em 2026-07-01, mas `OL90402-0001` (PAY_TOMORROW) é `true`, logo a lista efetiva inclui `PAY_TOMORROW`. | `svc MerchantService.java:119-121` + `EsignRedirectService.java:93-94` `[confirmado 175a82b4]` |
| Handoff decidido por a URL de redirect conter `postMessage=true` | `needsPostMessage = redirectUrl.includes('postMessage=true')`. | `utils/helper.tsx` `scheduleEsignRedirect` `[confirmado]` |
| URL de falha = path `/signingFailure` | `isSigningFailureRedirectUrl` retorna true só quando `URL.pathname === '/signingFailure'`; esse path faz curto-circuito para redirect imediato. | `utils/helper.tsx:289` `[confirmado]` |
| Cada dispatch posta para AMBOS `top` e `parent` | `dispatchUownSuccessPostMessage` chama `globalThis.top?.postMessage` **e** `globalThis.parent?.postMessage`. Num iframe de um nível (top===parent) a janela-pai recebe 2 mensagens por tentativa → idempotência do merchant é obrigatória. No caso **UOWN standalone** top===parent===self, então postar para si mesmo é inofensivo — mas a URL é `postMessage=false`, então nada é postado. | `utils/helper.tsx` `[confirmado]` |
| A página de origem é logada e trackeada | `sourcePage: 'completeApplication' \| 'completeEsign'`; ligada por página (`[shortCode]/complete` → `completeApplication`, `completeEsign` → `completeEsign`). Analytics `POSTMESSAGE_SENT` pageName = `${sourcePage}:${attempt}`. | `hooks/useEsignCompletionRedirect.ts` + páginas `[confirmado]` |
| O gate `isReady` difere por página | `[shortCode]/complete` passa `isReady: !isLoading`; `completeEsign` passa `isReady: true`. O hook fica inerte até `redirectUrl && isReady`. Relevante ao caso de **reabrir/retomar**: o loop só começa quando o `redirectUrl` do lead concluído está presente e a página está pronta. | páginas `[confirmado]` |
| `appComplete` não faz mais relay | O antigo `setTimeout(() => sendIFrameParentMessage('uown_success'), 2000)` e o listener de `uown_success` foram **removidos**; `appComplete` não usa o hook. | diff `pages/appComplete/index.tsx` `[confirmado]` |
| Fechamento precoce do iframe = `pagehide` | `onPageHide` → `stopPosting('pagehide')` + `navigate()`. O posting para no unload; a filha ainda tenta o redirect antes do teardown → o parceiro pode receber < 10 mensagens. O mesmo handler dispara quando o **cliente fecha a aba**. | `utils/helper.tsx` `[confirmado]` |
| Flush do Sentry replay durante o handoff | O hook agenda `Sentry.getReplay().flush()` ~1000ms após o handoff; se a integração for null, loga `Rep flush failed integration reference is null`. | `hooks/useEsignCompletionRedirect.ts` `[confirmado]` |
| Renomeação de eventos de analytics | `POSTMESSAGE_RECEIVED` removido; `POSTMESSAGE_SEQUENCE_STARTED` + `POSTMESSAGE_SEQUENCE_COMPLETED` adicionados; `REDIRECT_STARTED`/`REDIRECT_COMPLETED` mantidos. | diff `lib/analytics/events.ts` `[confirmado]` |
| Activity Log (regra #13) | O handoff é um relay de UX no client, não uma ação de negócio no backend — o próprio evento de assinatura já loga no servidor (ver `signwell-signing.md` / `gowsign-signing.md`). Nenhuma nova nota de activity-log é esperada do loop de reenvio. `[assumido — confirmar que não há regressão no log de assinatura]` | CLAUDE.md regra #13 |

## Critérios de Aceite

| ID | Critério (resultado observável) | Testável? |
|---|---|---|
| AC-01 | Assinatura bem-sucedida num merchant **postMessage**: a janela-pai recebe `uown_success` repetidamente (~1/s), a página redireciona ~**10s** após o handoff; o console mostra a sequência do loop de reenvio com linhas por tentativa. | Sim |
| AC-02 | Assinatura bem-sucedida no fluxo **UOWN first-party / standalone** (merchant `postMessage=false`): **nenhum** `uown_success` é postado; a página redireciona ~**2s** após o handoff com o log `no postMessage`. | Sim |
| AC-03 | **Fechar/cancelar** a assinatura sem concluir → redirect imediato para o fluxo de falha (`/signingFailure`), **sem** loop de reenvio, **sem** postMessage. | Sim |
| AC-04 | O handoff de **completeEsign** mostra o mesmo loop de reenvio, mas com source `completeEsign` em toda linha de log (não `completeApplication`). | Sim |
| AC-05 | A página **appComplete** não faz **nenhum** relay adicional de `uown_success` após o redirect. | Sim |
| AC-06 | **Fechamento precoce do iframe** (a pai remove o iframe antes de 10s): o posting para no unload, a filha ainda tenta o redirect; o parceiro pode receber **menos de 10** mensagens. | Sim |
| AC-07 | **Nenhuma linha de log legada** aparece: `REDIRECTING...`, `Post Message sent on … page.`, `attempt N/3`, `… was sent to top/parent window …`, `Success, Message Sent!`. | Sim |
| AC-08 | O parceiro que recebe múltiplos `uown_success` avança seu checkout **exatamente uma vez** (idempotência). | Sim |
| AC-09 | Um **flush do Sentry replay** é disparado durante o handoff (sem a linha de erro `Rep flush failed …` numa sessão saudável). | Sim (depende do ambiente) |
| AC-10 | O comportamento se mantém nos parceiros embedados **postMessage** — **PayTomorrow, TireAgent** (demais parceiros postMessage, ex.: Kornerstone, seguem o mesmo caminho) — assinando via **ambos os provedores (GowSign e SignWell)**, e no fluxo **UOWN standalone** (não-postMessage). | Sim |
| AC-11 | UX durante o handoff: toast de sucesso *"Thank you for signing your lease. You will now be redirected..."* + overlay de carregamento exibido até a navegação. | Sim |
| AC-12 | **Assinatura interrompida e retomada:** o cliente fecha a aba de assinatura no meio, reabre, continua e conclui — o handoff então roda **corretamente e exatamente uma vez** (ramo certo, source tag certo, ~10s ou ~2s), sem relay duplicado/residual da aba abandonada. | Sim |

## Cenários

```gherkin
Feature: Handoff pós-assinatura confiável para o parceiro via reenvio de uown_success
  Como uma integração de parceiro embedada
  Para saber de forma confiável que o cliente concluiu a assinatura antes de o iframe ser destruído
  A Origination deve reenviar uown_success a cada segundo por até dez segundos, e então redirecionar

  Background:
    Given um cliente concluindo uma aplicação dentro do iframe do parceiro em staging
    And o DevTools Console aberto com Preserve log habilitado

  Scenario: [negative] Fechar a assinatura sem concluir redireciona imediatamente sem relay
    Given o cliente está na etapa de assinatura de um merchant postMessage
    When o cliente fecha o documento de assinatura sem finalizá-lo
    Then a mensagem informativa "Please wait while we continue…" é exibida
    And o cliente é levado ao fluxo de falha de assinatura imediatamente, sem mensagens repetidas e sem espera de dez segundos

  Scenario: [negative] O fluxo UOWN standalone não envia relay e redireciona após dois segundos
    Given o cliente concluiu a assinatura no fluxo UOWN first-party, cujo merchant tem postMessage desabilitado
    When o handoff de conclusão começa
    Then nenhuma mensagem uown_success é enviada à janela-pai
    And o cliente é redirecionado cerca de dois segundos após o handoff começar

  Scenario: [negative] A página app-complete não envia nenhum relay adicional
    Given o cliente já foi redirecionado para a página app-complete após a assinatura
    When a página app-complete é exibida
    Then a confirmação de sucesso é exibida
    And nenhuma mensagem uown_success adicional é enviada à janela-pai pela página app-complete

  Scenario: [negative] Remover o iframe cedo para o posting mas ainda redireciona a filha
    Given o loop de reenvio está rodando num merchant postMessage
    When o parceiro remove o iframe antes de os dez segundos passarem
    Then a filha para de enviar novas mensagens uown_success
    And a filha ainda tenta o seu redirect antes de ser destruída
    And o parceiro recebeu menos de dez mensagens

  Scenario: [negative] Fechar a aba de assinatura no meio e reabrir ainda conclui o handoff exatamente uma vez
    Given o cliente está no meio da assinatura num merchant postMessage
    When o cliente fecha a aba de assinatura, reabre o link de assinatura e conclui a assinatura
    Then o loop de reenvio roda uma vez na conclusão, marcado com o source correto
    And a janela-pai recebe uown_success e o checkout do parceiro avança exatamente uma vez
    And nenhum relay duplicado ou residual chega da primeira aba abandonada

  Scenario Outline: [positive] Assinatura bem-sucedida num parceiro embedado reenvia o relay por dez segundos
    Given o cliente concluiu a assinatura via <provedor> dentro do iframe do <parceiro> no fluxo de conclusão de aplicação
    When o handoff de conclusão começa
    Then a mensagem de sucesso "Thank you for signing your lease. You will now be redirected..." é exibida com um overlay de carregamento
    And a janela-pai recebe uown_success repetidamente cerca de uma vez por segundo
    And o cliente é redirecionado cerca de dez segundos após o handoff começar
    And o checkout do parceiro avança apenas uma vez apesar das mensagens repetidas

    # O handoff é agnóstico ao provedor (dispara pelo redirectUrl, downstream da cerimônia) e ao parceiro.
    # As linhas cobrem o Teste 8 do brief (PayTomorrow + TireAgent) e, de uma vez, o Teste 1
    # ("GowSign or SignWell") cruzando parceiro × provedor. O provedor efetivo é decidido pelo estado do
    # cliente no merchant (roteamento GowSign/SignWell por estado — ver item pendente #1). Demais parceiros
    # postMessage (ex.: Kornerstone) percorrem o mesmo caminho e podem ser verificados por amostragem.
    Examples:
      | parceiro     | provedor  |
      | PayTomorrow  | GowSign   |
      | TireAgent    | SignWell  |

  Scenario: [positive] O handoff de complete-e-sign reenvia o relay marcado como completeEsign
    Given o cliente concluiu o fluxo dedicado de complete-e-sign num merchant postMessage
    When o handoff de conclusão começa
    Then o mesmo loop de reenvio roda, atribuído ao source de complete-e-sign
    And o cliente é redirecionado cerca de dez segundos após o handoff começar
```

## Checkpoints

### Oráculo

> Strings exatas de `origin/R1.53.2 @ 175a82b4`. `{src}` = `completeApplication`
> (de `[shortCode]/complete`) ou `completeEsign` (de `completeEsign`). "O handoff começa" = o momento em
> que `[esign][redirect] preparing completion handoff` é logado. Assertar **ordem e texto exato**, não
> mera presença (memory: value-correctness + UI-log). Prefira observar o parceiro (pai) realmente
> recebendo a mensagem em vez de ler só o console da filha.

| CT | AC | Descrição | Esperado (exato) | Onde / como verificar |
|---|---|---|---|---|
| CT-01 | AC-11 | Prefácio do handoff + toast + overlay | Console: `[esign][redirect] preparing completion handoff`; texto do toast de sucesso exatamente `Thank you for signing your lease. You will now be redirected...`; overlay de carregamento visível até a navegação | DevTools Console da filha + UI renderizada |
| CT-02 | AC-01 | Linha de início do loop | `[esign][postMessage] starting resend loop (interval=1000ms, max=10000ms) from {src}` | Console da filha (merchant postMessage) |
| CT-03 | AC-01 | attempt-1 precede "scheduled" | `[esign][postMessage] attempt 1 dispatched from {src}` aparece **antes** de `[esign][postMessage] resend loop scheduled; redirect in 10000ms` | Console da filha (sensível à ordem — o brief inverte) |
| CT-04 | AC-01 | Tentativas incrementam ~1/s | `[esign][postMessage] attempt {N} dispatched from {src}` para N = 1,2,3,… ~uma por segundo; a última é ~10 (10 ou 11, dependendo da corrida de timers exatamente em 10000ms). Sem total fixo, sem `N/3`. | Timestamps do Console da filha |
| CT-05 | AC-01 | O pai realmente recebe | A janela-pai recebe `'uown_success'` repetidamente (2 por tentativa quando top===parent, pois `top` e `parent` são ambos postados) | Listener de message na página do parceiro / um probe `window.addEventListener('message')` no pai |
| CT-06 | AC-01 | Redirect ~10s após o handoff | `[esign][redirect] navigating to redirect URL` dispara ~10000ms após o prefácio, então navega para a URL de redirect | Console da filha + mudança de endereço |
| CT-07 | AC-02 | UOWN standalone: sem relay, 2s | `[esign][redirect] navigating in 2000ms (no postMessage)` então `[esign][redirect] navigating to redirect URL`; **zero** linhas `[esign][postMessage] attempt`; redirect ~2000ms após o handoff | Console da filha (merchant UOWN first-party, `postMessage=false`) |
| CT-08 | AC-03 | Cancelar → redirect de falha imediato | Toast info `Please wait while we continue…`; navegação imediata para uma URL `/signingFailure`; **nenhuma** linha `[esign][postMessage]`, **nenhuma** linha `navigating in 2000ms`, **nenhuma** linha `navigating to redirect URL` (o caminho de falha faz curto-circuito) | Console da filha + URL |
| CT-09 | AC-04 | source tag completeEsign | No fluxo complete-e-sign, toda linha do loop termina em `from completeEsign` (nunca `completeApplication`) | Console da filha em `/completeEsign` |
| CT-10 | AC-05 | appComplete sem relay | Ao chegar no app-complete (`document_status=completed`): sucesso/confetti exibido; **nenhum** `uown_success` postado do app-complete; nenhuma linha `… was sent to parent window from appComplete page` | Listener de message no pai + Console da filha no app-complete |
| CT-11 | AC-06 | pagehide para + redireciona | Ao remover o iframe antes de 10s: as linhas attempt param; a filha ainda navega (redirect tentado); contagem recebida pelo pai < 10 | Contagem no pai + Console da filha |
| CT-12 | AC-07 | Sem linhas legadas | **Ausentes** em todos os fluxos: `REDIRECTING...`, `Post Message sent on completeApplication page.`, `Post Message sent on completeEsign page.`, `Success, Message Sent!`, `… was sent to top window from completeApplication page`, `… was sent to parent window from appComplete page`, qualquer total `attempt N/3` / `/3` | Varredura completa do Console (Preserve log) |
| CT-13 | AC-08 | Checkout idempotente | O checkout / a conclusão do parceiro avança **exatamente uma vez** apesar de N (até ~20) mensagens | Estado da UI do parceiro (avanço único, sem pedido duplicado) |
| CT-14 | AC-09 | Flush do Sentry replay | Um flush do Sentry replay ocorre ~1000ms dentro do handoff; **nenhuma** linha de erro `Rep flush failed integration reference is null` numa sessão saudável | Console da filha + presença do Sentry replay |
| CT-15 | AC-10 | Parceiros × provedor × UOWN | CT-01…CT-06 valem idênticos dentro dos iframes de **PayTomorrow, TireAgent** e após assinatura tanto por **GowSign** quanto por **SignWell** (o handoff é o mesmo caminho, agnóstico a parceiro e provedor — demais parceiros postMessage como Kornerstone por amostragem); CT-07 vale para o fluxo **UOWN standalone** | Repetir por parceiro × provedor (Scenario Outline) |
| CT-16 | AC-12 | Reabrir/retomar → um handoff limpo | Após fechar-no-meio → reabrir → concluir: exatamente um loop de reenvio com o `{src}` correto; o checkout do parceiro avança uma vez; **nenhum** segundo loop/sobreposto ou `uown_success` da aba abandonada; tempo correto (~10s postMessage / ~2s standalone) | Listener no pai (avanço único) + Console na aba retomada; confirmar que a aba abandonada não emitiu loop de conclusão |

### Eventos de analytics (evidência secundária)

Emitidos (captura de network/analytics): `POSTMESSAGE_SEQUENCE_STARTED`, `POSTMESSAGE_SENT` (pageName
`{src}:{N}` por tentativa), `REDIRECT_STARTED`, `POSTMESSAGE_SEQUENCE_COMPLETED`, `REDIRECT_COMPLETED`.
**NÃO deve** emitir o removido `POSTMESSAGE_RECEIVED`.

### Comando de verificação de staleness (cross-repo — FE de origination + svc, NÃO qa-uown)

```bash
# O código da feature vive em repos irmãos. Faça fetch das branches de release, depois diff dos arquivos
# cobertos do sha de origem revisado até o tip da branch atual. Saída = um arquivo coberto mudou → talvez stale.
git -C ../uown/origination fetch origin R1.53.2 --quiet
git -C ../uown/origination log 175a82b4575645bed4644f2cf97655d48d268be5..origin/R1.53.2 -- \
  hooks/useEsignCompletionRedirect.ts \
  utils/helper.tsx \
  lib/analytics/events.ts \
  'pages/[shortCode]/complete/index.tsx' \
  pages/completeEsign/index.tsx \
  pages/appComplete/index.tsx
# Roteamento no backend (flag postMessage) — checar no tip da sua própria branch:
git -C ../uown/svc log --oneline -5 -- \
  src/main/java/com/uownleasing/svc/service/esign/EsignRedirectService.java
```

> Sem saída = arquivos cobertos inalterados desde a revisão → BDD atual. Com saída = prefixar
> `[BDD MAY BE STALE — <arquivo> mudou em origin/R1.53.2 desde 175a82b4]`. Ao re-revisar, atualize AMBOS
> `last-reviewed`/`last-reviewed-sha` (qa-uown) e `source-sha` (origination). Nota: a forma
> `git log <sha>..HEAD -- <covers>` da regra #19, rodada no qa-uown, **não retorna nada** aqui porque os
> paths cobertos estão em outro repo — sempre rode o comando cross-repo acima.

## Matriz de cobertura

| Critério de Aceite | Cenário(s) / CT | Status |
|---|---|---|
| AC-01 — merchant postMessage: reenvio ~10s + redirect | CT-01,02,03,04,05,06 · [positive] parceiro embedado (Outline) | Coberto (contrato) |
| AC-02 — UOWN standalone: sem relay, ~2s | CT-07 · [negative] fluxo UOWN standalone | Coberto (contrato) |
| AC-03 — cancelar → redirect de falha imediato | CT-08 · [negative] fechar sem concluir | Coberto (contrato) |
| AC-04 — source tag completeEsign | CT-09 · [positive] handoff complete-e-sign | Coberto (contrato) |
| AC-05 — appComplete sem relay | CT-10 · [negative] app-complete sem relay | Coberto (contrato) |
| AC-06 — fechamento precoce do iframe | CT-11 · [negative] remover iframe cedo | Coberto (contrato) |
| AC-07 — sem linhas legadas | CT-12 · (assertado em todos os cenários) | Coberto (contrato) |
| AC-08 — checkout idempotente | CT-13 · [positive] parceiro embedado (Outline) | Coberto (contrato) |
| AC-09 — flush do Sentry replay | CT-14 · (assertado durante o handoff) | Coberto (contrato) |
| AC-10 — PayTomorrow + TireAgent + UOWN, via GowSign e SignWell (Kornerstone por amostragem) | CT-15 · [positive] Outline (parceiro × provedor) + [negative] UOWN standalone | Coberto (contrato) |
| AC-11 — toast + overlay | CT-01 · [positive] parceiro embedado | Coberto (contrato) |
| AC-12 — reabrir/retomar assinatura → um handoff limpo | CT-16 · [negative] fechar aba no meio e reabrir | Coberto (contrato) |

## Itens pendentes (antes da validação em ambiente)

1. **Entrada é pelo PORTAL DO PARCEIRO, não por `sendApplication` na API.** A aplicação DEVE ser criada
   através do portal do parceiro, que embeda a origination num iframe — é o que produz o contexto embedado
   real onde o handoff dispara. Criar por API + dirigir a origination direto é a porta ERRADA (bula o
   iframe do pai). Caminhos existentes a reutilizar:
   - **PayTomorrow** → `PayTomorrowPortalPage` (login em `merchant-staging.paytomorrow.com` →
     criar aplicação *customer not present* → finalization → contrato/e-sign no iframe UOWN embedado
     `secure-sandbox.uownleasing.com/{token}/complete` → source `completeApplication`). Exemplo:
     `tests/e2e/origination/paytomorrow-refund-flow.spec.ts` (Fases 1-6). Merchant confirmado:
     **`OL90402-0001` — MSA Powersports** (clientType `PAY_TOMORROW`, `postMessage=true` no sandbox);
     creds em `PAYTOMORROW_PORTAL_DEFAULTS` (`src/data/merchants.ts`).
   - **TireAgent** → `PayPairPortalPage` (PayPair `dw93bg.paypair.com` → Get Lease → OTP → prequal →
     pt-iframe com o form de contrato/pagamento UOWN → `completePaymentAndSigning`). Exemplo:
     `tests/e2e/tire-agent-unified-flow.spec.ts`. clientType `TIRE_AGENT` (já no default da config).
   - **UOWN first-party (não-postMessage, AC-02):** merchant cujo clientType está fora da lista (ex.:
     `V1_UOWN`) — entra pela contract URL UOWN direta (sem portal de parceiro).
   O provedor (**GowSign** vs **SignWell**) é decidido pelo **estado do cliente** — escolher um estado que
   roteie para o provedor desejado (MSA/TX → SignWell, conforme o refund-flow spec). Cobrir cada provedor
   ≥1× basta; Kornerstone só por amostragem.
2. **Observação (nativa no fluxo embedado):** o **pai real É o portal do parceiro** — não precisa de
   harness. Para CT-05/CT-10/CT-13/CT-16, injetar `window.addEventListener('message', ...)` na página do
   portal (`ptPage`) ANTES de concluir o e-sign, logando cada `uown_success` recebido com timestamp. Os
   logs `[esign]` da filha saem do iframe cross-origin (`secure-sandbox.uownleasing.com`), mas o
   `page.on('console')` do Playwright captura **todos os frames** — então um único listener no `ptPage`
   pega tanto o dispatch (console da filha) quanto o recebimento (listener injetado no pai).
3. **Landing ao reabrir/retomar (AC-12):** confirmar onde o link de assinatura reaberto cai quando o
   documento **ainda não foi concluído** (retomar assinatura) vs **já concluído no servidor** (→ app-complete,
   sem relay). Rodar um `discovery` no caminho de reabertura se a rota de landing for incerta; a assertiva
   "exatamente um handoff limpo, sem loop residual da aba abandonada" vale nos dois casos.
4. **Corrida de timers em 10000ms (CT-04):** confirmar empiricamente se a última tentativa é 10 ou 11 —
   ambas são conformes à spec; fixar o valor observado no report, mas não falhar por 10-vs-11.
5. **Sentry replay (CT-14):** a integração de replay precisa estar ativa em staging para um PASS limpo;
   caso contrário a linha `Rep flush failed …` é esperada e é uma condição de ambiente, não um bug.
6. **Obrigação da regra #19 na execução:** rodar a cerimônia de assinatura para validar isto É executar
   também as operações `gowsign-signing` / `signwell-signing` — leia os checkpoints desses oráculos na
   mesma rodada.
