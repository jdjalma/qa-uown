------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/qa/fintech-playwright/-/issues/32

UOWN | Automation | Parameter Retention Test on Date Change

Develop an automated test flow to validate that parameter fields remain populated when changing search dates on screens with date and parameter 
    filters in the Origination and Servicing portals. The test should cover the listed screens, ensuring that parameter values ​​are retained after 
    changing dates.
Requirements:
1. Create an automated script to test parameter retention when changing search dates.
2. Apply the test to the following screens: 
    Origination: overview, leads, Funding, Funding Modification History, Modification Reports,
        Merchant Modification History, alerts, error log, new application, merchant, merchant settings, rebate 
    Servicing: Search 
    Website: No screens affected (n/a).
3. Simulate changing start and end dates on each screen with date and parameter search fields.
4. Verify that the parameter field contents are not cleared after changing dates.
5. Report failures if parameter field is cleared or changed improperly when changing dates.

-----

UOWN | Automação | Teste de Retenção de Parâmetros na Mudança de Data

Desenvolver um fluxo de teste automatizado para validar que os campos de parâmetros permanecem preenchidos ao alterar as datas de pesquisa em telas com filtros de data e parâmetros nos portais de Originação e Atendimento. O teste deve abranger as telas listadas, garantindo que os valores dos parâmetros sejam mantidos após a alteração das datas.
Requisitos:

1. Criar um script automatizado para testar a retenção de parâmetros ao mudar as datas de pesquisa.
2. Aplicar o teste às seguintes telas: Originação: visão geral, leads, Financiamento, Histórico de Modificação de Financiamento, Relatórios de Modificação, Histórico de Modificação de Comerciante, alertas, log de erros, nova aplicação, comerciante, configurações de comerciante, desconto Atendimento: Pesquisa Website: Nenhuma tela afetada (n/a).
3. Simular a alteração das datas de início e fim em cada tela com campos de pesquisa de data e parâmetros.
4. Verificar que o conteúdo dos campos de parâmetros não é apagado após a alteração das datas.
5. Reportar falhas se o campo de parâmetro for apagado ou alterado incorretamente ao mudar as datas.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Origination: 
    Overview, 
    Leads, 
    Funding, 
    Funding Modification History, 
    Modification Reports,
    Merchant Modification History, 
    Alerts, 
    Error log, 
    New application,
    Rebate 

Servicing: 
    Search 

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Origination: 
    Overview:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="fromDate"
        data final:id="toDate"
        search:id="search"
        search button:<div class="mt-md-2 mt-xl-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="mb-2 index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination: 
    Leads:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="from"
        data final:id="to"
        merchant:<div class="w-100 p-0 index-module_widthOverride__xWIFq col-md-4 col-lg-4 col-xl" style="max-width: 350px; min-width: 200px; max-height: 3.5rem;"><div class="w-100"><label for="merchantName" class="index-module_inputLabel__5ibOw col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchantName"><span id="react-select-5-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-5-placeholder">Search by Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-5-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-5-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>
        search button:<button type="submit" name="searchButton" class="w-100 mb-1 mt-6 index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button>

Origination: 
    Funding:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="startDate"
        data final:id="endDate"
        merchant:<div class="w-100 p-0 index-module_widthOverride__xWIFq col-md-4 col-lg-4 col-xl" style="max-width: 350px; min-width: 200px; max-height: 3.5rem;"><div class="mb-2"><label for="merchant" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchant"><span id="react-select-6-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-m7qcy3"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-6-placeholder">Please select</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-6-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-6-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>
        search button:<div class="mt-md-2 mt-xl-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="mb-2 index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination: 
    Funding Modification History:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        elemento chamado filters que abre os filtros para serem usados:
        data inicial:id="startDate"
        data final:id="endDate"
        new lead status:<div class="w-100 index-module_widthOverride__xWIFq index-module_widthOverride__xlScreen__01gZa col-md-4 col-lg-4 col-xl" style="max-width: 250px; min-width: 250px;"><div class="mb-1"><label for="newLeadStatus" class="index-module_inputLabel__5ibOw index-module_inputLabel__keyBold__zrUjP col col-form-label"><div>New Lead Status</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="newLeadStatus"><span id="react-select-15-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1hanuc0"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-15-placeholder">New Lead Status</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-15-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;" aria-describedby="react-select-15-placeholder"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>
        search button:<div class="mt-md-2 mt-xl-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination:
    Modification Reports:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="from"
        data final:id="to"
        merchant:<div class="w-100 index-module_widthOverride__xWIFq index-module_widthOverride__xlScreen__01gZa col-md-4 col-lg-4 col-xl" style="max-width: 400px;"><div class="w-100"><label for="merchantName" class="index-module_inputLabel__5ibOw col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchantName"><span id="react-select-12-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1f8glsz"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-12-placeholder">Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-12-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-12-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>
        search button:<div class="mt-md-2 mt-xl-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination:
    Merchant Modification History:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="from"
        data final:id="to"         
        merchant:<div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="merchantName" class="index-module_inputLabel__5ibOw col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchantName"><span id="react-select-15-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1f8glsz"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-15-placeholder">Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-15-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-15-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>
        search button:<div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>


Origination:
    Alerts:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="from"
        data final:id="to"
        search:id="message"
        search button:<div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination:
    Error log:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="from"
        data final:id="to"
        search:id="search"     
        search button:<div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination:
    New application:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="fromDate"
        data final:id="toDate"
        search:id="searchString"
        search button:<div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="mb-2 index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Origination:
    Rebate:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id="startDate"
        data final:id="endDate"
        merchant:<div class="w-100 index-module_widthOverride__xWIFq col-md-4 col-lg col-xl" style="max-width: 400px;"><div class="w-100"><label for="merchants" class="index-module_inputLabel__5ibOw col col-form-label"><div>Merchant</div></label><div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchants"><span id="react-select-21-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--is-multi css-1f8glsz"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-21-placeholder">Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-21-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" aria-describedby="react-select-21-placeholder" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div></div></div>                           
        search button:<div class="mt-md-2 mt-lg-0 index-module_searchButton__UKxwF"><button type="submit" name="searchButton" class="index-module_button__BzRcy index-module_button__primary__3u67v btn btn-primary"><span class="px-2">Search</span></button></div>

Servicing: 
    Search:
        elemento chamado filters que abre os filtros para serem usados:<button type="button" class="index-module_filterButton__Imptk index-module_button__BzRcy index-module_button__secondary__WaYOA btn btn-primary"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" class="svg-inline--fa fa-filter " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg><span class="px-2">Filters</span><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-up" class="svg-inline--fa fa-chevron-up index-module_rotate__lx9mW" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"></path></svg></button>
        data inicial:id=id="from"
        data final:id="to"
        Last 4 CC digits:id="last4CC"
        search button:

------------------------------------------------------------------------------------------------------------------------------------------------------------------

data padrão para busca: 12 meses

-----

Onde o fluxo unificado será interrompido e começa o fluxo de buscas?
--> And Ensure quick search works
    Para na em servicing após buscar um registro.
    Encaminhar novamente para Origination
        returnToOriginalTab

-----

Existe um metodo para levar para as paginas? porque terei que navegar para várias páginas.

Origination:
    Overview:
        public void navigateToOverview()
        public void overview() 
    Leads: 
    Funding:
        public void goToFundingQueue() 
    Funding Modification History:
    Modification Reports:
    Merchant Modification History:
    Alerts:
    Error log:
    New application:
    Rebate:
Servicing: 
    Search:
        public void toSearchPage()


-----

funcao para realizar a busca



------------------------------------------------------------------------------------------------------------------------------------------------------------------
