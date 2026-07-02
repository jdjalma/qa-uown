---
operation: seon-identity-verification
description: Verificação de identidade via widget SEON IDV no portal do consumidor (/complete de merchant Kornerstone com isSeonIdCheckRequired=true) — renderização do overlay bloqueante, gate de consentimento, cancelamento, bloqueio do formulário de pagamento, conclusão (bypass API / câmera manual) e o fluxo E2E híbrido de assinatura com bypass SEON. Cobre também a mecânica do status terminal SEON_ID_FAILED (internal_status, NÃO lead_status).
last-reviewed: 2026-07-01
last-reviewed-sha: aac805b
covers:
  - tests/e2e/origination/seon-widget-user-behavior.spec.ts
  - tests/e2e/origination/seon-e2e-flow.spec.ts
  - src/pages/components/seon-widget.component.ts
  - src/pages/origination/contract.page.ts
  - docs/knowledge-base/seon-idv-widget-user-behavior.md
  - docs/business-rules/02-originacao-pipeline.md
  - docs/business-rules/appendix-a-integracoes.md
  - .claude/skills/fraud-vendors-knowledge/SKILL.md
---

# Oracle BDD — Verificação de Identidade SEON (SEON IDV)

> **Gatilho:** qualquer operação que exercite o step de verificação de identidade SEON — abrir `/complete` de um merchant com `isSeonIdCheckRequired=true` (família Kornerstone, ex. KS3015/FifthAveFurnitureNY), interagir com o widget SEON IDV (consentimento, Start verification, X de fechar), o formulário de pagamento por trás do overlay, o bypass via API `api.seon.approveVerification` / `POST /uown/los/seon/createOrUpdate`, ou o fluxo E2E de assinatura que passa pelo gate SEON. Inclui rodar `seon-widget-user-behavior.spec.ts` ou `seon-e2e-flow.spec.ts` (rodar o spec É executar a operação — regra #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log aac805b..HEAD -- \
>   tests/e2e/origination/seon-widget-user-behavior.spec.ts \
>   tests/e2e/origination/seon-e2e-flow.spec.ts \
>   src/pages/components/seon-widget.component.ts \
>   src/pages/origination/contract.page.ts \
>   docs/knowledge-base/seon-idv-widget-user-behavior.md \
>   docs/business-rules/02-originacao-pipeline.md \
>   docs/business-rules/appendix-a-integracoes.md \
>   .claude/skills/fraud-vendors-knowledge/SKILL.md
> ```
> Sem output = oracle está atual. Se qualquer arquivo `covers` mudou intencionalmente, o BDD pode estar obsoleto: prefixe o resultado com `[BDD MAY BE STALE]` e re-valide contra a fonte antes de reportar bug (regra #19c).
>
> **Viewport (regra #15):** o widget SEON é uma superfície voltada ao cliente. O portal do consumidor (`secure-sandbox.kornerstoneliving.com/{shortCode}/complete`) é **customer-facing** — inspecionar em **375×667** + **768×1024** + **1440×900**. O overlay renderiza responsivamente em todos (KB confirma 375 e 1440); a variante mobile (SEON-UB-08/09) é um gap de cobertura, não um caminho testado.
>
> **Ambiente:** sandbox. O widget SEON injeta ao vivo no sandbox; o campo `paymentDetailsList[].redirectUrl` (URL do contrato) só é populado no sandbox no caminho `sendApplication`-with-order. Em stg esse array volta vazio → usar o caminho pré-qualificação + `sendInvoice` (fora do escopo deste oracle). DB via túnel 5445 — **verificar a identidade do env antes de confiar no DB** (5445 alterna entre envs).
>
> **Distinção de contexto — dois caminhos neste oracle:**
> 1. **Comportamento do widget (CT-01 a CT-06):** exercita o overlay cross-origin real via `SeonWidgetComponent` (padrão `frameLocator`). NÃO usar `dismissSeonOverlay` (que só esconde/remove o iframe do DOM e mascara a armadilha). Fonte: `seon-widget-user-behavior.spec.ts`.
> 2. **E2E híbrido com bypass API (CT-07, CT-08):** o overlay da câmera é impossível em headless → a verificação é aprovada via API antes de dirigir a UI do contrato. Fonte: `seon-e2e-flow.spec.ts`.
>
> **Pré-condição obrigatória:** `isSeonIdCheckRequired=true` no merchant KS3015 (default é `false` em TODOS os envs — sem isso o `SeonIdVerificationStep` é pulado e o widget nunca renderiza). Lead FRESCO por CT (regra #9). Merchant preflight NÃO deve resetar a flag SEON: o spec chama `sendApplication` direto (não `createPreQualifiedApplication`) e restaura a flag no teardown (`restoreAll`).

---

## CT-01 — Widget SEON renderiza como overlay bloqueante em `/complete`

```gherkin
Dado que existe um lead fresco aprovado de um merchant Kornerstone com isSeonIdCheckRequired=true e sem registro SEON válido
Quando o cliente abre a página /complete do contrato
Então o widget SEON de verificação de identidade é exibido como um overlay que cobre a viewport inteira
E o título "Verify your identity" está visível dentro do iframe transfer.seonidv.com
E uma nota "Failed to verify identification." é gravada em uown_los_lead_notes (Regra #13 — o widget aparece PORQUE o submit retornou essa falha)
E o internal_status do lead permanece UW_APPROVED (nenhum registro SEON ainda → SeonIdVerificationStep dá STOP antes de verifySeon, NÃO grava SEON_ID_FAILED)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Widget visível | `SeonWidgetComponent.isSeonWidgetVisible()` retorna `true` após `waitForSeonWidget(45_000)` | `seon-widget-user-behavior.spec.ts:135-140` |
| Iframe / overlay | `iframe[data-testid="seon-idv-iframe"]`, src `https://transfer.seonidv.com/?seon-idv-transfer-token=...`, `position:fixed`, `z-index:2147483647`, cobre (0,0,W,H) | `seon-idv-widget-user-behavior.md` (tabela "The real widget") |
| Título interno | "Verify your identity" (o conteúdo carrega ~5 s após o goto → esperar o heading interno, não o iframe) | `seon-idv-widget-user-behavior.md`; `seon-widget-user-behavior.spec.ts:136-137` |
| Nota de atividade (Regra #13) | `waitForLeadNoteSubstring(db, leadPk, 'Failed to verify identification', { timeoutMs: 60_000 })` retorna truthy | `seon-widget-user-behavior.spec.ts:143-150` |
| `internal_status` | `db.getLeadInternalStatus(leadPk)` diferente de `'SEON_ID_FAILED'` | `seon-widget-user-behavior.spec.ts:152-159` |
| `lead_status` | `db.getLeadStatus(leadPk).toUpperCase()` contém `'UW_APPROVED'` | `seon-widget-user-behavior.spec.ts:157-158` |

```sql
-- Nota-gatilho do widget (substituir $lead_pk)
SELECT pk, notes FROM uown_los_lead_notes
WHERE lead_pk = $lead_pk AND notes ILIKE '%Failed to verify identification%'
ORDER BY pk DESC LIMIT 1;
```

---

## CT-02 — Gate de consentimento: "Start verification" desabilitado → habilitado

```gherkin
Dado que o widget SEON está renderizado em /complete para um lead SEON-gated fresco
Quando o cliente ainda NÃO marcou o checkbox de consentimento de privacidade
Então o botão "Start verification" está desabilitado
Quando o cliente marca "I have read and agree to the Privacy Notice"
Então o botão "Start verification" fica habilitado
E nenhum registro terminal é criado em uown_seon (apenas consentir, sem completar a câmera, não satisfaz o gate)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Antes do consentimento | `SeonWidgetComponent.isStartVerificationEnabled()` retorna `false` | `seon-widget-user-behavior.spec.ts:174-177` |
| Ação de consentir | `SeonWidgetComponent.acceptPrivacyConsent()` (checkbox "I have read and agree to the Privacy Notice") | `seon-widget-user-behavior.spec.ts:179-180`; `seon-idv-widget-user-behavior.md` (consent gate) |
| Após o consentimento | `expect.poll(() => seon.isStartVerificationEnabled(), { timeout: 10_000 })` resolve para `true` | `seon-widget-user-behavior.spec.ts:180-185` |
| Guarda negativa (Regra #13) | `SELECT status FROM uown_seon WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1` retorna `null` (nenhum registro terminal) | `seon-widget-user-behavior.spec.ts:187-195` |

---

## CT-03 — Cancelar via X: comportamento de dismissal (não-trivial) `[OBSERVATION]`

```gherkin
Dado que o widget SEON está renderizado em /complete para um lead SEON-gated fresco
Quando o cliente clica no X real de fechar (canto superior direito), distinto de remover o iframe do DOM
Então o comportamento de dismissal é observado sem forçar a remoção
E o internal_status do lead permanece diferente de SEON_ID_FAILED (o cancelamento não avança nem falha a verificação)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Ação de cancelar | `SeonWidgetComponent.closeSeonWidget()` (X real, NÃO `dismissSeonOverlay`) | `seon-widget-user-behavior.spec.ts:211-212` |
| Dismissal `[OBSERVATION]` | **No sandbox (2026-06-23) o X NÃO fecha o widget em 15 s** — a UX de cancelamento é não-trivial (possível confirmação in-frame ou dismiss assíncrono). O spec captura o estado (waitFor state, sem `force:true`, sem sleep fixo) e reporta como observação, NÃO falha o build. Ver Pitfall #142. | `seon-widget-user-behavior.spec.ts:213-229`; `seon-idv-widget-user-behavior.md` OBS-01 / Pitfall #142 |
| Nota de cancelamento (Regra #13) `[OBSERVATION]` | Um cancelamento real DEVERIA gravar uma nota. **Nenhuma nota "cancel"/"SEON" foi encontrada em `uown_los_lead_notes` após o X** → potencial gap de observabilidade da Regra #13 (OBS-02). Sinalizado ao dev/PO, NÃO confirmado como bug. | `seon-widget-user-behavior.spec.ts:231-244`; `seon-idv-widget-user-behavior.md` OBS-02 |
| `internal_status` | `db.getLeadInternalStatus(leadPk)` diferente de `'SEON_ID_FAILED'` | `seon-widget-user-behavior.spec.ts:246-249` |

> **Regra de resolução (regra #19c):** o dismissal ausente e a nota ausente são `[OBSERVATION]` conhecidos de limitação do sandbox — NÃO reportar como `[BUG]` sem re-inspecionar o DOM real e confirmar com dev/PO. Se um env superior (stg) fechar o widget no X, o comportamento diverge e o oracle precisa de nova revisão.

---

## CT-04 — Formulário de pagamento bloqueado por trás do overlay (não-destrutivo)

```gherkin
Dado que o widget SEON está renderizado em /complete para um lead SEON-gated fresco
Quando o cliente tenta editar o campo "Card Number" com o overlay ativo
Então o campo NÃO é editável (o overlay intercepta a interação)
E nenhum submit/cobrança dispara: nenhum registro terminal em uown_seon e internal_status inalterado
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Campo bloqueado | `SeonWidgetComponent.isSeonGateBlockingPaymentForm(contract.cardNumberField)` retorna `true` (asserção SEM chamar `hideWidget`/`dismissSeonOverlay` — isso mascararia a armadilha) | `seon-widget-user-behavior.spec.ts:264-271` |
| Locator do campo | `ContractPage.cardNumberField` (não inlinar no spec) | `seon-widget-user-behavior.spec.ts:268-270`; `contract.page.ts` |
| Sem registro terminal | `SELECT status FROM uown_seon WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1` retorna `null` | `seon-widget-user-behavior.spec.ts:273-279` |
| `internal_status` | diferente de `'SEON_ID_FAILED'` | `seon-widget-user-behavior.spec.ts:280-281` |

---

## CT-05 — Conclusão da verificação (bypass API — stand-in de CI da câmera)

```gherkin
Dado que o widget SEON está renderizado em /complete para um lead SEON-gated fresco (o cliente encara o gate antes da aprovação)
Quando a verificação SEON é aprovada via API (stand-in de CI para o fluxo de câmera, não automatizável headless)
Então a resposta traz idVerifySuccess=true
E existe uma linha em uown_seon com status='APPROVED' e id_verify_success=true
E submitApplication passa o gate SEON (responde ok)
E uma nota de contrato/SEON é gravada em uown_los_lead_notes (Regra #13) — observação: o fluxo Kornerstone API-only no sandbox pode não transicionar para CONTRACT_CREATED
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Widget encarado antes da aprovação | `isSeonWidgetVisible()` retorna `true` (prova UI-first que o cliente vê o gate) | `seon-widget-user-behavior.spec.ts:291-296` |
| Bypass API | `api.seon.approveVerification({ leadPk, fullName, birthDate })` → `res.ok` e `res.body.idVerifySuccess === true`. DOB MM/DD/YYYY → YYYY-MM-DD (Pitfall #2) | `seon-widget-user-behavior.spec.ts:298-309`; `fraud-vendors-knowledge/SKILL.md:308` |
| Registro `uown_seon` | `status='APPROVED'` e `id_verify_success=true` | `seon-widget-user-behavior.spec.ts:311-319` |
| Gate passa | `api.application.submitApplication(leadPk, firstName, lastName)` responde `ok` | `seon-widget-user-behavior.spec.ts:321-326` |
| Nota de atividade (Regra #13) `[OBSERVATION]` | nota com `ContractService` / `CONTRACT_CREATED` / `SEON` em `uown_los_lead_notes`. **Fluxo Kornerstone API-only no sandbox pode não escrever a nota ContractService** (limitação conhecida, OBS-03) → observar, não falhar o build | `seon-widget-user-behavior.spec.ts:328-342`; `seon-idv-widget-user-behavior.md` OBS-03 |

```sql
-- Registro SEON aprovado (substituir $lead_pk)
SELECT status, id_verify_success FROM uown_seon
WHERE lead_pk = $lead_pk ORDER BY pk DESC LIMIT 1;
-- esperado: status='APPROVED', id_verify_success=true
```

---

## CT-06 — Conclusão via câmera real (procedimento manual, fora de CI) `[HYPOTHESIS — requer verificação com dispositivo real]`

```gherkin
Dado que existe um lead fresco SEON-gated com URL de contrato, em um dispositivo com câmera real
Quando o cliente marca o consentimento, clica em "Start verification", escaneia um documento de identidade e completa a captura de selfie/liveness
Então o widget fecha automaticamente no sucesso
E existe uma linha em uown_seon com status='APPROVED', success=true, id_verify_success=true
E o internal_status do lead é SEON_ID_APPROVED
E uma nota "SEON verification completed" (ou equivalente) é gravada em uown_los_lead_notes (Regra #13)
E o formulário de pagamento fica interativo (nenhum overlay bloqueando)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Automatização | **Não automatizável em CI** — precisa de câmera real (document scan + selfie/liveness). Variante de dispositivo `test.skip` a menos que `RUN_SEON_MANUAL=1`. Proxy possível via `--use-fake-device-for-media-stream`, intencionalmente fora do CI | `seon-widget-user-behavior.spec.ts:345-355` |
| `internal_status` | `'SEON_ID_APPROVED'` `[HYPOTHESIS]` — valor de internal-status por design (`LeadService.java:358`); procedimento manual documentado, ainda não executado ao vivo com câmera | `seon-idv-widget-user-behavior.md` (procedimento CT-06, passo 7) |
| Nota de atividade `[HYPOTHESIS]` | "SEON verification completed" ou equivalente | `seon-idv-widget-user-behavior.md` (procedimento CT-06, passo 8) |
| Stand-in de CI | `api.seon.approveVerification(...)` (CT-05) é o substituto explícito; a execução manual só é exigida em certificação de upgrade do SDK SEON ou mudança do fluxo do widget | `seon-idv-widget-user-behavior.md` (CI stand-in) |

---

## CT-07 — SEON_ID_FAILED via mismatch de nome/DOB: escrito em internal_status, NÃO em lead_status

```gherkin
Dado que existe um lead SEON-gated com um registro SEON de mismatch (idVerifySuccess=false, nameMatchCheckResult=FAIL, status=REJECTED) injetado via createOrUpdate
Quando submitApplication é chamado
Então o internal_status do lead fica SEON_ID_FAILED
E o lead_status permanece UW_APPROVED (SEON_ID_FAILED é valor de internal_status por design, nunca de lead_status)
E a mensagem de erro "Failed to verify identification." é surfada
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `internal_status` | `'SEON_ID_FAILED'` (coluna `internal_status` de `uown_los_lead`) | `seon-idv-widget-user-behavior.md` (SEON_ID_FAILED corrected mechanics); `fraud-vendors-knowledge/SKILL.md:113-123` |
| `lead_status` | permanece `'UW_APPROVED'` — `IdVerificationService.java:254` chama `updateLeadStatus(lead, null /*leadStatus*/, SEON_ID_FAILED /*internalStatus*/)`; com `leadStatus=null` só `internal_status` é escrito | `seon-idv-widget-user-behavior.md`; `fraud-vendors-knowledge/SKILL.md:115` |
| Prova ao vivo | leads sandbox 97950/97951/97943/97942/97940 (2026-06-23) → `internal_status=SEON_ID_FAILED`, `lead_status=UW_APPROVED` | `seon-idv-widget-user-behavior.md` (linha 56) |
| Exceção — sem registro SEON | `SeonIdVerificationStep` retorna STOP ("No SEON record found") ANTES de `verifySeon` → `internal_status` fica `UW_APPROVED` (ex. lead 97955) | `seon-idv-widget-user-behavior.md` (linha 57); `fraud-vendors-knowledge/SKILL.md:123` |
| Mensagem de erro | "Failed to verify identification." | `seon-idv-widget-user-behavior.md` (trigger mechanism) |
| Classificação | **OBSERVATION (correto por design)**, NÃO bug — `UpdateLeadStatusService` + `LeadInfo.setLeadStatus` são setters incondicionais; `SubmitApplicationProcessor` é `@Transactional` e o STOP faz commit normal | `seon-idv-widget-user-behavior.md` (linha 58) |

```sql
-- Mecânica do status terminal (substituir $lead_pk)
SELECT lead_status, internal_status FROM uown_los_lead WHERE pk = $lead_pk;
-- esperado (mismatch): lead_status='UW_APPROVED', internal_status='SEON_ID_FAILED'
```

> Coberto por `seon-negative-scenarios.spec.ts` (8/8 CTs, per KB) — spec não lida diretamente neste oracle; checkpoints ancorados no KB doc + skill fraud-vendors + business-rules §5.7.

---

## CT-08 — E2E híbrido: lifecycle completo com bypass SEON persiste APPROVED até a assinatura

```gherkin
Dado que um lead é criado via sendApplication em um merchant Kornerstone SEON-gated e a verificação SEON é aprovada via API
Quando o cliente navega à URL do contrato, preenche CC + banco, aceita os Terms & Conditions e completa a assinatura no iframe embutido
Então o lead avança para CONTRACT_CREATED ou além no portal Origination
E o registro uown_seon permanece status='APPROVED' e id_verify_success=true após a assinatura
E o full_name do registro SEON contém o primeiro nome do applicant e birth_date está preenchido
E uma nota de decisão de UW (APPROVED / UnderwritingService) e uma nota de assinatura (signed / ContractService) existem em uown_los_lead_notes (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| SEON criado no bypass | `api.seon.approveVerification` → `response.body.status='APPROVED'`, `success=true` | `seon-e2e-flow.spec.ts:143-154` |
| Registro `uown_seon` | `status='APPROVED'`, `success=true`, `full_name` contém `applicant.firstName`, `birth_date` truthy | `seon-e2e-flow.spec.ts:157-176` |
| Nota UW (Regra #13) | nota com `APPROVED` ou `UnderwritingService` em `uown_los_lead_notes` (não nula) | `seon-e2e-flow.spec.ts:122-132` |
| Nota de assinatura (Regra #13) | nota com `signed` / `ContractService` / `contract created` em `uown_los_lead_notes` (não nula) | `seon-e2e-flow.spec.ts:237-248` |
| Status final do lead | `pollForLeadStatus` → contém um de `contract_created` / `signed` / `settled` / `fund` / `cc_auth` (CONTRACT_CREATED ou além) | `seon-e2e-flow.spec.ts:269-282` |
| SEON pós-assinatura | `status` permanece `'APPROVED'` e `id_verify_success=true` após a assinatura | `seon-e2e-flow.spec.ts:285-294` |
| Overlay pós-bypass | `contract.dismissSeonOverlay()` — o SDK SEON pode injetar um overlay QR mesmo após o backend considerar APPROVED; dismiss explícito é exigido (este CT é o caminho de bypass, NÃO o de widget-behavior) | `seon-e2e-flow.spec.ts:191-195`; `fraud-vendors-knowledge/SKILL.md:133-137` |

```sql
-- SEON persiste APPROVED através da assinatura (substituir $lead_pk)
SELECT status, id_verify_success FROM uown_seon
WHERE lead_pk = $lead_pk ORDER BY pk DESC LIMIT 1;
-- esperado: status='APPROVED', id_verify_success=true (inalterado pós-assinatura)
```

---

## Pré-condições

- **Merchant preflight (regra #12) com ressalva SEON:** habilitar `isSeonIdCheckRequired=true` no KS3015 via `merchantConfig.configureByName('FifthAveFurnitureNY', { isSeonIdCheckRequired: true, maxApprovalAmount: 5000, fraudThreshold: 900 })`. O default é `false` em todos os envs. Chamar `sendApplication` direto (NÃO `createPreQualifiedApplication`, que rodaria preflight e resetaria a flag). A flag é restaurada no teardown (`restoreAll`, `merchantConfig` fixture).
- **Dados frescos (regra #9):** cada CT cria um lead SEON-gated fresco via `createSeonLead(api)` / `sendApplication`.
- **DOB (Pitfall #2):** `applicant.dob` vem MM/DD/YYYY; SEON precisa YYYY-MM-DD → `[month, day, year] = dob.split('/')` e remontar.
- **Ambiente sandbox:** o `redirectUrl` do contrato só popula no sandbox no caminho `sendApplication`-with-order; em stg o array volta vazio.
- **NÃO usar `dismissSeonOverlay` nos CTs de comportamento do widget (CT-01 a CT-04):** ele só esconde/remove o iframe e mascara a armadilha. Usar `SeonWidgetComponent` (frameLocator). O `dismissSeonOverlay` é usado apenas no CT-08 (caminho de bypass), onde o overlay QR pós-APPROVED precisa ser fechado.

## Log de Atividade (Regra #13)

- **Renderização do widget:** grava `[SubmitApplicationResponse] Error: Failed to verify identification.` — a nota-gatilho que faz o frontend renderizar o widget.
- **Aprovação (bypass API / câmera real):** decisão de UW (`UnderwritingService`/`APPROVED`) e, no fluxo completo, nota de assinatura (`ContractService`/`signed`).
- **Gap conhecido `[OBSERVATION]`:** cancelamento via X não grava nota de cancelamento (OBS-02) e o fluxo Kornerstone API-only no sandbox pode não gravar a nota `ContractService` (OBS-03). Ambos sinalizados ao dev/PO, NÃO confirmados como bug — re-inspecionar antes de classificar.
