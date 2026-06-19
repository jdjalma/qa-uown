---
title: Multi-Select Filters — MMH, Modification Report, Funding Queue
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - env: qa2
  - gitlab: task-1319
covers: [filters, multi-select, mmh, modification-report, funding-queue, csv-export]
promoted_to: []
---

# Multi-Select Filters — MMH, Modification Report, Funding Queue

> Charter: Explore MMH (/merchantModificationHistory), Modification Report (/modificationReport), and Funding Queue (/funding) via Playwright MCP (qa2, 1440×900) to resolve Open Questions from SPEC 1319.
> Origin: Task #1319 — Add Multi-Select on Merchant/Location filters in MMH, Modification Report and Funding pages · Overall confidence: high

## Purpose

Task #1319 extends the multi-select Merchant/Location filter component (shipped in #1292 to 7 pages) to three remaining pages: Merchant Modification History (MMH), Modification Report, and Funding Queue. This investigation confirms deployment status in qa2, documents filter structure, component details, and CSV export behavior.

## OQ Resolutions (all confirmed via live DOM inspection, qa2 2026-06-18)

| OQ | Question | Answer |
|---|---|---|
| OQ-01 | Multi-select deployado em qa2? | **✅ Sim — todas as 3 páginas** têm `filter__value-container--is-multi` no DOM |
| OQ-02 | Mesmo componente compartilhado? | **✅ Sim** — mesmo CSS class prefix `filter__`, `index-module_customOptionStyles__CSG9m`, `filter__menu-portal` nas 3 páginas |
| OQ-03 | On-demand report button na Funding Queue? | **❌ Não existe** — nenhum botão de "generate report" no UI. Apenas Email CSV + Download CSV |
| OQ-05 | Funding usa FilteredCsvDownload? | **✅ Sim** — Email CSV + Download CSV, mesmo pai `div.d-flex`, classes `csvButton__18V59` |
| OQ-06 | Status usa FundingQueueStatus independentes? | **✅ Sim** — 4 opções separadas: Funding, Funded, Request Refund, Refunded |

## Filter Map por Página

### MMH (/merchantModificationHistory)

| Filtro | Tipo | isMulti | Notas |
|---|---|---|---|
| Log Type | combobox | ❌ | Single-select |
| Start Date / End Date | searchbox | — | Date inputs |
| Merchant Ref Code | searchbox | — | Text input |
| Merchant | combobox | ✅ | Multi-select, checkboxes, 1405 opções |
| Location | combobox | ✅ | Multi-select, **disabled até Merchant ser selecionado** |
| User Name | searchbox | — | Text input |

### Modification Report (/modificationReport)

| Filtro | Tipo | isMulti | Notas |
|---|---|---|---|
| Merchant | combobox | ✅ | Multi-select, checkboxes |
| Location | combobox | ✅ | Multi-select, **disabled até Merchant ser selecionado** |
| Modification Type | combobox | ❌ | Single-select — não é parte do #1319 |
| Agent Name | searchbox | — | Text input |
| Start Date / End Date | searchbox | — | Date inputs |

### Funding Queue (/funding)

| Filtro | Tipo | isMulti | Notas |
|---|---|---|---|
| Search by Status Date | combobox | ✅ | Multi-select (date range type) |
| Status* | combobox | ✅ | Multi-select, **Funding pré-selecionado por default** |
| Invoice Type | combobox | ❌ | Single-select |
| Client Type | combobox | ✅ | Multi-select |
| Funding On Hold | combobox | ❌ | Single-select |
| Merchant | combobox | ✅ | Multi-select, checkboxes, 1405 opções |
| Location | combobox | ✅ | Multi-select, **NÃO disabled** (independente do Merchant, diferente de MMH/ModReport) |
| 2 Day Funding Exception | combobox | ❌ | Single-select |
| 5 Day Funding Exception | combobox | ❌ | Single-select |

## Status Filter — Opções Confirmadas (OQ-06)

```
Status* (multi-select, Funding pré-selecionado por default):
  ☑ Select All
  ☑ Funding      ← pré-selecionado ao carregar a página
  ☐ Funded
  ☐ Request Refund
  ☐ Refunded
```

Cada opção é **independentemente selecionável via checkbox** — Request Refund e Refunded são distintos apesar de ambos mapearem para `LeadStatus.OTHER`. `[confirmed]`

## Componente Compartilhado — Estrutura DOM

### Classes CSS (consistentes nas 3 páginas)

```
filter__control
filter__value-container filter__value-container--is-multi   ← presença de --is-multi = multi-select
filter__menu-portal
filter__menu-list filter__menu-list--is-multi
index-module_customOptionStyles__CSG9m                      ← container de cada opção (checkbox)
```

### Estrutura de cada opção

```html
<div class="index-module_customOptionStyles__CSG9m">
  <div class="d-flex align-items-center">
    <input type="checkbox">
    <span class="ml-2">Nome do Merchant</span>
  </div>
</div>
```

### "Select All" — comportamento divergente por filtro

| Filtro | Tem "Select All"? |
|---|---|
| Status (Funding Queue) | ✅ Sim |
| Merchant (MMH, ModReport, Funding) | ❌ Não |
| Location | Não verificado (dependente/vazio na inspeção) |

> **Pitfall:** não assumir Select All universal — Status tem, Merchant não tem. Verificar por filtro no DOM-first antes de implementar `selectAll()` helper.

## CSV Export (Funding Queue — OQ-05)

Componente `FilteredCsvDownloadControls` confirmado. Dois botões no mesmo `div.d-flex`:

| Botão | Classe CSS | Ordem no DOM |
|---|---|---|
| Email CSV | `ml-2 index-module_csvButton__18V59 index-module_csvButton__disabledButton__UNKH3` | **1º** (primeiro filho) |
| Download CSV | `index-module_csvButton__18V59 index-module_csvButton__disabledButton__UNKH3 ml-2` | **2º** |

> **Pitfall #118 confirmado:** Email CSV vem **antes** de Download CSV no DOM. Usar `:has-text('Download CSV')` para desambiguar — nunca `.csvButton` sozinho.

Ambos os botões aparecem desabilitados visualmente (`csvButton__disabledButton__UNKH3`) antes de aplicar filtros.

## On-Demand Report (OQ-03)

**Não existe botão de on-demand report na UI da Funding Queue.** Os únicos controles de exportação são Email CSV e Download CSV. O cenário S3.7 do SPEC deve ser **removido ou re-scoped** para os sweeps via API (`triggerScheduledTask`).

> Impacto no SPEC: S3.7 ("on-demand report") não tem affordance visual. Cobrir sweeps via S3.8 apenas (dailyFundingReportSweep, dailyFundedReportSweep, dailyRefundReportSweep, dailyRefundedReportSweep).

## Diferenças entre páginas (para implementação)

| Comportamento | MMH | ModReport | Funding |
|---|---|---|---|
| Location desabilitada até selecionar Merchant | ✅ | ✅ | ❌ (Location independente) |
| Select All no Merchant | ❌ | ❌ | ❌ |
| Select All no Status | — | — | ✅ |
| CSV export | Download CSV apenas | Não verificado | Email CSV + Download CSV |
| Outros filtros não-multi-select | Log Type, Dates, Ref Code, User Name | Modification Type, Agent Name, Dates | Invoice Type, Funding On Hold, 2/5 Day Exception |

## Business Rules (domain rules)

- BR-01: MMH e ModReport: Location é dependente do Merchant — fica disabled até ao menos 1 merchant ser selecionado. `[confirmed]`
- BR-02: Funding Queue: Location é independente — não requer seleção de Merchant. `[confirmed]`
- BR-03: Status filter padrão: "Funding" pré-selecionado ao carregar a Funding Queue. `[confirmed]`
- BR-04: Status filter tem 4 valores distintos: Funding, Funded, Request Refund, Refunded — cada um com checkbox próprio, independentemente selecionável. `[confirmed]`
- BR-05: Merchant filter (todas as páginas): 1405 opções disponíveis em qa2, sem "Select All". `[confirmed]`
- BR-06: Componente multi-select usa `index-module_customOptionStyles__CSG9m` com `<input type="checkbox">` dentro de cada opção. `[confirmed]`

## Logic and Exceptions

- Location disabled logic (MMH/ModReport): ao abrir sem merchant selecionado, o control recebe `filter__control--is-disabled`. Após selecionar merchant, re-habilita. Cenários que testam Location devem selecionar Merchant primeiro.
- Status "Funding" pré-selecionado: ao testar multi-select com múltiplos statuses, limpar a seleção default antes de aplicar o conjunto do teste.
- CSV buttons disabled visually by default: `csvButton__disabledButton__UNKH3` presente antes de filtros aplicados — não é erro; é estado inicial esperado.

## Connections with What Was Already Known

- Confirma: `MerchantLocationFilterPO` (existente) pode ser reutilizado — o componente é o mesmo nas 3 páginas novas.
- Confirma: pitfall #118 (Email CSV antes de Download CSV no DOM).
- **Novo:** Status filter tem Select All; Merchant não tem — divergência intra-componente.
- **Novo:** Funding Location não é dependente de Merchant (comportamento diferente de MMH/ModReport).
- **Novo:** Não existe botão de on-demand report — S3.7 do SPEC deve ser removido.
- **Novo:** Funding Queue tem mais filtros do que o SPEC antecipou: Client Type (multi-select), Invoice Type, Funding On Hold, 2/5 Day Funding Exception.

## Hipóteses resolvidas — confirmadas via discovery 2026-06-18

| Item | Status | Evidência |
|------|--------|-----------|
| Endpoint Funding Queue Search | **[CONFIRMADO]** `POST /uown/los/getLeadsForFundingQueue` | `browser_network_requests` na Funding Queue (qa2) ao carregar a página + clicar Search — request capturada: `POST https://origination-qa2.uownleasing.com/uown/los/getLeadsForFundingQueue [200]`. Regex em `MerchantLocationFilterPO.applySearch` já tem `getLeadsForFundingQueue` — correto. Nota: path completo inclui `/los/` (`/uown/los/getLeadsForFundingQueue`); a regex é substring match, cobre corretamente. |
| Sweep `dailyRefundReportSweep` | **[CONFIRMADO]** | `SELECT scheduled_task_name FROM uown_scheduled_task WHERE scheduled_task_name ILIKE '%refund%'` em dev3 (porta 5445) retornou `dailyRefundReportSweep` — nome exato correto. |
| Sweep `dailyRefundedReportSweep` | **[CONFIRMADO]** | Mesma query acima retornou `dailyRefundedReportSweep` — nome exato correto. |

## Gaps / To Investigate

- **G1:** Location filter com Merchant selecionado — quais opções aparecem e se tem Select All? (Apenas verificado no estado disabled.)
- **G2:** Comportamento de paginação com filtros aplicados — não testado nesta sessão.
- **G3:** Payload da requisição Search — array vs scalar (S-PAYLOAD do SPEC) — não capturado via network; reservado para qa-implementer com `browser_network_requests`.
- **G4:** CSV download com filtros multi-select aplicados — conteúdo e sign de REFUNDED/REQUEST_REFUND não verificados aqui (requer leads nos estados correspondentes).
- **G5:** "Send to FUNDED" dropdown — sub-opções não inspecionadas (não é escopo desta task de filtros).
