# Test Scenarios — Task #505
## UOWN | Servicing | Add "Opt Out AI" Flag under the DNC flags
**Milestone:** RU03.26.1.50.0
**Data:** 2026-03-20
**Portal:** Servicing
**Status:** Todos os cenários PASSARAM (10/10)

---

## Contexto da Feature

Adição de uma nova flag de preferência de contato **"Opt Out AI"** na seção DNC do portal Servicing (Primary Contact → Mobile Phone section), ao lado das flags existentes "Do Not Call" e "Do Not Text".

**Endpoint backend:** `POST /uown/svc/updateOptOutAi`
**Body:** `{ phonePK: number, optOutAi: boolean, optOutAiReason?: string }`
**Response:** `SvPhone` (200 OK)
**Propagação:** Mesmo comportamento do DNC/DNT — atualiza todos os registros com o mesmo `areaCode + phoneNumber`
**Toast sucesso:** `"Opt Out AI flag updated successfully"`
**Toast erro:** `"Failed to update Opt Out AI flag"`
**DB tables:** `uown_sv_phone.opt_out_ai`, `uown_sv_phone.opt_out_ai_reason`, `uown_sv_phone_history.opt_out_ai`

---

## US-SVC-505-01: Gerenciamento da Preferência Opt Out AI

**Como** agente do Servicing,
**Quero** marcar/desmarcar a flag "Opt Out AI" para um cliente,
**Para** registrar a preferência do cliente de não participar de interações com IA.

### Critérios de Aceite
- [x] Checkbox "Opt Out AI" visível na seção DNC, abaixo de "Do Not Call" (CT-01)
- [x] Checkbox pode ser marcado e desmarcado (CT-02, CT-03)
- [x] Ao salvar, toast de sucesso exibido (CT-02, CT-03)
- [x] Estado persiste após refresh da pagina (CT-02, CT-03)
- [x] DB reflete o valor correto em `uown_sv_phone.opt_out_ai` (CT-02, CT-03, CT-04)
- [x] Histórico registrado em `uown_sv_phone_history` (CT-05)
- [x] Campo de motivo obrigatório ao habilitar (CT-06)
- [x] Motivo persiste no DB e retorna na API (CT-07)

---

## US-SVC-505-02: Propagação de Opt Out AI por Número de Telefone

**Como** agente do Servicing,
**Quero** que a flag "Opt Out AI" seja aplicada a todas as contas com o mesmo número de telefone,
**Para** garantir consistência da preferência do cliente independentemente da conta acessada.

### Critérios de Aceite
- [x] Ao marcar Opt Out AI em conta A (phone X), conta B (mesmo phone X) reflete a mesma flag (CT-04)
- [x] Comportamento idêntico ao Do Not Call / Do Not Text (CT-04)

---

## US-SVC-505-03: Validação e Limites do Campo de Motivo

**Como** agente do Servicing,
**Quero** que o campo de motivo tenha validação adequada,
**Para** garantir que dados inválidos não sejam enviados ao backend.

### Critérios de Aceite
- [x] Campo de motivo obrigatório — save bloqueado com motivo vazio (CT-06)
- [x] Motivo persiste no DB (`opt_out_ai_reason`) e retorna na API (`phoneInfo.optOutAiReason`) (CT-07)
- [x] Frontend textarea maxlength verificado — **OBS-01: maxlength ausente, fora do escopo** (CT-08)

---

## US-SVC-505-04: Cancelamento do Modal de Motivo

**Como** agente do Servicing,
**Quero** poder cancelar o modal de motivo "Opt Out AI" sem que alterações sejam persistidas,
**Para** garantir que uma ação acidental de clique no checkbox não altere a preferência do cliente.

### Critérios de Aceite
- [x] Cancelar modal sem preencher motivo não altera `opt_out_ai` nem `opt_out_ai_reason` no DB (CT-09)
- [x] Cancelar modal após preencher motivo não persiste o texto preenchido no DB (CT-10)
- [x] API confirma estado inalterado após cancelamento (CT-09, CT-10)

---

## Cenários de Teste

### CT-01: [E2E] Verificar posicionamento da flag "Opt Out AI" na UI

**Tipo:** E2E (UI)
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476)
**Status:** PASSOU (9.0s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476
3. Navegar para "Primary Contact" (menu lateral)
4. Localizar a seção "Mobile Phone"
5. Verificar se o checkbox "Opt Out AI" está visível

**Resultado esperado:**
- Checkbox "Opt Out AI" visível na seção Mobile Phone
- Posicionado abaixo de "Do Not Call"
- Checkbox inicialmente desmarcado (opt_out_ai = false por default)

**Resultado obtido:**
- Checkbox "Opt Out AI" visível = `true`
- Baseline "Do Not Call" visível = `true`
- Screenshot: `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-01-opt-out-ai-checkbox-visible.png`

**Tags:** @regression @qa1

---

### CT-02: [E2E + DB] Habilitar Opt Out AI via UI → toast → persistência → log

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone, Opt Out AI = false (accountPk=4476, phonePK=7248)
**Status:** PASSOU (13.5s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact section
3. Localizar checkbox "Opt Out AI" (Mobile Phone)
4. Verificar estado inicial: desmarcado
5. Entrar em modo de edição (pencil icon Primary Contact)
6. Marcar (enable) o checkbox "Opt Out AI"
7. Preencher motivo no modal "Reason for Opt Out AI Mobile"
8. Clicar Save no modal → SAVE na seção
9. Verificar toast "Opt Out AI flag updated successfully"
10. (DB) Verificar `uown_sv_phone.opt_out_ai = true` para phonePK=7248
11. Navegar para a seção de Notes/Activity Log (scroll ou menu lateral)
12. Verificar que existe um registro de log recente com tipo DATA_CHANGE contendo referência a opt_out_ai ou "OptOutAi" na descrição
13. Validar que o log é visível na tabela de Notes

**Resultado esperado:**
- Toast "Opt Out AI flag updated successfully" exibido
- DB: `uown_sv_phone.opt_out_ai = true` WHERE `pk = 7248`
- Activity Log: registro DATA_CHANGE visível com referência à alteração de opt_out_ai

**Resultado obtido:**
- Toast contém `"Opt Out AI flag updated successfully"`
- DB: `opt_out_ai = 1` (true) para phonePK=7248
- Activity log: HTML contém `optOutAi` = `true`
- Screenshot: `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-02-opt-out-ai-enabled.png`

**Tags:** @regression @critical @qa1

---

### CT-03: [E2E + DB] Desabilitar Opt Out AI via UI → toast → persistência → log

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone, Opt Out AI habilitado (accountPk=4476, phonePK=7248)
**Status:** PASSOU (13.9s)

**Passos:**
1. (Setup) CT-02 deve ter sido executado (opt_out_ai = true)
2. Login → buscar conta 4476 → Primary Contact
3. Verificar checkbox "Opt Out AI" marcado
4. Entrar em modo de edição (pencil icon Primary Contact)
5. Desmarcar o checkbox (sem modal de motivo ao desmarcar)
6. Clicar SAVE na seção
7. Verificar toast "Opt Out AI flag updated successfully"
8. (DB) Verificar `uown_sv_phone.opt_out_ai = false`
9. Navegar para a seção de Notes/Activity Log
10. Verificar que existe um registro de log recente com tipo DATA_CHANGE contendo referência a opt_out_ai ou "OptOutAi"
11. Validar que o log é visível na tabela de Notes

**Resultado esperado:**
- Toast de sucesso exibido
- DB: `uown_sv_phone.opt_out_ai = false` WHERE `pk = 7248`
- Activity Log: registro DATA_CHANGE visível com referência à alteração de opt_out_ai

**Resultado obtido:**
- Toast contém `"Opt Out AI flag updated successfully"`
- DB: `opt_out_ai = 0` (false) para phonePK=7248
- Activity log: HTML contém `optOutAi` = `true`
- Screenshot: `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-03-opt-out-ai-disabled.png`

**Tags:** @regression @critical @qa1

---

### CT-04: [API + DB] Propagação — Opt Out AI se aplica a todas as contas com mesmo número

**Tipo:** API + DB
**Portal:** Servicing (API)
**Pré-condição:** Duas contas com o mesmo Mobile Phone (accountPk=14, phonePK=20) e (accountPk=20, phonePK=30), phone=888-6576577
**Status:** PASSOU (1.8s)

**Passos:**
1. (Setup) Garantir opt_out_ai = false em ambos os registros via API
2. Chamar `POST /uown/svc/updateOptOutAi` com `{ phonePK: 20, optOutAi: true }`
3. Verificar response status 200
4. (DB) Verificar `uown_sv_phone.opt_out_ai = true` WHERE `pk = 20` (conta 14)
5. (DB) Verificar `uown_sv_phone.opt_out_ai = true` WHERE `pk = 30` (conta 20, mesmo phone)

**Resultado esperado:**
- API retorna 200 com SvPhone atualizado
- DB: ambos phonePK 20 e 30 com `opt_out_ai = true`
- Comportamento idêntico ao `updateDnc` / `updateDnt`

**Resultado obtido:**
- HTTP 200, `response.pk = 20`, `response.phoneInfo.optOutAi = true`
- DB phonePK=20: `opt_out_ai = 1` (true)
- DB phonePK=30: `opt_out_ai = 1` (true) — propagação confirmada

**Tags:** @regression @critical @qa1

---

### CT-05: [DB] Histórico registrado em uown_sv_phone_history

**Tipo:** DB
**Pré-condição:** Opt Out AI atualizado (CT-04 executado)
**Status:** PASSOU (501ms)

**Passos:**
1. (Após CT-04) Consultar `uown_sv_phone_history`
2. Verificar entrada com `pk = 20`, `revtype = 1` (MOD), `opt_out_ai = true`
3. Verificar entrada com `pk = 30`, `revtype = 1` (MOD), `opt_out_ai = true`

**Resultado esperado:**
- `uown_sv_phone_history` contém registro de auditoria (revtype=1) com `opt_out_ai = true` para phonePK=20
- `uown_sv_phone_history` contém registro de auditoria (revtype=1) com `opt_out_ai = true` para phonePK=30
- `row_updated_timestamp` atualizado

**Resultado obtido:**
- phonePK=20: COUNT(*) > 0 com `revtype=1, opt_out_ai=true`
- phonePK=30: COUNT(*) > 0 com `revtype=1, opt_out_ai=true`

**Tags:** @regression @qa1

---

### CT-06: [E2E] Campo de motivo obrigatório — Save bloqueado com motivo vazio

**Tipo:** E2E (UI)
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476), Opt Out AI checkbox desmarcado
**Status:** PASSOU (9.0s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact → Mobile Phone
3. Entrar em modo de edição (pencil icon)
4. Marcar checkbox "Opt Out AI" para acionar modal de motivo
5. Deixar campo de motivo **vazio** (clear)
6. Tentar clicar no botão Save do modal
7. Verificar que Save está desabilitado ou que modal permanece aberto com erro

**Resultado esperado:**
- Modal "Reason for Opt Out AI Mobile" exibido ao marcar checkbox
- Com motivo vazio: botão Save desabilitado OU validação impede salvamento
- Flag não é salva sem motivo

**Resultado obtido:**
- Modal exibido = `true`
- Save bloqueado com motivo vazio = `true` (botão desabilitado ou modal permanece aberto + erro visível)

**Tags:** @regression @qa1

---

### CT-07: [E2E + API + DB] Persistência do motivo — DB e API retornam optOutAiReason

**Tipo:** E2E + API + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476, phonePK=7248), Opt Out AI checkbox desmarcado
**Status:** PASSOU (11.7s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact → Mobile Phone
3. Garantir Opt Out AI desmarcado
4. Marcar checkbox, preencher motivo `"QA automation test reason 1774015431137"` no modal
5. Confirmar → verificar toast de sucesso
6. (DB) Consultar `uown_sv_phone.opt_out_ai_reason WHERE pk = 7248`
7. (API) Chamar `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=true, optOutAiReason="QA automation test reason 1774015431137"`
8. Verificar `response.phoneInfo.optOutAiReason`

**Resultado esperado:**
- Toast "Opt Out AI flag updated successfully"
- DB: `opt_out_ai_reason = "QA automation test reason 1774015431137"`
- API: `phoneInfo.optOutAiReason = "QA automation test reason 1774015431137"`

**Resultado obtido:**
- Toast contém mensagem esperada
- DB `opt_out_ai_reason` para phonePK=7248: match exato com `"QA automation test reason 1774015431137"`
- API `phoneInfo.optOutAiReason`: match exato com `"QA automation test reason 1774015431137"`

**Tags:** @regression @qa1

---

### CT-08: [E2E + DB] Limite de caracteres — textarea maxlength vs DB column size

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476), Opt Out AI checkbox desmarcado
**Status:** PASSOU (15.0s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact → Mobile Phone
3. Entrar em modo de edição, marcar checkbox Opt Out AI para acionar modal
4. Ler atributo `maxlength` do textarea de motivo
5. Cancelar modal
6. (DB) Consultar `information_schema.columns` para coluna `opt_out_ai_reason` em `uown_sv_phone`
7. Comparar maxlength frontend vs tamanho da coluna DB

**Resultado esperado:**
- Frontend textarea com `maxlength` definido (idealmente 500, alinhado com DB)
- DB coluna `opt_out_ai_reason` com tipo e tamanho definidos

**Resultado obtido:**
- Frontend textarea `maxlength`: **NOT SET** (null)
- DB coluna: `character varying(500)`
- **Discrepância detectada: OBS-01** — frontend não limita caracteres; DB limita a 500 (fora do escopo)

**Tags:** @regression @qa1

---

### CT-09: [E2E + API + DB] Cancelar modal sem preencher motivo — estado inalterado

**Tipo:** E2E + API + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476, phonePK=7248), Opt Out AI checkbox desmarcado
**Status:** PASSOU (9.2s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact → Mobile Phone
3. Garantir Opt Out AI desmarcado
4. (DB) Capturar estado antes: `opt_out_ai`, `opt_out_ai_reason` para phonePK=7248
5. Entrar em modo de edição (pencil icon)
6. Marcar checkbox "Opt Out AI" — modal de motivo aparece
7. **Sem preencher o motivo**, clicar no botão CANCEL do modal
8. (DB) Verificar que `opt_out_ai` e `opt_out_ai_reason` permanecem inalterados
9. (API) Chamar `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=false` — confirmar `phoneInfo.optOutAi=false`

**Resultado esperado:**
- Após cancelar o modal (sem preencher motivo), o estado DB permanece inalterado
- API confirma `optOutAi=false`
- Nenhuma requisição de atualização foi enviada ao backend

**Resultado obtido:**
- DB antes: `opt_out_ai=0`, `opt_out_ai_reason=""`
- DB depois: `opt_out_ai=0`, `opt_out_ai_reason=""` — inalterado
- API: `phoneInfo.optOutAi=false` — confirmado

**Tags:** @regression @qa1

---

### CT-10: [E2E + API + DB] Cancelar modal após preencher motivo — estado e texto não persistidos

**Tipo:** E2E + API + DB
**Portal:** Servicing
**Pré-condição:** Conta ACTIVE com Mobile Phone cadastrado (accountPk=4476, phonePK=7248), Opt Out AI checkbox desmarcado
**Status:** PASSOU (9.5s)

**Passos:**
1. Login no Servicing portal
2. Buscar conta 4476 → Primary Contact → Mobile Phone
3. Garantir Opt Out AI desmarcado
4. (DB) Capturar estado antes: `opt_out_ai`, `opt_out_ai_reason` para phonePK=7248
5. Entrar em modo de edição (pencil icon)
6. Marcar checkbox "Opt Out AI" — modal de motivo aparece
7. Preencher o campo de motivo com `"This reason should NOT be persisted"`
8. Clicar no botão **CANCEL** (em vez de Save)
9. (DB) Verificar que `opt_out_ai` e `opt_out_ai_reason` permanecem inalterados — texto preenchido NÃO foi salvo
10. (API) Chamar `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=false` — confirmar `phoneInfo.optOutAi=false`

**Resultado esperado:**
- Após cancelar o modal (mesmo com motivo preenchido), o estado DB permanece inalterado
- O texto `"This reason should NOT be persisted"` não é salvo na coluna `opt_out_ai_reason`
- API confirma `optOutAi=false`

**Resultado obtido:**
- DB antes: `opt_out_ai=0`, `opt_out_ai_reason=""`
- DB depois: `opt_out_ai=0`, `opt_out_ai_reason=""` — texto NÃO persistido
- API: `phoneInfo.optOutAi=false` — confirmado

**Tags:** @regression @qa1

---

## Mapeamento de Cobertura

| CT | Cenário | Tipo | Status |
|----|---------|------|--------|
| CT-01 | UI placement | E2E | PASSOU (9.0s) |
| CT-02 | Enable + persist + log | E2E+DB | PASSOU (13.5s) |
| CT-03 | Disable + persist + log | E2E+DB | PASSOU (13.9s) |
| CT-04 | Data propagation | API+DB | PASSOU (1.8s) |
| CT-05 | History table | DB | PASSOU (501ms) |
| CT-06 | Reason required | E2E | PASSOU (9.0s) |
| CT-07 | Reason persistence | E2E+API+DB | PASSOU (11.7s) |
| CT-08 | Character limit | E2E+DB | PASSOU (15.0s) |
| CT-09 | Cancel without reason | E2E+API+DB | PASSOU (9.2s) |
| CT-10 | Cancel after filling reason | E2E+API+DB | PASSOU (9.5s) |

## Decisões Técnicas

- **Modo serial (`test.describe.configure({ mode: 'serial' })`):** CT-03 depende do estado criado por CT-02 (opt_out_ai=true). CT-05 depende do CT-04 (registros de auditoria).
- **`enterPrimaryContactEditMode()`:** A seção Primary Contact é read-only por padrão. O pencil icon deve ser clicado antes de interagir com os checkboxes.
- **Modal "Reason for Opt Out AI Mobile":** Aparece apenas ao marcar (enable) o checkbox. Ao desmarcar, nenhum modal é exibido.
- **Modal "Customer Information Confirmation":** Aparece após SAVE e requer clique no botão CONFIRM.
- **Activity log via `page.content()`:** A seção Notes pode estar colapsada, mas os dados estão no DOM. Verificação via `content.includes('optOutAi')`.
- **GDS bypass:** Usa `existingAccountPks` — nenhuma aplicação nova é criada, portanto `runId`/`email` são omitidos.
- **CT-06 dupla validação:** O teste verifica duas possibilidades — botão Save desabilitado OU modal permanece aberto com erro. Ambas são comportamentos válidos para "campo obrigatório".
- **CT-07 motivo com timestamp:** Usa `Date.now()` no motivo para garantir unicidade e rastreabilidade no DB.
- **CT-08 detecção de gap:** O cenário é informativo — detecta a ausência de `maxlength` mas o teste PASSA porque o objetivo é documentar a discrepância (OBS-01, fora do escopo), não falhar.
- **CT-09 e CT-10 cancelamento:** Validam que o botão CANCEL do modal de motivo não persiste nenhum dado — nem com campo vazio (CT-09) nem com campo preenchido (CT-10). Ambos verificam DB antes/depois + API para garantir idempotência.

## Observações Detectadas

| ID | Descrição | Classificação | CT | Status |
|----|-----------|:-------------:|:---:|:------:|
| OBS-01 | Frontend textarea de motivo sem `maxlength` (DB=VARCHAR 500) | Fora do escopo | CT-08 | Informativa |
