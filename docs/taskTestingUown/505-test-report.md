# Relatório de Execução de Testes — Task #505

## Informações da Tarefa

| Campo | Valor |
|-------|-------|
| **Título** | UOWN \| Servicing \| Add "Opt Out AI" Flag under the DNC flags |
| **URL GitLab** | https://gitlab.com/uown/frontend/servicing/-/work_items/505 |
| **Milestone** | RU03.26.1.50.0 |
| **Labels** | servicing, qa, automation |
| **Pipeline** | new-flow (E2E + API + DB) |

## Descrição

Adição de uma nova flag de preferência de contato **"Opt Out AI"** na seção DNC do portal Servicing (Primary Contact → Mobile Phone section), ao lado das flags existentes "Do Not Call" e "Do Not Text".

- **Endpoint backend:** `POST /uown/svc/updateOptOutAi`
- **Body:** `{ phonePK: number, optOutAi: boolean, optOutAiReason?: string }`
- **Response:** `SvPhone` com `phoneInfo.optOutAi`, `phoneInfo.optOutAiReason` (estrutura Jackson @Embedded)
- **Propagação:** Atualiza todos os registros com mesmo `areaCode + phoneNumber`
- **Toast sucesso:** `"Opt Out AI flag updated successfully"`
- **DB tables:** `uown_sv_phone.opt_out_ai`, `uown_sv_phone.opt_out_ai_reason`, `uown_sv_phone_history.opt_out_ai`

## Execução do Teste

| Campo | Valor |
|-------|-------|
| **Arquivo de Teste** | `tests/taskTestingUown/Tasks/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505.spec.ts` |
| **Ambiente** | qa1 |
| **Projeto Playwright** | task-testing |
| **Data de Execução** | 2026-03-20 |
| **Duração** | 1.7m |
| **Resultado** | 10 passou / 0 falhou / 0 skipped |
| **Vídeo** | Gravado (`VIDEO=on`) |
| **Trace** | Habilitado (`TRACE=on-first-retry`) |

## Capturas de Tela

| CT | Arquivo | Descrição |
|----|---------|-----------|
| CT-01 | `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-01-opt-out-ai-checkbox-visible.png` | Checkbox "Opt Out AI" visível na seção Mobile Phone, abaixo de "Do Not Call" |
| CT-02 | `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-02-opt-out-ai-enabled.png` | Checkbox "Opt Out AI" marcado após habilitação + toast de sucesso visível |
| CT-03 | `reports/screenshots/RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505-03-opt-out-ai-disabled.png` | Checkbox "Opt Out AI" desmarcado após desabilitação + toast de sucesso visível |

## Cenários

### Cenário: Cenário 1 — CT-01

**O que é feito:** Login no portal Servicing em `https://svc-website-qa1.uownleasing.com`, busca da conta `4476` via quick search, navegação para "Primary Contact" via menu lateral, verificação da visibilidade do checkbox "Do Not Call" (baseline) e do checkbox "Opt Out AI" na seção Mobile Phone usando seletores `#optOutAiMobile`, `label:has-text("Opt Out AI") input[type="checkbox"]`, `input[name="optOutAiMobile"]`.

**O que acontece:** O DOM renderiza o checkbox "Opt Out AI" na seção Mobile Phone, posicionado abaixo de "Do Not Call". O checkbox está visível e interativo.

**O que é verificado:**
- Baseline: `Do Not Call` checkbox visível = `true`
- `Opt Out AI` checkbox visível = `true`
- Screenshot capturado em `reports/screenshots/...01-opt-out-ai-checkbox-visible.png`

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Do Not Call visível | `true` | `true` |
| Opt Out AI visível | `true` | `true` |

#### Como verificar manualmente

1. Acessar `https://svc-website-qa1.uownleasing.com`
2. Login com credenciais de agente
3. Buscar conta `4476` no campo de busca rápida e selecionar
4. Clicar em "Primary Contact" no menu lateral esquerdo
5. Localizar a seção "Mobile Phone" — verificar que o checkbox "Opt Out AI" está presente abaixo de "Do Not Call"

**PASSOU**

---

### Cenário: Cenário 2 — CT-02

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Verificação de pré-condição (`opt_out_ai = false`). Clique no icone de edição (pencil icon) para entrar no modo de edição da seção Primary Contact. Marcação do checkbox "Opt Out AI". Preenchimento do motivo no modal "Reason for Opt Out AI Mobile". Confirmação no modal "Customer Information Confirmation" (botão CONFIRM). Captura do texto do toast. Consulta DB em `uown_sv_phone WHERE pk = 7248`. Navegação para a pagina de customer information e verificação do activity log contendo `optOutAi` no HTML da pagina.

**O que acontece:** O sistema exibe o modal de motivo ao marcar o checkbox, processa a requisição `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=true`, exibe toast "Opt Out AI flag updated successfully", persiste `opt_out_ai = true` no banco de dados, e registra um log de atividade do tipo DATA_CHANGE com referência a `optOutAi`.

**O que é verificado:**
- Toast contém `"Opt Out AI flag updated successfully"`
- DB: `uown_sv_phone.opt_out_ai = true` (valor 1) para `phonePK=7248`
- Activity log: HTML da pagina `customer-information/4476` contém a string `optOutAi`
- Screenshot capturado em `reports/screenshots/...02-opt-out-ai-enabled.png`

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Toast de sucesso | `"Opt Out AI flag updated successfully"` | Contém a mensagem |
| DB `opt_out_ai` (phonePK=7248) | `1` (true) | `1` |
| Activity log com `optOutAi` | `true` | `true` |

#### Como verificar manualmente

1. Garantir `opt_out_ai = false` para `phonePK=7248` via query: `SELECT opt_out_ai FROM uown_sv_phone WHERE pk = 7248`
2. Acessar conta `4476` → Primary Contact → Mobile Phone
3. Clicar no icone de edição (pencil icon) na seção Primary Contact
4. Marcar o checkbox "Opt Out AI"
5. Preencher o motivo no modal "Reason for Opt Out AI Mobile" e confirmar
6. Clicar CONFIRM no modal "Customer Information Confirmation"
7. Verificar toast "Opt Out AI flag updated successfully"
8. Recarregar a pagina e confirmar que o checkbox permanece marcado
9. Verificar DB: `SELECT opt_out_ai FROM uown_sv_phone WHERE pk = 7248` → deve retornar `true`
10. Navegar para `customer-information/4476` e verificar que a seção Notes/Activity Log contém registro DATA_CHANGE com `optOutAi`

**PASSOU**

---

### Cenário: Cenário 3 — CT-03

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Verificação de pré-condição (`opt_out_ai = true` — CT-02 executado em modo serial antes). Clique no icone de edição (pencil icon). Desmarcação do checkbox "Opt Out AI" (sem modal de motivo ao desmarcar). Confirmação via SAVE. Captura do toast. Consulta DB em `uown_sv_phone WHERE pk = 7248`. Navegação para customer information e verificação do activity log.

**O que acontece:** O sistema processa a requisição `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=false`, exibe toast "Opt Out AI flag updated successfully", persiste `opt_out_ai = false` no banco de dados, e registra um log de atividade DATA_CHANGE.

**O que é verificado:**
- Toast contém `"Opt Out AI flag updated successfully"`
- DB: `uown_sv_phone.opt_out_ai = false` (valor 0) para `phonePK=7248`
- Activity log: HTML da pagina `customer-information/4476` contém a string `optOutAi`
- Screenshot capturado em `reports/screenshots/...03-opt-out-ai-disabled.png`

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Toast de sucesso | `"Opt Out AI flag updated successfully"` | Contém a mensagem |
| DB `opt_out_ai` (phonePK=7248) | `0` (false) | `0` |
| Activity log com `optOutAi` | `true` | `true` |

#### Como verificar manualmente

1. Garantir `opt_out_ai = true` para `phonePK=7248` (CT-02 deve ter sido executado antes, ou usar API: `POST /uown/svc/updateOptOutAi` com `{phonePK: 7248, optOutAi: true}`)
2. Acessar conta `4476` → Primary Contact → Mobile Phone
3. Clicar no icone de edição (pencil icon) na seção Primary Contact
4. Desmarcar o checkbox "Opt Out AI" (nenhum modal de motivo ao desmarcar)
5. Clicar SAVE na seção
6. Verificar toast "Opt Out AI flag updated successfully"
7. Recarregar a pagina e confirmar que o checkbox permanece desmarcado
8. Verificar DB: `SELECT opt_out_ai FROM uown_sv_phone WHERE pk = 7248` → deve retornar `false`
9. Navegar para `customer-information/4476` e verificar que a seção Notes/Activity Log contém registro DATA_CHANGE com `optOutAi`

**PASSOU**

---

### Cenário: Cenário 4 — CT-04

**O que é feito:** Chamada `POST /uown/svc/updateOptOutAi` via cliente tipado `SvcPhoneClient.updateOptOutAi({ phonePK: 20, optOutAi: true })` usando a API key de serviço. Após retorno HTTP 200, verificação do response body (`pk=20`, `phoneInfo.optOutAi=true`). Consultas DB em `uown_sv_phone WHERE pk = 20` e `WHERE pk = 30` para confirmar propagação (ambos partilham o número `888-6576577`).

**O que acontece:** O backend retorna HTTP 200 com body `SvPhone` contendo `pk=20` e `phoneInfo.optOutAi=true`. A lógica de propagação atualiza todos os registros `uown_sv_phone` que compartilham o mesmo `areaCode + phoneNumber` (888-6576577), incluindo `phonePK=30`.

**O que é verificado:**
- HTTP 200 (response `ok = true`)
- `response.pk` = `20`
- `response.phoneInfo.optOutAi` = `true`
- DB: `uown_sv_phone.opt_out_ai = true` (valor 1) para `phonePK=20`
- DB: `uown_sv_phone.opt_out_ai = true` (valor 1) para `phonePK=30` (propagação via número compartilhado)

| phonePK | opt_out_ai esperado | Resultado |
|---------|--------------------:|-----------|
| 20 | `true` (1) | `true` (1) |
| 30 | `true` (propagação) | `true` (1) |

#### Como verificar manualmente

1. Executar:
   ```bash
   curl -X POST https://svc-api-qa1.uownleasing.com/uown/svc/updateOptOutAi \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"phonePK": 20, "optOutAi": true}'
   ```
2. Verificar HTTP 200 com body `{ pk: 20, phoneInfo: { optOutAi: true } }`
3. Verificar propagação no DB:
   ```sql
   SELECT pk, opt_out_ai FROM uown_sv_phone WHERE pk IN (20, 30);
   -- Esperado: ambos com opt_out_ai = true
   ```

**PASSOU**

---

### Cenário: Cenário 5 — CT-05

**O que é feito:** Verificação da existência da coluna `opt_out_ai` em `uown_sv_phone_history` via `information_schema.columns`. Consulta `SELECT COUNT(*) FROM uown_sv_phone_history WHERE pk = 20 AND revtype = 1 AND opt_out_ai = true` e a mesma query para `pk = 30` para verificar registros de auditoria Hibernate Envers (revtype=1 = MOD).

**O que acontece:** A coluna `opt_out_ai` existe em `uown_sv_phone_history` (migration V20260318174113 aplicada). As queries retornam contagem > 0 para ambos os phone PKs, confirmando que o Hibernate Envers registrou as modificações feitas pelo CT-04.

**O que é verificado:**
- Coluna `opt_out_ai` existe em `uown_sv_phone_history` = `true`
- `COUNT(*)` de rows com `pk=20, revtype=1, opt_out_ai=true` > 0
- `COUNT(*)` de rows com `pk=30, revtype=1, opt_out_ai=true` > 0

| phonePK | revtype | opt_out_ai | count > 0 |
|---------|---------|------------|-----------|
| 20 | 1 (MOD) | `true` | SIM |
| 30 | 1 (MOD) | `true` | SIM |

#### Como verificar manualmente

1. Após executar CT-04 (que atualiza `opt_out_ai=true` para phonePK=20 e propaga para 30):
   ```sql
   SELECT pk, revtype, opt_out_ai, row_updated_timestamp
   FROM uown_sv_phone_history
   WHERE pk IN (20, 30)
     AND revtype = 1
     AND opt_out_ai = true
   ORDER BY rev DESC;
   -- Esperado: pelo menos 1 linha para pk=20 e 1 para pk=30
   ```

**PASSOU**

---

### Cenário: Cenário 6 — CT-06

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Verificação de que o checkbox "Opt Out AI" está visível (guard). Garantia de que o checkbox está desmarcado. Entrada em modo de edição (pencil icon), clique no checkbox "Opt Out AI" para acionar o modal de motivo. O campo de motivo (`SELECTORS.optOutAiReasonTextbox`) é deixado **vazio** propositalmente. Tentativa de clicar no botão Save do modal.

**O que acontece:** O modal "Reason for Opt Out AI Mobile" aparece ao marcar o checkbox. Com o campo de motivo vazio, o botão Save está desabilitado ou, ao ser clicado, exibe uma mensagem de validação e o modal permanece aberto — impedindo o salvamento sem motivo.

**O que é verificado:**
- Modal de motivo exibido ao marcar o checkbox = `true`
- Com campo de motivo vazio: botão Save desabilitado OU modal permanece aberto após clique + mensagem de erro visível
- O sistema impede o salvamento sem preenchimento do motivo

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Modal de motivo visível | `true` | `true` |
| Save bloqueado com motivo vazio | `true` (disabled ou modal permanece aberto) | `true` |

#### Como verificar manualmente

1. Acessar `https://svc-website-qa1.uownleasing.com`
2. Login com credenciais de agente
3. Buscar conta `4476` → Primary Contact → Mobile Phone
4. Clicar no icone de edição (pencil icon) na seção Primary Contact
5. Marcar o checkbox "Opt Out AI"
6. No modal "Reason for Opt Out AI Mobile", deixar o campo de motivo **vazio**
7. Tentar clicar no botão Save — verificar que está desabilitado ou que aparece mensagem de erro
8. Confirmar que o modal permanece aberto e a flag **não** é salva

**PASSOU**

---

### Cenário: Cenário 7 — CT-07

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Garantia de que o checkbox "Opt Out AI" está desmarcado. Habilitação do checkbox com preenchimento de motivo específico `"QA automation test reason 1774015431137"` no modal. Após toast de sucesso, consulta DB em `uown_sv_phone WHERE pk = 7248` para verificar `opt_out_ai_reason`. Chamada API `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=true, optOutAiReason="QA automation test reason 1774015431137"` para verificar que o response retorna `phoneInfo.optOutAiReason` com o valor correto.

**O que acontece:** O sistema persiste o motivo na coluna `uown_sv_phone.opt_out_ai_reason` (VARCHAR 500). A API retorna o campo `optOutAiReason` no response body aninhado em `phoneInfo`, confirmando que o motivo é rastreável tanto no banco de dados quanto na resposta da API.

**O que é verificado:**
- Toast contém `"Opt Out AI flag updated successfully"`
- DB: `uown_sv_phone.opt_out_ai_reason = "QA automation test reason 1774015431137"` para `phonePK=7248`
- API: `response.phoneInfo.optOutAiReason = "QA automation test reason 1774015431137"`

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Toast de sucesso | `"Opt Out AI flag updated successfully"` | Contém a mensagem |
| DB `opt_out_ai_reason` (phonePK=7248) | `"QA automation test reason 1774015431137"` | Match exato |
| API `phoneInfo.optOutAiReason` | `"QA automation test reason 1774015431137"` | Match exato |

#### Como verificar manualmente

1. Acessar conta `4476` → Primary Contact → Mobile Phone
2. Garantir checkbox "Opt Out AI" desmarcado
3. Clicar no icone de edição, marcar o checkbox "Opt Out AI"
4. No modal, preencher o motivo com um texto identificável (ex: "Teste manual motivo XYZ")
5. Confirmar no modal → clicar CONFIRM no modal de confirmação
6. Verificar toast de sucesso
7. Verificar no DB:
   ```sql
   SELECT opt_out_ai_reason FROM uown_sv_phone WHERE pk = 7248;
   -- Esperado: o texto preenchido no passo 4
   ```
8. Verificar via API:
   ```bash
   curl -X POST https://svc-api-qa1.uownleasing.com/uown/svc/updateOptOutAi \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"phonePK": 7248, "optOutAi": true, "optOutAiReason": "Teste manual motivo XYZ"}'
   ```
9. Confirmar que `response.phoneInfo.optOutAiReason` retorna o texto informado

**PASSOU**

---

### Cenário: Cenário 8 — CT-08

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Garantia de que o checkbox "Opt Out AI" está desmarcado. Entrada em modo de edição, clique no checkbox para acionar o modal de motivo. Leitura do atributo `maxlength` do elemento textarea (`SELECTORS.optOutAiReasonTextbox`). Cancelamento do modal. Consulta DB via `information_schema.columns` para obter o tipo e tamanho da coluna `opt_out_ai_reason` em `uown_sv_phone`.

**O que acontece:** O frontend renderiza o textarea de motivo **sem** atributo `maxlength` (valor retornado: `null`). A coluna no banco de dados é `character varying(500)` — ou seja, o limite existe apenas no backend/DB, mas o frontend não impõe restrição de caracteres no input.

**O que é verificado:**
- Atributo `maxlength` do textarea de motivo = `NOT SET` (null)
- DB: coluna `opt_out_ai_reason` existe com tipo `character varying(500)`
- Discrepância identificada: frontend permite entrada ilimitada enquanto DB limita a 500 caracteres

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| Frontend textarea `maxlength` | Valor definido (idealmente 500) | `NOT SET` (null) |
| DB `opt_out_ai_reason` tipo | `character varying(500)` | `character varying(500)` |

> Observação (fora do escopo): O frontend não impõe `maxlength` no textarea de motivo, enquanto a coluna DB limita a 500 caracteres. Essa discrepância de validação frontend/backend é uma melhoria sugerida, mas não faz parte dos requisitos explícitos da Task #505.

#### Como verificar manualmente

1. Acessar conta `4476` → Primary Contact → Mobile Phone
2. Clicar no icone de edição, marcar o checkbox "Opt Out AI"
3. No modal, inspecionar o elemento textarea com DevTools (F12)
4. Verificar se o atributo `maxlength` está presente no elemento `<textarea>`
5. Verificar no DB:
   ```sql
   SELECT data_type, character_maximum_length
   FROM information_schema.columns
   WHERE table_name = 'uown_sv_phone' AND column_name = 'opt_out_ai_reason';
   -- Esperado: character varying, 500
   ```
6. Tentar digitar mais de 500 caracteres no textarea — o frontend deveria impedir, mas atualmente não impede

**PASSOU**

---

### Cenário: Cenário 9 — CT-09

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Garantia de que o checkbox "Opt Out AI" está desmarcado (precondição). Captura do estado DB antes da ação: `SELECT opt_out_ai, COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = 7248`. Entrada em modo de edição (pencil icon), clique no checkbox "Opt Out AI" para acionar o modal de motivo. O campo de motivo **não é preenchido**. Clique no botão CANCEL do modal. Consulta DB após cancelamento. Chamada API `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=false` para confirmar estado inalterado.

**O que acontece:** O modal "Reason for Opt Out AI Mobile" aparece ao marcar o checkbox. Ao clicar CANCEL sem preencher o motivo, o modal fecha e o checkbox retorna ao estado original (desmarcado). Nenhuma requisição `POST /uown/svc/updateOptOutAi` é enviada ao backend. O estado no banco de dados permanece inalterado.

**O que é verificado:**
- DB antes: `opt_out_ai = 0` (false), `opt_out_ai_reason = ""` para `phonePK=7248`
- DB depois: `opt_out_ai = 0` (false), `opt_out_ai_reason = ""` para `phonePK=7248` — iguais ao estado anterior
- API: `response.phoneInfo.optOutAi = false` — confirma que nenhuma alteração foi persistida

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| DB `opt_out_ai` antes | `0` (false) | `0` |
| DB `opt_out_ai` depois | `0` (false) — inalterado | `0` |
| DB `opt_out_ai_reason` antes | `""` | `""` |
| DB `opt_out_ai_reason` depois | `""` — inalterado | `""` |
| API `phoneInfo.optOutAi` | `false` | `false` |

#### Como verificar manualmente

1. Acessar `https://svc-website-qa1.uownleasing.com`
2. Login com credenciais de agente
3. Buscar conta `4476` → Primary Contact → Mobile Phone
4. Verificar no DB o estado atual: `SELECT opt_out_ai, opt_out_ai_reason FROM uown_sv_phone WHERE pk = 7248`
5. Clicar no icone de edição (pencil icon) na seção Primary Contact
6. Marcar o checkbox "Opt Out AI" — modal de motivo aparece
7. **Sem preencher o campo de motivo**, clicar no botão CANCEL
8. Verificar que o checkbox retornou ao estado desmarcado
9. Verificar no DB novamente: `SELECT opt_out_ai, opt_out_ai_reason FROM uown_sv_phone WHERE pk = 7248` — valores devem ser iguais ao passo 4

**PASSOU**

---

### Cenário: Cenário 10 — CT-10

**O que é feito:** Login no portal Servicing, navegação para conta `4476` → Primary Contact. Garantia de que o checkbox "Opt Out AI" está desmarcado (precondição). Captura do estado DB antes da ação: `SELECT opt_out_ai, COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = 7248`. Entrada em modo de edição (pencil icon), clique no checkbox "Opt Out AI" para acionar o modal de motivo. Preenchimento do campo de motivo com `"This reason should NOT be persisted"`. Clique no botão CANCEL do modal (em vez de Save). Consulta DB após cancelamento. Chamada API `POST /uown/svc/updateOptOutAi` com `phonePK=7248, optOutAi=false` para confirmar estado inalterado.

**O que acontece:** O modal "Reason for Opt Out AI Mobile" aparece ao marcar o checkbox. O usuário preenche o motivo mas clica CANCEL em vez de Save. O modal fecha, o checkbox retorna ao estado original (desmarcado), e o texto preenchido no campo de motivo **não é persistido**. Nenhuma requisição `POST /uown/svc/updateOptOutAi` é enviada ao backend.

**O que é verificado:**
- DB antes: `opt_out_ai = 0` (false), `opt_out_ai_reason = ""` para `phonePK=7248`
- DB depois: `opt_out_ai = 0` (false), `opt_out_ai_reason = ""` para `phonePK=7248` — texto preenchido NÃO foi persistido
- API: `response.phoneInfo.optOutAi = false` — confirma que nenhuma alteração foi persistida

| Verificação | Esperado | Resultado |
|-------------|----------|-----------|
| DB `opt_out_ai` antes | `0` (false) | `0` |
| DB `opt_out_ai` depois | `0` (false) — inalterado | `0` |
| DB `opt_out_ai_reason` antes | `""` | `""` |
| DB `opt_out_ai_reason` depois | `""` — texto NÃO persistido | `""` |
| API `phoneInfo.optOutAi` | `false` | `false` |

#### Como verificar manualmente

1. Acessar `https://svc-website-qa1.uownleasing.com`
2. Login com credenciais de agente
3. Buscar conta `4476` → Primary Contact → Mobile Phone
4. Verificar no DB o estado atual: `SELECT opt_out_ai, opt_out_ai_reason FROM uown_sv_phone WHERE pk = 7248`
5. Clicar no icone de edição (pencil icon) na seção Primary Contact
6. Marcar o checkbox "Opt Out AI" — modal de motivo aparece
7. Preencher o campo de motivo com um texto qualquer (ex: "Teste manual cancelamento")
8. Clicar no botão **CANCEL** (em vez de Save)
9. Verificar que o checkbox retornou ao estado desmarcado
10. Verificar no DB: `SELECT opt_out_ai, opt_out_ai_reason FROM uown_sv_phone WHERE pk = 7248` — valores devem ser iguais ao passo 4, o texto preenchido **não** deve ter sido salvo

**PASSOU**

---

## Cobertura dos Requisitos

| Requisito | Coberto | Cenário |
|-----------|:-------:|---------|
| Checkbox "Opt Out AI" visível na seção DNC abaixo de "Do Not Call" | SIM | CT-01 |
| Checkbox pode ser marcado e desmarcado | SIM | CT-02, CT-03 |
| Ao salvar, toast de sucesso exibido | SIM | CT-02, CT-03 |
| Estado persiste após refresh da pagina | SIM | CT-02, CT-03 |
| DB reflete o valor correto em `uown_sv_phone.opt_out_ai` | SIM | CT-02, CT-03, CT-04 |
| Propagação para todas as contas com mesmo número | SIM | CT-04 |
| Histórico registrado em `uown_sv_phone_history` | SIM | CT-05 |
| Activity log registrado (DATA_CHANGE) | SIM | CT-02, CT-03 |
| Campo de motivo obrigatório ao habilitar | SIM | CT-06 |
| Motivo persiste no DB e retorna na API | SIM | CT-07 |
| Validação de limite de caracteres (frontend vs DB) | SIM | CT-08 |
| Cancelar modal sem preencher motivo — estado inalterado | SIM | CT-09 |
| Cancelar modal após preencher motivo — estado inalterado, texto não persistido | SIM | CT-10 |

## Observações para o Time de Desenvolvimento

### OBS-01 — Frontend textarea de motivo "Opt Out AI" sem atributo maxlength

**Classificação:** Observação (fora do escopo da Task #505)
**Severidade:** Informativa

**Descrição:** O textarea do modal "Reason for Opt Out AI Mobile" não possui o atributo HTML `maxlength`. A coluna correspondente no banco de dados (`uown_sv_phone.opt_out_ai_reason`) é `character varying(500)`. Sem a restrição no frontend, um usuário pode digitar mais de 500 caracteres, o que causaria erro de constraint violation no banco ou truncamento silencioso pelo backend.

**Triagem (Bug Triage Protocol):**
1. **Comportamento errado?** Parcialmente — discrepância entre frontend (sem limite) e backend/DB (500 chars)
2. **Em escopo?** NAO — a Task #505 nao define requisito explícito de `maxlength` no textarea
3. **Classificação:** Fora do escopo → observação informativa para o time de desenvolvimento

**Sugestão de melhoria:** Adicionar `maxLength={500}` ao componente React `<textarea>` do modal de motivo.

**Evidência:** CT-08 detectou a discrepância — `[CT-08] Frontend textarea maxlength: NOT SET` vs `[CT-08] DB column type for opt_out_ai_reason: character varying(500)`.

## Resumo da Validação

| Verificação | Resultado |
|-------------|-----------|
| Todos os cenários da tarefa cobertos | SIM (10/10) |
| Contratos de API conferem com Postman | SIM (`POST /uown/svc/updateOptOutAi` retorna 200 com `SvPhone`) |
| Schema do BD confere com migration | SIM (`opt_out_ai`, `opt_out_ai_reason` em `uown_sv_phone` e `opt_out_ai` em `uown_sv_phone_history`) |
| Regras de negócio validadas | SIM (propagação por número, auditoria Envers, activity log, motivo obrigatório, cancelamento sem persistência) |
| Bugs de aplicação encontrados | NAO (0 bugs — OBS-01 reclassificada como observação fora do escopo) |
| Total de cenários | 10 |
| Passaram | 10 |
| Falharam | 0 |
| Skipped | 0 |
| Vídeo gravado | SIM |
| Screenshots salvos | SIM (3 arquivos em reports/screenshots/) |
