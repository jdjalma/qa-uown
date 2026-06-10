# Tests in qa1

---

## Cenários Validados com Sucesso

> **Massa de teste em qa1:**
> - Lead **11319** (Karen Holdin, SIGNED) - 4 CCs `0002,2224,2225,6909`, SSN `248475193`, email `karengarcia1778758086299@yahoo.com`, invoice `R1925054`, UUID `691336f0-3a4f-4f70-9f51-e223e4e7b36c`
> - Lead **4019** (FUNDED) - **26 CCs ativos** (cenario ouro para dedup)
> - Lead **11735** (Testfnjl Testlnjl, FUNDED) - accountPk `4766`, phone `9457097027`
> - Lead **11339** (Testfndb Testlndb, CONTRACT_CREATED) - accountPk `4524`
> - Lead **12016** (Testfnte Testlnte, FUNDED) - accountPk `4944`, phone `6737795823`, email `fintechgroup777+0750101_734280@gmail.com` (usado nos testes Servicing - resolvido dinamicamente via DB)

### 1 - Duplicações por `lead.pk`


| Lead alvo     | searchType | Input                 | Resultado                                       |
| ------------- | ---------- | --------------------- | ----------------------------------------------- |
| 11319 (4 CCs) | `last4CC`  | `2225`                | **1 row** (cc `2225` selecionado)               |
| 11319 (4 CCs) | `Name`     | `Karen`               | **1 row** (cc `6909` arbitrário via NULLS LAST) |
| 11319 (4 CCs) | `Email`    | `karengarcia…`        | **1 row**                                       |
| 4019 (26 CCs) | `last4CC`  | `0055`                | **1 row**                                       |
| 4019 (26 CCs) | `Name`     | (último nome do lead) | **1 row**                                       |


---

### 2 - Router das 10 SQLs (`SearchService.resolveLosSearchSqlName`)


| Label UI              | `searchType` enviado | SQL acionada                | Validação                                                |
| --------------------- | -------------------- | --------------------------- | -------------------------------------------------------- |
| `Lead #`              | `LeadPk`             | `getLosSearch_ByLeadPk`     | input `11319` → leadPk=11319                             |
| `Servicing Account #` | `AccountPk`          | `getLosSearch_ByAccountPk`  | input `4524` → leadPk=11339                              |
| `Phone`               | `Phone`              | `getLosSearch_ByPhone`      | input `9457097027` → leadPk=11735                        |
| `Email`               | `Email`              | `getLosSearch_ByEmail`      | input `karengarcia…` → leadPk=11319                      |
| `SSN`                 | `SSN`                | `getLosSearch_BySSN`        | input `248475193` → leadPk=11319                         |
| `Invoice #`           | `InvoiceNum`         | `getLosSearch_ByInvoiceNum` | input `R1925054` → 5 leads (invoice não-único em qa1)    |
| `UUID`                | `UUID`               | `getLosSearch_ByUUID`       | input UUID Karen → leadPk=11319                          |
| `Name`                | `Name`               | `getLosSearch_ByName`       | input `Karen` → 9 leads, todos com first/last name=Karen |
| `Last 4 CC`           | `last4CC`            | `getLosSearch_ByLast4CC`    | input `2225` → 15 leads, dedup OK                        |


---

### 3 - Pre-detect quando `searchType` é omitido

`SearchService.resolveLosSearchSqlName(searchType=null, firstWord)` classifica o input por formato antes de cair em FreeText:


| Input                                | Detecção            | SQL chamada                                 |
| ------------------------------------ | ------------------- | ------------------------------------------- |
| `karengarcia1778758086299@yahoo.com` | contém `@`          | `ByEmail` (usa expression index)            |
| `Karen`                              | regex `^[a-zA-Z]+$` | `ByName`                                    |
| `R1925054`                           | alfanumérico misto  | `FreeText` (UNION ALL de 5 branches)        |
| `248475193`                          | 9 dígitos           | `FreeText` (UNION ALL - branch SSN match)   |
| `9457097027`                         | 10 dígitos          | `FreeText` (UNION ALL - branch phone match) |


---

### 4 - Expression index em uso


| SQL                         | Índice esperado                                 | Plan observado             |
| --------------------------- | ----------------------------------------------- | -------------------------- |
| `getLosSearch_ByEmail`      | `idx_los_email_address_upper`                   | **Bitmap Index Scan**      |
| `getLosSearch_ByInvoiceNum` | `idx_los_invoice_merchant_invoice_number_upper` | **Seq Scan** ❌ (ver OBS-2) |
| `getLosSearch_ByLast4CC`    | *(índice não criado)*                           | **Seq Scan** ❌ (ver OBS-3) |


---

### 5 - UI Origination (dropdown do navbar)


| searchType  | Input                       | Comportamento observado                                             |
| ----------- | --------------------------- | ------------------------------------------------------------------- |
| `Lead #`    | `11319`                     | lead Karen aparece, navegação para `/customers/11319` OK            |
| `SSN`       | `248475193`                 | Karen retornada, ordem por `lead.pk DESC`                           |
| `Invoice #` | `R1925054`                  | 5 leads listados (invoice não-único - esperado); top result é Karen |
| `UUID`      | UUID Karen                  | 1 lead exato                                                        |
| `Name`      | `Karen Holdin` (2 palavras) | 9 leads com first=Karen ou last=Holdin                              |
| `Last 4 CC` | `2225`                      | 15 leads, dedup OK                                                  |
| `Phone`     | `9457097027`                | lead 11735 (Testfnjl) retornado                                     |


---

### 6 - UI Servicing (dropdown do navbar)

Regressao cruzada: a MR !1370 refatorou o LOS (1 SQL para 10 SQLs), mas o Servicing consome `/uown/svc/simpleSearch` (endpoint separado). Esta secao valida que o lado Servicing nao regrediu.

> **Diferenca Servicing vs Origination:**
> - Servicing usa **GET** (Origination usa POST)
> - Invoice envia `searchType=InvoiceNumber` (Origination envia `InvoiceNum`)
> - Autocomplete navega para `/customer-information/{accountPk}` (Origination usa `/{leadPk}`)
> - Apenas leads com `account_pk IS NOT NULL` aparecem (leads SIGNED sem funding nao surfam)
> - 2 searchTypes exclusivos: `Ref Account ID` e `Contract #`

**Lead de teste (resolucao dinamica):** lead 12016 (Testfnte Testlnte, FUNDED, accountPk=4944)


| CT        | searchType            | Input                                       | Resultado                                    |
| --------- | --------------------- | ------------------------------------------- | -------------------------------------------- |
| SVC-UI-01 | `Lead #`              | `12016`                                     | accountPk 4944 retornado, dedup OK           |
| SVC-UI-02 | `Servicing Account #` | `4944`                                      | accountPk 4944 retornado, dedup OK           |
| SVC-UI-03 | `Phone`               | `6737795823`                                | accountPk 4944 retornado, dedup OK           |
| SVC-UI-04 | `Email`               | `fintechgroup777+0750101_734280@gmail.com`  | accountPk 4944 retornado, dedup OK           |
| SVC-UI-05 | `SSN`                 | (SSN do lead 12016)                         | accountPk 4944 retornado, dedup OK           |
| SVC-UI-06 | `Invoice #`           | (invoice do lead 12016)                     | accountPk 4944 retornado, param `InvoiceNumber` confirmado, dedup OK |
| SVC-UI-07 | `Name`                | `Testfnte Testlnte`                         | accountPk 4944 retornado, dedup OK           |
| SVC-UI-08 | `Last 4 CC`           | `2225`                                      | 1+ leads retornados, dedup OK                |
| SVC-UI-09 | `Ref Account ID`      | (ref_account_id do account 4944)            | accountPk 4944 retornado, dedup OK           |
| SVC-UI-10 | `Contract #`          | (contract_number do lead 12016)             | accountPk 4944 retornado, dedup OK           |

**Resultado: 10/10 PASS.** Servicing simpleSearch nao regrediu com a refatoracao LOS.


---

## Observações Identificadas


| ID        | Tipo                                                      | Bloqueia release?                      |
| --------- | --------------------------------------------------------- | -------------------------------------- |
| **OBS-1** | Funcional - `createdTimestamp` retorna `null` em FreeText | **SIM** (afeta integrações API)        |
| **OBS-2** | Performance - expression index criado mas não usado       | NÃO, confirmar em prod-like data antes |
| **OBS-3** | Performance - sem índice em `cc_last_four_digit`          | NÃO, gap pré-existente, não regressão  |


---

## OBS-1: createdTimestamp null em getLosSearch_FreeText.sql

**Causa raiz:** O arquivo `getLosSearch_FreeText.sql` utiliza o alias `rowCreatedTime` no primeiro SELECT do UNION, enquanto as demais 9 SQLs utilizam `createdTimestamp`. O ResponseMapper (Jackson) espera o nome e retorna `null` quando a query cai em FreeText.

**Quando dispara:** Chamadas à API sem o parâmetro `searchType` cujo input não casa com os pre-detect routers (`@` para email, regex UUID, alpha-only para nome). Inclui search por SSN, phone, invoice number alfanumérico e lead/account PK numérico.

**Impacto na UI:** Nenhum, a UI sempre envia `searchType` explicitamente. Porém integrações externas, scripts e Postman collections recebem `null` de forma inconsistente.

**Lead de teste:** `leadPk=11319` (Karen Holdin, qa1).

**Reprodução manual** (cole no DevTools console logado em `origination-qa1`):

```js
const headers = { 'Content-Type': 'application/json' };
const body = JSON.stringify({ merchantRefCodes: ['*'] });

// A - com searchType=Name → createdTimestamp populado (caminho ByName.sql)
const a = await (await fetch(
  '/uown/los/simpleSearch/Karen?searchType=Name&pageNumber=1&maxResults=20',
  { method: 'POST', credentials: 'include', headers, body }
)).json();
console.log('A (ByName):', a.searchResults.find(r => r.leadPk === 11319)?.createdTimestamp);
// → "2026-05-14T07:28:07.373"

// B - sem searchType → cai em FreeText.sql → createdTimestamp NULL
const b = await (await fetch(
  '/uown/los/simpleSearch/R1925054?pageNumber=1&maxResults=20',
  { method: 'POST', credentials: 'include', headers, body }
)).json();
console.log('B (FreeText):', b.searchResults.find(r => r.leadPk === 11319)?.createdTimestamp);
// → null  ❌ bug
```

**Fix proposto** (1 linha em `src/main/resources/sqls/getLosSearch_FreeText.sql`):

```diff
-    lead.row_created_timestamp      AS rowCreatedTime,
+    lead.row_created_timestamp      AS createdTimestamp,
```

Os SELECTs subsequentes do UNION ALL herdam o alias do primeiro, então 1 linha basta.

---

## OBS-2: Expression index criado mas não utilizado

**Causa raiz:** O arquivo `getLosSearch_ByInvoiceNum.sql` aplica `UPPER()` apenas no parâmetro (`UPPER(:searchString)`), não na coluna. O Postgres não consegue utilizar o índice de expressão `idx_los_invoice_merchant_invoice_number_upper` e executa Seq Scan.

**Impacto em qa1:** Em produção com volume real, a Seq Scan tende a escalar linearmente

**Reprodução** (psql em qa1):

```sql
-- Versão atual (bugada): Seq Scan
EXPLAIN ANALYZE
SELECT * FROM uown_los_invoice
WHERE merchant_invoice_number = UPPER('R1925054')
LIMIT 5;
-- → Seq Scan on uown_los_invoice

-- Versão corrigida: Bitmap Index Scan
EXPLAIN ANALYZE
SELECT * FROM uown_los_invoice
WHERE UPPER(merchant_invoice_number) = UPPER('R1925054')
LIMIT 5;
-- → Bitmap Index Scan on idx_los_invoice_merchant_invoice_number_upper
```

**Fix proposto** (1 linha em `src/main/resources/sqls/getLosSearch_ByInvoiceNum.sql`):

```diff
-    WHERE invoice.merchant_invoice_number = UPPER(:searchString)
+    WHERE UPPER(invoice.merchant_invoice_number) = UPPER(:searchString)
```

---

## OBS-3: Sem índice em cc_last_four_digit (cleanup)

**Estado atual:** A tabela `uown_los_credit_card` não possui índice em `cc_last_four_digit`, fazendo com que `getLosSearch_ByLast4CC.sql` execute Seq Scan.

**Classificação:** Não é regressão da MR !1370 - esse gap já existia antes. A MR criou expression indexes para email e invoice mas não cobriu `last4CC`. Tratar como melhoria separada.

**Validação manual:**

```sql
EXPLAIN ANALYZE
SELECT lead_pk, cc_last_four_digit FROM uown_los_credit_card
WHERE cc_last_four_digit = '2225';
-- → Seq Scan
```

**Fix proposto** (nova migration):

```sql
CREATE INDEX CONCURRENTLY idx_los_cc_last_four_digit
  ON uown_los_credit_card (cc_last_four_digit);
```

---

