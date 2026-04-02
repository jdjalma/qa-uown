--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/397

UOWN | Servicing | Daily TaxCloud Sync for (Successful Payments, Refunds, and Reversals)

Synopsis
Create a scheduled task that, every day, sends to TaxCloud all successful payments, refunds, and reversals made that day.
TaxCloud docs: https://docs.taxcloud.com/api-reference/api-reference/sales-tax-api/orders/create-order

Feature Request | Business Requirements
Implement a daily scheduled task.
Collect all successful payments, refunds, and reversals made that day.
Send the collected transactions to TaxCloud.
Ensure the task runs once per day and completes the transmission for that day’s transactions.

Verification Steps
All tests should be performed in servicing.
After the changes, two new sweeps were implemented, and a new table was introduced: TaxCloudOutbound.
A synchronization with taxForZip was also added, so the TaxCloud address and tax rate should be stored there as well.

General Validation
Confirm that every time the TaxCloud API is called (including the case in ticket #396), the data is saved in the TaxCloudOutbound table.
For carts endpoint (396 changes), the address and tax rate info should also be saved on the TaxForZip table.
It should also populate the TaxCloud table for the created payments sweep, but not for refunded.

- Sweep 1: DailyTaxCloudPaymentsSync
This sweep collects all payments created on the current day and sends their data to TaxCloud.  
It should only send one request per payment pk, so if there are multiples allocations for the same payment (processing fees, for example) 
they should be built in the LineItems object in the request. Confirm that by checking the request sent on the TaxCloudOutbound table.
To test:
* Make a payment in servicing.
* Run the query below to confirm the payment was captured:
    SELECT 
        usp.pk,
        usp.account_pk,
        usp.row_created_timestamp,
        usp.payment_date
    FROM uown_sv_payment usp
    WHERE usp.row_created_timestamp::date = CURRENT_DATE;
* Trigger the sweep via:
https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync


- Sweep 2: DailyTaxCloudRefundedsSync
This sweep processes refunds for existing TaxCloud orders.
To test:
* Return a payment.
* Verify it was captured with:
    SELECT usp.account_pk, 
        usp.reverse_date_timestamp,
        usp.reason,
        usa.account_pk || '_' || usa.payment_pk || '_' || usa.pk AS order_id
    FROM uown_sv_payment usp 
    JOIN uown_sv_allocation usa 
        ON usp.account_pk = usa.account_pk 
    WHERE usp.reverse_date_timestamp IS NOT NULL
    AND usp.reverse_date_timestamp::date = CURRENT_DATE;
* Check if the payment exists in uown_tax_cloud (required for refund):
    SELECT * 
    FROM uown_tax_cloud utc 
    WHERE utc.order_id ILIKE 'orderId';
* Trigger the sweep via:
https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudReturnsSync

-----

Título: UOWN | Servicing | Sincronização diária com TaxCloud para (Pagamentos bem-sucedidos, Reembolsos e Estornos)

Sinopse Criar uma tarefa agendada que, diariamente, envie ao TaxCloud todos os pagamentos bem-sucedidos, reembolsos e estornos realizados naquele dia. Documentação do TaxCloud: https://docs.taxcloud.com/api-reference/api-reference/sales-tax-api/orders/create-order

Requisitos de Negócio

Implementar uma tarefa agendada diária.
Coletar todos os pagamentos bem-sucedidos, reembolsos e estornos do dia corrente.
Enviar as transações coletadas ao TaxCloud.
Garantir que a tarefa execute uma vez por dia e conclua a transmissão das transações daquele dia.
Passos de Verificação

Todos os testes devem ser executados no serviço “servicing”.
Após as alterações, foram implementadas duas novas varreduras (sweeps) e criada uma nova tabela: TaxCloudOutbound.
Uma sincronização com taxForZip também foi adicionada, então o endereço do TaxCloud e a taxa de imposto devem ser armazenados lá também.
Validação Geral

Confirmar que toda vez que a API do TaxCloud for chamada (incluindo o caso do ticket #396), os dados sejam salvos na tabela TaxCloudOutbound.
Para o endpoint de carrinhos (mudanças do ticket 396), as informações de endereço e taxa de imposto também devem ser salvas na tabela TaxForZip.
Também deve popular a tabela TaxCloud para a varredura de pagamentos criados, mas não para os reembolsados.

- Sweep 1: DailyTaxCloudPaymentsSync
Esta varredura coleta todos os pagamentos criados no dia corrente e envia seus dados ao TaxCloud.
Deve enviar apenas uma requisição por payment_pk; se houver múltiplas alocações para o mesmo pagamento (por exemplo, taxas de processamento),
elas devem ser construídas no objeto LineItems do request. Confirme isso verificando a requisição salva na tabela TaxCloudOutbound.
Como testar:
* Realizar um pagamento no servicing.
* Executar a query abaixo para confirmar que o pagamento foi capturado:
    SELECT 
        usp.pk,
        usp.account_pk,
        usp.row_created_timestamp,
        usp.payment_date
    FROM uown_sv_payment usp
    WHERE usp.row_created_timestamp::date = CURRENT_DATE;
* Disparar a varredura via: https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync

- Sweep 2: DailyTaxCloudRefundedsSync
Esta varredura processa reembolsos (returns/refunds) para pedidos existentes no TaxCloud.
Como testar:
* Efetuar a devolução (return) de um pagamento.
* Verificar se foi capturado com:
    SELECT usp.account_pk, 
        usp.reverse_date_timestamp,
        usp.reason,
        usa.account_pk || '_' || usa.payment_pk || '_' || usa.pk AS order_id
    FROM uown_sv_payment usp 
    JOIN uown_sv_allocation usa 
    ON usp.account_pk = usa.account_pk 
    WHERE usp.reverse_date_timestamp IS NOT NULL
    AND usp.reverse_date_timestamp::date = CURRENT_DATE;    
* Checar se o pagamento existe em uown_tax_cloud (requisito para o reembolso):
    SELECT * 
    FROM uown_tax_cloud utc 
    WHERE utc.order_id ILIKE 'orderId';
* Disparar a varredura via: https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudReturnsSync

-----

Observações finais

Certifique-se de que todas as chamadas ao TaxCloud gravem um registro correspondente na tabela TaxCloudOutbound.
Para o endpoint de carrinho (ticket #396), o endereço e a taxa calculada devem ser persistidos na TaxForZip.
Para a varredura de pagamentos criados (Payments Sync), deve popular a tabela TaxCloud; para reembolsos (Refundeds Sync), não deve popular essa tabela

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Vamos criar um fluxo de teste para essa tarefa e testar os dois fluxos
Ja tenho o fluxo construido em 
legacy-project/ui_automation\src\test\resources\uownfeatures\templates\R7.25.1.44.0_DailyTaxCloudSyncForSuccessfulPaymentsRefundsAndReversals_Ticket397.feature
até a parte que faz o pagamento

Primeiro fluxo
Precisamos de um step para consultar o banco de dados
Executar a query abaixo para confirmar que o pagamento foi capturado:
    SELECT 
        usp.pk,
        usp.account_pk,
        usp.row_created_timestamp,
        usp.payment_date
    FROM uown_sv_payment usp
    WHERE usp.row_created_timestamp::date = CURRENT_DATE;
Precisamos de um step para disparar a api
Disparar a varredura via: https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync

Segundo fluxo trata de refund, temos que atender ao refund pacial e refund total
Botao para abrir modal para reversao e reembolso - <div id="cell-7-undefined" data-column-id="7" role="cell" class="sc-hKwDye sc-eCImPb sc-jRQBWg blEmWz bIeXmQ dJQyWb rdt_TableCell" data-tag="allowRowEvents" width="200px"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-rotate-left" class="svg-inline--fa fa-arrow-rotate-left cursor-pointer" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.86 0-95.19-15.58-134.2-44.86c-14.14-10.59-17-30.66-6.391-44.81c10.61-14.09 30.69-16.97 44.8-6.375c27.84 20.91 61 31.94 95.89 31.94C344.3 415.8 416 344.1 416 256s-71.67-159.8-159.8-159.8C205.9 96.22 158.6 120.3 128.6 160H192c17.67 0 32 14.31 32 32S209.7 224 192 224H48c-17.67 0-32-14.31-32-32V48c0-17.69 14.33-32 32-32s32 14.31 32 32v70.23C122.1 64.58 186.1 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"></path></svg></div> - <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-rotate-left" class="svg-inline--fa fa-arrow-rotate-left cursor-pointer" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.86 0-95.19-15.58-134.2-44.86c-14.14-10.59-17-30.66-6.391-44.81c10.61-14.09 30.69-16.97 44.8-6.375c27.84 20.91 61 31.94 95.89 31.94C344.3 415.8 416 344.1 416 256s-71.67-159.8-159.8-159.8C205.9 96.22 158.6 120.3 128.6 160H192c17.67 0 32 14.31 32 32S209.7 224 192 224H48c-17.67 0-32-14.31-32-32V48c0-17.69 14.33-32 32-32s32 14.31 32 32v70.23C122.1 64.58 186.1 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"></path></svg>
modal reverse refund payment - <div class="modal-content"><div class="index-module_border_bottom__-SbuX d-flex flex-row justify-content-between align-items-center w-100 p-3"><div class="index-module_font_bold__L13Kn index-module_font_24px__AGMET">Reverse / Reallocate Payment</div><div><svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="xmark-large" class="svg-inline--fa fa-xmark-large index-module_cursor_pointer__A1fry" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M420.7 36.69C426.9 30.44 437.1 30.44 443.3 36.69C449.6 42.93 449.6 53.06 443.3 59.31L246.6 256L443.3 452.7C449.6 458.9 449.6 469.1 443.3 475.3C437.1 481.6 426.9 481.6 420.7 475.3L224 278.6L27.31 475.3C21.07 481.6 10.94 481.6 4.686 475.3C-1.562 469.1-1.562 458.9 4.686 452.7L201.4 256L4.686 59.31C-1.562 53.07-1.562 42.94 4.686 36.69C10.93 30.44 21.06 30.44 27.31 36.69L224 233.4L420.7 36.69z"></path></svg></div></div><div class="overflow-auto p-3"><div class="mt-2 row"><div class="pop-up-form__key col-sm-4">Transaction Date</div><div class="pop-up-form__value col">09/20/2025</div></div><div class="mt-3 row"><div class="pop-up-form__key col-sm-4">Type</div><div class="pop-up-form__value col">CC</div></div><div class="mt-3 row"><div class="pop-up-form__key col-sm-4">Payment Amount</div><div class="pop-up-form__value col"><div class="d-flex flex-row flex-lg-column align-items-center justify-content-between"><div class="index-module_inputGroup__eRmEm index-module_inputGroup__sameLine__6ykF-"><div class="index-module_inputField__readOnly__BsDDX index-module_boldFont__R-JxG">$28.90</div></div></div></div></div><div class="mt-3 row"><div class="pop-up-form__key col-sm-4">Reverse Reason</div><div class="pop-up-form__value col"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="reverseReason"><span id="react-select-7-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Reverse</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div></div><form id="revertPaymentForm" class="mt-3"><div class="row form-group"><div class="pop-up-form__key col-sm-4">Comment</div><div class="pop-up-form__value col-sm-8"><div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="input-group"><textarea id="comment" name="comment" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control"></textarea></div></div></div></div></div></div></form></div><div class="d-flex justify-content-end p-3 index-module_modal__footer__fyqoK"><div><button type="button" class="index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><span class="px-2">CANCEL</span></button><button type="submit" form="paymentModal" class="ml-2 text-uppercase index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">SAVE</span></button></div></div></div>

Refund pacial
<div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="reverseReason"><span id="react-select-7-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Reverse</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div>
opcao refund pacial selecionada - <div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Partially Refund</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div>
quando clico em salvar dispara o endpoint - Request URL
https://svc-website-qa1.uownleasing.com/uown/svc/refundPayments?paymentPks=70195&comment=test&amount=678.9
Request Method
POST
Status Code
200 OK
Remote Address
35.225.69.210:443
Referrer Policy
strict-origin-when-cross-origin
payload - paymentPks
70195
comment
test
amount
678.9
response - {"failedRefunds":{}}

Refund total
<div class=""><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="reverseReason"><span id="react-select-7-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Reverse</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div>
opcao refund total selecionada - <div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">Fully Refund</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 0; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div>
quando clico em salvar dispara o endpoint - Request URL
https://svc-website-qa1.uownleasing.com/uown/svc/refundPayments?paymentPks=70207&comment=test
Request Method
POST
Status Code
200 OK
Remote Address
35.225.69.210:443
Referrer Policy
strict-origin-when-cross-origin
payload - paymentPks
70207
comment
test
response - {"failedRefunds":{}}

campo comentario obrigatorio de preenchimento - <textarea id="comment" name="comment" class="index-module_formikInput__0-IuM index-module_inputField__vx3j9 w-100 h-100 form-control font-family-gotham-bold color-black form-control"></textarea>
botao save - <button type="submit" form="paymentModal" class="ml-2 text-uppercase index-module_modal__btn__EeLpF index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">SAVE</span></button>

Para isso criei o fluxo legacy-project/ui_automation\src\test\resources\uownfeatures\templates\R7.25.1.44.0_DailyTaxCloudSyncForSuccessfulPaymentsRefundsAndReversals_Ticket397.feature
o fluxo vai ate fazer o pagamento e depois vai na tela de pagamentos entao so temos que adicionar mais alguns Passos

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.44.0_DailyTaxCloudSyncForSuccessfulPaymentsRefundsAndReversals_Ticket397

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

> ```gherkin
>
> ### Scenario Outline: Create a scheduled task that, every day, sends to TaxCloud all successful payments, refunds, and reversals made that day in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Check the account has been successfully created in origination
> And Transition to the contract URL
> And Complete application payment information, with validation if the following argument is yes: "no"
> And Check for contract created payment status, waiting a maximum of "60" seconds
> And Complete signing of the application
> And Navigate to the individual customer page
> And Get document status updated
> And Check the account status on customer page
> Then Check change to signed button is not visible
> Then Settle the new lease
> Then Navigate to the individual customer page and get the accountPk
> And Transfer to servicing main page
> And Log in to service portal
> And Open customer information
> Then Make a payment of type "cc" with payment date "<ccPaymentDate>" and payment amount "<ccPaymentAmount>"
> Then Db expect at least 1 rows for: uown_sv_payment where row_created_timestamp::date = current_date
> Then Trigger scheduled task via URL "/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync"
> And Navigate to Payments
> Then Open Reverse Payment modal for the latest
> Then Set reverse reason to "Partially Refund" in Reverse Payment modal
> Then Type refund comment "test"
> Then Enter refund amount equal to installment: "<ccPaymentAmount>" with comment "test" and submit
> Then Db expect at least 1 rows for: uown_sv_payment join uown_sv_allocation on account_pk = account_pk where reverse_date_timestamp IS NOT NULL and reverse_date_timestamp::date = current_date
> Then Db expect at least 1 rows for: uown_tax_cloud order by row_created_timestamp desc limit 1
> Then Trigger scheduled task via URL "/svc/triggerScheduledTask/dailyTaxCloudReturnsSync"
> And Test is successful
> 
> Examples:
> | env | state | merchant         |  ccPaymentDate | ccPaymentAmount | browser |
> | qa1 | NY    | ProgressMobility | 0             | 50.00         | chrome  |
>
> | PASS | LeadPk:9853 | AccountPk:4108 | Merchant:Progress Mobility | 
> ```
>
>

>
>


Fazer um pagamento ach manualmente
implementar full refund



