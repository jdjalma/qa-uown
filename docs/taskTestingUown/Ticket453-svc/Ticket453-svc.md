---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/453

UOWN | SVC | Add New Client Type BIG_HORN_GOLF with Integration Type: API

Synopsis

Add a new client_type named BIG_HORN_GOLF. This new client_type must have its Integration Type set to API.
Business Objective

Adding the new BIG_HORN_GOLF client_type ensures proper configuration and identification within the platform, guaranteeing that its integration follows the API model. This supports correct technical and operational alignment from initial setup.
Feature Request | Business Requirements



        
      Add a new client_type with the value:

BIG_HORN_GOLF



        
      Set the Integration Type for this client_type as:

API



        
      Ensure the new client_type is available according to the system’s existing configuration and usage standards.

Testing Steps
Create Merchant with BIG_HORN_GOLF
Test creating a new merchant with BIG_HORN_GOLF client type:
Create a merchant via POST /createOrUpdateMerchant:

{
  "refMerchantCode": "TEST_BHG",
  "merchantName": "Test Big Horn Golf",
  "clientType": "BIG_HORN_GOLF",
  "integrationType": "API"
}


Verify the merchant was saved correctly:

SELECT ref_merchant_code, client_type, integration_type, username, api_key, client_url, peak_campaign_id, off_peak_campaign_id
FROM uown_merchant
WHERE ref_merchant_code = 'TEST_BHG';


Expected values:

client_type = 'BIG_HORN_GOLF'
integration_type = 'API'
username = 'bigHornGolf'
api_key = 'U0wn_bigHornGolf_B8hG2m'
client_url = 'https://www.bighorngolfer.com/'
peak_campaign_id = 142
off_peak_campaign_id = 142


Do the same process via UI, in the merchant page, and confirm that the new client type appears in the modal, and the default values are being set correctly

---------------------------------------------------------------------------------------------------------------------------------------------------------

Traducao portugues:

Aqui está a tarefa traduzida para português:

---

**Título:** UOWN | SVC | Adicionar novo client_type BIG_HORN_GOLF com Integration Type: API

**Sinopse**
Adicionar um novo `client_type` chamado **BIG_HORN_GOLF**. Esse `client_type` deve ter o `Integration Type` definido como **API**.

**Objetivo de Negócio**
Adicionar o novo `client_type` **BIG_HORN_GOLF** garante configuração e identificação corretas na plataforma, assegurando que sua integração siga o modelo **API**. Isso mantém alinhamento técnico e operacional desde a configuração inicial.

**Requisitos da Funcionalidade / Regras de Negócio**
1) Adicionar um novo `client_type` com o valor: `BIG_HORN_GOLF`.
2) Definir o `Integration Type` para esse `client_type` como: `API`.
3) Garantir que o novo `client_type` esteja disponível conforme os padrões existentes de configuração e uso do sistema.

**Passos de Teste**
1) Criar Merchant com `BIG_HORN_GOLF` via API  
   - Endpoint: `POST /createOrUpdateMerchant`  
   - Payload:
   ```json
   {
     "refMerchantCode": "TEST_BHG",
     "merchantName": "Test Big Horn Golf",
     "clientType": "BIG_HORN_GOLF",
     "integrationType": "API"
   }
   ```
2) Verificar se o merchant foi salvo corretamente:
   ```sql
   SELECT ref_merchant_code, client_type, integration_type, username, api_key, client_url, peak_campaign_id, off_peak_campaign_id
   FROM uown_merchant
   WHERE ref_merchant_code = 'TEST_BHG';
   ```
   Valores esperados:
   - `client_type = 'BIG_HORN_GOLF'`
   - `integration_type = 'API'`
   - `username = 'bigHornGolf'`
   - `api_key = 'U0wn_bigHornGolf_B8hG2m'`
   - `client_url = 'https://www.bighorngolfer.com/'`
   - `peak_campaign_id = 142`
   - `off_peak_campaign_id = 142`

3) Repetir o processo pela UI na página de merchant: confirmar que o novo client type aparece no modal e que os valores padrão estão sendo definidos corretamente.

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

src/main/java/com/uownleasing/svc/enumeration/ClientType.java
package com.uownleasing.svc.enumeration;

import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.svc.uownClient.*;
import lombok.*;
import org.apache.commons.lang3.*;

@Getter
public enum ClientType {
    RWS("rws", "rws", "U0wn_rws_22Ojvo", "https://www.retailerwebservices.com", 151, 151, RWSClient.class)
    , PAY_TOMORROW("payTomorrow","payTomorrow", "U0wn_payTomorrow", "https://www.paytomorrow.com", 151, 152, PayTomorrowClient.class)
    , PAY_TOMORROW_FRASER("payTomorrow","payTomorrow", "U0wn_payTomorrow", "http://www.uownleasing.com", 156, 156, PayTomorrowClient.class)
    , TIRE_AGENT("tireAgent","tireAgent", "U0wn_tireAgent_G4eDIH", "https://www.tireagent.com", 137, 150, TireAgentClient.class)
    , TERRACE_FINANCE("terraceFinance","terraceFinance", "U0wn_terraceFinance_xJ9z4p", "https://www.terracefinance.com", 151, 152, TerraceFinanceClient.class)
    , STORIS("storis", "storis", "U0wn_storis_QhZg1b", "https://www.storis.com", 142, 142, StorisClient.class)
    , V1_UOWN("v1UOwn", "v1UOwn", "U0wn_v1", "https://uownleasing.com", 0, 0, PayTomorrowClient.class)
    , WE_GET_FINANCING("weGetFinancing", "weGetFinancing", "U0wn_weGetFinancing_Lkk1zr", "https://www.wegetfinancing.com", 142, 142, WeGetFinancingClient.class)
    , FIRST_APP("firstApp", "firstApp", SystemConfigurationManagement.isProduction() ? "U0wn_firstApp_Bcdwax" : "U0wn_firstApp_p9XBbZ", "https://www.paytomorrow.com", 142, 142, FirstAppClient.class)
    , DANIELS_JEWELERS("danielsJewelers", "danielsJewelers", "U0wn_danielsJewelers_CnRKhJ", "https://www.danielsjewelers.com", 159, 159, DanielsJewelersClient.class)
    , SASLOW_JEWELERS("saslowJewelers", "saslowJewelers", "U0wn_saslowJewelers_fGoj3p", "https://www.saslowshenebrys.com", 157, 157, SaslowJewelersClient.class)
    , EPC_VIP("epcVip", "epcVip", "U0wn_epcVip_gHkr4V", "https://www.epcvip.com/", 142, 142, PayTomorrowClient.class)
    , FORM_PIPER("formPiper", "formPiper", "U0wn_formPiper_k5eX5N", "https://formpiper.com/", 142, 142, PayTomorrowClient.class)
    , FLEXX_BUY("flexxBuy", "flexxBuy", "U0wn_flexxBuy_mrMw9k", "https://flexxbuy.com/", 142, 142, PayTomorrowClient.class)
    , RTB_SHOPPER("rtbShopper", "rtbShopper", "U0wn_rtbShopper_4eQF5j", "https://www.rtbshopper.com/", 142, 142, PayTomorrowClient.class)
    , TIRE_BROS("tireBros", "tireBros", "U0wn_tireBros_3i9yHb", "https://www.tirebros.com/", 142, 142, PayTomorrowClient.class)
    , JEWELRY("uownJewellers", "jewellers", "U0wn_jewellers_pUBgmZ", "https://uownleasing.com", 160, 160, SaslowJewelersClient.class)
    , VERACITY("veracity", "veracity", "U0wn_veracity_nTBhut", "https://www.iamveracity.com/", 142, 142, PayTomorrowClient.class)
    , BRIDGE("bridge", "bridge", "U0wn_bridge_V3idXD", "", 142, 142, PayTomorrowClient.class)
    , EVERLY("everly", "everly", "U0wn_everly_O7Kp0c", "https://www.everly.market/", 142, 142, PayTomorrowClient.class)
    , LEND_PRO("lendPro", "lendPro", "U0wn_lendpro_1NdNLk", "https://lendpro.com/", 142, 142, PayTomorrowClient.class)
    , SWEET_PAY("sweetPay", "sweetPay", "U0wn_sweetPay_uOAMKJ", "https://sweetpay.com/", 142, 142, PayTomorrowClient.class)
    , WATSCO("watsco", "watsco", "U0wn_watsco_e6Grnm", "https://watsco.com/", 142, 142, PayTomorrowClient.class)
    , _360_FINANCE("360Finance", "360Finance", "U0wn_360Finance_Gfh01T", "https://quinstreet.com/", 142, 142, PayTomorrowClient.class)
    , MY_EYE_MED("myEyeMed", "myEyeMed", "U0wn_myEyeMed_kvqDNh", "https://myeyemed.com/", 164, 164, PayTomorrowClient.class)
    , CHOICE_PAY("choicePay", "choicePay", "U0wn_choicePay_ESkP1j", "https://choicepayments.com/", 164, 164, PayTomorrowClient.class)
    , PAY_POSSIBLE("payPossible","payPossible", "U0wn_payPossible_eSOZdN", "https://www.paypossible.com/", 151, 152, PayTomorrowClient.class)
    , SYNCHRONY("synchrony", "synchrony", "U0wn_synchrony_Sc359I", "https://www.synchrony.com/", 151, 152, PayTomorrowClient.class)
    , BUY_ON_TRUST("buyOnTrust", "buyOnTrust", "U0wn_buyOnTrust_7UcdHY", "https://buyontrust.com/", 151, 152, PayTomorrowClient.class)
    , SKEPS("skeps", "skeps", "U0wn_skeps_Wv0qji", "https://www.skeps.com/", 142, 142, PayTomorrowClient.class)
    , CONECTA_MOBILE("conectaMobile", "conectaMobile", "U0wn_conectaMobile_PIRjYM", "https://conectamobile.com/", 170, 170, PayTomorrowClient.class)
    , KORNERSTONE("kornerstone", "kornerstone", "U0wn_kornerstone_4aZ9Xb", "https://kornerstoneliving.com/", 170, 170, PayTomorrowClient.class)
    , BIG_HORN_GOLF("bigHornGolf", "bigHornGolf", "U0wn_bigHornGolf_B8hG2m", "https://www.bighorngolfer.com/", 142, 142, PayTomorrowClient.class)
    , OTHER("","", "", "", 0, 0, PayTomorrowClient.class);

    private String username;

    private String clientName;

    private String apiKey;

    private String clientUrl;

    private Integer peakCampaignId;

    private Integer offPeakCampaignId;

    private Class client;

    ClientType(String username, String clientName, String apiKey, String clientUrl, Integer peakCampaignId, Integer offPeakCampaignId, Class clientClass) {
        this.username = username;
        this.clientName = clientName;
        this.apiKey = apiKey;
        this.clientUrl = clientUrl;
        this.peakCampaignId = peakCampaignId;
        this.offPeakCampaignId = offPeakCampaignId;
        this.client = clientClass;
    }

    /*
137 Tires Peak
141-146 Core Furniture
149 Shed
150 Tires Off Peak
151 Pay Tomorrow Peak
152 Pay Tomorrow Off Peak
153 Electro Peak
154 Electro Off Peak
155 Pricebusters
156 Frasier Auto
*/

    public static void main(String args[]){
//        KeyGenerator keyGen = null;
//        try {
//            keyGen = KeyGenerator.getInstance("AES");
//        } catch (NoSuchAlgorithmException e) {
//            e.printStackTrace();
//        }
//        keyGen.init(128);
//        SecretKey secretKey = keyGen.generateKey();
//        System.out.println("SecretKey : "+secretKey);
//        byte[] encoded = secretKey.getEncoded();
//        System.out.println(DatatypeConverter.printHexBinary(encoded).toLowerCase());
        System.out.println(RandomStringUtils.randomAlphanumeric(6));

    }

}


---------------------------------------------------------------------------------------------------------------------------------------------------------

Cenarios de teste:


---
### Scenario: 1 — Criar merchant via API com BIG_HORN_GOLF e persistência correta
```markdown
- Given que existe o endpoint POST /createOrUpdateMerchant
- And que o payload inclui clientType "BIG_HORN_GOLF" e integrationType "API"
- When a requisição é enviada com os dados do merchant
- Then o merchant é criado com client_type "BIG_HORN_GOLF" e integration_type "API"
- And os campos username, api_key, client_url, peak_campaign_id e off_peak_campaign_id são salvos com os valores padrão esperados

Examples:
| refMerchantCode | merchantName        | clientType     | integrationType | username     | api_key                  | client_url                         | peak_campaign_id | off_peak_campaign_id |
| --------------- | ------------------- | -------------- | --------------- | ------------ | ------------------------ | ---------------------------------- | ---------------- | -------------------- |
| TEST_BHG        | Test Big Horn Golf  | BIG_HORN_GOLF  | API             | bigHornGolf  | U0wn_bigHornGolf_B8hG2m  | https://www.bighorngolfer.com/     | 142              | 142                  |

| Campo              | Valor Esperado            |
|--------------------|---------------------------|
| ref_merchant_code  | BHG                  |
| client_type        | BIG_HORN_GOLF             |
| integration_type   | API                       |
| username           | bigHornGolf               |
| api_key            | U0wn_bigHornGolf_B8hG2m   |
| client_url         | https://www.bighorngolfer.com/ |
| peak_campaign_id   | 142                       |
| off_peak_campaign_id | 142                     |
```

**PASS**

---
### Scenario: 2 — UI exibe BIG_HORN_GOLF e aplica valores padrão no modal de merchant
```markdown
- Given que o modal de criação/edição de merchant é aberto na UI
- And a lista de client types é carregada
- When o usuário seleciona o client type "BIG_HORN_GOLF"
- Then o client type "BIG_HORN_GOLF" aparece disponível para seleção
- And os campos integrationType, username, api_key, client_url, peak_campaign_id e off_peak_campaign_id são preenchidos com os valores padrão correspondentes

Examples:
| clientType    | integrationType esperado | username esperado | api_key esperado             | client_url esperado                  | peak_campaign_id | off_peak_campaign_id |
| ------------- | ------------------------ | ----------------- | ---------------------------- | ------------------------------------ | ---------------- | -------------------- |
| BIG_HORN_GOLF | API                      | bigHornGolf       | U0wn_bigHornGolf_B8hG2m      | https://www.bighorngolfer.com/       | 142              | 142                  |
```

**PASS**

---
### Scenario: 3 — Criar aplicação para merchant BIG_HORN_GOLF via secure- mantendo integração API
```markdown
- Given que existe um merchant ativo com clientType "BIG_HORN_GOLF" e integrationType "API"
- And que o endpoint de criação de aplicação está disponível
- When uma aplicação é criada via API para esse merchant
- Then a aplicação é associada ao merchant "BIG_HORN_GOLF"
- And os campos clientType e integrationType da aplicação permanecem "BIG_HORN_GOLF" e "API", respectivamente
```

| LeadPk |
|------- |
| 94473  |

**PASS**

---
### Scenario: 4 — Criar aplicação para merchant BIG_HORN_GOLF via apply- exibindo valores padrão corretos
```markdown
- Given que o merchant "BIG_HORN_GOLF" está ativo e visível na UI
- And o modal de criação de aplicação é aberto para esse merchant
- When a aplicação é submetida via UI
- Then a aplicação é criada e associada ao merchant "BIG_HORN_GOLF"
```

| LeadPk |
|------- |
| 94474  |

**PASS**

---
---------------------------------------------------------------------------------------------------------------------------------------------------------

Comentario gitlab:


## Tests in sandbox

---
### Scenario: 1: — Create merchant via API with BIG_HORN_GOLF and correct persistence
```markdown
- Given the endpoint POST /createOrUpdateMerchant exists
- And the payload includes clientType "BIG_HORN_GOLF" and integrationType "API"
- When the request is sent with the merchant data
- Then the merchant is created with client_type "BIG_HORN_GOLF" and integration_type "API"
- And the fields username, api_key, client_url, peak_campaign_id, and off_peak_campaign_id are saved with the expected default values

Examples:
| refMerchantCode | merchantName       | clientType    | integrationType | username    | api_key                 | client_url                       | peak_campaign_id | off_peak_campaign_id |
| --------------- | ------------------ | ------------- | --------------- | ----------- | ----------------------- | -------------------------------- | ---------------- | -------------------- |
| BHG        | Big Horn Golf | BIG_HORN_GOLF | API             | bigHornGolf | U0wn_bigHornGolf_B8hG2m | https://www.bighorngolfer.com/   | 142              | 142                  |
```
![image](/uploads/5c6ed2081823571fbcdfea315b73cf6d/image.png){width=900 height=467}

**PASS**

---
### 2 — UI displays BIG_HORN_GOLF and applies default values in the merchant modal
```markdown
- Given the merchant creation/edit modal is opened in the UI
- And the client types list is loaded
- When the user selects the client type "BIG_HORN_GOLF"
- Then the client type "BIG_HORN_GOLF" appears available for selection
- And the fields integrationType, username, api_key, client_url, peak_campaign_id, and off_peak_campaign_id are populated with the corresponding default values

Examples:
| clientType    | expected integrationType | expected username | expected api_key            | expected client_url               | peak_campaign_id | off_peak_campaign_id |
| ------------- | ------------------------ | ----------------- | --------------------------- | --------------------------------- | ---------------- | -------------------- |
| BIG_HORN_GOLF | API                      | bigHornGolf       | U0wn_bigHornGolf_B8hG2m     | https://www.bighorngolfer.com/    | 142              | 142                  |
```

**PASS**

---
### Scenario: 3 — Create application for BIG_HORN_GOLF merchant via API maintaining API integration
```markdown
- Given an active merchant exists with clientType "BIG_HORN_GOLF" and integrationType "API"
- And the application creation endpoint is available
- When an application is created via API for this merchant
- Then the application is associated with the merchant "BIG_HORN_GOLF"
- And the application's clientType and integrationType fields remain "BIG_HORN_GOLF" and "API", respectively
```

![image](/uploads/b23211779ca8c583a73355b92727a704/image.png){width=900 height=472}

| leadPk |
| ------ |
| 94473  |

**PASS**

---
### Scenario: 4 — Create application for BIG_HORN_GOLF merchant via UI displaying correct default values
```markdown
- Given the merchant "BIG_HORN_GOLF" is active and visible in the UI
- And the application creation modal is opened for this merchant
- When the application is submitted via UI
- Then the application is created and associated with the merchant "BIG_HORN_GOLF"
- And the application's clientType and integrationType fields remain "BIG_HORN_GOLF" and "API", respectively
```

| leadPk |
| ------ |
| 94474  |

**PASS**

---
---------------------------------------------------------------------------------------------------------------------------------------------------------
