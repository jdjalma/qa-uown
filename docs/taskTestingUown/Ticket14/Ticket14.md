--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/14

---

# UOWN | AMS | Add ISR Role and Restrict Access to Specific Actions

**Status:** Open
**Ticket created:** 4 weeks ago by Yuri Araujo

---

## Synopsis

Add the **ISR (Independent Sales Rep)** role to the system and apply access limitations to ensure users assigned to this role cannot perform restricted actions.

Additionally, create a new role in AMS based on the existing **Agent** role, named **Agent Unlock Only**.
This role should inherit the base Agent behavior but include **only** the permissions required to unlock users.

This role **must not** be assigned to all agents—only to selected users—in order to maintain operational control.

---

## Business Objective

Ensure ISR users have restricted operational capabilities, preventing them from performing actions outside their intended responsibilities.

Allow only selected agents to unlock users, ensuring better control, traceability, and risk reduction without granting unnecessary permissions.

---

## Features & Requirements

### 1. Add New Roles

* Create the **ISR (Independent Sales Rep)** role.
* Create the **Agent Unlock Only** role.
* Both roles must be based on the existing **Agent** role.

---

### 2. Restrict Permissions for the ISR Role

Users with the ISR role **must not** be able to:

* Request Funding
* Lease Modification
* Send to Servicing
* Approval Overrides or Changes

---

### 3. Role Permissions for Agent Unlock Only

* The role must include **only** the permissions required to perform user unlock actions.
* No additional permissions beyond what is strictly required should be granted.
* The role must **not** be assigned to all agents.
* It must be assignable **only** to selected users.

---

## Testing Steps

---

### 1. Validate Creation of New Roles

#### Test Case 1.1 – Create ISR Role

**Steps**

1. Access AMS.
2. Navigate to Roles Management.
3. Create a new role named **ISR (Independent Sales Rep)**.
4. Configure the role based on the existing **Agent** role.
5. Save the role.
6. Verify the role is visible in the roles list.

**Expected Result**

* ISR role is created successfully and based on the Agent role.

---

#### Test Case 1.2 – Create Agent Unlock Only Role

**Steps**

1. Access AMS.
2. Navigate to Roles Management.
3. Create a new role named **Agent Unlock Only**.
4. Configure the role based on the existing **Agent** role.
5. Assign **only** the permissions required to unlock users.
6. Save the role.
7. Verify the role is visible in the roles list.

**Expected Result**

* Agent Unlock Only role is created successfully with only user unlock permissions.

---

### 2. Validate Permission Restrictions for ISR Role

#### Test Case 2.1 – Restrict Request Funding

**Steps**

1. Assign the ISR role to a test user.
2. Log in as the ISR user.
3. Attempt to request funding.

**Expected Result**

* The action is blocked.

---

#### Test Case 2.2 – Restrict Lease Modification

**Steps**

1. Log in as the ISR user.
2. Attempt to perform a lease modification.

**Expected Result**

* The action is blocked.

---

#### Test Case 2.3 – Restrict Send to Servicing

**Steps**

1. Log in as the ISR user.
2. Attempt to send an account to servicing.

**Expected Result**

* The action is blocked.

---

#### Test Case 2.4 – Restrict Approval Overrides or Changes

**Steps**

1. Log in as the ISR user.
2. Attempt to perform approval overrides or approval changes.

**Expected Result**

* The action is blocked.

---

### 3. Validate Permissions for Agent Unlock Only Role

#### Test Case 3.1 – Allow User Unlock Action

**Steps**

1. Assign the **Agent Unlock Only** role to a selected test user.
2. Log in as this user.
3. Attempt to unlock a locked user account.

**Expected Result**

* The user unlock action is successfully performed.

---

#### Test Case 3.2 – Restrict All Other Agent Actions

**Steps**

1. Log in as a user with the **Agent Unlock Only** role.
2. Attempt the following actions:

   * Request Funding
   * Lease Modification
   * Send to Servicing
   * Approval Overrides or Changes

**Expected Result**

* All actions are blocked except user unlock.

---

### 4. Validate Role Assignment Control

#### Test Case 4.1 – Role Not Assigned by Default

**Steps**

1. Create or identify a standard Agent user.
2. Verify assigned roles.

**Expected Result**

* Agent Unlock Only role is **not** assigned by default.

---

#### Test Case 4.2 – Assign Role Only to Selected Users

**Steps**

1. Assign Agent Unlock Only role to a specific user.
2. Leave another Agent user without this role.
3. Log in as both users.
4. Attempt to unlock a user account.

**Expected Result**

* Only the user with the Agent Unlock Only role can unlock users.
* The standard Agent cannot perform the unlock action.

---

### 5. Audit & Control Validation (Optional / Nice to Have)

#### Test Case 5.1 – Traceability

**Steps**

1. Perform a user unlock action using the Agent Unlock Only role.
2. Check system logs or audit trail.

**Expected Result**

* The unlock action is logged with:

  * User ID
  * Role
  * Timestamp


--------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | AMS | Adicionar Role ISR e Restringir Acesso a Ações Específicas

**Status:** Aberto
**Tíquete criado:** há 4 semanas por Yuri Araujo

---

## Sinopse

Adicionar o papel **ISR (Independent Sales Rep)** ao sistema e aplicar limitações de acesso para garantir que usuários com esse papel não consigam executar ações restritas.

Além disso, criar um novo papel no AMS baseado no papel existente **Agent**, chamado **Agent Unlock Only**.
Esse papel deve herdar o comportamento base do Agent, mas conter **apenas** as permissões necessárias para desbloquear usuários.

Esse papel **não deve** ser atribuído a todos os agentes, apenas a usuários selecionados, garantindo maior controle operacional.

---

## Objetivo de Negócio

Garantir que usuários ISR tenham capacidades operacionais restritas, evitando ações fora de suas responsabilidades.

Permitir que apenas agentes selecionados possam desbloquear usuários, assegurando maior controle, rastreabilidade e redução de riscos, sem concessão de permissões desnecessárias.

---

## Funcionalidades & Requisitos

### 1. Adicionar Novos Papéis

* Criar o papel **ISR (Independent Sales Rep)**.
* Criar o papel **Agent Unlock Only**.
* Ambos devem ser baseados no papel existente **Agent**.

---

### 2. Restringir Permissões do Papel ISR

Usuários com o papel ISR **não devem** conseguir:

* Solicitar Funding
* Modificar Lease
* Enviar para Servicing
* Realizar Overrides ou Alterações de Aprovação

---

### 3. Permissões do Papel Agent Unlock Only

* O papel deve conter **apenas** as permissões necessárias para desbloquear usuários.
* Nenhuma permissão adicional deve ser concedida.
* O papel **não** deve ser atribuído a todos os agentes.
* Deve ser atribuível apenas a usuários selecionados.

---

## Etapas de Teste

---

### 1. Validação da Criação de Novos Papéis

#### Caso de Teste 1.1 – Criar Papel ISR

**Passos**

1. Acessar o AMS.
2. Navegar até o Gerenciamento de Papéis.
3. Criar um novo papel chamado **ISR (Independent Sales Rep)**.
4. Configurar o papel com base no papel **Agent**.
5. Salvar o papel.
6. Verificar se o papel aparece na lista.

**Resultado Esperado**

* O papel ISR é criado com sucesso e baseado no papel Agent.

---

#### Caso de Teste 1.2 – Criar Papel Agent Unlock Only

**Passos**

1. Acessar o AMS.
2. Navegar até o Gerenciamento de Papéis.
3. Criar um novo papel chamado **Agent Unlock Only**.
4. Configurar o papel com base no papel **Agent**.
5. Atribuir apenas as permissões necessárias para desbloqueio de usuários.
6. Salvar o papel.
7. Verificar se o papel aparece na lista.

**Resultado Esperado**

* O papel Agent Unlock Only é criado com sucesso contendo apenas permissões de desbloqueio.

---

### 2. Validação das Restrições do Papel ISR

#### Caso de Teste 2.1 – Restringir Request Funding

**Passos**

1. Atribuir o papel ISR a um usuário de teste.
2. Logar como esse usuário.
3. Tentar solicitar funding.

**Resultado Esperado**

* A ação é bloqueada.

---

#### Caso de Teste 2.2 – Restringir Lease Modification

**Passos**

1. Logar como usuário ISR.
2. Tentar modificar um lease.

**Resultado Esperado**

* A ação é bloqueada.

---

#### Caso de Teste 2.3 – Restringir Send to Servicing

**Passos**

1. Logar como usuário ISR.
2. Tentar enviar uma conta para servicing.

**Resultado Esperado**

* A ação é bloqueada.

---

#### Caso de Teste 2.4 – Restringir Approval Overrides ou Changes

**Passos**

1. Logar como usuário ISR.
2. Tentar realizar override ou alteração de aprovação.

**Resultado Esperado**

* A ação é bloqueada.

---

### 3. Validação das Permissões do Papel Agent Unlock Only

#### Caso de Teste 3.1 – Permitir Desbloqueio de Usuário

**Passos**

1. Atribuir o papel Agent Unlock Only a um usuário específico.
2. Logar como esse usuário.
3. Tentar desbloquear um usuário bloqueado.

**Resultado Esperado**

* O desbloqueio é realizado com sucesso.

---

#### Caso de Teste 3.2 – Restringir Outras Ações de Agente

**Passos**

1. Logar como usuário com papel Agent Unlock Only.
2. Tentar executar:

   * Request Funding
   * Lease Modification
   * Send to Servicing
   * Approval Overrides ou Changes

**Resultado Esperado**

* Todas as ações são bloqueadas, exceto o desbloqueio de usuário.

---

### 4. Validação de Controle de Atribuição de Papel

#### Caso de Teste 4.1 – Papel Não Atribuído por Padrão

**Passos**

1. Criar ou identificar um usuário Agent padrão.
2. Verificar os papéis atribuídos.

**Resultado Esperado**

* O papel Agent Unlock Only não está atribuído por padrão.

---

#### Caso de Teste 4.2 – Atribuir Papel Apenas a Usuários Selecionados

**Passos**

1. Atribuir o papel Agent Unlock Only a um usuário específico.
2. Manter outro usuário Agent sem esse papel.
3. Logar com ambos.
4. Tentar desbloquear um usuário.

**Resultado Esperado**

* Apenas o usuário com Agent Unlock Only consegue desbloquear usuários.
* O Agent padrão não consegue executar a ação.

---

### 5. Validação de Auditoria & Controle (Opcional)

#### Caso de Teste 5.1 – Rastreabilidade

**Passos**

1. Executar um desbloqueio de usuário com o papel Agent Unlock Only.
2. Verificar logs ou trilha de auditoria do sistema.

**Resultado Esperado**

* O desbloqueio é registrado com:

  * ID do usuário
  * Papel
  * Timestamp

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 2 arquivos
+
158
−
0
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/ams‎

enume
‎ration‎

RoleNa
‎me.java‎
+2 -0

envir
‎onment‎

Uown
‎.java‎
+156 -0

 src/main/java/com/uownleasing/ams/enumeration/RoleName.java 
+
2
−
0

Visualizado
@@ -9,6 +9,8 @@ public enum RoleName {
    MANAGER("manager"),
    SUPERVISOR("supervisor"),
    AGENT("agent"),
    ISR("isr"),
    AGENT_UNLOCK("agent_unlock"),
    AUDITOR("auditor"),
    MERCHANT("merchant");

 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
156
−
0

Visualizado
@@ -495,6 +495,45 @@ public class Uown extends EnvironmentService {
                    ),
                    "", true),

                new DefaultRole(RoleName.ISR, "Read-only AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing only
                        "user_list", "user_read",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing only
                        "permission_list",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.AGENT_UNLOCK, "Unlock users with read-only AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User unlock permission
                        "user_unlock",
                        // User read-only permissions
                        "user_list", "user_read",
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read",
                        // Role read-only permissions
                        "role_list", "role_read",
                        "role_permissions_read",
                        // Permission read-only permissions
                        "permission_list", "permission_read",
                        // Group read-only permissions
                        "group_list", "group_read",
                        "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.AUDITOR, "No AMS access", null,
                    List.of(),
                    "", true)
@@ -764,6 +803,55 @@ public class Uown extends EnvironmentService {
                ),
                    null, "", true),

                new DefaultRole(RoleName.ISR, "", List.of(
                    "ssn [partial]",
                    "dob [partial]",

                    "ssn [edit]",
                    "dob [edit]",

                    "account_number [partial]",

                    "customer_information [access]",
                    "customer_information [modify]",
                    "change account status [modify]",
                    "customer bankruptcy [modify]",
                    "customer verification [modify]",
                    "change_payment_frequency [modify]",
                    "applicant [edit]",
                    "applicant contact [edit]",
                    "applicant employment contact [edit]",
                    "applicant bank account [edit]", "applicant cc info [edit]",
                    "applicant financial [edit]",
                    "confirm customer review",
                    "verify customer information",
                    "get accounts by criteria",

                    "documents [access]",

                    "payment [access]",
                    "make ach payment [add]",
                    "make credit card payment [add]",
                    "payment make_check_payment [modify]",

                    "scheduled_payments [access]",
                    "create_or_update_receivable [modify]",
                    "move_due_date [modify]",

                    "payment_transaction [access]",

                    "ach_history [access]",

                    "credit_card_history [access]",
                    "email_history [access]",
                    "items_history [access]",
                    "payment_history, [access]",
                    "phone_history [access]",

                    "view charge fee"
                ),
                    null, "", true),

                new DefaultRole(RoleName.AUDITOR, "", List.of(
                    "ssn [mask]",
                    "dob [mask]",
@@ -1304,6 +1392,74 @@ public class Uown extends EnvironmentService {
                ),
                    null, "", true),

                new DefaultRole(RoleName.ISR, "", List.of(
                    "servicing redirect [view]",
                    "ssn [partial]",
                    "dob [partial]",

                    "account_number [partial]",

                    "notes internal [add]", "notes internal [view]",

                    "overview [access]",
                    "overview get_leads [modify]",
                    "overview lease [view]",
                    "overview inventoryCost [view]",
                    "overview platformFee [view]",
                    "overview uuid [view]",
                    "overview csv [modify]",
                    "overview internal status filter",
                    "overview max approval amount",

                    "customers [access]",
                    // "customers [modify]",
                    "customer_bankruptcy [modify]",
                    "change_merchant [modify]",
                    "applicant [edit]",
                    "applicant contact [edit]",
                    "applicant employment contact [edit]",
                    "applicant bank account [edit]", "applicant cc info [edit]",
                    "applicant financial [edit]",
                    // "move to servicing [edit]",
                    // "resend_lease [modify]",
                    // "customers modify_lease [modify]",

                    "documents [access]",
                    "upload_file_for_lead [modify]",
                    "delete_file [modify]",

                    // "funding [access]",
                    // "funding [edit]",
                    // "funding csv [modify]",

                    "calculator [access]",
                    "calculator [modify]",

                    "alerts [access]",
                    "completeApplication [access]",
                    "completeEsign [access]",
                    "appComplete [access]",

                    "customers invoice [modify]",
                    "customers item [modify]",
                    "customers invoice information [modify]",
                    "customers send_finalize_email [modify]",
                    "newApplication [access]",
                    "newApplication send_application_to_customer [modify]",
                    // "customers change_lead_status [modify]",
                    "create or update notes",

                    "overview get_merchant_by_ref_code [modify]",
                    "overview get_basic_merchant_info_by_ref_code [modify]",
                    "overview merchant_location [modify]",
                    "newApplication get_merchant_by_ref_code [modify]",
                    "newApplication get_basic_merchant_info_by_ref_code [modify]",
                    "newApplication get_application_requests [modify]",

                    "invoice [access]"
                ),
                    null, "", true),

                new DefaultRole(RoleName.MERCHANT, "", List.of(
                    "ssn [mask]",
                    "dob [mask]",

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

### Feature: Access control and permissions for Independent Sales Rep and Agent Unlock Only in AMS

```gherkin

  Scenario: Assign Independent Sales Rep role to a user
    Given there is a user without the "Independent Sales Rep" role
    When the administrator assigns the "Independent Sales Rep" role to the user
    Then the role is successfully assigned
    And an audit log is generated for the user's role assignment

```

![Screenshot_at_Jan_07_05-08-27](/uploads/ae71d56051e815c1e8832d1d2ab7a891/Screenshot_at_Jan_07_05-08-27.png){width=743 height=600}

![Screenshot_at_Jan_07_05-09-38](/uploads/1f20544d2f8214504576755a18b1090c/Screenshot_at_Jan_07_05-09-38.png){width=900 height=455}

![Screenshot_at_Jan_07_05-09-58](/uploads/cd6cb2447a15fcb3f015aa3437d018ad/Screenshot_at_Jan_07_05-09-58.png){width=900 height=459}

![Screenshot_at_Jan_07_05-14-22](/uploads/725aa5ac1d7549e64d37fb0f6386e570/Screenshot_at_Jan_07_05-14-22.png){width=687 height=103}

**| PASS |**

---

```gherkin

  Scenario: Remove Independent Sales Rep role from a user
    Given there is a user with the "Independent Sales Rep" role
    When the administrator removes the "Independent Sales Rep" role from the user
    Then the role is successfully removed
    And an audit log is generated for the user's role removal

```

![Screenshot_at_Jan_07_05-12-07](/uploads/06d4363ffdeb843dec18a98d93008a39/Screenshot_at_Jan_07_05-12-07.png){width=900 height=460}

![Screenshot_at_Jan_07_05-15-50](/uploads/0a0864993024f99245e03b6f995c1620/Screenshot_at_Jan_07_05-15-50.png){width=736 height=48}

**| PASS |**

---

```gherkin

  Scenario: Edit permissions directly assigned to a user
    Given there is a user with assigned permissions
    When the administrator updates the user's permissions
    Then the user's permissions are updated
    And an audit log is generated for the permission changes

```

![Screenshot_at_Jan_07_05-18-57](/uploads/a26beb5f84fe769fb88f7ef49598b112/Screenshot_at_Jan_07_05-18-57.png){width=811 height=50}

**| PASS |**

---

```gherkin

  Scenario Outline: User with a valid role accesses AMS
    Given there is a user with the "<role>" role
    When the user accesses the AMS portal
    Then access is allowed

    Examples:
      | role                  |
      | Independent Sales Rep |
      | Agent Unlock Only     |

```

**| PASS |**

---

```gherkin

  Scenario Outline: ISR user is blocked from operational actions
    Given there is a user with the "Independent Sales Rep" role
    When the user attempts to perform the action "<action>"
    Then the action is blocked

    Examples:
      | action                         |
      | request funding                |
      | modify lease                   |
      | send account to servicing      |
      | perform approval override      |
      | change approval                |
      | unlock user                    |

```
![image](/uploads/b763e6b5c3e5d54e1e216a28d656fdd4/image.png){width=900 height=450}

**| PASS |**

---

```gherkin

  Scenario: Agent Unlock Only user unlocks a locked user
    Given there is a user with the "Agent Unlock Only" role
    And the target user is locked
    When the user performs the unlock action on the target user
    Then the user is successfully unlocked
    And an audit log is generated for the unlock action

```
![Screenshot_at_Jan_07_05-39-23](/uploads/e21b11db233f59e7609a590829c343f8/Screenshot_at_Jan_07_05-39-23.png){width=739 height=600}

![Screenshot_at_Jan_07_05-41-02](/uploads/f0092fc6cd57a09d9abe226531af0c5d/Screenshot_at_Jan_07_05-41-02.png){width=900 height=466}

![Screenshot_at_Jan_07_05-42-47](/uploads/5852e481297671710a2e72f4cefc4630/Screenshot_at_Jan_07_05-42-47.png){width=900 height=493}

**| PASS |**

---

```gherkin

  Scenario Outline: Agent Unlock Only is blocked from actions other than unlock
    Given there is a user with the "Agent Unlock Only" role
    When the user attempts to perform the action "<action>"
    Then the action is blocked

    Examples:
      | action                         |
      | request funding                |
      | modify lease                   |
      | send account to servicing      |
      | perform approval override      |
      | change approval                |

```
![Screenshot_at_Jan_07_05-53-31](/uploads/6201e10be911bbf4cb9b1bb3b7d33019/Screenshot_at_Jan_07_05-53-31.png){width=900 height=446}

**| PASS |**

---

```gherkin

  Scenario: Standard Agent user does not have Agent Unlock Only by default
    Given there is a user with the "Agent" role
    When the user checks their roles
    Then the "Agent Unlock Only" role is not assigned

```

**| PASS |**

---

```gherkin

  Scenario: Only Agent Unlock Only users can unlock users
    Given there is a user with the "Agent" role
    And there is another user with the "Agent Unlock Only" role
    And the target user is locked
    When the Agent user attempts to unlock the target user
    Then the action is blocked
    When the Agent Unlock Only user performs the unlock
    Then the target user is successfully unlocked

```

![Screenshot_at_Jan_07_05-55-17](/uploads/be183d98276f61951aa51657566b5534/Screenshot_at_Jan_07_05-55-17.png){width=736 height=600}

**| PASS |**

---


--------------------------------------------------------------------------------------------------------------------------------------------------------



## Tests in stg

### Feature: Access control and permissions for Independent Sales Rep and Agent Unlock Only in AMS

```gherkin

  Scenario: Assign Independent Sales Rep role to a user
    Given there is a user without the "Independent Sales Rep" role
    When the administrator assigns the "Independent Sales Rep" role to the user
    Then the role is successfully assigned
    And an audit log is generated for the user's role assignment

```



**| PASS |**

---

```gherkin

  Scenario: Remove Independent Sales Rep role from a user
    Given there is a user with the "Independent Sales Rep" role
    When the administrator removes the "Independent Sales Rep" role from the user
    Then the role is successfully removed
    And an audit log is generated for the user's role removal

```



**| PASS |**

---

```gherkin

  Scenario: Edit permissions directly assigned to a user
    Given there is a user with assigned permissions
    When the administrator updates the user's permissions
    Then the user's permissions are updated
    And an audit log is generated for the permission changes

```


**| PASS |**

---

```gherkin

  Scenario Outline: User with a valid role accesses AMS
    Given there is a user with the "<role>" role
    When the user accesses the AMS portal
    Then access is allowed

    Examples:
      | role                  |
      | Independent Sales Rep |
      | Agent Unlock Only     |

```

**| PASS |**

---

```gherkin

  Scenario Outline: ISR user is blocked from operational actions
    Given there is a user with the "Independent Sales Rep" role
    When the user attempts to perform the action "<action>"
    Then the action is blocked

    Examples:
      | action                         |
      | request funding                |
      | modify lease                   |
      | send account to servicing      |
      | perform approval override      |
      | change approval                |
      | unlock user                    |

```

**| PASS |**

---

```gherkin

  Scenario: Agent Unlock Only user unlocks a locked user
    Given there is a user with the "Agent Unlock Only" role
    And the target user is locked
    When the user performs the unlock action on the target user
    Then the user is successfully unlocked
    And an audit log is generated for the unlock action

```


**| PASS |**

---

```gherkin

  Scenario Outline: Agent Unlock Only is blocked from actions other than unlock
    Given there is a user with the "Agent Unlock Only" role
    When the user attempts to perform the action "<action>"
    Then the action is blocked

    Examples:
      | action                         |
      | request funding                |
      | modify lease                   |
      | send account to servicing      |
      | perform approval override      |
      | change approval                |

```

**| PASS |**

---

```gherkin

  Scenario: Standard Agent user does not have Agent Unlock Only by default
    Given there is a user with the "Agent" role
    When the user checks their roles
    Then the "Agent Unlock Only" role is not assigned

```

**| PASS |**

---

```gherkin

  Scenario: Only Agent Unlock Only users can unlock users
    Given there is a user with the "Agent" role
    And there is another user with the "Agent Unlock Only" role
    And the target user is locked
    When the Agent user attempts to unlock the target user
    Then the action is blocked
    When the Agent Unlock Only user performs the unlock
    Then the target user is successfully unlocked

```


**| PASS |**

---