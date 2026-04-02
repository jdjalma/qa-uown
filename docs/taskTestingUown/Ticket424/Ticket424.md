----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/424


UOWN | SVC | New indicator to be sent to Profituity(ACH vendor) for Kornerstone accounts


Sandbox Base URL: https://sandbox.dev.profituity.com/
Username: [same as now]
Password: [same as now0
Uown Merchant Id: 10269
Kornerstone Merchant Id:  10270
We will get production Kornerstone Merchant Id later.
Changes to be made in ProfituityClient.
1. getEndpointURL method Modify only the sandbox URL.
2. createBase64StringPendingPayments method. Introduce a small private method in ProfituityClient to determine the merchantId based on svAccount.company. Make the merchant IDs configurable.
3. Update getStatusDatePaymentsList
Comment out the section where the query parameter merchantId is added.
We no longer send a merchant ID, since Profituity returns all results when no ID is provided.

---

Once the changes are deployed, please test on dev2 using the following steps:
1. Create several ACH payments from the Servicing → Make Payment screen for today’s date, using both a UOWN account and a Kornerstone account.

2. Enable and run sendACHPaymentsSweep. This sends the ACH payments to Profituity using the correct merchant IDs.

3. Enable and run getSendACHPaymentsStatusSweep. This retrieves the acknowledgement from Profituity indicating whether they successfully received the ACH payments.verify uown_sv_achpayment table .Below are the change in statuses you see for the ach payments posted and sent in step2.
* On success:
    * status = SENT
    * payment_pk != null (payment is posted)
* On failure (e.g., invalid routing/account number):
    * status = ACK_ERROR
    * payment_pk = null (payment is not posted)

4. Enable and run getStatusDatePaymentsListSweep. This retrieves the final. ACH status from Profituity. On lower environments, status in sv_achpayment should update immediately to SETTLED or RETURNED. (Note: I made changes to simulate this behavior, which was not working previously.)

---

## tests on dev2

### UOWN account

https://svc-website-dev2.uownleasing.com/customer-information/117

Verifications on step 3 failed the column `vendor_achstatus` from `uown_sv_achpayment` was empty

|status|vendor_achstatus|payment_pk|pk|
|------|----------------|----------|--|
|SENT||378|78|

Step 4 was executed anyways

The vencor_ach status was set to **Unsent**

### Kornerstone

https://svc-website-dev2.uownleasing.com/customer-information/119

Same results from step3 for the UOWN account

Before running sweep on step 3
|status|vendor_achstatus|payment_pk|pk|row_created_timestamp|
|------|----------------|----------|--|---------------------|
|SENT||379|79|2025-12-11 08:34:43.335|

After the sweep on step 3
|status|vendor_achstatus|payment_pk|pk|row_created_timestamp|
|------|----------------|----------|--|---------------------|
|SENT|Unsent|379|79|2025-12-11 08:34:43.335|

@marcos.pacheco.silva 
You ran the sweeps too soon, which caused the vendor status to not update correctly.
Please allow at least a 3–5 minute gap between each sweep.
If you look at the ACH for account 119 or 118, you can see the status has now updated to Returned.
Please create Request ACH Payments for one UOWN account and one Kornerstone account on dev2 and test tomorrow. Both accounts you tested earlier were UOWN.
After repeating the steps with two different company accounts, please let José know so he can test it on QA2.
---

## tests on dev2

### UOWN account

https://svc-website-dev2.uownleasing.com/customer-information/117

Verifications on step 3 failed the column `vendor_achstatus` from `uown_sv_achpayment` was empty

|status|vendor_achstatus|payment_pk|pk|
|------|----------------|----------|--|
|SENT||378|78|

Step 4 was executed anyways

The vencor_ach status was set to **Unsent**

### Kornerstone

https://svc-website-dev2.uownleasing.com/customer-information/119

Same results from step3 for the UOWN account

Before running sweep on step 3
|status|vendor_achstatus|payment_pk|pk|row_created_timestamp|
|------|----------------|----------|--|---------------------|
|SENT||379|79|2025-12-11 08:34:43.335|

After the sweep on step 3
|status|vendor_achstatus|payment_pk|pk|row_created_timestamp|
|------|----------------|----------|--|---------------------|
|SENT|Unsent|379|79|2025-12-11 08:34:43.335|

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


---

## **UOWN | SVC | Novo indicador a ser enviado para a Profituity (fornecedor ACH) para contas Kornerstone**

**Sandbox Base URL:** [https://sandbox.dev.profituity.com/](https://sandbox.dev.profituity.com/)
**Usuário:** [o mesmo de hoje]
**Senha:** [a mesma de hoje]
**Uown Merchant Id:** 10269
**Kornerstone Merchant Id:** 10270

O **Merchant Id de produção da Kornerstone** será fornecido posteriormente.

---

### **Alterações a serem feitas no ProfituityClient**

1. **Método `getEndpointURL`**

   * Modificar apenas a URL de sandbox.

2. **Método `createBase64StringPendingPayments`**

   * Introduzir um pequeno método privado no `ProfituityClient` para determinar o `merchantId` com base em `svAccount.company`.
   * Tornar os Merchant IDs configuráveis.

3. **Atualizar `getStatusDatePaymentsList`**

   * Comentar a seção onde o parâmetro de query `merchantId` é adicionado.
   * Não enviaremos mais o Merchant ID, pois a Profituity retorna todos os resultados quando nenhum ID é informado.

---

### **Após o deploy das alterações, testar no dev2 seguindo os passos abaixo**

1. Criar vários pagamentos **ACH** pela tela **Servicing → Make Payment**, com a data de hoje, utilizando tanto uma conta **UOWN** quanto uma conta **Kornerstone**.

2. Habilitar e executar o **sendACHPaymentsSweep**.

   * Esse processo envia os pagamentos ACH para a Profituity utilizando os Merchant IDs corretos.

3. Habilitar e executar o **getSendACHPaymentsStatusSweep**.

   * Esse processo recupera o acknowledgement da Profituity indicando se os pagamentos ACH foram recebidos com sucesso.
   * Verificar a tabela **uown_sv_achpayment**.
   * Abaixo estão as mudanças de status esperadas para os pagamentos ACH enviados no passo 2:

   **Em caso de sucesso:**

   * `status = SENT`
   * `payment_pk != null` (pagamento foi postado)

   **Em caso de falha (ex.: número de roteamento/conta inválido):**

   * `status = ACK_ERROR`
   * `payment_pk = null` (pagamento não foi postado)

4. Habilitar e executar o **getStatusDatePaymentsListSweep**.

   * Esse processo recupera o status final do ACH da Profituity.
   * Em ambientes inferiores, o status na tabela **sv_achpayment** deve ser atualizado imediatamente para **SETTLED** ou **RETURNED**.
   * **Observação:** foram feitas alterações para simular esse comportamento, que anteriormente não estava funcionando.

---

## **Testes no dev2**

### **Conta UOWN**

[https://svc-website-dev2.uownleasing.com/customer-information/117](https://svc-website-dev2.uownleasing.com/customer-information/117)

As verificações do **passo 3** falharam: a coluna `vendor_achstatus` da tabela `uown_sv_achpayment` estava vazia.

| status | vendor_achstatus | payment_pk | pk |
| ------ | ---------------- | ---------- | -- |
| SENT   |                  | 378        | 78 |

O **passo 4** foi executado mesmo assim.

O status `vendor_achstatus` foi definido como **Unsent**.

---

### **Kornerstone**

[https://svc-website-dev2.uownleasing.com/customer-information/119](https://svc-website-dev2.uownleasing.com/customer-information/119)

Os mesmos resultados do passo 3 ocorreram para a conta UOWN.

**Antes de executar o sweep do passo 3**

| status | vendor_achstatus | payment_pk | pk | row_created_timestamp   |
| ------ | ---------------- | ---------- | -- | ----------------------- |
| SENT   |                  | 379        | 79 | 2025-12-11 08:34:43.335 |

**Após executar o sweep do passo 3**

| status | vendor_achstatus | payment_pk | pk | row_created_timestamp   |
| ------ | ---------------- | ---------- | -- | ----------------------- |
| SENT   | Unsent           | 379        | 79 | 2025-12-11 08:34:43.335 |

---

@marcos.pacheco.silva
Você executou os **sweeps** cedo demais, o que fez com que o status do fornecedor não fosse atualizado corretamente.
Por favor, aguarde **no mínimo de 3 a 5 minutos** entre a execução de cada sweep.
Se você verificar os ACH das contas **119** ou **118**, é possível ver que o status agora foi atualizado para **Returned**.
Por favor, crie **Request ACH Payments** para **uma conta UOWN** e **uma conta Kornerstone** no **dev2** e realize os testes amanhã. As duas contas testadas anteriormente eram **UOWN**.
Após repetir os passos com **duas contas de empresas diferentes**, avise o **José** para que ele possa testar no **QA2**.

---

Aqui está a tradução para o português do trecho que você forneceu:

---

## Testes no dev2

### Conta UOWN

[Link para a conta UOWN](https://svc-website-dev2.uownleasing.com/customer-information/117)

As verificações na etapa 3 falharam porque a coluna `vendor_achstatus` da tabela `uown_sv_achpayment` estava vazia.

| status  | vendor_achstatus | payment_pk | pk |
| ------- | ---------------- | ---------- | -- |
| ENVIADO |                  | 378        | 78 |

A etapa 4 foi executada mesmo assim.

O status do `vendor_ach` foi configurado como **Não Enviado**.

### Kornerstone

[Link para a conta Kornerstone](https://svc-website-dev2.uownleasing.com/customer-information/119)

Os mesmos resultados da etapa 3 para a conta UOWN.

Antes de rodar a varredura na etapa 3:

| status  | vendor_achstatus | payment_pk | pk | row_created_timestamp   |
| ------- | ---------------- | ---------- | -- | ----------------------- |
| ENVIADO |                  | 379        | 79 | 2025-12-11 08:34:43.335 |

Após a varredura na etapa 3:

| status  | vendor_achstatus | payment_pk | pk | row_created_timestamp   |
| ------- | ---------------- | ---------- | -- | ----------------------- |
| ENVIADO | Não Enviado      | 379        | 79 | 2025-12-11 08:34:43.335 |

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 1 arquivo
+
16
−
69
 src/main/java/com/uownleasing/svc/service/ach/ProfituityClient.java 
+
16
−
69

Visualizado
@@ -57,8 +57,6 @@ public class ProfituityClient implements AchVendorHandler {

    private static String baseURL;

    String merchantId;

    int achPaymentsStatusTop;

    @Autowired
@@ -121,13 +119,17 @@ public class ProfituityClient implements AchVendorHandler {
    private void getEndpointURL() {
        if (SystemConfigurationManagement.isProduction()) {
            baseURL = configurationManagement.getString(configurationPath + "url.prod", "https://platform.profituity.com/api/");
            merchantId = configurationManagement.getString(configurationPath + "uown.merchantId", "1003");
        } else {
            baseURL = configurationManagement.getString(configurationPath + "url.test", "https://sandbox.dev.profituity.com/api/");
            merchantId = configurationManagement.getString(configurationPath + "uown.merchantId", "10269");
        }
    }

    private String getMerchantId(SvAccount svAccount) {
        return svAccount == null || svAccount.getAccountInfo().getCompany().equals(Company.UOWN)
            ? configurationManagement.getString(configurationPath + "uown.merchantId", "1003", "10269")
            : configurationManagement.getString(configurationPath + "kornerstone.merchantId", "10270");
Marcos Silvano
Marcos Silvano
@marcos.pacheco.silva
3 dias atrás
Autor
Maintainer
TBD different kornerstone.merchantId for production

Editado 3 dias atrás por Marcos Silvano
Responder…
    }

    @Override
    public SendACHPaymentsResponse sendFileToVendor(List<SvACHPayment> achPayments, Function<String, Boolean> interruptFunc, String baseConfig) {
        try {
@@ -254,6 +256,7 @@ public class ProfituityClient implements AchVendorHandler {
    }

    public int getNumberOfTotalResponseFromVendor(){
        String merchantId = getMerchantId(null);
        ResponseEntity<String> resultJSON = getStatusDatePaymentsList(String.valueOf(1), null, merchantId, LocalDate.now().toString(), LocalDate.now().toString());

        String body = resultJSON.getBody();
@@ -275,13 +278,13 @@ public class ProfituityClient implements AchVendorHandler {
        log.info("Multi-threads applied : {}, total payment count : {}, number of threads : {}.", turnOnMultiThread.booleanValue(), totalCount, threadSize);

        int start = configurationManagement.getInteger(configurationPath + "uown.achPaymentResponseStartFrom", 0);

        String merchantId = getMerchantId(null);
        for(int skip = start; skip < totalCount; skip+=achPaymentsStatusTop){
            ResponseEntity<String> resultJSON =  getStatusDatePaymentsList(String.valueOf(achPaymentsStatusTop),
                                                    String.valueOf(skip),
                                                    merchantId,
                                                    LocalDate.now().toString(),
                                                    LocalDate.now().toString());
            ResponseEntity<String> resultJSON = getStatusDatePaymentsList(String.valueOf(achPaymentsStatusTop),
                String.valueOf(skip),
                merchantId,
                LocalDate.now().toString(),
                LocalDate.now().toString());

            String body = resultJSON.getBody();
            JsonObject jsonObject = JsonUtils.getGson().fromJson(body, JsonObject.class);
@@ -616,6 +619,7 @@ public class ProfituityClient implements AchVendorHandler {
                        ? "PersonalChecking" : "PersonalSavings";
                }

                String merchantId = getMerchantId(svACHPayment.getAccount());
                // Build list
                list = new ArrayList<>(Arrays.asList(
                    merchantId,
@@ -672,59 +676,6 @@ public class ProfituityClient implements AchVendorHandler {
        return achPaymentDetails;
    }

    //Not in use.
    public Map<String, String> createACHPaymentCsvFile(List<SvACHPayment> achPayments) {
        final String FILE_NAME = "src/main/resources/achpayments/ACHPaymentFile_" + LocalDateTime.now().withNano(0) + ".csv";
        String uuid = UUID.randomUUID().toString();
        String Base64String = null;
        String fileName = FILE_NAME.split("/")[4];
        Path newFilePath = Paths.get(FILE_NAME);
        Path path = null;
        String achProcessType = configurationManagement.getString(configurationPath + "uown.achProcessType", "ACHDebit");

        try {
            path = Files.createFile(newFilePath);
        } catch (Exception e) {
            log.info("Exception at file creation " + e);
        }
        File file = new File(path.toString());
        try {
            FileWriter outputfile = new FileWriter(file);
            CSVWriter writer = new CSVWriter(outputfile, CSVWriter.DEFAULT_SEPARATOR, CSVWriter.NO_QUOTE_CHARACTER, CSVWriter.DEFAULT_ESCAPE_CHARACTER, CSVWriter.DEFAULT_LINE_END);
            //Clearing the csv before adding new data.
            writer.flush();
            List<String[]> data = new ArrayList<String[]>();
            data.add(new String[]{"MerchantId", "Name", "RouteNumber", "AccountNumber", "AccountType", "Amount", "Type", "EntryClass", "ACHPaymentTypeCode", "IdentificationNumber", "SendDate", "ExternalPaymentId"});
            for (int i = 0; i < achPayments.size(); i++) {
                SvACHPayment svACHPayment = achPayments.get(i);
                ACHPayment achPayment = svACHPayment.getAchPayment();
                data.add(new String[]{merchantId, achPayment.getCustomerFirstName() + " " + achPayment.getCustomerLastName(), achPayment.getBankData().getRoutingNumber(),
                    achPayment.getBankData().getAccountNumber(), BankAccountType.valueOf(achPayment.getBankAccountType().toString()).toString(),
                    achPayment.getAmount().toString(), achProcessType, achPayment.getEntryClass() == null ? "PPD" : achPayment.getEntryClass().name(), "",
                    String.valueOf(svACHPayment.getPk()), LocalDate.now().toString(), uuid});
                achPayment.setPaymentFileName(fileName);
                achPayment.setRowNumber(i + 1);
                achPayment.setAccountPk(svACHPayment.getAccount().getPk());
                achPayment.setPk(svACHPayment.getPk());
                svACHPaymentService.createOrUpdateSvAchPayment(achPayment);
            }
            writer.writeAll(data);
            writer.close();

            byte[] bytes = Files.readAllBytes(file.toPath());
            Base64.Encoder encoder = Base64.getEncoder();
            Base64String = encoder.encodeToString(bytes);
            log.info("CSV to Base64 string :  " + Base64String);
        } catch (IOException e) {
            e.printStackTrace();
        }
        Map<String, String> achPaymentDetails = new HashMap<>();
        achPaymentDetails.put("fileName", fileName);
        achPaymentDetails.put("fileContents", Base64String);

        return achPaymentDetails;
    }

    public String getAuthToken() {
        SvAuthToken svAuthToken = svAuthTokenRepo.getAuthToken(ACHVendor.PROFITUITY);
        if (svAuthToken == null) {
@@ -824,7 +775,8 @@ public class ProfituityClient implements AchVendorHandler {
            if (skip != null) {
                queryParams.add("skip", skip);
            }
            if (merchantId != null) {
            boolean sendMerchantIdInParams = configurationManagement.getBoolean(configurationPath + "sendMerchantIdInParams", Boolean.TRUE);
            if (merchantId != null && sendMerchantIdInParams) {
                queryParams.add("merchantId", merchantId);
            }
            if (StringUtils.isNotBlank(startDate)) {
@@ -1418,9 +1370,4 @@ public class ProfituityClient implements AchVendorHandler {
            String s = es.getMessage();
        }
    }

}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Card Number: 6011000993026909
Security Code: 996
Expiration Date: 12/28

Card Number: 5146315000000055
Security Code: 998
Expiration Date: 12/28

Accont Number:53523532523523523
Routing Number:021000021

---

# Requisitos de Teste – Lista Final (Somente Testáveis)

## 1. Criação de Pagamentos ACH (Pré-condição)

1. **Criar pagamento ACH para conta UOWN**

   * Via tela **Servicing → Make Payment**
   * Data do pagamento = data atual
   * Conta pertencente à empresa **UOWN**

2. **Criar pagamento ACH para conta Kornerstone**

   * Via tela **Servicing → Make Payment**
   * Data do pagamento = data atual
   * Conta pertencente à empresa **Kornerstone**

> Evidência: pagamento visível na UI e registro criado em `uown_sv_achpayment`.

---

## 2. Envio de ACH para Profituity (sendACHPaymentsSweep)

3. **Enviar pagamentos ACH UOWN**

   * Executar `sendACHPaymentsSweep`
   * Pagamentos UOWN devem ser enviados com sucesso.

4. **Enviar pagamentos ACH Kornerstone**

   * Executar `sendACHPaymentsSweep`
   * Pagamentos Kornerstone devem ser enviados com sucesso.

5. **Persistência após envio**

   * Para ambos os pagamentos:

     * `status = SENT`
     * Registro existente na tabela `uown_sv_achpayment`

> Evidência: consulta SQL + logs do sweep (se necessário).

---

## 3. Acknowledgement do Vendor (getSendACHPaymentsStatusSweep)

> **Obrigatório aguardar 3–5 minutos após o passo anterior**

6. **Atualizar status de envio – sucesso**

   * Executar `getSendACHPaymentsStatusSweep`
   * Para pagamentos aceitos pela Profituity:

     * `status = SENT`
     * `payment_pk != null`
     * `vendor_achstatus` **preenchido**

7. **Atualizar status de envio – falha**

   * Para pagamentos rejeitados (ex.: dados bancários inválidos):

     * `status = ACK_ERROR`
     * `payment_pk = null`
     * `vendor_achstatus` preenchido com erro

8. **Garantir que vendor_achstatus não fique vazio**

   * Após o sweep:

     * `vendor_achstatus` **não pode estar vazio**
     * Não deve ser definido como `Unsent` quando houver resposta válida do vendor

> Evidência: consulta direta na tabela `uown_sv_achpayment`.

---

## 4. Consulta de Status Final do ACH (getStatusDatePaymentsListSweep)

9. **Executar sweep de status final**

   * Executar `getStatusDatePaymentsListSweep`
   * Não informar merchantId manualmente (comportamento implícito)

10. **Atualização automática do status final**

    * Em ambientes lower (dev2 / QA2):

      * `status` deve mudar para:

        * `SETTLED` **ou**
        * `RETURNED`

11. **Atualização do vendor_achstatus final**

    * `vendor_achstatus` deve refletir o status retornado pela Profituity
    * Valor consistente com `SETTLED` ou `RETURNED`

> Evidência: estado final do registro após execução do sweep.

---

## 5. Validação Cruzada entre Empresas (Essencial)

12. **Pagamento UOWN não afeta Kornerstone**

    * Status do ACH UOWN não pode sobrescrever ou interferir no ACH Kornerstone.

13. **Pagamento Kornerstone não afeta UOWN**

    * Status do ACH Kornerstone não pode sobrescrever ou interferir no ACH UOWN.

> Evidência: comparação de registros distintos na tabela.

---

## 6. Reexecução Controlada (Regressão)

14. **Reexecutar sweeps sem regressão**

    * Reexecutar:

      * `getSendACHPaymentsStatusSweep`
      * `getStatusDatePaymentsListSweep`
    * Nenhum pagamento deve:

      * Reverter status
      * Perder `vendor_achstatus`
      * Voltar para `Unsent`

---

## 7. Validação Final para QA2

15. **Critério de aceite para promoção**

    * Pelo menos **1 ACH UOWN** e **1 ACH Kornerstone**:

      * Enviados
      * Acknowledged
      * Finalizados (`SETTLED` ou `RETURNED`)
      * Com `vendor_achstatus` preenchido corretamente

---


Card Number: 6011000993026909
Security Code: 996
Expiration Date: 12/28

Card Number: 5146315000000055
Security Code: 998
Expiration Date: 12/28

----------------------------------------------------------------


Here are the English translations:

* **pagamentos rejeitados** → 
**rejected payments**

* **pagamentos realizados com sucesso e retornados** → 
**payments successfully processed and refunded**

**Blocked Account**

**Insufficient Funds**