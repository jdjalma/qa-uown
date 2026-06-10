# Cenários de Teste — Task #442: UOWN | SVC | Podium API Integration

> **Task:** https://gitlab.com/uown/backend/svc/-/work_items/442
> **Milestone:** RU03.26.1.50.0
> **Data:** 2026-03-20
> **Tipo:** Hybrid (E2E + API + DB)
> **Portal principal:** Servicing

---

## Resumo da Análise

### Componentes Envolvidos

| Componente | Repositório | MR | Descrição |
|-----------|-------------|-----|-----------|
| Backend API | svc | !1313 | `POST /uown/svc/accounts/{accountPk}/podium-link` + Token management |
| AMS Permission | ams | !50 | Permissão `send_podium_link` (ADMIN, MANAGER) |
| Frontend Servicing | servicing | !670 | Botão Send Podium Link no modal Send Invite |
| Frontend UI Library | uownleasing-ui | !435 | InviteModal com opção Podium |

### Endpoint Principal

- **Método:** `POST /uown/svc/accounts/{accountPk}/podium-link`
- **Request body:** Nenhum (accountPk via path param)
- **Response:** `{ message?: string, errorMessage?: string }`
- **Status codes:** 200 (sucesso), 400 (validação), 503 (token indisponível), 500 (exceção)

### Tabelas de Banco

| Tabela | Papel |
|--------|-------|
| `uown_podium_token` | Armazena OAuth2 access/refresh tokens para Podium API |
| `sv_outbound_api_log` | Log de chamadas externas (AOP intercepta `SvOutboundCall.makeRestCall`) |
| `flyway_schema_history` | Migração `V20260317121000__create_podium_token_table.sql` |

### Permissões

| Permissão | Categoria | Tipo | Roles com acesso |
|-----------|-----------|------|-----------------|
| `send_podium_link` | `customer_information` | `modify` | ADMIN, MANAGER |
| `view_send_invite` | (controla visibilidade do envelope) | `view` | ADMIN, MANAGER, + outros |

### Fluxo UI

```
Ícone envelope (#invitation) → InviteModal → "Send Podium Link" → ConfirmationModal ("Please Confirm") → "Continue" → API call → Toast
```

---

## US-PDM-01: Permissão send_podium_link controla visibilidade do botão

**Como** administrador do Servicing,
**Quero** que o botão "Send Podium Link" apareça apenas para usuários com permissão `send_podium_link`,
**Para** garantir que apenas roles autorizados (ADMIN, MANAGER) possam enviar convites Podium.

### Critérios de Aceite
- [ ] Usuário com permissão vê "Send Podium Link" no InviteModal
- [ ] Usuário sem permissão NÃO vê "Send Podium Link" no InviteModal (ícone envelope pode estar visível, mas opção Podium não)

---

### CT-01: Permissão — botão Send Podium Link visível para ADMIN

**Tipo:** E2E
**Portal:** Servicing
**Pré-condição:** Usuário logado com role ADMIN (auth state `servicing`)

**Passos:**
1. Navegar para uma conta ativa no Servicing (ex: accountPk conhecido)
2. Verificar que o ícone envelope (`#invitation`) está visível
3. Clicar no ícone envelope para abrir o InviteModal
4. Verificar que a opção "Send Podium Link" está visível no modal
5. Fechar o modal

**Resultado esperado:**
- Ícone envelope visível na barra do account summary
- InviteModal abre com opção "Send Podium Link" presente
- Opção é clicável

**Tags:** @regression

---

## US-PDM-02: Envio de Convite Podium via Servicing UI

**Como** administrador do Servicing,
**Quero** enviar um convite Podium para o cliente primário de uma conta,
**Para** que o cliente receba um convite para deixar uma avaliação no Google My Business via Podium.

### Critérios de Aceite
- [ ] Clicar "Send Podium Link" abre modal de confirmação
- [ ] Confirmar envio dispara POST ao backend
- [ ] Toast de sucesso exibido ao usuário
- [ ] Se erro: toast de erro com mensagem descritiva

---

### CT-02: Happy path — Send Podium Link via UI com sucesso

**Tipo:** E2E (Hybrid — UI + toast)
**Portal:** Servicing
**Pré-condição:** Conta ativa com cliente primário que possui email e/ou telefone móvel, sem flags `doNotEmail`/`doNotText`

**Passos:**
1. Navegar para conta válida no Servicing
2. Clicar ícone envelope (`#invitation`)
3. Clicar "Send Podium Link" no InviteModal
4. Verificar que ConfirmationModal aparece com título "Please Confirm"
5. Clicar "Continue"
6. Aguardar resposta e verificar toast

**Resultado esperado:**
- ConfirmationModal exibe "Are you sure you want to continue?"
- Após confirmação: toast `success` com mensagem "The invitation has been successfully sent." (ou mensagem da API)
- Se Podium API indisponível no ambiente: toast `error` com mensagem descritiva — documentar como limitação de ambiente

**Tags:** @regression @critical

---

### CT-03: Envio com conta sem contato elegível — toast de erro

**Tipo:** E2E
**Portal:** Servicing
**Pré-condição:** Conta ativa cujo cliente primário tem flags `doNotEmail=true` E `doNotText=true` (ou sem email/telefone)

**Passos:**
1. Navegar para conta com restrições de contato
2. Clicar envelope → Send Podium Link → Continue
3. Verificar toast de erro

**Resultado esperado:**
- Toast `error` com mensagem: "No eligible email or mobile phone found for the primary customer." (ou mensagem equivalente do backend)

**Tags:** @regression

**Nota:** Este cenário depende de identificar/configurar uma conta com restrições de contato. Se não disponível no ambiente, marcar como SKIPPED com justificativa.

---

## US-PDM-03: Validação de Token Podium

**Como** QA,
**Quero** validar que o token OAuth2 do Podium é gerenciado corretamente,
**Para** garantir que o token lifecycle (criação, uso, refresh) funciona sem intervenção manual.

### Critérios de Aceite
- [ ] Tabela `uown_podium_token` contém ao menos um registro válido
- [ ] Token válido (não expirado) é reutilizado sem refresh
- [ ] Token expirado é refreshed automaticamente

---

### CT-04: Token Podium existe em uown_podium_token

**Tipo:** DB
**Pré-condição:** Após envio de Podium link (CT-02)

**Passos:**
1. Consultar `uown_podium_token` (mais recente por `row_created_timestamp`)
2. Verificar campos obrigatórios

**Resultado esperado:**
- `access_token` NOT NULL e length > 0
- `expiration_time` NOT NULL
- `expiration_time` > now (ou recentemente expirado + refreshed)

**Tags:** @regression

---

## US-PDM-04: Validação de Log de Outbound (sv_outbound_api_log)

**Como** QA,
**Quero** verificar que a chamada ao Podium API é registrada no log de outbound,
**Para** garantir rastreabilidade de todas as chamadas externas.

### Critérios de Aceite
- [ ] Registro existe em `sv_outbound_api_log` após envio
- [ ] URL aponta para `https://api.podium.com/v4/reviews/invites`
- [ ] Tipo de chamada é `POST`
- [ ] Payload de request contém `locationUid`

---

### CT-05: Outbound log registrado após envio Podium

**Tipo:** DB (Hybrid — depende de CT-02)
**Pré-condição:** Podium link enviado com sucesso (CT-02)

**Passos:**
1. Registrar timestamp antes do envio (CT-02)
2. Após CT-02, consultar `sv_outbound_api_log` para registros criados após o timestamp
3. Filtrar por URL contendo 'podium'

**Resultado esperado:**
- Registro existe com:
  - `url` LIKE `%podium%reviews/invites%`
  - `call_type` = `POST`
  - Request payload contém `locationUid`
  - Response payload NOT NULL

**Tags:** @regression

---

## US-PDM-05: Migração Flyway aplicada

**Como** QA,
**Quero** verificar que a migração Flyway para criação da tabela `uown_podium_token` foi aplicada,
**Para** garantir que o schema do banco está atualizado para suportar a feature.

### Critérios de Aceite
- [ ] Migração `V20260317121000` presente no `flyway_schema_history` com sucesso

---

### CT-06: Migração V20260317121000 (create_podium_token_table) aplicada

**Tipo:** DB
**Pré-condição:** Nenhuma (verificação de infra)

**Passos:**
1. Consultar `flyway_schema_history` para version `20260317121000`

**Resultado esperado:**
- Registro encontrado
- `success` = `true`
- `script` contém `create_podium_token_table`

**Tags:** @regression

---

## US-PDM-06: API — Endpoint podium-link com conta inválida

**Como** QA,
**Quero** validar que o endpoint retorna erro adequado para contas sem cliente primário,
**Para** garantir tratamento de erros robusto.

### Critérios de Aceite
- [ ] POST com accountPk inexistente retorna HTTP 400 ou 500

---

### CT-07: API — POST podium-link com accountPk inválido retorna erro

**Tipo:** API
**Pré-condição:** Nenhuma

**Passos:**
1. POST `/uown/svc/accounts/999999999/podium-link` (accountPk inexistente)
2. Verificar response

**Resultado esperado:**
- HTTP 400 (Bad Request) com `errorMessage` contendo "No primary customer found" ou similar
- OU HTTP 500 se accountPk não existe na base

**Tags:** @regression

---

## Mapeamento Testing Steps → Cenários

| Testing Step (Dev) | Cenário(s) | Tipo |
|-------------------|------------|------|
| 1. Permission check (with send_podium_link) | CT-01 | E2E |
| 2. Send request from UI | CT-02, CT-03 | E2E |
| 3. Token lifecycle | CT-04 | DB |
| 4. Outbound request validation | CT-05 | DB |
| — Infra (Flyway) | CT-06 | DB |
| — Error handling | CT-07 | API |

---

## Estrutura do Teste

```
tests/taskTestingUown/
└── RU03.26.1.50.0_uownSvcPodiumApiIntegration_442/
    ├── RU03.26.1.50.0_uownSvcPodiumApiIntegration_442.spec.ts
    └── RU03.26.1.50.0_uownSvcPodiumApiIntegration_442.md  (relatório gerado)
```

**Projeto Playwright:** `task-testing`
**Modo:** `serial` (CT-04 e CT-05 dependem de CT-02)

---

## Artefatos Necessários

| Artefato | Tipo | Existe? | Ação |
|----------|------|:-------:|------|
| Page object Servicing — Send Invite/Podium | Page Object | NÃO | Adicionar métodos ao `ServicingCustomerPage` existente |
| API client Podium | API Client | NÃO | Criar `SvcPodiumClient` (1 método: `sendPodiumLink`) |
| Selectors InviteModal/ConfirmationModal | Selectors | NÃO | Adicionar ao `common.selectors.ts` |
| Response type | Response | NÃO | Criar `PodiumResponse` interface |
