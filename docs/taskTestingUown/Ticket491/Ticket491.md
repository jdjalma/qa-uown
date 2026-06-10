----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

```markdown

# 🇺🇸 English

## Original Text (kept exactly as provided)

UOWN | Servicing | Add company filter to Accounts Search and remove clickable RefAccount for Kornerstone accs  
Aberto  
  Tíquete criado 4 dias atrás por Yuri Araujo  

### Synopsis
A Company filter must be added to the Servicing Accounts Search page, the Company must be displayed in search results (eg.: UOWN / Kornerstone), and the Ref Account link must be removed for Kornerstone accounts on search results.

### Business Objective
Enable filtering by Company, improve visibility by showing the Company field in results, and prevent invalid navigation for Kornerstone accounts that do not have a related lead.

### Feature Request | Business Requirements
Add Company filter  
Add a Company filter on the Accounts Search page.  

2. Display Company in results  
The Company must appear in the Accounts Search results list.  

3. Remove Ref Account hyperlink for Kornerstone  
For accounts where Company = Kornerstone, the Ref Account must not be clickable.  

### Attachment(s)
Screenshot-1  
image.png  

Screenshot-2  
Insert / Attach related screenshots  

### Steps-to-Reproduce
List the steps required to verify the implemented feature  

### Atributos
**Status**  
To do  

**Responsáveis**  
avatar  
Fernando Martins  

**Etiquetas**  
dev  
full-stack  
priority  
high  
type  
business request  
workflow  
staging-in-process  

**Principal**  
Uown | RU11.25.1.47.0  

**Peso**  
Nenhum  

**Marco**  
Uown | RU12.25.1.47.0  

**Iteração**  
Nenhum  

**Datas**  
Iniciar: Nenhum  

Vencimento: Nenhum  

**Rastreamento de tempo**  
Adicione uma  ou o .  

**3 participantes**  
Fernando Martins  
Sowjanya Kaligineedi  
Yuri Araujo  

### Itens secundários
0  

Nenhum item filho está atribuído no momento. Use itens filhos para dividir o trabalho em partes menores.  

### Itens vinculados
0  

Vincule itens para mostrar que eles estão relacionados ou que um está bloqueando outros.  

### Desenvolvimento
3  

[uown/frontend/servicing#491] - Add get Companies Method  
svc  
!1193  
Mesclado  
Fernando Martins  

[uown/frontend/servicing#491] - Add Companies Search Field in Account Filter  
!647  
Mesclado  
Fernando Martins  

[uown/frontend/servicing#491] - Get Companies Method Added  
svc-common  
!112  
Fechado  
Fernando Martins  

### Atividade
Yuri Araujo set status to To do 4 dias atrás  
Yuri Araujo added uown#13 as parent epic 4 dias atrás  
Yuri Araujo changed milestone to %Uown | RU12.25.1.47.0 4 dias atrás  
Yuri Araujo added  
dev  
full-stack  

priority  
high  

type  
business request  
 labels 4 dias atrás  

Yuri Araujo assigned to @fernandogmartins 4 dias atrás  
Fernando Martins added  
workflow  
development-in-process  
 label 4 dias atrás  

Fernando Martins mentioned in merge request !647 (merged) 4 dias atrás  
Fernando Martins mentioned in merge request uown/backend/svc!1193 (merged) 4 dias atrás  
Fernando Martins mentioned in merge request uown/backend/svc-common!112 (closed) 4 dias atrás  

Fernando Martins added  
workflow  
code-review-pending  
 label and removed  
workflow  
development-in-process  
 label 4 dias atrás  

Fernando Martins added  
workflow  
development-in-process  
 label and removed  
workflow  
code-review-pending  
 label 1 dia atrás  

Fernando Martins added  
workflow  
code-review-pending  
 label and removed  
workflow  
development-in-process  
 label 1 dia atrás  

Fernando Martins  
Fernando Martins  
@fernandogmartins  
1 dia atrás  
Maintainer  

### Testing Steps

#### Overview
Test the Company filter dropdown and search functionality in the Servicing search page, including the Company column display and conditional Ref Account link removal for KORNERSTONE accounts.

image  

1. Company Filter Dropdown  
Navigate to Servicing → Search page  
Click Filters button  
Locate Company filter field  

Expected: Dropdown displays "KORNERSTONE" and "UOWN" options (sorted alphabetically)  
Click on Company dropdown  
Expected: Dropdown is searchable - type to filter options  
Select a company value  
Click Search  
Expected: Results filtered to show only accounts matching selected company  

2. Company Column Display  
Perform a search (with or without company filter)  
Expected: "Company" column appears in search results table  
Expected: Company values display correctly for each account row  
Verify column is sortable  

3. Ref Account Link - KORNERSTONE Accounts  
Search for accounts with company = KORNERSTONE  
Locate "Ref Account" column in results  
Expected: Ref Account values display as plain text (no hyperlink) for KORNERSTONE accounts  

Search for accounts with company = UOWN  
Expected: Ref Account values display as clickable hyperlinks for UOWN accounts  

4. Filter Combinations  
Apply Company filter along with other filters (SSN, Email, etc.)  
Expected: All filters work together correctly  
Verify pagination works with Company filter applied  
Verify CSV export includes Company column  

### API Testing

**Endpoint**  
GET /uown/svc/getDistinctCompanies  

**Expected Response**  
["KORNERSTONE", "UOWN"]  


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 Português

## Texto Original (mantido sem alterações)

UOWN | Servicing | Add company filter to Accounts Search and remove clickable RefAccount for Kornerstone accs  
Aberto  
  Tíquete criado 4 dias atrás por Yuri Araujo  

### Synopsis
A Company filter must be added to the Servicing Accounts Search page, the Company must be displayed in search results (eg.: UOWN / Kornerstone), and the Ref Account link must be removed for Kornerstone accounts on search results.

### Business Objective
Enable filtering by Company, improve visibility by showing the Company field in results, and prevent invalid navigation for Kornerstone accounts that do not have a related lead.

### Feature Request | Business Requirements
Add Company filter  
Add a Company filter on the Accounts Search page.  

2. Display Company in results  
The Company must appear in the Accounts Search results list.  

3. Remove Ref Account hyperlink for Kornerstone  
For accounts where Company = Kornerstone, the Ref Account must not be clickable.  

### Attachment(s)
Screenshot-1  
image.png  

Screenshot-2  
Insert / Attach related screenshots  

### Steps-to-Reproduce
List the steps required to verify the implemented feature  

### Atributos
**Status**  
To do  

**Responsáveis**  
avatar  
Fernando Martins  

**Etiquetas**  
dev  
full-stack  
priority  
high  
type  
business request  
workflow  
staging-in-process  

**Principal**  
Uown | RU11.25.1.47.0  

**Peso**  
Nenhum  

**Marco**  
Uown | RU12.25.1.47.0  

**Iteração**  
Nenhum  

**Datas**  
Iniciar: Nenhum  

Vencimento: Nenhum  

**Rastreamento de tempo**  
Adicione uma  ou o .  

**3 participantes**  
Fernando Martins  
Sowjanya Kaligineedi  
Yuri Araujo  

### Itens secundários
0  

Nenhum item filho está atribuído no momento. Use itens filhos para dividir o trabalho em partes menores.  

### Itens vinculados
0  

Vincule itens para mostrar que eles estão relacionados ou que um está bloqueando outros.  

### Desenvolvimento
3  

[uown/frontend/servicing#491] - Add get Companies Method  
svc  
!1193  
Mesclado  
Fernando Martins  

[uown/frontend/servicing#491] - Add Companies Search Field in Account Filter  
!647  
Mesclado  
Fernando Martins  

[uown/frontend/servicing#491] - Get Companies Method Added  
svc-common  
!112  
Fechado  
Fernando Martins  

### Atividade
Yuri Araujo set status to To do 4 dias atrás  
Yuri Araujo added uown#13 as parent epic 4 dias atrás  
Yuri Araujo changed milestone to %Uown | RU12.25.1.47.0 4 dias atrás  
Yuri Araujo added  
dev  
full-stack  

priority  
high  

type  
business request  
 labels 4 dias atrás  

Yuri Araujo assigned to @fernandogmartins 4 dias atrás  
Fernando Martins added  
workflow  
development-in-process  
 label 4 dias atrás  

Fernando Martins mentioned in merge request !647 (merged) 4 dias atrás  
Fernando Martins mentioned in merge request uown/backend/svc!1193 (merged) 4 dias atrás  
Fernando Martins mentioned in merge request uown/backend/svc-common!112 (closed) 4 dias atrás  

Fernando Martins added  
workflow  
code-review-pending  
 label and removed  
workflow  
development-in-process  
 label 4 dias atrás  

Fernando Martins added  
workflow  
development-in-process  
 label and removed  
workflow  
code-review-pending  
 label 1 dia atrás  

Fernando Martins added  
workflow  
code-review-pending  
 label and removed  
workflow  
development-in-process  
 label 1 dia atrás  

Fernando Martins  
Fernando Martins  
@fernandogmartins  
1 dia atrás  
Maintainer  

### Testing Steps

#### Overview
Test the Company filter dropdown and search functionality in the Servicing search page, including the Company column display and conditional Ref Account link removal for KORNERSTONE accounts.

image  

1. Company Filter Dropdown  
Navigate to Servicing → Search page  
Click Filters button  
Locate Company filter field  

Expected: Dropdown displays "KORNERSTONE" and "UOWN" options (sorted alphabetically)  
Click on Company dropdown  
Expected: Dropdown is searchable - type to filter options  
Select a company value  
Click Search  
Expected: Results filtered to show only accounts matching selected company  

2. Company Column Display  
Perform a search (with or without company filter)  
Expected: "Company" column appears in search results table  
Expected: Company values display correctly for each account row  
Verify column is sortable  

3. Ref Account Link - KORNERSTONE Accounts  
Search for accounts with company = KORNERSTONE  
Locate "Ref Account" column in results  
Expected: Ref Account values display as plain text (no hyperlink) for KORNERSTONE accounts  

Search for accounts with company = UOWN  
Expected: Ref Account values display as clickable hyperlinks for UOWN accounts  

4. Filter Combinations  
Apply Company filter along with other filters (SSN, Email, etc.)  
Expected: All filters work together correctly  
Verify pagination works with Company filter applied  
Verify CSV export includes Company column  

### API Testing

**Endpoint**  
GET /uown/svc/getDistinctCompanies  

**Expected Response**  
["KORNERSTONE", "UOWN"]  


---
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

A seguir está a **lista numerada de requisitos de teste para execução de testes manuais**, derivada diretamente do escopo e dos requisitos descritos. O conteúdo está organizado **primeiro em Português e depois em Inglês**, com correspondência 1:1 entre os itens.

---

## 🇧🇷 Português — Requisitos de Teste (Testes Manuais)

1. O sistema deve exibir o filtro **Company** na página **Servicing → Accounts Search**.
2. O filtro **Company** deve ser apresentado como um campo do tipo dropdown.
3. O dropdown de **Company** deve listar as opções **KORNERSTONE** e **UOWN**.
4. As opções do dropdown **Company** devem estar ordenadas alfabeticamente.
5. O dropdown de **Company** deve permitir busca digitável (searchable).
6. Ao selecionar uma empresa no filtro **Company** e executar a busca, os resultados devem ser filtrados corretamente pela empresa selecionada.
7. A tabela de resultados da busca deve exibir a coluna **Company**.
8. A coluna **Company** deve exibir corretamente o valor correspondente a cada conta listada.
9. A coluna **Company** deve permitir ordenação (sort).
10. Para contas onde **Company = KORNERSTONE**, o campo **Ref Account** deve ser exibido apenas como texto, sem hyperlink.
11. Para contas onde **Company = UOWN**, o campo **Ref Account** deve ser exibido como hyperlink clicável.
12. A aplicação do filtro **Company** deve funcionar corretamente em conjunto com outros filtros (ex.: SSN, Email).
13. A paginação dos resultados deve funcionar corretamente quando o filtro **Company** estiver aplicado.
14. A exportação em CSV deve incluir a coluna **Company**.
15. O endpoint **GET /uown/svc/getDistinctCompanies** deve retornar corretamente a lista de empresas distintas.
16. A resposta do endpoint de empresas distintas deve conter exatamente os valores **["KORNERSTONE", "UOWN"]**.

---

## 🇺🇸 English — Test Requirements (Manual Testing)

1. The system must display the **Company** filter on the **Servicing → Accounts Search** page.
2. The **Company** filter must be presented as a dropdown field.
3. The **Company** dropdown must list the options **KORNERSTONE** and **UOWN**.
4. The **Company** dropdown options must be sorted alphabetically.
5. The **Company** dropdown must support searchable input (type-to-filter).
6. When a company is selected in the **Company** filter and the search is executed, the results must be correctly filtered by the selected company.
7. The search results table must display the **Company** column.
8. The **Company** column must correctly display the company value for each listed account.
9. The **Company** column must be sortable.
10. For accounts where **Company = KORNERSTONE**, the **Ref Account** field must be displayed as plain text without a hyperlink.
11. For accounts where **Company = UOWN**, the **Ref Account** field must be displayed as a clickable hyperlink.
12. The **Company** filter must work correctly in combination with other filters (e.g., SSN, Email).
13. Pagination must work correctly when the **Company** filter is applied.
14. CSV export must include the **Company** column.
15. The **GET /uown/svc/getDistinctCompanies** endpoint must correctly return the list of distinct companies.
16. The distinct companies endpoint response must contain exactly **["KORNERSTONE", "UOWN"]**.

---

Se desejar, posso também:

* Converter esta lista em **casos de teste formais (Given / When / Then)**
* Organizar por **prioridade ou tipo (funcional, regressão, API)**
* Gerar um **checklist de execução de testes** para QA/manual testers



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg


> ```gherkin

> **The system must display the **Company** filter on the **Servicing → Accounts Search** page. The **Company** filter must be presented as a dropdown field. The **Company** dropdown must list the options **KORNERSTONE** and **UOWN**.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **Company** dropdown options must be sorted alphabetically.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **Company** dropdown must support searchable input (type-to-filter).**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a company is selected in the **Company** filter and the search is executed, the results must be correctly filtered by the selected company.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The search results table must display the **Company** column.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **Company** column must correctly display the company value for each listed account.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **Company** column must be sortable.**

> !

> **| PASS |**
> ```

---


> ```gherkin

> **For accounts where **Company = KORNERSTONE**, the **Ref Account** field must be displayed as plain text without a hyperlink.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **For accounts where **Company = UOWN**, the **Ref Account** field must be displayed as a clickable hyperlink.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **Company** filter must work correctly in combination with other filters (e.g., SSN, Email).**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **Pagination must work correctly when the **Company** filter is applied.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **CSV export must include the **Company** column.**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **The **GET /uown/svc/getDistinctCompanies** endpoint must correctly return the list of distinct companies. The distinct companies endpoint response must contain exactly **["KORNERSTONE", "UOWN"]**.**

> !

> **| PASS |**
> ```

---