---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## 🇺🇸 QA Task – English Version

### **Title**

UOWN | SVC | Optimize search by removing row-by-row UUID handling in backend (Next.js)

---

### **Context**

The system has been facing performance degradation in search operations that return a very large number of records.
Currently, the Next.js backend iterates over all returned rows to remove the `UUID` field for users who do not have permission to view it.

Since January 1st, this query has been returning approximately **89,000 records**, making the row-by-row processing highly expensive and negatively impacting performance and database usage.

---

### **Business Objective**

Ensure that the performance optimization:

* Reduces processing time and system resource usage
* Eliminates unnecessary iteration over large datasets
* Preserves existing functional behavior of the search feature

---

### **Scope of QA Validation**

#### **Functional Validation**

1. Validate that search results remain **functionally identical** to the previous behavior.
2. Confirm that:

   * Users **with permission** can see the `UUID` field.
   * Users **without permission** do **not** receive the `UUID` field in the response.
3. Ensure permissions are correctly read **directly from the auth token**.
4. Validate that no regressions were introduced in:

   * Search filters
   * Pagination
   * Sorting
   * Returned data structure (except for UUID omission where applicable).

#### **Non-Functional / Performance Validation**

5. Validate that the backend no longer loops through each row to remove UUIDs.
6. Compare response time and overall behavior against previous versions (qualitative validation).
7. Ensure the API handles large result sets (tens of thousands of records) without noticeable degradation.

---

### **Steps to Test**

1. Authenticate with a user **without permission** to view UUIDs.
2. Perform a search that returns a large dataset.
3. Validate that:

   * The response does **not** contain the `UUID` field.
   * The search completes successfully and within acceptable time.
4. Authenticate with a user **with permission** to view UUIDs.
5. Repeat the same search.
6. Validate that:

   * The `UUID` field is present.
   * The returned data matches expectations.
7. Repeat the tests across environments where the fix was deployed (dev1, qa1, sandbox, as applicable).

---

### **Expected Result**

* Search behavior remains unchanged from a functional perspective.
* UUID visibility is correctly controlled by permissions.
* Performance is improved due to removal of row-by-row UUID handling.
* No regressions or side effects are introduced.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇧🇷 Tarefa de QA – Versão em Português

### **Título**

UOWN | SVC | Otimizar busca removendo o tratamento de UUID linha a linha no backend (Next.js)

---

### **Contexto**

O sistema vinha apresentando problemas de performance em buscas que retornam um volume muito grande de registros.
Atualmente, o backend em Next.js percorre todas as linhas retornadas pela API para remover o campo `UUID` dos usuários que não possuem permissão para visualizá-lo.

Desde 1º de janeiro, essa consulta passou a retornar aproximadamente **89 mil registros**, tornando esse processamento linha a linha extremamente custoso, impactando negativamente a performance e o uso do banco de dados.

---

### **Objetivo de Negócio**

Garantir que a otimização implementada:

* Reduza o tempo de processamento e o consumo de recursos
* Elimine processamento desnecessário em grandes volumes de dados
* Preserve integralmente o comportamento funcional da busca

---

### **Escopo da Validação de QA**

#### **Validação Funcional**

1. Validar que os resultados da busca permanecem **funcionalmente idênticos** ao comportamento anterior.
2. Confirmar que:

   * Usuários **com permissão** visualizam o campo `UUID`.
   * Usuários **sem permissão** **não** recebem o campo `UUID` na resposta.
3. Garantir que as permissões são lidas corretamente **diretamente do token de autenticação**.
4. Validar que não houve regressão em:

   * Filtros de busca
   * Paginação
   * Ordenação
   * Estrutura do payload retornado (exceto pela omissão do UUID quando aplicável).

#### **Validação Não Funcional / Performance**

5. Validar que o backend **não percorre mais linha a linha** para remover o UUID.
6. Comparar qualitativamente o tempo de resposta com versões anteriores.
7. Garantir que a API suporta buscas com grande volume de registros sem degradação perceptível.

---

### **Passos para Teste**

1. Autenticar com um usuário **sem permissão** para visualizar UUID.
2. Executar uma busca que retorne um grande volume de dados.
3. Validar que:

   * O campo `UUID` **não** está presente na resposta.
   * A busca é concluída com sucesso e em tempo aceitável.
4. Autenticar com um usuário **com permissão** para visualizar UUID.
5. Repetir a mesma busca.
6. Validar que:

   * O campo `UUID` está presente.
   * Os dados retornados estão corretos.
7. Repetir os testes nos ambientes onde o ajuste foi implantado (dev1, qa1, sandbox, conforme aplicável).

---

### **Resultado Esperado**

* O comportamento funcional da busca permanece inalterado.
* A exibição do UUID respeita corretamente as permissões.
* A performance é melhorada com a remoção do processamento linha a linha.
* Nenhuma regressão ou efeito colateral é introduzido.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:
Comparar
e
 1 arquivo
+
0
−
10
 server.js 
+
0
−
10

Visualizado
@@ -904,9 +904,6 @@ const proxy = {
            const pathHasNotesPermissions = reqPath.includes(
              '/uown/los/getLogsForLead/',
            );
            const isPathGetLeadsInDateRange = reqPath.includes(
              '/uown/getLeadsInDateRange',
            );
            const isPathGetAllMerchants = reqPath.startsWith(
              '/uown/getAllMerchants',
            );
@@ -1094,13 +1091,6 @@ const proxy = {
              });
            }

            // Masks UUIDs for users without permissions.
            if (isPathGetLeadsInDateRange) {
              if (body?.leads) {
                body.leads = uuidMask(permissions, body?.leads);
              }
            }

            if (isPathGetAllMerchants || isPathGetMerchantsByCriteria) {
              const merchants = body?.merchants;
              if (



---------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa1

---

### **Cenário 1: Buscar aplicações com grande volume de registros**

```markdown
- Dado que o usuário acessa a tela de busca de aplicações
- Quando o usuário realiza uma busca que retorna aproximadamente 9.000 registros
- Então a busca deve retornar um grande volume de resultados
- E os resultados devem ser exibidos corretamente na interface
- E nenhuma falha funcional deve ocorrer durante o carregamento
```

Screenshot

**PASS**

---

### **Cenário Esquema 2: Disponibilidade do UUID no response da API independentemente da permissão**

```markdown
- Dado que o usuário acessa a tela de busca de aplicações
- E o usuário possui <permission_state> a permissão "overview uuid [view]"
- Quando a busca é executada com sucesso
- Então o UUID da aplicação deve estar presente no response da API
```

Exemplos:

| permission_state |
| ---------------- |
| com              |
| sem              |

Screenshot

**PASS**

---

### **Cenário Esquema 3: Visibilidade da coluna UUID controlada pela permissão na interface**

```markdown
- Dado que o usuário acessa a tela de busca de aplicações
- E o usuário possui <permission_state> a permissão "overview uuid [view]"
- Quando a busca é executada
- Então a coluna UUID deve estar <uuid_visibility> na interface
```

Exemplos:

| permission_state | uuid_visibility |
| ---------------- | --------------- |
| com              | exibida         |
| sem              | oculta          |

Screenshot

**PASS**

---

### **Cenário 4: Navegação entre páginas de resultados da busca**

```markdown
- Dado que uma busca com resultados foi realizada
- Quando o usuário navega entre as páginas de resultados
- Então os dados exibidos devem permanecer consistentes
- E os filtros aplicados devem ser mantidos
```

Screenshot

**PASS**

---

### **Cenário Esquema 5: Alteração da quantidade de resultados exibidos por página**

```markdown
- Dado que uma busca com resultados foi realizada
- Quando o usuário altera a quantidade de registros exibidos por página para <page_size>
- Então a lista de resultados deve ser atualizada corretamente
- E os critérios da busca devem ser preservados
```

Exemplos:

| page_size |
| --------- |
| 10        |
| 25        |
| 50        |

Screenshot

**PASS**

---

Perfeito. Abaixo está o **Cenário 6 melhorado**, refletindo corretamente o **comportamento condicional da coluna UUID no CSV**, usando **Scenario Outline** (onde faz sentido) e mantendo o seu padrão.

---
### **Scenario Outline 6: Export search results to CSV respecting UUID permission**

```markdown
- Given a search with a large volume of records has been performed
- And the user has <permission_state> the "overview uuid [view]" permission
- When the user downloads the CSV file
- Then the file should contain exactly the records returned by the search
- And the CSV file should <uuid_column_behavior> the UUID column
- And the data should be consistent with what is displayed in the interface
```

Examples:

| permission_state | uuid_column_behavior |
| ---------------- | -------------------- |
| with             | include              |
| without          | not include          |

Screenshot

**PASS**

---

### **Cenário 7: Envio dos resultados da busca por email**

```markdown
- Dado que uma busca com resultados foi realizada
- Quando o usuário envia a lista de aplicações por email
- Então o email deve conter os mesmos registros retornados pela busca
- E os dados enviados devem estar consistentes com a interface e com o CSV exportado
```

Screenshot

**PASS**

---

### **Cenário Esquema 8: Validação qualitativa de performance da busca**

```markdown
- Dado que o usuário realiza uma busca com grande volume de dados
- Quando aproximadamente <record_count> registros são retornados
- Então a busca deve ser concluída com sucesso
- E o tempo de resposta deve ser de aproximadamente <response_time>
- E nenhuma instabilidade funcional deve ser observada
```

Exemplos:

| record_count | response_time |
| ------------ | ------------- |
| 9000         | ~30s          |

Screenshot

**PASS**

---


---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---
### **Scenario 1: Search applications with a large volume of records**

```markdown
- Given the user is on the application search screen
- When the user performs a search that returns approximately 9,000 records
- Then the search should return a large volume of results
- And the results should be displayed correctly in the interface
- And no functional failure should occur during loading
```

![Screenshot_at_Jan_21_12-20-00](/uploads/38c17c62631d5617b1154c45c1045042/Screenshot_at_Jan_21_12-20-00.png){width=900 height=464}
![Screenshot_at_Jan_21_12-17-51](/uploads/8ac9c2179eb7515a6f44fd84d3fd3322/Screenshot_at_Jan_21_12-17-51.png){width=900 height=465}

**PASS**

---
### **Scenario Outline 2: UUID availability in API response regardless of permission**

```markdown
- Given the user is on the application search screen
- And the user has <permission_state> the "overview uuid [view]" permission
- When the search is executed successfully
- Then the application UUID should be present in the API response
```

Examples:
| permission_state |
| ---------------- |
| with             |
| without          |

![Screenshot_at_Jan_21_12-14-20](/uploads/1eabb84ee11a53cb3a1155a1c33be34d/Screenshot_at_Jan_21_12-14-20.png){width=840 height=110}
![Screenshot_at_Jan_21_12-21-50](/uploads/4d9392b9b96b4ea9829d6b9d48d7b0fe/Screenshot_at_Jan_21_12-21-50.png){width=900 height=454}
![Screenshot_at_Jan_21_13-18-25](/uploads/cc6f9c1600e18a6ea4590dbf5458356a/Screenshot_at_Jan_21_13-18-25.png){width=605 height=355}
![Screenshot_at_Jan_21_12-15-26](/uploads/a191771b695ee9253d4197eb765bad17/Screenshot_at_Jan_21_12-15-26.png){width=846 height=133}
![Screenshot_at_Jan_21_13-18-25](/uploads/50d2a001a12b9b768e644887fcf46a51/Screenshot_at_Jan_21_13-18-25.png){width=605 height=355}

**PASS**

---
### **Scenario Outline 3: UUID column visibility controlled by interface permission**

```markdown
- Given the user is on the application search screen
- And the user has <permission_state> the "overview uuid [view]" permission
- When the search is executed
- Then the UUID column should be <uuid_visibility> in the interface
```

Examples:
| permission_state | uuid_visibility |
| ---------------- | --------------- |
| with             | displayed       |
| without          | hidden          |

![Screenshot_at_Jan_21_12-14-20](/uploads/02966022dccb0e820d5e46240fa06a53/Screenshot_at_Jan_21_12-14-20.png){width=840 height=110}
![Screenshot_at_Jan_21_12-21-50](/uploads/de64bf701d51c0f1d0e176bd1636f463/Screenshot_at_Jan_21_12-21-50.png){width=900 height=454}
![Screenshot_at_Jan_21_12-15-26](/uploads/6bae094b8eb0aef4c156a1ae2371af86/Screenshot_at_Jan_21_12-15-26.png){width=846 height=133}
![Screenshot_at_Jan_21_12-17-51](/uploads/5a17c35ab8e4cd0aad77ca95243a36ce/Screenshot_at_Jan_21_12-17-51.png){width=900 height=465}

**PASS**

---
### **Scenario 4: Navigation between search result pages**

```markdown
- Given a search with results has been performed
- When the user navigates between result pages
- Then the displayed data should remain consistent
- And the applied filters should be preserved
```

**PASS**

---
### **Scenario Outline 5: Change number of results displayed per page**

```markdown
- Given a search with results has been performed
- When the user changes the number of records displayed per page to <page_size>
- Then the results list should be updated correctly
- And the search criteria should be preserved
```

Examples:
| page_size |
| --------- |
| 10        |
| 25        |
| 50        |


**PASS**

---
### **Scenario Outline 6: Export search results to CSV respecting UUID permission**

```markdown
- Given a search with a large volume of records has been performed
- And the user has <permission_state> the "overview uuid [view]" permission
- When the user downloads the CSV file
- Then the file should contain exactly the records returned by the search
- And the CSV file should <uuid_column_behavior> the UUID column
- And the data should be consistent with what is displayed in the interface
```

Examples:
| permission_state | uuid_column_behavior |
| ---------------- | -------------------- |
| with             | include              |
| without          | not include          |


**PASS**

---
### **Scenario 7: Send search results via email**

```markdown
- Given a search with results has been performed
- When the user sends the list of applications via email
- Then the email should contain the same records returned by the search
- And the sent data should be consistent with the interface and the exported CSV
```

**PASS**

---
### **Scenario Outline 8: Qualitative validation of search performance**

```markdown
- Given the user performs a search with a large volume of data
- When approximately <record_count> records are returned
- Then the search should complete successfully
- And the response time should be around <response_time>
- And no functional instability should be observed
```

Examples:
| record_count | response_time |
| ------------ | ------------- |
| 9000         | ~30s          |

![Screenshot_at_Jan_21_12-17-26](/uploads/45e6b247b2e7953685d5f7af480817fa/Screenshot_at_Jan_21_12-17-26.png){width=900 height=467}
![Screenshot_at_Jan_21_12-17-51](/uploads/5dd0cfdb9f7bc9eef783fae0837da00e/Screenshot_at_Jan_21_12-17-51.png){width=900 height=465}
![Screenshot_at_Jan_21_12-20-00](/uploads/d9364bff415efb50ac6eef5f8b760a5d/Screenshot_at_Jan_21_12-20-00.png){width=900 height=464}
![Screenshot_at_Jan_21_12-21-50](/uploads/83af93a9459850cfbe90140d2ac84bf0/Screenshot_at_Jan_21_12-21-50.png){width=900 height=454}

**PASS**

---


---------------------------------------------------------------------------------------------------------------------------------------------------------
STG

## Tests in stg

---
### **Scenario 1: Search applications with a large volume of records**

```markdown
- Given the user is on the application search screen
- When the user performs a search that returns approximately 13,000 records
- Then the search should return a large volume of results
- And the results should be displayed correctly in the interface
- And no functional failure should occur during loading
```


**PASS**

---
### **Scenario Outline 2: UUID availability in API response regardless of permission**

```markdown
- Given the user is on the application search screen
- And the user has <permission_state> the "overview uuid [view]" permission
- When the search is executed successfully
- Then the application UUID should be present in the API response
```

Examples:
| permission_state |
| ---------------- |
| with             |
| without          |



**PASS**

---
### **Scenario Outline 3: UUID column visibility controlled by interface permission**

```markdown
- Given the user is on the application search screen
- And the user has <permission_state> the "overview uuid [view]" permission
- When the search is executed
- Then the UUID column should be <uuid_visibility> in the interface
```

Examples:
| permission_state | uuid_visibility |
| ---------------- | --------------- |
| with             | displayed       |
| without          | hidden          |



**PASS**

---
### **Scenario 4: Navigation between search result pages**

```markdown
- Given a search with results has been performed
- When the user navigates between result pages
- Then the displayed data should remain consistent
- And the applied filters should be preserved
```

**PASS**

---
### **Scenario Outline 5: Change number of results displayed per page**

```markdown
- Given a search with results has been performed
- When the user changes the number of records displayed per page to <page_size>
- Then the results list should be updated correctly
- And the search criteria should be preserved
```

Examples:
| page_size |
| --------- |
| 10        |
| 50        |
| 100        |


**PASS**

---
### **Scenario Outline 6: Export search results to CSV respecting UUID permission**

```markdown
- Given a search with a large volume of records has been performed
- And the user has <permission_state> the "overview uuid [view]" permission
- When the user downloads the CSV file
- Then the file should contain exactly the records returned by the search
- And the CSV file should <uuid_column_behavior> the UUID column
- And the data should be consistent with what is displayed in the interface
```

Examples:
| permission_state | uuid_column_behavior |
| ---------------- | -------------------- |
| with             | include              |
| without          | not include          |


**PASS**

---
### **Scenario 7: Send search results via email**

```markdown
- Given a search with results has been performed
- When the user sends the list of applications via email
- Then the email should contain the same records returned by the search
- And the sent data should be consistent with the interface and the exported CSV
```

**PASS**

---
### **Scenario Outline 8: Qualitative validation of search performance**

```markdown
- Given the user performs a search with a large volume of data
- When approximately <record_count> records are returned
- Then the search should complete successfully
- And the response time should be around <response_time>
- And no functional instability should be observed
```

Examples:
| record_count | response_time |
| ------------ | ------------- |
| 13000         | ~15s          |



**PASS**

---
