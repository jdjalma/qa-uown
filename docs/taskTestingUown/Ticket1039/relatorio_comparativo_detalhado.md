# Relatório Comparativo Detalhado por Endpoint – Teste de Carga

**Dashboard:** Overview  
**Período analisado:**  
- QA: 2025-07-23 01:17:15 a 2025-07-23 01:22:15  
- STAGING: 2025-07-23 01:37:15 a 2025-07-23 01:42:00

---

## Sumário Geral

| Métrica              | QA (Total) | STAGING (Total) | Observações |
|----------------------|------------|-----------------|-------------|
| Requisições totais   | 59.381     | 15.511          | Volume maior em QA, mas ambos ambientes com carga alta. |
| Taxa de sucesso (%)  | 95,5%      | 100%            | STAGING sem falhas, QA apresentou algumas falhas. |
| Falhas totais        | 3.206      | 0               | QA teve falhas em alguns endpoints críticos. |

---

## Resultados e Insights por Endpoint

### 1. getApplicationCountDetails

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 2.025      | 3.387    | 4     | 99,8        | Latência alta em QA, mas sucesso elevado. |
| STAGING  | 217        | 524      | 0     | 100         | Muito mais rápido e estável em STAGING. |

**Insight:**  
O endpoint teve resposta até 10x mais rápida em STAGING, indicando otimização ou menos concorrência.

**Gráficos:**
- QA:  ![alt text](MetricasQa-VirtualUser-(1).png)
- STAGING:  ![alt text](MetricasStg-VirtualUser-(1).png)

---

### 2. getApprovalRateDetails

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 2.547      | 4.261    | 4     | 99,9        | Latência e picos altos em QA. |
| STAGING  | 200        | 215      | 0     | 100         | Resposta rápida e estável. |

**Insight:**  
Grande diferença de latência, STAGING responde até 20x mais rápido.

**Gráficos:**
- QA:  ![alt text](MetricasQa-DadosRecebidos-(2).png)
- STAGING:  ![alt text](MetricasStg-DadosRecebidos-(2)-1.png)

---

### 3. getAvgApprovalDetails

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 1.644      | 2.892    | 1     | 99,9        | QA estável, mas mais lento. |
| STAGING  | 198        | 210      | 0     | 100         | STAGING muito mais performático. |

**Gráficos:**
- QA:  ![alt text](MetricasQa-TempoResposta-(4).png)
- STAGING:  ![alt text](MetricasStg-TempoResposta-(4).png)

---

### 4. getConversionRate

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 1.905      | 3.021    | 8     | 99,8        | QA teve mais erros e latência. |
| STAGING  | 197        | 213      | 0     | 100         | STAGING sem falhas e rápido. |

**Gráficos:**
- QA:  ![alt text](MetricasQa-Throughput(5).png)
- STAGING:  ![alt text](MetricasStg-Throughput(5).png)

---

### 5. getExpiringAppDetails

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 2.003      | 3.421    | 2     | 99,9        | Latência elevada em QA. |
| STAGING  | 195        | 208      | 0     | 100         | STAGING estável e rápido. |

**Gráficos:**
- QA:  ![alt text](MetricasQa-DadosEnviados-(3).png)
- STAGING:  ![alt text](MetricasStg-DadosEnviados-(3).png)

---

### 6. getFundedAmtDetails

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 1.691      | 2.898    | 1     | 99,9        | QA estável, mas lento. |
| STAGING  | 192        | 210      | 0     | 100         | STAGING excelente performance. |

---

### 7. getOpenApprovalAmt

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 1.964      | 3.325    | 1     | 99,9        | QA estável, mas mais lento. |
| STAGING  | 194        | 208      | 0     | 100         | STAGING muito mais rápido. |

---

### 8. getSignedLeaseApprovals

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 1.936      | 3.401    | 1     | 99,9        | QA estável, mas lento. |
| STAGING  | 196        | 209      | 0     | 100         | STAGING excelente performance. |

---

### 9. getLeadFilterOptions

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | 3.003      | 4.655    | 3     | 99,9        | QA teve maior latência. |
| STAGING  | ~200       | ~210     | 0     | 100         | STAGING responde muito mais rápido. |

---

### 10. getLeadsInDateRange

| Ambiente | Média (ms) | p95 (ms) | Erros | Sucesso (%) | Observações |
|----------|------------|----------|-------|-------------|-------------|
| QA       | -          | -        | 3.180 | 46,4        | QA apresentou muitos erros e baixa taxa de sucesso. |
| STAGING  | -          | -        | 0     | 100         | STAGING sem falhas. |

---

## Insights Gerais

- **Todos os endpoints tiveram desempenho MUITO superior em STAGING**, com latências médias e p95 até 10-20x menores.
- **QA apresentou falhas em vários endpoints** (principalmente getLeadsInDateRange), enquanto STAGING não teve falhas.
- **Possíveis causas para diferença:** infraestrutura, concorrência, dados, otimizações recentes ou ambiente mais limpo em STAGING.
- **Atenção especial:** getLeadsInDateRange no QA, que teve apenas 46% de sucesso e muitos erros.

---
