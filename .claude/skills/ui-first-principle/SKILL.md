---
name: ui-first-principle
description: Carregue ao decidir estratégia de teste (E2E vs API). Se a feature tem fluxo de usuário em portal (Origination/Servicing/Website/AMS), o teste DEVE exercer browser. API-only é EXCEÇÃO restrita a admin/ops sem UI, setup/precondições, ou validações DB cross-cutting.
disable-model-invocation: true
---

# UI-First Principle — Regra Inviolável #14

## O princípio

**UI-first como padrão.** API-only só quando a feature **não tem** UI affordance.

> Validação visual (placeholders renderizados, badges, content do iframe GowSign, PDFs) **NÃO pode ser substituída** por leitura de log de backend. Bug de rendering só vira detectável quando o cliente vê.

## Origem (2026-05-06)

BUG-01: placeholders vazios no PDF de Daniel's Jewelers (CA) descoberto **manualmente** pelo Fernando porque os testes API-only só liam logs sem renderizar o PDF. Daí veio a regra.

## Quando aplicar

Sempre que decidir entre:
- E2E (Playwright + browser)
- API-only (Playwright sem browser, só HTTP)
- DB-only

## Decision tree

```
A feature tem fluxo no portal Origination/Servicing/Website/AMS?
├─ SIM → E2E obrigatório
│ API/DB pode complementar (setup, validation cross-cutting)
└─ NÃO → API-only OK
 (ex: admin endpoint, sweep, internal CRUD)
```

## Casos onde API-only é aceitável

1. **Admin/ops endpoints sem UI exposta**
 Ex: `PATCH /uown/svc/gowsign-templates/{id}`, sweeps de scheduled tasks, internal CRUD configs.

2. **Setup/precondições que aceleram o teste**
 Criar lead via `sendApplication` antes de exercitar fluxo de signing UI. **A precondição é API; a feature é UI.**

3. **Validações DB cross-cutting**
 Queries de assertion (activity log presente, FK não quebrou, count correto). Complemento, não substituto.

## Casos onde API-only NÃO basta

| Feature | Por que precisa de UI |
|---------|----------------------|
| Email template rendering | Bug de placeholder só aparece no PDF/HTML gerado |
| GowSign iframe content | Conteúdo dentro do iframe não está em log |
| Activity log display | Friendly name vs technical id — visualização importa (memory `example.md` AC1) |
| Status badge transitions | CSS, timing, race condition de re-render |
| Form validation messages | Mensagens ao usuário, locale, layout |
| Responsive / mobile | Apenas browser detecta |

## Procedimento

### Antes de decidir estratégia

1. Identifique **onde a feature é consumida**: cliente (Website), agent (Servicing/Origination), admin (AMS).
2. Pergunte: "o usuário final vê isso?" → SIM = UI obrigatória.
3. Se híbrido: separar **setup** (API rápido) de **execução** (UI realista) de **validação** (UI + DB).

### Exemplo correto (híbrido)

```ts
// SETUP — API (rápido, determinístico)
await ensureMerchantReady(merchant);
const lead = await api.sendApplication({ ssn: "...", merchant });

// EXECUÇÃO — UI (fluxo real do cliente)
await page.goto("/customer-portal/login");
await page.fill('[name="otp"]', otp);
await page.click("text=Confirm Signature");

// VALIDAÇÃO — UI + DB
await expect(page.locator(".badge")).toHaveText("Signed");
const log = await waitForRecord({ table: "uown_los_lead_notes", filter: { lead_id: lead.id, note_type: "SIGNING_COMPLETED" } });
expect(log).toBeDefined;
```

## Pitfalls

1. **Tentação de skip browser pra deixar suite mais rápida** — funciona até descobrir BUG-01 de rendering em produção.
2. **API mascara fluxo real do email** — clicar no link do email (memory `feedback_email_imap_click_link`) é diferente de chamar a URL do payload da API. Bypass API esconde bug de template.
3. **Setup via API quando feature é Origination** — memory `feedback_setup_via_ui_new_application`: criar lead via UI new-application em vez de `createPreQualifiedApplication` quando feature **é** o Origination flow. Mascara bugs do caminho real.

## Anti-patterns

- ❌ "Já tem log no DB, o teste passou" → não cobriu o render
- ❌ "Vou só testar o endpoint, a UI usa o mesmo" → CSS/JS/timing podem quebrar
- ❌ "É admin endpoint" sem confirmar que o admin **realmente** não tem tela
- ❌ Setup via API em feature de Origination quando o ponto **é** o Origination flow

## Cross-links

- Regra inviolável #15 em `CLAUDE.md`
- Skill [[test-strategy-decision]] — decisão maior (E2E vs API vs híbrido)
- Skill [[test-data-hierarchy]] — setup fresh data via UI quando feature é UI
- Memory: `feedback_email_imap_click_link`, `feedback_setup_via_ui_new_application`
