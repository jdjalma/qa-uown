----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1153


Aqui está o conteúdo **em formato Markdown (.md)**, **em Português e Inglês**, preservando toda a estrutura e melhorando apenas a legibilidade.

---

# 🇺🇸 **UOWN | Origination | Blacklist Credit Card Based on First 6 Digits (ccBin)**

## **Synopsis**

A new column **ccBin** has already been added to the blacklist.
The next step is to enable functionality to blacklist credit cards based on the **first 6 digits (BIN)** of the card number.
This will allow more precise control over which credit cards can be used in the system.

## **Business Objective**

Adding BIN-based credit card blacklisting will strengthen fraud prevention and provide greater flexibility for risk management.

This allows the business team to:

* Block cards from specific issuers
* Stop transactions from known risky card ranges
* Improve fraud detection without impacting all customers

## **Feature Request | Business Requirements**

* Create functionality to blacklist a credit card based on its first 6 digits (**ccBin**).
* Add validation inside the method:

```
Uownclient.authorizeCreditCard
```

## **Overview**

This feature introduces **credit card BIN blacklisting**.
If a credit card's first 6 digits match any entry in the blacklist, the authorization must be denied.

---

# **Test Scenarios**

## **1. Add a ccBin to the Blacklist**

### Steps:

* Navigate to the **Blacklist** page
* Add a **ccBin** entry and save

### Expected Result:

* The new BIN appears in the list
* The value is stored in the **ccBin** column

---

## **2. BIN Blacklist Check — BIN Found in Blacklist**

### Steps:

1. Navigate to the **Complete Application Form**
2. Enter a credit card number whose **first 6 digits match a blacklisted BIN**
3. Fill out required fields and submit

### Expected Result:

* Submission is **rejected**
* System displays an error indicating the card is not allowed
* Lead status becomes **BLACKLIST_DENIED**
* User **cannot continue** with the transaction

---

## **3. BIN Blacklist Check — BIN Not in Blacklist**

### Steps:

1. Navigate to the **Complete Application Form**
2. Enter a credit card with a BIN **not listed** in the blacklist
3. Submit the form normally

### Expected Result:

* Authorization proceeds normally
* No blacklist errors
* Transaction completes successfully

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 **UOWN | Origination | Lista Negra de Cartões de Crédito com Base nos Primeiros 6 Dígitos (ccBin)**

## **Sinopse**

Uma nova coluna **ccBin** já foi adicionada à tabela de blacklist.
O próximo passo é habilitar a funcionalidade para bloquear cartões de crédito com base nos **6 primeiros dígitos (BIN)** do número do cartão, permitindo um controle mais preciso sobre quais cartões podem ser usados no sistema.

## **Objetivo de Negócio**

Adicionar o bloqueio por BIN fortalece a prevenção contra fraude e oferece maior flexibilidade para gestão de risco.

Isso permite que a equipe de negócios:

* Restrinja cartões de emissores específicos
* Bloqueie faixas de cartões conhecidamente problemáticas
* Aumente a segurança sem impactar todos os usuários

## **Requisitos da Funcionalidade**

* Criar funcionalidade para bloquear cartões com base nos 6 primeiros dígitos (**ccBin**)
* Incluir a validação no método:

```
Uownclient.authorizeCreditCard
```

## **Visão Geral**

Esta feature implementa o bloqueio de cartões baseado no BIN.
Se os 6 primeiros dígitos do cartão estiverem cadastrados na blacklist, a autorização deve ser negada.

---

# **Cenários de Teste**

## **1. Adicionar um ccBin à Blacklist**

### Passos:

* Acessar a página **Blacklist**
* Adicionar um **ccBin** e salvar

### Resultado Esperado:

* O BIN aparece listado
* O valor é salvo na coluna **ccBin**

---

## **2. Verificação de BIN — BIN Presente na Blacklist**

### Passos:

1. Acessar o **Complete Application Form**
2. Inserir um cartão cujo **BIN (primeiros 6 dígitos)** está bloqueado
3. Preencher os demais campos e enviar

### Resultado Esperado:

* A solicitação é **rejeitada**
* Mensagem de erro indicando que o cartão não pode ser processado
* Lead recebe o status **BLACKLIST_DENIED**
* Usuário **não pode continuar** a transação

---

## **3. Verificação de BIN — BIN Não Listado na Blacklist**

### Passos:

1. Acessar o **Complete Application Form**
2. Informar cartão com BIN **não bloqueado**
3. Enviar normalmente

### Resultado Esperado:

* Autorização ocorre normalmente
* Nenhum erro relacionado à blacklist
* Transação concluída com sucesso

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

package com.uownleasing.common.enumeration;

public enum CCTransactionType {
    SCHEDULED, REQUEST, OTHER, RERUN, RERUN_NSF, DAILY_DELINQUENCY_RUN, _100_DAY_DELINQUENCY_RUN, DAILY_SCHEDULED_DENIED_RERUN, VINTAGE_RUN, VINTAGE_RUN_ON_APPROVED
    SCHEDULED, REQUEST, OTHER, RERUN, RERUN_NSF, DAILY_DELINQUENCY_RUN, _100_DAY_DELINQUENCY_RUN, DAILY_SCHEDULED_DENIED_RERUN, VINTAGE_RUN, VINTAGE_RUN_ON_APPROVED, BLACKLIST_CHECK
}

---


 4 arquivos
+
22
−
0
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

components/modal
‎s/blacklist-modal‎

inde
‎x.tsx‎
+12 -0

mod
‎els‎

blacklis
‎t-data.ts‎
+1 -0

pages/b
‎lacklist‎

inde
‎x.tsx‎
+3 -0

ut
‎ils‎

data-table-
‎columns.tsx‎
+6 -0

 components/modals/blacklist-modal/index.tsx 
+
12
−
0

Visualizado
@@ -88,6 +88,18 @@ const BlacklistModal = (props: BlacklistModalProps) => {
          </Col>
        </Row>

        <Row className="mt-2">
          <Col>
            <InputField
              name="ccBin"
              formik={formik}
              label="Credit Card BIN"
              isNumbersOnly={true}
              maxLength={6}
            />
          </Col>
        </Row>

        <Row className="mt-2">
          <Col>
            <InputField
 models/blacklist-data.ts 
+
1
−
0

Visualizado
@@ -21,4 +21,5 @@ export interface BlacklistData {
  bankAccountNumber: string;
  bankRoutingNumber: string;
  expirationDate: string;
  ccBin: string;
}
 pages/blacklist/index.tsx 
+
3
−
0

Visualizado
@@ -90,6 +90,7 @@ const Blacklist = (props: BlacklistProps) => {
    bankAccountNumber: '',
    bankRoutingNumber: '',
    expirationDate: '',
    ccBin: '',
  };

  const formik = useFormik({
@@ -138,6 +139,8 @@ const Blacklist = (props: BlacklistProps) => {
        .min(9, 'Routing number must be 9 digits long')
        .max(9, 'Routing number must be 9 digits long'),
      expirationDate: Yup.string(),
      ccBin: Yup.string()
        .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
    }),
    onSubmit: async (values) => {
      const {expirationDate = '', phoneNumber = ''} = values;
 utils/data-table-columns.tsx 
+
6
−
0

Visualizado
@@ -2955,6 +2955,12 @@ export const blacklistPageTableColumns = (formik: any) => {
      width: '200px',
      selector: (row) => row?.blackListInfo?.bankRoutingNumber,
    },
    {
      name: 'CC BIN',
      key: 'ccBin',
      width: '150px',
      selector: (row) => row?.blackListInfo?.ccBin,
    },
  ];
};

---


 4 arquivos
+
44
−
6
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

ser
‎vice‎

appli
‎cation‎

SendApplicati
‎onService.java‎
+1 -1

SubmitApplicat
‎ionService.java‎
+1 -1

BlackListS
‎ervice.java‎
+5 -3

uownC
‎lient‎

UownCli
‎ent.java‎
+37 -1

 src/main/java/com/uownleasing/svc/service/application/SendApplicationService.java 
+
1
−
1

Visualizado
@@ -232,7 +232,7 @@ public class SendApplicationService {
            if(configurationManagement.getBoolean(configurationPath+"check.black.list", true)) {
                List<LosBlackList> results = apiInfoTrackerService.logApi(lead.getPk(), "sendApplication", "checkBlackList", () -> blackListService.checkBlackList(applicationRequest.getMainFirstName(), applicationRequest.getMainLastName(), applicationRequest.getEmailAddress(),
                    applicationRequest.getMainCellPhone() == null ? null : applicationRequest.getMainCellPhone().toString(), applicationRequest.getMainSSN(), applicationRequest.getMainPostalCode(),
                    applicationRequest.getMainBankAccountNumber(), applicationRequest.getMainBankRoutingNumber(), applicationRequest.getMainAddress1()));
                    applicationRequest.getMainBankAccountNumber(), applicationRequest.getMainBankRoutingNumber(), applicationRequest.getMainAddress1(), null));

                if(results.size() > 0) {
                    BlackListInfo item = results.get(0).getBlackListInfo();
 src/main/java/com/uownleasing/svc/service/application/SubmitApplicationService.java 
+
1
−
1

Visualizado
@@ -180,7 +180,7 @@ public class SubmitApplicationService {
            bankAccountInfo.setBankName(request.getBankName());
            bankAccountInfo.setAutoPay(true);
            bankAccountInfo.setName(StringUtils.isNotBlank(request.getBankAccountCustomerFirstName()) && StringUtils.isNotBlank(request.getBankAccountCustomerLastName()) ? request.getBankAccountCustomerFirstName() + " " + request.getBankAccountCustomerLastName() : "");
            List<LosBlackList> results = blackListService.checkBlackList(null,null, null, null, null, null, request.getBankAccountNumber(), request.getBankRoutingNumber(), null);
            List<LosBlackList> results = blackListService.checkBlackList(null,null, null, null, null, null, request.getBankAccountNumber(), request.getBankRoutingNumber(), null, null);
            if( results.size() > 0) {
                String extractedData = blackListService.getLogString(results.get(0).getBlackListInfo());
                String notes = "Found the bank account information from the blacklist - reason: " + extractedData;
 src/main/java/com/uownleasing/svc/service/BlackListService.java 
+
5
−
3

Visualizado
@@ -84,13 +84,14 @@ public class BlackListService {
    public LosBlackList createOrUpdateBlackListItem(BlackListInfo blackListInfo) {
        Optional<LosBlackList> result = losBlackListRepo.findByPk(blackListInfo.getPk());
        LosBlackList losBlackList = result.isPresent() ? result.get() : new LosBlackList();

        losBlackList.setBlackListInfo(blackListInfo);
        losBlackList.setAgent(SvThreadAttributes.getUsername());
        losBlackListRepo.save(losBlackList);
        return losBlackList;
    }

    public List<LosBlackList> checkBlackList(String firstName, String lastName, String emailAddress, String phoneNumber, String ssn, String zipCode, String bankAccountNumber, String bankRoutingNumber, String streetAddress1) {
    public List<LosBlackList> checkBlackList(String firstName, String lastName, String emailAddress, String phoneNumber, String ssn, String zipCode, String bankAccountNumber, String bankRoutingNumber, String streetAddress1, String ccBin) {
        if(configurationManagement.getBoolean(configurationPath + "black.list.check.manual.query", Boolean.FALSE)) {
            SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("checkBlackList");
            String sql = sqlConfig.getSqlConfigInfo().getSqlQuery();
@@ -104,7 +105,8 @@ public class BlackListService {
                .setParameter("bankAccountNumber", bankAccountNumber)
                .setParameter("bankRoutingNumber", bankRoutingNumber)
                .setParameter("streetAddress1", streetAddress1)
                .setParameter("zipCode", zipCode);
                .setParameter("zipCode", zipCode)
                .setParameter("ccBin", ccBin);
            NativeQueryImpl nativeQuery = (NativeQueryImpl) query;

            nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
@@ -128,7 +130,7 @@ public class BlackListService {
        }
        else {
            List<LosBlackList> results = losBlackListRepo.checkBlackList(firstName, lastName,
                emailAddress, phoneNumber, ssn, zipCode, bankAccountNumber, bankRoutingNumber, streetAddress1);
                emailAddress, phoneNumber, ssn, zipCode, bankAccountNumber, bankRoutingNumber, streetAddress1, ccBin);
            return results;
        }
    }
 src/main/java/com/uownleasing/svc/uownClient/UownClient.java 
+
37
−
1

Visualizado
@@ -10,6 +10,7 @@ import com.uownleasing.los.common.db.config.LosThreadAttributes;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.service.BlackListService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.*;
@@ -169,6 +170,9 @@ public abstract class UownClient {
    @Autowired
    LeadCustomerService leadCustomerService;

    @Autowired
    private BlackListService blackListService;

    protected String configurationPath = "com.uownleasing.svc.uownclient.UownClient.";

    private Map<String,String> propertiesMap;
@@ -420,8 +424,40 @@ public abstract class UownClient {
        return requiredFields;
    }

    private CCTransactionInfo validateCreditCardBin(CCInfo ccInfo, LosLead lead) {
        String ccBin = null;
        String ccNumber = ccInfo.getCcNumber();
        if (StringUtils.isNotBlank(ccNumber) && ccNumber.length() >= 10 && !ccNumber.contains("*")) {
            ccBin = ccNumber.substring(0, 6);
        }

        if (configurationManagement.getBoolean(configurationPath + "check.cc.bin.blacklist", Boolean.FALSE, Boolean.TRUE)
            && StringUtils.isNotBlank(ccBin)) {
            List<LosBlackList> binBlackListResults = blackListService.checkBlackList(null, null, null, null, null, null, null, null, null, ccBin);
            if (CollectionUtils.isNotEmpty(binBlackListResults)) {
                CCTransactionInfo ccTransactionInfo = new CCTransactionInfo();
Priyanka Namburu
Priyanka Namburu
@pnamburu
1 dia atrás
Owner
Add BLACKLIST_CHECK as CCTransactionType in common and set that here.

Responder…
                ccTransactionInfo.setCcInfo(ccInfo);
                ccTransactionInfo.setStatus(CCTransactionStatus.ERROR);
                ccTransactionInfo.setError("Failed to verify card");
                ccTransactionInfo.setCcTransactionType(CCTransactionType.BLACKLIST_CHECK);

                String note = "Credit card BIN " + ccBin + " is blacklisted";
                updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.BLACKLIST_DENIED, "[UownClient][authorizeCreditCard] " + note, note, LogType.INTERNAL);
                log.info("[UownClient][authorizeCreditCard] Credit card BIN {} is blacklisted", ccBin);
                return ccTransactionInfo;
            }
        }
        return null;
    }

    public CCTransactionInfo authorizeCreditCard(CCInfo ccInfo) {
        log.info("[UownClient] authorizeCreditCard for CCInfo CardHolder {}", ccInfo.getCcFirstName()+" "+ccInfo.getCcLastName());
        LosLead lead = leadService.getByLeadPk(ccInfo.getLeadPk());
        CCTransactionInfo binValidationResult = validateCreditCardBin(ccInfo, lead);
        if (binValidationResult != null) {
            return binValidationResult;
        }

        CCTransactionInfo ccTransactionInfo = null;
        if (configurationManagement.getBoolean(configurationPath + "skip.multiple.cc.auth", Boolean.TRUE)
            && ccInfo.getLeadPk() != null && ccInfo.getLeadPk() > 0) { // don't rerun authorization if it has already been run before
@@ -434,9 +470,9 @@ public abstract class UownClient {
            }
        }

        LosLead lead = leadService.getByLeadPk(ccInfo.getLeadPk());
        BigDecimal fee = calculatorService.getFeeToBeChargedForLead(lead);
        fee = fee == null || fee.compareTo(BigDecimal.ZERO) <= 0 ? BigDecimal.valueOf(configurationManagement.getDouble(configurationPath + "default.amount.to.authenticate", 0.01)).setScale(2, RoundingMode.HALF_EVEN) : fee;

        if (ccTransactionInfo == null) {
            if (configurationManagement.getBoolean(configurationPath + "check.duplicate.cc", true)) {
                SqlConfigInfo info = sqlConfigService.getSqlConfigBySqlName("checkCountOfDuplicateCC").getSqlConfigInfo();

---


 1 arquivo
+
4
−
2
 src/main/java/com/uownleasing/los/common/db/repository/LosBlackListRepo.java 
+
4
−
2

Visualizado
@@ -30,7 +30,7 @@ public interface LosBlackListRepo extends JpaRepository<LosBlackList, Long>, Los
            "                               ))", nativeQuery = true)
    Page<LosBlackList> findAllByBlackListInfo(String search, Pageable page);

    @Query(value="SELECT bl.* FROM uown_los_black_list bl\n" +
    @Query(value = "SELECT bl.* FROM uown_los_black_list bl\n" +
            "WHERE  ((bl.first_name IS NOT NULL AND :firstName IS NOT NULL AND REPLACE(LOWER(bl.first_name), ' ','') = REPLACE(LOWER(CAST(:firstName AS VARCHAR)), ' ', ''))\n" +
            "       AND (bl.last_name IS NOT NULL AND :lastName IS NOT NULL AND REPLACE(LOWER(bl.last_name), ' ', '') = REPLACE(LOWER(CAST(:lastName AS VARCHAR)), ' ', '')))\n" +
            "    OR (bl.phone_number IS NOT NULL AND :phoneNumber IS NOT NULL AND REPLACE(bl.phone_number, ' ', '') = REPLACE(CAST(:phoneNumber AS VARCHAR), ' ', ''))\n" +
@@ -44,6 +44,8 @@ public interface LosBlackListRepo extends JpaRepository<LosBlackList, Long>, Los
            "            AND REPLACE(LOWER(bl.street_address1), ' ', '') = REPLACE(LOWER(CAST(:streetAddress1 AS VARCHAR)), ' ', ''))\n" +
            "    OR ((bl.bank_account_number IS NOT NULL AND :bankAccountNumber IS NOT NULL AND REPLACE(bl.bank_account_number, ' ', '') = REPLACE(CAST(:bankAccountNumber AS VARCHAR), ' ', ''))\n" +
            "       AND (bl.bank_routing_number IS NOT NULL AND :bankRoutingNumber IS NOT NULL AND REPLACE(bl.bank_routing_number, ' ', '') = REPLACE(CAST(:bankRoutingNumber AS VARCHAR), ' ', '')))\n" +
            "    OR (bl.cc_bin IS NOT NULL AND bl.cc_bin != '' AND :ccBin IS NOT NULL AND bl.cc_bin = :ccBin)\n" +
            "    AND (bl.expiration_date IS NULL OR bl.expiration_date > CURRENT_DATE)", nativeQuery = true)
    List<LosBlackList> checkBlackList(String firstName, String lastName, String emailAddress, String phoneNumber, String ssn, String zipCode, String bankAccountNumber, String bankRoutingNumber, String streetAddress1);
    List<LosBlackList> checkBlackList(String firstName, String lastName, String emailAddress, String phoneNumber, String ssn, String zipCode, String bankAccountNumber, String bankRoutingNumber, String streetAddress1, String ccBin);

}

---

Quando um usuário acessa a página Blacklist e adiciona um novo ccBin com 6 dígitos válidos, o campo deve aceitar a entrada e salvar o valor na blacklist, permitindo que o sistema bloqueie futuros cartões que começam com esses 6 dígitos

Quando um usuário tenta adicionar um ccBin inválido na página Blacklist (menos de 6 dígitos, mais de 6 dígitos, ou com letras), o sistema deve exibir mensagem de erro "Must be exactly 6 digits" e não permitir o armazenamento, mantendo o formulário aberto para correção

Quando um usuário completa uma aplicação inserindo um cartão de crédito cujos primeiros 6 dígitos estão na blacklist, o sistema deve rejeitar a transação, exibir mensagem de erro indicando que o cartão não é permitido, e impedir que o usuário continue com a aplicação

Quando um usuário tenta usar um cartão de crédito com BIN blacklisted durante o Complete Application Form, o sistema deve negar a autorização, atualizar o status da aplicação para BLACKLIST_DENIED, e impedir qualquer continuação do processo de pagamento

Quando um usuário usa um cartão de crédito com BIN não presente na blacklist durante uma aplicação, o sistema deve processar normalmente, autorizar a transação, e permitir que a aplicação continue sem bloqueios ou erros relacionados à blacklist

Quando múltiplos usuários simultaneamente submetem aplicações com diferentes cartões no Origination Portal, cada cartão deve ser validado independentemente contra a blacklist de BIN, e cada usuário deve receber o resultado apropriado (aprovado ou rejeitado) sem interferência de outras aplicações

Quando um administrador desativa a validação de BIN blacklist nas configurações do sistema, os usuários devem conseguir usar cartões com BIN blacklisted sem rejeição, permitindo flexibilidade operacional quando necessário

Quando um usuário tenta usar um cartão mascarado ou incompleto (menos de 10 dígitos visíveis) no Origination Portal, o sistema deve permitir o prosseguimento sem validação de BIN blacklist, pois não consegue extrair os 6 primeiros dígitos

Quando um cartão com BIN blacklisted é rejeitado durante uma aplicação, o sistema deve exibir mensagem clara ao usuário indicando que o cartão não é aceito, registrar a tentativa para auditoria, e sugerir usar outro método de pagamento se aplicável

Quando um usuário adiciona um ccBin à blacklist (ex: 654321) e em seguida tenta completar uma aplicação com um cartão começando com esses 6 dígitos, o sistema deve rejeitar imediatamente baseado na entrada recém-adicionada, confirmando que a blacklist é consultada em tempo real

Quando um usuário visualiza a página Blacklist após adicionar um ccBin, o novo BIN deve aparecer na tabela de blacklist na coluna "CC BIN", confirmando que foi armazenado corretamente e está ativo para futuras validações

Quando um usuário tenta adicionar um ccBin duplicado na página Blacklist (um BIN que já existe), o sistema deve notificar sobre a duplicata, não permitir armazenamento duplicado, e manter apenas um registro do BIN na blacklist

Quando um usuário acessa a página Blacklist e tenta editar um ccBin já existente, o sistema deve permitir a modificação, validar o novo valor contra regex /^[0-9]{6}$/, e atualizar corretamente na blacklist sem criar duplicatas

Quando um usuário acessa a página Blacklist e tenta deletar um ccBin existente, o sistema deve remover o registro da blacklist, e cartões com esse BIN devem ser autorizado normalmente em futuras transações

Quando um usuário tenta adicionar um ccBin com data de expiração na página Blacklist, o sistema deve validar se a data expirou, e se expirou, não aplicar o bloqueio para cartões com esse BIN mesmo que estejam listados

Quando um usuário busca por um ccBin específico na página Blacklist usando o campo de pesquisa, o sistema deve retornar resultados que correspondem ao BIN digitado, permitindo localizar rapidamente BINs específicos na lista

Quando um usuário visualiza a tabela de Blacklist na página Blacklist, a coluna "CC BIN" deve estar visível e exibir claramente todos os BINs adicionados, permitindo identificar facilmente quais cartões estão bloqueados

Quando um administrador ativa ou desativa a configuração "check.cc.bin.blacklist" nas settings do sistema, o comportamento de validação de BIN deve mudar imediatamente, permitindo flexibilidade operacional em caso de necessidade

Quando um cartão é rejeitado por BIN blacklisted, o sistema deve registrar a tentativa em logs de auditoria com timestamp, BIN utilizado, e lead associado para rastreamento de segurança

Quando múltiplos BINs são adicionados à blacklist (ex: 3 BINs diferentes) e um usuário tenta usar cartões com esses BINs, cada um deve ser rejeitado independentemente, confirmando que todos os BINs da blacklist são consultados

Quando a coluna ccBin é adicionada à tabela blacklist no banco de dados e a query SQL é atualizada com a cláusula OR para ccBin, a validação deve considerar o BIN junto com outros critérios (nome, email, telefone, etc.) sem conflitos

Quando um usuário tenta usar um cartão com BIN que foi adicionado à blacklist após a blacklist ter sido carregada em cache, o sistema deve consultar a blacklist novamente (sem cache obsoleto) e rejeitar a transação corretamente

-----

1. Cenário: Adicionar ccBin válido
Quando um usuário acessa a página Blacklist e adiciona um novo ccBin com 6 dígitos válidos, o campo deve aceitar a entrada e salvar o valor na blacklist, permitindo que o sistema bloqueie futuros cartões que começam com esses 6 dígitos
1. When a user accesses the Blacklist page and adds a new ccBin with 6 valid digits, the field must accept the input and save the value to the blacklist, allowing the system to block future cards that start with those 6 digits.
---

2. Cenário: Adicionar ccBin inválido
Quando um usuário tenta adicionar um ccBin inválido na página Blacklist (menos de 6 dígitos, mais de 6 dígitos, ou com letras), o sistema deve exibir mensagem de erro "Must be exactly 6 digits" e não permitir o armazenamento, mantendo o formulário aberto para correção
2. When a user attempts to add an invalid ccBin on the Blacklist page (less than 6 digits, more than 6 digits, or containing letters), the system must display the error message "Must be exactly 6 digits" and must not allow the value to be stored, keeping the form open for correction.

---

--> Não permite salvar dados da modal com menos de 6 digitos
--> Does not allow saving modal data with fewer than 6 digits

--> Ignora os caracteres após o sexto quando mais que 6
--> Ignores characters after the sixth when more than 6

--> Não permite digitação ou colar letras
--> Does not allow typing or pasting letters

---

3. Cenário: Rejeitar cartão com BIN na blacklist durante aplicação
Quando um usuário completa uma aplicação inserindo um cartão de crédito cujos primeiros 6 dígitos estão na blacklist, o sistema deve rejeitar a transação, exibir mensagem de erro indicando que o cartão não é permitido, e impedir que o usuário continue com a aplicação
3. When a user completes an application by entering a credit card whose first 6 digits are in the blacklist, the system must reject the transaction, display an error message indicating that the card is not allowed, and prevent the user from continuing the application.

---

4. Cenário: Atualizar status para BLACKLIST_DENIED
Quando um usuário tenta usar um cartão de crédito com BIN blacklisted durante o Complete Application Form, o sistema deve negar a autorização, atualizar o status da aplicação para BLACKLIST_DENIED, e impedir qualquer continuação do processo de pagamento
4.When a user attempts to use a credit card with a blacklisted BIN during the Complete Application Form, the system must deny authorization, update the application status to BLACKLIST_DENIED, and block any continuation of the payment process

---

5. Cenário: Processar cartão com BIN não blacklisted
Quando um usuário usa um cartão de crédito com BIN não presente na blacklist durante uma aplicação, o sistema deve processar normalmente, autorizar a transação, e permitir que a aplicação continue sem bloqueios ou erros relacionados à blacklist
5. When a user uses a credit card whose BIN is not present in the blacklist during an application, the system must process normally, authorize the transaction, and allow the application to continue without blacklist-related errors

---

6. Cenário: Mensagem de rejeição
Quando um cartão com BIN blacklisted é rejeitado durante uma aplicação, o sistema deve exibir mensagem clara ao usuário indicando que o cartão não é aceito e registrar a tentativa para auditoria
6. When a card with a blacklisted BIN is rejected during an application, the system must display a clear message indicating that the card is not accepted and must record the attempt for auditing.

---

7. Cenário: Validação em tempo real de BIN recém-adicionado
Quando um usuário adiciona um ccBin à blacklist (ex: 654321) em uma aba e em outra aba tenta completar uma aplicação com um cartão começando com esses 6 dígitos, o sistema deve rejeitar imediatamente baseado na entrada recém-adicionada, confirmando que a blacklist é consultada em tempo real
7. When a user adds a ccBin to the blacklist (e.g., 654321) in one tab and, in another tab, attempts to complete an application using a credit card that begins with those same 6 digits, the system must reject it immediately based on the newly added entry, confirming that the blacklist is checked in real time.

---


8. Cenário: Prevenir duplicação de ccBin
Quando um usuário tenta adicionar um ccBin duplicado na página Blacklist (um BIN que já existe), o sistema deve notificar sobre a duplicata, não permitir armazenamento duplicado, e manter apenas um registro do BIN na blacklist
8. When a user attempts to add a duplicate ccBin on the Blacklist page (a BIN that already exists), the system must notify the user about the duplicate, must not allow duplicate storage, and must keep only one record of the BIN in the blacklist.

--> ERRO - ADICIONOU CCBIN DUPLICADO
--> ERROR – Duplicated ccBin was added

---

9. Cenário: Editar ccBin existente
Quando um usuário acessa a página Blacklist e tenta editar um ccBin já existente, o sistema deve permitir a modificação, validar o novo valor contra regex /^[0-9]{6}$/, e atualizar corretamente na blacklist sem criar duplicatas
9. When a user accesses the Blacklist page and attempts to edit an existing ccBin, the system must allow modification, validate the new value against regex /^[0-9]{6}$/, and correctly update the blacklist without creating duplicates.

---

10. Cenário: Deletar ccBin da blacklist
Quando um usuário acessa a página Blacklist e tenta deletar um ccBin existente, o sistema deve remover o registro da blacklist, e cartões com esse BIN devem ser autorizado normalmente em futuras transações
10. When a user accesses the Blacklist page and attempts to delete an existing ccBin, the system must remove the record from the blacklist, and cards with that BIN must be authorized normally in future transactions.

---

11. Cenário: Buscar ccBin específico
Quando um usuário busca por um ccBin específico na página Blacklist usando o campo de pesquisa, o sistema deve retornar resultados que correspondem ao BIN digitado, permitindo localizar rapidamente BINs específicos na lista
11. When a user searches for a specific ccBin on the Blacklist page using the search field, the system must return results matching the entered BIN, allowing quick location of specific BINs in the list.

---

12. Cenário: Visualizar coluna CC BIN na tabela
Quando um usuário visualiza a tabela de Blacklist na página Blacklist, a coluna "CC BIN" deve estar visível e exibir claramente todos os BINs adicionados, permitindo identificar facilmente quais cartões estão 
12. When a user views the Blacklist table on the Blacklist page, the “CC BIN” column must be visible and must clearly display all added BINs, allowing easy identification of which cards are blocked.

---

13. Cenário: Registrar tentativa rejeitada em logs
Quando um cartão é rejeitado por BIN blacklisted, o sistema deve registrar a tentativa em logs de auditoria com timestamp e BIN utilizado
13. When a card is rejected due to a blacklisted BIN, the system must record the attempt in audit logs with timestamp and BIN used.

---

14. Cenário: Validar múltiplos BINs blacklisted
Quando múltiplos BINs são adicionados à blacklist (ex: 3 BINs diferentes) e um usuário tenta usar cartões com esses BINs, cada um deve ser rejeitado independentemente, confirmando que todos os BINs da blacklist são consultados
14. When multiple BINs are added to the blacklist (e.g., 3 different BINs) and a user attempts to use cards with those BINs, each card must be rejected independently, confirming that all BINs in the blacklist are evaluated.
---

API

15. Adicionar ccBin válido
15. Add valid ccBin
ccBin: 516292
{
  "pk": null,
  "ccBin": "516292"
}

---

16. Adicionar ccBin inválido 5 dígitos: 51629
16. Add invalid ccBin (5 digits): 51629
{
  "pk": null,
  "ccBin": "51629"
}
ERRO - Permite inserção com menos de 6 digitos
ERROR – Allows insertion with fewer than 6 digits

---

17. Adicionar ccBin inválido 7 dígitos: 5162927
17. Add invalid ccBin (7 digits): 5162927
{
  "pk": null,
  "ccBin": "5162927"
}
ERRO - Permite inserção com mais de 6 digitos
ERROR – Allows insertion with more than 6 digits

---

18. Adicionar ccBin inválido Letras: 5162A2
18. Add invalid ccBin with letters: 5162A2
{
  "pk": null,
  "ccBin": "5162A2"
}
ERRO - Permite inserção com letras
ERROR – Allows insertion with letters

---

19. Prevenir duplicação
19. Prevent duplication
Primeira inserção:
{
  "pk": null,
  "ccBin": "529882"
}
Tentativa duplicada:
Duplicate attempt:
{
  "pk": null,
  "ccBin": "529882"
}
ERRO - Permite inserção duplicada
ERROR – Allows duplicate insertion

---

20. Editar ccBin existente
Antes: 5162927
Depois: 554671
pk: BL-001 (substitua pelo ID real numérico)
20. Edit existing ccBin
Before: 5162927
After: 554671
{
  "pk": Pk,
  "ccBin": "554671"
}

---

21. Deletar ccBin da blacklist
21. Delete ccBin from blacklist

---

22. Buscar ccBin específico
22. Search specific ccBin

-------------------------------------





> ## Tests in qa1


> **Scenario: Add valid ccBin**

> When a user accesses the Blacklist page and adds a new ccBin with 6 valid digits, the field must accept the input and save the value to the blacklist, allowing the system to block future cards that start with those 6 digits

> ![Screenshot_at_Nov_14_00-13-30](/uploads/cdebd11aa6ebabc337807f23c91b4401/Screenshot_at_Nov_14_00-13-30.png){width=900 height=591}
> ![Screenshot_at_Nov_14_00-13-59](/uploads/0f6eabd88cf606c4beb7ca6e30be8aac/Screenshot_at_Nov_14_00-13-59.png){width=838 height=600}
> ![Screenshot_at_Nov_14_00-14-35](/uploads/811a413754fc544b865ec14cc88a5763/Screenshot_at_Nov_14_00-14-35.png){width=809 height=600}
> ![Screenshot_at_Nov_14_00-16-57](/uploads/532733b0dd279684c11714ee4967bd11/Screenshot_at_Nov_14_00-16-57.png){width=865 height=47}

> **| PASS |**
> ```

---

> ```gherkin

> **Add invalid ccBin**

> When a user attempts to add an invalid ccBin on the Blacklist page (less than 6 digits, more than 6 digits, or containing letters), the system must display the error message **"Must be exactly 6 digits"** and must not allow the value to be stored, keeping the form open for correction

> ![Screenshot_at_Nov_14_00-21-37](/uploads/a68803e22c64d36d5698996406b3de29/Screenshot_at_Nov_14_00-21-37.png){width=745 height=104}

> Does not allow saving modal data with fewer than 6 digits

> Ignores characters after the sixth when more than 6

> Does not allow typing or pasting letters

> **| PASS |**
> ```

---

---

> ```gherkin

> **Reject card with BIN in blacklist during application**

> When a user completes an application by entering a credit card whose first 6 digits are in the blacklist, the system must reject the transaction, display an error message indicating that the card is not allowed, and prevent the user from continuing the application.

> ![Screenshot_at_Nov_14_00-25-59](/uploads/8cf158e36417cd342924cab409df266a/Screenshot_at_Nov_14_00-25-59.png){width=900 height=447}
![Screenshot_at_Nov_14_00-46-04](/uploads/8c7804af22fea63c46096e557b9a4bae/Screenshot_at_Nov_14_00-46-04.png){width=900 height=447}
![Screenshot_at_Nov_14_00-52-15](/uploads/762532e6f7103578ebc57c3099d95f02/Screenshot_at_Nov_14_00-52-15.png){width=900 height=498}
![Screenshot_at_Nov_14_00-59-09](/uploads/b6a69ed4f9481f43408162ec001ea857/Screenshot_at_Nov_14_00-59-09.png){width=900 height=448}
![Screenshot_at_Nov_14_01-46-44](/uploads/1171055b461c00ba4326311d9c62b5bc/Screenshot_at_Nov_14_01-46-44.png){width=900 height=446}
![Screenshot_at_Nov_14_02-11-32](/uploads/9ea07b0a77d3bea36d22ea964f4fdec3/Screenshot_at_Nov_14_02-11-32.png){width=900 height=445}

> **| PASS |**
> ```

---

> ```gherkin

> **Update status to BLACKLIST_DENIED**

> When a user attempts to use a credit card with a blacklisted BIN during the Complete Application Form, the system must deny authorization, update the application status to **BLACKLIST_DENIED**, and block any continuation of the payment process.

> ![Screenshot_at_Nov_14_00-46-04](/uploads/03307fd62546ec3c077aa39dc284360a/Screenshot_at_Nov_14_00-46-04.png){width=900 height=447}
> ![Screenshot_at_Nov_14_00-51-27](/uploads/7afd8dc73b1a126c466ad18c62deca3d/Screenshot_at_Nov_14_00-51-27.png){width=900 height=157}
> ![Screenshot_at_Nov_14_00-52-15](/uploads/d90ebae4528222e41f39bb32772313d5/Screenshot_at_Nov_14_00-52-15.png){width=900 height=498}
> ![Screenshot_at_Nov_14_00-52-41](/uploads/4f8b939502fa9c56849590021ab8a4e9/Screenshot_at_Nov_14_00-52-41.png){width=900 height=93}
> ![Screenshot_at_Nov_14_00-52-52](/uploads/4d5f91bcb2bae8bf293218d5cc4fac13/Screenshot_at_Nov_14_00-52-52.png){width=900 height=161}

> **| PASS |**
> ```

---

> ```gherkin

> **Process card with non-blacklisted BIN**

> When a user uses a credit card whose BIN is not present in the blacklist during an application, the system must process normally, authorize the transaction, and allow the application to continue without blacklist-related errors

> ![Screenshot_at_Nov_14_01-49-13](/uploads/44e38b09540cd1d704b773e92233d69c/Screenshot_at_Nov_14_01-49-13.png){width=886 height=245}
![Screenshot_at_Nov_14_01-49-52](/uploads/ec7eef43f487d824114c7165d869a4fc/Screenshot_at_Nov_14_01-49-52.png){width=900 height=444}

> **| PASS |**
> ```

---

> ```gherkin

> **Rejection message**

> When a card with a blacklisted BIN is rejected during an application, the system must display a clear message indicating that the card is not accepted and must record the attempt for auditing

> ![Screenshot_at_Nov_14_02-11-32](/uploads/ec8d4922ee247d1fee411f730b7e2f2b/Screenshot_at_Nov_14_02-11-32.png){width=900 height=445}

> **| PASS |**
> ```

---


> ```gherkin

> **Real-time validation of recently added BIN**

> When a user adds a ccBin to the blacklist (e.g., 654321) in one tab and, in another tab, attempts to complete an application using a credit card that begins with those same 6 digits, the system must reject it immediately based on the newly added entry, confirming that the blacklist is checked in real time

> ![Screenshot_at_Nov_14_02-09-46](/uploads/850e1b60dd2bc3f9b2b223258c23a127/Screenshot_at_Nov_14_02-09-46.png){width=900 height=491}
> ![Screenshot_at_Nov_14_02-10-46](/uploads/88b486f89fe5af62470809be62faad86/Screenshot_at_Nov_14_02-10-46.png){width=900 height=445}

> **| PASS |**
> ```

---


> ```gherkin

> **Prevent ccBin duplication**

> When a user attempts to add a duplicate ccBin on the Blacklist page (a BIN that already exists), the system must notify the user about the duplicate, must not allow duplicate storage, and must keep only one record of the BIN in the blacklist.

> ![Screenshot_at_Nov_14_03-38-54](/uploads/9dfc8ec94f19619478e4e1594f7003c8/Screenshot_at_Nov_14_03-38-54.png){width=895 height=147}

> **| PASS |**

> **ERROR**

> Duplicated ccBin was added

> ```

---

> ```gherkin

> **Edit existing ccBin**

> When a user accesses the Blacklist page and attempts to edit an existing ccBin, the system must allow modification, validate the new value against regex `/^[0-9]{6}$/`, and correctly update the blacklist without creating duplicates

> ![Screenshot_at_Nov_14_01-38-36](/uploads/1609b092c5ef6d95bb194fb35840c84b/Screenshot_at_Nov_14_01-38-36.png){width=900 height=308}
> ![Screenshot_at_Nov_14_01-45-48](/uploads/53f226299fca874afa7c149ad64ac512/Screenshot_at_Nov_14_01-45-48.png){width=571 height=51}
> ![Screenshot_at_Nov_14_01-46-44](/uploads/b4130a87fb656958ef5961ece0520dd5/Screenshot_at_Nov_14_01-46-44.png){width=900 height=446}
> ![Screenshot_at_Nov_14_01-47-27](/uploads/b95232e33b9630b1d2476bcfa1e7ae5b/Screenshot_at_Nov_14_01-47-27.png){width=649 height=600}
> ![Screenshot_at_Nov_14_01-47-41](/uploads/7bb43e899f2f6a1a2b0871474ac1d78b/Screenshot_at_Nov_14_01-47-41.png){width=900 height=506}
> ![Screenshot_at_Nov_14_01-49-13](/uploads/eee31a3800c7ef27dbb387069fc092d5/Screenshot_at_Nov_14_01-49-13.png){width=886 height=245}
> ![Screenshot_at_Nov_14_01-49-52](/uploads/e24d95ecf469ad24ad1b78daa8a28079/Screenshot_at_Nov_14_01-49-52.png){width=900 height=444}

> **| PASS |**
> ```

---

> ```gherkin

> **Delete ccBin from blacklist**

> When a user accesses the Blacklist page and attempts to delete an existing ccBin, the system must remove the record from the blacklist, and cards with that BIN must be authorized normally in future transactions.

> ![Screenshot_at_Nov_14_00-29-15](/uploads/109bf1c08b71735b12ee7c5cf02f3312/Screenshot_at_Nov_14_00-29-15.png){width=815 height=600}
> ![Screenshot_at_Nov_14_00-29-24](/uploads/021f116e81ceee81e2373e2db4fc7827/Screenshot_at_Nov_14_00-29-24.png){width=900 height=247}
> ![Screenshot_at_Nov_14_00-29-51](/uploads/af2e691c3751c9dfdce595d8729d1023/Screenshot_at_Nov_14_00-29-51.png){width=833 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **Search for specific ccBin**

> When a user searches for a specific ccBin on the Blacklist page using the search field, the system must return results matching the entered BIN, allowing quick location of specific BINs in the list

> ![Screenshot_at_Nov_14_01-56-21](/uploads/cf88e7888013ab2d85707e9b189dfc4d/Screenshot_at_Nov_14_01-56-21.png){width=900 height=413}
> ![Screenshot_at_Nov_14_01-56-36](/uploads/540e4973c854c51b4f256cb3fc235dee/Screenshot_at_Nov_14_01-56-36.png){width=900 height=200}
> ![Screenshot_at_Nov_14_01-56-45](/uploads/3ef72ceabf02604fc132c62411186c2a/Screenshot_at_Nov_14_01-56-45.png){width=900 height=215}

> **| ERROR |**
> Search is not filtering by ccBin

> ```

---

> ```gherkin

> **Display CC BIN column in table**

> When a user views the Blacklist table on the Blacklist page, the **“CC BIN”** column must be visible and must clearly display all added BINs, allowing easy identification of which cards are blocked.

> ![Screenshot_at_Nov_14_01-04-49](/uploads/37f2987abf4f95e01575e73a37c2485e/Screenshot_at_Nov_14_01-04-49.png){width=900 height=442}

> **| PASS |**
> ```

---


> ```gherkin

> **Log rejected attempt**

> When a card is rejected due to a blacklisted BIN, the system must record the attempt in audit logs with timestamp and BIN used.

> ![image](/uploads/1df2baff0db7828ed91ba180af4e9cb7/image.png){width=808 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **Validate multiple blacklisted BINs**

> When multiple BINs are added to the blacklist (e.g., 3 different BINs) and a user attempts to use cards with those BINs, each card must be rejected independently, confirming that all BINs in the blacklist are evaluated.

> ![Screenshot_at_Nov_14_02-09-46](/uploads/a1d2ad22faddc0d94ce3af8b62ac7d56/Screenshot_at_Nov_14_02-09-46.png){width=900 height=491}
> ![Screenshot_at_Nov_14_02-10-46](/uploads/201db5016b62f7f2d75dee2303ffd8ea/Screenshot_at_Nov_14_02-10-46.png){width=900 height=445}
> ![Screenshot_at_Nov_14_02-11-32](/uploads/c4df50160c58938bf87d8ba00234bf22/Screenshot_at_Nov_14_02-11-32.png){width=900 height=445}

> **| PASS |**
> ```

---

#### API


> ```gherkin

> **Add valid ccBin**

ccBin: 516292

```
{
  "pk": null,
  "ccBin": "516292"
}
```

> ![Screenshot_at_Nov_14_03-33-52](/uploads/4b6aaa3afdf2847b71a6c2ace49c6ad0/Screenshot_at_Nov_14_03-33-52.png){width=900 height=575}

> **| PASS |**
> ```

---

> ```gherkin

> **Add invalid ccBin (5 digits): 51629**

```
{
  "pk": null,
  "ccBin": "51629"
}
```

> ![Screenshot_at_Nov_14_03-35-21](/uploads/fabb95bc9d419978454dc45e75e2e865/Screenshot_at_Nov_14_03-35-21.png){width=900 height=557}
> ![Screenshot_at_Nov_14_03-35-51](/uploads/fe0ffb592becab424c23c81b4b5fec9e/Screenshot_at_Nov_14_03-35-51.png){width=900 height=504}

> **| PASS |**

> Allows insertion with fewer than 6 digits

> ```

---

> ```gherkin

> **Add invalid ccBin (7 digits): 5162927**

```
{
  "pk": null,
  "ccBin": "5162927"
}
```

> ![Screenshot_at_Nov_14_03-36-40](/uploads/a5ca91286cee7e6a9ce77da9c8fc5bed/Screenshot_at_Nov_14_03-36-40.png){width=900 height=567}
> ![Screenshot_at_Nov_14_03-37-07](/uploads/5fa5fd494f1f12b9fd700022459a6226/Screenshot_at_Nov_14_03-37-07.png){width=179 height=93}

> **| ERROR |**

> Allows insertion with more than 6 digits

> ```

---

> ```gherkin

> **Add invalid ccBin with letters: 5162A2**

```
{
  "pk": null,
  "ccBin": "5162A2"
}
```

> ![Screenshot_at_Nov_14_03-37-57](/uploads/7a57dd2e8c410786bec09e0acee67036/Screenshot_at_Nov_14_03-37-57.png){width=170 height=91}

> **| ERROR |**

> Allows insertion with letters

> ```

---

> ```gherkin

> **Prevent duplication**

First insertion:

```
{
  "pk": null,
  "ccBin": "529882"
}
```

Duplicate attempt:

```
{
  "pk": null,
  "ccBin": "529882"
}
```

> ![Screenshot_at_Nov_14_03-38-54](/uploads/6ed32679a22662d4ca89195c3c10007a/Screenshot_at_Nov_14_03-38-54.png){width=895 height=147}

> **| ERROR |**

> Allows duplicate insertion

> ```

---

> ```gherkin

> **Edit existing ccBin**

> ```

    Before: 5162927
    After: 554671
    pk: BL-001 (replace with actual numeric ID)

```
{
  "pk": 1,
  "ccBin": "554671"
}
```

> ![Screenshot_at_Nov_14_03-41-44](/uploads/936e9aac67e473e128ee857a94b650f9/Screenshot_at_Nov_14_03-41-44.png){width=900 height=577}
> ![Screenshot_at_Nov_14_03-41-57](/uploads/cca3b3a28d1ad200e4cc160da641ca96/Screenshot_at_Nov_14_03-41-57.png){width=544 height=22}
> ![Screenshot_at_Nov_14_03-43-16](/uploads/31fda8244ee14380e87a7d55f0354f8b/Screenshot_at_Nov_14_03-43-16.png){width=798 height=72}

> **| PASS |**


---

> ```gherkin

> **Delete ccBin from blacklist**

> ![Screenshot_at_Nov_14_03-46-57](/uploads/174680a4837d515df64558dd729a9a57/Screenshot_at_Nov_14_03-46-57.png){width=900 height=451}
> ![Screenshot_at_Nov_14_03-47-08](/uploads/0c8e36e5dd4c0aa0079a2814b2eeec5f/Screenshot_at_Nov_14_03-47-08.png){width=802 height=72}

> **| PASS |**
> ```

---

> ```gherkin

> **Search specific ccBin**

> ![Screenshot_at_Nov_14_03-50-40](/uploads/af59dd17b6ecba4afe3f67b85e4ee431/Screenshot_at_Nov_14_03-50-40.png){width=900 height=562}

> **| PASS |**
> ```

---