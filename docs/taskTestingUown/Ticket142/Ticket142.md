---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/142

UOWN | Customer Portal | Update Support Contact for KORNERSTONE

Testing Steps
Confirm that for kornerstone accounts and in the kornerstone domain, the contact number on website is: (888) 521-5111

---------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | Portal do Cliente | Atualizar contato de suporte para KORNERSTONE

### Passos de Teste

Confirmar que, para contas **Kornerstone** e no **domínio Kornerstone**, o número de contato exibido no site é: **(888) 521-5111**.

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 20 arquivos
+
36
−
36
Arquivos
20
Pesquisar (por exemplo, *.vue) (F)

src/main/resources/correspo
‎ndence/templates/kornerstone‎

customer-portal-r
‎eminder-email.html‎
+1 -1

days-past-due-mo
‎nthly-email.html‎
+3 -3

days-past-due-
‎monthly-sms.txt‎
+1 -1

delinquency-150-da
‎y-offer-email.html‎
+3 -3

delinquency-150-
‎day-offer-sms.txt‎
+1 -1

delinquency-30-da
‎y-offer-email.html‎
+3 -3

delinquency-60-da
‎y-offer-email.html‎
+3 -3

delinquency-60-d
‎ay-offer-sms.txt‎
+1 -1

delinquency-90-da
‎y-offer-email.html‎
+3 -3

delinquency-90-d
‎ay-offer-sms.txt‎
+1 -1

delinquency-rem
‎inder-email.html‎
+3 -3

first-payment-de
‎fault-email.html‎
+2 -2

paid-in-ful
‎l-email.html‎
+2 -2

payment-decli
‎ne-email.html‎
+2 -2

payment-dec
‎line-sms.txt‎
+1 -1

payment-recei
‎pt-email.html‎
+1 -1

recurring-payment-
‎reminder-email.html‎
+1 -1

recurring-payment
‎-reminder-sms.txt‎
+1 -1

second-lease-opportun
‎ity-paid-account.html‎
+1 -1

settled-in-fu
‎ll-email.html‎
+2 -2

 src/main/resources/correspondence/templates/kornerstone/customer-portal-reminder-email.html 
+
1
−
1

Visualizado
@@ -238,7 +238,7 @@
			    text-align: center;
			  ">
              CS@kornerstoneliving.com<br>
              (877) 357-5474
              (888) 521-5111
            </div>
          </div>
        </div>
 src/main/resources/correspondence/templates/kornerstone/days-past-due-monthly-email.html 
+
3
−
3

Visualizado
@@ -144,12 +144,12 @@
        <br><br>We have made several attempts to reach you by phone, email and text. Your account <span
        th:text=" ${CommonDataPojo.accountPK}"></span> is now over <span
        th:text=" ${CommonDataPojo.daysDelinquent}"></span> days past due.
        <br><br> It is imperative that you reach out to our Account Management Department at <a href="tel:877-357-5474">877-357-5474</a>
        <br><br> It is imperative that you reach out to our Account Management Department at <a href="tel:888-521-5111">888-521-5111</a>
        to make your payment. You may also make your payment online by visiting <a
        th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
        target="_blank">kornerstonecredit.com</a>
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        any time. Please contact us at <a href="tel:888-521-5111">888-521-5111</a> if you are interested in surrendering
        the merchandise.
      </div>
    </div>
@@ -260,7 +260,7 @@
			    text-align: center;
			  ">
              CS@kornerstoneliving.com<br>
              (877) 357-5474
              (888) 521-5111
            </div>
          </div>
        </div>
 src/main/resources/correspondence/templates/kornerstone/days-past-due-monthly-sms.txt 
+
1
−
1

Visualizado
[(${CommonDataPojo.customerFirstName})], your acct [(${CommonDataPojo.accountPK})] is past due. Call 877-357-5474 or visit [(${CommonDataPojo.customerPortalUrl})][(${CommonDataPojo.customerPortalParameters})] to make your [(${CommonDataPojo.lastPaymentDueAmountWithTax})]. Reply STOP to unsubscribe. Uownleasing
[(${CommonDataPojo.customerFirstName})], your acct [(${CommonDataPojo.accountPK})] is past due. Call 888-521-5111 or visit [(${CommonDataPojo.customerPortalUrl})][(${CommonDataPojo.customerPortalParameters})] to make your [(${CommonDataPojo.lastPaymentDueAmountWithTax})]. Reply STOP to unsubscribe. Uownleasing
 src/main/resources/correspondence/templates/kornerstone/delinquency-150-day-offer-email.html 
+
3
−
3

Visualizado
@@ -147,9 +147,9 @@
        <br><br>Please go online to <a
        th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to pay the reduced lump sum payment of $<span th:text=" ${CommonDataPojo.balance}"></span> or call our account
        management department at <a href="tel:877-357-5474">877-357-5474</a> for more options.
        management department at <a href="tel:888-521-5111">888-521-5111</a> for more options.
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        any time. Please contact us at <a href="tel:888-521-5111">888-521-5111</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
@@ -261,7 +261,7 @@
			    text-align: center;
			  ">
              CS@kornerstoneliving.com<br>
              (877) 357-5474
              (888) 521-5111
            </div>
          </div>
        </div>
 src/main/resources/correspondence/templates/kornerstone/delinquency-150-day-offer-sms.txt 
+
1
−
1

Visualizado
75% off if you call to settle your account [(${CommonDataPojo.accountPK})] this week! Call 877-357-5474 or visit [(${CommonDataPojo.customerPortalUrl})][(${CommonDataPojo.customerPortalParameters})] to pay. Reply STOP to unsubscribe. Uownleasing
75% off if you call to settle your account [(${CommonDataPojo.accountPK})] this week! Call 888-521-5111 or visit [(${CommonDataPojo.customerPortalUrl})][(${CommonDataPojo.customerPortalParameters})] to pay. Reply STOP to unsubscribe. Uownleasing
 src/main/resources/correspondence/templates/kornerstone/delinquency-30-day-offer-email.html 
+
3
−
3

Visualizado
@@ -147,9 +147,9 @@
        <br><br> Please go online to <a
        th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to make a payment or reach out to our account management department at <a
        href="tel:877-357-5474">877-357-5474</a> for more options.
        href="tel:888-521-5111">888-521-5111</a> for more options.
        <br><br> If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        any time. Please contact us at <a href="tel:888-521-5111">888-521-5111</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
@@ -274,7 +274,7 @@
			    text-align: center;
			  ">
              CS@kornerstoneliving.com<br>
              (877) 357-5474
              (888) 521-5111
            </div>
          </div>
        </div>


 4 arquivos
+
58
−
10
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

components/korne
‎rstone/contactUs‎

inde
‎x.tsx‎
+12 -1

pa
‎ges‎

con
‎tact‎

inde
‎x.tsx‎
+12 -1

pay
‎ment‎

inde
‎x.tsx‎
+9 -6

ut
‎ils‎

helpe
‎r.tsx‎
+25 -2

 components/kornerstone/contactUs/index.tsx 
+
12
−
1

Visualizado
@@ -6,6 +6,7 @@ import styles from './index.module.scss';
import {FormikValues} from 'formik';
import {CustomerStore} from '@stores/customer';
import {NextRouter} from 'next/router';
import {getContactPhoneNumber} from '../../../utils/helper';

interface Props {
  customerStore: CustomerStore;
@@ -18,6 +19,16 @@ export const KornerstoneContactUs = ({
  customerStore,
  router,
}: Props) => {
  const contactPhoneNumber = getContactPhoneNumber(
    customerStore?.accountInfo,
    customerStore?.isKornerstoneCustomer,
  );
  const digitsOnly = contactPhoneNumber.replace(/\D/g, '');
  const telLink = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
    3,
    6,
  )}-${digitsOnly.slice(6)}`;

  return (
    <div className={styles.container}>
      <Form id="contactForm" onSubmit={formik.handleSubmit}>
@@ -36,7 +47,7 @@ export const KornerstoneContactUs = ({
            <div className={styles.phoneNumberContainer}>
              Call:
              <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                <a href="tel:+1-877-353-8696">(877) 353-8696</a>
                <a href={`tel:+1-${telLink}`}>{contactPhoneNumber}</a>
              </Button>
              Email:
              <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
 pages/contact/index.tsx 
+
12
−
1

Visualizado
@@ -13,6 +13,7 @@ import classNames from 'classnames';
import styles from './index.module.scss';
import {AccountStore} from '@stores/account';
import {KornerstoneContactUs} from 'components/kornerstone/contactUs';
import {getContactPhoneNumber} from '../../utils/helper';

interface ContactProps {
  accountStore: AccountStore;
@@ -41,6 +42,16 @@ const Contact = (props: ContactProps) => {

  const accountNumber = customerStore?.rootStore?.accountStore?.accountPk || '';

  const contactPhoneNumber = getContactPhoneNumber(
    customerStore?.accountInfo,
    customerStore?.isKornerstoneCustomer,
  );
  const digitsOnly = contactPhoneNumber.replace(/\D/g, '');
  const telLink = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
    3,
    6,
  )}-${digitsOnly.slice(6)}`;

  useEffect(() => {
    accountStore.getAnalytics('/contact');
    customerStore.getEmailCategories();
@@ -130,7 +141,7 @@ const Contact = (props: ContactProps) => {
              <div className="m-2">
                Call
                <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                  <a href="tel:+1-877-353-8696">(877) 353-8696</a>
                  <a href={`tel:+1-${telLink}`}>{contactPhoneNumber}</a>
                </Button>
              </div>
            </Col>
 pages/payment/index.tsx 
+
9
−
6

Visualizado
@@ -42,6 +42,7 @@ import {
} from '@models';
import {useToggleState} from '@utils/hooks/useToggleState';
import {useAccountStatus} from '@utils/hooks/useAccountStatus';
import {isKornerstone} from '../../utils/helper';

interface PaymentProps {
  accountStore: AccountStore;
@@ -281,6 +282,7 @@ const Payment = (props: PaymentProps) => {
        defaultCard={defaultCard}
        convenienceFee={customerStore.convenienceFee || '1'}
        isKornerstoneCustomer={customerStore.isKornerstoneCustomer}
        accountInfo={customerStore.accountInfo}
      />
      <Modal
        children={`This payment will be applied to the total balance of the lease, and will not affect your payment due on ${customerStore?.accountSummary?.nextDueDate}. Click APPLY TO EARLY PAYOFF to continue.`}
@@ -310,6 +312,7 @@ interface MakePaymentFormProps {
  defaultCard: CreditCard;
  convenienceFee: string;
  isKornerstoneCustomer: boolean;
  accountInfo?: {company?: string} | null;
}

const MakePaymentForm = (props: MakePaymentFormProps) => {
@@ -327,6 +330,7 @@ const MakePaymentForm = (props: MakePaymentFormProps) => {
    defaultCard,
    convenienceFee,
    isKornerstoneCustomer,
    accountInfo,
  } = props;

  const [currentCcChecked, setCurrentCcChecked] = useState(null);
@@ -334,17 +338,16 @@ const MakePaymentForm = (props: MakePaymentFormProps) => {

  const router = useRouter();

  const isKornerstoneDomain =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('kornerstone');

  const shouldShowConvenienceFeeMessage = () => {
    const isKornerstone = isKornerstoneCustomer || isKornerstoneDomain;
    const isKornerstoneContext = isKornerstone(
      accountInfo,
      isKornerstoneCustomer,
    );
    const selectedMethod = formik.values.selectedPaymentMethod;

    return (
      selectedMethod?.type === 'cc' &&
      (!isKornerstone || selectedMethod?.ccInfo?.ccVendor === 'OMNIFUND')
      (!isKornerstoneContext || selectedMethod?.ccInfo?.ccVendor === 'OMNIFUND')
    );
  };

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---

## UOWN | Portal do Cliente | Atualizar contato de suporte para KORNERSTONE

### Scenario 1 – Exibição do número de suporte correto para contas Kornerstone no domínio Kornerstone

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente está navegando no domínio <Domain>
- When o cliente acessa a página de Contato
- Then o número de telefone de suporte exibido deve ser <PhoneNumber>

**Examples**

| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |
| UOWN        | Uown        | (877) 353-8696 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

Screenshot

**PASS**

---

### Scenario 2 – Ação de chamada utiliza o número de suporte correto para Kornerstone

```markdown
- Given que o cliente acessa o Portal do Cliente utilizando uma conta do tipo <Merchant>
- And que o cliente está navegando no domínio <Domain>
- When o cliente clica no link de telefone de suporte
- Then a ação de chamada deve utilizar o número <PhoneNumber>

**Examples**

| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

Screenshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1


## UOWN | Customer Portal | Update Support Contact for KORNERSTONE
---
### Scenario 1 – Display of the correct support phone number for Kornerstone accounts on the Kornerstone domain

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer is browsing on the <Domain> domain
- When the customer accesses the Contact page
- Then the displayed support phone number must be <PhoneNumber>

**Examples**

| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |
| UOWN        | Uown        | (877) 353-8696 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

Screenshot

### **PASS**

---
### Scenario 2 – Call action uses the correct support phone number for Kornerstone

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer is browsing on the <Domain> domain
- When the customer clicks on the support phone link
- Then the call action must use the phone number <PhoneNumber>

**Examples**

| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```

Screenshot

### **PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in stg


## UOWN | Customer Portal | Update Support Contact for KORNERSTONE
---
### Scenario 1 – Display of the correct support phone number for Kornerstone accounts on the Kornerstone domain

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer is browsing on the <Domain> domain
- When the customer accesses the Contact page
- Then the displayed support phone number must be <PhoneNumber>

Examples:
| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |
| UOWN        | Uown        | (877) 353-8696 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```



### **PASS**

---
### Scenario 2 – Call action uses the correct support phone number for Kornerstone

```markdown
- Given the customer accesses the Customer Portal using an account of type <Merchant>
- And the customer is browsing on the <Domain> domain
- When the customer clicks on the support phone link
- Then the call action must use the phone number <PhoneNumber>

Examples:
| Merchant    | Domain      | PhoneNumber    |
| ----------- | ----------- | -------------- |
| KORNERSTONE | kornerstone | (888) 521-5111 |
| UOWN        | Uown        | (877) 353-8696 |

| Data      | Value      |
| --------- | ---------- |
| LeadPk    |            |
| AccountPk |            |
| Merchant  | <Merchant> |
```



### **PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------