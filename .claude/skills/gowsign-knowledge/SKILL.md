---
name: gowsign-knowledge
description: Carregue ao planejar/implementar/debugar teste que envolve signing — GowSign, SignWell, contract content, iframe events, post-signing, recovery, multi-state. Cobre rollout GoSign, regressão SignWell obrigatória, diff visual.
disable-model-invocation: true
---

# GowSign / SignWell Knowledge

## Estado do rollout (2026-05-20)

Projeto está migrando de **SignWell** (provider legado) para **GoSign/GowSign** (novo provider). Regras críticas:

1. **Regressão SignWell é OBRIGATÓRIA** em qualquer task que toque signing — não basta validar GoSign.
2. **Diff visual SignWell vs GoSign** é necessário — bug Daniel's Jewelers CA (colunas faltantes página 1 do PDF) confirmou em 2026-05-06 que API-only não detecta regressão de rendering.
3. **Padronização "Items Purchased"** entrou no escopo em 2026-05-14 — testes que cobrem contract content devem validar essa seção em ambos providers.

Memory: `project_gosign_rollout`.

## Suítes existentes

### `tests/e2e/gowsign/` (20+ specs)

Cobertura por dimensão:

| Spec | Foco |
|------|------|
| `gowsign-smoke-flow.spec.ts` | Sanity geral do fluxo de signing |
| `gowsign-create-contract.spec.ts` | Criação do contrato |
| `gowsign-contract-content.spec.ts` + `-qa2.spec.ts` | Validação de conteúdo renderizado (PDF, iframe) |
| `gowsign-iframe-events.spec.ts` + `-qa2.spec.ts` | Eventos JS do iframe GowSign |
| `gowsign-signing-completion.spec.ts` | Fluxo até signed |
| `gowsign-signature-fields.spec.ts` | Campos de assinatura (placeholders, signers) |
| `gowsign-operations-and-fields.spec.ts` | Operações pós-criação |
| `gowsign-post-signing.spec.ts` | Eventos pós-assinatura |
| `gowsign-lease-status.spec.ts` | Transição de status do lease |
| `gowsign-modify-and-recovery.spec.ts` + `gowsign-modify-lease-qa2.spec.ts` | Modify lease + recovery flow |
| `gowsign-recovery-qa2.spec.ts` | Recovery isolado |
| `gowsign-cross-role-consistency-qa2.spec.ts` | Customer vs Agent vs Admin views |
| `gowsign-edge-and-accessibility-qa2.spec.ts` | Edge cases + a11y |
| `gowsign-servicing-portal-qa2.spec.ts` | Servicing-side do signing |
| `gowsign-provider-lifecycle-qa2.spec.ts` | Lifecycle do provider |

### `tests/e2e/signing-regression/`

- `multi-state-signing.spec.ts` — cobre múltiplos estados americanos (CA, NY, etc.) — diff de templates por estado/locale.

## Quando rodar a suíte inteira

- **Mudança em template** → todo `gowsign-contract-content*` + `gowsign-signature-fields` + diff visual SignWell.
- **Mudança em provider config** → `gowsign-provider-lifecycle` + `gowsign-iframe-events`.
- **Mudança em status transition** → `gowsign-lease-status` + `gowsign-post-signing`.
- **Mudança em endpoint admin** (ex: `PATCH /uown/svc/gowsign-templates/{id}`) → API-only OK pra esse endpoint, mas roda `gowsign-contract-content` em UI depois pra confirmar render.

## Pitfalls específicos

### 1. Bug Daniel's Jewelers CA (placeholders vazios no PDF)
Descoberto manualmente em 2026-05-06. Causa raiz: testes API-only liam logs sem renderizar PDF. **Forçou regra inviolável #14 (UI-first)** e regra #15 (DOM investigation).

### 2. Items Purchased (2026-05-14)
Seção padronizada entre providers — validar presença + ordem + valores em ambos SignWell e GoSign.

### 3. Float representation em valores monetários
`"18.46"` vs `"18.459999999999997"` é arredondamento IEEE 754, não bug funcional. Comparar com `toBeCloseTo`, não `toEqual` (memory `feedback_float_repr_not_bug`).

### 4. Iframe content é difícil de inspecionar
GowSign renderiza dentro de iframe. Use `frameLocator` do Playwright, não `locator` direto. Para snapshot, capture o frame inteiro.

### 5. Roteamento qa2 vs outros envs
Agent memory `project_qa2_esign_routing` (em `.claude/agent-memory/qa-planner/`) tem detalhes específicos de routing. Consultar antes de assumir endpoint igual entre envs.

### 6. Servicing portal sweep timing
Sweeps de scheduled tasks (post-signing, recovery) podem demorar — não bater timeout curto.

### 7. Host do iframe GowSign varia por ambiente — seletor `src*="gowsign.com"` quebra em sandbox (descoberto 2026-06-12, lead 97457)
O seletor `iframe[src*="gowsign.com"]` (antigo `signingGowSignIframeByUrl`) **não casa em sandbox**: o host real do vendor é `gowsign-app-dev-uown.azurewebsites.net` (URL completa observada: `https://gowsign-app-dev-uown.azurewebsites.net/document/{uuid}?embedMode=true`), NÃO `*.gowsign.com`. O seletor foi **broadened para `iframe[src*="gowsign"]`** (substring `gowsign`) — casa tanto o host azurewebsites de sandbox/dev quanto `*.gowsign.com` de prod.

**Regra:**
- Detecção de iframe GowSign → preferir o seletor por **classe** `iframe.alternative-contract-vendor_iframe__nSb3A` (`SELECTORS.signingGowSignIframe`) ou o container do modal `.alternative-contract-vendor_iframeContainer__yAn5c` — são estáveis entre envs (CSS-module hash do frontend UOwn, não do vendor). Verificados MATCH na live DOM 2026-06-12.
- Detecção por URL → usar substring `gowsign` (não `gowsign.com`). Nunca assumir host do vendor por env.
- A classe `alternative-contract-vendor_iframe__nSb3A` é hash de CSS-module (frágil se o frontend rebuildar — ver pitfall #26 em [[application-lifecycle]]), mas hoje é o discriminador GowSign vs SignWell.

### 8. `ContractPage.completeESign` precisa do branch GowSign (gap corrigido 2026-06-12)
`completeESign` (consumer contract page, `src/pages/origination/contract.page.ts`) auto-detecta o provider por polling de iframe. Antes só tinha branch PandaDocs + SignWell → quando o backend roteava o lead para GowSign (ex: NY com template `NY_2025_SAC`), o método caía no fallback SignWell e estourava `TimeoutError` em `#SignWell-Embedded-Iframe`. **Não era timing — era provider não suportado.**

**Implementação canônica do branch GowSign (reuso, não recriar):**
- `AlternativeContractModalPage.waitForOpen` + `.getGowSignFrame` → `FrameLocator` do iframe.
- Helper `signGowSignInFrame(page, frame, { preauthChoice: 'yes', waitForCompleted: true })` de `src/helpers/gowsign-signing.helper.ts` dirige a cerimônia inteira: Start → adota signature/initials em Type mode (1ª fonte) → "Sign All" → "Finish" → aguarda postMessage `completed`.
- Sequência de botões internos validada na live DOM 2026-06-12 (lead 97457): **Start → [fonte] → Next → [fonte] → Save → Sign All → Finish** → redirect `/appComplete?...document_status=completed`. PreAuth "Yes" já vem checado por default.
- Os IDs internos (`#startSignatureButton`, `#signAllButton`, `#finishSignatureButton`) não são visíveis cross-origin, mas os accessible names ("Start", "Sign All", "Finish", "Close document") batem com o que o helper espera.

## Templates conhecidos com problema histórico

- `KORNERSTONE_FinalizePurchaseEmail` — display name técnico no log; spec em `example.md` (deletado, mas estava no escopo de 2026-05-19) propõe rename para "Finalize Purchase Email".
- Daniel's Jewelers CA template — placeholders vazios em página 1.

## Tabela canônica de templates GowSign

A tabela de templates GowSign no svc DB é **`uown_gow_sign_template`** (snake_case com 3 partes: `gow_sign`), NÃO `uown_gowsign_template` (2 partes). Query inline com o nome errado retorna 0 rows silenciosamente e dispara `[OBSERVAÇÃO]` falso.

**Regra:**
- Usar sempre o helper `getGowSignTemplatesForState(db, state)` de `src/helpers/gowsign-template-db.helpers.ts:148` — aponta para a tabela correta.
- NÃO escrever SELECT inline com `uown_gowsign_template` — nome errado, zero rows.
- Para listar templates existentes: `SELECT * FROM uown_gow_sign_template WHERE state = $1 AND (is_active IS NULL OR is_active = true)`.

Source: `src/helpers/gowsign-template-db.helpers.ts:148` + DB introspection qa1 `information_schema.tables WHERE table_name ILIKE '%gowsign%'` → 0 rows; `uown_gow_sign_template` encontrado via `information_schema.tables WHERE table_name ILIKE '%gow_sign%'`.

## Enum de status do e-sign document (`uown_esign_document.status`) — descoberto S7 qa1 2026-06-10

A coluna de status do documento de assinatura é **`status`** (varchar 255, schema doc col 37) — NÃO `document_status`. Valores reais do enum:

| Valor | Significado |
|-------|-------------|
| `STORED` | documento gerado/armazenado, ainda não enviado |
| `SENT_TO_CUSTOMER` | enviado ao cliente para assinatura (NÃO `SENT`) |
| `COMPLETED` | assinatura concluída (NÃO `SIGNED`) |
| `ERROR` | falha de processamento |
| `CANCELLED` | cancelado |

**Regra:**
- Em assertions de e-sign, usar `status='SENT_TO_CUSTOMER'` para envio e `status='COMPLETED'` para conclusão.
- NÃO usar `SENT` (esse é valor de `uown_email_queue`, tabela diferente) nem `SIGNED`/`document_status` (não existem nesse enum/coluna).
- Schema autoritativo: [`docs/database-schema.md`](../../../docs/database-schema.md) seção `uown_esign_document`. Cross-link: app-lifecycle pitfall #96.

## Anti-patterns

- ❌ Validar signing só via DB (não renderiza)
- ❌ Assertar `status='SENT'` ou `document_status='SIGNED'` em `uown_esign_document` — usar `SENT_TO_CUSTOMER` / `COMPLETED` na coluna `status`
- ❌ Esquecer regressão SignWell quando muda GoSign
- ❌ Não validar diff visual quando muda template
- ❌ Usar `toEqual` em valor float monetário
- ❌ Escrever SELECT inline com `uown_gowsign_template` — tabela errada; usar helper `getGowSignTemplatesForState`
- ❌ Detectar iframe GowSign por `src*="gowsign.com"` — host varia por env (sandbox = `gowsign-app-dev-uown.azurewebsites.net`); usar classe `alternative-contract-vendor_iframe__nSb3A` ou substring `gowsign`
- ❌ Assumir que `completeESign` cobre só PandaDocs/SignWell — quando o estado tem template GowSign (ex: NY), o lead roteia para GowSign e exige o branch dedicado; não confundir o `TimeoutError` resultante com flakiness de timing

## Cross-links

- Memory: `project_gosign_rollout`, `feedback_float_repr_not_bug`
- Skill [[ui-first-principle]] — base da regra #14
- Skill [[dom-investigation]] — usar MCP Playwright em iframe
- Skill [[regression-suites-map]] — quando expandir pra suite completa
- Agent memory: `.claude/agent-memory/qa-planner/project_qa2_esign_routing.md` (se relevante)
