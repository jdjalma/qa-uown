---
name: merchant-preflight
description: Carregue antes de criar qualquer application UOWN via API/UI. Valida que a config do merchant (checkboxes + programas 13m/16m) bate com src/data/merchant-config-contract.ts. Auto-heal via AUTO_HEAL_MERCHANT=true, senão fail-fast com drift list.
disable-model-invocation: true
---

# Merchant Preflight Contract

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO SET UP** — preflight procedure, contract validation, pitfalls. O **comportamento canônico do produto** (merchant config flags, funding state machine, enums) NÃO mora aqui — é fonte única em `docs/business-rules/08-funding-merchants.md` + `appendix-c-tabelas-banco.md` e `src/data/merchant-config-contract.ts`. Para resolver um tópico, rode `node scripts/docs-tooling.mjs resolve merchant-config`. **Não duplique regras de merchant aqui** — elas driftam.

## Quando aplicar

Carregue esta skill **sempre que o teste cria uma application nova** — seja via UI (`new-application`) ou via API (`sendApplication`, `createPreQualifiedApplication`).

**NÃO carregue** quando o teste opera em lease/account **já existente** — mutar config de merchant alheio ao escopo é side-effect proibido. Nesses casos passar `skipMerchantPreflight: true` ou simplesmente não invocar o helper.

## Por que existe (regra inviolável #12)

Sem preflight, testes flakam por causa de drift silencioso do merchant: checkbox que foi desativado manualmente, programa 16m que sumiu da config, term inativo. O bug aparece como "approval esperado mas reprovado" — sintoma genérico, diagnóstico custoso.

## Procedimento

### Padrão (auto-heal habilitado)

```ts
import { createPreQualifiedApplication } from "@/helpers/...";

// ensureMerchantReady é chamado automaticamente dentro de createPreQualifiedApplication
const lead = await createPreQualifiedApplication({ merchant: "UOWN_DEMO" });
```

`createPreQualifiedApplication` invoca `ensureMerchantReady(merchant)` por baixo, que:

1. Lê a config esperada de `src/data/merchant-config-contract.ts`
2. Compara com config atual no DB (via API admin ou query direta)
3. Se `AUTO_HEAL_MERCHANT=true` (default no `.env`): chama `createOrUpdateMerchant` para alinhar
4. Se `AUTO_HEAL_MERCHANT=false`: falha rápido com **drift list** (campos divergentes + valores esperado vs atual)

### Quando usar outro caminho que NÃO `createPreQualifiedApplication`

Se o teste cria application via UI `/new-application` ou API com client direto:

```ts
import { ensureMerchantReady } from "@/helpers/...";

await ensureMerchantReady(merchantSlug); // chame ANTES de submitApplication
await api.sendApplication({ ... });
```

### Quando pular (intencionalmente)

```ts
await createPreQualifiedApplication({
 merchant: "UOWN_DEMO",
 skipMerchantPreflight: true, // teste opera em lead pré-existente
});
```

## Contrato esperado

Ver `src/data/merchant-config-contract.ts` para o source-of-truth. Resumo:

- **Checkboxes** que devem estar `true`: ex. `kountEnabled`, `seonEnabled`, `creditPullEnabled`
- **Programas**: `term_in_months IN (13, 16)` + `is_active=true` na tabela `uown_merchant_program`
- **Brand**: alinhado com `uown_los_lead.brand_id` (UOWN vs Kornerstone)

## Pitfalls conhecidos

1. **KS3015 disponível em todos envs** (qa1, qa2, stg, dev) — não assumir que Kornerstone é qa2-only (memory `reference_kornerstone_ks3015_qa2_only` foi corrigida em 2026-05-18).
2. **Elegibilidade 16m é merchant-config, não brand** — qualquer merchant (UOWN ou KS) com programa 16m ativo suporta. Nunca dizer "UOWN não oferece 16m" (memory `feedback_16m_eligibility_merchant_config`).
3. **DV360 UAT qa1 outage 2026-05-18** — `sendApplication` retornava 500 Apache HTML em qa1; svc saudável; workaround: aguardar/qa2/leads pré-existentes (memory `project_dv360_uat_qa1_outage_2026_05_18`).
4. **Auto-heal não é grátis** — toca merchant config no DB. Em testes paralelos pode causar race. Considere `skipMerchantPreflight: true` se outro teste já garantiu o setup.
5. **Snapshot immutability (R1.53.0)** — a config de UW do merchant é **congelada na aprovação** em `uown_los_lead_merchant_settings_snapshot` (no `UW_APPROVED` do lead) e em `uown_sv_account_merchant_settings_snapshot` (na criação da conta, copiando o snapshot do lead). Para testes que dependem do snapshot, o preflight/auto-heal precisa rodar **ANTES da aprovação UW** — mutar a config do merchant DEPOIS da aprovação **NÃO** atualiza o snapshot já gravado (cria drift live-vs-snapshot que não propaga). Ver app-lifecycle pitfall #112 e `appendix-c` (Merchant Settings Snapshot).

## Anti-patterns

- ❌ Criar application sem preflight "porque já rodou ontem"
- ❌ UPDATE direto no DB para forçar config — viola regra inviolável #9 (test data hierarchy)
- ❌ Assumir que `AUTO_HEAL_MERCHANT=true` é universal — em CI pode estar `false`
- ❌ Ignorar drift list e tentar workaround no test code

## Cross-links

- Regra inviolável #12 em `CLAUDE.md`
- Skill [[test-data-hierarchy]] — preflight respeita hierarquia (não UPDATE direto)
- Skill [[application-lifecycle]] — step 0 do lifecycle é merchant ready
- Source: `src/data/merchant-config-contract.ts`, `src/helpers/merchant.helpers.ts` (ou nome equivalente)
