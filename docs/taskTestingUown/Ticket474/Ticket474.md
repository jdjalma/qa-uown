-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/474

UOWN | Servicing | Create Activity Log for Fee Receivable Additions


Synopsis
Currently, when a fee receivable is added, the system does not automatically generate an activity log.
To improve traceability and auditing, the system must log this event in the activity logs.

Business Objective
Adding a fee receivable is a critical financial action that must be tracked. By logging these events:
    The business ensures transparency in financial operations.
    Auditing and compliance processes are improved.
    Users gain visibility of all financial changes in the activity history.

Feature Request | Business Requirements
    Generate a new activity log entry whenever a fee receivable is added.
    Log entry must include key details:
    Fee type and amount.
    Associated customer/merchant.
    Date and time of addition.
    User/system action responsible.
    Ensure the log is consistent in format and behavior with existing activity log entries.
    Confirm activity logs are created for all modules where a fee receivable can be added.
    Add validation to prevent duplicate or missing log entries.
    Testing to confirm this behavior across different scenarios.

test instructions
create a lead move it to servicing and on servicing portal go to the scheduled payments pages, use +ADD FEE button. 
And activity log in the lead should be created for each fee.

-----

UOWN | Manutenção | Criar Registro de Atividades para Adições de Taxas a Receber

Sinopse
Atualmente, quando uma taxa a receber é adicionada, o sistema não gera automaticamente um registro de atividades.
Para melhorar a rastreabilidade e a auditoria, o sistema deve registar este evento nos registos de atividades.

Objetivo do negócio
Adicionar uma taxa a receber é uma ação financeira crítica que deve ser monitorada. Registrando esses eventos:
    O negócio garante transparência nas operações financeiras.
    Os processos de auditoria e conformidade são melhorados.
    Os usuários ganham visibilidade de todas as mudanças financeiras no histórico de atividades.

Solicitação de recurso | Requisitos de negócios
    Gerar um novo entrada de log de atividades sempre que uma taxa a receber for adicionada.
    A entrada de log deve incluir detalhes importantes:
        Tipo e valor da taxa.
        Cliente/comerciante associado.
        Data e hora da adição.
        Ação do usuário/sistema responsável.
    Certifique-se de que o log seja consistente em formato e comportamento com as entradas de log de atividades existentes.
    Confirme se os logs de atividades são criados para todos os módulos onde uma taxa a receber pode ser adicionada.
    Adicione validação para evitar entradas de log duplicadas ou ausentes.
    Testes para confirmar esse comportamento em diferentes cenários.

instruções de teste
crie um lead mova-o para o serviço e no portal de serviço vá para as páginas de pagamentos agendados, use +ADICIONAR TAXA botão.
E o log de atividades no lead deve ser criado para cada taxa.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Em Português:
Usuário adiciona a taxa "X", visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa com a Data Efetiva da Transação futura, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa com a Data Efetiva da Transação anterior à data atual, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa com o valor de fee zerado, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa com o valor de fee maior que zero, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa com comentário, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário adiciona uma taxa sem comentário, visualiza o log de adição gerado e valida o armazenamento do log no banco de dados.
Usuário edita uma taxa alterando a Scheduled Due Date, Scheduled Amount, Scheduled Tax, Skip Payment e o comentário.

In English:
User adds fee "X", views the generated addition log, and validates the log storage in the database.
User adds a fee with a future Transaction Effective Date, views the generated addition log, and validates the log storage in the database.
User adds a fee with a Transaction Effective Date prior to the current date, views the generated addition log, and validates the log storage in the database.
User adds a fee with a zero fee amount, views the generated addition log, and validates the log storage in the database.
User adds a fee with a fee amount greater than zero, views the generated addition log, and validates the log storage in the database.
User adds a fee with a comment, views the generated addition log, and validates the log storage in the database.
User adds a fee without a comment, views the generated addition log, and validates the log storage in the database.
User edits a fee by modifying the Scheduled Due Date, Scheduled Amount, Scheduled Tax, Skip Payment, and the comment.

Then A entrada de log deve incluir Tipo de taxa selecionado na criação.
Then A entrada de log deve incluir due date selecionado(Transaction Effective Date) na criação.
Then A entrada de log deve incluir valor da taxa inserido na criação.
Then A entrada de log deve incluir se a taxa é skipped.
Then A entrada de log deve incluir UserID do usuário/sistema responsável pela criação.
Then A entrada de log deve incluir comentário inserido na criação

Then A entrada de log deve incluir valor da taxa alterado na edição.
Then A entrada de log deve incluir valor da scheduled total calculado na edição.
Then A entrada de log deve incluir se a taxa é skipped taxa alterado na edição.
Then A entrada de log deve incluir UserID do usuário/sistema responsável pela edição.
Then A entrada de log deve incluir comentário alterado na edição

-----

-----

***PASSO A PASSO*

Criação de fee:

click on add fee
select fee type
select Data efetiva da transação
insert fee amount
insert comment
Clicar em save
Verificar exibição modal "Fee Added Successfully"
Acessar servicing
Verificar Log
Acessar banco de dados e validar armazenamento do log

-----

Edição de fee:

Clicar em editar fee
alterar Scheduled Due Date
alterar Scheduled Amount
Alterar Scheduled Tax
Alterar skip payment
Alterar comment
clicar em salvar
Verificar exibição modal "Successfully modified payment."
Acessar servicing
Verificar Log

-----

waive fee:
Clicar em editar fee
clicar em waive
Verificar exibição modal "Successfully waived payment."
Acessar servicing
Verificar Log

-----

** STEPS + ELEMENTS **
Criação de fee

https://svc-website-qa2.uownleasing.com/scheduled-payments/*accountPk*
https://svc-website-qa2.uownleasing.com/scheduled-payments/10910

clicar em add fee
<button class="scheduled-payments-information_transactionButton__FCgNF">+ ADD FEE</button>

Header modal Add Fee
<div class="index-module_font_bold__L13Kn index-module_font_24px__AGMET">Add Fee</div>


selecionar tipo de taxa
campo selecao fee
Fee type
protection plan fee
<div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Protection Plan Fee</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-3-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div>

nsf fee
<div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">NSF Fee</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-3-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div>

reinstatement fee
<div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Reinstatement Fee</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-3-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div>

manual fee
<div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Manual Fee</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-3-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div>

misc fee
<div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Misc Fee</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-3-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div>



Transaction Effective Date
id="transactionEffectiveDate"

fee amount
id="feeAmount"

comment
id="comment"

botao salvar
<button type="submit" form="paymentModal" class="ml-2 text-uppercase index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">SAVE</span></button>

Ao clicar em salvar dispara endpoint
Request URL
https://svc-website-qa2.uownleasing.com/uown/svc/createOrUpdateReceivable
Request Method
POST
Status Code
200 OK
Remote Address
35.225.69.210:443
Referrer Policy
strict-origin-when-cross-origin

payload
{accountPk: 10910, receivableType: "PROTECTION_PLAN_FEE", dueDate: "2025-10-01", totalAmount: 35,…}
accountPk: 10910
baseAmount: 35
comment: "100225 - 35"
dueDate: "2025-10-01"
receivableType: "PROTECTION_PLAN_FEE"
totalAmount: 35

response
{
    "pk": 652532,
    "rowCreatedTimestamp": "2025-10-01T10:54:36.360553217",
    "rowUpdatedTimestamp": null,
    "tenantId": null,
    "webUserId": null,
    "agent": null,
    "receivableInfo": {
        "receivablePk": 652532,
        "leadPk": 0,
        "accountPk": 10910,
        "dueDate": "2025-10-01",
        "baseAmount": 35,
        "taxAmount": 0,
        "taxRate": 0,
        "totalAmount": 35,
        "status": "ACTIVE",
        "allocationStatus": "UNPAID",
        "partialPaymentAmount": 0,
        "receivableType": "PROTECTION_PLAN_FEE",
        "baseEpoAmount": 0,
        "baseEpo90DayIneligible": 0,
        "comment": "100225 - 35",
        "notes": null,
        "skipped": false,
        "taxUpdated": "2025-10-01T10:54:36.225179806",
        "taxForZipPk": null
    }
}

acessar servicing
https://svc-website-qa2.uownleasing.com/customer-information/*accountPk*

---

Edição de fee:

Clicar em editar fee
id="cell-10-undefined"
alterar Scheduled Due Date
id="scheduledDueDate"
alterar Scheduled Amount
id="scheduledAmount"
Alterar Scheduled Tax
id="scheduledTax"
Alterar skip payment
id="skippedPayment"
Alterar comment
id="comment"
clicar em salvar
<button type="submit" form="paymentModal" class="ml-2 text-uppercase index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">SAVE</span></button>
Verificar exibição toast "Successfully modified payment."
Acessar servicing
Verificar Log


---

waive fee:
Clicar em editar fee
id="cell-10-undefined"
clicar em waive
<button type="submit" form="paymentModal" class="text-uppercase index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">WAIVE</span></button>
Verificar exibição toast "Successfully waived payment."
Acessar servicing
Verificar Log

---

--> STEP:Criar validação para o campo Transaction Effective Date que é obrigatorio
--> STEP:Criar validação para o campo comment que é obrigatorio

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Retornos:

* When the action is "waive" (waiver/removal), the Activity Log should register the event as "waived" instead of "edited".

* Display the comment entered at the time of creation (field comment).

* Currently, when editing, we display the receivablePk in the log, for example: receivablePk: 652534. Is this data really necessary? If yes, could we also display the receivablePk when creating the fee to make the fee log more traceable?

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> Feature: UOWN | Servicing | Create Activity Log for Fee Receivable Additions

> ```gherkin
> ### Scenario Outline: User adds fee "protection plan fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Protection Plan Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "35.00"
> And Enter fee comment "Test fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 35.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: PROTECTION_PLAN_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14033 | AccountPk:10938 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Nsf Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Nsf Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "135.00"
> And Enter fee comment "Test fee Nsf Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 135.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Nsf Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: NSF_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14034 | AccountPk:10939 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Reinstatement Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Reinstatement Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "40.00"
> And Enter fee comment "Test fee Reinstatement Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 40.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Reinstatement Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: REINSTATEMENT_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14035 | AccountPk:10940 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Manual Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Manual Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "65.00"
> And Enter fee comment "Test fee Manual Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 65.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Manual Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: MANUAL_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14036 | AccountPk:10941 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Misc Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Misc Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "48.00"
> And Enter fee comment "Test fee Misc Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 48.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Misc Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: MISC_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14037 | AccountPk:10942 | Merchant:Progress Mobility | 
> ```
>
>

---------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> Feature: UOWN | Servicing | Create Activity Log for Fee Receivable Additions

> ```gherkin
> ### Scenario Outline: User adds fee "protection plan fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Protection Plan Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "35.00"
> And Enter fee comment "Test fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 35.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: PROTECTION_PLAN_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14042 | AccountPk:10946 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Nsf Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Nsf Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "135.00"
> And Enter fee comment "Test fee Nsf Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 135.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Nsf Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: NSF_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14043 | AccountPk:10947 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Reinstatement Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Reinstatement Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "40.00"
> And Enter fee comment "Test fee Reinstatement Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 40.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Reinstatement Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: REINSTATEMENT_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14044 | AccountPk:10948 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Manual Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Manual Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "65.00"
> And Enter fee comment "Test fee Manual Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 65.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Manual Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: MANUAL_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14045 | AccountPk:10949 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Misc Fee", views the generated addition log, in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click on add fee button
> And Select fee type "Misc Fee"
> And Enter transaction effective date "10/03/2025"
> And Enter fee amount "48.00"
> And Enter fee comment "Test fee Misc Fee for automation"
> And Click save fee button
> And Verify fee added successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable added," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-03," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 48.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Test fee Misc Fee for automation" in notes
> Then Should see log of type "DATA_CHANGE" containing "type: MISC_FEE" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14046 | AccountPk:10950 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: The user edited the created fee and views the edit log generated in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click edit fee button
> And Update scheduled due date "10/10/2025"
> And Update scheduled amount "52.00"
> And Update scheduled tax "5.00"
> And Update scheduled comment "Edit Test fee Misc Fee for automation"
> And Toggle skip payment "yes"
> And Save scheduled payment changes
> And Verify fee modified successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable updated," in notes
> Then Should see log of type "DATA_CHANGE" containing "dueDate: 2025-10-10," in notes
> Then Should see log of type "DATA_CHANGE" containing "amount: 57.00," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: ACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Edit Test fee Misc Fee for automation," in notes
> Then Should see log of type "DATA_CHANGE" containing "skipped: true" in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14047 | AccountPk:10951 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: The user waived the created fee and views the generated edit log in "<env>"
> And Log in to service portal
> And Open customer information
> And Navigate to Due Amounts
> And Click edit fee button
> And Update scheduled comment "Fee Waived"
> And Click waive fee button
> And Verify fee waived successfully toast appears
> And Navigate to Servicing page
> When Expand all long log notes
> Then Should see log of type "DATA_CHANGE" containing "Receivable updated," in notes
> Then Should see log of type "DATA_CHANGE" containing "status: INACTIVE," in notes
> Then Should see log of type "DATA_CHANGE" containing "comment: Fee Waived," in notes
> And Test is successful
> Examples:
> | env | state | merchant         | browser |
> | qa2 | CA    | ProgressMobility | chrome  |
>
> | PASS | LeadPk:14048 | AccountPk:10952 | Merchant:Progress Mobility | 
> ```
>
>


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.45.0_CreateActivityLogForFeeReceivableAdditions_Ticket474

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





> ## Tests in stg

> Feature: UOWN | Servicing | Create Activity Log for Fee Receivable Additions

> ```gherkin
> ### Scenario Outline: User adds fee "protection plan fee", views the generated addition log, in "<env>"

![Screenshot_at_Oct_30_10-37-59](/uploads/58c513c09ca7a0a145ccc9bce46249fb/Screenshot_at_Oct_30_10-37-59.png){width=726 height=238}
![Screenshot_at_Oct_30_10-38-37](/uploads/1ffba51a477202caaffc56ce4e1dd92a/Screenshot_at_Oct_30_10-38-37.png){width=1498 height=172}

> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Nsf Fee", views the generated addition log, in "<env>"

![Screenshot_at_Oct_30_10-25-32](/uploads/3a4d7a561d00a74745a7f9378530fdf5/Screenshot_at_Oct_30_10-25-32.png){width=958 height=624}
![Screenshot_at_Oct_30_10-28-00](/uploads/546865cffccc13a85a9428fde0561e8f/Screenshot_at_Oct_30_10-28-00.png){width=1510 height=61}
![Screenshot_at_Oct_30_10-28-35](/uploads/05fdad9db6c97ecf0a5283e559d0e1bd/Screenshot_at_Oct_30_10-28-35.png){width=1243 height=169}

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>

> ```gherkin
> ### Scenario Outline: User adds fee "Reinstatement Fee", views the generated addition log, in "<env>"

![Screenshot_at_Oct_30_10-29-28](/uploads/bd9758cfe0fd8207bd9a3d819bcc5e5c/Screenshot_at_Oct_30_10-29-28.png){width=1070 height=684}
![Screenshot_at_Oct_30_10-29-57](/uploads/2ac85bc13161c97b7c004387ead9c643/Screenshot_at_Oct_30_10-29-57.png){width=1580 height=381}

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Manual Fee", views the generated addition log, in "<env>"

![Screenshot_at_Oct_30_10-23-30](/uploads/ce9ad34c62e9db5b80d3641cb41ba7db/Screenshot_at_Oct_30_10-23-30.png){width=1071 height=645}
![Screenshot_at_Oct_30_10-24-53](/uploads/a48e2d1d3eb948517be1ede5f46de2ae/Screenshot_at_Oct_30_10-24-53.png){width=1907 height=536}

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: User adds fee "Misc Fee", views the generated addition log, in "<env>"

![Screenshot_at_Oct_30_10-31-06](/uploads/e14d7af4412f4e529c249a72a9d35cb9/Screenshot_at_Oct_30_10-31-06.png){width=729 height=238}
![Screenshot_at_Oct_30_10-31-37](/uploads/cd2f9098d8cc05078e43aba50829a573/Screenshot_at_Oct_30_10-31-37.png){width=1451 height=169}

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: The user edited the created fee and views the edit log generated in "<env>"

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: The user waived the created fee and views the generated edit log in "<env>"

>
> | PASS | LeadPk:14253 | AccountPk:11075 | Merchant:Progress Mobility | 
> ```
>
>

>

>