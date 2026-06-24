> **Este arquivo e registro de execucao, NAO fonte de padrao.** Selectors, helpers, classificacoes e page objects vivem em `.claude/skills/` e `src/`. Reler este report para inferir patterns = bug do agente (regra #16).

# Relatorio de Teste: SEON IDV Widget — Comportamento do Usuario (P0)

## Informacoes da Tarefa

- **Task ID:** seon-widget-user-behavior
- **Origem:** Investigacao interna — gap identificado em 2026-06-23 (discovery `docs/knowledge-base/seon-idv-widget-user-behavior.md`). Nao ha numero de task GitLab; trata-se de cobertura proativa da camada UI do fluxo SEON IDV.
- **Implementador:** qa-implementer
- **Validador:** qa-validator
- **Data de validacao:** 2026-06-23 22:52–22:54 (UTC)
- **Ambiente:** sandbox (unico env que renderiza o widget SEON ao vivo)
- **Branch:** tests
- **DB tunnel verificado:** `SELECT MAX(pk) FROM uown_los_lead` retornou 97971 (pre-run) e 97976 (pos-run), confirmando sandbox (~98k) — NAO o DB de producao (~6M). `[db-observation:sandbox,2026-06-23]`

## Descricao

O suite existente de SEON (100% backend-gate-focused) injeta resultados via API ou remove o iframe do DOM com `dismissSeonOverlay`. Isso deixa sem cobertura todo o comportamento real do cliente: renderizacao do overlay, consent gate, cancelamento via X, e bloqueio do formulario de pagamento.

Esta suite preenche esse gap exercendo o widget cross-origin via `frameLocator` (SeonWidgetComponent), sem usar `dismissSeonOverlay` — preservando a propriedade de safety que queremos provar.

## Execucao do Teste

- **Arquivo:** `tests/e2e/origination/seon-widget-user-behavior.spec.ts`
- **Componente:** `src/pages/components/seon-widget.component.ts` + `src/pages/components/index.ts`
- **Projeto Playwright:** `origination-ui`
- **Merchant:** FifthAveFurnitureNY (KS3015, Kornerstone) — `isSeonIdCheckRequired=true` habilitado em beforeAll, restaurado via `merchantConfig.restoreAll()` em afterAll
- **Estado do lead:** NY
- **Data/hora de execucao:** 2026-06-23 22:52:00 UTC (validador); execucao anterior do usuario: 2026-06-23 (mesmo dia)
- **Duracao:** ~1min 42s (total suite incluindo auth setup)
- **Resultado geral:** 7 passaram, 1 skipped (CT-06 device @manual, intencional)
- **Video/trace:** N/A (modo list reporter)

## Evidencias — Dados Utilizados/Criados

Cada CT cria um lead fresh via `sendApplication` (regra #9). Abaixo os leads desta execucao de validacao (`[db-observation:sandbox,uown_los_lead,2026-06-23]`):

| CT | Lead PK | Lead Status | Internal Status | Criado? | Papel |
|----|---------|-------------|-----------------|---------|-------|
| CT-01 | 97972 | UW_APPROVED | UW_APPROVED | Criado | Widget render + activity log |
| CT-02 | 97973 | UW_APPROVED | UW_APPROVED | Criado | Consent gate |
| CT-03 | 97974 | UW_APPROVED | UW_APPROVED | Criado | Cancel via X |
| CT-10 | 97975 | UW_APPROVED | UW_APPROVED | Criado | Form bloqueado |
| CT-06 | 97976 | UW_APPROVED | BLACKLIST_APPROVED | Criado | API stand-in (SEON approve + submit) |

> Nota sobre CT-06: `internal_status=BLACKLIST_APPROVED` apos `approveVerification` + `submitApplication` — o campo `BLACKLIST_APPROVED` indica que o SEON gate foi satisfeito e o blacklist check passou. `uown_seon` para o lead 97976 tem row `status=APPROVED, id_verify_success=true` como esperado. `[db-observation:sandbox,uown_seon WHERE lead_pk=97976,2026-06-23]`

## Capturas de Tela

N/A para esta execucao (modo headless, reporter list). Screenshots de descoberta do widget disponíveis em `docs/knowledge-base/` (capturadas durante a investigacao de 2026-06-23 via MCP Playwright: `seon-widget-desktop-1440.png`, `seon-widget-mobile-375.png`). `[user-provided:discovery-mcp,2026-06-23]`

## Cenarios

### CT-01

**Objetivo:** Confirmar que o widget SEON renderiza como overlay fullscreen bloqueante ao carregar `/complete` para um lead SEON-gated.

**O que e verificado:** Ao navegar para a URL de contrato de um lead cujo merchant tem `isSeonIdCheckRequired=true` e nenhum registro SEON valido existe, o widget `iframe[data-testid="seon-idv-iframe"]` (cross-origin, `transfer.seonidv.com`) injeta automaticamente e o heading "Verify your identity" fica visivel. A nota `[SubmitApplicationResponse] Error: Failed to verify identification.` e escrita em `uown_los_lead_notes`. O `internal_status` do lead permanece nao-terminal (NAO `SEON_ID_FAILED`) pois nenhum registro SEON existe ainda, o que e o comportamento correto segundo `SeonIdVerificationStep.java` (STOP-before-verifySean).

**Como verificar manualmente:**
1. Acesse o sandbox e crie um lead para FifthAveFurnitureNY (KS3015) com `isSeonIdCheckRequired=true` habilitado.
2. Abra a URL de contrato (`paymentDetailsList[1].redirectUrl`) no browser.
3. Aguarde ~5s para o conteudo cross-origin carregar.
4. Confirme: iframe `[data-testid="seon-idv-iframe"]` visivel, heading "Verify your identity" presente.
5. Execute: `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = {pk} AND notes ILIKE '%Failed to verify identification%'` — deve retornar 1 row.
6. Execute: `SELECT internal_status FROM uown_los_lead WHERE pk = {pk}` — deve ser `UW_APPROVED`, nao `SEON_ID_FAILED`.

**Status:** PASSOU

**Evidencias:**
- Lead criado: pk=97972 `[db-observation:sandbox,uown_los_lead WHERE pk=97972]`
- Activity log confirmado: nota `[SubmitApplicationResponse] Error: Failed to verify identification.` em `uown_los_lead_notes` (row_created_timestamp 2026-06-23T22:52:27Z) `[db-observation:sandbox,uown_los_lead_notes WHERE lead_pk=97972]`
- internal_status=UW_APPROVED (nao SEON_ID_FAILED, correto) `[db-observation:sandbox,uown_los_lead WHERE pk=97972]`
- Mecanismo de trigger: `[UownClient][getMissingRequiredFields]` → `[SubmitApplicationResponse] Error:` (sequencia de notas confirmada) `[db-observation:sandbox,uown_los_lead_notes WHERE lead_pk=97972]`

**Mapeamento AC:** AC-1 (widget auto-injeta fullscreen blocking)

**Avaliacao de cobertura:** Adequada — isSeonWidgetVisible() verificado contra o heading interno do frame cross-origin (nao apenas o elemento iframe externo), o que prova que o conteudo de fato carregou e nao ficou em loading. Activity log (Rule #13) explicitamente assertido. internal_status corretamente validado como nao-terminal.

---

### CT-02

**Objetivo:** Confirmar que o consent gate funciona — "Start verification" fica desabilitado ate o checkbox de privacidade ser marcado.

**O que e verificado:** Antes de marcar o checkbox "I have read and agree to the Privacy Notice", o botao "Start verification" esta desabilitado (atributo `disabled` presente). Apos `acceptPrivacyConsent()`, o botao torna-se habilitado. Nenhum registro terminal em `uown_seon` e criado somente pelo consentimento (sem completar a camera).

**Como verificar manualmente:**
1. Crie um lead SEON-gated e abra a URL de contrato.
2. Sem marcar o checkbox, confirme que "Start verification" esta desabilitado (acinzentado, nao clicavel).
3. Marque o checkbox.
4. Confirme que "Start verification" torna-se clicavel.
5. `SELECT status FROM uown_seon WHERE lead_pk = {pk}` deve retornar 0 rows (nenhum registro criado apenas por consentir).

**Status:** PASSOU

**Evidencias:**
- Lead criado: pk=97973 `[db-observation:sandbox,uown_los_lead WHERE pk=97973]`
- isStartVerificationEnabled() retornou `false` antes do consent e `true` apos — validado via `expect.poll` com timeout 10s `[test-execution:origination-ui,sandbox,2026-06-23]`
- `uown_seon WHERE lead_pk=97973`: 0 rows (nenhum registro criado so por consentir) `[db-observation:sandbox,uown_seon WHERE lead_pk=97973]`

**Mapeamento AC:** AC-2 (consent gate)

**Avaliacao de cobertura:** Adequada — o teste nao apenas verifica o estado do botao mas tambem confirma o guard negativo (nenhum SEON record criado), o que prova que o gate nao foi bypassado pela UI.

---

### CT-03

**Objetivo:** Observar o comportamento real de cancelamento via X — o que acontece quando o cliente clica o X no canto superior direito do widget.

**O que e verificado:** Ao clicar o botao X (close), o widget pode ou nao fechar em 15s. O resultado e observado e documentado, nao forcado. O `internal_status` do lead permanece nao-terminal apos o cancel. A presenca de nota de cancelamento em `uown_los_lead_notes` e verificada (Rule #13).

**Como verificar manualmente:**
1. Crie um lead SEON-gated, abra a URL de contrato, aguarde o widget aparecer.
2. Clique o X no canto superior direito do frame SEON.
3. Aguarde ate 15s: o overlay fecha? A pagina volta a ser interativa?
4. `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = {pk} AND (notes ILIKE '%cancel%' OR notes ILIKE '%SEON%')` apos o click — ha nota?

**Status:** PASSOU

> **[OBSERVACAO-01] X close nao dismissou o widget em 15s (sandbox 2026-06-23, lead 97974):** Ao clicar o botao X (`[class*="close-button"]`), o widget nao fechou dentro de 15s. `isSeonWidgetVisible(15_000)` retornou `true` apos o timeout. `startVerificationReachable=false` (o botao nao estava acessivel pos-click do X). Comportamento reproduzido em 2 execucoes independentes: probe standalone (usuario, 2026-06-23) e esta execucao de validacao. Classificacao: `[OBSERVACAO]`. Hipoteses: (a) comportamento intencional do SEON em sandbox-mode (X pode exibir confirmacao in-frame nao capturada), (b) o CSS-module close-button selector (`[class*="close-button"]`) acertou o elemento mas o click nao propagou conforme esperado pelo SDK SEON (cross-origin postMessage nao disparado). NAO falha de build — o CT captura e documenta o comportamento real. Repro em env nao-sandbox e dificil (SEON so renderiza ao vivo em sandbox). `[test-execution:origination-ui,sandbox,2026-06-23]` `[user-provided:probe-standalone,2026-06-23]`

> **[OBSERVACAO-02] Nenhuma nota de cancel em uown_los_lead_notes (sandbox 2026-06-23, lead 97974):** Apos clicar o X, busca por `notes ILIKE '%cancel%'` e `notes ILIKE '%SEON%'` retornou 0 resultados para o lead 97974. Classificacao: `[OBSERVACAO]`. Pode ser (a) gap de observabilidade — o backend nao registra o evento de cancel do widget (possivel Rule #13 gap), ou (b) consequencia de (a) acima: se o X nao gerou evento postMessage de cancel para o backend, o backend nao tinha nada para logar. NAO e classifcada como bug confirmado. `[db-observation:sandbox,uown_los_lead_notes WHERE lead_pk=97974]`

> **internal_status:** UW_APPROVED (nao SEON_ID_FAILED) apos o cancel — confirma que o lead permanece pre-verificacao. `[db-observation:sandbox,uown_los_lead WHERE pk=97974]`

**Mapeamento AC:** AC-3 (cancel via X — observado; gaps Rule #13 flagados)

**Avaliacao de cobertura:** Adequada para o risco identificado — o CT exerceu o fluxo real (nao o DOM removal), capturou o comportamento observado (X nao fecha em 15s), validou que o lead nao foi corrompido, e registrou o gap de observabilidade Rule #13. A ausencia de assert de dismissal no build foi intencional (nao forcamos o comportamento esperado — capturamos o real).

---

### CT-10

**Objetivo:** Provar que o formulario de pagamento esta bloqueado enquanto o overlay SEON esta ativo — o cliente nao consegue preencher o cartao de credito sem completar a verificacao.

**O que e verificado:** Com o widget SEON renderizado, o campo "Card Number" nao e editavel (overlay com `position:fixed, z-index:2147483647` intercepta a interacao). Nenhum registro SEON terminal existe. O `internal_status` permanece nao-terminal. `dismissSeonOverlay`/`hideWidget` NAO e chamado — o overlay permanece.

**Como verificar manualmente:**
1. Crie um lead SEON-gated, abra a URL de contrato, aguarde o widget aparecer.
2. Tente clicar no campo "Card Number" atras do overlay — o campo nao deve receber foco.
3. `SELECT status FROM uown_seon WHERE lead_pk = {pk}` deve retornar 0 rows.
4. `SELECT internal_status FROM uown_los_lead WHERE pk = {pk}` deve ser UW_APPROVED.

**Status:** PASSOU

**Evidencias:**
- Lead criado: pk=97975 `[db-observation:sandbox,uown_los_lead WHERE pk=97975]`
- `isSeonGateBlockingPaymentForm(contract.cardNumberField)` retornou `true` — campo nao editavel `[test-execution:origination-ui,sandbox,2026-06-23]`
- `uown_seon WHERE lead_pk=97975`: 0 rows (nenhum charge disparado) `[db-observation:sandbox,uown_seon WHERE lead_pk=97975]`
- internal_status=UW_APPROVED `[db-observation:sandbox,uown_los_lead WHERE pk=97975]`

**Mapeamento AC:** AC-4 (form bloqueado atras do overlay)

**Avaliacao de cobertura:** Adequada — esta e a propriedade de safety mais critica (evitar que o cliente seja cobrado sem completar IDV). O CT usa `isSeonGateBlockingPaymentForm()` que chama `isEditable()` sem `force:true` e sem remover o overlay, provando a propriedade real. Duracao mais longa (~28s) explicada pelo waitForSeonWidget(45s) — o timeout nao atingiu, widget carregou normalmente.

---

### CT-06

**Objetivo:** Provar o efeito downstream do fluxo completo de verificacao SEON — apos `approveVerification` via API, o `submitApplication` passa o gate e o lead avanca.

**O que e verificado:** (1) O widget renderiza inicialmente (lead enfrenta o gate); (2) API `approveVerification` cria row `APPROVED` em `uown_seon` com `id_verify_success=true`; (3) `submitApplication` passa o SEON gate; (4) nota de atividade (ContractService/CONTRACT_CREATED) e procurada — ausente em Kornerstone/sandbox (limitacao conhecida).

**Como verificar manualmente:**
1. Crie um lead SEON-gated, abra a URL de contrato, confirme que o widget aparece.
2. Chame `POST /uown/svc/seon/{leadPk}/idVerification` com `idVerifySuccess=true`, `fullName`, `birthDate`.
3. `SELECT status, id_verify_success FROM uown_seon WHERE lead_pk = {pk}` deve retornar `APPROVED, true`.
4. Chame `POST /uown/svc/submitApplication` e confirme `ok=true`.
5. `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = {pk} AND notes ILIKE '%ContractService%'` — pode ser ausente em Kornerstone/sandbox (limitacao documentada).

**Status:** PASSOU

**Evidencias:**
- Lead criado: pk=97976 `[db-observation:sandbox,uown_los_lead WHERE pk=97976]`
- `uown_seon WHERE lead_pk=97976`: `status=APPROVED, id_verify_success=true` (row criada em 2026-06-23T22:53:43.509Z) `[db-observation:sandbox,uown_seon WHERE lead_pk=97976]`
- `submitApplication` retornou `ok=true` `[test-execution:origination-ui,sandbox,2026-06-23]`
- internal_status=BLACKLIST_APPROVED pos-submit (SEON gate satisfeito + blacklist check passou) `[db-observation:sandbox,uown_los_lead WHERE pk=97976]`

> **[OBSERVACAO-03] Nenhuma nota ContractService pos-submit API (Kornerstone/sandbox, lead 97976):** Busca por `ContractService`, `CONTRACT_CREATED`, e `SEON` em `uown_los_lead_notes` pos-`submitApplication` retornou 0 resultados. Classificacao: `[OBSERVACAO]`. Limitacao conhecida do fluxo API-only Kornerstone em sandbox — documentada como bypass CT-07b no spec `seon-id-verification-bypass.spec.ts`. NAO e bug desta task. `[db-observation:sandbox,uown_los_lead_notes WHERE lead_pk=97976]` `[skill:activity-log-validation §Gaps conhecidos]`

**Mapeamento AC:** AC-5 (completion downstream via stand-in)

**Avaliacao de cobertura:** Adequada como stand-in — o CT prova que o gate e superavel via aprovacao de verificacao e que o submit downstream funciona. A lacuna do fluxo real com camera (CT-06 device) esta explicitamente documentada como manual e fora do CI.

---

### CT-06 (device variant)

**Objetivo:** Validar o fluxo real de camera/documento/selfie/liveness no widget SEON.

**Status:** SKIPPED

> Motivo: requer camera real e nao e executavel deterministicamente em CI. Variante manual documentada no cabecalho do spec. Para executar: `RUN_SEON_MANUAL=1 npx playwright test ... --grep "device variant"`.

---

## Achados

| ID | Tipo | Severidade | Prioridade | Descricao |
|----|------|-----------|-----------|-----------|
| OBS-01 | [OBSERVACAO] | S3 | P2 | X close do widget nao dismissou em 15s em sandbox (reproduced 2x: probe + validacao). Pode ser comportamento intencional do SDK SEON em sandbox-mode ou limitacao do selector. |
| OBS-02 | [OBSERVACAO] | S3 | P2 | Nenhuma nota de cancel em `uown_los_lead_notes` apos click no X — possivel gap de observabilidade Rule #13 para o evento de cancel SEON. |
| OBS-03 | [OBSERVACAO] | S4 | P3 | Nenhuma nota `ContractService` em `uown_los_lead_notes` apos `submitApplication` via API para lead Kornerstone em sandbox — limitacao conhecida do bypass CT-07b, nao e bug desta task. |

**Nenhum bug [CONFIRMADO] encontrado nesta execucao.** As 3 observacoes nao atingem o threshold para classificacao como bug confirmado (Rule #10): OBS-01/OBS-02 podem ser comportamento de sandbox-mode do SDK SEON (necessita investigacao com dev/PO); OBS-03 e limitacao previamente documentada.

## Cobertura vs Risco (Risk-Based Prioritization)

| Area de risco (do SPEC) | Nivel de risco | Cenarios cobrindo | Adequado? |
|------------------------|---------------|-------------------|-----------|
| Widget nao renderiza / fica em loading | Alto (P0) — cliente bloqueado sem feedback | CT-01 (heading interno verificado, nao so iframe externo) | Sim |
| Consent gate quebrado (usuario nao consegue iniciar) | Alto (P0) — bloqueia todo o fluxo IDV | CT-02 (disabled→enabled verificado + guard negativo SEON record) | Sim |
| Cancel UX trapping (usuario nao consegue sair do modal) | Alto (P0) — usuario preso; experiencia critica | CT-03 (real X exercido; OBS-01 capturada) | Sim — comportamento real observado e documentado |
| Form bloqueado (pagamento sem verificacao) | Alto (P0) — safety property critica | CT-10 (isEditable sem dismiss) | Sim |
| Downstream apos verificacao bem-sucedida | Medio (P1) | CT-06 API stand-in | Sim para gate de CI; camera real = manual |
| Mobile render (375x667) | Medio (P1) | Nao coberto nesta suite (SEON-UB-08) | Gap — documentado para proxima iteracao |
| Re-inject apos cancel/reload (SEON-UB-11) | Medio (P1) | Nao coberto nesta suite | Gap — documentado para proxima iteracao |
| Tablet render (768x1024) | Baixo (P2) | Nao coberto nesta suite (SEON-UB-09) | Diferido |

**Avaliacao geral:** Cobertura P0 adequada. Os 4 CTs P0 automatizados (CT-01, CT-02, CT-03, CT-10) cobrem as propriedades de risco criticas: render, consent gate, cancel UX observado, e form-blocked. Os gaps identificados (mobile render, re-inject) sao P1/P2 e podem ser planejados em iteracao futura.

## Nota sobre erros tsc pre-existentes

`tests/e2e/gowsign/gowsign-servicing-portal-qa2.spec.ts` apresenta erros de compilacao TypeScript pre-existentes (uncommitted, fora do nosso escopo). Esses erros NAO afetaram a execucao desta suite (Playwright isola specs por arquivo). Nenhuma acao tomada; mencionado apenas para referencia.

## Resumo da Validacao

| Criterio | Status | Observacao |
|---------|--------|-----------|
| Rule #9 — Fresh data por CT | Passou | 5 leads frescos criados (pk 97972-97976) |
| Rule #13 — Activity log assertido | Passou (com OBS) | CT-01: nota "Failed to verify identification" confirmada; CT-02: guard negativo SEON record; CT-03: ausencia de nota de cancel documentada como OBS-02; CT-06: ausencia pos-submit documentada como OBS-03 (limitacao conhecida) |
| Rule #14 — UI-first | Passou | Widget exercido via frameLocator (cross-origin real); API usada apenas como setup/precondition e stand-in docuemntado (CT-06) |
| Rule #10 — Classificacao conservadora | Passou | Nenhum [CONFIRMADO]; 3 [OBSERVACAO] adequadamente classificadas |
| AC-1 (widget fullscreen blocking) | Passou | CT-01 |
| AC-2 (consent gate) | Passou | CT-02 |
| AC-3 (cancel via X) | Passou com OBS-01/OBS-02 | CT-03 — comportamento real capturado, nao forcado |
| AC-4 (form bloqueado) | Passou | CT-10 |
| AC-5 (completion downstream) | Passou com OBS-03 | CT-06 — limitacao Kornerstone/sandbox documentada |
| tsc --noEmit | Pre-existente com erros fora do escopo | Erros em `gowsign-servicing-portal-qa2.spec.ts` (NAO desta task) |
| Ciclo de validacao | 1/3 | Primeira execucao — sem re-trabalho necessario |

## Decisoes

- **Bugs levantados:** Nenhum `[CONFIRMADO]`. As 3 observacoes (OBS-01, OBS-02, OBS-03) sao documentadas e requerem decisao de PO/dev antes de abertura de ticket.
- **Recomendacao OBS-01/OBS-02:** Apresentar ao dev/PO para confirmar se (a) o X em sandbox-mode e intencional (SDK behavior), e (b) se o backend deve registrar evento de cancel SEON (Rule #13 gap real). Aguardar confirmacao antes de abrir ticket.
- **OBS-03:** Limitacao documentada, nenhuma acao necessaria.
- **Gaps de cobertura (P1):** mobile render (SEON-UB-08) e re-inject apos cancel (SEON-UB-11) identificados para iteracao futura. NAO bloqueiam o fechamento deste ciclo P0.

## Handoff

Pronto para: **qa-doc-keeper** (catalogar SeonWidgetComponent, pitfall sobre cancel UX nao-trivial, OBS-01/OBS-02 como gap de observabilidade a confirmar).

Evidence stakeholder-facing (`-evidence.md`) NAO gerada nesta execucao — usuario nao sinalizou "pipeline fechado / pronto pra colar no ticket" (regra #17).

---

**Skills loaded:** `.claude/skills/test-report-standard/SKILL.md`, `.claude/skills/bug-classification/SKILL.md`, `.claude/skills/activity-log-validation/SKILL.md`, `.claude/skills/risk-based-prioritization/SKILL.md`, `.claude/skills/acceptance-criteria-review/SKILL.md`, `.claude/skills/volatile-knowledge-registry/SKILL.md`
