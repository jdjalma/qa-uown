# Tests in qa1

---

## Critérios de aceite — status


| AC    | Descrição                                                                                                                                                    | Status       | Evidência                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| AC-1  | AMS Merchants page consome `GET /uown/merchants` (POST legacy ausente)                                                                                       | ✅ CONFIRMADO | Network qa1: `GET /uown/merchants?page=0&size=10&search=&isActive=true → 200`                                         |
| AC-2  | Endpoint suporta `search`/`isActive`/`page`/`size`/`sort`; retorna `Page<BasicMerchantInfo>`                                                                 | ✅ CONFIRMADO | Envelope Spring validado (totalElements=1124)                                                                         |
| AC-3  | `search` case-insensitive em 6 colunas (refMerchantCode, merchantName, locationName, legalName, zipCode, primaryContactName); `city`/`state` NÃO pesquisados | ✅ CONFIRMADO | Synchrony (city=Tampa) NÃO retorna em `search=Tampa`; matches positivos em `synchrony`, `5348121`, `hawaii`, `ks3015` |
| AC-4  | `isActive` tri-state (true/false/omit); `is_deleted=true` excluídos                                                                                          | ✅ CONFIRMADO | `isActive=true` → 1124, `isActive=false` → 3795, omitido → ambos                                                      |
| AC-5  | Default sort `refMerchantCode ASC`                                                                                                                           | ✅ CONFIRMADO | Ordering response observado                                                                                           |
| AC-7  | `/uown/los/getAllAvailableMerchants` removido; novo path em AmsController                                                                                    | ✅ CONFIRMADO | Network: novo path → 200                                                                                              |
| AC-8  | Add User modal lazy-load: zero chamadas no page load; 1 chamada ao abrir modal                                                                               | ✅ CONFIRMADO | Network logs                                                                                                          |
| AC-10 | `POST /uown/getMerchantsByCriteria` legado continua para Origination; sem `includeLastLogin` no filter; sem enrichment de `lastAccessTime`                   | ✅ CONFIRMADO | Origination `/merchant`: POST 200, body sem `includeLastLogin`, response com `lastAccessTime: null`                   |


---

## Cenários validados


| Cenário                                                         | Modo         | Status | Notas                                                                                                                                                                      |
| --------------------------------------------------------------- | ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 — AMS Merchants consome novo endpoint                        | Automatizado | ✅ PASS | Core flow validado                                                                                                                                                         |
| S2 — Search positivo (merchantName, merchantCode, locationName) | Automatizado | ✅ PASS | Case-insensitive confirmado                                                                                                                                                |
| S2b — Negativa: city/state não pesquisados                      | Automatizado | ✅ PASS | Synchrony exclusion holds                                                                                                                                                  |
| S3 — Active tri-state UI toggle                                 | Manual (UI)  | ✅ PASS | 3 estados validados via UI qa1: `isActive=true` (1124) / `isActive=false` (3795) / omitido (4919). Automação UI do widget custom em hold (test-defect F-003, não bloqueia) |
| S8 — Users page lazy-load                                       | Automatizado | ✅ PASS | Modal open dispara 1 call                                                                                                                                                  |


**Resultado: 5/5 cenários P1 verdes** (4 automatizados + 1 manual). Todos os 8 ACs em escopo CONFIRMADOS.

---

## Evidência da troca de endpoint — comparação de payloads

Conforme test instruction de Marcos:

> *"The endpoint getMerchantByCriteria was used on AMS in the merchants page, it returned all the merchant fields alongside a lastAccess information. That endpoint was replaced with a new endpoint that return only a few used field."*

Capturado live em qa1 (2026-05-22) para o mesmo merchant `Synchrony` (pk=7049).

### Endpoint ANTIGO — `POST /uown/getMerchantsByCriteria` (ainda em uso por Origination `/merchant`)


| Métrica                                    | Valor                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total de campos por merchant no response   | **~85 campos** (Merchant completo + nested `merchantInfo` + `bankAccountInfo`)                                                                                         |
| Tamanho aproximado do payload (1 merchant) | ~3 KB                                                                                                                                                                  |
| Inclui dados sensíveis?                    | Sim — `apiKey`, `fedTaxId`, `peakCampaignId`, `dealerDiscountOverride`, configurações de fraude (`useSentilink`, `useNeustar`, `useLexisNexis`), credenciais bancárias |


Snippet real (truncado, exatamente como retornou em qa1):

```json
{
  "pk": 7049,
  "rowCreatedTimestamp": "2024-11-01T14:10:46.1453",
  "rowUpdatedTimestamp": "2026-03-18T14:51:47.121628",
  "tenantId": null,
  "webUserId": null,
  "agent": "jmendes.gow",
  "merchantInfo": {
    "merchantPK": 7049, "refMerchantCode": "5348121040114389",
    "merchantName": "Synchrony", "locationName": "Synchrony", "legalName": "Synchrony",
    "locationAddress1": "10312 Dale Ave", "city": "Tampa", "state": "FL", "zipCode": "33592",
    "merchantUrl": "https://www.synchrony.com/", "category": null,
    "salesRepCode": "", "referralPartner": "",
    "username": "synchrony", "apiKey": "U0wn_synchrony_Sc359I",
    "peakCampaignId": 151, "offPeakCampaignId": 152,
    "clientType": "SYNCHRONY", "integrationType": "HYBRID",
    "inventoryCategory": "OTHER",
    "bankAccountInfo": { "merchantPK": 7049, "name": null, "city": null, ... },
    "primaryContactName": "gfdgd", "primaryContactPhone": "4576547657",
    "primaryContactEmail": "fdsfs@g.c",
    "ownershipType": "OTHER", "ownerName": null,
    "numDaysApprovalExp": 60, "numDaysLeaseDocExp": 0,
    "dealerDiscountOverride": 0.05, "dealerRebateOverride": 0.025,
    "platformFee": 0.02, "platFormFeeType": "MONTHLY",
    "validStates": "AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MS,MO,MT,NE,NV,NH,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VA,WA,WV,WI,WY",
    "defaultLoanAmount": 1500, "minimumLeaseAmount": 250,
    "chargeProcessingFee": true, "chargeProcessingFeeBeforeEsign": true,
    "allowRemoteSign": true, "esignClient": "SIGNWELL", "esignMode": "EMBEDDED",
    "isCcRequired": true, "isAchRequired": true, "isFpdRequired": false,
    "isFraudCheckRequired": false, "useSentilink": false, "useNeustar": false, "useLexisNexis": false,
    "verifyEmail": false, "verifyPhone": false, "verifyIp": false,
    "lendingCategoryList": "LTO", "isActive": true, "isDeleted": false,
    /* ... mais 40+ campos ... */
  },
  "isNew": false,
  "lastAccessTime": null
}
```

### Endpoint NOVO — `GET /uown/merchants` (usado pelo AMS Merchants page após este MR)


| Métrica                                    | Valor                                    |
| ------------------------------------------ | ---------------------------------------- |
| Total de campos por merchant no response   | **12 campos**                            |
| Tamanho aproximado do payload (1 merchant) | ~0.3 KB                                  |
| Inclui dados sensíveis?                    | Não — só dados de identificação + status |


Snippet real (qa1, mesmo merchant Synchrony):

```json
{
  "merchantPk": 7049,
  "rowCreatedTimestamp": "2024-11-01T14:10:46.1453",
  "rowUpdatedTimestamp": "2026-03-18T14:51:47.121628",
  "merchantName": "Synchrony",
  "merchantLocation": "Synchrony",
  "merchantCode": "5348121040114389",
  "acceptsNewApps": true,
  "clientType": "SYNCHRONY",
  "state": "FL",
  "city": "Tampa",
  "isActive": true,
  "lastAccessTime": null
}
```

### Side-by-side resumido


| Aspecto                                    | Antigo (`POST /uown/getMerchantsByCriteria`)                                                                  | Novo (`GET /uown/merchants`)                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Method + Path                              | `POST` `/uown/getMerchantsByCriteria`                                                                         | `GET` `/uown/merchants`                                                                            |
| Body / Query params                        | Body JSON (`MerchantSearchFilter`)                                                                            | Query string (`search`, `isActive`, `page`, `size`, `sort`)                                        |
| Campos retornados por merchant             | ~85 (Merchant completo + merchantInfo + bankAccountInfo)                                                      | 12 (`BasicMerchantInfo` slim)                                                                      |
| Inclui `apiKey`, `fedTaxId`, fraud config? | ✅ Sim — exposição desnecessária pra UI de listagem                                                            | ❌ Não — princípio de mínimo necessário                                                             |
| Pagination envelope                        | `{merchants:[], totalCount, moreResults}` (custom)                                                            | Spring `Page<>` padrão (`content`, `totalElements`, `totalPages`, `pageable`, `sort`)              |
| `lastAccessTime`                           | Disponível via flag `includeLastLogin=true` (flag agora REMOVIDA do filter)                                   | Sempre incluído no payload (sem flag)                                                              |
| Search columns                             | Várias (via `MerchantSearchFilter`: search, salesRepCode, merchantNames, locationNames, inventory_categories) | Exatamente 6 (refMerchantCode, merchantName, locationName, legalName, zipCode, primaryContactName) |
| Filtro Active                              | Campo `isActive` no body                                                                                      | Query param `isActive` (tri-state)                                                                 |


