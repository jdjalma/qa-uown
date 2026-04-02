----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/479



UOWN | Servicing | Address Change Log Displays “Changed to Undefined”



BUG
In the Servicing Portal, when a customer’s address is updated, a log entry is correctly generated to record the modification.
However, the content of the log is incorrect — instead of displaying the new address value, it shows the message:
“Changed to Undefined”
This prevents users from identifying what the new value actually is.

Expected Result:
The log should display the previous value and the new address value clearly.

Actual Result:
The log displays “Changed to Undefined” instead of the actual updated address.

FIX
Investigate the cause of the missing value when logging address changes.
Verify that the updated address value is correctly passed to the logging mechanism.
Ensure the log entry captures and displays both the old and new values correctly.

{"phoneList":[{"pk":7067,"rowCreatedTimestamp":"2025-10-14T09:30:49.698697","rowUpdatedTimestamp":null,"tenantId":null,"webUserId":null,"agent":null,"phoneInfo":{"phonePK":7067,"customerPK":4275,"phoneType":"MOBILE","areaCode":"808","phoneNumber":2467866,"phoneExtension":null,"doNotCall":false,"reasonForDnc":"","doNotText":false,"reasonForDnt":"","lastContactTimestamp":null}}],"emailList":[{"pk":4275,"rowCreatedTimestamp":"2025-10-14T09:30:49.687695","rowUpdatedTimestamp":null,"tenantId":null,"webUserId":null,"agent":null,"emailInfo":{"emailPK":4275,"customerPK":4275,"emailAddress":"Br22er45t7roy@armyspy.com","emailType":"PRIMARY","doNotEmail":false,"reasonForDnc":""}}],"addressList":[{"pk":4275,"rowCreatedTimestamp":"2025-10-14T09:30:49.618967","rowUpdatedTimestamp":null,"tenantId":null,"webUserId":null,"agent":null,"addressInfo":{"addressPk":4275,"customerPk":4275,"addressType":"HOME","streetAddress1":"309 E 37th Sy","streetAddress2":"","city":"New York","state":"AK","zipCode":"10016","zipCode9":"10016-3234","country":"US","doNotContact":false,"duration":null,"atAddressFrom":null,"housingStatus":null,"isAutocompleteVerified":null}}],"accountPk":4295,"leadPhones":[],"leadEmails":[],"leadAddresses":[],"leadPk":null}
AddressInfo(addressPk=0, customerPk=0, addressType=HOME, streetAddress1=309 E 37th St, streetAddress2=null, city=New York, state=NY, zipCode=10016, zipCode9=10016-3234, country=US, doNotContact=false, duration=null, atAddressFrom=null, housingStatus=null, isAutocompleteVerified=null)
AddressInfo(addressPk=4275, customerPk=4275, addressType=HOME, streetAddress1=309 E 37th Sy, streetAddress2=, city=New York, state=AK, zipCode=10016, zipCode9=10016-3234, country=US, doNotContact=false, duration=null, atAddressFrom=null, housingStatus=null, isAutocompleteVerified=null)

![alt text](image.png)


Test steps
To reproduce the issue on SANDBOX/STG, you can create a new lease ou get one that doesn't have updated the address or update one to have the address line 2 as null saved on DB
![alt text](image-1.png)

Edit the address line 2 field
Edit the state field
Save and Refresh the Page
![alt text](image-2.png)

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Log de Alteração de Endereço Mostra “Changed to Undefined”

BUG

No Servicing Portal, quando o endereço de um cliente é atualizado, uma entrada de log é corretamente gerada para registrar a modificação.
No entanto, o conteúdo do log está incorreto — em vez de exibir o novo valor do endereço, ele mostra a mensagem:
“Changed to Undefined”
Isso impede que os usuários identifiquem qual é o novo valor do endereço atualizado.

Resultado Esperado:
O log deve exibir claramente o valor anterior e o novo valor do endereço.

Resultado Atual:
O log exibe “Changed to Undefined” em vez do endereço realmente atualizado.

CORREÇÃO
Investigar a causa da ausência do valor atualizado ao registrar mudanças de endereço.
Verificar se o novo valor do endereço está sendo corretamente passado para o mecanismo de logging.
Garantir que a entrada de log capture e exiba corretamente tanto o valor antigo quanto o novo valor.

{
  "phoneList": [
    {
      "pk": 7067,
      "rowCreatedTimestamp": "2025-10-14T09:30:49.698697",
      "phoneInfo": {
        "phonePK": 7067,
        "customerPK": 4275,
        "phoneType": "MOBILE",
        "areaCode": "808",
        "phoneNumber": 2467866
      }
    }
  ],
  "emailList": [
    {
      "pk": 4275,
      "rowCreatedTimestamp": "2025-10-14T09:30:49.687695",
      "emailInfo": {
        "emailPK": 4275,
        "customerPK": 4275,
        "emailAddress": "Br22er45t7roy@armyspy.com",
        "emailType": "PRIMARY"
      }
    }
  ],
  "addressList": [
    {
      "pk": 4275,
      "rowCreatedTimestamp": "2025-10-14T09:30:49.618967",
      "addressInfo": {
        "addressPk": 4275,
        "customerPk": 4275,
        "addressType": "HOME",
        "streetAddress1": "309 E 37th Sy",
        "streetAddress2": "",
        "city": "New York",
        "state": "AK",
        "zipCode": "10016",
        "zipCode9": "10016-3234",
        "country": "US"
      }
    }
  ]
}

Antes:
AddressInfo(addressPk=4275, streetAddress1=309 E 37th Sy, state=AK)
Depois:
AddressInfo(addressPk=0, streetAddress1=309 E 37th St, state=NY)

Passos para Teste
Para reproduzir o problema em SANDBOX/STG:
Crie um novo lease ou use um existente que ainda não tenha endereço atualizado, ou atualize um para ter o campo address line 2 salvo como null no banco.

Edite o campo address line 2.
Edite o campo state.
Salve e recarregue a página.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Altercoes dev:


 2 arquivos
+
49
−
8
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/uownlea
‎sing/svc/common/config‎

SvcEntityLi
‎stener.java‎
+8 -8

test/java/com/uownlea
‎sing/svc/common/config‎

SvcEntityList
‎enerTest.java‎
+41 -0

 src/main/java/com/uownleasing/svc/common/config/SvcEntityListener.java 
+
8
−
8

Visualizado
@@ -164,7 +164,7 @@ public class SvcEntityListener {
        return !result.isEmpty() ? "[ " + result + " ]" : "";
    }

    private String getChangeLog(Object oldState, Object newState, EntityChangeType changeType) {
    public String getChangeLog(Object oldState, Object newState, EntityChangeType changeType) {
        String logString = "";
        try {
            Javers javers = JaversBuilder.javers().build();
@@ -220,17 +220,17 @@ public class SvcEntityListener {
                            && !change.getPropertyName().equalsIgnoreCase("rowUpdatedTimestamp")
                            && !change.getPropertyName().equalsIgnoreCase("rowCreatedTimestamp")
                            && isFieldLoggable(newState, change.getPropertyNameWithPath(), changeType)) {
                        if (!logString.isBlank()) {
                        Object left = change.getLeft();
                        Object right = change.getRight();
                        var isUnnecessary = isUnnecessaryLog(left, right);
                        if (!logString.isBlank() && !isUnnecessary) {
                            logString = logString + " ; ";
                        }
                        if (change.getPropertyName().equalsIgnoreCase("ccNumber") || change.getPropertyName().equalsIgnoreCase("accountNumber")) {
                            String fromLog = change.getLeft() != null && isLeftNonNull ? "from "+ getLast4Digits(change.getLeft().toString()) + " " : "";
                            logString = logString + change.getPropertyName() + " changed "+ fromLog + "to " + getLast4Digits(change.getRight().toString());
                            String fromLog = left != null && isLeftNonNull ? "from "+ getLast4Digits(left.toString()) + " " : "";
                            logString = logString + change.getPropertyName() + " changed "+ fromLog + "to " + getLast4Digits(right.toString());
                        } else {
                            Object left = change.getLeft();
                            Object right = change.getRight();
                            if (isUnnecessaryLog(left, right)) continue;

                            if (isUnnecessary) continue;
                            String fromLog = "";
                            if (left != null && isLeftNonNull) {
                                fromLog = "from " + left.toString() + " ";
 src/test/java/com/uownleasing/svc/common/config/SvcEntityListenerTest.java 
+
41
−
0

Visualizado
package com.uownleasing.svc.common.config;

import com.uownleasing.common.enumeration.AddressType;
import com.uownleasing.common.enumeration.Duration;
import com.uownleasing.common.enumeration.EntityChangeType;
import com.uownleasing.common.enumeration.HousingStatus;
import com.uownleasing.common.pojo.AddressInfo;
import com.uownleasing.common.pojo.InvoiceInfo;
import com.uownleasing.common.utils.LoggableCreated;
import com.uownleasing.common.utils.LoggableUpdated;
@@ -10,6 +14,7 @@ import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.BeanUtils;

import javax.persistence.Embedded;

@@ -52,6 +57,42 @@ public class SvcEntityListenerTest {
        svcEntityListener = new SvcEntityListener();
    }

    // <<<<<<<<<< START | .getChangeLog() test >>>>>>>>>>

    @Test
    public void shouldFixTicket479() {
        // https://gitlab.com/uown/frontend/servicing/-/issues/479

        // Arrange
        var newState = new AddressInfo();
        var oldState = new AddressInfo();
        oldState.setAddressPk(1L);
        oldState.setCustomerPk(1001L);
        oldState.setAddressType(AddressType.HOME);
        oldState.setStreetAddress1("123 Main St");
        oldState.setStreetAddress2(null);
        oldState.setCity("New York");
        oldState.setState("NY");
        oldState.setZipCode("10001");
        oldState.setZipCode9("10001-1234");
        oldState.setCountry("US");
        oldState.setDoNotContact(false);
        oldState.setDuration(Duration._1_TO_2_YEARS);
        oldState.setAtAddressFrom("2020-01-01");
        oldState.setHousingStatus(HousingStatus.OTHER);
        oldState.setIsAutocompleteVerified(true);
        BeanUtils.copyProperties(oldState, newState, "streetAddress1", "streetAddress2", "state");
        newState.setStreetAddress2("");
        newState.setStreetAddress1("Updated street address");
        newState.setState("CH");

        // Act
        var stringResult = svcEntityListener.getChangeLog(oldState, newState, EntityChangeType.UPDATED);

        // Assert
        assertEquals(stringResult, "[ streetAddress1 changed from 123 Main St to Updated street address ; state changed from NY to CH ]");
    }

    // <<<<<<<<<< START | .getLast4Digits() test >>>>>>>>>>
    @ParameterizedTest
    @CsvSource({

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Quando um usuário edita o endereço de um cliente no Servicing Portal alterando streetAddress1 para "309 E 37th St" e state "NY", o log de auditoria deve exibir claramente ambas as alterações no formato "[ streetAddress1 changed from 309 E 37th Sy to 309 E 37th St  state changed from AK to NY ]" ao invés de "Changed to Undefined"
1. When a user edits a customer's address in the Servicing Portal by changing streetAddress1 to "309 E 37th St" and state to "NY", the audit log must clearly display both changes in the format "[ streetAddress1 changed from 309 E 37th Sy to 309 E 37th St state changed from AK to NY ]" instead of "Changed to Undefined".

2. Quando um usuário no Servicing Portal atualiza apenas streetAddress2 de null para um valor vazio "" e state para "AK", o sistema deve registrar apenas a alteração de state no log ignorando mudanças desnecessárias de null para vazio, exibindo "[ state changed from NY to AK ]"
2. When a user in the Servicing Portal updates only streetAddress2 from null to an empty value "" and state to "AK", the system must log only the state change, ignoring unnecessary changes from null to empty, displaying "[ state changed from NY to AK ]".

3. Quando um usuário no Servicing Portal edita múltiplos campos de endereço (streetAddress1, state, zipCode) simultaneamente, o log deve capturar e exibir todas as alterações separadas por linha e no formato "[ streetAddress1 changed from OLD to NEW
state changed from OLD to NEW
zipCode changed from OLD to NEW ]" e nunca exibir "Undefined"
3. When a user in the Servicing Portal edits multiple address fields (streetAddress1, state, zipCode) simultaneously, the log must capture and display all changes separated by line and formatted as "[ streetAddress1 changed from OLD to NEW
state changed from OLD to NEW
zipCode changed from OLD to NEW ]" and must never display "Undefined".

4. Quando um usuário atualiza um campo de endereço para um valor que já existe ou para null/vazio (mudança desnecessária), o sistema deve detectar essa mudança como desnecessária e não incluir no log de auditoria, mantendo apenas alterações significativas
4. When a user updates an address field to a value that already exists or to null/empty (unnecessary change), the system must detect this as an unnecessary modification and exclude it from the audit log, keeping only meaningful changes.

5. Quando um usuário edita o endereço e salva no Servicing Portal, o novo valor do endereço deve ser corretamente passado do frontend para o mecanismo de logging backend, garantindo que o log mostre o valor real atualizado e não null, undefined, ou vazio
5. When a user edits the address and saves it in the Servicing Portal, the new address value must be correctly passed from the frontend to the backend logging mechanism, ensuring that the log shows the actual updated value and not null, undefined, or empty.

6. Quando múltiplos usuários simultaneamente editam endereços de diferentes clientes no Servicing Portal com alterações em streetAddress1 e state, cada um deve gerar logs independentes exibindo corretamente seus respectivos valores antigos e novos sem misturar dados entre clientes
6. When multiple users simultaneously edit addresses for different customers in the Servicing Portal with changes in streetAddress1 and state, each must generate independent logs that correctly display their respective old and new values without mixing data between customers.





> ## Tests in qa1

> ```gherkin

> **When a user edits a customer's address in the Servicing Portal by changing streetAddress1 to "309 E 37th St" and state to "NY", the audit log must clearly display both changes in the format "[ streetAddress1 changed from 309 E 37th Sy to 309 E 37th St state changed from AK to NY ]" instead of "Changed to Undefined"**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal updates only streetAddress2 from null to an empty value "" and state to "AK", the system must log only the state change, ignoring unnecessary changes from null to empty, displaying "[ state changed from NY to AK ]"**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal edits multiple address fields (streetAddress1, state, zipCode) simultaneously, the log must capture and display all changes separated by line and formatted as "[ streetAddress1 changed from OLD to NEW state changed from OLD to NEW zipCode changed from OLD to NEW ]" and must never display "Undefined"**

> !

> **| PASS |**
> ```

---

When a user updates an address field to a value that already exists or to null/empty (unnecessary change), the system must detect this as an unnecessary modification and exclude it from the audit log, keeping only meaningful changes.
> ```gherkin

> **D**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user edits the address and saves it in the Servicing Portal, the new address value must be correctly passed from the frontend to the backend logging mechanism, ensuring that the log shows the actual updated value and not null, undefined, or empty**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users simultaneously edit addresses for different customers in the Servicing Portal with changes in streetAddress1 and state, each must generate independent logs that correctly display their respective old and new values without mixing data between customers**

> !

> **| PASS |**
> ```

---



https://svc-{{env}}.uownleasing.com/uown/svc/createOrUpdatePrimaryCustomerContactInfo

{
  "accountPk": 4296,
  "leadPk": null,
  "addressList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
      "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "addressInfo": {
        "addressPk": 4276,
        "customerPk": 4276,
        "addressType": "HOME",
        "streetAddress1": "527 Elm Street",
        "streetAddress2": "null",
        "city": "Seattle",
        "state": "TX",
        "zipCode": "98101",
        "zipCode9": "94105-2800",
        "country": "US",
        "housingStatus": null,
        "atAddressFrom": null,
        "duration": null,
        "doNotContact": false,
        "isAutocompleteVerified": false
      }
    }
  ],
  "emailList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "emailInfo": {
        "emailPK": 4276,
        "customerPK": 4276,
        "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
        "emailType": "PRIMARY",
        "doNotEmail": false,
        "reasonForDnc": ""
      }
    }
  ],
  "phoneList": [
    {
      "pk": 7068,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "phoneInfo": {
        "phonePK": 7068,
        "customerPK": 4276,
        "phoneType": "MOBILE",
        "areaCode": "612",
        "phoneNumber": 4884449,
        "phoneExtension": null,
        "doNotCall": false,
        "doNotText": false,
        "lastContactTimestamp": null,
        "reasonForDnc": "",
        "reasonForDnt": ""
      }
    }
  ],
  "leadAddresses": [],
  "leadEmails": [],
  "leadPhones": []
}
{
    "phoneList": [
        {
            "pk": 7068,
            "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
            "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "phoneInfo": {
                "phonePK": 7068,
                "customerPK": 4276,
                "phoneType": "MOBILE",
                "areaCode": "612",
                "phoneNumber": 4884449,
                "phoneExtension": null,
                "doNotCall": false,
                "reasonForDnc": "",
                "doNotText": false,
                "reasonForDnt": "",
                "lastContactTimestamp": null
            }
        }
    ],
    "emailList": [
        {
            "pk": 4276,
            "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
            "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "emailInfo": {
                "emailPK": 4276,
                "customerPK": 4276,
                "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
                "emailType": "PRIMARY",
                "doNotEmail": false,
                "reasonForDnc": ""
            }
        }
    ],
    "addressList": [
        {
            "pk": 4276,
            "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
            "rowUpdatedTimestamp": "2025-11-13T08:36:01.845715024",
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "addressInfo": {
                "addressPk": 4276,
                "customerPk": 4276,
                "addressType": "HOME",
                "streetAddress1": "527 Elm Street",
                "streetAddress2": "null",
                "city": "Seattle",
                "state": "TX",
                "zipCode": "98101",
                "zipCode9": "94105-2800",
                "country": "US",
                "doNotContact": false,
                "duration": null,
                "atAddressFrom": null,
                "housingStatus": null,
                "isAutocompleteVerified": false
            }
        }
    ],
    "accountPk": 4296,
    "leadPhones": [],
    "leadEmails": [],
    "leadAddresses": [],
    "leadPk": null
}
-----

Cenário 1: Alteração de streetAddress1 e state
Teste: Alterando streetAddress1 de "527 Elm Street" para "309 E 37th St" e state de "TX" para "NY" Expectativa do log: [ streetAddress1 changed from 527 Elm Street to 309 E 37th St state changed from TX to NY ]
  {
    "accountPk": 4296,
    "leadPk": null,
    "addressList": [
      {
        "pk": 4276,
        "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
        "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
        "tenantId": null,
        "webUserId": null,
        "agent": null,
        "addressInfo": {
          "addressPk": 4276,
          "customerPk": 4276,
          "addressType": "HOME",
          "streetAddress1": "309 E 37th St",
          "streetAddress2": "null",
          "city": "Seattle",
          "state": "NY",
          "zipCode": "98101",
          "zipCode9": "94105-2800",
          "country": "US",
          "housingStatus": null,
          "atAddressFrom": null,
          "duration": null,
          "doNotContact": false,
          "isAutocompleteVerified": false
        }
      }
    ],
    "emailList": [
      {
        "pk": 4276,
        "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
        "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
        "tenantId": null,
        "webUserId": null,
        "agent": null,
        "emailInfo": {
          "emailPK": 4276,
          "customerPK": 4276,
          "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
          "emailType": "PRIMARY",
          "doNotEmail": false,
          "reasonForDnc": ""
        }
      }
    ],
    "phoneList": [
      {
        "pk": 7068,
        "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
        "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
        "tenantId": null,
        "webUserId": null,
        "agent": null,
        "phoneInfo": {
          "phonePK": 7068,
          "customerPK": 4276,
          "phoneType": "MOBILE",
          "areaCode": "612",
          "phoneNumber": 4884449,
          "phoneExtension": null,
          "doNotCall": false,
          "doNotText": false,
          "lastContactTimestamp": null,
          "reasonForDnc": "",
          "reasonForDnt": ""
        }
      }
    ],
    "leadAddresses": [],
    "leadEmails": [],
    "leadPhones": []
  }

---

Cenário 2: Atualização de streetAddress2 (null para vazio) e state
Teste: Atualizando streetAddress2 de null para "" e state de "NY" para "AK" Expectativa do log: [ state changed from NY to AK ] (deve ignorar mudança de null para vazio) Nota: Execute este cenário APÓS o Cenário 1 para que o state atual seja "NY"
{
  "accountPk": 4296,
  "leadPk": null,
  "addressList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
      "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "addressInfo": {
        "addressPk": 4276,
        "customerPk": 4276,
        "addressType": "HOME",
        "streetAddress1": "309 E 37th St",
        "streetAddress2": "",
        "city": "Seattle",
        "state": "AK",
        "zipCode": "98101",
        "zipCode9": "94105-2800",
        "country": "US",
        "housingStatus": null,
        "atAddressFrom": null,
        "duration": null,
        "doNotContact": false,
        "isAutocompleteVerified": false
      }
    }
  ],
  "emailList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "emailInfo": {
        "emailPK": 4276,
        "customerPK": 4276,
        "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
        "emailType": "PRIMARY",
        "doNotEmail": false,
        "reasonForDnc": ""
      }
    }
  ],
  "phoneList": [
    {
      "pk": 7068,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "phoneInfo": {
        "phonePK": 7068,
        "customerPK": 4276,
        "phoneType": "MOBILE",
        "areaCode": "612",
        "phoneNumber": 4884449,
        "phoneExtension": null,
        "doNotCall": false,
        "doNotText": false,
        "lastContactTimestamp": null,
        "reasonForDnc": "",
        "reasonForDnt": ""
      }
    }
  ],
  "leadAddresses": [],
  "leadEmails": [],
  "leadPhones": []
}

---

Cenário 3: Alteração de múltiplos campos
Teste: Editando streetAddress1, state e zipCode simultaneamente Expectativa do log:
[ streetAddress1 changed from 309 E 37th St to 1234 Broadway Ave
state changed from AK to CA
zipCode changed from 98101 to 90210 ]
Nota: Execute este cenário APÓS o Cenário 2
{
  "accountPk": 4296,
  "leadPk": null,
  "addressList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
      "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "addressInfo": {
        "addressPk": 4276,
        "customerPk": 4276,
        "addressType": "HOME",
        "streetAddress1": "1234 Broadway Ave",
        "streetAddress2": "",
        "city": "Seattle",
        "state": "CA",
        "zipCode": "90210",
        "zipCode9": "94105-2800",
        "country": "US",
        "housingStatus": null,
        "atAddressFrom": null,
        "duration": null,
        "doNotContact": false,
        "isAutocompleteVerified": false
      }
    }
  ],
  "emailList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "emailInfo": {
        "emailPK": 4276,
        "customerPK": 4276,
        "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
        "emailType": "PRIMARY",
        "doNotEmail": false,
        "reasonForDnc": ""
      }
    }
  ],
  "phoneList": [
    {
      "pk": 7068,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "phoneInfo": {
        "phonePK": 7068,
        "customerPK": 4276,
        "phoneType": "MOBILE",
        "areaCode": "612",
        "phoneNumber": 4884449,
        "phoneExtension": null,
        "doNotCall": false,
        "doNotText": false,
        "lastContactTimestamp": null,
        "reasonForDnc": "",
        "reasonForDnt": ""
      }
    }
  ],
  "leadAddresses": [],
  "leadEmails": [],
  "leadPhones": []
}

---

Cenário 4: Mudança desnecessária (valor já existe)
Teste: Enviando o mesmo valor que já existe (sem mudanças reais) Expectativa do log: Nenhum registro de auditoria deve ser criado, pois não há mudanças significativas Nota: Execute este cenário APÓS o Cenário 3 - enviando os mesmos valores
{
  "accountPk": 4296,
  "leadPk": null,
  "addressList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
      "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "addressInfo": {
        "addressPk": 4276,
        "customerPk": 4276,
        "addressType": "HOME",
        "streetAddress1": "1234 Broadway Ave",
        "streetAddress2": "",
        "city": "Seattle",
        "state": "CA",
        "zipCode": "90210",
        "zipCode9": "94105-2800",
        "country": "US",
        "housingStatus": null,
        "atAddressFrom": null,
        "duration": null,
        "doNotContact": false,
        "isAutocompleteVerified": false
      }
    }
  ],
  "emailList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "emailInfo": {
        "emailPK": 4276,
        "customerPK": 4276,
        "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
        "emailType": "PRIMARY",
        "doNotEmail": false,
        "reasonForDnc": ""
      }
    }
  ],
  "phoneList": [
    {
      "pk": 7068,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "phoneInfo": {
        "phonePK": 7068,
        "customerPK": 4276,
        "phoneType": "MOBILE",
        "areaCode": "612",
        "phoneNumber": 4884449,
        "phoneExtension": null,
        "doNotCall": false,
        "doNotText": false,
        "lastContactTimestamp": null,
        "reasonForDnc": "",
        "reasonForDnt": ""
      }
    }
  ],
  "leadAddresses": [],
  "leadEmails": [],
  "leadPhones": []
}

---

Cenário 5: Validação de valor correto passado do frontend para backend
Teste: Alterando city para garantir que o valor correto é persistido e logado Expectativa do log: [ city changed from Seattle to Los Angeles ] (mostrando valor real, não null/undefined)
{
  "accountPk": 4296,
  "leadPk": null,
  "addressList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:51.837969",
      "rowUpdatedTimestamp": "2025-11-13T04:32:03.324401",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "addressInfo": {
        "addressPk": 4276,
        "customerPk": 4276,
        "addressType": "HOME",
        "streetAddress1": "1234 Broadway Ave",
        "streetAddress2": "",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90210",
        "zipCode9": "94105-2800",
        "country": "US",
        "housingStatus": null,
        "atAddressFrom": null,
        "duration": null,
        "doNotContact": false,
        "isAutocompleteVerified": false
      }
    }
  ],
  "emailList": [
    {
      "pk": 4276,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.201706",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243527",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "emailInfo": {
        "emailPK": 4276,
        "customerPK": 4276,
        "emailAddress": "fintechgroup777+1762430790173-2fbiok@gmail.com",
        "emailType": "PRIMARY",
        "doNotEmail": false,
        "reasonForDnc": ""
      }
    }
  ],
  "phoneList": [
    {
      "pk": 7068,
      "rowCreatedTimestamp": "2025-11-06T07:11:52.499891",
      "rowUpdatedTimestamp": "2025-11-13T00:40:17.243508",
      "tenantId": null,
      "webUserId": null,
      "agent": null,
      "phoneInfo": {
        "phonePK": 7068,
        "customerPK": 4276,
        "phoneType": "MOBILE",
        "areaCode": "612",
        "phoneNumber": 4884449,
        "phoneExtension": null,
        "doNotCall": false,
        "doNotText": false,
        "lastContactTimestamp": null,
        "reasonForDnc": "",
        "reasonForDnt": ""
      }
    }
  ],
  "leadAddresses": [],
  "leadEmails": [],
  "leadPhones": []
}

-----

Testes via endpoint uown/svc/createOrUpdatePrimaryCustomerContactInfo

Cenário 1: Alteração de streetAddress1 e state
Teste: Alterando streetAddress1 de "527 Elm Street" para "309 E 37th St" e state de "TX" para "NY" Expectativa do log: [ streetAddress1 changed from 527 Elm Street to 309 E 37th St state changed from TX to NY ]

Cenário 2: Atualização de streetAddress2 (null para vazio) e state
Teste: Atualizando streetAddress2 de null para "" e state de "NY" para "AK" Expectativa do log: [ state changed from NY to AK ] (deve ignorar mudança de null para vazio)

Cenário 3: Alteração de múltiplos campos
Teste: Editando streetAddress1, state e zipCode simultaneamente Expectativa do log:
[ streetAddress1 changed from 309 E 37th St to 1234 Broadway Ave
state changed from AK to CA
zipCode changed from 98101 to 90210 ]

Cenário 4: Mudança desnecessária (valor já existe)
Teste: Enviando o mesmo valor que já existe (sem mudanças reais) Expectativa do log: Nenhum registro de auditoria deve ser criado, pois não há mudanças significativas 
Nota: Execute este cenário APÓS o Cenário 3 - enviando os mesmos valores
---

Tests via endpoint uown/svc/createOrUpdatePrimaryCustomerContactInfo

#### Scenario 1: Change of streetAddress1 and state
Test: Changing streetAddress1 from "527 Elm Street" to "309 E 37th St" and state from "TX" to "NY"
Expected log: [ streetAddress1 changed from 527 Elm Street to 309 E 37th St state changed from TX to NY ]

#### Scenario 2: Update of streetAddress2 (null to empty) and state
Test: Updating streetAddress2 from null to "" and state from "NY" to "AK"
Expected log: [ state changed from NY to AK ] (should ignore null to empty change)

#### Scenario 3: Change of multiple fields
Test: Editing streetAddress1, state, and zipCode simultaneously
Expected log:
[ streetAddress1 changed from 309 E 37th St to 1234 Broadway Ave
state changed from AK to CA
zipCode changed from 98101 to 90210 ]

#### Scenario 4: Unnecessary change (value already exists)
Test: Sending the same value that already exists (no actual changes)
Expected log: No audit record should be created since there are no significant changes
Note: Execute this scenario AFTER Scenario 3 - sending the same values

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG


> ## Tests in qa1

> ```gherkin

> **When a user edits a customer's address in the Servicing Portal by changing streetAddress1 to "309 E 37th St" and state to "NY", the audit log must clearly display both changes in the format "[ streetAddress1 changed from 309 E 37th Sy to 309 E 37th St state changed from AK to NY ]" instead of "Changed to Undefined"**

> ![image](/uploads/df6a312b56694d1c667a23684d7acb41/image.png){width=900 height=211}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal updates only streetAddress2 from null to an empty value "" and state to "AK", the system must log only the state change, ignoring unnecessary changes from null to empty, displaying "[ state changed from NY to AK ]"**

> ![image](/uploads/777fee4ad30743d19bb848591a06da48/image.png){width=900 height=35}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal edits multiple address fields (streetAddress1, state, zipCode) simultaneously, the log must capture and display all changes separated by line and formatted as "[ streetAddress1 changed from OLD to NEW state changed from OLD to NEW zipCode changed from OLD to NEW ]" and must never display "Undefined"**

> ![image](/uploads/678e0fb22ceffdd52d9f61b4c1a3fb59/image.png){width=900 height=309}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user updates an address field to a value that already exists or to null/empty (unnecessary change), the system must detect this as an unnecessary modification and exclude it from the audit log, keeping only meaningful changes**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user edits the address and saves it in the Servicing Portal, the new address value must be correctly passed from the frontend to the backend logging mechanism, ensuring that the log shows the actual updated value and not null, undefined, or empty**

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users simultaneously edit addresses for different customers in the Servicing Portal with changes in streetAddress1 and state, each must generate independent logs that correctly display their respective old and new values without mixing data between customers**

> ![image](/uploads/e44b91c5408b788f44e22681b26c0f39/image.png){width=900 height=308}

> **| PASS |**
> ```

---


#### Tests via endpoint uown/svc/createOrUpdatePrimaryCustomerContactInfo

> ```gherkin

#### Scenario 1: Change of streetAddress1 and state
Test: Changing streetAddress1 from "527 Elm Street" to "309 E 37th St" and state from "TX" to "NY"
Expected log: [ streetAddress1 changed from 527 Elm Street to 309 E 37th St state changed from TX to NY ]

> ![Screenshot_at_Nov_13_10-45-33](/uploads/9674136c9718149438e412fc332f5e1a/Screenshot_at_Nov_13_10-45-33.png){width=900 height=53}

> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 2: Update of streetAddress2 (null to empty) and state
Test: Updating streetAddress2 from null to "" and state from "NY" to "AK"
Expected log: [ state changed from NY to AK ] (should ignore null to empty change)

> ![Screenshot_at_Nov_13_10-46-37](/uploads/7e3bc3e6a85b3c1690aa573f49700e3d/Screenshot_at_Nov_13_10-46-37.png){width=900 height=69}

> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 3: Change of multiple fields
Test: Editing streetAddress1, state, and zipCode simultaneously
Expected log:
[ streetAddress1 changed to 309 E 37th St state changed to CA
zipCode changed to 90210 ]

> ![Screenshot_at_Nov_13_10-47-28](/uploads/98f6117c4984d26e34a076a38509ffe4/Screenshot_at_Nov_13_10-47-28.png){width=900 height=90}
> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 4: Unnecessary change (value already exists)
Test: Sending the same value that already exists (no actual changes)
Expected log: No audit record should be created since there are no significant changes
Note: Execute this scenario AFTER Scenario 3 - sending the same values

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG


> ## Tests in stg

> ```gherkin

> **When a user edits a customer's address in the Servicing Portal by changing streetAddress1 to "309 E 37th St" and state to "NY", the audit log must clearly display both changes in the format "[ streetAddress1 changed from Xpto to 309 E 37th St state changed from Xpto to NY ]" instead of "Changed to Undefined"**

> ![Screenshot_at_Nov_16_13-33-35](/uploads/94f41b4623d41866a0416942e409ac11/Screenshot_at_Nov_16_13-33-35.png){width=900 height=140}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal updates only streetAddress2 from null to an empty value "" and state to "AK", the system must log only the state change, ignoring unnecessary changes from null to empty, displaying "[ state changed from NY to AK ]"**

> ![Screenshot_at_Nov_16_13-35-11](/uploads/dc784a6a739f9e899d1c8880c465adf5/Screenshot_at_Nov_16_13-35-11.png){width=900 height=32}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user in the Servicing Portal edits multiple address fields (streetAddress1, state, zipCode) simultaneously, the log must capture and display all changes separated by line and formatted as "[ streetAddress1 changed from OLD to NEW state changed from OLD to NEW zipCode changed from OLD to NEW ]" and must never display "Undefined"**

> ![Screenshot_at_Nov_16_13-37-02](/uploads/3a1f5aec0136e172e3518ba585bbc2aa/Screenshot_at_Nov_16_13-37-02.png){width=900 height=75}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user updates an address field to a value that already exists or to null/empty (unnecessary change), the system must detect this as an unnecessary modification and exclude it from the audit log, keeping only meaningful changes**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user edits the address and saves it in the Servicing Portal, the new address value must be correctly passed from the frontend to the backend logging mechanism, ensuring that the log shows the actual updated value and not null, undefined, or empty**

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users simultaneously edit addresses for different customers in the Servicing Portal with changes in streetAddress1 and state, each must generate independent logs that correctly display their respective old and new values without mixing data between customers**

> **| PASS |**
> ```

---


#### Tests via endpoint uown/svc/createOrUpdatePrimaryCustomerContactInfo

> ```gherkin

#### Scenario 1: Change of streetAddress1 and state
Test: Changing streetAddress1 from "Xpto" to "1234 Brodway Ave" and state from "Xpto" to "NY"
Expected log: [ streetAddress1 changed from "527 Elm Street from "Xpto" to 309 E 37th St state changed from "Xpto" to NY ]

> ![image](/uploads/333432dcaf37eeea54796ce3ec356ce8/image.png){width=900 height=55}

> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 2: Update of streetAddress2 (null to empty) and state
Test: Updating streetAddress2 from null to "" and state from "NY" to "AK"
Expected log: [ state changed from NY to AK ] (should ignore null to empty change)

> ![Screenshot_at_Nov_16_13-35-11](/uploads/8668cca0a0dfa3259cdefc5fda9eb61d/Screenshot_at_Nov_16_13-35-11.png){width=900 height=32}

> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 3: Change of multiple fields
Test: Editing streetAddress1, state, and zipCode simultaneously
Expected log:
[ streetAddress1 changed from "Xpto" to 1234 Brodway Ave,
city changed from "Xpto" to Los Angeles,
state changed from "CA" to CA,(state CA log for state not generated)
zipCode changed from "Xpto" to 90210,
zipCode9 changed from "" to 94105-2800 ]

> ![Screenshot_at_Nov_16_13-40-51](/uploads/a4df9805041cfb0e991bec73dc4fe9ba/Screenshot_at_Nov_16_13-40-51.png){width=900 height=62}

> **| PASS |**
> ```

---

> ```gherkin

#### Scenario 4: Unnecessary change (value already exists)
Test: Sending the same value that already exists (no actual changes)
Expected log: No audit record should be created since there are no significant changes
Note: Execute this scenario AFTER Scenario 3 - sending the same values

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------