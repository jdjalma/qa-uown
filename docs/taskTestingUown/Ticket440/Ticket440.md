---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/440

UOWN | SVC | Atlog AI - Settle account via single CC payment


Priyanka Namburu
@pnamburu
2 semanas atrás
Owner
@y.santos.gow Add "isSettlementPayment" boolean flag to CCTransactionInfo in common project. Default to false. Add a getter to return false if null.

Make changes to CCPostRunUpdateService.createOrUpdateCCTransactionInNewTransaction method in svc and update before cica line 60 ( return svCCTransactionService.createOrUpdateInNewTransaction(ccTransactionInfo).getCreditCardTransactionInfo();)

to update account status to SETTLED_IN_FULL (using ChangeAccountStatusService.changeAccountStatus method) if ccAction = 'SALE' and posting_date is current_date and status = 'APPROVED'



Yago Santos
@y.santos.gow
1 semana atrás
Maintainer
Test instructions
Submit a payment Settlement Payment with posting date = today and status = APPROVED, after that the account status should update to SETTLED_IN_FULL

Editado 1 semana atrás por Yago Santos

---------------------------------------------------------------------------------------------------------------------------------------------------------

Abaixo está a **tarefa (em português)**, consolidando exatamente o que a issue pede, com **requisitos**, **pontos de alteração**, **regras de negócio** e **critérios de aceite/teste**.

---

## Tarefa: Atlog AI — Quitar conta via pagamento único de cartão (CC)

### Objetivo

Quando um pagamento de *Settlement Payment* (liquidação) for processado via cartão de crédito e **for aprovado no mesmo dia (posting_date = hoje)**, o sistema deve **atualizar o status da conta para `SETTLED_IN_FULL`**.

---

## 1) Alteração no projeto **common**

### Mudança de modelo

Adicionar o campo booleano:

* **Campo:** `isSettlementPayment`
* **Local:** `CCTransactionInfo` (no projeto *common*)
* **Comportamento padrão:** `false`

### Getter com fallback

Criar/ajustar o getter para garantir:

* Se `isSettlementPayment` for `null`, o getter deve retornar **`false`**.
* Se tiver valor, retorna o valor informado.

**Resultado esperado:** código que consome `CCTransactionInfo` nunca quebra por `null`, e sempre interpreta ausência como “não é settlement”.

---

## 2) Alteração no projeto **svc**

### Local da mudança

Ajustar o método:

* `CCPostRunUpdateService.createOrUpdateCCTransactionInNewTransaction`

### Ponto exato indicado na issue

A mudança deve ocorrer **antes** da linha (aprox. “cica line 60”) onde hoje existe o retorno:

```java
return svCCTransactionService
  .createOrUpdateInNewTransaction(ccTransactionInfo)
  .getCreditCardTransactionInfo();
```

Ou seja, você deve **interceptar** o fluxo antes de retornar e **executar a atualização do status da conta** quando a condição for atendida.

---

## 3) Regra de negócio para atualizar a conta

Após criar/atualizar a transação (ou com dados equivalentes disponíveis no método), **atualizar o status da conta para `SETTLED_IN_FULL`** **somente se** TODAS as condições abaixo forem verdadeiras:

1. `ccAction = 'SALE'`
2. `posting_date == current_date` (posting date é **hoje**)
3. `status = 'APPROVED'`

### Como atualizar o status

Usar o serviço:

* `ChangeAccountStatusService.changeAccountStatus(...)`

E definir o novo status:

* `SETTLED_IN_FULL`

> Observação prática: a issue descreve a mudança como “update account status … if ...”. Ela não menciona outras flags como `isSettlementPayment` na condição de status; então **a condição mandatória é exatamente a tríade (SALE + hoje + APPROVED)**.

---

## 4) Critérios de aceite

### AC1 — Campo no common

* `CCTransactionInfo` possui `isSettlementPayment`.
* Valor default é `false`.
* Getter retorna `false` quando `null`.

### AC2 — Atualização automática de status

* Ao processar uma transação de cartão com:

  * `ccAction = 'SALE'`
  * `posting_date = hoje`
  * `status = 'APPROVED'`
* O sistema chama `ChangeAccountStatusService.changeAccountStatus(...)`
* E a conta passa para **`SETTLED_IN_FULL`**.

### AC3 — Não atualizar fora da condição

* Se qualquer condição falhar (ex.: status ≠ APPROVED, posting_date ≠ hoje, ccAction ≠ SALE), **não** deve mudar para `SETTLED_IN_FULL`.

---

## 5) Instruções de teste (conforme issue)

1. Submeter um pagamento **Settlement Payment** com:

   * **posting date = hoje**
   * **status = APPROVED**
2. Verificar que, após o processamento, o **status da conta** foi atualizado para:

   * **`SETTLED_IN_FULL`**

---

## Checklist rápido de implementação

* [ ] Adicionar `isSettlementPayment` em `CCTransactionInfo` no common.
* [ ] Garantir default `false`.
* [ ] Getter retorna `false` se `null`.
* [ ] No `CCPostRunUpdateService.createOrUpdateCCTransactionInNewTransaction`, antes do `return ...createOrUpdateInNewTransaction...`, implementar verificação:

  * `SALE` + `posting_date == hoje` + `APPROVED`
* [ ] Se verdadeiro, chamar `ChangeAccountStatusService.changeAccountStatus` para `SETTLED_IN_FULL`.
* [ ] Testar cenário pedido e pelo menos 1 cenário negativo.

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

/svc/src/main/java/com/uownleasing/svc/service/cc/CCPostRunUpdateService.java
package com.uownleasing.svc.service.cc;

import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.AccountInfo;
import com.uownleasing.common.pojo.CCInfo;
import com.uownleasing.common.pojo.CCTransactionInfo;
import com.uownleasing.los.common.service.LosCreditCardTransactionService;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvCreditCard;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.service.LoggingService;
import com.uownleasing.svc.common.service.SvCreditCardService;
import com.uownleasing.svc.common.service.SvCreditCardTransactionService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.ChangeAccountStatusRequest;
import com.uownleasing.svc.service.ChangeAccountStatusService;
import com.uownleasing.svc.service.PaymentReceiptService;
import com.uownleasing.svc.service.SvAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CCPostRunUpdateService {

    private final LosCreditCardTransactionService losCCTransactionService;
    private final SvCreditCardTransactionService svCCTransactionService;
    private final SvCreditCardService svCCService;
    private final PaymentReceiptService paymentReceiptService;
    private final SvAccountService svAccountService;
    private final ConfigurationManagement configurationManagement;
    private final LoggingService loggingService;

    private String configurationPath = "com.uownleasing.svc.service.cc.CCPostRunUpdateService.";

    private static final String LOG_NOTES = "AutoPay updated. CC removed due to invalid card. Reason : ";

    public CCTransactionInfo createOrUpdateCCTransactionInNewTransaction(CCTransactionInfo ccTransactionInfo) {
        if(ccTransactionInfo.getStatus() == CCTransactionStatus.ERROR || ccTransactionInfo.getStatus() == CCTransactionStatus.DENIED){
            ccTransactionInfo.setSaveCardToFile(false);
            if(ccTransactionInfo.getCcAction() == CCAction.SALE){
                paymentReceiptService.createCCPaymentFailReceipt(ccTransactionInfo);
                if (ccTransactionInfo.getCcTransactionType() == CCTransactionType.SCHEDULED) {
                    paymentReceiptService.createCCFirstPaymentDefaultReceipt(ccTransactionInfo);
                }
            }
            handleInvalidCardUpdate(ccTransactionInfo);
        }

        if (ccTransactionInfo.getLeadPk() != null && (ccTransactionInfo.getAccountPk() == null || ccTransactionInfo.getAccountPk() <= 0)) {
            return losCCTransactionService.createOrUpdateInNewTransaction(ccTransactionInfo).getCreditCardTransactionInfo();
        } else if (ccTransactionInfo.getAccountPk() != null && ccTransactionInfo.getAccountPk() > 0) {
            handleAccountSettlement(ccTransactionInfo);
            return svCCTransactionService.createOrUpdateInNewTransaction(ccTransactionInfo).getCreditCardTransactionInfo();
        } else
            throw new SvcException("No Lead or Account associated with ccTransactionInfo");
    }

    /**
     * Method responsible for settling an account to full status when an approved same-day SALE transaction marked as settlement payment is processed.
     * @param ccTransactionInfo
     */
    private void handleAccountSettlement(CCTransactionInfo ccTransactionInfo) {
        if (CCAction.SALE.equals(ccTransactionInfo.getCcAction())
            && ccTransactionInfo.getPostingDate() != null
            && LocalDate.now().equals(ccTransactionInfo.getPostingDate())
            && CCTransactionStatus.APPROVED.equals(ccTransactionInfo.getStatus())
            && ccTransactionInfo.getIsSettlementPayment()) {
                long accountPk = ccTransactionInfo.getAccountPk();
                SvAccount account = svAccountService.getAccountByPK(accountPk);
                AccountInfo info = account.getAccountInfo();
                loggingService.createActivityLog(accountPk, LogType.STATUS_CHANGE,
                String.format("Account status changed from %s to %s; %s",
                    info.getAccountStatus(), AccountStatus.SETTLED_IN_FULL, "Cleared CC settlement payment"), ThreadAttributes.getUsername());
                info.setAccountStatus(AccountStatus.SETTLED_IN_FULL);
                info.setComment("Cleared CC settlement payment");
                svAccountService.updateAccount(info);
        }
    }

    /**
     * Method responsible for invalidating credit cards whose transaction status is DENIED or ERROR and whose error message matches one of the messages contained in the variable setInvalidCardErrorMessages.
     * @param ccTransactionInfo
     */
    private void handleInvalidCardUpdate(CCTransactionInfo ccTransactionInfo) {
        String errorMessage = StringUtils.defaultString(ccTransactionInfo.getError()).toLowerCase();
        if (ccTransactionInfo.getAccountPk() != null && ccTransactionInfo.getAccountPk() > 0
            && isCardErrorInvalid(errorMessage) && ccTransactionInfo.getCcInfo() != null) {
                //Updates to CCInfo
            CCInfo ccInfo = ccTransactionInfo.getCcInfo();
            ccInfo.setIsValidCard(Boolean.FALSE);
            ccInfo.setAutoPay(Boolean.FALSE);
            ccInfo.setInvalidCardReason(ccTransactionInfo.getError());
            //Update autoPay, isValidCard, invalidReason on Credit Card
            SvCreditCard updatedCard = svCCService.createOrUpdateCreditCard(ccInfo);
            log.debug("[handleInvalidCardUpdate] UpdatedCard details {}", updatedCard.getCreditCardInfo().getInvalidCardReason());
            // If accountPk exists, updates the autoPayTypes
            SvAccount account = svAccountService.getAccountByPK(ccTransactionInfo.getAccountPk());
            List<AutoPayType> autoPayTypes = account.getAccountInfo().getAutoPayTypes();
            SvCreditCard autoPayCard = svCCService.getAutoPayByAccountPk(account.getPk());
            log.debug("[handleInvalidCardUpdate] AutoPay card exists? {} Is it the same one as updated ? {}", autoPayCard != null, autoPayCard != null && autoPayCard.getPk() == updatedCard.getPk());
            if (autoPayTypes.contains(AutoPayType.CC) && (autoPayCard == null || autoPayCard.getPk() == updatedCard.getPk())) {
                // Removes CC and retains other types
                log.debug("[handleInvalidCardUpdate] Removing CC from auto pay types on account {}", account.getPk());
                autoPayTypes = autoPayTypes.stream()
                    .filter(type -> !type.equals(AutoPayType.CC))
                    .distinct()
                    .collect(Collectors.toList());
                account.getAccountInfo().setAutoPayTypes(autoPayTypes);

                loggingService.createActivityLog(account.getAccountInfo().getAccountPk(), LogType.STATUS_CHANGE, LOG_NOTES + ccTransactionInfo.getError(), ThreadAttributes.getUsername());

                log.info("[CCPostRunUpdateService][handleInvalidCardUpdate] AutoPay updated. CC removed due to invalid card. Reason: {}", ccTransactionInfo.getError());
            }
            log.info("[CCPostRunUpdateService][handleInvalidCardUpdate] CCInfo updated: isValidCard = false, invalidReasonCard = {} for account {}",
                ccTransactionInfo.getError(), ccTransactionInfo.getAccountPk());
        }

    }

    private Boolean isCardErrorInvalid(String errorMessage) {

        List<String> setInvalidCardErrorMessages = Stream.of(
                configurationManagement.getString(
                        configurationPath + "card.error.invalid",
                        "card is expired,card number error,closed account,hold card (lost),hold card (pick up card),hold card (stolen)"
                    ).split(","))
                     .map(String::toLowerCase)
                     .collect(Collectors.toList());

        return setInvalidCardErrorMessages.stream()
            .anyMatch(error -> errorMessage != null && errorMessage.toLowerCase().contains(error));
    }

}


11204 11203
---------------------------------------------------------------------------------------------------------------------------------------------------------

cenarios de teste

---

```gherkin
Scenario: 1: Pagamento de liquidação com valor válido e todas as condições atendidas
  Given a conta possui status ACTIVE
  And a conta possui saldo devedor de $500.00
  When é submetido um pagamento de liquidação com:
    | amount               | 500.00     |
    | ccAction             | SALE       |
    | postingDate          | 2026-02-16 |
    | isSettlementPayment  | true       |
    | ccTransactionType    | REQUEST    |
  And o pagamento é processado com sucesso
  And o status do pagamento é APPROVED
  Then o status da conta deve mudar para SETTLED_IN_FULL
  And o pagamento deve ser registrado no histórico
11204

---
Scenario: Outline 2: Pagamento NÃO deve atualizar status quando isSettlementPayment for falso ou ausente
  Given a conta possui status ACTIVE
  When é submetido um pagamento com os seguintes dados:
    | ccAction    | SALE       |
    | postingDate | data atual |
    | status      | APPROVED   |
  And o campo isSettlementPayment é <isSettlementPayment>
  Then o status da conta NÃO deve ser atualizado para SETTLED_IN_FULL
  And o status da conta deve permanecer ACTIVE

  Examples:
    | isSettlementPayment |
    | false               |
    | ausente             |
11203


Scenario: Outline 3: Pagamento NÃO deve atualizar status quando ccAction for diferente de SALE
  Given a conta possui status ACTIVE
  When é submetido um pagamento com os seguintes dados:
    | ccAction             | <ccAction>   |
    | postingDate          | data atual   |
    | status               | APPROVED     |
    | isSettlementPayment  | true         |
  Then o status da conta NÃO deve ser atualizado para SETTLED_IN_FULL
  And o status da conta deve permanecer ACTIVE

  Examples:
    | ccAction |
    | AUTHENTICATION |
    | CAPTURE  |

---
Scenario: Outline 4: Pagamento NÃO deve atualizar status quando postingDate for diferente da data atual
  Given a conta possui status ACTIVE
  And a data atual é 2026-02-16
  When é submetido um pagamento com os seguintes dados:
    | ccAction             | SALE           |
    | postingDate          | <postingDate>  |
    | status               | APPROVED       |
    | isSettlementPayment  | true           |
  Then o status da conta NÃO deve ser atualizado para SETTLED_IN_FULL
  And o status da conta deve permanecer ACTIVE



---
Scenario: Outline 5: Pagamento NÃO deve atualizar status quando status do pagamento for diferente de APPROVED
  Given a conta possui status ACTIVE
  When é submetido um pagamento com os seguintes dados:
    | ccAction             | SALE           |
    | postingDate          | data atual     |
    | status               | <status>       |
    | isSettlementPayment  | true           |
  Then o status da conta NÃO deve ser atualizado para SETTLED_IN_FULL
  And o status da conta deve permanecer ACTIVE


---
Scenario: 6: Pagamento regular (não settlement) com as outras condições atendidas deve ser processado normalmente
  Given a conta possui status ACTIVE
  When é submetido um pagamento regular com:
    | ccAction             | SALE           |
    | postingDate          | data atual     |
    | status               | APPROVED       |
    | isSettlementPayment  | false          |
    | ccTransactionType    | SCHEDULED      |
  Then o pagamento deve ser processado normalmente
  And o status da conta NÃO deve mudar para SETTLED_IN_FULL
  And o pagamento deve ser alocado aos receivables conforme estratégia configurada



---------------------------------------------------------------------------------------------------------------------------------------------------------

comentario gitab

## Tests in qa2

---
### Scenario 1: Settlement payment with valid amount and all conditions met
```markdown
- Given the account status is ACTIVE
- And the account has an outstanding balance
- When a settlement payment is submitted with:
  | Field              |
  |--------------------|
  | amount             |
  | ccAction           |
  | postingDate        |
  | isSettlementPayment|
  | ccTransactionType  |
- And the payment is processed successfully
- And the payment status is APPROVED
- Then the account status must change to SETTLED_IN_FULL
- And the payment must be recorded in the history

| Data      | Value |
|-----------|-------|
| AccountPk | 11204 |
```

Screenshot

**PASS**

---
### Scenario Outline 2: — Payment must NOT update status when isSettlementPayment is false or missing
```markdown
- Given the account status is ACTIVE
- When a payment is submitted with:
  | Field       | Value |
  |------------|-------|
  | ccAction    | SALE  |
  | postingDate | today |
  | status      | APPROVED |
- And the isSettlementPayment field is <isSettlementPayment>
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| isSettlementPayment |
|---------------------|
| false               |
| missing             |

| Data      | Value |
|-----------|-------|
| AccountPk | 11203 |
```

Screenshot

**PASS**

---
### Scenario Outline 3: — Payment must NOT update status when ccAction is different from SALE
```markdown
- Given the account status is ACTIVE
- When a payment is submitted with:
  | Field              | Value      |
  |--------------------|------------|
  | ccAction           | <ccAction> |
  | postingDate        | today      |
  | status             | APPROVED   |
  | isSettlementPayment| true       |
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| ccAction        |
|----------------|
| AUTHENTICATION |
| CAPTURE        |
```

**PASS**

---
### Scenario Outline 4: — Payment must NOT update status when postingDate is different from today
```markdown
- Given the account status is ACTIVE
- And today is 2026-02-16
- When a payment is submitted with:
  | Field              | Value         |
  |--------------------|---------------|
  | ccAction           | SALE          |
  | postingDate        | <postingDate> |
  | status             | APPROVED      |
  | isSettlementPayment| true          |
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| postingDate |
|------------|
|            |
```

**PASS**

---
### Scenario Outline 5: — Payment must NOT update status when payment status is different from APPROVED
```markdown
- Given the account status is ACTIVE
- When a payment is submitted with:
  | Field              | Value     |
  |--------------------|-----------|
  | ccAction           | SALE      |
  | postingDate        | today     |
  | status             | <status>  |
  | isSettlementPayment| true      |
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| status |
|--------|
|        |
```

**PASS**

---
### Scenario 6: — Regular (non-settlement) payment with other conditions met must be processed normally
```markdown
- Given the account status is ACTIVE
- When a regular payment is submitted with:
  | Field              | Value      |
  |--------------------|------------|
  | ccAction           | SALE       |
  | postingDate        | today      |
  | status             | APPROVED   |
  | isSettlementPayment| false      |
  | ccTransactionType  | SCHEDULED  |
- Then the payment must be processed normally
- And the account status must NOT change to SETTLED_IN_FULL
- And the payment must be allocated to receivables according to the configured strategy
```

**PASS**

---



---------------------------------------------------------------------------------------------------------------------------------------------------------



## Tests in stg

---
### Scenario 1: Settlement payment with valid amount and all conditions met
```markdown
- Given the account status is ACTIVE
- And the account has an outstanding balance
- When a settlement payment is submitted with:
  | Field              |
  |--------------------|
  | amount             |
  | ccAction           |
  | postingDate        |
  | isSettlementPayment|
  | ccTransactionType  |
- And the payment is processed successfully
- And the payment status is APPROVED
- Then the account status must change to SETTLED_IN_FULL
- And the payment must be recorded in the history

| Data      | Value |
|-----------|-------|
| AccountPk |  |
```



**PASS**

---
### Scenario Outline 2: — Payment must NOT update status when isSettlementPayment is false or missing
```markdown
- Given the account status is ACTIVE
- When a payment is submitted with:
  | Field       | Value |
  |------------|-------|
  | ccAction    | SALE  |
  | postingDate | today |
  | status      | APPROVED |
- And the isSettlementPayment field is <isSettlementPayment>
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| isSettlementPayment |
|---------------------|
| false               |
| missing             |

| Data      | Value |
|-----------|-------|
| AccountPk |  |
```



**PASS**

---
### Scenario Outline 3: — Payment must NOT update status when ccAction is different from SALE
```markdown
- Given the account status is ACTIVE
- When a payment is submitted with:
  | Field              | Value      |
  |--------------------|------------|
  | ccAction           | <ccAction> |
  | postingDate        | today      |
  | status             | APPROVED   |
  | isSettlementPayment| true       |
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE

Examples:
| ccAction        |
|----------------|
| AUTHENTICATION |
| CAPTURE        |
```

**PASS**

---
### Scenario Outline 4: — Payment must NOT update status when postingDate is different from today
```markdown
- Given the account status is ACTIVE
- And today is 2026-02-16
- When a payment is submitted with:
  | Field              | Value         |
  |--------------------|---------------|
  | ccAction           | SALE          |
  | postingDate        | <postingDate> |
  | status             | APPROVED      |
  | isSettlementPayment| true          |
- Then the account status must NOT be updated to SETTLED_IN_FULL
- And the account status must remain ACTIVE
```

**PASS**

---
### Scenario 5: — Regular (non-settlement) payment with other conditions met must be processed normally
```markdown
- Given the account status is ACTIVE
- When a regular payment is submitted with:
  | Field              | Value      |
  |--------------------|------------|
  | ccAction           | SALE       |
  | postingDate        | today      |
  | status             | APPROVED   |
  | isSettlementPayment| false      |
  | ccTransactionType  | SCHEDULED  |
- Then the payment must be processed normally
- And the account status must NOT change to SETTLED_IN_FULL
- And the payment must be allocated to receivables according to the configured strategy
```

**PASS**

---