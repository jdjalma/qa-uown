----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/8


UOWN | AMS | Refactor AMS Subsystem for Enhanced Permission Control


Synopsis
Currently, the AMS subsystem controls only basic CRUD (Create, Read, Update, Delete) operations. This approach provides unrestricted access to system actions, resulting in dependency on CRUD usage, reduced control over specific operations, and redundancy of permissions across the Origination and Servicing subsystems.


Business Objective
The goal of this refactor is to improve permission management and security by eliminating the dependency on CRUD operations and centralizing access control within the AMS subsystem itself. This will streamline permission handling, reduce redundancy, and ensure better alignment of user roles and responsibilities across portals.


Features and Requirements
Remove dependency on generic CRUD operations for access control within the AMS subsystem.
Implement permissions that specifically manage actions and access inside the AMS portal.
Reorganize existing permissions into logical, common groups for better maintainability.
Remove unused or redundant permissions to simplify and optimize the permission model.
Ensure that Origination and Servicing no longer rely on duplicated CRUD permissions.


Testing Steps
Overview
After applying the new ams-auth role assignments, the entire AMS application must be tested to ensure that all access controls, permissions, and visual behaviors remain correct.
The primary change is that resources previously governed by wildcard permissions are now controlled by specific ams-auth subsystem permissions.

Test Scope

Subsystems affected: ams-auth and all AMS pages using role-based access.
Key areas: Users, Groups, Roles, Merchants.
Test users: Include at least one user per major role (Admin, Manager, Merchant, Read-Only, etc.).
Environment: Staging or QA environment with migrated roles.


Step 1 — General Access Verification
Log in as different users representing each role type.

Confirm that each user:
Can log in successfully.
Sees only the menu items and sections appropriate to their assigned permissions.
Experiences no authentication errors or access-denied messages when navigating legitimate sections.


Step 2 — Page-Level Access Tests
Users Page
    Verify that the page loads correctly and displays the expected data.
    Test the following actions:
        * Unlock User:
        * Clone User:
        * Add User:


Step 3 — Granular Permission Testing
Verify that previously broad edit panel permissions are now granular:
* edit_username_panel
* edit_merchant_panel
* edit_user_group_panel
* edit_password_panel
* edit_user_permission_panel
* edit_role_permission_panel
* edit_user_panel


Step 4 — UI & Visual Behavior Validation
Confirm that the unauthenticated (login) page renders correctly:
    The previous blue overlay no longer appears.
    The background should now display a clean white appearance.
Test login, logout, and error scenarios to ensure consistent theming and no residual overlay artifacts.

Expected Result
![alt text](image.png)

---

Aqui está o texto **em português**, totalmente revisado, mais claro e organizado, mantendo 100% do conteúdo original:

---

# **UOWN | AMS | Refatoração do Subsistema AMS para Aperfeiçoar o Controle de Permissões**

## **Sinopse**

Atualmente, o subsistema AMS controla apenas operações básicas de CRUD (Create, Read, Update, Delete). Essa abordagem concede acesso irrestrito às ações do sistema, criando dependência excessiva do modelo CRUD, reduzindo o controle sobre ações específicas e causando redundância de permissões entre os subsistemas Origination e Servicing.

---

## **Objetivo de Negócio**

O objetivo desta refatoração é melhorar o gerenciamento de permissões e a segurança eliminando a dependência de operações CRUD genéricas e centralizando o controle de acesso exclusivamente dentro do subsistema AMS.
Com isso, será possível:

* Tornar o controle de permissões mais preciso e seguro.
* Reduzir redundâncias entre portais.
* Simplificar o modelo de permissões.
* Garantir melhor alinhamento entre funções, papéis e responsabilidades dos usuários.

---

## **Requisitos e Funcionalidades**

* Remover a dependência de permissões CRUD genéricas do AMS.
* Implementar permissões específicas para ações realizadas dentro do portal AMS.
* Reorganizar permissões existentes em grupos lógicos e comuns, melhorando a manutenção.
* Remover permissões redundantes ou não utilizadas, enxugando o modelo de permissões.
* Garantir que Origination e Servicing deixem de depender de permissões CRUD duplicadas.

---

## **Passos para Teste**

### **Visão Geral**

Após aplicar as novas permissões do subsistema **ams-auth**, todo o aplicativo AMS deve ser testado para garantir que os controles de acesso, permissões e comportamentos visuais estejam funcionando corretamente.

A principal mudança é que recursos antes governados por permissões wildcard agora são controlados por permissões específicas do AMS.

---

## **Escopo dos Testes**

**Subsistemas afetados:** ams-auth e todas as páginas AMS que utilizam controle baseado em papéis.
**Áreas principais:** Usuários, Grupos, Papéis (Roles), Merchants.
**Usuários de teste:** Pelo menos um usuário por tipo de papel (Admin, Manager, Merchant, Read-Only, etc.).
**Ambiente:** Staging ou QA com roles já migrados.

---

## **Step 1 — Verificação Geral de Acesso**

Faça login com diferentes usuários representando cada tipo de papel.

Confirme que cada usuário:

* Consegue fazer login com sucesso.
* Visualiza apenas os itens de menu e seções permitidas por suas permissões.
* Não encontra erros de autenticação ou “access denied” ao acessar páginas legítimas.

---

## **Step 2 — Testes de Acesso em Nível de Página**

### **Página de Usuários**

Verifique se a página:

* Carrega corretamente.
* Exibe os dados esperados.

Teste as seguintes ações:

* **Unlock User**
* **Clone User**
* **Add User**

---

## **Step 3 — Testes de Permissões Granulares**

Confirme que as permissões antes amplas agora estão separadas de forma granular:

* `edit_username_panel`
* `edit_merchant_panel`
* `edit_user_group_panel`
* `edit_password_panel`
* `edit_user_permission_panel`
* `edit_role_permission_panel`
* `edit_user_panel`

---

## **Step 4 — Validação de UI & Comportamento Visual**

Certifique-se de que a página de login (não autenticada):

* Renderiza corretamente.
* Não exibe mais o overlay azul anterior.
* Exibe agora um fundo limpo e totalmente branco.

Teste:

* Login
* Logout
* Cenários de erro

Garantindo:

* Consistência visual
* Ausência de artefatos antigos
* Fluidez na experiência do usuário

### **Resultado Esperado**

![alt text](image.png)



-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Migration:

Migration Plan — Add ams-auth Roles to Existing Accounts (Match origination Permissions)

Step 1 — Evaluate current user roles

SELECT 
    u.pk AS user_pk,
    u.user_name,
    u.email_address,
    COUNT(DISTINCT CASE WHEN ss_orig.name = 'origination' THEN r_orig.pk END) AS origination_role_count,
    COUNT(DISTINCT CASE WHEN ss_auth.name = 'ams-auth' THEN r_auth.pk END) AS ams_auth_role_count,
    STRING_AGG(DISTINCT CASE WHEN ss_orig.name = 'origination' THEN r_orig.name END, ', ') AS origination_roles,
    STRING_AGG(DISTINCT CASE WHEN ss_auth.name = 'ams-auth' THEN r_auth.name END, ', ') AS ams_auth_roles
FROM "user" u
LEFT JOIN user_roles ur_orig ON ur_orig.user_pk = u.pk
LEFT JOIN role r_orig ON ur_orig.role_pk = r_orig.pk AND ur_orig.role_system_id = r_orig.sub_system_pk
LEFT JOIN sub_system ss_orig ON r_orig.sub_system_pk = ss_orig.pk AND ss_orig.name = 'origination'
LEFT JOIN user_roles ur_auth ON ur_auth.user_pk = u.pk
LEFT JOIN role r_auth ON ur_auth.role_pk = r_auth.pk AND ur_auth.role_system_id = r_auth.sub_system_pk
LEFT JOIN sub_system ss_auth ON r_auth.sub_system_pk = ss_auth.pk AND ss_auth.name = 'ams-auth'
WHERE EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role r ON ur.role_pk = r.pk AND ur.role_system_id = r.sub_system_pk
    JOIN sub_system ss ON r.sub_system_pk = ss.pk
    WHERE ur.user_pk = u.pk AND ss.name = 'origination'
)
GROUP BY u.pk, u.user_name, u.email_address
ORDER BY u.user_name;



Step 2 — Insert matching ams-auth roles

INSERT INTO user_roles (user_pk, role_system_id, role_pk)
SELECT DISTINCT
    u.pk AS user_pk,
    ss_auth.pk AS role_system_id,
    r_auth.pk AS role_pk
FROM "user" u
-- Get user's origination roles
INNER JOIN user_roles ur_orig ON ur_orig.user_pk = u.pk
INNER JOIN role r_orig ON ur_orig.role_pk = r_orig.pk 
    AND ur_orig.role_system_id = r_orig.sub_system_pk
INNER JOIN sub_system ss_orig ON r_orig.sub_system_pk = ss_orig.pk 
    AND ss_orig.name = 'origination'
-- Find matching role in ams-auth by name
INNER JOIN role r_auth ON r_auth.name = r_orig.name
INNER JOIN sub_system ss_auth ON r_auth.sub_system_pk = ss_auth.pk 
    AND ss_auth.name = 'ams-auth'
-- Ensure user doesn't already have any ams-auth roles (skip if they do)
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_roles ur_existing
    JOIN role r_existing ON ur_existing.role_pk = r_existing.pk 
        AND ur_existing.role_system_id = r_existing.sub_system_pk
    JOIN sub_system ss_existing ON r_existing.sub_system_pk = ss_existing.pk
    WHERE ur_existing.user_pk = u.pk 
        AND ss_existing.name = 'ams-auth'
)
-- Ensure this specific role assignment doesn't already exist
AND NOT EXISTS (
    SELECT 1 
    FROM user_roles ur_check
    WHERE ur_check.user_pk = u.pk
        AND ur_check.role_system_id = ss_auth.pk
        AND ur_check.role_pk = r_auth.pk
)
ON CONFLICT DO NOTHING;



Step 3 — Detect origination roles with no ams-auth counterpart (merchant)

SELECT DISTINCT
    r_orig.name AS origination_role_name,
    COUNT(DISTINCT ur_orig.user_pk) AS users_with_this_role,
    STRING_AGG(DISTINCT u.user_name, ', ' ORDER BY u.user_name) AS affected_users
FROM role r_orig
INNER JOIN sub_system ss_orig ON r_orig.sub_system_pk = ss_orig.pk 
    AND ss_orig.name = 'origination'
INNER JOIN user_roles ur_orig ON ur_orig.role_pk = r_orig.pk 
    AND ur_orig.role_system_id = r_orig.sub_system_pk
INNER JOIN "user" u ON ur_orig.user_pk = u.pk
WHERE NOT EXISTS (
    SELECT 1 
    FROM role r_auth
    INNER JOIN sub_system ss_auth ON r_auth.sub_system_pk = ss_auth.pk 
        AND ss_auth.name = 'ams-auth'
    WHERE r_auth.name = r_orig.name
)
GROUP BY r_orig.name
ORDER BY r_orig.name;

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


 23 arquivos
+
1190
−
173
Arquivos
23
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/ams‎

aop/l
‎ogging‎

LoggingAs
‎pect.java‎
+2 -2

con
‎fig‎

WebSecurityCon
‎figuration.java‎
+58 -2

db/rep
‎ository‎

UserRepos
‎itory.java‎
+1 -1

enume
‎ration‎

PathExpansio
‎nKeyword.java‎
+1 -1

envir
‎onment‎

MeritLi
‎fe.java‎
+97 -19

SuttonP
‎ark.java‎
+146 -0

Uown
‎.java‎
+398 -40

ser
‎vice‎

Authorizatio
‎nService.java‎
+7 -1

PermissionGra
‎phBuilder.java‎
+6 -4

PermissionS
‎ervice.java‎
+12 -4

UserServ
‎ice.java‎
+4 -8

w
‎eb‎

re
‎st‎

PermissionCo
‎ntroller.java‎
+3 -3

 src/main/java/com/uownleasing/ams/enumeration/PathExpansionKeyword.java 
+
1
−
1

Visualizado
package com.uownleasing.ams.enumeration;

public enum PathExpansionKeyword {
    USER, ROLE
    USER, ROLE, GROUP
}
 src/main/java/com/uownleasing/ams/environment/MeritLife.java 
+
97
−
19

Visualizado
@@ -32,17 +32,65 @@ public class MeritLife extends EnvironmentService {
    protected Map<SystemName, String[][]> getPermissions() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new String[][] {
                {"get_all", "GET", "/**", "Allows read on all resources", "Read Entities"},
                {"put_all", "PUT", "/**", "Allows update on all resources", "Update Entities"},
                {"post_all", "POST", "/**", "Allows add on all resources", "Add Entities"},
                {"delete_all", "DELETE", "/**", "Allows delete on all resource", "Delete entities"},
                // User Management Permissions
                {"user_list", "GET", "/user", "View list of users", "List Users"},
                {"user_read", "GET", "/user/*", "View user details", "Read User"},
                {"user_create", "POST", "/user", "Create user", "Create User"},
                {"user_update", "PUT", "/user/*", "Update user", "Update User"},
                {"user_delete", "DELETE", "/user/*", "Delete user", "Delete User"},
                {"user_roles_modify", "PUT", "/user/*/role", "Modify user roles", "Modify User Roles"},
                {"user_permissions_modify", "PUT", "/user/*/permission", "Modify user permissions", "Modify User Permissions"},
                {"user_group_modify", "PUT", "/user/*/group", "Modify user group", "Modify User Group"},
                {"user_permissions_read", "GET", "/user/*/permission", "View user permissions", "Read User Permissions"},
                {"user_roles_read", "GET", "/user/*/role", "View user roles", "Read User Roles"},
                {"user_group_read", "GET", "/user/*/group", "View user groups", "Read User Groups"},
                {"user_logs_read", "GET", "/user/getLogs/*", "View user logs", "Read User Logs"},
                {"user_logs_by_type_read", "GET", "/user/getLogsByType/*", "View user logs by type", "Read User Logs By Type"},
                {"user_logs_search_read", "GET", "/user/searchLogs/*", "Search user logs", "Search User Logs"},

                {"ams", "access", "ams", "Allows access to ams portal", ""},
                // User Management Permissions - Panel-Specific Permissions
                {"edit_user_panel", "restricted/modify", "edit_user_panel", "Edit user information panel", "Edit User Panel"},
                {"edit_password_panel", "restricted/modify", "edit_password_panel", "Edit password panel", "Edit Password Panel"},
                {"edit_role_permission_panel", "restricted/modify", "edit_role_permission_panel", "Edit role and permission panel", "Edit Role Permission Panel"},
                {"edit_user_permission_panel", "restricted/modify", "edit_user_permission_panel", "Edit user permission panel", "Edit User Permission Panel"},
                {"edit_merchant_panel", "restricted/modify", "edit_merchant_panel", "Edit merchant panel", "Edit Merchant Panel"},
                {"edit_user_group_panel", "restricted/modify", "edit_user_group_panel", "Edit user group panel", "Edit User Group Panel"},
                {"edit_username_panel", "restricted/modify", "edit_username_panel", "Edit username panel", "Edit Username Panel"},
                {"user_unlock", "restricted/modify", "user_unlock", "Unlock user", "Unlock User"},

                // Role Management Permissions
                {"role_list", "GET", "/role", "View list of roles", "List Roles"},
                {"role_read", "GET", "/role/*", "View role details", "Read Role"},
                {"role_create", "POST", "/role", "Create role", "Create Role"},
                {"role_update", "PUT", "/role/*", "Update role", "Update Role"},
                {"role_delete", "DELETE", "/role/*", "Delete role", "Delete Role"},
                {"role_permissions_modify", "PUT", "/role/*/permission", "Modify role permissions", "Modify Role Permissions"},
                {"role_permissions_read", "GET", "/role/*/permission", "View role permissions", "Read Role Permissions"},

                // Permission Management Permissions
                {"permission_list", "GET", "/permission", "View list of permissions", "List Permissions"},
                {"permission_read", "GET", "/permission/*", "View permission details", "Read Permission"},
                {"permission_create", "POST", "/permission", "Create permission", "Create Permission"},
                {"permission_update", "PUT", "/permission/*", "Update permission", "Update Permission"},
                {"permission_delete", "DELETE", "/permission/*", "Delete permission", "Delete Permission"},

                // Group Management Permissions
                {"group_list", "GET", "/group", "View list of groups", "List Groups"},
                {"group_read", "GET", "/group/*", "View group details", "Read Group"},
                {"group_create", "POST", "/group", "Create group", "Create Group"},
                {"group_update", "PUT", "/group/*", "Update group", "Update Group"},
                {"group_delete", "DELETE", "/group/*", "Delete group", "Delete Group"},
                {"group_users_read", "GET", "/group/*/getUsers", "View users in group", "Read Group Users"},
                {"group_all_with_users_read", "GET", "/group/getAllGroupsWithUsers", "View all groups with users", "Read All Groups With Users"},

                // Authorization Check Permission
                {"auth_check", "POST", "/authorization/check/*", "Check user authorization", "Check Authorization"},

                // MeritLife-specific Permissions
                {"ams_portal_access", "access", "ams_portal_access", "Access to AMS portal", "AMS Portal Access"},
                {"dms", "access", "dms", "Allows access to dms portal", ""},
                {"review queue [modify]", "modify", "dms/create_or_update_review_queue", "", ""},
                {"upload correspondence", "modify", "dms/upload_correspondence", "", ""},

                {"logs", "access", "logs", "Allows access to logs", ""}
            })
        );
@@ -51,23 +99,53 @@ public class MeritLife extends EnvironmentService {
    protected Map<SystemName, DefaultRole[]> getRoles() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new DefaultRole[] {
                new DefaultRole(RoleName.ADMIN, "",
                new DefaultRole(RoleName.ADMIN, "Full AMS access",
                    null,
                    List.of("get_all", "put_all", "post_all", "delete_all",
                        "ams",

                        "dms",
                        "review queue [modify]",
                        "upload correspondence",
                    List.of(
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // All role management permissions
                        "role_list", "role_read", "role_create", "role_update", "role_delete", "role_permissions_modify",
                        // All permission management permissions
                        "permission_list", "permission_read", "permission_create", "permission_update", "permission_delete",
                        // All group management permissions
                        "group_list", "group_read", "group_create", "group_update", "group_delete",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check",
                        // MeritLife-specific permissions
                        "ams_portal_access", "dms", "review queue [modify]", "upload correspondence", "logs"
                    ), "", true),

                        "logs"), "", true),
                new DefaultRole(RoleName.MANAGER, "",
                new DefaultRole(RoleName.MANAGER, "User and role management",
                    null,
                    List.of(
                        "dms",
                        "review queue [modify]",
                        "upload correspondence"
                        ), "", true)
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // Role management (no delete)
                        "role_list", "role_read", "role_create", "role_update",
                        // Permission viewing only
                        "permission_list",
                        // Group management
                        "group_list", "group_read", "group_create", "group_update",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // MeritLife-specific permissions
                        "ams_portal_access", "dms", "review queue [modify]", "upload correspondence"
                    ), "", true)
            })
        );
    }
 src/main/java/com/uownleasing/ams/environment/SuttonPark.java 
+
146
−
0

Visualizado
@@ -27,6 +27,62 @@ public class SuttonPark extends EnvironmentService {
    protected Map<SystemName, String[][]> getPermissions() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new String[][] {
                // User Management Permissions
                {"user_list", "GET", "/user", "View list of users", "List Users"},
                {"user_read", "GET", "/user/*", "View user details", "Read User"},
                {"user_create", "POST", "/user", "Create user", "Create User"},
                {"user_update", "PUT", "/user/*", "Update user", "Update User"},
                {"user_delete", "DELETE", "/user/*", "Delete user", "Delete User"},
                {"user_roles_modify", "PUT", "/user/*/role", "Modify user roles", "Modify User Roles"},
                {"user_permissions_modify", "PUT", "/user/*/permission", "Modify user permissions", "Modify User Permissions"},
                {"user_group_modify", "PUT", "/user/*/group", "Modify user group", "Modify User Group"},
                {"user_permissions_read", "GET", "/user/*/permission", "View user permissions", "Read User Permissions"},
                {"user_roles_read", "GET", "/user/*/role", "View user roles", "Read User Roles"},
                {"user_group_read", "GET", "/user/*/group", "View user groups", "Read User Groups"},
                {"user_logs_read", "GET", "/user/getLogs/*", "View user logs", "Read User Logs"},
                {"user_logs_by_type_read", "GET", "/user/getLogsByType/*", "View user logs by type", "Read User Logs By Type"},
                {"user_logs_search_read", "GET", "/user/searchLogs/*", "Search user logs", "Search User Logs"},

                // User Management Permissions - Panel-Specific Permissions
                {"edit_user_panel", "restricted/modify", "edit_user_panel", "Edit user information panel", "Edit User Panel"},
                {"edit_password_panel", "restricted/modify", "edit_password_panel", "Edit password panel", "Edit Password Panel"},
                {"edit_role_permission_panel", "restricted/modify", "edit_role_permission_panel", "Edit role and permission panel", "Edit Role Permission Panel"},
                {"edit_user_permission_panel", "restricted/modify", "edit_user_permission_panel", "Edit user permission panel", "Edit User Permission Panel"},
                {"edit_merchant_panel", "restricted/modify", "edit_merchant_panel", "Edit merchant panel", "Edit Merchant Panel"},
                {"edit_user_group_panel", "restricted/modify", "edit_user_group_panel", "Edit user group panel", "Edit User Group Panel"},
                {"edit_username_panel", "restricted/modify", "edit_username_panel", "Edit username panel", "Edit Username Panel"},
                {"user_unlock", "restricted/modify", "user_unlock", "Unlock user", "Unlock User"},

                // Role Management Permissions
                {"role_list", "GET", "/role", "View list of roles", "List Roles"},
                {"role_read", "GET", "/role/*", "View role details", "Read Role"},
                {"role_create", "POST", "/role", "Create role", "Create Role"},
                {"role_update", "PUT", "/role/*", "Update role", "Update Role"},
                {"role_delete", "DELETE", "/role/*", "Delete role", "Delete Role"},
                {"role_permissions_modify", "PUT", "/role/*/permission", "Modify role permissions", "Modify Role Permissions"},
                {"role_permissions_read", "GET", "/role/*/permission", "View role permissions", "Read Role Permissions"},

                // Permission Management Permissions
                {"permission_list", "GET", "/permission", "View list of permissions", "List Permissions"},
                {"permission_read", "GET", "/permission/*", "View permission details", "Read Permission"},
                {"permission_create", "POST", "/permission", "Create permission", "Create Permission"},
                {"permission_update", "PUT", "/permission/*", "Update permission", "Update Permission"},
                {"permission_delete", "DELETE", "/permission/*", "Delete permission", "Delete Permission"},

                // Group Management Permissions
                {"group_list", "GET", "/group", "View list of groups", "List Groups"},
                {"group_read", "GET", "/group/*", "View group details", "Read Group"},
                {"group_create", "POST", "/group", "Create group", "Create Group"},
                {"group_update", "PUT", "/group/*", "Update group", "Update Group"},
                {"group_delete", "DELETE", "/group/*", "Delete group", "Delete Group"},
                {"group_users_read", "GET", "/group/*/getUsers", "View users in group", "Read Group Users"},
                {"group_all_with_users_read", "GET", "/group/getAllGroupsWithUsers", "View all groups with users", "Read All Groups With Users"},

                // Authorization Check Permission
                {"auth_check", "POST", "/authorization/check/*", "Check user authorization", "Check Authorization"},

                // AMS Portal Access Permission
                {"ams_portal_access", "access", "ams_portal_access", "Access to AMS portal", "AMS Portal Access"}
            }),

            Map.entry(SystemName.ORIGINATION, new String[][] {
@@ -42,6 +98,96 @@ public class SuttonPark extends EnvironmentService {

    protected Map<SystemName, DefaultRole[]> getRoles() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new DefaultRole[]{
                new DefaultRole(RoleName.ADMIN, "Full AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // All role management permissions
                        "role_list", "role_read", "role_create", "role_update", "role_delete", "role_permissions_modify",
                        // All permission management permissions
                        "permission_list", "permission_read", "permission_create", "permission_update", "permission_delete",
                        // All group management permissions
                        "group_list", "group_read", "group_create", "group_update", "group_delete",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.MANAGER, "User and role management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // Role management (no delete)
                        "role_list", "role_read", "role_create", "role_update",
                        // Permission viewing only
                        "permission_list",
                        // Group management
                        "group_list", "group_read", "group_create", "group_update",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.SUPERVISOR, "Limited user management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing and unlock only
                        "user_list", "user_read", "user_unlock",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing
                        "permission_list", "permission_read",
                        // Group viewing only
                        "group_list", "group_read",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.AGENT, "Read-only AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing only
                        "user_list", "user_read",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing only
                        "permission_list",
                        // Newly added read endpoints (read-only)
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.AUDITOR, "No AMS access", null,
                    List.of(),
                    "", true)
            }),

            Map.entry(SystemName.ORIGINATION, new DefaultRole[] {
                new DefaultRole(RoleName.ADMIN, "",
                    null,
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
398
−
40

Visualizado
Arquivos com grandes alterações são recolhidos por padrão.

 src/main/java/com/uownleasing/ams/service/AuthorizationService.java 
+
7
−
1

Visualizado
@@ -18,6 +18,7 @@ import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@@ -52,7 +53,12 @@ public class AuthorizationService {

        PermissionGraph graph = permissionDetails.getPermissionGraph();

        PermissionGraphNode node = graph.findNodeByPath(target).orElseThrow(() -> new AccessDeniedException(String.format("No permission node found for the target resource %s", target)));
        Optional<PermissionGraphNode> nodeOpt = graph.findNodeByPath(target);
        if (nodeOpt.isEmpty()) {
            LOG.warn("[AuthorizationService][canAccessOrElseThrow] No permission node found for target: method={}, path={}", action, target);
            throw new AccessDeniedException(String.format("No permission node found for the target resource %s", target));
        }
        PermissionGraphNode node = nodeOpt.get();

        // deny permissions take higher precedence
        if(node.hasDeniedAction(action)) {
 src/main/java/com/uownleasing/ams/service/PermissionGraphBuilder.java 
+
6
−
4

Visualizado
@@ -86,11 +86,11 @@ public class PermissionGraphBuilder {

        PathExpansionKeyword expansionKeyword = null;
        try {
            expansionKeyword = PathExpansionKeyword.valueOf(keyword);
            expansionKeyword = PathExpansionKeyword.valueOf(keyword.toUpperCase());
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            LOG.warn("Path expansion syntax detected but not a valid keyword: {}. Treating as normal component name...", keyword);
            return List.of(keyword);
            // Unknown placeholders like {name} should expand to wildcard (*) to match any value
            LOG.warn("Path expansion keyword '{}' not found in enum. Expanding to wildcard (*) for generic matching.", keyword);
            return List.of("*");
        }

        switch (expansionKeyword) {
@@ -98,6 +98,8 @@ public class PermissionGraphBuilder {
                return List.of(user.getUserName());
            case ROLE:
                return user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
            case GROUP:
                return List.of("*");
            default:
                //can this even happen?
                return List.of(keyword);
 src/main/java/com/uownleasing/ams/service/PermissionService.java 
+
12
−
4

Visualizado
@@ -6,11 +6,14 @@ import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.SubSystem;
import com.uownleasing.ams.db.repository.PermissionRepository;
import com.uownleasing.ams.error.exception.NotFoundException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@@ -18,6 +21,8 @@ import java.util.Optional;
@Transactional
public class PermissionService extends RequestContextAwareService{

    private static final Logger LOG = LogManager.getLogger(PermissionService.class);

    @Autowired
    PermissionRepository permissionRepository;

@@ -26,14 +31,17 @@ public class PermissionService extends RequestContextAwareService{

    public List<Permission> getAllPermissions() {
        SubSystem subSystem = getCurrentContextSubSystem();
        if(subSystem.isAMS()) {
            return permissionRepository.findAll();
        } else {
            return permissionRepository.findAllBySubSystem(subSystem);
        if (subSystem == null) {
            LOG.error("[PermissionService][getAllPermissions] SubSystem is null, cannot retrieve permissions");
            return Collections.emptyList();
        }
        return permissionRepository.findAllBySubSystem(subSystem);
    }

    public List<Permission> getAllPermissionsBySubSystem(SubSystem subSystem) {
        if (subSystem == null) {
            return Collections.emptyList();
        }
        return permissionRepository.findAllBySubSystem(subSystem);
    }

 src/main/java/com/uownleasing/ams/service/UserService.java 
+
4
−
8

Visualizado
@@ -228,11 +228,7 @@ public class UserService extends RequestContextAwareService{
            SubSystem ams = subSystemService.getSubSystemByName("ams-auth").orElseThrow(() -> new NotFoundException("Subsystem not found"));

            List<Permission> amsPerms = List.of(
                permissionService.getPermissionByNameAndSubSystem("get_all", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")),
                permissionService.getPermissionByNameAndSubSystem("put_all", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")),
                permissionService.getPermissionByNameAndSubSystem("post_all", ams)
                permissionService.getPermissionByNameAndSubSystem("ams_portal_access", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")));

            if (addPerm) {
@@ -259,7 +255,7 @@ public class UserService extends RequestContextAwareService{

        for (String permissionName: permissionNames) {
            Permission permission = permissionService.getPermissionByNameAndSubSystem(permissionName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Permission not found"));
                .orElseThrow(() -> new NotFoundException("Permission not found"));

            user.getIncludePermissions().add(permission);
            //remove exclusion if exist
@@ -277,7 +273,7 @@ public class UserService extends RequestContextAwareService{

        for(String permName: permissionNames) {
            Permission permission = permissionService.getPermissionByNameAndSubSystem(permName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Permission not found"));
                .orElseThrow(() -> new NotFoundException("Permission not found"));

            user.getExcludePermissions().add(permission);
            //remove inclusion if exist
@@ -331,7 +327,7 @@ public class UserService extends RequestContextAwareService{
        SubSystem subSystem = getCurrentContextSubSystem();
        for(String roleName: roleNames) {
            Role role = roleService.getRoleByNameAndSubSystem(roleName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Role not found"));
                .orElseThrow(() -> new NotFoundException("Role not found"));
            user.getRoles().remove(role);
        }
        userLogService.createUserLog(LogType.ROLE, user.getPk(), "REMOVED roles " + String.join(", ", roleNames));
 src/main/java/com/uownleasing/ams/web/rest/PermissionController.java 
+
3
−
3

Visualizado
@@ -39,11 +39,11 @@ public class PermissionController {
    @Secured("NONE")
    @PostMapping
    public ResponseEntity<Permission> createPermission(@RequestBody Permission permission) {
       if (permissionService.getPermissionByName(permission.getName()).isPresent()) {
        if (permissionService.getPermissionByName(permission.getName()).isPresent()) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
       Permission newPermission = permissionService.createPermission(permission);
       return ResponseEntity.ok(newPermission);
        Permission newPermission = permissionService.createPermission(permission);
        return ResponseEntity.ok(newPermission);
    }

    @Secured("NONE")
 src/main/java/com/uownleasing/ams/web/rest/UserController.java 
+
1
−
0

Visualizado
@@ -306,6 +306,7 @@ public class UserController {
        return userLogService.searchUserLog(userPk, logType, search, page, max);
    }

    @Secured("NONE")
    @GetMapping("/{username}/group")
    public UserGroup getGroupForUser(@PathVariable String username) {
        return userService.getUserGroup(username);
 src/main/java/com/uownleasing/ams/web/security/AuthorizationAccessDecisionManager.java 
+
44
−
4

Visualizado
@@ -36,12 +36,35 @@ public class AuthorizationAccessDecisionManager implements AccessDecisionManager
        Method function = ( (MethodInvocation) object).getMethod();

        if(!isRestMappingMethod(function)) {
            LOG.warn("Method security annotation used on a non REST mapping method");
            LOG.warn("[AuthorizationAccessDecisionManager][decide] Method security annotation used on a non REST mapping method");
            Thread.dumpStack();
        }

        HttpServletRequest request = ( (ServletRequestAttributes) Objects.requireNonNull( RequestContextHolder.getRequestAttributes() ) ).getRequest();
        authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI());
        String requestURI = request.getRequestURI();
        String requestMethod = request.getMethod();
        String contextPath = request.getContextPath();
        String servletPath = request.getServletPath();
        
        LOG.debug("[AuthorizationAccessDecisionManager][decide] Checking authorization: method={}, URI={}, contextPath='{}', servletPath='{}', function={}", 
                requestMethod, requestURI, contextPath, servletPath, function.getName());

        for (ConfigAttribute securityAttribute : configAttributes) {
            String attribute = securityAttribute.getAttribute();
            if (attribute.equals("NONE")) {
                LOG.debug("[AuthorizationAccessDecisionManager][decide] @Secured(\"NONE\") found, skipping authorization checks for: method={}, URI={}", requestMethod, requestURI);
                return;
            }
        }

        try {
            authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), requestMethod, requestURI);
            LOG.debug("[AuthorizationAccessDecisionManager][decide] Path authorization passed: method={}, URI={}", requestMethod, requestURI);
        } catch (AccessDeniedException e) {
            LOG.error("[AuthorizationAccessDecisionManager][decide] Access denied: method={}, URI={}, error={}", 
                    requestMethod, requestURI, e.getMessage());
            throw e;
        }

        // Perform additional non-path checks configurable by Secured annotation
        checkSecurityAttr(configAttributes, function, ((MethodInvocation) object).getArguments(), authentication, request);
@@ -146,13 +169,30 @@ public class AuthorizationAccessDecisionManager implements AccessDecisionManager
            if (checkType == SecurityArgCheckType.KEYS) {
                // Authorize for each key present in the object
                Set<String> argKeys = ((LinkedHashMap<String, Object>) item).keySet();
                LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking KEYS authorization, {} keys to check", argKeys.size());
                for (String key : argKeys) {
                    authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI() + itemPath + "/" + key);
                    String fullPath = request.getRequestURI() + itemPath + "/" + key;
                    LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking key: {}, fullPath={}", key, fullPath);
                    try {
                        authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), fullPath);
                    } catch (AccessDeniedException e) {
                        LOG.error("[AuthorizationAccessDecisionManager][checkArgOrRecur] Access denied for key: {}, path={}, error={}", 
                                key, fullPath, e.getMessage());
                        throw e;
                    }
                }

            } else if (checkType == SecurityArgCheckType.VALUES) {
                // Authorize using this specific value
                authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI() + itemPath + "/" + item.toString());
                String fullPath = request.getRequestURI() + itemPath + "/" + item.toString();
                LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking VALUES authorization, value={}, fullPath={}", item.toString(), fullPath);
                try {
                    authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), fullPath);
                } catch (AccessDeniedException e) {
                    LOG.error("[AuthorizationAccessDecisionManager][checkArgOrRecur] Access denied for value: {}, path={}, error={}", 
                            item.toString(), fullPath, e.getMessage());
                    throw e;
                }
            }
        }
    }
 src/main/java/com/uownleasing/ams/web/security/HeaderBasedSecurityContextRepository.java 
+
6
−
3

Visualizado
@@ -51,19 +51,22 @@ public class HeaderBasedSecurityContextRepository implements SecurityContextRepo

        String subSystemName = requestResponseHolder.getRequest().getHeader("sub-system");
        if(subSystemName == null || subSystemName.isEmpty()) {
            log.error("Sub system header empty.");
            log.error("[SecurityContext] Missing 'sub-system' header for {} {} - rejecting as unauthorized context.",
                requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }

        Optional<SubSystem> subSystem = subSystemService.getSubSystemByName(subSystemName);
        if(subSystem.isEmpty()) {
            log.error("Sub system not found with name: {}", subSystemName);
            log.error("[SecurityContext] Unknown sub-system '{}' for {} {} - rejecting context.",
                subSystemName, requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }

        String username = requestResponseHolder.getRequest().getHeader("username");
        if(username == null || username.isEmpty()) {
            log.error("Username header empty");
            log.error("[SecurityContext] Missing 'username' header for {} {} - rejecting context.",
                requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }
 src/main/java/com/uownleasing/ams/web/security/LoginHandler.java 
+
21
−
3

Visualizado
@@ -21,8 +21,11 @@ import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

@@ -56,13 +59,28 @@ public class LoginHandler implements AuthenticationSuccessHandler, Authenticatio

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        HttpStatus status;
        if(DisabledException.class.isAssignableFrom(exception.getClass())) {
            response.setStatus(HttpStatus.I_AM_A_TEAPOT.value());
            status = HttpStatus.I_AM_A_TEAPOT;
        } else if(LockedException.class.isAssignableFrom(exception.getClass())) {
            response.setStatus(HttpStatus.LOCKED.value());
            status = HttpStatus.LOCKED;
        } else {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            status = HttpStatus.UNAUTHORIZED;
        }
        
        response.setStatus(status.value());
        response.setContentType("application/json");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", exception.getMessage());
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("exception", exception.getClass().getName());
        
        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }

    private String getLoginSuccessResponseBody(UserAuthenticationToken userAuth) throws JsonProcessingException {
 src/main/java/com/uownleasing/ams/web/security/UserAuthenticationProvider.java 
+
1
−
1

Visualizado
@@ -54,7 +54,7 @@ public class UserAuthenticationProvider implements AuthenticationProvider {
            throw new DisabledException("Account disabled");
        }

        // login doesnt need authorities as request terminates after authentication success/failure
        // login doesn't need authorities as request terminates after authentication success/failure
        UserAuthenticationToken authToken = new UserAuthenticationToken(user, null);
//        authToken.setLoginToken(loginInfo.getFirst());

 src/main/resources/images/diagrams/environment-structure.png  0 → 100644
+125,55 KiB (+Infinity%)

Visualizado
Arquivo suprimido por uma entrada .gitattributes, a codificação do arquivo não é compatível ou o tamanho do arquivo excede o limite.
 src/main/resources/images/diagrams/permission-resolution-flow.png  0 → 100644
+178,72 KiB (+Infinity%)

Visualizado
Arquivo suprimido por uma entrada .gitattributes, a codificação do arquivo não é compatível ou o tamanho do arquivo excede o limite.
 src/main/resources/images/diagrams/subsystem-structure.png  0 → 100644
+150,00 KiB (+Infinity%)

Visualizado
Arquivo suprimido por uma entrada .gitattributes, a codificação do arquivo não é compatível ou o tamanho do arquivo excede o limite.
 src/main/resources/images/diagrams/system-hierarchy.png  0 → 100644
+159,73 KiB (+Infinity%)

Visualizado
Arquivo suprimido por uma entrada .gitattributes, a codificação do arquivo não é compatível ou o tamanho do arquivo excede o limite.
 src/main/resources/images/diagrams/user-permission-structure.png  0 → 100644
+195,94 KiB (+Infinity%)

Visualizado
Arquivo suprimido por uma entrada .gitattributes, a codificação do arquivo não é compatível ou o tamanho do arquivo excede o limite.
 README.md 
+
382
−
77

Visualizado
# AMS

# AMS (Access Management System)

This project uses Nexus as the repository manager. To ensure you are downloading the dependencies provide your nexus credentials in [gradle.properties](gradle.properties)

@@ -10,126 +9,432 @@ repoPassword=yourpassword
...
```

# AMS TERMS
- ENVIRONMENT
- SUB-SYSTEM
- GROUP
- PERMISSION
- ROLE
- USER
## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AMS Terms](#ams-terms)
3. [AMS-Auth Sub-System](#ams-auth-sub-system)
4. [Database Schema](#database-schema)
5. [Permission Resolution Flow](#permission-resolution-flow)
6. [Migration from Wildcard to Granular Permissions](#migration-from-wildcard-to-granular-permissions)

---

## Architecture Overview

AMS (Access Management System) is an authorization and authentication system that manages user access across multiple sub-systems within an environment. The system has been recently refactored to support granular permissions within the `ams-auth` environment, moving away from wildcard-based permission models.

### System Hierarchy

![System Hierarchy](src/main/resources/images/diagrams/system-hierarchy.png)

### Key Architectural Concepts

- **Multi-Environment Support**: Each environment (UOWN, MERIT, etc.) can have its own configuration
- **Sub-System Isolation**: Permissions and roles are scoped to sub-systems, allowing independent management
- **Granular Permission Model**: Permissions are defined with specific actions and target resources, replacing wildcard patterns
- **Dynamic Permission Graph**: Permissions are resolved at runtime and built into a hierarchical graph structure

---

## AMS Terms

### ENVIRONMENT

[Environments](src/main/java/com/uownleasing/ams/environment) are the names of the projects that use AMS such as [UOWN](src/main/java/com/uownleasing/ams/environment/Uown.java) and [MERIT](src/main/java/com/uownleasing/ams/environment/MeritLife.java)

Environments will hold the info to initialize sub-systems, permissions, roles, groups, and users
Environments hold the information to initialize sub-systems, permissions, roles, groups, and users. Each environment is configured through an `EnvironmentService` implementation that defines:

- Available sub-systems
- Permissions for each sub-system
- Default roles and their permission assignments
- Default users and their role assignments

![Environment.png](src%2Fmain%2Fresources%2Fimages%2FEnvironment.png)
![Environment Structure](src/main/resources/images/diagrams/environment-structure.png)

### SUB-SYSTEM

[Sub-systems](src/main/java/com/uownleasing/ams/db/entity/SubSystem.java) are the different sections or systems within an environment. With UOWN, it contains origination, servicing, and ams-auth
[Sub-systems](src/main/java/com/uownleasing/ams/db/entity/SubSystem.java) are the different sections or systems within an environment. With UOWN, it contains `origination`, `servicing`, and `ams-auth`.

Roles and permissions can be separated by sub-system. For example, UOWN has sub-systems origination and servicing. Both of these sub-systems can have a role called manager that are independent of one another. These roles can also have different permissions that are created for their respective sub-systems
Roles and permissions can be separated by sub-system. For example, UOWN has sub-systems origination and servicing. Both of these sub-systems can have a role called `manager` that are independent of one another. These roles can also have different permissions that are created for their respective sub-systems.

![Sub-system.png](src%2Fmain%2Fresources%2Fimages%2FSub-system.png)
**Key Points:**
- Each sub-system maintains its own namespace for roles and permissions
- A role named "ADMIN" in `origination` is different from "ADMIN" in `servicing`
- The `ams-auth` sub-system is special: it manages permissions for the AMS portal itself

![Subsystem Structure](src/main/resources/images/diagrams/subsystem-structure.png)

### GROUP
[Groups](src/main/java/com/uownleasing/ams/db/entity/UserGroup.java) are just ways to associate users with one another. This feature is mainly used to modify different permissions or other info for multiple users within a group

[Groups](src/main/java/com/uownleasing/ams/db/entity/UserGroup.java) are ways to associate users with one another. This feature is mainly used to modify different permissions or other info for multiple users within a group.

Groups provide a mechanism for bulk user management and permission assignment, though the current implementation primarily uses direct user-role assignments.

### PERMISSION
[Permissions](src/main/java/com/uownleasing/ams/db/entity/Permission.java) are used to allow certain roles or users to access different functions in a system such as accessing a page or making a request

In code, permissions are in the below format:
```
{PERMISSION_NAME, ACTION, TARGET, DESCRIPTION, DISPLAY_NAME(deprecated)}
```
- PERMISSION_NAME: the name displayed on the FE side of AMS
- ACTION: what type of permission (access, modify, restricted, or whatever you want). It can be separated into parts using "/"
- TARGET: the pathing of the permission. It can be split into parts using "/" 
- DESCRIPTION: other information on the permission
[Permissions](src/main/java/com/uownleasing/ams/db/entity/Permission.java) are used to allow certain roles or users to access different functions in a system such as accessing a page or making a request.

#### Permission Format

Examples of coded permissions:
In code, permissions are defined in the following format:
```
{"access application info", "access", "application", "access to application information", ""} //ex1
{"update customer info", "modify", "customer/update_info", "able to update customer information", ""} //ex2
{"update docs", "restricted/modify", "documents/update_doc", "able to update information in documents", ""} //ex3
{"update program", "restricted/modify", "update_program", "able to update program information", ""} //ex4
{"access test info", "restricted/view/full", "test_info", "able to see all testing information", ""} //ex5
{PERMISSION_NAME, ACTION, TARGET_RESOURCE, DESCRIPTION, DISPLAY_NAME(deprecated)}
```

FE will ask to add permissions to AMS. These requests to add permissions are essentially paths in the permission graph (more info below) returned to FE. Request examples can be seen below:
```
Please add the following permission to origination:
- **PERMISSION_NAME**: Unique identifier for the permission, displayed on the FE side of AMS
- **ACTION**: HTTP method or action type (GET, POST, PUT, DELETE, "access", "modify", "restricted", etc.). Can be separated into parts using "/"
- **TARGET_RESOURCE**: The pathing of the permission resource. Can be split into parts using "/" to create hierarchical paths
- **DESCRIPTION**: Human-readable description of what the permission allows
- **DISPLAY_NAME**: (Deprecated) Previously used for display purposes

access > customer > modify > update_info //update customer info permission
#### Permission Examples

access > application //access application info permission
```
```java
// Example 1: Simple access permission
{"access application info", "access", "application", "access to application information", ""}

// Example 2: Nested resource with action
{"update customer info", "modify", "customer/update_info", "able to update customer information", ""}

// Example 3: Complex action and target path
{"update docs", "restricted/modify", "documents/update_doc", "able to update information in documents", ""}

// Example 4: Alternative root node (restricted)
{"update program", "restricted/modify", "update_program", "able to update program information", ""}

When FE requests a role's or user's permissions, AMS provides a permission graph. The graph contains the different permission paths for FE to parse and use.
Here's an example using the coded permissions above:
// Example 5: Multi-level action path
{"access test info", "restricted/view/full", "test_info", "able to see all testing information", ""}
```

#### Permission Graph Structure

When the frontend requests a role's or user's permissions, AMS provides a permission graph. The graph contains different permission paths for the frontend to parse and use.

**Example Permission Graph:**
```json
{
    access: {
        application: true,
        customer: {
            modify: {
                update_info: true
    "access": {
        "application": true,
        "customer": {
            "modify": {
                "update_info": true
            }
        },
        documents: {
            restricted: {
                modify: {
                    update_doc: true
        "documents": {
            "restricted": {
                "modify": {
                    "update_doc": true
                }
            }
        }
    },
    restricted: {
        modify: {
            update_program: true
    "restricted": {
        "modify": {
            "update_program": true
        },
        view: {
            full: {
                test_info: true
        "view": {
            "full": {
                "test_info": true
            }
        }
    } 
    }
}
```

**How the Permission Graph is Built:**

How the permission graph is built:
- all permissions will default to the **access** node
- to be under another node (like **restricted**), the action must start with node name and only have one part in its target (no "/") (_**access test info**_)
- permissions with only one part for its target will only create a child node named as the target (_**access application info**_)
- permissions with multiple target parts will create nodes as such: target_part1 > action > target_part2 > target_part3 > etc. (_**update customer info**_)
- permissions with multiple target and action parts will create nodes as such: target_part1 > action_part1 > action_part2 > target_part2 > target_part3 > etc. (_**update docs**_)
The permission graph building algorithm (implemented in [PermissionGraphBuilder](src/main/java/com/uownleasing/ams/service/PermissionGraphBuilder.java)) follows these rules:

1. **Default Root Node**: All permissions default to the `access` node unless specified otherwise
2. **Alternative Root Nodes**: To create a permission under another root node (like `restricted`), the action must start with that node name and the target must have only one part (no "/")
   - Example: `{"access test info", "restricted/view/full", "test_info", ...}` creates a node under `restricted`
3. **Simple Target Paths**: Permissions with only one part in their target create a child node named as the target
   - Example: `{"access application info", "access", "application", ...}` creates `access.application`
4. **Nested Target Paths**: Permissions with multiple target parts create nodes as: `target_part1 > action > target_part2 > target_part3 > etc.`
   - Example: `{"update customer info", "modify", "customer/update_info", ...}` creates `access.customer.modify.update_info`
5. **Complex Action and Target Paths**: Permissions with multiple action and target parts create nodes as: `target_part1 > action_part1 > action_part2 > target_part2 > target_part3 > etc.`
   - Example: `{"update docs", "restricted/modify", "documents/update_doc", ...}` creates `access.documents.restricted.modify.update_doc`

#### Path Expansion Keywords

The permission system supports dynamic path expansion using placeholders:

- `{USER}`: Expands to the current authenticated user's username
- `{ROLE}`: Expands to all role names assigned to the user
- `{GROUP}`: Expands to wildcard `*` for group-based matching

Example: A permission with target `/user/{USER}` for user "john.doe" creates a path `/user/john.doe`.

#### Wildcard Support

The permission graph supports wildcard matching:

- `*`: Matches any single path component at the current depth
- `**`: Matches all path components at the current depth and deeper

Wildcard paths have lower precedence than specific paths, allowing specific paths to act as exception rules.

### Role
[Roles](src/main/java/com/uownleasing/ams/db/entity/Role.java) are used to associate different access levels and permissions for users

[Roles](src/main/java/com/uownleasing/ams/db/entity/Role.java) are used to associate different access levels and permissions for users.

**Key Characteristics:**
- Different permissions can be assigned to each role
- Any permission that is assigned to a role is also applied to the user assigned that role
- A user can have multiple roles
- Roles have permissions, excluded permissions, and manually set permissions
  - **permissions**: permissions assigned within code. These can be removed either by using services or removing the line of code for the association
  - **excluded**: permissions removed from the role by a user
  - **manually set**: permissions manually added onto the role. These permissions are not removed when removing the line of code for the association and can only be removed using a service
- Any permission assigned to a role is also applied to users assigned that role
- A user can have multiple roles across different sub-systems
- Roles are scoped to a specific sub-system (unique constraint on `name` + `sub_system_pk`)

**Role Permission Types:**

Roles have three types of permission associations:

![Role Permission.png](src%2Fmain%2Fresources%2Fimages%2FRole%20Permission.png)
1. **Standard Permissions** (`permissions`): Permissions assigned within code during environment initialization. These can be removed either by using services or removing the line of code for the association.
2. **Excluded Permissions** (`excludedPermissions`): Permissions explicitly removed from the role by an administrator. These override standard permissions.
3. **Manually Set Permissions** (`manuallySetPermissions`): Permissions manually added to the role through the UI or API. These permissions are NOT removed when removing the code association and can only be removed using a service.

### User
[Users](src/main/java/com/uownleasing/ams/db/entity/User.java) hold different forms of info associated with anyone accessing the environment or project
- **Personal Info**: info such as name, email, and phone number
- **Credentials**: username and password. A user can login using either their set username or email address
- **Group**
- **Roles**
- **Included permissions**: permissions that were manually assigned to the user. These permissions are added onto the already assigned permissions of a role. These permissions stay associated with the user even if the user's role(s) no longer has the permission
- **Excluded permissions**: permissions that were manually removed from the user. Even if an assigned role has the permission, the user will not have permissions in this list

![User Permission.png](src%2Fmain%2Fresources%2Fimages%2FUser%20Permission.png)

[Users](src/main/java/com/uownleasing/ams/db/entity/User.java) hold different forms of information associated with anyone accessing the environment or project.

**User Attributes:**
- **Personal Info**: Name, email, phone number
- **Credentials**: Username and password. A user can login using either their username or email address
- **Group**: Optional association with a UserGroup
- **Roles**: Multiple roles can be assigned across different sub-systems
- **Included Permissions**: Permissions manually assigned directly to the user. These are added onto the permissions from roles and persist even if the user's role(s) no longer has the permission
- **Excluded Permissions**: Permissions explicitly removed from the user. Even if an assigned role has the permission, the user will not have permissions in this list

**Permission Resolution Priority:**

When resolving a user's effective permissions, the system applies them in this order:
1. Collect all permissions from all assigned roles
2. Add user's included permissions
3. Remove user's excluded permissions
4. Remove role's excluded permissions (applied per role)
5. Build permission graph from final permission set

![User Permission Structure](src/main/resources/images/diagrams/user-permission-structure.png)

---

## AMS-Auth Sub-System

The `ams-auth` sub-system is a special sub-system that manages permissions for the AMS portal itself. This sub-system was refactored to support granular permissions, moving away from wildcard-based access control.

### Purpose

The `ams-auth` sub-system serves as the authorization layer for:
- User management operations (CRUD on users)
- Role management operations (CRUD on roles)
- Permission management operations (CRUD on permissions)
- Group management operations (CRUD on groups)
- Authorization checks and permission queries

### Key Features

1. **Granular Permission Control**: Each AMS operation has a specific permission (e.g., `user_list`, `user_create`, `role_update`)
2. **Portal Access Control**: The `ams_portal_access` permission controls access to the AMS portal itself
3. **Panel-Level Permissions**: Fine-grained permissions for specific UI panels (e.g., `edit_user_panel`, `edit_password_panel`)

### AMS Permission Categories

Permissions in `ams-auth` are organized into categories:

#### User Management Permissions
- `user_list`, `user_read`, `user_create`, `user_update`, `user_delete`
- `user_roles_modify`, `user_permissions_modify`, `user_group_modify`
- `user_permissions_read`, `user_roles_read`, `user_group_read`
- `user_logs_read`, `user_logs_by_type_read`, `user_logs_search_read`
- `user_unlock`

#### Role Management Permissions
- `role_list`, `role_read`, `role_create`, `role_update`, `role_delete`
- `role_permissions_modify`, `role_permissions_read`

#### Permission Management Permissions
- `permission_list`, `permission_read`, `permission_create`, `permission_update`, `permission_delete`

#### Group Management Permissions
- `group_list`, `group_read`, `group_create`, `group_update`, `group_delete`
- `group_users_read`, `group_all_with_users_read`

#### Panel-Specific Permissions
- `edit_user_panel`, `edit_password_panel`, `edit_role_permission_panel`
- `edit_user_permission_panel`, `edit_merchant_panel`, `edit_user_group_panel`, `edit_username_panel`

#### Authorization Permissions
- `auth_check`: Permission to check authorization for other users
- `ams_portal_access`: Required to access the AMS portal

### Example: Role with AMS Permissions

```java
// In Uown.java environment configuration
new DefaultRole(RoleName.ADMIN, "Full AMS access", null,
    List.of(
        // AMS Portal Access
        "ams_portal_access",
        // All user management permissions
        "user_list", "user_read", "user_create", "user_update", "user_delete",
        // ... more permissions
    ),
    "", true)
```

This role is created in the `ams-auth` sub-system and can be assigned to users who need to manage the AMS portal.

---

## Database Schema

The AMS database schema consists of core entities and their relationships. The following Entity Relationship Diagram illustrates the structure:

### Entity Descriptions

#### SubSystem
- **Primary Key**: `pk` (bigint)
- **Unique Constraint**: `name` (unique)
- **Purpose**: Represents a sub-system within an environment (e.g., "origination", "servicing", "ams-auth")

#### Role
- **Primary Key**: `pk` (bigint)
- **Unique Constraint**: `(name, sub_system_pk)` - ensures role names are unique within a sub-system
- **Foreign Key**: `sub_system_pk` → `SubSystem.pk`
- **Purpose**: Represents a role within a sub-system
- **Relationships**:
  - Many-to-Many with `Permission` via `role_permissions`
  - Many-to-Many with `Permission` via `role_exclude_permissions`
  - Many-to-Many with `Permission` via `role_manually_set_permissions`

#### Permission
- **Primary Key**: `pk` (bigint)
- **Foreign Key**: `sub_system_pk` → `SubSystem.pk`
- **Purpose**: Represents a permission that can be granted or denied
- **Key Fields**:
  - `action`: HTTP method or action type (GET, POST, "access", "modify", etc.)
  - `targetResource`: Resource path (e.g., "/user", "/user/*", "customer/update_info")
  - `denyAction`: Boolean flag to indicate if this is a deny permission

#### User
- **Primary Key**: `pk` (bigint)
- **Unique Constraints**: `userName` (unique), `emailAddress` (unique)
- **Foreign Key**: `group_pk` → `UserGroup.pk` (optional)
- **Purpose**: Represents a user in the system
- **Relationships**:
  - Many-to-Many with `Role` via `user_roles`
  - Many-to-Many with `Permission` via `user_include_permissions`
  - Many-to-Many with `Permission` via `user_exclude_permissions`
  - Many-to-One with `UserGroup`

#### UserGroup
- **Primary Key**: `pk` (bigint)
- **Purpose**: Groups users together for bulk management
- **Relationships**: One-to-Many with `User`

### Join Tables

All many-to-many relationships use composite primary keys that include both the entity primary keys and sub-system foreign keys. This ensures proper scoping and allows roles to have permissions from different sub-systems.

**Key Join Tables:**
- `role_permissions`: Standard role-permission assignments
- `role_exclude_permissions`: Permissions explicitly excluded from roles
- `role_manually_set_permissions`: Permissions manually added to roles (persist across code changes)
- `user_roles`: User-role assignments (includes sub-system context)
- `user_include_permissions`: Permissions directly granted to users
- `user_exclude_permissions`: Permissions explicitly denied to users

---

## Permission Resolution Flow

The permission resolution process determines what permissions a user effectively has. This process combines permissions from multiple sources and applies exclusion rules.

### Resolution Algorithm

![Permission Resolution Flow](src/main/resources/images/diagrams/permission-resolution-flow.png)

### Step-by-Step Process

1. **Collect Role Permissions**
   - Iterate through all roles assigned to the user
   - For each role, collect all permissions from:
     - Standard permissions (`role_permissions`)
     - Manually set permissions (`role_manually_set_permissions`)
   - Exclude permissions in `role_exclude_permissions`

2. **Filter by Sub-System** (if querying for specific sub-system)
   - Filter collected permissions to only include those belonging to the target sub-system

3. **Apply User-Level Overrides**
   - Add all permissions from `user_include_permissions`
   - Remove all permissions from `user_exclude_permissions`

4. **Build Permission Graph**
   - Use `PermissionGraphBuilder.buildGraph()` to construct the hierarchical graph
   - For each permission:
     - Parse `targetResource` into path components
     - Expand placeholders (`{USER}`, `{ROLE}`, `{GROUP}`)
     - Create nodes in the graph structure
     - Apply `action` to the final node(s)

5. **Apply Wildcard Rules**
   - When checking permissions, wildcards (`*`, `**`) are matched with lower precedence than specific paths
   - Specific paths can act as exceptions to wildcard rules

### Implementation

The permission resolution is implemented in:
- `AuthorizationService.getUserPermissions(User, SubSystem)`: Gets permissions for a specific sub-system
- `AuthorizationService.getUserAMSPermissions(User)`: Gets AMS permissions specifically
- `AuthorizationService.getPermissionDetails(User)`: Gets full permission details including graph
- `PermissionGraphBuilder.buildGraph(User, Set<Permission>)`: Builds the permission graph structure

### Example Resolution

Consider a user with:
- Role: `ADMIN` (origination) with permissions: `["customers [access]", "customers [modify]"]`
- Role: `ADMIN` (ams-auth) with permissions: `["user_list", "user_read", "ams_portal_access"]`
- User included permissions: `["customers [edit]"]`
- User excluded permissions: `["customers [modify]"]`

**Resolution for origination sub-system:**
1. Collect from roles: `["customers [access]", "customers [modify]"]`
2. Filter to origination: `["customers [access]", "customers [modify]"]`
3. Add user includes: `["customers [access]", "customers [modify]", "customers [edit]"]`
4. Remove user excludes: `["customers [access]", "customers [edit]"]`
5. Build graph from final set

**Resolution for ams-auth sub-system:**
1. Collect from roles: `["user_list", "user_read", "ams_portal_access"]`
2. Filter to ams-auth: `["user_list", "user_read", "ams_portal_access"]`
3. Add user includes: `["user_list", "user_read", "ams_portal_access"]` (no AMS permissions in includes)
4. Remove user excludes: `["user_list", "user_read", "ams_portal_access"]` (no AMS permissions in excludes)
5. Build graph from final set

---

## Additional Resources

### Key Classes and Services

- **Entities**:
  - [User](src/main/java/com/uownleasing/ams/db/entity/User.java)
  - [Role](src/main/java/com/uownleasing/ams/db/entity/Role.java)
  - [Permission](src/main/java/com/uownleasing/ams/db/entity/Permission.java)
  - [SubSystem](src/main/java/com/uownleasing/ams/db/entity/SubSystem.java)
  - [UserGroup](src/main/java/com/uownleasing/ams/db/entity/UserGroup.java)

- **Services**:
  - [AuthorizationService](src/main/java/com/uownleasing/ams/service/AuthorizationService.java): Permission resolution and authorization checks
  - [PermissionGraphBuilder](src/main/java/com/uownleasing/ams/service/PermissionGraphBuilder.java): Builds permission graphs
  - [EnvironmentService](src/main/java/com/uownleasing/ams/environment/EnvironmentService.java): Environment initialization
  - [RoleService](src/main/java/com/uownleasing/ams/service/RoleService.java): Role management
  - [PermissionService](src/main/java/com/uownleasing/ams/service/PermissionService.java): Permission management
  - [UserService](src/main/java/com/uownleasing/ams/service/UserService.java): User management

- **POJOs**:
  - [PermissionGraph](src/main/java/com/uownleasing/ams/pojo/PermissionGraph.java): Permission graph structure
  - [PermissionGraphNode](src/main/java/com/uownleasing/ams/pojo/PermissionGraphNode.java): Graph node implementation

---


 3 arquivos
+
234
−
80
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src
‎/ams‎

components/edit-panels/
‎user-specific/permission‎

inde
‎x.tsx‎
+225 -77

sto
‎res‎

permiss
‎ions.tsx‎
+8 -2

packag
‎e.json‎
+1 -1

 libs/common-ui/src/ams/components/edit-panels/user-specific/permission/index.tsx 
+
225
−
77

Visualizado
import classNames from 'classnames';
import { useFormik } from 'formik';
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import globals from '../../../../styles/index.module.scss';
import styles from '../../general/permissions-panel/index.module.scss';
@@ -78,6 +78,12 @@ export const EditUserPermissionPanel = (
    utilityStore?.subSystem || allSubsystems[0]
  );
  const [currentTab, setCurrentTab] = useState(allSubsystems[0]);
  // Store permissions per subsystem to maintain separate state
  const [permissionsBySubsystem, setPermissionsBySubsystem] = useState<{
    [subsystem: string]: Permission[];
  }>({});
  const [availablePermissionsBySubsystem, setAvailablePermissionsBySubsystem] =
    useState<{ [subsystem: string]: Permission[] }>({});
  const [allAvailablePermissions, setAllAvailablePermissions] =
    useState<Permission[]>(permissions);
  const [allCurrentPermissions, setAllCurrentPermissions] = useState<
@@ -90,6 +96,11 @@ export const EditUserPermissionPanel = (
    useState<Permission[]>(excludedUserPermissions || []);
  const [displayedIncludedPermissions, setDisplayedIncludedPermissions] =
    useState<Permission[]>(includedUserPermissions || []);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  
  // Refs to track state and prevent race conditions
  const prevUserPkRef = useRef<number | undefined>(undefined);
  const isTabSwitchingRef = useRef(false);

  const { userName = '' } = selectedUser;

@@ -103,7 +114,8 @@ export const EditUserPermissionPanel = (
    formik?.resetForm();
  };

  const populateData = async () => {
  const populateData = async (subsystem?: string) => {
    const currentSubsystem = subsystem || subsystemTab;
    const tempFilteredRolePermissions = filter(
      permissionsStore?.rolePermissions,
      (perm) =>
@@ -116,43 +128,123 @@ export const EditUserPermissionPanel = (
    setFilteredRolePermissions(tempFilteredRolePermissions);
    setDisplayedExcludedPermissions(excludedUserPermissions || []);
    setDisplayedIncludedPermissions(includedUserPermissions || []);
    setAllCurrentPermissions(permissionsStore?.userPermissions);
    setAvailablePermissions &&
      setAvailablePermissions(permissionsStore?.allPermissions);
    
    // Store permissions per subsystem
    if (permissionsStore?.userPermissions) {
      setPermissionsBySubsystem((prev) => ({
        ...prev,
        [currentSubsystem]: permissionsStore.userPermissions || [],
      }));
      setAllCurrentPermissions(permissionsStore.userPermissions);
    }
    
    if (permissionsStore?.allPermissions) {
      const availPerms = differenceWith(
        permissionsStore.allPermissions,
        permissionsStore.userPermissions || [],
        _isEqual
      );
      setAvailablePermissionsBySubsystem((prev) => ({
        ...prev,
        [currentSubsystem]: availPerms,
      }));
      setAllAvailablePermissions(availPerms);
      setAvailablePermissions &&
        setAvailablePermissions(permissionsStore.allPermissions);
    }
  };

  useEffect(() => {
    populateData();
    if (allSubsystems?.length > 1) {
      populateData(subsystemTab);
    } else {
      populateData();
    }
  }, [selectedUser, selectedUser?.roles, permissionsStore?.rolePermissions]);

  useEffect(() => {
    const availPerms = differenceWith(
      permissionsStore?.allPermissions,
      currentUserPermissions,
      _isEqual
    );
    setAllAvailablePermissions(availPerms);
    setAllCurrentPermissions(currentUserPermissions);
  }, [permissions, currentUserPermissions]);
    if (allSubsystems?.length > 1) {
      const availPerms = differenceWith(
        permissionsStore?.allPermissions,
        currentUserPermissions,
        _isEqual
      );
      setAvailablePermissionsBySubsystem((prev) => ({
        ...prev,
        [subsystemTab]: availPerms,
      }));
      setPermissionsBySubsystem((prev) => ({
        ...prev,
        [subsystemTab]: currentUserPermissions,
      }));
      if (currentTab === subsystemTab) {
        setAllAvailablePermissions(availPerms);
        setAllCurrentPermissions(currentUserPermissions);
      }
    } else {
      const availPerms = differenceWith(
        permissionsStore?.allPermissions,
        currentUserPermissions,
        _isEqual
      );
      setAllAvailablePermissions(availPerms);
      setAllCurrentPermissions(currentUserPermissions);
    }
  }, [permissions, currentUserPermissions, subsystemTab, currentTab, allSubsystems]);

  useEffect(() => {
    if (allSubsystems?.length > 1) {
      setSubsystem(subsystemTab);
      const promises = [];
      promises.push(permissionsStore?.getUser?.(selectedUser?.userName || ''));
      promises.push(permissionsStore?.getAllRolePermissions?.());
      promises.push(permissionsStore?.getUserPermissions?.(userName));
      Promise.all(promises).then(() => {
        populateData();
      
      setIsLoadingPermissions(true);
      
      const loadData = async () => {
        setAllCurrentPermissions([]);
        setAllAvailablePermissions([]);
        
        await Promise.all([
          permissionsStore?.getUser?.(selectedUser?.userName || ''),
          permissionsStore?.getAllRolePermissions?.(subsystemTab),
          permissionsStore?.getUserPermissions?.(userName, subsystemTab),
        ]);
        
        populateData(subsystemTab);
        setIsLoadingPermissions(false);
      };
      
      loadData().catch(() => {
        setIsLoadingPermissions(false);
      });
      
      formik?.resetForm();
    }
  }, [subsystemTab]);

  useEffect(() => {
    if (isTabSwitchingRef.current) {
      return;
    }
    
    if (selectedUser?.pk === prevUserPkRef.current) {
      return;
    }
    
    prevUserPkRef.current = selectedUser?.pk;
    
    if (!selectedUser?.pk) return;
    
    formik?.resetForm();
    setCurrentTab(allSubsystems[0]);
    setSubsystemTab(allSubsystems[0]);
    const initialSubsystem = allSubsystems?.[0];
    if (initialSubsystem) {
      setCurrentTab(initialSubsystem);
      setSubsystemTab(initialSubsystem);
      setPermissionsBySubsystem({});
      setAvailablePermissionsBySubsystem({});

      if (setSubsystem) {
        setSubsystem(initialSubsystem);
      }
    }
  }, [selectedUser?.pk]);

  const getLogs = async () => {
@@ -199,6 +291,11 @@ export const EditUserPermissionPanel = (
        await Promise.all(promises)
          .then(async () => {
            await getLogs();
            if (allSubsystems?.length > 1) {
              await permissionsStore?.getUserPermissions?.(userName, subsystemTab);
              await permissionsStore?.getAllRolePermissions?.(subsystemTab);
              populateData(subsystemTab);
            }
            showToast('success', 'Successfully added and removed permissions.');
          })
          .catch(() => {
@@ -229,6 +326,11 @@ export const EditUserPermissionPanel = (

        if (status === 200) {
          await getLogs();
          if (allSubsystems?.length > 1) {
            await permissionsStore?.getUserPermissions?.(userName, subsystemTab);
            await permissionsStore?.getAllRolePermissions?.(subsystemTab);
            populateData(subsystemTab);
          }
          showToast(
            'success',
            `Successfully assigned permissions to user ${
@@ -261,6 +363,17 @@ export const EditUserPermissionPanel = (

    setAllCurrentPermissions(filteredPermissions);
    setAllAvailablePermissions([...allAvailablePermissions, permission]);
    
    if (allSubsystems?.length > 1 && currentTab) {
      setPermissionsBySubsystem((prev) => ({
        ...prev,
        [currentTab]: filteredPermissions,
      }));
      setAvailablePermissionsBySubsystem((prev) => ({
        ...prev,
        [currentTab]: [...(prev[currentTab] || []), permission],
      }));
    }

    formik?.setFieldValue('deletedPermissions', allDeletedPerms);
    formik?.setFieldValue(permission?.name?.replace?.(/[[\]']+/g, ''), false);
@@ -327,63 +440,94 @@ export const EditUserPermissionPanel = (
          id="systems"
          className={classNames('mb-3', globals?.font_14px, globals?.font_bold)}
          onSelect={(tab) => {
            const selectedSubsystem = tab || '';
            
            isTabSwitchingRef.current = true;
            
            formik?.resetForm();
            setIsWriteMode && setIsWriteMode(false);
            setSubsystemTab && setSubsystemTab(tab || '');
            setSubsystem && setSubsystem(tab || '');
            setCurrentTab(tab || '');
            
            setSubsystem && setSubsystem(selectedSubsystem);
            setSubsystemTab(selectedSubsystem);
            setCurrentTab(selectedSubsystem);
            
            if (permissionsBySubsystem[selectedSubsystem]) {
              setAllCurrentPermissions(permissionsBySubsystem[selectedSubsystem]);
            } else {
              setAllCurrentPermissions([]);
            }
            
            if (availablePermissionsBySubsystem[selectedSubsystem]) {
              setAllAvailablePermissions(availablePermissionsBySubsystem[selectedSubsystem]);
            } else {
              setAllAvailablePermissions([]);
            }
            
            setTimeout(() => {
              isTabSwitchingRef.current = false;
            }, 0);
          }}
        >
          {allSubsystems?.map((subsystem) => (
            <Tab
              eventKey={subsystem}
              title={subsystem[0].toUpperCase() + subsystem.slice(1)}
              key={subsystem}
            >
              {permissionsStore?.rolePermissions &&
              includedUserPermissions &&
              excludedUserPermissions ? (
                <PermissionCategories
                  formik={formik}
                  rolePermissions={filteredRolePermissions}
                  displayedExcludedPermissions={displayedExcludedPermissions}
                  setDisplayedExcludedPermissions={
                    setDisplayedExcludedPermissions
                  }
                  displayedIncludedPermissions={displayedIncludedPermissions}
                  setDisplayedIncludedPermissions={
                    setDisplayedIncludedPermissions
                  }
                  permissionsStore={permissionsStore}
                  allAvailablePermissions={allAvailablePermissions}
                  setAllAvailablePermissions={setAllAvailablePermissions}
                  isWriteMode={isWriteMode}
                />
              ) : (
                <div>
                  {allCurrentPermissions?.length > 0 ? (
                    <div className={styles?.permissionsContainer}>
                      {allCurrentPermissions?.sort()?.map((permission) => (
                        <Tag
                          name={permission?.name}
                          isWriteMode={isWriteMode}
                          handleRemoveTag={() =>
                            handleRemovePermission(permission)
                          }
                        />
                      ))}
                    </div>
                  ) : (selectedUser?.roles || []).length === 0 ? (
                    <div>
                      Please select a user role before adding permissions
                    </div>
                  ) : (
                    <div>No permissions yet. Press edit to add permissions</div>
                  )}
                </div>
              )}
            </Tab>
          ))}
          {allSubsystems?.map((subsystem) => {
            const subsystemPermissions = permissionsBySubsystem[subsystem] || [];
            const subsystemAvailablePermissions = availablePermissionsBySubsystem[subsystem] || [];
            const isCurrentTab = currentTab === subsystem;
            const displayPermissions = isCurrentTab ? allCurrentPermissions : subsystemPermissions;
            
            return (
              <Tab
                eventKey={subsystem}
                title={subsystem[0].toUpperCase() + subsystem.slice(1)}
                key={subsystem}
              >
                {isLoadingPermissions && isCurrentTab ? (
                  <div>Loading permissions...</div>
                ) : permissionsStore?.rolePermissions &&
                  includedUserPermissions &&
                  excludedUserPermissions ? (
                  <PermissionCategories
                    formik={formik}
                    rolePermissions={filteredRolePermissions}
                    displayedExcludedPermissions={displayedExcludedPermissions}
                    setDisplayedExcludedPermissions={
                      setDisplayedExcludedPermissions
                    }
                    displayedIncludedPermissions={displayedIncludedPermissions}
                    setDisplayedIncludedPermissions={
                      setDisplayedIncludedPermissions
                    }
                    permissionsStore={permissionsStore}
                    allAvailablePermissions={isCurrentTab ? allAvailablePermissions : subsystemAvailablePermissions}
                    setAllAvailablePermissions={setAllAvailablePermissions}
                    isWriteMode={isWriteMode}
                  />
                ) : (
                  <div>
                    {displayPermissions?.length > 0 ? (
                      <div className={styles?.permissionsContainer}>
                        {displayPermissions?.sort()?.map((permission) => (
                          <Tag
                            key={permission?.name || permission?.id}
                            name={permission?.name}
                            isWriteMode={isWriteMode}
                            handleRemoveTag={() =>
                              handleRemovePermission(permission)
                            }
                          />
                        ))}
                      </div>
                    ) : (selectedUser?.roles || []).length === 0 ? (
                      <div>
                        Please select a user role before adding permissions
                      </div>
                    ) : (
                      <div>No permissions yet. Press edit to add permissions</div>
                    )}
                  </div>
                )}
              </Tab>
            );
          })}
        </Tabs>
      ) : permissionsStore?.rolePermissions &&
        includedUserPermissions &&
@@ -406,6 +550,7 @@ export const EditUserPermissionPanel = (
            <div className={styles?.permissionsContainer}>
              {allCurrentPermissions?.sort()?.map((permission) => (
                <Tag
                  key={permission?.name || permission?.id}
                  name={permission?.name}
                  isWriteMode={isWriteMode}
                  handleRemoveTag={() => handleRemovePermission(permission)}
@@ -424,8 +569,11 @@ export const EditUserPermissionPanel = (
          <Label>Permissions</Label>

          <div className={classNames(styles?.checkboxContainer, 'px-4 w-100')}>
            {allAvailablePermissions?.sort()?.map((permission: Permission) => (
              <div className={classNames('d-flex flex-row align-items-center')}>
            {(allSubsystems?.length > 1 
              ? (availablePermissionsBySubsystem[currentTab] || allAvailablePermissions)
              : allAvailablePermissions
            )?.sort()?.map((permission: Permission) => (
              <div key={permission?.name || permission?.id} className={classNames('d-flex flex-row align-items-center')}>
                <InputField
                  formik={formik}
                  type="checkbox"

 libs/common-ui/src/ams/stores/permissions.tsx 
+
8
−
2

Visualizado
@@ -643,8 +643,11 @@ export class PermissionsStore {
  };

  @action
  getAllRolePermissions = async (): Promise<number> => {
  getAllRolePermissions = async (subsystem?: string): Promise<number> => {
    const utilityStore = this.rootStore?.utilityStore;
    if (subsystem && utilityStore) {
      utilityStore.setSubSystem(subsystem);
    }
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: this?.permissionsPaths?.access?.getAllRolePermissions,
@@ -657,8 +660,11 @@ export class PermissionsStore {
  };

  @action
  getUserPermissions = async (username: string) => {
  getUserPermissions = async (username: string, subsystem?: string) => {
    const utilityStore = this.rootStore?.utilityStore;
    if (subsystem && utilityStore) {
      utilityStore.setSubSystem(subsystem);
    }
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: this?.permissionsPaths?.access?.getUserPermissions?.replace(
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.385",
  "version": "0.0.386",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

---


 12 arquivos
+
215
−
86
Arquivos
12
Pesquisar (por exemplo, *.vue) (F)

lay
‎outs‎

au
‎th‎

inde
‎x.tsx‎
+1 -9

no-
‎auth‎

inde
‎x.tsx‎
+15 -2

pa
‎ges‎

gro
‎ups‎

inde
‎x.tsx‎
+6 -5

merc
‎hants‎

inde
‎x.tsx‎
+6 -7

ro
‎les‎

inde
‎x.tsx‎
+7 -2

us
‎ers‎

inde
‎x.tsx‎
+46 -31

inde
‎x.tsx‎
+3 -3

server
‎-config‎

conf
‎ig.js‎
+12 -8

sty
‎les‎

index
‎.scss‎
+15 -0

packag
‎e.json‎
+3 -2

serv
‎er.js‎
+81 -9

yarn
‎.lock‎
+20 -8

 layouts/auth/index.tsx 
+
1
−
9

Visualizado
@@ -38,8 +38,6 @@ const AuthWrapper = (props: AuthWrapperProps) => {
    title,
  } = props;
  const router = useRouter();
  const [hasRolesPagePermission, setHasRolesPagePermission] = useState(false);
  const permissions = accountStore?.permissions;
  const userToken = accountStore?.userToken || null;

  useEffect(() => {
@@ -48,12 +46,6 @@ const AuthWrapper = (props: AuthWrapperProps) => {
    }
  }, [userToken]);

  useEffect(() => {
    const hasPermission =
      (permissions && hasViewPermission(permissions, 'roles')) || false;
    setHasRolesPagePermission(hasPermission);
  }, [permissions]);

  const sidebarLinks = [
    {
      label: 'Groups',
@@ -78,7 +70,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
    {
      label: 'Roles',
      target: 'roles',
      permission: hasRolesPagePermission,
      permission: true,
      icon: <FontAwesomeIcon icon={light('user-lock')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
 layouts/no-auth/index.tsx 
+
15
−
2

Visualizado
import React from 'react';
import React, {useLayoutEffect, useState} from 'react';
import {inject, observer} from 'mobx-react';
import {UnauthenticatedLayout, UtilityStore} from '@uownleasing/common-ui';
import config from '@config/project-config';
@@ -23,13 +23,26 @@ const NoAuthWrapper = (props: NoAuthWrapperProps) => {
    isLoaderAlwaysOn,
  } = props;

  const [isInitialMount, setIsInitialMount] = useState(true);

  useLayoutEffect(() => {
    if (!isLoaderAlwaysOn) {
      utilityStore?.setIsLoading(false);
    }
    setIsInitialMount(false);
  }, [isLoaderAlwaysOn, utilityStore]);

  const shouldShowLoader =
    !isInitialMount && (isLoaderAlwaysOn || utilityStore?.isLoading);

  return (
    <UnauthenticatedLayout
      pathname={typeof window !== 'undefined' ? window.location.pathname : '/'}
      isLoading={isLoaderAlwaysOn || utilityStore?.isLoading}
      isLoading={shouldShowLoader}
      config={config}
      isContactBarShown={isContactBarHidden ? false : config?.isContactBarShown}
      isNavbarShown={isNavbarShown}
      backgroundColor="bg-white"
      NavbarLogo={NavbarLogo}>
      {children}
    </UnauthenticatedLayout>
 pages/groups/index.tsx 
+
6
−
5

Visualizado
@@ -45,14 +45,15 @@ const GroupsPage = (props: GroupsPageProps) => {
  );

  useEffect(() => {
    const promises = [];
    promises.push(groupStore?.getAllGroups());
    Promise.all(promises).then(() => {
    utilityStore?.setSubSystem('ams-auth');
    const loadData = async () => {
      await groupStore?.getAllGroups();
      groupStore?.setSelectedGroupUsers(undefined);
      utilityStore?.setIsLoading(false);
    });
    };
    loadData();

    () => groupStore?.setSelectedGroupUsers(undefined);
    return () => groupStore?.setSelectedGroupUsers(undefined);
  }, []);

  const handleGroupClick = async (row) => {
 pages/merchants/index.tsx 
+
6
−
7

Visualizado
@@ -65,15 +65,14 @@ const MerchantsPage = (props: MerchantsPageProps) => {
  };

  useEffect(() => {
    const promises = [];
    promises.push(groupStore?.getAllGroupsWithUsers());
    promises.push(groupStore?.getAllGroups());
    promises.push(merchantStore?.getAllAvailableMerchants());
    promises.push(handleGetMerchants());
    Promise.all(promises).then(() => {
    utilityStore?.setSubSystem('origination');
    const loadData = async () => {
      await merchantStore?.getAllAvailableMerchants();
      await handleGetMerchants();
      setAllMerchantsData(merchantStore?.merchantsByCriteria || []);
      utilityStore?.setIsLoading(false);
    });
    };
    loadData();
  }, []);

  useEffect(() => {
 pages/roles/index.tsx 
+
7
−
2

Visualizado
@@ -41,7 +41,7 @@ const RolesPage = (props: RolesPageProps) => {
  const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] =
    useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>(allPerms);
  const [currentTab, setCurrentTab] = useState('origination');
  const [currentTab, setCurrentTab] = useState('ams-auth');

  const updateRolesAndPermissions = async () => {
    utilityStore?.setIsLoading(true);
@@ -57,7 +57,10 @@ const RolesPage = (props: RolesPageProps) => {
  };

  useEffect(() => {
    !accountStore?.isLoggingOut && updateRolesAndPermissions();
    if (!accountStore?.isLoggingOut) {
      utilityStore?.setSubSystem(currentTab);
      updateRolesAndPermissions();
    }
  }, [currentTab]);

  useEffect(() => {
@@ -66,6 +69,7 @@ const RolesPage = (props: RolesPageProps) => {

  const handleRoleClick = async (role: any, e: any) => {
    e.preventDefault();
    utilityStore?.setSubSystem('ams-auth');
    const {name} = role || {};
    permissionsStore?.setSelectedRole(role);
    await permissionsStore?.getRolePermissions(name);
@@ -103,6 +107,7 @@ const RolesPage = (props: RolesPageProps) => {
            }}>
            <Tab title="Origination" eventKey="origination" />
            <Tab title="Servicing" eventKey="servicing" />
            <Tab title="AMS" eventKey="ams-auth" />
          </Tabs>
          <FilterTable
            columns={rolesDataTableColumns}
 pages/users/index.tsx 
+
46
−
31

Visualizado
@@ -12,11 +12,7 @@ import {MerchantStore} from '@stores/merchant';
import {useFormik} from 'formik';
import {getUsersCSVProps, getUsersFilterProps} from '@utils/users-table-config';
import styles from './index.module.scss';
import {
  showToast,
  hasViewPermission,
  hasModifyPermission,
} from '@uownleasing/common-utilities';
import {showToast, hasPermission} from '@uownleasing/common-utilities';
import {isEqual as _isEqual, some, forEach, cloneDeep} from 'lodash';
import config from '@config/project-config';
import {TableRow} from 'react-data-table-component';
@@ -84,14 +80,9 @@ const AccountsPage = (props: AccountsPageProps) => {

  const loadPermissionsData = async () => {
    utilityStore?.setIsLoading(true);
    const promises = [];
    promises.push(utilityStore?.updateUsersPage());
    promises.push(merchantStore?.getAllAvailableMerchants());
    await Promise.all(promises).then((res) => {
      const merchantData = res?.[1]?.data || [];
      merchantStore?.setMerchantNamesRefCodesMap(merchantData);
      utilityStore?.setIsLoading(false);
    });
    utilityStore?.setSubSystem('ams-auth');
    await utilityStore?.updateUsersPage();
    utilityStore?.setIsLoading(false);
  };

  const updateSearchResults = async (searchParams: Search) => {
@@ -125,7 +116,6 @@ const AccountsPage = (props: AccountsPageProps) => {

  useEffect(() => {
    loadPermissionsData();
    utilityStore?.setSubSystem('origination');
  }, []);

  useEffect(
@@ -148,7 +138,7 @@ const AccountsPage = (props: AccountsPageProps) => {
        merchantsNameCodeMap={merchantStore?.merchantNamesRefCodesMap}
        assignMerchants={merchantStore?.assignMerchants}
        permissionsStore={permissionsStore}
        allSubsystems={['origination', 'servicing']}
        allSubsystems={['ams-auth', 'origination', 'servicing']}
        clonedUserData={clonedUserData}
        updateSearchResults={async () =>
          await updateSearchResults({
@@ -290,6 +280,7 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handlePageChange = async (page: number) => {
    utilityStore?.setSubSystem('ams-auth');
    await updateSearchResults({
      searchString,
      roles: limitUserByRoles,
@@ -300,6 +291,7 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handlePerRowsChange = async (newPerPage: number, page: number) => {
    utilityStore?.setSubSystem('ams-auth');
    await updateSearchResults({
      searchString,
      roles: limitUserByRoles,
@@ -310,9 +302,9 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handleUserClicked = async ({pk, userName}: User = {}) => {
    utilityStore?.setSubSystem('ams-auth');
    setLoadingUserLogs(true);
    setUserPK(pk);
    utilityStore?.setSubSystem('origination');
    const promises = [];
    promises.push(permissionsStore.getUser(userName));
    promises.push(permissionsStore.getUserLogs(pk));
@@ -438,12 +430,36 @@ const SubSystemSpecificPermissionsPanel = (
    [permissionsStore, userPK],
  );

  const hasUnlockUserPermission = hasViewPermission(permissions, 'ams_unlock');
  const hasUnlockUserPermission = hasPermission(permissions, 'user_unlock');

  const hasUserEditPanelPermission = hasModifyPermission(
  // Panel-specific permissions
  const hasEditUserPanelPermission = hasPermission(
    permissions,
    'edit_user_panel',
  );
  const hasEditPasswordPanelPermission = hasPermission(
    permissions,
    'edit_password_panel',
  );
  const hasEditRolePermissionPanelPermission = hasPermission(
    permissions,
    'edit_role_permission_panel',
  );
  const hasEditUserPermissionPanelPermission = hasPermission(
    permissions,
    'edit_user_permission_panel',
  );
  const hasEditMerchantPanelPermission = hasPermission(
    permissions,
    'edit_merchant_panel',
  );
  const hasEditUserGroupPanelPermission = hasPermission(
    permissions,
    'edit_user_group_panel',
  );
  const hasEditUsernamePanelPermission = hasPermission(
    permissions,
    'ams_user_panel',
    'edit',
    'edit_username_panel',
  );

  return (
@@ -462,6 +478,7 @@ const SubSystemSpecificPermissionsPanel = (
              some(selectedRows, ['loginLockout', false])
            }
            onClick={async () => {
              utilityStore?.setSubSystem('ams-auth');
              const promises = [];
              forEach(selectedRows, (row: User) => {
                const request = {
@@ -492,7 +509,6 @@ const SubSystemSpecificPermissionsPanel = (
          leftIcon={faUserGroup}
          isDisabled={Object.keys(clonedUserData || {})?.length <= 0}
          onClick={() => {
            utilityStore?.setSubSystem('origination');
            setIsSetUserModal(true);
          }}>
          Clone User
@@ -503,7 +519,6 @@ const SubSystemSpecificPermissionsPanel = (
          buttonStyle="primary"
          leftIcon={faUserPlus}
          onClick={() => {
            utilityStore?.setSubSystem('origination');
            setIsSetUserModal(true);
          }}>
          Add User
@@ -557,25 +572,25 @@ const SubSystemSpecificPermissionsPanel = (
                updateUserProfile={permissionsStore?.updateUserProfile}
                getUser={permissionsStore?.getUser}
                unlockUser={permissionsStore?.unlockUser}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditUserPanelPermission}
              />
              <EditPasswordPanel
                forceResetUserPassword={
                  permissionsStore?.forceResetUserPassword
                }
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditPasswordPanelPermission}
              />
              <EditRolePermissionPanel
                allSubsystems={['origination', 'servicing']}
                allSubsystems={['ams-auth', 'origination', 'servicing']}
                allRoles={permissionsStore?.roles}
                permissionsStore={permissionsStore}
                utilityStore={utilityStore}
                selectedUser={permissionsStore?.selectedUser}
                setUserLogs={setUserLogs}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditRolePermissionPanelPermission}
              />
              <EditUserPermissionPanel
                allSubsystems={['origination', 'servicing']}
                allSubsystems={['ams-auth', 'origination', 'servicing']}
                permissions={allAvailablePermissions}
                setAvailablePermissions={setAllAvailablePermissions}
                permissionsStore={permissionsStore}
@@ -585,7 +600,7 @@ const SubSystemSpecificPermissionsPanel = (
                addUserPermissions={permissionsStore?.addUserPermissions}
                removeUserPermissions={permissionsStore?.removeUserPermissions}
                setUserLogs={setUserLogs}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditUserPermissionPanelPermission}
              />
              <EditMerchantPanel
                allSubsystems={['origination']}
@@ -594,7 +609,7 @@ const SubSystemSpecificPermissionsPanel = (
                assignMerchants={merchantStore?.assignMerchants}
                permissionsStore={permissionsStore}
                setUserLogs={setUserLogs}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditMerchantPanelPermission}
                wrapReadOnlyValue
                hasSearchField
              />
@@ -604,13 +619,13 @@ const SubSystemSpecificPermissionsPanel = (
                userGroups={currentUserGroup}
                addGroupsToUser={groupStore?.addGroupsToUser}
                modifyUserGroups={groupStore?.modifyUserGroups}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditUserGroupPanelPermission}
              />
              <EditUsernamePanel
                user={permissionsStore?.selectedUser}
                checkUsername={permissionsStore?.checkUsername}
                updateUsername={permissionsStore?.updateUsername}
                hasEditPermission={hasUserEditPanelPermission}
                hasEditPermission={hasEditUsernamePanelPermission}
              />
              <ActivityLogPanel
                className="mt-3"
 pages/index.tsx 
+
3
−
3

Visualizado
import React, {useEffect} from 'react';
import React, {useLayoutEffect} from 'react';
import {inject, observer} from 'mobx-react';
import {LoginContainer} from '@uownleasing/common-ui';
import {useRouter} from 'next/router';
@@ -20,7 +20,7 @@ const Home = (props: HomeProps) => {
  const router = useRouter();
  const setIsLoading = utilityStore?.setIsLoading;

  useEffect(() => {
  useLayoutEffect(() => {
    utilityStore?.setIsLoading(false);
  }, []);

@@ -36,7 +36,7 @@ const Home = (props: HomeProps) => {
    const statusCode = await accountStore.login(email, password, rememberMe);

    if (statusCode === 200) {
      utilityStore?.setSubSystem('origination');
      utilityStore?.setSubSystem('ams-auth');
      showToast('success', 'Login successful. Please wait...');
      await router.push(config?.mainLoggedInPage);
      return;
 server-config/config.js 
+
12
−
8

Visualizado
module.exports = (props) => {
  const {PRIV_KEY, amsURL, proxy} = props;
  const controllers = Object.keys(proxy);
  const AUTHENTICATE_CONTROLLERS = (controllers || []).filter(
    (controller) =>
      controller !== 'login' &&
      controller !== 'logout' &&
      controller !== 'authentication',
  );

  // Normalize proxy controller keys to real path prefixes and keep only AMS auth routes
  const RAW_CONTROLLERS = Object.keys(proxy || {});
  const normalize = (c) => {
    const lead = (c || '').startsWith('/') ? c : `/${c || ''}`;
    // Strip trailing markers like '$' and '/**$' used in proxy patterns
    return lead.replace('/**$', '').replace('$', '');
  };
  const AUTHENTICATE_CONTROLLERS = (RAW_CONTROLLERS || [])
    .map(normalize)
    .filter((c) => ['/user', '/permission', '/role', '/group'].includes(c));

  const onValidRequest = (props) => {
    const {reqSession, headers, next} = props;
@@ -20,7 +24,7 @@ module.exports = (props) => {
  const config = {
    SESSION_KEY: PRIV_KEY,
    OMS_URL: amsURL,
    SUB_SYSTEM: 'servicing',
    SUB_SYSTEM: 'ams-auth',
    PROJECT_SPECIFIC_PROXY_JSON: proxy,
    JWT_KEY: PRIV_KEY,
    ONLY_CHECK_PERMISSIONS_FOR_THESE_SPECIFIC_CONTROLLERS:
 styles/index.scss 
+
15
−
0

Visualizado
@@ -33,3 +33,18 @@
  --bold-font: gotham-medium;
  --disabled: #777;
}

html,
body,
#__next {
  background-color: #fff !important;
}

.d-flex.flex-column.vh-100 {
  background-color: #fff !important;
}

.loader {
  background: var(--loader) !important;
  opacity: 0.7 !important;
}
\ No newline at end of file
 package.json 
+
3
−
2

Visualizado
@@ -28,8 +28,9 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.377",
    "@uownleasing/server-utilities": "0.0.23",
    "@uownleasing/common-ui": "0.0.386",
    "@uownleasing/common-utilities": "0.0.54",
    "@uownleasing/server-utilities": "0.0.24",
    "bootstrap": "^4.6.0",
    "color": "^3.1.3",
    "connect-hazelcast": "1.2.0",
 server.js 
+
81
−
9

Visualizado
@@ -28,10 +28,14 @@ const PRIV_KEY = fs.readFileSync('keys/id_rsa_priv.pem', 'utf8');
const proxy = {
  login: {
    targetUrl: amsURL,
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
    modifyOnRes: ({req, res, responseBody}) => {
      const access = responseBody?.permissions?.access;

      if (access?.ams) {
      if (access?.ams_portal_access) {
        responseBody.permissions.access.roles = true;
        responseBody.permissions.access.users = true;
        responseBody.permissions.access.groups = true;
@@ -64,14 +68,82 @@ const proxy = {
    targetUrl: amsURL,
    pathRewrite: {'^authentication': '/authentication'},
  },
  uown: {targetUrl: env.API_URL, pathRewrite: {'^uown': '/uown'}},
  user$: {targetUrl: amsURL, pathRewrite: {'^user': '/user'}},
  'user/**$': {targetUrl: amsURL, pathRewrite: {'^user/': '/user/'}},
  permission: {targetUrl: amsURL, pathRewrite: {'^permission': '/permission'}},
  role$: {targetUrl: amsURL, pathRewrite: {'^role': '/role'}},
  'role/**$': {targetUrl: amsURL, pathRewrite: {'^role/': '/role/'}},
  group$: {targetUrl: amsURL, pathRewrite: {'^group': '/group'}},
  'group/**$': {targetUrl: amsURL, pathRewrite: {'^group/': '/group/'}},
  uown: {
    targetUrl: env.API_URL,
    pathRewrite: {'^uown': '/uown'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'origination');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  user$: {
    targetUrl: amsURL,
    pathRewrite: {'^user': '/user'},
    modifyOnReq: ({proxyReq, req, res}) => {
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  'user/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^user/': '/user/'},
    modifyOnReq: ({proxyReq, req, res}) => {
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  permission$: {
    targetUrl: amsURL,
    pathRewrite: {'^permission': '/permission'},
    modifyOnReq: ({proxyReq, req, res}) => {
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  'permission/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^permission/': '/permission/'},
    modifyOnReq: ({proxyReq, req, res}) => {
      const subSystem = req.headers['sub-system'] || 'ams-auth';
      proxyReq.setHeader('sub-system', subSystem);
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  role$: {
    targetUrl: amsURL,
    pathRewrite: {'^role': '/role'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  'role/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^role/': '/role/'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  group$: {
    targetUrl: amsURL,
    pathRewrite: {'^group': '/group'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
  'group/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^group/': '/group/'},
    modifyOnReq: ({proxyReq, req, res}) => {
      proxyReq.setHeader('sub-system', 'ams-auth');
      return {modifiedProxyReq: proxyReq, modifiedReq: req, modifiedRes: res};
    },
  },
};

const config = require('./server-config/config')({PRIV_KEY, amsURL, proxy});
 yarn.lock 
+
20
−
8

Visualizado
@@ -1817,10 +1817,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.377":
  version "0.0.377"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.377.tgz#9680d19fe2e142f32e279738c60a47cd616afb8c"
  integrity sha512-s2wNm6g6Fu9/gxM5JZBP2B1ZF4/KZYUdClFOOwl4mR9GQ8rO3ttiCDvhLncb2nW/S0M2HqBCp3XIgmIEGwkaxA==
"@uownleasing/common-ui@0.0.386":
  version "0.0.386"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.386.tgz#32498e011cba1228c054005f6518d9b7b36c7d72"
  integrity sha512-vuCPR7V0y5ICFxOwHveNxsSaOGpVZWUntAcNc73Mf7pTrqh1S3jt3XbDj3kBTnM6npldfC8717E2s5muu0QIgw==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"
@@ -1856,10 +1856,22 @@
    react-idle-timer "4.6.4"
    react-toastify "8.2.0"

"@uownleasing/server-utilities@0.0.23":
  version "0.0.23"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/server-utilities/-/server-utilities-0.0.23.tgz#d9af4e830fa55ba430aff1d35abf7429082ee9b6"
  integrity sha512-Zy7XZwLFy/eZhvPrJw/8ms91wy+IK4gMQYG5T2yInH8FamtskrIcKbfwrotjI52IxcJv1dC4ZDo2BLorA7E3eQ==
"@uownleasing/common-utilities@0.0.54":
  version "0.0.54"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-utilities/-/common-utilities-0.0.54.tgz#6cb36e84e1322941611e85201ac59b4f58803665"
  integrity sha512-vYn4d61Bn8ncl6gxOXO4x530Uzj9P3+H0B0url3HS9Fz1xJVh34CAfZ1yU6Yy+YxjJKRrTFBbSV9aLIDFXawfw==
  dependencies:
    axios "0.27.2"
    country-data "^0.0.31"
    credit-card-type "9.1.0"
    date-fns "2.28.0"
    react-idle-timer "4.6.4"
    react-toastify "8.2.0"

"@uownleasing/server-utilities@0.0.24":
  version "0.0.24"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/server-utilities/-/server-utilities-0.0.24.tgz#16dab2b918c6780443b0246e09da63e104c298a8"
  integrity sha512-MEGFJCoScKJ9MqWV0i/JUV/6mwVvdmi7ry658HsMDl2bgSEHQgjxoTbFbrkUG2lCwouKX0y52sfvLvgAZkQFOQ==
  dependencies:
    "@opentelemetry/api" "*"
    "@opentelemetry/exporter-jaeger" "*"

---


 8 arquivos
+
725
−
51
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

pack
‎ages‎

common-u
‎tilities‎

src/lib/p
‎ermissions‎

index.
‎spec.ts‎
+406 -0

inde
‎x.ts‎
+211 -42

packag
‎e.json‎
+1 -1

projec
‎t.json‎
+46 -6

server-u
‎tilities‎

src/lib
‎/server‎

authent
‎ication‎

inde
‎x.js‎
+1 -1

proxy
‎/utils‎

inde
‎x.js‎
+13 -0

packag
‎e.json‎
+1 -1

projec
‎t.json‎
+46 -0

 packages/common-utilities/src/lib/permissions/index.spec.ts  0 → 100644
+
406
−
0

Visualizado
import {
  Permissions,
  hasViewPermission,
  hasModifyPermission,
  hasPermission,
  hasResourcePermission,
  hasRestrictedViewPermission,
  hasRestrictedModifyPermission,
  hasRestrictedPartialViewPermission,
  hasAccessRestrictedViewPermission,
} from './index';

describe('Permission Helper Functions', () => {
  const mockPermissions: Permissions = {
    access: {
      ams: true,
      dms: true,
      legacy_panel: {
        modify: {
          edit: true,
          delete: true,
        },
      },
    },
    restricted: {
      view: {
        full: {
          user_list: true,
          role_list: true,
          permission_list: true,
          group_list: true,
        },
        partial: {
          customer_ssn: true,
          customer_dob: true,
        },
      },
      modify: {
        user_unlock: true,
        user_update: true,
        user_create: true,
        user_delete: true,
        role_create: true,
        role_update: true,
      },
    },
  };

  describe('hasViewPermission', () => {
    it('should find permissions in access category', () => {
      expect(hasViewPermission(mockPermissions, 'ams')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'dms')).toBe(true);
    });

    it('should find permissions in restricted.view.full', () => {
      expect(hasViewPermission(mockPermissions, 'user_list')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'role_list')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'permission_list')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'group_list')).toBe(true);
    });

    it('should find permissions in restricted.view.partial', () => {
      expect(hasViewPermission(mockPermissions, 'customer_ssn')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'customer_dob')).toBe(true);
    });

    it('should return false for permissions in restricted.modify only', () => {
      expect(hasViewPermission(mockPermissions, 'user_unlock')).toBe(false);
      expect(hasViewPermission(mockPermissions, 'user_update')).toBe(false);
    });

    it('should return false for non-existent permissions', () => {
      expect(hasViewPermission(mockPermissions, 'fake_permission')).toBe(false);
      expect(hasViewPermission(mockPermissions, 'nonexistent')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasViewPermission(undefined, 'user_list')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(hasViewPermission(mockPermissions, '')).toBe(false);
    });
  });

  describe('hasModifyPermission', () => {
    it('should find permissions using new pattern (single parameter)', () => {
      expect(hasModifyPermission(mockPermissions, 'user_unlock')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'user_update')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'user_create')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'role_create')).toBe(true);
    });

    it('should find permissions using legacy pattern (two parameters)', () => {
      expect(hasModifyPermission(mockPermissions, 'legacy_panel', 'edit')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'legacy_panel', 'delete')).toBe(true);
    });

    it('should find permissions in restricted.modify', () => {
      expect(hasModifyPermission(mockPermissions, 'user_unlock')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'user_update')).toBe(true);
    });

    it('should return false for non-existent legacy structure', () => {
      expect(hasModifyPermission(mockPermissions, 'legacy_panel', 'create')).toBe(false);
      expect(hasModifyPermission(mockPermissions, 'fake_panel', 'edit')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasModifyPermission(undefined, 'user_unlock')).toBe(false);
      expect(hasModifyPermission(undefined, 'legacy_panel', 'edit')).toBe(false);
    });

    it('should handle constructed permission names correctly', () => {
      // When action is provided, it constructs field_action
      expect(hasModifyPermission(mockPermissions, 'user', 'unlock')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'user', 'update')).toBe(true);
    });

    it('should return false for non-existent permissions', () => {
      expect(hasModifyPermission(mockPermissions, 'fake_permission')).toBe(false);
    });
  });

  describe('hasRestrictedModifyPermission', () => {
    it('should find permissions in restricted.modify category', () => {
      expect(hasRestrictedModifyPermission(mockPermissions, 'user_unlock')).toBe(true);
      expect(hasRestrictedModifyPermission(mockPermissions, 'user_update')).toBe(true);
      expect(hasRestrictedModifyPermission(mockPermissions, 'role_create')).toBe(true);
    });

    it('should return false for permissions not in restricted.modify', () => {
      expect(hasRestrictedModifyPermission(mockPermissions, 'ams')).toBe(false);
      expect(hasRestrictedModifyPermission(mockPermissions, 'user_list')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasRestrictedModifyPermission(undefined, 'user_unlock')).toBe(false);
    });

    it('should return false for non-existent permissions', () => {
      expect(hasRestrictedModifyPermission(mockPermissions, 'fake_permission')).toBe(false);
    });
  });

  describe('hasRestrictedViewPermission', () => {
    it('should find permissions in restricted.view.full category', () => {
      expect(hasRestrictedViewPermission(mockPermissions, 'user_list')).toBe(true);
      expect(hasRestrictedViewPermission(mockPermissions, 'role_list')).toBe(true);
      expect(hasRestrictedViewPermission(mockPermissions, 'permission_list')).toBe(true);
    });

    it('should return false for permissions not in restricted.view.full', () => {
      expect(hasRestrictedViewPermission(mockPermissions, 'ams')).toBe(false);
      expect(hasRestrictedViewPermission(mockPermissions, 'user_unlock')).toBe(false);
      expect(hasRestrictedViewPermission(mockPermissions, 'customer_ssn')).toBe(false); // in partial, not full
    });

    it('should return false for undefined permissions', () => {
      expect(hasRestrictedViewPermission(undefined, 'user_list')).toBe(false);
    });
  });

  describe('hasRestrictedPartialViewPermission', () => {
    it('should find permissions in restricted.view.partial category', () => {
      expect(hasRestrictedPartialViewPermission(mockPermissions, 'customer_ssn')).toBe(true);
      expect(hasRestrictedPartialViewPermission(mockPermissions, 'customer_dob')).toBe(true);
    });

    it('should return false for permissions not in restricted.view.partial', () => {
      expect(hasRestrictedPartialViewPermission(mockPermissions, 'ams')).toBe(false);
      expect(hasRestrictedPartialViewPermission(mockPermissions, 'user_list')).toBe(false); // in full, not partial
    });

    it('should return false for undefined permissions', () => {
      expect(hasRestrictedPartialViewPermission(undefined, 'customer_ssn')).toBe(false);
    });
  });

  describe('hasAccessRestrictedViewPermission', () => {
    const mockPermissionsWithAccessRestricted: Permissions = {
      access: {
        customer: {
          restricted: {
            view: {
              ssn: true,
              dob: true,
            },
          },
        },
      },
      restricted: {
        view: {
          full: {},
        },
        modify: {},
      },
    };

    it('should find permissions in access[field].restricted.view category', () => {
      expect(hasAccessRestrictedViewPermission(mockPermissionsWithAccessRestricted, 'customer', 'ssn')).toBe(true);
      expect(hasAccessRestrictedViewPermission(mockPermissionsWithAccessRestricted, 'customer', 'dob')).toBe(true);
    });

    it('should return false for non-existent nested permissions', () => {
      expect(hasAccessRestrictedViewPermission(mockPermissionsWithAccessRestricted, 'customer', 'fake')).toBe(false);
      expect(hasAccessRestrictedViewPermission(mockPermissionsWithAccessRestricted, 'fake', 'ssn')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasAccessRestrictedViewPermission(undefined, 'customer', 'ssn')).toBe(false);
    });
  });

  describe('hasPermission (unified checker)', () => {
    it('should find permissions in access category', () => {
      expect(hasPermission(mockPermissions, 'ams')).toBe(true);
      expect(hasPermission(mockPermissions, 'dms')).toBe(true);
    });

    it('should find permissions in restricted.view.full', () => {
      expect(hasPermission(mockPermissions, 'user_list')).toBe(true);
      expect(hasPermission(mockPermissions, 'role_list')).toBe(true);
    });

    it('should find permissions in restricted.view.partial', () => {
      expect(hasPermission(mockPermissions, 'customer_ssn')).toBe(true);
      expect(hasPermission(mockPermissions, 'customer_dob')).toBe(true);
    });

    it('should find permissions in restricted.modify', () => {
      expect(hasPermission(mockPermissions, 'user_unlock')).toBe(true);
      expect(hasPermission(mockPermissions, 'user_update')).toBe(true);
      expect(hasPermission(mockPermissions, 'role_create')).toBe(true);
    });

    it('should handle complex permission names with underscores', () => {
      expect(hasPermission(mockPermissions, 'user_unlock')).toBe(true);
      expect(hasPermission(mockPermissions, 'permission_list')).toBe(true);
    });

    it('should return false for non-existent permissions', () => {
      expect(hasPermission(mockPermissions, 'fake_permission')).toBe(false);
      expect(hasPermission(mockPermissions, 'nonexistent_action')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasPermission(undefined, 'user_unlock')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasPermission(mockPermissions, '')).toBe(false);
    });
  });

  describe('hasResourcePermission', () => {
    it('should correctly combine resource and action into permission name', () => {
      expect(hasResourcePermission(mockPermissions, 'user', 'unlock')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'user', 'update')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'user', 'create')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'user', 'delete')).toBe(true);
    });

    it('should find list permissions', () => {
      expect(hasResourcePermission(mockPermissions, 'user', 'list')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'role', 'list')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'permission', 'list')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'group', 'list')).toBe(true);
    });

    it('should return false for non-existent resource-action combinations', () => {
      expect(hasResourcePermission(mockPermissions, 'user', 'read')).toBe(false);
      expect(hasResourcePermission(mockPermissions, 'fake', 'unlock')).toBe(false);
      expect(hasResourcePermission(mockPermissions, 'user', 'fake_action')).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      expect(hasResourcePermission(undefined, 'user', 'unlock')).toBe(false);
    });

    it('should handle role permissions correctly', () => {
      expect(hasResourcePermission(mockPermissions, 'role', 'create')).toBe(true);
      expect(hasResourcePermission(mockPermissions, 'role', 'update')).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should accept valid PermissionCategory structure', () => {
      const validPermissions: Permissions = {
        access: {
          test: true,
        },
        restricted: {
          view: {
            full: {
              test_list: true,
            },
          },
          modify: {
            test_update: true,
          },
        },
      };

      expect(hasPermission(validPermissions, 'test')).toBe(true);
    });

    it('should handle nested PermissionCategory structure', () => {
      const nestedPermissions: Permissions = {
        access: {
          level1: {
            level2: {
              level3: true,
            },
          },
        },
        restricted: {
          view: {
            full: {},
          },
          modify: {},
        },
      };

      // Type allows nesting, though our helpers check top level
      expect(typeof nestedPermissions.access['level1']).toBe('object');
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with old hasViewPermission usage', () => {
      // Old code that only checked access should still work
      expect(hasViewPermission(mockPermissions, 'ams')).toBe(true);
      expect(hasViewPermission(mockPermissions, 'dms')).toBe(true);
    });

    it('should maintain compatibility with old hasModifyPermission usage', () => {
      // Old code with two parameters should still work
      expect(hasModifyPermission(mockPermissions, 'legacy_panel', 'edit')).toBe(true);
      expect(hasModifyPermission(mockPermissions, 'legacy_panel', 'delete')).toBe(true);
    });

    it('should work with existing hasRestrictedModifyPermission calls', () => {
      expect(hasRestrictedModifyPermission(mockPermissions, 'user_unlock')).toBe(true);
    });

    it('should work with existing hasRestrictedViewPermission calls', () => {
      expect(hasRestrictedViewPermission(mockPermissions, 'user_list')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty permissions object', () => {
      const emptyPermissions: Permissions = {
        access: {},
        restricted: {
          view: {
            full: {},
          },
          modify: {},
        },
      };

      expect(hasPermission(emptyPermissions, 'anything')).toBe(false);
      expect(hasViewPermission(emptyPermissions, 'anything')).toBe(false);
      expect(hasModifyPermission(emptyPermissions, 'anything')).toBe(false);
    });

    it('should handle permissions with only partial view', () => {
      const partialOnlyPermissions: Permissions = {
        access: {},
        restricted: {
          view: {
            full: {},
            partial: {
              sensitive_field: true,
            },
          },
          modify: {},
        },
      };

      expect(hasViewPermission(partialOnlyPermissions, 'sensitive_field')).toBe(true);
      expect(hasPermission(partialOnlyPermissions, 'sensitive_field')).toBe(true);
    });

    it('should handle special characters in permission names', () => {
      const specialPermissions: Permissions = {
        access: {
          'permission-with-dash': true,
          'permission.with.dot': true,
        },
        restricted: {
          view: {
            full: {},
          },
          modify: {},
        },
      };

      expect(hasViewPermission(specialPermissions, 'permission-with-dash')).toBe(true);
      expect(hasViewPermission(specialPermissions, 'permission.with.dot')).toBe(true);
    });
  });
});
 packages/common-utilities/src/lib/permissions/index.ts 
+
211
−
42

Visualizado
/**
 * Represents a category of permissions with nested structure support.
 * Values can be boolean (leaf permissions) or nested PermissionCategory objects.
 */
export interface PermissionCategory {
  [key: string]: boolean | PermissionCategory;
}

/**
 * Main permissions interface matching backend JSON structure.
 * Permissions are organized into access and restricted categories.
 */
export interface Permissions {
  restricted: {
    view: {
      full: any;
      partial?: any;
      full: PermissionCategory;
      partial?: PermissionCategory;
    };
    modify: any;
    modify: PermissionCategory;
  };
  access: any;
  access: PermissionCategory;
}

/**
 * Checks the restricted modify permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for restricted modify permission.
 * @returns {Boolean} - if the field has restricted modify permission.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field to be checked for restricted modify permission
 * @returns {boolean} True if the field has restricted modify permission
 * 
 * @example
 * hasRestrictedModifyPermission(permissions, 'user_unlock')
 */
export const hasRestrictedModifyPermission = (
  permissions: Permissions,
  permissions: Permissions | undefined,
  field: string
) => {
): boolean => {
  return !!permissions?.restricted?.modify?.[field];
};

/**
 * Checks the restricted view permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for restricted view permission.
 * @returns {Boolean} - if the field has restricted view permission.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field to be checked for restricted view permission
 * @returns {boolean} True if the field has restricted view permission
 * 
 * @example
 * hasRestrictedViewPermission(permissions, 'user_list')
 */
export const hasRestrictedViewPermission = (
  permissions: Permissions,
  permissions: Permissions | undefined,
  field: string
) => {
): boolean => {
  return !!permissions?.restricted?.view?.full?.[field];
};

/**
 * Checks the view permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for view permission.
 * @returns {Boolean} - if the field has view permission.
 * Checks view permission for a field across all permission categories.
 * Searches: access, restricted.view.full, and restricted.view.partial.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field/permission name to check
 * @returns {boolean} True if the field has view permission in any category
 * 
 * @example
 * // Checks all categories for the permission
 * hasViewPermission(permissions, 'user_list')
 * hasViewPermission(permissions, 'role_read')
 * 
 * @since 0.0.53 - Now checks all permission categories instead of just access
 */
export const hasViewPermission = (permissions: Permissions, field: string) => {
  return !!permissions?.access?.[field];
export const hasViewPermission = (
  permissions: Permissions | undefined,
  field: string
): boolean => {
  if (!permissions) return false;
  
  // Check in access permissions (backward compatibility)
  if (permissions?.access?.[field]) {
    return true;
  }
  
  // Check in restricted.view.full (new granular permissions)
  if (permissions?.restricted?.view?.full?.[field]) {
    return true;
  }
  
  // Check in restricted.view.partial
  if (permissions?.restricted?.view?.partial?.[field]) {
    return true;
  }
  
  return false;
};

/**
 * Checks the modify permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for modify permission.
 * @param {string} action
 * @returns {Boolean} - if the field has modify permission.
 * Checks modify permission for a field.
 * Supports both legacy and new permission patterns.
 * 
 * Legacy pattern: hasModifyPermission(perms, 'user_panel', 'edit')
 * New pattern: hasModifyPermission(perms, 'user_update')
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field/permission name or target
 * @param {string} action - Optional action (for legacy compatibility)
 * @returns {boolean} True if the modify permission exists
 * 
 * @example
 * // New pattern (recommended)
 * hasModifyPermission(permissions, 'user_unlock')
 * 
 * @example
 * // Legacy pattern (still supported)
 * hasModifyPermission(permissions, 'user_panel', 'edit')
 * 
 * @since 0.0.53 - Enhanced to support both legacy and new permission patterns
 */
export const hasModifyPermission = (
  permissions: Permissions,
  permissions: Permissions | undefined,
  field: string,
  action: string
) => {
  return !!permissions?.access?.[field]?.modify?.[action];
  action?: string
): boolean => {
  if (!permissions) return false;
  
  // Construct permission name
  const permissionName = action ? `${field}_${action}` : field;
  
  // Check in restricted.modify (new granular permissions)
  if (permissions?.restricted?.modify?.[permissionName]) {
    return true;
  }
  
  // Check legacy structure: access[field].modify[action]
  if (action) {
    const fieldValue = permissions?.access?.[field];
    if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const modifyValue = (fieldValue as any).modify;
      if (modifyValue && typeof modifyValue === 'object') {
        if (modifyValue[action]) {
          return true;
        }
      }
    }
  }
  
  // Check direct access permission
  if (permissions?.access?.[permissionName]) {
    return true;
  }
  
  return false;
};

/**
 * Checks the restricted view permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for restricted view permission.
 * @param {string} name
 * @returns {Boolean} - if the field has view permission.
 * Checks the access restricted view permission for a field.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field to be checked for restricted view permission
 * @param {string} name - The name to be checked
 * @returns {boolean} True if the field has view permission
 * 
 * @example
 * hasAccessRestrictedViewPermission(permissions, 'customer', 'ssn')
 */
export const hasAccessRestrictedViewPermission = (
  permissions: Permissions,
  permissions: Permissions | undefined,
  field: string,
  name: string
) => {
  return !!permissions?.access?.[field]?.restricted?.view?.[name];
): boolean => {
  if (!permissions) return false;
  
  const fieldValue = permissions?.access?.[field];
  if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
    const restrictedValue = (fieldValue as any).restricted;
    if (restrictedValue && typeof restrictedValue === 'object') {
      const viewValue = restrictedValue.view;
      if (viewValue && typeof viewValue === 'object') {
        return !!viewValue[name];
      }
    }
  }
  
  return false;
};

/**
 * Checks the restricted partial view permission for a field.
 * @param {Object} permissions
 * @param {string} field - the field to be checked for restricted view permission.
 * @returns {Boolean} - if the field has restricted view permission.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} field - The field to be checked for restricted partial view permission
 * @returns {boolean} True if the field has restricted partial view permission
 * 
 * @example
 * hasRestrictedPartialViewPermission(permissions, 'customer_ssn')
 */
export const hasRestrictedPartialViewPermission = (
  permissions: Permissions,
  permissions: Permissions | undefined,
  field: string
) => {
): boolean => {
  return !!permissions?.restricted?.view?.partial?.[field];
};

/**
 * Unified permission check - searches all permission categories.
 * Recommended for checking new granular permissions.
 * 
 * This is the most comprehensive permission check and should be used
 * when you're uncertain which category a permission might be in.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} permissionName - The permission name to check
 * @returns {boolean} True if the permission exists in any category
 * 
 * @example
 * hasPermission(permissions, 'user_unlock')      // Searches everywhere
 * hasPermission(permissions, 'role_list')        // Searches everywhere
 * hasPermission(permissions, 'permission_read')  // Searches everywhere
 * 
 * @since 0.0.53
 */
export const hasPermission = (
  permissions: Permissions | undefined,
  permissionName: string
): boolean => {
  if (!permissions) return false;
  
  return (
    hasViewPermission(permissions, permissionName) ||
    hasRestrictedModifyPermission(permissions, permissionName) ||
    false
  );
};

/**
 * Check for resource-based permissions with action granularity.
 * Follows the {resource}_{action} naming convention.
 * 
 * @param {Permissions | undefined} permissions - The permissions object
 * @param {string} resource - The resource name (e.g., 'user', 'role', 'permission')
 * @param {string} action - The action name (e.g., 'unlock', 'update', 'list', 'read')
 * @returns {boolean} True if the resource-action permission exists
 * 
 * @example
 * hasResourcePermission(permissions, 'user', 'unlock')     // Checks 'user_unlock'
 * hasResourcePermission(permissions, 'role', 'update')     // Checks 'role_update'
 * hasResourcePermission(permissions, 'permission', 'list') // Checks 'permission_list'
 * 
 * @since 0.0.53
 */
export const hasResourcePermission = (
  permissions: Permissions | undefined,
  resource: string,
  action: string
): boolean => {
  const permissionName = `${resource}_${action}`;
  return hasPermission(permissions, permissionName);
};
 packages/common-utilities/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-utilities",
  "version": "0.0.52",
  "version": "0.0.54",
  "publishConfig": {
    "registry": "https://nexus.uownleasing.com/repository/npm-hosted/"
  }
 packages/common-utilities/project.json 
+
46
−
6

Visualizado
@@ -2,6 +2,7 @@
  "root": "packages/common-utilities",
  "sourceRoot": "packages/common-utilities/src",
  "projectType": "library",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nrwl/node:package",
@@ -11,7 +12,18 @@
        "main": "packages/common-utilities/src/index.ts",
        "packageJson": "packages/common-utilities/package.json",
        "tsConfig": "packages/common-utilities/tsconfig.lib.json",
        "assets": ["packages/common-utilities/*.md", "packages/common-utilities/.npmrc"]
        "assets": [
          {
            "glob": "packages/common-utilities/README.md",
            "input": ".",
            "output": "."
          },
          {
            "glob": "packages/common-utilities/.npmrc",
            "input": ".",
            "output": "."
          }
        ]
      }
    },
    "lint": {
@@ -45,13 +57,41 @@
        }
      ],
      "options": {
        "commands": ["npm version prerelease --preid={args.preid}"],
        "args": "--preid=",
        "cwd": "dist/packages/common-utilities",
        "commands": [
          "npm version prerelease --preid={args.preid}",
          {
            "command": "npm publish",
            "forwardAllArgs": false
          },
          "npm view @uownleasing/common-utilities version --registry=https://nexus.uownleasing.com/repository/npm-hosted/"
        ],
        "parallel": false,
        "color": true,
        "parallel": false
        "cwd": "dist/packages/common-utilities"
      }
    },
    "publish": {
      "executor": "@nrwl/workspace:run-commands",
      "outputs": [],
      "dependsOn": [
        {
          "target": "build",
          "projects": "self"
        }
      ],
      "options": {
        "commands": [
          {
            "command": "npm publish",
            "forwardAllArgs": false
          },
          "npm view @uownleasing/common-utilities version --registry=https://nexus.uownleasing.com/repository/npm-hosted/"
        ],
        "parallel": false,
        "color": true,
        "cwd": "dist/packages/common-utilities"
      }
    }
  },
  "tags": []
  }
}
 packages/server-utilities/src/lib/server/authentication/index.js 
+
1
−
1

Visualizado
@@ -136,7 +136,7 @@ const Authentication = (props) => {
      const IS_JWT_VALID = !!VERIFIED_JWT;
      const REQ_SESSION = req?.session;
      const PERMISSIONS = REQ_SESSION?.permissions;
      const HAS_AMS_ACCESS = PERMISSIONS?.access?.ams || false;
      const HAS_AMS_ACCESS = PERMISSIONS?.access?.ams_portal_access || false;

      if (REQ_SESSION) {
        REQ_SESSION.touch();
 packages/server-utilities/src/lib/server/proxy/utils/index.js 
+
13
−
0

Visualizado
@@ -71,6 +71,19 @@ const createProxy = (props) => {
      console.log('req.session', reqSession);
      req.headers['x-api-email'] = req?.session?.username || '';

      // Strip token header for AMS routes (ams-auth subsystem)
      // AMS backend uses header-based auth (sub-system + username) and doesn't use token header
      if (SUB_SYSTEM === 'ams-auth' && !isLoginProxy && !isAuthenticateProxy) {
        const tokenHeader = req.headers?.token || req.headers?.Token || proxyReq.getHeader('token');
        if (tokenHeader) {
          // eslint-disable-next-line no-console
          console.log('[Proxy] Stripping token header for AMS route (SUB_SYSTEM=ams-auth, length=' + tokenHeader.length + ')');
          proxyReq.removeHeader('token');
          delete req.headers.token;
          delete req.headers.Token;
        }
      }

      const contentType = proxyReq.getHeader('Content-Type') || '';
      if (contentType.startsWith('application/json')) {
        if (!reqSession) {
 packages/server-utilities/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/server-utilities",
  "version": "0.0.1",
  "version": "0.0.24",
  "publishConfig": {
    "registry": "https://nexus.uownleasing.com/repository/npm-hosted/"
  },
 packages/server-utilities/project.json 
+
46
−
0

Visualizado
@@ -34,6 +34,52 @@
      "options": {
        "commitMessageFormat": "${projectName} to ${version} [skip ci]"
      }
    },
    "dev-publish": {
      "executor": "@nrwl/workspace:run-commands",
      "outputs": [],
      "dependsOn": [
        {
          "target": "build",
          "projects": "self"
        }
      ],
      "options": {
        "args": "--preid=",
        "commands": [
          "npm version prerelease --preid={args.preid}",
          {
            "command": "npm publish",
            "forwardAllArgs": false
          },
          "npm view @uownleasing/server-utilities version --registry=https://nexus.uownleasing.com/repository/npm-hosted/"
        ],
        "parallel": false,
        "color": true,
        "cwd": "dist/packages/server-utilities"
      }
    },
    "publish": {
      "executor": "@nrwl/workspace:run-commands",
      "outputs": [],
      "dependsOn": [
        {
          "target": "build",
          "projects": "self"
        }
      ],
      "options": {
        "commands": [
          {
            "command": "npm publish",
            "forwardAllArgs": false
          },
          "npm view @uownleasing/server-utilities version --registry=https://nexus.uownleasing.com/repository/npm-hosted/"
        ],
        "parallel": false,
        "color": true,
        "cwd": "dist/packages/server-utilities"
      }
    }
  },
  "tags": []

---


 21 arquivos
+
1191
−
115
Arquivos
21
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/ams‎

aop/l
‎ogging‎

LoggingAs
‎pect.java‎
+87 -18

con
‎fig‎

WebSecurityCon
‎figuration.java‎
+58 -2

db/rep
‎ository‎

PermissionRe
‎pository.java‎
+5 -0

UserRepos
‎itory.java‎
+10 -0

enume
‎ration‎

PathExpansio
‎nKeyword.java‎
+1 -1

envir
‎onment‎

MeritLi
‎fe.java‎
+97 -19

SuttonP
‎ark.java‎
+146 -0

Uown
‎.java‎
+154 -34

po
‎jo‎

Permission
‎Graph.java‎
+19 -0

ser
‎vice‎

Authorizatio
‎nService.java‎
+93 -4

PermissionGra
‎phBuilder.java‎
+6 -4

PermissionS
‎ervice.java‎
+15 -5

UserServ
‎ice.java‎
+26 -8

w
‎eb‎

 src/main/java/com/uownleasing/ams/aop/logging/LoggingAspect.java 
+
87
−
18

Visualizado
@@ -11,12 +11,17 @@ import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Collection;

/**
 * Aspect for logging execution of service and repository Spring components.
 *
 * By default, it only runs with the "dev" profile.
 */
@Aspect
@@ -49,23 +54,33 @@ public class LoggingAspect {

    @AfterThrowing(pointcut = "applicationPackagePointcut() && springBeanPointcut()", throwing = "e")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable e) {
        if (env.acceptsProfiles(Profiles.of(Constants.SPRING_PROFILE_DEVELOPMENT))) {
            logger(joinPoint)
                .error(
                    "Exception in {}() with cause = \'{}\' and exception = \'{}\'",
                    joinPoint.getSignature().getName(),
                    e.getCause() != null ? e.getCause() : "NULL",
                    e.getMessage(),
                    e
                );
        } else {
            logger(joinPoint)
                .error(
                    "Exception in {}() with cause = {}",
                    joinPoint.getSignature().getName(),
                    e.getCause() != null ? e.getCause() : "NULL"
                );
        Logger log = logger(joinPoint);
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getSignature().getDeclaringTypeName();
        
        // Get request context if available
        String requestInfo = "";
        try {
            RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null && requestAttributes instanceof ServletRequestAttributes) {
                HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
                requestInfo = String.format(" | Request: %s %s", 
                    request.getMethod(), request.getRequestURI());
            }
        } catch (Exception ex) {
            // Ignore if we can't get request context
        }
        
        // Always log full stacktrace in all environments
        log.error(
            "Exception in {}.{}(){} with cause = '{}' and exception = '{}'",
            className,
            methodName,
            requestInfo,
            e.getCause() != null ? e.getCause() : "NULL",
            e.getMessage(),
            e  // Pass exception to include full stacktrace
        );
    }

    @Around("applicationPackagePointcut() && springBeanPointcut()")
@@ -77,7 +92,8 @@ public class LoggingAspect {
        try {
            Object result = joinPoint.proceed();
            if (log.isDebugEnabled()) {
                log.debug("Exit: {}() with result = {}", joinPoint.getSignature().getName(), result);
                String resultString = formatResultForLogging(result, joinPoint);
                log.debug("Exit: {}() with result = {}", joinPoint.getSignature().getName(), resultString);
            }
            return result;
        } catch (IllegalArgumentException e) {
@@ -85,4 +101,57 @@ public class LoggingAspect {
            throw e;
        }
    }

    /**
     * Format result for logging, avoiding huge log entries for large collections or complex objects.
     * For RestController methods, log summaries instead of full objects.
     */
    private String formatResultForLogging(Object result, ProceedingJoinPoint joinPoint) {
        if (result == null) {
            return "null";
        }

        // Check if this is a RestController method
        String className = joinPoint.getSignature().getDeclaringTypeName();
        boolean isRestController = className.contains(".web.rest.") || className.contains("RestController");

        // For RestController methods, provide summaries instead of full object dumps
        if (isRestController) {
            if (result instanceof ResponseEntity) {
                ResponseEntity<?> responseEntity = (ResponseEntity<?>) result;
                Object body = responseEntity.getBody();

                if (body instanceof Collection) {
                    Collection<?> collection = (Collection<?>) body;
                    return String.format("<%d %s %s, [%d items]>",
                            responseEntity.getStatusCodeValue(),
                            responseEntity.getStatusCode().name(),
                            body.getClass().getSimpleName(),
                            collection.size());
                } else if (body != null) {
                    return String.format("<%d %s, %s>",
                            responseEntity.getStatusCodeValue(),
                            responseEntity.getStatusCode().name(),
                            body.getClass().getSimpleName());
                } else {
                    return String.format("<%d %s, null>",
                            responseEntity.getStatusCodeValue(),
                            responseEntity.getStatusCode().name());
                }
            } else if (result instanceof Collection) {
                Collection<?> collection = (Collection<?>) result;
                return String.format("[%d items of %s]", collection.size(),
                        collection.isEmpty() ? "?" : collection.iterator().next().getClass().getSimpleName());
            }
        }

        // For non-RestController methods or simple objects, log normally but limit size
        String resultString = result.toString();
        // Limit result string to 500 characters to avoid huge logs
        if (resultString.length() > 500) {
            return resultString.substring(0, 500) + "... (truncated)";
        }

        return resultString;
    }
}
 src/main/java/com/uownleasing/ams/config/WebSecurityConfiguration.java 
+
58
−
2

Visualizado
@@ -7,11 +7,22 @@ import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableWebSecurity
@@ -38,7 +49,8 @@ public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {
                        .securityContextRepository(hazelcastSecurityContextRepository())
                        .and()
                    .exceptionHandling()
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                        .and()
                    .formLogin()
                        .loginProcessingUrl("/login")
@@ -84,4 +96,48 @@ public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return new AuthenticationEntryPoint() {
            @Override
            public void commence(HttpServletRequest request, HttpServletResponse response,
                    AuthenticationException authException) throws IOException, ServletException {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json");

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("timestamp", Instant.now().toString());
                errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
                errorResponse.put("error", "Unauthorized");
                errorResponse.put("message", authException.getMessage());
                errorResponse.put("path", request.getRequestURI());
                errorResponse.put("exception", authException.getClass().getName());

                response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(errorResponse));
            }
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return new AccessDeniedHandler() {
            @Override
            public void handle(HttpServletRequest request, HttpServletResponse response,
                    AccessDeniedException accessDeniedException) throws IOException, ServletException {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("timestamp", Instant.now().toString());
                errorResponse.put("status", HttpStatus.FORBIDDEN.value());
                errorResponse.put("error", "Forbidden");
                errorResponse.put("message", accessDeniedException.getMessage());
                errorResponse.put("path", request.getRequestURI());
                errorResponse.put("exception", accessDeniedException.getClass().getName());

                response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(errorResponse));
            }
        };
    }

}
 src/main/java/com/uownleasing/ams/db/repository/PermissionRepository.java 
+
5
−
0

Visualizado
@@ -4,6 +4,8 @@ import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.SubSystem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
@@ -17,6 +19,9 @@ public interface PermissionRepository extends JpaRepository<Permission, Long>, J

    List<Permission> findAllBySubSystem(SubSystem subSystem);

    @Query("SELECT p FROM Permission p WHERE p.subSystem.pk = :subSystemPk")
    List<Permission> findAllBySubSystemPk(@Param("subSystemPk") Long subSystemPk);

    Optional<Permission> findOneByNameIgnoreCase(String name);

    Optional<Permission> findByNameIgnoreCaseAndSubSystem(String name, SubSystem sys);
 src/main/java/com/uownleasing/ams/db/repository/UserRepository.java 
+
10
−
0

Visualizado
@@ -4,6 +4,7 @@ import com.uownleasing.ams.db.entity.User;
import org.hibernate.jpa.TypedParameterValue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
@@ -22,6 +23,15 @@ public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificat
    Optional<User> findByEmailAddressIgnoreCase(String email);
    Optional<User> findByPhoneNumber(String phone);
    Optional<User> findByUserNameIgnoreCase(String username);

    @EntityGraph(attributePaths = {"roles", "roles.permissions", "roles.subSystem", "includePermissions", "excludePermissions", "includePermissions.subSystem", "excludePermissions.subSystem"})
    @Query("SELECT u FROM User u WHERE LOWER(u.userName) = LOWER(:username)")
    Optional<User> findByUserNameIgnoreCaseWithPermissions(String username);

    @EntityGraph(attributePaths = {"roles", "roles.permissions", "roles.subSystem", "includePermissions", "excludePermissions", "includePermissions.subSystem", "excludePermissions.subSystem"})
    @Query("SELECT u FROM User u WHERE LOWER(u.emailAddress) = LOWER(:email)")
    Optional<User> findByEmailAddressIgnoreCaseWithPermissions(String email);

    Optional<User> findOneByLoginToken(String token);
    Optional<List<User>> findAllByMerchantCodes(String merchantCodes);

 src/main/java/com/uownleasing/ams/enumeration/PathExpansionKeyword.java 
+
1
−
1

Visualizado
package com.uownleasing.ams.enumeration;

public enum PathExpansionKeyword {
    USER, ROLE
    USER, ROLE, GROUP
}
 src/main/java/com/uownleasing/ams/environment/MeritLife.java 
+
97
−
19

Visualizado
@@ -32,17 +32,65 @@ public class MeritLife extends EnvironmentService {
    protected Map<SystemName, String[][]> getPermissions() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new String[][] {
                {"get_all", "GET", "/**", "Allows read on all resources", "Read Entities"},
                {"put_all", "PUT", "/**", "Allows update on all resources", "Update Entities"},
                {"post_all", "POST", "/**", "Allows add on all resources", "Add Entities"},
                {"delete_all", "DELETE", "/**", "Allows delete on all resource", "Delete entities"},
                // User Management Permissions
                {"user_list", "GET", "/user", "View list of users", "List Users"},
                {"user_read", "GET", "/user/*", "View user details", "Read User"},
                {"user_create", "POST", "/user", "Create user", "Create User"},
                {"user_update", "PUT", "/user/*", "Update user", "Update User"},
                {"user_delete", "DELETE", "/user/*", "Delete user", "Delete User"},
                {"user_roles_modify", "PUT", "/user/*/role", "Modify user roles", "Modify User Roles"},
                {"user_permissions_modify", "PUT", "/user/*/permission", "Modify user permissions", "Modify User Permissions"},
                {"user_group_modify", "PUT", "/user/*/group", "Modify user group", "Modify User Group"},
                {"user_permissions_read", "GET", "/user/*/permission", "View user permissions", "Read User Permissions"},
                {"user_roles_read", "GET", "/user/*/role", "View user roles", "Read User Roles"},
                {"user_group_read", "GET", "/user/*/group", "View user groups", "Read User Groups"},
                {"user_logs_read", "GET", "/user/getLogs/*", "View user logs", "Read User Logs"},
                {"user_logs_by_type_read", "GET", "/user/getLogsByType/*", "View user logs by type", "Read User Logs By Type"},
                {"user_logs_search_read", "GET", "/user/searchLogs/*", "Search user logs", "Search User Logs"},

                {"ams", "access", "ams", "Allows access to ams portal", ""},
                // User Management Permissions - Panel-Specific Permissions
                {"edit_user_panel", "restricted/modify", "edit_user_panel", "Edit user information panel", "Edit User Panel"},
                {"edit_password_panel", "restricted/modify", "edit_password_panel", "Edit password panel", "Edit Password Panel"},
                {"edit_role_permission_panel", "restricted/modify", "edit_role_permission_panel", "Edit role and permission panel", "Edit Role Permission Panel"},
                {"edit_user_permission_panel", "restricted/modify", "edit_user_permission_panel", "Edit user permission panel", "Edit User Permission Panel"},
                {"edit_merchant_panel", "restricted/modify", "edit_merchant_panel", "Edit merchant panel", "Edit Merchant Panel"},
                {"edit_user_group_panel", "restricted/modify", "edit_user_group_panel", "Edit user group panel", "Edit User Group Panel"},
                {"edit_username_panel", "restricted/modify", "edit_username_panel", "Edit username panel", "Edit Username Panel"},
                {"user_unlock", "restricted/modify", "user_unlock", "Unlock user", "Unlock User"},

                // Role Management Permissions
                {"role_list", "GET", "/role", "View list of roles", "List Roles"},
                {"role_read", "GET", "/role/*", "View role details", "Read Role"},
                {"role_create", "POST", "/role", "Create role", "Create Role"},
                {"role_update", "PUT", "/role/*", "Update role", "Update Role"},
                {"role_delete", "DELETE", "/role/*", "Delete role", "Delete Role"},
                {"role_permissions_modify", "PUT", "/role/*/permission", "Modify role permissions", "Modify Role Permissions"},
                {"role_permissions_read", "GET", "/role/*/permission", "View role permissions", "Read Role Permissions"},

                // Permission Management Permissions
                {"permission_list", "GET", "/permission", "View list of permissions", "List Permissions"},
                {"permission_read", "GET", "/permission/*", "View permission details", "Read Permission"},
                {"permission_create", "POST", "/permission", "Create permission", "Create Permission"},
                {"permission_update", "PUT", "/permission/*", "Update permission", "Update Permission"},
                {"permission_delete", "DELETE", "/permission/*", "Delete permission", "Delete Permission"},

                // Group Management Permissions
                {"group_list", "GET", "/group", "View list of groups", "List Groups"},
                {"group_read", "GET", "/group/*", "View group details", "Read Group"},
                {"group_create", "POST", "/group", "Create group", "Create Group"},
                {"group_update", "PUT", "/group/*", "Update group", "Update Group"},
                {"group_delete", "DELETE", "/group/*", "Delete group", "Delete Group"},
                {"group_users_read", "GET", "/group/*/getUsers", "View users in group", "Read Group Users"},
                {"group_all_with_users_read", "GET", "/group/getAllGroupsWithUsers", "View all groups with users", "Read All Groups With Users"},

                // Authorization Check Permission
                {"auth_check", "POST", "/authorization/check/*", "Check user authorization", "Check Authorization"},

                // MeritLife-specific Permissions
                {"ams_portal_access", "access", "ams_portal_access", "Access to AMS portal", "AMS Portal Access"},
                {"dms", "access", "dms", "Allows access to dms portal", ""},
                {"review queue [modify]", "modify", "dms/create_or_update_review_queue", "", ""},
                {"upload correspondence", "modify", "dms/upload_correspondence", "", ""},

                {"logs", "access", "logs", "Allows access to logs", ""}
            })
        );
@@ -51,23 +99,53 @@ public class MeritLife extends EnvironmentService {
    protected Map<SystemName, DefaultRole[]> getRoles() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new DefaultRole[] {
                new DefaultRole(RoleName.ADMIN, "",
                new DefaultRole(RoleName.ADMIN, "Full AMS access",
                    null,
                    List.of("get_all", "put_all", "post_all", "delete_all",
                        "ams",

                        "dms",
                        "review queue [modify]",
                        "upload correspondence",
                    List.of(
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // All role management permissions
                        "role_list", "role_read", "role_create", "role_update", "role_delete", "role_permissions_modify",
                        // All permission management permissions
                        "permission_list", "permission_read", "permission_create", "permission_update", "permission_delete",
                        // All group management permissions
                        "group_list", "group_read", "group_create", "group_update", "group_delete",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check",
                        // MeritLife-specific permissions
                        "ams_portal_access", "dms", "review queue [modify]", "upload correspondence", "logs"
                    ), "", true),

                        "logs"), "", true),
                new DefaultRole(RoleName.MANAGER, "",
                new DefaultRole(RoleName.MANAGER, "User and role management",
                    null,
                    List.of(
                        "dms",
                        "review queue [modify]",
                        "upload correspondence"
                        ), "", true)
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // Role management (no delete)
                        "role_list", "role_read", "role_create", "role_update",
                        // Permission viewing only
                        "permission_list",
                        // Group management
                        "group_list", "group_read", "group_create", "group_update",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // MeritLife-specific permissions
                        "ams_portal_access", "dms", "review queue [modify]", "upload correspondence"
                    ), "", true)
            })
        );
    }
 src/main/java/com/uownleasing/ams/environment/SuttonPark.java 
+
146
−
0

Visualizado
@@ -27,6 +27,62 @@ public class SuttonPark extends EnvironmentService {
    protected Map<SystemName, String[][]> getPermissions() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new String[][] {
                // User Management Permissions
                {"user_list", "GET", "/user", "View list of users", "List Users"},
                {"user_read", "GET", "/user/*", "View user details", "Read User"},
                {"user_create", "POST", "/user", "Create user", "Create User"},
                {"user_update", "PUT", "/user/*", "Update user", "Update User"},
                {"user_delete", "DELETE", "/user/*", "Delete user", "Delete User"},
                {"user_roles_modify", "PUT", "/user/*/role", "Modify user roles", "Modify User Roles"},
                {"user_permissions_modify", "PUT", "/user/*/permission", "Modify user permissions", "Modify User Permissions"},
                {"user_group_modify", "PUT", "/user/*/group", "Modify user group", "Modify User Group"},
                {"user_permissions_read", "GET", "/user/*/permission", "View user permissions", "Read User Permissions"},
                {"user_roles_read", "GET", "/user/*/role", "View user roles", "Read User Roles"},
                {"user_group_read", "GET", "/user/*/group", "View user groups", "Read User Groups"},
                {"user_logs_read", "GET", "/user/getLogs/*", "View user logs", "Read User Logs"},
                {"user_logs_by_type_read", "GET", "/user/getLogsByType/*", "View user logs by type", "Read User Logs By Type"},
                {"user_logs_search_read", "GET", "/user/searchLogs/*", "Search user logs", "Search User Logs"},

                // User Management Permissions - Panel-Specific Permissions
                {"edit_user_panel", "restricted/modify", "edit_user_panel", "Edit user information panel", "Edit User Panel"},
                {"edit_password_panel", "restricted/modify", "edit_password_panel", "Edit password panel", "Edit Password Panel"},
                {"edit_role_permission_panel", "restricted/modify", "edit_role_permission_panel", "Edit role and permission panel", "Edit Role Permission Panel"},
                {"edit_user_permission_panel", "restricted/modify", "edit_user_permission_panel", "Edit user permission panel", "Edit User Permission Panel"},
                {"edit_merchant_panel", "restricted/modify", "edit_merchant_panel", "Edit merchant panel", "Edit Merchant Panel"},
                {"edit_user_group_panel", "restricted/modify", "edit_user_group_panel", "Edit user group panel", "Edit User Group Panel"},
                {"edit_username_panel", "restricted/modify", "edit_username_panel", "Edit username panel", "Edit Username Panel"},
                {"user_unlock", "restricted/modify", "user_unlock", "Unlock user", "Unlock User"},

                // Role Management Permissions
                {"role_list", "GET", "/role", "View list of roles", "List Roles"},
                {"role_read", "GET", "/role/*", "View role details", "Read Role"},
                {"role_create", "POST", "/role", "Create role", "Create Role"},
                {"role_update", "PUT", "/role/*", "Update role", "Update Role"},
                {"role_delete", "DELETE", "/role/*", "Delete role", "Delete Role"},
                {"role_permissions_modify", "PUT", "/role/*/permission", "Modify role permissions", "Modify Role Permissions"},
                {"role_permissions_read", "GET", "/role/*/permission", "View role permissions", "Read Role Permissions"},

                // Permission Management Permissions
                {"permission_list", "GET", "/permission", "View list of permissions", "List Permissions"},
                {"permission_read", "GET", "/permission/*", "View permission details", "Read Permission"},
                {"permission_create", "POST", "/permission", "Create permission", "Create Permission"},
                {"permission_update", "PUT", "/permission/*", "Update permission", "Update Permission"},
                {"permission_delete", "DELETE", "/permission/*", "Delete permission", "Delete Permission"},

                // Group Management Permissions
                {"group_list", "GET", "/group", "View list of groups", "List Groups"},
                {"group_read", "GET", "/group/*", "View group details", "Read Group"},
                {"group_create", "POST", "/group", "Create group", "Create Group"},
                {"group_update", "PUT", "/group/*", "Update group", "Update Group"},
                {"group_delete", "DELETE", "/group/*", "Delete group", "Delete Group"},
                {"group_users_read", "GET", "/group/*/getUsers", "View users in group", "Read Group Users"},
                {"group_all_with_users_read", "GET", "/group/getAllGroupsWithUsers", "View all groups with users", "Read All Groups With Users"},

                // Authorization Check Permission
                {"auth_check", "POST", "/authorization/check/*", "Check user authorization", "Check Authorization"},

                // AMS Portal Access Permission
                {"ams_portal_access", "access", "ams_portal_access", "Access to AMS portal", "AMS Portal Access"}
            }),

            Map.entry(SystemName.ORIGINATION, new String[][] {
@@ -42,6 +98,96 @@ public class SuttonPark extends EnvironmentService {

    protected Map<SystemName, DefaultRole[]> getRoles() {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new DefaultRole[]{
                new DefaultRole(RoleName.ADMIN, "Full AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // All role management permissions
                        "role_list", "role_read", "role_create", "role_update", "role_delete", "role_permissions_modify",
                        // All permission management permissions
                        "permission_list", "permission_read", "permission_create", "permission_update", "permission_delete",
                        // All group management permissions
                        "group_list", "group_read", "group_create", "group_update", "group_delete",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.MANAGER, "User and role management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // Role management (no delete)
                        "role_list", "role_read", "role_create", "role_update",
                        // Permission viewing only
                        "permission_list",
                        // Group management
                        "group_list", "group_read", "group_create", "group_update",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.SUPERVISOR, "Limited user management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing and unlock only
                        "user_list", "user_read", "user_unlock",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing
                        "permission_list", "permission_read",
                        // Group viewing only
                        "group_list", "group_read",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.AGENT, "Read-only AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing only
                        "user_list", "user_read",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing only
                        "permission_list",
                        // Newly added read endpoints (read-only)
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.AUDITOR, "No AMS access", null,
                    List.of(),
                    "", true)
            }),

            Map.entry(SystemName.ORIGINATION, new DefaultRole[] {
                new DefaultRole(RoleName.ADMIN, "",
                    null,
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
154
−
34

Visualizado
@@ -30,11 +30,62 @@ public class Uown extends EnvironmentService {
        return Map.ofEntries(
            Map.entry(SystemName.AMS, new String[][]{

                {"get_all", "GET", "/**", "Allows read on all resources", "Read Entities"},
                {"put_all", "PUT", "/**", "Allows update on all resources", "Update Entities"},
                {"post_all", "POST", "/**", "Allows add on all resources", "Add Entities"},
                {"delete_all", "DELETE", "/**", "Allows delete on all resource", "Delete entities"}
//                        {"auth_check_self", "POST", "/authorization/check/{USER}", "Check what a user is authorized to access", ""}
                // User Management Permissions
                {"user_list", "GET", "/user", "View list of users", "List Users"},
                {"user_read", "GET", "/user/*", "View user details", "Read User"},
                {"user_create", "POST", "/user", "Create user", "Create User"},
                {"user_update", "PUT", "/user/*", "Update user", "Update User"},
                {"user_delete", "DELETE", "/user/*", "Delete user", "Delete User"},
                {"user_roles_modify", "PUT", "/user/*/role", "Modify user roles", "Modify User Roles"},
                {"user_permissions_modify", "PUT", "/user/*/permission", "Modify user permissions", "Modify User Permissions"},
                {"user_group_modify", "PUT", "/user/*/group", "Modify user group", "Modify User Group"},
                {"user_permissions_read", "GET", "/user/*/permission", "View user permissions", "Read User Permissions"},
                {"user_roles_read", "GET", "/user/*/role", "View user roles", "Read User Roles"},
                {"user_group_read", "GET", "/user/*/group", "View user groups", "Read User Groups"},
                {"user_logs_read", "GET", "/user/getLogs/*", "View user logs", "Read User Logs"},
                {"user_logs_by_type_read", "GET", "/user/getLogsByType/*", "View user logs by type", "Read User Logs By Type"},
                {"user_logs_search_read", "GET", "/user/searchLogs/*", "Search user logs", "Search User Logs"},

                // User Management Permissions - Panel-Specific Permissions
                {"edit_user_panel", "restricted/modify", "edit_user_panel", "Edit user information panel", "Edit User Panel"},
                {"edit_password_panel", "restricted/modify", "edit_password_panel", "Edit password panel", "Edit Password Panel"},
                {"edit_role_permission_panel", "restricted/modify", "edit_role_permission_panel", "Edit role and permission panel", "Edit Role Permission Panel"},
                {"edit_user_permission_panel", "restricted/modify", "edit_user_permission_panel", "Edit user permission panel", "Edit User Permission Panel"},
                {"edit_merchant_panel", "restricted/modify", "edit_merchant_panel", "Edit merchant panel", "Edit Merchant Panel"},
                {"edit_user_group_panel", "restricted/modify", "edit_user_group_panel", "Edit user group panel", "Edit User Group Panel"},
                {"edit_username_panel", "restricted/modify", "edit_username_panel", "Edit username panel", "Edit Username Panel"},
                {"user_unlock", "restricted/modify", "user_unlock", "Unlock user", "Unlock User"},

                // Role Management Permissions
                {"role_list", "GET", "/role", "View list of roles", "List Roles"},
                {"role_read", "GET", "/role/*", "View role details", "Read Role"},
                {"role_create", "POST", "/role", "Create role", "Create Role"},
                {"role_update", "PUT", "/role/*", "Update role", "Update Role"},
                {"role_delete", "DELETE", "/role/*", "Delete role", "Delete Role"},
                {"role_permissions_modify", "PUT", "/role/*/permission", "Modify role permissions", "Modify Role Permissions"},
                {"role_permissions_read", "GET", "/role/*/permission", "View role permissions", "Read Role Permissions"},

                // Permission Management Permissions
                {"permission_list", "GET", "/permission", "View list of permissions", "List Permissions"},
                {"permission_read", "GET", "/permission/*", "View permission details", "Read Permission"},
                {"permission_create", "POST", "/permission", "Create permission", "Create Permission"},
                {"permission_update", "PUT", "/permission/*", "Update permission", "Update Permission"},
                {"permission_delete", "DELETE", "/permission/*", "Delete permission", "Delete Permission"},

                // Group Management Permissions
                {"group_list", "GET", "/group", "View list of groups", "List Groups"},
                {"group_read", "GET", "/group/*", "View group details", "Read Group"},
                {"group_create", "POST", "/group", "Create group", "Create Group"},
                {"group_update", "PUT", "/group/*", "Update group", "Update Group"},
                {"group_delete", "DELETE", "/group/*", "Delete group", "Delete Group"},
                {"group_users_read", "GET", "/group/*/getUsers", "View users in group", "Read Group Users"},
                {"group_all_with_users_read", "GET", "/group/getAllGroupsWithUsers", "View all groups with users", "Read All Groups With Users"},

                // Authorization Check Permission
                {"auth_check", "POST", "/authorization/check/*", "Check user authorization", "Check Authorization"},

                // AMS Portal Access Permission
                {"ams_portal_access", "access", "ams_portal_access", "Access to AMS portal", "AMS Portal Access"}
            }),

            Map.entry(SystemName.SERVICING, new String[][] {
@@ -137,12 +188,6 @@ public class Uown extends EnvironmentService {
                {"payment_update [modify]", "modify", "payment_history/update_payment", "", ""},
                {"phone_history [access]", "access", "phone_history", "", ""},

                {"ams [access]", "access", "ams", "", ""},
                {"ams unlock user [modify]", "access", "ams_unlock", "", ""},
                {"ams access user panel [access]", "access", "ams_user_panel", "", ""},
                {"ams edit user panel [modify]", "modify", "ams_user_panel/edit", "", ""},
                {"ams modify user", "access", "modify user", "", ""},

                {"pw request affordability", "modify", "customer_information/pw_request_affordability", "", ""},
                {"pw confirm allocation", "modify", "customer_information/pw_confirm_allocation", "", ""},

@@ -340,13 +385,6 @@ public class Uown extends EnvironmentService {

                {"view lead recordings", "restricted/view/full", "recording", "", ""},

                {"ams [access]", "access", "ams", "", ""},
                {"ams unlock user [modify]", "modify", "ams_unlock", "", ""},
                {"ams access user panel [access]", "access", "ams_user_panel", "", ""},
                {"ams edit user panel [modify]", "modify", "ams_user_panel/edit", "", ""},
                {"ams modify user", "access", "modify_user", "", ""},


                {"leads [view]", "access", "leads", "", ""},
                {"leads get_basic_merchant_info_by_ref_code [modify]", "modify", "leads/get_basic_merchant_info_by_ref_code", "", ""},
                {"leads email csv", "modify", "leads/email_csv", "", ""},
@@ -367,10 +405,100 @@ public class Uown extends EnvironmentService {
    protected Map<SystemName, DefaultRole[]> getRoles() {
        return Map.ofEntries(

            Map.entry(SystemName.AMS, new DefaultRole[]{
                new DefaultRole(RoleName.ADMIN, "Full AMS access", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // All role management permissions
                        "role_list", "role_read", "role_create", "role_update", "role_delete", "role_permissions_modify",
                        // All permission management permissions
                        "permission_list", "permission_read", "permission_create", "permission_update", "permission_delete",
                        // All group management permissions
                        "group_list", "group_read", "group_create", "group_update", "group_delete",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read",
                        // Authorization check
                        "auth_check"
                    ),
                    "", true),

                new DefaultRole(RoleName.MANAGER, "User and role management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // All user management permissions
                        "user_list", "user_read", "user_create", "user_update", "user_delete",
                        "user_unlock", "user_roles_modify", "user_permissions_modify", "user_group_modify",
                        // All user management permissions - Panel Permissions
                        "edit_user_panel", "edit_password_panel", "edit_role_permission_panel",
                        "edit_user_permission_panel", "edit_merchant_panel", "edit_user_group_panel", "edit_username_panel",
                        // Role management (no delete)
                        "role_list", "role_read", "role_create", "role_update",
                        // Permission viewing only
                        "permission_list",
                        // Group management
                        "group_list", "group_read", "group_create", "group_update",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "user_logs_by_type_read", "user_logs_search_read",
                        "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.SUPERVISOR, "Limited user management", null,
                    List.of(
                        // AMS Portal Access
                        "ams_portal_access",
                        // User viewing and unlock only
                        "user_list", "user_read", "user_unlock",
                        // Role viewing only
                        "role_list", "role_read",
                        // Permission viewing
                        "permission_list", "permission_read",
                        // Group viewing only
                        "group_list", "group_read",
                        // User read permissions
                        "user_permissions_read", "user_roles_read", "user_group_read",
                        "user_logs_read", "role_permissions_read", "group_users_read", "group_all_with_users_read"
                    ),
                    "", true),

                new DefaultRole(RoleName.AGENT, "Read-only AMS access", null,
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

                new DefaultRole(RoleName.AUDITOR, "No AMS access", null,
                    List.of(),
                    "", true)
            }),

            Map.entry(SystemName.SERVICING, new DefaultRole[]{
                new DefaultRole(RoleName.ADMIN, "",
                    null,
                    List.of("get_all", "put_all", "post_all", "delete_all"),
                    List.of(),
                    "", true),

                new DefaultRole(RoleName.MANAGER, "", List.of(
@@ -443,10 +571,6 @@ public class Uown extends EnvironmentService {
                    "payment_update [modify]",
                    "phone_history [access]",

                    "ams [access]",
                    "ams unlock user [modify]",
                    "ams access user panel [access]",
                    "ams edit user panel [modify]",
                    "pw request affordability",
                    "pw confirm allocation",
                    "send review",
@@ -504,9 +628,8 @@ public class Uown extends EnvironmentService {
                    "email_history [access]",
                    "items_history [access]",
                    "payment_history, [access]",
                    "phone_history [access]",
                    "phone_history [access]"

                    "ams [access]"
                ),
                    null, "", true),

@@ -555,7 +678,6 @@ public class Uown extends EnvironmentService {
                    "payment_history, [access]",
                    "phone_history [access]",

                    "ams [access]",
                    "view charge fee"
                ),
                    null, "", true),
@@ -594,7 +716,7 @@ public class Uown extends EnvironmentService {
                new DefaultRole(RoleName.ADMIN, "", List.of(
                    "error log [access]"
                ),
                    List.of("get_all", "put_all", "post_all", "delete_all"),
                    List.of(),
                    "", true),

                new DefaultRole(RoleName.MANAGER, "", List.of(
@@ -726,11 +848,6 @@ public class Uown extends EnvironmentService {
                    "run underwriting [modify]",
                    "add lease",

                    "ams [access]",
                    "ams unlock user [modify]",
                    "ams access user panel [access]",
                    "ams edit user panel [modify]",

                    "rebate [access]",
                    "get merchant rebate amount",
                    "rebate email csv",
@@ -835,8 +952,6 @@ public class Uown extends EnvironmentService {
                    "merchant programs [modify]",
                    "get merchant programs [access]",

                    "ams [access]",

                    "overview get_merchant_by_ref_code [modify]",
                    "overview get_basic_merchant_info_by_ref_code [modify]",
                    "overview merchant_location [modify]",
@@ -1008,6 +1123,7 @@ public class Uown extends EnvironmentService {

            new DefaultUser("superadmin", "", "*", "superadmin@fakeemail.com",
                Map.ofEntries(
                    Map.entry(SystemName.AMS, List.of(RoleName.ADMIN)),
                    Map.entry(SystemName.SERVICING, List.of(RoleName.MANAGER, RoleName.ADMIN)),
                    Map.entry(SystemName.ORIGINATION, List.of(RoleName.MANAGER, RoleName.ADMIN))),

@@ -1015,6 +1131,7 @@ public class Uown extends EnvironmentService {

            new DefaultUser("manager", "", "*", "manager@fakeemail.com",
                Map.ofEntries(
                    Map.entry(SystemName.AMS, List.of(RoleName.MANAGER)),
                    Map.entry(SystemName.SERVICING, List.of(RoleName.MANAGER, RoleName.ADMIN)),
                    Map.entry(SystemName.ORIGINATION, List.of(RoleName.MANAGER, RoleName.ADMIN))),

@@ -1022,6 +1139,7 @@ public class Uown extends EnvironmentService {

            new DefaultUser("supervisor", "", "*", "supervisor@fakeemail.com",
                Map.ofEntries(
                    Map.entry(SystemName.AMS, List.of(RoleName.SUPERVISOR)),
                    Map.entry(SystemName.SERVICING, List.of(RoleName.SUPERVISOR)),
                    Map.entry(SystemName.ORIGINATION, List.of(RoleName.SUPERVISOR))),

@@ -1029,6 +1147,7 @@ public class Uown extends EnvironmentService {

            new DefaultUser("agent", "", "*", "agent@fakeemail.com",
                Map.ofEntries(
                    Map.entry(SystemName.AMS, List.of(RoleName.AGENT)),
                    Map.entry(SystemName.SERVICING, List.of(RoleName.AGENT)),
                    Map.entry(SystemName.ORIGINATION, List.of(RoleName.AGENT))),

@@ -1036,6 +1155,7 @@ public class Uown extends EnvironmentService {

            new DefaultUser("auditor", "", "*", "auditor@fakeemail.com",
                Map.ofEntries(
                    Map.entry(SystemName.AMS, List.of(RoleName.AUDITOR)),
                    Map.entry(SystemName.SERVICING, List.of(RoleName.AUDITOR)),
                    Map.entry(SystemName.ORIGINATION, List.of(RoleName.AUDITOR))),
 src/main/java/com/uownleasing/ams/pojo/PermissionGraph.java 
+
19
−
0

Visualizado
@@ -6,6 +6,8 @@ import com.hazelcast.nio.serialization.DataSerializable;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.util.Optional;
@@ -13,6 +15,7 @@ import java.util.Optional;
@Getter
@Setter
public class PermissionGraph implements DataSerializable {
    private static final Logger LOG = LogManager.getLogger(PermissionGraph.class);
    private PermissionGraphNode root;

    public PermissionGraph() {
@@ -20,14 +23,23 @@ public class PermissionGraph implements DataSerializable {
    }

    public Optional<PermissionGraphNode> findNodeByPath(String path) {
        LOG.debug("[PermissionGraph][findNodeByPath] Searching for path: {}", path);
        
        if(path.equals("/")) {
            LOG.debug("[PermissionGraph][findNodeByPath] Path is root, returning root node");
            return Optional.of(root);
        }

        String[] pathComponents = StringUtils.split(path, '/');
        PermissionGraphNode currNode = root;
        StringBuilder currentPathBuilder = new StringBuilder();

        for(String component: pathComponents) {
            currentPathBuilder.append("/").append(component);
            String currentPath = currentPathBuilder.toString();
            
            LOG.trace("[PermissionGraph][findNodeByPath] Processing component: {}, currentPath: {}, availableChildren: {}", 
                    component, currentPath, currNode.getChildren().keySet());

            // NOTE: wildcarded paths have less precedence than specific paths as the specific paths are generally used
            // as an exception rule in conjunction with wildcard paths
@@ -35,23 +47,30 @@ public class PermissionGraph implements DataSerializable {
            //specific path component name
            if(currNode.getChildren().containsKey(component)) {
                currNode = currNode.children.get(component);
                LOG.trace("[PermissionGraph][findNodeByPath] Found specific match for component: {}, continuing", component);
                continue;
            }

            //wildcard notation for all paths component within the same depth
            if(currNode.getChildren().containsKey("*")) {
                currNode = currNode.children.get("*");
                LOG.trace("[PermissionGraph][findNodeByPath] Using wildcard (*) match for component: {}, continuing", component);
                continue;
            }

            //wildcard notation for all path components deeper than this depth
            if(currNode.getChildren().containsKey("**")) {
                LOG.debug("[PermissionGraph][findNodeByPath] Using deep wildcard (**) match at path: {}", currentPath);
                return Optional.of(currNode.children.get("**"));
            }

            //cannot reach path from this node
            LOG.warn("[PermissionGraph][findNodeByPath] No matching node found at component: {}, path: {}, availableChildren: {}", 
                    component, currentPath, currNode.getChildren().keySet());
            return Optional.empty();
        }
        
        LOG.debug("[PermissionGraph][findNodeByPath] Path found: {}", path);
        return Optional.of(currNode);
    }

 src/main/java/com/uownleasing/ams/service/AuthorizationService.java 
+
93
−
4

Visualizado
@@ -14,10 +14,12 @@ import com.uownleasing.ams.web.security.LoginHandler;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@@ -50,42 +52,118 @@ public class AuthorizationService {
    //executes completely = allowed to process
    public void canAccessOrElseThrow(PermissionDetails permissionDetails, String action, String target) throws AccessDeniedException {

        LOG.debug("[AuthorizationService][canAccessOrElseThrow] Checking access: method={}, path={}", action, target);

        PermissionGraph graph = permissionDetails.getPermissionGraph();

        PermissionGraphNode node = graph.findNodeByPath(target).orElseThrow(() -> new AccessDeniedException(String.format("No permission node found for the target resource %s", target)));
        Optional<PermissionGraphNode> nodeOpt = graph.findNodeByPath(target);
        if (nodeOpt.isEmpty()) {
            LOG.warn("[AuthorizationService][canAccessOrElseThrow] No permission node found for target: method={}, path={}", action, target);
            throw new AccessDeniedException(String.format("No permission node found for the target resource %s", target));
        }

        PermissionGraphNode node = nodeOpt.get();
        LOG.debug("[AuthorizationService][canAccessOrElseThrow] Node found for path={}, checking actions", target);

        // deny permissions take higher precedence
        if(node.hasDeniedAction(action)) {
            LOG.warn("[AuthorizationService][canAccessOrElseThrow] Action denied: method={}, path={}", action, target);
            throw new AccessDeniedException(String.format("No permission for action %s on resource %s", action, target));
        }

        if(!node.hasGrantedAction(action)) {
            LOG.warn("[AuthorizationService][canAccessOrElseThrow] Action not granted: method={}, path={}, grantedActions={}", action, target, node.getGrantedActions());
            throw new AccessDeniedException(String.format("No permission for action %s on resource %s", action, target));
        }

        LOG.debug("[AuthorizationService][canAccessOrElseThrow] Access granted: method={}, path={}", action, target);
    }

    @Cacheable(value = "permissionGraphs", key = "#user.userName + ':ams-auth'")
    public PermissionDetails getPermissionDetails(User user) {
        long methodStartTime = System.currentTimeMillis();
        LOG.info("[getPermissionDetails] CACHE MISS - Building permission graph for user: {} (ams-auth subsystem)", user.getUserName());

        PermissionDetails details = new PermissionDetails();
        Set<Permission> permSet = getUserAMSPermissions(user);
        details.setPermissionSet(permSet);

        long start = System.currentTimeMillis();
        LOG.info("[getPermissionDetails] User: {}, Permission count: {}", user.getUserName(), permSet.size());

        long graphBuildStartTime = System.currentTimeMillis();
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, permSet));
        long graphBuildTime = System.currentTimeMillis() - graphBuildStartTime;

        long totalTime = System.currentTimeMillis() - methodStartTime;
        LOG.info("[getPermissionDetails] CACHE MISS - Permission graph built for user: {} in {} ms (graph build: {} ms, total: {} ms)",
                user.getUserName(), graphBuildTime, graphBuildTime, totalTime);

        return details;
    }

    @Cacheable(value = "permissionGraphs", key = "#user.userName + ':' + #subSystem.name")
    public PermissionDetails getPermissionDetails(User user, SubSystem subSystem) {
        long methodStartTime = System.currentTimeMillis();
        LOG.info("[getPermissionDetails] CACHE MISS - Building permission graph for user: {} subsystem: {}",
                user.getUserName(), subSystem.getName());

        PermissionDetails details = new PermissionDetails();
        Set<Permission> permSet = getUserPermissions(user, subSystem);
        details.setPermissionSet(permSet);

        LOG.info("[getPermissionDetails] User: {}, Subsystem: {}, Permission count: {}",
                user.getUserName(), subSystem.getName(), permSet.size());

        //TODO: cache per user if permission graph building becomes costly
        long graphBuildStartTime = System.currentTimeMillis();
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, permSet));
        long graphBuildTime = System.currentTimeMillis() - graphBuildStartTime;

        LOG.debug("Permission graph for user: {} built in: {} milliseconds", user.getUserName(), System.currentTimeMillis() - start);
        long totalTime = System.currentTimeMillis() - methodStartTime;
        LOG.info("[getPermissionDetails] CACHE MISS - Permission graph built for user: {} subsystem: {} in {} ms (graph build: {} ms, total: {} ms)",
                user.getUserName(), subSystem.getName(), graphBuildTime, graphBuildTime, totalTime);

        return details;
    }

    @Cacheable(value = "permissionGraphs", key = "#user.userName + ':ams-merged'")
    public PermissionDetails getMergedAMSPermissionDetails(User user, Set<Permission> subsystemPerms, Set<Permission> amsPerms) {
        long methodStartTime = System.currentTimeMillis();
        LOG.info("[getMergedAMSPermissionDetails] CACHE MISS - Building merged permission graph for user: {} (AMS portal)", user.getUserName());

        PermissionDetails details = new PermissionDetails();

        Set<Permission> allPerms = new HashSet<>();
        allPerms.addAll(subsystemPerms);
        allPerms.addAll(amsPerms);
        details.setPermissionSet(allPerms);

        LOG.info("[getMergedAMSPermissionDetails] User: {}, Subsystem permissions: {}, AMS permissions: {}, Total permissions: {}",
                user.getUserName(), subsystemPerms.size(), amsPerms.size(), allPerms.size());

        long graphBuildStartTime = System.currentTimeMillis();
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, allPerms));
        long graphBuildTime = System.currentTimeMillis() - graphBuildStartTime;

        long totalTime = System.currentTimeMillis() - methodStartTime;
        LOG.info("[getMergedAMSPermissionDetails] CACHE MISS - Merged permission graph built for user: {} in {} ms (graph build: {} ms, total: {} ms)",
                user.getUserName(), graphBuildTime, graphBuildTime, totalTime);

        return details;
    }

    public Set<Permission> getUserPermissions(User user, SubSystem system) {
        long startTime = System.currentTimeMillis();

        //unpack roles and return all permissions
        Set<Permission> permissions = new HashSet<>();

        int roleCount = user.getRoles().size();
        int totalRolePermissions = 0;

        //TODO: duplication/shadowing checks for permission under roles?
        for(Role role: user.getRoles()) {
            int rolePermCount = role.getPermissions().size();
            totalRolePermissions += rolePermCount;
            for (Permission perm : role.getPermissions()) {
                if (perm.getSubSystem().equals(system)) {
                    permissions.add(perm);
@@ -94,6 +172,7 @@ public class AuthorizationService {
        }

        //include extra permission
        int includePermCount = user.getIncludePermissions().size();
        for(Permission perm: user.getIncludePermissions()) {
            if(perm.getSubSystem().equals(system)) {
                permissions.add(perm);
@@ -101,12 +180,22 @@ public class AuthorizationService {
        }

        //take away certain permissions
        int excludePermCount = user.getExcludePermissions().size();
        for(Permission perm: user.getExcludePermissions()) {
            if(perm.getSubSystem().equals(system)) {
                permissions.remove(perm);
            }
        }

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > 100) {
            LOG.info("[getUserPermissions] Slow permission extraction - User: {}, Subsystem: {}, Roles: {}, Role permissions: {}, Include: {}, Exclude: {}, Final count: {}, Time: {} ms",
                    user.getUserName(), system.getName(), roleCount, totalRolePermissions, includePermCount, excludePermCount, permissions.size(), elapsedTime);
        } else {
            LOG.debug("[getUserPermissions] User: {}, Subsystem: {}, Roles: {}, Final permissions: {}, Time: {} ms",
                    user.getUserName(), system.getName(), roleCount, permissions.size(), elapsedTime);
        }

        return permissions;
    }

 src/main/java/com/uownleasing/ams/service/PermissionGraphBuilder.java 
+
6
−
4

Visualizado
@@ -86,11 +86,11 @@ public class PermissionGraphBuilder {

        PathExpansionKeyword expansionKeyword = null;
        try {
            expansionKeyword = PathExpansionKeyword.valueOf(keyword);
            expansionKeyword = PathExpansionKeyword.valueOf(keyword.toUpperCase());
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            LOG.warn("Path expansion syntax detected but not a valid keyword: {}. Treating as normal component name...", keyword);
            return List.of(keyword);
            // Unknown placeholders like {name} should expand to wildcard (*) to match any value
            LOG.debug("Path expansion keyword '{}' not found in enum. Expanding to wildcard (*) for generic matching.", keyword);
            return List.of("*");
        }

        switch (expansionKeyword) {
@@ -98,6 +98,8 @@ public class PermissionGraphBuilder {
                return List.of(user.getUserName());
            case ROLE:
                return user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
            case GROUP:
                return List.of("*");
            default:
                //can this even happen?
                return List.of(keyword);
 src/main/java/com/uownleasing/ams/service/PermissionService.java 
+
15
−
5

Visualizado
@@ -6,11 +6,14 @@ import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.SubSystem;
import com.uownleasing.ams.db.repository.PermissionRepository;
import com.uownleasing.ams.error.exception.NotFoundException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@@ -18,6 +21,8 @@ import java.util.Optional;
@Transactional
public class PermissionService extends RequestContextAwareService{

    private static final Logger LOG = LogManager.getLogger(PermissionService.class);

    @Autowired
    PermissionRepository permissionRepository;

@@ -26,15 +31,20 @@ public class PermissionService extends RequestContextAwareService{

    public List<Permission> getAllPermissions() {
        SubSystem subSystem = getCurrentContextSubSystem();
        if(subSystem.isAMS()) {
            return permissionRepository.findAll();
        } else {
            return permissionRepository.findAllBySubSystem(subSystem);
        if (subSystem == null) {
            LOG.warn("[PermissionService][getAllPermissions] SubSystem is null, cannot retrieve permissions");
            return Collections.emptyList();
        }
        LOG.debug("[PermissionService][getAllPermissions] Retrieving permissions for subsystem: {} (pk: {})", 
            subSystem.getName(), subSystem.getPk());
        return permissionRepository.findAllBySubSystemPk(subSystem.getPk());
    }

    public List<Permission> getAllPermissionsBySubSystem(SubSystem subSystem) {
        return permissionRepository.findAllBySubSystem(subSystem);
        if (subSystem == null) {
            return Collections.emptyList();
        }
        return permissionRepository.findAllBySubSystemPk(subSystem.getPk());
    }

    public Optional<Permission> getPermissionByName(String name) {
 src/main/java/com/uownleasing/ams/service/UserService.java 
+
26
−
8

Visualizado
@@ -20,6 +20,7 @@ import org.hibernate.type.StandardBasicTypes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@@ -67,6 +68,13 @@ public class UserService extends RequestContextAwareService{
    @Autowired
    private EnvironmentUtils environmentUtils;

    /**
     * @deprecated This list is deprecated and will be removed in Phase 4.
     * These old AMS permission names have been removed from Origination/Servicing subsystems.
     * Users now get AMS permissions via AMS subsystem roles (user_list, user_unlock, etc.)
     * TODO: Phase 4 - Remove this list along with setAmsPerm() method
     */
    @Deprecated
    private final List<String> amsPermNames = List.of("ams [access]", "ams modify user", "ams unlock user [modify]");

    public Page<User> getAllUsers(Pageable pageable) {
@@ -81,10 +89,18 @@ public class UserService extends RequestContextAwareService{
        return userRepository.findByUserNameIgnoreCase(username);
    }

    public Optional<User> getUserByUserNameWithPermissions(String username) {
        return userRepository.findByUserNameIgnoreCaseWithPermissions(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmailAddressIgnoreCase(email);
    }

    public Optional<User> getUserByEmailWithPermissions(String email) {
        return userRepository.findByEmailAddressIgnoreCaseWithPermissions(email);
    }

    public User getUserByEmailOrPhone(String search) {
        User user = getUserByEmail(search).orElse(null);
        user = user == null ? userRepository.findByPhoneNumber(search).orElse(null) : user;
@@ -228,11 +244,7 @@ public class UserService extends RequestContextAwareService{
            SubSystem ams = subSystemService.getSubSystemByName("ams-auth").orElseThrow(() -> new NotFoundException("Subsystem not found"));

            List<Permission> amsPerms = List.of(
                permissionService.getPermissionByNameAndSubSystem("get_all", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")),
                permissionService.getPermissionByNameAndSubSystem("put_all", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")),
                permissionService.getPermissionByNameAndSubSystem("post_all", ams)
                permissionService.getPermissionByNameAndSubSystem("ams_portal_access", ams)
                    .orElseThrow(() -> new NotFoundException("Permission not found")));

            if (addPerm) {
@@ -252,6 +264,7 @@ public class UserService extends RequestContextAwareService{
        }
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void addPermissionsToUser(String username, List<String> permissionNames) {
        User user = getUserByUserName(username).orElseThrow(() -> new NotFoundException("User not found"));

@@ -259,7 +272,7 @@ public class UserService extends RequestContextAwareService{

        for (String permissionName: permissionNames) {
            Permission permission = permissionService.getPermissionByNameAndSubSystem(permissionName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Permission not found"));
                .orElseThrow(() -> new NotFoundException("Permission not found"));

            user.getIncludePermissions().add(permission);
            //remove exclusion if exist
@@ -270,6 +283,7 @@ public class UserService extends RequestContextAwareService{
        userLogService.createUserLog(LogType.PERMISSION, user.getPk(), "ADDED permissions " + String.join(", ", permissionNames));
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void excludePermissionsFromUser(String username, List<String> permissionNames) {
        User user = getUserByUserName(username).orElseThrow(() -> new NotFoundException("User not found"));

@@ -277,7 +291,7 @@ public class UserService extends RequestContextAwareService{

        for(String permName: permissionNames) {
            Permission permission = permissionService.getPermissionByNameAndSubSystem(permName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Permission not found"));
                .orElseThrow(() -> new NotFoundException("Permission not found"));

            user.getExcludePermissions().add(permission);
            //remove inclusion if exist
@@ -288,6 +302,7 @@ public class UserService extends RequestContextAwareService{
        userLogService.createUserLog(LogType.PERMISSION, user.getPk(), "EXCLUDED permissions " + String.join(", ", permissionNames));
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void updatePermissionsForUser(String username, List<String> permissionNames) {
        User user = getUserByUserName(username).orElseThrow(() -> new NotFoundException("User not found"));

@@ -314,6 +329,7 @@ public class UserService extends RequestContextAwareService{
        addRolesToUser(username, roleNames, getCurrentContextSubSystem());
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void addRolesToUser(String username, List<String> roleNames, SubSystem subSystem) {
        User user = getUserByUserName(username).orElseThrow(() -> new NotFoundException("User not found"));

@@ -325,18 +341,20 @@ public class UserService extends RequestContextAwareService{
        userLogService.createUserLog(LogType.ROLE, user.getPk(), "ADDED roles " + String.join(", ", roleNames));
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void removeRolesFromUser(String username, List<String> roleNames) {
        User user = getUserByUserName(username).orElseThrow(() -> new NotFoundException("User not found"));

        SubSystem subSystem = getCurrentContextSubSystem();
        for(String roleName: roleNames) {
            Role role = roleService.getRoleByNameAndSubSystem(roleName, subSystem)
                    .orElseThrow(() -> new NotFoundException("Role not found"));
                .orElseThrow(() -> new NotFoundException("Role not found"));
            user.getRoles().remove(role);
        }
        userLogService.createUserLog(LogType.ROLE, user.getPk(), "REMOVED roles " + String.join(", ", roleNames));
    }

    @CacheEvict(value = "permissionGraphs", allEntries = true)
    public void updateRolesToUser(String username, List<String> roleNames) {
        User user = userRepository.findByUserNameIgnoreCase(username).orElseThrow(() -> new NotFoundException("User not found"));

 src/main/java/com/uownleasing/ams/web/exception/GlobalExceptionHandler.java  0 → 100644
+
127
−
0

Visualizado
package com.uownleasing.ams.web.exception;

import com.uownleasing.ams.error.exception.AlreadyExistException;
import com.uownleasing.ams.error.exception.AMSGenericException;
import com.uownleasing.ams.error.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import javax.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFoundException(
            NotFoundException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.NOT_FOUND, request, "Resource not found");
    }

    @ExceptionHandler(AlreadyExistException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyExistException(
            AlreadyExistException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.CONFLICT, request, "Resource already exists");
    }

    @ExceptionHandler(AMSGenericException.class)
    public ResponseEntity<Map<String, Object>> handleAMSGenericException(
            AMSGenericException ex, HttpServletRequest request) {
        return handleException(ex, ex.getHttpStatus(), request, "Application error");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.METHOD_NOT_ALLOWED, request, "HTTP method not supported");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMediaTypeNotSupportedException(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.UNSUPPORTED_MEDIA_TYPE, request, "Media type not supported");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.BAD_REQUEST, request, "Validation error");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.BAD_REQUEST, request, "Invalid argument type");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.BAD_REQUEST, request, "Invalid request body");
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFoundException(
            NoHandlerFoundException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.NOT_FOUND, request, "No handler found for request");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.FORBIDDEN, request, "Access denied");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {
        return handleException(ex, HttpStatus.INTERNAL_SERVER_ERROR, request, "Internal server error");
    }

    private ResponseEntity<Map<String, Object>> handleException(
            Exception ex, HttpStatus status, HttpServletRequest request, String errorType) {
        
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        String fullUrl = queryString != null ? uri + "?" + queryString : uri;
        
        // Log the exception with full context and stacktrace
        log.error(
            "[GlobalExceptionHandler] {} - {} {} | Status: {} | Error: {} | Message: {}",
            errorType,
            method,
            fullUrl,
            status.value(),
            ex.getClass().getSimpleName(),
            ex.getMessage(),
            ex  // Pass exception to include full stacktrace
        );

        // Build error response
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", uri);
        errorResponse.put("exception", ex.getClass().getName());

        return new ResponseEntity<>(errorResponse, status);
    }
}
 src/main/java/com/uownleasing/ams/web/filter/RequestEntryFilter.java 
+
137
−
3

Visualizado
@@ -8,6 +8,7 @@ import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
@@ -26,15 +27,148 @@ public class RequestEntryFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        if(antMatcher.match("/management/**", request.getRequestURI())) {
        String requestURI = request.getRequestURI();
        if(antMatcher.match("/management/**", requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        LOG.info("Thread: {} {} {} ", Thread.currentThread().getId(), request.getMethod(), request.getRequestURI());
        String method = request.getMethod();
        String queryString = request.getQueryString();
        String fullUrl = queryString != null ? requestURI + "?" + queryString : requestURI;

        // Log immediately when request enters filter - BEFORE processing
        LOG.info("[RequestEntryFilter] INCOMING REQUEST: {} {} | Thread: {}", method, fullUrl, Thread.currentThread().getId());

        try {
            String contextPath = request.getContextPath();
            String servletPath = request.getServletPath();

            String subSystem = request.getHeader("sub-system");
            String userPath = request.getHeader("user-path");
            String authHeader = request.getHeader("Authorization");

            LOG.debug("[RequestEntryFilter] Paths: contextPath='{}', servletPath='{}', requestURI='{}', query='{}'",
                    contextPath, servletPath, requestURI, queryString);
            LOG.debug("[RequestEntryFilter] Headers: sub-system='{}', user-path='{}', AuthorizationPresent={}",
                    subSystem, userPath, authHeader != null && !authHeader.isEmpty());
        } catch (Exception e) {
            LOG.warn("[RequestEntryFilter] Failed to log request diagnostics: {}", e.getMessage());
        }

        ThreadAttributes.initRequestContext();

        filterChain.doFilter(request, response);
        // Wrap response to capture status code
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        int statusCode = 0;
        Throwable exception = null;
        boolean responseCommitted = false;

        try {
            filterChain.doFilter(request, responseWrapper);
            // Get status from wrapper
            statusCode = responseWrapper.getStatus();
            // also get from underlying response
            if (statusCode == 0 || statusCode == 200) {
                int underlyingStatus = response.getStatus();
                if (underlyingStatus > 0 && underlyingStatus != statusCode) {
                    statusCode = underlyingStatus;
                    LOG.debug("[RequestEntryFilter] Status mismatch detected - wrapper: {}, underlying: {}", responseWrapper.getStatus(), underlyingStatus);
                }
            }
            responseCommitted = response.isCommitted();
        } catch (Throwable e) {
            exception = e;
            // Try to get status from response if it was set
            statusCode = responseWrapper.getStatus();
            if (statusCode == 0) {
                statusCode = response.getStatus();
            }

            // If still no status, try to infer from exception type
            if (statusCode == 0) {
                if (e instanceof org.springframework.security.access.AccessDeniedException) {
                    statusCode = 403;
                } else if (e instanceof org.springframework.security.core.AuthenticationException) {
                    statusCode = 401;
                } else {
                    statusCode = 500;
                }
            }

            responseCommitted = response.isCommitted();

            // Log the exception immediately with full context
            LOG.error(
                "[RequestEntryFilter] Exception during request processing: {} {} | Exception: {} | Message: {} | Response committed: {}",
                method,
                fullUrl,
                e.getClass().getName(),
                e.getMessage(),
                responseCommitted,
                e  // Full stacktrace
            );

            // Re-throw to let Spring/exception handlers process it
            if (e instanceof ServletException) {
                throw (ServletException) e;
            } else if (e instanceof IOException) {
                throw (IOException) e;
            } else if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            } else if (e instanceof Error) {
                throw (Error) e;
            } else {
                throw new ServletException("Filter chain exception", e);
            }
        } finally {
            // ALWAYS log the final status, even if it's 0
            if (statusCode == 0) {
                // Last resort: check underlying response directly
                statusCode = response.getStatus();
                if (statusCode == 0 && !responseCommitted) {
                    // Response might not have been committed yet, but we still want to log
                    LOG.warn("[RequestEntryFilter] Could not determine response status for {} {} (status=0, committed={})", method, fullUrl, responseCommitted);
                }
            }

            // Log ALL responses, including when status is still 0
            if (statusCode >= 400 || exception != null) {
                LOG.error(
                    "[RequestEntryFilter] {} {} -> HTTP {} | Request failed | Response committed: {}{}",
                    method,
                    fullUrl,
                    statusCode > 0 ? statusCode : "UNKNOWN",
                    responseCommitted,
                    exception != null ? " | Exception: " + exception.getClass().getSimpleName() : ""
                );
            } else if (statusCode > 0) {
                LOG.info(
                    "[RequestEntryFilter] {} {} -> HTTP {} | Request succeeded | Response committed: {}",
                    method,
                    fullUrl,
                    statusCode,
                    responseCommitted
                );
            } else {
                // Status still 0 - something is wrong, but log it anyway
                LOG.warn(
                    "[RequestEntryFilter] {} {} -> HTTP UNKNOWN (status=0) | Response committed: {}",
                    method,
                    fullUrl,
                    responseCommitted
                );
            }

            // Copy the response body back
            try {
                if (!responseCommitted) {
                    responseWrapper.copyBodyToResponse();
                }
            } catch (Exception e) {
                LOG.warn("[RequestEntryFilter] Failed to copy response body: {}", e.getMessage());
            }
        }
    }
}
 src/main/java/com/uownleasing/ams/web/rest/PermissionController.java 
+
42
−
1

Visualizado
@@ -2,14 +2,19 @@ package com.uownleasing.ams.web.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.User;
import com.uownleasing.ams.error.exception.NotFoundException;
import com.uownleasing.ams.service.PermissionService;
import com.uownleasing.ams.utility.ResponseUtil;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
@@ -20,13 +25,49 @@ import java.util.Optional;
@RequestMapping(path = "/permission", produces = MediaType.APPLICATION_JSON_VALUE)
public class PermissionController {

    private static final Logger LOG = LogManager.getLogger(PermissionController.class);

    @Autowired
    private PermissionService permissionService;

    @Secured("NONE")
    @GetMapping
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
        LOG.info("[PermissionController] getAllPermissions() called");
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            LOG.debug("[PermissionController] Security Context Present: {}", SecurityContextHolder.getContext() != null);
            LOG.debug("[PermissionController] Authentication Present: {}", auth != null);
            
            if (auth != null) {
                LOG.debug("[PermissionController] Auth Principal: {}", auth.getPrincipal());
                LOG.debug("[PermissionController] Auth Principal Type: {}", 
                    auth.getPrincipal() != null ? auth.getPrincipal().getClass().getName() : "null");
                LOG.debug("[PermissionController] Auth Authorities: {}", auth.getAuthorities());
                LOG.debug("[PermissionController] Auth Name: {}", auth.getName());
                LOG.debug("[PermissionController] Auth Authenticated: {}", auth.isAuthenticated());
                
                if (auth.getPrincipal() instanceof User) {
                    User user = (User) auth.getPrincipal();
                    LOG.debug("[PermissionController] User: {}", user.getUserName());
                    LOG.debug("[PermissionController] User Status: {}", user.getStatus());
                }
            } else {
                LOG.info("[PermissionController] Authentication is NULL - request may have been blocked by middleware");
            }
        } catch (Exception e) {
            LOG.error("[PermissionController] Error getting auth info: {}", e.getMessage(), e);
        }
        
        try {
            List<Permission> permissions = permissionService.getAllPermissions();
            LOG.info("[PermissionController] Returning {} permissions", permissions.size());
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            LOG.error("[PermissionController] Error getting permissions: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Secured("NONE")
 src/main/java/com/uownleasing/ams/web/rest/UserController.java 
+
1
−
0

Visualizado
@@ -306,6 +306,7 @@ public class UserController {
        return userLogService.searchUserLog(userPk, logType, search, page, max);
    }

    @Secured("NONE")
    @GetMapping("/{username}/group")
    public UserGroup getGroupForUser(@PathVariable String username) {
        return userService.getUserGroup(username);
 src/main/java/com/uownleasing/ams/web/security/AuthorizationAccessDecisionManager.java 
+
44
−
4

Visualizado
@@ -36,12 +36,35 @@ public class AuthorizationAccessDecisionManager implements AccessDecisionManager
        Method function = ( (MethodInvocation) object).getMethod();

        if(!isRestMappingMethod(function)) {
            LOG.warn("Method security annotation used on a non REST mapping method");
            LOG.warn("[AuthorizationAccessDecisionManager][decide] Method security annotation used on a non REST mapping method");
            Thread.dumpStack();
        }

        HttpServletRequest request = ( (ServletRequestAttributes) Objects.requireNonNull( RequestContextHolder.getRequestAttributes() ) ).getRequest();
        authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI());
        String requestURI = request.getRequestURI();
        String requestMethod = request.getMethod();
        String contextPath = request.getContextPath();
        String servletPath = request.getServletPath();
        
        LOG.debug("[AuthorizationAccessDecisionManager][decide] Checking authorization: method={}, URI={}, contextPath='{}', servletPath='{}', function={}", 
                requestMethod, requestURI, contextPath, servletPath, function.getName());

        for (ConfigAttribute securityAttribute : configAttributes) {
            String attribute = securityAttribute.getAttribute();
            if (attribute.equals("NONE")) {
                LOG.debug("[AuthorizationAccessDecisionManager][decide] @Secured(\"NONE\") found, skipping authorization checks for: method={}, URI={}", requestMethod, requestURI);
                return;
            }
        }

        try {
            authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), requestMethod, requestURI);
            LOG.debug("[AuthorizationAccessDecisionManager][decide] Path authorization passed: method={}, URI={}", requestMethod, requestURI);
        } catch (AccessDeniedException e) {
            LOG.error("[AuthorizationAccessDecisionManager][decide] Access denied: method={}, URI={}, error={}", 
                    requestMethod, requestURI, e.getMessage());
            throw e;
        }

        // Perform additional non-path checks configurable by Secured annotation
        checkSecurityAttr(configAttributes, function, ((MethodInvocation) object).getArguments(), authentication, request);
@@ -146,13 +169,30 @@ public class AuthorizationAccessDecisionManager implements AccessDecisionManager
            if (checkType == SecurityArgCheckType.KEYS) {
                // Authorize for each key present in the object
                Set<String> argKeys = ((LinkedHashMap<String, Object>) item).keySet();
                LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking KEYS authorization, {} keys to check", argKeys.size());
                for (String key : argKeys) {
                    authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI() + itemPath + "/" + key);
                    String fullPath = request.getRequestURI() + itemPath + "/" + key;
                    LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking key: {}, fullPath={}", key, fullPath);
                    try {
                        authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), fullPath);
                    } catch (AccessDeniedException e) {
                        LOG.error("[AuthorizationAccessDecisionManager][checkArgOrRecur] Access denied for key: {}, path={}, error={}", 
                                key, fullPath, e.getMessage());
                        throw e;
                    }
                }

            } else if (checkType == SecurityArgCheckType.VALUES) {
                // Authorize using this specific value
                authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), request.getRequestURI() + itemPath + "/" + item.toString());
                String fullPath = request.getRequestURI() + itemPath + "/" + item.toString();
                LOG.debug("[AuthorizationAccessDecisionManager][checkArgOrRecur] Checking VALUES authorization, value={}, fullPath={}", item.toString(), fullPath);
                try {
                    authorizationService.canAccessOrElseThrow((PermissionDetails) authentication.getDetails(), request.getMethod(), fullPath);
                } catch (AccessDeniedException e) {
                    LOG.error("[AuthorizationAccessDecisionManager][checkArgOrRecur] Access denied for value: {}, path={}, error={}", 
                            item.toString(), fullPath, e.getMessage());
                    throw e;
                }
            }
        }
    }
 src/main/java/com/uownleasing/ams/web/security/HeaderBasedSecurityContextRepository.java 
+
66
−
6

Visualizado
package com.uownleasing.ams.web.security;


import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.SubSystem;
import com.uownleasing.ams.db.entity.User;
import com.uownleasing.ams.pojo.PermissionDetails;
import com.uownleasing.ams.service.AuthenticationService;
import com.uownleasing.ams.service.AuthorizationService;
import com.uownleasing.ams.service.PermissionGraphBuilder;
import com.uownleasing.ams.service.SubSystemService;
import com.uownleasing.ams.service.UserService;
import lombok.extern.slf4j.Slf4j;
@@ -19,7 +22,9 @@ import org.springframework.util.AntPathMatcher;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@Slf4j
@@ -37,6 +42,9 @@ public class HeaderBasedSecurityContextRepository implements SecurityContextRepo
    @Autowired
    private SubSystemService subSystemService;

    @Autowired
    private PermissionGraphBuilder permissionGraphBuilder;

    private static final AntPathMatcher antMatcher = new AntPathMatcher();

    @Transactional
@@ -51,26 +59,35 @@ public class HeaderBasedSecurityContextRepository implements SecurityContextRepo

        String subSystemName = requestResponseHolder.getRequest().getHeader("sub-system");
        if(subSystemName == null || subSystemName.isEmpty()) {
            log.error("Sub system header empty.");
            log.warn("[SecurityContext] Missing 'sub-system' header for {} {} - rejecting as unauthorized context.",
                    requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }

        Optional<SubSystem> subSystem = subSystemService.getSubSystemByName(subSystemName);
        if(subSystem.isEmpty()) {
            log.error("Sub system not found with name: {}", subSystemName);
            log.warn("[SecurityContext] Unknown sub-system '{}' for {} {} - rejecting context.",
                    subSystemName, requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }

        String username = requestResponseHolder.getRequest().getHeader("username");
        if(username == null || username.isEmpty()) {
            log.error("Username header empty");
            log.warn("[SecurityContext] Missing 'username' header for {} {} - rejecting context.",
                    requestResponseHolder.getRequest().getMethod(), requestResponseHolder.getRequest().getRequestURI());
            return ctx;
        }


        Optional<User> user = userService.getUserByUserName(username);
        long userLookupStartTime = System.currentTimeMillis();
        Optional<User> user = userService.getUserByUserNameWithPermissions(username);
        long userLookupTime = System.currentTimeMillis() - userLookupStartTime;

        if(user.isEmpty()) {
            user = userService.getUserByEmail(username);
            long emailLookupStartTime = System.currentTimeMillis();
            user = userService.getUserByEmailWithPermissions(username);
            long emailLookupTime = System.currentTimeMillis() - emailLookupStartTime;
            userLookupTime += emailLookupTime;
        }

        if(user.isEmpty()) {
@@ -78,11 +95,54 @@ public class HeaderBasedSecurityContextRepository implements SecurityContextRepo
            return ctx;
        }

        log.info("[SecurityContext] User lookup completed in {} ms for username: {}", userLookupTime, username);

        // Build permissions graph for authenticated user
        long contextLoadStartTime = System.currentTimeMillis();
        log.info("[SecurityContext] Starting permission graph load for user: {}, subsystem: {}, URI: {}",
                username, subSystemName, requestResponseHolder.getRequest().getRequestURI());

        UserAuthenticationToken userAuthToken = new UserAuthenticationToken(user.get(), null);
        userAuthToken.setDetails(authorizationService.getPermissionDetails((User) userAuthToken.getPrincipal()));

        // Merge subsystem + AMS permissions if accessing AMS portal
        PermissionDetails details;
        long permissionDetailsStartTime = System.currentTimeMillis();

        if (subSystem.get().isAMS()) {
            // For AMS portal: merge subsystem and AMS permissions
            log.info("[SecurityContext] Attempting to retrieve cached merged permission graph for user: {} (AMS portal)", username);
            Set<Permission> subsystemPerms = authorizationService.getUserPermissions(user.get(), subSystem.get());
            Set<Permission> amsPerms = authorizationService.getUserAMSPermissions(user.get());

            long beforeCacheCall = System.currentTimeMillis();
            details = authorizationService.getMergedAMSPermissionDetails(user.get(), subsystemPerms, amsPerms);
            long permissionDetailsTime = System.currentTimeMillis() - permissionDetailsStartTime;
            long cacheCallTime = System.currentTimeMillis() - beforeCacheCall;

            String cacheStatus = cacheCallTime < 50 ? "likely CACHE HIT" : "CACHE MISS (see CACHE MISS log above)";
            log.info("[SecurityContext] Retrieved permission details for user: {} (AMS portal) in {} ms - {}",
                    username, permissionDetailsTime, cacheStatus);
        } else {
            log.info("[SecurityContext] Attempting to retrieve cached permission graph for user: {} subsystem: {}",
                    username, subSystem.get().getName());

            long beforeCacheCall = System.currentTimeMillis();
            details = authorizationService.getPermissionDetails(user.get(), subSystem.get());
            long permissionDetailsTime = System.currentTimeMillis() - permissionDetailsStartTime;
            long cacheCallTime = System.currentTimeMillis() - beforeCacheCall;

            String cacheStatus = cacheCallTime < 50 ? "likely CACHE HIT" : "CACHE MISS (see CACHE MISS log above)";
            log.info("[SecurityContext] Retrieved permission details for user: {} subsystem: {} in {} ms - {}",
                    username, subSystem.get().getName(), permissionDetailsTime, cacheStatus);
        }

        userAuthToken.setDetails(details);
        userAuthToken.setSubSystem(subSystem.get());

        long totalContextLoadTime = System.currentTimeMillis() - contextLoadStartTime;
        log.info("[SecurityContext] Completed permission graph load for user: {} in {} ms total (including DB queries and graph retrieval)",
                username, totalContextLoadTime);

        //userAuthToken.setLoginToken(authHeader);
        ctx.setAuthentication(userAuthToken);
        return ctx;
 src/main/java/com/uownleasing/ams/web/security/LoginHandler.java 
+
21
−
3

Visualizado
@@ -21,8 +21,11 @@ import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

@@ -56,13 +59,28 @@ public class LoginHandler implements AuthenticationSuccessHandler, Authenticatio

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        HttpStatus status;
        if(DisabledException.class.isAssignableFrom(exception.getClass())) {
            response.setStatus(HttpStatus.I_AM_A_TEAPOT.value());
            status = HttpStatus.I_AM_A_TEAPOT;
        } else if(LockedException.class.isAssignableFrom(exception.getClass())) {
            response.setStatus(HttpStatus.LOCKED.value());
            status = HttpStatus.LOCKED;
        } else {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            status = HttpStatus.UNAUTHORIZED;
        }
        
        response.setStatus(status.value());
        response.setContentType("application/json");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", exception.getMessage());
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("exception", exception.getClass().getName());
        
        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }

    private String getLoginSuccessResponseBody(UserAuthenticationToken userAuth) throws JsonProcessingException {
 src/main/java/com/uownleasing/ams/web/security/UserAuthenticationProvider.java 
+
36
−
3

Visualizado
package com.uownleasing.ams.web.security;

import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.Role;
import com.uownleasing.ams.db.entity.SubSystem;
import com.uownleasing.ams.db.entity.User;
import com.uownleasing.ams.enumeration.Status;
@@ -9,6 +11,8 @@ import com.uownleasing.ams.service.AuthenticationService;
import com.uownleasing.ams.service.AuthorizationService;
import com.uownleasing.ams.service.PermissionGraphBuilder;
import com.uownleasing.ams.service.SubSystemService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
@@ -18,11 +22,15 @@ import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;


public class UserAuthenticationProvider implements AuthenticationProvider {

    private static final Logger LOG = LogManager.getLogger(UserAuthenticationProvider.class);

    @Autowired
    private AuthenticationService authenticationService;

@@ -54,13 +62,38 @@ public class UserAuthenticationProvider implements AuthenticationProvider {
            throw new DisabledException("Account disabled");
        }

        // login doesnt need authorities as request terminates after authentication success/failure
        // login doesn't need authorities as request terminates after authentication success/failure
        UserAuthenticationToken authToken = new UserAuthenticationToken(user, null);
//        authToken.setLoginToken(loginInfo.getFirst());

        PermissionDetails details = new PermissionDetails();
        details.setPermissionSet(authorizationService.getUserPermissions(user, sys));
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, details.getPermissionSet()));
        Set<Permission> permissions;

        if (sys.isAMS()) {
            // For AMS portal: collect permissions from ALL subsystems the user has roles in
            Set<Permission> allPermissions = new HashSet<>();

            // Get permissions from all subsystems the user has roles in
            for (Role role : user.getRoles()) {
                SubSystem roleSubSystem = role.getSubSystem();
                Set<Permission> subsystemPerms = authorizationService.getUserPermissions(user, roleSubSystem);
                allPermissions.addAll(subsystemPerms);

                LOG.info("[UserAuthenticationProvider][authenticate] User '{}' role '{}' in subsystem '{}': {} permissions",
                         user.getUserName(), role.getName(), roleSubSystem.getName(), subsystemPerms.size());
            }

            permissions = allPermissions;
            LOG.info("[UserAuthenticationProvider][authenticate] Total merged permissions for user '{}': {}", user.getUserName(), permissions.size());
        } else {
            // For other subsystems: use existing logic
            permissions = authorizationService.getUserPermissions(user, sys);
            LOG.info("[UserAuthenticationProvider][authenticate] Login for user '{}' with subsystem '{}': permissions={}",
                     user.getUserName(), sys.getName(), permissions.size());
        }

        details.setPermissionSet(permissions);
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, permissions));

        authToken.setDetails(details);
        authToken.setSubSystem(sys);

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------        
# Test Scenarios - UOWN | AMS | Refactor AMS Subsystem for Enhanced Permission Control

## Overview
This refactoring removes dependency on generic CRUD wildcard permissions and implements granular permission control within the `ams-auth` sub-system.

---

## STEP 1: General Access Verification

### Scenario 1.1: Admin User Login and Access
- `Quando um usuário com role ADMIN faz login no AMS após a refatoração, deve conseguir acessar todas as páginas (Users, Groups, Roles, Merchants) e visualizar todos os itens de menu permitidos sem erros de autenticação, confirmando que as permissões granulares foram corretamente atribuídas ao role ADMIN.`

### Scenario 1.2: Manager User Login and Access
- `Quando um usuário com role MANAGER faz login no AMS após a refatoração, deve conseguir acessar Users, Groups, Roles (limitado - sem delete), e visualizar apenas os itens de menu permitidos ao role MANAGER, sem erros "access denied" em ações permitidas.`

### Scenario 1.3: Supervisor User Access Restrictions
- `Quando um usuário com role SUPERVISOR tenta acessar diferentes páginas AMS, deve conseguir visualizar Users, Roles, e Permissions em modo read-only, não devendo visualizar ações de criar, editar ou deletar, confirmando as restrições do role SUPERVISOR.`

### Scenario 1.4: Agent User Read-Only Access
- `Quando um usuário com role AGENT faz login no AMS, deve conseguir listar e visualizar usuários, papéis e permissões, mas não deve conseguir executar qualquer ação de modificação (create, update, delete), confirmando acesso somente leitura.`

### Scenario 1.5: Auditor User No Access
- `Quando um usuário com role AUDITOR tenta acessar o AMS portal após a refatoração, não deve conseguir visualizar nenhuma página, recebendo mensagem de acesso negado, confirmando que o role AUDITOR não tem acesso ao AMS.`

---

## STEP 2: Page-Level Access Tests

### Users Page Tests

#### Scenario 2.1: Users Page Load with ADMIN Role
- `Quando um usuário ADMIN acessa a página Users no AMS, a página deve carregar corretamente, exibir a lista de usuários com todos os dados esperados, e os botões de ação (Unlock User, Clone User, Add User) devem estar visíveis e funcionais.`

#### Scenario 2.2: Unlock User Action with Permission
- `Quando um usuário com permissão user_unlock clica no botão "Unlock User" para um usuário bloqueado, o usuário deve ser desbloqueado com sucesso, a ação deve ser registrada nos logs de auditoria, e uma mensagem de sucesso deve ser exibida.`

#### Scenario 2.3: Unlock User Action without Permission
- `Quando um usuário sem permissão user_unlock tenta clicar no botão "Unlock User", o botão deve estar desabilitado ou oculto, e se tentar fazer a ação diretamente via API, deve receber erro 403 Forbidden.`


#### Scenario 2.4: Clone User Action
- `Quando um usuário MANAGER com permissão user_create clica em "Clone User" e copia um usuário existente, o novo usuário deve ser criado com dados copiados, receber um novo identificador único, e aparecer na lista de usuários.`

#### Scenario 2.5: Add User Action
- `Quando um usuário ADMIN clica no botão "Add User", um formulário de criação deve aparecer, permitindo preencher dados do novo usuário, e após salvar, o usuário deve ser criado e aparecer na lista com sucesso.`

#### Scenario 2.6: Users Page Pagination
- `Quando a lista de usuários tem mais de 10 registros, a paginação deve funcionar corretamente permitindo navegar entre páginas, e filtros de role devem permanecer aplicados ao mudar de página.`

---

## STEP 3: Granular Permission Testing

### Scenario 3.1: Edit User Panel Permission
- `Quando um usuário com permissão edit_user_panel acessa os detalhes de um usuário, deve conseguir editar informações do usuário (nome, email, telefone), salvando as alterações com sucesso e registrando a ação nos logs.`

### Scenario 3.2: Edit Password Panel Permission
- `Quando um usuário com permissão edit_password_panel acessa o painel de gerenciamento de usuários, deve conseguir forçar reset de senha para outro usuário, e o usuário afetado deve receber notificação (se aplicável).`

### Scenario 3.3: Edit Role Permission Panel Permission
- `Quando um usuário MANAGER com permissão edit_role_permission_panel edita os papéis de um usuário, deve conseguir adicionar/remover papéis do ams-auth, origination, e servicing, salvando as alterações corretamente.`

### Scenario 3.4: Edit User Permission Panel Permission
- `Quando um usuário com permissão edit_user_permission_panel acessa o painel de permissões, deve conseguir adicionar/remover permissões granulares do usuário (user_list, user_unlock, etc.), e as mudanças devem ser refletidas imediatamente.`

### Scenario 3.5: Edit Merchant Panel Permission
- `Quando um usuário com permissão edit_merchant_panel acessa a seção de comerciantes, deve conseguir atribuir/remover comerciantes de um usuário, salvando as alterações com sucesso.`

### Scenario 3.6: Edit User Group Panel Permission
- `Quando um usuário com permissão edit_user_group_panel gerencia grupos, deve conseguir criar, editar e deletar grupos de usuários, atribuindo usuários aos grupos corretamente.`

### Scenario 3.7: Edit Username Panel Permission
- `Quando um usuário com permissão edit_username_panel tenta editar o nome de usuário (username), deve conseguir fazer a mudança apenas se o novo username não estiver em uso, mantendo a unicidade.`

---

## STEP 4: Subsystem-Specific Permission Tests

### Scenario 4.1: AMS Portal Access Permission
- `Quando um usuário sem permissão ams_portal_access tenta acessar o AMS portal, deve ser bloqueado com erro 403, confirmando que ams_portal_access é mandatória para acesso ao portal.`


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

### Scenario 1.1: Admin User Login and Access

> ```gherkin

> **`When a user with the ADMIN role logs into the AMS after the refactor, they should be able to access all pages (Users, Groups, Roles, Merchants) and view all allowed menu items without authentication errors, confirming that granular permissions were correctly assigned to the ADMIN role.`**

> ![image](/uploads/bfb5c6aeb9d117f3e7f6f437f5b47736/image.png){width=900 height=598}
> ![image](/uploads/cceb310f5c2af03518cee660e3ce35f7/image.png){width=900 height=591}
> ![image](/uploads/1f0e9a33bd8dd0c156dfeb2d93db1be9/image.png){width=870 height=600}
> ![image](/uploads/79f08165e8db55ba162eebf6e1aa7950/image.png){width=900 height=479}

> **| PASS |**
> ```

---

### Scenario 1.2: Manager User Login and Access

> ```gherkin

> **`When a user with the MANAGER role logs into the AMS after the refactor, they should be able to access Users, Groups, Roles (limited – without delete), and view only the menu items allowed for the MANAGER role, without "access denied" errors on permitted actions.`**

> **| PASS |**
> ```

---

### Scenario 1.3: Supervisor User Access Restrictions

> ```gherkin

> **`When a user with the SUPERVISOR role attempts to access different AMS pages, they should be able to view Users, Roles, and Permissions in read-only mode, and should not see create, edit, or delete actions, confirming the constraints of the SUPERVISOR role.`**

> **| PASS |**
> ```

---

### Scenario 1.4: Agent User Read-Only Access

> ```gherkin

> **`When a user with the AGENT role logs into the AMS, they should be able to list and view users, roles, and permissions, but should not be able to perform any modification actions (create, update, delete), confirming read-only access.`**

> ![image](/uploads/21a045734d4736f974c9db714ab1bbc2/image.png){width=900 height=587}

> **| PASS |**
> ```

---

### Scenario 1.5: Auditor User No Access

> ```gherkin

> **`When a user with the AUDITOR role attempts to access the AMS portal after the refactor, they should not be able to view any page, receiving an access denied message, confirming that the AUDITOR role has no access to the AMS.`**

> ![Screenshot_at_Nov_14_12-06-39](/uploads/ce3192cbf9b3c326cf3d203153230971/Screenshot_at_Nov_14_12-06-39.png){width=830 height=508}
> ![Screenshot_at_Nov_14_12-08-06](/uploads/576f6fdd91bb1fb729cdd6b5869a69e9/Screenshot_at_Nov_14_12-08-06.png){width=900 height=447}

> **| PASS |**
> ```

---

#### Scenario 2.1: Users Page Load with ADMIN Role

> ```gherkin

> **`When an ADMIN user accesses the Users page in the AMS, the page should load correctly, display the user list with all expected data, and the action buttons (Unlock User, Clone User, Add User) should be visible and functional.`**

> **| PASS |**
> ```

---

#### Scenario 2.2: Unlock User Action with Permission

> ```gherkin

> **`When a user with the user_unlock permission clicks the "Unlock User" button for a locked user, the user should be successfully unlocked, the action should be logged in the audit logs, and a success message should be displayed.`**

> **| PASS |**
> ```

---

#### Scenario 2.3: Unlock User Action without Permission

> ```gherkin

> **`When a user without the user_unlock permission attempts to click the "Unlock User" button, the button should be disabled or hidden, and if they try to perform the action directly through the API, they should receive a 403 Forbidden error.`**

> ![Screenshot_at_Nov_14_07-28-43](/uploads/f73aac264e03752b6f17b3f86a885bc7/Screenshot_at_Nov_14_07-28-43.png){width=160 height=67}
> ![Screenshot_at_Nov_14_07-29-54](/uploads/6a60ecb0a974ca956375ade3610ff077/Screenshot_at_Nov_14_07-29-54.png){width=875 height=600}

> **| PASS |**
> ```

---

#### Scenario 2.4: Users Page Pagination

> ```gherkin

> **`When the user list has more than 10 records, pagination should work correctly, allowing navigation between pages, and role filters should remain applied when switching pages.`**

> **| PASS |**
> ```

---

### Scenario 3.1: Edit User Panel Permission

> ```gherkin

> **`When a user with the edit_user_panel permission accesses the details of a user, they should be able to edit user information (name, email, phone), successfully save changes, and have the action recorded in the logs.`**

> ![Screenshot_at_Nov_14_09-54-44](/uploads/ee1ac872d6974dcbb834c1670cbac54f/Screenshot_at_Nov_14_09-54-44.png){width=831 height=218}
> ![Screenshot_at_Nov_14_09-55-36](/uploads/7d15b6b35d7bd2bc2abd3530ac9962c1/Screenshot_at_Nov_14_09-55-36.png){width=469 height=145}
> ![Screenshot_at_Nov_14_10-08-45](/uploads/dd37cc06bdf786d5c100bc36655a4783/Screenshot_at_Nov_14_10-08-45.png){width=376 height=28}

> **| PASS |**
> ```

---

### Scenario 3.2: Edit Password Panel Permission

> ```gherkin

> **`When a user with the edit_password_panel permission accesses the user management panel, they should be able to force a password reset for another user, and the affected user should receive a notification (if applicable).`**

> ![Screenshot_at_Nov_14_10-11-20](/uploads/0c3905658846eb0c32e91271feccc3c5/Screenshot_at_Nov_14_10-11-20.png){width=183 height=15}
> ![Screenshot_at_Nov_14_10-11-26](/uploads/abd9057bc087f65f8db8517a900712ba/Screenshot_at_Nov_14_10-11-26.png){width=871 height=66}
> ![Screenshot_at_Nov_14_10-12-06](/uploads/6fbe383a0eca4d6b301cb4ac65250fb4/Screenshot_at_Nov_14_10-12-06.png){width=354 height=75}
> ![Screenshot_at_Nov_14_10-12-12](/uploads/fd071fcc23c9977bc1b6f0d338485699/Screenshot_at_Nov_14_10-12-12.png){width=877 height=65}

> **| PASS |**
> ```

---

### Scenario 3.3: Edit Role Permission Panel Permission

> ```gherkin

> **`When a MANAGER user with the edit_role_permission_panel permission edits a user's roles, they should be able to add/remove roles from ams-auth, origination, and servicing, saving the changes correctly.`**

> ![Screenshot_at_Nov_14_10-13-13](/uploads/aa190113da9687160d18509a7b1fad68/Screenshot_at_Nov_14_10-13-13.png){width=842 height=523}
> ![Screenshot_at_Nov_14_10-13-51](/uploads/818945d1c96c709ef8ebdd10e851042b/Screenshot_at_Nov_14_10-13-51.png){width=207 height=31}
> ![Screenshot_at_Nov_14_10-14-09](/uploads/a1c55af9373eef640f6305efa61e9678/Screenshot_at_Nov_14_10-14-09.png){width=884 height=70}
> ![Screenshot_at_Nov_14_10-14-45](/uploads/c5c89af19e6680d35f2c81815a4dccdf/Screenshot_at_Nov_14_10-14-45.png){width=271 height=77}
> ![Screenshot_at_Nov_14_10-15-16](/uploads/c1a156a26fe71d4c757ed750ece16d82/Screenshot_at_Nov_14_10-15-16.png){width=867 height=50}

> **| PASS |**
> ```

---

### Scenario 3.4: Edit Merchant Panel Permission

> ```gherkin

> **`When a user with the edit_merchant_panel permission accesses the merchants section, they should be able to assign/remove merchants from a user, saving the changes successfully.`**

> !![Screenshot_at_Nov_14_10-18-28](/uploads/99117140887848167533ecaa03a792ef/Screenshot_at_Nov_14_10-18-28.png){width=182 height=42}
> ![Screenshot_at_Nov_14_10-18-34](/uploads/237b31f7d3883d7d518537e9c45cfc4a/Screenshot_at_Nov_14_10-18-34.png){width=900 height=250}
> ![Screenshot_at_Nov_14_10-19-00](/uploads/9b0812ef58806b3198b0c35fe7de32cc/Screenshot_at_Nov_14_10-19-00.png){width=184 height=52}
> ![Screenshot_at_Nov_14_10-19-12](/uploads/598abf1a1eae85887b28a2daba62a828/Screenshot_at_Nov_14_10-19-12.png){width=900 height=413}

> **| PASS |**
> ```

---

### Scenario 3.6: Edit User Group Panel Permission

> ```gherkin

> **`When a user with the edit_user_group_panel permission manages groups, they should be able to create, edit, and delete user groups, assigning users to groups correctly.`**

> **| PASS |**
> ```

---

### Scenario 3.7: Edit Username Panel Permission

> ```gherkin

> **`When a user with the edit_username_panel permission attempts to edit the username, they should only be able to make the change if the new username is not already in use, preserving uniqueness.`**

> **| PASS |**
> ```

---

### Scenario 4.1: AMS Portal Access Permission

> ```gherkin

> **`When a user without the ams_portal_access permission attempts to access the AMS portal, they should be blocked with a 403 error, confirming that ams_portal_access is mandatory for portal access`**

> ![Screenshot_at_Nov_14_10-21-38](/uploads/e757be058ee25aedf83c3da0d376dd57/Screenshot_at_Nov_14_10-21-38.png){width=181 height=46}
> ![Screenshot_at_Nov_14_10-22-53](/uploads/d4573559ed94a8f676ffdd1e8dc0fa04/Screenshot_at_Nov_14_10-22-53.png){width=900 height=447}
> ![Screenshot_at_Nov_14_10-23-51](/uploads/4422aa357f92e4311000046e278aedef/Screenshot_at_Nov_14_10-23-51.png){width=900 height=438}

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG

> ## Tests in stg

### Scenario 1.1: Admin User Login and Access

> ```gherkin

> **`When a user with the ADMIN role logs into the AMS after the refactor, they should be able to access all pages (Users, Groups, Roles, Merchants) and view all allowed menu items without authentication errors, confirming that granular permissions were correctly assigned to the ADMIN role.`**

> 

> **| PASS |**
> ```

---

### Scenario 1.2: Manager User Login and Access

> ```gherkin

> **`When a user with the MANAGER role logs into the AMS after the refactor, they should be able to access Users, Groups, Roles (limited – without delete), and view only the menu items allowed for the MANAGER role, without "access denied" errors on permitted actions.`**

> ![image](/uploads/c02561fd2c83c22ea03e0b16846f7e97/image.png){width=900 height=446}

> **| PASS |**
> ```

---

### Scenario 1.3: Supervisor User Access Restrictions

> ```gherkin

> **`When a user with the SUPERVISOR role attempts to access different AMS pages, they should be able to view Users, Roles, and Permissions in read-only mode, and should not see create, edit, or delete actions, confirming the constraints of the SUPERVISOR role.`**

> ![image](/uploads/22fb43e3db9f6a8efa03bfebfc083493/image.png){width=900 height=424}

> **| PASS |**
> ```

---

### Scenario 1.4: Agent User Read-Only Access

> ```gherkin

> **`When a user with the AGENT role logs into the AMS, they should be able to list and view users, roles, and permissions, but should not be able to perform any modification actions (create, update, delete), confirming read-only access.`**

> ![image](/uploads/899b10dd163b8934c7dc483908d5ccb6/image.png){width=900 height=445}

> **| PASS |**
> ```

---

### Scenario 1.5: Auditor User No Access

> ```gherkin

> **`When a user with the AUDITOR role attempts to access the AMS portal after the refactor, they should not be able to view any page, receiving an access denied message, confirming that the AUDITOR role has no access to the AMS.`**

> ![image](/uploads/0b686802d1ff4b85b5e43e474ea53901/image.png){width=900 height=448}
> ![image](/uploads/163073fff1546f7428b4a256148d9863/image.png){width=900 height=447}

> **| PASS |**
> ```

---

#### Scenario 2.1: Users Page Load with ADMIN Role

> ```gherkin

> **`When an ADMIN user accesses the Users page in the AMS, the page should load correctly, display the user list with all expected data, and the action buttons (Unlock User, Clone User, Add User) should be visible and functional.`**

> **| PASS |**
> ```

---

#### Scenario 2.2: Unlock User Action with Permission

> ```gherkin

> **`When a user with the user_unlock permission clicks the "Unlock User" button for a locked user, the user should be successfully unlocked, the action should be logged in the audit logs.`**

> ![Screenshot_at_Nov_17_10-41-32](/uploads/ff619e253cdc3b8bfaacfb547f705e59/Screenshot_at_Nov_17_10-41-32.png){width=900 height=325}
> ![image](/uploads/720adec8f98fc7683df9355bffa83e05/image.png){width=453 height=97}

> **| PASS |**
> ```

---

#### Scenario 2.3: Unlock User Action without Permission

> ```gherkin

> **`When a user without the user_unlock permission attempts to click the "Unlock User" button, the button should be disabled or hidden, and if they try to perform the action directly through the API, they should receive a 403 Forbidden error.`**

> ![Screenshot_at_Nov_17_10-49-37](/uploads/5a4f58c9a060884c31c85287872a10ae/Screenshot_at_Nov_17_10-49-37.png){width=900 height=347}

> **| PASS |**
> ```

---

#### Scenario 2.4: Users Page Pagination

> ```gherkin

> **`When the user list has more than 10 records, pagination should work correctly, allowing navigation between pages, and role filters should remain applied when switching pages.`**

> **| PASS |**
> ```

---

### Scenario 3.1: Edit User Panel Permission

> ```gherkin

> **`When a user with the edit_user_panel permission accesses the details of a user, they should be able to edit user information (name, email, phone), successfully save changes, and have the action recorded in the logs.`**

> ![image](/uploads/41fda8fcf8b42ea858be3764f9db17f8/image.png){width=795 height=600}
> ![image](/uploads/44b9a7e67c861f4e91204f21a5585c9a/image.png){width=413 height=140}
> ![image](/uploads/f2bab555b760a9230eea6710c9dfff7a/image.png){width=900 height=276}

> **| PASS |**
> ```

---

### Scenario 3.2: Edit Password Panel Permission

> ```gherkin

> **`When a user with the edit_password_panel permission accesses the user management panel, they should be able to force a password reset for another user, and the affected user should receive a notification (if applicable).`**

> ![image](/uploads/c07474abfd82cee590acc812b6633c18/image.png){width=786 height=600}
> ![image](/uploads/0822cc12470f9e04369fa815b1e09892/image.png){width=406 height=199}
> ![image](/uploads/7f501d34405d33481fb8b6e02aeb7a4e/image.png){width=900 height=315}

> **| PASS |**
> ```

---

### Scenario 3.3: Edit Role Permission Panel Permission

> ```gherkin

> **`When a MANAGER user with the edit_role_permission_panel permission edits a user's roles, they should be able to add/remove roles from ams-auth, origination, and servicing, saving the changes correctly.`**

> ![Screenshot_at_Nov_14_10-13-13](/uploads/aa190113da9687160d18509a7b1fad68/Screenshot_at_Nov_14_10-13-13.png){width=842 height=523}
> ![Screenshot_at_Nov_14_10-13-51](/uploads/818945d1c96c709ef8ebdd10e851042b/Screenshot_at_Nov_14_10-13-51.png){width=207 height=31}
> ![Screenshot_at_Nov_14_10-14-09](/uploads/a1c55af9373eef640f6305efa61e9678/Screenshot_at_Nov_14_10-14-09.png){width=884 height=70}
> ![Screenshot_at_Nov_14_10-14-45](/uploads/c5c89af19e6680d35f2c81815a4dccdf/Screenshot_at_Nov_14_10-14-45.png){width=271 height=77}
> ![Screenshot_at_Nov_14_10-15-16](/uploads/c1a156a26fe71d4c757ed750ece16d82/Screenshot_at_Nov_14_10-15-16.png){width=867 height=50}

> **| PASS |**
> ```

---

### Scenario 3.4: Edit Merchant Panel Permission

> ```gherkin

> **`When a user with the edit_merchant_panel permission accesses the merchants section, they should be able to assign/remove merchants from a user, saving the changes successfully.`**

> ![image](/uploads/224231814e4a03777ce01b1bce110ce5/image.png){width=900 height=221}
> ![image](/uploads/04248aa2099f761c9c6867de5ec604ce/image.png){width=513 height=137}
> ![image](/uploads/1de8f91f8d1ba6645a8d07457c15f069/image.png){width=900 height=397}

> **| PASS |**
> ```

---

### Scenario 3.6: Edit User Group Panel Permission

> ```gherkin

> **`When a user with the edit_user_group_panel permission manages groups, they should be able to create, edit, and delete user groups, assigning users to groups correctly.`**

> **| PASS |**
> ```

---

### Scenario 3.7: Edit Username Panel Permission

> ```gherkin

> **`When a user with the edit_username_panel permission attempts to edit the username, they should only be able to make the change if the new username is not already in use, preserving uniqueness.`**

> **| PASS |**
> ```

---

### Scenario 4.1: AMS Portal Access Permission

> ```gherkin

> **`When a user without the ams_portal_access permission attempts to access the AMS portal, they should be blocked with a 403 error, confirming that ams_portal_access is mandatory for portal access`**

> ![image](/uploads/3c567ddfa77457fa122473cc27dfce25/image.png){width=900 height=446}
> ![image](/uploads/11809385b624aeed7123b6139a38c439/image.png){width=508 height=139}
> ![image](/uploads/913aea018f4c40adde070d0ccc006ed3/image.png){width=900 height=444}

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------