---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1063

Below is the **final task delivery**, structured, clear, and aligned with the original ticket, provided **in English and Portuguese**.

---

# 🇺🇸 ENGLISH VERSION

## UOWN | Origination | Investigate Missing Lead Details When Searching by SSN in Origination

### Status

Open
Ticket created 6 months ago by Yuri Araujo

---

## Synopsis

It has been observed that when performing searches by **SSN** in the **Origination Portal**, the **most recent leads do not display their full details** in the search results dropdown.

Although the SSN search returns multiple results, some entries—particularly the most recent ones—appear **without complete lead information**, preventing users from accessing the correct lead record directly from the search.

This inconsistent behavior negatively impacts usability and operational efficiency.

(See attached screenshot and video for reference.)

---

## Business Objective

Ensure that the **SSN search functionality consistently returns complete and accurate lead details**, maintaining data integrity and supporting operational workflows that rely on fast and reliable lead identification.

---

## Feature Request / Business Requirements

* Investigate the **SSN search functionality** within the Origination Portal.
* Identify possible root causes for missing lead details, including but not limited to:

  * Backend query logic or ordering issues
  * Time-based filters or indexing problems
  * Permission or visibility constraints
  * Frontend rendering or state-reset issues
* Verify whether the issue is **reproducible across environments**:

  * Sandbox
  * QA
  * Staging
* Identify patterns among affected leads:

  * Creation date
  * Status
  * Origin or merchant
* **Document the root cause**, even if the issue cannot be consistently reproduced.
* If applicable, **propose and implement a fix**.
* Validate that **all lead details are correctly displayed** after searching by SSN.

---

## Testing Steps / Acceptance Criteria

1. Access the Origination Portal.
2. Use the **navbar search** and select **SSN** as the search type.
3. Enter an SSN that returns **multiple results**.
4. Confirm that:

   * All returned leads display complete details (name, phone, lead/account PK).
   * The **most recent leads are visible and selectable**.
   * The **results list does not reset or truncate unexpectedly**.
   * The **leases section at the bottom of the screen remains visible**, as demonstrated in the reference video.
5. Repeat the validation across Sandbox, QA, and Staging environments.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | Origination | Investigar ausência de detalhes do Lead ao buscar por SSN no Origination

### Status

Aberto
Ticket criado há 6 meses por Yuri Araujo

---

## Sinopse

Foi identificado que, ao realizar buscas por **SSN** no **Portal Origination**, os **leads mais recentes não exibem todos os seus detalhes** nos resultados da busca.

Embora a pesquisa por SSN retorne múltiplos registros, alguns resultados — principalmente os mais recentes — aparecem **sem informações completas do lead**, impedindo o acesso correto ao registro desejado diretamente pela busca.

Esse comportamento inconsistente impacta negativamente a usabilidade e a eficiência operacional.

(Ver print e vídeo anexados para referência.)

---

## Objetivo de Negócio

Garantir que a funcionalidade de **busca por SSN retorne sempre os detalhes completos dos leads**, preservando a integridade dos dados e apoiando os fluxos operacionais que dependem dessa informação.

---

## Requisitos de Negócio / Solicitação de Funcionalidade

* Investigar a funcionalidade de **busca por SSN** no Portal Origination.
* Identificar possíveis causas para a ausência de detalhes dos leads, incluindo:

  * Problemas na lógica ou ordenação da query no backend
  * Filtros temporais ou falhas de indexação
  * Restrições de permissão ou visibilidade
  * Problemas de renderização ou reset de estado no frontend
* Verificar se o problema é **reproduzível nos ambientes**:

  * Sandbox
  * QA
  * Staging
* Identificar padrões entre os leads afetados:

  * Data de criação
  * Status
  * Origem ou merchant
* **Documentar a causa raiz**, mesmo que o problema não seja reproduzível de forma consistente.
* Caso necessário, **propor e implementar uma correção**.
* Validar que os **detalhes dos leads são exibidos corretamente** após a busca por SSN.

---

## Passos de Teste / Critérios de Aceite

1. Acessar o Portal Origination.
2. Utilizar a **busca da navbar** selecionando **SSN** como tipo de busca.
3. Informar um SSN que retorne **múltiplos resultados**.
4. Confirmar que:

   * Todos os resultados exibem os dados completos do lead (nome, telefone, lead/account PK).
   * Os **leads mais recentes estão visíveis e selecionáveis**.
   * A lista de resultados **não sofre reset ou corte inesperado**.
   * A **seção de leases na parte inferior da tela permanece visível**, conforme demonstrado no vídeo de referência.
5. Repetir a validação nos ambientes Sandbox, QA e Staging.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 2 arquivos
+
5
−
5
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -30,7 +30,7 @@
    "@seontechnologies/seon-id-verification": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.400",
    "@uownleasing/common-ui": "0.0.401",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1660,10 +1660,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.400":
  version "0.0.400"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.400.tgz#1bdb9dab35a44fb52ff78b0de61da99c7a60c84e"
  integrity sha512-5+Loqz/eudP1GK9nb31pebV1oHA03OBG9pE9zvLAs5SowdoBLOFXB2BncUoF5Bf7svGE23ImLSVMosRyqtmCIw==
"@uownleasing/common-ui@0.0.401":
  version "0.0.401"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.401.tgz#ac49c2da15a9aa3a8dda471df8cf9b6e6f57f8c1"
  integrity sha512-Nhq9X+wIiLHoDKnfWRY4p29LE7POawDydh9EdZ0PYnjQZBlxvMisA06fnZhaqHnwj7gMn5fg0G6BUt6sftmJXw==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"


 2 arquivos
+
185
−
169
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src/lib/navb
‎ar/search-bar‎

inde
‎x.tsx‎
+184 -168

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/navbar/search-bar/index.tsx 
+
184
−
168

Visualizado
import React, { useState, useCallback, useEffect } from 'react';
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import {
  Form,
  Input,
@@ -10,9 +16,6 @@ import {
  DropdownToggle,
  UncontrolledDropdown,
  DropdownMenu,
  Modal,
  ModalHeader,
  ModalBody,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { light } from '@fortawesome/fontawesome-svg-core/import.macro';
@@ -22,14 +25,16 @@ import { SearchResult } from '../../../models/search-results';
import { isEqual } from '@uownleasing/common-utilities';
import { AccountStatus, CustomerStatus, ResponseType, SearchType } from 'src';
import { debounce } from 'lodash';
import { faChevronDown, faChevronUp, faArrowUpRightFromSquare } from '@fortawesome/pro-light-svg-icons';
import {
  faChevronDown,
  faChevronUp,
  faArrowUpRightFromSquare,
} from '@fortawesome/pro-light-svg-icons';
import { SearchResultModal } from '../search-result-modal';

export interface SearchResultItem {
  label: string;
  key: string;
}

interface SearchBarProps {
  getSimpleSearchResults: (
    quickSearchRequest: string,
@@ -68,12 +73,15 @@ export const SearchBar = (props: SearchBarProps) => {

  const [quickSearchRequest, setQuickSearchRequest] = useState('');
  const [isShowingResults, setIsShowingResults] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(quickSearchResults);
  const [searchResults, setSearchResults] =
    useState<SearchResult[]>(quickSearchResults);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [itemIndex, setItemIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState<boolean>(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  const { mainLoggedInPage, searchBarPlaceholder } = config || {};
  const isOrigination = mainLoggedInPage === '/overview';
@@ -141,6 +149,18 @@ export const SearchBar = (props: SearchBarProps) => {
    }
  }, []);

  // Preserve scroll position when hover state changes
  useLayoutEffect(() => {
    if (resultsContainerRef.current) {
      const container = resultsContainerRef.current;
      // Only preserve scroll if container is scrollable
      if (container.scrollHeight > container.clientHeight) {
        // Restore the previously stored scroll position
        container.scrollTop = scrollPositionRef.current;
      }
    }
  }, [showMoreDetails, itemIndex]);

  const hasSearchTypes =
    searchTypeOptions &&
    Array.isArray(searchTypeOptions) &&
@@ -162,188 +182,186 @@ export const SearchBar = (props: SearchBarProps) => {

  const placeHolder = hasSearchTypes && `Quick search by ${searchType}`;


  function SearchResults() {
    let mainContent;
    if (isLoading) {
      mainContent =  <div className={classNames(styles?.loadingText)}>Loading...</div>
      mainContent = (
        <div className={classNames(styles?.loadingText)}>Loading...</div>
      );
    }

    if (!isLoading && (searchResults || []).length > 0) {
      mainContent = (
        <>
          {
            searchResults.map((result: SearchResult, index) => {
              const pathname = isOrigination
                ? `/customers/${result?.leadPk}`
                : `/customer-information/${result?.accountPk}`;
              const isCancelledOnServicing =
                !isOrigination &&
                isEqual(result?.accountStatus, AccountStatus.CANCELLED);
              const isPaidOut =
                isEqual(result?.accountStatus, AccountStatus.PAID_OUT) ||
                isEqual(
                  result?.accountStatus,
                  AccountStatus.PAID_OUT_EARLY
                );
              const isCancelledDupSSN = isEqual(
                result?.leadStatus,
                CustomerStatus.CANCELLED_DUP_SSN
              );
              const isDenied =
                isEqual(result?.leadStatus, CustomerStatus.UW_DENIED) ||
                isEqual(result?.leadStatus, CustomerStatus.DENIED) ||
                isEqual(result?.leadStatus, CustomerStatus.UW_REVIEW);
              return (
                <div
                  key={`${result?.leadPk || result?.accountPk} - ${index}`}
                  className={classNames(
                    isDenied && styles?.deniedSearchResult,
                    isCancelledDupSSN && styles?.cancelledDupSsn,
                    isCancelledOnServicing && styles?.cancelledDupSsn,
                    isPaidOut && styles?.paidOut,
                    styles?.searchBarQuickSearchResultItem
                  )}
                  onMouseOver={() => {
                    setItemIndex(index);
                    setShowMoreDetails(true);
                  }}
                  onClick={(e) => onSearchResultItemClick(result, e)}
                >
                  <a href={pathname}>
                    <Row>
                      {searchResultColumns?.map(
                        (column: SearchResultItem, i: number) => {
                          const columnKey = column?.key || '';
                          let valueToShow =
                            result?.[columnKey as keyof typeof result];

                          if (columnKey === 'rtoAccountNumber') {
                            valueToShow = !valueToShow
                              ? `L${result?.leadPk}`
                              : `R${valueToShow}`;
                          }
          {searchResults.map((result: SearchResult, index) => {
            const pathname = isOrigination
              ? `/customers/${result?.leadPk}`
              : `/customer-information/${result?.accountPk}`;
            const isCancelledOnServicing =
              !isOrigination &&
              isEqual(result?.accountStatus, AccountStatus.CANCELLED);
            const isPaidOut =
              isEqual(result?.accountStatus, AccountStatus.PAID_OUT) ||
              isEqual(result?.accountStatus, AccountStatus.PAID_OUT_EARLY);
            const isCancelledDupSSN = isEqual(
              result?.leadStatus,
              CustomerStatus.CANCELLED_DUP_SSN
            );
            const isDenied =
              isEqual(result?.leadStatus, CustomerStatus.UW_DENIED) ||
              isEqual(result?.leadStatus, CustomerStatus.DENIED) ||
              isEqual(result?.leadStatus, CustomerStatus.UW_REVIEW);
            return (
              <div
                key={`${result?.leadPk || result?.accountPk} - ${index}`}
                className={classNames(
                  isDenied && styles?.deniedSearchResult,
                  isCancelledDupSSN && styles?.cancelledDupSsn,
                  isCancelledOnServicing && styles?.cancelledDupSsn,
                  isPaidOut && styles?.paidOut,
                  styles?.searchBarQuickSearchResultItem
                )}
                onMouseOver={() => {
                  // Store scroll position before state update
                  if (resultsContainerRef.current) {
                    scrollPositionRef.current =
                      resultsContainerRef.current.scrollTop;
                  }
                  setItemIndex(index);
                  setShowMoreDetails(true);
                }}
                onClick={(e) => onSearchResultItemClick(result, e)}
              >
                <a href={pathname}>
                  <Row>
                    {searchResultColumns?.map(
                      (column: SearchResultItem, i: number) => {
                        const columnKey = column?.key || '';
                        let valueToShow =
                          result?.[columnKey as keyof typeof result];

                          return (
                            <Col
                              key={`${column?.label} - ${i}`}
                              className="text-truncate"
                            >
                              {valueToShow}
                            </Col>
                          );
                        if (columnKey === 'rtoAccountNumber') {
                          valueToShow = !valueToShow
                            ? `L${result?.leadPk}`
                            : `R${valueToShow}`;
                        }
                      )}
                    </Row>
                  </a>
                  {moreResultsColumn &&
                    moreResultsColumn?.length > 0 &&
                    showMoreDetails &&
                    itemIndex === index && (
                      <div className="ml-1 mt-1 border border-dark text-dark">
                        <div
                          className={classNames(
                            styles?.moreResults__titleBg
                          )}
                          onClick={(e) => e?.stopPropagation()}
                        >
                          <Row>
                            {moreResultsColumn?.map((column, i: number) => {

                        return (
                          <Col
                            key={`${column?.label} - ${i}`}
                            className="text-truncate"
                          >
                            {valueToShow}
                          </Col>
                        );
                      }
                    )}
                  </Row>
                </a>
                {moreResultsColumn &&
                  moreResultsColumn?.length > 0 &&
                  showMoreDetails &&
                  itemIndex === index && (
                    <div className="ml-1 mt-1 border border-dark text-dark">
                      <div
                        className={classNames(styles?.moreResults__titleBg)}
                        onClick={(e) => e?.stopPropagation()}
                      >
                        <Row>
                          {moreResultsColumn?.map((column, i: number) => {
                            return (
                              <Col
                                key={`${column?.label} - ${i}`}
                                className="text-truncate"
                              >
                                {column?.label}
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                      <a
                        href={pathname}
                        onClick={(e) => onSearchResultItemClick(result, e)}
                      >
                        <Row>
                          {moreResultsColumn?.map(
                            (column: SearchResultItem, i: number) => {
                              const columnKey = column?.key || '';
                              const valueToShow =
                                result?.[columnKey as keyof typeof result];

                              return (
                                <Col
                                  key={`${column?.label} - ${i}`}
                                  className="text-truncate"
                                  className={classNames(
                                    'text-truncate',
                                    styles?.moreResults__value
                                  )}
                                >
                                  {column?.label}
                                  {valueToShow}
                                </Col>
                              );
                            })}
                          </Row>
                        </div>
                        <a
                          href={pathname}
                          onClick={(e) =>
                            onSearchResultItemClick(result, e)
                          }
                        >
                          <Row>
                            {moreResultsColumn?.map(
                              (column: SearchResultItem, i: number) => {
                                const columnKey = column?.key || '';
                                const valueToShow =
                                  result?.[
                                  columnKey as keyof typeof result
                                  ];

                                return (
                                  <Col
                                    key={`${column?.label} - ${i}`}
                                    className={classNames(
                                      'text-truncate',
                                      styles?.moreResults__value
                                    )}
                                  >
                                    {valueToShow}
                                  </Col>
                                );
                              }
                            )}
                          </Row>
                        </a>
                      </div>
                    )}
                </div>
              );
            })
          }
                            }
                          )}
                        </Row>
                      </a>
                    </div>
                  )}
              </div>
            );
          })}
        </>
      )
      );
    } else {
      mainContent = (
        <div className={classNames(styles?.loadingText)}>
          No results found
        </div>
        <div className={classNames(styles?.loadingText)}>No results found</div>
      );
    }

    return (
      <div
      className={classNames(
        styles?.searchBarQuickSearchResults,
        isMobileMenuOpen && styles?.searchBarQuickSearchMobileMenu,
        isModelOpen && styles?.searchBarQuickSearchResultsInModel,
      )}
      onMouseLeave={() => {
        setItemIndex(null);
        setShowMoreDetails(false);
      }}
    >
      <div className={styles?.searchBarQuickSearchResultsContainer}>
        <Row>
          {searchResultColumns?.map((column, i) => {
            const isLastCol = searchResultColumns.length - 1 === i;
            return (
              <Col
                key={`${column?.label} - ${i}`}
                className={`text-truncate ${isLastCol ? styles.lastCol : ''}`}
              >
                {column?.label}
                {
                  isLastCol && !isModelOpen && (
        ref={resultsContainerRef}
        className={classNames(
          styles?.searchBarQuickSearchResults,
          isMobileMenuOpen && styles?.searchBarQuickSearchMobileMenu,
          isModelOpen && styles?.searchBarQuickSearchResultsInModel
        )}
        onScroll={() => {
          // Keep scroll position ref in sync during manual scrolling
          if (resultsContainerRef.current) {
            scrollPositionRef.current = resultsContainerRef.current.scrollTop;
          }
        }}
        onMouseLeave={() => {
          setItemIndex(null);
          setShowMoreDetails(false);
        }}
      >
        <div className={styles?.searchBarQuickSearchResultsContainer}>
          <Row>
            {searchResultColumns?.map((column, i) => {
              const isLastCol = searchResultColumns.length - 1 === i;
              return (
                <Col
                  key={`${column?.label} - ${i}`}
                  className={`text-truncate ${isLastCol ? styles.lastCol : ''}`}
                >
                  {column?.label}
                  {isLastCol && !isModelOpen && (
                    <FontAwesomeIcon
                      onClick={() => setIsModelOpen(true)}
                      icon={faArrowUpRightFromSquare}
                  />
                  )
                }
              </Col>
            );
          })}
        </Row>
                    />
                  )}
                </Col>
              );
            })}
          </Row>
        </div>
        {mainContent}
      </div>
      {mainContent}
    </div>
    )
    );
  }

  return (
@@ -432,7 +450,9 @@ export const SearchBar = (props: SearchBarProps) => {
              type="search"
              autoComplete="off"
              name="search"
              placeholder={placeHolder || searchBarPlaceholder || 'Quick search'}
              placeholder={
                placeHolder || searchBarPlaceholder || 'Quick search'
              }
              onChange={handleChange}
            />
          </div>
@@ -441,13 +461,9 @@ export const SearchBar = (props: SearchBarProps) => {
              <FontAwesomeIcon icon={light('search')} color="black" />
            </InputGroupText>
          )}
          {quickSearchRequest && isShowingResults && (
              <SearchResults />
          )}
          {quickSearchRequest && isShowingResults && <SearchResults />}
        </InputGroup>
      </Form>
    </>
  );
};

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

```gherkin
Feature: Busca global Origination

  Scenario: Exibir resultados ao realizar busca parcial por identificadores numéricos
    Given o usuário acessa o Portal
    And o campo de busca global está disponível
    When é digitada parte de um identificador numérico válido
      | tipo           |
      | invoice        |
      | ssn            |
      | last 4 cc      |
    Then os resultados correspondentes são exibidos
    And os resultados apresentam dados completos do lead ou conta
    And os registros mais recentes estão visíveis
R91931
000298792
6909
lois
fintechgroup777@gmail.com
1234567890
  Scenario: Exibir resultados ao realizar busca parcial por identificadores textuais
    Given o usuário acessa o Portal Origination
    And o campo de busca global está disponível
    When é digitada parte de um identificador textual válido
      | tipo  |
      | nome  |
      | email |
      | phone |
    Then os resultados correspondentes são exibidos
    And os resultados apresentam dados completos do lead ou conta

  Scenario: Manter estabilidade da lista de resultados durante interação
    Given resultados múltiplos são exibidos na busca
    When o cursor navega entre os itens da lista
    And detalhes adicionais são exibidos por hover
    Then a lista de resultados não é reiniciada
    And a posição de scroll é preservada

  Scenario: Navegar corretamente ao selecionar um resultado da busca
    Given resultados são exibidos na busca global
    When um resultado é selecionado
    Then a navegação ocorre para o registro correspondente
    And o registro selecionado é exibido corretamente

  Scenario: Manter visibilidade da seção de leases após busca
    Given a página exibe a seção de leases
    When uma busca parcial é realizada
    Then a seção de leases permanece visível
    And a busca não bloqueia o conteúdo da página

```

---
---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

### Feature: Origination Global Search

```gherkin

  Scenario: Display results when performing partial search by numeric identifiers
    Given the user accesses the Portal
    And the global search field is available
    When part of a valid numeric identifier is entered
      | type      |
      | invoice   |
      | ssn       |
      | last 4 cc |
    Then the corresponding results are displayed
    And the results show complete lead or account details
    And the most recent records are visible
```
![Screenshot_at_Jan_08_05-58-36](/uploads/599ec2125e254b631f91d7b11bf96b6c/Screenshot_at_Jan_08_05-58-36.png){width=900 height=168}

![Screenshot_at_Jan_08_08-22-58](/uploads/c03ffbb00b09c1e57882640c94128752/Screenshot_at_Jan_08_08-22-58.png){width=900 height=163}

![Screenshot_at_Jan_08_09-24-34](/uploads/e6e9ca2db8236a9fb8b9556bb13e4450/Screenshot_at_Jan_08_09-24-34.png){width=900 height=164}

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin

  Scenario: Display results when performing partial search by textual identifiers
    Given the user accesses the Origination Portal
    And the global search field is available
    When part of a valid textual identifier is entered
      | type  |
      | name  |
      | email |
      | phone |
    Then the corresponding results are displayed
```
![Screenshot_at_Jan_08_09-27-40](/uploads/407f293c37b8e50cb82b68c1d536e072/Screenshot_at_Jan_08_09-27-40.png){width=900 height=165}

![Screenshot_at_Jan_08_09-28-22](/uploads/1fe34ac5faa73288a39708773cf57823/Screenshot_at_Jan_08_09-28-22.png){width=900 height=165}

![Screenshot_at_Jan_08_09-32-07](/uploads/aa3fa271d949bcad554c0aafa2d53812/Screenshot_at_Jan_08_09-32-07.png){width=900 height=164}

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin

  Scenario: Keep the results list stable during interaction
    Given multiple results are displayed in the search
    When the cursor navigates through the result items
    And additional details are displayed on hover
    Then the results list is not reset
    And the scroll position is preserved
```

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin

  Scenario: Navigate correctly when selecting a search result
    Given results are displayed in the global search
    When a result is selected
    Then navigation occurs to the corresponding record
    And the selected record is displayed correctly
```

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin

  Scenario: Keep leases section visible after search
    Given the page displays the leases section
    When a partial search is performed
    Then the leases section remains visible
    And the search does not block the page content
```

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

![REC-20260108094108](/uploads/65bff0d6a60cfd35ac56ff3e496053f1/REC-20260108094108.mp4){width=900 height=448}

---------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in stg

### Feature: Origination Global Search

```gherkin

  Scenario: Display results when performing partial search by numeric identifiers
    Given the user accesses the Portal
    And the global search field is available
    When part of a valid numeric identifier is entered
      | type      |
      | invoice   |
      | ssn       |
      | last 4 cc |
    Then the corresponding results are displayed
    And the results show complete lead or account details
    And the most recent records are visible
```


**| PASS |**


---

```gherkin

  Scenario: Display results when performing partial search by textual identifiers
    Given the user accesses the Origination Portal
    And the global search field is available
    When part of a valid textual identifier is entered
      | type  |
      | name  |
      | email |
      | phone |
    Then the corresponding results are displayed
```


**| PASS |**

---

```gherkin

  Scenario: Keep the results list stable during interaction
    Given multiple results are displayed in the search
    When the cursor navigates through the result items
    And additional details are displayed on hover
    Then the results list is not reset
    And the scroll position is preserved
```

**| PASS |**


---

```gherkin

  Scenario: Navigate correctly when selecting a search result
    Given results are displayed in the global search
    When a result is selected
    Then navigation occurs to the corresponding record
    And the selected record is displayed correctly
```

**| PASS |**


---

```gherkin

  Scenario: Keep leases section visible after search
    Given the page displays the leases section
    When a partial search is performed
    Then the leases section remains visible
    And the search does not block the page content
```

**| PASS |**


---