--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1183


## 🇺🇸 ENGLISH VERSION

## 1. Test Objective

Validate that the **Merchant clone** flow in the **Origination Portal** works correctly, ensuring that:

* The **Save** button triggers the expected request
* The cloned Merchant is **successfully persisted**
* The behavior differs only in flow, not in outcome, from Merchant creation

---

## 2. Scope

### In Scope

* Cloning an existing Merchant
* Network request validation on **Save**
* Persistence of cloned Merchant data
* UI and functional validation after save

### Out of Scope

* Creating a Merchant from scratch
* Business rule changes
* User roles and permissions

---

## 3. Preconditions

* User with permission to **view, clone, and save Merchants**
* At least **one existing active Merchant**
* Environment deployed with merge **!1343**
* Browser developer tools access (Network tab)

---

## 4. Test Scenarios

### TC-01 – Successfully clone a Merchant

**Objective:** Ensure a cloned Merchant is saved correctly.

**Steps:**

1. Access the **Origination Portal**
2. Open an existing Merchant
3. Select **Clone Merchant**
4. Fill in all required fields
5. Click **Save**

**Expected Result:**

* An HTTP request is triggered on **Save**
* Request returns **HTTP 200 / 201**
* Success feedback is displayed
* A new Merchant is created with a **new identifier**
* Data matches the original Merchant (with allowed changes)

---

### TC-02 – Network Request validation on Save (Clone)

**Objective:** Confirm that clicking **Save** triggers a valid request.

**Steps:**

1. Open browser DevTools (Network tab)
2. Repeat the clone flow
3. Click **Save**

**Expected Result:**

* POST/PUT request is triggered
* Payload contains cloned Merchant data
* No missing or blocked request
* No silent frontend failure

---

### TC-03 – Comparison: Clone vs Create Merchant

**Objective:** Ensure consistency between flows.

**Steps:**

1. Create a new Merchant using the standard flow
2. Clone an existing Merchant
3. Compare **Save** behavior

**Expected Result:**

* Both flows trigger a request
* Both save successfully
* No functional inconsistency

---

## 5. Acceptance Criteria

* ✅ **Save** button works in clone flow
* ✅ Request is properly triggered
* ✅ Cloned Merchant is saved in backend
* ✅ No regression in Merchant creation flow
* ✅ No silent frontend errors

---

## 6. Test Evidence

* Screenshots of clone flow
* Network tab logs
* Original vs cloned Merchant IDs
* HTTP response status

---

Se quiser, posso:

* Converter isso para **checklist de execução QA**
* Gerar **cenários Gherkin**
* Extrair **casos mínimos para smoke test**
* Adaptar para **execução em produção controlada (hotfix)**



**UOWN | Origination | Merchant clone is not saved when clicking “Save”**
Tipo: **BUG / Hotfix**
Ambiente: **Origination Portal**
Versão alvo: **RU12.25.1.47.1**
Status do ticket: **Ready for QA**

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇧🇷 VERSÃO EM PORTUGUÊS

## 1. Objetivo do Teste

Validar que o processo de **clonagem de Merchant** no portal **Origination** está funcionando corretamente, garantindo que:

* O botão **Save** dispare a requisição esperada
* O Merchant clonado seja **persistido com sucesso**
* O comportamento seja consistente e diferente da criação manual apenas no fluxo (não no resultado)

---

## 2. Escopo

### Incluído

* Clonagem de Merchant existente
* Validação de requisição no clique do botão **Save**
* Persistência dos dados do Merchant clonado
* Validação visual e funcional pós-save

### Fora de Escopo

* Criação de Merchant do zero (já validada como funcional)
* Alterações de regras de negócio do Merchant
* Permissões e perfis de usuário

---

## 3. Pré-requisitos

* Usuário com permissão para **visualizar, clonar e salvar Merchants**
* Pelo menos **1 Merchant existente e ativo**
* Ambiente com build contendo o merge **!1343**
* Acesso às ferramentas de desenvolvedor do navegador (Network)

---

## 4. Cenários de Teste

### CT-01 – Clonar Merchant com sucesso

**Objetivo:** Garantir que o Merchant clonado seja salvo corretamente.

**Passos:**

1. Acessar o portal **Origination**
2. Abrir um Merchant existente
3. Selecionar a opção **Clone Merchant**
4. Preencher todos os campos obrigatórios
5. Clicar no botão **Save**

**Resultado Esperado:**

* Uma requisição HTTP é disparada no clique do botão **Save**
* A requisição retorna **HTTP 200 / 201**
* O sistema exibe feedback visual de sucesso
* O Merchant clonado é criado com um **novo identificador**
* Os dados refletem corretamente o Merchant original (com ajustes permitidos)

---

### CT-02 – Validação de Network Request no Save (Clone)

**Objetivo:** Confirmar que o clique em **Save** dispara uma requisição válida.

**Passos:**

1. Abrir o DevTools do navegador (aba Network)
2. Repetir o fluxo de clonagem
3. Clicar em **Save**

**Resultado Esperado:**

* Requisição POST/PUT é disparada
* Payload contém os dados do Merchant clonado
* Nenhuma requisição ausente ou bloqueada
* Não ocorre erro silencioso no frontend

---

### CT-03 – Comparação: Clone vs Create Merchant

**Objetivo:** Garantir consistência de comportamento entre os fluxos.

**Passos:**

1. Criar um Merchant novo pelo fluxo padrão
2. Clonar um Merchant existente
3. Comparar comportamento do botão **Save**

**Resultado Esperado:**

* Ambos os fluxos disparam requisição
* Ambos salvam corretamente
* Não há diferença funcional indevida

---

## 5. Critérios de Aceite

* ✅ O botão **Save** funciona no fluxo de clonagem
* ✅ A requisição é disparada corretamente
* ✅ O Merchant clonado é salvo no backend
* ✅ Não há regressão no fluxo de criação de Merchant
* ✅ Nenhum erro silencioso ocorre no frontend

---

## 6. Evidências de Teste

* Prints do fluxo de clonagem
* Print ou log da aba **Network**
* ID do Merchant original vs clonado
* Status da requisição HTTP

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

[#1183] R1.47.1 clone merchant broken
Mesclado
Marcos Silvano solicitou a mesclagem de
R1.47.1_clone_merchant_broken
para
R1.47.1
2 dias atrás
Visão geral 
0
Commits 
2
Pipelines 
1
Alterações 
1
Comparar
e
 1 arquivo
+
1
−
1
 components/merchant-info-panels/add-or-edit-merchant.tsx 
+
1
−
1

Visualizado
@@ -518,7 +518,7 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
            ? values?.merchantCategory.toUpperCase().trim()
            : null,
          salesRepCode: values?.salesRepCode?.trim() ?? '',
          referralPartner: values?.referralPartner.trim() ?? '',
          referralPartner: values?.referralPartner?.trim() ?? '',
          username: values?.merchantUsername?.trim() ?? '',
          apiKey: values?.merchantAPIKey?.trim() ?? '',
          peakCampaignId: values?.peakCampaignId ?? 0,

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


1. **Ao clonar merchant, preencher os campos obrigatórios e clicar em “Save” no fluxo de clonagem, uma ação visível deve ocorrer. O clique no botão “Save” no fluxo de clonagem deve disparar uma requisição HTTP válida. A requisição do “Save” no clone deve retornar sucesso (HTTP 200 ou 201)**

2. **Após o sucesso da requisição, o Merchant clonado deve ser persistido corretamente**, sendo possível:

   * Visualizá-lo na listagem, **ou**
   * Acessá-lo por busca/ID, **ou**
   * Ser redirecionado para a página do novo Merchant.

3. **O Merchant clonado deve possuir um novo código**

4. **O campo `referralPartner` deve ser tratado corretamente no fluxo de clonagem**, cobrindo os seguintes casos em um único cenário:

   * Quando **não preenchido** (undefined / vazio), o “Save” **não deve falhar** nem impedir o envio da requisição.
   * Quando **preenchido com espaços extras**, o valor deve ser salvo **trimado** (sem espaços no início/fim).
   * Em nenhum dos casos deve ocorrer erro de runtime relacionado a `.trim()`.

5. **Campos opcionais em geral não devem causar falha no submit do clone quando estiverem vazios**, especialmente campos tratados com `.trim()` no frontend.

6. **O fluxo de criação de Merchant do zero deve continuar funcionando normalmente**, garantindo que:

    * O botão “Save” dispara requisição
    * O Merchant é salvo
    * Não houve regressão introduzida pelo fix

7. **Não deve ocorrer falha silenciosa no frontend durante o fluxo de clonagem**, incluindo:

    * Erros no console
    * Clique sem handler
    * Validação quebrando sem mensagem ao usuário

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

```gherkin
**When cloning a Merchant, after filling in all required fields and clicking “Save”, a visible action must occur. The “Save” button must trigger a valid HTTP request, and the request must return success (HTTP 200 or 201)**

**| PASS |**
```

```gherkin
**After a successful request, the cloned Merchant must be correctly persisted and must be accessible via the Merchant list, search/ID, or by redirection to the newly created Merchant page**

**| PASS |**
```

```gherkin
**The cloned Merchant must have a new code, different from the original Merchant**

**| PASS |**
```

```gherkin
**The `referralPartner` field must be handled correctly during cloning: when empty, the Save action must not fail or block the request; when filled with extra spaces, the value must be saved trimmed; no runtime error related to `.trim()` must occur**

**| PASS |**
```

```gherkin
**Optional fields must not cause the clone submit to fail when left empty, especially fields processed with `.trim()` on the frontend**

**| PASS |**
```

```gherkin
**The Create Merchant (from scratch) flow must continue to work normally: the Save button triggers a request, the Merchant is saved, and no regression is introduced by the fix**

**| PASS |**
```

```gherkin
**No silent frontend failure must occur during the clone flow, including console errors, clicks without a handler, or validations failing without user-facing messages**

**| PASS |**
```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2

> ```gherkin

> **When cloning a Merchant, after filling in all required fields and clicking “Save”, a visible action must occur. The “Save” button must trigger a valid HTTP request, and the request must return success (HTTP 200 or 201)**

> ![Screenshot_at_Dec_21_03-24-33](/uploads/e68f5baedffbbdf01f53773b1ad49816/Screenshot_at_Dec_21_03-24-33.png){width=900 height=467}
> ![Screenshot_at_Dec_21_03-24-45](/uploads/25c402f14142b076900da46dbe484d2a/Screenshot_at_Dec_21_03-24-45.png){width=900 height=462}
> ![Screenshot_at_Dec_21_03-26-13](/uploads/6b00ced5d8ef807677828a369d7d4713/Screenshot_at_Dec_21_03-26-13.png){width=489 height=361}
> ![Screenshot_at_Dec_21_03-26-24](/uploads/7aee4e531eed55d09f8e24f24d306e62/Screenshot_at_Dec_21_03-26-24.png){width=900 height=473}
> ![Screenshot_at_Dec_21_03-26-35](/uploads/22f46ca06c2d0f8b3d3fd9f339ce8a06/Screenshot_at_Dec_21_03-26-35.png){width=900 height=479}
> ![Screenshot_at_Dec_21_03-27-08](/uploads/05168a8f0b0886eaab027522b72c2844/Screenshot_at_Dec_21_03-27-08.png){width=638 height=180}
> ![Screenshot_at_Dec_21_03-27-16](/uploads/79a94b9a8b978ddb680d998aa49fdc08/Screenshot_at_Dec_21_03-27-16.png){width=654 height=190}
> ![Screenshot_at_Dec_21_03-27-44](/uploads/30540559b54f2433f8f41ac6e6170933/Screenshot_at_Dec_21_03-27-44.png){width=540 height=600}
> ![Screenshot_at_Dec_21_03-28-05](/uploads/bdab8263d62401da698895f8c7f9bed5/Screenshot_at_Dec_21_03-28-05.png){width=594 height=600}
> ![Screenshot_at_Dec_21_03-29-25](/uploads/2ef29532f5fb8e958c0a2a3c35ae1631/Screenshot_at_Dec_21_03-29-25.png){width=900 height=34}
> ![Screenshot_at_Dec_21_03-30-02](/uploads/a4104fa16db0712c0207f8903748a448/Screenshot_at_Dec_21_03-30-02.png){width=900 height=275}
> ![Screenshot_at_Dec_21_03-30-58](/uploads/32822217e3d5c1de2e57f188f786576b/Screenshot_at_Dec_21_03-30-58.png){width=900 height=449}
> ![Screenshot_at_Dec_21_03-31-08](/uploads/dcdd8232cb61010dacd86ea2a04d5c9c/Screenshot_at_Dec_21_03-31-08.png){width=900 height=452}
> ![Screenshot_at_Dec_21_03-33-35](/uploads/0dde0a499360226353b5fa80c1dd1503/Screenshot_at_Dec_21_03-33-35.png){width=900 height=213}

> ![Screenshot_at_Dec_21_03-58-46](/uploads/9bb683811123535b70b48ae72468a064/Screenshot_at_Dec_21_03-58-46.png){width=900 height=573}
> ![Screenshot_at_Dec_21_03-59-34](/uploads/394760f3097c8fb4fcdd6b04e32f3b21/Screenshot_at_Dec_21_03-59-34.png){width=900 height=253}


> **| PASS |**

> ```

> ```gherkin

> **After a successful request, the cloned Merchant must be correctly persisted and must be accessible via the Merchant list, search/ID, or by redirection to the newly created Merchant page**

> ![Screenshot_at_Dec_21_03-30-02](/uploads/12c1338ef58e591c4d792649ab694aec/Screenshot_at_Dec_21_03-30-02.png){width=900 height=275}
> ![Screenshot_at_Dec_21_03-30-58](/uploads/7f37539ac4936eb06ac8910e5f53c9b2/Screenshot_at_Dec_21_03-30-58.png){width=900 height=449}
> ![Screenshot_at_Dec_21_03-31-08](/uploads/e52736f464bf73e43ce21082dba6ea1c/Screenshot_at_Dec_21_03-31-08.png){width=900 height=452}

> **| PASS |**
> ```

> ```gherkin

> **The cloned Merchant must have a new code, different from the original Merchant**

> ![Screenshot_at_Dec_21_03-28-05](/uploads/3b4de57ad51db34c63ae9411751e2b87/Screenshot_at_Dec_21_03-28-05.png){width=594 height=600}
> ![Screenshot_at_Dec_21_03-29-25](/uploads/59c285669f2ddf2a6f7d02e97ddb4faf/Screenshot_at_Dec_21_03-29-25.png){width=900 height=34}
> ![Screenshot_at_Dec_21_03-30-02](/uploads/864844046b7b0164b34e581ee20cbcff/Screenshot_at_Dec_21_03-30-02.png){width=900 height=275}
> ![Screenshot_at_Dec_21_03-36-28](/uploads/2fe55f7e7578bc5c6f9c997d41058603/Screenshot_at_Dec_21_03-36-28.png){width=900 height=463}

> **| PASS |**
> ```

> ```gherkin

> **The `referralPartner` field must be handled correctly during cloning: when empty, the Save action must not fail or block the request; when filled with extra spaces, the value must be saved trimmed; no runtime error related to `.trim()` must occur**

> **| PASS |**
> ```

> ```gherkin

> **Optional fields must not cause the clone submit to fail when left empty, especially fields processed with `.trim()` on the frontend**

> **| PASS |**
> ```

> ```gherkin

> **The Create Merchant (from scratch) flow must continue to work normally: the Save button triggers a request, the Merchant is saved, and no regression is introduced by the fix**

> **| PASS |**
> ```

> ```gherkin

> **No silent frontend failure must occur during the clone flow, including console errors, clicks without a handler, or validations failing without user-facing messages**

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------