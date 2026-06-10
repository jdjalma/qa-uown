-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1065

UOWN | Origination | Frontend Not Displaying All Invoices Correctly After Lease Modifications
Aberto
  Tíquete criado 1 mês atrás por Yuri Araujo
BUG
In the Origination Portal, when creating a lead and an invoice, and setting the lease to Funded, modifying the lease generates a new invoice as expected. However, when repeating this process multiple times, the backend correctly returns all associated contracts (invoices), but the frontend does not display all of them properly, which may cause confusion and make contract management difficult.

FIX
Update the frontend to display all invoices returned by the backend, including previous contracts.
Each invoice displayed must also show its corresponding contract status (e.g., Funded, Cancelled, etc.).
Invoices with a Cancelled status must not be editable.
Only the latest non-cancelled invoice should be editable.
Validate the behavior after multiple lease modifications to ensure the creation and display of invoices reflects the actual backend state.
Test invoice display and editing restrictions using both real and mock data to confirm expected behavior.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos Extraídos para QA (Checklist + rastreabilidade)
1. Exibição Completa de Invoices/Contracts
Requisito: Todos os invoices (contratos) associados ao lead devem ser exibidos na interface, conforme retornados pelo backend.

Fonte: Descrição do bug, prints UI (primeira imagem), diff de código (customerStore.contracts sempre ordenados e iterados na tela).
Validação: A contagem e os dados dos invoices exibidos na UI devem bater exatamente com o que vem da resposta /uown/los/getContracts/{leadPk}.


2. Exibição do Status do Contrato em Cada Invoice
Requisito: Cada invoice deve exibir seu contractStatus (ex: Funded, Cancelled, etc.).

Fonte: Tarefa ("Each invoice displayed must also show its corresponding contract status"), diff do componente DocumentsItem (props: subtitle2), print UI mostra coluna "LEASE_MOD"/"LEASE".
Validação: O status do contrato aparece visível e legível ao lado do número do contrato na UI, igual ao valor retornado pelo backend.


3. Invoice Cancelled Não Editável
Requisito: Invoices com status Cancelled devem NÃO ser editáveis (botão/modal desabilitado).

Fonte: Tarefa, lógica no código (disabled={contractInfo.contractStatus === 'CANCELLED'}).
Validação: Ao tentar abrir/editar uma invoice cancelada, UI bloqueia ação (botão/click desabilitado). Visual pode mudar (cinza/desabilitado).


4. Apenas o Último Invoice Não Cancelado é Editável
Requisito: Só o último contrato não cancelado permite edição.
Fonte: Tarefa, diff no click (setIsFormDisabled(index > 0)), contratos sempre ordenados do mais novo para o mais antigo.

Validação:
Dado uma lista de contratos: apenas o primeiro item não cancelado tem botão/modal de edição habilitado.
Os demais estão bloqueados/desabilitados.
Se todos forem cancelados, nenhum pode ser editado.


5. Logs de Data Change
Requisito: Cada modificação gera log do tipo DATA_CHANGE detalhando o contrato/invoice adicionado ou atualizado.

Fonte: Segunda imagem (logs), ADDED: Contract, UPDATED: Invoice.
Validação: Logs devem refletir cada invoice exibida, com as propriedades corretas (número, tipo, status, valores).


6. Teste de Fluxo Completo com Várias Modificações
Requisito: Múltiplas modificações do lease devem resultar em múltiplos invoices/contratos exibidos (sem sumir).

Fonte: Tarefa, prints.
Validação: Repetir criar/modificar lease, validar que nunca "some" contrato da UI.

8. Responsividade e UX
Requisito: Exibição dos contratos/invoices (título, status, timestamp) é correta em mobile e desktop.

Fonte: Diff (DocumentItemMobile/DocumentItemDesktop, styles).
Validação: Conferir truncamento, legibilidade e disposição dos elementos na UI em diferentes tamanhos de tela.

-----

* Exibir todos os invoices/contratos retornados pelo backend
O frontend deve exibir todos os invoices associados, inclusive contratos anteriores/modificados, conforme retornados pela API.
PASS
Não é exibido status quando o invoice e criado porque não existe um status para isso

* Exibir o status do contrato para cada invoice
Cada invoice exibida deve mostrar seu status correspondente (exemplo: Funded, Cancelled, etc.).
ERROR - Quando o lease e criado via api o status do contrato não é exibido

* Invoices com status Cancelled não devem ser editáveis
Caso o status seja "Cancelled", não deve ser possível editar o invoice na interface.
PASS - 13000 e 13002

* Apenas o último invoice não cancelado pode ser editado
Só o contrato mais recente que não está cancelado pode ser editado na UI.
ERROR - 12997 - 13008 - 13010
ERROR - Ao modificar um invoice de lease assinado é gerado um invoice modificado porém o anterior sem mantem editavel

* Validar comportamento após múltiplas modificações do lease
Após modificar o lease várias vezes (gerando múltiplos invoices), deve ser validado que todos aparecem corretamente, de acordo com o backend.
PASS'

status e data somente quando signed
todos invoices devem ser exibidos

-----

| # | Requisito                                               | Evidência/Origem    | Cobertura no Código/Prints                               |
| - | ------------------------------------------------------- | ------------------- | -------------------------------------------------------- |
| 1 | Exibir todos invoices conforme backend                  | Task, Print 1, Diff | Iteração sobre `customerStore.contracts`                 |
| 2 | Mostrar status do contrato em cada linha                | Task, Print 1       | Prop `subtitle2`, `contractStatus`                       |
| 3 | Invoice Cancelled não editável                          | Task, Diff          | `disabled={contractInfo.contractStatus === 'CANCELLED'}` |
| 4 | Só o último não cancelado pode editar                   | Task, Diff          | `setIsFormDisabled(index > 0)`                           |
| 5 | Log detalhado por modificação                           | Print 2, Task       | Tabela de logs `DATA_CHANGE`                             |
| 6 | Múltiplas modificações geram múltiplos invoices         | Task, Print 2       | Repetição do fluxo na UI                                 |
| 7 | Mock API retorna contratos diversos, UI respeita regras | Task                | Teste com intercept/mock                                 |
| 8 | Responsividade: layout ok em mobile/desktop             | Diff, Task          | Classes, truncamento, icons                              |

-----


Funcionalidade: Exibição de contratos (Lease) na Origination com data e hora de criação

  Cenário: Exibir contrato corretamente após criação
    Dado que um novo contrato foi criado para o lead
    Quando acesso a tela Origination do cliente
    Então o contrato é exibido na seção Lease
    E o número do contrato é mostrado corretamente
    E o tipo de contrato (ex: LEASE) aparece corretamente
    E o status do contrato (ex: SIGNED) aparece corretamente
    E a data e hora de criação são exibidas no formato "dd/MM/yyyy h:mm:ss a.m./p.m. EST"
    E a data e hora correspondem ao valor retornado pela API

  Cenário: Exibir múltiplos contratos em ordem decrescente de criação
    Dado que existem dois ou mais contratos criados em momentos diferentes para o mesmo lead
    Quando acesso a tela Origination do cliente
    Então todos os contratos são exibidos na seção Lease
    E os contratos aparecem ordenados da data/hora mais recente para a mais antiga

  Cenário: Validar precisão da data e hora exibidas
    Dado que um contrato foi criado às "08/06/2025 8:58:30 a.m. EST"
    Quando visualizo a seção Lease
    Então a data e hora exibidas para o contrato são exatamente "08/06/2025 8:58:30 a.m. EST"

  Cenário: Data/hora devem ser coerentes com o log de modificação
    Dado que um contrato aparece na seção Lease
    Quando verifico os logs de DATA_CHANGE correspondentes àquele contrato
    Então o timestamp do log de criação deve ser igual ao exibido na interface

Funcionalidade: Gestão e exibição de contratos (invoices) na tela Origination


  Cenário: Exibir o status correto para cada contrato
    Dado que cada contrato no backend possui um campo contractStatus (por exemplo: "Funded", "Cancelled", "Signed")
    Quando acesso a seção Lease do cliente
    Então o status exibido ao lado de cada contrato corresponde ao valor de contractStatus do backend
    E o status deve ser legível e visível na interface

  Cenário: Contratos com status Cancelled não podem ser editados
    Dado que há contratos com status igual a "Cancelled"
    Quando visualizo a seção Lease
    Então a opção de editar está desabilitada para esses contratos
    E qualquer tentativa de abrir o modal de edição para contratos cancelados deve ser bloqueada

  Cenário: Apenas o contrato mais recente e não cancelado pode ser editado
    Dado que existem múltiplos contratos para o lead, ordenados do mais novo ao mais antigo
    Quando visualizo a seção Lease
    Então somente o contrato mais recente com status diferente de "Cancelled" possui botão/modal de edição habilitado
    E todos os demais contratos (incluindo cancelados e não cancelados mais antigos) não podem ser editados

  Cenário: Logs DATA_CHANGE refletem as modificações de contratos exibidos
    Dado que foram feitas modificações gerando contratos/invoices adicionais para o lead
    Quando acesso o log do cliente
    Então para cada contrato exibido na interface há um registro DATA_CHANGE correspondente no log
    E o log detalha corretamente o número, tipo, status e valores do contrato/invoice

  Cenário: Múltiplas modificações no lease geram múltiplos contratos visíveis
    Dado que o lease do lead foi modificado várias vezes, gerando vários contratos/invoices no backend
    Quando acesso a tela Origination
    Então todos os contratos/invoices gerados estão visíveis na interface, sem desaparecer nenhum após modificações subsequentes




-----

* Exibir todos os invoices/contratos retornados pelo backend
O frontend deve exibir todos os invoices associados, inclusive contratos anteriores/modificados, conforme retornados pela API.
PASS
Não é exibido status quando o invoice e criado porque não existe um status para isso

* Exibir o status do contrato para cada invoice
Cada invoice exibida deve mostrar seu status correspondente (exemplo: Funded, Cancelled, etc.).
ERROR - Quando o lease e criado via api o status do contrato não é exibido

* Invoices com status Cancelled não devem ser editáveis
Caso o status seja "Cancelled", não deve ser possível editar o invoice na interface.
PASS - 13000 e 13002

* Apenas o último invoice não cancelado pode ser editado
Só o contrato mais recente que não está cancelado pode ser editado na UI.
ERROR - 12997 - 13008 - 13010
ERROR - Ao modificar um invoice de lease assinado é gerado um invoice modificado porém o anterior sem mantem editavel

* Validar comportamento após múltiplas modificações do lease
Após modificar o lease várias vezes (gerando múltiplos invoices), deve ser validado que todos aparecem corretamente, de acordo com o backend.
PASS'

status e data somente quando signed
todos invoices devem ser exibidos
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


SENT - contrato gerado 12998 - 
SIGNED = Termina com sucesso o processo de assinatura - LEASE SIGNED - 12996 - Exibe data e hora da assinatura
LEASE_MOD - Lease assinado, modify lease adicionando item - 12997
CANCELLED - Cancelando um invoice de um lease funded via modify lease - 13000 e 13002
ERROR - 13009

status e data somente quando signed
todos invoices devem ser exibidos


> ## Tests in qa2
> ```gherkin
> Only the latest non-cancelled invoice should be editable.
> | ERROR | LeadPk 12997 and 13008 | Progress Mobility  | 
>When modifying a signed lease invoice, a modified invoice is generated, but the previous one remains editable.
> ```


Feature: Invoice Editing
  Scenario: Edit only the latest non-cancelled invoice
    Given there is a latest non-cancelled invoice
    And there are older invoices
    When the user attempts to edit the latest invoice
    Then only the latest non-cancelled invoice is editable
    And older invoices are not editable

Feature: Edição de Invoice
  Scenario: Permitid edição somente o invoice mais recente não cancelado
    Given existe um invoice mais recente não cancelado
    And existem invoices mais antigos
    When o usuário tenta editar o invoice mais recente
    Then somente o invoice mais recente não cancelado é editável
    And invoices mais antigos não são editáveis

> ## Tests in qa2
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Edit only the latest non-cancelled invoice
>Given there is a latest non-cancelled invoice
>And there are older invoices
>When the user attempts to edit the latest invoice
>Then only the latest non-cancelled invoice is editable
>And older invoices are not editable
> | ERROR | LeadPk 12997 and 13008 | Progress Mobility  | 
>When modifying a signed lease invoice, a modified invoice is generated, but the previous one remains editable.
> ```
>

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



tenho que criar um comando que altera o invoice.
Deve pegar o primeiro invoice da lista
vamos dividir em mais metodos e passar parametros true ou false pra informar se vamos usar os metodos que preenchem os campos e passamos o que será preenchido no passo que usa o metodo.
comentarios e prints em ingles

DealerInfo:
<div class="h-100 customer-lease-modal_settleLeaseForm__header__vVeMy"><div class="px-3 py-2 customer-lease-modal_settleLeaseForm__title__wUpzs">Dealer Info</div><div class="p-3"><div>Progress Mobility Acquisition LLC OL90294-0001</div><div class="mt-2">Newportt, AL</div><div class="mt-4 row"><div class="col-12 col-lg-6"><div class=""><label for="salesPerson" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Sales Person Name</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="salesPerson" name="salesPerson" placeholder="Sales Person Name" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div></div></div><div class="col-12 col-lg-6"><div class=""><label for="invoiceNumber" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Invoice #</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="invoiceNumber" name="invoiceNumber" placeholder="Invoice #" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="R79741"></div></div></div></div></div></div><div class="d-flex flex-row align-items-center justify-content-between mt-4 customer-lease-modal_settleLeaseForm__delivery__P1mId"><div class="customer-lease-modal_settleLeaseForm__deliveryTitle__tJbId">Estimated Pick Up or Delivery Date</div><div class="customer-lease-modal_settleLeaseForm__dateInput__r_r14"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="position-relative w-100"><input id="estimatedDeliveryDay" name="estimatedDeliveryDay" placeholder="MM/DD/YYYY" autocomplete="off" disabled="" maxlength="10" type="search" class="w-100 index-module_formikInput__0-IuM form-control" value="08/07/2025"></div></div></div></div></div></div></div></div>
captura merchant e valida se esta correto
<div class="px-3 py-2 customer-lease-modal_settleLeaseForm__title__wUpzs">Dealer Info</div>
cidade e estado 
<div class="mt-2">Newportt, AL</div>
Sales Person Name
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="salesPerson" name="salesPerson" placeholder="Sales Person Name" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div>
Invoice #
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="invoiceNumber" name="invoiceNumber" placeholder="Invoice #" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="R79741"></div></div></div>
Estimated Pick Up or Delivery Date(Somente leitura)
id="estimatedDeliveryDay"
Entao vamos criar um metodo para essa parte e quando passar true para DealerInfo chamamos esse metodo que irá validar o merchant e preencher os campos sales person name e invoice

Shipping Info:
<div class="h-auto mt-3 mt-lg-0 col-12 col-lg-6 col-xl-4"><div class="h-100 customer-lease-modal_settleLeaseForm__header__vVeMy"><div class="px-3 py-2 customer-lease-modal_settleLeaseForm__title__wUpzs">Shipping Info</div><div class="p-3"><div class="row"><div class="col-12 col-lg-6"><div class=""><label for="customerName" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Customer Name</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerName" name="customerName" placeholder="Customer Name" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="Testfzpue Testerbipxy"></div></div></div></div></div><div class="col-12 col-lg-6"><div class=""><label for="customerPhoneNumber" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Phone Number</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerPhoneNumber" name="customerPhoneNumber" placeholder="Phone Number" maxlength="14" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="(653) 233-0812"></div></div></div></div></div></div><div class="mt-4 customer-lease-modal_settleLeaseForm__formInput__A9lLQ row"><div class="col"><div class=""><label for="customerAddress" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Address</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerAddress" name="customerAddress" placeholder="Address" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="960 Test Street"></div></div></div></div></div></div><div class="mt-4 customer-lease-modal_settleLeaseForm__formInput__A9lLQ row"><div class="col-12 col-lg-6"><div class=""><label for="customerCity" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>City</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerCity" name="customerCity" placeholder="City" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="Albany"></div></div></div></div></div><div class="customer-lease-modal_settleLeaseForm__formInput__A9lLQ col-12 col-lg-3"><div class=""><label for="customerState" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>State</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerState" name="customerState" placeholder="State" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="NY"></div></div></div></div></div><div class="customer-lease-modal_settleLeaseForm__formInput__A9lLQ col-12 col-lg-3"><div class=""><label for="customerZipCode" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Zip Code</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerZipCode" name="customerZipCode" placeholder="Zip Code" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="12201"></div></div></div></div></div></div></div></div></div>
Customer Name
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerName" name="customerName" placeholder="Customer Name" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="Testfzpue Testerbipxy"></div></div></div>
Phone Number
id="customerPhoneNumber"
Address
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerAddress" name="customerAddress" placeholder="Address" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="960 Test Street"></div></div></div>
city
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="customerCity" name="customerCity" placeholder="City" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value="Albany"></div></div></div>
state
id="customerState"
zipcode
id="customerZipCode"
Mesmo esquema quando chamar no metodo ShippingInfo true usa esse metodo que preenche os campos conforme os dados do passo.

items
<div class="mt-2 row"><div class="col"><div class="sc-dlVxhl gkLEyw"><div class="sc-fKVqWL bonYBm"><div class="sc-bdvvtL ijnTNp rdt_Table" role="table"><div class="sc-gsDKAQ jSva-Dv rdt_TableHead" role="rowgroup"><div class="sc-dkPtRN cpjJTk rdt_TableHeadRow" role="row"><div data-column-id="1" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw kNyPBB egRZuM rdt_TableCol" width="100px"><div data-column-id="1" data-sort-id="1" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="1" class="sc-egiyK bigAlm">Qty</div></div></div><div data-column-id="2" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="2" data-sort-id="2" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="2" class="sc-egiyK bigAlm">Category</div></div></div><div data-column-id="3" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="3" data-sort-id="3" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="3" class="sc-egiyK bigAlm">Model #</div></div></div><div data-column-id="4" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw geiFfZ egRZuM rdt_TableCol" width="180px"><div data-column-id="4" data-sort-id="4" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="4" class="sc-egiyK bigAlm">Item Serial Number</div></div></div><div data-column-id="5" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw ebldNR egRZuM rdt_TableCol" width="150px"><div data-column-id="5" data-sort-id="5" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="5" class="sc-egiyK bigAlm">Description</div></div></div><div data-column-id="6" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="6" data-sort-id="6" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="6" class="sc-egiyK bigAlm">Price</div></div></div><div data-column-id="7" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="7" data-sort-id="7" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="7" class="sc-egiyK bigAlm">Total</div></div></div><div data-column-id="8" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw cXakXZ egRZuM rdt_TableCol" width="170px"><div data-column-id="8" data-sort-id="8" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="8" class="sc-egiyK bigAlm">Status</div></div></div><div data-column-id="9" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw ebldNR egRZuM rdt_TableCol" width="150px"><div data-column-id="9" data-sort-id="9" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="9" class="sc-egiyK bigAlm">Qty Delivered</div></div></div><div data-column-id="10" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw hTrFcp egRZuM rdt_TableCol" width="230px"><div data-column-id="10" data-sort-id="10" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="10" class="sc-egiyK bigAlm">Deliver Date</div></div></div></div></div><div class="sc-hGPBjI GGDov rdt_TableBody" role="rowgroup"><div id="row-0" role="row" class="sc-jrQzAO bYBrps rdt_TableRow"><div id="cell-1-undefined" data-column-id="1" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz kNyPBB dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="100px"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">1</div></div></div></div><div id="cell-2-undefined" data-column-id="2" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh ldeolY rdt_TableCell" data-tag="allowRowEvents"><div data-tag="allowRowEvents"></div></div><div id="cell-3-undefined" data-column-id="3" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">A333SKU4444</div></div></div></div><div id="cell-4-undefined" data-column-id="4" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz geiFfZ dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="180px"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">M68484397</div></div></div></div><div id="cell-5-undefined" data-column-id="5" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz ebldNR dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="150px"><div class="text-break"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">Seating:Recliner</div></div></div></div></div><div id="cell-6-undefined" data-column-id="6" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">$900.00</div></div></div></div><div id="cell-7-undefined" data-column-id="7" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_regularFont__7ZTjm">$900.00</div></div></div></div><div id="cell-8-undefined" data-column-id="8" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz cXakXZ dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="170px"><div>ADDED_TO_CART</div></div><div id="cell-9-undefined" data-column-id="9" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz ebldNR dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="150px"><div><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="numberOfItemsDelivered|26415" name="numberOfItemsDelivered|26415" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div></div></div></div><div id="cell-10-undefined" data-column-id="10" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz hTrFcp dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="230px"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="position-relative w-100"><input id="itemDeliveryDate|26415" name="itemDeliveryDate|26415" placeholder="MM/DD/YYYY" autocomplete="off" maxlength="10" type="search" class="w-100 index-module_formikInput__0-IuM form-control" value="08/07/2025"></div></div></div></div></div></div></div></div></div></div></div></div>
<div class="d-flex justify-content-end row"><div class="col-12 col-lg-3"><div class="mt-2 text-right customer-lease-modal_settleLeaseForm__subtotal__OsCSf">Merchandise Total: $900.00</div><div class="mt-2"><label for="deliveryFee" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Delivery Fee</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="deliveryFee" name="deliveryFee" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" value="$57.00"></div></div></div><div class="mt-3"><label for="installationFee" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Installation Fee</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="installationFee" name="installationFee" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" value="$107.00"></div></div></div><div class="mt-3"><label for="miscFee" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Misc. Fee</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="miscFee" name="miscFee" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" value="$333.00"></div></div></div><div class="mt-3"><label for="downPayment" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Down Payment</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="downPayment" name="downPayment" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" disabled="" value="$0.00"></div></div></div><div class="mt-3"><label for="salesTax" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Sales Tax</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="salesTax" name="salesTax" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" value="$0.00"></div></div></div><div class="mt-3"><label for="discountAmount" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP index-module_inputLabel__key12px__YqgNi col col-form-label"><div>Discount</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="discountAmount" name="discountAmount" class="form-control index-module_formikInput__0-IuM index-module_formikInput__textRight__yfvSg" placeholder="$0.00" value="$0.00"></div></div></div><div class="mt-3 customer-lease-modal_settleLeaseForm__subtotal__OsCSf row"><div class="col-2">Total:</div><div class="text-right col-10">$1,397.00</div></div></div></div>
Adicionar Item
<div class="sc-bdvvtL ijnTNp rdt_Table" role="table"><div class="sc-gsDKAQ jSva-Dv rdt_TableHead" role="rowgroup"><div class="sc-dkPtRN cpjJTk rdt_TableHeadRow" role="row"><div data-column-id="1" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw kNyPBB egRZuM rdt_TableCol" width="100px"><div data-column-id="1" data-sort-id="1" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="1" class="sc-egiyK bigAlm">Qty</div></div></div><div data-column-id="2" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="2" data-sort-id="2" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="2" class="sc-egiyK bigAlm">Model #</div></div></div><div data-column-id="3" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="3" data-sort-id="3" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="3" class="sc-egiyK bigAlm">Description</div></div></div><div data-column-id="4" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="4" data-sort-id="4" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="4" class="sc-egiyK bigAlm">Price</div></div></div><div data-column-id="5" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"><div data-column-id="5" data-sort-id="5" role="columnheader" tabindex="0" class="sc-crHmcD kIAgbB rdt_TableCol_Sortable" disabled=""><div data-column-id="5" class="sc-egiyK bigAlm">Total</div></div></div><div data-column-id="6" class="sc-hKwDye sc-eCImPb sc-iqseJM iwYqGw LiYFh egRZuM rdt_TableCol"></div></div></div><div class="sc-hGPBjI GGDov rdt_TableBody" role="rowgroup"><div id="row-0" role="row" class="sc-jrQzAO bYBrps rdt_TableRow"><div id="cell-1-undefined" data-column-id="1" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz kNyPBB dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="100px"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="numberOfItems" name="numberOfItems" min="0" type="number" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div></div></div><div id="cell-2-undefined" data-column-id="2" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="itemCode" name="itemCode" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div></div></div><div id="cell-3-undefined" data-column-id="3" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><input id="itemDescription" name="itemDescription" type="text" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control" value=""></div></div></div></div></div><div id="cell-4-undefined" data-column-id="4" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><input type="text" inputmode="decimal" id="basePricePerItem" name="basePricePerItem" class="form-control index-module_formikInput__0-IuM" placeholder="$0.00" value="$0.00"></div></div></div></div><div id="cell-5-undefined" data-column-id="5" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div class="font-family-gotham-bold"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_boldFont__R-JxG">$0.00</div></div></div></div></div><div id="cell-6-undefined" data-column-id="6" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz LiYFh dJQyWb rdt_TableCell" data-tag="allowRowEvents"><div><button type="submit" disabled="" class="submit-button btn btn-secondary disabled">ADD</button></div></div></div></div></div>
quantidade
id="cell-1-undefined"
modelo
id="cell-2-undefined"
descricao
id="cell-3-undefined"
Price
id="cell-4-undefined"
Total
id="cell-5-undefined"
adicionar
id="cell-6-undefined"
Editar Item
<div class="mx-2 utils_dataTableColumn__fontSize__T4rbs utils_dataTableColumn__cursorPointer__LNEx_" id="editActionIcon"><svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="pen" class="svg-inline--fa fa-pen " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M495 59.6C516.9 81.47 516.9 116.9 495 138.8L182.3 451.6C170.9 462.9 156.9 471.2 141.5 475.8L20.52 511.4C14.9 513 8.827 511.5 4.687 507.3C.5466 503.2-1.002 497.1 .6506 491.5L36.23 370.5C40.76 355.1 49.09 341.1 60.44 329.7L373.2 16.97C395.1-4.897 430.5-4.897 452.4 16.97L495 59.6zM341 94.4L417.6 170.1L472.4 116.2C481.8 106.8 481.8 91.6 472.4 82.23L429.8 39.6C420.4 30.23 405.2 30.23 395.8 39.6L341 94.4zM318.4 117L83.07 352.4C75.5 359.9 69.95 369.3 66.93 379.6L39.63 472.4L132.4 445.1C142.7 442.1 152.1 436.5 159.6 428.9L394.1 193.6L318.4 117z"></path></svg></div>
quantidade
id="items[0].itemInfo.numberOfItems"
modelo
id="items[0].itemInfo.itemCode"
item serial number
id="items[0].itemInfo.serialNumber"
Description
id="items[0].itemInfo.itemDescription"
Price
id="items.0.itemInfo.basePricePerItem"
Total
id="cell-7-undefined"
Status
id="cell-8-undefined"
salvar
id="saveActionIcon"
delivery Fee
id="deliveryFee"
instalation Fee
id="installationFee"
misc Fee
id="miscFee"
Down Payment
id="downPayment"
Sales Tax
id="salesTax"   
discount
id="discountAmount"
Total
<div class="text-right col-10">$1,397.00</div>

excluir item
id="deleteActionIcon"

save
<button type="submit" class="text-uppercase w-auto px-4 mx-1 index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Save</span></button>
cancel
<button type="submit" class="text-uppercase w-auto px-4 mx-1 index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><span class="px-2">Cancel</span></button>

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2
> ```gherkin
> Given Create test account with state <state> and merchant "<merchant>"
>
> ### Scenario: Displaying all invoices after lease modifications
> Given there is a latest non-cancelled invoice
> And there are older invoices
> When the user attempts to edit the latest invoice
> Then only the latest non-cancelled invoice is editable
> And older invoices are not editable
> Examples:
> | env | state | merchant         | browser | dealerInfo | shippingInfo | items | fees  | itemCount | itemCount | itemCount |
> | qa2 | CA    | ProgressMobility | chrome  | false      | false        | false | false | 1         | 1         | 1         |
> | PASS | LeadPk: 12997, 13008 and 13425 | Progress Mobility  | 
> ```
>
![Screenshot_3](/uploads/069fb37e962f17ab27dadf7523857954/Screenshot_3.png){width=252 height=123}
![Screenshot_4](/uploads/53982392bfac769cd434d8bd67aca227/Screenshot_4.png){width=1027 height=57}
>
>
![Screenshot_5](/uploads/18385d286494d93be7c5507b23918dd5/Screenshot_5.png){width=245 height=381}
![Screenshot_6](/uploads/ae09df7bfb773a1c85885ab1973e59e3/Screenshot_6.png){width=988 height=157}
>
>
![Screenshot_1](/uploads/310fea203375bf3ee72b2c8a7e93fccf/Screenshot_1.png){width=243 height=248}
![Screenshot_2](/uploads/a29e3883aa72f9142b331aea4b1ac90b/Screenshot_2.png){width=957 height=126}
>
>
>

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Pelos diffs que você colou, dá para ver que a refatoração separou os componentes de documentos em InvoiceItem e ContractItem, cada um com subtítulos específicos.

👉 No caso do ContractItem, os campos exibidos ficaram assim:
title → contractInfo?.contractNumber
subtitle1 → contractInfo?.contractType
subtitle2 → contractInfo?.contractStatus
timestamp → formattedTimestamp

Ou seja, o status que deve aparecer na tela é o valor de contractInfo.contractStatus, desde que não esteja cancelado.
Se o status for "CANCELLED", o item ficará desabilitado (e ainda por cima só o primeiro contrato, index === 0, fica habilitado para clique).

Resumindo:
O painel agora mostra: Número do contrato (title) + Tipo do contrato (subtitle1) + Status do contrato (subtitle2) + Data formatada (timestamp).
O status exibido é exatamente o valor do contractInfo.contractStatus, a menos que seja "CANCELLED", quando o botão fica desativado.

Pelo que vi do teu fluxo (GetApplicationStatus, assinatura de contrato, expiração, cancelamento), os status de contrato (contractInfo.contractStatus) que podem aparecer são algo nesta linha:
✅ Possíveis valores de contractStatus
PENDING → Contrato gerado, mas ainda não assinado.
SIGNED → Contrato assinado, válido, ainda dentro do prazo.
EXPIRED → Contrato já expirado (link de download inválido).
CANCELLED → Contrato cancelado (neste caso, o item fica desabilitado).
ACTIVE (ou APPROVED) → Contrato vigente, em andamento.
COMPLETED / PAID_OUT (se aplicável) → Contrato já quitado/encerrado.

🔎 Como aparece no painel após a refatoração
title → Número do contrato (contractNumber)
subtitle1 → Tipo do contrato (contractType, ex: Lease, Loan)
subtitle2 → Status do contrato (contractStatus)
timestamp → Data formatada do contrato

⚠️ Regra de habilitação:
O item fica desabilitado se contractStatus === "CANCELLED" ou se index !== 0 (somente o contrato mais recente fica clicável).
👉 Em resumo: o painel vai exibir o status que vier do backend (um dos listados acima), mas só permite interação com o primeiro contrato ativo/válido.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------