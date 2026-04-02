---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1189


UOWN | Origination | Add banking and credit card BIN information to application flow


Synopsis

The current application flow does not collect, in a structured manner, the information required to support the underwriting logic for the Kornerstone integration.

Banking data (optional) fields (Routing Number and Account Number) and a credit card BIN field (first 6 digits) (optional) must be added to the send application flow, allowing this information to be used for product routing and eligibility while respecting the differences between UOWN and Kornerstone flows.



Feature Request | Business Requirements

New optional fields added to the application flow
Banking data
      Routing Number
      Account Number
Credit card data
Credit Card BIN (first 6 digits)
    It’s important to note that if the user enters the account number and routing number on the Employment page, they should not be required or displayed on the CC/ACH page in the second part of the application.
A text will be provided to be added below the field; once we reach this point, please check what the final wording will be.

![alt text](image.png)

![alt text](image-1.png)


Testing Steps
Overview
Test bank account validation (routing number 9 digits, account number 8-17 digits), credit card BIN validation (6-8 digits), UI label updates, and bank account source tracking (SEND_APP, SUBMIT_APP, SERVICING, CUSTOMER_PORTAL).
Note: During the complete application flow, it is necessary to confirm that bank account information will not appear again if it was filled previously on sendApplication.
UI Testing - Send Application Form
1. Bank Account Section Labels

Navigate to send application form → Employment and Financial Information panel
Locate bank account section

Expected: Labels show "Bank", placeholders show "(Optional)"

2. Credit Card BIN Field

Navigate to send application form → Employment and Financial Information panel
Locate credit card BIN field

Expected:

Label: "First 6 Digits of Credit Card"
Placeholder: "First 6 Digits of Credit Card (Optional)"
Tooltip icon visible next to label
Tooltip displays: "What is a BIN?" (bold) and explanation text
Input accepts 6-8 digits (maxLength = 8)
![alt text](image-2.png)
Backend Validation Testing
4. Bank Routing Number Validation

Submit send application with routing number = 8 digits

Expected: Error "Invalid routing number. Received [value]"
Submit with routing number = 9 digits (valid)

Expected: Validation passes
Submit with routing number = 10 digits

Expected: Error "Invalid routing number. Received [value]"
Submit with non-numeric routing number

Expected: Error "Invalid routing number. Received [value]"

5. Bank Account Number Validation

Submit send application with account number = 7 digits

Expected: Error "Invalid Bank Account Number. Received [value]"
Submit with account number = 8 digits (valid)

Expected: Validation passes
Submit with account number = 17 digits (valid)

Expected: Validation passes
Submit with account number = 18 digits

Expected: Error "Invalid Bank Account Number. Received [value]"
Submit with non-numeric account number

Expected: Error "Invalid Bank Account Number. Received [value]"

6. Credit Card BIN Validation

Submit send application with BIN = 5 digits

Expected: Error "Invalid Credit Card bin. Received [value]"
Submit with BIN = 6 digits (valid)

Expected: Validation passes
Submit with BIN = 8 digits (valid)

Expected: Validation passes
Submit with BIN = 9 digits

Expected: Error "Invalid Credit Card bin. Received [value]"
Submit with non-numeric BIN

Expected: Error "Invalid Credit Card bin. Received [value]"

Bank Account Source Testing
7. Send Application Source (SEND_APP)

Submit send application form with bank account information
Query database for created bank account

Expected: bankAccountInfo.source = 'SEND_APP'


8. Submit Application Source (SUBMIT_APP)

Complete application submission with bank account information
Query database for created bank account

Expected: bankAccountInfo.source = 'SUBMIT_APP'


9. Servicing Portal Source (SERVICING)

Add bank account via servicing portal (username ≠ "customer portal")
Query database for created bank account

Expected: bankAccountInfo.source = 'SERVICING'


10. Customer Portal Source (CUSTOMER_PORTAL)

Add bank account via customer portal (website, username = "customer portal")
Query database for created bank account

Expected: bankAccountInfo.source = 'CUSTOMER_PORTAL'

---

---

---

# UOWN | Origination

## Adicionar informações bancárias e BIN de cartão de crédito ao fluxo de aplicação

## Sinopse

O fluxo atual de aplicação não coleta, de forma estruturada, as informações necessárias para suportar a lógica de **underwriting** da integração com a **Kornerstone**.

Devem ser adicionados ao fluxo de **envio da aplicação (Send Application)** os seguintes campos **opcionais**:

- **Dados bancários**
  - Routing Number
  - Account Number

- **Dados de cartão de crédito**
  - BIN do cartão de crédito (primeiros 6 dígitos)

Essas informações permitirão:

- Roteamento correto de produtos
- Avaliação de elegibilidade
- Respeito às diferenças entre os fluxos da **UOWN** e da **Kornerstone**

### Regra importante

Se o usuário **informar Routing Number e Account Number na página de Emprego**, esses campos **não devem ser exibidos nem exigidos novamente** na página **CC/ACH**, na segunda parte da aplicação.

Um texto informativo será adicionado abaixo dos campos (a redação final será validada posteriormente).

---

## Requisitos de Negócio (Feature Request)

### Novos campos opcionais no fluxo de aplicação

#### Dados bancários

- **Routing Number**
- **Account Number**

#### Dados de cartão de crédito

- **Credit Card BIN**
  - Primeiros **6 dígitos** do cartão

---

## Testes

### Visão Geral

Validar:

- Regras de validação de dados bancários
- Validação do BIN do cartão
- Atualização de labels e placeholders na UI
- Rastreamento da **origem do cadastro bancário**
- Garantir que os dados bancários **não reapareçam** caso já tenham sido informados anteriormente no fluxo de _sendApplication_

---

## Testes de Interface (UI)

### 1. Labels da seção de Conta Bancária

**Passos**

1. Acessar o formulário **Send Application**
2. Ir até o painel **Employment and Financial Information**
3. Localizar a seção de conta bancária

**Resultado esperado**

- Labels exibem: **"Bank"**
- Placeholders exibem: **"(Optional)"**

---
### 2. Campo de BIN do Cartão de Crédito

**Passos**

1. Acessar o formulário **Send Application**
2. Ir até o painel **Employment and Financial Information**
3. Localizar o campo de BIN do cartão

**Resultado esperado**

- Label: **"First 6 Digits of Credit Card"**
- Placeholder: **"First 6 Digits of Credit Card (Optional)"**
- Ícone de tooltip visível ao lado do label
- Tooltip exibe:
  - **"What is a BIN?"** (em negrito)
  - Texto explicativo abaixo

- Campo aceita **6 a 8 dígitos**
- `maxLength = 8`

---

## Testes de Validação Backend

### 4. Validação do Routing Number

| Entrada            | Resultado esperado                                 |
| ------------------ | -------------------------------------------------- |
| 8 dígitos          | Erro: `"Invalid routing number. Received [value]"` |
| 9 dígitos          | Validação passa                                    |
| 10 dígitos         | Erro                                               |
| Valor não numérico | Erro                                               |

---
### 5. Validação do Account Number

| Entrada            | Resultado esperado                                      |
| ------------------ | ------------------------------------------------------- |
| 7 dígitos          | Erro: `"Invalid Bank Account Number. Received [value]"` |
| 8 dígitos          | Validação passa                                         |
| 17 dígitos         | Validação passa                                         |
| 18 dígitos         | Erro                                                    |
| Valor não numérico | Erro                                                    |

---
### 6. Validação do BIN do Cartão de Crédito

| Entrada            | Resultado esperado                                  |
| ------------------ | --------------------------------------------------- |
| 5 dígitos          | Erro: `"Invalid Credit Card bin. Received [value]"` |
| 6 dígitos          | Validação passa                                     |
| 8 dígitos          | Validação passa                                     |
| 9 dígitos          | Erro                                                |
| Valor não numérico | Erro                                                |

---

## Testes de Origem da Conta Bancária

### 7. Origem: SEND_APP

**Passos**

- Enviar aplicação com dados bancários preenchidos
- Consultar o banco de dados

**Resultado esperado**

```text
bankAccountInfo.source = 'SEND_APP'
```

---
### 8. Origem: SUBMIT_APP

**Passos**

- Completar a submissão da aplicação com dados bancários
- Consultar o banco de dados

**Resultado esperado**

```text
bankAccountInfo.source = 'SUBMIT_APP'
```

---
### 9. Origem: SERVICING

**Passos**

- Adicionar conta bancária via portal de **Servicing**
- Usuário ≠ "customer portal"
- Consultar o banco de dados

**Resultado esperado**

```text
bankAccountInfo.source = 'SERVICING'
```

---
### 10. Origem: CUSTOMER_PORTAL

**Passos**

- Adicionar conta bancária via **Customer Portal**
- Usuário = "customer portal"
- Consultar o banco de dados

**Resultado esperado**

```text
bankAccountInfo.source = 'CUSTOMER_PORTAL'
```

---

---

Alteracoes dev:

1 arquivo

- 1
  −
  0
  server.js
- 1
  −
  0

Visualizado
@@ -542,6 +542,7 @@ const proxy = {

      proxyReq.setHeader('X-Client-IP', clientIp);
      proxyReq.setHeader('username', username);
      proxyReq.setHeader('X-Source', 'servicing');
      proxyReq.setHeader('Authorization', env?.API_KEY);

      if (!req.body || !Object.keys(req.body).length) {

- 2
  −
  0

Visualizado
@@ -316,6 +316,7 @@ const proxy = {
proxyReq.setHeader('Authorization', env?.API_KEY);
proxyReq.setHeader('Content-Length', Buffer.byteLength(''));
proxyReq.setHeader('username', 'customer portal');
proxyReq.setHeader('X-Source', 'customer-portal');
proxyReq.write('');
} else {
logger.info('77777777777777 Request body included', {body:req?.body});
@@ -325,6 +326,7 @@ const proxy = {
proxyReq.setHeader('Authorization', env?.API_KEY);
proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
proxyReq.setHeader('username', 'customer portal');
proxyReq.setHeader('X-Source', 'customer-portal');
proxyReq.write(bodyData);
} else {
logger.error('FATAL ERROR: Content type is not application/json.');

5 arquivos

- 87
  −
  0
  Arquivos
  5
  Pesquisar (por exemplo, \*.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

con
‎fig‎

LosRequestMessageConstr
‎aintValidatorConfig.java‎
+20 -0

po
‎jo‎

Application
‎Request.java‎
+13 -0

Reques
‎t.java‎
+1 -0

service/a
‎pplication‎

SubmitApplicat
‎ionService.java‎
+1 -0

vali
‎dator‎

LosRequestMessageCon
‎straintValidator.java‎
+52 -0

src/main/java/com/uownleasing/svc/config/LosRequestMessageConstraintValidatorConfig.java

- 20
  −
  0

Visualizado
@@ -105,5 +105,25 @@ public class LosRequestMessageConstraintValidatorConfig {
public boolean verifyMinimumLeaseValue() {
return configurationManagement.getBoolean(CONFIGURATION_PATH + "verify.minimum.lease.value", true);
}

    public int getBankRoutingNumberLength() {
        return configurationManagement.getInteger(CONFIGURATION_PATH + "bank.routing.number.length", 9);
    }

    public int getBankAccountNumberMinLength() {
        return configurationManagement.getInteger(CONFIGURATION_PATH + "bank.account.number.min.length", 8);
    }

    public int getBankAccountNumberMaxLength() {
        return configurationManagement.getInteger(CONFIGURATION_PATH + "bank.account.number.max.length", 17);
    }

    public int getCreditCardBinMinLength() {
        return configurationManagement.getInteger(CONFIGURATION_PATH + "credit.card.bin.min.length", 6);
    }

    public int getCreditCardBinMaxLength() {
        return configurationManagement.getInteger(CONFIGURATION_PATH + "credit.card.bin.max.length", 8);
    }

}
src/main/java/com/uownleasing/svc/pojo/ApplicationRequest.java

- 13
  −
  0

Visualizado
@@ -467,10 +467,22 @@ public class ApplicationRequest extends Request {
leadInfo.setSource(getSource());
leadInfo.setTraffic(traffic);
leadInfo.setCategory(category);
if(org.apache.commons.lang3.StringUtils.isNotBlank(getMainCreditCardBin())) {
leadInfo.setCreditCardBin(getMainCreditCardBin());
}
}
return leadInfo;
}

    @Override
    public BankAccountInfo toBankAccountInfo() {
        BankAccountInfo bankAccountInfo = super.toBankAccountInfo();
        if (bankAccountInfo != null) {
            bankAccountInfo.setBankAccountSource(BankAccountSource.SEND_APP);
        }
        return bankAccountInfo;
    }

    public CustomerInfo toCustomerInfo(){
        if(getCustomerInfo() != null){
            customerInfo.setCustomerPk(0);

@@ -552,6 +564,7 @@ public class ApplicationRequest extends Request {
return null;
}

    @Override
    public String toString() {
        return "ApplicationRequest{" +

src/main/java/com/uownleasing/svc/pojo/Request.java

- 1
  −
  0

Visualizado
@@ -70,6 +70,7 @@ public class Request {
private LocalDate mainBankAccountOpenedDate;
private Duration mainBankAccountDuration;
private BankAccountType mainBankAccountType;
private String mainCreditCardBin;

    private EmploymentInfo employmentInfo;
    private LocalDate mainLastPayDate;

src/main/java/com/uownleasing/svc/service/application/SubmitApplicationService.java

- 1
  −
  0

Visualizado
@@ -179,6 +179,7 @@ public class SubmitApplicationService {
bankAccountInfo.setBankAccountType(request.getBankAccountType());
bankAccountInfo.setBankName(request.getBankName());
bankAccountInfo.setAutoPay(true);
bankAccountInfo.setBankAccountSource(BankAccountSource.SUBMIT_APP);
bankAccountInfo.setName(StringUtils.isNotBlank(request.getBankAccountCustomerFirstName()) && StringUtils.isNotBlank(request.getBankAccountCustomerLastName()) ? request.getBankAccountCustomerFirstName() + " " + request.getBankAccountCustomerLastName() : "");
List<LosBlackList> results = blackListService.checkBlackList(null,null, null, null, null, null, request.getBankAccountNumber(), request.getBankRoutingNumber(), null, null);
if( results.size() > 0) {
src/main/java/com/uownleasing/svc/validator/LosRequestMessageConstraintValidator.java

- 52
  −
  0

Visualizado
@@ -253,6 +253,9 @@ public class LosRequestMessageConstraintValidator implements ConstraintValidator
throw new InvalidFieldsException("emailAddress", "EmailAddress is invalid. Received " + applicationRequest.getEmailAddress());
}

            validateBankAccount(applicationRequest);
            validateCreditCardBin(applicationRequest);

            populateStateFromZipCode(applicationRequest);

            validateAddressFormat(applicationRequest);

@@ -616,4 +619,53 @@ public class LosRequestMessageConstraintValidator implements ConstraintValidator
}
}

    private void validateBankAccount(ApplicationRequest applicationRequest) {
        if (StringUtils.isNotBlank(applicationRequest.getMainBankRoutingNumber())) {
            validateRoutingNumber(applicationRequest.getMainBankRoutingNumber());
        }
        if (StringUtils.isNotBlank(applicationRequest.getMainBankAccountNumber())) {
            validateAccountNumber(applicationRequest.getMainBankAccountNumber());
        }
    }

    private void validateRoutingNumber(String routingNumber) {
        if (!NumberUtils.isParsable(routingNumber) || !isRoutingNumberLengthValid(routingNumber)) {
            throw new InvalidFieldsException("mainBankRoutingNumber", "Invalid routing number. Received " + routingNumber);
        }
    }

    private void validateAccountNumber(String accountNumber) {
        if (!NumberUtils.isParsable(accountNumber) || !isAccountNumberInValidRange(accountNumber)) {
            throw new InvalidFieldsException("mainBankAccountNumber", "Invalid Bank Account Number. Received " + accountNumber);
        }
    }

    private boolean isRoutingNumberLengthValid(String routingNumber) {
        int expectedLength = config.getBankRoutingNumberLength();
        return routingNumber.length() == expectedLength;
    }

    private boolean isAccountNumberInValidRange(String accountNumber) {
        int minLength = config.getBankAccountNumberMinLength();
        int maxLength = config.getBankAccountNumberMaxLength();
        int accountNumberLength = accountNumber.length();
        return accountNumberLength >= minLength && accountNumberLength <= maxLength;
    }

    private void validateCreditCardBin(ApplicationRequest applicationRequest) {
        if (StringUtils.isNotBlank(applicationRequest.getMainCreditCardBin())) {
            String creditCardBin = applicationRequest.getMainCreditCardBin();
            if (!NumberUtils.isParsable(creditCardBin) || !isCreditCardBinInValidRange(creditCardBin)) {
                throw new InvalidFieldsException("mainCreditCardBin", "Invalid Credit Card bin. Received " + creditCardBin);
            }
        }
    }

    private boolean isCreditCardBinInValidRange(String creditCardBin) {
        int minLength = config.getCreditCardBinMinLength();
        int maxLength = config.getCreditCardBinMaxLength();
        int creditCardBinLength = creditCardBin.length();
        return creditCardBinLength >= minLength && creditCardBinLength <= maxLength;
    }

}

4 arquivos

- 117
  −
  1
  Arquivos
  4
  Pesquisar (por exemplo, \*.vue) (F)

components/send-
‎application-form‎

pan
‎els‎

employment-and-finan
‎cial-information.tsx‎
+89 -1

inde
‎x.tsx‎
+14 -0

mod
‎els‎

send-applicat
‎ion-request.ts‎
+3 -0

sty
‎les‎

global
‎s.scss‎
+11 -0

components/send-application-form/panels/employment-and-financial-information.tsx

- 89
  −
  1

Visualizado
import {Col, Row} from 'reactstrap';
import {InputField} from '@uownleasing/common-ui';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import {
formatDate,
getDate,
@@ -20,6 +21,9 @@ export interface EmploymentAndFinancialInfoValue {
mainLastPayDate: string;
mainNextPayDate: string;
mainMonthlyIncome: any;
mainBankAccountNumber: string;
mainBankRoutingNumber: string;
mainCreditCardBin: string;
}

export const payScheduleMapping = {
@@ -106,6 +110,7 @@ const EmploymentAndFinancialInformationPanel = ({
formik.setFieldValue('mainPayFrequency', paymentFrequency);
}}
isLabelBold={true}
isRequired
/>
</Col>
</Row>
@@ -138,6 +143,7 @@ const EmploymentAndFinancialInformationPanel = ({
formik.setFieldValue('mainNextPayDate', suggestedNextPayDate);
}}
isLabelBold={true}
isRequired
/>
</Col>
<Col
@@ -145,7 +151,7 @@ const EmploymentAndFinancialInformationPanel = ({
lg={6}
className={classNames(
styles.mainNextPayDate,
'd-flex flex-row justify-content-between align-items-center',
'd-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0',
)}>
<InputField
formik={formik}
@@ -158,6 +164,7 @@ const EmploymentAndFinancialInformationPanel = ({
label="Next Pay Date"
className={styles?.panel**input}
isLabelBold={true}
isRequired
/>
</Col>
</Row>
@@ -181,6 +188,87 @@ const EmploymentAndFinancialInformationPanel = ({
isLabelBold={true}
isNumbersOnly={true}
maxLength={6}
isRequired
/>
</Col>
</Row>
<Row className="d-flex align-items-center mt-4 pt-3">
<Col xs={12}>
<hr className="my-3" />
<div className="text-muted mb-0" style={{fontSize: '0.9rem', lineHeight: '1.5'}}>
<div style={{fontWeight: 500, marginBottom: '0.5rem'}}>
<strong>Want access to longer-term payment plans? (Optional)</strong>
</div>
<div>
You can provide your bank account and routing number below to be considered. You may continue your application without entering this information.
</div>
</div>
</Col>
</Row>
<Row className="d-flex align-items-center mt-4 pt-3">
<Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
<InputField
formik={formik}
data-nid-target="mainBankRoutingNumber"
name="mainBankRoutingNumber"
type="text"
label="Bank Routing Number"
placeholder="Bank Routing Number (Optional)"
className={styles?.panel**input}
isLabelBold={true}
isNumbersOnly={true}
maxLength={9}
/>
</Col>
<Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center">
<InputField
            formik={formik}
            data-nid-target="mainBankAccountNumber"
            name="mainBankAccountNumber"
            type="text"
            label="Bank Account Number"
            placeholder="Bank Account Number (Optional)"
            className={styles?.panel__input}
            isLabelBold={true}
            isNumbersOnly={true}
            maxLength={17}
          />
</Col>
</Row>
<Row className="d-flex align-items-center mt-4 pt-3">
<Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center">
<InputField
formik={formik}
data-nid-target="mainCreditCardBin"
name="mainCreditCardBin"
type="text"
label="First 6 Digits of Credit Card"
labelIcon={faQuestionCircle}
labelIconDescription={
<div className="bin-tooltip-content" style={{textAlign: 'left'}}>
<div style={{fontWeight: 'bold', marginBottom: '0.25rem'}}>
What is a BIN?
</div>
<div>
The Bank Identification Number (BIN) is the first 6 digits of your credit card. This optional information helps us identify your card issuer.
</div>
</div>
}
labelIconColor="#6c757d"
placeholder="First 6 Digits of Credit Card (Optional)"
className={styles?.panel\_\_input}
isLabelBold={true}
isNumbersOnly={true}
maxLength={6}
/>
</Col>
</Row>

1 arquivo

- 2
  −
  0
  src/main/java/com/uownleasing/common/pojo/LeadInfo.java
- 2
  −
  0

Visualizado
@@ -57,6 +57,8 @@ public class LeadInfo implements Serializable {
private String prepaidCardNumber;
private String prepaidCardExpiry;//mm/yy
private String prepaidCardCvv;
@Column(length = 6)
private String creditCardBin;
@LoggableCreated
private String customerState;
@Transient

2 arquivos

- 8
  −
  0
  Arquivos
  2
  Pesquisar (por exemplo, \*.vue) (F)

src/main/java/com/
‎uownleasing/common‎

enume
‎ration‎

BankAccount
‎Source.java‎
+5 -0

po
‎jo‎

BankAccoun
‎tInfo.java‎
+3 -0

src/main/java/com/uownleasing/common/enumeration/BankAccountSource.java 0 → 100644

- 5
  −
  0

Visualizado
package com.uownleasing.common.enumeration;

public enum BankAccountSource {
SEND_APP, SUBMIT_APP
}
src/main/java/com/uownleasing/common/pojo/BankAccountInfo.java

- 3
  −
  0

Visualizado
@@ -45,6 +45,9 @@ public class BankAccountInfo implements Serializable {
private BankAccountType bankAccountType = BankAccountType.CHECKING;
@Enumerated(EnumType.STRING)
private Duration bankAccountDuration;
@Column(name = "source")
@Enumerated(EnumType.STRING)
private BankAccountSource bankAccountSource;
@LoggableCreated
@LoggableUpdated
private Boolean autoPay = Boolean.TRUE;

2 arquivos

- 2
  −
  2
  Arquivos
  2
  Pesquisar (por exemplo, \*.vue) (F)

src/main/java/com/
‎uownleasing/common‎

enume
‎ration‎

BankAccount
‎Source.java‎
+1 -1

po
‎jo‎

LeadIn
‎fo.java‎
+1 -1

src/main/java/com/uownleasing/common/enumeration/BankAccountSource.java

- 1
  −
  1

Visualizado
package com.uownleasing.common.enumeration;

public enum BankAccountSource {
SEND_APP, SUBMIT_APP
SEND_APP, SUBMIT_APP, SERVICING, CUSTOMER_PORTAL
}
src/main/java/com/uownleasing/common/pojo/LeadInfo.java

- 1
  −
  1

Visualizado
@@ -57,7 +57,7 @@ public class LeadInfo implements Serializable {
private String prepaidCardNumber;
private String prepaidCardExpiry;//mm/yy
private String prepaidCardCvv;
@Column(length = 6)
@Column(length = 8)
private String creditCardBin;
@LoggableCreated
private String customerState;

1 arquivo

- 8
  −
  3
  src/main/java/com/uownleasing/svc/common/service/BankAccountService.java
- 8
  −
  3

Visualizado
@@ -3,10 +3,7 @@ package com.uownleasing.svc.common.service;
import com.uownleasing.common.enumeration._;
import com.uownleasing.common.pojo._;
import com.uownleasing.svc.common.config.SvThreadAttributes;
import com.uownleasing.svc.common.db.entity._;
import com.uownleasing.svc.common.db.repository._;

import com.uownleasing.svc.common.exception.\*;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvBankAccount;
import com.uownleasing.svc.common.db.entity.SvCustomer;
@@ -55,6 +52,14 @@ public class BankAccountService {
bankAccountInfo.setAccountPk(svCustomer.getAccount().getPk());
}

        bankAccountInfo.setBankAccountSource(
            Optional.ofNullable(bankAccountInfo.getBankAccountSource())
                .orElseGet(() -> switch (SvThreadAttributes.getUsername().toLowerCase()) {
                    case "customer portal" -> BankAccountSource.CUSTOMER_PORTAL;
                    default -> BankAccountSource.SERVICING;
                })
        );

        SvBankAccount bankAccount;

        if(bankAccountInfo.getBankAccountPk() > 0) {

1 arquivo

- 2
  −
  0
  src/main/java/com/uownleasing/common/pojo/LeadInfo.java
- 2
  −
  0

Visualizado
@@ -9,6 +9,7 @@ import org.apache.commons.lang3.\*;
import org.springframework.util.CollectionUtils;

import javax.persistence._;
import javax.validation.constraints.Pattern;
import java.io.Serializable;
import java.math._;
import java.time.\*;
@@ -60,6 +61,7 @@ public class LeadInfo implements Serializable {
private String prepaidCardNumber;
private String prepaidCardExpiry;//mm/yy
private String prepaidCardCvv;
@Pattern(regexp = "^\\d{6,8}$", message = "BIN must be between 6 and 8 digits")
@Column(length = 8)
private String creditCardBin;
@LoggableCreated

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

---
### Scenario 1: Envio da aplicação sem preenchimento de dados opcionais
```markdown
- Given que o usuário está preenchendo o formulário Send Application
- And que o painel Employment and Financial Information está exibido
- When nenhum dado bancário ou BIN de cartão de crédito é informado
- Then a aplicação deve ser enviada com sucesso
- And o fluxo deve continuar sem erros de validação
```

Examples:| LeadPk | Merchant |
| ----------- | ----------- |
| 14684 | Tire Agent |
| 14685 | KS1337 |

Screenshot

**PASS**

---
### Scenario 2: Visualização dos campos bancários como opcionais
```markdown
- Given que o usuário acessa o painel Employment and Financial Information
- When a seção de dados bancários é renderizada
- Then o campo Bank Routing Number deve estar visível
- And o campo Bank Account Number deve estar visível
- And os labels devem indicar que os campos são opcionais
- And os placeholders devem conter "(Optional)"
```

Examples:| LeadPk | Merchant |
| ----------- | ----------- |
| 14684 | Tire Agent |
| 14685 | KS1337 |


Screenshot

**PASS**

---
### Scenario 3: Preenchimento de dados bancários válidos
```markdown
- Given que o usuário opta por informar dados bancários
- When um Routing Number com exatamente 9 dígitos numéricos é informado
- And um Account Number com exatamente 17 dígitos numéricos é informado
- Then a aplicação deve ser enviada com sucesso
- And os dados bancários devem ser aceitos
```

Examples:| LeadPk | Merchant  RoutingNumber | AccountNumber |
| -------- | -------- | -------- | -------- |
| 14686 | Daniel's Jewelers | 021000021 | 12345678901234567 |
| 14688 | KS1337 | 021000021 | 12345678901234567 |

Screenshot

**PASS**

---
### Scenario 4: Validação de Routing Number fora do limite permitido
```markdown
- Given que o usuário informa um Bank Routing Number
- When o Routing Number possui menos ou mais de 9 dígitos ou não é numérico
- Then a aplicação não deve ser enviada
- And a mensagem de erro "Invalid routing number" deve ser exibida
```

Examples:
| RoutingNumber |
| ------------- |
| 12345678 | O cliente nao sabe o que aconteceu aqui porque a mensagem nao informa, somente olhando o response é possivel saber o que foi preenchido errado
| 1234567890 | Campo não aceita mais que 9 dígitos
| ABC123 |

Screenshot

**PASS**

---
### Scenario 5: Validação de Account Number fora do intervalo permitido
```markdown
- Given que o usuário informa um Bank Account Number
- When o Account Number possui menos de 8 ou mais de 17 dígitos ou não é numérico
- Then a aplicação não deve ser enviada
- And a mensagem de erro "Invalid Bank Account Number" deve ser exibida
```

Examples:
| AccountNumber |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1234567       | O cliente nao sabe o que aconteceu aqui porque a mensagem nao informa, somente olhando o response é possivel saber o que foi preenchido errado |
| ABC123        | O cliente nao sabe o que aconteceu aqui porque a mensagem nao informa, somente olhando o response é possivel saber o que foi preenchido errado |
| 123456789012345678 | Campo não aceita mais que 9 dígitos

Screenshot

**PASS**

---
### Scenario 6: Dados bancários não reaparecem na etapa CC/ACH
```markdown
- Given que o usuário informou dados bancários na etapa Employment
- When o fluxo da aplicação avança para a etapa CC/ACH
- Then o campo Bank Routing Number não deve ser exibido
- And o campo Bank Account Number não deve ser exibido
```

Examples:| LeadPk   |
| ------ |
| 14686 |


Screenshot

**PASS**

---
### Scenario 7: Visualização do campo BIN como opcional
```markdown
- Given que o usuário acessa o painel Employment and Financial Information
- When o campo First 6 Digits of Credit Card é exibido
- Then o campo deve estar marcado como opcional
- And o placeholder deve conter "(Optional)"
```

**PASS**

---
### Scenario 8: Exibição do tooltip informativo do BIN```markdown
- Given que o campo de BIN do cartão está visível
- When o usuário clica no ícone de tooltip
- Then o título "What is a BIN?" deve ser exibido
- And uma explicação descrevendo os primeiros dígitos do cartão de crédito deve ser apresentada
- And a informação deve indicar que o campo é opcional
```

Screenshot

**PASS**

---
### Scenario 9: Preenchimento de BIN válido```markdown
- Given que o usuário informa um BIN de cartão de crédito
- When o BIN contém 6 dígitos numéricos
- Then a aplicação deve ser enviada com sucesso
- And o valor do BIN deve ser aceito
```

Examples:| LeadPk   | BIN      |
| ------ | ------ |
| 14686 |  601100   |
| 14688 | 514631   |

Screenshot

**PASS**

---
### Scenario 10: Validação de BIN fora do limite permitido
```markdown
- Given que o usuário informa um BIN de cartão de crédito
- When o BIN possui menos de 6 ou mais de 8 dígitos ou não é numérico
- Then a aplicação não deve ser enviada
- And a mensagem de erro "Invalid Credit Card bin" deve ser exibida
```

Examples:
| BIN       |
| --------- |
| 12345     |

Screenshot

**PASS**

---
### Scenario 11: Restrição de tamanho máximo no campo BIN
```markdown
- Given que o usuário digita valores no campo de BIN do cartão de crédito
- When é tentado inserir mais de 6 dígitos
- Then o campo não deve aceitar caracteres adicionais
```

Examples:| BIN       |
| --------- |
| 123456789 |

**PASS**

---
### Scenario 12: Registro da origem da conta bancária no Send Application
```markdown
- Given que os dados bancários são informados durante o Send Application
- When a conta bancária é persistida
- Then a origem da conta bancária deve ser registrada como SEND_APP
```

Examples:| Source   | LeadPk | RoutingNumber | AccountNumber |
| -------- | -------- | -------- | -------- |
| SEND_APP | 14686 | 021000021 | 12345678901234567 |
| SEND_APP | 14691 | 984165132 | 12345678901234567 |

Screenshot

**PASS**

---
### Scenario 13: Registro da origem da conta bancária no Submit Application
```markdown
- Given que os dados bancários são informados durante o Submit Application
- When a conta bancária é persistida
- Then a origem da conta bancária deve ser registrada como SUBMIT_APP
```

Examples:| Source   | LeadPk | RoutingNumber | AccountNumber |
| -------- | -------- | -------- | -------- |
| SUBMIT_APP | 14678 | 123456780 | 160781900000 |
| SUBMIT_APP | 14699 | 121000021 | 12345678901234567 |

Screenshot

**PASS**

---
### Scenario 14: Registro da origem da conta bancária via Servicing Portal```markdown
- Given que uma conta bancária é adicionada via Servicing Portal
- When a conta bancária é persistida
- Then a origem da conta bancária deve ser registrada como SERVICING
```

Examples:| Source   | AccountPk | RoutingNumber | AccountNumber |
| -------- | -------- | -------- | -------- |
| SERVICING | 11184 | 564897513 | 65459 |
| SERVICING | 11180 | 753641892 | 546701 |

Screenshot
**PASS**

---
### Scenario 15: Registro da origem da conta bancária via Customer Portal
```markdown
- Given que uma conta bancária é adicionada via Customer Portal
- When a conta bancária é persistida
- Then a origem da conta bancária deve ser registrada como CUSTOMER_PORTAL
```

Examples:| Source   | AccountPk | RoutingNumber | AccountNumber |
| -------- | -------- | -------- | -------- |
| CUSTOMER_PORTAL | 11184 | 564870216 | 65713484 |
| CUSTOMER_PORTAL | 11180 | 731587024 | 26413786 |

Screenshot

**PASS**

---
### Scenario 16: Preenchimento simultâneo de dados bancários e BIN válidos
```markdown
- Given que o usuário preenche simultaneamente os dados bancários e o BIN do cartão de crédito
- When um Routing Number válido, um Account Number válido e um BIN válido são informados
- Then a aplicação deve ser enviada com sucesso
- And tanto os dados bancários quanto o BIN devem ser aceitos e persistidos
```

Examples:| LeadPk | Merchant  RoutingNumber | AccountNumber | First 6 digits o CC |
| -------- | -------- | -------- | -------- | -------- |
| 14686 | Daniel's Jewelers | 021000021 | 12345678901234567 | 601100 |
| 14688 | KS1337 | 021000021 | 12345678901234567 | 514631 |

Screenshot

**PASS**

---

### Scenario 17: Preenchimento de Account Number válido com tamanho mínimo permitido

```markdown
- Given que o usuário opta por informar dados bancários
- When um Account Number com exatamente 8 dígitos numéricos é informado
- Then a aplicação deve ser enviada com sucesso
- And os dados bancários devem ser aceitos
```

Examples:

| LeadPk | Merchant | RoutingNumber | AccountNumber |
| ------ | -------- | ------------- | ------------- |
| 14701  | KS1337   | 021000021     | 12345678      |

Screenshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: Submitting the application without filling optional data
```markdown
- Given the user is filling out the Send Application form
- And the Employment and Financial Information panel is displayed
- When no bank data or credit card BIN is provided
- Then the application must be submitted successfully
- And the flow must continue without validation errors
```

Examples:
| LeadPk | Merchant   |
| ------ | ---------- |
| 14684  | Tire Agent |
| 14685  | KS1337     |

![Screenshot_at_Jan_28_09-13-47](/uploads/b3397895d654e6d50e65a3bf31a16065/Screenshot_at_Jan_28_09-13-47.png){width=900 height=452}
![Screenshot_at_Jan_28_09-15-46](/uploads/17e3e4270c93a05e69a3945862d0eaf9/Screenshot_at_Jan_28_09-15-46.png){width=900 height=439}
![Screenshot_at_Jan_28_09-17-20](/uploads/c3f699e4f584cbfd7fc07e9a4a1b1574/Screenshot_at_Jan_28_09-17-20.png){width=900 height=456}
![Screenshot_at_Jan_28_09-17-38](/uploads/1d100cd00757fa65d110dc68a3ddf461/Screenshot_at_Jan_28_09-17-38.png){width=900 height=522}
![Screenshot_at_Jan_28_09-19-14](/uploads/97c5841de7a63b9bd54fc99560d3ccc9/Screenshot_at_Jan_28_09-19-14.png){width=900 height=183}
![Screenshot_at_Jan_28_09-35-52](/uploads/2afe8054eccd55bfca2ceb7c6995f18b/Screenshot_at_Jan_28_09-35-52.png){width=900 height=449}
![Screenshot_at_Jan_28_09-38-13](/uploads/7b12482f6d5fac4e75595567df592bb6/Screenshot_at_Jan_28_09-38-13.png){width=900 height=443}
![Screenshot_at_Jan_28_09-39-57](/uploads/d9b016f0bcab65df07dd634d52e422aa/Screenshot_at_Jan_28_09-39-57.png){width=900 height=330}
![Screenshot_at_Jan_28_09-40-11](/uploads/e1af758011ad14a1498b084bd74f7273/Screenshot_at_Jan_28_09-40-11.png){width=900 height=525}
![Screenshot_at_Jan_28_09-42-00](/uploads/cca99467577279d15f47d67ebbdba343/Screenshot_at_Jan_28_09-42-00.png){width=900 height=172}
![Screenshot_at_Jan_28_10-17-30](/uploads/821f79ca2397ff6e5963e189c587c9b5/Screenshot_at_Jan_28_10-17-30.png){width=900 height=39}

**PASS**

---
### Scenario 2: Viewing bank fields as optional
```markdown
- Given the user accesses the Employment and Financial Information panel
- When the bank data section is rendered
- Then the Bank Routing Number field must be visible
- And the Bank Account Number field must be visible
- And the labels must indicate that the fields are optional
- And the placeholders must contain "(Optional)"
```

Examples:
| LeadPk | Merchant   |
| ------ | ---------- |
| 14684  | Tire Agent |
| 14685  | KS1337     |

**PASS**

---
### Scenario 3: Filling valid bank data
```markdown
- Given the user chooses to provide bank data
- When a Routing Number with exactly 9 numeric digits is entered
- And an Account Number with exactly 17 numeric digits is entered
- Then the application must be submitted successfully
- And the bank data must be accepted
```

Examples:
| LeadPk | Merchant          | RoutingNumber | AccountNumber     |
| ------ | ----------------- | ------------- | ----------------- |
| 14686  | Daniel's Jewelers | 021000021     | 12345678901234567 |
| 14688  | KS1337            | 021000021     | 12345678901234567 |

![Screenshot_at_Jan_28_09-58-02](/uploads/f1c3e9df1c84d6710d2e7371a5c20b3c/Screenshot_at_Jan_28_09-58-02.png){width=900 height=450}
![Screenshot_at_Jan_28_10-00-10](/uploads/047d1cb087713dd76a3491169b276b06/Screenshot_at_Jan_28_10-00-10.png){width=900 height=312}
![Screenshot_at_Jan_28_10-07-30](/uploads/c52a6ac22f099bb4906f28a704db4bef/Screenshot_at_Jan_28_10-07-30.png){width=900 height=185}
![Screenshot_at_Jan_28_10-15-33](/uploads/4648ea699739d5944c70f5ec2d03c024/Screenshot_at_Jan_28_10-15-33.png){width=900 height=59}

![Screenshot_at_Jan_28_10-32-23](/uploads/1f7bd1ac433207ea10ba4b929a577f8c/Screenshot_at_Jan_28_10-32-23.png){width=900 height=450}
![Screenshot_at_Jan_28_10-33-20](/uploads/a6753a293e7f3f2f48e4b78c50070de4/Screenshot_at_Jan_28_10-33-20.png){width=900 height=434}
![Screenshot_at_Jan_28_10-34-05](/uploads/17d037de6e3fbd74744689cd9b9621f5/Screenshot_at_Jan_28_10-34-05.png){width=900 height=323}
![Screenshot_at_Jan_28_10-34-43](/uploads/0702f2dd99876eae8aa21afc9e56c159/Screenshot_at_Jan_28_10-34-43.png){width=900 height=186}
![Screenshot_at_Jan_28_10-35-19](/uploads/a2c1a43517f3a86e39ddde63d6a615a0/Screenshot_at_Jan_28_10-35-19.png){width=900 height=46}


**PASS**

---
### Scenario 4: Routing Number validation outside the allowed limit
```markdown
- Given the user provides a Bank Routing Number
- When the Routing Number has fewer or more than 9 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Invalid routing number" must be displayed
```

Examples:
| RoutingNumber |                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12345678      | The customer does not know what happened here because the message does not specify it; only by checking the response is it possible to know what was filled incorrectly |
| 1234567890    | The field does not accept more than 9 digits                                                                                                                            |
| ABC123        | The field does not accept letters                                                                                                                                                                             |

![Screenshot_at_Jan_28_10-41-58](/uploads/cd296684d36f11773cb7a4a21bf9bb8a/Screenshot_at_Jan_28_10-41-58.png){width=900 height=441}
![Screenshot_at_Jan_28_10-42-13](/uploads/519d2b9ae37059c6d72aabd45cb0338f/Screenshot_at_Jan_28_10-42-13.png){width=900 height=437}

**PASS**

---
### Scenario 5: Account Number validation outside the allowed range
```markdown
- Given the user provides a Bank Account Number
- When the Account Number has fewer than 8 or more than 17 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Invalid Bank Account Number" must be displayed
```

Examples:
| AccountNumber |                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1234567       | The customer does not know what happened here because the message does not specify it; only by checking the response is it possible to know what was filled incorrectly |
| ABC123        | The field does not accept letters |

![Screenshot_at_Jan_28_11-39-58](/uploads/a074ea2a8b3f1a89d17e0d56f1791fe4/Screenshot_at_Jan_28_11-39-58.png){width=900 height=435}
![Screenshot_at_Jan_28_11-40-22](/uploads/82a5f7cb1af48c0c34ca82739924e604/Screenshot_at_Jan_28_11-40-22.png){width=900 height=426}

![Screenshot_at_Jan_28_11-51-38](/uploads/df064c099e8209ab688aa0df4b4fe9e0/Screenshot_at_Jan_28_11-51-38.png){width=900 height=441}
![Screenshot_at_Jan_28_11-51-55](/uploads/886022614ba89ad801980ad7734c6033/Screenshot_at_Jan_28_11-51-55.png){width=900 height=436}

**PASS**

---
### Scenario 6: Bank data does not reappear on the CC/ACH step
```markdown
- Given the user provided bank data during the Employment step
- When the application flow advances to the CC/ACH step
- Then the Bank Routing Number field must not be displayed
- And the Bank Account Number field must not be displayed
```

Examples:
| LeadPk |
| ------ |
| 14686  |

![Screenshot_at_Jan_28_09-58-02](/uploads/f1c3e9df1c84d6710d2e7371a5c20b3c/Screenshot_at_Jan_28_09-58-02.png){width=900 height=450}
![Screenshot_at_Jan_28_10-00-10](/uploads/047d1cb087713dd76a3491169b276b06/Screenshot_at_Jan_28_10-00-10.png){width=900 height=312}
![Screenshot_at_Jan_28_10-07-30](/uploads/c52a6ac22f099bb4906f28a704db4bef/Screenshot_at_Jan_28_10-07-30.png){width=900 height=185}
![Screenshot_at_Jan_28_10-15-33](/uploads/4648ea699739d5944c70f5ec2d03c024/Screenshot_at_Jan_28_10-15-33.png){width=900 height=59}
![Screenshot_at_Jan_28_12-13-57](/uploads/1be94169c61934adadcefced122019c7/Screenshot_at_Jan_28_12-13-57.png){width=900 height=437}
![Screenshot_at_Jan_28_12-14-20](/uploads/51918078218226cba7a570aed821e41f/Screenshot_at_Jan_28_12-14-20.png){width=900 height=437}
![Screenshot_at_Jan_28_12-15-15](/uploads/29768e3bb0ed08997c6be598741e09f0/Screenshot_at_Jan_28_12-15-15.png){width=900 height=318}

![Screenshot_at_Jan_28_12-25-31](/uploads/1d32e3594c7a08e01d7693778853b375/Screenshot_at_Jan_28_12-25-31.png){width=900 height=453}
![Screenshot_at_Jan_28_12-27-32](/uploads/7b450a829d5693adc8047c8363d5c9eb/Screenshot_at_Jan_28_12-27-32.png){width=900 height=478}
![Screenshot_at_Jan_28_12-29-11](/uploads/8ab90803f0ff1748cfb05a3fba4b4e6a/Screenshot_at_Jan_28_12-29-11.png){width=900 height=448}

**PASS**

---
### Scenario 7: Viewing the BIN field as optional
```markdown
- Given the user accesses the Employment and Financial Information panel
- When the First 6 Digits of Credit Card field is displayed
- Then the field must be marked as optional
- And the placeholder must contain "(Optional)"
```

**PASS**

---
### Scenario 8: Displaying the BIN informational tooltip
```markdown
- Given the credit card BIN field is visible
- When the user clicks the tooltip icon
- Then the title "What is a BIN?" must be displayed
- And an explanation describing the first digits of the credit card must be presented
- And the information must indicate that the field is optional
```

![Screenshot_at_Jan_28_12-41-17](/uploads/d76dee035ba24dabc86528dfbeaf45cd/Screenshot_at_Jan_28_12-41-17.png){width=900 height=444}

**PASS**

---
### Scenario 9: Filling a valid BIN
```markdown
- Given the user provides a credit card BIN
- When the BIN contains 6 numeric digits
- Then the application must be submitted successfully
- And the BIN value must be accepted
```

Examples:
| LeadPk | BIN    |
| ------ | ------ |
| 14686  | 601100 |
| 14688  | 514631 |

![Screenshot_at_Jan_28_09-58-02](/uploads/e6520bc380f83847ff7684bec924f7a0/Screenshot_at_Jan_28_09-58-02.png){width=900 height=450}
![Screenshot_at_Jan_28_10-32-23](/uploads/99a400835ebd6b9952cd9d798c6212c3/Screenshot_at_Jan_28_10-32-23.png){width=900 height=450}

**PASS**

---
### Scenario 10: BIN validation outside the allowed limit
```markdown
- Given the user provides a credit card BIN
- When the BIN has fewer than 6 or more than 8 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Invalid Credit Card bin" must be displayed
```

Examples:
| BIN   |
| ----- |
| 12345 |

![Screenshot_at_Jan_28_12-46-53](/uploads/4925b58f316ebb39c1d2e51a2814fcb6/Screenshot_at_Jan_28_12-46-53.png){width=900 height=425}
![Screenshot_at_Jan_28_12-47-09](/uploads/642770c41cea2f744c2bee59e971f01a/Screenshot_at_Jan_28_12-47-09.png){width=900 height=438}

**PASS**

---
### Scenario 11: Maximum size restriction on the BIN field
```markdown
- Given the user types values into the credit card BIN field
- When an attempt is made to enter more than 6 digits
- Then the field must not accept additional characters
```

Examples:
| BIN       |
| --------- |
| 123456789 |

**PASS**

---
### Scenario 12: Recording bank account source on Send Application
```markdown
- Given bank data is provided during Send Application
- When the bank account is persisted
- Then the bank account source must be recorded as SEND_APP
```

Examples:
| Source   | LeadPk | RoutingNumber | AccountNumber     |
| -------- | ------ | ------------- | ----------------- |
| SEND_APP | 14686  | 021000021     | 12345678901234567 |
| SEND_APP | 14691  | 984165132     | 12345678901234567 |

![Screenshot_at_Jan_28_12-51-44](/uploads/5e41752dea7daaff09573e6f00ecf97f/Screenshot_at_Jan_28_12-51-44.png){width=900 height=102}

**PASS**

---
### Scenario 13: Recording bank account source on Submit Application
```markdown
- Given bank data is provided during Submit Application
- When the bank account is persisted
- Then the bank account source must be recorded as SUBMIT_APP
```

Examples:
| Source     | LeadPk | RoutingNumber | AccountNumber     |
| ---------- | ------ | ------------- | ----------------- |
| SUBMIT_APP | 14678  | 123456780     | 160781900000      |
| SUBMIT_APP | 14699  | 121000021     | 12345678901234567 |

![Screenshot_at_Jan_28_13-14-37](/uploads/4eda586cae74f327006bea5e10adcc13/Screenshot_at_Jan_28_13-14-37.png){width=900 height=53}
![Screenshot_at_Jan_28_13-24-05](/uploads/7e4ff3af61d0695a7ae7445d6d0f0a56/Screenshot_at_Jan_28_13-24-05.png){width=900 height=34}

**PASS**

---
### Scenario 14: Recording bank account source via Servicing Portal
```markdown
- Given a bank account is added via the Servicing Portal
- When the bank account is persisted
- Then the bank account source must be recorded as SERVICING
```

Examples:
| Source    | AccountPk | RoutingNumber | AccountNumber |
| --------- | --------- | ------------- | ------------- |
| SERVICING | 11184     | 564897513     | 65459         |
| SERVICING | 11180     | 753641892     | 546701        |

![Screenshot_at_Jan_28_13-38-39](/uploads/477ef821e7bb659817af4c23eba8696e/Screenshot_at_Jan_28_13-38-39.png){width=900 height=230}
![Screenshot_at_Jan_28_13-38-45](/uploads/35e24892da583c8ebd5e67f8f11f7624/Screenshot_at_Jan_28_13-38-45.png){width=900 height=35}
![Screenshot_at_Jan_28_13-47-45](/uploads/0df10129372bde9a20b55742ffeb6560/Screenshot_at_Jan_28_13-47-45.png){width=900 height=36}

**PASS**

---
### Scenario 15: Recording bank account source via Customer Portal
```markdown
- Given a bank account is added via the Customer Portal
- When the bank account is persisted
- Then the bank account source must be recorded as CUSTOMER_PORTAL
```

Examples:
| Source          | AccountPk | RoutingNumber | AccountNumber |
| --------------- | --------- | ------------- | ------------- |
| CUSTOMER_PORTAL | 11184     | 564870216     | 65713484      |
| CUSTOMER_PORTAL | 11180     | 731587024     | 26413786      |

![Screenshot_at_Jan_28_14-03-04](/uploads/abd799e1c63915186102aa786be93328/Screenshot_at_Jan_28_14-03-04.png){width=900 height=46}

**PASS**

---
### Scenario 16: Simultaneous submission of valid bank data and BIN
```markdown
- Given the user fills in both bank data and credit card BIN
- When a valid Routing Number, a valid Account Number, and a valid BIN are provided
- Then the application must be submitted successfully
- And both the bank data and BIN must be accepted and persisted
```

Examples:
| LeadPk | Merchant          | RoutingNumber | AccountNumber     | First 6 digits of CC |
| ------ | ----------------- | ------------- | ----------------- | -------------------- |
| 14686  | Daniel's Jewelers | 021000021     | 12345678901234567 | 601100               |
| 14688  | KS1337            | 021000021     | 12345678901234567 | 514631               |

![Screenshot_at_Jan_28_09-58-02](/uploads/9daab215dfb14714cfe3ddcbb1a1677d/Screenshot_at_Jan_28_09-58-02.png){width=900 height=450}
![Screenshot_at_Jan_28_10-00-10](/uploads/625a5b1d249fa70661b6d8d1853aefca/Screenshot_at_Jan_28_10-00-10.png){width=900 height=312}
![Screenshot_at_Jan_28_10-07-30](/uploads/bf5b10870a594bb5fb272be10e73e000/Screenshot_at_Jan_28_10-07-30.png){width=900 height=185}
![Screenshot_at_Jan_28_10-15-33](/uploads/9962feaa3ea76dc285c479ca80ece4df/Screenshot_at_Jan_28_10-15-33.png){width=900 height=59}
![Screenshot_at_Jan_28_10-32-23](/uploads/710649eec0ccccb04aeff362912ad5eb/Screenshot_at_Jan_28_10-32-23.png){width=900 height=450}
![Screenshot_at_Jan_28_10-33-20](/uploads/4cd6d08ee6ad216efa906b0416a4bc3d/Screenshot_at_Jan_28_10-33-20.png){width=900 height=434}
![Screenshot_at_Jan_28_10-34-05](/uploads/83dc7239c9ba7eb61da73a772e77fe92/Screenshot_at_Jan_28_10-34-05.png){width=900 height=323}
![Screenshot_at_Jan_28_10-34-43](/uploads/a170d2fb542c662c48053aec15f4f220/Screenshot_at_Jan_28_10-34-43.png){width=900 height=186}
![Screenshot_at_Jan_28_10-35-19](/uploads/6024400773ad98dd06ad04ef2a8dba24/Screenshot_at_Jan_28_10-35-19.png){width=900 height=46}

**PASS**

---
### Scenario 17: Filling a valid Account Number with the minimum allowed length
```markdown
- Given the user chooses to provide bank data
- When an Account Number with exactly 8 numeric digits is entered
- Then the application must be submitted successfully
- And the bank data must be accepted
```

Examples:
| LeadPk | Merchant | RoutingNumber | AccountNumber |
| ------ | -------- | ------------- | ------------- |
| 14701  | KS1337   | 021000021     | 12345678      |

![Screenshot_at_Jan_29_01-01-31](/uploads/734cac2e127e351ce248d0c2b7639843/Screenshot_at_Jan_29_01-01-31.png){width=900 height=595}
![Screenshot_at_Jan_29_01-02-25](/uploads/2546d7e6c49f800fc9738b94ac5b327e/Screenshot_at_Jan_29_01-02-25.png){width=900 height=436}
![Screenshot_at_Jan_29_01-02-59](/uploads/6112d601703f274e2493f085942b64ae/Screenshot_at_Jan_29_01-02-59.png){width=900 height=316}
![Screenshot_at_Jan_29_01-03-23](/uploads/19d93cf9bbdec795b9587be4e5768f61/Screenshot_at_Jan_29_01-03-23.png){width=900 height=186}
![Screenshot_at_Jan_29_01-06-47](/uploads/f2e0d9e0c5600e0afc5ac98ef6c6e172/Screenshot_at_Jan_29_01-06-47.png){width=900 height=32}

**PASS**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in stg

---
### Scenario 1: Submitting the application without filling optional data
```markdown
- Given the user is filling out the Send Application form
- And the Employment and Financial Information panel is displayed
- When no bank data or credit card BIN is provided
- Then the application must be submitted successfully
- And the flow must continue without validation errors
```
![Screenshot_at_Feb_18_06-11-58](/uploads/b983397455f79aa3020c4b75fad25a29/Screenshot_at_Feb_18_06-11-58.png){width=900 height=462}
![Screenshot_at_Feb_18_06-13-05](/uploads/eaa88259042b1c3ce6dd04d1aa8b767b/Screenshot_at_Feb_18_06-13-05.png){width=900 height=451}
![Screenshot_at_Feb_18_06-26-40](/uploads/d299bb98664f1b1e37f755939626bba3/Screenshot_at_Feb_18_06-26-40.png){width=836 height=600}
![Screenshot_at_Feb_18_06-27-14](/uploads/b899d9323aac449bc96faf2fbbe07b17/Screenshot_at_Feb_18_06-27-14.png){width=900 height=440}

Examples:
| LeadPk | Merchant   |
| ------ | ---------- |
| 6558772  | Terrace Finance |
| 6558770  | Tire agent     |

**WIP**
Returned "Something Went Wrong!" in interface and "sorErrorDescription: "Invalid routing number. Received "" in response api.

---
### Scenario 2: Viewing bank fields as optional
```markdown
- Given the user accesses the Employment and Financial Information panel
- When the bank data section is rendered
- Then the Bank Routing Number field must be visible
- And the Bank Account Number field must be visible
- And the labels must indicate that the fields are optional
- And the placeholders must contain "(Optional)"
```

**PASS**

---
### Scenario 3: Filling valid bank data
```markdown
- Given the user chooses to provide bank data
- When a Routing Number with exactly 9 numeric digits is entered
- And an Account Number with exactly 17 numeric digits is entered
- Then the application must be submitted successfully
- And the bank data must be accepted
```

Examples:
| LeadPk | Merchant          | RoutingNumber | AccountNumber     |
| ------ | ----------------- | ------------- | ----------------- |
| 6558773  | Terrace Finance | 021000021     | 12345678901234567 |
| 6558771  | Saslows Jewelers (CommonWealth) | 021000021     | 12345678901234567 |

![Screenshot_at_Feb_18_06-53-13](/uploads/50872392491f971d3cf3dd5130b135ed/Screenshot_at_Feb_18_06-53-13.png){width=900 height=457}
![Screenshot_at_Feb_18_06-55-27](/uploads/6adc4e4e658ac9544e41350fc2764236/Screenshot_at_Feb_18_06-55-27.png){width=900 height=81}
![Screenshot_at_Feb_18_06-59-33](/uploads/1cd40c9bab2a0933aa3437e1809333f2/Screenshot_at_Feb_18_06-59-33.png){width=900 height=36}
![Screenshot_at_Feb_18_07-07-26](/uploads/8e1cfcb1b1daf086934e5e5fae0d8626/Screenshot_at_Feb_18_07-07-26.png){width=813 height=600}
![Screenshot_at_Feb_18_07-08-07](/uploads/7c2b8850bd096d81dcf890d7592bfd95/Screenshot_at_Feb_18_07-08-07.png){width=900 height=450}
![Screenshot_at_Feb_18_07-09-33](/uploads/1edc6cd3da5ecd8e7bc6bb8f97c384b8/Screenshot_at_Feb_18_07-09-33.png){width=900 height=82}

**PASS**

---
### Scenario 4: Routing Number validation outside the allowed limit
```markdown
- Given the user provides a Bank Routing Number
- When the Routing Number has fewer or more than 9 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Routing number must be exactly 9 digits." must be displayed
```

Examples:
| RoutingNumber |
| ------------- |
| 12345678      |
| 1234567890    |
| ABC123        |


**PASS**

---
### Scenario 5: Account Number validation outside the allowed range
```markdown
- Given the user provides a Bank Account Number
- When the Account Number has fewer than 8 or more than 17 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Account number must be 8 to 17 digits." must be displayed
```

Examples:
| AccountNumber |
| ------------- |
| 1234567       |
| ABC123        |


**PASS**

---
### Scenario 6: Bank data does not reappear on the CC/ACH step
```markdown
- Given the user provided bank data during the Employment step
- When the application flow advances to the CC/ACH step
- Then the Bank Routing Number field must not be displayed
- And the Bank Account Number field must not be displayed
```

![Screenshot_at_Feb_18_07-57-47](/uploads/24d0ef3e1d9d3ff7fe44edf20547d801/Screenshot_at_Feb_18_07-57-47.png){width=900 height=318}
![Screenshot_at_Feb_18_07-58-02](/uploads/cb0e5e21e2cdf1e1c3fb7ecd5f442e10/Screenshot_at_Feb_18_07-58-02.png){width=809 height=600}
![Screenshot_at_Feb_18_08-00-08](/uploads/b6e285471205bf43f86544a4ef5b0d8c/Screenshot_at_Feb_18_08-00-08.png){width=900 height=324}
![Screenshot_at_Feb_18_08-00-16](/uploads/472b697b84cbb9099e64d47a8ad234c6/Screenshot_at_Feb_18_08-00-16.png){width=900 height=455}

**PASS**

---
### Scenario 7: Viewing the BIN field as optional in uown
```markdown
- Given the user accesses the Employment and Financial Information panel
- When the First 6 Digits of Credit Card field is displayed
- Then the field must be marked as optional
- And the placeholder must contain "(Optional)"
```

**PASS**

---
### Scenario 8: Displaying the BIN informational tooltip
```markdown
- Given the credit card BIN field is visible
- When the user clicks the tooltip icon
- Then the title "What is a BIN?" must be displayed
- And an explanation describing the first digits of the credit card must be presented
- And the information must indicate that the field is optional
```

![Screenshot_at_Feb_18_08-02-04](/uploads/50a63264a225db8b9c336ec0ea9f6583/Screenshot_at_Feb_18_08-02-04.png){width=900 height=320}
![Screenshot_at_Feb_18_08-02-54](/uploads/e9ceeaac846c978eb8538c4d8e194bbf/Screenshot_at_Feb_18_08-02-54.png){width=900 height=186}

**PASS**

---
### Scenario 9: Filling a valid BIN
```markdown
- Given the user provides a credit card BIN
- When the BIN contains 6 numeric digits
- Then the application must be submitted successfully
- And the BIN value must be accepted
```

**PASS**

---
### Scenario 10: BIN validation outside the allowed limit in kornerstone
```markdown
- Given the user provides a credit card BIN
- When the BIN has fewer than 6 or more than 8 digits or is non-numeric
- Then the application must not be submitted
- And the error message "Invalid Credit Card bin" must be displayed
```
![Screenshot_at_Feb_18_08-02-54](/uploads/95d8617c6fe696709a1dbdfe7e41901b/Screenshot_at_Feb_18_08-02-54.png){width=900 height=186}

**PASS**

---
---
### Scenario 11: Recording bank account source on send application
```markdown
- Given bank data is provided during Send Application
- When the bank account is persisted
- Then the bank account source must be recorded as SEND_APP
```
![Screenshot_at_Feb_18_08-06-35](/uploads/2b5a00c675c29df23b221d5ac3989f0c/Screenshot_at_Feb_18_08-06-35.png){width=900 height=62}
![Screenshot_at_Feb_18_08-06-23](/uploads/86457d36f86b778cbc96e32f8287cc1f/Screenshot_at_Feb_18_08-06-23.png){width=900 height=46}

**PASS**

---