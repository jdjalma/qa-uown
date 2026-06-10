# Scenarios — Schedule Program Activation and Deactivation Dates

> **Feature (Origination / Merchant Programs):** permite agendar `activationDate` e `deactivationDate` ao atribuir um programa a um merchant. Status (Active/Inactive) é derivado das datas; `sendApplication` escolhe o programa ativo na data de submissão e persiste em `uown_los_lead.merchant_program_pk`. Sweep job (`merchantProgramActivationDeactivationSweep`) normaliza `is_active` diariamente.

## Regra de negócio — Source of Truth

| Papel | Responsabilidade |
|-------|------------------|
| **Datas** (`activationDate` / `deactivationDate`) | **Source of Truth** — definem o período real do programa. É a "Lei". |
| **`is_active`** | Reflexo executor das datas. Existe no DB por performance. |

**Hierarquia de consumo:**
- **Frontend:** calcula status on-the-fly baseado em `today` do usuário vs datas do programa
- **Backend (processamento):** usa `is_active` flag por performance
- **Sweep job:** olha as datas e atualiza `is_active` atrás delas
- **Create/Update API:** backend **recalcula** `is_active` a partir das datas, **ignora** o valor da flag `active` enviado no request

**Divergência entre datas e `is_active` = BUG.** CT-API-13 valida explicitamente.

## Invariante de audit — verificar log via UI em TODO SAVE

Toda ação de mutação (add/edit/delete/clone de programa) gera **audit log** em 2 escopos. **Cada CT com SAVE DEVE terminar com verificação da entry via UI**, não apenas via DB:

| Escopo do log | Onde vê na UI | Quando é emitido | `log_type` |
|---------------|---------------|------------------|------------|
| **Merchant activity log** | Aba/seção **Activity Log** da merchant detail page (`/merchant/{number}`) | Programa adicionado/removido de um merchant via `addProgramsToMerchant` | `PROGRAM_DATA_CHANGE` (com `merchant_pk` preenchido) |
| **Program activity log** | Seção **Notes** abaixo do form no **Program Details** (`/programs` painel direito) | Dados do programa alterados (datas, money factor, nome, etc.) via `createOrUpdateProgram` | `PROGRAM_DATA_CHANGE` (com `program_pk` preenchido) |

**Padrão obrigatório para cada CT que chama SAVE:**

1. **Passo de UI obrigatório** após SAVE:
   - Se a ação é **add/remove program ↔ merchant** → navegar para merchant detail page → validar entry na seção Activity Log com texto descrevendo a mudança
   - Se a ação é **edit program data** → permanecer no Program Details → expandir seção Notes → validar entry mais recente com `type=PROGRAM_DATA_CHANGE` + `notes` contendo delta dos campos
2. **Validação cross-layer** (DB + UI):
   - DB: `SELECT ... FROM uown_merchant_activity_log WHERE program_pk=<pk> AND log_type='PROGRAM_DATA_CHANGE' ORDER BY row_created_timestamp DESC LIMIT 1` (ou `WHERE merchant_pk=<pk>` para merchant-scope)
   - UI: texto renderizado na aba/seção deve bater com `notes` do DB
3. **Quando aplica:**
   - ✅ CT-03 (add program) → **merchant log** + **program log**
   - ✅ CT-04 (edit dates) → **program log**
   - ✅ CT-06 (save dates) → **program log**
   - ✅ CT-07c (clone) → **program log** (do clone criado)
   - ✅ CT-08..CT-17 (status derivation via save) → **program log**
   - ✅ CT-07b (delete) → **merchant log** (programa removido do merchant)
   - ⚠️ Sweep CTs (Grupo 3) — log entry validada via DB apenas (nenhuma UI ação disparou o save — é o job); UI opcional

**Por quê este invariante é obrigatório:**
- Regulatório: auditoria SOC/PCI exige rastreabilidade end-to-end. DB log sem UI = backend loga mas não mostra → bug regressivo esconde.
- Cross-page: confirmar que a mudança disparada em uma página (ex: Programs) é visível em outra (ex: merchant detail).
- QA Domain Reflex #11 (Any Mutation) + reflex específico de program activation (ver `.claude/context/shared/qa-domain-reflexes.md`).

## Contexto fixado com o usuário

| Item | Valor |
|------|-------|
| Ambiente | `qa2` |
| Merchant UOWN | `OL90294-0001` (Progress Mobility) — brand **UOWN** |
| Merchant Kornerstone | `KS3015` (FifthAveFurnitureNY) — brand **KORNERSTONE** (canônico da Modalidade B em qa2) |
| Merchant Second Look | `OW90218-0001` (TireAgent) — para **Modalidade C 16m Second Look** (SSN fixo `100000053`) |
| Frontend primário | Origination portal (UI-first) |
| API | coberta como **smoke** (1 CT) |
| Sweep endpoint | `POST https://svc-qa2.uownleasing.com/uown/svc/triggerScheduledTask/merchantProgramActivationDeactivationSweep` |
| DB UPDATE direto | **autorizado pelo usuário** para cenários de boundary do sweep (`uown_merchant_program.activation_date/deactivation_date`) — registro em conversa 2026-04-22 |
| Test Data Hierarchy | prefere criação via UI; reuso de programa existente permitido com cleanup por CT |

## Justificativa de omissão — cobertura

| Dimensão | Inclusa? | Justificativa |
|----------|----------|---------------|
| **Brand UOWN (modalidade A — 13m)** | ✅ | Merchant OL90294-0001 (Progress Mobility) |
| **Brand Kornerstone (modalidade B — 13m+16m)** | ✅ | Merchant KS3015 (FifthAveFurnitureNY) — cliente escolhe plano via `getMissingFields(planId)` |
| **Modalidade C (16m Second Look)** | ✅ | Merchant TireAgent (OW90218-0001) + SSN `100000053` + profile Brian/Columbus/92821/CA. **⚠ Risco:** catalog confirma só em `stg`; qa2 exige validação empírica (CT-C-00 smoke antes do flow completo) |
| **Modalidade D (UW_DENIED)** | ✅ | SSN `generateTestSSN(false)`. Valida que programa NÃO é usado quando lead é negado. Rodado em UOWN e Kornerstone |
| **UI E2E** | ✅ | Primária — todos os cenários 1-17 |
| **API smoke** | ✅ | CT-API-01 — persistência dos campos |
| **DB Sweep** | ✅ | CTs 18-25 — UPDATE direto autorizado |
| **Complete Application (new application)** | ✅ | CT-A e CT-B via UI + validação DB |

---

## User Stories

### US-MERCH-PROG-01: Agendar ativação/desativação de programa

**Como** admin do Origination,
**Quero** atribuir datas de ativação e desativação ao programa do merchant,
**Para** planejar mudanças de oferta sem intervenção manual no dia.

**Critérios de aceite:**
- [ ] Modal "Programs" acessível a partir da página Programs (label do botão conforme UI atual em qa2; rename fora do escopo)
- [ ] Tabela com colunas: Program Name, Activation Date, Deactivation Date, Ações (edit/delete)
- [ ] Dropdown "Add program" adiciona programa no topo da tabela; só mostra programas ainda não atribuídos
- [ ] Edição inline (ícones pencil/check/X) para datas; cancel reverte
- [ ] Validação UI: `activationDate > deactivationDate` bloqueia save inline + mostra mensagem
- [ ] Save no footer persiste tabela completa via API → toast de sucesso → modal fecha
- [ ] Save com linha em edit mode → popup de confirmação (Go back / Continue)
- [ ] Cancel no footer descarta mudanças; ao reabrir, dados voltam ao último save
- [ ] Delete (trash) remove linha da tabela local; só persiste após Save
- [ ] Tooltip no Status mostra `Activation: <data|—>` / `Deactivation: <data|—>`

### US-MERCH-PROG-02: Status Active/Inactive baseado em datas

**Como** admin,
**Quero** ver o status do programa derivado das datas,
**Para** saber o que está vigente sem conferir datas manualmente.

**Critérios (boundaries inclusivos):**
- [ ] Ambas datas `null` → Active
- [ ] `activation ≤ today AND (deactivation ≥ today OR null)` → Active
- [ ] `activation = today` → Active (inclusivo)
- [ ] `deactivation = today` → Active (inclusivo)
- [ ] `activation > today` → Inactive
- [ ] `deactivation < today` → Inactive
- [ ] `activation > deactivation` → backend rejeita com `"activationDate must be before or equal to deactivationDate"`

### US-MERCH-PROG-03: Sweep normaliza `is_active` diariamente

**Como** sistema,
**Quero** que o job `merchantProgramActivationDeactivationSweep` reconcilie `is_active` com as datas,
**Para** garantir consistência mesmo sem toque humano.

**Critérios:**
- [ ] POST no endpoint retorna 200/success
- [ ] `deactivation_date` movido para passado + sweep → `is_active = false`
- [ ] `activation_date = today` + `is_active = false` + sweep → `is_active = true`
- [ ] Boundary inclusivo preservado (activation = today, deactivation = today = Active)
- [ ] Sweep é idempotente (3 execuções consecutivas sem mudança de DB não alteram state)
- [ ] Log registra `activated/deactivated` com PK do programa

### US-MERCH-PROG-04: Complete Application usa programa ativo

**Como** cliente,
**Quero** que a aplicação use o programa ativo no momento da submissão,
**Para** receber os termos corretos da oferta vigente.

**Critérios:**
- [ ] Após `sendApplication` + `getMissingFields` + `submitApplication`, `uown_los_lead.merchant_program_pk` aponta para programa ativo na data
- [ ] Se programa previamente selecionado for desativado, próxima aplicação seleciona outro programa ativo
- [ ] Aplicação negada (UW_DENIED) não persiste `merchant_program_pk` (ou persiste com programa indicado, mas lead não avança)

---

## Matriz de cobertura

|                              | UOWN (OL90294-0001 Progress Mobility) | Kornerstone (KS3015 FifthAveFurnitureNY) | UOWN (OW90218-0001 TireAgent) |
|------------------------------|:-------------------------------------:|:----------------------------------------:|:-----------------------------:|
| **Seleção por data (13↔16)**  | **N/A** — UOWN não oferece 16m; fallback 13↔16 não acontece aqui (ver CT-DateSelect-13to16-UOWN deprecated) | CT-DateSelect-13to16-KS, CT-DateSelect-16to13-KS ✅ confirmados em 2026-04-23 | — |
| **Edge — todos elegíveis desativados** | CT-DateSelect-BothInactive (variante UOWN) — decline genérico `E0/E4`, `paymentDetailsList=[]` | CT-DateSelect-BothInactive (variante KS) — mensagem específica "no program for state" | — |
| **Reseleção após deactivate** | CT-Reselect-UOWN — só aplicável se merchant tem ≥ 2 programas 13m (um usado+desativado, outro ativo) | CT-Reselect-KS                           | —                             |
| **Gating 13m em UOWN (2 programas 13m)** | CT-DateSelect-13only-UOWN (1 ativo + 1 desativado → app usa o ativo) | N/A | — |
| **Modalidade C — 16m Second Look** | —                                | —                                        | CT-C-00 (smoke), CT-C-01 (denied 13m), CT-C-02 (approved 16m + validação `is_active`), CT-C-03 (16m desativado por data → discovery) |
| **UI Modal (grupo 1-2)**      | CT-01..CT-17 (primário)               | CT-KS-SMOKE (1 cross-brand)              | —                             |
| **Sweep (grupo 3)**           | CT-18..CT-25 (programas UOWN)         | inclusos no CT-25 (programas KS)         | —                             |
| **API validações (grupo 5)** | CT-API-01..CT-API-16                  | idem                                     | —                             |

**CTs removidos do escopo (2026-04-22):**
- ❌ CT-A, CT-A-KS, CT-B-MB, CT-B-UOWN — apenas validavam criação happy path sem componente date-driven
- ❌ CT-D, CT-D-KS — apenas validavam UW_DENIED sem relação com datas de programa
- ❌ CT-PG-01..CT-PG-05 (Grupo 5b inteiro) — `/programGroups` não tem controle de ativação/desativação por data (user confirmou 2026-04-22); programas aparecem no grupo independente de datas. Página fora do escopo desta feature

**Tipos de teste:**
- **E2E UI** (Origination portal): CT-01..CT-07, CT-07b, CT-07c, CT-08..CT-17 (inclui CT-15b), CT-KS-SMOKE, CT-DateSelect-13to16-UOWN, CT-DateSelect-16to13-UOWN, CT-DateSelect-13to16-KS, CT-DateSelect-16to13-KS, CT-DateSelect-BothInactive, CT-Reselect-UOWN, CT-Reselect-KS
- **API primário** (Second Look exige API direta): CT-C-00, CT-C-01, CT-C-02, CT-C-03
- **API validações** (grupo 5): CT-API-01-UOWN, CT-API-01-KS, CT-API-02..CT-API-16
- **Hybrid (UI setup + API sweep + DB assertion)**: CT-18..CT-25

---

## Cenários (CT-XX)

> **Padrão de documentação:** cada CT contém:
> - **Jornada do usuário** — narrativa em 1ª pessoa explicando **quem é o usuário**, **o problema que ele tem**, **o que ele faz** no seu fluxo de trabalho, e **o que ele espera ver**. Sem jargão técnico. Lê-se como uma história.
> - **Objetivo de negócio** — 1 linha: por que a feature existe do ponto de vista do produto / risco / compliance.
> - **Tipo / Portal** — classificação (E2E UI, API, Hybrid)
> - **Pré-condição** — estado inicial + evidências a capturar antes de executar
> - **Passos** — numerados sequencialmente, acionáveis por humano (URL → clique → campo → valor). Onde requer DB ou API, o comando exato está inline
> - **Validações** / **Resultado esperado** — checks mensuráveis
> - **Cleanup** — reversão de estado quando o CT muta dados
> - **Tags**
>
> **Para reprodução manual** basta seguir os Passos: cada instrução referencia URL, botão, campo ou comando concreto. Nos CTs de sweep/API (grupo 3 e 5), a reprodução manual é via Postman/curl — o comando HTTP está inline.
>
> **Por que "Jornada do usuário" importa:** é a lente que mantém o teste conectado ao valor real — se o CT passa mas a jornada descrita não funciona de ponta a ponta na UI, o CT está testando a coisa errada. Usamos a jornada também para priorizar: CT cuja jornada descreve atividade diária do admin = prioridade alta; jornada de edge-case raro = prioridade média.

> **Escopo importante (atualizado com user em 2026-04-22):**
> - A edição de datas de ativação/desativação acontece **somente na página Programs** (gestão global de programas). O modal de edição com os 2 novos campos (activationDate/deactivationDate) é aberto pelo botão existente — **o rename `+Add → VIEW ALL` foi removido do escopo**; validar o botão que efetivamente abre o modal em qa2 no 1º run e documentar o label real.
> - A página **Merchant** mantém apenas **visualização** dos programas atribuídos com Status + tooltip; NÃO há modal nem edição de datas lá.
> - Frontend já deployado em qa2 (risco de deployment removido).

### Grupo 1 — Programs page — modal de edição (CT-01..CT-07)

#### CT-01: Merchant page exibe Status e tooltip dos programas em read-only

**Jornada do usuário:**
> *Sou admin do Origination. Um gerente de risco me pergunta "o programa X desse merchant ainda está ativo esse mês?". Em vez de abrir modal de edição ou ir no banco, quero entrar na página do merchant, bater o olho na lista de programas, e saber na hora: cada programa tem um badge Active/Inactive e, se eu passar o mouse, vejo as datas exatas. Se eu acidentalmente clicar num ícone de edição aqui, é porque alguém abriu um caminho de mutação que não deveria existir nesta tela — a edição acontece só em `/programs`.*

**Objetivo de negócio:** a página do merchant é **vitrine read-only**. O admin confere em 5 segundos o que está vigente sem risco de editar por engano.

**Tipo:** E2E UI (read-only — sem mutação)
**Portal:** Origination — página de detalhe do merchant

**Pré-condição:**
- Admin autenticado no portal Origination
- Merchant `OL90294-0001` (Progress Mobility) possui **pelo menos 2 programas atribuídos** em estados distintos para exercitar todos os caminhos visuais:
  - Programa **A**: `activation_date` e `deactivation_date` definidos (não-null)
  - Programa **B**: ambas as datas em `null` (programa eternal)

**Passos:**
1. Abrir a página de detalhe do merchant `OL90294-0001`
2. Localizar a seção **Programs** na página
3. Para o programa A: posicionar cursor sobre o badge de Status
4. Para o programa B: posicionar cursor sobre o badge de Status
5. Inspecionar visualmente a seção procurando por CTAs de mutação (pencil/trash/add)

**Resultado esperado (critério de passagem):**
- Cada linha da seção Programs exibe um badge Active/Inactive coerente com a regra de datas (`activation ≤ today ≤ deactivation` ou nulls apropriados)
- Tooltip sobre Status do programa A mostra **exatamente duas linhas**: `Activation: <dd/MM/yyyy>` e `Deactivation: <dd/MM/yyyy>`
- Tooltip sobre Status do programa B mostra `Activation: —` e `Deactivation: —` (placeholder para null)
- Tooltip de cada linha corresponde ao programa correto — sem cross-talk entre linhas adjacentes
- Nenhum ícone de edição (pencil/trash) nem botão para abrir modal de edição presente na seção (confirma requisito: edição vive SOMENTE na página Programs)

**Tags:** `@regression @e2e @origination @merchant-page @read-only`
**[reflex #8]** Merchant audit: consistência visual
**[reflex #11]** N/A — operação de leitura pura
--> OK
---

#### CT-02: Programs page — layout de 2 painéis expõe os novos campos `Activation Date` e `Deactivation Date` no Program Details

**Jornada do usuário:**
> *Abro `/programs` pela primeira vez depois do deploy. Quero me orientar: à esquerda tenho a lista de todos os programas com Search e filtro por Grupo; clico em qualquer linha e à direita aparece o "Program Details". É nesse painel que eu, como admin, espero encontrar os dois campos novos — `Activation Date` e `Deactivation Date` — com formato `MM/DD/YYYY` e já editáveis. Logo abaixo do form vejo a seção **Notes** com o histórico de mudanças (`PROGRAM_DATA_CHANGE`) — isso me dá confiança de que tudo que eu fizer aqui fica auditado sem esforço adicional.*

**Objetivo de negócio:** smoke test do deploy — ao entrar na página, o admin consegue localizar sem ambiguidade onde agendar ativação/desativação. Se o painel direito não expõe os campos novos, a feature inteira está quebrada.

**⚠ Não confundir:**
- **`/programs`** (este CT): catálogo **individual** de programas (1833 rows em qa2), com colunas financeiras (Term Months, Money Factor, EPO Days…) e edição do programa em side panel — **aqui** ficam os 2 campos novos
- **`/programGroups`**: catálogo de **grupos** de programas — **fora do escopo desta feature** (não tem controle de ativação/desativação por data; programas aparecem no grupo independente das datas)

**Tipo:** E2E UI (smoke de estrutura + presença de campos)
**Portal:** Origination — rota `https://origination-qa2.uownleasing.com/programs`

**Pré-condição:**
- Admin autenticado no Origination (usuário com permissão de editar programas — ex.: `manager`)
- Catálogo de programas possui ao menos 1 registro (pré-carregado no ambiente — qa2 tem 1833 programas visíveis na listagem no momento da especificação)

**Passos:**
1. Navegar para `programs/`
2. Aguardar carregamento da listagem (painel esquerdo, título `PROGRAMS`)
3. Validar cabeçalhos da tabela esquerda (11 colunas sortáveis): `Program Name | Term Months | Lending CategoryType | Money Factor | Pay Off Discount | Processing Fee Override | EPO Days | EPO Fee Percent | Group Name | Amount at Signed | States`
4. Validar presença do botão **ADD NEW PROGRAM** no cabeçalho do painel esquerdo
5. Validar presença dos filtros: input **Search**, dropdown **Program Groups**, botão **Search**
6. Clicar em uma linha qualquer da listagem (e.g., primeiro item `row-0`)
7. Aguardar o painel direito **PROGRAM DETAILS** renderizar com dados do programa selecionado
8. **Validar presença dos dois novos campos no Program Details:**
   - Label `Activation Date` + input com placeholder `MM/DD/YYYY` (id `activationDate`)
   - Label `Deactivation Date` + input com placeholder `MM/DD/YYYY` (id `deactivationDate`)
9. Validar botões de ação no topo do painel direito: **Clone ▾** (dropdown), **Clone Group**, **CANCEL**, **SAVE**
10. Rolar até a seção **Notes** (accordion aberto) abaixo do form
11. Validar cabeçalhos da tabela Notes: `Date | Type | User ID | Notes`
12. Validar entries de tipo `PROGRAM_DATA_CHANGE` no histórico (evidência de audit log built-in)

**Resultado esperado (critério de passagem):**
- Painel esquerdo lista programas com as 11 colunas nomeadas na ordem acima
- Botão **ADD NEW PROGRAM** presente e clicável
- Ao clicar num programa, painel direito **PROGRAM DETAILS** abre com dados populados
- **Campos `Activation Date` e `Deactivation Date`** visíveis e editáveis (inputs type=search, maxlength 10, placeholder `MM/DD/YYYY`) — este é o **deliverable principal da feature**
- Botões **Clone**, **Clone Group**, **CANCEL**, **SAVE** presentes no topo do painel direito
- Seção **Notes** abaixo do form expõe audit log com tipo `PROGRAM_DATA_CHANGE` — evidência de que alterações nos campos serão rastreadas automaticamente (requisito regulatório + prova de que o backend persiste dates com audit trail)

**Observação de escopo confirmada:**
- **Não há modal em overlay** — o fluxo é um layout master-detail side-by-side. Cenários anteriores ainda referenciando "modal" devem ser lidos como "painel Program Details"
- **Não há colunas `Activation Date` / `Deactivation Date` na listagem esquerda** — as datas ficam visíveis apenas no painel de detalhes do programa selecionado. Se negócio quiser expor essas datas na listagem, vira outra task

**Tags:** `@smoke @critical @e2e @programs-page`

---

#### CT-03: Adicionar programa novo ao merchant e confirmar persistência

**Jornada do usuário:**
> *Preciso onboardar uma oferta nova para o merchant OL90294-0001. Vou ao catálogo global (`/programs` ou fluxo de merchant), abro o dropdown "Add program", encontro `X` e `Y` (que ainda não estão atribuídos a esse merchant), e os adiciono. Espero ver feedback visual imediato — as novas linhas aparecem no topo da tabela, o dropdown "se atualiza" removendo o que eu já escolhi (evita duplicata), e depois que clico Save um toast confirma e o modal fecha. Se eu reabrir o fluxo, `X` e `Y` continuam lá — dados não se perdem. E para provar que alguém depois consegue auditar quem atribuiu o quê, vou na Activity Log do merchant e confirmo que as duas adições estão listadas com meu usuário.*

**Objetivo de negócio:** é o onboarding de oferta — atividade diária do admin. Ruptura aqui bloqueia o time comercial. A feature nova permite já setar datas no mesmo ato (coberto em CT-07c); este CT valida o happy path sem datas, só a atribuição + audit.

**Pré-condição:**
- Modal de Programs aberto no contexto do merchant `OL90294-0001`
- Existem programas `X` e `Y` no catálogo global ainda não atribuídos ao merchant

**Passos:**
1. Expandir dropdown **"Add program"** e confirmar que lista inclui `X` e `Y` e exclui programas já atribuídos
2. Selecionar `X` no dropdown
3. Confirmar que `X` aparece como nova linha no **topo** da tabela; dropdown reset; `X` removido das opções
4. Selecionar `Y` no dropdown
5. Confirmar que `Y` aparece acima de `X` (ordem top-first pelo mais recente)
6. Clicar **Save** no footer
7. Aguardar toast de sucesso e fechamento do modal
8. **Audit via UI — merchant log (NOVA):** navegar para merchant detail page de OL90294-0001 → localizar seção/aba **Activity Log** → confirmar entry recente descrevendo a adição dos programas `X` e `Y` (texto contém nome dos programas adicionados); `created_by` = usuário logado
9. **Audit via UI — program log (NOVA):** abrir cada programa (`X` e `Y`) em `/programs` → seção **Notes** do Program Details → confirmar entry `PROGRAM_DATA_CHANGE` com `notes` tipo `"Program <name> created"` ou delta inicial

**Resultado esperado:**
- Toast com mensagem semelhante a **"Program(s) saved."**
- Modal fecha automaticamente
- Reabertura do modal mostra `X` e `Y` como programas persistidos
- DB: `SELECT ... FROM uown_merchant_program WHERE merchant_pk=<OL90294-0001.pk> AND program_pk IN (X, Y)` retorna 2 rows com `activation_date=NULL`, `deactivation_date=NULL`, `is_active=true` (defaults quando datas não são preenchidas)
- Dropdown refletindo filtragem: em nova abertura, `X` e `Y` não aparecem mais nas opções
- **DB audit (merchant scope):** `SELECT notes, created_by FROM uown_merchant_activity_log WHERE merchant_pk=<OL90294-0001.pk> AND log_type='PROGRAM_DATA_CHANGE' ORDER BY row_created_timestamp DESC LIMIT 2` → 2 entries recentes referenciando `X` e `Y`
- **DB audit (program scope):** uma entry por programa com `program_pk IN (X.pk, Y.pk)` e `log_type='PROGRAM_DATA_CHANGE'`
- **UI audit:** texto exibido na Activity Log da merchant page + Notes do Program Details bate com as entries do DB (sem divergência visual)

**Tags:** `@regression @e2e @programs-page @critical @audit-log`
**[reflex #11]** Mutation: merchant + program scope logs

---

#### CT-04: Editar inline as datas de um programa já atribuído (happy path)

**Jornada do usuário:**
> *O programa `P` está atribuído ao merchant mas ainda sem janela de vigência (nulls). O time comercial me pediu pra agendar "começar em 5 dias atrás e terminar em 5 dias à frente" (pra cobrir um backdate + promoção curta). Vou na linha de `P`, clico no lápis, os campos viram inputs editáveis com check/cancel. Digito as duas datas, clico check, a linha "volta" para read-only mas agora com as datas preenchidas — e o Status calculado vira Active automaticamente (porque hoje está dentro da janela). Nesse momento o backend ainda não foi chamado — é só alteração local. Se eu mudar de ideia, clico cancel na próxima linha e volto aos valores originais.*

**Objetivo de negócio:** fluxo primário da feature. Se o pencil/check/cancel falha, todas as operações de manutenção dependem disso — qualquer travamento aqui bloqueia a operação principal.

**Pré-condição:**
- Modal de Programs aberto no contexto de OL90294-0001
- Programa `P` já na tabela com `activation_date=NULL`, `deactivation_date=NULL`

**Passos:**
1. Localizar linha de `P`; clicar no ícone **pencil** da coluna Actions
2. Confirmar que os campos `Activation Date` e `Deactivation Date` daquela linha viraram **inputs editáveis** e que dois ícones aparecem: **check (✓)** e **cancel (✗)**
3. Preencher `Activation Date = today − 5d` e `Deactivation Date = today + 5d`
4. Clicar **check** para commit local da linha
5. Inspecionar linha após commit

**Resultado esperado:**
- Linha retorna ao modo read-only, mas agora exibe as datas preenchidas no lugar dos placeholders
- Status derivado da linha = **Active** (datas englobam today)
- **Nenhuma request backend é disparada neste passo** (commit é apenas in-memory da tabela do modal; confirmar via network interceptor)
- Clicar **cancel (✗)** em outra edição reverte valores para os originais sem mutação

**Tags:** `@regression @e2e @critical @programs-page`

---

#### CT-05: UI impede commit quando `activationDate > deactivationDate` (ordem inválida das datas)

**Jornada do usuário:**
> *Estou editando as datas com pressa e por descuido coloco `Activation = today + 10` e `Deactivation = today + 5` — ou seja, pedindo pra ativar depois de já ter desativado. Se a UI deixasse passar, eu criaria um programa "impossível" (permanentemente inativo) e só descobriria na reclamação do cliente dias depois. Clico o check e espero que a UI **me pare**: erro claro ("Activation Date must be on or before Deactivation Date"), linha **permanece em edit mode**, nenhuma request vai pro backend. É a UI cuidando de mim antes de eu mesmo estragar.*

**Objetivo de negócio:** evita período inconsistente + validação client-side dá feedback imediato (sem round-trip). Defesa em profundidade: se a UI falhar, o backend ainda devolve 400 com a mesma regra espelhada.

**Pré-condição:** modal aberto, programa em edit mode

**Passos:**
1. Entrar em edit mode na linha de qualquer programa
   1. Preencher `Activation Date = today + 10d` e `Deactivation Date = today + 5d` (invertidas intencionalmente)
2. Clicar o ícone **check (✓)** para tentar commit

**Resultado esperado:**
- Mensagem de erro visível próximo ao campo ou linha — texto esperado na vizinhança de **"Activation Date must be on or before Deactivation Date"** (texto exato a confirmar com UI)
- A linha **permanece em edit mode** (não volta ao read-only); valores inválidos não são aceitos
- Ícones check/cancel continuam disponíveis
- Nenhuma request é enviada ao backend neste passo (confirmar via network interceptor)
- **Contra-teste de defesa em profundidade:** se por bypass a UI chamar o backend, espera-se **400** com payload contendo `"activationDate must be before or equal to deactivationDate"` (validação espelhada em `MerchantProgramService.java:56-58`)

**Tags:** `@regression @e2e @validation @programs-page`

---

#### CT-06: Clicar SAVE no Program Details persiste as datas no DB e gera entry no audit log

**Jornada do usuário:**
> *Já editei as datas do programa no painel direito — agora preciso confirmar que o que eu digitei **realmente ficou salvo**. Clico **SAVE** e espero três coisas: feedback na hora (toast/spinner → sucesso); quando eu recarregar a página e reabrir o programa, as datas continuam lá (não evaporaram); e quando o compliance vier perguntar "quem mudou isso?" eu consigo mostrar na aba **Notes** — logo abaixo do form — a entry com meu usuário, timestamp, e o delta exato das datas (antes → depois). Essa prova de auditoria é o que diferencia "salvar" de "salvar e estar em conformidade".*

**Objetivo de negócio:** valida o ciclo completo **edit → SAVE → persist → audit**. É o teste que protege regulatório (SOC/PCI) — sem audit log visível, a feature é rejeitada em auditoria independente do backend estar correto.

**Passos para reprodução manual:**

1. Navegar para `https://origination-qa2.uownleasing.com/programs`
2. Na listagem esquerda, localizar o programa de teste (usar filtro **Search** com o nome do programa criado)
3. Clicar na linha do programa → painel direito **Program Details** abre populado
4. **Capturar o estado "antes":**
   - Anotar valores atuais de `Activation Date` e `Deactivation Date`
   - Anotar quantidade atual de entries na seção **Notes**
5. Limpar o campo `Activation Date` e digitar `today − 5 dias` (formato `MM/DD/YYYY`)
6. Limpar o campo `Deactivation Date` e digitar `today + 30 dias`
7. Clicar no botão **SAVE** no topo do painel direito
8. Aguardar feedback visual de sucesso (toast / indicador)
9. **Validação 1 — reload:** recarregar a página (F5) e reabrir o mesmo programa → confirmar que as datas persistiram
10. **Validação 2 — audit log via UI (OBRIGATÓRIO):** na seção **Notes** do Program Details, localizar a entry mais recente e confirmar:
    - Coluna `Type` = `PROGRAM_DATA_CHANGE`
    - Coluna `Date` = timestamp posterior ao clique em SAVE
    - Coluna `User ID` = usuário logado (ex.: `manager`)
    - Coluna `Notes` contém o delta das 2 datas — padrão: `"UPDATED: PROGRAM[activationDate changed from <valor_antigo> to <valor_novo> , deactivationDate changed from <valor_antigo> to <valor_novo> ]"`
    - Expandir a entry (chevron) se o texto estiver truncado — confirmar match com coluna `notes` do DB
11. **Validação 3 — cross-check UI ↔ DB:** a string da Notes exibida na UI deve bater exatamente com o valor retornado pelo `SELECT notes FROM uown_merchant_activity_log WHERE program_pk=<pk> AND log_type='PROGRAM_DATA_CHANGE' ORDER BY row_created_timestamp DESC LIMIT 1` (sem divergência = sem truncamento/escape diferente)

**Resultado esperado (critérios de passagem):**

**Camada de rede (DevTools Network tab):**
- Request `POST` para `/uown/createOrUpdateProgram` disparada
- Status da response = **200**
- Response body contém `programInfo` com as novas datas (backend ecoa o persistido)

**Camada de banco de dados:**
```sql
SELECT activation_date, deactivation_date, is_active, row_updated_timestamp, row_created_timestamp
FROM uown_merchant_program
WHERE pk = <programPk>;
```
- `activation_date` = hoje − 5 dias
- `deactivation_date` = hoje + 30 dias
- `is_active` = **true** (derivado pelas datas — hoje está dentro da janela; regra Source of Truth)
- `row_updated_timestamp` > `row_created_timestamp` (programa foi atualizado)

**Audit log (seção Notes):**
```sql
SELECT log_type, created_by, notes, row_created_timestamp
FROM "MerchantActivityLog"
WHERE program_p_k = <programPk>
  AND log_type = 'PROGRAM_DATA_CHANGE'
ORDER BY row_created_timestamp DESC LIMIT 1;
```
- Nova entry posterior ao clique em SAVE
- `log_type = 'PROGRAM_DATA_CHANGE'`
- `notes` contém o delta das datas, padrão:
  `"UPDATED: PROGRAM[activationDate changed from <antigo> to <novo>, deactivationDate changed from <antigo> to <novo>]"`
- `created_by` = username logado (ex.: `manager`)

**Camada UI:**
- Após reload (F5) e reabrir o programa: inputs `Activation Date` e `Deactivation Date` mostram as novas datas
- Seção **Notes** lista a nova entry no topo (ordenação desc por Date)

**Cleanup:** remover programa de teste via `cleanupTestProgram` no `afterEach` — soft-delete via `deactivationDate = 2020-01-01` (não existe DELETE endpoint no backend).

**Tags:** `@smoke @critical @e2e @programs-page`
**[reflex #11]** Mutation genérica: `row_updated_timestamp` muda + audit log registrado
**[reflex SoT]** `is_active` é **derivado das datas** — backend sobrescreve a flag `active` via `ProgramActivationUtils.isActiveOnDate` em todo save (ver regra Source of Truth no header deste doc)

---

#### CT-07: Guard rail — navegar sem salvar avisa sobre perda de edições

**Jornada do usuário:**
> *Estou no meio de editar as datas do programa `P_EDITING`. Toca o telefone, me chamam pra uma reunião, eu clico em outro programa na lista (ou no menu Merchants, ou no botão voltar do browser) **sem lembrar de clicar SAVE**. A UI precisa me proteger desse deslize: um popup do tipo "você tem alterações não salvas — quer mesmo sair?" com dois botões — um pra ficar editando, outro pra descartar e seguir. Se a UI descarta silenciosamente, eu só descubro dias depois quando o cliente ligar reclamando que o programa não entrou no ar na data combinada.*

**⚠ Status — DISCOVERY:** este guard rail pode **não estar implementado** no Origination atual. O issue original descrevia um "popup de confirmação com botões Go back / Continue" num contexto de modal com bulk-edit que não existe na UI real (2-pane side panel). Este CT passa a ser **discovery** — 1ª execução determina:

- **(A)** Guard rail existe com popup próprio → pinar texto/botões como `[CONFIRMADO]`
- **(B)** Usa `beforeunload` nativo do browser → validar `dialog` handler
- **(C)** Sem guard rail → `[OBSERVAÇÃO]` de UX gap; não é bug regressivo, mas merece ticket de melhoria

**⚠ Status — DISCOVERY:** este guard rail pode **não estar implementado** no Origination atual. O issue original descrevia um "popup de confirmação com botões Go back / Continue" num contexto de modal com bulk-edit que não existe na UI real (2-pane side panel). Este CT passa a ser **discovery** — 1ª execução determina:

- **(A)** Guard rail existe com popup próprio → pinar texto/botões como `[CONFIRMADO]`
- **(B)** Usa `beforeunload` nativo do browser → validar `dialog` handler
- **(C)** Sem guard rail → `[OBSERVAÇÃO]` de UX gap; não é bug regressivo, mas merece ticket de melhoria

**Pré-condição:**
- Admin autenticado em Origination qa2
- Existem **2 programas** atribuídos a OL90294-0001 — `P_EDITING` (onde vamos editar) e `P_OTHER` (destino da navegação)
- Ambos fresh (criados pelo próprio CT via `createTestProgram`)

**Passos para reprodução manual:**

1. Navegar para `https://origination-qa2.uownleasing.com/programs`
2. Na lista à esquerda, clicar em `P_EDITING` → painel direito **Program Details** abre populado
3. Alterar `Activation Date` para uma nova data (ex.: `today + 10 dias` — formato `MM/DD/YYYY`)
4. **Não clicar SAVE** — deixar o formulário dirty
5. **Trigger de navegação** (testar os 3 que a UI real suportar):
   - **5a.** Clicar na linha de `P_OTHER` na listagem esquerda
   - **5b.** Clicar no link de outro item no menu de navegação do portal (ex.: Merchants)
   - **5c.** Usar botão **voltar** do browser (`browser back`)
6. **Observar o que acontece:**
   - Popup/dialog aparece com aviso de alterações não salvas?
   - Se sim: capturar texto completo do popup + labels exatos dos botões
   - Se não: formulário descartado silenciosamente OU persistido implicitamente?

**Validações (discovery — escrever teste tolerante a múltiplos comportamentos):**

**Branch A — Guard rail com popup custom:**
- [ ] Popup aparece com texto sobre "unsaved changes"
- [ ] 2 opções: **Stay / Go back** (mantém editando) e **Discard / Leave** (descarta)
- [ ] Clicar **Stay** → popup fecha, formulário continua dirty na mesma página
- [ ] Clicar **Discard** → navegação ocorre; formulário descartado; DB **não** mudou; nenhuma request `POST /uown/createOrUpdateProgram` foi enviada

**Branch B — Browser native `beforeunload`:**
- [ ] Handler `dialog` do Playwright captura o prompt nativo
- [ ] `dialog.message()` contém algo sobre alterações não salvas
- [ ] `dialog.accept()` = sair; `dialog.dismiss()` = ficar
- Este branch só é observável com triggers 5c (browser back) ou reload/close

**Branch C — Sem guard rail (UX gap):**
- [ ] Navegação ocorre imediatamente
- [ ] Formulário descartado sem aviso
- [ ] DB não mudou (ainda assim — a edição nunca foi salva)
- Reportar como `[OBSERVAÇÃO UX]` no relatório — feature nova pode incluir esse guard ou não; não é regressão

**Validação negativa obrigatória em todos os branches:**
- [ ] DB (`uown_merchant_program WHERE pk = P_EDITING.pk`): datas **não** mudaram — valor original preservado (pendência nunca foi persistida)
- [ ] Network: **nenhuma** request `POST /uown/createOrUpdateProgram` foi disparada enquanto o formulário estava dirty

**Cleanup:** `cleanupTestProgram` para `P_EDITING` e `P_OTHER` no `afterEach`.

**Tags:** `@regression @e2e @programs-page @discovery @ux-guard`

---

#### CT-07c: Add + Clone de programa com `activationDate` / `deactivationDate` definidos

**Jornada do usuário:**
> *Preciso criar uma oferta nova agendada pra começar daqui a 7 dias (campanha de lançamento) e, na mesma sessão, clonar um programa existente que performou bem, ajustando só as datas do clone. Quero fazer isso **de uma vez**, sem salvar → reabrir → editar. No modal Programs: (1) adiciono `NEW` e já seto as datas antes do commit da linha; (2) clono `SOURCE` e ajusto as datas do clone. Clico Save no footer e tudo vai junto pro backend. Depois verifico na Activity Log do merchant + na seção Notes de cada programa criado que as entries de auditoria foram emitidas — uma por programa + uma do ponto de vista do merchant. Três telas, três provas.*

**Objetivo de negócio:** reduz cliques e evita estados transitórios (programa criado sem datas). Essencial para quem configura várias ofertas em batch.

**Pré-condição:**
- Programs page → modal Programs aberto
- Existe programa `SOURCE` no catálogo já atribuído ao merchant OL90294-0001 com `activation=today-30d`, `deactivation=today+30d`, `active=true` (fonte para clone)
- Existe programa `NEW` no catálogo ainda não atribuído

**Passos:**

**Parte A — ADD com datas:**
1. No modal, dropdown "Add program" → selecionar `NEW`
2. `NEW` aparece no topo da tabela em modo pré-populado (ou mesmo já em edit mode, conforme UX)
3. Clicar pencil na nova linha (se necessário) → setar `activation = today + 7d`, `deactivation = today + 90d`
4. Clicar check (✓) para commit da linha

**Parte B — CLONE de programa existente:**
5. Na linha de `SOURCE`, clicar ação **Clone** (ícone copy/duplicate — confirmar nomenclatura na UI real)
6. Validar: nova linha `CLONE_OF_SOURCE` (ou nome derivado) aparece no topo da tabela com datas do SOURCE pré-preenchidas OU vazias (dependendo do UX — validar comportamento empírico)
7. Editar datas do clone: `activation = today`, `deactivation = today + 180d`
8. Clicar check para commit

**Parte C — Persistência:**
9. Clicar Save no footer → toast de sucesso + modal fecha
10. Reabrir modal → validar ambas entradas persistidas:
    - `NEW`: `activation=today+7d`, `deactivation=today+90d`, Status = **Inactive** (ainda não começou)
    - Clone: `activation=today`, `deactivation=today+180d`, Status = **Active**
11. **Cross-page:** merchant page mostra ambos os programas com Status correto + tooltip correto
12. **Audit via UI — program log do CLONE (OBRIGATÓRIO):** abrir o programa clonado em `/programs` → seção **Notes** do Program Details → confirmar entry mais recente:
    - `Type` = `PROGRAM_DATA_CHANGE`
    - `Notes` descreve a criação (padrão: `"Program <clone_name> created"`) e as datas setadas
    - `User ID` = usuário logado
13. **Audit via UI — program log do NEW (OBRIGATÓRIO):** mesma validação para o programa `NEW` criado na Parte A
14. **Audit via UI — merchant log (OBRIGATÓRIO):** merchant detail page de OL90294-0001 → aba Activity Log → confirmar 2 entries referenciando `NEW` e Clone (merchant-scope log de atribuição)

**Validações DB:**
- [ ] `SELECT pk, program_pk, activation_date, deactivation_date, is_active FROM uown_merchant_program WHERE merchant_pk=<OL90294-0001.pk>` retorna 2 novas rows (NEW + clone)
- [ ] `is_active` foi calculado pelo backend no save: NEW=false (futuro), clone=true
- [ ] Row do clone NÃO sobrescreveu o SOURCE (SOURCE continua existindo com datas originais)
- [ ] `uown_merchant_activity_log` tem ≥ 2 entries `PROGRAM_DATA_CHANGE` com `program_pk IN (NEW.pk, clone.pk)` + `merchant_pk=<OL90294-0001.pk>` — corresponde às entries UI dos passos 12-14

**Validações negativas:**
- [ ] Se tentar clone com `activation > deactivation` antes de commit → mesma validação do CT-05 (UI bloqueia + mensagem)

**Cleanup:**
- Remover `NEW` e clone via trash + Save OU diretamente via API `deleteMerchantProgram` no `afterEach`

**Tags:** `@regression @e2e @critical @programs-page @clone @audit-log`
**[reflex #11]** Mutation: 2 novos records com `row_created_timestamp`, `row_updated_timestamp`, audit log em 2 escopos

---

#### CT-07b: Cancel + Delete no modal (Programs page)

**Jornada do usuário:**
> *Dois cenários que preciso proteger: (1) adicionei um programa `Z` por engano — clico **Cancel** no footer e espero que **nada** seja persistido (reabrir = tabela volta ao estado anterior, sem `Z`, sem entry no audit log porque eu nem chegar a mutar o banco); (2) um programa `W` saiu de linha e preciso desatribuir do merchant — clico trash em `W`, depois Save, e espero que a remoção vá pro banco, apareça imediatamente na merchant page, e gere entry no Activity Log do merchant com meu usuário. Cancel = reversão total + zero audit. Delete + Save = efeito real + audit obrigatório.*

**Objetivo de negócio:** distingue "rascunho descartado" de "mutação persistida" — Cancel nunca deve deixar rastro; Delete deve sempre deixar.

**Passos:**
1. Programs page → modal Programs → adicionar programa `Z` (sem Save); clicar CANCEL no footer
2. Reabrir modal → validar: `Z` NÃO está na tabela (sem persistência após Cancel)
3. Usar trash icon em programa existente `W` → linha some da tabela local
4. Clicar Save no footer → toast sucesso
5. **Cross-page check:** abrir merchant page → `W` não aparece mais em Programs (efeito cross-page confirmado)
6. **Audit via UI — merchant log (OBRIGATÓRIO para o delete):** na aba Activity Log da merchant page → confirmar entry recente descrevendo a remoção de `W` (texto inclui nome do programa); `User ID` = usuário logado
7. **Audit via UI — Cancel não gera entry:** confirmar que o Cancel (passo 1) NÃO criou entry no log (cancel é in-memory puro — nenhuma mutação deve ser auditada)

**Resultado esperado:**
- Cancel = sem persistência (in-memory discard) — **sem entry de audit**
- Delete + Save = remoção persistida em DB + propagação para merchant page + **entry de audit na merchant activity log**
- DB: `SELECT notes FROM uown_merchant_activity_log WHERE merchant_pk=<OL90294-0001.pk> AND notes ILIKE '%<W_name>%' ORDER BY row_created_timestamp DESC LIMIT 1` retorna entry de remoção
- UI Notes/Activity Log mostra entry com texto match do DB

**Tags:** `@regression @e2e @programs-page @audit-log`
**[reflex #11]** Mutation (remove) — merchant scope log OBRIGATÓRIO; in-memory (cancel) NUNCA loga

---

### Grupo 2 — Derivação de Status (CT-08..CT-17)

**Jornada do usuário comum ao grupo:**
> *Sou admin e quero confiar no badge **Active/Inactive** que a UI me mostra. Seto uma combinação específica de datas, clico SAVE, e imediatamente olho: o badge está consistente com a regra `(activation ≤ today) AND (deactivation ≥ today)`? E se eu fechar a página, recarregar, e voltar — o status persiste? Cada linha da tabela abaixo representa uma **combinação real que o admin pode configurar no dia-a-dia**: programa vigente (CT-08), programa que começa hoje (CT-09/23), programa que termina hoje (CT-10/21), programa agendado pro futuro (CT-11), programa com vigência expirada (CT-12), programa eterno (CT-13), programa open-ended com início no passado (CT-14), programa com prazo mas sem data inicial (CT-15), programa zumbi — sem início e já vencido (CT-15b), transições de estado (CT-16 desativa hoje; CT-17 ativa hoje).*

**Formato compactado — cada CT segue:**
1. **Programs page** → Program Details → editar datas → clicar **SAVE**
2. **Audit via UI (OBRIGATÓRIO):** seção **Notes** do Program Details → confirmar entry `PROGRAM_DATA_CHANGE` mais recente com `notes` descrevendo o delta das datas (cada iteração cria uma entry — não reutilizar programa entre iterações, ou cada entry acumula no log e faz a asserção de "entry mais recente" ainda assim passar)
3. **Merchant page** (OL90294-0001) → observar Status na seção Programs (read-only)
4. Hover no Status → validar tooltip
5. Reload da **merchant page** → validar Status persistido
6. **DB cross-check (opcional — suite impl):** `SELECT notes FROM uown_merchant_activity_log WHERE program_pk=<pk> AND log_type='PROGRAM_DATA_CHANGE' ORDER BY row_created_timestamp DESC LIMIT 1` → texto bate com UI Notes

| CT | Activation | Deactivation | Status esperado | Tooltip |
|:---|:-----------|:-------------|:----------------|:--------|
| **CT-08** | today − 10d | today + 10d | **Active** | ambas datas |
| **CT-09** | today | (vazio) | **Active** (inclusivo) | activation + `—` |
| **CT-10** | today − 5d | today | **Active** (inclusivo) | ambas datas |
| **CT-11** | today + 10d | (vazio) | **Inactive** | activation + `—` |
| **CT-12** | today − 30d | today − 1d | **Inactive** | ambas datas |
| **CT-13** | (vazio) | (vazio) | **Active** | `—` / `—` |
| **CT-14** | today − 30d | (vazio) | **Active** | activation + `—` |
| **CT-15** | (vazio) | today + 30d | **Active** (enquanto hoje ≤ deactivation) | `—` + deactivation |
| **CT-15b** | (vazio) | today − 1d | **Inactive** (quick-ref row 8: null activation + past deactivation) | `—` + deactivation |
| **CT-16** | — (start Active) → editar `deactivation = yesterday` | — | Active → **Inactive** | verificar transição |
| **CT-17** | — (start Inactive) → editar `activation = today` | — | Inactive → **Active** | verificar transição |

**Tags todos:** `@regression @e2e @status-derivation`

> **Nota CT-15b:** cobre linha 8 da Quick Reference da task (activation null + deactivation no passado). Caso a UI bloqueie setar apenas `deactivation` no passado sem `activation` via inline edit, o fallback é autorizar `UPDATE uown_merchant_program SET activation_date=NULL, deactivation_date=<yesterday>` (mesma autorização de DB UPDATE do Grupo 3) — capturar no 1º run qual caminho se aplica e ajustar o CT.

---

### Grupo 3 — Sweep job (CT-18..CT-25)

**Jornada do sistema (do ponto de vista do admin/operador):**
> *Configurei ontem o programa pra desativar em 2026-04-22. Hoje é 2026-04-23 — eu não preciso voltar na UI, clicar em nada, nem correr pra atualizar o flag `is_active`. O **sweep** (job agendado `ProgramActivationDeactivationSweep`) roda sozinho, compara cada programa com a data de hoje, e se o programa "cruzou" a borda (ativação chegou ou desativação passou) ele atualiza `is_active` silenciosamente. Quando o time de risco abrir a página amanhã de manhã, o Status já estará correto sem intervenção humana. Estes CTs simulam esse "dia seguinte" — criamos a condição de borda no banco (UPDATE autorizado porque a UI não consegue produzir `deactivation = yesterday` em 1 clique), chamamos o sweep, e confirmamos que o sistema fez a conta sozinho.*

> **Autorização DB UPDATE direto:** Usuário autorizou em 2026-04-22 `UPDATE uown_merchant_program SET activation_date/deactivation_date ...` para criar condições de boundary impossíveis via UI (e.g. `deactivation = yesterday`).
>
> **Cleanup:** cada CT guarda `{pk, activation_date_before, deactivation_date_before, is_active_before}` e restaura no `afterEach`.

#### CT-18: Endpoint sweep retorna sucesso + loga execução

**Intenção:** antes de testar qualquer boundary, provar que o endpoint do sweep **responde** e **deixa rastro**. Se este smoke falha, todos os CTs seguintes do grupo estão cegos (podem ficar "passando" por coincidência de estado).

**Tipo:** API + Log
**Passos:**
1. Pegar qualquer `uown_merchant_program.pk` do merchant OL90294-0001
2. `POST /uown/svc/triggerScheduledTask/merchantProgramActivationDeactivationSweep`
3. Validar response: 200 OK (body vazio ou `{success:true}`)
4. Validar `merchant_activity_log` contém entry recente de sweep (filtrar por timestamp > request start)

**Resultado esperado:** 200 + log populado

**Tags:** `@smoke @api @sweep`

---

#### CT-19: Active → Inactive quando deactivation_date move para passado

**Simulação da passagem do tempo:** programa estava Active ontem; hoje a data de desativação já passou. O admin NÃO precisa entrar na UI — quando ele abrir amanhã, o Status já aparece como Inactive porque o sweep fez a reconciliação automaticamente.

**Passos (arrange):**
1. Setup: criar/pegar programa com `is_active=true`, `activation=today-10d`, `deactivation=today+30d`
2. `UPDATE uown_merchant_program SET deactivation_date = CURRENT_DATE - INTERVAL '1 day' WHERE pk = <pk>` (autorizado)
3. Validar pré-sweep: `is_active=true` ainda (sweep não rodou)

**Act:** POST sweep

**Assert:**
- `SELECT is_active FROM uown_merchant_program WHERE pk=<pk>` → **false**
- UI: após reload, Status = Inactive

**Cleanup:** restaurar `deactivation_date` e `is_active` originais

**Tags:** `@regression @hybrid @sweep`

---

#### CT-20: Inactive → Active quando activation_date move para hoje

**Simulação:** programa agendado pra começar hoje. Admin configurou ontem; hoje o sweep "acorda o programa" — Status transita de Inactive pra Active sem nenhum clique humano. É o valor central da feature: **agendamento que dispara sozinho**.

**Arrange:** `is_active=false`, `activation=today+30d`, `deactivation=null`
**Act:** `UPDATE ... SET activation_date = CURRENT_DATE` + POST sweep
**Assert:** `is_active=true`; UI = Active

**Tags:** `@regression @hybrid @sweep`

---

#### CT-21: Boundary — deactivation = today deve permanecer/virar Active

**Preocupação do usuário:** "se eu coloquei `deactivation = hoje`, minha campanha ainda vale hoje ou já acabou?". Regra de negócio: **hoje ainda conta** — o programa só vira Inactive a partir de amanhã. O sweep tem que respeitar esse inclusivo.

**Arrange:** `activation<=today OR null`, `deactivation=CURRENT_DATE`, `is_active` qualquer
**Act:** POST sweep
**Assert:** `is_active=true` (hoje ainda é dia válido — inclusivo); UI = Active

**Tags:** `@regression @hybrid @boundary @sweep`

---

#### CT-22: Boundary — deactivation = yesterday deve ser Inactive

**Preocupação do usuário:** "a campanha acabou ontem — tenho certeza que hoje ninguém mais consegue atribuir esse programa numa aplicação nova". Sweep precisa reconhecer a borda oposta do CT-21: passou 1 dia → programa fora do ar.

**Arrange:** `activation<=yesterday OR null`, `deactivation=CURRENT_DATE - 1`
**Act:** POST sweep
**Assert:** `is_active=false`; UI = Inactive

**Tags:** `@regression @hybrid @boundary @sweep`

---

#### CT-23: Boundary — activation = today deve virar Active

**Preocupação do usuário:** "agendei pra ativar hoje — espero que **hoje mesmo**, não amanhã, o programa já apareça como Active pros clientes que aplicarem agora". Inclusivo na entrada.

**Arrange:** `activation=CURRENT_DATE`, `deactivation=null OR >=today`, `is_active=false`
**Act:** POST sweep
**Assert:** `is_active=true`; UI = Active

**Tags:** `@regression @hybrid @boundary @sweep`

---

#### CT-24: Overlap same-day — activation=today, deactivation=today

**Preocupação do usuário:** "preciso oferecer esse programa **somente hoje** — flash sale de um dia". Configuro `activation = deactivation = hoje`. Espero que o programa fique Active **apenas neste dia**, seja visível para quem aplicar agora e saia do ar amanhã pelo sweep. O tooltip reflete isso: mesma data nas duas linhas.

**Arrange:** ambas datas = `CURRENT_DATE`, `is_active` qualquer
**Act:** POST sweep
**Assert:** `is_active=true`; UI = Active; tooltip mostra mesma data nas 2 linhas

**Tags:** `@regression @hybrid @boundary @sweep`

---

#### CT-25: Idempotência — 3 sweeps consecutivos

**Preocupação do operador:** "se o cron dispara 2× por acidente (retry, network glitch, ou se um engenheiro rodar manual além do automático), os programas podem ficar oscilando Active ↔ Inactive?". Resposta esperada: não — o sweep **só muda** quando há discrepância real. Rodadas subsequentes sobre um estado já consistente são no-op. Log registra as 3 chamadas, mas apenas a 1ª tem entry substantiva de mudança.

**Arrange:** preparar 2 programas (1 should-be-Active, 1 should-be-Inactive)
**Act:** POST sweep 3x em sequência (< 5s entre calls)
**Assert:**
- Estado final consistente com estado após primeiro sweep
- Nenhum flip indesejado
- `merchant_activity_log` tem 3 entries MAS apenas 1ª entry tem `activated/deactivated` substantivo (2ª e 3ª são no-op)

**Tags:** `@regression @hybrid @idempotency @sweep`

---

### Grupo 3b — Cross-brand UI smoke

#### CT-KS-SMOKE: Modal "Programs" funciona em merchant Kornerstone

**Jornada do usuário:**
> *Testei tudo em UOWN (OL90294-0001). Agora, como admin, preciso ter certeza que se eu abrir um merchant Kornerstone (KS3015, 13m+16m) a UI se comporta igual — mesmo modal, mesmas colunas, mesmo fluxo de edit → save. Se a feature "vazou" detalhes de UOWN (header/title errado, campos faltando, botão desabilitado), descubro aqui. Uma brand inteira não pode ter UX degradada.*

**Tipo:** E2E UI
**Pré-condição:** login admin; merchant `KS3015` (FifthAveFurnitureNY) tem ≥ 1 programa
**Passos:**
1. Abrir merchant KS3015 page
2. Clicar botão para abrir modal
3. Validar que modal abre, tabela renderiza com Program Name | Activation Date | Deactivation Date | Actions
4. Editar datas de 1 programa + Save footer
5. Validar toast de sucesso + persistência

**Resultado esperado:** mesmo comportamento do CT-05 — feature é merchant-agnostic na UI
**Validação cross-contamination:** header/title da página mostra contexto Kornerstone (não UOWN)

**Tags:** `@regression @e2e @kornerstone @cross-brand`

---

### Grupo 4 — Seleção de programa por data na criação de aplicação

> **Escopo (atualizado 2026-04-22):** cenários de criação de aplicação cobrem **exclusivamente o comportamento da seleção de programa quando datas de ativação/desativação mudam** ou quando o programa preferencial está desativado. CTs de criação "puramente happy path" (CT-A, CT-A-KS, CT-B-MB, CT-B-UOWN, CT-D, CT-D-KS) foram removidos — validação de que aplicação é criada isoladamente NÃO é objetivo desta feature.
>
> CTs válidos neste grupo:
> - **CT-C-00/01/02** — Second Look (mantido por pedido explícito do user) — reforçado com validação de `is_active` do programa selecionado
> - **CT-DateSelect-\*** — desativar programa X por data e validar que aplicação pega programa Y
> - **CT-Reselect-\*** — desativar programa previamente usado e validar reseleção
> - **CT-DateSelect-BothInactive** — edge quando todos os programas estão Inactive

#### CT-C-00: [Second Look / smoke] Validar que GDS reconhece SSN `100000053` em qa2

**Jornada (guard):**
> *Antes de testar o fluxo Second Look propriamente dito, preciso ter certeza que o SSN canônico (`100000053`) está "visível" ao GDS do ambiente qa2. Se este smoke falhar, não vale a pena rodar CT-C-01/02 — estaríamos testando o nada.*

**Tipo:** API smoke (guard para CT-C-01/02)
**Passos:**
1. `sendApplication` com SSN `100000053` + TireAgent + Brian/Columbus/92821/CA (ver ssn-catalog §2)
2. SEM bank data
3. Observar response + logs

**Resultado esperado:**
- 200 com lead criado; status `UW_DENIED` em 13m E `isEligibleForExtraInfo=true` + `paymentDetailsList` com preview 16m

**Se não reproduzir** (catalog confirma só em `stg`):
- Marcar CT-C-01/02 com `test.skip(!stgOrQa2SupportsSecondLook, 'GDS SSN 100000053 not recognized in qa2')`
- Documentar no relatório como ENV-GAP — feature em qa2 não testável para Modalidade C
- Rebaixar a cobertura de C para "validado em stg em task paralela"

**Tags:** `@smoke @api @second-look @env-check`

---

#### CT-C-01: [TireAgent / Modalidade C — 1ª submissão] UW_DENIED 13m + preview 16m

**Jornada do cliente:**
> *Sou cliente aplicando pra um pneu parcelado no TireAgent. Submeti o formulário básico (sem dados bancários ainda). O sistema tentou me aprovar no plano padrão de 13 meses e **não rolou** — voltou "UW_DENIED". Mas antes de eu fechar a página frustrado, o sistema me oferece uma **segunda chance**: "você não passou no 13 meses, mas podemos tentar no 16 meses — se você completar com seus dados bancários, a gente reavalia". Essa é a essência do Second Look — o cliente que seria perdido recebe uma oferta alternativa imediata.*

**Pré-condição:**
- CT-C-00 passou (GDS reconhece SSN em qa2)
- Config: `use.taktile.for.decision=false` + `use.gds.for.decision=true` (confirmar com DevOps em qa2)
- Cleanup: expirar leads anteriores APPROVED com SSN `100000053`
- TireAgent tem programa 16m ativo hoje (via modal Programs — criar se não tiver)

**Passos:**
1. `sendApplication` com SSN 100000053 + profile fixo TireAgent (Brian/hayden/Columbus/92821/CA/Costco Wholesale/7653072625/DOB 02241987) — address `135 Buckeye Blvd`
2. SEM `mainBankRoutingNumber` / `mainBankAccountNumber` no body
3. Capturar response

**Validações:**
- [ ] Response: `status=UW_DENIED` em 13m
- [ ] Response: `isEligibleForExtraInfo=true`
- [ ] Response: `paymentDetailsList` populado com preview 16m (planId `*16`)
- [ ] DB: `uown_los_lead.status=UW_DENIED`; `uown_los_lead.merchant_program_pk` pode estar null OU apontando para programa 16m (validar empírico)

**Tags:** `@critical @api @second-look @modalidade-C`

---

#### CT-C-02: [TireAgent / Modalidade C — 2ª submissão] UW_APPROVED 16m + programa 16m ativo nas datas

**Jornada do cliente (continuação do CT-C-01):**
> *Completei meus dados bancários e reenviei. Agora o sistema me aprova no plano de 16 meses — ufa, fechei a compra. Do ponto de vista do negócio, o que importa é: o programa 16m que me foi oferecido era **realmente elegível** (dentro da janela `activation ≤ today ≤ deactivation`)? Se o admin tinha desativado o 16m ontem por data, o Second Look **não** deveria ter oferecido. Este CT valida que o Second Look respeita a feature de datas — não atalha o gating só porque "é uma segunda chance".*

**Objetivo alinhado ao escopo da feature:** validar que o backend seleciona um programa 16m que está **com `is_active=true` derivado das datas** — Second Look respeita o gating.

**Pré-condição:** CT-C-01 passou; mesmo SSN `100000053`; mesmo profile EXATO (qualquer divergência → ADDRESS_MISMATCH, ver ssn-catalog §2); programa 16m do TireAgent está Active hoje (datas cobrindo today ou nulls)

**Passos:**
1. `sendApplication` com **MESMO** SSN + profile do CT-C-01
2. **ADICIONAR** `mainBankRoutingNumber=TEST_BANK.DEFAULT_ROUTING` + `mainBankAccountNumber=TEST_BANK.DEFAULT_ACCOUNT`
3. Avançar `getMissingFields` → `submitApplication` com MASTERCARD_APPROVED + planId 16m
4. Drive lead para FUNDED via helpers canônicos

**Validações (alinhadas ao escopo da feature):**
- [ ] Response 2ª submissão: `status=UW_APPROVED` em 16m
- [ ] DB: `uown_los_lead.merchant_program_pk` → programa 16m do TireAgent
- [ ] DB: `uown_los_sched_summary.term_in_months = 16`
- [ ] **DB (validação-chave):** programa 16m selecionado tem `is_active=true` + `(activation_date <= today OR null) AND (deactivation_date >= today OR null)` — prova que backend respeita datas mesmo em fluxo Second Look

**Tags:** `@critical @api @second-look @modalidade-C @program-selection @date-driven`

---

#### CT-C-03: [Second Look + programa 16m desativado por data] Comportamento quando 16m está Inactive

**Jornada:**
> *Cenário de risco: o admin desativou por data o único programa 16m elegível do merchant (campanha antiga que acabou). Um cliente chega, é negado no 13m, e o sistema lhe oferece o Second Look 16m. **Mas esse 16m está oficialmente fora do ar.** O que acontece? Três hipóteses de comportamento — este CT descobre qual o backend implementa e se é coerente com a regra "datas são Source of Truth".*

**Pré-condição:**
- CT-C-01 foi executado (primeira submissão denied 13m + preview 16m)
- Capturar `pk_16m` do programa 16m do TireAgent via DB
- Snapshot das datas originais (para restaurar no cleanup)

**Passos para reprodução manual:**
1. Após CT-C-01 (preview 16m recebido), ANTES da 2ª submissão:
   ```sql
   UPDATE uown_merchant_program
   SET deactivation_date = CURRENT_DATE - INTERVAL '1 day'
   WHERE pk = <pk_16m_TireAgent>;
   ```
2. Disparar sweep: `POST /uown/svc/triggerScheduledTask/merchantProgramActivationDeactivationSweep`
3. Validar DB: `is_active=false` no programa 16m
4. Executar 2ª submissão idêntica ao CT-C-02 (mesmo SSN, mesmo profile, bank data adicionada)
5. Capturar response e state do lead

**Validações — discovery:**
- [ ] **Hipótese A (Second Look falha):** response 2ª submissão retorna denied OU erro porque 16m desativado → sistema respeita datas mesmo em Second Look (comportamento consistente)
- [ ] **Hipótese B (Second Look ignora datas):** response 200 com UW_APPROVED em 16m mesmo com programa Inactive → `[HIPÓTESE possível bug]` — Second Look pode ter caminho que bypass o filtro `is_active`

**Decisão:** se Hipótese B for confirmada → reportar como **[CONFIRMADO] bug de seleção em Second Look** (a feature de datas deveria aplicar uniformemente)

**Cleanup:** restaurar datas originais do programa 16m + sweep

**Tags:** `@critical @api @second-look @modalidade-C @program-selection @date-driven @discovery`

---

#### CT-DateSelect-13to16-UOWN: [UOWN] Desativar 13m em UOWN — aplicação É RECUSADA (UOWN não usa 16m)

**Jornada:**
> *Como admin de UOWN, desativei por data todos os programas 13m do merchant OL90294-0001. Chega um cliente novo aplicando — pelo roteamento do UOWN, **só 13m é considerado** (UOWN nunca oferece fallback para 16m, diferente de Kornerstone). O que espero ver: a aplicação é **recusada** com decline genérico (`appApprovalStatus=DECLINED`, `paymentDetailsList=[]`). O gating por data funcionou: sem programa 13m ativo, não há oferta — o cliente sai sem proposta. Isso valida que o admin pode "tirar do ar" uma brand inteira via datas.*

> ⚠️ **REVISÃO (2026-04-23):** validação manual confirmou que **UOWN OL90294-0001 não considera 16m em `sendApplication`**, mesmo com o programa 16m atribuído. A cobertura real de fallback 13↔16 vive em `CT-DateSelect-13to16-KS`.

**Cobertura da feature:** o test-chave para "desativar um termo → outro termo é usado" mudou de lugar — ficou em `CT-DateSelect-13to16-KS` (Kornerstone suporta Modalidade B com fallback 13↔16).

**Pré-condição:**
- Merchant `OL90294-0001` possui ambos os programas `P_13M` e `P_16M` atribuídos e ativos hoje
  - Se só 13m estiver atribuído → pular via skip rules do CT-B-UOWN (16m pode não ser suportado para UOWN pela business rule)
- Capturar `pk_13m` e `pk_16m` via `SELECT pk, program_name FROM uown_merchant_program WHERE merchant_pk=<OL90294-0001.pk>`

**Passos para reprodução manual:**

**Parte A — ARRANGE (desativar 13m via data, manter 16m ativo):**
1. Autenticar no Origination `https://origination-qa2.uownleasing.com` como admin
2. Abrir cliente SQL (DBeaver / pgAdmin / psql) conectado à database de qa2
3. Executar query de descoberta dos programas:
   ```sql
   SELECT pk, program_name, activation_date, deactivation_date, is_active
   FROM uown_merchant_program
   WHERE merchant_pk = (SELECT pk FROM uown_merchant WHERE ref_merchant_code='progressmobility');
   ```
   → Anotar `pk_13m` (programa com `term_in_months=13`) e `pk_16m` (term 16)
4. Executar o UPDATE autorizado para desativar 13m:
   ```sql
   UPDATE uown_merchant_program
   SET deactivation_date = CURRENT_DATE - INTERVAL '1 day'
   WHERE pk = <pk_13m>;
   ```
5. Abrir Postman (ou curl) e disparar o sweep:
   ```
   POST https://svc-qa2.uownleasing.com/uown/svc/triggerScheduledTask/merchantProgramActivationDeactivationSweep
   Headers: Authorization: Bearer <token>
   Body: (vazio)
   ```
   → Esperar 200 OK
6. Re-executar a query do passo 3 para confirmar:
   - `pk_13m` → `is_active=false`, `deactivation_date=ontem`
   - `pk_16m` → `is_active=true`
7. Validação cross-UI:
   - Navegar para `/programs` no Origination, filtrar por nome do programa 13m, abrir o Program Details → confirmar `Deactivation Date` no passado + seção Notes com `active changed from true to false`

**Parte B — ACT (criar aplicação completa):**
8. No Origination, iniciar **New Application**
9. Selecionar merchant **Progress Mobility (OL90294-0001)**
10. Preencher formulário do applicant (todos dados fresh):
    - Nome: `TestDateSel{timestamp}`
    - Email único: `datesel-{timestamp}-{rand}@mailinator.com` (pitfall #1)
    - SSN: 9 dígitos que NÃO terminem em 9 (UW_APPROVED)
    - Address / State / ZIP: quaisquer válidos (CA preferível)
    - Outros campos obrigatórios conforme form
11. Submeter primeiro step; aguardar decisão UW = Approved
12. Avançar até Complete Application
13. Preencher Credit Card com **MASTERCARD_APPROVED**: `5500 0000 0000 0004`, exp válida, CVC `123` (pitfall #3)
14. Preencher Bank Account: routing `123456780`, account `160781900000` (TEST_BANK; pitfall #5)
15. Finalizar / Submit

**Parte C — ASSERT:**
16. Capturar `leadPk` da URL de confirmação ou do DB:
    ```sql
    SELECT pk, merchant_program_pk, status FROM uown_los_lead
    WHERE email_primary='<email_usado>' ORDER BY pk DESC LIMIT 1;
    ```
4. Inspecionar response de `sendApplication` e state final do lead no DB

**Validações:**
- [ ] Response de `sendApplication`: `paymentDetailsList` contém **apenas** entradas com `planId` terminado em `16` (ex.: `MN16`); nenhuma entrada `*13` (porque 13m está Inactive no merchant)
- [ ] DB: `SELECT merchant_program_pk FROM uown_los_lead WHERE pk = <leadPk>` → valor igual a `pk_16m`
- [ ] DB: `SELECT is_active FROM uown_merchant_program WHERE pk = <leadPk.merchant_program_pk>` → `true` (lead referenciou programa ativo)
- [ ] DB: `SELECT term_in_months FROM uown_los_sched_summary WHERE lead_pk=<leadPk>` → `16`
- [ ] DB: `SELECT company FROM uown_los_lead WHERE pk=<leadPk>` → `UOWN`
- [ ] **Negativa (contra-prova):** `uown_los_lead.merchant_program_pk ≠ pk_13m` (o programa desativado NÃO foi escolhido mesmo se fosse cronologicamente o primeiro)

**Cleanup (obrigatório — programa compartilhado entre testes):**
- `UPDATE uown_merchant_program SET deactivation_date = <valor original ou NULL>, is_active = <valor original> WHERE pk = <pk_13m>`
- POST sweep para normalizar
- Validar via DB que 13m voltou para `is_active=true`

**Tags:** `@critical @e2e @uown @program-selection @date-driven @modalidade-B`

---

#### CT-DateSelect-16to13-UOWN: [UOWN] Desativar 16m em UOWN — cenário NÃO APLICÁVEL (UOWN ignora 16m)

> ⚠️ **REVISÃO (2026-04-23):** UOWN não considera o programa 16m em `sendApplication` em primeiro lugar. Desativar o 16m é **irrelevante** no UOWN — se o 13m está ativo, aplicação é criada normalmente com 13m (o estado do 16m nem é consultado). O cenário foi desmarcado; a cobertura para "desativar 16m → fallback 13m" vive em `CT-DateSelect-16to13-KS`.

**Ação:** CT **não aplicável** em UOWN. Cobertura equivalente:
- Fallback "desativar um termo → outro termo é escolhido" → `CT-DateSelect-16to13-KS`
- Happy path de 13m ativo em UOWN (independente de 16m) → `CT-DateSelect-13only-UOWN` (variante com "programa 13m ativo + programa 13m desativado" cobre o gating específico do 13m no UOWN — ver report.md)

**Tags:** `@deprecated @uown @not-applicable`

---

#### CT-DateSelect-13to16-KS: [Kornerstone] Desativar 13m por data em KS3015 → seleciona 16m

**Jornada:**
> *Admin de Kornerstone. Preciso desativar temporariamente o 13m (campanha acabou) mas manter o 16m rodando. Seto `deactivation = ontem` no 13m e rodo o sweep. Chega um cliente aplicando — Kornerstone tem a modalidade B (13m+16m com fallback automático), então o que espero ver é: como 13m está Inactive, o backend **automaticamente** encaminha pro 16m. O cliente recebe oferta 16m sem esforço extra, a aplicação é criada com `term_in_months=16`, e o lead fica ligado ao programa 16m correto. Essa é a magia da Modalidade B: admin controla a oferta via datas, cliente continua fluindo.*

**Validações extra:**
- [ ] `uown_los_lead.company = KORNERSTONE`
- [ ] `paymentDetailsList` 16m só funciona se bank data presente (pitfall #5) — caso contrário fallback 13m (mas 13m está Inactive pela data → `paymentDetailsList` fica vazio ou lead → UW_DENIED)
- [ ] Se `paymentDetailsList` vazio: validar se isso é o comportamento esperado OU `[HIPÓTESE]` (regra de negócio pode exigir ≥ 1 programa ativo)

**Tags:** `@critical @e2e @kornerstone @program-selection @date-driven @modalidade-B`

---

#### CT-DateSelect-16to13-KS: [Kornerstone] Desativar 16m por data em KS3015 → seleciona 13m

**Jornada (espelho do CT-DateSelect-13to16-KS):**
> *Outra direção do fallback: 13m continua no ar, 16m sai por data. Admin configurou; cliente chega; backend usa o 13m automaticamente. Confirma que a Modalidade B funciona nos **dois sentidos** — não há viés do roteador pra um termo específico, só a regra `is_active` guia a escolha.*

**Validações:**
- [ ] `paymentDetailsList` apenas 13m (16m desativado pela data)
- [ ] `uown_los_lead.merchant_program_pk` = pk do 13m Kornerstone
- [ ] `uown_sv_account.company=KORNERSTONE` após funding

**Tags:** `@critical @e2e @kornerstone @program-selection @date-driven`

---

#### CT-DateSelect-BothInactive: [Edge] Todos os programas elegíveis desativados → comportamento diferente por brand

**Jornada:**
> *Pior caso do gating por data: o admin, intencionalmente ou por erro, desativou **todos** os programas elegíveis do merchant. Chega um cliente aplicando. O que o cliente vê? Um erro genérico ("An unexpected error")? Uma mensagem específica dizendo "nenhum programa disponível para seu estado"? A diferença importa: genérico = UX ruim (o cliente pensa que é bug do sistema e volta depois — perda de funil), específico = UX ok (o cliente entende que é merchant-side e pode procurar outra oferta). Este CT documenta como cada brand (UOWN vs Kornerstone) reage — o UX é distinto por brand, e essa diferença precisa estar conhecida antes de qualquer investigação de "por que o cliente reclamou".*

> ✅ **CONFIRMADO MANUALMENTE (2026-04-23):** o backend rejeita corretamente em ambas as brands, mas com **mensagens distintas**.

##### Variante UOWN — OL90294-0001 (13m-only)

**Passos:**
1. Desativar todos os 13m via `UPDATE uown_merchant_program SET deactivation_date = CURRENT_DATE - 1 WHERE pk IN (<pks_13m>)` (autorizado) + sweep
2. Confirmar: todos `is_active=false`
3. `sendApplication` com SSN approved

**Resultado confirmado:**
- Response 200 com `appApprovalStatus = "DECLINED"`
- `transactionStatus = "E0"` ou `"E4"` (decline genérico)
- `paymentDetailsList = []` (vazio)
- `transactionMessage` pode vir `null` ou genérico ("An unexpected error has occurred")
- `uown_los_lead` é criado com `lead_status = UW_APPROVED` (o UW aprovou o applicant) mas `merchant_program_pk = null` (nenhum programa elegível)
- Mensagem NÃO é específica — aparece como decline genérico (observação de UX — ver item 7 da seção de observations)

**Validações:**
- [ ] `paymentDetailsList.length === 0`
- [ ] `appApprovalStatus === "DECLINED"`
- [ ] DB: `merchant_program_pk IS NULL` no lead gerado

##### Variante Kornerstone — KS3015 (13m+16m)

**Passos:**
1. Desativar ambos (13m e 16m) via UPDATE + sweep
2. Confirmar ambos `is_active=false`
3. `sendApplication` com SSN approved + bank data (pitfall #5)

**Resultado confirmado:**
- Response carrega mensagem **específica** tipo "no program for state" / "no eligible program for this state"
- `paymentDetailsList = []` (vazio)
- `appApprovalStatus` pode vir `DECLINED` ou carregar erro de negócio
- Mensagem descritiva ajuda o merchant a entender que nenhum programa está elegível no estado do applicant

**Validações:**
- [ ] `paymentDetailsList.length === 0`
- [ ] `transactionMessage` contém substring "no program" (case-insensitive) ou equivalente "no eligible program" — pinar texto exato no 1º run
- [ ] DB: `merchant_program_pk IS NULL`

**Cleanup (para ambas variantes):** restaurar todas as `deactivation_date` originais + sweep → confirmar `is_active` volta a `true` nos programas que eram ativos.

**Tags:** `@regression @e2e @edge-case @program-selection @date-driven`

---

#### CT-Reselect-UOWN: [UOWN / reseleção] Desativar P1 via UI e validar que próxima aplicação pega P2

**Jornada:**
> *Semana passada o merchant tinha 2 programas 13m ativos — P1 e P2. A aplicação 15619 foi criada usando P1. Hoje, o admin resolveu trocar de oferta: desativou P1 por data via UI (pencil → deactivation=ontem → Save). Chega um cliente novo aplicando. Espero que o backend **automaticamente** pegue P2 — nenhuma intervenção, nenhum clique adicional. Essa reseleção silenciosa é o valor real da feature em produção: admin muda oferta via datas, pipeline de vendas não para.*

**Pré-condição:** merchant tem P1 (usado antes) e P2 (disponível ativo hoje)

**Passos:**
1. Abrir modal Programs do merchant → editar P1 → `deactivation = CURRENT_DATE - 1` → Save modal
2. Validar: P1 Status = Inactive na merchant page
3. Criar nova aplicação (novo applicant via `buildTestData`) — mesmo merchant, SSN approved
4. Avançar até Complete Application e submeter
5. Capturar novo `leadPk`

**Validações:**
- [ ] `SELECT merchant_program_pk FROM uown_los_lead WHERE pk=<newLeadPk>` → **≠ P1.pk**
- [ ] `merchant_program_pk` = **P2.pk** (único programa ativo remanescente)
- [ ] `SELECT is_active FROM uown_merchant_program WHERE pk=<merchant_program_pk>` → `true`

**Cleanup:**
- Reativar P1: `UPDATE uown_merchant_program SET deactivation_date=NULL WHERE pk=P1.pk` (autorizado)
- POST sweep para restaurar `is_active`

**Tags:** `@critical @e2e @origination @program-selection`

---


### Grupo 5 — API smoke + validações de campos

**Perspectiva do consumidor da API (integração/automação/outras equipes):**
> *Como engenheiro de outro time integrando com `/uown/createOrUpdateProgram`, quero confiar que o endpoint: (1) aceita o body canônico e persiste exatamente o que mandei; (2) me dá erro claro e acionável quando mando algo inconsistente (data invertida, PK inexistente, formato errado) — sem 500 cru; (3) respeita a regra que o produto combinou — **datas mandam, flag `active` é reflexo** — mesmo se eu mandar flag contradizendo as datas; (4) é idempotente (reenviar não duplica); (5) respeita auth/tenant (não posso mutar programa de outro merchant). A API é a superfície contratual — se ela "mente", todo integrador quebra silenciosamente.*

> **Endpoint alvo:** `POST /uown/createOrUpdateProgram`
> **Body canônico:** `{merchantPk, programPk, activationDate?, deactivationDate?, active?}` (campos opcionais = nullable)
>
> **Cleanup:** cada CT armazena `{activation_before, deactivation_before, is_active_before}` e restaura no `afterEach` via API (evitar cascata de test pollution).

#### CT-API-01-UOWN: `createOrUpdateProgram` happy path — merchant UOWN

**Body:** `{merchantPk: OL90294-0001.pk, programPk: <P>, activationDate: "2026-05-01", deactivationDate: "2026-06-01", active: true}`

**Validações:**
- [ ] Response 200 + body ecoa campos enviados
- [ ] DB: `SELECT activation_date, deactivation_date, is_active FROM uown_merchant_program WHERE pk=<pk>` → matches
- [ ] `is_active` calculado corretamente pelo backend (se dates indicam Inactive hoje, backend deve setar false mesmo com `active:true` no request — confirmar regra)

**Tags:** `@smoke @api @uown`

---

#### CT-API-01-KS: `createOrUpdateProgram` happy path — merchant Kornerstone

**Body:** idem para programa de KS3015

**Validações:**
- [ ] Mesmas asserções do CT-API-01-UOWN
- [ ] DB tenant isolation: mudança em KS não afeta merchant UOWN
- [ ] `uown_merchant_program` row tem `company` ou referência ao merchant correto

**Tags:** `@smoke @api @kornerstone`

---

#### CT-API-02: `activationDate` null é aceito (programa sem início definido)

**Body:** `{merchantPk, programPk, activationDate: null, deactivationDate: "2026-12-31", active: true}`

**Validações:**
- [ ] 200
- [ ] DB: `activation_date IS NULL` ✅
- [ ] `is_active = true` (null activation = sempre ativo desde sempre; combinado com deactivation futura → Active)

**Tags:** `@regression @api @null-fields`

---

#### CT-API-03: `deactivationDate` null é aceito (programa open-ended)

**Body:** `{merchantPk, programPk, activationDate: "2026-01-01", deactivationDate: null, active: true}`

**Validações:**
- [ ] 200
- [ ] DB: `deactivation_date IS NULL` ✅
- [ ] `is_active = true` (ativo até segundo aviso)

**Tags:** `@regression @api @null-fields`

---

#### CT-API-04: Ambas as datas null são aceitas (sempre ativo)

**Body:** `{merchantPk, programPk, activationDate: null, deactivationDate: null, active: true}`

**Validações:**
- [ ] 200
- [ ] DB: ambos null, `is_active=true`
- [ ] Tooltip na merchant page mostra `—` / `—`

**Tags:** `@regression @api @null-fields`

---

#### CT-API-05: Omissão total dos campos de data (não envia chaves no JSON)

**Body:** `{merchantPk, programPk, active: true}` — SEM `activationDate` nem `deactivationDate`

**Validações:**
- [ ] 200 (omissão ≡ null, conforme convenção JSON → Java)
- [ ] DB: ambos null
- [ ] Comparar com CT-API-04 (explicit null) — comportamento deve ser idêntico

**Tags:** `@regression @api @null-fields @omit-fields`

---

#### CT-API-06: `activationDate > deactivationDate` → 400 `"activationDate must be before or equal to deactivationDate"`

**Contexto do integrador:** mesma regra do CT-05, espelhada no backend. Integrador que bypass a UI (script, Postman, outra equipe) recebe **400 com mensagem clara** — não 500 cru, não 200 aceitando dado inconsistente.

**Body:** `{merchantPk, programPk, activationDate: "2026-12-01", deactivationDate: "2026-01-01"}`

**Validações:**
- [ ] Response 400 (ou 422 conforme framework do backend)
- [ ] Body contém mensagem `"activationDate must be before or equal to deactivationDate"` (confirmado em `MerchantProgramService.java:56-58`)
- [ ] DB não é alterado (rollback)

**Tags:** `@regression @api @validation @critical`

---

#### CT-API-07: `activationDate = deactivationDate` (mesmo dia) é aceito — boundary inclusivo

**Body:** `{merchantPk, programPk, activationDate: "2026-05-15", deactivationDate: "2026-05-15"}`

**Validações:**
- [ ] 200 (inclusivo: dia único válido)
- [ ] DB: ambas datas = 2026-05-15
- [ ] Se rodado em 2026-05-15: `is_active=true`; caso contrário `false`

**Tags:** `@regression @api @validation @boundary`

---

#### CT-API-08: `activationDate` no passado (backdated) é aceito

**Body:** `{merchantPk, programPk, activationDate: "2020-01-01", deactivationDate: null, active: true}`

**Validações:**
- [ ] 200 (backdating permitido)
- [ ] `is_active=true` (activation ≤ today)

**Tags:** `@regression @api`

---

#### CT-API-09: `deactivationDate` no passado sem activation → programa criado como Inactive

**Body:** `{merchantPk, programPk, activationDate: null, deactivationDate: "2020-12-31", active: true}`

**Validações:**
- [ ] 200 (backend aceita, mas `is_active` deve ser `false` pela regra de data)
- [ ] DB: `is_active=false` mesmo com `active:true` no request (backend sobrescreve)
- [ ] **Se backend NÃO sobrescrever** (respeita flag do request) → `[HIPÓTESE]` possível bug: flag não deveria contradizer datas

**Tags:** `@regression @api @validation @conflict-flags`

---

#### CT-API-10: `merchantPk` ausente ou inválido → erro

**Testes:**
- `{programPk, activationDate, deactivationDate}` SEM merchantPk → 400 (campo obrigatório)
- `{merchantPk: 99999999, programPk, ...}` com merchantPk inexistente → 404 ou 400 com mensagem clara
- `{merchantPk: "abc", ...}` com tipo errado (string em vez de number) → 400

**Validações:**
- [ ] Response apropriado em cada caso
- [ ] DB não é criado/alterado
- [ ] Mensagens de erro não expõem stack trace / info sensível

**Tags:** `@regression @api @validation @negative`

---

#### CT-API-11: `programPk` ausente ou inválido → erro

Mesma lógica do CT-API-10 para `programPk`.

**Tags:** `@regression @api @validation @negative`

---

#### CT-API-12: Formato de data inválido → 400

**Testes:**
- `activationDate: "not-a-date"` → 400 (parse error)
- `activationDate: "2026-13-45"` → 400 (data inválida)
- `activationDate: "05/15/2026"` (MM/DD/YYYY em vez de ISO) → depende do parser (confirmar: Jackson LocalDate espera ISO-8601)
- `activationDate: 1684108800` (timestamp numérico) → 400 ou converte? (confirmar)

**Validações:**
- [ ] 400 em todos os casos de formato inválido
- [ ] Mensagem clara indica campo + formato esperado

**Tags:** `@regression @api @validation @format`

---

#### CT-API-13: Datas SEMPRE prevalecem sobre flag `active` — `is_active` é derivado

**Por que isso importa para o integrador:** se o backend respeitasse a flag `active` do body quando ela contradiz as datas, duas fontes de verdade coexistiriam — e teríamos programa com `activation=ontem, deactivation=amanhã, is_active=false`, que é absurdo. Regra combinada: **datas mandam, flag é reflexo**. Integrador pode enviar `active` ou não — o backend recalcula sempre a partir das datas.

**Regra de negócio confirmada (2026-04-22):**

> As **datas** são a "Lei" — definem quando o programa deve estar ativo. A flag `is_active` é o "Executor" — reflexo do que as datas mandam (existe no DB por performance, evita recálculo toda vez que alguém abre a página). O sweep olha para as datas e atualiza `is_active` atrás delas. **Se houver divergência entre datas e `is_active` → É BUG.**
>
> **Hierarquia de consumo:**
> | Local | Quem manda |
> |-------|------------|
> | Frontend | **Datas** — calcula status na hora baseado na data do usuário |
> | Backend (processamento de aplicações etc) | **`is_active`** — usa a flag por performance |
>
> Na persistência (create/update): backend deve **recalcular** `is_active` a partir das datas no momento do save, ignorando o valor da flag `active` enviado no request.

**Objetivo do CT:** validar que o backend materializa a regra acima — recalcula `is_active` das datas, nunca respeita o valor da flag `active` quando ela contradiz as datas.

---

**Cenário A — `active: false` MAS datas indicam Active hoje → `is_active` deve virar `true`**

**Body:**
```json
{
  "merchantPk": <OL90294-0001.pk>,
  "programPk": <P.pk>,
  "activationDate": "2026-01-01",
  "deactivationDate": "2027-01-01",
  "active": false
}
```
(datas englobam today=2026-04-22 → programa deve ser Active; flag request contradiz)

**Validações:**
- [ ] Response 200
- [ ] DB: `SELECT is_active FROM uown_program WHERE pk=<P.pk>` → `true` (datas prevaleceram; backend ignorou `active:false`)
- [ ] Se DB retornar `false` → **[CONFIRMADO] BUG** — backend respeitou a flag em vez de recalcular das datas

---

**Cenário B — `active: true` MAS datas indicam Inactive (deactivation no passado) → `is_active` deve virar `false`**

**Body:**
```json
{
  "merchantPk": <OL90294-0001.pk>,
  "programPk": <P.pk>,
  "activationDate": "2019-01-01",
  "deactivationDate": "2020-01-01",
  "active": true
}
```
(deactivation < today → programa deve ser Inactive; flag request contradiz)

**Validações:**
- [ ] Response 200
- [ ] DB: `SELECT is_active FROM uown_program WHERE pk=<P.pk>` → `false` (datas prevaleceram)
- [ ] Se DB retornar `true` → **[CONFIRMADO] BUG** — backend persistiu flag inconsistente com as datas

---

**Cenário C — Flag omitida / null → backend deve calcular 100% das datas**

**Body (sem campo `active`):**
```json
{"merchantPk": <...>, "programPk": <...>, "activationDate": "2026-01-01", "deactivationDate": "2027-01-01"}
```

**Validações:**
- [ ] Response 200
- [ ] DB: `is_active = true` (derivado 100% das datas)

---

**Cenário D — Consistência Frontend ↔ Backend**

Após cada cenário acima (A, B, C):
1. Navegar para `/programs` → abrir o programa `P`
2. Validar que o **status visual** renderizado pelo frontend corresponde ao `is_active` persistido no DB
3. Se divergir: abrir DevTools, comparar data do sistema do usuário com as datas do programa → confirmar se frontend está calculando corretamente

**Validações:**
- [ ] Frontend badge/indicador = `is_active` do DB (sem cache stale)
- [ ] Se frontend mostra Active mas DB mostra Inactive (ou vice-versa) → **[CONFIRMADO] BUG** de sincronização (frontend calcula datas, backend persiste flag — devem convergir após reload)

---

**Cleanup:** restaurar datas e flag originais do programa `P`

**Tags:** `@critical @regression @api @validation @source-of-truth @business-rule`

---

#### CT-API-14: Datas muito distantes (boundary Long/LocalDate)

**Testes:**
- `activationDate: "1900-01-01"` → aceito?
- `deactivationDate: "9999-12-31"` → aceito?
- `activationDate: "0001-01-01"` → LocalDate min → aceito?

**Validações:**
- [ ] Aceito sem overflow
- [ ] DB persiste exato
- [ ] Não quebra UI/tooltip ao exibir (smoke em merchant page)

**Tags:** `@regression @api @edge-case @boundary`

---

#### CT-API-15: Idempotência — chamar 2x com mesmo body

**Preocupação do integrador:** "se minha automação reenviar o mesmo request por causa de retry (timeout de rede, falha transitória), vou criar duplicata no banco? Vou gerar 2 entries de audit log?". Resposta esperada: 1 row no DB (UPSERT — não duplica), `row_updated_timestamp` avança na 2ª call mas `row_created_timestamp` fica (prova que foi update, não insert). Audit pode registrar 2 entries (cada tentativa vira um evento), mas o programa é único.

**Passos:**
1. POST com body X → 200
2. POST com body X idêntico → 200 (UPSERT não cria duplicata)

**Validações:**
- [ ] DB: 1 row para esse (merchantPk, programPk) mesmo após 2 calls
- [ ] `row_updated_timestamp` atualiza na 2ª call; `row_created_timestamp` permanece
- [ ] `merchant_activity_log` pode registrar 2 entries (audit), mas programa não duplica

**Tags:** `@regression @api @idempotency`

---

#### CT-API-16: Auth / tenant isolation

**Preocupação de segurança (e do integrador parceiro):** "se eu tenho token de acesso a UOWN, consigo mutar programa do tenant Kornerstone?". Resposta esperada: **não** — 403/404. Token sem permissão de escrita (readonly) → 403. Sem token → 401. Nunca vaza stack trace nem detalhes de outro tenant na mensagem de erro.

**Testes:**
- Sem header de auth → 401
- Token de role sem permissão (readonly) → 403
- Token de tenant A tentando mutar programa de tenant B → 403/404

**Validações:**
- [ ] Controle de acesso funciona
- [ ] Não vaza dados entre tenants

**Tags:** `@regression @api @security @permissions`

---

## Dependências de implementação

### Page objects novos
- `MerchantProgramsModalPage` (Origination) — métodos: `openViaViewAll()`, `addProgramByName(name)`, `cloneRow(programName)`, `editRowDates(programName, activation, deactivation)`, `saveEdit()`, `cancelEdit()`, `deleteRow(programName)`, `clickSaveFooter()`, `clickCancelFooter()`, `getRowStatus(programName)`, `getStatusTooltip(programName)`, `getConfirmationPopup()`

### API client — extensões
- `merchant.client.ts` → `createOrUpdateProgram(body: {merchantPk, programPk, activationDate?, deactivationDate?, active?})`
- `merchant.client.ts` → `getMerchantProgramsByMerchantPk` (já existe) — ampliar typings para incluir `activationDate`/`deactivationDate` em `ProgramInfo`
- `scheduled-task.client.ts` → já tem `triggerScheduledTask(name)` — só usar

### DB helpers
- `merchant-program.db.ts` → `getMerchantProgramsForMerchant(merchantPk)`, `getMerchantProgramByPk(pk)`, `updateMerchantProgramDates(pk, activation, deactivation)` (com autorização explícita)
- `merchant-activity-log.db.ts` → `getLatestSweepLog()` / `getLogsForProgramPkSince(pk, timestamp)`

### Fixtures / test data
- Merchant OL90294-0001 precisa de **pelo menos 2 programas** atribuídos para CT-B. Se só tiver 1 → pipeline Phase 5 deve atribuir programa extra via API `addProgramsToMerchant` no `beforeAll`.
- Before each test (para Grupo 1 e 2) — garantir estado limpo das datas (reset via API).

### SELECTORS
- `merchantProgramsModal.selectors.ts`: viewAllButton, modalTitle, tableRows, addProgramDropdown, editIcon, cloneIcon, deleteIcon, activationDateInput, deactivationDateInput, checkIcon, xIcon, saveFooter, cancelFooter, confirmationPopup, statusBadge, statusTooltip

---

## Riscos conhecidos pré-implementação

| # | Risco | Mitigação |
|---|-------|-----------|
| 1 | Tabela pode ser `uown_merchant_program` (backend) vs `uown_merchant_to_program` (docs schema) | CT-18 valida via `information_schema.tables` e adapta queries; adicionar nota ao docs-update |
| 2 | `ApplicationProcessor.java:296-305` (seleção de programa) aparecia comentado no branch local | CT-A valida empiricamente — se programa não for selecionado, footnote `[HIPÓTESE]` e pedir confirmação do user |
| 3 | UPDATE direto no DB pode quebrar outros testes rodando paralelo | Usar `test.describe.configure({ mode: 'serial' })` para grupo sweep; `afterEach` restaura estado; documentar no spec header |
| 4 | Pitfall #10: merchant config drift em qa2 | `createPreQualifiedApplication` chama `ensureMerchantReady` auto. Para CT UI direta, chamar manualmente no `beforeAll` |
| 5 | Second Look (SSN `100000053`) catalog confirma só em `stg` — qa2 pode não suportar | CT-C-00 roda primeiro como smoke. Se falhar → `test.skip` condicional em CT-C-01/02 + reportar ENV-GAP |
| 6 | TireAgent (Modalidade C) costuma ter `use.gds.for.decision=true` flag DevOps — pode não estar habilitado em qa2 | CT-C-00 detecta; se ENV-GAP → pedir ao DevOps ou rodar em `stg` |
| 7 | Kornerstone brand mismatch (ssn-catalog §7.2) — pipeline #491 encontrou `uown_sv_account.company='UOWN'` em accounts KS | Pré-condição DB check em CT-A-KS / CT-B-MB / CT-D-KS; se divergência → STOP + pedir autorização de UPDATE ao user |

---

## Checklist antes de Phase 3

- [x] Todos os 25+ cenários do issue cobertos (1-25 + A/B) + Second Look incluso
- [x] Modalidades cobertas: A (UOWN 13m), B (Kornerstone 13m+16m), **C (TireAgent 16m Second Look)**, D (denied UOWN+KS)
- [x] Brand cobertura: UOWN (OL90294-0001) + Kornerstone (KS3015) + TireAgent (OW90218-0001)
- [x] Escopo UI corrigido: edição de datas na **Programs page**; merchant page é read-only (status + tooltip)
- [x] Reflexos de domínio aplicados ([reflex #4], [reflex #8], [reflex #11])
- [x] Pitfalls do application-lifecycle-protocol referenciados (#1, #3, #5, #10)
- [x] DB UPDATE direto autorizado pelo usuário (registrado)
- [x] Riscos de implementação listados com mitigação
- [x] Page objects / API client / DB helpers / SELECTORS mapeados
