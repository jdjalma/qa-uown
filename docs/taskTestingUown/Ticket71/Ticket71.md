---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/ams-website/-/issues/71

UOWN | AMS Website | Fix Role Assignment Filter

The role assignment feature is displaying repeated options, the filter must be adjusted to display just roles from the specific environment

![alt text](image.png)

Testing Steps
Previously, when viewing the AMS tab, the system returned roles from all three subsystems (ams-auth, origination, and servicing), causing each role to appear three times in the UI. The fix ensures that only roles belonging to the currently selected subsystem are displayed.

Expected Roles by Subsystem
AMS Subsystem (ams-auth tab)
ADMIN
MANAGER
SUPERVISOR
AGENT
ISR
AGENT_UNLOCK
AUDITOR

Total: 7 roles
Origination Subsystem (origination tab)
ADMIN
MANAGER
SUPERVISOR
AGENT
AUDITOR
ISR
MERCHANT

Total: 7 roles
Servicing Subsystem (servicing tab)
ADMIN
MANAGER
SUPERVISOR
AGENT
ISR
AUDITOR

Total: 6 roles
Regression Testing
Verify Existing Functionality Still Works
Role Management: Create, edit, and delete roles in each subsystem
Permission Assignment: Add and remove permissions from roles
User Management: Assign roles to users from different subsystems
Role Permissions View: View permissions for roles in each subsystem
Navigation: Switching between tabs maintains correct role context

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## UOWN | AMS Website | Correção do Filtro de Atribuição de Papéis (Roles)

### Descrição do Problema

A funcionalidade de **atribuição de papéis (Role Assignment)** estava exibindo **opções duplicadas** no filtro de seleção de roles.
Isso ocorria porque o sistema retornava papéis de **todos os subsistemas** (ams-auth, origination e servicing), fazendo com que cada role aparecesse repetida na interface.

### Correção Implementada

O filtro de roles foi ajustado para exibir **somente os papéis pertencentes ao subsistema atualmente selecionado**, eliminando duplicidades e garantindo consistência no contexto da aba ativa.

---

## Passos de Teste (Testing Steps)

1. Acessar o **AMS Website**
2. Navegar até a aba **AMS**
3. Verificar o filtro de atribuição de roles
4. Alternar entre as abas de subsistema:

   * AMS (ams-auth)
   * Origination
   * Servicing
5. Confirmar que:

   * Apenas os roles do subsistema ativo são exibidos
   * Não há duplicação de opções no filtro

---

## Roles Esperados por Subsistema

### Subsistema AMS (aba **ams-auth**)

* ADMIN
* MANAGER
* SUPERVISOR
* AGENT
* ISR
* AGENT_UNLOCK
* AUDITOR

**Total:** 7 roles

---

### Subsistema Origination (aba **origination**)

* ADMIN
* MANAGER
* SUPERVISOR
* AGENT
* AUDITOR
* ISR
* MERCHANT

**Total:** 7 roles

---

### Subsistema Servicing (aba **servicing**)

* ADMIN
* MANAGER
* SUPERVISOR
* AGENT
* ISR
* AUDITOR

**Total:** 6 roles

---

## Testes de Regressão

### Verificar se as Funcionalidades Existentes Continuam Operando Corretamente

* **Gerenciamento de Roles**

  * Criar roles em cada subsistema
  * Editar roles existentes
  * Excluir roles

* **Atribuição de Permissões**

  * Adicionar permissões a um role
  * Remover permissões de um role

* **Gerenciamento de Usuários**

  * Atribuir roles a usuários de diferentes subsistemas
  * Garantir que apenas roles válidos do subsistema sejam listados

* **Visualização de Permissões**

  * Visualizar corretamente as permissões associadas a cada role
  * Confirmar que o contexto do subsistema é respeitado

* **Navegação entre Abas**

  * Alternar entre abas de subsistemas
  * Garantir que o filtro de roles seja atualizado conforme o subsistema selecionado
  * Validar que o contexto correto é mantido sem necessidade de reload manual

---

### Resultado Esperado

* Nenhuma duplicidade de roles no filtro
* Roles exibidos de acordo com o subsistema ativo
* Nenhuma regressão nas funcionalidades existentes de roles, permissões e usuários

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 2 arquivos
+
9
−
6
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

pages
‎/roles‎

inde
‎x.tsx‎
+5 -4

serv
‎er.js‎
+4 -2

 pages/roles/index.tsx 
+
5
−
4

Visualizado
@@ -40,8 +40,11 @@ const RolesPage = (props: RolesPageProps) => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>(allPerms);
  const [currentTab, setCurrentTab] = useState('ams-auth');

  const updateRolesAndPermissions = async () => {
  const updateRolesAndPermissions = async (subsystem?: string) => {
    utilityStore?.setIsLoading(true);
    if (subsystem) {
      utilityStore?.setSubSystem(subsystem);
    }
    await permissionsStore?.getAllRoles();
    await permissionsStore?.getAllRolePermissions();
    await permissionsStore?.getUserPermissions('manager');
@@ -55,8 +58,7 @@ const RolesPage = (props: RolesPageProps) => {

  useEffect(() => {
    if (!accountStore?.isLoggingOut) {
      utilityStore?.setSubSystem(currentTab);
      updateRolesAndPermissions();
      updateRolesAndPermissions(currentTab);
    }
  }, [currentTab]);

@@ -96,7 +98,6 @@ const RolesPage = (props: RolesPageProps) => {
            activeKey={currentTab}
            onSelect={(tab) => {
              if (tab !== currentTab) {
                utilityStore?.setSubSystem(tab || '');
                setCurrentTab(tab || '');
                permissionsStore?.setSelectedRole(undefined);
                permissionsStore?.setRolePermissions([]);
 server.js 
+
4
−
2

Visualizado
@@ -136,7 +136,8 @@ const proxy = {
    targetUrl: amsURL,
    pathRewrite: {'^role': '/role'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
@@ -144,7 +145,8 @@ const proxy = {
    targetUrl: amsURL,
    pathRewrite: {'^role/': '/role/'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },


 1 arquivo
+
1
−
6
 src/main/java/com/uownleasing/ams/service/RoleService.java 
+
1
−
6

Visualizado
@@ -36,12 +36,7 @@ public class RoleService extends RequestContextAwareService {

    public List<Role> getAllRoles() {
        SubSystem subSystem = getCurrentContextSubSystem();

        if(subSystem.isAMS()) {
            return roleRepository.findAll();
        } else {
            return roleRepository.findAllBySubSystem(subSystem);
        }
        return roleRepository.findAllBySubSystem(subSystem);
    }

    public Role getRoleByPk(Long pk) { return roleRepository.findByPk(pk); }

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
## Scenario 1: Display only roles from the selected subsystem

```markdown
- Given the user is authenticated in the AMS Website
- And is on the roles management page
- When the user selects the "<Subsystem>" tab
- Then the roles filter must display only roles from the "<Subsystem>" subsystem
- And the number of displayed roles must be "<Total>"
- And no roles from other subsystems must be displayed

Examples:
| Subsystem    | Total |
| ------------ | ----- |
| ams-auth     | 7     |
| origination  | 7     |
| servicing    | 6     |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 2: Do not display duplicated roles when switching subsystems

```markdown
- Given the user is on the roles management page
- When the user selects the "<Subsystem>" tab
- Then each role must be displayed only once in the filter
- And there must be no duplicate role names

Examples:
| Subsystem    |
| ------------ |
| ams-auth     |
| origination  |
| servicing    |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 3: Update the roles filter when switching subsystem tabs

```markdown
- Given the user is viewing roles from the "ams-auth" subsystem
- When the user switches to the "origination" tab
- Then the roles filter must be updated to the "origination" subsystem
- And roles from the previous subsystem must not remain visible
```

Screenshot

**PASS**

---
## Scenario 4: Clear selected role when switching subsystems

```markdown
- Given a role is selected in the "ams-auth" subsystem
- And the permissions list is displayed
- When the user selects the "servicing" tab
- Then no role must remain selected
- And the permissions list must be empty
```

Screenshot

**PASS**

---
## Scenario 5: Create a role respecting the active subsystem

```markdown
- Given the user is on the "<Subsystem>" tab
- When the user creates a new role
- Then the role must be associated with the "<Subsystem>" subsystem
- And the role must be displayed only in the "<Subsystem>" tab
- And the role must not appear in other subsystems

Examples:
| Subsystem    |
| ------------ |
| ams-auth     |
| origination  |
| servicing    |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 6: Assign a role to a user according to the active subsystem

```markdown
- Given the user accesses role assignment on the "<Subsystem>" tab
- When the list of available roles is displayed
- Then only roles from the "<Subsystem>" subsystem must be available
- And it must not be possible to assign roles from other subsystems

Examples:
| Subsystem    |
| ------------ |
| ams-auth     |
| origination  |
| servicing    |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 7: View role permissions according to the subsystem

```markdown
- Given the user is on the "<Subsystem>" tab
- When the user selects a role
- Then only the permissions associated with that role must be displayed
- And no permissions from other subsystems must appear

Examples:
| Subsystem    |
| ------------ |
| ams-auth     |
| origination  |
| servicing    |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 8: Update roles dynamically without reloading the page

```markdown
- Given the user is on the roles management page
- When the user switches between subsystem tabs
- Then the roles filter must be updated dynamically
- And the page must not require a reload
```

Screenshot

**PASS**

---
## Scenario 9: Create a user and assign a role from the active subsystem

```markdown
- Given the user is authenticated in the AMS Website
- And is on the "<Subsystem>" tab
- When the user creates a new user
- And assigns a role available in the "<Subsystem>" subsystem
- Then the user must be created with the role correctly assigned
- And the assigned role must belong only to the "<Subsystem>" subsystem
- And it must not be possible to assign roles from other subsystems

Examples:
| Subsystem    |
| ------------ |
| ams-auth     |
| origination  |
| servicing    |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
```

Screenshot

**PASS**

---
## Scenario 10: Do not allow creating roles with the same name in the same subsystem

```markdown
- Given the user is authenticated in the AMS Website
- And is on the "<Subsystem>" tab
- And a role with the name "<RoleName>" already exists in the "<Subsystem>" subsystem
- When the user attempts to create a new role with the name "<RoleName>"
- Then the system must prevent the role creation
- And an error message must be displayed
- And the duplicate role must not be created

Examples:
| Subsystem    | RoleName        |
| ------------ | --------------- |
| ams-auth     | CUSTOM_OPERATOR |
| origination  | CUSTOM_OPERATOR |
| servicing    | CUSTOM_OPERATOR |

|    Data    | Value        |
|------------|--------------|
| Subsystem  | <Subsystem>  |
| RoleName   | <RoleName>   |
```

Screenshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------