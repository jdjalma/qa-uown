---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/497

UOWN | SERVICING | “Do Not Call” flag no longer replicates “Do Not Text”

BUG
In the Servicing, there is a feature where selecting the DO NOT CALL flag should automatically replicate and select the DO NOT TEXT flag.
This logic was implemented in an older release and previously worked as expected. However, it has been observed that this behavior has stopped working, indicating a possible regression caused by later system changes.
The issue needs to be investigated to identify what changed and corrected so the behavior works again as it did before.

FIX

Current Behavior
    * User selects DO NOT CALL      
    * DO NOT TEXT flag is not automatically selected
    * Behavior differs from the expected and previous implementation
Expected Behavior
    * When DO NOT CALL is selected, the system should:
    * Automatically select DO NOT TEXT
    * Behavior should match the original implementation
Ps.: Please check whether the behavior shown in the second screenshot is recurring in the test environments (since it does not appear in Production) and whether it can be fixed quickly and easily. If so, remove the hover (test) that appears over the Do Not Call field.

![alt text](image.png)
![alt text](image-1.png)

Steps-to-Reproduce

Contexto
Corrigir a regressão onde selecionar "Do Not Call" no Mobile Phone deveria automaticamente selecionar "Do Not Text" no Servicing. O comportamento deve funcionar ao marcar e desmarcar.

Pré-requisitos
Acesso ao ambiente de Servicing
Permissão para editar informações de contato do cliente
Um cliente com Mobile Phone cadastrado

Cenário 1: Marcar "Do Not Call" deve marcar "Do Not Text" automaticamente
Passos:
1. Acesse a página de Customer Information no Servicing
2. Localize um cliente com Mobile Phone cadastrado
3. Clique em "Edit" na seção "Primary Contact"
4. Na seção "Mobile Phone", marque o checkbox "do not call"
5. Preencha o motivo no modal e clique em "Save"
6. Verifique se o checkbox "do not text" foi marcado automaticamente
7. Verifique se ambos os checkboxes estão marcados na interface
8. Recarregue a página e verifique se ambos os checkboxes permanecem marcados (persistência no backend)
Resultado esperado:
    * Ao marcar "do not call", "do not text" é marcado automaticamente
    * Ambos os checkboxes ficam marcados na interface
    * Após recarregar, ambos permanecem marcados

Cenário 2: Desmarcar "Do Not Call" deve desmarcar "Do Not Text" automaticamente

Passos:
1. Com um cliente que tenha "do not call" e "do not text" marcados
2. Na página de Customer Information, clique em "Edit" na seção "Primary Contact"
3. Na seção "Mobile Phone", desmarque o checkbox "do not call"
4. Verifique se o checkbox "do not text" foi desmarcado automaticamente
5. Verifique se ambos os checkboxes estão desmarcados na interface
6. Recarregue a página e verifique se ambos permanecem desmarcados (persistência no backend)
Resultado esperado:
    * Ao desmarcar "do not call", "do not text" é desmarcado automaticamente
    * Ambos os checkboxes ficam desmarcados na interface
    * Após recarregar, ambos permanecem desmarcados

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## 🐞 UOWN | SERVICING | Flag “Do Not Call” não replica mais “Do Not Text”

### **Tipo**

Bug (Regressão)

---

## 📌 **Descrição do Problema**

No módulo **Servicing**, existe uma funcionalidade em que, ao selecionar a flag **DO NOT CALL**, o sistema deve automaticamente selecionar também a flag **DO NOT TEXT**.

Essa lógica **já existia em versões anteriores** do sistema e funcionava corretamente.
Atualmente, esse comportamento **não está mais ocorrendo**, indicando uma **regressão causada por mudanças posteriores no sistema**.

O problema precisa ser investigado para identificar o que foi alterado e corrigido, restaurando o comportamento original.

---

## 🔍 **Comportamento Atual**

1. Usuário seleciona a flag **DO NOT CALL**
2. A flag **DO NOT TEXT** **não é selecionada automaticamente**
3. O comportamento está diferente do esperado e do que existia anteriormente

---

## ✅ **Comportamento Esperado**

Quando o usuário selecionar a flag **DO NOT CALL**, o sistema deve:

* Selecionar automaticamente a flag **DO NOT TEXT**
* Reproduzir exatamente o comportamento da implementação original (antes da regressão)

---

## 🧪 **Pontos de Atenção para Teste**

* Validar se o problema ocorre em **ambientes de teste (QA / Staging / Sandbox)**
* Confirmar se o comportamento apresentado no **segundo screenshot** é recorrente nesses ambientes
* Verificar se **o problema não ocorre em Produção**, conforme informado

---

## 🎯 **Ajuste Visual / UX (Observação Adicional)**

> Caso o comportamento mostrado no segundo screenshot **ocorra apenas em ambientes de teste** e seja possível corrigir de forma rápida:

* **Remover o hover (tooltip/test)** que aparece sobre o campo **Do Not Call**
* Garantir que o comportamento visual fique consistente com Produção

---


Steps-to-Reproduce

Contexto
Corrigir a regressão onde selecionar "Do Not Call" no Mobile Phone deveria automaticamente selecionar "Do Not Text" no Servicing. O comportamento deve funcionar ao marcar e desmarcar.

Pré-requisitos
Acesso ao ambiente de Servicing
Permissão para editar informações de contato do cliente
Um cliente com Mobile Phone cadastrado

Cenário 1: Marcar "Do Not Call" deve marcar "Do Not Text" automaticamente
Passos:
1. Acesse a página de Customer Information no Servicing
2. Localize um cliente com Mobile Phone cadastrado
3. Clique em "Edit" na seção "Primary Contact"
4. Na seção "Mobile Phone", marque o checkbox "do not call"
5. Preencha o motivo no modal e clique em "Save"
6. Verifique se o checkbox "do not text" foi marcado automaticamente
7. Verifique se ambos os checkboxes estão marcados na interface
8. Recarregue a página e verifique se ambos os checkboxes permanecem marcados (persistência no backend)
Resultado esperado:
    * Ao marcar "do not call", "do not text" é marcado automaticamente
    * Ambos os checkboxes ficam marcados na interface
    * Após recarregar, ambos permanecem marcados

Cenário 2: Desmarcar "Do Not Call" deve desmarcar "Do Not Text" automaticamente

Passos:
1. Com um cliente que tenha "do not call" e "do not text" marcados
2. Na página de Customer Information, clique em "Edit" na seção "Primary Contact"
3. Na seção "Mobile Phone", desmarque o checkbox "do not call"
4. Verifique se o checkbox "do not text" foi desmarcado automaticamente
5. Verifique se ambos os checkboxes estão desmarcados na interface
6. Recarregue a página e verifique se ambos permanecem desmarcados (persistência no backend)
Resultado esperado:
    * Ao desmarcar "do not call", "do not text" é desmarcado automaticamente
    * Ambos os checkboxes ficam desmarcados na interface
    * Após recarregar, ambos permanecem desmarcados


---


---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 2 arquivos
+
5
−
5
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -29,7 +29,7 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.403",
    "@uownleasing/common-ui": "0.0.404",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1829,10 +1829,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.403":
  version "0.0.403"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.403.tgz#e1fb27587f736f68309e8905a31f7247adce25a7"
  integrity sha512-MZT1udfTOeIiVBdH8xTkoj9pJddWs/rjZKNbcF5fFAz1sRH741Dk2sp3nmcNqmIVLNN7d8tV/1GpVMvtjfuTIw==
"@uownleasing/common-ui@0.0.404":
  version "0.0.404"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.404.tgz#f7509d01b34f5f863263dc5c70281da2729f413f"
  integrity sha512-Lt0dAl+Am/4l3WG9lEJaXHfZj6G7Xc43chfChkznK79wEEpu+MVkuW0YHBaJBu/Sa33skvdgAto50TAQRpQeJA==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---------------------------------------------------------------------------------------------------------------------------------------------------------
marcando do not call
{
    "phonePK": 11673,
    "doNotCall": true,
    "reasonForDnc": "do not call"
}
salvando informacoes em primary contact
{
    "phoneList": [
        {
            "pk": 11673,
            "rowCreatedTimestamp": "2026-01-27T06:28:09.725574",
            "rowUpdatedTimestamp": "2026-01-29T06:00:51.797914",
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "phoneInfo": {
                "phonePK": 11673,
                "customerPK": 11180,
                "phoneType": "MOBILE",
                "areaCode": "214",
                "phoneNumber": 4106033,
                "phoneExtension": null,
                "doNotCall": true,
                "reasonForDnc": "do not call",
                "doNotText": false,
                "reasonForDnt": "",
                "lastContactTimestamp": null,
                "fullPhone": "2144106033"
            }
        }
    ],
    "emailList": [
        {
            "pk": 11180,
            "rowCreatedTimestamp": "2026-01-27T06:28:09.654857",
            "rowUpdatedTimestamp": "2026-01-28T16:58:46.72679",
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "emailInfo": {
                "emailPK": 11180,
                "customerPK": 11180,
                "emailAddress": "feriri4155@gxuzi.com",
                "emailType": "PRIMARY",
                "doNotEmail": false,
                "reasonForDnc": ""
            }
        }
    ],
    "addressList": [
        {
            "pk": 11180,
            "rowCreatedTimestamp": "2026-01-27T06:28:09.637238",
            "rowUpdatedTimestamp": null,
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "addressInfo": {
                "addressPk": 11180,
                "customerPk": 11180,
                "addressType": "HOME",
                "streetAddress1": "4114 W Saturn Way",
                "streetAddress2": "Suite 450",
                "city": "Chandler",
                "state": "AZ",
                "zipCode": "85226",
                "zipCode9": "85226-3702",
                "country": "US",
                "doNotContact": false,
                "duration": null,
                "atAddressFrom": null,
                "housingStatus": null,
                "isAutocompleteVerified": false
            }
        }
    ],
    "accountPk": 11180,
    "leadPhones": [],
    "leadEmails": [],
    "leadAddresses": [],
    "leadPk": null
}

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: Selecting Do Not Call automatically selects Do Not Text
```markdown
- Given the Do Not Call and Do Not Text flags are unchecked
- And the customer has a Mobile Phone registered
- When the Primary Contact section is edited
- And the Do Not Call flag is checked on the Mobile Phone
- And a reason is provided and the change is saved
- Then the Do Not Text flag should be automatically checked
- And both flags should be checked in the interface

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---
### Scenario 2: Replication persists after save and page reload
```markdown
- Given the Do Not Call and Do Not Text flags are checked
- When the Customer Information page is reloaded
- Then the Do Not Call flag should remain checked
- And the Do Not Text flag should remain checked
- And the state should reflect the data persisted in the backend

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---
### Scenario 3: Unchecking Do Not Call automatically unchecks Do Not Text
```markdown
- Given the Do Not Call and Do Not Text flags are checked
- When the Primary Contact section is edited
- And the Do Not Call flag is unchecked
- And the change is saved
- Then the Do Not Text flag should be automatically unchecked
- And both flags should be unchecked in the interface

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---
### Scenario 4: Persistence after unchecking and page reload
```markdown
- Given the Do Not Call and Do Not Text flags are unchecked
- When the Customer Information page is reloaded
- Then the Do Not Call flag should remain unchecked
- And the Do Not Text flag should remain unchecked
- And the state should reflect the data persisted in the backend

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---
### Scenario 5: One-way dependency between Do Not Call and Do Not Text
```markdown
- Given the Do Not Call and Do Not Text flags are unchecked
- When only the Do Not Text flag is checked
- And the change is saved
- Then the Do Not Call flag should remain unchecked
- And no reverse replication should occur

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---
### Scenario 6: Global rule applied across accounts with the same phone number
```markdown
- Given the same phone number is associated with more than one account
- When the Do Not Call flag is set for the number in one account
- Then the Do Not Call flag should be applied to all accounts with that number
- And the Do Not Text flag should be applied to all accounts with that number

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
| 14357 | 11119 |
| 14218 | 11070 |
| 1 | 10760 |
```

Screeshot

**PASS**

---
### Scenario 7: No hover or test tooltip is displayed on the Do Not Call field
```markdown
- Given the environment is a test environment
- When the Primary Contact section is accessed
- And the cursor is positioned over the Do Not Call field
- Then no test tooltip or hover should be displayed

Examples:
| LeadPk | AccountPk |
| -------- | ------ |
| 14676 | 11184 |
```

Screeshot

**PASS**

---

