--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1157


UOWN | Origination | Set Default “To” Date as Current Date in Filters Across Origination and Servicing


Synopsis
Both Origination and Servicing have pages that include date-range filters with FROM and TO fields.
Currently, the TO date is not set automatically, requiring users to select it every time they perform a search.
To improve usability and reduce human error, the TO date must be pre-filled with the current date by default on specific pages.

This change should be applied to:
Servicing:
    * Main page filter
Origination:
    * Leads
    * Funding Page


Business Objective
Setting the TO date as the current date enhances user efficiency by reducing steps in the search process.
Users will be able to perform searches more quickly, avoid incorrect date selections, and rely on a consistent default behavior across key pages.
This improvement reduces friction and increases productivity for operations teams that work with high volumes of daily queries.


Feature Request | Business Requirements
* Update date-range filters so that the TO field defaults to the current date.
* Apply this behavior to the following pages:
* Servicing: Main page
* Origination: Leads and Funding Page
* Ensure the FROM date behavior remains unchanged.
* Allow users to manually modify the TO date if needed.


![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

## **UOWN | Originação | Definir Data “Até” como Data Atual nos Filtros de Originação e Servicing**

### **Sinopse**

Tanto os módulos de Originação quanto os de Servicing possuem páginas que incluem filtros por intervalo de datas, com campos **DE (FROM)** e **ATÉ (TO)**.
Atualmente, o campo **ATÉ** não é preenchido automaticamente, exigindo que os usuários o selecionem manualmente sempre que realizam uma busca.

Para melhorar a usabilidade e reduzir erros humanos, o campo **ATÉ** deve ser preenchido automaticamente com a **data atual**, por padrão, em páginas específicas.

Essa alteração deve ser aplicada em:

**Servicing:**

* Filtro da página principal

**Origination:**

* Leads
* Página de Funding

---

### **Objetivo de Negócio**

Definir a data **ATÉ** como a data atual aumenta a eficiência dos usuários ao reduzir etapas do processo de busca.
Os usuários poderão realizar pesquisas mais rapidamente, evitar seleções incorretas de datas e contar com um comportamento padrão consistente nas principais páginas.

Essa melhoria reduz fricção e aumenta a produtividade das equipes operacionais que trabalham com grandes volumes de consultas diárias.

---

### **Requisitos de Negócio | Solicitação de Feature**

* Atualizar os filtros por intervalo de datas para que o campo **ATÉ** tenha como padrão a **data atual**.
* Aplicar esse comportamento nas seguintes páginas:

  * **Servicing:** Página principal
  * **Origination:** Leads e Página de Funding
* Garantir que o comportamento do campo **DE (FROM)** permaneça inalterado.
* Permitir que os usuários ainda possam modificar manualmente a data **ATÉ**, caso necessário.

![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
Visão geral 
0
Commits 
1
Pipelines 
1
Alterações 
1
Comparar
e
 1 arquivo
+
1
−
1
 pages/search/index.tsx 
+
1
−
1

Visualizado
@@ -156,7 +156,7 @@ const Search = (props: SearchProps) => {
    enableReinitialize: false,
    initialValues: {
      from: fromDate || '',
      to: toDate || '',
      to: toDate || new Date().toISOString(),
      ssn: '',
      refAccountId: null,
      email: '',

---


Comparar
e
 2 arquivos
+
16
−
10
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

pa
‎ges‎

fun
‎ding‎

inde
‎x.tsx‎
+15 -9

le
‎ads‎

inde
‎x.tsx‎
+1 -1

 pages/funding/index.tsx 
+
15
−
9

Visualizado
import React, {useEffect, useState} from 'react';
import {EmailCSVModal, FilterTable, InputField, SendEmailCSVParams} from '@uownleasing/common-ui';
import {
  EmailCSVModal,
  FilterTable,
  InputField,
  SendEmailCSVParams,
} from '@uownleasing/common-ui';
import {
  convertToServerDate,
  formatDate,
@@ -186,8 +191,8 @@ const Funding = (props: FundingProps) => {
          pageNumber,
          maxResults: maxRes,
          statuses,
          from: formatDate({ f: 'api', d: startDate }),
          to: formatDate({ f: 'api', d: endDate }),
          from: formatDate({f: 'api', d: startDate}),
          to: formatDate({f: 'api', d: endDate}),
          merchantName: merchant,
          locationName: locationName === 'All' ? '' : locationName,
          salesRepCode,
@@ -230,7 +235,8 @@ const Funding = (props: FundingProps) => {
    initialValues: {
      statuses: [{key: 'Funding', value: 'Funding', label: 'Funding'}],
      startDate: formatDate({f: 'user', d: getDate()}),
      endDate: formatDate({f: 'user', d: getDate()}),
      endDate:
        formatDate({f: 'user', d: getDate()}) || new Date().toISOString(),
      dateTypeToSearch: null,
      merchant: '',
      locationName: '',
@@ -623,19 +629,19 @@ const Funding = (props: FundingProps) => {
    if (allRowsSelected) {
      const emailParams = {
        ...params,
        rowPks: [], 
        rowPks: [],
        parameters: {
          ...params.parameters,
          body: {
            ...params.parameters.body,
            maxResults: undefined,
            pageNumber: undefined
          }
        }
            pageNumber: undefined,
          },
        },
      };
      return overviewStore.sendEmailCSV(emailParams);
    }
    

    return overviewStore.sendEmailCSV(params);
  };

 pages/leads/index.tsx 
+
1
−
1

Visualizado
@@ -245,7 +245,7 @@ const Search = ({
      }),
      to: formatDate({
        f: 'api',
        d: leadStore.filterOptions?.toDate ?? '',
        d: leadStore.filterOptions?.toDate ?? new Date().toISOString(),
      }),
      ssn: '',
      email: '',

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin

> !

> **| PASS |**
> ```

---

> ```gherkin
2. **Usuário pode alterar manualmente a data TO**
   - Na mesma página, alterar manualmente o campo `TO` para uma data diferente da atual.
   - Executar a busca.
   - Verificar se:
     - A busca considera a data `TO` escolhida.
     - O campo `TO` permanece com a data escolhida após a busca (não volta sozinho para a data atual).

> !

> **| PASS |**
> ```

---

> ```gherkin
3. **Compatibilidade com buscas anteriores (regressão básica)**
   - Realizar uma busca com um intervalo de datas customizado (`FROM` e `TO` específicos).
   - Confirmar que os resultados retornados condizem com o intervalo escolhido.
   - Garantir que nenhum erro de validação/data aparece por causa do novo default no `TO`.

> !

> **| PASS |**
> ```

---

> ```gherkin
4. **TO preenchido com data atual na página de Leads**
   - Acessar `Origination > Leads`.
   - Abrir a área de filtros.
   - Verificar que:
     - `FROM` mantém o comportamento atual (mesma lógica pré-alteração).
     - `TO` vem preenchido automaticamente com a **data atual**.
     - Formato da data está correto.

5. **Alterar manualmente a data TO em Leads**
   - Alterar o `TO` para outra data qualquer (por exemplo, ontem).
   - Executar a busca.
   - Verificar que:
     - A busca respeita a data `TO` selecionada.
     - O campo `TO` permanece com essa data selecionada após o retorno dos resultados.

> !

> **| PASS |**
> ```

---

> ```gherkin
6. **Envio correto da data TO para a API (Leads)**
   - Realizar uma busca com o `TO` padrão (data atual).
   - Se possível, inspecionar a requisição (DevTools → Network).
   - Validar que:
     - O campo correspondente ao `TO` na requisição está sendo enviado com a data do dia, no formato esperado pela API (ex.: ISO ou formato configurado).
     - Quando você altera manualmente o `TO`, a requisição passa a usar a data modificada.

> !

> **| PASS |**
> ```

---

> ```gherkin
7. **TO (endDate) preenchido com data atual na Funding Page**
   - Acessar `Origination > Funding`.
   - Verificar o formulário de filtro:
     - `startDate` (FROM) deve manter o comportamento padrão atual.
     - `endDate` (TO) deve ser preenchido automaticamente com a **data atual**.
     - Conferir se o formato exibido para o usuário está correto.

> !

> **| PASS |**
> ```

---

> ```gherkin
8. **Alterar manualmente o endDate (TO) na Funding Page**
    - Alterar o `endDate` para outra data (diferente da atual).
    - Executar a busca.
    - Verificar que:
      - Os resultados retornados respeitam o novo intervalo (incluindo o `endDate` escolhido).
      - O campo `endDate` mantém a data alterada após a busca, e não volta para a data atual automaticamente.

> !

> **| PASS |**
> ```

---

> ```gherkin
9. **Envio correto de startDate e endDate para a API (Funding)**
    - Realizar uma busca com os valores padrão (startDate conforme regra atual e endDate = data atual).
    - Inspecionar a requisição no Network (se possível).
    - Confirmar que:
      - `from`/`startDate` é enviado no formato esperado pela API.
      - `to`/`endDate` é enviado com a data atual.
    - Repetir mudando `endDate` manualmente e validar que a API recebe a nova data.

> !

> **| PASS |**
> ```

---

> ```gherkin
10. **Integração com outros filtros em Funding**
    - Preencher outros filtros (status, merchant, location, etc.) junto com o intervalo de datas (endDate padrão).
    - Executar a busca.
    - Validar que:
      - A combinação de filtros funciona normalmente.
      - Não há mensagens de erro de data.
      - O `endDate` continua obedecendo o valor esperado (padrão ou modificado).

> !

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
> ## Tests in qa2

1. **TO filled with the current date when opening the page**
    - The `FROM` field keeps the current behavior (no default change).
    - The `TO` field is **automatically filled** with the **current date**.
    - The date format is correct, according to the application standard.
> !

> **| PASS |**

---

2. **User can manually change the TO date**
    - The search considers the chosen `TO` date.
    - The `TO` field keeps the chosen date after the search (does not return automatically to the current date).

> !

> **| PASS |**

---

3. **Compatibility with previous searches (basic regression)**
   - Ensure that no validation/date error appears because of the new default in `TO`.
> !

> **| PASS |**

---

4. **TO filled with the current date on the Leads page**
    - `FROM` keeps the current behavior (same logic before the change).
    - `TO` is automatically filled with the **current date**.
    - The date format is correct.

---

5. **Manually change the TO date in Leads**
    - The search respects the selected `TO` date.
    - The `TO` field keeps the selected date after the results return.
> !

> **| PASS |**

---

6. **Correct sending of the TO date to the API (Leads)**
    - The field corresponding to `TO` in the request is being sent with today’s date, using the format expected by the API (e.g., ISO or configured format).
    - When you manually change `TO`, the request starts sending the modified date.
> !

> **| PASS |**

---

7. **TO (endDate) filled with the current date on the Funding Page**
    - `startDate` (FROM) must keep the current default behavior.
    - `endDate` (TO) must be automatically filled with the **current date**.
    - Verify that the format displayed to the user is correct.
> !

> **| PASS |**

---

8. **Manually change the endDate (TO) on the Funding Page**
    - The returned results respect the new interval (including the chosen `endDate`).
    - The `endDate` field keeps the modified date after the search and does not revert automatically to the current date.
> !

> **| PASS |**

---

9. **Correct sending of startDate and endDate to the API (Funding)**
    - `from`/`startDate` is sent in the format expected by the API.
    - `to`/`endDate` is sent with the current date.
> !

> **| PASS |**

---

10. **Integration with other filters in Funding**
    - The combination of filters works normally.
    - There are no date-related error messages.
    - The `endDate` continues following the expected value (default or modified).
> !

> **| PASS |**

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg

1. **TO filled with the current date when opening the page**
    - The `FROM` field keeps the current behavior (no default change).
    - The `TO` field is **automatically filled** with the **current date**.
    - The date format is correct, according to the application standard.

![image](/uploads/48b87192f4f140a48273770426504363/image.png){width=900 height=188}
![image](/uploads/605522b2e62223bd787955dd4f2b8daf/image.png){width=900 height=210}
![image](/uploads/b688864301600ea0bceada3ccf798e47/image.png){width=900 height=447}

> **| PASS |**

---

2. **User can manually change the TO date**
    - The search considers the chosen `TO` date.
    - The `TO` field keeps the chosen date after the search (does not return automatically to the current date).

> **| PASS |**

---

3. **Compatibility with previous searches (basic regression)**
   - Ensure that no validation/date error appears because of the new default in `TO`.

> **| PASS |**

---

4. **TO filled with the current date on the Leads page**
    - `FROM` keeps the current behavior (same logic before the change).
    - `TO` is automatically filled with the **current date**.
    - The date format is correct.

![image](/uploads/6f890d0c69955683af7680d1f13f6511/image.png){width=900 height=192}
![image](/uploads/894a9d81ff9dd2f9503289e05cefffc0/image.png){width=900 height=193}

> **| PASS |**

---

5. **Manually change the TO date in Leads**
    - The search respects the selected `TO` date.
    - The `TO` field keeps the selected date after the results return.

> **| PASS |**

---

6. **Correct sending of the TO date to the API (Leads)**
    - The field corresponding to `TO` in the request is being sent with today’s date, using the format expected by the API.
    - When you manually change `TO`, the request starts sending the modified date.

![image](/uploads/f0f90e0e31191e9a7889b141dc162feb/image.png){width=900 height=460}

> **| PASS |**

---

7. **TO (endDate) filled with the current date on the Funding Page**
    - `startDate` (FROM) must keep the current default behavior.
    - `endDate` (TO) must be automatically filled with the **current date**.
    - Verify that the format displayed to the user is correct.

![image](/uploads/4e9e88c4df9a8a7b05a0836376e0cbbc/image.png){width=900 height=204}
![image](/uploads/f34947fbcc10c1e1d3823c5167bfdc1d/image.png){width=900 height=195}
![image](/uploads/5d964de837f56438e34e6759f9d25a4a/image.png){width=900 height=193}

> **| PASS |**

---

8. **Manually change the endDate (TO) on the Funding Page**
    - The returned results respect the new interval (including the chosen `endDate`).
    - The `endDate` field keeps the modified date after the search and does not revert automatically to the current date.

> **| PASS |**

---

9. **Correct sending of startDate and endDate to the API (Funding)**
    - `from`/`startDate` is sent in the format expected by the API.
    - `to`/`endDate` is sent with the current date.

![image](/uploads/0993fe9de0c412e09fdcbdf90c958b54/image.png){width=900 height=242}

> **| PASS |**

---

10. **Integration with other filters in Funding**
    - The combination of filters works normally.
    - There are no date-related error messages.
    - The `endDate` continues following the expected value (default or modified).

> **| PASS |**

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------