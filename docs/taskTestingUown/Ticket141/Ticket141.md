---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/141

UOWN | Customer Portal | Alter Convenience Fee Message Condition

The message should only be displayed on KORNERSTONE accounts/portal when the credit card uses the OMNIFUND vendor.
![alt text](image.png)

Testing Steps
Overview
Test the conditional display of the convenience fee message on the payment page based on account company, domain, selected payment method, and credit card vendor.
Test Scenarios
1. UOWN Account - Credit Card Selected

Log in as UOWN account (non-Kornerstone)
Navigate to Payment page
Select a credit card (any vendor)

Expected: Convenience fee message displays: "$X Convenience Fee charged by processor on all Debit or Credit Card Payments..."

2. UOWN Account - Bank Account Selected

Log in as UOWN account
Navigate to Payment page
Select a bank account/ACH payment method

Expected: Convenience fee message is hidden

3. UOWN Account - No Payment Method Selected

Log in as UOWN account
Navigate to Payment page
Do not select any payment method

Expected: Convenience fee message is hidden

4. KORNERSTONE Account - OMNIFUND Credit Card Selected

Log in as KORNERSTONE account
Navigate to Payment page
Select a credit card with cc_vendor = OMNIFUND


Expected: Convenience fee message displays

5. KORNERSTONE Account - Non-OMNIFUND Credit Card Selected

Log in as KORNERSTONE account
Navigate to Payment page
Select a credit card with cc_vendor ≠ OMNIFUND (e.g., CHANNEL_PAYMENTS_CC, USAEPAY)

Expected: Convenience fee message is hidden

6. KORNERSTONE Account - Bank Account Selected

Log in as KORNERSTONE account
Navigate to Payment page
Select a bank account/ACH payment method

Expected: Convenience fee message is hidden

7. KORNERSTONE Account - No Payment Method Selected

Log in as KORNERSTONE account
Navigate to Payment page
Do not select any payment method

Expected: Convenience fee message is hidden

8. Kornerstone Domain - OMNIFUND Credit Card Selected

Access website via kornerstone domain URL (e.g., kornerstone.*)
Log in to any account
Navigate to Payment page
Select a credit card with cc_vendor = OMNIFUND


Expected: Convenience fee message displays

9. Kornerstone Domain - Non-OMNIFUND Credit Card Selected

Access website via kornerstone domain URL
Log in to any account
Navigate to Payment page
Select a credit card with cc_vendor ≠ OMNIFUND


Expected: Convenience fee message is hidden

10. Dynamic Message Display - Payment Method Switching

Log in as UOWN account
Navigate to Payment page
Select a credit card

Expected: Message appears
Switch to bank account

Expected: Message disappears
Switch back to credit card

Expected: Message reappears

11. Dynamic Message Display - Kornerstone Vendor Switching

Log in as KORNERSTONE account
Navigate to Payment page
Select OMNIFUND credit card

Expected: Message appears
Switch to non-OMNIFUND credit card

Expected: Message disappears
Switch back to OMNIFUND credit card

Expected: Message reappears

Notes

Message displays only when a credit card is selected
Message should update dynamically when payment method selection changes
Logic: Show message if credit card selected AND (not Kornerstone OR cc_vendor === 'OMNIFUND')
For UOWN: message shows for any credit card vendor (UOWN never has OMNIFUND cards)
For Kornerstone: message only shows when cc_vendor === 'OMNIFUND'

---------------------------------------------------------------------------------------------------------------------------------------------------------

Segue a **tarefa entregue em português**, com estrutura e linguagem adequadas para documentação e validação de QA.

---

## UOWN | Portal do Cliente | Condição de Exibição da Mensagem de Convenience Fee

A mensagem de *convenience fee* deve ser exibida **apenas** em contas/portais **KORNERSTONE** quando o cartão de crédito utilizar o **vendor OMNIFUND**.

---

## Objetivo dos Testes

Validar a exibição condicional da mensagem de *convenience fee* na página de pagamento, considerando:

* Empresa da conta (UOWN ou KORNERSTONE)
* Domínio de acesso
* Método de pagamento selecionado
* Vendor do cartão de crédito

---

## Cenários de Teste

### 1. Conta UOWN – Cartão de Crédito Selecionado

* Fazer login com uma conta UOWN (não Kornerstone)
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito (qualquer vendor)

**Resultado esperado:**
A mensagem de *convenience fee* é exibida:
`"$X Convenience Fee charged by processor on all Debit or Credit Card Payments..."`

---

### 2. Conta UOWN – Conta Bancária Selecionada

* Fazer login com uma conta UOWN
* Navegar até a página de Pagamento
* Selecionar conta bancária / ACH

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 3. Conta UOWN – Nenhum Método de Pagamento Selecionado

* Fazer login com uma conta UOWN
* Navegar até a página de Pagamento
* Não selecionar nenhum método de pagamento

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 4. Conta KORNERSTONE – Cartão OMNIFUND Selecionado

* Fazer login com uma conta KORNERSTONE
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito com `cc_vendor = OMNIFUND`

**Resultado esperado:**
A mensagem de *convenience fee* é exibida.

---

### 5. Conta KORNERSTONE – Cartão Não-OMNIFUND Selecionado

* Fazer login com uma conta KORNERSTONE
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito com `cc_vendor ≠ OMNIFUND`
  (ex.: `CHANNEL_PAYMENTS_CC`, `USAEPAY`)

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 6. Conta KORNERSTONE – Conta Bancária Selecionada

* Fazer login com uma conta KORNERSTONE
* Navegar até a página de Pagamento
* Selecionar conta bancária / ACH

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 7. Conta KORNERSTONE – Nenhum Método de Pagamento Selecionado

* Fazer login com uma conta KORNERSTONE
* Navegar até a página de Pagamento
* Não selecionar nenhum método de pagamento

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 8. Domínio Kornerstone – Cartão OMNIFUND Selecionado

* Acessar o portal via domínio Kornerstone (ex.: `kornerstone.*`)
* Fazer login com qualquer conta
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito com `cc_vendor = OMNIFUND`

**Resultado esperado:**
A mensagem de *convenience fee* é exibida.

---

### 9. Domínio Kornerstone – Cartão Não-OMNIFUND Selecionado

* Acessar o portal via domínio Kornerstone
* Fazer login com qualquer conta
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito com `cc_vendor ≠ OMNIFUND`

**Resultado esperado:**
A mensagem de *convenience fee* não é exibida.

---

### 10. Exibição Dinâmica – Troca de Método de Pagamento (UOWN)

* Fazer login com uma conta UOWN
* Navegar até a página de Pagamento
* Selecionar um cartão de crédito

**Resultado esperado:**
A mensagem é exibida.

* Alterar para conta bancária

**Resultado esperado:**
A mensagem desaparece.

* Voltar para cartão de crédito

**Resultado esperado:**
A mensagem volta a ser exibida.

---

### 11. Exibição Dinâmica – Troca de Vendor (KORNERSTONE)

* Fazer login com uma conta KORNERSTONE
* Navegar até a página de Pagamento
* Selecionar um cartão OMNIFUND

**Resultado esperado:**
A mensagem é exibida.

* Alterar para um cartão não-OMNIFUND

**Resultado esperado:**
A mensagem desaparece.

* Voltar para um cartão OMNIFUND

**Resultado esperado:**
A mensagem volta a ser exibida.

---

## Observações Importantes

* A mensagem é exibida **somente** quando um cartão de crédito está selecionado.
* A exibição deve ser **dinâmica**, reagindo imediatamente à troca do método de pagamento ou vendor.
* **Regra de negócio:**

```
Exibir mensagem se:
- Cartão de crédito estiver selecionado
E
- (Conta NÃO for Kornerstone OU cc_vendor === 'OMNIFUND')
```

* Para contas **UOWN**:

  * A mensagem é exibida para qualquer cartão de crédito
  * UOWN não possui cartões OMNIFUND
* Para contas **KORNERSTONE**:

  * A mensagem é exibida **apenas** quando `cc_vendor === 'OMNIFUND'`

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 1 arquivo
+
27
−
11
 pages/payment/index.tsx 
+
27
−
11

Visualizado
@@ -334,6 +334,20 @@ const MakePaymentForm = (props: MakePaymentFormProps) => {

  const router = useRouter();

  const isKornerstoneDomain =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('kornerstone');

  const shouldShowConvenienceFeeMessage = () => {
    const isKornerstone = isKornerstoneCustomer || isKornerstoneDomain;
    const selectedMethod = formik.values.selectedPaymentMethod;

    return (
      selectedMethod?.type === 'cc' &&
      (!isKornerstone || selectedMethod?.ccInfo?.ccVendor === 'OMNIFUND')
    );
  };

  const handleOnChange = (row, i: number) => {
    const ccNumber = row?.creditCardInfo?.ccNumber || '';
    const accountNumber = row?.bankAccountInfo?.accountNumber || '';
@@ -716,17 +730,19 @@ const MakePaymentForm = (props: MakePaymentFormProps) => {
        )}
      </Row>

      <Row className={classNames(styles?.loadedContainer__infoText, 'my-2')}>
        ${convenienceFee} Convenience Fee charged by processor on all Debit or
        Credit Card Payments. ACH payments are not subject to the fee. If you
        would like to switch your payment method to ACH, please&nbsp;
        <a
          href="/manage-payment-methods"
          style={{color: '#007bff', textDecoration: 'underline'}}>
          click here
        </a>
        .
      </Row>
      {shouldShowConvenienceFeeMessage() && (
        <Row className={classNames(styles?.loadedContainer__infoText, 'my-2')}>
          ${convenienceFee} Convenience Fee charged by processor on all Debit or
          Credit Card Payments. ACH payments are not subject to the fee. If you
          would like to switch your payment method to ACH, please&nbsp;
          <a
            href="/manage-payment-methods"
            style={{color: '#007bff', textDecoration: 'underline'}}>
            click here
          </a>
          .
        </Row>
      )}

      <Row className="mt-4">
        <Button

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in -

---
### Scenario: Scenario 1 – Exibição da mensagem ao selecionar cartão de crédito

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente navega até a página de Pagamento
- When o cliente seleciona um método de pagamento do tipo cartão de crédito com vendor <Vendor>
- Then a mensagem de convenience fee <Resultado> ser exibida

Examples:
| Merchant    | Vendor       | Resultado |
| ----------- | ------------ | --------- |
| UOWN        | ANY          | deve      |
| KORNERSTONE | OMNIFUND     | deve      |
| KORNERSTONE | NON_OMNIFUND | não deve  |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
| Merchant   | <Merchant> |
```

[Screenshot]

**PASS**

---

### Scenario: Scenario 2 – Ocultação da mensagem ao selecionar conta bancária (ACH)

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente navega até a página de Pagamento
- When o cliente seleciona um método de pagamento do tipo conta bancária (ACH)
- Then a mensagem de convenience fee não deve ser exibida

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

[Screenshot]

**PASS**

---

### Scenario: Scenario 3 – Ocultação da mensagem sem método de pagamento selecionado

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente navega até a página de Pagamento
- When nenhum método de pagamento é selecionado
- Then a mensagem de convenience fee não deve ser exibida

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

[Screenshot]

**PASS**

---

### Scenario: Scenario 4 – Troca dinâmica de método de pagamento

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente navega até a página de Pagamento
- When o cliente seleciona um cartão de crédito com vendor <VendorInicial>
- Then a mensagem de convenience fee <ResultadoInicial> ser exibida
- When o cliente altera o método de pagamento para <NovoMetodo>
- Then a mensagem de convenience fee <ResultadoFinal> ser exibida

Examples:
| Merchant    | VendorInicial | ResultadoInicial | NovoMetodo | ResultadoFinal |
| ----------- | ------------- | ---------------- | ---------- | -------------- |
| UOWN        | ANY           | deve             | ACH        | não deve       |
| KORNERSTONE | OMNIFUND      | deve             | ACH        | não deve       |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

[Screenshot]

**PASS**

---

### Scenario: Scenario 5 – Troca dinâmica de vendor em conta KORNERSTONE

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo KORNERSTONE
- And que o cliente navega até a página de Pagamento
- When o cliente seleciona um cartão de crédito com vendor <VendorInicial>
- Then a mensagem de convenience fee <ResultadoInicial> ser exibida
- When o cliente seleciona um cartão de crédito com vendor <VendorFinal>
- Then a mensagem de convenience fee <ResultadoFinal> ser exibida

Examples:
| VendorInicial | ResultadoInicial | VendorFinal  | ResultadoFinal |
| ------------- | ---------------- | ------------ | -------------- |
| OMNIFUND      | deve             | NON_OMNIFUND | não deve       |
| NON_OMNIFUND  | não deve         | OMNIFUND     | deve           |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | KORNERSTONE |
```

[Screenshot]

**PASS**

---
Segue o **cenário 6 aprimorado**, agora utilizando **Scenario Outline + Examples** para cobrir **UOWN e KORNERSTONE**, mantendo o foco em comportamento do usuário, consistência semântica e o template solicitado.

---
### Scenario: Scenario 7 – Cliente com contas UOWN e KORNERSTONE alterna entre contas e visualiza a mensagem conforme regras

```markdown
- Given que o cliente possui contas do tipo UOWN e KORNERSTONE
- And que o cliente acessa o Portal do Cliente
- And que o cliente navega até a página de Pagamento da conta <Merchant>
- When o cliente seleciona um cartão de crédito com vendor <Vendor>
- Then a mensagem de convenience fee <Resultado> ser exibida

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

Examples:
| Merchant    | Vendor       | Resultado |
| ----------- | ------------ | --------- |
| UOWN        | ANY          | deve      |
| KORNERSTONE | OMNIFUND     | deve      |
| KORNERSTONE | NON_OMNIFUND | não deve  |

[Screenshot]

**PASS**

---


---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---
### Scenario: 1 – Display of the message when selecting a credit card

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a credit card payment method with vendor <Vendor>
- Then the convenience fee message <Resultado> be displayed

Examples:
| Merchant    | Vendor       | Resultado |
| ----------- | ------------ | --------- |
| UOWN        | ANY          | should    |
| KORNERSTONE | OMNIFUND     | should    |
| KORNERSTONE | NON_OMNIFUND | should not |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
| Merchant   | <Merchant> |
```

![image](/uploads/9866b159e1ef3f448577779ef543ce3a/image.png){width=900 height=450}

![image](/uploads/20efab4b1191e4ae7527cbcc51092f72/image.png){width=900 height=427}

![image](/uploads/f3bdada40b922abf3a7d6eedf5ebbfd6/image.png){width=900 height=14}

![Screenshot_at_Jan_14_09-56-39](/uploads/4b4d40e66b54001eab924c19b6a34e51/Screenshot_at_Jan_14_09-56-39.png){width=900 height=42}

![Screenshot_at_Jan_14_09-57-04](/uploads/7dce19088f0888061cd479968eae24c7/Screenshot_at_Jan_14_09-57-04.png){width=900 height=499}

**PASS**

---
### Scenario: 2 – Hiding the message when selecting a bank account (ACH)

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a bank account (ACH) payment method
- Then the convenience fee message should not be displayed

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

![Screenshot_at_Jan_14_09-59-23](/uploads/c26518fdd0a7b936a4add64fb0682a42/Screenshot_at_Jan_14_09-59-23.png){width=900 height=494}

![Screenshot_at_Jan_14_10-00-32](/uploads/b0672894b0dc2983d1706c3591fd6c9c/Screenshot_at_Jan_14_10-00-32.png){width=900 height=503}

**PASS**

---
### Scenario: 3 – Hiding the message when no payment method is selected

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When no payment method is selected
- Then the convenience fee message should not be displayed

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

**PASS**

---
### Scenario: 4 – Dynamic change of payment method

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a credit card with vendor <VendorInicial>
- Then the convenience fee message <ResultadoInicial> be displayed
- When the customer changes the payment method to <NovoMetodo>
- Then the convenience fee message <ResultadoFinal> be displayed

Examples:
| Merchant    | VendorInicial | ResultadoInicial | NovoMetodo | ResultadoFinal |
| ----------- | ------------- | ---------------- | ---------- | -------------- |
| UOWN        | ANY           | should           | ACH        | should not     |
| KORNERSTONE | OMNIFUND      | should           | ACH        | should not     |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

![Screenshot_at_Jan_14_10-07-28](/uploads/113f3d4376c210da23b488f55067cfa7/Screenshot_at_Jan_14_10-07-28.png){width=900 height=501}

![Screenshot_at_Jan_14_10-07-44](/uploads/684b052393fc0c40c67ce64d1b3ab973/Screenshot_at_Jan_14_10-07-44.png){width=900 height=487}

![Screenshot_at_Jan_14_10-08-07](/uploads/11a10d6e99bdfb698889e22fa3448719/Screenshot_at_Jan_14_10-08-07.png){width=900 height=497}

![Screenshot_at_Jan_14_10-08-27](/uploads/d78c039193aca127c95c969d9b8b6a5a/Screenshot_at_Jan_14_10-08-27.png){width=900 height=504}

![Screenshot_at_Jan_14_10-09-07](/uploads/24e271bb77dac948a6e83f7eba4ec7af/Screenshot_at_Jan_14_10-09-07.png){width=900 height=77}

**PASS**

---
### Scenario: 5 – Dynamic vendor switching on a KORNERSTONE account

```markdown
- Given the customer accesses the Customer Portal using an account of type KORNERSTONE
- And the customer navigates to the Payment page
- When the customer selects a credit card with vendor <VendorInicial>
- Then the convenience fee message <ResultadoInicial> be displayed
- When the customer selects a credit card with vendor <VendorFinal>
- Then the convenience fee message <ResultadoFinal> be displayed

Examples:
| VendorInicial | ResultadoInicial | VendorFinal  | ResultadoFinal |
| ------------- | ---------------- | ------------ | -------------- |
| OMNIFUND      | should           | NON_OMNIFUND | should not     |
| NON_OMNIFUND  | should not       | OMNIFUND     | should         |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | KORNERSTONE |
```

![Screenshot_at_Jan_14_10-08-27](/uploads/7b65159583066f8898b7049fe969928a/Screenshot_at_Jan_14_10-08-27.png){width=900 height=504}

![Screenshot_at_Jan_14_10-09-07](/uploads/a89ffae510050b4613bd3021bbb1c4d4/Screenshot_at_Jan_14_10-09-07.png){width=900 height=77}

![Screenshot_at_Jan_14_10-09-21](/uploads/81ad0367dc73c28b412b3d081d95ab7c/Screenshot_at_Jan_14_10-09-21.png){width=900 height=497}

![Screenshot_at_Jan_14_10-09-38](/uploads/28cf8c787c42eec412cdb79c0861a2f5/Screenshot_at_Jan_14_10-09-38.png){width=900 height=73}

**PASS**

---
### Scenario: 6 – Customer with UOWN and KORNERSTONE accounts switches between accounts and views the message according to rules

```markdown
- Given the customer has both UOWN and KORNERSTONE accounts
- And the customer accesses the Customer Portal
- And the customer navigates to the Payment page of the <Merchant> account
- When the customer selects a credit card with vendor <Vendor>
- Then the convenience fee message <Resultado> be displayed

Examples:
| Merchant    | Vendor       | Resultado  |
| ----------- | ------------ | ---------- |
| UOWN        | ANY          | should     |
| KORNERSTONE | OMNIFUND     | should     |
| KORNERSTONE | NON_OMNIFUND | should not |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

![Screenshot_at_Jan_14_10-18-18](/uploads/daa62da493f3b3cb25570fa4d02ebbd1/Screenshot_at_Jan_14_10-18-18.png){width=900 height=149}

![Screenshot_at_Jan_14_10-18-36](/uploads/2739aa156cab8bc1a99be142b8cd8fab/Screenshot_at_Jan_14_10-18-36.png){width=900 height=187}

![Screenshot_at_Jan_14_10-18-55](/uploads/d5414de14fd0d92f287c132b8431e2f8/Screenshot_at_Jan_14_10-18-55.png){width=900 height=111}

![Screenshot_at_Jan_14_10-19-20](/uploads/e94e08b32b2045b41751127143db06d6/Screenshot_at_Jan_14_10-19-20.png){width=900 height=429}

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in stg

---
### Scenario: 1 – Display of the message when selecting a credit card

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a credit card payment method with vendor <Vendor>
- Then the convenience fee message <Resultado> be displayed

Examples:
| Merchant    | Vendor       | Resultado |
| ----------- | ------------ | --------- |
| UOWN        | ANY          | should    |
| KORNERSTONE | OMNIFUND     | should    |
| KORNERSTONE | NON_OMNIFUND | should not |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
| Merchant   | <Merchant> |
```



**PASS**

---
### Scenario: 2 – Hiding the message when selecting a bank account (ACH)

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a bank account (ACH) payment method
- Then the convenience fee message should not be displayed

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```



**PASS**

---
### Scenario: 3 – Hiding the message when no payment method is selected

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When no payment method is selected
- Then the convenience fee message should not be displayed

Examples:
| Merchant    |
| ----------- |
| UOWN        |
| KORNERSTONE |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

**PASS**

---
### Scenario: 4 – Dynamic change of payment method

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer navigates to the Payment page
- When the customer selects a credit card with vendor <VendorInicial>
- Then the convenience fee message <ResultadoInicial> be displayed
- When the customer changes the payment method to <NovoMetodo>
- Then the convenience fee message <ResultadoFinal> be displayed

Examples:
| Merchant    | VendorInicial | ResultadoInicial | NovoMetodo | ResultadoFinal |
| ----------- | ------------- | ---------------- | ---------- | -------------- |
| UOWN        | ANY           | should           | ACH        | should not     |
| KORNERSTONE | OMNIFUND      | should           | ACH        | should not     |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```



**PASS**

---
### Scenario: 5 – Dynamic vendor switching on a KORNERSTONE account

```markdown
- Given the customer accesses the Customer Portal using an account of type KORNERSTONE
- And the customer navigates to the Payment page
- When the customer selects a credit card with vendor <VendorInicial>
- Then the convenience fee message <ResultadoInicial> be displayed
- When the customer selects a credit card with vendor <VendorFinal>
- Then the convenience fee message <ResultadoFinal> be displayed

Examples:
| VendorInicial | ResultadoInicial | VendorFinal  | ResultadoFinal |
| ------------- | ---------------- | ------------ | -------------- |
| OMNIFUND      | should           | NON_OMNIFUND | should not     |
| NON_OMNIFUND  | should not       | OMNIFUND     | should         |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | KORNERSTONE |
```



**PASS**

---
### Scenario: 6 – Customer with UOWN and KORNERSTONE accounts switches between accounts and views the message according to rules

```markdown
- Given the customer has both UOWN and KORNERSTONE accounts
- And the customer accesses the Customer Portal
- And the customer navigates to the Payment page of the <Merchant> account
- When the customer selects a credit card with vendor <Vendor>
- Then the convenience fee message <Resultado> be displayed

Examples:
| Merchant    | Vendor       | Resultado  |
| ----------- | ------------ | ---------- |
| UOWN        | ANY          | should     |
| KORNERSTONE | OMNIFUND     | should     |
| KORNERSTONE | NON_OMNIFUND | should not |

| Data      | Value      |
|-----------|------------|
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```



**PASS**

---
