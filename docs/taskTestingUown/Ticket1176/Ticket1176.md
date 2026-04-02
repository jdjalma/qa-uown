--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇺🇸 ENGLISH VERSION

## UOWN | Origination | Add Sales Rep Code and Merchant Support to Config Columns in Overview

### Synopsis

On the **Origination Overview** page, there is a **Config Columns** button located near the **Download CSV** button.
Two new column options must be added:

* **Sales Rep Code**
* **Merchant Support**

These columns must be available on both:

* **Overview page**
* **Merchant page**

Additionally, on the **Origination Overview** page, there is a table with search filters above it.
A new **Merchant Support** search field must be added to:

* The **Overview** filters
* The **Merchant** page filters

---

### Business Objective

Increase user flexibility and customization by allowing additional fields to be displayed in the Overview table and enabling users to filter and locate leads more accurately using the **Merchant Support** field.

---

### Feature Request | Business Requirements

#### Config Columns

* Add the following options to **Config Columns**:

  * Sales Rep Code
  * Merchant Support
* These values must be retrieved from **Merchant** data.
* The **Sales Rep Code** and **Merchant Support** columns added to the **Overview** page must also be added to the **Merchant** page.
* On the **Merchant page**, **Merchant Support** must be a **default column**, not requiring activation via Config Columns.

#### Filters

* Add a **Merchant Support** search field to the filters above the **Overview** table.
* Add a **Merchant Support** search field to the filters on the **Merchant** page.
* The field must behave consistently with existing search filters.
* Merchant Support data must be retrieved from data already stored in the system.
* The Merchant Support field must work the same way it does in the Merchant context, allowing:

  * Selecting one of the displayed dropdown options, and
  * Typing to search using **first name** or **last name**.

---

### Testing Steps

#### 1. Column Display in Table

* Navigate to **Origination → Overview**
* Verify:

  * “Sales Rep Code” column appears immediately after “Merchant Code”
  * “Merchant Support” column appears immediately after “Sales Rep Code”
  * Columns display correct data values
  * Null or empty values are displayed as empty cells (no placeholders or errors)

#### 2. Column Configuration

* Click the **Config Columns** button (gear icon)
* Verify:

  * “Sales Rep Code” checkbox exists and is selectable
  * “Merchant Support” checkbox exists and is selectable
  * Unchecking each option hides the column
  * Rechecking each option restores the column

#### 3. Data Population

* Verify table rows display correct values for:

  * `salesRepCode`
  * `merchantSupport`
* Test with merchants that have null values
* Expected: Empty cells are shown without errors

#### 4. CSV Export

* Click **Download CSV**
* Open the downloaded file
* Verify:

  * “Sales Rep Code” column is present
  * “Merchant Support” column is present
  * CSV values match the values shown in the table

#### 5. Sorting

* Click the **Sales Rep Code** column header
* Expected: Table sorts by Sales Rep Code
* Click the **Merchant Support** column header
* Expected: Table sorts by Merchant Support

#### 6. Merchant Support Filter – Overview Page

* Navigate to **Origination → Overview**
* Click **Filters**
* Verify:

  * Merchant Support filter is displayed as a **text input**
  * Filter supports **case-insensitive partial matching**
* Type a partial value (e.g. `support`, `@example.com`)
* Apply the filter
* Expected: Table updates to show matching leads only
* Clear the filter
* Expected: All leads are displayed again

#### 7. Merchant Support Filter – Merchant Page

* Navigate to **Origination → Merchant**
* Click **Filters**
* Verify:

  * Merchant Support filter is displayed as a **text input**
  * Partial matching works correctly
* Apply and clear the filter
* Expected: Results update accordingly

#### 8. Active Filter Default – Merchant Page

* Navigate to **Origination → Merchant**
* Click **Filters**
* Verify:

  * “Active” filter is selected by default
  * Table initially displays only active merchants
* Change filter to “Inactive”
* Expected: Only inactive merchants are displayed
* Switch back to “Active”
* Expected: Only active merchants are displayed again

---

### API Validation

#### Endpoint 1 – Get Lead Filter Options

**POST** `/uown/los/getLeadFilterOptions`

Expected:

* Response **must NOT** include `merchantSupport`

```json
{
  "clientType": [],
  "merchantRefCodes": [],
  "internalStatus": []
}
```

---

#### Endpoint 2 – Get Leads In Date Range

**POST** `/uown/getLeadsInDateRange`

Expected:

* Response includes `salesRepCode` and `merchantSupport`
* Filters are respected

```json
{
  "data": {
    "leads": [
      {
        "salesRepCode": "REP001",
        "merchantSupport": "support@example.com"
      }
    ],
    "totalCount": 100
  }
}
```

---

#### Endpoint 3 – Get All Merchant Support

**GET** `/uown/los/getAllMerchantSupport`

* **Removed**
* No longer required due to text-based partial search

---

#### Endpoint 4 – Get Merchants By Criteria

**POST** `/uown/getMerchantsByCriteria`

Expected Request:

* `merchantSupport` is a **string**
* Supports **partial matching (LIKE)**

```json
{
  "page_number": 0,
  "max_results": 10,
  "isActive": true,
  "merchantSupport": "support@example.com"
}
```

Expected Response:

* Only merchants matching the filter are returned

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 VERSÃO EM PORTUGUÊS

## UOWN | Origination | Adicionar Sales Rep Code e Merchant Support nas Config Columns do Overview

### Sinopse

Na página **Origination → Overview**, existe o botão **Config Columns**, localizado próximo ao botão **Download CSV**.
Devem ser adicionadas duas novas opções de coluna:

* **Sales Rep Code**
* **Merchant Support**

Essas colunas devem estar disponíveis em:

* **Página Overview**
* **Página Merchant**

Além disso, na página **Overview**, existe uma tabela com filtros de busca acima dela.
Um novo campo de filtro **Merchant Support** deve ser adicionado em:

* **Overview**
* **Merchant Page**

---

### Objetivo de Negócio

Aumentar a flexibilidade e a personalização da interface, permitindo a exibição de novos campos na tabela e possibilitando a filtragem mais precisa de leads por meio do campo **Merchant Support**.

---

### Requisitos de Negócio | Funcionais

#### Configuração de Colunas

* Adicionar às **Config Columns**:

  * Sales Rep Code
  * Merchant Support
* Os valores devem ser obtidos a partir dos dados do **Merchant**.
* As colunas adicionadas no **Overview** também devem existir na **Merchant Page**.
* Na **Merchant Page**, o campo **Merchant Support** deve ser uma **coluna padrão**, sem necessidade de ativação manual.

#### Filtros

* Adicionar um campo de busca **Merchant Support** nos filtros do **Overview**.
* Adicionar o mesmo campo nos filtros da **Merchant Page**.
* O comportamento deve ser consistente com os filtros existentes.
* Os dados devem ser obtidos a partir de informações já armazenadas no sistema.
* O campo deve permitir:

  * Seleção via dropdown, e
  * Busca digitando **nome ou sobrenome** (matching parcial).

---

### Etapas de Teste

#### 1. Exibição das Colunas na Tabela

* Acessar **Origination → Overview**
* Validar:

  * Coluna “Sales Rep Code” aparece após “Merchant Code”
  * Coluna “Merchant Support” aparece após “Sales Rep Code”
  * Valores são exibidos corretamente
  * Valores nulos aparecem como células vazias

#### 2. Configuração de Colunas

* Clicar em **Config Columns**
* Validar:

  * Checkbox de “Sales Rep Code” existe e funciona
  * Checkbox de “Merchant Support” existe e funciona
  * Desmarcar oculta a coluna
  * Marcar novamente exibe a coluna

#### 3. População de Dados

* Validar valores corretos para:

  * `salesRepCode`
  * `merchantSupport`
* Testar merchants com valores nulos
* Resultado esperado: células vazias sem erro

#### 4. Exportação CSV

* Clicar em **Download CSV**
* Abrir o arquivo
* Validar:

  * Ambas as colunas estão presentes
  * Valores correspondem aos exibidos na tabela

#### 5. Ordenação

* Clicar no cabeçalho de **Sales Rep Code**
* Validar ordenação correta
* Clicar no cabeçalho de **Merchant Support**
* Validar ordenação correta

#### 6. Filtro Merchant Support – Overview

* Acessar **Origination → Overview**
* Abrir **Filters**
* Validar:

  * Campo Merchant Support é um **input de texto**
  * Suporta **busca parcial case-insensitive**
* Aplicar e limpar o filtro
* Validar atualização correta da tabela

#### 7. Filtro Merchant Support – Merchant Page

* Acessar **Origination → Merchant**
* Abrir **Filters**
* Validar:

  * Campo Merchant Support presente
  * Busca parcial funciona corretamente

#### 8. Filtro Active Padrão – Merchant Page

* Acessar **Origination → Merchant**
* Abrir **Filters**
* Validar:

  * Filtro “Active” vem selecionado por padrão
  * Alternar entre Active / Inactive atualiza a tabela corretamente

---

### Validação de API

#### Endpoint 1 – Get Lead Filter Options

**POST** `/uown/los/getLeadFilterOptions`

Esperado:

* Campo `merchantSupport` **não deve existir** na resposta

---

#### Endpoint 2 – Get Leads In Date Range

**POST** `/uown/getLeadsInDateRange`

Esperado:

* Resposta contém `salesRepCode` e `merchantSupport`
* Filtros são respeitados

---

#### Endpoint 3 – Get All Merchant Support

**GET** `/uown/los/getAllMerchantSupport`

* **Removido**
* Não é mais necessário

---

#### Endpoint 4 – Get Merchants By Criteria

**POST** `/uown/getMerchantsByCriteria`

Esperado:

* `merchantSupport` é uma **string**
* Suporta busca parcial (**LIKE**)

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

Comparar
e
 9 arquivos
+
66
−
5
Arquivos
9
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

overvi
‎ew.tsx‎
+1 -0

mod
‎els‎

filter-cr
‎iteria.ts‎
+1 -0

lead-filte
‎r-object.ts‎
+1 -0

leads-in-da
‎te-range.ts‎
+2 -0

pa
‎ges‎

merc
‎hant‎

inde
‎x.tsx‎
+14 -2

over
‎view‎

inde
‎x.tsx‎
+9 -2

ut
‎ils‎

merchant-t
‎able-config‎

inde
‎x.tsx‎
+16 -0

overview-t
‎able-config‎

inde
‎x.tsx‎
+9 -0

data-table-
‎columns.tsx‎
+13 -1

 domain/stores/overview.tsx 
+
1
−
0

Visualizado
@@ -35,6 +35,7 @@ export interface SearchPage {
  search: string;
  clientTypes: Array<Options | string>;
  internalStatus?: string;
  merchantSupport?: string;
}

export type OverviewStatsLoaders = {
 models/filter-criteria.ts 
+
1
−
0

Visualizado
@@ -12,4 +12,5 @@ export interface FilterCriteria {
  rebateType?: string;
  merchantName?: string;
  salesRepCode?: string;
  merchantSupport?: string;
}
 models/lead-filter-object.ts 
+
1
−
0

Visualizado
@@ -13,4 +13,5 @@ export interface LeadFilterObject {
  filterLeads?: LeadsInDateRangeRequestType[];
  filterClientType?: Array<Options | string>;
  filterInternalStatus?: string;
  filterMerchantSupport?: string;
}
 models/leads-in-date-range.ts 
+
2
−
0

Visualizado
@@ -5,6 +5,8 @@ export interface LeadsInDateRangeRequestType extends TableRow {
  uuid: string;
  merchantName: string;
  merchantReferenceCode: string;
  salesRepCode?: string;
  merchantSupport?: string;
  leadStatus: string;
  firstName: string;
  lastName: string;
 pages/merchant/index.tsx 
+
14
−
2

Visualizado
@@ -69,6 +69,7 @@ const MerchantPage = (props: MerchantProps) => {
      inventory_categories: formik?.values?.merchantCategories,
      isActive: isActive,
      salesRepCode: merchantStore?.filterCriteria.salesRepCode || '',
      merchantSupport: formik?.values?.merchantSupport?.trim() || undefined,
    });
    const csvMerchants = merchantStore?.csvMerchants || [];
    if (csvMerchants) {
@@ -174,7 +175,7 @@ const MerchantPage = (props: MerchantProps) => {
      ? 'Active'
      : merchantStore?.filterCriteria?.isActive?.toString() === 'false'
      ? 'Inactive'
      : null;
      : 'Active';
  const formik = useFormik({
    initialValues: {
      ...merchantStore?.defaultConfigColumns,
@@ -183,6 +184,7 @@ const MerchantPage = (props: MerchantProps) => {
      search: merchantStore?.filterCriteria?.search || '',
      isActive: isActiveValue,
      salesRepCode: merchantStore?.filterCriteria?.salesRepCode || '',
      merchantSupport: merchantStore?.filterCriteria?.merchantSupport || '',
    },
    onSubmit: async (values) => {
      const isActive =
@@ -200,6 +202,7 @@ const MerchantPage = (props: MerchantProps) => {
        inventory_categories: values?.merchantCategories,
        isActive: isActive,
        salesRepCode: values?.salesRepCode,
        merchantSupport: values?.merchantSupport?.trim() || undefined,
      });

      setAllMerchantsData(merchantStore?.adminMerchants);
@@ -226,8 +229,13 @@ const MerchantPage = (props: MerchantProps) => {
        forCSV: false,
        inventory_categories:
          merchantStore?.filterCriteria?.inventory_categories || [],
        isActive: merchantStore?.filterCriteria?.isActive,
        isActive:
          merchantStore?.filterCriteria?.isActive !== undefined
            ? merchantStore?.filterCriteria?.isActive
            : true,
        salesRepCode: merchantStore?.filterCriteria?.salesRepCode || '',
        merchantSupport:
          merchantStore?.filterCriteria?.merchantSupport || undefined,
      }),
    );
    // Fulfills all promises and sets the main table data.
@@ -294,6 +302,8 @@ const MerchantPage = (props: MerchantProps) => {
        inventory_categories: [],
        isActive: isActive,
        salesRepCode: merchantStore?.filterCriteria?.salesRepCode || '',
        merchantSupport:
          merchantStore?.filterCriteria?.merchantSupport || undefined,
      });
      setTotalRows(merchantStore?.filterCriteria?.totalRows || 10);
      setAllMerchantsData(merchantStore?.adminMerchants);
@@ -312,6 +322,8 @@ const MerchantPage = (props: MerchantProps) => {
      inventory_categories: [],
      isActive: merchantStore?.filterCriteria?.isActive,
      salesRepCode: merchantStore?.filterCriteria?.salesRepCode || '',
      merchantSupport:
        merchantStore?.filterCriteria?.merchantSupport || undefined,
    });
    setAllMerchantsData(merchantStore?.adminMerchants);
    setTotalRows(newPerPage);

---


Abrir o tópico 1
Comparar
e
 8 arquivos
+
38
−
8
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

db/rep
‎ository‎

Merchant
‎Repo.java‎
+2 -0

po
‎jo‎

re
‎st‎

LeadFilt
‎ers.java‎
+1 -0

LeadSumm
‎ary.java‎
+2 -0

MerchantSear
‎chFilter.java‎
+4 -0

rest
‎/los‎

LosLeadCont
‎roller.java‎
+5 -1

ser
‎vice‎

Application
‎Service.java‎
+1 -0

MerchantSe
‎rvice.java‎
+20 -7

resourc
‎es/sqls‎

getLeadSumma
‎ryResults.sql‎
+3 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantRepo.java 
+
2
−
0

Visualizado
@@ -126,6 +126,7 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long> {
        "                                       OR LOWER(m.merchantInfo.primaryContactName) LIKE :search )" +
        "              AND (m.merchantInfo.isDeleted IS NULL OR (m.merchantInfo.isDeleted IS NOT NULL AND m.merchantInfo.isDeleted IS FALSE))" +
        "              AND (:salesRepCode IS NULL OR :salesRepCode = '' OR (m.merchantInfo.salesRepCode IS NOT NULL AND LOWER(m.merchantInfo.salesRepCode) = LOWER(:salesRepCode)))" +
        "              AND ((:merchantSupport IS NULL) OR (m.merchantInfo.merchantSupport IS NOT NULL AND CAST(m.merchantInfo.merchantSupport AS string) LIKE :merchantSupport))" +
        "              ORDER BY m.merchantInfo.refMerchantCode ASC")
    Page<Merchant> getMerchantsByCriteria(@Param("inventoryCategories") List<String> inventoryCategories,
                                          @Param("merchantName") String merchantName,
@@ -136,6 +137,7 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long> {
                                          @Param("isActive") Boolean isActive,
                                          @Param("rebateType") DealerRebateType rebateType,
                                          @Param("salesRepCode") String salesRepCode,
                                          @Param("merchantSupport") String merchantSupport,
                                          Pageable page);

    Merchant findByMerchantInfo_refMerchantCodeIgnoreCaseAndMerchantInfo_UsernameIgnoreCaseAndMerchantInfo_ApiKey(String refMerchantCode, String username, String apiKey);
 src/main/java/com/uownleasing/svc/pojo/rest/LeadFilters.java 
+
1
−
0

Visualizado
@@ -25,6 +25,7 @@ public class LeadFilters {
    private List<String> clientTypes;
    private String internalStatus;
    private List<String> merchantRefCodes;
    private String merchantSupport;


    public LeadFilters sanitize() {
 src/main/java/com/uownleasing/svc/pojo/rest/LeadSummary.java 
+
2
−
0

Visualizado
@@ -21,6 +21,8 @@ public class LeadSummary {
    private String merchantName;
    private String locationName;
    private String merchantReferenceCode;
    private String salesRepCode;
    private String merchantSupport;
    private LeadStatus leadStatus;
    private LeadStatus internalStatus;
    private String firstName;
 src/main/java/com/uownleasing/svc/pojo/MerchantSearchFilter.java 
+
4
−
0

Visualizado
@@ -56,5 +56,9 @@ public class MerchantSearchFilter {
    @JsonAlias("salesRepCode")
    private String salesRepCode;

    @JsonProperty("merchant_support")
    @JsonAlias("merchantSupport")
    private String merchantSupport;

    private List<String> merchantRefCodes;
}
 src/main/java/com/uownleasing/svc/rest/los/LosLeadController.java 
+
5
−
1

Visualizado
@@ -305,7 +305,11 @@ public class LosLeadController {
        List<ClientType> clientType = merchantService.getAllClientTypes();
        List<BasicMerchantInfo> merchantInfos = merchantService.getBasicMerchantInfoByRefCode(merchantRefCodes.getOrDefault(MERCHANT_REF_CODES, null));
        List<LeadStatus> internalStatuses = leadService.getAllInternalStatuses();
        return new HashMap<>(Map.of("clientType", clientType, MERCHANT_REF_CODES, merchantInfos, "internalStatus", internalStatuses));
        Map<String, Object> result = new HashMap<>();
        result.put("clientType", clientType);
        result.put(MERCHANT_REF_CODES, merchantInfos);
        result.put("internalStatus", internalStatuses);
        return result;
    }

    @GetMapping(value = "/getAllMerchantNames")
 src/main/java/com/uownleasing/svc/service/ApplicationService.java 
+
1
−
0

Visualizado
@@ -205,6 +205,7 @@ public class ApplicationService {
            .replaceAll("(?i):status", filters.getStatus() == null ? "null" : "'" + filters.getStatus().name() + "'")
            .replaceAll("(?i):merchantNames", CollectionUtils.isEmpty(filters.getMerchants()) ? "(null)" : ("('" + StringUtils.join(filters.getMerchants(), "','") + "')"))
            .replaceAll("(?i):location", CollectionUtils.isEmpty(filters.getLocations()) ? "(null)" : ("('" + StringUtils.join(filters.getLocations(), "','") + "')"))
            .replaceAll("(?i):merchantSupport", StringUtils.isBlank(filters.getMerchantSupport()) ? "null" : "'%" + filters.getMerchantSupport().toLowerCase().trim().replace("'", "''") + "%'")
            .replaceAll("(?i):search", StringUtils.isBlank(filters.getSearch()) ? "null" : "'%" + filters.getSearch().toLowerCase().trim() + "%'")
            .replaceAll("(?i):clientTypes", CollectionUtils.isEmpty(filters.getClientTypes()) ? "null" : ("'" + StringUtils.join(filters.getClientTypes(), ",") + "'"))
            .replaceAll("(?i):internalStatus", filters.getInternalStatus() == null ? "null" : "'" + filters.getInternalStatus() + "'")

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Abaixo está a **lista numerada de requisitos de teste**, **extraídos objetivamente** da **tarefa funcional** e das **alterações de desenvolvimento (frontend + backend)**.
Os requisitos estão **testáveis**, **não redundantes** e organizados para **QA manual (UI + API)**.


## 🇧🇷 PORTUGUÊS — REQUISITOS DE TESTE

### A. Overview & Merchant – Colunas

**RT-01**
O menu **Config Columns** da página Origination Overview deve conter a opção **Sales Rep Code**.

**RT-02**
O menu **Config Columns** da página Origination Overview deve conter a opção **Merchant Support**.

**RT-03**
Quando habilitada, a coluna **Sales Rep Code** deve aparecer imediatamente após **Merchant Code** na tabela do Overview.

**RT-04**
Quando habilitada, a coluna **Merchant Support** deve aparecer imediatamente após **Sales Rep Code** na tabela do Overview.

**RT-05**
As colunas **Sales Rep Code** e **Merchant Support** também devem existir na tabela da **Merchant Page**.

**RT-06**
Na **Merchant Page**, **Merchant Support** deve ser uma **coluna padrão**, sem necessidade de ativação via Config Columns.

**RT-07**
Ativar e desativar **Sales Rep Code** ou **Merchant Support** deve ocultar/exibir a coluna corretamente, sem erros.

**RT-08**
Quando os dados do merchant forem **nulos ou vazios**, a tabela deve exibir **células vazias**, sem erro ou placeholder.

---

### B. População e Consistência de Dados

**RT-09**
A coluna **Sales Rep Code** deve exibir o valor de **merchant.salesRepCode**.

**RT-10**
A coluna **Merchant Support** deve exibir o valor de **merchant.merchantSupport**.

**RT-11**
Os valores exibidos na UI devem corresponder exatamente aos retornados pela API.

---

### D. Exportação CSV

**RT-14**
O arquivo CSV exportado deve conter a coluna **Sales Rep Code**.

**RT-15**
O arquivo CSV exportado deve conter a coluna **Merchant Support**.

**RT-16**
Os valores do CSV devem corresponder aos valores exibidos na tabela.

---

### E. Filtros do Overview – Merchant Support

**RT-17**
Os filtros do Overview devem conter o campo **Merchant Support**.

**RT-18**
O filtro **Merchant Support** do Overview deve ser um **campo de texto**, não dropdown.

**RT-19**
O filtro deve suportar **busca parcial case-insensitive**.

**RT-20**
Aplicar o filtro deve restringir os leads corretamente.

**RT-21**
Limpar o filtro deve restaurar todos os resultados.

---

### F. Filtros da Merchant Page – Merchant Support - **ERROR** merchant com info merchant support salva nao é exibido

**RT-22**
Os filtros da Merchant Page devem conter o campo **Merchant Support**.

**RT-23**
O filtro deve permitir **busca parcial via texto**.

**RT-24**
Aplicar o filtro deve atualizar corretamente os resultados.

---

### G. Filtro Active Padrão (Regressão)

**RT-25**
O filtro **Active** deve vir selecionado por padrão na Merchant Page.

**RT-26**
Alternar entre **Active** e **Inactive** deve atualizar corretamente a tabela.

---

### H. API – Filtros de Leads

**RT-28**
O endpoint **POST `/uown/getLeadsInDateRange`** deve retornar `salesRepCode` e `merchantSupport`.

**RT-27**
O endpoint **POST `/uown/los/getLeadFilterOptions`** não deve retornar `merchantSupport`.

---

### I. API – Busca de Merchants

**RT-30**
O endpoint **POST `/uown/getMerchantsByCriteria`** deve aceitar `merchantSupport` como **string**.

**RT-31**
O filtro `merchantSupport` deve suportar busca parcial case-insensitive.

**RT-32**
A resposta deve conter apenas merchants compatíveis com o filtro aplicado.

---

-------------------------------------------------------------------------------------------------

> ## Tests in qa1

> ```gherkin

> **O menu Config Columns da página Origination Overview deve conter a opção Sales Rep Code.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O menu Config Columns da página Origination Overview deve conter a opção Merchant Support.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Quando habilitada, a coluna Sales Rep Code deve aparecer imediatamente após Merchant Code na tabela do Overview.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Quando habilitada, a coluna Merchant Support deve aparecer imediatamente após Sales Rep Code na tabela do Overview.**

> !

> **| PASS |**
> ```

> ```gherkin

> **As colunas Sales Rep Code e Merchant Support também devem existir na tabela da Merchant Page.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Na Merchant Page, Merchant Support deve ser uma coluna padrão, sem necessidade de ativação via Config Columns.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Ativar e desativar Sales Rep Code ou Merchant Support deve ocultar e exibir a coluna corretamente, sem erros.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Quando os dados do merchant forem nulos ou vazios, a tabela deve exibir células vazias, sem erro ou placeholder.**

> !

> **| PASS |**
> ```

> ```gherkin

> **A coluna Sales Rep Code deve exibir o valor de merchant.salesRepCode.**

> !

> **| PASS |**
> ```

> ```gherkin

> **A coluna Merchant Support deve exibir o valor de merchant.merchantSupport.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Os valores exibidos na UI devem corresponder exatamente aos retornados pela API.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O arquivo CSV exportado deve conter a coluna Sales Rep Code.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O arquivo CSV exportado deve conter a coluna Merchant Support.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Os valores do CSV devem corresponder aos valores exibidos na tabela.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Os filtros do Overview devem conter o campo Merchant Support.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O filtro Merchant Support do Overview deve ser um campo de texto, não um dropdown.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O filtro deve suportar busca parcial case-insensitive.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Aplicar o filtro deve restringir os leads corretamente.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Limpar o filtro deve restaurar todos os resultados.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Os filtros da Merchant Page devem conter o campo Merchant Support.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O filtro deve permitir busca parcial via texto.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Aplicar o filtro deve atualizar corretamente os resultados.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O filtro Active deve vir selecionado por padrão na Merchant Page.**

> !

> **| PASS |**
> ```

> ```gherkin

> **Alternar entre Active e Inactive deve atualizar corretamente a tabela.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O endpoint POST /uown/getLeadsInDateRange deve retornar salesRepCode e merchantSupport.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O endpoint POST /uown/los/getLeadFilterOptions não deve retornar merchantSupport.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O endpoint POST /uown/getMerchantsByCriteria deve aceitar merchantSupport como string.**

> !

> **| PASS |**
> ```

> ```gherkin

> **O filtro merchantSupport deve suportar busca parcial case-insensitive.**

> !

> **| PASS |**
> ```

> ```gherkin

> **A resposta deve conter apenas merchants compatíveis com o filtro aplicado.**

> !

> **| PASS |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

---

> ```gherkin 

> **The Config Columns menu on the Origination Overview page must contain the Sales Rep Code option.**

> ![Screenshot_at_Dec_21_04-35-31](/uploads/cc9d62e5e6e30ed8ef2bfa78aba37557/Screenshot_at_Dec_21_04-35-31.png){width=900 height=446}
> ![Screenshot_at_Dec_21_04-36-05](/uploads/23b461407eeb18106a54dc0ca5e2f94a/Screenshot_at_Dec_21_04-36-05.png){width=900 height=391}

> **| PASS |**
> ```

---

> ```gherkin 

> **The Config Columns menu on the Origination Overview page must contain the Merchant Support option.**

> ![Screenshot_at_Dec_21_04-35-31](/uploads/4e4635f1074d418274656a40f1a1933b/Screenshot_at_Dec_21_04-35-31.png){width=900 height=446}
> ![Screenshot_at_Dec_21_04-35-50](/uploads/1e0eaa2a35a4d96bbbec84aec9738826/Screenshot_at_Dec_21_04-35-50.png){width=900 height=380}
> ![Screenshot_at_Dec_21_04-36-46](/uploads/b186f82e89cb0ad7f2336eea296ded20/Screenshot_at_Dec_21_04-36-46.png){width=900 height=383}

> **| PASS |**
> ```

---

> ```gherkin 

> **When enabled, the Sales Rep Code column must appear immediately after Merchant Code in the Overview table.**

> ![Screenshot_at_Dec_21_04-35-50](/uploads/a9435489a8f1c8a48b6b0be1ac1d8666/Screenshot_at_Dec_21_04-35-50.png){width=900 height=380}
> ![Screenshot_at_Dec_21_04-36-05](/uploads/860dc730944152c8e8d605f9c223d9eb/Screenshot_at_Dec_21_04-36-05.png){width=900 height=391}

> **| PASS |**
> ```

---

> ```gherkin 

> **When enabled, the Merchant Support column must appear immediately after Sales Rep Code in the Overview table.**

> ![Screenshot_at_Dec_21_04-36-05](/uploads/c2ac65ee85feb26a2c92f58d6e572c2e/Screenshot_at_Dec_21_04-36-05.png){width=900 height=391}
> ![Screenshot_at_Dec_21_04-35-50](/uploads/1f863aa9ee5d665b3c5e4a713379caf8/Screenshot_at_Dec_21_04-35-50.png){width=900 height=380}

> **| PASS |**
> ```

---

> ```gherkin 

> **The Sales Rep Code and Merchant Support columns must also exist in the Merchant Page table.**

> ![Screenshot_at_Dec_21_04-41-28](/uploads/c520f6e751a0da1a325804862657b131/Screenshot_at_Dec_21_04-41-28.png){width=900 height=363}
> ![Screenshot_at_Dec_21_04-42-10](/uploads/d885ae67ba3d5a9e8bc726f437391200/Screenshot_at_Dec_21_04-42-10.png){width=900 height=61}

> **| PASS |**
> ```

---

> ```gherkin 

> **On the Merchant Page, Merchant Support must be a default column, with no need to enable it via Config Columns.**

> ![image](/uploads/9b31d57838b6bd3c514c7e1018789449/image.png){width=760 height=600}
> ![image](/uploads/180f12fdebe0270e02d4ddbd3ec84b1d/image.png){width=900 height=539}

> **| PASS |**
> ```

---

> ```gherkin 

> **Enabling and disabling Sales Rep Code or Merchant Support must correctly hide and display the column, without errors.**

> ![Screenshot_at_Dec_21_04-41-28](/uploads/58e494f5b93d4a554a8a60c1fa9f56ea/Screenshot_at_Dec_21_04-41-28.png){width=900 height=363}
> ![Screenshot_at_Dec_21_04-41-49](/uploads/976c3451d12c9fd82c86604a67075a37/Screenshot_at_Dec_21_04-41-49.png){width=900 height=362}
> ![Screenshot_at_Dec_21_04-42-10](/uploads/13c564f5050c990e01f67b9e0febff12/Screenshot_at_Dec_21_04-42-10.png){width=900 height=61}
> ![Screenshot_at_Dec_21_04-42-31](/uploads/98d5bd9a8ce9f044aa05c8e682a291ed/Screenshot_at_Dec_21_04-42-31.png){width=432 height=462}
> ![Screenshot_at_Dec_21_04-42-46](/uploads/9fe471d9269a4540c35bf6c47ba3d3d4/Screenshot_at_Dec_21_04-42-46.png){width=900 height=252}

> **| PASS |**
> ```

---

> ```gherkin 

> **When merchant data is null or empty, the table must display empty cells, without errors or placeholders.**

> **| PASS |**
> ```

---

> ```gherkin 

> **The Sales Rep Code column must display the value of merchant.salesRepCode.**

> ![Screenshot_at_Dec_21_04-38-25](/uploads/b97f91bd1afb1604a270c75e80b9095f/Screenshot_at_Dec_21_04-38-25.png){width=900 height=411}
> ![Screenshot_at_Dec_21_04-39-12](/uploads/ff7b9dbad8e6329d5035445fc6c0ec0a/Screenshot_at_Dec_21_04-39-12.png){width=900 height=396}
> ![Screenshot_at_Dec_21_04-41-28](/uploads/c510ed51995ac76006e6a5aa39a4ef00/Screenshot_at_Dec_21_04-41-28.png){width=900 height=363}


> **| PASS |**
> ```

---

> ```gherkin 

> **The Merchant Support column must display the value of merchant.merchantSupport.**

> ![Screenshot_at_Dec_21_04-39-43](/uploads/1abf1026233ab9fbce4027e3c488407d/Screenshot_at_Dec_21_04-39-43.png){width=519 height=125}
> ![Screenshot_at_Dec_21_04-40-10](/uploads/dee87565a02a31a9a0e5c3dba3af5870/Screenshot_at_Dec_21_04-40-10.png){width=900 height=362}
> ![Screenshot_at_Dec_21_04-42-10](/uploads/e03cc269718cb46a8c0eb3fbc1331faa/Screenshot_at_Dec_21_04-42-10.png){width=900 height=61}

> **| PASS |**
> ```

---

> ```gherkin 

> **The values displayed in the UI must exactly match those returned by the API.**

> ![Screenshot_at_Dec_21_04-57-23](/uploads/bce8d9bb3955aeb6344e0eb8fe173e76/Screenshot_at_Dec_21_04-57-23.png){width=900 height=432}

> **| PASS |**
> ```

---

> ```gherkin 

> **The exported CSV file must contain the Sales Rep Code column.**

> ![Screenshot_at_Dec_21_04-55-05](/uploads/78f74f079b24c455d1027d3d5073bf64/Screenshot_at_Dec_21_04-55-05.png){width=804 height=600}
> ![Screenshot_at_Dec_21_04-56-01](/uploads/979324ed6b5e4023ad86f180ae8c2cc8/Screenshot_at_Dec_21_04-56-01.png){width=900 height=22}

> **| PASS |**
> ```

---

> ```gherkin 

> **The exported CSV file must contain the Merchant Support column.**

> ![Screenshot_at_Dec_21_04-56-01](/uploads/728e6251497efb03c9ceedd94a6071b3/Screenshot_at_Dec_21_04-56-01.png){width=900 height=22}

> **| PASS |**
> ```

---

> ```gherkin 

> **The CSV values must match the values displayed in the table.**

> **| PASS |**
> ```

---

> ```gherkin 

> **The Overview filters must contain the Merchant Support field.**

> ![Screenshot_at_Dec_21_05-02-21](/uploads/c6ac5b2e6e572dfa648ec64973b338a7/Screenshot_at_Dec_21_05-02-21.png){width=790 height=600}

> **| PASS |**
> ```

---

> ```gherkin 

> **The Merchant Support filter on the Overview must be a text field, not a dropdown.**

> ![Screenshot_at_Dec_21_05-03-38](/uploads/cc437c59f0227f8c632b8956a21335d4/Screenshot_at_Dec_21_05-03-38.png){width=788 height=600}

> **| PASS |**
> ```

---

> ```gherkin 

> **The filter must support partial, case-insensitive search.**

> ![Screenshot_at_Dec_21_04-57-23](/uploads/9f0b13d50c7fa55aaf8fce71c78ae50a/Screenshot_at_Dec_21_04-57-23.png){width=900 height=432}
> ![Screenshot_at_Dec_21_05-02-21](/uploads/96f901d842df5f69150c9baca9324ec6/Screenshot_at_Dec_21_05-02-21.png){width=790 height=600}

> ```

---

> ```gherkin 

> **Applying the filter must correctly restrict the leads.**

> **| PASS |**
> ```

---

> ```gherkin 

> **Clearing the filter must restore all results.**

> ![Screenshot_at_Dec_21_05-03-38](/uploads/cd4287764594ad415f452ff927119eae/Screenshot_at_Dec_21_05-03-38.png){width=788 height=600}

> **| PASS |**
> ```

---

> ```gherkin 

> **The Merchant Page filters must contain the Merchant Support field.**

> **| PASS |**
> ```

---

> ```gherkin 

> **The filter must allow partial text search.**


> ![Screenshot_at_Dec_21_05-05-44](/uploads/2b2149e0117151c0fb1fd57fc66f10d1/Screenshot_at_Dec_21_05-05-44.png){width=783 height=600}
> ![Screenshot_at_Dec_21_05-08-12](/uploads/3a5e85b9ad5d6970c788485dcb936e28/Screenshot_at_Dec_21_05-08-12.png){width=900 height=445}
> ![Screenshot_at_Dec_21_05-09-00](/uploads/1246097b8bc65ef3cc85c24458fc5189/Screenshot_at_Dec_21_05-09-00.png){width=900 height=386}

> **The merchant support search filter does not return results when performing case-sensitive and partial searches.**

> **| ERROR |**
> ```

---

> ```gherkin 

> **Applying the filter must correctly update the results.**

> 

> **| WIP |**
> ```

---

> ```gherkin 

> **The Active filter must be selected by default on the Merchant Page.**

> ![image](/uploads/04cd27488ec7e0182d4589e822d4d1e1/image.png){width=900 height=588}
> ![image](/uploads/e63d4c00e2bc6761487d41e5504e0530/image.png){width=900 height=464}

> **| PASS |**
> ```

---

> ```gherkin 

> **Switching between Active and Inactive must correctly update the table.**

> **| PASS |**
> ```

---

> ```gherkin 

> **The POST /uown/getLeadsInDateRange endpoint must return salesRepCode and merchantSupport.**

> ![Screenshot_at_Dec_21_05-15-29](/uploads/2663bc7434df71a9ced6522dc5f71ad0/Screenshot_at_Dec_21_05-15-29.png){width=581 height=328}

> **| PASS |**
> ```

---

> ```gherkin 

> **The POST /uown/los/getLeadFilterOptions endpoint must not return merchantSupport.**

> ![Screenshot_at_Dec_21_05-17-03](/uploads/b6fb58785b7f0e72f447b89ae8eeda3f/Screenshot_at_Dec_21_05-17-03.png){width=861 height=396}

> **| PASS |**
> ```

---

> ```gherkin 

> **The POST /uown/getMerchantsByCriteria endpoint must accept merchantSupport as a string.**

> **| PASS |**
> ```

---

> ```gherkin 

> **The response must contain only merchants compatible with the applied filter.**

> **| PASS |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
