---
title: "Apêndice G: Cenários de Risco de Lease"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/state-merchant-matrix.ts
  - env: qa2
covers: [risco, lease, rto, estados, merchant-routing, online, instore, blocked-states, ssn]
---

# Apêndice G: Cenários de Risco de Lease — Base de Conhecimento para Testes
## UOwn Leasing - SVC Platform

Base de conhecimento que correlaciona os fatores de risco do mercado de lease nos EUA com as regras de negócio implementadas na plataforma UOWN, para uso direto na criação e parametrização de testes automatizados.

---

## Visão Geral: Mercado Real ↔ Implementação UOWN

O modelo de negócio da UOWN é **lease-to-own** (RTO — Rent-to-Own). No mercado americano, esse tipo de operação:
- É **isento das leis de usura** na maioria dos estados (tecnicamente não é crédito)
- É regulado por legislação específica de RTO em ~40 estados
- Aplica **tributação diferenciada** por estado (Sales Tax on Lease)
- Avalia risco via múltiplas camadas (fraude + crédito + dados alternativos)

A UOWN implementa exatamente essa estrutura em camadas:
```
Fraude (Sentilink → Neustar → LexisNexis → SEON)
    ↓
Crédito (GDS → Taktile → ABB/BlackBox)
    ↓
Tributação por estado (TaxCloud / TaxJar)
    ↓
EPO com regras por estado
    ↓
Compliance regulatório (estados bloqueados, programas por estado)
```

---

## 1. Dimensão Estadual no UOWN

### 1.1 Como o Estado é Determinado

| Tipo de Merchant | Estado Usado | Impacto |
|-----------------|-------------|---------|
| **ONLINE** (código inicia OL, ON, ou OW90218) | Estado do **cliente** | Impostos, programas, EPO |
| **INSTORE** (demais códigos) | Estado do **merchant** | Impostos, programas, EPO |

**Impacto nos testes:** Para merchants online (ex: TerraceFinance `OL90202-0001`), o estado do endereço do cliente no `sendApplication` determina tudo. Para merchants instore (ex: Bridge `B082922-0001`), o estado é fixo.

### 1.2 Estados Bloqueados (No Business)

**Configuração:** `no.business.in.state` — default: **NJ, VT, MN, ME**

```
Pipeline Step 1 → State Check → DECLINED
Lead Status: DENIED
Internal Status: NO_BUSINESS_IN_STATE | NO_PROGRAM_IN_STATE
```

**Cenário de teste "estado bloqueado":**
- Endereço do cliente em NJ (ou VT, MN, ME)
- Merchant ONLINE → estado do cliente = NJ
- Pipeline para no Step 1 → sem email de negação

### 1.3 Tributação por Estado — Comportamento no Sistema

O sistema usa **TaxCloud ou TaxJar** (configurável via `useTaxCloudApi`) para calcular impostos sobre o lease.

| Estado | Comportamento | Impacto no Cálculo |
|--------|--------------|-------------------|
| **OR, AK, DE, MT, NH** | Sem Sales Tax | `taxAmount = 0` → `baseCost = totalInvoiceAmount` |
| **TX** | Tax upfront sobre valor total | Imposto alto pode aumentar `baseCost` calculado |
| **CA** | Tax sobre parcelas + regra EPO especial | `EPO = cost × (remainingPayments / totalPayments)` |
| **NY** | Tax sobre parcelas + regra EPO especial | Mesma fórmula proporcional de CA |
| **HI, WV** | Regra EPO especial | Mesma fórmula proporcional |
| **NC** | Último pagamento mínimo (11% baseCost) + EPO ≥ último pagamento | `lastPayment >= baseCost × 0.11` |
| **IL (Chicago)** | Personal Property Lease Tax 15% (desde jan/2026) | Carga tributária muito alta |

### 1.4 Regras EPO por Estado (Cascata de Prioridade)

```
1. epo.discount.for.state.{STATE}         → desconto fixo sobre valor pago
2. epo.remaining.amount.discount.{STATE}  → desconto sobre saldo restante
3. epo.discount.on.remaining.for.state.{STATE} → percentual sobre saldo
4. CA, HI, NY, WV (hardcoded)             → EPO = cost × (remaining/total)
5. merchantProgram.payoffDiscount          → fallback do programa
```

### 1.5 Security Deposit por Estado

O `securityDeposit` é configurado por estado em `state_configurations`. É cobrado quando:
- Merchant tem `holdDeposit = true` **E** estado tem valor configurado, **OU**
- Merchant tem `checkUwForVerification = true` **E** UW retornou `chargeProcessingFee = true` **E** estado tem valor configurado

**Hierarquia (apenas UMA é cobrada):**
```
amountChargedAtSigning > processingFee > securityDeposit
```

---

## 2. Cenários de Risco — Mapeamento Completo

### Cenário 1: Risco Baixo (Prime/Super-prime)

#### Perfil Real (Mercado)
- FICO: 720+
- DTI: < 36%
- PTI (parcela/renda): < 5%
- Emprego: W-2, 2+ anos
- Histórico RTO: limpo

#### Dados de Teste UOWN

| Campo | Valor | Razão |
|-------|-------|-------|
| **SSN** | NÃO termina em 9 (ex: `XXX-XX-0001`) | `UW_APPROVED` no sandbox |
| **Estado** | CA, TX, FL, GA, CO | Programas ativos, sem bloqueio |
| **Merchant** | `TerraceFinance` (OL90202-0001) | ONLINE, não-Kornerstone, sandbox estável |
| **Valor do lease** | $800–$1.500 | Dentro do `minCartAmount`–`maxCartAmount` do programa |
| **Frequência** | WEEKLY ou BI_WEEKLY | Mais parcelas = menor PTI percebido |
| **Routing/BIN** | Informar dados bancários + BIN elegível | Ativa fluxo Kornerstone (16 meses) se merchant suportar |

#### Pipeline Esperado
```
Step 1: State Check          → PASS (estado ativo)
Step 4: Blacklist            → PASS (dados novos/únicos)
Step 11: NeuroID             → PASS (sandbox geralmente ignora)
Step 12: UW (BlackBox)       → UW_APPROVED (SSN não termina em 9)
Step 17: Calculator          → schedule gerado

→ UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

#### Verificações de DB
```sql
SELECT lead_status, internal_status FROM uown_los_lead WHERE pk = $leadPk;
-- Esperado: FUNDED

SELECT lambda_segment, risk_type, max_approved_amount_cr
FROM uown_los_uwdata WHERE lead_pk = $leadPk;
-- Esperado: lambda_segment baixo (1-3), risk_type PRIME ou GOOD
```

#### Cálculo Financeiro (Exemplo)
```
Produto: $1.000 (estado CA, sem taxUpfront)
MoneyFactor: 0.15/mês × 13 meses = 1.95 total
Contrato: $1.000 × 1.95 = $1.950
EPO (CA): $1.000 × (remainingPayments / totalPayments)
```

---

### Cenário 2: Risco Médio (Near-prime)

#### Perfil Real (Mercado)
- FICO: 620–659
- DTI: 38–45%
- PTI: 5–10%
- Emprego: 1099, < 1 ano
- Histórico RTO: 1–2 atrasos resolvidos

#### Dados de Teste UOWN

| Campo | Valor | Razão |
|-------|-------|-------|
| **SSN** | NÃO termina em 9 | Aprovado pelo UW, mas com limite menor |
| **Estado** | TX, OH, GA | Programas disponíveis, sem regra EPO especial (mais simples) |
| **Merchant** | `TerraceFinance` ou `BuyOnTrust` (OL90544-0001) | ONLINE, aceita perfis mais variados |
| **Valor do lease** | $400–$800 | Faixa conservadora para segmento near-prime |
| **Frequência** | MONTHLY | Parcelas mensais maiores revelam o PTI real |
| **Dados bancários** | Presentes mas BIN sem histórico longo | Pode cair no fluxo UOWN (13 meses) |
| **Employment** | `nextPayDate` próximo, `payFrequency` configurado | Valida Step de emprego no Missing Fields |

#### Diferencial vs. Risco Baixo
- `lambdaSegment` mais alto (4–7) → `maxApprovedAmountCR` menor
- Pode acionar **Plaid** como segunda chance se `UW_REVIEW` (lambda em faixa configurada)
- Limite de aprovação pode ser menor que o valor do carrinho → Step 15 dispara (item split ou negação parcial)

#### Pipeline Esperado
```
Step 12: UW → UW_APPROVED (SSN não termina em 9)
             OU UW_REVIEW → Plaid (se merchant habilitar e lambda na faixa)

→ UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

#### Verificações de DB
```sql
-- Verificar segmento de risco
SELECT lambda_segment, risk_type, credit_limit
FROM uown_los_uwdata WHERE lead_pk = $leadPk;
-- Esperado: lambda_segment 4-7, risk_type FAIR ou GOOD

-- Verificar se Plaid foi acionado
SELECT lead_status FROM uown_los_lead WHERE pk = $leadPk;
-- Intermédio esperado: UW_REVIEW (antes do Plaid) → UW_APPROVED (após Plaid)
```

#### Cálculo Financeiro (Exemplo — TX)
```
Produto: $600 (estado TX — tax upfront)
Tax TX: ~8.25% = $49.50 upfront
baseCost = $600 - $49.50 = $550.50 (usado no cálculo)
Contrato: $550.50 × 0.15 × 13 = $1.073.47
```

---

### Cenário 3: Risco Alto / Negação (Subprime/Denied)

#### Perfil Real (Mercado)
- FICO: < 580 ou thin file
- DTI: > 50%
- PTI: > 10%
- Emprego: gig/informal, renda irregular
- Histórico RTO: repossession ou collections ativas

#### Dados de Teste UOWN

| Campo | Valor | Razão |
|-------|-------|-------|
| **SSN** | **Termina em 9** (ex: `XXX-XX-0009`) | `UW_DENIED` no sandbox |
| **Estado** | Qualquer estado ativo | Estado não importa — UW nega antes |
| **Merchant** | Qualquer | UW é step 12, não depende do merchant |

#### Sub-cenários de Negação

| Sub-cenário | Trigger | Step | Status Final |
|-------------|---------|------|-------------|
| **UW Denied (SSN 9)** | SSN termina em 9 | Step 12 | `UW_DENIED` + email enviado |
| **Estado bloqueado** | Endereço em NJ/VT/MN/ME (merchant ONLINE) | Step 1 | `DENIED` / `NO_BUSINESS_IN_STATE` — sem email |
| **Blacklist** | Dados na tabela `uown_blacklist_*` | Step 4 | `DENIED` / `BLACKLIST_DENIED` — sem email |
| **Sem programa no estado** | Merchant sem programa ativo para o estado | Step 1 | `DENIED` / `NO_PROGRAM_IN_STATE` — sem email |
| **Valor abaixo do mínimo** | Carrinho < `minimumLeaseAmount` ($250 default) | `sendApplication` | Erro 400, lead não criado |
| **Valor acima da aprovação** | Carrinho > `creditLimit` do UW, sem item split | Step 15 | `DENIED` / `NO_REMAINING_AMOUNT` |
| **Duplicidade** | Mesmo email/telefone em 3+ leads | Step 9 | `DENIED` / `EMAIL_COUNT_FAILED` |
| **Reaprovação negada** | Conta existente inadimplente | Step 10 | `DENIED` / ineligible |
| **UW anterior negado** | Negado recentemente, sem override | Step 7 | `UW_DENIED` + email |

#### Verificações de DB
```sql
-- Confirmar negação por UW
SELECT lead_status, internal_status
FROM uown_los_lead WHERE pk = $leadPk;
-- Esperado: lead_status = UW_DENIED, internal_status = UW_DENIED

-- Confirmar email de negação enviado
SELECT * FROM uown_email_queue
WHERE lead_pk = $leadPk AND email_type LIKE '%DENIED%'
ORDER BY row_created_timestamp DESC LIMIT 1;
-- Presente para UW_DENIED; AUSENTE para BLACKLIST_DENIED, STATE_DENIED
```

---

## 3. Matriz de Decisão: Risco × Estado × Merchant

| Combinação | Resultado Esperado | Observação |
|-----------|-------------------|-----------|
| SSN≠9 + CA + TerraceFinance | `FUNDED` + EPO proporcional CA | Fluxo padrão risco baixo |
| SSN≠9 + NC + TerraceFinance | `FUNDED` + último pagamento ≥ 11% baseCost | Regra NC de pagamento mínimo |
| SSN≠9 + NJ + TerraceFinance (ONLINE) | `DENIED` / NO_BUSINESS_IN_STATE | NJ bloqueado — Step 1 |
| SSN=9 + TX + qualquer merchant | `UW_DENIED` + email | Step 12 — SSN 9 = negação sandbox |
| SSN≠9 + KS3015 (FifthAveFurnitureNY) + banking+BIN | `FUNDED` via Kornerstone 16 meses | Fluxo KW — EPO fórmula especial |
| SSN≠9 + KS3015 + sem banking | `FUNDED` via UOWN 13 meses | Fallback sem dados bancários |
| Carrinho $249.99 + merchant min $250 | Erro 400 no `sendApplication` | Validação pré-pipeline |

---

## 4. Roteamento de Programa (13 vs 16 Meses)

A seleção do programa após o UW determina o fluxo e o money factor:

```
Condição 1: banking data presente E BIN elegível
    → Fluxo Kornerstone
    → Tenta programa 16 meses primeiro
    → Fallback para 13 meses se 16 não disponível/válido
    → Merchant: FifthAveFurnitureNY (KS3015), Kornerstone (GOW-0003_clone_fer_ks)

Condição 2: sem banking OU BIN não elegível
    → Fluxo UOWN
    → Apenas 13 meses
    → Merchant: TerraceFinance, BuyOnTrust, etc.
```

**planId gerado:**
| Frequência + Termo | planId |
|-------------------|--------|
| Weekly 13 meses | `WK13` |
| Bi-weekly 16 meses | `BWK16` |
| Semi-monthly 13 meses | `SM13` |
| Monthly 16 meses | `MN16` |

---

## 5. Camadas de Detecção de Fraude (Cenários Específicos)

Para testes que verificam recusa por fraude (além do SSN 9):

| Serviço | O que testa | Como simular em sandbox |
|---------|------------|------------------------|
| **Sentilink** | Identidade sintética | Scores configurados por threshold por merchant |
| **Neustar** | Inconsistência de contato | Telefone pré-pago, email novo, endereço inválido |
| **LexisNexis** | Registros públicos | Score configurado por threshold |
| **SEON** | Pegada digital | IP VPN, email descartável, telefone VoIP |
| **NeuroID** | Biometria comportamental | Copy/paste no formulário, velocidade anormal |
| **Kount** | Fraude de cartão | BIN de cartão roubado/comprometido |
| **Blacklist** | Dados previamente sinalizados | Inserir dados na `uown_blacklist_*` via Admin |

---

## 6. Impacto da Tributação nos Cálculos dos Testes

Ao escrever asserções sobre valores financeiros, considerar:

```typescript
// ONLINE merchant → estado do endereço do cliente define a tax
// baseCost = totalInvoiceAmount - taxAmount - depositAmount
// contractAmount = baseCost × moneyFactor × termMonths

// Estados sem tax (OR, AK, DE, MT, NH):
// taxAmount = 0 → baseCost = totalInvoiceAmount → contrato máximo

// TX (tax upfront alto):
// taxAmount elevado → baseCost menor → contrato menor que em OR

// CA/NY/HI/WV (regra EPO proporcional):
// EPO = cost × (remainingPayments / totalPayments)
// NÃO usar epoDays fixos nas asserções nesses estados
```

---

## 7. Referência Rápida de Merchants para Cada Cenário de Risco

| Cenário | Merchant Recomendado | Número | Fluxo | Motivo |
|---------|---------------------|--------|-------|--------|
| Risco baixo — padrão | `TerraceFinance` | OL90202-0001 | UOWN 13m | ONLINE, estável, não-KS |
| Risco baixo — Kornerstone | `FifthAveFurnitureNY` | KS3015 | KS 16m/13m | Requer banking+BIN |
| Risco médio | `TerraceFinance` ou `BuyOnTrust` | OL90202-0001 / OL90544-0001 | UOWN 13m | Aceita SSN≠9 com limite menor |
| Risco alto / negação UW | Qualquer | Qualquer | Para no Step 12 | SSN termina em 9 |
| Estado bloqueado | `TerraceFinance` | OL90202-0001 | Para no Step 1 | Cliente endereço NJ/VT/MN/ME |
| Regra EPO CA | `TerraceFinance` | OL90202-0001 | EPO proporcional | Cliente endereço CA |
| Regra NC | `TerraceFinance` | OL90202-0001 | Último pagamento ≥ 11% | Cliente endereço NC |

---

## 8. Campos Críticos no `sendApplication` por Cenário

```typescript
// Risco Baixo
{
  ssn: '123-45-0001',          // NÃO termina em 9
  state: 'CA',                  // estado ativo, EPO proporcional
  merchandiseSubtotal: 1000,    // acima do mínimo ($250)
  routingNumber: '021000021',   // dados bancários presentes
  accountNumber: '12345678'     // para fluxo Kornerstone (se merchant suportar)
}

// Risco Médio
{
  ssn: '123-45-0002',           // NÃO termina em 9
  state: 'TX',                  // sem regra EPO especial, tax upfront
  merchandiseSubtotal: 600,     // faixa conservadora
  routingNumber: undefined,     // sem banking → UOWN 13m
}

// Risco Alto (Negação)
{
  ssn: '123-45-0009',           // TERMINA EM 9 → UW_DENIED
  state: 'FL',                  // qualquer estado ativo
  merchandiseSubtotal: 900,
}

// Estado Bloqueado
{
  ssn: '123-45-0001',           // SSN OK, mas estado bloqueia
  state: 'NJ',                  // NO_BUSINESS_IN_STATE
  merchantNumber: 'OL90202-0001' // ONLINE → usa estado do cliente
}
```

---

## 9. Fontes e Referências Cruzadas

| Tópico | Arquivo |
|--------|---------|
| Pipeline 17 steps | `docs/business-rules/02-originacao-pipeline.md` |
| Money factor, security deposit, processing fee | `docs/business-rules/01-fundamentos.md` |
| Cálculo EPO e regras por estado | `docs/business-rules/04-calculos-financeiros.md` |
| Contratos e e-sign | `docs/business-rules/03-contratos-esign.md` |
| Pagamentos e sweeps | `docs/business-rules/05-pagamentos.md` |
| Enums e constantes (lead status, etc.) | `docs/business-rules/appendix-d-constantes-enums.md` |
| Campanhas UW por client type | `docs/business-rules/appendix-e-campanhas-uw.md` |
| Tabelas de DB para verificação | `docs/business-rules/appendix-c-tabelas-banco.md` |
| Catálogo de merchants de teste | `src/data/merchants.ts` |
| Helpers de DB para asserções | `src/helpers/database.helpers.ts` |
