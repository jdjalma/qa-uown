> Este arquivo e registro de execucao, NAO fonte de padrao. Selectors, helpers e classificacoes aqui sao snapshot do momento da exploracao. Verificar fonte primaria antes de usar.

# AMS Portal — Exploracao Exploratoria dev3 (2026-06-03)

**Ambiente:** dev3 | Sessao unica | 2026-06-03
**Executor:** Claude (orquestrador, MCP Playwright 1440x900)
**Login:** manager / P@ssw0rdu0wn
**URL base:** https://ams-website-dev3.uownleasing.com
**Nota de acesso:** VPN obrigatoria. IP 45.237.111.37 recebe `403 RBAC: access denied` (Istio) sem VPN ativa.

---

## TL;DR

5 secoes do AMS exploradas completamente via browser (MCP Playwright): Users, Groups, Roles, Merchants, Associate to merchants. Portal funcional em dev3 com VPN ativa. 44 usuarios, 248 merchants ativos, 3 grupos, 8 roles AMS, 8 roles Origination (sem descricao), 0 roles Servicing. 1 hipotese de bug de autorizacao (HTTP 200 com body unauthorized em vez de 401/403), 5 observacoes de UX/completude de dados. Nenhum bloqueador de release identificado.

---

## Cobertura

| Secao | URL | Features exploradas | Status |
|-------|-----|---------------------|--------|
| Users | `/users` | Listagem (44 usuarios), paginacao, Add User modal, acoes Unlock/Clone, Filters | Explorado |
| Groups | `/groups` | Listagem (3 grupos), painel Edit Users, Create Group | Explorado |
| Roles | `/roles` | 3 tabs (AMS/Origination/Servicing), permissoes por role, Add Role | Explorado |
| Merchants | `/merchants` | Listagem (248 merchants), painel Assign Users | Explorado |
| Associate to merchants | `/associate-users-to-merchants` | Dual-panel users+merchants, selecao, Submit (nao executado) | Explorado |
| User Detail | `/users/manager` | Profile, roles cross-portal (3 portais), permission, audit log (Notes) | Explorado |

---

## APIs descobertas

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/login` | POST | Autenticacao AMS |
| `/user?search=&page=0&size=10` | GET | Listagem de usuarios paginada |
| `/user/{username}` | GET | Detalhe de usuario |
| `/user/{username}/permission` | GET | Permissoes individuais (retorna `{unauthorized: true}` p/ manager) |
| `/role` | GET | Lista todos os roles (AMS, Origination, Servicing) |
| `/role/{roleName}/permission` | GET | Permissoes de um role (retorna `{unauthorized: true}` p/ manager) |
| `/group` | GET | Lista grupos |
| `/group/{name}/getUsers` | GET | Usuarios de um grupo |
| `/permission` | GET | Todas as permissoes do sistema |
| `/uown/merchants?page=0&size=10&search=&isActive=true` | GET | Merchants ativos (endpoint svc#504 novo) |

---

## Dados quantitativos (dev3, 2026-06-03)

| Entidade | Quantidade |
|----------|-----------:|
| Usuarios | 44 |
| Merchants ativos | 248 |
| Grupos | 3 |
| Roles AMS | 8 |
| Roles Origination | 8 |
| Roles Servicing | 0 |

### Roles AMS (com descricao)

| Role | Descricao |
|------|-----------|
| admin | Full AMS access |
| agent_admin | Almost Read-only AMS access, can unlock users |
| agent | Read-only AMS access |
| agent_unlock | Unlock users with read-only AMS access |
| auditor | No AMS access |
| isr | Read-only AMS access |
| manager | User and role management |
| supervisor | Limited user management |

### Roles Origination (8 roles, sem descricao)

supervisor, merchant, manager, isr, auditor, agent_admin, agent, admin

---

## Secoes — detalhe

### Users (`/users`)

Listagem tabular com colunas: Username (link para detalhe), First Name, Last Name, Phone, Email, Roles, Active (icone), Locked (icone). Paginacao (10/pagina, max 100). Ordenacao por First Name e Last Name.

Acoes:
- **Add User**: modal com First Name*, Last Name*, Username*, Email*, Phone, Password*, Confirm Password*. Sem selecao de Role no formulario.
- **Clone User**: habilitado com 1 usuario selecionado.
- **Unlock User(s)**: habilitado com usuario(s) selecionado(s).
- **Filters**: disponivel (nao explorado em detalhe).

### User Detail (`/users/{username}`)

8 secoes colapsaveis no detalhe do usuario "manager":

| Secao | Conteudo |
|-------|----------|
| Edit User Profile | First Name, Last Name, Email, Phone, Active (Yes/No), Account Locked (Yes/No) |
| Change User Role | Tabs: Ams-auth / Origination / Servicing — roles diferentes por portal |
| Change User Password | (nao expandido) |
| Change User Permission | Vazio para "manager" (sem permissao — H-AMS-001) |
| Change Username | (nao expandido) |
| Edit User Groups | (nao expandido) |
| Edit User Merchants | Exibe "All" para manager — acesso irrestrito a merchants |
| Notes | Audit log: Date, Type, User ID, Notes — criacao e acoes do usuario |

Perfil do usuario "manager" (criado 09/20/2024 pelo SYSTEM):
- Email: manager@fakeemail.com
- AMS role: manager
- Origination roles: admin, manager
- Servicing role: manager
- Merchant access: All

### Groups (`/groups`)

3 grupos: test, admins, KORNERSTONETEST. Coluna unica "Name". Clicar abre painel "Edit Users" lateral. Grupos "admins" e "KORNERSTONETEST" sem usuarios atribuidos (`GET /group/admins/getUsers` retorna lista vazia).

### Roles (`/roles`)

3 tabs: AMS (padrao), Origination, Servicing. Clicar em role abre painel "Edit Role Permissions" (vazio para "manager"). Acoes: Add Role, Add Permission.

### Merchants (`/merchants`)

Titulo: "Manage Users (Merchant)" — focado em acesso de usuarios merchant, nao configuracao de merchants. Usa `GET /uown/merchants?isActive=true` (svc#504 novo endpoint confirmado em dev3). Coluna "Last Login" mostra "—" para todos os 248 merchants ativos.

### Associate to merchants (`/associate-users-to-merchants`)

Dual panel: Users (esq, 44) + Merchants (dir, 248). Selecionar 1+ usuarios E 1+ merchants habilita Submit. Counters atualizam dinamicamente ("1 user selected", "No merchants selected"). Submit nao executado (mutacao de dados sem autorizacao explicita — regra #3).

---

## Achados

### [HIPOTESE H-AMS-001] Endpoints de permissao retornam HTTP 200 com body `{unauthorized: true}` em vez de 401/403

**Endpoints afetados:** `GET /role/{roleName}/permission`, `GET /user/{username}/permission`

**Comportamento:** para usuario "manager", ambos retornam HTTP 200 com body `{"unauthorized": true}`. A UI exibe os paineis "Edit Role Permissions" e "Change User Permission" completamente em branco sem mensagem explicativa ao usuario.

**Evidencia (fetch direto da pagina):**
```json
// GET /role/admin/permission como manager
{ "unauthorized": true }

// GET /user/manager/permission como manager
{ "unauthorized": true }
```

**Por que hipotese:** pode ser decisao arquitetural intencional (envelope de resposta da aplicacao vs semantica HTTP). Nao testado com usuario "admin" para comparar comportamento autorizado.

**Impacto:** (a) clientes que dependem de status HTTP para detectar autorizacao podem nao detectar o acesso negado; (b) UI poderia mostrar "Sem permissao de acesso" em vez de painel vazio — melhor UX.

---

### [OBSERVACAO O-AMS-001] Roles Origination sem descricao

Tab Origination em `/roles` lista 8 roles com coluna "Description" vazia para todos. Tab AMS tem descricoes completas. Provavelmente dado incompleto — sem impacto funcional.

---

### [OBSERVACAO O-AMS-002] Tab Servicing em Roles vazio

Nenhum role definido para Servicing no AMS. Roles do Servicing sao provavelmente gerenciados diretamente no portal Servicing, nao via AMS.

---

### [OBSERVACAO O-AMS-003] Add User nao inclui selecao de Role

Modal de criacao de usuario nao tem campo de Role. Usuario e criado sem role e precisa de passo separado para atribuicao. Cria janela de tempo onde usuario existe sem role definido.

---

### [OBSERVACAO O-AMS-004] Paineis de permissao exibem branco sem feedback ao usuario

Para "manager", secoes "Change User Permission" e "Edit Role Permissions" abrem em branco. Nao ha mensagem "Sem permissao para visualizar". Usuario pode interpretar erroneamente como "nenhuma permissao configurada".

---

### [OBSERVACAO O-AMS-005] Endpoint svc#504 confirmado em dev3

`GET /uown/merchants?page=0&size=10&search=&isActive=true` e o endpoint novo do svc#504 em uso no AMS dev3. O endpoint legado `POST /uown/getMerchantsByCriteria` nao foi observado nas chamadas de rede. Alinha com o spec do ticket #504 e o teste `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504.spec.ts`.

---

## Gaps de cobertura (nao explorados)

| Item | Motivo |
|------|--------|
| Filters modal (Users, Merchants, Associate) | Nao aberto |
| Add Role / Add Permission | Mutacao de dados |
| Clone User | Mutacao de dados |
| Create Group | Mutacao de dados |
| Submit em Associate to merchants | Mutacao de dados |
| Usuarios paginas 2-5 (locked, inactive) | Somente pagina 1 |
| Forgot Password | Nao explorado |
| Footer links (Privacy, Terms, Contact) | Nao explorado |
| Logout flow | Nao explorado |
| Sessao expirada / timeout | Nao testado |
| Activity log de acoes AMS | Regra #13 — nao validado (nenhuma acao mutante executada) |
