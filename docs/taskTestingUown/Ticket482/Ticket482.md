-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/482


UOWN | Servicing | Change Account Header Banner Color to Green for Kornerstone Company in Servicing


Synopsis
In the Servicing Portal, there is a banner positioned above the account information section displaying key details such as the account number and other customer data.
This banner currently has a default color that is consistent across all companies.
A modification is required so that, whenever the Company is Kornerstone, the banner displays in the Kornerstone institutional green color instead of the default.


Business Objective
This change aims to enhance the visual identity and user recognition of Kornerstone-related accounts within the Servicing Portal.
It improves user experience by aligning the interface with the company’s branding and providing a quick visual cue for identifying Kornerstone accounts.


Feature Request | Business Requirements
Modify the Servicing Portal so that the account banner displayed above account details appears in green (Kornerstone’s institutional color) whenever the Company = Kornerstone.
Return "company" from AccountInfo in /AccountSummary/{accountPk} and Change servicing portal yellow banner to either green (or any other color that looks good) if company is KORNERSTONE
Hex Color #AEEB78
![alt text](image.png)


Testing Steps
1. Verify header color behavior: After the changes, the header in Servicing will change colors if the company of the account is registered as KORNERSTONE instead of UOWN.
2. Manually update the company value: In the uown_sv_account table, change the value in the company field from UOWN to KORNERSTONE.
3. Confirm the UI update: Access the account page and verify that the header color has updated accordingly.
![alt text](image-1.png)

-----

PTBR

# **UOWN | Servicing | Alterar Cor do Banner do Cabeçalho da Conta para Verde quando a Empresa for Kornerstone no Servicing**

## **Synopsis**

No Servicing Portal, existe um banner localizado acima da seção de informações da conta, exibindo dados importantes como número da conta e informações do cliente.
Atualmente, esse banner possui uma cor padrão exibida para todas as empresas.

É necessário implementar uma modificação para que, sempre que a *Company* for **Kornerstone**, o banner seja exibido na cor institucional verde da Kornerstone, em vez da cor padrão.

---

## **Business Objective**

O objetivo dessa alteração é reforçar a identidade visual da Kornerstone dentro do Servicing Portal.

Isso permitirá:

* Melhor reconhecimento de contas vinculadas à Kornerstone.
* Uma experiência de uso mais intuitiva e consistente com o branding da empresa.
* Identificação visual imediata ao acessar contas específicas dessa companhia.

---

## **Feature Request | Business Requirements**

* Modificar o Servicing Portal para que o banner exibido acima dos detalhes da conta utilize a cor verde institucional da Kornerstone quando `company = KORNERSTONE`.
* O endpoint `/AccountSummary/{accountPk}` deve retornar o campo `company` dentro de `AccountInfo`.
* Quando o valor for **KORNERSTONE**, o banner (atualmente amarelo) deve ser exibido na cor verde institucional.

**Cor institucional da Kornerstone:**
🟩 **Hex:** `#AEEB78`

---

## **Testing Steps**

### **1. Verificar comportamento da cor do banner**

Após as alterações, acesse uma conta no Servicing e observe o banner superior:

* Se `company = UOWN` → cor padrão.
* Se `company = KORNERSTONE` → banner deve mudar para verde `#AEEB78`.

### **2. Atualizar manualmente o valor da empresa**

No banco de dados:

```
UPDATE uown_sv_account 
SET company = 'KORNERSTONE' 
WHERE account_pk = <id_da_conta>;
```

### **3. Confirmar a atualização na interface**

Acesse novamente a página da conta e verifique:

* Banner deve aparecer em verde.
* Não deve haver quebra de layout ou inconsistências visuais.

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 3 arquivos
+
16
−
1
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/ac
‎count-summary‎

index.mo
‎dule.scss‎
+4 -0

inde
‎x.tsx‎
+11 -1

layout
‎s/auth‎

inde
‎x.tsx‎
+1 -0

 components/account-summary/index.module.scss 
+
4
−
0

Visualizado
@@ -35,6 +35,10 @@
    color: var(--primary);
    cursor: pointer;
  }

  &__kornerstone {
    background-color: #AEEB78;
  }
}

.accountSummaryBox {
 components/account-summary/index.tsx 
+
11
−
1

Visualizado
@@ -42,6 +42,7 @@ interface AccountSummaryProps {
  hasSendCustomerPortalLinkPermission: boolean;
  hasViewSendInvitePermission: boolean;
  originationUrl: string;
  company?: string;
}

export const AccountSummary = (props: AccountSummaryProps) => {
@@ -65,6 +66,7 @@ export const AccountSummary = (props: AccountSummaryProps) => {
    hasSendCustomerPortalLinkPermission,
    hasViewSendInvitePermission,
    originationUrl,
    company,
  } = props;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
@@ -132,8 +134,14 @@ export const AccountSummary = (props: AccountSummaryProps) => {
    !isEqual(accountSummary?.accountStatus, AccountStatus.CANCELLED) &&
    hasStatusChangePermission;

  const isKornerstone = company === 'KORNERSTONE';

  return (
    <div className={styles?.accountSummary}>
    <div
      className={classNames(
        styles?.accountSummary,
        isKornerstone && styles?.accountSummary__kornerstone,
      )}>
      <div className="d-flex flex-row justify-content-between align-items-center h-100 px-3">
        <div
          className={classNames(
@@ -151,6 +159,7 @@ export const AccountSummary = (props: AccountSummaryProps) => {
            description={
              letterToShow + accountSummary?.refAccountId?.toString()
            }
            company={company}
          />
          <div className={styles?.accountSummary__borderRight} />
          <AccountSummaryBox
@@ -335,6 +344,7 @@ interface AccountSummaryBoxProps {
  toggleStatusChange?: () => void;
  hasStatusChangePermission?: boolean;
  linkRef?: string;
  company?: string;
}

const AccountSummaryBox = (props: AccountSummaryBoxProps | any) => {
 layouts/auth/index.tsx 
+
1
−
0

Visualizado
@@ -532,6 +532,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
            }
            hasViewSendInvitePermission={hasViewSendInvitePermission}
            originationUrl={accountStore?.originationUrl}
            company={customerStore?.accountInfo?.company}
          />
        )}
        {isAlertBlockShown && (

---


 7 arquivos
+
67
−
12
Arquivos
7
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

payment
‎-history‎

inde
‎x.tsx‎
+2 -2

reverse-pa
‎yment-modal‎

index.mo
‎dule.scss‎
+14 -0

inde
‎x.tsx‎
+28 -7

domain
‎/stores‎

payme
‎nt.tsx‎
+9 -2

mod
‎els‎

inde
‎x.ts‎
+1 -0

refund-payme
‎nt-request.ts‎
+7 -0

serv
‎er.js‎
+6 -1

 components/payment-history/index.tsx 
+
2
−
2

Visualizado
@@ -7,7 +7,7 @@ import Payment from '@models/payment';
import config from '@config/project-config';
import ReversePaymentModal from 'components/reverse-payment-modal';
import UpdatePaymentModal from 'components/modals/update-payment';
import {ResponseType, ReversePaymentRequest} from '@models/index';
import {RefundPaymentRequest, ResponseType, ReversePaymentRequest} from '@models/index';
import {FilterTable} from '@uownleasing/common-ui';
import {TableRow} from 'react-data-table-component';

@@ -38,7 +38,7 @@ interface PaymentHistoryTableProps {
  reversePayment: (
    reversePaymentRequest: ReversePaymentRequest,
  ) => Promise<ResponseType>;
  refundPayment: (queryParameters: string) => Promise<ResponseType>;
  refundPayment: (refundPaymentRequest: RefundPaymentRequest) => Promise<ResponseType>;
  updatePayment: (payment: Payment) => Promise<ResponseType>;
  isLoading: boolean;
}
 components/reverse-payment-modal/index.module.scss  0 → 100644
+
14
−
0

Visualizado
.refundFeeCheckbox {
  display: flex;
  align-items: center;
  
  input {
    position: relative;
    margin: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
  }
}
 components/reverse-payment-modal/index.tsx 
+
28
−
7

Visualizado
@@ -2,7 +2,7 @@ import React from 'react';
import {Col, Form, FormGroup, Row} from 'reactstrap';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {ReversePaymentRequest, ResponseType} from '@models/index';
import {RefundPaymentRequest, ReversePaymentRequest, ResponseType} from '@models/index';
import {
  convertNumberToCurrency,
  formatDate,
@@ -11,6 +11,7 @@ import {
} from '@uownleasing/common-utilities';
import {InputField, Modal} from '@uownleasing/common-ui';
import Payment from 'models/payment';
import styles from './index.module.scss';

interface ReversePaymentModalProps {
  displayReversePaymentModal: boolean;
@@ -19,7 +20,7 @@ interface ReversePaymentModalProps {
  reversePayment: (
    reversePaymentRequest: ReversePaymentRequest,
  ) => Promise<ResponseType>;
  refundPayment: (queryParameters: string) => Promise<ResponseType>;
  refundPayment: (refundPaymentRequest: RefundPaymentRequest) => Promise<ResponseType>;
  hasReversePaymentModifyPermission: boolean;
  hasRefundPaymentsModifyPermission: boolean;
}
@@ -62,6 +63,7 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
      paymentAmount: initialPaymentAmount,
      comment: '',
      reverseReason: 'Reverse',
      refundFee: true,
    },
    validationSchema: Yup.object({
      comment: Yup.string().required('Comment is required.').min(1).max(500),
@@ -79,18 +81,21 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
        comment = '',
        reverseReason = 'Reverse',
        paymentAmount = 0,
        refundFee = true,
      } = values;
      const isRefund =
        isEqual(reverseReason, 'Fully Refund') ||
        isEqual(reverseReason, 'Partially Refund');
      const isPartialRefund = isEqual(reverseReason, 'Partially Refund');
      const isFullyRefund = isEqual(reverseReason, 'Fully Refund');

      const response = isRefund
        ? await refundPayment(
            `?paymentPks=${paymentPk}&comment=${comment}${
              isPartialRefund ? `&amount=${paymentAmount}` : ''
            }`,
          )
        ? await refundPayment({
            paymentPk: paymentPk,
            refundFee: isFullyRefund ? refundFee : false,
            comment: comment,
            amount: isPartialRefund ? paymentAmount : initialPaymentAmount,
          })
        : await reversePayment({
            paymentPk: paymentPk,
            comment: comment,
@@ -205,6 +210,22 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
          />
        </Col>
      </Row>
      {isEqual(formik?.values?.reverseReason, 'Fully Refund') && (
        <Row className="mt-3">
          <Col sm={4} className="pop-up-form__key">
            Refund Convenience Fee
          </Col>
          <Col className="pop-up-form__value">
            <div className={styles.refundFeeCheckbox}>
              <InputField
                formik={formik}
                name="refundFee"
                type="checkbox"
              />
            </div>
          </Col>
        </Row>
      )}
      <Form id="revertPaymentForm" className="mt-3">
        <FormGroup row>
          <Col sm={4} className="pop-up-form__key">
       Refund Convenience Fee
          </Col>
          <Col className="pop-up-form__value">
            <div className={styles.refundFeeCheckbox}>
              <InputField
                formik={formik}
                name="refundFee"
                type="checkbox"
              />
            </div>
          </Col>
        </Row>
      )}
      <Form id="revertPaymentForm" className="mt-3">
        <FormGroup row>
          <Col sm={4} className="pop-up-form__key">
 domain/stores/payment.tsx 
+
9
−
2

Visualizado
@@ -12,6 +12,7 @@ import {
  MakeCheckPayment,
  MoveDueDateRequest,
  ReceivableType,
  RefundPaymentRequest,
  ResponseType,
  ReversePaymentRequest,
  ScheduledPayments,
@@ -151,7 +152,7 @@ export class PaymentStore extends BaseStore {

  @action
  refundPayment = async (
    queryParameters: string = '',
    refundPaymentRequest: RefundPaymentRequest,
  ): Promise<ResponseType> => {
    const customerStore = this?.rootStore?.customerStore;
    const accountPk = customerStore?.accountPk;
@@ -159,7 +160,13 @@ export class PaymentStore extends BaseStore {
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/svc/refundPayments${queryParameters}`,
      url: '/uown/svc/refundPayment',
      data: {
        paymentPk: refundPaymentRequest.paymentPk,
        refundFee: refundPaymentRequest.refundFee,
        amount: refundPaymentRequest.amount,
        comment: refundPaymentRequest.comment,
      },
    });
    utilityStore?.setIsLoading(false);

 models/index.ts 
+
1
−
0

Visualizado
@@ -23,6 +23,7 @@ export * from './payment-transaction';
export * from './phone-history';
export * from './receivable-type';
export * from './request-permission';
export * from './refund-payment-request';
export * from './resend-document';
export * from './response-type';
export * from './reverse-payment';
 models/refund-payment-request.ts  0 → 100644
+
7
−
0

Visualizado
export interface RefundPaymentRequest {
  paymentPk: number;
  refundFee: boolean;
  amount?: number;
  comment: string;
}
 server.js 
+
6
−
1

Visualizado
@@ -197,6 +197,7 @@ const permissionsMapping = {
    post: {
      reverse_payment: '/uown/svc/reversePayment',
      refund_payment: '/uown/svc/refundPayments',
      refund_payment_single: '/uown/svc/refundPayment',
      rewind_replay_account: '/uown/svc/rewindAndReplayAccount/',
      email_csv: '/uown/emailCSV',
    },
@@ -272,7 +273,11 @@ const hasCategoryPermission = (
    const categoryPostRoutes = Object.keys(permissionsMapping[category]?.post);
    categoryPostRoutes.map((key) => {
      const value = permissionsMapping?.[category]?.post?.[key];
      if (targetUrl.startsWith(value) && categoryAccess?.modify?.[key]) {
      let permissionKey = key;
      if (category === 'payment_transaction' && key === 'refund_payment_single') {
        permissionKey = 'refund_payment';
      }
      if (targetUrl.startsWith(value) && categoryAccess?.modify?.[permissionKey]) {
        isAllowed = true;
      }
    });


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

```markdown

1. O banner do cabeçalho da conta deve ser exibido na cor verde (#AEEB78) quando o campo company for igual a "KORNERSTONE"1. The account header banner should be displayed in green (#AEEB78) when the "company" field is equal to "KORNERSTONE".

2. O banner do cabeçalho da conta deve ser exibido na cor padrão (amarelo) quando o campo company for igual a "UOWN"
2. The account header banner should be displayed in the default color (yellow) when the "company" field is equal to "UOWN".

3. O banner do cabeçalho da conta deve ser exibido na cor padrão quando o campo company estiver vazio ou nulo
3. The account header banner should be displayed in the default color when the "company" field is empty or null.

4. O endpoint /AccountSummary/{accountPk} deve retornar o campo "company" dentro do objeto AccountInfo
4. The endpoint `/AccountSummary/{accountPk}` should return the "company" field within the AccountInfo object.

5. A comparação do valor de company deve ser case-sensitive, aceitando apenas "KORNERSTONE" em maiúsculas
5. The comparison of the "company" value should be case-sensitive, accepting only "KORNERSTONE" in uppercase.

6. A classe CSS "accountSummary__kornerstone" deve ser aplicada ao elemento do banner apenas quando company for "KORNERSTONE"
6. The CSS class "accountSummary__kornerstone" should be applied to the banner element only when the "company" is "KORNERSTONE".

7. O layout do banner não deve apresentar quebras ou inconsistências visuais após a aplicação da cor verde
7. The layout of the banner should not have any breaks or visual inconsistencies after the green color is applied.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2

> ```gherkin

> **The account header banner should be displayed in green (#AEEB78) when the "company" field is equal to "KORNERSTONE"**

> ![Screenshot_at_Nov_26_08-50-13](/uploads/4250c3a408580be5fde6a91cbdf3ef18/Screenshot_at_Nov_26_08-50-13.png){width=900 height=36}
> ![Screenshot_at_Nov_26_08-50-22](/uploads/84511aaa4c586ec06a15272c81db0411/Screenshot_at_Nov_26_08-50-22.png){width=900 height=102}
> ![Screenshot_at_Nov_26_09-04-15](/uploads/da677ef39c7fb59a73c69d0c4eb9b818/Screenshot_at_Nov_26_09-04-15.png){width=633 height=61}

> **| PASS |**
> ```

---

> ```gherkin

> **The account header banner should be displayed in the default color (yellow) when the "company" field is equal to "UOWN"**

> ![Screenshot_at_Nov_26_08-48-34](/uploads/f33145f280c7861f0ae9157a57109f74/Screenshot_at_Nov_26_08-48-34.png){width=900 height=33}
> ![Screenshot_at_Nov_26_08-48-47](/uploads/725359bab291fc64bf04ddb705fe376b/Screenshot_at_Nov_26_08-48-47.png){width=900 height=98}
> ![Screenshot_at_Nov_26_09-09-07](/uploads/db11c71c2bd4dc0371eb8c980e6969c3/Screenshot_at_Nov_26_09-09-07.png){width=625 height=216}

> **| PASS |**
> ```

---

> ```gherkin

> **The account header banner should be displayed in the default color when the "company" field is empty or null**

> ![Screenshot_at_Nov_26_08-52-45](/uploads/13a097a0231483d7e78ce062fb9ce3e7/Screenshot_at_Nov_26_08-52-45.png){width=900 height=36}
> ![Screenshot_at_Nov_26_08-52-55](/uploads/7d63d64e9e9ef4de00a70061211d0f74/Screenshot_at_Nov_26_08-52-55.png){width=900 height=100}

> **| PASS |**
> ```

---

> ```gherkin

> **The endpoint `/AccountSummary/{accountPk}` should return the "company" field within the AccountInfo object**

> ![Screenshot_at_Nov_26_09-17-22](/uploads/47f9094d764e1f5793fac8e8c7ab85ad/Screenshot_at_Nov_26_09-17-22.png){width=432 height=188}
> ![Screenshot_at_Nov_26_09-17-43](/uploads/879a6b0825b064aa9498e4d58780be1c/Screenshot_at_Nov_26_09-17-43.png){width=564 height=600}
> ![Screenshot_at_Nov_26_09-17-55](/uploads/dbfe304ca9095332a3e2141a35bdcddb/Screenshot_at_Nov_26_09-17-55.png){width=607 height=600}
> ![Screenshot_at_Nov_26_09-20-42](/uploads/b08ca93168821f2185fc1e942c423cfd/Screenshot_at_Nov_26_09-20-42.png){width=437 height=187}
> ![Screenshot_at_Nov_26_09-20-53](/uploads/c722b97df07c3e14ce3c1f6bd21541de/Screenshot_at_Nov_26_09-20-53.png){width=572 height=600}
> ![Screenshot_at_Nov_26_09-21-00](/uploads/252918aa95beb52398f327d9fec97ebe/Screenshot_at_Nov_26_09-21-00.png){width=575 height=600}
> ![Screenshot_at_Nov_26_09-22-07](/uploads/ea0c8049531561a81902399bb650f67a/Screenshot_at_Nov_26_09-22-07.png){width=900 height=567}
> ![Screenshot_at_Nov_26_09-22-32](/uploads/28a257851e166bde2132adb3176ca5ea/Screenshot_at_Nov_26_09-22-32.png){width=900 height=567}

> **| PASS |**
> ```

---

> ```gherkin

> **The comparison of the "company" value should be case-sensitive, accepting only "KORNERSTONE" in uppercase**

> **| PASS |**
> ```

---

> ```gherkin

> **The CSS class "accountSummary__kornerstone" should be applied to the banner element only when the "company" is "KORNERSTONE"**

> ![Screenshot_at_Nov_26_09-04-15](/uploads/04d60cc7a51c1b7f3d6b6177c6fc01e9/Screenshot_at_Nov_26_09-04-15.png){width=633 height=61}
> ![Screenshot_at_Nov_26_09-04-16](/uploads/b452ff73f4037f62e4cbb61537037b60/Screenshot_at_Nov_26_09-04-16.png){width=900 height=51}
> ![Screenshot_at_Nov_26_09-09-07](/uploads/06bc861b39aecfbff8da558143e711d1/Screenshot_at_Nov_26_09-09-07.png){width=625 height=216}
> ![Screenshot_at_Nov_26_09-09-26](/uploads/0376eb3a45b7ecec8caf352903e968ab/Screenshot_at_Nov_26_09-09-26.png){width=900 height=47}

> **| PASS |**
> ```

---

> ```gherkin

> **The layout of the banner should not have any breaks or visual inconsistencies after the green color is applied**

> ![Screenshot_at_Nov_26_09-09-26](/uploads/519c2303083d95a582666a038117cac4/Screenshot_at_Nov_26_09-09-26.png){width=900 height=47}
> ![Screenshot_at_Nov_26_09-12-25](/uploads/cd71f79f4e40473263c9054faaaadb18/Screenshot_at_Nov_26_09-12-25.png){width=900 height=62}

> **| PASS |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




quando acessa a conta kornerstone pela url nao carrega a cor
