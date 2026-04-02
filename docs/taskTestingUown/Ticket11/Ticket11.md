-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/11

```markdown
# UOWN | AMS  
## Add Permission Assignment Step to User Creation Flow in AMS  
**Status:** Ready for QA  
**Scope:** Functional / Integration Testing  
**Subsystem:** AMS  

---

## ENGLISH VERSION

### 1. Overview
This task introduces a mandatory **Permission Assignment** step in the **User Creation** flow within AMS.  
The objective is to ensure that no user can be created without at least one permission assigned, preventing login and access issues caused by missing permissions.

---

### 2. Business Goal
- Ensure newly created users have valid permissions at creation time.
- Eliminate the need for manual permission updates after user creation.
- Improve reliability and correctness of the AMS user onboarding flow.

---

### 3. Features Implemented
- A new step/section for **Permission Assignment** added to the User Creation modal.
- User creation cannot be completed unless **at least one permission** is selected.
- Permissions are persisted and applied immediately after user creation.
- AMS subsystem is explicitly included.
- Roles automatically assign their default permissions.
- Additional permissions can be manually added beyond role defaults.
- User permissions visualization includes:
  - Permissions inherited from roles.
  - Permissions added manually.

---

### 4. Preconditions
- Tester has access to AMS with admin privileges.
- AMS environment is up and running.
- Backend and frontend deployments related to:
  - `ams-website`
  - `uownleasing-ui`
  - `origination`
  are available in the testing environment.

---

### 5. Test Scenarios

#### TC-01 – User Creation Flow Includes Permission Step
**Steps:**
1. Open AMS.
2. Navigate to **User Management**.
3. Click **Create New User**.
4. Fill in email and username.
5. Proceed through the flow.

**Expected Result:**
- A dedicated step/section for **Permission Assignment** is displayed before completion.

---

#### TC-02 – Prevent User Creation Without Permissions
**Steps:**
1. Open the User Creation modal.
2. Fill all mandatory user fields.
3. Do not select any permission.
4. Attempt to complete user creation.

**Expected Result:**
- The flow cannot be completed.
- A validation message indicates that at least one permission is required.

---

#### TC-03 – Assign Permissions via Role (AMS Subsystem)
**Steps:**
1. Create a new user.
2. Select a role associated with the **AMS subsystem**.
3. Proceed to the permissions step.

**Expected Result:**
- Permissions related to the AMS role are automatically selected.
- No permissions from unrelated subsystems are included.
- No 404 or API errors occur.

---

#### TC-04 – Add Extra Permissions Manually
**Steps:**
1. Create a new user.
2. Select a role.
3. In the permissions step, manually add extra permissions not included in the role.
4. Complete user creation.

**Expected Result:**
- User is created successfully.
- Both role-based and manually added permissions are persisted.

---

#### TC-05 – Validate Persisted Permissions
**Steps:**
1. Create a user with role-based and manual permissions.
2. Open the created user details.
3. Inspect assigned permissions.

**Expected Result:**
- Permissions inherited from the role are visible.
- Manually added permissions are visible.
- No missing or duplicated permissions.

---

#### TC-06 – Login Validation
**Steps:**
1. Create a user with valid AMS permissions.
2. Log out.
3. Attempt to log in using the newly created user.

**Expected Result:**
- Login succeeds.
- User can access AMS features according to assigned permissions.

---

### 6. Non-Functional Checks
- Loaders must remain active until requests finish.
- User cannot interrupt permission persistence mid-process.
- No unexpected redirects to login during user creation.
- No 404 errors caused by wrong subsystem permissions.

---

### 7. Acceptance Criteria
- User creation is blocked without permissions.
- Permissions are saved at creation time.
- AMS subsystem permissions are correctly filtered.
- Role-based and manual permissions coexist correctly.
- No regression in existing user creation flow.

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## VERSÃO EM PORTUGUÊS

### 1. Visão Geral
Esta tarefa adiciona uma etapa obrigatória de **Atribuição de Permissões** ao fluxo de **Criação de Usuário** no AMS.  
O objetivo é garantir que nenhum usuário seja criado sem permissões, evitando problemas de login e acesso.

---

### 2. Objetivo de Negócio
- Garantir que usuários recém-criados já possuam permissões válidas.
- Eliminar ajustes manuais de permissões após a criação.
- Tornar o onboarding de usuários no AMS mais confiável.

---

### 3. Funcionalidades Implementadas
- Nova etapa/seção de **Permissões** no modal de criação de usuário.
- Não é possível concluir a criação sem selecionar ao menos uma permissão.
- As permissões são salvas e aplicadas imediatamente.
- Inclusão explícita do subsistema **AMS**.
- Papéis (roles) atribuem automaticamente suas permissões padrão.
- Permite adicionar permissões extras manualmente.
- Visualização de permissões do usuário inclui:
  - Permissões herdadas do role.
  - Permissões adicionadas manualmente.

---

### 4. Pré-requisitos
- Acesso administrativo ao AMS.
- Ambiente AMS disponível para testes.
- Deploys atualizados de:
  - `ams-website`
  - `uownleasing-ui`
  - `origination`

---

### 5. Cenários de Teste

#### CT-01 – Etapa de Permissões no Fluxo de Criação
**Passos:**
1. Acessar o AMS.
2. Ir para **Gerenciamento de Usuários**.
3. Clicar em **Criar Novo Usuário**.
4. Preencher email e username.
5. Avançar no fluxo.

**Resultado Esperado:**
- Uma etapa/seção de **Atribuição de Permissões** é exibida antes da finalização.

---

#### CT-02 – Bloquear Criação Sem Permissões
**Passos:**
1. Abrir o modal de criação de usuário.
2. Preencher todos os campos obrigatórios.
3. Não selecionar nenhuma permissão.
4. Tentar concluir a criação.

**Resultado Esperado:**
- A criação é bloqueada.
- Mensagem informando que ao menos uma permissão é obrigatória.

---

#### CT-03 – Atribuição de Permissões via Role (AMS)
**Passos:**
1. Criar um novo usuário.
2. Selecionar um role do subsistema **AMS**.
3. Avançar para a etapa de permissões.

**Resultado Esperado:**
- Permissões do role AMS são atribuídas automaticamente.
- Nenhuma permissão de outros subsistemas é incluída.
- Não ocorrem erros 404 ou falhas de API.

---

#### CT-04 – Adicionar Permissões Manuais
**Passos:**
1. Criar um usuário.
2. Selecionar um role.
3. Adicionar permissões extras manualmente.
4. Finalizar a criação.

**Resultado Esperado:**
- Usuário criado com sucesso.
- Permissões do role e manuais são persistidas corretamente.

---

#### CT-05 – Validação das Permissões Salvas
**Passos:**
1. Criar um usuário com permissões automáticas e manuais.
2. Acessar os detalhes do usuário.
3. Verificar permissões atribuídas.

**Resultado Esperado:**
- Permissões herdadas do role visíveis.
- Permissões manuais visíveis.
- Nenhuma permissão ausente ou duplicada.

---

#### CT-06 – Validação de Login
**Passos:**
1. Criar um usuário com permissões AMS válidas.
2. Fazer logout.
3. Logar com o novo usuário.

**Resultado Esperado:**
- Login realizado com sucesso.
- Acesso permitido conforme permissões atribuídas.

---

### 6. Verificações Não Funcionais
- Loaders não devem ser desativados prematuramente.
- O usuário não pode interromper a persistência das permissões.
- Não deve haver redirecionamento inesperado para login.
- Não devem ocorrer erros 404 por permissões de subsistemas incorretos.

---

### 7. Critérios de Aceite
- Criação de usuário bloqueada sem permissões.
- Permissões aplicadas no momento da criação.
- Permissões corretamente filtradas por subsistema AMS.
- Convivência correta entre permissões de role e manuais.
- Nenhuma regressão no fluxo existente.

---
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 4 arquivos
+
8
−
7
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

pa
‎ges‎

blac
‎klist‎

inde
‎x.tsx‎
+1 -1

fundingModifi
‎cationHistory‎

inde
‎x.tsx‎
+2 -1

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 pages/blacklist/index.tsx 
+
1
−
1

Visualizado
@@ -6,7 +6,6 @@ import {
  EmailCSVModal,
  FilterTable,
  Modal,
  UtilityStore,
} from '@uownleasing/common-ui';
import {useFormik} from 'formik';
import {
@@ -25,6 +24,7 @@ import * as Yup from 'yup';
import {formatDate, showToast, hasModifyPermission} from '@uownleasing/common-utilities';
import {OverviewStore} from '@stores/overview';
import {AccountStore} from '@stores/account';
import {UtilityStore} from '@stores/utility';

interface BlacklistProps {
  utilityStore: UtilityStore;
 pages/fundingModificationHistory/index.tsx 
+
2
−
1

Visualizado
import React, {useEffect, useState} from 'react';
import AuthWrapper from '@layouts/auth';
import {EmailCSVModal, FilterTable, UtilityStore} from '@uownleasing/common-ui';
import {EmailCSVModal, FilterTable} from '@uownleasing/common-ui';
import {inject, observer} from 'mobx-react';
import {FundingModificationHistoryStore} from '@stores/funding-modification-history';
import {
@@ -20,6 +20,7 @@ import {
} from '@models';
import {OverviewStore} from '@stores/overview';
import {AccountStore} from '@stores/account';
import {UtilityStore} from '@stores/utility';
import * as Yup from 'yup';

interface FundingModificationHistoryProps {
 package.json 
+
1
−
1

Visualizado
@@ -30,7 +30,7 @@
    "@seontechnologies/seon-id-verification": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.395",
    "@uownleasing/common-ui": "0.0.398",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1660,10 +1660,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.395":
  version "0.0.395"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.395.tgz#38063164256df29150654045f3e6e9cc06c97ecc"
  integrity sha512-Mno5l2CyIh8Vke+ngF20E2l0pm9EPTZjt7xeBsFcH6RfmBT42wR6ToExPJsNKn29J8XLWVD/MUYFJVoOc2LwGA==
"@uownleasing/common-ui@0.0.398":
  version "0.0.398"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.398.tgz#3c71ca4a470cc45bc280742e977238b803c8a70f"
  integrity sha512-u2xk9t9+l+45upaKc+aoWQkGSr+vtDFYunoUlfvltu8CK68Lni7NZ584GuCZZFz7DFUXPXEuxilJfFznw+mqMQ==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---
Página inicial
Navegação primária
Projeto
U
uownleasing-ui

Fixada
Issues
0
Solicitações de mesclagem
0

Gerenciar

Plano

Código
Solicitações de mesclagem
0
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
frontend
uownleasing-ui
Solicitações de mesclagem
!429
[uown/backend/ams#11] R1.48.0 Ams modules removed
Mesclado
[uown/backend/ams#11] R1.48.0 Ams modules removed
ams-modules-removed
para
main
Visão geral 
0
Commits 
5
Pipelines 
3
Alterações 
51
Comparar
e
 51 arquivos
+
9
−
4904
Arquivos
51
Pesquisar (por exemplo, *.vue) (F)

deployment_sc
‎ripts/projects‎

ams-common.gitl
‎ab.disabled.yaml‎
+0 -34

libs/co
‎mmon-ui‎

s
‎rc‎

a
‎ms‎

compo
‎nents‎

edit-
‎panels‎

general/perm
‎issions-panel‎

index.mo
‎dule.scss‎
+0 -16

index.st
‎ories.tsx‎
+0 -72

inde
‎x.tsx‎
+0 -251

user-s
‎pecific‎

gr
‎oup‎

inde
‎x.tsx‎
+0 -125

merc
‎hant‎

inde
‎x.tsx‎
+0 -180

pass
‎word‎

inde
‎x.tsx‎
+0 -127

permi
‎ssion‎

permission
‎-categories‎

inde
‎x.tsx‎
+0 -117

index.mo
‎dule.scss‎
+0 -13

 libs/common-ui/src/ams/test/styles/index.scss excluído  100644 → 0
+
0
−
45

Visualizado
@import '~bootstrap/scss/bootstrap';

:root {
  --white: #fff;
  --black: #000;
  --red: #fb0022;
  --green: #049e38;
  --error: #e50000;
  --primary: #1cade4;
  --secondary: #1895c4;
  --primary-selected: #0d5672;
  --show-password: #5bcbf5;
  --hide-password: #959595;
  --primary-font: #313131;
  --border: #bababa;
  --dark-border: #969696;
  --navbar-hover: #006b8e;
  --navbar-selected: #016b8e;
  --alert-background: #ffe6e6;
  --account-summary-green: #f9ffcb;
  --login-icon-background: #fafafc;
  --navbar-background-color: #1cade4;
  --navbar-font-color: #fff;
  --default-page-background-color: #f4f4f4;
  --sidebar-selected-triangle-color: #fff;
  --hover-color: #eaeaea;
  --regular-font: gotham-book;
  --bold-font: gotham-medium;
  --loader: #016b8e;
  --disabled: #777;
  --login-container-background-color: #fff;
  --login-container-primary-button-background-color: transparent;
  --login-container-primary-button-text-color: #1cade4;
  --unauthenticated-layout-footer-background-color: #1cade4;
}

@font-face {
  font-family: 'Gotham-Book';
  src: local('Gotham'), url('../fonts/Gotham-Book.otf') format('opentype');
}

@font-face {
  font-family: 'Gotham-Medium';
  src: local('Gotham'), url('../fonts/Gotham-Medium.otf') format('opentype');
}
 libs/common-ui/src/ams/index.ts excluído  100644 → 0
+
0
−
33

Visualizado
export * from './components/edit-panels/tag';

export * from './components/edit-panels/user-specific/password';
export * from './components/edit-panels/user-specific/role';
export * from './components/edit-panels/user-specific/user';
export * from './components/edit-panels/user-specific/username';
export * from './components/edit-panels/user-specific/merchant';
export * from './components/edit-panels/user-specific/permission';
export * from './components/edit-panels/user-specific/group';

export * from './components/edit-panels/general/permissions-panel';

export * from './components/form-controls/flipswitch';

export * from './components/modals/add-permission';
export * from './components/modals/add-role';
export * from './components/modals/add-user/index';
export * from './components/modals/add-user/new-user-form';
export * from './components/modals/add-user/roles-and-merchants';

export * from './models/merchant-info';
export * from './models/merchants-name-code-map';
export * from './models/security/permission';
export * from './models/security/role';
export * from './models/security/search-page';
export * from './models/security/user';
export * from './models/update-username';
export * from './models/user-group';
export * from './models/groups-with-users';

export * from './stores/permissions';
export * from './stores/account';
export * from './stores/utility';
 libs/common-ui/src/ams/components/form-controls/flipswitch/index.scss → libs/common-ui/src/lib/flipswitch/index.scss 
+
0
−
0

Visualizado
Arquivo renomeado sem alterações. Mostrar conteúdo do arquivo
 libs/common-ui/src/ams/components/form-controls/flipswitch/index.tsx → libs/common-ui/src/lib/flipswitch/index.tsx 
+
6
−
7

Visualizado
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheck} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import React, {useEffect, useState} from 'react';
import './index.scss';

interface FlipSwitchProps {
@@ -14,7 +14,7 @@ interface FlipSwitchProps {
}

export const FlipSwitch = (props: FlipSwitchProps) => {
  const { label, className, checked, onChange, name, isWriteMode } = props;
  const {label, className, checked, onChange, name, isWriteMode} = props;
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
@@ -26,9 +26,8 @@ export const FlipSwitch = (props: FlipSwitchProps) => {
        'flip-switch',
        !isWriteMode &&
          'd-flex flex-lg-column align-items-center justify-content-between',
        className
      )}
    >
        className,
      )}>
      <div className="w-100 flip-switch__label">{label}</div>
      {isWriteMode ? (
        <>
 libs/common-ui/src/ams/components/edit-panels/tag/index.module.scss → libs/common-ui/src/lib/tags/index.module.scss 
+
0
−
0

Visualizado
Arquivo renomeado sem alterações. Mostrar conteúdo do arquivo
 libs/common-ui/src/ams/components/edit-panels/tag/index.tsx → libs/common-ui/src/lib/tags/index.tsx 
+
0
−
0

Visualizado
Arquivo renomeado sem alterações. Mostrar conteúdo do arquivo
 libs/common-ui/src/index.ts 
+
2
−
3

Visualizado
// AMS exports
export * from './ams';

export * from './lib/add-new-log-modal';
export * from './lib/tags';
export * from './lib/flipswitch';
export * from './lib/alert-block';
export * from './lib/application/employment';
export * from './lib/buttons/main';
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.397",
  "version": "0.0.398",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

---

Página inicial
Navegação primária
Projeto
A
ams-website

Fixada
Issues
9
Solicitações de mesclagem
0

Gerenciar

Plano

Código
Solicitações de mesclagem
0
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
frontend
ams-website
Solicitações de mesclagem
!146
[uown/backend/ams#11] R1.48.0 Ams code extracted from common ui
Mesclado
[uown/backend/ams#11] R1.48.0 Ams code extracted from common ui
ams-code-extracted-from-common-ui
para
R1.48.0
Visão geral 
0
Commits 
5
Pipelines 
3
Alterações 
43
Comparar
e
 43 arquivos
+
4286
−
133
Arquivos
43
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

edit-
‎panels‎

general/perm
‎issions-panel‎

index.mo
‎dule.scss‎
+16 -0

inde
‎x.tsx‎
+249 -0

user-s
‎pecific‎

gr
‎oup‎

inde
‎x.tsx‎
+124 -0

merc
‎hant‎

inde
‎x.tsx‎
+174 -0

pass
‎word‎

inde
‎x.tsx‎
+126 -0

permi
‎ssion‎

permission
‎-categories‎

inde
‎x.tsx‎
+148 -0

index.mo
‎dule.scss‎
+18 -0

inde
‎x.tsx‎
+661 -0

ro
‎le‎

inde
‎x.tsx‎
+184 -0

us
‎er‎

inde
‎x.tsx‎
+236 -0

user
‎name‎

 stores/root.tsx 
+
13
−
17

Visualizado
import {create} from 'mobx-persist';
import {
  AccountStore,
  PermissionsStore,
  UtilityStore,
  PermissionsStoreRoutes,
  AccountStoreRoutes,
} from '@uownleasing/common-ui';
import {MerchantStore} from 'stores/merchant';
import {AccountStore, AccountStoreRoutes} from './account';
import {GroupStore} from './group';
import {MerchantStore} from './merchant';
import {PermissionsStore, PermissionsStoreRoutes} from './permissions';
import {UtilityStore} from './utility';

const hydrate = create({
  jsonify: true,
@@ -80,21 +76,21 @@ export class RootStore {
  constructor() {
    if (typeof window !== 'undefined') {
      Promise.all([
        hydrate('accountStore', this?.accountStore),
        hydrate('utilityStore', this?.utilityStore),
        hydrate('accountStore', this.accountStore),
        hydrate('utilityStore', this.utilityStore),
        hydrate('permissionsStore', this.permissionsStore),
        hydrate('merchantStore', this?.merchantStore),
        hydrate('groupStore', this?.groupStore),
        hydrate('merchantStore', this.merchantStore),
        hydrate('groupStore', this.groupStore),
      ]);
    }
  }

  reset(): void {
    this?.accountStore?.reset();
    this?.utilityStore?.reset();
    this?.permissionsStore?.reset();
    this?.merchantStore?.reset();
    this?.groupStore?.reset();
    this.accountStore?.reset();
    this.utilityStore?.reset();
    this.permissionsStore?.reset();
    this.merchantStore?.reset();
    this.groupStore?.reset();
  }
}

 stores/utility.tsx  0 → 100644
+
117
−
0

Visualizado
import {makeObservable, observable, action} from 'mobx';
import {persist} from 'mobx-persist';
import {AxiosRequestConfig, AxiosResponseHeaders} from 'axios';
import {sendRequest} from '@uownleasing/common-utilities';

interface SendRequestProps extends AxiosRequestConfig {
  isHandleLoader?: boolean;
}

export class UtilityStore {
  @observable
  @persist
  subSystem: string = '';

  @observable
  @persist
  isLoading: boolean = false;

  @observable
  @persist
  isErrorCoolDown: boolean = false;

  rootStore: any;

  constructor(rootStore: any) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  setSubSystem = (subSystem: string) => {
    this.subSystem = subSystem;
  };

  @action
  updateUsersPage = async (): Promise<any> => {
    const {permissionsStore} = this.rootStore || {};
    const promises = [];
    promises.push(permissionsStore?.getAllRoles());
    await Promise.all(promises);
  };

  sendRequest = async (props: SendRequestProps): Promise<any> => {
    const {accountStore} = this.rootStore || {};
    const userToken = accountStore?.userToken || '';
    const username = accountStore?.userEmail || '';

    const {isHandleLoader, ...sendRequestProps} = props;

    const userPath =
      typeof window === 'undefined' ? '' : window?.location?.pathname;

    const reqConfig: AxiosRequestConfig = {
      headers: {
        token: userToken,
        username: username,
        'user-path': userPath,
        'content-type': 'application/json',
        'sub-system': this.subSystem || '',
        Authorization: accountStore?.authToken
          ? `Bearer ${accountStore?.authToken}`
          : '',
      },
      ...sendRequestProps,
    };

    const handleResponseHeaders = (headers: AxiosResponseHeaders) => {
      const newUserToken = headers?.token || '';
      if (newUserToken) {
        accountStore.setUserToken(newUserToken);
      }
    };

    const refreshBackgroundData = async () => {
      const {method = 'GET', url = ''} = props || {};
      // Refreshes data whenever a non-GET request is ran.
      // Skip background refresh for login and authentication endpoints (including password reset)
      const isAuthEndpoint =
        url?.includes('/login') || url?.includes('/authentication/');
      if (method !== 'GET' && !isAuthEndpoint) {
        await this.updateUsersPage();
      }
    };

    if (isHandleLoader) {
      this.setIsLoading(true);
    }
    const response = await sendRequest({
      reqConfig,
      handleResponseHeaders,
      refreshBackgroundData,
      isErrorCoolDown: this.isErrorCoolDown || false,
      setIsErrorCoolDown: this.setIsErrorCoolDown || (() => undefined),
      logout: accountStore.logout,
    });
    if (isHandleLoader) {
      this.setIsLoading(false);
    }
    return response;
  };

  @action
  setIsLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };

  @action
  setIsErrorCoolDown = (isErrorCoolDown: boolean) => {
    this.isErrorCoolDown = isErrorCoolDown;
  };

  @action
  reset = (): void => {
    this.subSystem = '';
    this.isLoading = false;
  };
}
 package.json 
+
1
−
1

Visualizado
@@ -28,7 +28,7 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.393",
    "@uownleasing/common-ui": "0.0.398",
    "@uownleasing/common-utilities": "0.0.54",
    "@uownleasing/server-utilities": "0.0.24",
    "bootstrap": "^4.6.0",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1817,10 +1817,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.393":
  version "0.0.393"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.393.tgz#661216067168f70056521f2541556b9a6fcf90a4"
  integrity sha512-kb/9p0fx7J9Bon5GJ2EJxRADr/p4MCFfSvRWxRgRFV5nafef2XZtgudnwIYD96FHueo4CACGIBFh5ws8c070hA==
"@uownleasing/common-ui@0.0.398":
  version "0.0.398"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.398.tgz#3c71ca4a470cc45bc280742e977238b803c8a70f"
  integrity sha512-u2xk9t9+l+45upaKc+aoWQkGSr+vtDFYunoUlfvltu8CK68Lni7NZ584GuCZZFz7DFUXPXEuxilJfFznw+mqMQ==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---

Página inicial
Navegação primária
Projeto
A
ams-website

Fixada
Issues
9
Solicitações de mesclagem
0

Gerenciar

Plano

Código
Solicitações de mesclagem
0
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
frontend
ams-website
Solicitações de mesclagem
!143
[uown/backend/ams#11] New user assigment steps
Mesclado
[uown/backend/ams#11] New user assigment steps
new-user-assigment-steps
para
R1.48.0
Visão geral 
1
Commits 
39
Pipelines 
21
Alterações 
18
Comparar
e
 18 arquivos
+
987
−
484
Arquivos
18
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

edit-
‎panels‎

general/perm
‎issions-panel‎

inde
‎x.tsx‎
+1 -1

user-s
‎pecific‎

gr
‎oup‎

inde
‎x.tsx‎
+1 -1

merc
‎hant‎

inde
‎x.tsx‎
+2 -2

pass
‎word‎

inde
‎x.tsx‎
+1 -1

ro
‎le‎

inde
‎x.tsx‎
+1 -1

roles-and
‎-merchants‎

index.mo
‎dule.scss‎
+4 -0

inde
‎x.tsx‎
+0 -0

us
‎er‎

inde
‎x.tsx‎
+1 -1

modals/
‎add-user‎

index.mo
‎dule.scss‎
+12 -7

inde
‎x.tsx‎
+367 -344

new-user
‎-form.tsx‎
+62 -83

 pages/users/index.tsx 
+
37
−
36

Visualizado
@@ -45,6 +45,7 @@ import EditUserPermissionPanel from '@components/edit-panels/user-specific/permi
import EditRolePermissionPanel from '@components/edit-panels/user-specific/role';
import EditPasswordPanel from '@components/edit-panels/user-specific/password';
import EditUserPanel from '@components/edit-panels/user-specific/user';
import {NewUserDataType} from '@components/modals/add-user/step-data';
import {AddUserModal} from '@components/modals/add-user';

interface AccountsPageProps {
@@ -52,7 +53,7 @@ interface AccountsPageProps {
  groupStore: GroupStore;
  merchantStore?: MerchantStore;
  permissionsStore?: PermissionsStore;
  utilityStore?: UtilityStore;
  utilityStore: UtilityStore;
}

const AccountsPage = (props: AccountsPageProps) => {
@@ -89,25 +90,25 @@ const AccountsPage = (props: AccountsPageProps) => {
  };

  const loadPermissionsData = async () => {
    utilityStore?.setIsLoading(true);
    utilityStore?.setSubSystem('ams-auth');
    await utilityStore?.updateUsersPage();
    utilityStore.setIsLoading(true);
    utilityStore.setSubSystem('ams-auth');
    await utilityStore.updateUsersPage();
    await loadMerchantsData();
    utilityStore?.setIsLoading(false);
    utilityStore.setIsLoading(false);
  };

  const updateSearchResults = async (searchParams: Search) => {
    const {searchString, roles, page, newPerPage, locked} = searchParams;
    const hasNewPerPage = isNaN(newPerPage);
    const pageValue = !hasNewPerPage ? newPerPage : rowsPerPage;
    setLoginStatus(locked);
    const pageValue = Number.isNaN(searchParams.newPerPage)
      ? rowsPerPage
      : searchParams.newPerPage;
    setLoginStatus(searchParams.locked);

    const response = await merchantStore.searchForUsersByString(
      searchString,
      roles.toString(),
      page,
      searchParams.searchString,
      searchParams.roles.toString(),
      searchParams.page,
      pageValue,
      locked,
      searchParams.locked,
    );
    const {status, data} = response;
    if (status !== 200) {
@@ -142,15 +143,15 @@ const AccountsPage = (props: AccountsPageProps) => {
  return (
    <AuthWrapper title="Manage Users">
      <AddUserModal
        permissionsStore={permissionsStore}
        isOpen={isAddUserModal}
        setIsOpen={setIsAddUserModal}
        roles={permissionsStore?.roles}
        setSubSystem={utilityStore?.setSubSystem}
        merchantsNameCodeMap={merchantStore?.merchantNamesRefCodesMap}
        assignMerchants={merchantStore?.assignMerchants}
        permissionsStore={permissionsStore}
        allSubsystems={['ams-auth', 'origination', 'servicing']}
        clonedUserData={clonedUserData}
        setClonedUserData={setClonedUserData}
        setSubSystem={utilityStore.setSubSystem}
        roles={permissionsStore.roles}
        merchantsNameCodeMap={merchantStore.merchantNamesRefCodesMap}
        assignMerchants={merchantStore.assignMerchants}
        updateSearchResults={async () =>
          await updateSearchResults({
            searchString,
@@ -160,7 +161,6 @@ const AccountsPage = (props: AccountsPageProps) => {
          })
        }
        setClearSelectedRows={setClearSelectedRows}
        setClonedUserData={setClonedUserData}
      />
      <SubSystemSpecificPermissionsPanel
        setIsSetUserModal={setIsAddUserModal}
@@ -205,7 +205,7 @@ interface SubSystemSpecificPermissionsPanelProps {
  selectedUser: User;
  permissions: any;
  clonedUserData: User;
  setClonedUserData: (clonedUserData: User) => void;
  setClonedUserData: (clonedUserData: NewUserDataType) => void;
  setSearchString: (searchString: string) => void;
  searchString: string;
  setLimitUserByRoles: (limitUserByRoles: string[]) => void;
@@ -291,7 +291,7 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handlePageChange = async (page: number) => {
    utilityStore?.setSubSystem('ams-auth');
    utilityStore.setSubSystem('ams-auth');
    await updateSearchResults({
      searchString,
      roles: limitUserByRoles,
@@ -302,7 +302,7 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handlePerRowsChange = async (newPerPage: number, page: number) => {
    utilityStore?.setSubSystem('ams-auth');
    utilityStore.setSubSystem('ams-auth');
    await updateSearchResults({
      searchString,
      roles: limitUserByRoles,
@@ -313,17 +313,18 @@ const SubSystemSpecificPermissionsPanel = (
  };

  const handleUserClicked = async ({pk, userName}: User = {}) => {
    utilityStore?.setSubSystem('ams-auth');
    utilityStore.setSubSystem('ams-auth');
    setLoadingUserLogs(true);
    setUserPK(pk);
    const promises = [];
    promises.push(permissionsStore.getUser(userName));
    promises.push(permissionsStore.getUserLogs(pk));
    promises.push(permissionsStore.getUserPermissions(userName));
    promises.push(permissionsStore.getAllRoles());
    promises.push(permissionsStore.getAllRolePermissions());
    promises.push(groupStore.getGroupsForUser(userName));
    promises.push(groupStore.getAllGroups());
    const promises = [
      permissionsStore.getUser(userName),
      permissionsStore.getUserLogs(pk),
      permissionsStore.getUserPermissions(userName),
      permissionsStore.getAllRoles(),
      permissionsStore.getAllRolePermissions(),
      groupStore.getGroupsForUser(userName),
      groupStore.getAllGroups(),
    ];
    await Promise.all(promises).then(() => {
      setUserLogs(permissionsStore.activityLogs || defaultPaginatedResp([]));
    });
@@ -489,7 +490,7 @@ const SubSystemSpecificPermissionsPanel = (
              some(selectedRows, ['loginLockout', false])
            }
            onClick={async () => {
              utilityStore?.setSubSystem('ams-auth');
              utilityStore.setSubSystem('ams-auth');
              const promises = [];
              forEach(selectedRows, (row: User) => {
                const request = {
@@ -558,10 +559,10 @@ const SubSystemSpecificPermissionsPanel = (
            onSelectedRowsChange={async ({selectedRows}) => {
              setSelectedRows(selectedRows);
              if (selectedRows?.length === 1) {
                const selectedRow: User = selectedRows?.[0];
                const selectedRow: NewUserDataType = selectedRows?.[0];
                setClonedUserData(selectedRow);
              } else {
                setClonedUserData({});
                setClonedUserData(null);
              }
            }}
            pagination
@@ -643,7 +644,7 @@ const SubSystemSpecificPermissionsPanel = (
                activityLogs={userLogs?.content || []}
                hasNotesInternalPermission={false}
                hasNotesStandardPermission={false}
                setIsLoading={utilityStore?.setIsLoading}
                setIsLoading={utilityStore.setIsLoading}
                config={config}
                logTypes={userLogs?.filtersOptions?.logTypes || []}
                onChangePage={onChangePage}
 utils/helper.tsx 
+
35
−
0

Visualizado
@@ -75,3 +75,38 @@ export const convertArrayToString = (value: any[] = []): string => {
    return '';
  }
};

/**
 * Creates an array of values from the first array that are not included
 * in the other arrays, using a custom comparator function.
 *
 * @param {Function} comparator - The comparator invoked per element (a, b)
 * @param {Array} array - The array to inspect
 * @param {...Array} others - The arrays of values to exclude
 * @returns {Array} The new array of filtered values
 */
export function differenceWith<T>(
  comparator: (item1: T, item2: T) => boolean,
  array: T[],
  ...others: T[][]
): T[] {
  // Extract comparator (last argument) and other arrays
  // const comparator = args[args.length - 1];
  // const others = args.slice(0, -1);

  // Validate inputs
  if (!Array.isArray(array)) {
    return [];
  }
  if (typeof comparator !== 'function') {
    throw new TypeError('Comparator must be a function');
  }

  // Flatten all comparison arrays into one
  const excludeValues = others.flat();

  // Filter array keeping only values not found in excludeValues
  return array.filter((arrVal) => {
    return !excludeValues.some((exVal) => comparator(arrVal, exVal));
  });
}
 package.json 
+
1
−
1

Visualizado
@@ -37,7 +37,7 @@
    "cypress": "9.5.2",
    "express": "4.17.1",
    "express-session": "1.17.2",
    "formik": "^2.2.8",
    "formik": "^2.4.9",
    "handy-storage": "^2.1.6",
    "hazelcast-client": "5.1.0",
    "http-proxy-middleware": "1.0.6",
 yarn.lock 
+
19
−
6

Visualizado
@@ -1433,6 +1433,13 @@
  dependencies:
    "@types/node" "*"

"@types/hoist-non-react-statics@^3.3.1":
  version "3.3.7"
  resolved "https://registry.yarnpkg.com/@types/hoist-non-react-statics/-/hoist-non-react-statics-3.3.7.tgz#306e3a3a73828522efa1341159da4846e7573a6c"
  integrity sha512-PQTyIulDkIDro8P+IHbKCsw7U2xxBYflVzW/FgWdCAePD9xGSidgA76/GeJ6lBKoblyhf9pBY763gbrN+1dI8g==
  dependencies:
    hoist-non-react-statics "^3.3.0"

"@types/html-minifier-terser@^6.0.0":
  version "6.1.0"
  resolved "https://registry.yarnpkg.com/@types/html-minifier-terser/-/html-minifier-terser-6.1.0.tgz#4fc33a00c1d0c16987b1a20cf92d20614c55ac35"
@@ -4541,18 +4548,19 @@ form-data@~2.3.2:
    combined-stream "^1.0.6"
    mime-types "^2.1.12"

formik@^2.2.8:
  version "2.2.9"
  resolved "https://registry.yarnpkg.com/formik/-/formik-2.2.9.tgz#8594ba9c5e2e5cf1f42c5704128e119fc46232d0"
  integrity sha512-LQLcISMmf1r5at4/gyJigGn0gOwFbeEAlji+N9InZF6LIMXnFNkO42sCI8Jt84YZggpD4cPWObAZaxpEFtSzNA==
formik@^2.4.9:
  version "2.4.9"
  resolved "https://registry.yarnpkg.com/formik/-/formik-2.4.9.tgz#7e5b81e9c9e215d0ce2ac8fed808cf7fba0cd204"
  integrity sha512-5nI94BMnlFDdQRBY4Sz39WkhxajZJ57Fzs8wVbtsQlm5ScKIR1QLYqv/ultBnobObtlUyxpxoLodpixrsf36Og==
  dependencies:
    "@types/hoist-non-react-statics" "^3.3.1"
    deepmerge "^2.1.1"
    hoist-non-react-statics "^3.3.0"
    lodash "^4.17.21"
    lodash-es "^4.17.21"
    react-fast-compare "^2.0.1"
    tiny-warning "^1.0.2"
    tslib "^1.10.0"
    tslib "^2.0.0"

forwarded@0.2.0:
  version "0.2.0"
@@ -9195,11 +9203,16 @@ ts-jest@27.1.3:
    semver "7.x"
    yargs-parser "20.x"

tslib@^1.10.0, tslib@^1.8.1:
tslib@^1.8.1:
  version "1.14.1"
  resolved "https://registry.yarnpkg.com/tslib/-/tslib-1.14.1.tgz#cf2d38bdc34a134bcaf1091c41f6619e2f672d00"
  integrity sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==

tslib@^2.0.0:
  version "2.8.1"
  resolved "https://registry.yarnpkg.com/tslib/-/tslib-2.8.1.tgz#612efe4ed235d567e8aba5f2a5fab70280ade83f"
  integrity sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==

tslib@^2.0.3, tslib@^2.1.0, tslib@^2.3.0:
  version "2.3.1"
  resolved "https://registry.yarnpkg.com/tslib/-/tslib-2.3.1.tgz#e8a335add5ceae51aa261d32a490158ef042ef01"

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1


> ```gherkin

> **Validate that if user creation is canceled for an **agent** after selecting a role, the user is still created with the selected role and its related permissions**

> ![Screenshot_at_Dec_24_06-56-27](/uploads/8b33376362fbbaaaa3b96cfd644c958d/Screenshot_at_Dec_24_06-56-27.png){width=796 height=600}
> ![Screenshot_at_Dec_24_06-57-16](/uploads/4ebd9af30d7198275a902f4c4a1ced8e/Screenshot_at_Dec_24_06-57-16.png){width=572 height=600}
> ![Screenshot_at_Dec_24_06-57-30](/uploads/8b67db57e0312ab60921dddef8870306/Screenshot_at_Dec_24_06-57-30.png){width=575 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **Validate that if user creation is canceled for a **manager** after selecting a role, the user is still created with the selected role and its related permissions**

> ![Screenshot_at_Dec_24_07-01-35](/uploads/d2e023a5c215d77080abbed807876f6b/Screenshot_at_Dec_24_07-01-35.png){width=601 height=600}
> ![Screenshot_at_Dec_24_07-01-55](/uploads/c4f03c23441361a9218ecfd36f8c1f93/Screenshot_at_Dec_24_07-01-55.png){width=587 height=600}
> ![Screenshot_at_Dec_24_07-02-10](/uploads/98ffc2f5a1b6c94fd22cc21349094050/Screenshot_at_Dec_24_07-02-10.png){width=584 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **Validate that if user creation is canceled for an **admin** after selecting a role, the user is still created with the selected role and its related permissions**

> ![Screenshot_at_Dec_24_07-04-24](/uploads/23dc456406a979bd377ea995ec04cc9b/Screenshot_at_Dec_24_07-04-24.png){width=536 height=600}
> ![Screenshot_at_Dec_24_07-04-31](/uploads/d58b0f468f4763dcdc7dcdae8251bfef/Screenshot_at_Dec_24_07-04-31.png){width=749 height=452}
> ![Screenshot_at_Dec_24_07-04-38](/uploads/13e99043fc20dcdcb849e05673f3a871/Screenshot_at_Dec_24_07-04-38.png){width=744 height=455}
> ![Screenshot_at_Dec_24_07-09-29](/uploads/357b77c63bfe95d92ad35b121c6bfb32/Screenshot_at_Dec_24_07-09-29.png){width=900 height=482}
> ![Screenshot_at_Dec_24_07-10-51](/uploads/c1a40276f8bb1cc39c2ca95cf106fe57/Screenshot_at_Dec_24_07-10-51.png){width=577 height=600}
> ![Screenshot_at_Dec_24_07-11-06](/uploads/fd7e45262d3d7a6dd3298680f27a273a/Screenshot_at_Dec_24_07-11-06.png){width=571 height=600}
> ![Screenshot_at_Dec_24_07-11-21](/uploads/be1515c8ad9d5c369054868964dfeaa7/Screenshot_at_Dec_24_07-11-21.png){width=547 height=600}

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------