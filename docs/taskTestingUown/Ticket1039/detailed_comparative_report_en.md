# Detailed Comparative Report by Endpoint – Load Test

**Dashboard:** Overview  
**Period analyzed:**  
- QA: 2025-07-23 01:17:15 to 2025-07-23 01:22:15  
- STAGING: 2025-07-23 01:37:15 to 2025-07-23 01:42:00

---

## General Summary

| Metric                | QA (Total) | STAGING (Total) | Observations |
|-----------------------|------------|-----------------|--------------|
| Total requests        | 59,381     | 15,511          | Higher volume in QA, but both environments handled high load. |
| Success rate (%)      | 95.5%      | 100%            | STAGING had no failures; QA had some failures. |
| Total failures        | 3,206      | 0               | QA had failures in some critical endpoints. |

---

## Results and Insights by Endpoint

### 1. getApplicationCountDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 2,025    | 3,387    | 4      | 99.8        | High latency in QA, but high success rate. |
| STAGING     | 217      | 524      | 0      | 100         | Much faster and more stable in STAGING. |

**Insight:**  
This endpoint responded up to 10x faster in STAGING, indicating optimization or less contention.

**Charts:**
- QA:  ![alt text](MetricasQa-VirtualUser-(1)-1.png)
- STAGING:  ![alt text](MetricasStg-VirtualUser-(1)-1.png)

---

### 2. getApprovalRateDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 2,547    | 4,261    | 4      | 99.9        | High latency and peaks in QA. |
| STAGING     | 200      | 215      | 0      | 100         | Fast and stable response. |

**Insight:**  
Large latency difference, STAGING is up to 20x faster.

**Charts:**
- QA:  ![alt text](MetricasQa-DadosRecebidos-(2)-1.png)
- STAGING:  ![alt text](MetricasStg-DadosRecebidos-(2)-2.png)

---

### 3. getAvgApprovalDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,644    | 2,892    | 1      | 99.9        | Stable in QA, but slower. |
| STAGING     | 198      | 210      | 0      | 100         | Much better performance in STAGING. |

**Charts:**
- QA:  ![alt text](MetricasQa-TempoResposta-(4)-1.png)
- STAGING:  ![alt text](MetricasStg-TempoResposta-(4)-1.png)

---

### 4. getConversionRate

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,905    | 3,021    | 8      | 99.8        | More errors and higher latency in QA. |
| STAGING     | 197      | 213      | 0      | 100         | No failures and fast in STAGING. |

**Charts:**
- QA:  ![alt text](MetricasQa-Throughput(5)-1.png)
- STAGING:  ![alt text](MetricasStg-Throughput(5)-1.png)

---

### 5. getExpiringAppDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 2,003    | 3,421    | 2      | 99.9        | High latency in QA. |
| STAGING     | 195      | 208      | 0      | 100         | Stable and fast in STAGING. |

**Charts:**
- QA:  ![alt text](MetricasQa-DadosEnviados-(3)-1.png)
- STAGING:  ![alt text](MetricasStg-DadosEnviados-(3)-1.png)

---

### 6. getFundedAmtDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,691    | 2,898    | 1      | 99.9        | Stable but slower in QA. |
| STAGING     | 192      | 210      | 0      | 100         | Excellent performance in STAGING. |

---

### 7. getOpenApprovalAmt

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,964    | 3,325    | 1      | 99.9        | Stable but slower in QA. |
| STAGING     | 194      | 208      | 0      | 100         | Much faster in STAGING. |

---

### 8. getSignedLeaseApprovals

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,936    | 3,401    | 1      | 99.9        | Stable but slower in QA. |
| STAGING     | 196      | 209      | 0      | 100         | Excellent performance in STAGING. |

---

### 9. getLeadFilterOptions

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 3,003    | 4,655    | 3      | 99.9        | Higher latency in QA. |
| STAGING     | ~200     | ~210     | 0      | 100         | Much faster in STAGING. |

---

### 10. getLeadsInDateRange

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | -        | -        | 3,180  | 46.4        | Many errors and low success rate in QA. |
| STAGING     | -        | -        | 0      | 100         | No failures in STAGING. |

---

## General Insights

- **All endpoints performed MUCH better in STAGING**, with average and p95 latencies up to 10-20x lower.
- **QA had failures in several endpoints** (especially getLeadsInDateRange), while STAGING had none.
- **Possible reasons for the difference:** infrastructure, contention, data, recent optimizations, or a cleaner environment in STAGING.
- **Special attention:** getLeadsInDateRange in QA, which had only 46% success rate and many errors.
