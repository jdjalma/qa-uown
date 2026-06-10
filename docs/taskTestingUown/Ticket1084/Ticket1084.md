--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1084

UOWN | Origination | Implement Separate Filter Panel for Origination Overview Dashboard

Synopsis
Restructure specifically the metrics dashboard located at the top of the Origination Overview page, replacing the individual dropdown filters with a dedicated filter panel. This panel will include specific and relevant fields to enhance usability and allow users to explore data more efficiently and accurately.

Business Objective
Enable internal users — especially the Merchant Support team — to obtain relevant and accurate metrics. This improvement aims to optimize the analysis process, support faster decision-making, and reduce manual rework such as data exports to Excel and pivot table creation.

Feature Request | Business Requirements
Context:
The current dashboard, located at the top of the Overview page, displays various key system indicators (tiles).
Each tile has an individual dropdown for selecting a time range (e.g., Today, This Week, This Month), but the current usage is not intuitive.

Goal:
Replace the individual dropdowns with a single filter button that opens a unified filter panel.
This panel must apply filters globally to all dashboard tiles.

Filter Panel Specifications:  
Accessed via a clearly visible button labeled “Filter” near the dashboard.
Filter fields to be included:
Date Range (from / to)
Merchant Name
Client Type
Location Name

Behavior Requirements:
When filters are applied, all dashboard tiles must update their data consistently.
The individual dropdowns from each tile must be removed.
Ensure that metric calculations remain accurate even when global filters are applied.
The new filters should not impact other sections of the page.

Technical Notes:
Current queries used by the tiles must be reviewed to ensure compatibility with the new filters.
Assess potential performance impacts when applying multiple filters simultaneously.
Ensure compatibility and testability in Sandbox, QA, and Staging environments.




UOWN | Originação | Implementar Painel de Filtros Separado para o Dashboard de Visão Geral de Originação

Sinopse
Reestruturar o dashboard de métricas localizado no topo da página de Visão Geral de Originação, 
substituindo os filtros individuais em formato de dropdown por um painel de filtros dedicado. Esse painel incluirá campos 
específicos e relevantes para melhorar a usabilidade e permitir que os usuários explorem os dados de forma mais eficiente e precisa.

Objetivo de Negócio:
Permitir que os usuários internos — especialmente a equipe de Suporte ao Comerciante — obtenham métricas relevantes e precisas. Essa melhoria visa 
otimizar o processo de análise, apoiar decisões mais rápidas e reduzir retrabalho manual, como exportações de dados para Excel e criação de tabelas dinâmicas.
Solicitação de Funcionalidade | Requisitos de Negócio

Contexto:
O dashboard atual, localizado no topo da página de Visão Geral, exibe vários indicadores-chave do sistema (tiles).
Cada tile possui um dropdown individual para selecionar o período (ex.: Hoje, Esta Semana, Este Mês), mas o uso atual não é intuitivo.

Meta:
Substituir os dropdowns individuais por um único botão de filtro que abra um painel de filtros unificado.
Esse painel deve aplicar filtros globalmente a todos os tiles do dashboard.

Especificações do Painel de Filtros:
Acesso por meio de um botão claramente visível, rotulado “Filtrar”, próximo ao dashboard.

Campos de filtro a serem incluídos:
Intervalo de Datas (de / até)
Nome do Comerciante
Tipo de Cliente
Nome da Localização

Requisitos de Comportamento:
Quando os filtros forem aplicados, todos os tiles do dashboard devem atualizar seus dados de forma consistente.
Os dropdowns individuais de cada tile devem ser removidos.
Garantir que os cálculos das métricas permaneçam corretos mesmo com filtros globais aplicados.
Os novos filtros não devem impactar outras seções da página.

Notas Técnicas:
As consultas (queries) atuais usadas pelos tiles devem ser revisadas para garantir compatibilidade com os novos filtros.
Avaliar possíveis impactos de desempenho ao aplicar múltiplos filtros simultaneamente.
Garantir compatibilidade e testabilidade nos ambientes Sandbox, QA e Staging.

-----

{
    "sqlName": "getApplicationMetricsApprovedAppCount",
    "sqlQuery": "SELECT\n    count(l)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR merchant.ref_merchant_code IN (\n                :merchantRefCodes\n            )\n    )\n    AND l.ref_app_id IS NULL\n    AND uw.uw_status = 'APPROVED'\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND uw.approval_amount > 0\n    AND (\n        l.row_created_timestamp BETWEEN :fromTime AND :toTime\n    )\n    AND (\n        l.lead_status NOT IN (\n            'CANCELLED_DUP_SSN', 'UW_DENIED', 'DENIED', 'CANCELLED_DUP_DENIAL'\n        )\n    )"
}
{
    "sqlName": "getApplicationMetricsApprovedOrDeniedLeads",
    "sqlQuery": "SELECT\n    count(l)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND l.ref_app_id IS NULL\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND (\n        uw.uw_status = 'APPROVED'\n            OR uw.uw_status = 'DENIED'\n    )\n    AND (\n        l.row_created_timestamp BETWEEN :fromTime AND :toTime\n    )\n    AND (\n        l.lead_status NOT IN (\n            'CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL'\n        )\n    )"
}
{
    "sqlName": "getApplicationMetricsAvgApprovalAmt",
    "sqlQuery": "SELECT\n    avg(uw.approval_amount)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND uw.uw_status = 'APPROVED'\n    AND uw.row_created_timestamp BETWEEN :fromTime AND :toTime\n    AND l.lead_status NOT IN (\n        'CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL'\n    )"
}
{
    "sqlName": "getApplicationMetricsExpiringApprovalAmt",
    "sqlQuery": "SELECT\n    sum(uw.approval_amount)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND l.lead_status IN (\n        'UW_APPROVED', 'CONTRACT_CREATED'\n    )\n    AND l.expiration_date BETWEEN CURRENT_DATE AND :toExpirationDate\n    AND l.row_created_timestamp BETWEEN :fromTime AND :toTime"
}
{
    "sqlName": "getApplicationMetricsLeadCount",
    "sqlQuery": "SELECT\n    count(l)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND l.ref_app_id IS NULL\n    AND l.row_created_timestamp BETWEEN :fromTime AND :toTime\n    AND l.lead_status NOT IN (\n        'CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL'\n    )"
}
{
    "sqlName": "getApplicationMetricsOpenApprovalAmt",
    "sqlQuery": "SELECT\n    sum(uw.approval_amount)\nFROM\n    uown_los_lead l\nJOIN uown_los_uwdata uw ON\n    uw.lead_pk = l.pk\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND uw.uw_status = 'APPROVED'\n    AND l.lead_status IN (\n        'UW_APPROVED', 'CONTRACT_CREATED'\n    )\n    AND l.row_created_timestamp BETWEEN :fromTime AND :toTime"
}
{
    "sqlName": "getApplicationMetricsSettledAndAboveLeadCount",
    "sqlQuery": "SELECT\n    COUNT(l)\nFROM\n    uown_los_lead l\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND l.lead_status IN (\n        'READY_TO_FUND', 'FUNDING', 'FUNDED'\n    )\n    AND l.row_created_timestamp BETWEEN :fromTime AND :toTime"
}
{
    "sqlName": "getApplicationMetricsSignedLeaseAmt",
    "sqlQuery": "SELECT\n    SUM(invoice.total_invoice_amount)\nFROM\n    uown_los_lead l\nJOIN uown_los_invoice invoice ON\n    l.pk = invoice.lead_pk\nJOIN uown_los_contract contract ON\n    l.pk = contract.lead_pk\n    AND contract_type = 'LEASE'\nJOIN uown_merchant merchant ON\n    l.merchant_pk = merchant.pk\nWHERE\n    (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND contract.contract_status = 'SIGNED'\n    AND l.row_created_timestamp BETWEEN :fromTime AND :toTime"
}
{
    "sqlName": "getApplicationMetricsTotalFundedAmt",
    "sqlQuery": "SELECT\n    SUM(funding_transaction.amount_to_be_funded)\nFROM\n    uown_funding_transaction funding_transaction\nJOIN uown_merchant merchant ON\n    funding_transaction.merchant_pk = merchant.pk\nWHERE\n    funding_transaction.funding_queue_status = 'FUNDED'\n    AND funding_transaction.status = 'ACTIVE'\n    AND funding_transaction.fund_date_time BETWEEN :fromTime AND :toTime\n    AND (:merchantName = '' OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n    AND (:locationName = '' OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n    AND (:clientType = '' OR merchant.client_type LIKE CONCAT('%', :clientType, '%'))\n    AND (\n        :noMerchantCode = TRUE\n            OR (\n                merchant.ref_merchant_code IN (\n                    :merchantRefCodes\n                )\n            )\n    )"
}

-----

Tests Steps
1 - Acessing the overview page, the fields fromDate and toDate must have the currentDate as default value.
2 - The frontend must send the first request automatically, without the user needs to click to search data.
3 - I needed to implement three filters in eight queries, you must check that even applying the new filters merchant, location, clientType, the queries still working as expected and bring the correctly results



Passos de Teste
Acesso à página de visão geral
    Ao acessar a página de Visão Geral, os campos fromDate e toDate devem ter, por padrão, o valor da data atual.
Requisição inicial automática
    O frontend deve enviar a primeira requisição automaticamente, sem que o usuário precise clicar para buscar os dados.
Verificação dos filtros nas consultas
    Foram implementados três filtros (comerciante, localidade, tipo de cliente) em oito queries.
    É necessário verificar que, mesmo ao aplicar os novos filtros merchant, location e clientType, as queries continuam funcionando corretamente e retornando os resultados corretos.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

url da pagina
https://origination-qa1.uownleasing.com/overview

filtros
<div style="padding: 0px 0.75rem; width: 100%;"><div class="w-100 mb-2 ml-0 align-end border p-3 bg-white row"><div class="w-100 d-flex index-module_filtersContainer__4RpjE align-items-end row"><div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="from" class="index-module_inputLabel__5ibOw col col-form-label"><div>From</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="position-relative w-100"><input id="from" name="from" placeholder="MM/DD/YYYY" autocomplete="off" maxlength="10" type="search" class="w-100 index-module_formikInput__0-IuM form-control" value="09/18/2025"></div></div></div></div></div><div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="to" class="index-module_inputLabel__5ibOw col col-form-label"><div>To</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="position-relative w-100"><input id="to" name="to" placeholder="MM/DD/YYYY" autocomplete="off" maxlength="10" type="search" class="w-100 index-module_formikInput__0-IuM form-control" value="09/18/2025"></div></div></div></div></div><div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="merchant" class="index-module_inputLabel__5ibOw col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchant"><span id="react-select-56-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-56-placeholder">Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-56-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-56-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div><div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="location" class="index-module_inputLabel__5ibOw col col-form-label"><div>location</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="location"><span id="react-select-57-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-57-placeholder">location</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-57-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-57-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div><div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="clientType" class="index-module_inputLabel__5ibOw col col-form-label"><div>Client Type</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="clientType"><span id="react-select-58-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-58-placeholder">Client Type</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-58-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-58-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div><div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div></div></div></div>

paineis com os valores
Applications
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">Applications</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">3</div></div></div>

Approval Rate
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">Approval Rate</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">100%</div></div></div>

Avg. Approval Amt.
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">Avg. Approval Amt.</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">$4,090.00</div></div></div>

$ Amt. of Open Apvl.
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">$ Amt. of Open Apvl.</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">$8,180.00</div></div></div>

$ Amt. of Funded TXN
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">$ Amt. of Funded TXN</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">$0.00</div></div></div>

$ Amt. of Approvals With Signed Leases
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">$ Amt. of Approvals With Signed Leases</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">$1,361.37</div></div></div>

$'s Approaching Expiry
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">$'s Approaching Expiry</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">$8,180.00</div></div></div>

Conversion Rate
<div class="mt-4 mt-xl-0 col-12 col-md-6 col-xl-3"><div class="d-flex flex-column justify-content-between h-100 p-2 overview-summary-box_summaryBox__gemQT"><div class="d-flex flex-row align-items-center overview-summary-box_summaryBox__body__rAqW1"><div class="mr-3">Conversion Rate</div></div><div class="overview-summary-box_summaryBox__value__vjnsc">33%</div></div></div>

-----

Preciso entender como é calculado cada valor nos paineis para analisar quais ações tenho que tomar para gerar dados para validar, exemplo, em Amt. of Approvals With Signed Leases so exibe de leases assinados entao nesse caso tenho que assinar leases

-----

O fluxo do teste é:
Acessar overvieww
Capturar os valores que são exibidos nos paineis de dados
Verificar se os valores da tela estão iguais aos valores do banco de dados(usar queries para consultar o banco)
Criar uma aplicação
Analisar os dados de:
    Applications(se aumentou)
Entao tenho que fazer isso para cada indice, ver a acao que tenho que fazer, realizar a acao e depois analisar o dado no painel.

-----



Quando a aplicação é criada e cancelada ou expirada o Applications se mantem porque a aplicação ja foi criada entao mesmo que cancele conta porque foi criado.


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

> ```gherkin
> When Log in to origination
> When Apply filters on "origination" page "overview" from "<firstFrom>" to "<firstTo>" with merchant "<merchantFilter>" location "<location>" and client type "<clientType>" and execute search if the following argument is yes: "yes"
> Then Db verify INT metric "approved_app_count" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify INT metric "approved_or_denied_leads" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify DECIMAL metric "avg_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify DECIMAL metric "expiring_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify DECIMAL metric "open_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify INT metric "settled_and_above_lead_count" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify DECIMAL metric "signed_lease_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Db verify DECIMAL metric "total_funded_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Validate Overview tile "Avg Approval Amt" equals DB DECIMAL metric "avg_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Validate Overview tile "Expiring Approval Amt" equals DB DECIMAL metric "expiring_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Validate Overview tile "Open Approval Amt" equals DB DECIMAL metric "open_approval_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Validate Overview tile "Signed Lease Amt" equals DB DECIMAL metric "signed_lease_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> Then Validate Overview tile "Total Funded Amt" equals DB DECIMAL metric "total_funded_amt" between "<firstFrom>" and "<firstTo>" with merchant "<merchantFilter>" location "<location>" client type "<clientType>" noMerchantCode "<noMerchantCode>" merchant codes "<merchantCodes>"
> And Test is successful
> 
> @UOWNQa1
> Examples:
> | env | merchantFilter | browser | location | clientType | firstFrom  | firstTo    | noMerchantCode | merchantCodes |
> | qa1 |                | chrome  |          |            | 09/19/2025 | 09/19/2025 | yes            |               |
> 
>> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>

>
>







> ## Tests in -

> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>

R7.25.1.44.0_ImplementSeparateFilterPanelForOriginationOverviewDashboard_Ticket1084

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
