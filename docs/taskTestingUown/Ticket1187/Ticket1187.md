--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1187


Abaixo está a **entrega da tarefa em Português e em Inglês**, estruturada de forma objetiva, focada no **comportamento do usuário**, adequada para **QA, DEV e stakeholders**, sem uso de primeira pessoa.

---

## 🇧🇷 **PORTUGUÊS — Entrega da Tarefa**

### **Título**

UOWN | Origination | Logs exibidos fora da ordem cronológica na página Merchant

### **Tipo**

Bug

### **Contexto**

Foi identificado um comportamento incorreto na exibição dos logs de atividade na página **Merchant**, onde os registros não estão ordenados cronologicamente. Logs mais recentes aparecem abaixo de entradas mais antigas, causando confusão ao usuário e comprometendo a confiabilidade dos dados, especialmente para fins de auditoria e rastreabilidade.

O problema ocorre tanto em **Production** quanto em **Sandbox**.

---

### **Comportamento Atual**

* Os logs são exibidos fora da ordem cronológica.
* Registros mais recentes aparecem abaixo de registros mais antigos.
* A ordenação inconsistente prejudica a leitura.
* A confiabilidade dos dados de auditoria é impactada.
* O comportamento ocorre de forma consistente em múltiplos ambientes.

---

### **Comportamento Esperado**

* Os logs devem ser exibidos em ordem cronológica correta.
* Os registros mais recentes devem aparecer antes dos registros mais antigos.
* A ordenação deve ser consistente e previsível.
* A visualização dos logs deve suportar auditoria e rastreamento de ações.
* O comportamento deve ser consistente entre todos os ambientes.

---

### **Requisitos Funcionais (Foco em Comportamento do Usuário)**

1. Ao acessar uma página com tabela de logs de atividade, os registros mais recentes devem ser exibidos no topo da lista.
2. Ao visualizar os logs, a ordem cronológica deve ser clara e confiável.
3. Ao navegar entre páginas que utilizam o componente de logs, o comportamento de ordenação deve permanecer consistente.
4. O usuário não deve identificar discrepâncias na ordem dos eventos registrados.
5. A experiência de auditoria deve ser preservada em todas as páginas que exibem logs.

---

### **Escopo de Testes**

Devem ser testadas todas as páginas que utilizam o componente de tabela de logs de atividade, incluindo:

**Origination**

* Customer
* Merchant
* Program
* States

**Servicing**

* Customer-Information

---

### **Critérios de Aceite**

* Logs exibidos em ordem cronológica correta.
* Registros mais recentes posicionados antes dos mais antigos.
* Comportamento consistente em Production e Sandbox.
* Nenhuma regressão visual ou funcional no componente de logs.
* Consistência validada em todas as páginas listadas no escopo.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------3

## 🇺🇸 **ENGLISH — Task Delivery**

### **Title**

UOWN | Origination | Logs displayed out of chronological order on Merchant page

### **Type**

Bug

### **Context**

An incorrect behavior was identified in the activity logs displayed on the **Merchant** page, where records are not ordered chronologically. More recent logs appear below older entries, causing user confusion and reducing trust in the data, which is critical for auditing and action tracking.

The issue occurs in both **Production** and **Sandbox** environments.

---

### **Current Behavior**

* Logs are displayed out of chronological order.
* More recent entries appear below older logs.
* Inconsistent ordering impacts readability.
* Audit data reliability is compromised.
* The issue is consistently reproducible across environments.

---

### **Expected Behavior**

* Logs must be displayed in the correct chronological order.
* The most recent logs must appear before older ones.
* Ordering must be consistent and predictable.
* Log visualization must support auditing and traceability.
* Behavior must be consistent across all environments.

---

### **Functional Requirements (User Behavior Focused)**

1. When accessing a page with an activity logs table, the most recent records must be displayed at the top.
2. When reviewing logs, the chronological order must be clear and reliable.
3. When navigating between pages that use the activity logs component, ordering behavior must remain consistent.
4. Users must not encounter discrepancies in the sequence of logged events.
5. The auditing experience must be preserved across all pages that display logs.

---

### **Test Scope**

All pages that use the activity logs table component must be validated, including:

**Origination**

* Customer
* Merchant
* Program
* States

**Servicing**

* Customer-Information

---

### **Acceptance Criteria**

* Logs displayed in correct chronological order.
* Most recent entries appear before older ones.
* Consistent behavior in Production and Sandbox.
* No visual or functional regressions in the logs component.
* Consistency validated across all pages within scope.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------
Alteracoes dev:

 2 arquivos
+
32
−
3
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src/lib/layouts/collap
‎sable-edit/activity-log‎

inde
‎x.tsx‎
+31 -2

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/layouts/collapsable-edit/activity-log/index.tsx 
+
31
−
2

Visualizado
@@ -59,7 +59,7 @@ const conditionalActivityLogTableStyles: ConditionalStyles<TableRow>[] = [
      color: '#28a745',
    },
  },
  // All other logs (SYSTEM_GENERATED, API_CALL, etc) default to black 
  // All other logs (SYSTEM_GENERATED, API_CALL, etc) default to black
];

type ActivityLogTableColumnsArgs = {
@@ -95,6 +95,35 @@ const activityLogTableColumns: ({
        }),
      key: 'rowCreatedTimestamp',
      id: 'rowCreatedTimestamp',
      sortFunction: (
        currentRow: { rowCreatedTimestamp: string },
        previousRow: { rowCreatedTimestamp: string }
      ) => {
        const parseDate = (value: string) => {
          if (!value) return 0;

          // 04/17/2025 11:23:04 a.m. EST
          return new Date(
            value
              .replace(' a.m.', ' AM')
              .replace(' p.m.', ' PM')
              .replace(' EST', '')
          ).getTime();
        };

        const currentDate = parseDate(currentRow.rowCreatedTimestamp);
        const previousDate = parseDate(previousRow.rowCreatedTimestamp);

        if (currentDate > previousDate) {
          return 1;
        }

        if (previousDate > currentDate) {
          return -1;
        }

        return 0;
      },
      width: '270px',
      sortable: true,
    },
@@ -471,7 +500,7 @@ export const ActivityLogPanel = ({
        conditionalRowStyles={conditionalActivityLogTableStyles}
        customStyles={config?.tableStyles}
        data={activityLogsFormatted}
        defaultSortFieldId={defaultSortField ? "rowCreatedTimestamp" : ""}
        defaultSortFieldId={defaultSortField ? 'rowCreatedTimestamp' : ''}
        defaultSortAsc={false}
        filterProps={{
          filterBtnTitle: 'Filters',
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.402",
  "version": "0.0.403",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

--------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa1

### Feature: Ordenação cronológica dos logs de atividade

---

### **Scenario Outline: Exibir logs ordenados por data e hora ao carregar a página**

```gherkin
Scenario Outline: Exibir logs ordenados por data e hora ao carregar a página
  Given o usuário acessa a página <page>
  When a tabela de logs de atividade é exibida
  Then os logs devem estar ordenados do mais recente para o mais antigo por data e hora
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

---

### **Scenario Outline: Ordenar logs manualmente por data e hora**

```gherkin
Scenario Outline: Ordenar logs manualmente por data e hora
  Given o usuário visualiza os logs de atividade na página <page>
  When o usuário ordena os logs pela coluna de data
  Then os logs devem ser ordenados corretamente por data e hora
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

---

### **Scenario Outline: Inserir nota e manter ordenação cronológica**

```gherkin
Scenario Outline: Inserir nota e manter ordenação cronológica
  Given o usuário está na página <page>
  When uma nova nota é inserida
  Then o novo log deve aparecer na posição cronológica correta
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Customer-Information |

---

### **Scenario: Alterar prioridade e manter ordenação por data e hora**

```gherkin
Scenario: Alterar prioridade e manter ordenação por data e hora
  Given o usuário visualiza os logs de atividade na página Customer-Information
  When um log é marcado ou desmarcado como prioridade
  Then os logs devem permanecer ordenados por data e hora
```

---

```gherkin
Scenario: Manter ordenação ao alterar ordem e quantidade de registros exibidos
  Given o usuário visualiza a tabela de logs de atividade
  When o usuário altera a ordenação para do mais antigo para o mais recente
  And o usuário altera a quantidade de registros exibidos na tela
  Then os logs devem permanecer ordenados do mais antigo para o mais recente por data e hora
```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------


## **Tests in qa1**

### **Feature: Chronological ordering of activity logs**

---

```gherkin
Scenario Outline: Display logs ordered by date and time on page load
  Given the user accesses the <page> page
  When the activity logs table is displayed
  Then logs must be ordered from most recent to oldest by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

---

```gherkin
Scenario Outline: Manually sort logs by date and time
  Given the user is viewing the activity logs on the <page> page
  When the user sorts the logs by the date column
  Then logs must be ordered correctly by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

![image](/uploads/40e22b447a95c716570fec399173ac23/image.png){width=900 height=487}

![image](/uploads/26142e6bf60bfe9bda7a09b6b7a341ad/image.png){width=900 height=484}


![image](/uploads/65817f62a62507b8ef6a39e98ffb2537/image.png){width=900 height=479}

![image](/uploads/8f0d4547ee571e2c2b05fff1c8079734/image.png){width=900 height=479}




---

```gherkin
Scenario Outline: Add note and maintain chronological ordering
  Given the user is on the <page> page
  When a new note is added
  Then the new log entry must appear in the correct chronological position
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Customer-Information |

![image](/uploads/a156a4cbc08fe5bfe9edb1150f6c88db/image.png){width=900 height=458}

![image](/uploads/f8ccf5d79ea6d6129135366de23414fd/image.png){width=900 height=485}

![image](/uploads/6840ecd4febae8db5e355709517e6f57/image.png){width=900 height=474}

---

```gherkin
Scenario: Change priority and maintain ordering by date and time
  Given the user is viewing activity logs on the Customer-Information page
  When a log is marked or unmarked as priority
  Then logs must remain ordered by date and time
```

![Screenshot_at_Jan_12_06-41-37](/uploads/5992f474606718f654129dc1cb945204/Screenshot_at_Jan_12_06-41-37.png){width=900 height=486}

![image](/uploads/b7043e10e09125d4ccc6220fc1b1b4c6/image.png){width=900 height=490}

![image](/uploads/3ba6a35e14198e41fb958883dcd7ad5b/image.png){width=900 height=483}

---

```gherkin
Scenario: Preserve sorting when changing order and number of displayed records
  Given the user is viewing the activity logs table
  When the user changes the sorting to oldest to most recent
  And the user changes the number of records displayed on the page
  Then the logs must remain ordered from oldest to most recent by date and time
```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------



## **Tests in qa1**

### **Feature: Chronological ordering of activity logs**

---

```gherkin
Scenario Outline: Display logs ordered by date and time on page load
  Given the user accesses the <page> page
  When the activity logs table is displayed
  Then logs must be ordered from most recent to oldest by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

---

```gherkin
Scenario Outline: Manually sort logs by date and time
  Given the user is viewing the activity logs on the <page> page
  When the user sorts the logs by the date column
  Then logs must be ordered correctly by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

![image](/uploads/40e22b447a95c716570fec399173ac23/image.png){width=900 height=487}

![image](/uploads/26142e6bf60bfe9bda7a09b6b7a341ad/image.png){width=900 height=484}


![image](/uploads/65817f62a62507b8ef6a39e98ffb2537/image.png){width=900 height=479}

![image](/uploads/8f0d4547ee571e2c2b05fff1c8079734/image.png){width=900 height=479}




---

```gherkin
Scenario Outline: Add note and maintain chronological ordering
  Given the user is on the <page> page
  When a new note is added
  Then the new log entry must appear in the correct chronological position
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Customer-Information |

![image](/uploads/a156a4cbc08fe5bfe9edb1150f6c88db/image.png){width=900 height=458}

![image](/uploads/f8ccf5d79ea6d6129135366de23414fd/image.png){width=900 height=485}

![image](/uploads/6840ecd4febae8db5e355709517e6f57/image.png){width=900 height=474}

---

```gherkin
Scenario: Change priority and maintain ordering by date and time
  Given the user is viewing activity logs on the Customer-Information page
  When a log is marked or unmarked as priority
  Then logs must remain ordered by date and time
```

![Screenshot_at_Jan_12_06-41-37](/uploads/5992f474606718f654129dc1cb945204/Screenshot_at_Jan_12_06-41-37.png){width=900 height=486}

![image](/uploads/b7043e10e09125d4ccc6220fc1b1b4c6/image.png){width=900 height=490}

![image](/uploads/3ba6a35e14198e41fb958883dcd7ad5b/image.png){width=900 height=483}

---

```gherkin
Scenario: Preserve sorting when changing order and number of displayed records
  Given the user is viewing the activity logs table
  When the user changes the sorting to oldest to most recent
  And the user changes the number of records displayed on the page
  Then the logs must remain ordered from oldest to most recent by date and time
```

---


--------------------------------------------------------------------------------------------------------------------------------------------------------

## **Tests in stg**

### **Feature: Chronological ordering of activity logs**

---

```gherkin
Scenario Outline: Display logs ordered by date and time on page load
  Given the user accesses the <page> page
  When the activity logs table is displayed
  Then logs must be ordered from most recent to oldest by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

---

```gherkin
Scenario Outline: Manually sort logs by date and time
  Given the user is viewing the activity logs on the <page> page
  When the user sorts the logs by the date column
  Then logs must be ordered correctly by date and time
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Program              |
| States               |
| Customer-Information |

### Important Note

On the Customer-Information page, when there are logs with and without priority, sorting by date and time currently mixes both types, ignoring the priority rule.

This behavior is known and will be addressed in a future request.
For now, the expected behavior is:
* Priority logs must remain in the top positions.
* Logs with and without priority must be sorted by date and time within their respective groups.




---

```gherkin
Scenario Outline: Add note and maintain chronological ordering
  Given the user is on the <page> page
  When a new note is added
  Then the new log entry must appear in the correct chronological position
```

**Examples:**

| page                 |
| -------------------- |
| Customer             |
| Merchant             |
| Customer-Information |



---

```gherkin
Scenario: Change priority and maintain ordering by date and time
  Given the user is viewing activity logs on the Customer-Information page
  When a log is marked or unmarked as priority
  Then logs must remain ordered by date and time
```



---

```gherkin
Scenario: Preserve sorting when changing order and number of displayed records
  Given the user is viewing the activity logs table
  When the user changes the sorting to oldest to most recent
  And the user changes the number of records displayed on the page
  Then the logs must remain ordered from oldest to most recent by date and time
```

**| PASS |**

**| Merchant: Tire Agent |**

**| Program: KW-16-2.25 |**

**| LeadPk: 25521 |**

**| AccountPk: 206880  |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------