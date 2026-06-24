---
name: test-design-techniques
description: Carregar quando desenhar casos de teste a partir do SPEC — aplica equivalence partitioning, boundary value analysis, decision tables, state transition, pairwise, com exemplo concreto UOWN por técnica (lease term, lead lifecycle, merchant config combinations).
disable-model-invocation: true
---

# Test Design Techniques — sair de "happy + 1 erro" para cobertura desenhada

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO DESIGN** — techniques, partition tables, examples. Os **enums e estados canônicos** usados nos exemplos (LeadStatus, lease term boundaries, merchant config flags) NÃO moram aqui — rode `node scripts/docs-tooling.mjs resolve enums` (ou `originacao`) ou leia `docs/business-rules/appendix-d-constantes-enums.md` + `02-originacao-pipeline.md`. **Não duplique valores de enum aqui** — eles driftam.

> Cenário desenhado >> cenário improvisado. Esta skill empacota técnicas clássicas adaptadas ao domínio UOWN.

## Quando aplicar

- Após `scope-analysis` + `risk-based-prioritization`, antes do SPEC final.
- Cenário tem múltiplos inputs ou múltiplos estados — improvisar dá hole em cobertura.
- Você está prestes a escrever "happy + 1 sad path" — pare. Que técnica cabe aqui?
- Bug pattern recorrente parece ter sido perdido por design pobre — refaz o design.

## Princípios

1. **Técnica certa = menos casos, mais cobertura.** Não é virtuoso ter 50 casos quando 12 cobrem o mesmo risco.
2. **Toda técnica tem assunção.** Equivalence partitioning assume uniformidade dentro da partição — se o domínio quebra isso, escolhe outra técnica.
3. **Combinar técnicas é normal.** BVA + decision table dá BVA por linha da table.
4. **Documenta a técnica usada** — auditável; outro QA consegue reproduzir o raciocínio.

## Catálogo de técnicas

### 1. Equivalence Partitioning (EP)

**Ideia:** divide o domínio de input em partições onde o sistema "trata igual"; testa 1 representante por partição.

**Quando usar:**
- Input tem ranges contínuos ou categorias.
- Lógica do sistema é por categoria, não por valor exato.

**Procedimento:**
1. Identifica o input.
2. Lista partições válidas + inválidas.
3. Escolhe 1 valor representativo de cada.
4. Casos = N(partições).

**Exemplo UOWN:** lease term em meses.
- Partição válida 1: 13 (programa 13m)
- Partição válida 2: 16 (programa 16m Second Look)
- Partição inválida 1: <13 (não suportado)
- Partição inválida 2: >16 (não suportado)
- Partição inválida 3: float (15.5)

Cuidado: 13 e 16 são valores de boundary — não são só representantes, valem BVA também.

**Anti-pattern:** assumir que merchant config trata 13 e 16 igualmente — `merchant-config-contract.ts` define programas independentes; cada um é partição própria.

### 2. Boundary Value Analysis (BVA)

**Ideia:** bugs concentram-se nas bordas. Testa min, min-1, min+1, max, max-1, max+1.

**Quando usar:**
- Inputs numéricos com limites.
- Validações de range (idade, money, dates, term).
- Limits de string (length).

**Procedimento:**
- Para cada boundary B, casos: B-1, B, B+1.
- Adicionar min e max do domínio.

**Exemplo UOWN:** OEP (Original Early Payoff) window é 60 dias.
- Boundary inferior (start day 0): casos em day 0, day 1.
- Boundary superior (day 60): casos em day 59, day 60, day 61.
- Beyond: day 90 (still EPO bucket).

**Exemplo UOWN — money:** processing fee mínimo $X, máximo $Y. Testar $X-0.01, $X, $X+0.01, $Y-0.01, $Y, $Y+0.01. Lembrar tolerância float (`feedback_float_repr_not_bug`).

### 3. Decision Table

**Ideia:** tabela linha=condição, coluna=combinação de condições, célula=ação esperada. Útil quando lógica é AND/OR de várias flags.

**Quando usar:**
- Lógica de elegibilidade (merchant config + state + lead status + program term).
- Regras de roteamento (qual vendor de signing? qual template?).
- Cálculos com múltiplos modificadores (OEP × promo × NSF).

**Exemplo UOWN — roteamento de vendor de signing:**

| Condição | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| state == CA | Y | Y | N | N | Y |
| merchant uses GoSign | Y | N | Y | N | Y |
| feature flag GoSign on | Y | Y | Y | N | N |
| → vendor | GoSign | SignWell | SignWell | SignWell | SignWell |

C1 e C5 são interessantes: C1 confirma GoSign happy; C5 valida que com flag off, mesmo merchant configurado, cai em SignWell. **Cada coluna é um caso de teste candidato.**

Após montar, aplica:
- Mínimo: todas colunas distintas em outcome (cobertura de ação).
- Máximo: todas colunas (cobertura combinatorial).

### 4. State Transition Diagram

**Ideia:** sistema tem estados nomeados; testa transições válidas + tentativas de transições inválidas.

**Quando usar:**
- Lifecycle de entidade com estados nomeados (lead, lease, account, payment).
- Bug recorrente em "estado ficou X mas deveria Y".

**Exemplo UOWN — lead lifecycle:**

```
[NEW] → [PRE_QUALIFIED] → [QUALIFIED] → [LEASED] → [SIGNED] → [ACTIVATED]
 ↓
 [DECLINED] (terminal)
```

Casos:
- Transição válida: cada seta = 1 teste mínimo (caminho feliz completo cobre todas).
- Transição inválida: tentar pular um estado (ex: NEW → LEASED direto via API admin) — esperar erro.
- Transição reversa: tentar voltar (LEASED → NEW) — esperar erro / no-op.
- Estado terminal: tentar acionar transição de DECLINED — esperar bloqueio.
- Activity log: cada transição válida cria 1 row em `uown_los_lead_notes` (regra #13).

### 5. Pairwise / All-Pairs

**Ideia:** quando há N parâmetros com M valores cada, combinações totais explodem (M^N); pairwise garante que toda PAR de valores é testada com casos muito menos numerosos.

**Quando usar:**
- 3+ parâmetros configuráveis (brand × state × term × portal × role).
- Combinação total impossível de cobrir.

**Exemplo UOWN — merchant config combinations:**

Parâmetros:
- brand: UOWN, KS
- programa: 13m, 16m, both
- state: CA, FL, NY, TX, GA
- portal de origem: Origination, Website (customer)

Combinações totais: 2×3×5×2 = 60. Pairwise gera ~12 casos cobrindo toda PAR.

Ferramentas: `npx pict` (Microsoft PICT) ou planilhas. Aceitável fazer pairwise manual para ≤4 params.

**Cuidado:** pairwise NÃO cobre interações triplas — se você sabe que (UOWN × 16m × CA) tem bug histórico, adiciona como caso seeded além do pairwise.

### 6. Cause-Effect Graphing (lightweight)

Útil quando decision table fica grande. Mapeia causas (inputs) em efeitos (outputs) com AND/OR/NOT. Em UOWN raramente vale a pena vs decision table direta — registra como opção.

### 7. Use Case Testing

**Ideia:** segue o use case da user story; cada passo do use case é um teste, cada extensão (alt flow) é um teste adicional.

**Quando usar:**
- Spec vem de user story estilo `docs/user-stories/jornada-completa-lease.md`.
- Cenário fim-a-fim.

**Exemplo UOWN:** jornada lease completa.
- Main flow: aplica → pré-qualifica → completa → submit → leased → signed → activated.
- Alt 1: declined em pré-qualificação.
- Alt 2: missing data forces back to Complete page.
- Alt 3: customer abandona em signing, retorna 24h depois.

Cada alt = caso. Documenta entry/exit conditions.

### 8. Error Guessing (informal)

**Ideia:** baseado em experiência, lista lugares onde bugs costumam aparecer. Não substitui técnicas formais; complementa.

**Catálogo UOWN — onde bugs guess-able moram:**
- Float repr em money (`feedback_float_repr_not_bug`)
- Locale assumido EN-US (textos vazios em outro locale)
- OTP timing (link clicado depois de expirar)
- Race condition em scheduled task vs UI action
- Activity log ausente em transição (regra #13)
- Merchant config drift (regra #12)
- Single-flight ref persistindo entre invoices (`feedback_qa_flow_scope_dual_brand_lease_edit`)

## Procedimento

### Passo 1 — Inventário de inputs e estados

Lista por cenário: inputs (com range/categoria), estados pré-condicionais, flags/configs.

### Passo 2 — Mapear técnica por dimensão

| Dimensão | Técnica |
|---|---|
| Input numérico com range | EP + BVA |
| Múltiplas flags AND/OR | Decision Table |
| Lifecycle de entidade | State Transition |
| 3+ parâmetros configuráveis | Pairwise |
| Jornada fim-a-fim | Use Case + Error Guessing |

### Passo 3 — Gerar casos por técnica

Para cada técnica, gera tabela explícita. Inclui caso ID, técnica, valores, expected.

### Passo 4 — De-duplicar e combinar

Casos gerados por técnicas diferentes podem coincidir. Mantém 1 instância, anota todas as técnicas que o cobrem (mais valor por caso).

### Passo 5 — Output

```markdown
## Test Design — {cenário}

### Dimensões identificadas
- Input: lease term {13, 16, edge cases} → EP + BVA
- Flag: GoSign vs SignWell × state × merchant → Decision Table
- Lifecycle: lead {NEW...ACTIVATED} → State Transition

### Casos por técnica

**EP/BVA — lease term**
| ID | term | partição | expected |
|---|---|---|---|
| TC-01 | 13 | válida 13m | aceita, programa 13m ativado |
| TC-02 | 16 | válida 16m Second Look | aceita |
| TC-03 | 12 | inválida abaixo | rejeitada com erro X |
| TC-04 | 17 | inválida acima | rejeitada |
| TC-05 | 15.5 | inválida float | rejeitada / arredondada |

**Decision Table — vendor signing**
... (tabela completa)

**State Transition — lead lifecycle**
... (transições válidas + inválidas)

### Casos consolidados
TC-01...TC-NN — total N casos cobrindo M dimensões.
```

## Heurísticas

- **"Se um caso cobre 2 técnicas, vale mais que dois casos."** Otimizar valor por caso.
- **"Bug histórico vira caso seeded."** Pairwise/EP não pegam bugs específicos conhecidos — adicionar manualmente.
- **"Estados terminais merecem teste explícito."** DECLINED, CHARGED_OFF, FUNDED-com-erro são lugares onde se assume "nada acontece" — e às vezes algo acontece.
- **"Cada técnica força uma pergunta."** Decision table força "todas as combinações relevantes?"; State Transition força "todas as transições válidas?".
- **"Errar pela exaustão"** — se cobertura total custa mais do que o risco, pairwise + seed.

## Output esperado

Bloco markdown com tabelas por técnica + casos consolidados. Tamanho proporcional à complexidade do cenário. Não inflar — 1 técnica pode ser suficiente para cenário trivial.

## Anti-patterns

- Aplicar todas as técnicas para tudo — overhead sem ganho.
- EP sem BVA quando há boundary — perde os bugs onde mais se concentram.
- Decision Table sem identificar colunas redundantes — testa o mesmo 3x.
- State Transition só com transições válidas — perde os bloqueios de transições inválidas.
- Pairwise sem seed para bug histórico conhecido — perde regressão.
- Inventar "valores aleatórios" em vez de boundaries — random ≠ desenhado.

## Referências

- `skill [[ssn-test-modalities]]` (3 modalidades de programa)
- `skill [[application-lifecycle]]` (state transitions reais)
- `docs/business-rules/12-produto-lease-deep-dive.md`
- memory: `feedback_float_repr_not_bug`, `feedback_16m_eligibility_merchant_config`
