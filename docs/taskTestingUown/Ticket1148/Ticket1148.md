--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1148


UOWN | Origination | Add and Validade Permission for Email/Download CSV Features



Synopsis
In the Origination Portal, several pages include tables that allow users to download results as CSV or send them by email.
However, currently there is no consistent permission control for these actions. In some cases, even when permissions are removed, the buttons remain visible and functional.
This ticket aims to establish proper permission checks for these features, ensuring that only users with explicit authorization can view and use the download/export options.
The initial request was focused on the Merchants page, but the same verification and permission control must be applied to all pages containing these features.



Business Objective
Implementing permission control for CSV and Email export functions will:
    * Strengthen data access security and compliance;
    * Prevent unauthorized users from exporting sensitive data;
    * Provide administrators with full control over who can view or use these actions.



Feature Request | Business Requirements



Scope of Implementation
    * Apply permission validation to all Origination pages containing CSV download and/or Email export functionality:
        * Overview
        * Leads
        * Funding
        * Funding Modification History
        * Modification Reports
        * Merchant Modification History
        * Alerts
        * Error Log
        * Merchants
        * Rebate
        * Blacklist



Permissions Verification
    * Investigate which permissions already exist for each page.
    * Identify missing permissions required to control the CSV/Email actions.



Functionality Behavior
    * If the user does not have permission, both the button and the corresponding action (download/email) must be hidden or disabled.
    * Ensure the backend also enforces permission checks, even if the frontend button is exposed accidentally.
    * Verify that removing a permission properly hides or disables the functionality.

        
      
Testing and Validation
    * Test all pages listed above individually to confirm:
        * Button visibility matches permission settings.
        * Download and email actions cannot be triggered without permission.
        * Existing permissions behave as expected after fix.        
        * Validate with both admin and restricted roles.



Consistency and Usability
    * Maintain consistent button behavior and appearance across all pages.



Documentation
    *  Provide a list of which permissions control the CSV and Email export on each page.

![alt text](image.png)



Testing Steps

Overview
Test that Download CSV buttons are properly controlled by the new download_csv permissions, separate from email_csv permissions.

Permission Names
    Origination Pages
        * Overview: overview/download_csv
        * Leads: leads/download_csv
        * Funding: funding/download_csv
        * Funding Modification History: fundingModificationHistory/download_csv
        * Modification Reports: modificationReport/download_csv
        * Merchant Modification History: merchantModificationHistory/download_csv
        * Alerts: alerts/download_csv
        * Error Log: errorLog/download_csv
        * Merchants: merchant/download_csv
        * Rebate: rebate/download_csv
        * Blacklist: blacklist/download_csv

Servicing Pages
    * Payment Transaction: payment_transaction/download_csv
    * Search: search/download_csv

Test Case 1: User WITHOUT download_csv permission
    1. Expected: Email CSV button visible, Download CSV button hidden
    2. Verify Email CSV functionality still works

Test Case 2: User WITH download_csv permission
    1. Expected: Both Email CSV and Download CSV buttons visible
    2. Verify Download CSV button works (downloads file)

Test Case 3: User WITHOUT any CSV permissions
    * Expected: Both buttons hidden

Pages to Test
    Origination
        Overview (/overview)
        Leads (/leads)
        Funding (/funding)
        Funding Modification History (/fundingModificationHistory)
        Modification Reports (/modificationReport)
        Merchant Modification History (/merchantModificationHistory)
        Alerts (/alerts)
        Error Log (/errorLog)
        Merchants (/merchant)
        Rebate (/rebate)
        Blacklist (/blacklist)

Servicing
    Payment Transaction (/payment-transaction/[account])
    Search (/search)

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🧩 **UOWN | Origination | Adicionar e Validar Permissão para Recursos de Exportação por Email/Download CSV**

---

## **Sinopse**

No portal **Origination**, diversas páginas contêm tabelas que permitem aos usuários **baixar resultados em formato CSV** ou **enviá-los por email**.
Atualmente, **não existe um controle de permissão consistente** para essas ações.
Em alguns casos, mesmo quando as permissões são removidas, **os botões continuam visíveis e funcionais**.

Este ticket tem como objetivo **estabelecer verificações adequadas de permissão** para essas funcionalidades, garantindo que **apenas usuários com autorização explícita possam visualizar e utilizar as opções de download/exportação**.

A solicitação inicial foi focada na **página de Comerciantes (Merchants)**, mas a mesma verificação deve ser aplicada **a todas as páginas que contenham esses recursos**.

---

## **Objetivo de Negócio**

A implementação do controle de permissões para as funções de exportação CSV e Email irá:

* Reforçar a **segurança de acesso aos dados** e o **cumprimento de compliance**;
* Evitar que usuários não autorizados exportem dados sensíveis;
* Fornecer aos administradores **controle total** sobre quem pode visualizar ou usar essas ações.

---

## **Requisitos de Negócio | Solicitação de Funcionalidade**

### **Escopo de Implementação**

Aplicar a validação de permissão em **todas as páginas do Origination** que possuam as funcionalidades de **download CSV** e/ou **exportação por email**, incluindo:

* Overview
* Leads
* Funding
* Funding Modification History
* Modification Reports
* Merchant Modification History
* Alerts
* Error Log
* Merchants
* Rebate
* Blacklist

---

### **Verificação de Permissões**

* Investigar **quais permissões já existem** para cada página.
* Identificar **quais estão faltando** para controlar corretamente as ações de CSV/Email.

---

### **Comportamento da Funcionalidade**

* Se o usuário **não tiver permissão**, tanto o botão quanto a ação correspondente (**download/email**) devem ser **ocultos ou desativados**.
* O **backend também deve validar as permissões**, mesmo que o botão do frontend seja exibido indevidamente.
* Garantir que **a remoção de uma permissão** oculte ou desative a funcionalidade corretamente.

---

### **Testes e Validação**

Testar individualmente todas as páginas listadas para confirmar:

* A visibilidade dos botões corresponde às configurações de permissão.
* As ações de download e envio por email **não podem ser executadas sem permissão**.
* As permissões existentes se comportam conforme o esperado após a correção.
* Validar com **usuários administradores** e **usuários com permissões restritas**.

---

### **Consistência e Usabilidade**

* Manter **comportamento e aparência consistentes** dos botões em todas as páginas.

---

### **Documentação**

* Fornecer uma lista indicando **quais permissões controlam as ações de CSV e Email** em cada página.

---

## **Etapas de Teste**

### **Overview**

Testar se os botões **Download CSV** são controlados corretamente pelas novas permissões `download_csv`, separadas das permissões `email_csv`.

---

### **Nomes das Permissões**

#### **Origination Pages**

* Overview: `overview/download_csv`
* Leads: `leads/download_csv`
* Funding: `funding/download_csv`
* Funding Modification History: `fundingModificationHistory/download_csv`
* Modification Reports: `modificationReport/download_csv`
* Merchant Modification History: `merchantModificationHistory/download_csv`
* Alerts: `alerts/download_csv`
* Error Log: `errorLog/download_csv`
* Merchants: `merchant/download_csv`
* Rebate: `rebate/download_csv`
* Blacklist: `blacklist/download_csv`

#### **Servicing Pages**

* Payment Transaction: `payment_transaction/download_csv`
* Search: `search/download_csv`

---

### **Casos de Teste**

#### **Caso 1: Usuário sem permissão `download_csv`**

1. Esperado: O botão **Email CSV** deve estar visível; o botão **Download CSV** deve estar oculto.
2. Verificar se a funcionalidade **Email CSV** continua funcionando normalmente.

#### **Caso 2: Usuário com permissão `download_csv`**

1. Esperado: Ambos os botões **Email CSV** e **Download CSV** devem estar visíveis.
2. Verificar se o botão **Download CSV** realiza o download corretamente.

#### **Caso 3: Usuário sem nenhuma permissão de CSV**

* Esperado: **Ambos os botões devem estar ocultos.**

---

### **Páginas a Testar**

#### **Origination**

* Overview (`/overview`)
* Leads (`/leads`)
* Funding (`/funding`)
* Funding Modification History (`/fundingModificationHistory`)
* Modification Reports (`/modificationReport`)
* Merchant Modification History (`/merchantModificationHistory`)
* Alerts (`/alerts`)
* Error Log (`/errorLog`)
* Merchants (`/merchant`)
* Rebate (`/rebate`)
* Blacklist (`/blacklist`)

#### **Servicing**

* Payment Transaction (`/payment-transaction/[account]`)
* Search (`/search`)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 1 arquivo
+
24
−
0
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
24
−
0

Visualizado
@@ -120,6 +120,7 @@ public class Uown extends EnvironmentService {

                {"payment_transaction [access]", "access", "payment_transaction", "", ""},
                {"payment transaction csv", "modify", "payment_transaction/email_csv", "allows user to email csv file of user's payment transactions", ""},
                {"payment transaction download csv", "modify", "payment_transaction/download_csv", "allows user to download csv file of user's payment transactions", ""},

                {"reverse payment [edit]", "modify", "payment_transaction/reverse_payment", "allows a user to reverse a payment", ""},
                {"refund payment [edit]", "modify", "payment_transaction/refund_payment", "allows a user to refund a payment", ""},
@@ -149,6 +150,7 @@ public class Uown extends EnvironmentService {

                {"account sale [access]", "access", "account_sale", "access account sale services", ""},
                {"process sale file", "modify", "account_sale/get_documents_for_sold_accounts_with_file", "allows user to upload sale file to process", ""},
                {"search download csv", "modify", "search/download_csv", "allows user to download csv file of search results", ""},

                {"send_customer_portal_link", "modify", "customer_information/send_customer_portal_link", "send customer portal link to customer", ""},

@@ -188,6 +190,7 @@ public class Uown extends EnvironmentService {
                {"overview uuid [view]", "restricted/view", "overview/uuid", "", ""},
                {"overview internal status [view]", "restricted/view", "overview/internal_status", "", ""},
                {"overview csv [modify]", "modify", "overview/email_csv", "", ""},
                {"overview download csv", "modify", "overview/download_csv", "allows user to download csv file of overview data", ""},
                {"overview lambda score", "restricted/view", "overview/lambda_score", "", ""},
                {"overview internal status filter", "restricted/view", "overview/internal_status_filter", "", ""},
                {"overview max approval amount", "restricted/view", "overview/maxApprovalAmount", "", ""},
@@ -239,6 +242,7 @@ public class Uown extends EnvironmentService {
//                        {"funding [view]", "view", "funding", "enable the funding queue read-only access", ""},
                {"funding [edit]", "modify", "funding/update_funding_status", "enable the funding queue edit access", ""},
                {"funding csv [modify]", "modify", "funding/email_csv", "", ""},
                {"funding download csv", "modify", "funding/download_csv", "allows user to download csv file of funding queue data", ""},
                {"search funding queue", "modify", "funding/get_leads_for_funding_queue", "", ""},
                {"two day funding filter [view]", "restricted/view", "funding/two_day_funding_exception", "Allows two day funding filter in funding queue", ""},
                {"five day funding filter [view]", "restricted/view", "funding/five_day_funding_exception", "Allows five day funding filter in funding queue", ""},
@@ -248,6 +252,7 @@ public class Uown extends EnvironmentService {

                {"alerts [access]", "access", "alerts", "", ""},
                {"alerts csv", "modify", "alerts/email_csv", "", ""},
                {"alerts download csv", "modify", "alerts/download_csv", "allows user to download csv file of alerts data", ""},
//                        {"alerts [view]", "view", "alerts", "allows a user to access the alerts to view and search", ""},

//
@@ -265,6 +270,7 @@ public class Uown extends EnvironmentService {
                {"modification report [access]", "access", "modificationReport", "", ""},
                {"modification report [modify]", "modify", "modificationReport/get_modified_leads", "", ""},
                {"modification report email csv", "modify", "modificationReport/email_csv", "", ""},
                {"modification report download csv", "modify", "modificationReport/download_csv", "allows user to download csv file of modification reports", ""},

                {"cancelled_leads [access]", "restricted/view", "customers/view_cancelled_leads", "", ""},
                {"blacklist [add]", "modify", "blacklist/add_to_blacklist", "", ""},
@@ -272,9 +278,11 @@ public class Uown extends EnvironmentService {
                {"blacklist [view]", "access", "blacklist", "", ""},
                {"blacklist lead", "modify", "customers/blacklist_all_items_for_lead", "", ""},
                {"blacklist email csv", "modify", "blacklist/email_csv", "", ""},
                {"blacklist download csv", "modify", "blacklist/download_csv", "allows user to download csv file of blacklist data", ""},

                {"error log [access]", "access", "errorLog", "", ""},
                {"error log email csv", "modify", "errorLog/email_csv", "", ""},
                {"error log download csv", "modify", "errorLog/download_csv", "allows user to download csv file of error log data", ""},

                {"newApplication [access]", "access", "newApplication", "", ""},
                {"newApplication send_application_to_customer [modify]", "modify", "newApplication/send_application_to_customer", "", ""},
@@ -297,6 +305,7 @@ public class Uown extends EnvironmentService {
                {"create inventory category [modify]", "modify", "merchant/create_inventory_category", "", ""},
                {"remove programs [modify]", "modify", "merchant/remove_programs_from_merchant", "", ""},
                {"merchant info email csv", "modify", "merchant/email_csv", "", ""},
                {"merchant info download csv", "modify", "merchant/download_csv", "allows user to download csv file of merchant data", ""},
                {"modify minimum lease amount [modify]", "modify", "merchant/modify_minimum_lease_amount", "", ""},
                {"merchant internal notes [modify]", "restricted/modify", "merchant_internal_notes", "", ""},
                {"access merchant setting", "access", "merchantSetting", "", ""},
@@ -304,6 +313,7 @@ public class Uown extends EnvironmentService {

                {"merchant modification history [access]", "access", "merchantModificationHistory", "", ""},
                {"get merchant modification history", "modify", "merchantModificationHistory/get_merchant_data_change_results", "", ""},
                {"merchant modification history download csv", "modify", "merchantModificationHistory/download_csv", "allows user to download csv file of merchant modification history", ""},

                {"merchant programs [access]", "access", "programs", "", ""},
                {"merchant programs [modify]", "modify", "programs/create_or_update_program", "", ""},
@@ -317,6 +327,7 @@ public class Uown extends EnvironmentService {
                {"rebate [access]", "access", "rebate", "access the rebate page", ""},
                {"get merchant rebate amount", "modify", "rebate/get_merchant_rebate_amount", "", ""},
                {"rebate email csv", "modify", "rebate/email_csv", "", ""},
                {"rebate download csv", "modify", "rebate/download_csv", "allows user to download csv file of rebate data", ""},

                {"open to buy [access]", "access", "openToBuy", "allow user to use open to buy tab", ""},
                {"get open to buy customers", "modify", "openToBuy/get_open_to_buy_customers", "allows user to get customers who are open to buy", ""},
@@ -325,6 +336,7 @@ public class Uown extends EnvironmentService {
                {"funding mod history access", "access", "fundingModificationHistory", "", ""},
                {"funding mod history view", "modify", "fundingModificationHistory/get_funding_modifications", "allows user to see funding modifications", ""},
                {"funding mod csv", "modify", "fundingModificationHistory/email_csv", "allows user to use email csv function for funding mod page", ""},
                {"funding mod download csv", "modify", "fundingModificationHistory/download_csv", "allows user to download csv file of funding modification history", ""},

                {"view lead recordings", "restricted/view/full", "recording", "", ""},

@@ -338,6 +350,7 @@ public class Uown extends EnvironmentService {
                {"leads [view]", "access", "leads", "", ""},
                {"leads get_basic_merchant_info_by_ref_code [modify]", "modify", "leads/get_basic_merchant_info_by_ref_code", "", ""},
                {"leads email csv", "modify", "leads/email_csv", "", ""},
                {"leads download csv", "modify", "leads/download_csv", "allows user to download csv file of leads data", ""},
                {"leads get_leads_by_criteria [modify]", "modify", "leads/get_leads_by_criteria", "", ""},

                {"programSettings [view]", "access", "programSettings", "", ""},
@@ -600,6 +613,7 @@ public class Uown extends EnvironmentService {
                    "overview uuid [view]",
                    "overview internal status [view]",
                    "overview csv [modify]",
                    "overview download csv",
                    "overview lambda score",
                    "overview internal status filter",
                    "overview max approval amount",
@@ -612,6 +626,7 @@ public class Uown extends EnvironmentService {
                    "modification report [access]",
                    "modification report [modify]",
                    "modification report email csv",
                    "modification report download csv",

                    "cancelled_leads [access]",

@@ -620,9 +635,11 @@ public class Uown extends EnvironmentService {
                    "blacklist [view]",
                    "blacklist lead",
                    "blacklist email csv",
                    "blacklist download csv",

                    "error log [access]",
                    "error log email csv",
                    "error log download csv",

                    "change_merchant [modify]",
                    "change_merchant_location [modify]",
@@ -651,6 +668,7 @@ public class Uown extends EnvironmentService {
                    "funding [access]",
                    "funding [edit]",
                    "funding csv [modify]",
                    "funding download csv",
                    "search funding queue",
                    "two day funding filter [view]",
                    "five day funding filter [view]",
@@ -660,6 +678,7 @@ public class Uown extends EnvironmentService {

                    "alerts [access]",
                    "alerts csv",
                    "alerts download csv",

                    "completeApplication [access]",
                    "completeEsign [access]",
@@ -687,12 +706,14 @@ public class Uown extends EnvironmentService {
                    "create inventory category [modify]",
                    "remove programs [modify]",
                    "merchant info email csv",
                    "merchant info download csv",
                    "merchant internal notes [modify]",
                    "access merchant setting",
                    "modify multiple merchants",

                    "merchant modification history [access]",
                    "get merchant modification history",
                    "merchant modification history download csv",

                    "merchant programs [access]",
                    "merchant programs [modify]",
@@ -713,6 +734,7 @@ public class Uown extends EnvironmentService {
                    "rebate [access]",
                    "get merchant rebate amount",
                    "rebate email csv",
                    "rebate download csv",

                    "open to buy [access]",
                    "get open to buy customers",
@@ -721,6 +743,7 @@ public class Uown extends EnvironmentService {
                    "funding mod history access",
                    "funding mod history view",
                    "funding mod csv",
                    "funding mod download csv",

                    "overview get_merchant_by_ref_code [modify]",
                    "overview get_basic_merchant_info_by_ref_code [modify]",
@@ -734,6 +757,7 @@ public class Uown extends EnvironmentService {

                    "leads [view]",
                    "leads email csv",
                    "leads download csv",
                    "leads get_basic_merchant_info_by_ref_code [modify]",
                    "leads get_leads_by_criteria [modify]",
                    "invoice [access]",

---


 23 arquivos
+
137
−
19
Arquivos
23
Pesquisar (por exemplo, *.vue) (F)

pa
‎ges‎

ale
‎rts‎

inde
‎x.tsx‎
+13 -3

blac
‎klist‎

inde
‎x.tsx‎
+12 -2

erro
‎rLog‎

inde
‎x.tsx‎
+12 -2

fun
‎ding‎

inde
‎x.tsx‎
+7 -0

fundingModifi
‎cationHistory‎

inde
‎x.tsx‎
+12 -1

le
‎ads‎

inde
‎x.tsx‎
+8 -1

merc
‎hant‎

inde
‎x.tsx‎
+7 -0

merchantModif
‎icationHistory‎

inde
‎x.tsx‎
+8 -1

modificat
‎ionReport‎

inde
‎x.tsx‎
+8 -1

over
‎view‎

inde
‎x.tsx‎
+9 -0

reb
‎ate‎

inde
‎x.tsx‎
+12 -2

ut
‎ils‎

 pages/alerts/index.tsx 
+
13
−
3

Visualizado
@@ -3,6 +3,7 @@ import AuthWrapper from '@layouts/auth';
import {AlertFilters, CustomerStore} from '@stores/customer';
import {OverviewStore} from '@stores/overview';
import {UtilityStore} from '@stores/utility';
import {AccountStore} from '@stores/account';
import {
  CSVDownloadProps,
  defaultPaginatedResp,
@@ -10,7 +11,7 @@ import {
  FilterProps,
  FilterTable,
} from '@uownleasing/common-ui';
import {formatDate, getDate} from '@uownleasing/common-utilities';
import {formatDate, getDate, hasModifyPermission} from '@uownleasing/common-utilities';
import {
  dataTableCustomStyles,
  paginationRowsPerPageOptions,
@@ -24,6 +25,7 @@ interface AlertsProps {
  overviewStore: OverviewStore;
  customerStore: CustomerStore;
  utilityStore: UtilityStore;
  accountStore: AccountStore;
}

const fromTime = 'T00:00:00';
@@ -39,7 +41,7 @@ const defaultFilters = () => {
  };
};

const Alerts = ({overviewStore, customerStore, utilityStore}: AlertsProps) => {
const Alerts = ({overviewStore, customerStore, utilityStore, accountStore}: AlertsProps) => {
  const [alertsTableData, setAlertsTableData] = useState(customerStore.alerts);
  const [csvData, setCSVData] = useState([]);
  const [emailModal, setEmailModal] = useState(false);
@@ -86,6 +88,12 @@ const Alerts = ({overviewStore, customerStore, utilityStore}: AlertsProps) => {
    setCSVData(alerts);
  }, [alertsTableData.totalElements, customerStore, filters]);

  const hasDownloadCSVPermission = hasModifyPermission(
    accountStore?.permissions,
    'alerts',
    'download_csv',
  );

  const csvProps = useMemo<CSVDownloadProps>(
    () => ({
      data: csvData,
@@ -99,8 +107,9 @@ const Alerts = ({overviewStore, customerStore, utilityStore}: AlertsProps) => {
        csvOmit: false,
      })) as {label: string; key: string; csvOmit: boolean}[],
      onClick: onClickCSVDownload,
      hasDownloadPermission: hasDownloadCSVPermission,
    }),
    [alertsTableData.content?.length, columns, csvData, onClickCSVDownload],
    [alertsTableData.content?.length, columns, csvData, onClickCSVDownload, hasDownloadCSVPermission],
  );

  const filterProps = useMemo<FilterProps>(
@@ -203,4 +212,5 @@ export default inject(
  'overviewStore',
  'customerStore',
  'utilityStore',
  'accountStore',
)(observer(Alerts));
 pages/blacklist/index.tsx 
+
12
−
2

Visualizado
@@ -22,17 +22,19 @@ import {BlacklistSearchQuery} from '@models';
import {BlacklistData, BlacklistObject} from 'models/blacklist-data';
import {isEqual as _isEqual} from 'lodash';
import * as Yup from 'yup';
import {formatDate, showToast} from '@uownleasing/common-utilities';
import {formatDate, showToast, hasModifyPermission} from '@uownleasing/common-utilities';
import {OverviewStore} from '@stores/overview';
import {AccountStore} from '@stores/account';

interface BlacklistProps {
  utilityStore: UtilityStore;
  blacklistStore: BlacklistStore;
  overviewStore: OverviewStore;
  accountStore: AccountStore;
}

const Blacklist = (props: BlacklistProps) => {
  const {blacklistStore, utilityStore, overviewStore} = props;
  const {blacklistStore, utilityStore, overviewStore, accountStore} = props;

  const [configColumns, setConfigColumns] = useState([]);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
@@ -274,12 +276,19 @@ const Blacklist = (props: BlacklistProps) => {
    setCSVData(mappedData);
  };

  const hasDownloadCSVPermission = hasModifyPermission(
    accountStore?.permissions,
    'blacklist',
    'download_csv',
  );

  const csvProps = getDownloadCSVProps(
    csvData,
    blacklistSearchResults,
    configColumns,
    updateCsvData,
    setEmailModal,
    hasDownloadCSVPermission,
  );

  const csvEmailProps = {
@@ -363,4 +372,5 @@ export default inject(
  'blacklistStore',
  'utilityStore',
  'overviewStore',
  'accountStore',
)(observer(Blacklist));


---


 3 arquivos
+
4
−
2
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

s
‎rc‎

lib/data-tabl
‎e/csv-download‎

inde
‎x.tsx‎
+2 -1

models/d
‎ata-table‎

inde
‎x.tsx‎
+1 -0

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/data-table/csv-download/index.tsx 
+
2
−
1

Visualizado
@@ -20,6 +20,7 @@ export const CSVDownload = (props: CSVDownloadComponentProps) => {
    headers,
    onClick,
    handleSendEmail,
    hasDownloadPermission = false,
  } = csvDownloadProps;

  const csvLink = useRef<
@@ -44,7 +45,7 @@ export const CSVDownload = (props: CSVDownloadComponentProps) => {
      ) : (
        <></>
      )}
      {headers && filename && (
      {hasDownloadPermission && headers && filename && (
        <Button
          buttonStyle="primary"
          className={classNames(
 libs/common-ui/src/models/data-table/index.tsx 
+
1
−
0

Visualizado
@@ -56,4 +56,5 @@ export interface CSVDownloadProps {
  asyncOnClick?: boolean;
  onClick?: (value?: any) => void;
  handleSendEmail?: (value: any) => void;
  hasDownloadPermission?: boolean;
}
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.384",
  "version": "0.0.385",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg


> ```gherkin

### Scenario 1: Overview
Given a user WITHOUT the "overview/download_csv" permission, when accessing Overview, then the "Download CSV" button must be hidden/disabled, preventing any click; when another user WITH the permission accesses the page, the "Download CSV" button must be visible and functional, and clicking it successfully triggers the download.

![Screenshot_at_Nov_17_18-52-11](/uploads/a9af32abe15536b10a185c00de33ed1c/Screenshot_at_Nov_17_18-52-11.png){width=385 height=111}
![Screenshot_at_Nov_17_18-53-27](/uploads/72e43817198227f59f806a0e2e157566/Screenshot_at_Nov_17_18-53-27.png){width=495 height=175}
![image](/uploads/8f7485b4c29b1a5487eb067671680867/image.png){width=491 height=49}
![image](/uploads/7dd91e6826ab2a24f6144693ebef107d/image.png){width=833 height=600}
![image](/uploads/25a4342e57a5ca4b2f2fe3d58fdede7f/image.png){width=347 height=51}
![Screenshot_at_Nov_17_18-54-27](/uploads/b7c9f12fa640f07848a144d8e0f88799/Screenshot_at_Nov_17_18-54-27.png){width=900 height=445}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 2: Leads
Given a user WITHOUT the "leads/download_csv" permission, when accessing Leads, the "Download CSV" button must be hidden; when a user WITH the permission accesses the page, the button must be visible and functional.

![Screenshot_at_Nov_17_18-50-07](/uploads/e2ad4efca71233fce438f001de975eb7/Screenshot_at_Nov_17_18-50-07.png){width=900 height=197}
![Screenshot_at_Nov_17_18-54-44](/uploads/8caaf4809441beda2fd38506eab34977/Screenshot_at_Nov_17_18-54-44.png){width=900 height=385}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 3: Funding
Given a user WITHOUT the "funding/download_csv" permission, when accessing Funding, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-50-15](/uploads/7a1ac6d6e6d76336d2274f2c03239cf4/Screenshot_at_Nov_17_18-50-15.png){width=900 height=304}
![Screenshot_at_Nov_17_18-55-19](/uploads/ee72181e5d38b9498362e2487da03041/Screenshot_at_Nov_17_18-55-19.png){width=900 height=197}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 4: Funding Modification History
Given a user WITHOUT the "fundingModificationHistory/download_csv" permission, when accessing Funding Modification History, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-50-33](/uploads/9de90d810140189edb6be6a18fd796aa/Screenshot_at_Nov_17_18-50-33.png){width=900 height=232}
![Screenshot_at_Nov_17_18-55-31](/uploads/7e20ffacc324a583d844d1a8859e6161/Screenshot_at_Nov_17_18-55-31.png){width=900 height=226}

> **| PASS |**
> ```

---


### Scenario 5: Merchant Modification History
Given a user WITHOUT the "merchantModificationHistory/download_csv" permission, when accessing Merchant Modification History, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-51-11](/uploads/b975021b3c78d8684eeb6e754c71832e/Screenshot_at_Nov_17_18-51-11.png){width=882 height=600}
![image](/uploads/a0a2bed18642c2721fa19285f523c1f7/image.png){width=884 height=600}
> ```gherkin

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 6: Alerts
Given a user WITHOUT the "alerts/download_csv" permission, when accessing Alerts, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-51-18](/uploads/b73ffe892855eedd8623108f3e2715d2/Screenshot_at_Nov_17_18-51-18.png){width=900 height=283}
![Screenshot_at_Nov_17_19-05-18](/uploads/687966b3bdb3768d448a2e894cbf6cfb/Screenshot_at_Nov_17_19-05-18.png){width=900 height=244}
> ```gherkin

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 7: Error Log
Given a user WITHOUT the "errorLog/download_csv" permission, when accessing Error Log, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-51-26](/uploads/dad49fd027a54dd8538ad0b4d549bedd/Screenshot_at_Nov_17_18-51-26.png){width=900 height=595}
![Screenshot_at_Nov_17_19-07-00](/uploads/8807f907c801e8c1a5b90da844cc5a9f/Screenshot_at_Nov_17_19-07-00.png){width=900 height=417}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 8: Merchants
Given a user WITHOUT the "merchant/download_csv" permission, when accessing Merchants, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-51-39](/uploads/16587a5c5163268f6c1d35804bdf1ec9/Screenshot_at_Nov_17_18-51-39.png){width=855 height=600}
![Screenshot_at_Nov_17_19-07-29](/uploads/188b7d882ed25ff673a072d15d1f29c7/Screenshot_at_Nov_17_19-07-29.png){width=900 height=423}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 9: Rebate
Given a user WITHOUT the "rebate/download_csv" permission, when accessing Rebate, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-51-51](/uploads/e1a8d9c5aadd40a4e70fa36fe7cd2f13/Screenshot_at_Nov_17_18-51-51.png){width=900 height=237}
![Screenshot_at_Nov_17_19-05-52](/uploads/2ca434dbf0bddff93f75016b4b8452e6/Screenshot_at_Nov_17_19-05-52.png){width=900 height=234}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 10: Blacklist
Given a user WITHOUT the "blacklist/download_csv" permission, when accessing Blacklist, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

![Screenshot_at_Nov_17_18-52-00](/uploads/f07bd9efe2facd54b12420f81d889e82/Screenshot_at_Nov_17_18-52-00.png){width=884 height=600}
![Screenshot_at_Nov_17_19-07-46](/uploads/31851b04abc3a9dad1b33a5e0c80d1b5/Screenshot_at_Nov_17_19-07-46.png){width=900 height=425}

> **| PASS |**
> ```

---

> ```gherkin

### Scenario 11: Payment Transaction (Servicing)
Given a user WITHOUT the "payment_transaction/download_csv" permission, when accessing Payment Transaction, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.

> **| PASS |**

> ```

---

> ```gherkin

### Scenario 12: Search (Servicing)
Given a user WITHOUT the "search/download_csv" permission, when accessing Search, the "Download CSV" button must be hidden; with the permission, the button must be visible and functional.


> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------