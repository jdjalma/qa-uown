--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/492

````md
# UOWN | Servicing | Preserve original Processing Fee amount after account creation
**Type:** QA Task / Validation Plan  
**Status:** To do / QA in process  
**Priority:** High  
**Milestone/Release:** Uown | RU01.26.1.48.0  
**Scope:** Servicing (Backend) + Portal flow that triggers fee recalculation (Frontend integration)  
**Related Dev Items:**  
- Backend MR: uown/backend/svc!1198 (merged)  
- Frontend issue: uown/frontend/servicing#492 (track if portal flow was changed)

---

## ENGLISH VERSION

## 1. Synopsis
The **Processing Fee** is configured **per state** and may change over time.  
This requirement ensures **no retroactive changes** are applied to accounts that already exist.

Once an account is created, it must **retain the exact Processing Fee value** that was applied **at the time of creation**, even if:
- the state’s Processing Fee is later increased or decreased; and/or
- the account is updated (e.g., payment frequency change).

## 2. Business Objective
Prevent unintended financial discrepancies by ensuring the Processing Fee on existing accounts **does not change retroactively**, improving consistency and predictability for customers.

## 3. Requirements / Acceptance Criteria
### R1 — Lock Processing Fee at account creation
- When an account is created, the system must store the Processing Fee value applicable to the account’s state at that time.
- This value must be persisted on the account.

### R2 — Do not update Processing Fee for existing accounts
- If the state-based Processing Fee is changed later, it must **not** update any previously created accounts.
- The original Processing Fee on the account must remain unchanged for both increases and decreases.

### R3 — Account updates must not affect Processing Fee
- Updates to existing accounts (including **payment frequency changes**) must **not** alter the Processing Fee stored at creation.

## 4. Risk / Regression Targets
- Any flow that recalculates fees from state configuration during account updates.
- Servicing endpoints/operations that modify account terms (frequency, due dates, schedules).
- Portal flows that call backend operations (e.g., “Change Payment Frequency”).

## 5. Preconditions / Test Data
Prepare at least:
- **State CA** (or any testable state) with a known Processing Fee (e.g., `0`).
- An **Account A** created while the state fee is `0` (Account A processing fee must be verified as `0`).
- Ability/permission to update the **state configuration** Processing Fee (e.g., from `0` to `10`).
- Ability to call the operation that triggers the previous bug:
  - `changePaymentFrequency` (API or portal).

Record identifiers:
- `accountPK` for Account A
- original `processingFee` value on Account A
- state code used by Account A

## 6. Test Cases

### TC1 — Baseline: account stores Processing Fee at creation
**Steps**
1. Set state Processing Fee to **X** (example: `0`).
2. Create a new account in that state.
3. Retrieve the created account details.

**Expected**
- Account processing fee equals **X**.
- The processing fee is persisted on the account record.

---

### TC2 — State fee increases: existing account must NOT change
**Steps**
1. Ensure Account A exists with processing fee **X** (example: `0`) and state = CA.
2. Update CA Processing Fee from **X** to **Y** (example: `10`).
3. Retrieve Account A again.

**Expected**
- Account A processing fee remains **X** (unchanged).

---

### TC3 — Repro flow: changePaymentFrequency must NOT update Processing Fee (core fix)
**Steps**
1. Ensure Account A exists with processing fee **X** and state fee is now **Y** (different from X).
2. Call `changePaymentFrequency` (or do same via portal) with:
   ```json
   {
     "accountPK": "<AccountA_PK>",
     "newFrequency": "<newFrequency>",
     "firstDueDate": "<firstDueDate>"
   }
````

3. Retrieve Account A after the operation.

**Expected**

* Account A processing fee remains **X**.
* Account frequency changes as requested (verify the update itself still works).
* No side effects: no fee recalculation from state config for this account.

---

### TC4 — State fee decreases: existing account must NOT change

**Steps**

1. Create Account B when state Processing Fee is **Y** (example: `10`) so Account B fee = `10`.
2. Change the state Processing Fee from **Y** to **Z** (example: `5`).
3. Retrieve Account B.

**Expected**

* Account B processing fee remains **Y** (example: `10`).

---

### TC5 — New accounts after config change must use new fee (non-regression)

**Steps**

1. Ensure state Processing Fee is currently **Z** (example: `5`).
2. Create Account C in the same state.
3. Retrieve Account C.

**Expected**

* Account C processing fee equals **Z** (new value).
* Confirms only *new* accounts get the updated state-based fee.

---

### TC6 — Other allowed account updates must NOT affect Processing Fee

(Execute at least one additional update besides payment frequency, depending on what the system allows in Servicing/Portal.)

**Examples (pick applicable ones)**

* Update billing/schedule fields
* Update non-fee account attributes allowed by the product
* Any “edit account” operation in portal

**Expected**

* Processing fee remains the value stored at creation for that account.

---

### TC7 — Cross-state sanity (optional but recommended)

**Steps**

1. Have two states with different fees (State1 fee = A, State2 fee = B).
2. Create one account in each state.
3. Change both state fees.
4. Run `changePaymentFrequency` on both accounts.

**Expected**

* Each account retains its own original creation fee (no cross-contamination, no recalculation).

## 7. Validation Evidence to Capture

* Screenshots or logs showing:

  * State Processing Fee before and after change
  * Account processing fee before and after each operation
  * Request/response for `changePaymentFrequency` (or portal action evidence)
* Any relevant database snapshot/record fields if accessible in QA environment.

## 8. Pass/Fail Criteria

**PASS** if:

* Existing accounts never change processing fee after state config updates.
* Account updates (including `changePaymentFrequency`) do not alter the processing fee.
* New accounts reflect the current state fee at creation time.

**FAIL** if:

* Any existing account processing fee changes to match updated state config.
* `changePaymentFrequency` (or equivalent portal flow) causes fee to update.
* Any unrelated account update triggers a fee recalculation for existing accounts.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## PORTUGUÊS (BR)

## 1. Sinopse

A **Processing Fee** é configurada **por estado** e pode mudar com o tempo.
Este requisito garante que **não exista alteração retroativa** em contas já criadas.

Depois que a conta é criada, ela deve **manter exatamente o valor da Processing Fee** aplicado **no momento da criação**, mesmo que:

* a Processing Fee do estado seja aumentada ou reduzida depois; e/ou
* a conta seja atualizada (ex.: alteração de frequência de pagamento).

## 2. Objetivo de Negócio

Evitar divergências financeiras e cobranças indevidas garantindo que a Processing Fee em contas existentes **não seja recalculada retroativamente**, trazendo consistência e previsibilidade para o cliente.

## 3. Requisitos / Critérios de Aceite

### R1 — Travar Processing Fee na criação da conta

* Ao criar uma conta, o sistema deve armazenar a Processing Fee aplicável ao estado naquele momento.
* Esse valor deve ficar persistido no registro da conta.

### R2 — Não atualizar Processing Fee em contas existentes

* Mudanças futuras na Processing Fee do estado **não** podem atualizar contas já criadas.
* O valor original deve permanecer, tanto para aumento quanto para redução.

### R3 — Atualizações na conta não podem afetar a Processing Fee

* Alterações em uma conta existente (incluindo **mudança de frequência de pagamento**) **não** podem alterar a Processing Fee definida na criação.

## 4. Risco / Pontos de Regressão

* Qualquer fluxo que recalcule taxas baseado na configuração do estado durante atualizações da conta.
* Operações/endpoints de Servicing que alterem condições da conta (frequência, datas, cronograma).
* Fluxos do portal que chamem operações do backend (ex.: “Change Payment Frequency”).

## 5. Pré-condições / Massa de Dados

Preparar ao menos:

* **Estado CA** (ou qualquer estado testável) com Processing Fee conhecida (ex.: `0`).
* **Conta A** criada quando a fee do estado era `0` (confirmar que a Conta A ficou com fee `0`).
* Permissão para alterar a **configuração do estado** (ex.: `0` → `10`).
* Capacidade de executar o fluxo que causava o bug:

  * `changePaymentFrequency` (via API ou via portal).

Registrar:

* `accountPK` da Conta A
* valor original de `processingFee` da Conta A
* estado da Conta A

## 6. Casos de Teste

### CT1 — Base: conta grava Processing Fee na criação

**Passos**

1. Definir Processing Fee do estado como **X** (ex.: `0`).
2. Criar uma conta nesse estado.
3. Consultar os dados da conta criada.

**Esperado**

* Processing fee da conta = **X**.
* Valor persistido no registro da conta.

---

### CT2 — Aumento da fee do estado: conta existente NÃO pode mudar

**Passos**

1. Garantir que a Conta A exista com fee **X** (ex.: `0`) e estado = CA.
2. Alterar a Processing Fee do CA de **X** para **Y** (ex.: `10`).
3. Consultar a Conta A novamente.

**Esperado**

* Processing fee da Conta A permanece **X** (inalterada).

---

### CT3 — Fluxo que reproduzia o bug: changePaymentFrequency NÃO pode atualizar fee (correção principal)

**Passos**

1. Garantir que a Conta A exista com fee **X** e que a fee do estado esteja em **Y** (diferente de X).
2. Executar `changePaymentFrequency` (ou o mesmo pelo portal) com:

   ```json
   {
     "accountPK": "<PK_ContaA>",
     "newFrequency": "<novaFrequencia>",
     "firstDueDate": "<primeiraDataVencimento>"
   }
   ```
3. Consultar a Conta A após a execução.

**Esperado**

* Processing fee da Conta A permanece **X**.
* A frequência é alterada conforme solicitado (confirmar que a alteração ainda funciona).
* Sem efeitos colaterais (não recalcular fee pelo estado).

---

### CT4 — Redução da fee do estado: conta existente NÃO pode mudar

**Passos**

1. Criar a Conta B quando a fee do estado é **Y** (ex.: `10`) e confirmar fee da Conta B = `10`.
2. Alterar a fee do estado de **Y** para **Z** (ex.: `5`).
3. Consultar a Conta B.

**Esperado**

* Processing fee da Conta B permanece **Y** (ex.: `10`).

---

### CT5 — Novas contas após mudança devem usar a fee nova (não-regressão)

**Passos**

1. Garantir que a fee do estado esteja em **Z** (ex.: `5`).
2. Criar a Conta C nesse estado.
3. Consultar a Conta C.

**Esperado**

* Processing fee da Conta C = **Z** (valor atual).
* Confirma que só contas novas pegam a fee atualizada.

---

### CT6 — Outras atualizações permitidas na conta NÃO podem alterar a Processing Fee

(Executar ao menos uma atualização além da frequência, conforme o que existir no Servicing/Portal.)

**Exemplos (escolher aplicáveis)**

* Atualização de campos de cobrança/cronograma
* Atualização de atributos não-financeiros permitidos
* Qualquer operação de “editar conta” no portal

**Esperado**

* Processing fee permanece o valor original da criação para aquela conta.

---

### CT7 — Sanidade multi-estado (opcional, mas recomendado)

**Passos**

1. Ter dois estados com fees diferentes (Estado1 = A, Estado2 = B).
2. Criar uma conta em cada estado.
3. Alterar as fees dos dois estados.
4. Executar `changePaymentFrequency` em ambas.

**Esperado**

* Cada conta mantém sua fee original da criação (sem recalcular, sem misturar regras).

## 7. Evidências a Capturar

* Prints/logs evidenciando:

  * Fee do estado antes e depois
  * Fee da conta antes e depois de cada ação
  * Request/response do `changePaymentFrequency` (ou evidência do portal)
* Se possível, evidência do campo persistido no banco/registro.

## 8. Critério de Aprovação/Reprovação

**APROVA** se:

* Contas existentes nunca mudam a Processing Fee após alterações na configuração do estado.
* Atualizações (incluindo `changePaymentFrequency`) não alteram a Processing Fee.
* Contas novas refletem a fee vigente no momento da criação.

**REPROVA** se:

* Qualquer conta existente tiver sua Processing Fee alterada para refletir o novo valor do estado.
* `changePaymentFrequency` (ou fluxo equivalente) atualizar a fee.
* Qualquer atualização não relacionada disparar recálculo de fee em contas existentes.

```
```

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

Visão geral 
0
Commits 
5
Pipelines 
3
Alterações 
2
Comparar
e
 2 arquivos
+
4
−
3
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/com/uo
‎wnleasing/svc/service‎

CalculatorS
‎ervice.java‎
+2 -2

SvAccountS
‎ervice.java‎
+2 -1

 src/main/java/com/uownleasing/svc/service/CalculatorService.java 
+
2
−
2

Visualizado
@@ -158,7 +158,7 @@ public class CalculatorService {
        if ((request.getCompanyDiscount() == null || request.getCompanyDiscount().compareTo(BigDecimal.ZERO) == 0)) {
            if (!forAccount && !CollectionUtils.isEmpty(lead.getLeadInfo().getAutoPayTypes()) && lead.getLeadInfo().getAutoPayTypes().contains(AutoPayType.ACH)){
                if(!merchant.getMerchantInfo().getIsCcRequired() && merchant.getMerchantInfo().getIsAchRequired()
                && configurationManagement.getBoolean(configurationPath+"no.discount.for.auto.achpayment.only." + merchant.getMerchantInfo().getClientType(), true)) {
                    && configurationManagement.getBoolean(configurationPath+"no.discount.for.auto.achpayment.only." + merchant.getMerchantInfo().getClientType(), true)) {
                    request.setCompanyDiscount(BigDecimal.valueOf(0));
                }
                else {
@@ -223,7 +223,7 @@ public class CalculatorService {
        }
        BigDecimal securityDeposit = holdDeposit
            && (merchantProgram.getProgramInfo().getAmountChargedAtSigning() == null
                || merchantProgram.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) < 1)
            || merchantProgram.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) < 1)
            ? stateConfigInfo.getSecurityDeposit()
            : BigDecimal.ZERO;
        merchantDiscountRate = merchantDiscountRate == null ? BigDecimal.ZERO : merchantDiscountRate;
 src/main/java/com/uownleasing/svc/service/SvAccountService.java 
+
2
−
1

Visualizado
@@ -761,7 +761,8 @@ public class SvAccountService extends AccountService {

        log.info("Change payment frequency for account {}: {} to {}", account.getPk(), oldInfo.getPaymentFrequency(), changeRequest.getNewFrequency());

        CalculatorRequest request = new CalculatorRequest(account.getAccountInfo().getLeadPk() == 1 ? null : leadService.getByLeadPk(account.getAccountInfo().getLeadPk()),
        // Pass null as lead to ensure forAccount=true path is used, preserving account's processing fee
        CalculatorRequest request = new CalculatorRequest(null,
            List.of(changeRequest.getNewFrequency()), merchantService.getMerchantByAccountPk(account.getPk()).getMerchantInfo().getRefMerchantCode(),
            addressInfo.getStreetAddress1(), addressInfo.getCity(), addressInfo.getState(), addressInfo.getZipCode9(), addressInfo.getCountry(),
            oldInfo.getTaxRate(), oldInfo.getCostWithoutTaxAndFees(), oldInfo.getTermInMonths(), null, oldInfo.getFirstPaymentDiscount(), null);

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

1. **Alabama (AL)**
   Address: State Capitol, 600 Dexter Avenue — Montgomery, AL **36130-2751**
   Payment frequencies: **AL-(W)** / **AL-(BW)**

**| PASS |**

---

2. **Alaska (AK)**
   Address: State Capitol, P.O. Box 110001 — Juneau, AK **99811-0001**
   Payment frequencies: **AK-(W)** / **AK-(BW)**

**| PASS |**

---

3. **Arizona (AZ)**
   Address: State Capitol, 1700 West Washington St. — Phoenix, AZ **85007**
   Payment frequencies: **AZ-(W)** / **AZ-(BW)**

**| PASS |**

---

4. **Arkansas (AR)**
   Address: State Capitol, 500 Woodlane Street, Room 250 — Little Rock, AR **72201**
   Payment frequencies: **AR-(W)** / **AR-(BW)**

**| PASS |**

---

5. **California (CA)**
   Address: State Capitol, Suite 1173 — Sacramento, CA **95814**
   Payment frequencies: **CA-(W)** / **CA-(BW)**

**| PASS |**

---

6. **Colorado (CO)**
   Address: 136 State Capitol — Denver, CO **80203-1792**
   Payment frequencies: **CO-(W)** / **CO-(BW)**

**| PASS |**

---

7. **Connecticut (CT)**
   Address: 210 Capitol Avenue — Hartford, CT **06106**
   Payment frequencies: **CT-(W)** / **CT-(BW)**

**| PASS |**

---

8. **Delaware (DE)**
   Address: Legislative Hall — Dover, DE **19901**
   Payment frequencies: **DE-(W)** / **DE-(BW)**

**| PASS |**

---

9. **Florida (FL)**
   Address: The Capitol, 400 South Monroe Street — Tallahassee, FL **32399-0001**
   Payment frequencies: **FL-(W)** / **FL-(BW)**

**| PASS |**

---

10. **Georgia (GA)**
    Address: 203 State Capitol — Atlanta, GA **30334**
    Payment frequencies: **GA-(W)** / **GA-(BW)**

**| PASS |**

---

11. **Hawaii (HI)**
    Address: Executive Chambers, State Capitol — Honolulu, HI **96813**
    Payment frequencies: **HI-(W)** / **HI-(BW)**

**| PASS |**

---

12. **Idaho (ID)**
    Address: 700 West Jefferson Street, 2nd Floor — Boise, ID **83702**
    Payment frequencies: **ID-(W)** / **ID-(BW)**

**| PASS |**

---

13. **Illinois (IL)**
    Address: State Capital, 207 Statehouse — Springfield, IL **62706**
    Payment frequencies: **IL-(W)** / **IL-(BW)**

**| PASS |**

---

14. **Indiana (IN)**
    Address: State House, Room 206 — Indianapolis, IN **46204-2797**
    Payment frequencies: **IN-(W)** / **IN-(BW)**

**| PASS |**

---

15. **Iowa (IA)**
    Address: State Capitol — Des Moines, IA **50319-0001**
    Payment frequencies: **IA-(W)** / **IA-(BW)**

**| PASS |**

---

16. **Kansas (KS)**
    Address: Capitol, 300 SW 10th Avenue, Suite 212S — Topeka, KS **66612-1590**
    Payment frequencies: **KS-(W)** / **KS-(BW)**

**| PASS |**

---

17. **New Hampshire (NH)**
    Address: 107 North Main Street, Room 208 — Concord, NH **03301**
    Payment frequencies: **NH-(W)** / **NH-(BW)**

**| PASS |**

---

18. **New York (NY)**
    Address: State Capitol — Albany, NY **12224**
    Payment frequencies: **NY-(W)** / **NY-(BW)**

**| PASS |**

---

19. **Pennsylvania (PA)**
    Address: Main Capitol Building, Room 225 — Harrisburg, PA **17120**
    Payment frequencies: **PA-(W)** / **PA-(BW)**

**| PASS |**

---

20. **Tennessee (TN)**
    Address: State Capitol — Nashville, TN **37243-0001**
    Payment frequencies: **TN-(W)** / **TN-(BW)**

**| PASS |**

---

21. **Texas (TX)**
    Address: P.O. Box 12428 — Austin, TX **78711-2428**
    Payment frequencies: **TX-(W)** / **TX-(BW)**

**| PASS |**

---

22. **Washington (WA)**
    Address: P.O. Box 40002 — Olympia, WA **98504-0002**
    Payment frequencies: **WA-(W)** / **WA-(BW)**

**| PASS |**

---

23. **West Virginia (WV)**
    Address: 1900 Kanawha St. — Charleston, WV **25305**
    Payment frequencies: **WV-(W)** / **WV-(BW)**

**| PASS |**

---



---------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in STG

1. **Alabama (CA)**
   **Address:** California State Capitol, 1315 10th Street — Sacramento, CA **95814**
   **Payment frequencies:** **AL-(W)** / **CT-(BW)**

**| AccountPk: 206886 |**

   **| PASS |**

---

2. **Alaska (NY)**
   **Address:** New York State Capitol, State Street and Washington Avenue — Albany, NY **12224**
   **Payment frequencies:** **AK-(W)** / **WA-(BW)**

**| AccountPk: 206887 |**

   **| PASS |**

---