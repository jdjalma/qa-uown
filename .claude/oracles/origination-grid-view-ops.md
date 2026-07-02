---
operation: origination-grid-view-ops
description: Operações de grid da Origination — filtros multi-select de Merchant/Location (aplicar/limpar/select-all/persistência/CSV, Task #1292) e reordenação das colunas de nome do cliente com regressão de sort/filtro/paginação/CSV/Config Columns (RU05.26.1.52.0). Um único bucket de feature — a tabela de resultados configurável (colunas + filtros) das telas Overview, Leads, Funding, Open To Buy, Rebate, Merchant list, Merchant Setting e New Application.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/origination/multi-select-filters.spec.ts
  - tests/e2e/origination/RU05.26.1.52.0_reorderCustomerNameColumnsToImproveVisibility.spec.ts
  - src/pages/origination/merchant-location-filter.po.ts
  - src/pages/origination/overview.page.ts
  - src/pages/origination/leads.page.ts
  - src/pages/origination/funding.page.ts
  - src/pages/origination/open-to-buy.page.ts
  - src/pages/origination/rebate.page.ts
  - src/pages/origination/merchant-list.page.ts
  - src/pages/origination/merchant-setting.page.ts
  - src/pages/origination/new-application-filters.page.ts
  - src/selectors/common.selectors.ts
  - src/helpers/table.helpers.ts
  - docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
---

# Origination — Operações de Grid (Filtros Multi-Select + Reordenação de Colunas)

> **Gatilho:** qualquer operação sobre a tabela de resultados configurável da Origination — (a) aplicar/limpar/select-all os filtros **multi-select de Merchant/Location** e o export CSV que os honra (Task #1292); ou (b) verificar a **ordem das colunas de nome do cliente** e a regressão de sort/filtro/paginação/CSV/Config Columns (RU05.26.1.52.0). Telas cobertas: Overview, Leads, Funding, Open To Buy, Rebate, Merchant list, Merchant Setting, New Application. Rodar `multi-select-filters.spec.ts` ou `RU05.26.1.52.0_reorderCustomerNameColumnsToImproveVisibility.spec.ts` **é** executar estas operações — não há isenção de "é só leitura" (regra #19, decisão 2026-06-30: visualizar/filtrar/ordenar/exportar CSV de uma tabela são operações que exigem oracle).
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/origination/multi-select-filters.spec.ts \
>   tests/e2e/origination/RU05.26.1.52.0_reorderCustomerNameColumnsToImproveVisibility.spec.ts \
>   src/pages/origination/merchant-location-filter.po.ts \
>   src/pages/origination/overview.page.ts \
>   src/pages/origination/leads.page.ts \
>   src/pages/origination/funding.page.ts \
>   src/pages/origination/open-to-buy.page.ts \
>   src/pages/origination/rebate.page.ts \
>   src/pages/origination/merchant-list.page.ts \
>   src/pages/origination/merchant-setting.page.ts \
>   src/pages/origination/new-application-filters.page.ts \
>   src/selectors/common.selectors.ts \
>   src/helpers/table.helpers.ts \
>   docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
> ```
> Saída vazia ⇒ BDD atual. Qualquer commit ⇒ prefixar `[BDD MAY BE STALE — <file> changed since e4713f2]`.
>
> **Viewport:** Origination é portal interno voltado para agentes → obrigatório **1440×900** (regra #15; `d-lg-block` ≥ 992 px). A reordenação exige o tamanho exato (AC5 — o `<th>` de nome do cliente precisa caber sem scroll horizontal); `RU05...spec.ts:130-134` força `setViewportSize(1440×900)` em `beforeEach`. O `multi-select-filters.spec.ts` roda no projeto `origination-ui` (viewport do projeto).
>
> **Split de ambiente (não é bug):**
> - **Multi-select (#1292):** roda em **qa1** — `multi-select-filters.spec.ts:108-109` faz `test.skip` fora de qa1 (a release R1.52.0 está em qa1; qa2 não tem). Usuário `manager` (o `AutotestAgent` não tem permissão em `/merchant`, `/merchantSetting`, `/openToBuy`, `/rebate` — `spec:11-14`).
> - **Reordenação (RU05):** roda em **sandbox** (default) — `RU05...spec.ts:28-31`, `558-561`. Evita qa1 no CT de dado fresco (`project_dv360_uat_qa1_outage_2026_05_18`).
>
> **Read-only vs mutação:** filtrar/ordenar/reordenar coluna são **ações de navegação**, não ações de negócio — nenhuma linha em `uown_los_lead_notes` é gerada nem esperada (regra #13 explicitamente dispensada: `multi-select:8-9`, `RU05:20-22`). O único CT que cria dado (RU05 CT-09) usa `createPreQualifiedApplication`, que roda o merchant preflight sozinho (regra #12 satisfeita nesse caminho; dispensada nos read-only).
>
> **Base canônica:** as duas specs (fonte primária de verdade — as asserções `expect()` reais) · KB `multi-select-filters-mmh-modreport-funding.md` (componente multi-select `filter__value-container--is-multi`, compartilhado; ⚠️ documentado para as páginas do **#1319** — MMH/ModReport/Funding — que são um conjunto **distinto** das páginas do #1292 cobertas aqui; ver §Notas → "Divergência de Select All entre #1292 e #1319") · oracle irmão `origination-merchant-mod-history.md` (mesmo componente `MerchantLocationFilterPO`, exemplo de shape de oracle de grid+filtro neste repo).

---

## Parte A — Filtros Multi-Select de Merchant/Location (Task #1292)

### Critérios de Aceitação (IDs conforme comentários da spec)

> Os IDs `AC2..AC7` aparecem literalmente nos comentários da `multi-select-filters.spec.ts`; o texto integral de cada AC vive no SPEC #1292 (`docs/taskTestingUown/1292-multi-select-filters-origination/`), fora dos arquivos deste `covers`. A descrição abaixo é a interpretação ancorada na asserção real de cada CT — os itens não presentes na spec estão marcados `[HYPOTHESIS]`.

| ID | Critério (ancorado na asserção) | Oracle |
|---|---|---|
| AC2 | Cada opção do dropdown expõe um `<input type="checkbox">` ou atributo `aria-selected` (affordance de multi-seleção) | CT-01 |
| AC3 | Seleções múltiplas **persistem ao reabrir** o dropdown (2 merchants continuam marcados) | CT-00, CT-01 |
| AC4 | Filtro combinado **Merchant + Location** — toda linha respeita `(merchant ∈ M) AND (location ∈ L)` | CT-08 |
| AC6 | Export **CSV honra** o filtro multi-select (contagem de linhas do CSV == UI; toda linha referencia um merchant selecionado) | CT-09 |
| AC7 | A requisição de busca envia um **array** de N IDs de merchant no corpo | CT-13 |
| — | Multi-select disponível em 7 telas (Overview-bottom, OTB, Rebate, Leads, Merchant list, Merchant Setting) + New Application `[HYPOTHESIS: cobertura de telas vem do comentário `spec:18-22`, não de AC numerado]` | CT-00..05, CT-15 |
| — | "Select All" presente na maioria; **ausente** no New Application (UX intencional) | CT-10, CT-15 |
| — | Deselecionar individual + **Clear all** zera a seleção; seleção vazia + Search ⇒ todas as linhas (sem filtro) | CT-11 |
| — | Filtro **auto-referente** no Merchant list: marcar N merchants distintos ⇒ ≤ N linhas | CT-04 |

### Cenários

```gherkin
Feature: Origination — filtros multi-select de Merchant/Location no grid de resultados
  Como agente da Origination
  Para analisar leads/OTB/rebate de vários merchants de uma vez
  O agente deve poder marcar múltiplos merchants/locations e aplicar a busca

  Background:
    Given o agente "manager" está autenticado no portal Origination em qa1 com viewport 1440×900
    And o painel de filtro com o combobox multi-select de Merchant está acessível

  Scenario: CT-01 — Cada opção do Merchant expõe affordance de checkbox
    Given o agente está na tela Open To Buy com o painel de filtro aberto
    When o agente abre o dropdown de Merchant
    Then cada opção expõe um checkbox ou o atributo aria-selected

  Scenario: CT-00 / CT-01 — Seleções persistem ao reabrir o dropdown
    Given o painel de filtro está aberto com ao menos 2 merchants disponíveis
    When o agente marca 2 merchants e reabre o dropdown
    Then o contador exibe "2 items selected"
    And os 2 merchants marcados continuam marcados após a reabertura

  Scenario: CT-03 — Aplicar filtro de merchant restringe as linhas da tabela
    Given 2 merchants estão marcados no filtro da tela Leads
    When o agente clica em Search
    Then a coluna Merchant de toda linha visível pertence ao conjunto selecionado

  Scenario: CT-04 — Filtro auto-referente na lista de Merchant retorna no máximo N linhas
    Given a tela Merchant list está aberta
    When o agente marca 2 merchants distintos e clica em Search
    Then a tabela exibe no máximo 2 linhas

  Scenario: CT-08 — Filtro combinado Merchant + Location (AC4)
    Given 2 merchants estão marcados na tela Leads
    And o dropdown de Location foi repopulado a partir dos merchants marcados
    When o agente marca até 2 locations e clica em Search
    Then toda linha visível tem merchant no conjunto M e location no conjunto L

  Scenario: CT-09 — Export CSV honra o filtro multi-select (AC6)
    Given 2 merchants estão marcados e a busca foi aplicada na tela Leads
    When o agente aciona "Download CSV"
    Then a contagem de linhas de dados do CSV é igual à contagem de linhas da UI
    And toda linha de dados do CSV referencia um dos merchants selecionados

  Scenario: CT-10 — Select All marca todas as opções sem erro de servidor
    Given a tela Open To Buy tem o filtro de Merchant com affordance "Select All"
    When o agente aciona "Select All" e clica em Search
    Then o contador de selecionados é maior que zero
    And nenhuma mensagem "Internal Server Error" é exibida

  Scenario: [negative] CT-11 — Clear all zera a seleção e a busca vazia exibe linhas
    Given 2 merchants estão marcados no filtro da tela Open To Buy
    When o agente aciona o "x" de Clear all
    Then o contador de selecionados volta a 0
    When o agente clica em Search com a seleção vazia
    Then nenhuma mensagem "Internal Server Error" é exibida

  Scenario: CT-13 — A requisição de busca envia um array de IDs de merchant (AC7)
    Given 2 merchants estão marcados na tela Leads
    When o agente clica em Search
    Then o corpo do POST de busca carrega um array com 2 IDs de merchant

  Scenario: CT-15 — New Application tem multi-select mas NÃO tem "Select All"
    Given a tela New Application está aberta com o painel de filtro
    Then o filtro de Merchant NÃO expõe a affordance "Select All" (UX intencional)
    When o agente marca 2 merchants e clica em Search
    Then nenhuma mensagem "Internal Server Error" é exibida
```

### Tabela de checkpoints — Parte A

| CT | Checkpoint | Esperado | Fonte (linha da spec) |
|---|---|---|---|
| CT-00 | Persistência ao reabrir | após marcar 2, `getMerchantSelectedCount()` == 2 e `getCheckedOptionNames('Merchant')` contém ambos | `multi-select-filters.spec.ts:140-149` |
| CT-00 | Search renderiza tabela | ao menos 1 linha OU o texto "There are no records to display" | `multi-select-filters.spec.ts:151-160` |
| CT-01 | Affordance de checkbox (AC2) | opção tem `input[type="checkbox"]` visível **ou** `aria-selected != null` | `multi-select-filters.spec.ts:184-199` |
| CT-01 | Persistência (AC3) | `getMerchantSelectedCount()` == nº marcado | `multi-select-filters.spec.ts:201-204` |
| CT-02 | Rebate aplica sem erro | após 2 merchants + Search, sem "Internal Server Error" | `multi-select-filters.spec.ts:229-237` |
| CT-03 | Coluna Merchant ⊆ seleção | toda linha visível: `Merchant` ∈ conjunto marcado (quando há linhas) | `multi-select-filters.spec.ts:260-269` |
| CT-04 | Filtro auto-referente ≤ N | `getVisibleRowCount()` ≤ nº de merchants marcados | `multi-select-filters.spec.ts:288-292` |
| CT-05 | Merchant Setting sem erro | após 2 merchants + Search, sem "Internal Server Error" | `multi-select-filters.spec.ts:311-314` |
| CT-08 | Combinado M ∧ L (AC4) | toda linha: `Merchant` ∈ M **e** `Location` ∈ L | `multi-select-filters.spec.ts:349-364` |
| CT-09 | CSV honra filtro (AC6) | `csvRows == uiRowCount` **e** toda linha do CSV contém um merchant selecionado | `multi-select-filters.spec.ts:442-457` |
| CT-09 | Variante Email CSV | se o trigger for "Email CSV" (sem download direto) ⇒ `[OBSERVAÇÃO]` — validar anexo exige IMAP (`reference_imap_fintechgroup777`) | `multi-select-filters.spec.ts:413-421`, `462-471` |
| CT-10 | Select All (boundary) | `hasSelectAll('Merchant')` == true na OTB; após Select All, `getMerchantSelectedCount()` > 0; sem 5xx (payload de array) | `multi-select-filters.spec.ts:485-502` |
| CT-11 | Clear all → 0 | após `clearAll('Merchant')`, `getMerchantSelectedCount()` == 0 | `multi-select-filters.spec.ts:527-531` |
| CT-11 | Seleção vazia + Search | tabela mostra linhas (sem filtro), sem "Internal Server Error" (OQ-04) | `multi-select-filters.spec.ts:533-539` |
| CT-12 | Persistência entre telas | ao navegar OTB→Rebate com 2 marcados, Rebate herda 0 (store por-página, OQ-06) — **soft assert**, exploratório | `multi-select-filters.spec.ts:567-574` |
| CT-13 | Array no payload (AC7) | corpo do POST de busca tem `merchantIds`/`merchantPks`/`merchantCodes`/`merchants` como array de len == nº marcado | `multi-select-filters.spec.ts:635-638` |
| CT-15 | New Application sem Select All | `hasSelectAll('Merchant')` == false (UX intencional); marca 2 + Search sem 5xx | `multi-select-filters.spec.ts:652-667` |

> **Gatilho de busca (DOM-confirmado, `spec:15-22`):** a busca dispara pelo **botão azul "Search"**, NÃO no onChange nem ao fechar o dropdown. O dropdown **fecha após cada clique** em opção — o page object reabre antes da próxima escolha. A seleção é renderizada como texto **"N items selected"**, NÃO como chips.

---

## Parte B — Reordenação das Colunas de Nome do Cliente (RU05.26.1.52.0)

### Critérios de Aceitação

| ID | Critério (ancorado na asserção) | Oracle |
|---|---|---|
| AC1 | Overview: `First Name` + `Last Name` são consecutivos e **precedem** `Sales Person` / `Sales Rep Code` / `Merchant Support` | CT-01 |
| AC2 | `Sales Person` / `Sales Rep Code` / `Merchant Support` **não foram removidos** (continuam presentes) | CT-01, CT-03 |
| AC3 | Leads: `Customer Name` **imediatamente antes** de `Invoice Number` | CT-02 |
| AC4 | Funding: `Customer Name` **imediatamente após** `Funding Queue Status` | CT-03 |
| AC5 | O `<th>` de nome do cliente fica totalmente visível em 1440×900 com `scrollLeft=0` (`left ≥ 0` e `right ≤ innerWidth`) | CT-04 |
| AC6 | Sort / filtro / paginação / export CSV continuam funcionando após a reordenação | CT-05, CT-06, CT-07, CT-08 |
| AC7 | Os rótulos das colunas de nome do cliente estão presentes em cada tela | CT-01, CT-02, CT-03 |
| AC8 | As células sob os cabeçalhos reordenados carregam o **dado correto** do lead | CT-09 |
| AC9 | Ordenar por `Customer Name` preserva a direção (asc → desc ao reclicar) | CT-05 |
| AC10 | Export CSV: consistência `header[N] ↔ cell[N]` (toda linha de dados tem a mesma contagem de colunas do header; header contém coluna de nome do cliente) | CT-08 |
| — | Config Columns (Overview): ocultar/reexibir uma coluna preserva a ordem relativa das demais (coluna retorna à posição original, não ao fim) — P3 | CT-10 |

### Cenários

```gherkin
Feature: Origination — reordenação das colunas de nome do cliente no grid
  Como agente da Origination
  Para localizar o cliente sem rolar a tabela horizontalmente
  As colunas de nome do cliente devem aparecer no início e continuar operáveis

  Background:
    Given o agente está autenticado no portal Origination em sandbox com viewport 1440×900

  Scenario: CT-01 — Overview: nome do cliente precede Sales/Merchant Support (AC1/AC2/AC7)
    Given a tela Overview está carregada com a tabela renderizada
    Then "First Name" e "Last Name" são colunas consecutivas
    And "Last Name" precede "Sales Person", "Sales Rep Code" e "Merchant Support"
    And "Sales Person", "Sales Rep Code" e "Merchant Support" continuam presentes

  Scenario: CT-02 — Leads: Customer Name imediatamente antes de Invoice Number (AC3)
    Given a tela Leads está carregada
    Then o índice de "Invoice Number" é igual ao índice de "Customer Name" mais um
    And não existe cabeçalho isolado "Sales Rep" nem "Merchant Support" em Leads

  Scenario: CT-03 — Funding: Customer Name imediatamente após Funding Queue Status (AC4)
    Given a tela Funding está carregada
    Then o índice de "Customer Name" é igual ao índice de "Funding Queue Status" mais um
    And "Customer Name" precede "Sales Rep Code"
    And não existe cabeçalho "Merchant Support" em Funding

  Scenario: CT-04 — Cabeçalho de nome do cliente visível sem scroll horizontal (AC5)
    Given uma das telas (Overview, Leads, Funding) está carregada com scrollLeft=0
    Then a borda esquerda do cabeçalho de nome do cliente é >= 0
    And a borda direita é <= a largura da viewport (1440)

  Scenario: CT-05 — Ordenar por Customer Name preserva direção (AC6/AC9)
    Given a tela Leads está carregada
    When o agente clica no cabeçalho "Customer Name"
    Then os valores ficam em ordem lexicográfica crescente
    When o agente clica novamente no cabeçalho "Customer Name"
    Then os valores ficam em ordem lexicográfica decrescente

  Scenario: CT-06 — Filtrar por Customer Name retorna linhas correspondentes (AC6)
    Given a tela Leads tem ao menos uma linha visível
    When o agente filtra por um sobrenome existente
    Then ao menos 1 linha é retornada
    And toda linha retornada contém o valor filtrado na coluna Customer Name

  Scenario: CT-07 — Paginação preserva o índice da coluna Customer Name (AC6)
    Given a tela Leads pagina em mais de uma página
    When o agente avança para a página 2
    Then o índice da coluna "Customer Name" é idêntico ao da página 1
    And a página 2 não é o mesmo conjunto de linhas da página 1

  Scenario: CT-08 — Export CSV: consistência header[N] ↔ cell[N] (AC6/AC10)
    Given a tela Leads está carregada
    When o agente aciona "Download CSV"
    Then o header do CSV contém uma coluna de nome do cliente (Customer Name OU First+Last)
    And toda linha de dados tem a mesma quantidade de colunas do header

  Scenario: CT-09 — Células sob os cabeçalhos reordenados carregam o dado correto (AC8)
    Given um lead fresco foi criado com nome/sobrenome conhecidos e uma invoice
    When o agente filtra Leads pelo sobrenome conhecido
    Then a célula sob "Customer Name" referencia o applicant semeado
    And a célula sob "Invoice Number" é igual à invoice semeada (quando preenchida)

  Scenario: CT-10 — Config Columns preserva a ordem ao ocultar/reexibir (P3)
    Given a tela Overview tem a coluna "Sales Rep Code" visível
    When o agente desmarca "Sales Rep Code" no Config Columns
    Then "Sales Rep Code" some e a ordem relativa das demais colunas é preservada
    When o agente remarca "Sales Rep Code"
    Then a ordem original é restaurada byte-a-byte (coluna volta à posição original, não ao fim)
```

### Tabela de checkpoints — Parte B

| CT | Checkpoint | Esperado | Fonte (linha da spec) |
|---|---|---|---|
| CT-01 | Overview: consecutivos + precedência (AC1) | `iLast == iFirst + 1`; `iFirst < iSalesPerson`; `iLast < iSalesRepCode`; `iLast < iMerchantSupport` | `RU05...spec.ts:170-173` |
| CT-01 | Overview: colunas não removidas (AC2/AC7) | os 5 cabeçalhos existem (`índice >= 0`) | `RU05...spec.ts:163-167` |
| CT-02 | Leads: Invoice após Customer (AC3) | `iInvoice == iCustomer + 1` | `RU05...spec.ts:197` |
| CT-02 | Leads: negativos | `sales rep` e `merchant support` **não** estão nos headers | `RU05...spec.ts:201-209` |
| CT-03 | Funding: Customer após Queue Status (AC4) | `iCustomer == iQueueStatus + 1`; `iCustomer < iSalesRepCode` | `RU05...spec.ts:236-237` |
| CT-03 | Funding: negativo | `merchant support` **não** está nos headers | `RU05...spec.ts:240-244` |
| CT-04 | `<th>` visível sem scroll (AC5) | `scrollLeft == 0`; `left >= 0`; `right <= windowWidth`. Parametrizado em Overview (First+Last Name), Leads e Funding (Customer Name) | `RU05...spec.ts:281-294` |
| CT-05 | Sort asc/desc (AC6/AC9) | asc: valores == `localeCompare` crescente; desc: == decrescente (quando ≥ 2 valores) | `RU05...spec.ts:338-352` |
| CT-06 | Filtro por Customer Name (AC6) | `after.length > 0`; toda linha contém o valor filtrado (partial-match, minúsculas) | `RU05...spec.ts:391-398` |
| CT-07 | Paginação estável (AC6) | `iCustomerPage2 == iCustomerPage1`; página 2 tem ≥ 1 linha; sobreposição < total (conjuntos diferentes) | `RU05...spec.ts:431-443` |
| CT-08 | CSV header/cell (AC10) | header contém `customer name` **ou** (`first name` ∧ `last name`); toda linha de dados tem `cells.length == header.length` | `RU05...spec.ts:529-545` |
| CT-09 | Células com dado correto (AC8) | célula "Customer Name" referencia o applicant semeado; célula "Invoice Number" == invoice semeada (hard-assert só quando ambos preenchidos) | `RU05...spec.ts:614-639` |
| CT-10 | Config Columns preserva ordem (P3) | ao ocultar: `headers1 == headers0 sem 'Sales Rep Code'`; ao reexibir: `headers2 == headers0` (byte-a-byte, coluna volta à posição original) | `RU05...spec.ts:675-694` |

---

## Notas de execução

- **Export CSV — três variantes de trigger (compartilhado pelas duas partes):** ambas as specs sondam `Download CSV` → `Export CSV` → `Email CSV` nessa ordem. Só a variante de **download direto** permite a asserção rica (contagem de linhas + coluna merchant). A variante **Email CSV** grava `[OBSERVAÇÃO]` e passa sem asserção — validar o anexo exigiria IMAP (`reference_imap_fintechgroup777`). Fonte: `multi-select-filters.spec.ts:396-471`; `RU05...spec.ts:452-546`. Pitfall #118 (KB): "Email CSV" vem **antes** de "Download CSV" no DOM — usar `:has-text('Download CSV')` para desambiguar, nunca `.csvButton` sozinho.
- **`[HYPOTHESIS]` — divergência de "Select All" entre #1292 e #1319:** a `multi-select-filters.spec.ts` (páginas do #1292) **assere** que "Select All" está presente no Merchant da OTB (`CT-10`, `spec:487-488`) e ausente no New Application (`CT-15`, `spec:652-657`). Já a KB `multi-select-filters-mmh-modreport-funding.md` (páginas do **#1319** — MMH/ModReport/Funding) diz que o Merchant **não** tem "Select All" (BR-05, tabela "Select All"). São **conjuntos de páginas diferentes** e/ou **ambientes diferentes** (qa1 R1.52.0 vs qa2). Não assumir uniformidade: verificar `hasSelectAll(<filtro>)` no DOM real por página/ambiente antes de afirmar. Este oracle cobre apenas as páginas do #1292; MMH/ModReport/Funding são cobertos por `origination-merchant-mod-history.md` e futuros oracles irmãos.
- **`[HYPOTHESIS]` — texto integral dos ACs:** os IDs `AC2..AC7` (Parte A) e `AC1..AC10` (Parte B) vêm dos comentários das specs e dos respectivos SPECs em `docs/taskTestingUown/` (fora do `covers`). A coluna "Critério" deste oracle é a **interpretação ancorada na asserção real** de cada CT, não a citação literal do documento de AC. Ao re-revisar, cruzar com o SPEC original se o texto exato for necessário.
- **Sem log de atividade (regra #13):** correto e esperado — filtrar/ordenar/reordenar/exportar CSV são ações de navegação read-only. Nenhum `uown_los_lead_notes` é gerado (`multi-select:8-9`, `RU05:20-22`). A **exceção** é o RU05 CT-09, que cria um lead fresco via `createPreQualifiedApplication` + `sendInvoice` só para ter nome/invoice conhecidos — a criação em si gera logs, mas a asserção do CT é sobre a **célula renderizada** (AC8), não sobre o log.
- **Ressalvas de dataset (degradação graciosa, não falha):** vários CTs degradam quando o ambiente tem poucos dados — CT-05 (sort) baixa para "clique não estoura + header alterna" com < 2 valores (`RU05:324-331`); CT-06 (filtro), CT-07 (paginação), CT-09 (invoice vazia) e CT-13 (payload não-JSON) gravam `[OBSERVAÇÃO]` e retornam sem hard-assert. Um `[OBSERVAÇÃO]` aqui é **cobertura reduzida por falta de dado**, não bug — não classificar como `[BUG]` sem reprodução em dado fresco (regra #10).
- **CT-12 (persistência entre telas) é `expect.soft`** — exploratório. A premissa (store por-página ⇒ Rebate herda 0 após OTB) é `OQ-06` do SPEC, não confirmada; se `rebateCount != 0`, escalar ao PO, não falhar duro (`multi-select-filters.spec.ts:567-574`).
- **Item bloqueante pré-implementação registrado no SPEC RU05 §11** (`RU05...spec.ts:36-38`): confirmar com Marcus/Yuri se a ordem observada em qa1 (2026-05-20) resulta **deste fix** (validação de regressão) ou é layout pré-existente. A spec assere o estado-alvo independentemente da causa; `qa-validator` deve sinalizar se nenhum ambiente diverge. Follow-up em aberto — não bloqueia este oracle de documentação.
- **Falha de checkpoint ⇒ regra #19(c):** inspecionar o DOM real primeiro (MCP Playwright, 1440×900) → verificar se algum arquivo do `covers` mudou intencionalmente (staleness) → se sim, BDD desatualizado (atualizar); se não, reportar `[BUG]`. Nunca confirmar bug sem descartar staleness do BDD.
