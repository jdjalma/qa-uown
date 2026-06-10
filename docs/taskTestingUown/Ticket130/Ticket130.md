---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    https://gitlab.com/uown/frontend/website/-/issues/130

    # UOWN | Customer Portal | Improved Contact Routing via Dropdown on Customer Portal (Zendesk Integration)

    **Status:** Open
    **Ticket created:** 1 month ago by Yuri Araujo

    ## Synopsis

    Currently, the Customer Portal directs all customer inquiries to a single general email inbox, which may lead to duplicated efforts, delays, and confusion across support teams. The proposal is to implement a dropdown menu on the portal that allows end-users to select the type of request (e.g., Billing, Product Return, Technical Support). Based on this selection, the system will automatically route the ticket to the appropriate department within Zendesk. This requires reviewing and potentially refactoring the existing Zendesk integration logic.

    ## Business Objective

    Enhance automated triage of customer inquiries by reducing the number of generic tickets, streamlining the support process, and minimizing unnecessary touches by multiple teams. The goal is to increase efficiency, improve customer satisfaction, and boost support team productivity.

    **Zendesk Ticket:** 5662

    ---

    ## Features and Requirements

    ### Technical Assessment
    - Review the current Zendesk integration, including email routing capabilities and the use of internal views/queues within Zendesk.

    ### Current Behavior Analysis
    - Analyze both frontend and backend behavior related to ticket creation and submission from the Customer Portal.

    ### Dropdown Implementation
    - Add a dropdown component to the Customer Portal with options such as:
    - Billing / Payment Inquiry : accountmanagement@uownleasing.com
    - Payment Arrangement Request : accountmanagement@uownleasing.com
    - Merchandise / Merchant Concern : merchantsupport@uownleasing.com
    - Other : accountmanagement@uownleasing.com

    ### Dynamic Routing Logic
    - Based on the selected option, route the ticket to the appropriate Zendesk email or endpoint to ensure proper queue allocation.

    ### UI/UX Adjustments
    - Remove or hide the currently visible generic support email from the Customer Portal if the new flow becomes the default.

    ### Stakeholder Alignment
    - Validate with business stakeholders which departments and addresses will be used for automated routing.

    ### Quality Assurance
    - Perform both manual and automated testing to ensure the new ticket submission and routing logic works correctly.

    ### UX Best Practices Compliance
    - Ensure the new form enforces required fields (e.g., name, email, request type, description) and that all submitted data is sufficient to identify the customer.

    **SUGGESTION:**
    When a customer submits, can the subject be the Dropdown item they selected, followed by account number.
  Example: `Billing/Payment Inquiry "1234567"`

    ---

    ## Steps to reproduce

    ### ⚙️ Configuration Setup (Pre-test)
    Before starting the test, make sure to configure the appropriate email addresses for each category in the environment's configuration file.

    Example for dev1:
    https://gitlab.com/uown/devops/configuration/-/blob/uown-dev1/config/svc/application.yaml

    ```yaml
    SvCustomerService:
    email:
    categories: >
    billing|Billing / Payment Inquiry|fintechgroup777@gmail.com,
    payment_arrangement|Payment Arrangement Request|fintechgroup777@gmail.com,
    merchant|Merchandise / Merchant Concern|davi.marra@gowsolucoes.com,
    other|Other|fintechgroup777@gmail.com
    ```

    ### 🌐 Portal Access
    Access the UOwn Customer Portal based on the environment you're testing.
    For dev1: https://website-dev1.uownleasing.com/

    ### ✅ Test Steps

    1. From the left sidebar menu, navigate to "Contact Us".
    2. Verify that the screen reflects the new design based on the ticket mock:
    - The top message of the page has been updated.
    - Some labels have been removed.
    - A category dropdown has been added – categories are linked to specific email addresses from the configuration file.
    - After form submission, the form is now cleared (this behavior did not exist before).
    3. Fill out all the fields and submit the form.
    4. Using the browser's developer tools (Inspect → Network tab), verify that the email payload includes the correct formatted subject:

    **Subject format:**
    `[Selected Category Label] - [Account Number] - UOwn Customer Portal Support Ticket`

    **Example payload:**
    ```json
    {
    "customerName": "Rodrick Williams",
    "primaryEmail": "fintechgroup777@gmail.com",
    "primaryPhoneNumber": "2108313331",
    "accountNumber": 64,
    "category": "billing",
    "message": "Development team testing new contact message sending functionality.",
    "subject": "[Billing / Payment Inquiry] - [64] - UOwn Customer Portal Support Ticket"
    }
    ```

    5. **Post-submission Check:**
    After submitting the form, check the inbox defined in the `.yaml` configuration for the selected category.
    Ensure that the email is received correctly and includes the submitted information as expected.


    -----


    # UOWN | Portal do Cliente | Roteamento de Contato Melhorado via Dropdown no Portal do Cliente (Integração Zendesk)

    **Status:** Aberto
    **Tíquete criado:** há 1 mês por Yuri Araujo

    ## Sinopse

    Atualmente, o Portal do Cliente direciona todas as solicitações dos clientes para uma única caixa de e-mail geral,
    o que pode causar esforços duplicados, atrasos e confusão entre as equipes de suporte. A proposta é implementar um menu dropdown no portal,
    permitindo que o usuário final selecione o tipo de solicitação (ex.: Cobrança, Devolução de Produto, Suporte Técnico).
    Com base nessa seleção, o sistema irá direcionar automaticamente o ticket para o departamento correto dentro do Zendesk.
    Isso requer revisão e possível refatoração da lógica de integração existente com o Zendesk.

    ## Objetivo de Negócio

    Aprimorar a triagem automática das solicitações de clientes, reduzindo o número de tickets genéricos, otimizando o processo de suporte e minimizando intervenções
    desnecessárias por múltiplas equipes. O objetivo é aumentar a eficiência, melhorar a satisfação do cliente e a produtividade do time de suporte.

    **Ticket Zendesk:** 5662

    ---

    ## Funcionalidades e Requisitos

    ### Avaliação Técnica
    - Revisar a integração atual com o Zendesk, incluindo as capacidades de roteamento de e-mails e o uso de filas internas.

    ### Análise do Comportamento Atual
    - Analisar os comportamentos de frontend e backend relacionados à criação e envio de tickets pelo Portal do Cliente.

    ### Implementação do Dropdown
    [ ] Adicionar um componente dropdown ao Portal do Cliente com as opções:
    [ ] Cobrança / Consulta de Pagamento : accountmanagement@uownleasing.com
    [ ] Solicitação de Acordo de Pagamento : accountmanagement@uownleasing.com
    [ ] Mercadoria / Dúvida sobre Lojista : merchantsupport@uownleasing.com
    [ ] Outro : accountmanagement@uownleasing.com

    ### Lógica Dinâmica de Roteamento
    - Com base na opção selecionada, direcionar o ticket para o e-mail/endereço correto no Zendesk para garantir a correta alocação na fila.

    ### Ajustes de UI/UX
    - Remover ou ocultar o e-mail de suporte geral atualmente visível no Portal do Cliente, caso o novo fluxo se torne padrão.

    ### Alinhamento com Stakeholders
    - Validar com os stakeholders de negócio quais departamentos e endereços serão usados para roteamento automático.

    ### Garantia de Qualidade
    - Realizar testes manuais e automatizados para garantir que o novo fluxo de submissão e roteamento dos tickets funcione corretamente.

    ### Conformidade com Boas Práticas de UX
    - Garantir que o novo formulário exija campos obrigatórios (ex.: nome, e-mail, tipo de solicitação, descrição) e que os dados enviados permitam identificar o cliente.

    **SUGESTÃO:**
    Quando o cliente submeter, o assunto do ticket pode ser o item do Dropdown selecionado seguido do número da conta.
    Exemplo: `Cobrança/Consulta de Pagamento "1234567"`

    ---

    ## Passos para Reproduzir

    ### ⚙️ Configuração Inicial (Pré-teste)
    Antes de iniciar o teste, configure os endereços de e-mail corretos para cada categoria no arquivo de configuração do ambiente.

    Exemplo para dev1:
    https://gitlab.com/uown/devops/configuration/-/blob/uown-dev1/config/svc/application.yaml
    https://gitlab.com/uown/devops/configuration/-/blob/uown-qa1/config/svc/application.yaml

    ```yaml
    SvCustomerService:
    email:
    categories: >
    billing|Billing / Payment Inquiry|fintechgroup777@gmail.com,
    payment_arrangement|Payment Arrangement Request|fintechgroup777@gmail.com,
    merchant|Merchandise / Merchant Concern|davi.marra@gowsolucoes.com,
    other|Other|fintechgroup777@gmail.com
    ```

    ### 🌐 Acesso ao Portal
    Acesse o Portal do Cliente UOwn conforme o ambiente de testes.
    Para dev1: https://website-dev1.uownleasing.com/

    ### ✅ Passos de Teste

    1. No menu lateral esquerdo, navegue até "Fale Conosco".
    2. Verifique se a tela reflete o novo design baseado no mock do ticket:
    - Mensagem superior da página foi atualizada.
    - Alguns labels foram removidos.
    - Dropdown de categoria foi adicionado – categorias ligadas a endereços específicos do arquivo de configuração.
    - Após o envio do formulário, o formulário é limpo (esse comportamento não existia antes).
    3. Preencha todos os campos e envie o formulário.
    4. Usando as ferramentas de desenvolvedor do navegador (Inspecionar → aba Network), verifique se o payload do e-mail contém o assunto no formato correto:

    **Formato do Assunto:**
    `[Categoria Selecionada] - [Número da Conta] - UOwn Customer Portal Support Ticket`

    **Exemplo de payload:**
      ```json
      {
      "customerName": "Rodrick Williams",
      "primaryEmail": "fintechgroup777@gmail.com",
      "primaryPhoneNumber": "2108313331",
      "accountNumber": 64,
      "category": "billing",
      "message": "Development team testing new contact message sending functionality.",
      "subject": "[Billing / Payment Inquiry] - [64] - UOwn Customer Portal Support Ticket"
      }
      ```

      5. **Verificação pós-envio:**
      Após submeter o formulário, verifique a caixa de entrada configurada no `.yaml` para a categoria escolhida.
      Confirme que o e-mail foi recebido corretamente e inclui as informações enviadas conforme esperado.



      ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
      Tests in qa1

      | AccountPk | Caso de Teste                                                                                                                                                                                        | Dados de Teste  | Status   |
      | --------  | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- |
      | 3990      | Verificar se a tela "Fale Conosco" reflete o novo design com mensagem superior e dropdown de categoria.                                                                                              | -               | PASS     |
      | 3990      | Verificar se o dropdown apresenta todas as categorias conforme configuração: "Cobrança / Consulta de Pagamento", "Solicitação de Acordo de Pagamento", "Mercadoria / Dúvida sobre Lojista", "Outro". | -               | PASS     |
      | 3990      | Validar se o formulário envia corretamente os dados preenchidos e limpa os campos após envio.                                                                                                        | -               | PASS     |
      | 3990      | Verificar se o assunto do e-mail segue o formato: `[Categoria] - [Conta] - UOwn Customer Portal Support Ticket`.                                                                                     | -               | PASS     |
      | 3990      | Verificar se o e-mail é enviado para o endereço correto conforme categoria selecionada no dropdown.                                                                                                  | -               | PASS     |
      | 3990      | Validar se a categoria "merchant" envia para o e-mail configurado                                                                                                                                    |                 | PASS     |


      -----

      Tests in qa1

      | AccountPk | Test Case                                                                                                                                                                                                 | Test Data       | Status   |
      | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- |
      | 3990      | Verify that the "Contact Us" screen reflects the new design with a top message and category dropdown.                                                                                                     | -               | PASS     |
      | 3990      | Verify that the dropdown displays all categories as configured: "Billing / Payment Inquiry", "Payment Agreement Request", "Merchandise / Merchant Inquiry", "Other".                                      | -               | PASS     |
      | 3990      | Validate that the form correctly sends the filled-in data and clears the fields after submission.                                                                                                         | -               | PASS     |
      | 3990      | Verify that the email subject follows the format: `[Category] - [Account] - UOwn Customer Portal Support Ticket`.                                                                                         | -               | PASS     |
      | 3990      | Verify that the email is sent to the correct address according to the category selected in the dropdown.                                                                                                  | -               | PASS     |
      | 3990      | Validate that the "merchant" category sends to the configured email address.                                                                                                                              |                 | PASS     |

Tests in qa1

| AccountPk | Test Case                                                                                                                                                                                                 | Test Data       | Status   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- |
| 3990      | Verify that the "Contact Us" screen reflects the new design with a top message and category dropdown.                                                                                                     |      ![130-qa1-sebsite-BilingInquiry-_1_](/uploads/66df8ca1d32523016db53c95c0c907b9/130-qa1-sebsite-BilingInquiry-_1_.png){width=390 height=719}         | PASS     |
| 3990      | Verify that the dropdown displays all categories as configured: "Billing / Payment Inquiry", "Payment Agreement Request", "Merchandise / Merchant Inquiry", "Other".                                      |        ![image](/uploads/a16dc7b73ec49662b00f3adc8efe4617/image.png)       | PASS     |
| 3990      | Validate that the form correctly sends the filled-in data and clears the fields after submission.                                                                                                         |       ![130-qa1-website-arrangement-_1_](/uploads/a7a3b4a662a9ca1ae755ecc98b00098f/130-qa1-website-arrangement-_1_.png){width=1362 height=719}![130-qa1-website-arrangement-_2_](/uploads/74dd84d1b042968840c692a3a69aa2f4/130-qa1-website-arrangement-_2_.png){width=1362 height=719}![130-qa1-website-merchandise-_1_](/uploads/6fd9e2c0169a246d08d5fe2f725409eb/130-qa1-website-merchandise-_1_.png){width=1362 height=719}![130-qa1-website-merchandise-_2_](/uploads/bba8524b378283a172a6151aa0c839d5/130-qa1-website-merchandise-_2_.png){width=1362 height=719}![130-qa1-website-mobile-ContactUs-_1_](/uploads/16fda9c74cb6c2c437755daa0104bb3f/130-qa1-website-mobile-ContactUs-_1_.png){width=531 height=753}![130-qa1-website-mobile-ContactUs-_2_](/uploads/c08b1e4834a55a3278d46055ec542c6e/130-qa1-website-mobile-ContactUs-_2_.png){width=531 height=753}        | PASS     |
| 3990      | Verify that the email subject follows the format: `[Category] - [Account] - UOwn Customer Portal Support Ticket`.                                                                                         | ![130-qa1-website-arrangement-_3_](/uploads/4645b48e039bf12359e8d60f7671d4c0/130-qa1-website-arrangement-_3_.png){width=1362 height=719}![130-qa1-website-mobile-ContactUs-_3_](/uploads/c0bdb44ee8def255447b6bdb53aad07d/130-qa1-website-mobile-ContactUs-_3_.png){width=900 height=302}              | PASS     |
| 3990      | Verify that the email is sent to the correct address according to the category selected in the dropdown.                                                                                                  |![130-qa1-website-mobile-ContactUs-_7_](/uploads/bf32f1e9fce299d19d3fb3b7b174a0e6/130-qa1-website-mobile-ContactUs-_7_.png){width=537 height=295}![130-qa1-website-mobile-ContactUsEnvioBilingPayment-_7_](/uploads/6c2a7d29c838c2f472faf20d07218e27/130-qa1-website-mobile-ContactUsEnvioBilingPayment-_7_.png){width=539 height=294}              | PASS     |
| 3990      | Validate that the "merchant" category sends to the configured email address.                                                                                                                              |  ![130-qa1-website-merchandise-_1_](/uploads/767eb39d36ad3ead59f282f264512c35/130-qa1-website-merchandise-_1_.png){width=1362 height=719}![130-qa1-website-merchandise-_2_](/uploads/0fbcee0a2fdbdf72a7dbacd819cc54de/130-qa1-website-merchandise-_2_.png){width=1362 height=719}               | PASS     |


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg

> ## Tests in -
> ```gherkin
>
> Verify that the "Contact Us" screen reflects the new design with a top message and category dropdown.
> | PASS | AccountPk 206336 | Merchant | 
> ```
>
17
> 
> ```gherkin
> Verify that the dropdown displays all categories as configured: "Billing / Payment Inquiry", "Payment Agreement Request", "Merchandise / Merchant Inquiry", "Other". 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
26
> 
> ```gherkin
> Validate that the form correctly sends the filled-in data and clears the fields after submission.                                                                    
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
20
> 
> ```gherkin
> Verify that the email subject follows the format: `[Category] - [Account] - UOwn Customer Portal Support Ticket`.                                                    
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
22
> 
> ```gherkin
> Verify that the email is sent to the correct address according to the category selected in the dropdown.                                                             
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
17
> 
> ```gherkin
> Validate that the "merchant" category sends to the configured email address.                                                                                         
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

-----

Verifique se a tela "Fale Conosco" reflete o novo design com uma mensagem no topo e o dropdown de categorias.
Verifique se o dropdown exibe todas as categorias conforme configurado: "Dúvida de Cobrança / Pagamento", "Solicitação de Acordo de Pagamento", "Dúvida sobre Mercadoria / Merchant", "Outro".
Valide se o formulário envia corretamente os dados preenchidos e limpa os campos após o envio.
Verifique se o assunto do e-mail segue o formato: [Categoria] - [Conta] - UOwn Customer Portal Support Ticket.
Verifique se o e-mail é enviado para o endereço correto de acordo com a categoria selecionada no dropdown.
Valide se a categoria "merchant" envia para o e-mail configurado.



> ## Tests in stg
> ```gherkin
>
> Verify that the "Contact Us" screen reflects the new design with a top message and category dropdown.
> | PASS | AccountPk 206336 | -- | 
> ```
>
![Screenshot_17](/uploads/e47113ab7dd43deab85ac07dae504141/Screenshot_17.png){width=1432 height=748}
> 
> ```gherkin
> Verify that the dropdown displays all categories as configured: "Billing / Payment Inquiry", "Payment Agreement Request", "Merchandise / Merchant Inquiry", "Other". 
> | PASS | -- | -- | 
> ```
>
![Screenshot_26](/uploads/ce6e084c0f4fd67652ad7731a999d602/Screenshot_26.png){width=816 height=741}
> 
> ```gherkin
> Validate that the form correctly sends the filled-in data and clears the fields after submission.                                                                    
> | PASS | AccountPk 206336  | -- | 
> ```
>
![Screenshot_20](/uploads/beff5c7186fe574b1e0b451dc6d8a542/Screenshot_20.png){width=1432 height=748}
> 
> ```gherkin
> Verify that the email subject follows the format: `[Category] - [Account] - UOwn Customer Portal Support Ticket`.                                                    
> | PASS | 206336 | -- | 
> ```
>
![Screenshot_22](/uploads/9e6b0b5904f2cc61f0a7c7d3a59f124d/Screenshot_22.png){width=1432 height=748}
> 
> ```gherkin
> Verify that the email is sent to the correct address according to the category selected in the dropdown.                                                             
> | PASS | 206336 | -- |
> ```
>
![Screenshot_17](/uploads/e84716dd7e688f561a2577596236a13f/Screenshot_17.png){width=1432 height=748}
> 
> ```gherkin
> Validate that the "merchant" category sends to the configured email address.                                                                                         
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
![Screenshot_22](/uploads/fe51ae48b55caf0587c5615d27936b3a/Screenshot_22.png){width=1432 height=748}
> 
> ```gherkin
> ## Emails received
>
![Screenshot_13](/uploads/2da6dc617e4839d63a0e0e08d734093b/Screenshot_13.png){width=1069 height=32}![Screenshot_14](/uploads/d81e613c8871907a4394337e8cdce5f2/Screenshot_14.png){width=645 height=84}![Screenshot_15](/uploads/88337ef66f23adeb79cb0c367e1af509/Screenshot_15.png){width=1117 height=33}![Screenshot_16](/uploads/861b733b7ddcccaba484865303c2f1be/Screenshot_16.png){width=709 height=396}![Screenshot_18](/uploads/a4eef18f67833be8703dea3dd809d452/Screenshot_18.png){width=1113 height=30}![Screenshot_19](/uploads/bbdef2c9f02cb29c43e5f50da7eadafe/Screenshot_19.png){width=680 height=302}
>
> ## Example of contact request
![130-stg-ExampleMessage](/uploads/cbbbb7b9f4f81aa6c25b95347210ce98/130-stg-ExampleMessage.png){width=634 height=741}
>
> ```
>
@yuriaraujo.gow This field allows all types of characters, including special characters and emojis. Do we need to address this?
![130-stg-_5_](/uploads/262582585c0a3dcfe7c049ea3778dca4/130-stg-_5_.png){width=1432 height=748}
> ```
>

    ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------