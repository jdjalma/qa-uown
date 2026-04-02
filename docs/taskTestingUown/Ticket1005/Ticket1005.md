--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1005

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Implement Pre-Auth Consent Form & Tracking Flags in Lead and Account

Synopsis:
Enhance the ACH payment authorization flow by including a Pre-Auth Consent Form to all lease and adding tracking flags in the system to record a customer consent. 
Additionally, allow servicing agents to modify consent status upon customer request.

Business Objective:
• Ensure that pre-authorization consent is explicitly captured before ACH payment authorization.
• Allow servicing agents to update consent preferences upon customer request.

Feature Request | Business Requirements:
1. Add Pre-Auth Consent Form
    Include a pre-auth consent form in all lease documents before the ACH Payment Authorization page.        
    Default selection should be “Yes” unless explicitly changed by the customer.   
2. Track Consent Selection in Lead and Account
    Add a new field (flag) in both Lead and Account records to store the customer’s opt-in or opt-out selection.
3. Allow Agents to Modify Consent in Servicing
    Implement an option for servicing agents to opt-out a customer after the fact, based on customer request.



UOWN | Originação | Implementar Formulário de Consentimento Pré-Autorizado e Flags de Rastreamento em Lead e Account

Sinopse:
Aprimorar o fluxo de autorização de pagamento ACH incluindo um Formulário de Consentimento Pré-Autorizado em todos os leases 
e adicionando flags de rastreamento no sistema para registrar o consentimento do cliente.
Além disso, permitir que agentes de atendimento modifiquem o status de consentimento mediante solicitação do cliente.

Objetivo de Negócio:
• Garantir que o consentimento pré-autorizado seja explicitamente capturado antes da autorização de pagamento ACH.
• Permitir que agentes de atendimento atualizem as preferências de consentimento a pedido do cliente.

Solicitação de Funcionalidade | Requisitos de Negócio:
1. Adicionar Formulário de Consentimento Pré-Autorizado
    Incluir um formulário de consentimento pré-autorizado em todos os documentos de lease antes da página de Autorização de Pagamento ACH.
    A seleção padrão deve ser “Sim”, a menos que o cliente a altere explicitamente.
2. Rastrear Seleção de Consentimento em Lead e Account
    Adicionar um novo campo (flag) nos registros de Lead e Account para armazenar a escolha de opt-in ou opt-out do cliente.
3. Permitir Modificação de Consentimento por Agentes em Servicing
    Implementar uma opção para os agentes de atendimento desativarem o consentimento do cliente posteriormente, com base na solicitação do cliente.    

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------    

Requisito da Tarefa
UOWN | Originação | Implementar Formulário de Consentimento Pré-Autorizado e Flags de Rastreamento em Lead e Account
Objetivo:

Garantir que o consentimento pré-autorizado seja capturado antes da autorização de pagamento ACH.
Permitir que os agentes de atendimento atualizem as preferências de consentimento a pedido do cliente.
Funcionalidades e Requisitos:

Adicionar Formulário de Consentimento Pré-Autorizado
Incluir um formulário de consentimento pré-autorizado antes da página de Autorização de Pagamento ACH. A seleção padrão deve ser “Sim”, a menos que o cliente a altere explicitamente.

Rastrear Seleção de Consentimento em Lead e Account
Adicionar um campo (flag) nos registros de Lead e Account para armazenar a escolha de consentimento (opt-in ou opt-out).

Permitir Modificação de Consentimento por Agentes em Servicing
Implementar a opção de agentes de atendimento modificarem o consentimento, permitindo que optem por desmarcar o consentimento após a solicitação do cliente.

-----

1. Cenário: Validar a Inclusão do Formulário de Consentimento Pré-Autorizado

Scenario: Validar se o Formulário de Consentimento Pré-Autorizado é exibido corretamente antes da página de Autorização de Pagamento ACH
  Given que o usuário acessa a página de lease
  When visualizar o formulário de consentimento antes da página de Autorização de Pagamento ACH
  Then o formulário deve ser exibido com a opção "Sim" selecionada por padrão
  And o cliente deve ter a opção de alterar a seleção para "Não"

Explicação:
Este cenário valida a exibição e o comportamento do formulário de consentimento pré-autorizado antes da página de autorização de pagamento ACH. A seleção padrão deve ser “Sim”, mas o cliente pode alterar para “Não”.

Resultado Esperado:
O formulário é exibido corretamente e a seleção padrão é “Sim”, com a possibilidade de alteração para “Não”.

Frase de evidência:
Verifique se o formulário de consentimento pré-autorizado é exibido corretamente, com a seleção padrão sendo "Sim" e a opção para alterar para "Não".

-----

2. Cenário: Validar Rastreamento da Seleção de Consentimento em Lead e Account

Scenario: Validar o rastreamento da seleção de consentimento nos registros de Lead e Account
  Given que o cliente escolhe a opção "Sim" no formulário de consentimento
  When o registro de Lead ou Account é salvo
  Then a flag de consentimento deve ser marcada como "opt-in" no registro

Explicação:
Este cenário valida o rastreamento da escolha de consentimento nos registros de Lead e Account. A flag deve ser marcada corretamente com base na escolha do cliente.

Resultado Esperado:
O registro de Lead ou Account deve ter a flag corretamente configurada como "opt-in" , conforme a escolha do cliente.

Frase de evidência:
Verifique se a escolha de consentimento é corretamente registrada nos registros de Lead e Account, com a flag configurada como "opt-in".

-----

3. Cenário: Validar Rastreamento da Seleção de Consentimento em Lead e Account

Scenario: Validar o rastreamento da seleção de consentimento nos registros de Lead e Account
  Given que o cliente escolhe a opção "Não" no formulário de consentimento
  When o registro de Lead ou Account é salvo
  Then a flag de consentimento deve ser marcada como "opt-out" no registro

Explicação:
Este cenário valida o rastreamento da escolha de consentimento nos registros de Lead e Account. A flag deve ser marcada corretamente com base na escolha do cliente.

Resultado Esperado:
O registro de Lead ou Account deve ter a flag corretamente configurada como "opt-out", conforme a escolha do cliente.

Frase de evidência:
Verifique se a escolha de consentimento é corretamente registrada nos registros de Lead e Account, com a flag configurada como "opt-out".

-----

4. Verificar a geração do documento de leasing para todos os estados listados

Scenario Outline: Verificar se o documento de leasing é gerado corretamente para o estado <state>
    Dado que a página de criação de contrato de leasing está aberta
    Quando o usuário seleciona o estado <state>
    Então o documento de leasing deve ser gerado corretamente para o estado <state>
    E o documento deve ser válido sem erros

    Examples:
      | state |
      | AL    |
      | AR    |
      | AK    |
      | AZ    |
      | CA    |
      | CO    |
      | CT    |
      | DE    |
      | FL    |
      | GA    |
      | HI    |
      | IA    |
      | IL    |
      | ID    |
      | IN    |
      | KS    |
      | KY    |
      | LA    |
      | MA    |
      | MD    |
      | ME    |
      | MI    |
      | MO    |
      | MS    |
      | MT    |
      | NC    |
      | ND    |
      | NE    |
      | NH    |
      | NM    |
      | NV    |
      | NY    |
      | OH    |
      | OK    |
      | OR    |
      | PA    |
      | RI    |
      | SC    |
      | SD    |
      | TN    |
      | TX    |
      | UT    |
      | VA    |
      | WA    |
      | WI    |
      | WV    |
      | WY    |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o formulário de consentimento pré-autorizado aparece corretamente, com "Sim" como padrão e opção para mudar para "Não".
Verify that the pre-authorized consent form displays correctly, with "Yes" as the default and an option to switch to "No".

Verifique se a escolha de consentimento é registrada nos registros de Lead e Account, com a flag "opt-in" correta.
Verify that the consent choice is recorded in Lead and Account records, with the "opt-in" flag set correctly.

Verifique se a escolha de consentimento é registrada nos registros de Lead e Account, com a flag "opt-out" correta.
Verify that the consent choice is recorded in Lead and Account records, with the "opt-out" flag set correctly.

Verifique a geração do documento de leasing para todos os estados listados: AL, AR, AK, AZ, CA, CO, CT, DE, FL, GA, HI, IA, IL, ID, IN, KS, KY, LA, MA, MD, ME, MI, MO, MS, 
MT, NC, ND, NE, NH, NM, NV, NY, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VA, WA, WI, WV, WY.
Verify the generation of the leasing document for all listed states: AL, AR, AK, AZ, CA, CO, CT, DE, FL, GA, HI, IA, IL, ID, IN, KS, KY, LA, MA, MD, ME, MI, MO, MS, 
MT, NC, ND, NE, NH, NM, NV, NY, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VA, WA, WI, WV, WY.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12248 | Progress Mobility | Verify that the pre-authorized consent form displays correctly, with "Yes" as the default and an option to switch to "No" |  | PASS |
| 12248 | Progress Mobility | Verify that the consent choice is recorded in Lead and Account records, with the "opt-in" flag set correctly |  | PASS |
| 12255 | Progress Mobility | Verify that the consent choice is recorded in Lead and Account records, with the "opt-out" flag set correctly |  | PASS |
| -- | Progress Mobility | Verify the generation of the leasing document for all listed states: CA, TX, AL, AR, AK, AZ, CO, CT, DE, FL, GA, HI, IA, IL, ID, IN, KS, KY, LA, MA, MD, ME, MI, MO, MS, MT, NC, ND, NE, NH, NM, NV, NY, OH, OK, OR, PA, RI, SC, SD, TN,  UT, VA, WA, WI, WV, WY. |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12248 | Progress Mobility | Verify that the pre-authorized consent form displays correctly, with "Yes" as the default and an option to switch to "No" |  | PASS |
| 12248 | Progress Mobility | Verify that the consent choice is recorded in Lead and Account records, with the "opt-in" flag set correctly |  | PASS |
| 12255 | Progress Mobility | Verify that the consent choice is recorded in Lead and Account records, with the "opt-out" flag set correctly |  | PASS |
| -- | Progress Mobility | Verify the generation of the leasing document for all listed states: CA, TX, AL, AR, AK, AZ, CO, CT, DE, FL, GA, HI, IA, IL, ID, IN, KS, KY, LA, MA, MD, ME, MI, MO, MS, MT, NC, ND, NE, NH, NM, NV, NY, OH, OK, OR, PA, RI, SC, SD, TN,  UT, VA, WA, WI, WV, WY. |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------