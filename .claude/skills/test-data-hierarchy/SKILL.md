---
name: test-data-hierarchy
description: Carregue ao planejar setup de dados ou debugar falha que parece data-related. Hierarquia obrigatória — fresh data via automação é PADRÃO, reuso de registro existente é EXCEÇÃO com justificativa. UPDATE direto no DB proibido sem autorização (Exception 3).
disable-model-invocation: true
---

# Test Data Hierarchy — Regra Inviolável #9

## Hierarquia (ordem obrigatória)

1. **Fresh via automação** (PADRÃO) — criar dado novo via UI/API a cada execução
2. **Fresh via fixture** — usar fixture/factory que gera dado novo (ainda é fresh)
3. **Reuso de registro existente** — EXCEÇÃO com justificativa escrita + reprodução em fresh antes de classificar bug
4. **SELECT direto no DB** — leitura é sempre OK (read-only)
5. **INSERT/UPDATE/DELETE direto no DB** — PROIBIDO sem autorização explícita do user (Exception 3 do CLAUDE.md)

## Quando aplicar

Sempre que planejar:
- Setup de teste novo
- Repro de bug reportado
- Verificação de hipótese durante debug

## Por que importa

- **Determinismo**: dado pré-existente acumula side-effects de outros testes → flakiness
- **Bug classification** (regra #10): observação em dado pré-existente NÃO é bug — pode ser artefato de mutação anterior
- **Audit trail**: fresh data tem trail completo no log; dado mutado tem trail truncado
- **Compliance**: UPDATE direto pode violar requirements de auditoria (UOWN é fintech)

## Procedimento

### Setup default

```ts
// CERTO — fresh via automação
const lead = await createPreQualifiedApplication({
 merchant: "UOWN_DEMO",
 ssn: generateTestSsn, // SSN novo a cada execução
});
```

### Quando reuso é justificável

Cenários OK:
- Teste de performance que precisa de massa pré-carregada (e o autor documentou)
- Validação de regressão histórica em conta legada
- Smoke check de conta master (raro)

Cenários NÃO OK:
- "Levou muito tempo pra criar fresh, vou reusar" → flag de design problemático
- "Esse lead já está no estado certo, é mais rápido" → vai mascarar bug de transição

### Se precisar reusar, antes de declarar bug

1. Reproduzir em fresh data — manda em `tests/e2e/` o caso isolado
2. Se reproduz: BUG CONFIRMADO
3. Se não reproduz em fresh: provável artefato — investigar diferença entre o dado reusado e o fresh

### UPDATE direto — fluxo de exceção

Apenas com:
1. Solicitação explícita do user
2. Justificativa escrita no commit/PR
3. Backup do estado anterior se possível

```sql
-- Não fazer sem user dizer "pode atualizar"
UPDATE uown_los_lead SET status = 'QUALIFIED' WHERE id = 11366;
```

Memory `feedback_no_db_mutation_to_force_pass`: skip/timeout é resultado válido; **nunca UPDATE pra satisfazer precondição** de teste.

## Diversificação de Merchant

### Regra

Testes que **não** exercitam comportamento específico de um merchant (fluxo KS, config regional, quirk de portal) devem usar `pickRandomMerchantKey` em vez de hardcodar sempre o mesmo merchant.

**Por que:** quando todos os testes criam aplicações para `PayPossible`/`DanielsJewelers`, bugs de configuração em outros merchants ficam invisíveis até produção.

### Como usar

```typescript
import { pickRandomMerchantKey, getMerchant } from '@data/index.js';

// Em vez de:
const merchant = getMerchant('PayPossible', env);

// Usar:
const merchantKey = pickRandomMerchantKey; // UOWN pool (default)
const merchant = getMerchant(merchantKey, env);
// Log automático: "[pickRandomMerchant] selected: TerraceFinance"
```

Para Kornerstone-brand:
```typescript
import { pickRandomMerchantKey, KORNERSTONE_GENERAL_MERCHANT_POOL } from '@data/index.js';
const merchantKey = pickRandomMerchantKey(KORNERSTONE_GENERAL_MERCHANT_POOL);
```

### Quando hardcodar é correto (exceções legítimas)

| Situação | Razão |
|---|---|
| Teste verifica routing GOWSIGN para CA | `TireAgent` tem evidência empírica confirmada (leads 15741-15748) |
| Teste verifica template específico de KS3015 | merchant é parte do AC |
| `validMerchant` em `STATE_MATRIX` | matriz de estado depende de merchant com cobertura confirmada |
| Teste de configuração de merchant (preflight, drift) | o merchant É o objeto do teste |
| sendApplication com `ClientType=PAY_POSSIBLE/SYNCHRONY` | clientType e merchant são acoplados (username/password da enum) |

### Pools disponíveis

- `UOWN_GENERAL_MERCHANT_POOL` (default) — 12 merchants UOWN, env-agnostic
- `KORNERSTONE_GENERAL_MERCHANT_POOL` — 3 merchants KS (FifthAveFurnitureNY, ComfortZoneMattress, BodegaFurniture)

Ambas exportadas de `src/data/merchants.ts` via `@data/index.js`.

### Reproduzindo falha após random

O `pickRandomMerchantKey` faz `console.log('[pickRandomMerchant] selected: <key>')`. Para reproduzir, hardcode temporariamente o merchant que apareceu no log e re-execute.

## Pitfalls

1. **Cleanup omitido** — fresh data acumula; rodando 1000x sem cleanup polui DB de teste. Adicionar cleanup é parte do setup fresh.
2. **SSN colisão** — usar generator com timestamp/random suficiente para evitar colisão em paralelo.
3. **Email plus-addressing** — `fintechgroup777+{runId}@gmail.com` (memory `reference_imap_fintechgroup777`) garante isolamento por execução.
4. **Race em paralelo** — fresh em paralelo pode disputar merchant config. Ver skill [[merchant-preflight]] sobre `skipMerchantPreflight`.

## Anti-patterns

- ❌ `UPDATE uown_los_lead SET status = ...` para "deixar no estado certo"
- ❌ Reusar lead `11366` em múltiplos testes diferentes
- ❌ Criar lead na UI uma vez e referenciar id hardcoded em outros testes
- ❌ Pedir "permissão genérica" pra UPDATE no DB — autorização é por operação

## Cross-links

- Regra inviolável #9 em `CLAUDE.md`
- Regra inviolável #10 (bug classification) — exige fresh repro
- Exception 3 (CLAUDE.md) — DB mutation requer autorização explícita
- Skill [[bug-classification]] — usa este princípio para validar bug claim
- Skill [[merchant-preflight]] — preflight respeita hierarquia (sem UPDATE direto)
- Memory: `feedback_no_db_mutation_to_force_pass`
