# Hotfix — creditLimit Truncation Fix

**Hotfix:** creditLimit rounding bug (RoundingMode.HALF_EVEN → RoundingMode.DOWN)
**Reportado por:** Priyanka
**Deploy:** dev1, qa1, sandbox
**Data:** 2026-03-26

---

## Contexto

### Fluxo do Bugfix

| Passo | O que verificar | Onde |
|-------|-----------------|------|
| 1. Após sendApplication | `creditLimit` na resposta JSON | Response da API — deve ser truncado (1251, não 1252) |
| 2. No banco (lead) | `max_approval_amount` | Tabela `uown_lead` — deve ter decimais (ex: 1251.60) |
| 3. No banco (UW) | `approval_amount` | Tabela `uown_los_uwdata` — valor original do UW |
| 4. Lead Summary (UI) | `maxApprovalAmount` | Origination portal overview |
| 5. Finalize details | `maxApprovalAmount` | `GET /uown/los/getFinalApprovalDetails/{leadPk}` |

### Causa Raiz

**Arquivo:** `ApplicationProcessor.java:267`
**Antes (bug):** `maxApproval.setScale(0, RoundingMode.HALF_EVEN)` → arredonda .60 para cima = 1252
**Depois (fix):** `maxApproval.setScale(0, RoundingMode.DOWN)` → trunca = 1251

**Cálculo:**
```
UW approval_amount = 1192 (exemplo)
max_approval_amount = 1192 × 1.05 = 1251.60  (armazenado com 2 decimais)
creditLimit (bug)   = 1252  (HALF_EVEN arredonda .60 para cima)
creditLimit (fix)   = 1251  (DOWN trunca .60)
```

---

## User Story

### US-01: creditLimit deve ser truncado para baixo na resposta do sendApplication

**Como** consumidor ou sistema downstream,
**Quero** que `creditLimit` na resposta de `sendApplication` seja o valor inteiro truncado (floor) do `max_approval_amount`,
**Para** garantir que o limite de crédito aprovado nunca ultrapasse o valor calculado pelo UW.

#### Critérios de Aceite
- [ ] `max_approval_amount` em `uown_lead` contém casas decimais quando merchant tem `approval_amount_increase > 0`
- [ ] `creditLimit` na resposta do `sendApplication` é igual a `Math.floor(max_approval_amount)`
- [ ] `creditLimit` nunca é maior que `Math.floor(max_approval_amount)` — sem arredondamento para cima
- [ ] `approval_amount` em `uown_los_uwdata` preserva o valor original do UW

---

## Cenários de Teste

### CT-01: creditLimit truncado com TireAgent (5% increase) — Happy Path

**Tipo:** Hybrid (API + DB)
**Ambiente:** sandbox
**Merchant:** TireAgent (OW90218-0001)
**Pré-condição:** TireAgent com `approval_amount_increase` = 0.05 (5%) configurado no sandbox

**Passos:**
1. Pre-check: consultar `uown_merchant.approval_amount_increase` para TireAgent no DB
2. Chamar `sendApplication` com TireAgent em sandbox (state CA, SSN ≠ 9)
3. Extrair `creditLimit` e `authorizationNumber` (leadPk) da resposta
4. Consultar `uown_lead.max_approval_amount` no DB via `leadPk`
5. Verificar: `creditLimit == Math.floor(max_approval_amount)` (truncação correta)
6. Verificar: `creditLimit < Math.ceil(max_approval_amount)` quando `max_approval_amount % 1 > 0` (não arredondado para cima)
7. Consultar `uown_los_uwdata.approval_amount` — valor original do UW

**Resultado esperado:**
- `sendApplication` retorna 200 com `creditLimit` como inteiro
- `uown_lead.max_approval_amount` tem casas decimais (ex: 1251.6000)
- `creditLimit = Math.floor(max_approval_amount)` (ex: 1251, não 1252)
- `uown_los_uwdata.approval_amount` < `max_approval_amount` (valor base antes do aumento)

**Tags:** `@sandbox @regression @critical`

---

### CT-02: getFinalApprovalDetails — maxApprovalAmount consistente com DB

**Tipo:** Hybrid (API + DB)
**Pré-condição:** `leadPk` do CT-01 preenchido

**Passos:**
1. Chamar `GET /uown/los/getFinalApprovalDetails/{leadPk}`
2. Se `maxApprovalAmount` presente na resposta: verificar que é igual ao valor em `uown_lead.max_approval_amount`

**Resultado esperado:**
- Resposta 200
- `maxApprovalAmount` (se retornado) = valor com decimais do DB

**Tags:** `@sandbox @regression`
