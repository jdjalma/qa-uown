--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1117

UOWN | Origination | Client Type Edit Does Not Update Username and API Key


BUG
On the Merchant page, when creating a new Merchant and selecting a Client Type (e.g., V1_UOWN), the Merchant is saved correctly.
However, when re-entering the Merchant and editing the Client Type, the fields Username and API Key are not updated automatically as expected.
    When cloning a Merchant, the behavior works correctly (Username and API Key are updated).
    The issue occurs only when creating a Merchant and then editing the Client Type afterward.


FIX
Investigate why Username and API Key are not being updated automatically when the Client Type is edited on an already created Merchant.
      Correct the behavior to ensure Username and API Key are refreshed/updated whenever the Client Type is changed.
      Maintain consistency with the behavior observed during Merchant cloning.
      Add test coverage to validate the fix (both creation/edit and cloning flows).


Steps-to-Reproduce
    Create a new Merchant.
    Enter any valid Client Type.
    Complete the Merchant creation and save.
    Reopen this same Merchant.
    Edit the Client Type field to a different value and save.
    Reopen the Merchant and verify the Username and API Key fields.

Expected Result: Username and API Key should be automatically updated to match the new Client Type.
Actual Result: Username and API Key remain unchanged.


Test-Steps:
Navigate to the merchant details page
When you change the client type, the fields merchantUrl, username, apiKey, must be sent empty to the api.
Reload the page and you must be able to see the fields populated by the API with the corrects values
This scenario must happen when cloning a merchant and updating an existing one

-----

UOWN | Origination | Edição de Client Type não atualiza Username e API Key

BUG
Na página de Merchant, ao criar um novo Merchant e selecionar um Client Type (por exemplo, V1_UOWN), o Merchant é salvo corretamente.
Porém, ao reabrir esse Merchant e editar o Client Type, os campos Username e API Key não são atualizados automaticamente como esperado.
Ao clonar um Merchant, o comportamento funciona corretamente (os campos Username e API Key são atualizados).
O problema ocorre apenas quando se cria um Merchant e depois se edita o Client Type.


FIX
Investigar por que Username e API Key não estão sendo atualizados automaticamente quando o Client Type é editado em um Merchant já criado.
Corrigir o comportamento para garantir que Username e API Key sejam sempre atualizados/refrescados quando o Client Type for alterado.
Manter consistência com o comportamento observado durante a clonagem de Merchant.
Adicionar cobertura de testes para validar a correção (tanto no fluxo de criação/edição quanto no de clonagem).


Passos para Reproduzir
Criar um novo Merchant.
Informar qualquer Client Type válido.
Concluir a criação do Merchant e salvar.
Reabrir esse mesmo Merchant.
Editar o campo Client Type para um valor diferente e salvar.
Reabrir o Merchant e verificar os campos Username e API Key.


Resultado Esperado: Username e API Key devem ser atualizados automaticamente para corresponder ao novo Client Type.
Resultado Atual: Username e API Key permanecem inalterados.


Passos de Teste
Navegar até a página de detalhes do merchant.
Ao alterar o client type, os campos merchantUrl, username, apiKey devem ser enviados vazios para a API.
Recarregar a página e verificar que os campos foram populados pela API com os valores corretos.
Esse cenário deve ocorrer tanto ao clonar um merchant quanto ao atualizar um existente.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ALterações dev:
 components/merchant-info-panels/add-or-edit-merchant.tsx 
+
29
−
12

Visualizado
@@ -252,7 +252,8 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
      allowChangeToExpired: merchantBeingEdited?.allowChangeToExpired || false,
      numDaysApprovalExp: merchantBeingEdited?.numDaysApprovalExp || 0,
      numDaysLeaseExp: merchantBeingEdited?.numDaysLeaseDocExp || 0,
      isIntellicheckRequired: merchantBeingEdited?.isIntellicheckRequired || false,
      isIntellicheckRequired:
        merchantBeingEdited?.isIntellicheckRequired || false,
      isSeonIdCheckRequired: handleBoolInitialValue(
        merchantBeingEdited?.isSeonIdCheckRequired || false,
      ),
@@ -824,19 +825,35 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
  });

  useEffect(() => {
    if (!currentMerchantCloned || !formik.values.clientType) {
    if (!formik.values.clientType) {
      return;
    }
    const clientTypeHasChanged =
      currentMerchantCloned.clientType !== formik.values.clientType;
    if (clientTypeHasChanged) {
      formik.setFieldValue('merchantUsername', '');
      formik.setFieldValue('merchantAPIKey', '');
      formik.setFieldValue('merchantUrl', '');
    } else {
      formik.setFieldValue('merchantUsername', currentMerchantCloned.username);
      formik.setFieldValue('merchantAPIKey', currentMerchantCloned.apiKey);
      formik.setFieldValue('merchantUrl', currentMerchantCloned.merchantUrl);

    if (currentMerchantCloned) {
      if (currentMerchantCloned?.clientType !== formik.values.clientType) {
        formik.setFieldValue('merchantUsername', '');
        formik.setFieldValue('merchantAPIKey', '');
        formik.setFieldValue('merchantUrl', '');
      } else {
        formik.setFieldValue(
          'merchantUsername',
          currentMerchantCloned.username,
        );
        formik.setFieldValue('merchantAPIKey', currentMerchantCloned.apiKey);
        formik.setFieldValue('merchantUrl', currentMerchantCloned.merchantUrl);
      }
    }

    if (merchantBeingEdited) {
      if (merchantBeingEdited.clientType !== formik.values.clientType) {
        formik.setFieldValue('merchantUsername', '');
        formik.setFieldValue('merchantAPIKey', '');
        formik.setFieldValue('merchantUrl', '');
      } else {
        formik.setFieldValue('merchantUsername', merchantBeingEdited.username);
        formik.setFieldValue('merchantAPIKey', merchantBeingEdited.apiKey);
        formik.setFieldValue('merchantUrl', merchantBeingEdited.merchantUrl);
      }
    }
  }, [currentMerchantCloned, formik.values.clientType]);

 pages/overview/index.tsx 
+
1
−
1

Visualizado
@@ -32,7 +32,7 @@ import {Col, Row} from 'reactstrap';
import CustomerOverviewModal from '../../components/customer-overview-modal';
import styles from './index.module.scss';
import {MerchantStore} from '@stores/merchant';
import {OverviewSummaryDashboard} from '@components/overview-summary-dashboard';
import { OverviewSummaryDashboard } from '../../components/overview-summary-dashboard';

const refreshOverviewTableValues = (
  tableData: LeadsInDateRangeRequestType[],

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Passo a passo numerado — Requisitos de Teste
UOWN | Origination | Edição de Client Type não atualiza Username e API Key

Pré‑requisitos
Definir ambiente <env> e navegador <browser>.
Garantir usuário com permissão para criar/editar Merchant.
Habilitar mecanismo de captura de rede (HAR) no framework para inspecionar requests.
Ter ao menos dois Client Types válidos (ex.: V1_UOWN e outro tipo).
Critérios de Aceite (alto nível)
Ao alterar o Client Type de um Merchant existente e salvar, o payload enviado à API deve conter merchantUrl, username, apiKey vazios.
Após recarregar a página, os campos Username e API Key devem ser automaticamente preenchidos com valores coerentes ao novo Client Type.
O mesmo comportamento deve ocorrer ao clonar um Merchant (já funciona hoje e deve permanecer consistente).
Cobertura de testes deve validar ambos os fluxos: criação/edição e clonagem.
Cenário A — Edição de Client Type em Merchant já criado
Acessar o Origination e autenticar.
Navegar para a listagem de merchants e abrir a tela de criação.
Criar um novo Merchant informando um Client Type válido (ex.: V1_UOWN) e salvar.
Confirmar criação bem-sucedida e reabrir o Merchant recém-criado (detalhes).
Habilitar captura de rede (HAR) e limpar buffers de rede anteriores.
Editar o campo Client Type para um valor diferente e salvar.
Validar na captura de rede: 7.1. O endpoint de atualização de Merchant foi chamado (POST/PUT).
7.2. O payload enviado contém os campos merchantUrl, username, apiKey vazios (ex.: "" ou null, conforme contrato), e não contém valores antigos.
7.3. A resposta HTTP está de acordo (idealmente 200 OK).
Recarregar a página do Merchant.
Validar na UI: 9.1. Campo Username exibido com o novo valor correspondente ao Client Type selecionado.
9.2. Campo API Key exibido com o novo valor correspondente ao Client Type selecionado.
9.3. Campo merchantUrl populado conforme o Client Type (se aplicável).
Registrar evidências: HAR do request de atualização, screenshots “antes/depois” e valores finais exibidos.
Observações:

Se houver cache/latência, aguardar um curto intervalo ou repetir o reload antes da validação.
Caso o contrato exija especificamente strings vazias (""), validar estritamente esse formato no payload.
Cenário B — Clonagem de Merchant (comportamento de referência)
Acessar o Origination e autenticar.
Navegar até um Merchant existente e acionar “Clonar” (Clone Merchant).
No formulário de clonagem, selecionar um Client Type válido (diferente do original, se aplicável).
Salvar o novo Merchant clonado.
Habilitar captura de rede (HAR) e limpar buffers de rede anteriores.
Reabrir o Merchant clonado.
Validar na UI: 7.1. Username e API Key estão preenchidos corretamente de acordo com o Client Type escolhido na clonagem.
7.2. merchantUrl está coerente com o Client Type (se aplicável).
(Opcional) Validar na rede que, ao persistir o Merchant na clonagem/edição subsequente, o payload também respeita o envio vazio para merchantUrl, username, apiKey quando o Client Type é alterado.
Registrar evidências: screenshots “depois” e valores exibidos.
Cenário C — Regressão/Consistência (opcional, recomendada)
Reabrir um Merchant e salvar sem alterar o Client Type.
Validar que Username e API Key permanecem inalterados (nenhuma atualização inadvertida).
Alterar o Client Type para o original novamente.
Validar que Username e API Key são atualizados de volta, mantendo a lógica de “envio vazio → repopulação após reload”.
Validações Técnicas de Rede (Checklist)
Request de atualização do Merchant é disparado ao salvar a alteração de Client Type.
Método HTTP e path condizem com o endpoint de atualização.
Payload inclui:
merchantUrl: vazio.
username: vazio.
apiKey: vazio.
Não há valores antigos para esses três campos no payload.
Resposta HTTP esperada (ideal 200) e sem erros de validação.
Após reload, a UI exibe valores coerentes ao Client Type em Username/API Key (providos pela API).
Evidências obrigatórias
HAR contendo o request de atualização com merchantUrl, username, apiKey vazios.
Screenshot antes da edição (valores antigos).
Screenshot após reload (valores atualizados).
Logs do teste indicando ambiente, Merchant alvo e Client Type usado.

-----

Vamos criar um fluxo de teste para editar, criar e clonar merchant fazendo as validacoes que pede os requisitos de teste
Crie um enum dos client types disponiveis
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="clientType"><span id="react-select-26-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container filter__value-container--has-value css-1r2c2t"><div class="filter__single-value css-qc6sy-singleValue">PAY_TOMORROW</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-26-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;"></div></div><div class="filter__indicators css-1wy0on6"><div class="filter__indicator filter__clear-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div>
Criei o fluxo R7.25.1.44.0_ClientTypeEditDoesNotUpdateUsernameAndAPIKey_Ticket1117.feature para construir os 3 fluxos no mesmo arquivo
Veja os passos que tem no arquivo e o que ja temos criado para reutilizar
o que nao temos vamos criar, as validacoes solicitadas devem ficar em steps separados
Inclua os novo steps ao arquivo feature
legacy-project/ui_automation\src\test\resources\uownfeatures\templates\specific_tickets\R7.25.1.44.0_ClientTypeEditDoesNotUpdateUsernameAndAPIKey_Ticket1117.feature

-----

> ## Tests in qa1

> ```gherkin
> ### Scenario Outline: Edit Client Type in existing Merchant and validate Username API Key update in "<env>"
> When Log in to origination
> And Navigate to merchants page
> And Add New Merchant
> And Fill fields for merchant:
> | merchantCode    | merchantName    | locationName    | legalName    | peakCampaignId     | offPeakCampaignId      | merchantAddress | merchantCity | merchantState | merchantZipCode | clientType    | Contact Email                        | Contact Name | merchantPhone | inventoryCategory    | contactPhone    |
> | <Merchant Code> | <Merchant Name> | <Location Name> | <Legal Name> | <Peak Campaign Id> | <Off Peak Campaign Id> | <Address>       | <City>       | <State>       | <Zip>           | <Client Type> | william.contact@progressmobility.com | William      | <Telephone>   | <Inventory Category> | <Contact Phone> |
> And Save merchant
> When Search merchant by code "<Merchant Code>"
> And Open first merchant search result
> Given Enable HAR content capture
> And Reset network capture
> When I change Client Type to "<CLient Type TireAgent>"
> And I save merchant changes
> Then Network eventually contains "POST" to path "<create Or Update Merchant>" with status 200 within 10 seconds
> And Network last request to path "<create Or Update Merchant>" JSON body should contain keys "merchantUrl, username, apiKey"
> And Debug print last network request to path "<create Or Update Merchant>"
> Given Navigate to merchants page
> And Reset network capture
> When I reload the current page
> Then Network eventually contains "POST" to path "<get Merchants By Criteria>" with status 200 within 10 seconds
> And Network last request to path "<get Merchants By Criteria>" JSON body should contain keys "search"
> And Open first merchant search result
> Then Username field should be populated with correct value for Client Type "<CLient Type TireAgent>"
> And API Key field should be populated with correct value for Client Type "<CLient Type TireAgent>"
> Then Client Type is <CLient Type TireAgent>
> When I change Client Type to "PAY_TOMORROW"
> And I save merchant changes
> And Test is successful
> 
> Examples:
> | env | browser | Merchant Code      | Merchant Name                     | Location Name     | Legal Name                        | Peak Campaign Id | Off Peak Campaign Id | Address      | City   | State | Zip   | Telephone      | Client Type | Inventory Category | Contact Phone  | get Merchants By Criteria | create Or Update Merchant | CLient Type TireAgent |
> | qa1 | chrome  | OL90294-0001_clone | Progress Mobility Acquisition LLC | Progress Mobility | Progress Mobility Acquisition LLC | 151              | 152                  | 555 Test AVE | Irvine | WY    | 27009 | (646) 555-7812 | V1_UOWN     | OTHER              | (786) 555-1234 | getMerchantsByCriteria    | createOrUpdateMerchant    | TIRE_AGENT            |
> 
> | PASS | Merchant:Progress Mobility | 
> ```
>
>


> ```gherkin
> ### Scenario Outline: Clone Merchant and validate Username API Key behavior in "<env>"
> When Log in to origination
> When Search merchant by code "OL90294-0001"
> And Add New Merchant
> And Clone current merchant
> Given Enable HAR content capture
> And Reset network capture
> When I change Client Type to "V1_UOWN"
> And Save merchant
> When Search merchant by code "OL90294-0001"
> And Open first merchant search result
> When I change Client Type to "V1_UOWN"
> And Save merchant
> When Search merchant by code "OL90294-0001"
> And Open first merchant search result
> Then Username field should be populated with correct value for Client Type "V1_UOWN"
> And API Key field should be populated with correct value for Client Type "V1_UOWN"
> Then Client Type is V1_UOWN
> And Test is successful
> 
> Examples:
> | env | browser |
> | qa1 | chrome  |
> 
> | PASS | Merchant: Progress Mobility| 
> ```
>
>
[R7.25.1.44.0_ClientTypeEditDoesNotUpdateUsernameAndAPIKey_Ticket1117_QA1_2025_09_24_0211_17105.html](/uploads/39b74f146c3124d208c83b4497848d94/R7.25.1.44.0_ClientTypeEditDoesNotUpdateUsernameAndAPIKey_Ticket1117_QA1_2025_09_24_0211_17105.html)
>
>










--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
R7.25.1.44.0_ClientTypeEditDoesNotUpdateUsernameAndAPIKey_Ticket1117
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
