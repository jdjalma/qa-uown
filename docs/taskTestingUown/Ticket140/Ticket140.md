---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/140


## **UOWN | Customer Portal | Fix: Allow Kornerstone users to access the UOWN customer portal**

### **Synopsis**

A scenario was identified in which a user who has a valid **Kornerstone** account attempts to access the system using the **UOWN domain**.
In this case, the user successfully receives the access (verification) code; however, the authentication process fails after the code validation step.

This occurs because the system incorrectly treats an existing Kornerstone account as “not found” during the post-verification phase, due to portal/company filtering logic.

The expected behavior is that **Kornerstone users must be allowed to complete authentication and access the UOWN customer portal when using the UOWN domain**, instead of being blocked or redirected.

This issue must be investigated and fixed to ensure a consistent and correct login flow.

This ticket is related to the following request:
**Display message and redirect when Kornerstone account is not found in our Customer Portal**

---

### **Business Objective**

Ensure that users with valid Kornerstone accounts are not incorrectly blocked when accessing the UOWN customer portal, preventing authentication failures caused by improper account filtering.

---

### **Scope**

* Applies to the **UOWN Customer Portal**
* Focused on the **post-verification authentication flow**
* No UX changes required
* Fix must ensure consistent account validation across the entire login process

---

### **Testing Steps**

1. Use an account associated with the **KORNERSTONE** company.
2. Access the system using the **UOWN domain**.
3. Enter the email or phone number.
4. Confirm that the verification code is received.
5. Enter the verification code.
6. **Expected result:**

   * The user successfully logs in
   * The user can access the UOWN customer portal without errors or redirection issues.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## **UOWN | Customer Portal | Correção: Permitir que usuários Kornerstone acessem o portal do cliente UOWN**

### **Sinopse**

Foi identificado um cenário em que um usuário com uma conta válida da **Kornerstone** acessa o sistema utilizando o **domínio da UOWN**.
Nesse caso, o usuário recebe corretamente o código de acesso (verificação), porém a autenticação falha após a validação do código.

Isso ocorre porque o sistema passa a tratar incorretamente uma conta Kornerstone existente como “não encontrada” na etapa pós-verificação, devido à lógica de filtragem por portal/empresa.

O comportamento esperado é que **usuários Kornerstone consigam concluir o login e acessar o portal do cliente UOWN ao utilizar o domínio da UOWN**, sem bloqueios ou redirecionamentos indevidos.

O problema deve ser investigado e corrigido para garantir um fluxo de autenticação consistente e correto.

Este ticket está relacionado à seguinte solicitação:
**Display message and redirect when Kornerstone account is not found in our Customer Portal**

---

### **Objetivo de Negócio**

Garantir que usuários com contas Kornerstone válidas não sejam bloqueados indevidamente ao acessar o portal do cliente UOWN, evitando falhas de autenticação causadas por filtragem incorreta de contas.

---

### **Escopo**

* Aplicável ao **Portal do Cliente UOWN**
* Foco no **fluxo de autenticação pós-verificação**
* Nenhuma alteração de UX é necessária
* A correção deve garantir validação consistente da conta em todo o fluxo de login

---

### **Passos de Teste**

1. Utilizar uma conta associada à empresa **KORNERSTONE**.
2. Acessar o sistema utilizando o **domínio da UOWN**.
3. Informar o email ou número de telefone.
4. Confirmar o recebimento do código de verificação.
5. Inserir o código de verificação.
6. **Resultado esperado:**

   * O usuário realiza login com sucesso
   * O usuário consegue acessar o portal do cliente UOWN sem erros ou redirecionamentos indevidos.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

### Portal do Cliente – Acesso entre Kornerstone e UOWN**

---

```gherkin
Cenário: Exibir redirecionamento quando a conta não existe no portal Kornerstone
  Dado que o usuário acessa o portal Kornerstone
  E informa um email ou telefone que não existe em nenhuma conta
  Quando tenta realizar login
  Então o sistema não envia código de verificação
  E exibe a página "Looks like you're in the wrong place"
  E apresenta link para "auth.kornerstonecredit.com/Account/Login"
```


**| PASS |**

**| AccountPk:  |**

**| LeadPk:  |**

---

```gherkin
Cenário: Autenticar conta Kornerstone criada na UOWN ao acessar o portal UOWN
  Dado que o usuário possui uma conta Kornerstone válida criada na UOWN
  E acessa o portal UOWN
  Quando informa os dados corretos e valida o código
  Então o usuário acessa o portal UOWN com sucesso
  E a página "Looks like you're in the wrong place" não deve ser exibida
```


**| PASS |**

**| AccountPk:  |**

**| LeadPk:  |**

---


https://portal.kornerstonecredit.com/
https://auth.kornerstonecredit.com/Account/Login?ReturnUrl=%2F
https://website-qa1.uownleasing.com/
sodik31202@akixpres.com

---------------------------------------------------------------------------------------------------------------------------------------------------------



## Tests in stg

### Customer Portal – Access between Kornerstone and UOWN

---

```gherkin
Scenario: Display redirect when the account does not exist in the Kornerstone portal
  Given the user accesses the Kornerstone portal
  And enters an email or phone number that does not exist in any account
  When the user attempts to log in
  Then the system does not send a verification code
  And displays the page "Looks like you're in the wrong place"
  And shows a link to "auth.kornerstonecredit.com/Account/Login"
```


**| PASS |**

---

```gherkin
Scenario: Authenticate a Kornerstone account created in UOWN when accessing the UOWN portal
  Given the user has a valid Kornerstone account created in UOWN
  And accesses the UOWN portal
  When the user enters the correct data and validates the verification code
  Then the user successfully accesses the UOWN portal
  And the page "Looks like you're in the wrong place" must not be displayed
```


**| PASS |**

**| AccountPk: 206884 |**

**| LeadPk: 25529 |**

---

```gherkin
Scenario: Kornerstone customer with Kornerstone and UOWN accounts switching between accounts in the UOWN portal
  Given the customer has both a Kornerstone account and a UOWN account associated with the same user
  And the customer accesses the UOWN portal
  When the customer successfully authenticates
  And switches between the Kornerstone account and the UOWN account
  Then the system must allow switching between accounts
  And the customer must correctly see the information related to each selected account
  And no incorrect redirection message must be displayed
```


**| PASS |**

**| AccountPk: 206882 |**

**| LeadPk: 25523 |**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------