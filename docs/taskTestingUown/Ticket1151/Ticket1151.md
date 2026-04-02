----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1151

UOWN | Origination | Add Address Validation – Ensure StreetAddress1 Contains Both Numbers and Characters


Synopsis
Currently, some applications include invalid or incomplete addresses in the streetAddress1 field (for example, entries containing only numbers).
These are being approved or sent to TaxCloud and USPS for validation, resulting in errors or inconsistent results.
To reduce unnecessary rejections and improve address quality, a basic internal validation should be implemented to confirm that streetAddress1 includes both a numeric component (house number) and a text component (street name) before submitting it to external APIs.


Additional Context - Number and Street Combination Validation
It is important to note that in some cases, both the street name and the number exist, but the combination between them is not valid — meaning the full address does not correspond to a real location.
This explains some “no match” results returned by external APIs such as TaxCloud and USPS.


Business Objective
This validation will prevent invalid or incomplete addresses from being submitted, improving data quality and reducing false rejections caused by strict external validation (TaxCloud or USPS).
By requiring both number and street name, we ensure:
* Obvious invalid addresses are caught early.  
* Legitimate applications are not rejected just because of mismatches in third-party systems.
* The system remains more reliable and aligned with real-world address patterns.


Feature Request | Business Requirements

Address Validation Logic
    Implement an internal check ensuring streetAddress1 contains:
        At least one numeric value (e.g., house/building number).
        At least one alphabetic value (e.g., street name).
    Example of valid address: 123 Main St.
    Example of invalid address: 123 or Main Street.

Validation Timing
    Perform the validation before sending the address to external services (e.g., TaxCloud, USPS, or Google Maps).
System Behavior
Do not automatically reject applications solely based on “no match” results from external APIs if the internal validation passes.
Testing and Validation
    Test cases must include:
        Valid addresses with number + text.
        Invalid addresses with only numbers or only letters.
    Confirm proper error messages and flow behavior.
Modules Impacted
Origination (application address input).
Any backend address validation logic or service using TaxCloud API.


Testing Steps
Endpoint
POST /uown/los/sendApplication
Configuration
YAML Configuration Path

com:
  uownleasing:
    svc:
      validator:
        LosRequestMessageConstraintValidator:
          enable:
            address:
              format:
                enabled: true
                street1: true
                street2: true
                city: true
                state: true
                zip: true
                regex:
                  street1: "^[0-9]{1,7}\\s+[A-Za-z0-9#\\.\\-]+(?:\\s[A-Za-z0-9#\\.\\-]+){0,8}$"
                  street2: "^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s?[A-Za-z0-9\\-]+$"
                  city: "^[A-Za-z]+(?:[\\s\\-'][A-Za-z]+)*$"
                  state: "^(A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|H[I]|I[DLNA]|K[SY]|L[A]|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[ARW]|R[I]|S[CD]|T[NX]|U[T]|V[AT]|W[AVIY])$"
                  zip: "^\\d{5}(-\\d{4})?$"

Test Scenarios
1. Street Address 1 (mainAddress1)
Format: Must start with 1-7 digits, followed by a space, then letters/numbers/special chars (up to 8 additional words)
Valid Examples:

123 Main Street
4567 Oak Avenue
12-B North Road
1000 Washington Blvd.

Invalid Examples:


Main Street (missing house number)

123456789 Main Street (house number too long - 9 digits)

123 (missing street name)

123Main Street (missing space after number)

Expected Error:

Field: mainAddress1
Message: "mainAddress1 must match the required address format. Received: {value}"

2. Street Address 2 (mainAddress2)
Format: Must start with apartment/suite prefixes (Apt, Apartment, Suite, Ste, Unit, Bldg, Building, Fl, Floor, #) followed by alphanumeric identifier

Valid Examples:
Apt 5B
Suite 100
Unit #12
Building A
Ste 3

Invalid Examples:
Room 5 (invalid prefix)
5B (missing prefix)
Apt (missing identifier)

Expected Error:
Field: mainAddress2
Message: "mainAddress2 must match the required address format. Received: {value}"
Note: Street Address 2 is optional - blank/null values are accepted.

3. City (mainCity)
Format: Letters only, may include spaces, hyphens, or apostrophes between words

Valid Examples:
New York
San Francisco
St. Louis
O'Fallon
McAllen

Invalid Examples:
New York 123 (contains numbers)
New_York (contains underscore)
123 (numbers only)

Expected Error:
Field: mainCity
Message: "mainCity must match the required address format. Received: {value}"

4. State (mainStateOrProvince)
Format: Valid 2-letter US state abbreviation (case-insensitive, converted to uppercase)

Valid Examples:
CA
NY
Tx (will be converted to TX)
fl (will be converted to FL)

Invalid Examples:
California (full state name)
XX (invalid abbreviation)
123 (numbers)

Expected Error:
Field: mainStateOrProvince
Message: "mainStateOrProvince must match the required address format. Received: {value}"

5. Zip Code (mainPostalCode)
Format: 5 digits, optionally followed by hyphen and 4 more digits

Valid Examples:
12345
12345-6789
90210

Invalid Examples:
1234 (too short)
123456 (too long)
12345-678 (extension too short)
ABCDE (letters)

Expected Error:
Field: mainPostalCode
Message: "mainPostalCode must match the required address format. Received: {value}"

Configuration Testing
Enable/Disable Validation
Test 1: Disable all address validation

ensure:
  address:
    format:
      enabled: false

Expected: All address format validations are skipped, even if individual field validations are enabled.

Test 2: Disable specific field validation

ensure:
  address:
    format:
      enabled: true
      street1: false
      city: true

Expected: Street Address 1 validation is skipped, but City validation is still active.

Custom Regex Patterns
Test 3: Override default regex pattern

ensure:
  address:
    format:
      regex:
        street1: "^[0-9]{1,5}\\s+[A-Za-z]+$"

Expected: Street Address 1 validation uses the custom pattern instead of the default.

Complete Test Example
Valid Request

{
  "mainAddress1": "123 Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001",
  ...other required fields...
}

Expected: Request succeeds with 200 OK

Invalid Request (Street Address 1)

{
  "mainAddress1": "Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001",
  ...other required fields...
}

Expected: 400 Bad Request with error message for mainAddress1

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### UOWN | Origination | Adicionar Validação de Endereço – Garantir que o StreetAddress1 Contenha Números e Caracteres

#### **Sinopse**

Atualmente, algumas aplicações incluem endereços inválidos ou incompletos no campo streetAddress1 (por exemplo, entradas contendo apenas números). Esses endereços estão sendo aprovados ou enviados para o TaxCloud e USPS para validação, resultando em erros ou resultados inconsistentes. Para reduzir rejeições desnecessárias e melhorar a qualidade dos endereços, uma validação interna básica deve ser implementada para confirmar que o streetAddress1 contém tanto um componente numérico (número da casa) quanto um componente textual (nome da rua) antes de ser enviado para APIs externas.

#### **Contexto Adicional - Validação da Combinação de Número e Rua**

É importante notar que, em alguns casos, tanto o nome da rua quanto o número existem, mas a combinação entre eles não é válida — ou seja, o endereço completo não corresponde a um local real. Isso explica alguns resultados de “sem correspondência” retornados por APIs externas como o TaxCloud e USPS.

#### **Objetivo de Negócio**

Essa validação impedirá que endereços inválidos ou incompletos sejam enviados, melhorando a qualidade dos dados e reduzindo falsas rejeições causadas pela validação rigorosa de APIs externas (TaxCloud ou USPS). Ao exigir tanto o número quanto o nome da rua, garantimos:

* Endereços obviamente inválidos são detectados precocemente.
* Aplicações legítimas não são rejeitadas apenas por divergências nos sistemas de terceiros.
* O sistema permanece mais confiável e alinhado com os padrões de endereços do mundo real.

#### **Requisitos do Pedido | Requisitos de Negócio**

##### **Lógica de Validação de Endereço**

* Implementar uma verificação interna garantindo que o streetAddress1 contenha:

  * Pelo menos um valor numérico (por exemplo, número da casa/prédio).
  * Pelo menos um valor alfabético (por exemplo, nome da rua).
* Exemplo de endereço válido: `123 Main St.`
* Exemplo de endereço inválido: `123` ou `Main Street.`

##### **Tempo de Validação**

* Realizar a validação antes de enviar o endereço para serviços externos (por exemplo, TaxCloud, USPS ou Google Maps).

##### **Comportamento do Sistema**

* Não rejeitar automaticamente aplicações baseadas apenas em resultados de “sem correspondência” de APIs externas, caso a validação interna passe.

#### **Testes e Validação**

Os casos de teste devem incluir:

1. Endereços válidos com número + texto.
2. Endereços inválidos com apenas números ou apenas letras.
3. Confirmar mensagens de erro adequadas e comportamento do fluxo.

##### **Módulos Impactados**

* Originação (entrada do endereço da aplicação).
* Qualquer lógica ou serviço de validação de endereço no backend usando a API do TaxCloud.

---

### **Cenários de Teste**

#### **1. Endereço Rua 1 (mainAddress1)**

* **Formato:** Deve começar com 1 a 7 dígitos, seguido de um espaço, depois letras/números/caracteres especiais (até 8 palavras adicionais).
* **Exemplos Válidos:**

  * 123 Main Street
  * 4567 Oak Avenue
  * 12-B North Road
  * 1000 Washington Blvd.
* **Exemplos Inválidos:**

  * Main Street (falta o número da casa)
  * 123456789 Main Street (número da casa muito longo - 9 dígitos)
  * 123 (falta nome da rua)
  * 123Main Street (falta espaço após o número)
* **Erro Esperado:**

  * **Campo:** mainAddress1
  * **Mensagem:** "mainAddress1 deve corresponder ao formato de endereço requerido. Recebido: {value}"

#### **2. Endereço Rua 2 (mainAddress2)**

* **Formato:** Deve começar com prefixos de apartamento/suíte (Apt, Apartment, Suite, Ste, Unit, Bldg, Building, Fl, Floor, #) seguidos de um identificador alfanumérico.
* **Exemplos Válidos:**

  * Apt 5B
  * Suite 100
  * Unit #12
  * Building A
  * Ste 3
* **Exemplos Inválidos:**

  * Room 5 (prefixo inválido)
  * 5B (falta o prefixo)
  * Apt (falta o identificador)
* **Erro Esperado:**

  * **Campo:** mainAddress2
  * **Mensagem:** "mainAddress2 deve corresponder ao formato de endereço requerido. Recebido: {value}"
  * **Nota:** Endereço Rua 2 é opcional - valores em branco/nulos são aceitos.

#### **3. Cidade (mainCity)**

* **Formato:** Apenas letras, pode incluir espaços, hífens ou apóstrofos entre as palavras.
* **Exemplos Válidos:**

  * New York
  * San Francisco
  * St. Louis
  * O'Fallon
  * McAllen
* **Exemplos Inválidos:**

  * New York 123 (contém números)
  * New_York (contém sublinhado)
  * 123 (somente números)
* **Erro Esperado:**

  * **Campo:** mainCity
  * **Mensagem:** "mainCity deve corresponder ao formato de endereço requerido. Recebido: {value}"

#### **4. Estado (mainStateOrProvince)**

* **Formato:** Abreviação válida de 2 letras do estado dos EUA (insensível a maiúsculas, convertida para maiúsculas).
* **Exemplos Válidos:**

  * CA
  * NY
  * Tx (será convertido para TX)
  * fl (será convertido para FL)
* **Exemplos Inválidos:**

  * California (nome completo do estado)
  * XX (abreviação inválida)
  * 123 (números)
* **Erro Esperado:**

  * **Campo:** mainStateOrProvince
  * **Mensagem:** "mainStateOrProvince deve corresponder ao formato de endereço requerido. Recebido: {value}"

#### **5. Código Postal (mainPostalCode)**

* **Formato:** 5 dígitos, opcionalmente seguidos de hífen e mais 4 dígitos.
* **Exemplos Válidos:**

  * 12345
  * 12345-6789
  * 90210
* **Exemplos Inválidos:**

  * 1234 (muito curto)
  * 123456 (muito longo)
  * 12345-678 (extensão muito curta)
  * ABCDE (letras)
* **Erro Esperado:**

  * **Campo:** mainPostalCode
  * **Mensagem:** "mainPostalCode deve corresponder ao formato de endereço requerido. Recebido: {value}"

---

### **Testes de Configuração**

#### **Habilitar/Desabilitar Validação**

**Teste 1:** Desabilitar todas as validações de endereço

```yaml
ensure:
  address:
    format:
      enabled: false
```

**Esperado:** Todas as validações de formato de endereço são ignoradas, mesmo que as validações de campos individuais sejam ativadas.

**Teste 2:** Desabilitar validação de campo específico

```yaml
ensure:
  address:
    format:
      enabled: true
      street1: false
      city: true
```

**Esperado:** A validação de Endereço Rua 1 é ignorada, mas a validação de Cidade ainda está ativa.

#### **Padrões Regex Personalizados**

**Teste 3:** Substituir o padrão regex padrão

```yaml
ensure:
  address:
    format:
      regex:
        street1: "^[0-9]{1,5}\\s+[A-Za-z]+$"
```

**Esperado:** A validação de Endereço Rua 1 usa o padrão personalizado em vez do padrão padrão.

---

### **Exemplo Completo de Teste**

#### **Requisição Válida**

```json
{
  "mainAddress1": "123 Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001",
  ...outros campos obrigatórios...
}
```

**Esperado:** A requisição é bem-sucedida com 200 OK

#### **Requisição Inválida (Endereço Rua 1)**

```json
{
  "mainAddress1": "Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001",
  ...outros campos obrigatórios...
}
```

**Esperado:** 400 Bad Request com mensagem de erro para mainAddress1


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

 4 arquivos
+
318
−
24
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

con
‎fig‎

AddressValidat
‎ionConfig.java‎
+74 -0

LosRequestMessageConstr
‎aintValidatorConfig.java‎
+109 -0

uti
‎lity‎

AddressValida
‎tionUtils.java‎
+67 -0

vali
‎dator‎

LosRequestMessageCon
‎straintValidator.java‎
+68 -24

 src/main/java/com/uownleasing/svc/config/AddressValidationConfig.java  0 → 100644
+
74
−
0

Visualizado
package com.uownleasing.svc.config;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AddressValidationConfig {

    private static final String CONFIGURATION_PATH = "com.uownleasing.svc.validator.LosRequestMessageConstraintValidator.enable.address.format.";

    private final ConfigurationManagement configurationManagement;

Sowjanya Kaligineedi
Sowjanya Kaligineedi
@skaligineedi
5 dias atrás
Owner
@fernandogmartins rename all methods to either isAddressFormatCheckEnabled , isStreet1FormatCheckEnabled, isStreet2FormatCheckEnabled,isCityFormatCheckEnabled , isStateFormatCheckEnabled, isZipFormatCheckEnabled

or

enableAddressFormatCheck, enableStreet1FormatCheck, enableStreet2FormatCheck, enableCityFormatCheck, enableStateFormatCheck, enableZipFormatCheck.

Responder…
    public boolean enableAddressFormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "enabled", true);
    }

    public boolean enableStreet1FormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "street1", true);
    }

    public boolean enableStreet2FormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "street2", true);
    }

    public boolean enableCityFormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "city", true);
    }

    public boolean enableStateFormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "state", true);
    }

    public boolean enableZipFormatCheck() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "zip", true);
    }

    public String getAddressFormatRegexStreet1() {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "regex.street1",
            "^[0-9]{1,7}\\s+[A-Za-z0-9#\\.\\-]+(?:\\s[A-Za-z0-9#\\.\\-]+){0,8}$"
        );
    }

    public String getAddressFormatRegexStreet2() {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "regex.street2",
            "^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s?[A-Za-z0-9\\-]+$"
        );
    }

    public String getAddressFormatRegexCity() {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "regex.city",
            "^[A-Za-z]+(?:[\\s\\-'][A-Za-z]+)*$"
        );
    }

    public String getAddressFormatRegexState() {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "regex.state",
            "^(A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|H[I]|I[DLNA]|K[SY]|L[A]|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[ARW]|R[I]|S[CD]|T[NX]|U[T]|V[AT]|W[AVIY])$"
        );
    }

    public String getAddressFormatRegexZip() {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "regex.zip",
            "^\\d{5}(-\\d{4})?$"
        );
    }
}
 src/main/java/com/uownleasing/svc/config/LosRequestMessageConstraintValidatorConfig.java  0 → 100644
+
109
−
0

Visualizado
package com.uownleasing.svc.config;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.enumeration.ClientType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LosRequestMessageConstraintValidatorConfig {

    private static final String CONFIGURATION_PATH = "com.uownleasing.svc.validator.LosRequestMessageConstraintValidator.";

    private final ConfigurationManagement configurationManagement;

    public boolean requireUwApprovalForInvoiceInformation() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "require.uw.approval.for.invoice.information", Boolean.TRUE);
    }

    public String getRequiredFieldsForClientType(ClientType clientType) {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "required.fields.for." + clientType,
            "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,mainEmployerName,emailAddress,mainPostalCode,mainNextPayDate"
        );
    }

    public boolean monthlyIncomeRequiredForClientType(ClientType clientType) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "monthlyIncome.required.for.clientType." + clientType,
            true
        );
    }

    public boolean checkSalesTax() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "check.sales.tax", true);
    }

    public Long getDefaultMaxDays() {
        return configurationManagement.getLong(CONFIGURATION_PATH + "default.max.days", 21L);
    }

    public Long getWeeklyMaxDays() {
        return configurationManagement.getLong(CONFIGURATION_PATH + "weekly.max.days", 10L);
    }

    public Long getBiWeeklyMaxDays() {
        return configurationManagement.getLong(CONFIGURATION_PATH + "bi.weekly.max.days", 21L);
    }

    public Long getSemiMonthlyMaxDays() {
        return configurationManagement.getLong(CONFIGURATION_PATH + "semi.monthly.max.days", 20L);
    }

    public Long getMonthlyMaxDays() {
        return configurationManagement.getLong(CONFIGURATION_PATH + "monthly.max.days", 31L);
    }

    public boolean lookFutureNextPayForClientType(ClientType clientType) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "look.future.next.pay.for." + clientType,
            true
        );
    }

    public boolean getStateFromZip() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "get.state.from.zip", true);
    }

    public String getStatesForZip(String postalCode) {
        return configurationManagement.getString(CONFIGURATION_PATH + "states.for.zip." + postalCode);
    }

    public boolean authenticateAddress() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "authenticate.address", true);
    }

    public boolean checkProgramNameByClientType(ClientType clientType) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "check.programName.by.ClientType." + clientType,
            false
        );
    }

    public boolean validateInvoiceNumbersForMerchant(String merchantCode) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "validate.invoice.numbers.for.merchant." + merchantCode,
            true
        );
    }

    public boolean discountIncludedInSubTotalForMerchant(String merchantCode) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "discount.included.in.subTotal.for." + merchantCode,
            true
        );
    }

    public boolean validateInvoiceItemsForMerchant(String merchantCode) {
        return configurationManagement.getBoolean(
            CONFIGURATION_PATH + "validate.invoice.items.for.merchant." + merchantCode,
            false
        );
    }

    public boolean verifyMinimumLeaseValue() {
        return configurationManagement.getBoolean(CONFIGURATION_PATH + "verify.minimum.lease.value", true);
    }
}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

validator:
        LosRequestMessageConstraintValidator:
          enable:
            address:
              format:
                enabled: true
                street1: true
                street2: true
                city: true
                state: true
                zip: true
                regex:
                  street1: "^[0-9]{1,7}\\s+[A-Za-z0-9#\\.\\-]+(?:\\s[A-Za-z0-9#\\.\\-]+){0,8}$"
                  street2: "^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s?[A-Za-z0-9\\-]+$"
                  city: "^[A-Za-z]+(?:[\\s\\-'][A-Za-z]+)*$"
                  state: "^(A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|H[I]|I[DLNA]|K[SY]|L[A]|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[ARW]|R[I]|S[CD]|T[NX]|U[T]|V[AT]|W[AVIY])$"
                  zip: "^\\d{5}(-\\d{4})?$"


https://gitlab.com/uown/devops/configuration/-/blob/uown-qa1/config/svc/application.yaml

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update

system:
  config:
    com:
      uownleasing:
        svc:
          service:
            PlaidService:
              clientId: "6846ea5a7a4f700021ffba01"
              secret: "45844f28e148f618885e6f0dd8f566"
            PaymentReceiptService:
              send:
                ach:
                  payment:
                    receipt: "true"
                cc:
                  payment:
                    receipt: "true"
                payment:
                  decline:
                    sms: "false"
                first:
                  payment:
                    default:
                      sms: "false"
            tax:
              TaxService:
                use:
                  tax:
                    cloud:
                      api: "true"
              tax:
                rate:
                  for:
                    MY_EYE_MED:
                      GA: "0.0"
            UnderwritingService:
              skip:
                uw:
                  merchant:
                    clientType:
                      _360_FINANCE: "true"
              use:
                taktile:
                  for:
                    decision: "true"
              set:
                uw:
                  neustar:
                    data: "true"
                  seon:
                    data: "true"
            LeadService:
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          SK00001-0001: "true"
                          5348120500488887: "true"
            ScheduledTaskService:
              send:
                first:
                  payment:
                    reminder:
                      sms: "false"
                recurring:
                  payment:
                    reminder:
                      sms: "false"
                delinquency:
                  offer:
                    sms: "false"
                late:
                  payment:
                    notice:
                      sms: "false"
              delinquent:
                payments:
                  report:
                    to:
                      email: "fintechgroup777@gmail.com"
              generate:
                delinquent:
                  payments:
                    report: "true"
              delinquency:
                report:
                  from:
                    email: "Reporting@uownleasing.com"
              rerun:
                cc:
                  payments:
                    report:
                      from:
                        email: "Reporting@uownleasing.com"
              uown:
                daily:
                  agent:
                    report:
                      from:
                        email: "Reporting@uownleasing.com"
              reverse:
                ach:
                  payments:
                    sweep:
                      thread:
                        size: "1"
            EsignService:
              uown.esign.mock.response.on.test: false
              send:
                redirect:
                  url:
                    to:
                      esign:
                        client: "false"
            CCTransactionService:
              use:
                channel:
                  payments: "true"
              authenticate:
                creation: "true"
              default:
                amount:
                  to:
                    authenticate: "1.01"
            BootstrapService:
              load:
                only:
                  new:
                    templates: "true"
                    sql: "true"
            IntellicheckService:
              sdk:
                uri: http://idn-server.intellicheck-dev.svc.cluster.local:80
            CorrespondenceService:
              track:
                customer:
                  correspondence:
                    EMAIL: "false"
                    SMS: "false"
            SvCustomerService:
              email:
                categories: >
                  billing|Billing / Payment Inquiry|fintechgroup777@gmail.com,
                  payment_arrangement|Payment Arrangement Request|fintechgroup777@gmail.com,
                  merchant|Merchandise / Merchant Concern|jose.mendes.gow@uownleasing.com,
                  other|Other|fintechgroup777@gmail.com
        
            RunUWService:
              neustar:
                verified:
                  component:
                    for:
                      service:
                        tenure: "3,4,5,8"
                phone:
                  service:
                    tenure:
                      for:
                        verified:
                          component3: "1,-1,-2,-3,-4,-5,-6,-7"
                          component4: "1,-1,-2,-3,-4,-5,-6,-7"
                          component5: "1,-1,-2,-3,-4,-5,-6,-7"
                          component8: "1,2,3,4,5,6,7,-1,-2,-3,-4,-5,-6,-7"

              fraud:
                engine:
                  email:
                    check:
                      version: v2
                  phone:
                    check:
                      version: v1
                  ip:
                    check:
                      version: v1
            NeuroIdVerificationService:
              neuro:
                id:
                  siteid:
                    SEND_APP: "items340"
                    SUBMIT_APP: "depth355"
            IdVerificationService:
              verify:
                intellicheck:
                  id:
                    expired: "true"
                  date:
                    of:
                      birth: "true"
                  first:
                    name: "true"
                  middle:
                    name: "true"
                  last:
                    name: "true"
                seon:
                  document:
                    expired: "true"
                  date:
                    of:
                      birth: "true"
                  first:
                    name: "true"
                  middle:
                    name: "true"
                  last:
                    name: "true"
            FuzzyNameMatchService:
              require:
                all:
                  parts:
                    first:
                      name: "true"
                    middle:
                      name: "true"
                    last:
                      name: "true"
            AutoPayService:
              turnoff: 
                ach:
                  autopay:
                    for:
                      rating: "C,P,M"
                cc:
                  autopay:
                    for:
                      rating: "C,P,M"
            SendApplicationService:
              plaidMaxLambdaSegment: 650
              plaidMinLambdaSegment: -1
            application:
              SendApplicationService:
                check:
                  duplicate:
                    info: "false"
                bypass:
                  uwengine: "true"
                plaidMaxLambdaSegment: 650
                plaidMinLambdaSegment: -1
            sweeps:
              paymentSweeps:
                DelinquencyRerunCCPaymentsSweepService:
                  run:
                    cc:
                      transaction:
                        for:
                          delinquency:
                            delinquencyRerunCCPaymentsSweep: "true"
                            dailyDelinquencyRerunCCSweep: "true"
            cc:
              CCPostRunUpdateService:
                card:
                  error:
                    invalid: "card is expired,card number error,closed account,hold card (lost),hold card (pick up card),hold card (stolen),do not honor,card declined (00)"
              CCCaptureService:
                charge:
                  fee: "true"
              CCSaleService:
                ccPeekOnSameDayRequest : "true"
                ccPeekOn : "true"
                charge:
                  fee: "true"
          uownclient:
            UownClient:
              do:
                not:
                  allow:
                    invoice:
                      increase:
                        for:
                          client:
                            SWEET_PAY: "true"
                  check:
                    cost:
                      and:
                        credit:
                          limit:
                            for:
                              client:
                                type:
                                  in:
                                    submitApplication: "WE_GET_FINANCING"
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          _360_FINANCE: "true"
                          SK00001-0001: "true"
                          5348120500488887: "true"
                          SYNCHRONY: "true"
              set:
                program:
                  for:
                    sweetPay: "true"
              CC:
                lastname:
                  contain:
                    check: "true"
              sentilink:
                theft:
                  score:
                    threshold: "700"
                abuse:
                  score:
                    threshold: "650"
              bypass:
                uwengine: "true"
              check:
                duplicate:
                  info: "false"
                old:
                  lead:
                    info:
                      for:
                        data:
                          match:
                            by:
                              merchants:
                                code: ""
                authorization:
                  request:
                    map: "false"
          validator:
            LosRequestMessageConstraintValidator:
              enable:
                address:
                  format:
                    enabled: true
                    street1: true
                    street2: true
                    city: true
                    state: true
                    zip: true
                    regex:
                      street1: "^[0-9]{1,7}\\s+[A-Za-z0-9#\\.\\-]+(?:\\s[A-Za-z0-9#\\.\\-]+){0,8}$"
                      street2: "^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s?[A-Za-z0-9\\-]+$"
                      city: "^[A-Za-z]+(?:[\\s\\-'][A-Za-z]+)*$"
                      state: "^(A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|H[I]|I[DLNA]|K[SY]|L[A]|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[ARW]|R[I]|S[CD]|T[NX]|U[T]|V[AT]|W[AVIY])$"
                      zip: "^\\d{5}(-\\d{4})?$"

              check:
                programName:
                  by:
                    ClientType:
                      _360_FINANCE: "true"
              verify:
                address: "true"
              required:
                fields:
                  for:
                    _360_FINANCE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,programName,maxApprovalAmount,requestedLoanAmount"
                    PAY_POSSIBLE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SKEPS:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SYNCHRONY:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
              validate:
                invoice:
                  numbers:
                    for:
                      merchant:
                        MO1234-0001: "false"
                        SK00001-0001: "false"
          test: "config is working"
          config:
            svOutboundCall:
              connect:
                timeout: "120000"
            losOutboundCall:
              connect:
                timeout: "120000"
    statuses:
      eligible:
        for:
          pending:
            uw:
              "DENIED,FRAUD_DENIED,DELINQUENCY_DENIED,BLACKLIST_DENIED,ACH_NOT_CLEARED,FPD_IN_FUTURE,DELINQUENT_ACCOUNT,ACCOUNT_UNDERPAID,ACCOUNT_STATUS_INELIGIBLE,SENTILINK_DENIED,NEUSTAR_DENIED"
    uw:
      airblackbox:
        url:
          "https://leadrouter.f3easervicing.com/service/application-finalize"
        new:
          url: "https://decision-engine-qa.uownfintech.com/service/application-finalize"
        use:
          old:
            url: "false"
        old:
          url:
            routing:
              threshold: "-1"

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ SCENARIO 1: Completely Valid Address

Description:
When a user submits an application with a valid address, all fields must be in the correct format, including the house number and street name.

Real Data:
Name: John Smith
Email: [john.smith@email.com](mailto:john.smith@email.com)
Phone: 212-555-0123
Company: Goldman Sachs
Annual Income: $150,000
Credit Score: 750
Status: Employed

mainAddress1: 237 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ✅ 200 OK - Application accepted
LeadPk: 10404
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>b5ee37e3-f64b-4706-a5b6-635d42f6a2ab</accountNumber>
    <authorizationNumber>10404</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 2: Invalid mainAddress1

Description:
Testing invalid addresses in the mainAddress1 field.

2.1 - Missing Number

Real Data:
Name: Sarah Johnson
Email: [sarah.j@email.com](mailto:sarah.j@email.com)
Phone: 212-555-0124
Company: JPMorgan Chase
Annual Income: $120,000
Credit Score: 720
Status: Employed

mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: Main Street"
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: Main Street",
    
}
-
2.2 - Only Number

Real Data:
Name: Michael Brown
Email: [m.brown@email.com](mailto:m.brown@email.com)
Phone: 212-555-0125
Company: Morgan Stanley
Annual Income: $180,000
Credit Score: 780
Status: Employed

mainAddress1: 123 (❌ ONLY NUMBER)
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: 123"
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 357",

}
-
2.3 - No Space

Real Data:
Name: Emily Davis
Email: emily.d@email.com
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123Main Street",
    
}
--
## 2.4. Desabilitar campo específico (street1: false, city: true)

**Requisitado em:** Configuration Testing, Test 2  
**Configuração YAML:**
```yaml
ensure:
  address:
    format:
      enabled: true
      street1: false
      city: true
````
**Dados reais de teste:**
* Name: Emily Clarkson
* Email: [emily.clarkson@email.com](mailto:emily.clarkson@email.com)
* Phone: 212-555-0203
* Company: Tesla
* Annual Income: $600,000
* Credit Score: 950
* Status: Employed
* mainAddress1: null (field disabled)
* mainAddress2: Apt 9B
* mainCity: Chicago
* mainStateOrProvince: IL
* mainPostalCode: 60601
**Expected:** ✅ 200 OK (street1 field disabled, city field enabled)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>cee8349e-62aa-4468-9789-7fc48fe4aa48</accountNumber>
    <authorizationNumber>10430</authorizationNumber>
</ApplicationResponse>
--
## 2.5.1 - Regex customizado

**Requisitado em:** Configuration Testing, Test 3
**Configuração YAML:**

```yaml
ensure:
  address:
    format:
      regex:
        street1: "^[0-9]{1,5}\\s+[A-Za-z]+$"
```


**Dados reais de teste:**
* Name: Daniel Hill
* Email: [daniel.hill@email.com](mailto:daniel.hill@email.com)
* Phone: 212-555-0214
* Company: Oracle
* Annual Income: $450,000
* Credit Score: 800
* Status: Employed
* mainAddress1: 123 MainStreet
* mainAddress2: Apt 3D
* mainCity: San Francisco
* mainStateOrProvince: CA
* mainPostalCode: 94105
**Expected:** ✅ 200 OK (address format matches regex)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>6ad61457-8fa8-42f9-a677-28e4d2c4cf55</accountNumber>
    <authorizationNumber>10434</authorizationNumber>
</ApplicationResponse>
--
2.5.2 - Regex customizado — Leasing de Alto Risco
Objetivo:
Garantir que, em operações de leasing de alto valor (ex: veículos premium, equipamentos industriais), o endereço principal (mainAddress1) siga um formato de endereço corporativo ou estruturado, rejeitando padrões genéricos e abreviações suspeitas.
ensure:
  address:
    format:
      regex:
        street1: "^(Bloco\\s?[A-Z0-9]{1,3}|Lote\\s?\\d{1,3}|Unidade\\s?\\d{1,3}|Andar\\s?\\d{1,2})\\s[-,\\s]?\\d{1,5}\\s[A-Za-z\\s\\.]{3,40}$"
O endereço deve ter formato de identificação empresarial ou predial estruturada, como:
Bloco A - 100 Avenida Paulista
Lote 7 450 Rua dos Andradas
Unidade 12, 55 Rua XV de Novembro
Andar 3 - 2000 Alameda Santos
| Campo                    | Valor                                                 |
| ------------------------ | ----------------------------------------------------- |
| **Name:**                | Daniel Hill                                           |
| **Email:**               | [daniel.hill@email.com](mailto:daniel.hill@email.com) |
| **Phone:**               | +1 (212) 555-0214                                     |
| **Company:**             | Oracle Corp.                                          |
| **Annual Income:**       | $450,000                                              |
| **Credit Score:**        | 800                                                   |
| **Status:**              | Employed (Corporate Account)                          |
| **mainAddress1:**        | `Unit 5A - 1234 Elm St.`                              |
| **mainAddress2:**        | `Suite 101`                                           |
| **mainCity:**            | San Francisco                                         |
| **mainStateOrProvince:** | CA (California)                                       |
| **mainPostalCode:**      | 94105                                                 |

Expected Result
Expected: ✅ 200 OK
Motivo: O endereço cumpre o formato exigido para leasing de alto risco (presença de bloco/lote/unidade e nome de rua completo).
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>402eebb9-5a1e-445d-81f0-e4b7a4ae1e80</accountNumber>
    <authorizationNumber>10435</authorizationNumber>
</ApplicationResponse>
--
## 2.6. mainAddress1 com limite de 9 dígitos (deve rejeitar)

**Requisitado em:** Test Scenario 1, Invalid Examples
**Dados inválidos de endereço:**

* 123456789 Main Street (house number too long - 9 digits)

**Dados reais de teste:**
* Name: Nathan Cooper
* Email: [nathan.cooper@email.com](mailto:nathan.cooper@email.com)
* Phone: 212-555-0237
* Company: Apple
* Annual Income: $800,000
* Credit Score: 950
* Status: Employed
* mainAddress1: 123456789 Main Street
* mainAddress2: Apt 4C
* mainCity: Cupertino
* mainStateOrProvince: CA
* mainPostalCode: 95014
**Expected:** ❌ 400 Bad Request (house number exceeds 9 digits)
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123456789 Main Street",
}
--
## 2.7. mainAddress1 com caracteres especiais (12-B, Blvd.)

**Requisitado em:** Test Scenario 1, Valid Examples
**Dados válidos de endereço:**

* 12-B North Road
* 1000 Washington Blvd.

**Dados reais de teste:**
* Name: Olivia Thompson
* Email: [olivia.thompson@email.com](mailto:olivia.thompson@email.com)
* Phone: 212-555-0241
* Company: Facebook
* Annual Income: $750,000
* Credit Score: 960
* Status: Employed
* mainAddress1: 12-B North Road
* mainAddress2: Suite 10A
* mainCity: Mountain View
* mainStateOrProvince: CA
* mainPostalCode: 94040
**Expected:** ✅ 200 OK (mainAddress1 is valid with special characters)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>22d8b335-a69a-4f02-8a26-d567ea56bbea</accountNumber>
    <authorizationNumber>10437</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 3: Invalid mainAddress2

Description:
When the mainAddress2 field is invalid, the system should reject the request with the appropriate error.

3.1 - Invalid Prefix

Real Data:
Name: Kevin White
Email: [k.white@email.com](mailto:k.white@email.com)
Phone: 212-555-0133
Company: Google
Annual Income: $200,000
Credit Score: 800
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Room 5 (❌ INVALID PREFIX)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Room 5"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Room 5",
}
3.2 - No Prefix:

Real Data:
mainAddress1: 123 Main Street
mainAddress2: 5B (❌ INVALID PREFIX)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: 5B"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received:  5B",
    
}
-
3.3 - Missing Identifier:

Real Data:
mainAddress1: 123 Main Street
mainAddress2: Apt (❌ MISSING IDENTIFIER)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Apt"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Apt",
    
}

---

❌ SCENARIO 4: Invalid mainCity

Description:
Testing address validation with invalid mainCity, including numbers or special characters.

4.1 - With Numbers

Real Data:
Name: Steven King
Email: [s.king@email.com](mailto:s.king@email.com)
Phone: 212-555-0145
Company: Intel
Annual Income: $310,000
Credit Score: 910
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York 123 (❌ WITH NUMBERS)
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainCity must match the required address format. Received: New York 123"
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New York 123",
    
}
--
4.2 - Com Sublinhado: mainCity: New_York
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New_York",
    
}
-
4.3 - Apenas Números: mainCity: 
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: 658",
    
}
--

## 4.4. mainCity com caracteres válidos (St. Louis, O'Fallon, McAllen)

**Requisitado em:** Test Scenario 3, Valid Examples
**Dados válidos de cidade:**

* St. Louis
* O'Fallon
* McAllen

**Dados reais de teste:**
* Name: Sarah White
* Email: [sarah.white@email.com](mailto:sarah.white@email.com)
* Phone: 212-555-0225
* Company: Intel
* Annual Income: $700,000
* Credit Score: 980
* Status: Employed
* mainAddress1: 789 Pine Lane
* mainAddress2: Suite 12A
* mainCity: St. Paul
* mainStateOrProvince: MN
* mainPostalCode: 55101
**Expected:** ✅ 200 OK (mainCity is valid with special characters)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>ef98d4e0-8d2e-4050-b63d-7de8a2cd9cce</accountNumber>
    <authorizationNumber>10441</authorizationNumber>
</ApplicationResponse>
-
O'Fallon
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>fecb5734-fb10-4f45-a079-b60e50e065e0</accountNumber>
    <authorizationNumber>10439</authorizationNumber>
</ApplicationResponse>
-
St. Louis
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>aa3a5445-6a8a-417d-9f68-6b039a41aa64</accountNumber>
    <authorizationNumber>10440</authorizationNumber>
</ApplicationResponse>
---

❌ SCENARIO 5: Invalid mainStateOrProvince

Description:
When the mainStateOrProvince field contains invalid values, the system should reject it with an appropriate error.

5.1 - Full Name

Real Data:
Name: Donna Mitchell
Email: [d.mitchell@email.com](mailto:d.mitchell@email.com)
Phone: 212-555-0154
Company: Dropbox
Annual Income: $400,000
Credit Score: 1000
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: California (❌ FULL NAME)
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainStateOrProvince must match the required address format. Received: California"
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: California",
    
}
--
5.2 - Abreviação Inválida: mainStateOrProvince: XX
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: XX",
    
}
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: NYY",
    
}
-
5.3 - Números: mainStateOrProvince: 12
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: 33",
    
}
--
## 5.4. mainStateOrProvince case-insensitive (Tx → TX, fl → FL)

**Requisitado em:** Test Scenario 4, Valid Examples  
**Cenário válido:**  
- Tx (será convertido para TX)  
- fl (será convertido para FL)  

**Dados reais de teste:**  
- Name: Jessica Morgan  
- Email: [jessica.morgan@email.com](mailto:jessica.morgan@email.com)  
- Phone: 212-555-0180  
- Company: Amazon  
- Annual Income: $450,000  
- Credit Score: 850  
- Status: Employed  

- mainAddress1: 524 Elm Street  
- mainAddress2: Apt 2C  
- mainCity: Seattle  
- mainStateOrProvince: Tx  and "destinationState": "Wa" from "lineItemLineNumber": "320",
- mainPostalCode: 98101  

**Expected:** ✅ 200 OK (Tx is converted to TX)
Tx and "destinationState": "Wa" for  "lineItemLineNumber": "320",
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>3fbb0ff7-2ea0-4221-89e3-821d1ced8b01</accountNumber>
    <authorizationNumber>10444</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 6: Invalid mainPostalCode

Description:
Validating the format of mainPostalCode with different invalid values, including insufficient digits or excessive digits.

6.1 - Too Short

Real Data:
Name: Albert Morgan
Email: [a.morgan@email.com](mailto:a.morgan@email.com)
Phone: 212-555-0165
Company: Uber
Annual Income: $510,000
Credit Score: 1011
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 1234 (❌ TOO SHORT - 4 DIGITS)

Expected: ❌ 400 Bad Request
Message: "mainPostalCode must match the required address format. Received: 1234"
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 1234",
    
}
--
6.2 - Muito Longo (6 Dígitos): mainPostalCode: 123456
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 123456",
    
}
-
6.3 - Extensão Curta (3 Dígitos): mainPostalCode: 12345-678
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 12345-678",
    
}
Expected:"PostalCode should have only 5 digits. Received 12345-678"
-
6.4 - Letras: mainPostalCode: ABCDE
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received ABCDE",
    
}
Expected:"PostalCode should have only 5 digits. Received ABCDE"
6.5 Vazio
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainPostalCode is required",
    
}
Expected:"mainPostalCode is required",
-
---

✅ SCENARIO 7: Global Validation Disabled

Description:
When the global validation setting is disabled, the request is accepted regardless of the field formats.

Configuration:
address.format.enabled: false

Real Data:
Name: Henry Richardson
Email: [h.richardson@email.com](mailto:h.richardson@email.com)
Phone: 212-555-0171
Company: Facebook
Annual Income: $570,000
Credit Score: 1017
Status: Employed

mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
mainAddress2: Room 5 (❌ INVALID PREFIX)
mainCity: New York 123 (❌ CONTAINS NUMBERS)
mainStateOrProvince: California (❌ FULL STATE NAME)
mainPostalCode: 93632

Expected: ✅ 200 OK (all errors ignored)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>0d954f1b-489a-48ee-b2fa-bc2bf186579d</accountNumber>
    <authorizationNumber>10419</authorizationNumber>
</ApplicationResponse>

------------------------------------------------------------------------------------------














```markdown

✅ SCENARIO 1: Completely Valid Address

Description:
When a user submits an application with a valid address, all fields must be in the correct format, including the house number and street name.

Real Data:
Name: John Smith
Email: [john.smith@email.com](mailto:john.smith@email.com)
Phone: 212-555-0123
Company: Goldman Sachs
Annual Income: $150,000
Credit Score: 750
Status: Employed

mainAddress1: 237 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ✅ 200 OK - Application accepted
LeadPk: 10404
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>b5ee37e3-f64b-4706-a5b6-635d42f6a2ab</accountNumber>
    <authorizationNumber>10404</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 2: Invalid mainAddress1

Description:
Testing invalid addresses in the mainAddress1 field.

2.1 - Missing Number

Real Data:
Name: Sarah Johnson
Email: [sarah.j@email.com](mailto:sarah.j@email.com)
Phone: 212-555-0124
Company: JPMorgan Chase
Annual Income: $120,000
Credit Score: 720
Status: Employed

mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: Main Street"
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: Main Street",
}
-
2.2 - Only Number

Real Data:
Name: Michael Brown
Email: [m.brown@email.com](mailto:m.brown@email.com)
Phone: 212-555-0125
Company: Morgan Stanley
Annual Income: $180,000
Credit Score: 780
Status: Employed

mainAddress1: 123 (❌ ONLY NUMBER)
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: 123"
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 357",
}
-
2.3 - No Space

Real Data:
Name: Emily Davis
Email: emily.d@email.com
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123Main Street",
}
--
## 2.4. Disable Specific Field (street1: false, city: true)

**Requested in:** Configuration Testing, Test 2  
**YAML Configuration:**
```yaml
ensure:
  address:
    format:
      enabled: true
      street1: false
      city: true
````
**Real Test Data:**
* Name: Emily Clarkson
* Email: [emily.clarkson@email.com](mailto:emily.clarkson@email.com)
* Phone: 212-555-0203
* Company: Tesla
* Annual Income: $600,000
* Credit Score: 950
* Status: Employed
* mainAddress1: null (field disabled)
* mainAddress2: Apt 9B
* mainCity: Chicago
* mainStateOrProvince: IL
* mainPostalCode: 60601
**Expected:** ✅ 200 OK (street1 field disabled, city field enabled)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>cee8349e-62aa-4468-9789-7fc48fe4aa48</accountNumber>
    <authorizationNumber>10430</authorizationNumber>
</ApplicationResponse>
--
## 2.5.1 - Custom Regex

**Requested in:** Configuration Testing, Test 3
**YAML Configuration:**

```yaml
ensure:
  address:
    format:
      regex:
        street1: "^[0-9]{1,5}\\s+[A-Za-z]+$"
```


**Real Test Data:**
* Name: Daniel Hill
* Email: [daniel.hill@email.com](mailto:daniel.hill@email.com)
* Phone: 212-555-0214
* Company: Oracle
* Annual Income: $450,000
* Credit Score: 800
* Status: Employed
* mainAddress1: 123 MainStreet
* mainAddress2: Apt 3D
* mainCity: San Francisco
* mainStateOrProvince: CA
* mainPostalCode: 94105
**Expected:** ✅ 200 OK (address format matches regex)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>6ad61457-8fa8-42f9-a677-28e4d2c4cf55</accountNumber>
    <authorizationNumber>10434</authorizationNumber>
</ApplicationResponse>
--
2.5.2 - Custom Regex — High-Risk Leasing
Objective:
Ensure that in high-value leasing operations (e.g., premium vehicles, industrial equipment), the main address (mainAddress1) follows a corporate or structured address format, rejecting generic patterns and suspicious abbreviations.
ensure:
  address:
    format:
      regex:
        street1: "^(Bloco\\s?[A-Z0-9]{1,3}|Lote\\s?\\d{1,3}|Unidade\\s?\\d{1,3}|Andar\\s?\\d{1,2})\\s[-,\\s]?\\d{1,5}\\s[A-Za-z\\s\\.]{3,40}$"
The address must have a corporate or structured building identification format, such as:
Block A - 100 Paulista Avenue
Lot 7 450 Andradas Street
Unit 12, 55 XV de Novembro Street
Floor 3 - 2000 Santos Alameda
| Campo                    | Valor                                                 |
| ------------------------ | ----------------------------------------------------- |
| **Name:**                | Daniel Hill                                           |
| **Email:**               | [daniel.hill@email.com](mailto:daniel.hill@email.com) |
| **Phone:**               | +1 (212) 555-0214                                     |
| **Company:**             | Oracle Corp.                                          |
| **Annual Income:**       | $450,000                                              |
| **Credit Score:**        | 800                                                   |
| **Status:**              | Employed (Corporate Account)                          |
| **mainAddress1:**        | `Unit 5A - 1234 Elm St.`                              |
| **mainAddress2:**        | `Suite 101`                                           |
| **mainCity:**            | San Francisco                                         |
| **mainStateOrProvince:** | CA (California)                                       |
| **mainPostalCode:**      | 94105                                                 |

Expected Result
Expected: ✅ 200 OK
Reason: The address meets the required format for high-risk leasing (presence of block/lot/unit and complete street name).
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>402eebb9-5a1e-445d-81f0-e4b7a4ae1e80</accountNumber>
    <authorizationNumber>10435</authorizationNumber>
</ApplicationResponse>
--
## 2.6. mainAddress1 with 9-Digit Limit (Must Reject)

**Requested in:** Test Scenario 1, Invalid Examples
**Invalid Address Data:**

* 123456789 Main Street (house number too long - 9 digits)

**Real Test Data:**
* Name: Nathan Cooper
* Email: [nathan.cooper@email.com](mailto:nathan.cooper@email.com)
* Phone: 212-555-0237
* Company: Apple
* Annual Income: $800,000
* Credit Score: 950
* Status: Employed
* mainAddress1: 123456789 Main Street
* mainAddress2: Apt 4C
* mainCity: Cupertino
* mainStateOrProvince: CA
* mainPostalCode: 95014
**Expected:** ❌ 400 Bad Request (house number exceeds 9 digits)
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123456789 Main Street",
}
--
## 2.7. mainAddress1 with Special Characters (12-B, Blvd.)

**Requested in:** Test Scenario 1, Valid Examples
**Valid Address Data:**

* 12-B North Road
* 1000 Washington Blvd.

**Real Test Data:**
* Name: Olivia Thompson
* Email: [olivia.thompson@email.com](mailto:olivia.thompson@email.com)
* Phone: 212-555-0241
* Company: Facebook
* Annual Income: $750,000
* Credit Score: 960
* Status: Employed
* mainAddress1: 12-B North Road
* mainAddress2: Suite 10A
* mainCity: Mountain View
* mainStateOrProvince: CA
* mainPostalCode: 94040
**Expected:** ✅ 200 OK (mainAddress1 is valid with special characters)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>22d8b335-a69a-4f02-8a26-d567ea56bbea</accountNumber>
    <authorizationNumber>10437</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 3: Invalid mainAddress2

Description:
When the mainAddress2 field is invalid, the system should reject the request with the appropriate error.

3.1 - Invalid Prefix

Real Data:
Name: Kevin White
Email: [k.white@email.com](mailto:k.white@email.com)
Phone: 212-555-0133
Company: Google
Annual Income: $200,000
Credit Score: 800
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Room 5 (❌ INVALID PREFIX)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Room 5"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Room 5",
}
3.2 - No Prefix:

Real Data:
mainAddress1: 123 Main Street
mainAddress2: 5B (❌ INVALID PREFIX)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: 5B"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received:  5B",
}
-
3.3 - Missing Identifier:

Real Data:
mainAddress1: 123 Main Street
mainAddress2: Apt (❌ MISSING IDENTIFIER)
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Apt"
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Apt",
}

---

❌ SCENARIO 4: Invalid mainCity

Description:
Testing address validation with invalid mainCity, including numbers or special characters.

4.1 - With Numbers

Real Data:
Name: Steven King
Email: [s.king@email.com](mailto:s.king@email.com)
Phone: 212-555-0145
Company: Intel
Annual Income: $310,000
Credit Score: 910
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York 123 (❌ WITH NUMBERS)
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainCity must match the required address format. Received: New York 123"
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New York 123",
}
--
4.2 - Com Sublinhado: mainCity: New_York
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New_York",
}
-
4.3 - Apenas Números: mainCity: 
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: 658",
}
--

## 4.4. mainCity with Valid Characters (St. Louis, O'Fallon, McAllen)

**Requested in:** Test Scenario 3, Valid Examples
**Valid City Data:**

* St. Louis
* O'Fallon
* McAllen

**Real Test Data:**
* Name: Sarah White
* Email: [sarah.white@email.com](mailto:sarah.white@email.com)
* Phone: 212-555-0225
* Company: Intel
* Annual Income: $700,000
* Credit Score: 980
* Status: Employed
* mainAddress1: 789 Pine Lane
* mainAddress2: Suite 12A
* mainCity: St. Paul
* mainStateOrProvince: MN
* mainPostalCode: 55101
**Expected:** ✅ 200 OK (mainCity is valid with special characters)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>ef98d4e0-8d2e-4050-b63d-7de8a2cd9cce</accountNumber>
    <authorizationNumber>10441</authorizationNumber>
</ApplicationResponse>
-
O'Fallon
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>fecb5734-fb10-4f45-a079-b60e50e065e0</accountNumber>
    <authorizationNumber>10439</authorizationNumber>
</ApplicationResponse>
-
St. Louis
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>aa3a5445-6a8a-417d-9f68-6b039a41aa64</accountNumber>
    <authorizationNumber>10440</authorizationNumber>
</ApplicationResponse>
---

❌ SCENARIO 5: Invalid mainStateOrProvince

Description:
When the mainStateOrProvince field contains invalid values, the system should reject it with an appropriate error.

5.1 - Full Name

Real Data:
Name: Donna Mitchell
Email: [d.mitchell@email.com](mailto:d.mitchell@email.com)
Phone: 212-555-0154
Company: Dropbox
Annual Income: $400,000
Credit Score: 1000
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: California (❌ FULL NAME)
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainStateOrProvince must match the required address format. Received: California"
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: California",
}
--
5.2 - Invalid Abbreviation: mainStateOrProvince: XX
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: XX",
}
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: NYY",
}
-
5.3 - Números: mainStateOrProvince: 12
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: 33",
}
--
## 5.4. mainStateOrProvince case-insensitive (Tx → TX, fl → FL)

**Requested in:** Test Scenario 4, Valid Examples  
**Valid Scenario:**  
- Tx (will be converted to TX)  
- fl (will be converted to FL)  

**Real Test Data:**  
- Name: Jessica Morgan  
- Email: [jessica.morgan@email.com](mailto:jessica.morgan@email.com)  
- Phone: 212-555-0180  
- Company: Amazon  
- Annual Income: $450,000  
- Credit Score: 850  
- Status: Employed  

- mainAddress1: 524 Elm Street  
- mainAddress2: Apt 2C  
- mainCity: Seattle  
- mainStateOrProvince: Tx  and "destinationState": "Wa" from "lineItemLineNumber": "320",
- mainPostalCode: 98101  

**Expected:** ✅ 200 OK (Tx is converted to TX)
Tx and "destinationState": "Wa" for  "lineItemLineNumber": "320",
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>3fbb0ff7-2ea0-4221-89e3-821d1ced8b01</accountNumber>
    <authorizationNumber>10444</authorizationNumber>
</ApplicationResponse>

---

❌ SCENARIO 6: Invalid mainPostalCode

Description:
Validating the format of mainPostalCode with different invalid values, including insufficient digits or excessive digits.

6.1 - Too Short

Real Data:
Name: Albert Morgan
Email: [a.morgan@email.com](mailto:a.morgan@email.com)
Phone: 212-555-0165
Company: Uber
Annual Income: $510,000
Credit Score: 1011
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 1234 (❌ TOO SHORT - 4 DIGITS)

Expected: ❌ 400 Bad Request
Message: "mainPostalCode must match the required address format. Received: 1234"
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 1234",
}
--
6.2 - Too Long (6 Digits): mainPostalCode: 123456
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 123456",
}
-
6.3 - Short Extension (3 Digits): mainPostalCode: 12345-678
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 12345-678",
}
Expected:"PostalCode should have only 5 digits. Received 12345-678"
-
6.4 - Letras: mainPostalCode: ABCDE
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received ABCDE",
}
Expected:"PostalCode should have only 5 digits. Received ABCDE"
6.5 Empty
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainPostalCode is required",
}
Expected:"mainPostalCode is required",
-
---

✅ SCENARIO 7: Global Validation Disabled

Description:
When the global validation setting is disabled, the request is accepted regardless of the field formats.

Configuration:
address.format.enabled: false

Real Data:
Name: Henry Richardson
Email: [h.richardson@email.com](mailto:h.richardson@email.com)
Phone: 212-555-0171
Company: Facebook
Annual Income: $570,000
Credit Score: 1017
Status: Employed

mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
mainAddress2: Room 5 (❌ INVALID PREFIX)
mainCity: New York 123 (❌ CONTAINS NUMBERS)
mainStateOrProvince: California (❌ FULL STATE NAME)
mainPostalCode: 93632

Expected: ✅ 200 OK (all errors ignored)
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>0d954f1b-489a-48ee-b2fa-bc2bf186579d</accountNumber>
    <authorizationNumber>10419</authorizationNumber>
</ApplicationResponse>

---



```














----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



street1: "^[0-9]{1,7}\\s+[A-Za-z0-9#\\.\\-]+(?:\\s[A-Za-z0-9#\\.\\-]+){0,8}$"





> ## Tests in qa1

### SCENARIO 1: Completely Valid Address

Description:
When a user submits an application with a valid address, all fields must be in the correct format, including the house number and street name.

Real Data:
Name: John Smith
Email: [john.smith@email.com](mailto:john.smith@email.com)
Phone: 212-555-0123
Company: Goldman Sachs
Annual Income: $150,000
Credit Score: 750
Status: Employed

mainAddress1: 237 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 10001

Expected: ✅ 200 OK - Application accepted
LeadPk: 10404

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>b5ee37e3-f64b-4706-a5b6-635d42f6a2ab</accountNumber>
    <authorizationNumber>10404</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

### SCENARIO 2: Invalid mainAddress1

Description:
Testing invalid addresses in the mainAddress1 field.

#### 2.1 - Missing Number

**Real Data:**
- Name: Sarah Johnson
- Email: [sarah.j@email.com](mailto:sarah.j@email.com)
- Phone: 212-555-0124
- Company: JPMorgan Chase
- Annual Income: $120,000
- Credit Score: 720
- Status: Employed

**Address Data:**
- mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
- mainAddress2: Apt 5B
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainAddress1 must match the required address format. Received: Main Street"

```json
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: Main Street"
}
```

**|PASS|**

---

#### 2.2 - Only Number

**Real Data:**
- Name: Michael Brown
- Email: [m.brown@email.com](mailto:m.brown@email.com)
- Phone: 212-555-0125
- Company: Morgan Stanley
- Annual Income: $180,000
- Credit Score: 780
- Status: Employed

**Address Data:**
- mainAddress1: 123 (❌ ONLY NUMBER)
- mainAddress2: Apt 5B
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainAddress1 must match the required address format. Received: 123"

```json
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 357"
}
```

**|PASS|**

---

#### 2.3 - No Space

**Real Data:**
- Name: Emily Davis
- Email: emily.d@email.com

**Address Data:**
- mainAddress1: 123Main Street (❌ NO SPACE)
- mainAddress2: Apt 5B
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123Main Street"
}
```

**|PASS|**

---

#### 2.4. Disable Specific Field (street1: false, city: true)

**YAML Configuration:**

```yaml
ensure:
  address:
    format:
      enabled: true
      street1: false
      city: true
```

**Real Test Data:**
- Name: Emily Clarkson
- Email: [emily.clarkson@email.com](mailto:emily.clarkson@email.com)
- Phone: 212-555-0203
- Company: Tesla
- Annual Income: $600,000
- Credit Score: 950
- Status: Employed
- mainAddress1: null (field disabled)
- mainAddress2: Apt 9B
- mainCity: Chicago
- mainStateOrProvince: IL
- mainPostalCode: 60601

**Expected:** ✅ 200 OK (street1 field disabled, city field enabled)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>cee8349e-62aa-4468-9789-7fc48fe4aa48</accountNumber>
    <authorizationNumber>10430</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

#### 2.5.1 - Custom Regex

**YAML Configuration:**

```yaml
ensure:
  address:
    format:
      regex:
        street1: "^[0-9]{1,5}\\s+[A-Za-z]+$"
```

**Real Test Data:**
- Name: Daniel Hill
- Email: [daniel.hill@email.com](mailto:daniel.hill@email.com)
- Phone: 212-555-0214
- Company: Oracle
- Annual Income: $450,000
- Credit Score: 800
- Status: Employed
- mainAddress1: 123 MainStreet
- mainAddress2: Apt 3D
- mainCity: San Francisco
- mainStateOrProvince: CA
- mainPostalCode: 94105

**Expected:** ✅ 200 OK (address format matches regex)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>6ad61457-8fa8-42f9-a677-28e4d2c4cf55</accountNumber>
    <authorizationNumber>10434</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

#### 2.5.2 - Custom Regex — High-Risk Leasing

**Objective:**
Ensure that in high-value leasing operations (e.g., premium vehicles, industrial equipment), the main address (mainAddress1) follows a corporate or structured address format, rejecting generic patterns and suspicious abbreviations.

**YAML Configuration:**

```yaml
ensure:
  address:
    format:
      regex:
        street1: "^(Bloco\\s?[A-Z0-9]{1,3}|Lote\\s?\\d{1,3}|Unidade\\s?\\d{1,3}|Andar\\s?\\d{1,2})\\s[-,\\s]?\\d{1,5}\\s[A-Za-z\\s\\.]{3,40}$"
```

**Address Format Examples:**
- Block A - 100 Paulista Avenue
- Lot 7 450 Andradas Street
- Unit 12, 55 XV de Novembro Street
- Floor 3 - 2000 Santos Alameda

**Real Test Data:**

| Field | Value |
|-------|-------|
| **Name:** | Daniel Hill |
| **Email:** | [daniel.hill@email.com](mailto:daniel.hill@email.com) |
| **Phone:** | +1 (212) 555-0214 |
| **Company:** | Oracle Corp. |
| **Annual Income:** | $450,000 |
| **Credit Score:** | 800 |
| **Status:** | Employed (Corporate Account) |
| **mainAddress1:** | Unit 5A - 1234 Elm St. |
| **mainAddress2:** | Suite 101 |
| **mainCity:** | San Francisco |
| **mainStateOrProvince:** | CA (California) |
| **mainPostalCode:** | 94105 |

**Expected Result:** ✅ 200 OK

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>402eebb9-5a1e-445d-81f0-e4b7a4ae1e80</accountNumber>
    <authorizationNumber>10435</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

#### 2.6. mainAddress1 with 9-Digit Limit (Must Reject)

**Invalid Address Data:**
- 123456789 Main Street (house number too long - 9 digits)

**Real Test Data:**
- Name: Nathan Cooper
- Email: [nathan.cooper@email.com](mailto:nathan.cooper@email.com)
- Phone: 212-555-0237
- Company: Apple
- Annual Income: $800,000
- Credit Score: 950
- Status: Employed
- mainAddress1: 123456789 Main Street
- mainAddress2: Apt 4C
- mainCity: Cupertino
- mainStateOrProvince: CA
- mainPostalCode: 95014

**Expected:** ❌ 400 Bad Request (house number exceeds 9 digits)

```json
{
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123456789 Main Street"
}
```

**|PASS|**

---

##### 2.7. mainAddress1 with Special Characters (12-B, Blvd.)

**Valid Address Data:**
- 12-B North Road
- 1000 Washington Blvd.

**Real Test Data:**
- Name: Olivia Thompson
- Email: [olivia.thompson@email.com](mailto:olivia.thompson@email.com)
- Phone: 212-555-0241
- Company: Facebook
- Annual Income: $750,000
- Credit Score: 960
- Status: Employed
- mainAddress1: 12-B North Road
- mainAddress2: Suite 10A
- mainCity: Mountain View
- mainStateOrProvince: CA
- mainPostalCode: 94040

**Expected:** ✅ 200 OK (mainAddress1 is valid with special characters)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>22d8b335-a69a-4f02-8a26-d567ea56bbea</accountNumber>
    <authorizationNumber>10437</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

### SCENARIO 3: Invalid mainAddress2

Description:
When the mainAddress2 field is invalid, the system should reject the request with the appropriate error.

#### 3.1 - Invalid Prefix

**Real Data:**
- Name: Kevin White
- Email: [k.white@email.com](mailto:k.white@email.com)
- Phone: 212-555-0133
- Company: Google
- Annual Income: $200,000
- Credit Score: 800
- Status: Employed

**Address Data:**
- mainAddress1: 123 Main Street
- mainAddress2: Room 5 (❌ INVALID PREFIX)
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainAddress2 must match the required address format. Received: Room 5"

```json
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Room 5"
}
```

**|PASS|**

---

##### 3.2 - No Prefix

**Address Data:**
- mainAddress1: 123 Main Street
- mainAddress2: 5B (❌ INVALID PREFIX)
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainAddress2 must match the required address format. Received: 5B"

```json
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: 5B"
}
```

**|PASS|**

---

##### 3.3 - Missing Identifier

**Address Data:**
- mainAddress1: 123 Main Street
- mainAddress2: Apt (❌ MISSING IDENTIFIER)
- mainCity: New York
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainAddress2 must match the required address format. Received: Apt"

```json
{
    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Apt"
}
```

**|PASS|**

---

### SCENARIO 4: Invalid mainCity

Description:
Testing address validation with invalid mainCity, including numbers or special characters.

##### 4.1 - With Numbers

**Real Data:**
- Name: Steven King
- Email: [s.king@email.com](mailto:s.king@email.com)
- Phone: 212-555-0145
- Company: Intel
- Annual Income: $310,000
- Credit Score: 910
- Status: Employed

**Address Data:**
- mainAddress1: 123 Main Street
- mainAddress2: Apt 5B
- mainCity: New York 123 (❌ WITH NUMBERS)
- mainStateOrProvince: NY
- mainPostalCode: 10001

**Expected:** ❌ 400 Bad Request
**Message:** "mainCity must match the required address format. Received: New York 123"

```json
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New York 123"
}
```

**|PASS|**

---

#### 4.2 - With Underscore

**Address Data:**
- mainCity: New_York

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: New_York"
}
```

**|PASS|**

---

#### 4.3 - Only Numbers

**Address Data:**
- mainCity: 658

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: 658"
}
```

**|PASS|**

---

#### 4.4. mainCity with Valid Characters (St. Louis, O'Fallon, McAllen)

**Valid City Data:**
- St. Louis
- O'Fallon
- McAllen

**Real Test Data:**
- Name: Sarah White
- Email: [sarah.white@email.com](mailto:sarah.white@email.com)
- Phone: 212-555-0225
- Company: Intel
- Annual Income: $700,000
- Credit Score: 980
- Status: Employed
- mainAddress1: 789 Pine Lane
- mainAddress2: Suite 12A
- mainCity: St. Paul
- mainStateOrProvince: MN
- mainPostalCode: 55101

**Expected:** ✅ 200 OK (mainCity is valid with special characters)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>ef98d4e0-8d2e-4050-b63d-7de8a2cd9cce</accountNumber>
    <authorizationNumber>10441</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

O'Fallon

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>fecb5734-fb10-4f45-a079-b60e50e065e0</accountNumber>
    <authorizationNumber>10439</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

St. Louis

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>aa3a5445-6a8a-417d-9f68-6b039a41aa64</accountNumber>
    <authorizationNumber>10440</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

### SCENARIO 5: Invalid mainStateOrProvince

Description:
When the mainStateOrProvince field contains invalid values, the system should reject it with an appropriate error.

#### 5.1 - Full Name

Real Data:
Name: Donna Mitchell
Email: [d.mitchell@email.com](mailto:d.mitchell@email.com)
Phone: 212-555-0154
Company: Dropbox
Annual Income: $400,000
Credit Score: 1000
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: California (❌ FULL NAME)
mainPostalCode: 10001

Expected: ❌ 400 Bad Request
Message: "mainStateOrProvince must match the required address format. Received: California"

```json
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: California"
}
```

**|PASS|**

---

### 5.2 - Invalid Abbreviation

mainStateOrProvince: XX

```json
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: XX"
}
```

**|PASS|**

---

mainStateOrProvince: NYY

```json
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: NYY"
}
```

**|PASS|**

---

#### 5.3 - Numbers

mainStateOrProvince: 12

```json
{
    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: 33"
}
```

**|PASS|**

---

### 5.4. mainStateOrProvince case-insensitive (Tx → TX, fl → FL)

**Valid Scenario:**
- Tx (will be converted to TX)
- fl (will be converted to FL)

**Real Test Data:**
- Name: Jessica Morgan
- Email: [jessica.morgan@email.com](mailto:jessica.morgan@email.com)
- Phone: 212-555-0180
- Company: Amazon
- Annual Income: $450,000
- Credit Score: 850
- Status: Employed
- mainAddress1: 524 Elm Street
- mainAddress2: Apt 2C
- mainCity: Seattle
- mainStateOrProvince: Tx
- mainPostalCode: 98101

**Expected:** ✅ 200 OK (Tx is converted to TX)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>3fbb0ff7-2ea0-4221-89e3-821d1ced8b01</accountNumber>
    <authorizationNumber>10444</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**

---

### SCENARIO 6: Invalid mainPostalCode

Description:
Validating the format of mainPostalCode with different invalid values, including insufficient digits or excessive digits.

#### 6.1 - Too Short

Real Data:
Name: Albert Morgan
Email: [a.morgan@email.com](mailto:a.morgan@email.com)
Phone: 212-555-0165
Company: Uber
Annual Income: $510,000
Credit Score: 1011
Status: Employed

mainAddress1: 123 Main Street
mainAddress2: Apt 5B
mainCity: New York
mainStateOrProvince: NY
mainPostalCode: 1234 (❌ TOO SHORT - 4 DIGITS)

Expected: ❌ 400 Bad Request
Message: "mainPostalCode must match the required address format. Received: 1234"

```json
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 1234"
}
```

**|PASS|**

---

### 6.2 - Too Long (6 Digits)

**Address Data:**
- mainPostalCode: 123456

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 123456"
}
```

**|PASS|**

---

#### 6.3 - Short Extension (3 Digits)

**Address Data:**
- mainPostalCode: 12345-678

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 12345-678"
}
```

**|PASS|**

---

#### 6.4 - Letters

**Address Data:**
- mainPostalCode: ABCDE

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received ABCDE"
}
```

**|PASS|**

---

#### 6.5 - Empty

**Address Data:**
- mainPostalCode: (empty)

**Expected:** ❌ 400 Bad Request

```json
{
    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainPostalCode is required"
}
```

**|PASS|**

---

### SCENARIO 7: Global Validation Disabled

Description:
When the global validation setting is disabled, the request is accepted regardless of the field formats.

Configuration:
address.format.enabled: false

Real Data:
Name: Henry Richardson
Email: [h.richardson@email.com](mailto:h.richardson@email.com)
Phone: 212-555-0171
Company: Facebook
Annual Income: $570,000
Credit Score: 1017
Status: Employed

mainAddress1: Main Street (❌ MISSING HOUSE NUMBER)
mainAddress2: Room 5 (❌ INVALID PREFIX)
mainCity: New York 123 (❌ CONTAINS NUMBERS)
mainStateOrProvince: California (❌ FULL STATE NAME)
mainPostalCode: 93632

Expected: ✅ 200 OK (all errors ignored)

```xml
<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>0d954f1b-489a-48ee-b2fa-bc2bf186579d</accountNumber>
    <authorizationNumber>10419</authorizationNumber>
</ApplicationResponse>
```

**|PASS|**


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


STG






> ## Tests in stg

```markdown
✅ SCENARIO 1: Completely Valid Address

Description:
When a user submits an application with a valid address, all fields must be in the correct format, including the house number and street name.

Real Data:
Name: John Smith
Email: [john.smith@email.com](mailto:john.smith@email.com)
Phone: 212-555-0123
Company: Goldman Sachs
Annual Income: $150,000
Credit Score: 750
Status: Employed

{
  "mainAddress1": "237 Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001"
}

Expected: ✅ 200 OK - Application accepted
LeadPk:25428
---

{
  "mainAddress1": "215 N. 10th-Street",
  "mainAddress2": "Unit 7B",
  "mainCity": "St. Louis",
  "mainStateOrProvince": "MO",
  "mainPostalCode": "63103"
}

Expected:
✅ 200 OK – Special characters accepted
LeadPk:25432
---


❌ SCENARIO 2: Invalid mainAddress1

Description:
Testing invalid addresses in the mainAddress1 field.

2.1 - Missing Number

Real Data:
Name: Sarah Johnson
Email: [sarah.j@email.com](mailto:sarah.j@email.com)
Phone: 212-555-0124
Company: JPMorgan Chase
Annual Income: $120,000
Credit Score: 720
Status: Employed

{
  "mainAddress1": "Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001"
}

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: Main Street"
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: Main Street",

---
2.2 - Only Number


Real Data:
Name: Michael Brown
Email: [m.brown@email.com](mailto:m.brown@email.com)
Phone: 212-555-0125
Company: Morgan Stanley
Annual Income: $180,000
Credit Score: 780
Status: Employed

{
  "mainAddress1": "123",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001"
}

Expected: ❌ 400 Bad Request
Message: "mainAddress1 must match the required address format. Received: 357"
    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123",

---
2.3 - No Space Between Number and Street

Real Data:
Name: Emily Davis
Email: emily.d@email.com

{
  "mainAddress1": "123Main Street",
  "mainAddress2": "Apt 5B",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001"
}

    "faults": true,
    "fieldInError1": "mainAddress1",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress1 must match the required address format. Received: 123Main Street",

---

❌ SCENARIO 3: Invalid mainAddress2

Description:
When the mainAddress2 field is invalid, the system should reject the request with the appropriate error.

3.1 - Invalid Prefix

Real Data:
Name: Kevin White
Email: [k.white@email.com](mailto:k.white@email.com)
Phone: 212-555-0133
Company: Google
Annual Income: $200,000
Credit Score: 800
Status: Employed

{
  "mainAddress1": "456 Broadway Avenue",
  "mainAddress2": "Room 10",
  "mainCity": "Boston",
  "mainStateOrProvince": "MA",
  "mainPostalCode": "02108"
}

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Room 10"

    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Room 10",

---
3.2 - No Prefix:

{
  "mainAddress1": "987 Ocean Blvd",
  "mainAddress2": "5A",
  "mainCity": "Miami",
  "mainStateOrProvince": "FL",
  "mainPostalCode": "33130"
}


Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: 5A"

    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: 5A",

---
3.3 - Missing Identifier:

{
  "mainAddress1": "742 Evergreen Terrace",
  "mainAddress2": "Apt",
  "mainCity": "Springfield",
  "mainStateOrProvince": "IL",
  "mainPostalCode": "62704"
}

Expected: ❌ 400 Bad Request
Message: "mainAddress2 must match the required address format. Received: Apt"

    "faults": true,
    "fieldInError1": "mainAddress2",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainAddress2 must match the required address format. Received: Apt",

---

❌ SCENARIO 4: Invalid mainCity

Description:
Testing address validation with invalid mainCity, including numbers or special characters.

4.1 - With Numbers

Real Data:
Name: Steven King
Email: [s.king@email.com](mailto:s.king@email.com)
Phone: 212-555-0145
Company: Intel
Annual Income: $310,000
Credit Score: 910
Status: Employed

{
  "mainAddress1": "321 Pine Lane",
  "mainAddress2": "Suite 12A",
  "mainCity": "St. Paul 22",
  "mainStateOrProvince": "MN",
  "mainPostalCode": "55101"
}

Expected: ❌ 400 Bad Request
Message: "mainCity must match the required address format. Received: St. Paul 22"

    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: St. Paul 22",

--
4.2 - Com underscore: mainCity: New_York

{
  "mainAddress1": "1234 Elm Street",
  "mainAddress2": "Apt 2C",
  "mainCity": "Los_Angeles",
  "mainStateOrProvince": "CA",
  "mainPostalCode": "90012"
}

    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: Los_Angeles",

---
4.3 - Apenas Números: mainCity: 

{
  "mainAddress1": "245 Oak Street",
  "mainAddress2": "Suite 11B",
  "mainCity": "12345",
  "mainStateOrProvince": "TX",
  "mainPostalCode": "75001"
}

    "faults": true,
    "fieldInError1": "mainCity",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainCity must match the required address format. Received: 12345",
---
4.4 - Valid mainCity containing apostrophe (O'Fallon)

{
  "mainAddress1": "1502 West Highway 50",
  "mainAddress2": "Apt 4C",
  "mainCity": "O'Fallon",
  "mainStateOrProvince": "IL",
  "mainPostalCode": "62269"
}

Expected:
✅ 200 OK – Apostrophe accepted
LeadPk:25433
---
4.5 - Valid mainCity containing hyphen (Winston-Salem)

{
  "mainAddress1": "200 West Fourth Street",
  "mainAddress2": "Suite 1200",
  "mainCity": "Winston-Salem",
  "mainStateOrProvince": "NC",
  "mainPostalCode": "27101"
}

Expected:
✅ 200 OK – Hyphen accepted
LeadPk:25435
---

❌ SCENARIO 5: Invalid mainStateOrProvince

Description:
When the mainStateOrProvince field contains invalid values, the system should reject it with an appropriate error.

5.1 - Full Name

Real Data:
Name: Donna Mitchell
Email: [d.mitchell@email.com](mailto:d.mitchell@email.com)
Phone: 212-555-0154
Company: Dropbox
Annual Income: $400,000
Credit Score: 1000
Status: Employed

{
  "mainAddress1": "700 Market Street",
  "mainAddress2": "Apt 10B",
  "mainCity": "San Francisco",
  "mainStateOrProvince": "California",
  "mainPostalCode": "94105"
}

Expected: ❌ 400 Bad Request
Message: "mainStateOrProvince must match the required address format. Received: California"

    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: California",

--
5.2 - Abreviação Inválida: mainStateOrProvince: XX and XXX

{
  "mainAddress1": "450 Vine Street",
  "mainAddress2": "Suite 8",
  "mainCity": "Cincinnati",
  "mainStateOrProvince": "XX",
  "mainPostalCode": "45202"
}

    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: XX",
-
{
  "mainAddress1": "450 Vine Street",
  "mainAddress2": "Suite 8",
  "mainCity": "New York",
  "mainStateOrProvince": "NYY",
  "mainPostalCode": "10001"
}

    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: NYY",

---
5.3 - Números: mainStateOrProvince: 12

{
  "mainAddress1": "89 Hillcrest Ave",
  "mainAddress2": "Apt 7B",
  "mainCity": "Atlanta",
  "mainStateOrProvince": "12",
  "mainPostalCode": "30303"
}

    "faults": true,
    "fieldInError1": "mainStateOrProvince",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainStateOrProvince must match the required address format. Received: 12",

---
5.4 - State Case-Insensitive (tx → TX)

Cidade real: Austin, TX
ZIP real: 73301

{
  "mainAddress1": "500 Congress Avenue",
  "mainAddress2": "Apt 21C",
  "mainCity": "Austin",
  "mainStateOrProvince": "tx",
  "mainPostalCode": "73301"
}

Expected:
✅ 200 OK – State normalized to uppercase (TX)
LeadPk:25436
---

❌ SCENARIO 6: Invalid mainPostalCode

Description:
Validating the format of mainPostalCode with different invalid values, including insufficient digits or excessive digits.

6.1 - Too Short

Real Data:
Name: Albert Morgan
Email: [a.morgan@email.com](mailto:a.morgan@email.com)
Phone: 212-555-0165
Company: Uber
Annual Income: $510,000
Credit Score: 1011
Status: Employed

{
  "mainAddress1": "480 Maple Drive",
  "mainAddress2": "Suite 14",
  "mainCity": "Chicago",
  "mainStateOrProvince": "IL",
  "mainPostalCode": "6060"
}

Expected: ❌ 400 Bad Request
Message: "PostalCode should have only 5 digits. Received 6060"

    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 6060",

--
6.2 - Muito Longo (6 Dígitos): mainPostalCode: 123456

{
  "mainAddress1": "1500 Pine Street",
  "mainAddress2": "Apt 9A",
  "mainCity": "Denver",
  "mainStateOrProvince": "CO",
  "mainPostalCode": "802051"
}

    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 802051",

---
6.3 - Extensão Curta (3 Dígitos): mainPostalCode: 90045-678

{
  "mainAddress1": "789 Sunset Blvd",
  "mainAddress2": "Apt 22C",
  "mainCity": "Los Angeles",
  "mainStateOrProvince": "CA",
  "mainPostalCode": "90045-678"
}

Expected:"PostalCode should have only 5 digits. Received 90045-678"

    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received 90045-678",

---
6.4 - Letras: mainPostalCode: ABCDE

{
  "mainAddress1": "200 Bay Street",
  "mainAddress2": "Suite 3F",
  "mainCity": "Tampa",
  "mainStateOrProvince": "FL",
  "mainPostalCode": "ABCDE"
}

Expected:"PostalCode should have only 5 digits. Received ABCDE"

    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "PostalCode should have only 5 digits. Received ABCDE",

---

6.5 Vazio

{
  "mainAddress1": "145 Broadway",
  "mainAddress2": "Apt 5C",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": ""
}

Expected:"mainPostalCode is required",

    "faults": true,
    "fieldInError1": "mainPostalCode",
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": "mainPostalCode is required",

---

✅ SCENARIO 7: Global Validation Disabled

Description:
When the global validation setting is disabled, the request is accepted regardless of the field formats.

Configuration:
address.format.enabled: false

Real Data:
Name: Henry Richardson
Email: [h.richardson@email.com](mailto:h.richardson@email.com)
Phone: 212-555-0171
Company: Facebook
Annual Income: $570,000
Credit Score: 1017
Status: Employed

{
  "mainAddress1": "Main Street",
  "mainAddress2": "Room 5",
  "mainCity": "New York 123",
  "mainStateOrProvince": "California",
  "mainPostalCode": "93632"
}

Expected: ✅ 200 OK (all errors ignored)
---

```



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------