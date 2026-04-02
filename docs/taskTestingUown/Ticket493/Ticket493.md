--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/493


Below is the task description delivered in **English and Portuguese**, structured in a clear, ticket-ready format.

---

### **UOWN | Servicing | Align Servicing Search Page Filters with Origination Funding Queue Layout**

**Status:** Open
**Type:** Bug
**Reported by:** Yuri Araujo
**Created:** 1 week ago

### **Description**

In the **Servicing** module, on the main **Search** page, the **Company** filter presents a layout issue.
The description text inside the filter is being **truncated**, which makes it difficult to read and negatively impacts the user experience.

To ensure consistency and usability, the **filter layout should follow the same model used in the Origination – Funding Queue filters**.

### **Expected Fix**

* The **Company** filter must display the **full text**, without truncation.
* The layout should be adjusted to ensure **proper readability and a consistent user experience**.
* The filter design should be **aligned with the Funding Queue filter layout** used in Origination.

### **Steps to Reproduce**

1. Access the **Servicing** module.
2. Open the **main search page**.
3. Locate the **Company** filter.
4. Observe that the displayed text is **cut off / truncated**.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

### **UOWN | Servicing | Alinhar filtros da página de busca do Servicing com o layout da Funding Queue da Origination**

**Status:** Aberto
**Tipo:** Bug
**Reportado por:** Yuri Araujo
**Criado:** Há 1 semana

### **Descrição**

No módulo **Servicing**, na página principal de **Search**, o filtro **Company** apresenta um problema de layout.
O texto de descrição está sendo **cortado**, dificultando a leitura e impactando negativamente a experiência do usuário.

Para manter consistência visual e usabilidade, o **layout dos filtros deve seguir o mesmo padrão utilizado na página de Funding Queue da Origination**.

### **Correção Esperada**

* O filtro **Company** deve exibir o **texto completo**, sem truncamento.
* O layout deve ser ajustado para garantir **boa legibilidade e melhor experiência do usuário**.
* O design do filtro deve ficar **alinhado ao modelo da Funding Queue da Origination**.

### **Passos para Reproduzir**

1. Acessar o módulo **Servicing**.
2. Abrir a **página principal de busca**.
3. Localizar o filtro **Company**.
4. Notar que o texto exibido está **cortado / truncado**.

---


--------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


Comparar
e
 7 arquivos
+
45
−
195
Arquivos
7
Pesquisar (por exemplo, *.vue) (F)

components/cust
‎omer-info-panels‎

breakd
‎own.tsx‎
+9 -8

contract-balanc
‎e-breakdown.tsx‎
+0 -58

ninety-day-b
‎reakdown.tsx‎
+0 -57

servicing-in
‎formation.tsx‎
+14 -14

total-contract-am
‎ount-breakdown.tsx‎
+0 -58

pages/
‎search‎

inde
‎x.tsx‎
+1 -0

ut
‎ils‎

parse90DayB
‎reakdown.ts‎
+21 -0

 components/customer-info-panels/epo-breakdown.tsx → components/customer-info-panels/breakdown.tsx 
+
9
−
8

Visualizado
@@ -3,20 +3,21 @@ import classNames from 'classnames';
import React from 'react';
import styles from './index.module.scss';

interface EpoBreakdownProps {
interface BreakdownProps {
  title: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  epoBreakdownData: string[][];
  data: string[][];
}

const EpoBreakdown = (props: EpoBreakdownProps) => {
  const {isOpen, setIsOpen, epoBreakdownData} = props;
const Breakdown = ({data, isOpen, setIsOpen, title}: BreakdownProps) => {
  
  const epoDataTableHeader =
    ((epoBreakdownData || []).length > 0 && epoBreakdownData[0]) || [];
    ((data || []).length > 0 && data[0]) || [];
  const epoDataTableData =
    ((epoBreakdownData || []).length > 0 && epoBreakdownData[1]) || [];
    ((data || []).length > 0 && data[1]) || [];
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="EPO Breakdown">
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
      <table className="w-100">
        {epoDataTableHeader?.map((header: string, i) => {
          const currencyRegex: RegExp = /^\d+(?:\.\d{0,2})$/;
@@ -60,4 +61,4 @@ const EpoBreakdown = (props: EpoBreakdownProps) => {
  );
};

export default React.memo(EpoBreakdown);
export default React.memo(Breakdown);
 components/customer-info-panels/contract-balance-breakdown.tsx excluído  100644 → 0
+
0
−
58

Visualizado
import {Modal} from '@uownleasing/common-ui';
import React from 'react';

interface ContractBalanceBreakdownProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  contractBalanceBreakdown: string[][];
}

const ContractBalanceBreakdown = ({
  isOpen,
  setIsOpen,
  contractBalanceBreakdown,
}: ContractBalanceBreakdownProps) => {
  const [labels = [], values = []] = contractBalanceBreakdown || [];

  const lines = labels.map((label, index) => ({
    label,
    value: values[index],
  }));

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Contract Balance Breakdown"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((item, index) => {
          const isTotal = item.label.toLowerCase() === 'total';

          return (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                fontWeight: isTotal ? 'bold' : 'normal',
                borderTop: isTotal ? '1px solid #ccc' : 'none',
                paddingTop: isTotal ? 6 : 0,
              }}
            >
              <span>
                {isTotal && '- '}
                {item.label}
              </span>
              <span style={{ textAlign: 'right' }}>
                ${Number(item.value).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ContractBalanceBreakdown;
 components/customer-info-panels/ninety-day-breakdown.tsx excluído  100644 → 0
+
0
−
57

Visualizado
import {Modal} from '@uownleasing/common-ui';
import React from 'react';

interface EpoBreakdownProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  _90DayBreakdown: string;
}

const NinetyDayBreakdown = ({
  isOpen,
  setIsOpen,
  _90DayBreakdown,
}: EpoBreakdownProps) => {
  const lines = _90DayBreakdown
    ?.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(.*?)(\$[\d,.]+)$/);
      return match
        ? { label: match[1].trim(), value: match[2] }
        : null;
    })
    .filter(Boolean);

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="90 Day Breakdown">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines?.map((item, index) => {
          const isTotal = item.label.toLowerCase() === 'total';

          return (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                fontWeight: isTotal ? 'bold' : 'normal',
                borderTop: isTotal ? '1px solid #ccc' : 'none',
                paddingTop: isTotal ? 6 : 0,
              }}
            >
              <span>
                {isTotal && ' '}
                {item.label}
              </span>
              <span style={{ textAlign: 'right' }}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default NinetyDayBreakdown;

--------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1


```gherkin

Scenario: Company exibe nome longo sem truncamento
  Given que o usuário acessa os filtros do Servicing
  When seleciona uma Company com nome longo
  Then o texto selecionado permanece totalmente legível

```
---

```gherkin

Scenario: Company permite busca por digitação e seleção
  Given que o usuário acessa os filtros do Servicing
  When digita um termo no filtro Company
  Then apenas opções compatíveis são exibidas
  When seleciona uma opção de Company
  Then o valor selecionado é exibido corretamente no campo

```
---

```gherkin

Scenario Outline: Company participa da busca combinada com outro filtro
  When o usuário seleciona uma Company
  And preenche o filtro <campo>
  And aciona o botão "Search"
  Then a lista de resultados é exibida
  And os resultados respeitam a Company selecionada
  And os resultados respeitam o filtro <campo>

Examples:
  | campo        |
  | Account PK   |
  | SSN          |
  | Customer Name|

```
---

```gherkin

Scenario: Limpar Company remove apenas o filtro de Company
  When o usuário seleciona uma Company
  And preenche outro filtro
  And aciona o botão "Search"
  Then os resultados respeitam ambos os filtros
  When o usuário limpa o filtro Company
  And aciona o botão "Search"
  Then os resultados respeitam apenas os demais filtros preenchidos

```

---

```gherkin

Scenario: Company permanece legível em layout responsivo
  Given que o usuário acessa os filtros do Servicing em viewport reduzido
  When seleciona uma Company com nome longo
  Then o texto não é truncado
  And o layout dos filtros permanece íntegro
      
```

---

```gherkin

  Scenario Outline: Campos de data seguem o mesmo padrão de entrada
    Given que o usuário acessa os filtros da <tela>
    When interage com o campo <campo>
    Then o placeholder exibido é "MM/DD/YYYY"
    And o campo aceita no máximo 8 caracteres
    And o campo aceita apenas caracteres compatíveis com data

    Examples:
      | tela          | campo       |
      | Funding Queue | Start Date  |
      | Funding Queue | End Date    |
      | Servicing     | From        |
      | Servicing     | To          |
                  
```

---

```gherkin

  Scenario Outline: Intervalo de datas é validado de forma consistente
    Given que o usuário acessa os filtros da <tela>
    When informa uma data inicial
    And informa uma data final
    Then o sistema valida o intervalo conforme as regras esperadas

    Examples:
      | tela          |
      | Funding Queue |
      | Servicing     |
      
```

---

```gherkin

Scenario Outline: Filtro individual participa corretamente da busca
  When o usuário preenche o filtro <campo>
  And aciona o botão "Search"
  Then a lista de resultados é exibida
  And os resultados refletem o filtro informado

Examples:
  | campo            |
  | SSN              |
  | Ref Account ID   |
  | Email            |
  | Account PK       |
  | Phone Number     |
  | Customer Name    |
  | Last 4 CC digits |

```
---

```gherkin

Scenario Outline: Busca combina intervalo de datas com outro filtro
  When o usuário preenche o filtro "From"
  And preenche o filtro "To"
  And preenche o filtro <campo>
  And aciona o botão "Search"
  Then a lista de resultados é exibida
  And os resultados respeitam o intervalo de datas
  And os resultados respeitam o filtro <campo>

Examples:
  | campo          |
  | SSN            |
  | Account PK     |
  | Customer Name  |
  | Ref Account ID |

```
---

```gherkin

Scenario Outline: Busca combina dois filtros textuais
  When o usuário preenche o filtro <campoA>
  And preenche o filtro <campoB>
  And aciona o botão "Search"
  Then a lista de resultados é exibida
  And os resultados respeitam ambos os filtros informados

Examples:
  | campoA        | campoB        |
  | Email           | Customer Name |
  | Last 4 CC Digits         | Company    |
  | Phone Number  | Email |
      
```

---

```gherkin

  Scenario Outline: Valores permanecem preenchidos após executar Search
    When o usuário preenche os filtros "From" e "To"
    And preenche o filtro <campo>
    And seleciona uma Company
    And aciona o botão "Search"
    Then os valores informados permanecem visíveis nos filtros

    Examples:
      | campo          |
      | Account PK     |
      | SSN            |
      | Customer Name  |

```

---


----------------------------------------------------------------------------------

> ## Tests in qa1

```gherkin
Scenario: Company displays long name without truncation
  Given the user accesses the Servicing filters
  When a Company with a long name is selected
  Then the selected text remains fully readable
```

---

```gherkin
Scenario: Company allows search by typing and selection
  Given the user accesses the Servicing filters
  When a term is typed in the Company filter
  Then only matching options are displayed
  When a Company option is selected
  Then the selected value is correctly displayed in the field
```

---

```gherkin
Scenario Outline: Company participates in a combined search with another filter
  When the user selects a Company
  And fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect the selected Company
  And the results respect the <field> filter

Examples:
  | field         |
  | Account PK    |
  | SSN           |
  | Customer Name |
```

---

```gherkin
Scenario: Clearing Company removes only the Company filter
  When the user selects a Company
  And fills another filter
  And clicks the "Search" button
  Then the results respect both filters
  When the user clears the Company filter
  And clicks the "Search" button
  Then the results respect only the remaining filled filters
```

---

```gherkin
Scenario: Company remains readable in a responsive layout
  Given the user accesses the Servicing filters on a reduced viewport
  When a Company with a long name is selected
  Then the text is not truncated
  And the filter layout remains intact
```

---

```gherkin
Scenario Outline: Date fields follow the same input pattern
  Given the user accesses the filters on the <screen>
  When interacting with the <field>
  Then the placeholder displayed is "MM/DD/YYYY"
  And the field accepts a maximum of 8 characters
  And the field accepts only date-compatible characters

Examples:
  | screen        | field       |
  | Funding Queue | Start Date  |
  | Funding Queue | End Date    |
  | Servicing     | From        |
  | Servicing     | To          |
```

---

```gherkin
Scenario Outline: Date range is validated consistently
  Given the user accesses the filters on the <screen>
  When an initial date is provided
  And a final date is provided
  Then the system validates the date range according to the expected rules

Examples:
  | screen        |
  | Funding Queue |
  | Servicing     |
```

---

```gherkin
Scenario Outline: Individual filter participates correctly in search
  When the user fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results reflect the applied filter

Examples:
  | field             |
  | SSN               |
  | Ref Account ID    |
  | Email             |
  | Account PK        |
  | Phone Number      |
  | Customer Name     |
  | Last 4 CC digits  |
```

---

```gherkin
Scenario Outline: Search combines date range with another filter
  When the user fills the "From" filter
  And fills the "To" filter
  And fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect the date range
  And the results respect the <field> filter

Examples:
  | field          |
  | SSN            |
  | Account PK     |
  | Customer Name  |
  | Ref Account ID |
```

---

```gherkin
Scenario Outline: Search combines two textual filters
  When the user fills the <fieldA> filter
  And fills the <fieldB> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect both applied filters

Examples:
  | fieldA            | fieldB          |
  | Email             | Customer Name   |
  | Last 4 CC Digits  | Company         |
  | Phone Number      | Email           |
```

---

```gherkin
Scenario Outline: Filter values remain filled after executing Search
  When the user fills the "From" and "To" filters
  And fills the <field> filter
  And selects a Company
  And clicks the "Search" button
  Then the entered values remain visible in the filters

Examples:
  | field         |
  | Account PK    |
  | SSN           |
  | Customer Name |
```

---



--------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

```gherkin
Scenario: Company displays long name without truncation
  Given the user accesses the Servicing filters
  When a Company with a long name is selected
  Then the selected text remains fully readable
```

![Screenshot_at_Jan_07_09-49-39](/uploads/cc97e9ac0744aedad2dd0b5c03f88464/Screenshot_at_Jan_07_09-49-39.png){width=301 height=186}

---

```gherkin
Scenario: Company allows search by typing and selection
  Given the user accesses the Servicing filters
  When a term is typed in the Company filter
  Then only matching options are displayed
  When a Company option is selected
  Then the selected value is correctly displayed in the field
```

![Screenshot_at_Jan_07_09-49-54](/uploads/45b0c73242c53399bc5d3392a4d3e777/Screenshot_at_Jan_07_09-49-54.png){width=318 height=144}
![Screenshot_at_Jan_07_09-50-05](/uploads/61ce27cefada5365313905c4d642202b/Screenshot_at_Jan_07_09-50-05.png){width=291 height=133}
![Screenshot_at_Jan_07_09-50-19](/uploads/e83c34a7343aa7c44e697645d4662f80/Screenshot_at_Jan_07_09-50-19.png){width=291 height=85}
![Screenshot_at_Jan_07_09-50-25](/uploads/c2ac25bbcd5c066e94e3c33c945b8e80/Screenshot_at_Jan_07_09-50-25.png){width=288 height=80}
---

```gherkin
Scenario Outline: Company participates in a combined search with another filter
  When the user selects a Company
  And fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect the selected Company
  And the results respect the <field> filter

Examples:
  | field         |
  | Email    |
```

![Screenshot_at_Jan_07_09-51-21](/uploads/5b61c9851527290ea25695a5d17febf7/Screenshot_at_Jan_07_09-51-21.png){width=586 height=600}

---

```gherkin
Scenario: Clearing Company removes only the Company filter
  When the user selects a Company
  And fills another filter
  And clicks the "Search" button
  Then the results respect both filters
  When the user clears the Company filter
  And clicks the "Search" button
  Then the results respect only the remaining filled filters
```

---

```gherkin
Scenario: Company remains readable in a responsive layout
  Given the user accesses the Servicing filters on a reduced viewport
  When a Company with a long name is selected
  Then the text is not truncated
  And the filter layout remains intact
```

![Screenshot_at_Jan_07_09-49-31](/uploads/e2068cf14e4c487c9a4f8ee595fb500f/Screenshot_at_Jan_07_09-49-31.png){width=227 height=600}

---

```gherkin
Scenario Outline: Date fields follow the same input pattern
  Given the user accesses the filters on the <screen>
  When interacting with the <field>
  Then the placeholder displayed is "MM/DD/YYYY"
  And the field accepts a maximum of 8 characters
  And the field accepts only date-compatible characters

Examples:
  | screen        | field       |
  | Funding Queue | Start Date  |
  | Funding Queue | End Date    |
  | Servicing     | From        |
  | Servicing     | To          |
```

---

```gherkin
Scenario Outline: Date range is validated consistently
  Given the user accesses the filters on the <screen>
  When an initial date is provided
  And a final date is provided
  Then the system validates the date range according to the expected rules

Examples:
  | screen        |
  | Funding Queue |
  | Servicing     |
```

---

```gherkin
Scenario Outline: Individual filter participates correctly in search
  When the user fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results reflect the applied filter

Examples:
  | field             |
  | SSN               |
  | Ref Account ID    |
  | Email             |
  | Account PK        |
  | Phone Number      |
  | Customer Name     |
  | Last 4 CC digits  |
```

---

```gherkin
Scenario Outline: Search combines date range with another filter
  When the user fills the "From" filter
  And fills the "To" filter
  And fills the <field> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect the date range
  And the results respect the <field> filter

Examples:
  | field          |
  | SSN            |
  | Account PK     |
  | Customer Name  |
  | Ref Account ID |
```

---

```gherkin
Scenario Outline: Search combines two textual filters
  When the user fills the <fieldA> filter
  And fills the <fieldB> filter
  And clicks the "Search" button
  Then the results list is displayed
  And the results respect both applied filters

Examples:
  | fieldA            | fieldB          |
  | Email             | Customer Name   |
  | Last 4 CC Digits  | Company         |
  | Phone Number      | Email           |
```

![Screenshot_at_Jan_07_09-48-53](/uploads/3e531adcd7d4ecfc491e3a04ee34d06f/Screenshot_at_Jan_07_09-48-53.png){width=900 height=441}

**| PASS |**

---

```gherkin
Scenario Outline: Filter values remain filled after executing Search
  When the user fills the "From" and "To" filters
  And fills the <field> filter
  And selects a Company
  And clicks the "Search" button
  Then the entered values remain visible in the filters

Examples:
  | field         |
  | Account PK    |
  | SSN           |
  | Customer Name |
```

---