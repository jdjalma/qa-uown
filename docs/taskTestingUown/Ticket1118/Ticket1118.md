-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1118

UOWN | Origination | NextPayDate Must Not Accept Past Dates

Bug
In the Origination Portal, when creating a new application and filling customer data in the Employment section, the field NextPayDate is allowing past dates in a specific flow.

Scenario observed:
    Select Monthly and set LastPayDate as September 1.
    Navigate to GrossMonthlyIncome.
    Return to the payment frequency field and change it to Weekly.
    The previously filled NextPayDate is retained, even if it is a past date.
As a result, the system accepts a NextPayDate in the past, which should not be allowed.


Fix
1. Add validation logic to ensure NextPayDate cannot be a past date, regardless of frequency changes.
2. When payment frequency is changed, reset or revalidate the NextPayDate field.
3. Block progression and display a clear error message if NextPayDate is in the past.
4. Ensure consistency across all payment frequencies (Weekly, Bi-Weekly, Monthly, etc.).
5. Add regression tests to confirm no scenario permits past dates in NextPayDate.


Steps to Reproduce
1. Start a new application in the Origination Portal.
2. In the Employment section, choose payment frequency as Monthly.
3. Enter LastPayDate = 01 September.
4. Move to the GrossMonthlyIncome field.
5. Return and change frequency to Weekly.
6. Observe that NextPayDate keeps the previously entered value (in the past).

Expected Result: The system should validate NextPayDate after all fields are filled and must not accept past dates under any condition.
Actual Result: The system allows NextPayDate with a past date when switching payment frequency.

---

UOWN | Origination | NextPayDate Não Deve Aceitar Datas Passadas

Bug
No Portal de Originação, ao criar uma nova aplicação e preencher os dados do cliente na seção de Emprego, 
o campo NextPayDate está permitindo datas passadas em um fluxo específico.

Cenário observado:
* Selecionar frequência de pagamento como Monthly (Mensal) e definir LastPayDate como 1º de setembro.
* Preencher Last Pay Date e Next Pay Date
* Navegar para o campo GrossMonthlyIncome (Renda Mensal Bruta).
* Retornar ao campo de frequência de pagamento e alterá-lo para Weekly (Semanal).
* O Next Pay Date previamente preenchido é mantido, mesmo que seja uma data passada.
* Como resultado, o sistema aceita um NextPayDate no passado, o que não deveria ser permitido.

Correção
Adicionar lógica de validação para garantir que NextPayDate não possa ser uma data passada, independentemente de mudanças na frequência.
Quando a frequência de pagamento for alterada,  
Bloquear a progressão e exibir uma mensagem de erro clara se NextPayDate estiver no passado.  
Garantir consistência entre todas as frequências de pagamento (Weekly, Bi-Weekly, Monthly, etc.).
Adicionar testes de regressão para confirmar que nenhum cenário permite datas passadas no NextPayDate.

Passos para Reproduzir
* Iniciar uma nova aplicação no Portal de Originação.
* Na seção de Emprego, escolher frequência de pagamento como Monthly (Mensal).
* Inserir LastPayDate = 01 de setembro.
* Mover para o campo GrossMonthlyIncome.
* Retornar e alterar a frequência para Weekly (Semanal).
* Observar que o NextPayDate mantém o valor previamente inserido (no passado).

Resultado Atual: O sistema permite NextPayDate com data passada ao trocar a frequência de pagamento.
Resultado Esperado vs Resultado Atual
Resultado Esperado: O sistema deve validar o NextPayDate após todos os campos serem preenchidos e não deve aceitar datas passadas sob nenhuma condição.

Resumo
Este é um bug de validação onde a mudança de frequência de pagamento (Monthly → Weekly) não revalida o campo NextPayDate, 
permitindo que datas passadas sejam aceitas indevidamente. 
A correção requer validação robusta e testes de regressão para garantir que o campo sempre rejeite datas passadas, independentemente do fluxo de preenchimento.


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. 
When Selecionar pay schedule Weekly
And preencher Last pay date com dia anterior ao dia atual
Then Next pay date deve ser preenchido com 7 dias a frente de Last pay date
When Selecionar pay schedule Monthly
Then Next pay date deve ser preenchido com 30 dias a frente de Last pay date
Then Apagar Last pay date
Then Apagar Next pay date


2.
When Selecionar pay schedule Weekly
And preencher Last pay date com dia anterior ao dia atual
Then Next pay date deve ser preenchido com 7 dias a frente de Last pay date
When Selecionar pay schedule Bi-Weekly
Then Next pay date deve ser preenchido com 14 dias a frente de Last pay date
Then Apagar Last pay date
Then Apagar Next pay date


3.
When Selecionar pay schedule Weekly
And preencher Last pay date com dia anterior ao dia atual
Then Next pay date deve ser preenchido com 7 dias a frente de Last pay date
When Selecionar pay schedule Semi-Monthly
Then Next pay date deve ser preenchido com 14 dias a frente de Last pay date
Then Apagar Last pay date
Then Apagar Next pay date


4.
When Selecionar pay schedule Weekly
And preencher Last pay date com dia anterior ao dia atual
Then Next pay date deve ser preenchido com 7 dias a frente de Last pay date
When Preencher Last pay date com dia 15 do mês anterior
And Preencher Next pay date com 7 dias a frente de Last pay date
Then Não deve ser permitido selecionar Next pay date menor que o dia atual
Then deve exibir a mensagem "Invalid date"
Then Apagar Last pay date
Then Apagar Next pay date


5.
When Selecionar pay schedule Weekly
And preencher Last pay date com dia anterior ao dia atual
Then Next pay date deve ser preenchido com 7 dias a frente de Last pay date
Then Limpar o campo Next pay date
When Selecionar pay schedule Monthly
Then Next pay date deve ser preenchido com 30 dias a frente de Last pay date
Then Apagar Last pay date
Then Apagar Next pay date

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin
> ### Scenario: Alteração de Weekly para Monthly
> Given the pay schedule is set to Weekly
> And the Last pay date field is filled with the date prior to the current day
> Then the Next pay date field is calculated as 7 days after the Last pay date
> When the pay schedule is changed to Monthly
> Then the Next pay date field is updated as 30 days after the Last pay date
> | PASS |
> ```
>
>


> ```gherkin
> ### Scenario: Alteração de Weekly para Bi-Weekly
> Given the pay schedule is set to Weekly
> And the Last pay date field is filled with the date prior to the current day
> Then the Next pay date field is calculated as 7 days after the Last pay date
> When the pay schedule is changed to Bi-Weekly
> Then the Next pay date field is updated as 14 days after the Last pay date
> | PASS | 
> ```
>
>


> ```gherkin
> ### Scenario: Alteração de Weekly para Semi-Monthly
> Given the pay schedule is set to Weekly
> And the Last pay date field is filled with the date prior to the current day
> Then the Next pay date field is calculated as 7 days after the Last pay date
> When the pay schedule is changed to Semi-Monthly
> Then the Next pay date field is updated as 14 days after the Last pay date
> | PASS |
> ```
>
>


> ```gherkin
> ### Scenario: Validação de Next pay date menor que a data atual
> Given the pay schedule is set to Weekly
> And the Last pay date field is filled with the date prior to the current day
> Then the Next pay date field is calculated as 7 days after the Last pay date
> When the Last pay date field is set to the 15th of the previous month
> And the Next pay date field is filled with a value earlier than the current date
> Then the system must not allow selecting a Next pay date earlier than the current date
> And the message "Invalid date" must be displayed
> | PASS |
> ```
![Screenshot_34](/uploads/54bdcc5f65e63f8c4f844233a00e2c77/Screenshot_34.png){width=1427 height=740}

![Screenshot_35](/uploads/9436c063639062ce92b4f642f6a76f79/Screenshot_35.png){width=1427 height=740}
>
>


> ```gherkin
> ### Scenario: Limpeza do campo Next pay date e alteração para Monthly
> Given the pay schedule is set to Weekly
> And the Last pay date field is filled with the date prior to the current day
> Then the Next pay date field is calculated as 7 days after the Last pay date
> When the Next pay date field is cleared
> And the pay schedule is changed to Monthly
> Then the Next pay date field is updated as 30 days after the Last pay date
> | PASS |
> ```
>
>

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.45.0_NextPayDateMustNotAcceptPastDates_Ticket1118

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: UOWN | Origination | NextPayDate Must Not Accept Past Dates

  Scenario Outline: NextPayDate Must Not Accept Past Dates - Change from Weekly to Monthly in "<env>"

    # SETUP VARIABLES - EXAMINE THESE BEFORE RUNNING
    # this line needs no changes
    Given I set the environment to "<env>", project to "uown", subdomain to "origination", navigate to login
    # stealth mode will run the window simulated in the background - ideal for mass testing and where you don't care to manipulate the window afterwards
    And I set the browser to "<browser>", stealth mode if the following argument is yes: "no"
    # this multiplies the timeout on elements by a certain amount to account for "slow days" and acts as a multiplier (e.g. 1 = 1x (normal), 2 = 2x, 2.5 = 2.5x...)
    Given Timeout multiplier is set to: "2"
    # Do not change/remove these or else reporting may be inaccurate
    Given Relevant variables are reset
    Given UownCreateAccount Relevant variables are reset
    # if stealth mode is activated, the window will always be "closed"
    Given Window is closed - 'always', 'on success', 'never': "never"
    Given Write test results to a data file if the following argument is yes: "yes"
    Given Screenshots are taken - 'always', 'on success', 'on failure', 'never': "on failure"
    # presentation mode slows down the system - ideal for viewing the process, but makes it considerably slower
    Given Presentation mode is on if the following argument is yes: "yes"
    # "checks" include checking price summaries
    Given Checks are enabled if the following argument is yes: "yes"
    # strict mode = break on any error; if off, only breaks on errors which end the flow
    Given Strict mode is enabled if the following argument is yes: "no"
    # this is the reverse mode toggle for dealing with divergent ddmm mmdd formats
    Given DDMM Dates are processed in reverse if the following argument is yes: "yes"
    # debug is purely for a developer
#    Given Debug messages are enabled if the following argument is yes: "no"
    Given Servicing is enabled if the following argument is yes: "yes"
    Given Website is enabled if the following argument is yes: "yes"

    Given Begin UownUnifiedFlow

    Given Create a new application with merchant "<merchant>"
    Then Verify the new application through email
    Then Fill only the new application Your Information with state <state>
    When Select pay schedule "Weekly"
    And Set Last pay date to "yesterday"
    Then Next Pay Date must be filled with 7 days ahead of Last Pay Date
    When Select pay schedule "Monthly"
    Then Next Pay Date must be filled with 1 month ahead of Last Pay Date
    Then Validate Next pay date is not a past date
    Then Clear Last pay date
    Then Clear Next pay date

    And Test is successful

    @UOWNDefinitive
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | definitive      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | qa1 | NY    | ProgressMobility         | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      | qa2 | CA    | ProgressMobility        | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNSandbox
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
    #  | sandbox | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNStg
    Examples:
      | env | state | merchant         | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | stg | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev1      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#          | dev2      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev3
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev3      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |


#---

  Scenario Outline: NextPayDate Must Not Accept Past Dates - Change from Weekly to Bi-Weekly in "<env>"

    # SETUP VARIABLES - EXAMINE THESE BEFORE RUNNING
    # this line needs no changes
    Given I set the environment to "<env>", project to "uown", subdomain to "origination", navigate to login
    # stealth mode will run the window simulated in the background - ideal for mass testing and where you don't care to manipulate the window afterwards
    And I set the browser to "<browser>", stealth mode if the following argument is yes: "no"
    # this multiplies the timeout on elements by a certain amount to account for "slow days" and acts as a multiplier (e.g. 1 = 1x (normal), 2 = 2x, 2.5 = 2.5x...)
    Given Timeout multiplier is set to: "2"
    # Do not change/remove these or else reporting may be inaccurate
    Given Relevant variables are reset
    Given UownCreateAccount Relevant variables are reset
    # if stealth mode is activated, the window will always be "closed"
    Given Window is closed - 'always', 'on success', 'never': "never"
    Given Write test results to a data file if the following argument is yes: "yes"
    Given Screenshots are taken - 'always', 'on success', 'on failure', 'never': "on failure"
    # presentation mode slows down the system - ideal for viewing the process, but makes it considerably slower
    Given Presentation mode is on if the following argument is yes: "yes"
    # "checks" include checking price summaries
    Given Checks are enabled if the following argument is yes: "yes"
    # strict mode = break on any error; if off, only breaks on errors which end the flow
    Given Strict mode is enabled if the following argument is yes: "no"
    # this is the reverse mode toggle for dealing with divergent ddmm mmdd formats
    Given DDMM Dates are processed in reverse if the following argument is yes: "yes"
    # debug is purely for a developer
#    Given Debug messages are enabled if the following argument is yes: "no"
    Given Servicing is enabled if the following argument is yes: "yes"
    Given Website is enabled if the following argument is yes: "yes"

    Given Begin UownUnifiedFlow

    Given Create a new application with merchant "<merchant>"
    Then Verify the new application through email
    Then Fill only the new application Your Information with state <state>
    When Select pay schedule "Weekly"
    And Set Last pay date to "yesterday"
    Then Next Pay Date must be filled with 7 days ahead of Last Pay Date
    When Select pay schedule "Bi-Weekly"
    Then Next Pay Date must be filled with 14 days ahead of Last Pay Date
    Then Validate Next pay date is not a past date
    Then Clear Last pay date
    Then Clear Next pay date

    And Test is successful

    @UOWNDefinitive
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | definitive      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | qa1 | NY    | ProgressMobility         | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      | qa2 | CA    | ProgressMobility        | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNSandbox
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
    #  | sandbox | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNStg
    Examples:
      | env | state | merchant         | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | stg | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev1      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#          | dev2      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev3
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev3      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |


#---


  Scenario Outline: NextPayDate Must Not Accept Past Dates - Change from Weekly to Semi-Monthly in "<env>"

    # SETUP VARIABLES - EXAMINE THESE BEFORE RUNNING
    # this line needs no changes
    Given I set the environment to "<env>", project to "uown", subdomain to "origination", navigate to login
    # stealth mode will run the window simulated in the background - ideal for mass testing and where you don't care to manipulate the window afterwards
    And I set the browser to "<browser>", stealth mode if the following argument is yes: "no"
    # this multiplies the timeout on elements by a certain amount to account for "slow days" and acts as a multiplier (e.g. 1 = 1x (normal), 2 = 2x, 2.5 = 2.5x...)
    Given Timeout multiplier is set to: "2"
    # Do not change/remove these or else reporting may be inaccurate
    Given Relevant variables are reset
    Given UownCreateAccount Relevant variables are reset
    # if stealth mode is activated, the window will always be "closed"
    Given Window is closed - 'always', 'on success', 'never': "never"
    Given Write test results to a data file if the following argument is yes: "yes"
    Given Screenshots are taken - 'always', 'on success', 'on failure', 'never': "on failure"
    # presentation mode slows down the system - ideal for viewing the process, but makes it considerably slower
    Given Presentation mode is on if the following argument is yes: "yes"
    # "checks" include checking price summaries
    Given Checks are enabled if the following argument is yes: "yes"
    # strict mode = break on any error; if off, only breaks on errors which end the flow
    Given Strict mode is enabled if the following argument is yes: "no"
    # this is the reverse mode toggle for dealing with divergent ddmm mmdd formats
    Given DDMM Dates are processed in reverse if the following argument is yes: "yes"
    # debug is purely for a developer
#    Given Debug messages are enabled if the following argument is yes: "no"
    Given Servicing is enabled if the following argument is yes: "yes"
    Given Website is enabled if the following argument is yes: "yes"

    Given Begin UownUnifiedFlow

    Given Create a new application with merchant "<merchant>"
    Then Verify the new application through email
    Then Fill only the new application Your Information with state <state>
    When Select pay schedule "Weekly"
    And Set Last pay date to "yesterday"
    Then Next Pay Date must be filled with 7 days ahead of Last Pay Date
    When Select pay schedule "Semi-Monthly"
    Then Next Pay Date must be filled with 14 days ahead of Last Pay Date
    Then Validate Next pay date is not a past date
    Then Clear Last pay date
    Then Clear Next pay date

    And Test is successful

    @UOWNDefinitive
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | definitive      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | qa1 | NY    | ProgressMobility         | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      | qa2 | CA    | ProgressMobility        | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNSandbox
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
    #  | sandbox | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNStg
    Examples:
      | env | state | merchant         | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      # | stg | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev1      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#          | dev2      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev3
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev3      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |


#---


  Scenario Outline: NextPayDate Must Not Accept Past Dates - Clearing the "Next Payment Date" field and setting it to "Monthly" in "<env>"

    # SETUP VARIABLES - EXAMINE THESE BEFORE RUNNING
    # this line needs no changes
    Given I set the environment to "<env>", project to "uown", subdomain to "origination", navigate to login
    # stealth mode will run the window simulated in the background - ideal for mass testing and where you don't care to manipulate the window afterwards
    And I set the browser to "<browser>", stealth mode if the following argument is yes: "no"
    # this multiplies the timeout on elements by a certain amount to account for "slow days" and acts as a multiplier (e.g. 1 = 1x (normal), 2 = 2x, 2.5 = 2.5x...)
    Given Timeout multiplier is set to: "2"
    # Do not change/remove these or else reporting may be inaccurate
    Given Relevant variables are reset
    Given UownCreateAccount Relevant variables are reset
    # if stealth mode is activated, the window will always be "closed"
    Given Window is closed - 'always', 'on success', 'never': "never"
    Given Write test results to a data file if the following argument is yes: "yes"
    Given Screenshots are taken - 'always', 'on success', 'on failure', 'never': "on failure"
    # presentation mode slows down the system - ideal for viewing the process, but makes it considerably slower
    Given Presentation mode is on if the following argument is yes: "yes"
    # "checks" include checking price summaries
    Given Checks are enabled if the following argument is yes: "yes"
    # strict mode = break on any error; if off, only breaks on errors which end the flow
    Given Strict mode is enabled if the following argument is yes: "no"
    # this is the reverse mode toggle for dealing with divergent ddmm mmdd formats
    Given DDMM Dates are processed in reverse if the following argument is yes: "yes"
    # debug is purely for a developer
#    Given Debug messages are enabled if the following argument is yes: "no"
    Given Servicing is enabled if the following argument is yes: "yes"
    Given Website is enabled if the following argument is yes: "yes"

    Given Begin UownUnifiedFlow

    Given Create a new application with merchant "<merchant>"
    Then Verify the new application through email
    Then Fill only the new application Your Information with state <state>
    When Select pay schedule "Weekly"
    And Set Last pay date to "yesterday"
    Then Next Pay Date must be filled with 7 days ahead of Last Pay Date
    And Set Next pay date to "yesterday"
    Then Validate error message "Invalid date" is displayed
    Then Clear Last pay date

    And Test is successful

    @UOWNDefinitive
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | definitive      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | qa1 | NY    | ProgressMobility         | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      | qa2 | CA    | ProgressMobility        | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNSandbox
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
    #  | sandbox | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNStg
    Examples:
      | env | state | merchant         | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      # | stg | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev1      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#          | dev2      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev3
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev3      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |


#---


  Scenario Outline: NextPayDate Must Not Accept Past Dates in "<env>"

    # SETUP VARIABLES - EXAMINE THESE BEFORE RUNNING
    # this line needs no changes
    Given I set the environment to "<env>", project to "uown", subdomain to "origination", navigate to login
    # stealth mode will run the window simulated in the background - ideal for mass testing and where you don't care to manipulate the window afterwards
    And I set the browser to "<browser>", stealth mode if the following argument is yes: "no"
    # this multiplies the timeout on elements by a certain amount to account for "slow days" and acts as a multiplier (e.g. 1 = 1x (normal), 2 = 2x, 2.5 = 2.5x...)
    Given Timeout multiplier is set to: "2"
    # Do not change/remove these or else reporting may be inaccurate
    Given Relevant variables are reset
    Given UownCreateAccount Relevant variables are reset
    # if stealth mode is activated, the window will always be "closed"
    Given Window is closed - 'always', 'on success', 'never': "never"
    Given Write test results to a data file if the following argument is yes: "yes"
    Given Screenshots are taken - 'always', 'on success', 'on failure', 'never': "on failure"
    # presentation mode slows down the system - ideal for viewing the process, but makes it considerably slower
    Given Presentation mode is on if the following argument is yes: "yes"
    # "checks" include checking price summaries
    Given Checks are enabled if the following argument is yes: "yes"
    # strict mode = break on any error; if off, only breaks on errors which end the flow
    Given Strict mode is enabled if the following argument is yes: "no"
    # this is the reverse mode toggle for dealing with divergent ddmm mmdd formats
    Given DDMM Dates are processed in reverse if the following argument is yes: "yes"
    # debug is purely for a developer
#    Given Debug messages are enabled if the following argument is yes: "no"
    Given Servicing is enabled if the following argument is yes: "yes"
    Given Website is enabled if the following argument is yes: "yes"

    Given Begin UownUnifiedFlow

    Given Create a new application with merchant "<merchant>"
    Then Verify the new application through email
    Then Fill only the new application Your Information with state <state>
    When Select pay schedule "Weekly"
    And Set Last pay date to "yesterday"
    Then Next Pay Date must be filled with 7 days ahead of Last Pay Date
    Then Clear Next pay date
    When Select pay schedule "Monthly"
    Then Next Pay Date must be filled with 1 month ahead of Last Pay Date
    Then Clear Last pay date
    Then Clear Next pay date

    And Test is successful

    @UOWNDefinitive
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | definitive      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | qa1 | NY    | ProgressMobility         | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNQa2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      | qa2 | CA    | ProgressMobility        | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNSandbox
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
    #  | sandbox | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNStg
    Examples:
      | env | state | merchant         | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
      # | stg | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev1
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev1      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev2
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#          | dev2      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |

    @UOWNDev3
    Examples:
      | env | state | merchant | achPaymentDate | achPaymentAmount | ccPaymentDate | ccPaymentAmount | browser |
#      | dev3      | CA    | ProgressMobility | 5              | 123.45           | 7             | 678.90          | chrome  |


#---






### Cenário: Alteração de Weekly para Monthly  
Dado que o cronograma de pagamento está definido como Weekly  
E o campo Last pay date está preenchido com a data anterior ao dia atual  
Então o campo Next pay date é calculado como 7 dias após o Last pay date  
Quando o cronograma de pagamento é alterado para Monthly  
Então o campo Next pay date é atualizado como 30 dias após o Last pay date  
| PASS |

### Cenário: Alteração de Weekly para Bi-Weekly  
Dado que o cronograma de pagamento está definido como Weekly  
E o campo Last pay date está preenchido com a data anterior ao dia atual  
Então o campo Next pay date é calculado como 7 dias após o Last pay date  
Quando o cronograma de pagamento é alterado para Bi-Weekly  
Então o campo Next pay date é atualizado como 14 dias após o Last pay date  
| PASS |

### Cenário: Alteração de Weekly para Semi-Monthly  
Dado que o cronograma de pagamento está definido como Weekly  
E o campo Last pay date está preenchido com a data anterior ao dia atual  
Então o campo Next pay date é calculado como 7 dias após o Last pay date  
Quando o cronograma de pagamento é alterado para Semi-Monthly  
Então o campo Next pay date é atualizado como 14 dias após o Last pay date  
| PASS |

### Cenário: Validação de Next pay date menor que a data atual  
Dado que o cronograma de pagamento está definido como Weekly  
E o campo Last pay date está preenchido com a data anterior ao dia atual  
Então o campo Next pay date é calculado como 7 dias após o Last pay date  
Quando o campo Last pay date é definido para o dia 15 do mês anterior  
E o campo Next pay date é preenchido com um valor anterior à data atual  
Então o sistema não deve permitir selecionar um Next pay date anterior à data atual  
E a mensagem "Invalid date" deve ser exibida  
| PASS |

### Cenário: Limpeza do campo Next pay date e alteração para Monthly  
Dado que o cronograma de pagamento está definido como Weekly  
E o campo Last pay date está preenchido com a data anterior ao dia atual  
Então o campo Next pay date é calculado como 7 dias após o Last pay date  
Quando o campo Next pay date é limpo  
E o cronograma de pagamento é alterado para Monthly  
Então o campo Next pay date é atualizado como 30 dias após o Last pay date  
| PASS |

