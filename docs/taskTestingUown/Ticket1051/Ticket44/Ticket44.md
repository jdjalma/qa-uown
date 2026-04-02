-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/qa/fintech-playwright/-/issues/44

UOWN | Automation | Automated Tests for PLAID flow

RELATED TO 1050
Objective:
The Plaid API is a partner service used in the New Application flow to perform bank verification. The system depends on Plaid’s response to determine whether a customer is approved or not. Two key behaviors must be validated:
When the customer completes the entire flow directly through Plaid.  
When the customer abandons the Plaid flow and later returns using the same application link, resuming the process without having to re-enter previously submitted information.

Scope of Testing:
Page Under Test:
Origination - New Application / Sendapplication flow on the Origination Portal

Scenarios to Automate:
@plaid @origination @regression Feature: Bank verification with Plaid during New Application As part of the New Application flow, bank verification is performed inside a Plaid iFrame. The system must handle the decision from Plaid (approved or not) and display a message informing that the status will be sent by email. If the flow is abandoned, it must be possible to resume using the same application link without re-entering customer data.
Background: Given a valid New Application link exists And the customer information form is available And the Plaid iFrame can be launched from the New Application flow
@happy_path Scenario: Direct flow — customer completes all steps and finishes in Plaid
Given the customer accesses the New Application link
And fills in all required registration data
When the Plaid iFrame is launched And the customer completes all steps of the Plaid verification successfully
Then a screen is displayed informing that the status will be sent by email
And the system records that the bank verification was completed
And the system receives the decision from Plaid (approved or not approved)
@decision Scenario Outline: Direct flow — system receives Plaid’s decision Given the customer accesses the New Application link
And fills in all required registration data
And the Plaid iFrame is launched
When the customer completes the Plaid verification successfully
Then a screen is displayed informing that the status will be sent by email
And the system receives the "" from Plaid
And the system persists the Plaid decision result for the application

Examples:
  | decision   |
  | approved   |
  | not_approved |


@abandonment @resume Scenario Outline: Flow abandonment — resuming with the same link returns directly to Plaid
Given the customer accesses the New Application link
And fills in all required registration data And the Plaid iFrame is launched
When the flow is abandoned by "<abandonment_mode>"
And the customer re-opens the same New Application link
Then the flow resumes directly in the Plaid iFrame
And no re-entry of previously submitted data is required
And after completing the Plaid verification, a message is displayed that the status will be sent by email
And the system records the completion of the bank verification

Examples:
  | abandonment_mode       |
  | closing the Plaid iFrame |
  | closing the browser tab  |
  | navigating away          |


@resume @decision Scenario Outline: Abandonment and resume — decision received after completion in Plaid
Given the customer started the New Application and the Plaid iFrame was opened
And the customer abandoned the flow
When the customer re-opens the same New Application link
And resumes directly in the Plaid iFrame
And completes the Plaid verification successfully
Then a message is displayed that the status will be sent by email
And the system receives the "" from Plaid
And the system persists the Plaid decision result for the resumed application

Examples:
  | decision   |
  | approved   |
  | not_approved |


@regression Scenario: Resume must not require new data entry
Given the customer already filled in the required registration data
And abandoned the Plaid flow When the customer re-opens the same New Application link
Then the registration form does not require re-entry of data
And the flow continues directly in the Plaid iFrame

-----

UOWN | Automação | Testes Automatizados para fluxo PLAID

RELACIONADO AO 1050
**Objetivo:**
A API do Plaid é um serviço parceiro usado no fluxo de Nova Aplicação para realizar a verificação bancária. O sistema depende da resposta do Plaid para determinar se um cliente é aprovado ou não.
Dois comportamentos principais devem ser validados:
- Quando o cliente conclui todo o fluxo diretamente pelo Plaid.
- Quando o cliente abandona o fluxo do Plaid e depois retorna usando o mesmo link da aplicação, retomando o processo sem precisar reinserir informações já submetidas.  

**Escopo de Testes:**  
**Página em Teste:**  
Origination - Nova Aplicação / Fluxo Sendapplication no Portal Origination  

---

### Cenários a Automatizar:

#### @plaid @origination @regression
**Funcionalidade:** Verificação bancária com Plaid durante Nova Aplicação  
Como parte do fluxo de Nova Aplicação, a verificação bancária é realizada dentro de um iFrame do Plaid. 
O sistema deve lidar com a decisão do Plaid (aprovado ou não) e exibir uma mensagem informando que o status será enviado por e-mail.  
Se o fluxo for abandonado, deve ser possível retomá-lo usando o mesmo link da aplicação sem reinserir os dados do cliente.  

**Contexto:**  
Dado que existe um link válido de Nova Aplicação  
E que o formulário de informações do cliente está disponível  
E que o iFrame do Plaid pode ser aberto a partir do fluxo de Nova Aplicação  

---

#### @happy_path  
**Cenário:** Fluxo direto — cliente conclui todos os passos e finaliza no Plaid  
Dado que o cliente acessa o link de Nova Aplicação  
E preenche todos os dados obrigatórios de cadastro  
Quando o iFrame do Plaid é aberto  
E o cliente conclui todos os passos da verificação Plaid com sucesso  
Então é exibida uma tela informando que o status será enviado por e-mail  
E o sistema registra que a verificação bancária foi concluída  
E o sistema recebe a decisão do Plaid (aprovado ou não aprovado)  

---

#### @decision  
**Esquema do Cenário:** Fluxo direto — sistema recebe a decisão do Plaid  
Dado que o cliente acessa o link de Nova Aplicação  
E preenche todos os dados obrigatórios de cadastro  
E o iFrame do Plaid é aberto  
Quando o cliente conclui a verificação Plaid com sucesso  
Então é exibida uma tela informando que o status será enviado por e-mail  
E o sistema recebe "" do Plaid  
E o sistema persiste o resultado da decisão do Plaid para a aplicação  

**Exemplos:**  
| decision     |  
|--------------|  
| approved     |  
| not_approved |  

---

#### @abandonment @resume  
**Esquema do Cenário:** Abandono do fluxo — retomando com o mesmo link retorna direto ao Plaid  
Dado que o cliente acessa o link de Nova Aplicação  
E preenche todos os dados obrigatórios de cadastro  
E o iFrame do Plaid é aberto  
Quando o fluxo é abandonado por "<abandonment_mode>"  
E o cliente reabre o mesmo link de Nova Aplicação  
Então o fluxo retoma diretamente no iFrame do Plaid  
E não é necessário reinserir os dados previamente submetidos  
E após concluir a verificação Plaid, é exibida mensagem de que o status será enviado por e-mail  
E o sistema registra a conclusão da verificação bancária  

**Exemplos:**  
| abandonment_mode         |  
|--------------------------|  
| closing the Plaid iFrame |  
| closing the browser tab  |  
| navigating away          |  

---

#### @resume @decision  
**Esquema do Cenário:** Abandono e retomada — decisão recebida após conclusão no Plaid  
Dado que o cliente iniciou a Nova Aplicação e o iFrame do Plaid foi aberto  
E o cliente abandonou o fluxo  
Quando o cliente reabre o mesmo link de Nova Aplicação  
E retoma diretamente no iFrame do Plaid  
E conclui a verificação Plaid com sucesso  
Então é exibida uma mensagem de que o status será enviado por e-mail  
E o sistema recebe "" do Plaid  
E o sistema persiste o resultado da decisão do Plaid para a aplicação retomada  

**Exemplos:**  
| decision     |  
|--------------|  
| approved     |  
| not_approved |  

---

#### @regression  
**Cenário:** Retomada não deve exigir novo preenchimento de dados  
Dado que o cliente já preencheu os dados obrigatórios de cadastro  
E abandonou o fluxo Plaid  
Quando o cliente reabre o mesmo link de Nova Aplicação  
Então o formulário de cadastro não exige reinserção de dados  
E o fluxo continua diretamente no iFrame do Plaid  

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------