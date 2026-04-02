---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/134


UOWN | Customer Portal | Update the Subject Lines from Tickets (Zendesk)


Synopsis
Currently, when a customer submits a request via the Customer Portal (Contact Us Page), the generated email sent to Zendesk follows a generic subject line.

A new standardized pattern must be implemented for the email title (subject), structured as follows:
REQUEST TYPE – ACCOUNT NUMBER – CUSTOMER NAME
    Example: Billing / Payment Iquire - 1337 - John Doe

Where:
* REQUEST TYPE → corresponds to the category selected by the customer in the dropdown list on the Customer Portal.
* ACCOUNT NUMBER → refers to the customer’s account number related to the request.
* CUSTOMER NAME → the customer’s full name (as displayed in their account).


Business Objective
Standardizing the email subject improves the efficiency of support operations by enabling faster categorization and identification of customer requests in Zendesk.
This ensures consistency, traceability, and better response times for incoming tickets.


Features and Requirements
Update the Customer Portal → Zendesk integration to generate email subjects following the new pattern:
* Apply this logic to all request categories currently available in the dropdown.
* Validate that all emails sent to Zendesk contain the new subject format.
* Confirm that the body, attachments, and message content remain unchanged.
![alt text](image.png)


Testing Steps

Confirm that now the emails sent will follow the structure:
request type - accountPk - customer full name
Like in the example below
![alt text](image-1.png)

How to change the email target
If needed, the email target for subjects can be changed in the config /uown-qa1/config/svc
            SvCustomerService:
              email:
                categories: >
                  billing|Billing / Payment Inquiry|fintechgroup777@gmail.com,
                  payment_arrangement|Payment Arrangement Request|fintechgroup777@gmail.com,
                  merchant|Merchandise / Merchant Concern|jose.mendes.gow@uownleasing.com,
                  other|Other|fintechgroup777@gmail.com
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Portal do Cliente | Atualizar os Assuntos dos Tickets (Zendesk)


Sinopse
Atualmente, quando um cliente envia uma solicitação através do Portal do Cliente (página Fale Conosco), o e-mail gerado e enviado ao Zendesk utiliza uma linha de assunto genérica.

Deve ser implementado um novo padrão padronizado para o título (assunto) do e-mail, estruturado da seguinte forma:
TIPO DE SOLICITAÇÃO – NÚMERO DA CONTA – NOME DO CLIENTE
    Exemplo: Billing / Payment Inquiry – 1337 – John Doe

Onde:
* TIPO DE SOLICITAÇÃO → corresponde à categoria selecionada pelo cliente no menu suspenso (dropdown) do Portal do Cliente.
* NÚMERO DA CONTA → refere-se ao número da conta do cliente relacionada à solicitação.
* NOME DO CLIENTE → é o nome completo do cliente (conforme exibido em sua conta).


Objetivo de Negócio
A padronização do assunto dos e-mails melhora a eficiência das operações de suporte, permitindo categorização e identificação mais rápidas das solicitações de clientes no Zendesk.
Isso garante consistência, rastreabilidade e tempos de resposta aprimorados para os tickets recebidos.


Funcionalidades e Requisitos
Atualizar a integração entre o Portal do Cliente e o Zendesk para gerar assuntos de e-mails seguindo o novo padrão:
Aplicar essa lógica a todas as categorias de solicitação atualmente disponíveis no menu dropdown.
Validar que todos os e-mails enviados ao Zendesk contenham o novo formato de assunto.
Confirmar que o corpo do e-mail, anexos e conteúdo da mensagem permaneçam inalterados.
![alt text](image.png)

Passos de Teste

Confirmar que agora os e-mails enviados seguem a estrutura:
tipo de solicitação – accountPk – nome completo do cliente
Exemplo:
Billing / Payment Inquiry – 1337 – John Doe
![alt text](image-1.png)

Como alterar o destino do e-mail
Caso seja necessário, o destino de e-mail para os assuntos pode ser alterado no arquivo de configuração:
/uown-qa1/config/svc
Exemplo de configuração:
SvCustomerService:
  email:
    categories: >
      billing|Billing / Payment Inquiry|fintechgroup777@gmail.com,
      payment_arrangement|Payment Arrangement Request|fintechgroup777@gmail.com,
      merchant|Merchandise / Merchant Concern|jose.mendes.gow@uownleasing.com,
      other|Other|fintechgroup777@gmail.com

✅ Resultado Esperado:
Todos os tickets criados através do Portal do Cliente devem chegar ao Zendesk com o assunto formatado conforme o padrão definido, garantindo clareza, consistência e maior eficiência no atendimento ao cliente.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 1 arquivo
+
1
−
1
 pages/contact/index.tsx 
+
1
−
1

Visualizado
@@ -66,7 +66,7 @@ const Contact = (props: ContactProps) => {
      );

      const data: any = Object.assign({}, values);
      data.subject = `[${selectedCategory.label}] - [${values.accountNumber}] - UOwn Customer Portal Support Ticket`;
      data.subject = `${selectedCategory.label} - ${values.accountNumber} - ${values.customerName}`;
      data.to = selectedCategory.to;
      // eslint-disable-next-line no-console
      console.log('[Email Frontend] Sending email to:', data.to);

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------      
1. Quando um cliente envia uma solicitação de "Billing / Payment Inquiry" através do Portal do Cliente, o email recebido no Zendesk deve conter o assunto no formato: Billing / Payment Inquiry - {accountNumber} - {customerName}.
2. Quando um cliente envia uma solicitação de "Payment Arrangement Request" através do Portal do Cliente, o email recebido no Zendesk deve conter o assunto no formato: Payment Arrangement Request - {accountNumber} - {customerName}.
3. Quando um cliente envia uma solicitação de "Merchandise / Merchant Concern" através do Portal do Cliente, o email recebido no Zendesk deve conter o assunto no formato: Merchandise / Merchant Concern - {accountNumber} - {customerName}.
4. Quando um cliente envia uma solicitação de "Other" através do Portal do Cliente, o email recebido no Zendesk deve conter o assunto no formato: Other - {accountNumber} - {customerName}.
6. Ao enviar uma solicitação de qualquer categoria, o email deve ser roteado para o destinatário correto conforme configurado no arquivo de categorias.
---
1. When a customer submits a "Billing / Payment Inquiry" request through the Customer Portal, the email received in Zendesk must have the subject formatted as:
Billing / Payment Inquiry - {accountNumber} - {customerName}

2. When a customer submits a "Payment Arrangement Request" through the Customer Portal, the email received in Zendesk must have the subject formatted as:
Payment Arrangement Request - {accountNumber} - {customerName}

3. When a customer submits a "Merchandise / Merchant Concern" request through the Customer Portal, the email received in Zendesk must have the subject formatted as:
Merchandise / Merchant Concern - {accountNumber} - {customerName}

4. When a customer submits an "Other" request through the Customer Portal, the email received in Zendesk must have the subject formatted as:
Other - {accountNumber} - {customerName}


6. When submitting a request from any category, the email must be routed to the correct recipient as configured in the categories file.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in qa2



> ```gherkin

> **When a customer submits a "Billing / Payment Inquiry" request through the Customer Portal, the email received in Zendesk must have the subject formatted as: Billing / Payment Inquiry - {accountNumber} - {customerName}**

> ![Screenshot_at_Oct_26_09-43-02](/uploads/accf9ad5557ef45364096f59b26a82e8/Screenshot_at_Oct_26_09-43-02.png)
> ![Screenshot_at_Oct_26_09-43-15](/uploads/33f6cd58ff920c26ae2e47c4a4a167be/Screenshot_at_Oct_26_09-43-15.png)
> ![Screenshot_at_Oct_26_09-44-11](/uploads/9f449fc3964177f94592cf1ec44c7cca/Screenshot_at_Oct_26_09-44-11.png){width=633 height=19}
> ![Screenshot_at_Oct_26_09-44-24](/uploads/9c61c7ab7dd32a75aeaaf79933247c2a/Screenshot_at_Oct_26_09-44-24.png){width=282 height=119}

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer submits a "Payment Arrangement Request" through the Customer Portal, the email received in Zendesk must have the subject formatted as: Payment Arrangement Request - {accountNumber} - {customerName}**

> ![Screenshot_at_Oct_26_09-50-20](/uploads/cef7ae12e15d6505cdd28937c5c4dee8/Screenshot_at_Oct_26_09-50-20.png)
> ![Screenshot_at_Oct_26_09-50-33](/uploads/9e992f26d3ec3e54fb3a6f8941497b6c/Screenshot_at_Oct_26_09-50-33.png)
> ![Screenshot_at_Oct_26_09-50-49](/uploads/1be69e3ada3b7beb2ef99b82ce073283/Screenshot_at_Oct_26_09-50-49.png)
> ![Screenshot_at_Oct_26_11-13-36](/uploads/58ce9995b30bc7e15e771bed331aa7d3/Screenshot_at_Oct_26_11-13-36.png){width=620 height=19}
> ![Screenshot_at_Oct_26_11-13-45](/uploads/50af4d8649b979d87e13b6fedc9847ca/Screenshot_at_Oct_26_11-13-45.png){width=318 height=119}

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer submits a "Merchandise / Merchant Concern" request through the Customer Portal, the email received in Zendesk must have the subject formatted as: Merchandise / Merchant Concern - {accountNumber} - {customerName}**

> ![Screenshot_at_Oct_26_11-15-22](/uploads/5212d2b828323219108e861ccf83ecc1/Screenshot_at_Oct_26_11-15-22.png)
> ![Screenshot_at_Oct_26_11-16-07](/uploads/47e76de377d5e9e3c61a96a1c5f1ad94/Screenshot_at_Oct_26_11-16-07.png){width=311 height=16}
> ![Screenshot_at_Oct_26_11-16-34](/uploads/573841dae54c063c1b5a58305d88879e/Screenshot_at_Oct_26_11-16-34.png){width=319 height=183}

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer submits an "Other" request through the Customer Portal, the email received in Zendesk must have the subject formatted as: Other - {accountNumber} - {customerName}**

> ![Screenshot_at_Oct_26_11-25-55](/uploads/5bc6b8b6f3c3507e059738c40fc468dd/Screenshot_at_Oct_26_11-25-55.png){width=505 height=18}
> ![Screenshot_at_Oct_26_11-26-06](/uploads/95f74873ff314ee17c84d12d4d5ceb19/Screenshot_at_Oct_26_11-26-06.png){width=643 height=142}

> **| PASS |**
> ```

---

> ```gherkin

> **When submitting a request from any category, the email must be routed to the correct recipient as configured in the categories file**

> **| PASS |**
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

