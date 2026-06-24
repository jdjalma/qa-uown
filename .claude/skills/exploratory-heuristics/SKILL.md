---
name: exploratory-heuristics
description: Carregar em sessão de exploração / sanity check / "preciso achar bug que ninguém viu" — aplica SFDIPOT, HICCUPPS, FEW-HICCUPPS de Bach/Bolton, ancorado em pontos quentes do domínio UOWN (float repr, locale, timing, concurrent state, OTP/IMAP).
disable-model-invocation: true
---

# Exploratory Heuristics — onde os bugs se escondem

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO EXPLORE** — heurísticas, charters, hotspots de domínio. Para regras canônicas que definem "comportamento esperado" em cada hotspot (signing routing, multi-merchant state, OTP flow), rode `node scripts/docs-tooling.mjs resolve gowsign-routing` (ou `merchant-config`, `esign`) ou leia `docs/business-rules/03-contratos-esign.md` + `01-fundamentos.md`. **Não duplique fatos de routing/estado aqui** — eles driftam.

> Testes scripted cobrem o que você sabe. Exploração com heurística cobre o que você não sabe que não sabe. Bach & Bolton dão os mapas; o domínio UOWN dá os hotspots.

## Quando aplicar

- Sessão exploratória explícita (charter: "encontrar problemas em X em N minutos").
- Pós-deploy de hotfix, antes do report final.
- Bug "estranho" reportado pelo customer e não reproduz no scripted.
- Antes de fechar uma feature complexa — pergunta "onde mais pode quebrar?".
- Skill de complemento ao `test-design-techniques` quando o desenhado não pega o sutil.

## Princípios

1. **Heurística ≠ checklist.** Heurísticas são lentes; aplicar 1–2 com profundidade > rodar todas superficial.
2. **Exploração tem charter.** Sem foco e tempo definidos, vira navegação. "Em 45min, validar signing GoSign CA em multi-merchant" é charter.
3. **Notas em tempo real.** Bug escondido aparece em note, não em memória.
4. **Reproduzir antes de classificar** (regra inviolável #10). Observação isolada não é bug.

## Heurística 1 — SFDIPOT (varredura de áreas de teste)

Mapa de áreas para varrer um produto. Bach & Bolton.

| Dimensão | Pergunta | Hotspot UOWN |
|---|---|---|
| **S — Structure** | Que partes existem? UI, API, DB, jobs, vendors? | Origination + Servicing + Website + AMS; svc + balancer + ms; scheduled tasks |
| **F — Function** | O que o produto faz? Cada função funciona isolada? | submit, sign, pay, refund, OTP, KYC, fraud check |
| **D — Data** | Que dados consome/produz? Variações de tipo? | Money (float!), dates, SSN, addresses, phones, emails (IMAP), unicode em nomes |
| **I — Interfaces** | Quais interfaces externas/internas? | Vendor APIs (Kount, SEON, Plaid, GowSign, SignWell, Twilio, Tilled, Repay, EasyPay, MX), webhooks, scheduled tasks |
| **P — Platform** | Em que ambiente roda? Browsers, OS, mobile, viewport? | Customer = mobile real; Servicing/Origination = desktop 1440+ (regra #15); iframes (GowSign), PDFs |
| **O — Operations** | Quem usa, como, com que perms? | Customer (Website), Agent (Servicing/Origination), Admin (AMS), Ops (CLI/admin endpoints) |
| **T — Time** | Quando ocorre? Em que velocidade? Concorrência? | Scheduled jobs, OTP TTL, OEP window 60d, NSF retry, IMAP polling delay, single-flight refs |

Procedimento: varre 1–2 dimensões por sessão; em cada, lista 3–5 perguntas concretas; persegue cada pergunta com prova.

## Heurística 2 — HICCUPPS (oráculos de consistência)

Como você sabe que algo é bug se não há AC explícito? Oráculos:

| Oráculo | Significado | Aplicação UOWN |
|---|---|---|
| **H — History** | Antes funcionava assim. | Antes da release X, signing CA gerava 5 colunas no PDF. Agora 3. Bug. |
| **I — Image** | Imagem da empresa / marca. | KS template deve mostrar branding Kornerstone, não UOWN. |
| **C — Comparable products** | Como concorrentes fazem. | SignWell em CA vs GoSign em CA — esperamos paridade (`project_gosign_rollout`). |
| **C — Claims** | O que o produto promete (docs, marketing, contrato). | "Customer recebe OTP em <60s" — promessa. |
| **U — User expectations** | O que usuário razoável espera. | Botão "Pay" deve cobrar; não deve só salvar rascunho. |
| **P — Product (self-consistency)** | O produto consistente consigo. | Total no schedule deve bater com cash price (tolerância float). |
| **P — Purpose** | Cumpre o propósito. | Lease document precisa ser legalmente válido. |
| **S — Statutes** | Lei / regulação. | NACHA, ECOA, state-specific lease laws. |

Procedimento: ao observar comportamento estranho, percorre o ladder — qual oráculo está sendo violado? Se mais de um, peso maior.

## Heurística 3 — FEW-HICCUPPS

Versão estendida com:
- **F — Familiar problems** — bug já visto em sistema similar. Caso UOWN: race condition em retry de payment vendor.
- **E — Explainability** — comportamento que não consigo explicar é suspeito.
- **W — World** — fatos do mundo (datas, geografia, moeda). Caso UOWN: validar que `state=CA` realmente puxa template CA, não fallback.

## Hotspots UOWN — onde focar exploração

Lista curada de áreas onde bugs aparecem desproporcionalmente:

### 1. Money & float repr
- `feedback_float_repr_not_bug` — `18.46` vs `18.459999...` é arredondamento, não bug funcional. MAS visualização incorreta no PDF/UI é bug visual.
- Compara com `toBeCloseTo(precision)` em assertion.
- Hotspot: schedule, processing fee, total, refund.

### 2. Locale / state
- Tudo assumido EN-US. Strings vazias, fallback de template, formatação currency.
- Hotspot: estados ativos em GoSign vs SignWell (`project_gosign_rollout`); KS vs UOWN branding.

### 3. Timing / async
- OTP TTL: link clicado tarde demais.
- IMAP polling: email demora; teste falha por race.
- Scheduled task vs UI action.
- Webhook vendor chegando antes do esperado.
- Single-flight ref (`feedback_qa_flow_scope_dual_brand_lease_edit`).

### 4. Concurrent state
- 2 invoices ativas, customer abre a antiga.
- Lead em transição enquanto agent edita.
- Múltiplos tabs do customer.

### 5. OTP / Email IMAP
- Sempre clicar no link real do email (`feedback_email_imap_click_link`); não usar URL da API.
- Plus-addressing por runId (`reference_imap_fintechgroup777`).
- Email cai em spam — fora do escopo, mas registrar.

### 6. Vendor failure modes
- Kount/SEON: sem resposta → comportamento?
- Plaid/MX: link expira mid-flow.
- GowSign/SignWell: iframe quebra; PDF rendering falha.
- Twilio: SMS não chega; OTP fallback?

### 7. Activity log (regra #13)
- Toda ação relevante deve gerar row em `uown_los_lead_notes` ou equivalente.
- "Não vi log" = "nada aconteceu" = bug de implementação.

### 8. Merchant config drift (regra #12)
- Checkboxes vs programas (13m/16m) — `merchant-config-contract.ts` é a verdade.
- Drift entre envs.

### 9. Dual-brand parity
- UOWN funciona; KS não testado → assume parity, viola realidade (`feedback_qa_flow_scope_dual_brand_lease_edit`).

### 10. PDF / iframe rendering
- Daniel's Jewelers CA: coluna sumida no PDF — log dizia tudo certo. Caso clássico de "log não é UI".
- Validar diff visual SignWell vs GoSign.

## Procedimento

### Passo 1 — Charter

Escreve em 1 frase:
> "Em {tempo}, explorar {área} com foco em {risco}; bug-criteria: {oráculos}."

Exemplo: "Em 45min, explorar signing GoSign Pennsylvania com foco em PDF rendering; bug-criteria = History (vs SignWell PA antigo), Product (placeholders resolvidos), Claims (template aprovado pelo legal)."

### Passo 2 — Aplicar heurística-guia

Escolhe 1 heurística como lente principal (SFDIPOT pra varredura ampla, HICCUPPS pra checar comportamento específico).

### Passo 3 — Note-taking durante exploração

Formato sugerido:
```
[hh:mm] área: {SFDIPOT label}
ação: ...
observação: ...
oráculo violado: {HICCUPPS letter}
classificação: [OBSERVAÇÃO] | [HIPÓTESE] | [CONFIRMADO]
próximo passo: ...
```

### Passo 4 — Reproduzir antes de classificar (regra #10)

Toda `[OBSERVAÇÃO]` que parece bug:
1. Repete em dados fresh.
2. Checa task/issue existente.
3. Descarta artefato de dado pré-existente.
4. Só então promove para `[CONFIRMADO]`.

### Passo 5 — Output da sessão

```markdown
## Exploratory Session — {charter}

### Charter
{texto}

### Heurística aplicada
SFDIPOT focando em {dimensões}

### Notes
[hh:mm] ... (timeline)

### Findings
- [CONFIRMADO] {bug} — repro: passos | oráculo: H/I/C/C/U/P/P/S
- [HIPÓTESE] {observação} — falta repro fresh
- [OBSERVAÇÃO] {observação} — possivelmente artefato

### Cobertura desta sessão
Áreas exploradas: ...
Áreas NÃO exploradas (próxima sessão): ...

### Sugestão de scripted follow-up
Casos que valem virar test.spec.ts: ...
```

## Heurísticas (meta-dicas)

- **"Procure onde a luz NÃO está."** Resista à tendência de explorar onde é fácil. Vai para vendor edge, locale-edge, error path.
- **"Pergunte-se: o que assumi?"** Cada assunção é um teste candidato.
- **"Mude 1 variável."** Mesma ação, customer em mobile vs desktop. Mesma ação, KS vs UOWN. Mesma ação, agent vs customer.
- **"Quebre a ordem."** Click steps fora de ordem. Refresh no meio. Voltar página.
- **"Persiga a inconsistência."** Se 2 telas mostram dados diferentes, qual está certo? Por quê?
- **"Não confie no log até validar o que o cliente vê."** Caso Daniel's Jewelers — log dizia OK, PDF não.

## Output esperado

Documento de sessão (template acima). Tamanho proporcional ao tempo: 45min → 80–150 linhas. Bug claims sempre com `[CLASSIFICAÇÃO]` explícita.

## Anti-patterns

- "Exploração livre" sem charter — viver de impressão; relatório pobre.
- Reportar `[CONFIRMADO]` sem reprodução fresh — viola regra #10.
- Aplicar SFDIPOT como checklist superficial em vez de profundamente em 1–2 dimensões.
- Confiar em log/DB sem validar UI quando o oráculo é visual.
- Esquecer activity log (regra #13) como oráculo independente.
- Não anotar timeline — perde repro depois.

## Exemplos curtos (domínio UOWN)

### Exemplo 1 — Charter: "Signing GoSign Pennsylvania, 30min"

Heurística: HICCUPPS.
- History: comparado com Signing PA via SignWell antigo. Resultado: GoSign PA não tem coluna "Total" no schedule final que SignWell tinha — `[CONFIRMADO]` (H + P).
- Product: placeholders resolvidos? Sim.
- Statutes: lease document menciona "Pennsylvania Consumer Lease Act"? `[OBSERVAÇÃO]` — precisa checar com legal, não testável agora.

### Exemplo 2 — Charter: "Refund flow no Servicing, 1h"

Heurística: SFDIPOT em D (Data) + T (Time).
- D: refund amount em float — `19.999...` na UI? `[CONFIRMADO]` exibição feia (não bug funcional, mas UX).
- D: refund > original payment — bloqueado? `[CONFIRMADO]` validação OK.
- T: refund disparado, scheduled job vendor responde tarde — UI mostra o quê durante? `[HIPÓTESE]` "Pending" spinner pode ficar travado; precisa repro fresh.
- T: 2 refunds em 1s — race? `[OBSERVAÇÃO]` 2º clique bloqueado pelo botão, mas API aceita 2 chamadas — possível bug se bypassed.

### Exemplo 3 — Charter: "OTP customer no Website, 45min"

Heurística: FEW-HICCUPPS + hotspot OTP.
- Email IMAP — link clicado depois de 5min: válido? `[OBSERVAÇÃO]` TTL não documentado.
- 2 OTPs solicitados em 10s: ambos válidos? Apenas o último? `[HIPÓTESE]` precisa repro.
- OTP em locale es-ES (assumindo customer espanhol) — texto do email cai em EN? `[CONFIRMADO]` Locale assumido EN; nenhuma versão localizada.

## Referências

- Bach & Bolton — "Heuristic Test Strategy Model" (público)
- `skill [[qa-domain-reflexes]]`
- `skill [[bug-classification]]`
- memory: `feedback_float_repr_not_bug`, `feedback_email_imap_click_link`, `project_gosign_rollout`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `reference_imap_fintechgroup777`
