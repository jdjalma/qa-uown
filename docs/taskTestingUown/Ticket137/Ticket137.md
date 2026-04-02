--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/137


## 🇺🇸 ENGLISH

### Title
**UOWN | Customer Portal | Add Kornerstone identification in the email subject (Contact Us Page)**

### Synopsis
Currently, when a customer submits a ticket from the Contact page in the Customer Portal, the support team receives an email whose subject line includes:

- The selected category,
- The account number,
- The customer's name.

With the introduction of Kornerstone accounts under the new integration, support must be able to distinguish these tickets quickly just by looking at the email subject. To achieve this, the system must add a Kornerstone identifier into the email subject line using `client_type` or `company = Kornerstone`.

### Business Objective
Enable the support team to immediately identify when a ticket originates from a Kornerstone customer, speeding up routing, categorization, and response times while reducing manual verification effort.

### Features & Requirements

#### 1. Add Kornerstone identification to the email subject
The email subject must include a clear identifier whenever the customer belongs to `client_type` or `company` Kornerstone.

Identification may use:
- `client_type`, or
- `company = Kornerstone`

#### 2. Preserve all existing subject elements
The subject must continue to include:
- The selected category,
- The account number,
- The customer's name.

#### 3. Do not alter email body
The content of the email remains unchanged.
No changes to templates, logic, or recipients — only the subject line.

#### 4. No changes to existing business logic
This requirement affects only subject formatting, not the behavior of the ticket submission process.

### Testing Steps
Access the customer portal with an account that has company UOWN, and later company KORNERSTONE, and send a customer support email.

The subject of the email now should include the company that matches the account.

**KS**: `[KORNERSTONE] - Merchandise / Merchant Concern - 104 - Fernando Martins`

**UOWN**: `[UOWN] - Merchandise / Merchant Concern - 104 - Fernando Martins`

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# Texto da Tarefa - Português e Inglês

## 🇧🇷 PORTUGUÊS

### Título
**UOWN | Customer Portal | Adicionar identificação Kornerstone no assunto do email (Página Contact Us)**

### Sinopse
Atualmente, quando um cliente envia um ticket pela página Contact no Customer Portal, a equipe de suporte recebe um email cujo assunto inclui:

- A categoria selecionada,
- O número da conta,
- O nome do cliente.

Com a introdução de contas Kornerstone sob a nova integração, o suporte deve ser capaz de distinguir esses tickets rapidamente apenas olhando o assunto do email. Para isso, o sistema deve adicionar um identificador Kornerstone no assunto do email usando `client_type` ou `company = Kornerstone`.

### Objetivo de Negócio
Permitir que a equipe de suporte identifique imediatamente quando um ticket se origina de um cliente Kornerstone, acelerando o roteamento, categorização e tempos de resposta, enquanto reduz o esforço de verificação manual.

### Funcionalidades e Requisitos

#### 1. Adicionar identificação Kornerstone ao assunto do email
O assunto do email deve incluir um identificador claro sempre que o cliente pertencer a `client_type` ou `company` Kornerstone.

A identificação pode usar:
- `client_type`, ou
- `company = Kornerstone`

#### 2. Preservar todos os elementos existentes do assunto
O assunto deve continuar a incluir:
- A categoria selecionada,
- O número da conta,
- O nome do cliente.

#### 3. Não alterar o corpo do email
O conteúdo do email permanece inalterado.
Sem alterações em templates, lógica ou destinatários — apenas a linha de assunto.

#### 4. Sem alterações na lógica de negócio existente
Este requisito afeta apenas a formatação do assunto, não o comportamento do processo de envio de ticket.

### Passos para Teste
Acesse o customer portal com uma conta que tenha company UOWN, e depois company KORNERSTONE, e envie um email de suporte ao cliente.

O assunto do email agora deve incluir a company que corresponde à conta.

**KS**: `[KORNERSTONE] - Merchandise / Merchant Concern - 104 - Fernando Martins`

**UOWN**: `[UOWN] - Merchandise / Merchant Concern - 104 - Fernando Martins`


## 📊 Comparação Lado a Lado

| Elemento | Português | English |
|----------|-----------|---------|
| **Identificador** | `[KORNERSTONE]` ou `[UOWN]` | `[KORNERSTONE]` or `[UOWN]` |
| **Formato** | `[COMPANY] - Categoria - Nº Conta - Nome` | `[COMPANY] - Category - Account # - Name` |
| **Exemplo KS** | `[KORNERSTONE] - Merchandise / Merchant Concern - 104 - Fernando Martins` | `[KORNERSTONE] - Merchandise / Merchant Concern - 104 - Fernando Martins` |
| **Exemplo UOWN** | `[UOWN] - Merchandise / Merchant Concern - 104 - Fernando Martins` | `[UOWN] - Merchandise / Merchant Concern - 104 - Fernando Martins` |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ```gherkin
> **Verifique** que, ao enviar um ticket pela página Contact Us usando uma conta cuja company é Kornerstone, o assunto do e-mail contém um identificador claro de KORNERSTONE.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que o identificador de Kornerstone aparece somente no assunto do e-mail, sem qualquer alteração no corpo da mensagem.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que, para contas Kornerstone, o assunto do e-mail continua incluindo a categoria selecionada, o número da conta e o nome do cliente, além do identificador de Kornerstone.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que, ao enviar um ticket usando uma conta cuja company é UOWN, o assunto do e-mail não exibe o identificador Kornerstone.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que, para contas UOWN, o assunto do e-mail permanece exatamente com os elementos atuais: categoria selecionada, número da conta e nome do cliente, sem inclusão de novos identificadores.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que o corpo do e-mail enviado pelo formulário Contact Us permanece inalterado para contas UOWN e Kornerstone.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que a inclusão do identificador Kornerstone ocorre apenas quando a conta pertence à empresa Kornerstone.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verifique** que o assunto do e-mail permite identificar visualmente e de forma imediata se o ticket é de um cliente Kornerstone ou UOWN, sem necessidade de abrir o e-mail.
>
> !
>
> **| PASS |**
> ```


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin
> **Verify** that when submitting a ticket through the Contact Us page using an account whose company is Kornerstone, the email subject contains a clear KORNERSTONE identifier.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that the Kornerstone identifier appears only in the email subject, with no changes to the email body.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that for Kornerstone accounts, the email subject continues to include the selected category, the account number, and the customer name, in addition to the Kornerstone identifier.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that when submitting a ticket using an account whose company is UOWN, the email subject does not display the Kornerstone identifier.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that for UOWN accounts, the email subject remains exactly with the current elements: selected category, account number, and customer name, with no additional identifiers.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that the email body sent from the Contact Us form remains unchanged for both UOWN and Kornerstone accounts.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that the Kornerstone identifier is included only when the account belongs to the Kornerstone company.
>
> !
>
> **| PASS |**
> ```

---

> ```gherkin
> **Verify** that the email subject allows immediate visual identification of whether the ticket is from a Kornerstone or UOWN customer, without opening the email.
>
> !
>
> **| PASS |**
> ```

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2

> ```gherkin

> **Verify** that when submitting a ticket through the Contact Us page using an account whose company is Kornerstone, the email subject contains a clear KORNERSTONE identifier.

> ![Screenshot_at_Dec_21_01-39-23](/uploads/b7997105e510ae020d25c4ab3e31a4b8/Screenshot_at_Dec_21_01-39-23.png){width=457 height=40}
> ![Screenshot_at_Dec_21_01-40-25](/uploads/4c94e717ac7f3ae239aa2c76f8023b8a/Screenshot_at_Dec_21_01-40-25.png){width=519 height=139}
![Screenshot_at_Dec_21_01-51-21](/uploads/9e25c8f40f2695fb8e501b4bb5daf518/Screenshot_at_Dec_21_01-51-21.png){width=900 height=99}
![Screenshot_at_Dec_21_01-51-31](/uploads/6a89bf0d2047e9e25a22c9624d9a6f54/Screenshot_at_Dec_21_01-51-31.png){width=513 height=504}
![Screenshot_at_Dec_21_01-51-37](/uploads/b2c31e346bd42a8608a21035a098e89e/Screenshot_at_Dec_21_01-51-37.png){width=518 height=302}
![Screenshot_at_Dec_21_01-51-44](/uploads/6dcdcf54d129de4a1ff609b6da4c15ef/Screenshot_at_Dec_21_01-51-44.png){width=511 height=503}
> ![Screenshot_at_Dec_21_03-15-40](/uploads/54b9be6fb25dcd1dbfaa75126096e22a/Screenshot_at_Dec_21_03-15-40.png){width=900 height=515}
> ![Screenshot_at_Dec_21_03-15-57](/uploads/f33c0c88ca01d66b7185903d79d00c0f/Screenshot_at_Dec_21_03-15-57.png){width=900 height=40}

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that the Kornerstone identifier appears only in the email subject, with no changes to the email body.

> ![Screenshot_at_Dec_21_01-51-21](/uploads/b13f7ce8fac9e36cd741f45eb5c4c01a/Screenshot_at_Dec_21_01-51-21.png){width=900 height=99}
> ![Screenshot_at_Dec_21_01-51-31](/uploads/7991979870b3b8c5caee84664a16489e/Screenshot_at_Dec_21_01-51-31.png){width=513 height=504}
> ![Screenshot_at_Dec_21_01-51-37](/uploads/32e00b3764777f7ed5f1924894054d81/Screenshot_at_Dec_21_01-51-37.png){width=518 height=302}
> ![Screenshot_at_Dec_21_01-51-44](/uploads/f3f5dd395627eab68ddf0261630e4210/Screenshot_at_Dec_21_01-51-44.png){width=511 height=503}

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that for Kornerstone accounts, the email subject continues to include the selected category, the account number, and the customer name, in addition to the Kornerstone identifier.

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that when submitting a ticket using an account whose company is UOWN, the email subject does not display the Kornerstone identifier.

> ![Screenshot_at_Dec_21_01-39-12](/uploads/8413d17d540bc01c98c807692000b25a/Screenshot_at_Dec_21_01-39-12.png){width=434 height=169}
> ![Screenshot_at_Dec_21_01-39-56](/uploads/5add1a2b9c523ead71dc3bc9f672c56c/Screenshot_at_Dec_21_01-39-56.png){width=501 height=167}
> ![Screenshot_at_Dec_21_01-50-52](/uploads/25115323a2ade7ce5856542c8f6da281/Screenshot_at_Dec_21_01-50-52.png){width=900 height=100}
> ![Screenshot_at_Dec_21_01-50-59](/uploads/af516c6ccccd8214f6a7dda32813ab3c/Screenshot_at_Dec_21_01-50-59.png){width=518 height=405}
> ![Screenshot_at_Dec_21_01-51-06](/uploads/e2fdab086d05c2f5fe500a252201b5ce/Screenshot_at_Dec_21_01-51-06.png){width=499 height=600}
> ![Screenshot_at_Dec_21_01-51-15](/uploads/d0ac46177a2b8b7d4ea4a980cb7f7bae/Screenshot_at_Dec_21_01-51-15.png){width=463 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that for UOWN accounts, the email subject remains exactly with the current elements: selected category, account number, and customer name, with no additional identifiers.

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that the email body sent from the Contact Us form remains unchanged for both UOWN and Kornerstone accounts.

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that the Kornerstone identifier is included only when the account belongs to the Kornerstone company.

> ![Screenshot_at_Dec_21_02-10-23](/uploads/a8a3e98f3d82bc3f63f6c4555fc8fe51/Screenshot_at_Dec_21_02-10-23.png){width=537 height=165}
> ![Screenshot_at_Dec_21_02-10-31](/uploads/fd6a5bb6dbf13b65447703327bfd4f40/Screenshot_at_Dec_21_02-10-31.png){width=666 height=161}
> ![Screenshot_at_Dec_21_02-10-39](/uploads/6baf94798818615ddd06247b5dd1543e/Screenshot_at_Dec_21_02-10-39.png){width=677 height=162}
> ![Screenshot_at_Dec_21_02-09-06](/uploads/51c6bc624a768b5f620a73365cd89b24/Screenshot_at_Dec_21_02-09-06.png){width=639 height=159}
> ![Screenshot_at_Dec_21_02-09-58](/uploads/69683c5bbb4a9687270d46a90797651e/Screenshot_at_Dec_21_02-09-58.png){width=627 height=184}
> ![Screenshot_at_Dec_21_02-10-06](/uploads/19bc4088640029d96b6780ed969bf817/Screenshot_at_Dec_21_02-10-06.png){width=629 height=157}
> ![Screenshot_at_Dec_21_01-39-12](/uploads/b343e26d38f06dbbe2944dd67e1c310a/Screenshot_at_Dec_21_01-39-12.png){width=434 height=169}

> **| PASS |**
> ```

---

> ```gherkin

> **Verify** that the email subject allows immediate visual identification of whether the ticket is from a Kornerstone or UOWN customer, without opening the email.

> ![Screenshot_at_Dec_21_01-39-12](/uploads/67b45cf2dd4365c3e0c41ec4b714afea/Screenshot_at_Dec_21_01-39-12.png){width=434 height=169}
> ![image](/uploads/9f6bf19a03c007c7b4a03230ec993e7d/image.png){width=900 height=292}

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------