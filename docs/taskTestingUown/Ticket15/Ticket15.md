-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/15

# UOWN | AMS — Issue #15 (RU01.26.1.48.0)

## Fixes and adjustments in Dev3 for AMS

**Status:** Open (Ready for QA)
**Labels:** dev, full-stack, priority: medium, workflow: ready-for-qa
**Assignee:** Fernando Martins
**Development link:** MR !39 (merged) — “Fix Hibernate Lazy Loading Errors”
**Target environment:** Dev3
**Notes:** The issue has **no written description** in GitLab; the only explicit functional intent visible is **fixing Hibernate lazy-loading errors** (typically `LazyInitializationException` / serialization failures). The test scope below is derived from that.

---

## ENGLISH VERSION

### 1) Objective

Validate that the AMS backend/UI no longer produces **Hibernate lazy-loading errors** in Dev3 after MR !39, and that impacted user flows work end-to-end without HTTP 500/serialization failures.

### 2) Test Scope

**In scope**

* AMS API endpoints and UI screens that read entities with relationships (common source of lazy-loading issues).
* User journeys that load detail pages, lists with nested attributes, and actions that fetch/refresh data immediately after create/update.

**Out of scope**

* New features (none declared).
* Non-AMS subsystems unless they are directly integrated into AMS flows.

### 3) Environments

* **Dev3** (primary validation environment)
* If available for sanity comparison: Dev2 / QA2 (optional regression baseline)

### 4) Entry Criteria

* Dev3 updated with RU01.26.1.48.0 build that includes MR !39.
* Tester has working AMS credentials with at least:

  * permission to access AMS
  * permission to list and view core entities used in AMS (users/roles/permissions or equivalent)

### 5) Acceptance Criteria (Pass/Fail)

* No user-facing errors or console errors caused by missing/late-loaded relations.
* No server-side errors in Dev3 logs related to:

  * `LazyInitializationException`
  * `failed to lazily initialize a collection`
  * JSON serialization errors caused by Hibernate proxies
* All validated endpoints return HTTP **200/201/204** as expected (no 500).
* Payloads include required nested fields consistently (no `null`/missing fields due to unloaded relations), unless intentionally designed.

### 6) Test Scenarios and Cases

#### A. Smoke tests focused on lazy-loading risk

1. **Open AMS landing/dashboard (if applicable)**

   * Expected: loads without UI crash; no failed data requests.

2. **Navigate primary menus and load each main list screen**

   * Expected: list loads, pagination works, no 500 responses.

3. **Open details pages from lists (top 5 records)**

   * Expected: details load with nested/related data rendered correctly.

#### B. API validation (recommended via Network tab / Postman)

For each “high relationship” resource (pick the ones AMS uses most, e.g., users/roles/permissions/teams or equivalent):

1. **GET list endpoint**

   * Validate status code and response structure.
   * Validate that nested fields (if returned) are consistent across items.

2. **GET by id endpoint**

   * Validate status code.
   * Validate relationship fields that the UI expects (e.g., roles, permissions, profile, organization, etc.).

3. **Create → immediate read**

   * Create an entity that has relations (or assign relations right after create).
   * Immediately open the details screen / call GET by id.
   * Expected: no lazy-load error after create; relations appear as expected.

4. **Update → immediate read**

   * Update entity (e.g., change role/permission assignment, or other relation-heavy update).
   * Immediately refresh the details screen.
   * Expected: no 500; updated relations visible.

#### C. UI flows most likely impacted (examples—adapt to actual AMS screens)

1. **User management**

   * List users → open user details → confirm roles/permissions sections render.
2. **Role management**

   * List roles → open role details → confirm permission list renders.
3. **Permission assignment / relationship tables**

   * Any screen showing many-to-many relationships should render without intermittent failures.

#### D. Negative/edge validations

1. **Account with minimal privileges**

   * Ensure “access denied” is handled properly (403/blocked UI) and not causing server errors.
2. **Entity with large relationship sets**

   * Select a role/user with many permissions.
   * Expected: still no lazy-load errors; note performance if slow.

### 7) Regression Checklist (Quick)

* Login/logout
* Primary navigation
* Search/filter on key lists (if present)
* Create/edit flows for at least one core entity
* Any screen that previously triggered 500s in Dev3

### 8) Evidence to Collect

* Screenshots of key screens (list + detail).
* Network capture of at least:

  * one GET list
  * one GET by id
  * one create + immediate read
* If you have access to logs: copy the relevant log window showing absence of lazy-loading errors during testing.

### 9) Risks / Watch-outs

* Fixes for lazy loading sometimes change response payload shape (DTO mapping / fetch joins). Confirm UI expectations still match.
* Potential performance impact if the fix uses eager fetching broadly; record slow endpoints.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## VERSÃO EM PORTUGUÊS

### 1) Objetivo

Validar que o AMS em Dev3 **não apresenta mais erros de lazy-loading do Hibernate** após o MR !39, e que os fluxos afetados funcionam ponta a ponta sem HTTP 500/erros de serialização.

### 2) Escopo de Teste

**Dentro do escopo**

* Endpoints e telas do AMS que carregam entidades com relacionamentos (ponto típico de lazy-loading).
* Jornadas que acessam telas de detalhe, listas com campos aninhados e ações que fazem leitura imediata após criar/atualizar.

**Fora do escopo**

* Novas funcionalidades (nenhuma declarada).
* Outros subsistemas, exceto se integrados diretamente ao AMS.

### 3) Ambientes

* **Dev3** (ambiente principal)
* Se disponível para comparação: Dev2 / QA2 (baseline opcional)

### 4) Critérios de Entrada

* Dev3 atualizado com o build RU01.26.1.48.0 que contém o MR !39.
* Credenciais válidas para o AMS com permissões mínimas para navegar e visualizar entidades principais.

### 5) Critérios de Aceite (Aprova/Reprova)

* Sem erros visíveis ao usuário/console por falha ao carregar relacionamentos.
* Sem erros nos logs do Dev3 relacionados a:

  * `LazyInitializationException`
  * `failed to lazily initialize a collection`
  * erros de serialização JSON por proxies do Hibernate
* Endpoints validados retornam HTTP **200/201/204** conforme esperado (sem 500).
* Payloads retornam campos aninhados necessários de forma consistente (sem `null`/ausência por relacionamento não carregado), salvo comportamento intencional.

### 6) Cenários e Casos de Teste

#### A. Smoke tests focados em risco de lazy-loading

1. **Abrir tela inicial/dashboard (se existir)**

   * Esperado: carregar sem crash; sem falha de requisições.

2. **Navegar no menu primário e abrir cada tela principal de listagem**

   * Esperado: lista carrega, paginação ok, sem 500.

3. **Abrir telas de detalhe a partir das listas (5 registros)**

   * Esperado: detalhe carrega com dados relacionados renderizados corretamente.

#### B. Validação de API (recomendado via Network/Postman)

Para cada recurso “com muitos relacionamentos” (usar os mais usados no AMS, ex.: usuários/papéis/permissões ou equivalente):

1. **GET lista**

   * Validar status e estrutura.
   * Validar consistência de campos aninhados.

2. **GET por id**

   * Validar status.
   * Validar campos de relacionamento que a UI depende (ex.: roles, permissions, profile, organization etc.).

3. **Criar → leitura imediata**

   * Criar entidade que tenha relacionamentos (ou atribuir relacionamento logo após criar).
   * Abrir detalhe/rodar GET por id imediatamente.
   * Esperado: sem erro de lazy-loading após create; relacionamentos aparecem.

4. **Atualizar → leitura imediata**

   * Atualizar entidade (trocar atribuições/relacionamentos).
   * Atualizar a página/reconsultar imediatamente.
   * Esperado: sem 500; alterações visíveis.

#### C. Fluxos de UI mais prováveis de serem afetados (exemplos—ajustar às telas reais)

1. **Gestão de usuários**

   * Listar usuários → abrir detalhes → validar seções de roles/permissões.
2. **Gestão de roles**

   * Listar roles → abrir detalhes → validar lista de permissões.
3. **Telas/tabelas de relacionamento N:N**

   * Esperado: renderizar sem falhas intermitentes.

#### D. Testes negativos e bordas

1. **Usuário com poucas permissões**

   * Verificar bloqueio adequado (403/UI) sem erro no backend.
2. **Entidade com grande volume de relacionamentos**

   * Escolher role/usuário com muitas permissões.
   * Esperado: sem lazy-loading; registrar lentidão se ocorrer.

### 7) Checklist de Regressão (rápido)

* Login/logout
* Navegação primária
* Busca/filtro nas listas (se houver)
* Criar/editar pelo menos uma entidade central
* Telas que antes geravam 500 no Dev3

### 8) Evidências para anexar

* Prints das telas principais (lista + detalhe).
* Capturas de rede de:

  * um GET lista
  * um GET por id
  * um create + leitura imediata
* Se tiver acesso aos logs: evidência de ausência de erros de lazy-loading durante os testes.

### 9) Riscos / Pontos de Atenção

* Correções de lazy-loading podem alterar o formato do payload (DTO/fetch join). Confirmar compatibilidade com a UI.
* Pode haver impacto de performance se o ajuste aumentou eager loading; registrar endpoints lentos.

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

Página inicial
Navegação primária
Projeto
A
ams

Fixada
Issues
5
Solicitações de mesclagem
1

Gerenciar

Plano

Código
Solicitações de mesclagem
1
Repositório
Ramificações
Commits
Tags
Gráfico do repositório
Comparar revisões
Snippets
Arquivos bloqueados

Compilação

Segurança

Implantação

Operação

Monitorar

Analisar

Configurações
uown
backend
ams
Solicitações de mesclagem
!39
[#15] - Fix Hibernate Lazy Loading Errors
Mesclado
[#15] - Fix Hibernate Lazy Loading Errors
R1.47.0_fix_role_assign
para
R1.44.0_AMS_SpringUpgrade
Visão geral 
0
Commits 
17
Pipelines 
2
Alterações 
16
Comparar
e
 16 arquivos
+
240
−
31
Arquivos
16
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/ams‎

d
‎b‎

Permiss
‎ion.java‎
+2 -0

Role
‎.java‎
+2 -0

SubSyst
‎em.java‎
+2 -0

User
‎.java‎
+2 -0

UserGro
‎up.java‎
+2 -0

repos
‎itory‎

UserRepos
‎itory.java‎
+17 -3

UserReposito
‎ryCustom.java‎
+10 -0

UserReposit
‎oryImpl.java‎
+110 -0

envir
‎onment‎

Environment
‎Service.java‎
+9 -9

Uown
‎.java‎
+11 -2

ser
‎vice‎

Authorizatio
‎nService.java‎
+45 -10

PermissionGra
‎phBuilder.java‎
+2 -0

RoleServ
‎ice.java‎
+11 -4

UserServ
‎ice.java‎
+10 -2

w
‎eb‎

re
‎st‎

RoleContr
‎oller.java‎
+3 -0

secu
‎rity‎

HeaderBasedSecurityC
‎ontextRepository.java‎
+2 -1

 src/main/java/com/uownleasing/ams/db/entity/SubSystem.java 
+
2
−
0

Visualizado
package com.uownleasing.ams.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uownleasing.ams.db.entity.superentity.SuperEntity;
import lombok.EqualsAndHashCode;
import lombok.Getter;
@@ -15,6 +16,7 @@ import jakarta.persistence.Entity;
@Setter
@EqualsAndHashCode(callSuper = false)
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SubSystem extends SuperEntity {

    @Column(nullable = false, unique = true)
 src/main/java/com/uownleasing/ams/db/entity/User.java 
+
2
−
0

Visualizado
package com.uownleasing.ams.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.uownleasing.ams.db.entity.superentity.SuperEntity;
@@ -25,6 +26,7 @@ import java.util.*;
@Setter
@NoArgsConstructor
@Table(name = "`user`" /* avoid sql keyword clash causing errors */)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends SuperEntity {

    private String firstName;
 src/main/java/com/uownleasing/ams/db/entity/UserGroup.java 
+
2
−
0

Visualizado
package com.uownleasing.ams.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uownleasing.ams.db.entity.superentity.SuperEntity;
import lombok.Getter;
import lombok.Setter;
@@ -11,6 +12,7 @@ import jakarta.persistence.*;
@Setter
@Getter
@Slf4j
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserGroup extends SuperEntity {
    private String name;
}
 src/main/java/com/uownleasing/ams/db/repository/UserRepository.java 
+
17
−
3

Visualizado
@@ -7,20 +7,34 @@ import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User>, UserRepositoryCustom {

    User findFirstByOrderByPk();

    Optional<User> findByPk(long pk);
    Optional<User> findOneByResetKey(String resetKey);

    Optional<User> findByEmailAddressIgnoreCase(String email);
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.emailAddress) = LOWER(:email)")
    Optional<User> findByEmailAddressIgnoreCase(@Param("email") String email);

    Optional<User> findByPhoneNumber(String phone);
    Optional<User> findByUserNameIgnoreCase(String username);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.userName) = LOWER(:username)")
    Optional<User> findByUserNameIgnoreCase(@Param("username") String username);

    @Query("SELECT DISTINCT u FROM User u " +
        "LEFT JOIN FETCH u.roles r " +
        "LEFT JOIN FETCH r.subSystem " +
        "LEFT JOIN FETCH r.rolePermissions rp " +
        "LEFT JOIN FETCH rp.permission rpPerm " +
        "LEFT JOIN FETCH rpPerm.subSystem " +
        "WHERE u.pk = :userId")
    Optional<User> findByIdWithRolesAndPermissions(@Param("userId") Long userId);

    Optional<User> findOneByLoginToken(String token);
    Optional<List<User>> findAllByMerchantCodes(String merchantCodes);
 src/main/java/com/uownleasing/ams/db/repository/UserRepositoryCustom.java  0 → 100644
+
10
−
0

Visualizado
package com.uownleasing.ams.db.repository;

import com.uownleasing.ams.db.entity.User;

import java.util.Optional;

public interface UserRepositoryCustom {
    Optional<User> findByIdWithAllCollections(Long userId);
}
 src/main/java/com/uownleasing/ams/db/repository/UserRepositoryImpl.java  0 → 100644
+
110
−
0

Visualizado
package com.uownleasing.ams.db.repository;

import com.uownleasing.ams.db.entity.Permission;
import com.uownleasing.ams.db.entity.Role;
import com.uownleasing.ams.db.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Hibernate;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class UserRepositoryImpl implements UserRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<User> findByIdWithAllCollections(Long userId) {
        // Query 1: Fetch User with roles and their nested collections
        String rolesQuery = "SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.roles r " +
            "LEFT JOIN FETCH r.subSystem " +
            "LEFT JOIN FETCH r.rolePermissions rp " +
            "LEFT JOIN FETCH rp.permission rpPerm " +
            "LEFT JOIN FETCH rpPerm.subSystem " +
            "WHERE u.pk = :userId";

        List<User> roleResults = entityManager.createQuery(rolesQuery, User.class)
            .setParameter("userId", userId)
            .getResultList();

        if (roleResults.isEmpty()) {
            return Optional.empty();
        }

        User user = roleResults.get(0);
        // User entity is now managed with roles loaded

        // Query 2: Fetch includePermissions with their subSystems
        String includePermsQuery = "SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.includePermissions ip " +
            "LEFT JOIN FETCH ip.subSystem " +
            "WHERE u.pk = :userId";

        List<User> includeResults = entityManager.createQuery(includePermsQuery, User.class)
            .setParameter("userId", userId)
            .getResultList();

        if (!includeResults.isEmpty()) {
            User userWithIncludePerms = includeResults.get(0);
            // Unproxy Permission entities before copying to ensure they're real objects, not proxies
            Set<Permission> unproxiedIncludePerms = new HashSet<>();
            for (Permission perm : userWithIncludePerms.getIncludePermissions()) {
                Permission unproxied = unproxyPermission(perm);
                unproxiedIncludePerms.add(unproxied);
            }
            user.setIncludePermissions(unproxiedIncludePerms);
        }

        // Query 3: Fetch excludePermissions with their subSystems
        String excludePermsQuery = "SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.excludePermissions ep " +
            "LEFT JOIN FETCH ep.subSystem " +
            "WHERE u.pk = :userId";

        List<User> excludeResults = entityManager.createQuery(excludePermsQuery, User.class)
            .setParameter("userId", userId)
            .getResultList();

        if (!excludeResults.isEmpty()) {
            User userWithExcludePerms = excludeResults.get(0);
            Set<Permission> unproxiedExcludePerms = new HashSet<>();
            for (Permission perm : userWithExcludePerms.getExcludePermissions()) {
                Permission unproxied = unproxyPermission(perm);
                unproxiedExcludePerms.add(unproxied);
            }
            user.setExcludePermissions(unproxiedExcludePerms);
        }

        Set<Role> unproxiedRoles = new HashSet<>();
        for (Role role : user.getRoles()) {
            Role unproxied = unproxyRole(role);
            unproxiedRoles.add(unproxied);
        }
        user.setRoles(unproxiedRoles);

        return Optional.of(user);
    }

    private Permission unproxyPermission(Permission permission) {
        if (permission instanceof HibernateProxy) {
            return (Permission) Hibernate.unproxy(permission);
        }
        return permission;
    }

    private Role unproxyRole(Role role) {
        if (role instanceof HibernateProxy) {
            return (Role) Hibernate.unproxy(role);
        }
        return role;
    }
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. **[PT] O AMS no Dev3 não deve mais lançar erros de Hibernate Lazy Loading (ex.: `LazyInitializationException`) em fluxos e endpoints que retornam entidades com relacionamentos.**
   **[EN] On Dev3, AMS must no longer throw Hibernate lazy-loading errors (e.g., `LazyInitializationException`) on flows/endpoints that serialize relationship-heavy entities.**
   **Motivo:** Objetivo explícito do MR !39: “Fix Hibernate Lazy Loading Errors”.

2. **[PT] As respostas JSON para `User`, `Role`, `Permission`, `SubSystem` e `UserGroup` não devem falhar por proxies do Hibernate, nem expor campos internos (`hibernateLazyInitializer`, `handler`) no payload.**
   **[EN] JSON responses for `User`, `Role`, `Permission`, `SubSystem`, and `UserGroup` must not fail due to Hibernate proxies, nor expose internal fields (`hibernateLazyInitializer`, `handler`) in payloads.**
   **Motivo:** Adição de `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` nas entidades.

3. **[PT] A busca de usuário por e-mail (case-insensitive) deve retornar o usuário com `roles` já carregadas (sem lazy-load posterior durante serialização).**
   **[EN] User lookup by email (case-insensitive) must return the user with `roles` preloaded (no lazy-load during serialization).**
   **Motivo:** `UserRepository.findByEmailAddressIgnoreCase` passou a usar `LEFT JOIN FETCH u.roles`.

4. **[PT] A busca de usuário por username (case-insensitive) deve retornar o usuário com `roles` já carregadas (sem lazy-load posterior durante serialização).**
   **[EN] User lookup by username (case-insensitive) must return the user with `roles` preloaded (no lazy-load during serialization).**
   **Motivo:** `UserRepository.findByUserNameIgnoreCase` passou a usar `LEFT JOIN FETCH u.roles`.

5. **[PT] O endpoint/serviço que carrega usuário “com roles e permissões” deve retornar o usuário com: `roles`, `role.subSystem`, `role.rolePermissions`, `rolePermissions.permission`, `permission.subSystem` todos carregados, sem erros de serialização.**
   **[EN] The endpoint/service that loads user “with roles and permissions” must return the user with `roles`, `role.subSystem`, `role.rolePermissions`, `rolePermissions.permission`, and `permission.subSystem` fully loaded, without serialization errors.**
   **Motivo:** Novo método `UserRepository.findByIdWithRolesAndPermissions` com múltiplos `JOIN FETCH`.

6. **[PT] O método customizado `findByIdWithAllCollections` deve retornar o usuário com `roles`, `includePermissions` e `excludePermissions` carregados, e cada permission com `subSystem`, sem proxies do Hibernate no retorno.**
   **[EN] The custom method `findByIdWithAllCollections` must return the user with `roles`, `includePermissions`, and `excludePermissions` loaded, and each permission with `subSystem`, with no Hibernate proxies in the output.**
   **Motivo:** Implementação nova em `UserRepositoryImpl` com 3 queries + “unproxy” de `Role` e `Permission`.

7. **[PT] Ao consultar detalhes de usuário (ou payloads usados pela UI), os conjuntos de permissões incluídas/excluídas devem ser serializáveis e consistentes, sem respostas intermitentes (500) ao atualizar/recarregar a tela.**
   **[EN] When retrieving user details (or UI payloads), included/excluded permission sets must be serializable and consistent, with no intermittent 500s on refresh/update.**
   **Motivo:** O fix atua diretamente em coleções `includePermissions`/`excludePermissions`.

8. **[PT] Fluxos de autenticação/autorização baseados em usuário (por e-mail/username/header) devem funcionar sem regressão: usuário autenticado deve receber contexto com roles/permissões sem falha de lazy-load.**
   **[EN] Authentication/authorization flows based on user (email/username/header) must not regress: authenticated users must receive a context with roles/permissions without lazy-load failures.**
   **Motivo:** Alterações em `AuthorizationService` e `HeaderBasedSecurityContextRepository`, além de queries de usuário.

9. **[PT] Endpoints de Role (controller) que retornam roles e suas permissões devem responder com HTTP 200 e payload íntegro (sem proxy/handler), especialmente em listas e detalhes.**
   **[EN] Role endpoints (controller) returning roles and their permissions must respond with HTTP 200 and an intact payload (no proxy/handler leakage), especially for list and detail views.**
   **Motivo:** Alteração em `RoleController` e entidades anotadas para ignorar proxies.

10. **[PT] Operações de atribuição/gestão de roles e permissões (via `RoleService`/`UserService`) devem persistir e refletir imediatamente ao reconsultar o usuário (sem necessidade de “segunda carga” que gerava lazy-load).**
    **[EN] Role/permission assignment and management operations (via `RoleService`/`UserService`) must persist and reflect immediately upon re-fetching the user (no “second load” that triggers lazy-loading).**
    **Motivo:** Alterações nesses serviços somadas às novas consultas “fetch join”.

11. **[PT] Construção/retorno de “permission graph” (quando utilizado) não deve gerar exceções de lazy-load e deve incluir SubSystem quando aplicável.**
    **[EN] Permission graph construction/return (when used) must not trigger lazy-load exceptions and must include SubSystem where applicable.**
    **Motivo:** Alteração em `PermissionGraphBuilder` + entidades com `SubSystem` e fetch joins.

12. **[PT] Critério geral de estabilidade: durante navegação primária e abertura de listas/detalhes principais do AMS no Dev3, não deve haver HTTP 500 nem erros no console por serialização de relacionamentos.**
    **[EN] General stability criterion: during primary navigation and opening core AMS lists/details on Dev3, there must be no HTTP 500s nor console errors caused by relationship serialization.**
    **Motivo:** Requisito diretamente derivado do objetivo do fix (impacto UI + API).

Se você me disser quais telas/rotas do AMS você vai cobrir (ex.: Users, Roles, Permissions), eu converto essa lista em **requisitos rastreáveis por endpoint** (incluindo “o que validar no payload” por rota).

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## 🇧🇷 Texto em Português (para colar na tarefa)

> Validado em **Dev3**.
> Navegação pelas principais telas do AMS realizada com sucesso, incluindo listagens e telas de detalhe.
> Os endpoints relacionados a usuários, roles, permissões e associações não apresentam mais erros de Hibernate lazy-loading.
> Não foram observados HTTP 500, falhas de serialização ou erros intermitentes durante os fluxos testados.

---

## 🇺🇸 Text in English (for task update)

```markdown
Validated on **Dev3**.

Navigation through the main AMS screens was performed successfully, including list and detail views.

User-, role-, permission-, and association-related endpoints no longer show Hibernate lazy-loading errors.

No HTTP 500 responses, serialization failures, or intermittent errors were observed during the tested flows.
```

---
