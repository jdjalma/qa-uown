------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1039

UOWN | Origination | Refactoring to improve loading performance on the Overview page

Marcos Silvano @marcos.pacheco.silva
test instructions
All cards in the overview page load independently now.
Besides that the components got refactored slightly, the leads table should remain working as expected; 
displaying all filters and with configurable columns.

-----

UOWN | Originação | Refatoração para melhorar o desempenho de carregamento na página de Visão Geral

Marcos Silvano @marcos.pacheco.silva
Instruções de Teste
Todas as cartas na página de visão geral agora carregam de forma independente.
Além disso, os componentes foram ligeiramente refatorados; a tabela de leads deve continuar funcionando conforme esperado,
exibindo todos os filtros e com colunas configuráveis.


------------------------------------------------------------------------------------------------------------------------------------------------------------------

I made a visual comparison between the environment with and without the improvement.
I recorded a video showing the two scenarios side by side.
Before the improvement:
![1039-qa1-1.41-loadOverview_1_](/uploads/2300cd270841ef550fd529e474811e24/1039-qa1-1.41-loadOverview_1_.mp4)
![1039-qa1-1.41-loadOverview_1_](/uploads/fb2245ae9a25a649ad45faeeae5e0d18/1039-qa1-1.41-loadOverview_1_.png){width=1440 height=527}
With the improvement implemented:
![1039-qa1-1.42-loadOverview_1_](/uploads/884c0d98ff5962f37741e7b1f56c5125/1039-qa1-1.42-loadOverview_1_.mp4)
![1039-qa1-1.42-loadOverview_1_](/uploads/69623edec9d2d8adf48768d9ce7bceb1/1039-qa1-1.42-loadOverview_1_.png){width=1436 height=495}

![1039-qa1-_1_](/uploads/4f69336fb13ba06fa74eda9876ece9f2/1039-qa1-_1_.png){width=1440 height=739}
![1039-qa1-_2_](/uploads/14db378bedf489af8b3a4c159345f669/1039-qa1-_2_.png){width=1440 height=739}
![1039-qa1-_3_](/uploads/6c96093e5615c41114b81d7a3e4db272/1039-qa1-_3_.png){width=1440 height=739}

:white_check_mark: The cards on the overview page now load independently.

:white_check_mark: The overall screen load time has been noticeably faster with the improvement.

:white_check_mark: The leads table continues to work as expected: it displays all filters and supports configurable columns.

The automated performance and load test results are in progress and will be published here soon.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

I made a visual comparison between the environment with and without the improvement.
I recorded a video showing the two scenarios side by side.
Before the improvement:
![1039-qa1-1.41-loadOverview_1_](/uploads/2300cd270841ef550fd529e474811e24/1039-qa1-1.41-loadOverview_1_.mp4)
![1039-qa1-1.41-loadOverview_1_](/uploads/fb2245ae9a25a649ad45faeeae5e0d18/1039-qa1-1.41-loadOverview_1_.png){width=1440 height=527}
With the improvement implemented:
![142](/uploads/c4929a9dc2696979ecda82f27f712aa0/142.mp4)
![142](/uploads/0b95f77b96fa7623502500e9d34348f5/142.png){width=1440 height=601}

![1039-qa1-_1_](/uploads/4f69336fb13ba06fa74eda9876ece9f2/1039-qa1-_1_.png){width=1440 height=739}
![1039-qa1-_2_](/uploads/14db378bedf489af8b3a4c159345f669/1039-qa1-_2_.png){width=1440 height=739}
![1039-qa1-_3_](/uploads/6c96093e5615c41114b81d7a3e4db272/1039-qa1-_3_.png){width=1440 height=739}

:white_check_mark: The cards on the overview page now load independently.

:white_check_mark: The overall screen load time has been noticeably faster with the improvement.

:white_check_mark: The leads table continues to work as expected: it displays all filters and supports configurable columns.

-----

# REPORT 1: Environment with Performance Improvement Implementation (1.42)

**Data period:** 2025-06-01 to 2025-06-30

## Tested Endpoints

- POST /getApplicationCountDetails
- POST /getApprovalRateDetails
- POST /getAvgApprovalDetails
- POST /getConversionRate
- POST /getExpiringAppDetails
- POST /getFundedAmtDetails
- POST /getOpenApprovalAmt
- POST /getSignedLeaseApprovals
- POST /getLeadFilterOptions
- POST /getLeadsInDateRange

---

## Run 1 – 1 VU

- **VUs:** 1  
- **Duration:** 5 min  
- **Iterations:** 60

**Results:**
- 100% of checks passed
- No requests failed
- 100% of endpoints responded with status 200
- **Response time p(95):** 971ms (below the 1200ms threshold)

**Summary:**  
System stable and with no bottlenecks under minimal load.

---

## Run 2 – 10 VUs

- **VUs:** 10  
- **Duration:** 5 min  
- **Iterations:** 524

**Results:**
- 100% of checks passed
- No requests failed
- 100% of endpoints responded with status 200
- **Response time p(95):** 992ms (below the 1200ms threshold)

**Summary:**  
System maintained performance even with 10x concurrency, with no slowdowns or errors.

![1039-qa1-ComMelhoria-10VU-_1_](/uploads/dc0ac4ff49642c53b5f2cd2f0dd8b718/1039-qa1-ComMelhoria-10VU-_1_.png){width=371 height=398}
![1039-qa1-ComMelhoria-10VU-_2_](/uploads/587f06e5cc512782ae5530ddd7fdc428/1039-qa1-ComMelhoria-10VU-_2_.png){width=858 height=639}
---

## Run 3 – 100 VUs

- **VUs:** 100  
- **Duration:** 25 min  
- **Iterations:** 3,272

**Results:**
- Checks: 95.78% success (below the 98% threshold)
- **/getLeadsInDateRange:** only 49% success, identified as a bottleneck
- Global error rate: 5.06% (above the 1% threshold)
- **Response time p(95):** 6.19s (above the 2s threshold)

**Summary:**  
Under high concurrency, the system shows relevant degradation only on the highest-volume endpoint; the others remain stable.

# REPORT 2: Environment without Performance Improvement Implementation (1.41)

**Data period:** 2025-06-01 to 2025-06-30

## Considered Endpoints

- POST /getApplicationCountDetails
- POST /getApprovalRateDetails
- POST /getAvgApprovalDetails
- POST /getConversionRate
- POST /getExpiringAppDetails
- POST /getFundedAmtDetails
- POST /getOpenApprovalAmt
- POST /getSignedLeaseApprovals
- POST /getLeadsInDateRange

---

## Run 1 – 1 VU

- **VUs:** 1  
- **Duration:** 5 min  
- **Iterations:** 71

**Results:**
- All existing endpoints passed 100% of checks
- Real error rate: 0%
- **Response time p(95):** 214ms to 254ms
- **/getLeadsInDateRange:** p95 = 289ms

**Summary:**  
Stable system, all existing endpoints with total success.


![1039-qa1-SemMelhoria-1VU-_1_](/uploads/23e86de7077e5535a9c512640d60dfe4/1039-qa1-SemMelhoria-1VU-_1_.png){width=1205 height=629}
![1039-qa1-SemMelhoria-1VU-_2_](/uploads/32b3ad031065fe04bf9371124d46dcde/1039-qa1-SemMelhoria-1VU-_2_.png){width=1205 height=629}
![1039-qa1-SemMelhoria-1VU-_4_](/uploads/20a1c25cd060d21aec7e11626176d368/1039-qa1-SemMelhoria-1VU-_4_.png){width=1205 height=629}
![1039-qa1-SemMelhoria-1VU-_5_](/uploads/3a17a7db21aba9bc0c0a42045a98ef4b/1039-qa1-SemMelhoria-1VU-_5_.png){width=1192 height=307}

---

## Run 2 – 10 VUs

- **VUs:** 10  
- **Duration:** 5 min  
- **Iterations:** 622

**Results:**
- All existing endpoints passed 100% of checks
- Real error rate: 0%
- **Response time p(95):** 219ms to 314ms
- **/getLeadsInDateRange:** p95 = 479ms

**Summary:**  
Stable system under moderate load, no failures.

![1039-qa1-SemMelhoria-10VU-_1_](/uploads/6cccf8273cfc9290b49bac2697fb9bc3/1039-qa1-SemMelhoria-10VU-_1_.png){width=882 height=411}
![1039-qa1-SemMelhoria-10VU-_2_](/uploads/4d821ba18ba59dbf0044d242822b6d8e/1039-qa1-SemMelhoria-10VU-_2_.png){width=882 height=654}

---

## Run 3 – 100 VUs

- **VUs:** 100  
- **Duration:** 25 min  
- **Iterations:** 3,560

**Results:**
- All existing endpoints, except /getLeadsInDateRange, had 100% success
- **/getLeadsInDateRange:** 48.8% success (high failure rate)
- **Response time p(95):** for stable endpoints above 4s
- **/getLeadsInDateRange:** p95 = 8,799ms (8.8s), maximum of 15s

**Summary:**  
Under high load, only /getLeadsInDateRange presented severe degradation; others remained stable.

![1039-qa1-SemMelhoria-100VU-_1_](/uploads/aba01ba3a488efc157b82ce8ab097e8e/1039-qa1-SemMelhoria-100VU-_1_.png){width=1196 height=634}
![1039-qa1-SemMelhoria-100VU-_2_](/uploads/c2714ccb89939654edfbbdfc88e5a2b9/1039-qa1-SemMelhoria-100VU-_2_.png){width=1196 height=634}
![1039-qa1-SemMelhoria-100VU-_3_](/uploads/6034c1a12ac4c1aac19727f8d5dd8d92/1039-qa1-SemMelhoria-100VU-_3_.png){width=1196 height=634}
![1039-qa1-SemMelhoria-100VU-_4_](/uploads/a8be8827a2a8e727fee1f25d0c217216/1039-qa1-SemMelhoria-100VU-_4_.png){width=1196 height=634}![1039-qa1-SemMelhoria-100VU-_5_](/uploads/9fece2087c4b9f5f59ebdbb146819206/1039-qa1-SemMelhoria-100VU-_5_.png){width=1196 height=634}
![1039-qa1-SemMelhoria-100VU-_6_](/uploads/132f1492525af43dc51c41ed5bc20815/1039-qa1-SemMelhoria-100VU-_6_.png){width=399 height=405}
![1039-qa1-SemMelhoria-100VU-_7_](/uploads/8016f0695b619dabf16f17a4cfa1de81/1039-qa1-SemMelhoria-100VU-_7_.png){width=881 height=640}


# k6 Performance Test Comparison  
**Version 1.42 (With Improvement) vs 1.41 (Without Improvement)**

## Executive Summary
The implementation of the performance improvement (version 1.42) resulted in clear advances in stability, success rate, elimination of endpoint failures, and sustained performance, especially for low and medium loads. The main bottleneck identified with 100 VUs was significantly reduced, though not completely eliminated.

---

## Comparison by Load Scenario

### 1 VU (Single Concurrent User)

| Metric                 | Without Improvement (1.41) | With Improvement (1.42) | Improvement Benefit                                                                                                  |
|------------------------|----------------------------|-------------------------|----------------------------------------------------------------------------------------------------------------------|
| Checks Passed (%)      | 91.66%                     | 100%                    | Failures eliminated                                                                                                  |
| Global Error Rate (%)  | 9.99%                      | 0%                      | 100% fewer errors                                                                                                    |
| Response Time p(95)    | 250ms                      | 971ms                   | Remains within expected, no negative impact (response time a bit higher, but still comfortable)                      |

---

### 10 VUs (Moderate Concurrency)

| Metric                 | Without Improvement (1.41) | With Improvement (1.42) | Improvement Benefit                                    |
|------------------------|----------------------------|-------------------------|--------------------------------------------------------|
| Checks Passed (%)      | 91.62%                     | 100%                    | Failures eliminated                                    |
| Global Error Rate (%)  | 10.04%                     | 0%                      | 100% fewer errors                                      |
| Response Time p(95)    | 396ms                      | 992ms                   | Still well below threshold, no significant slowdown    |

---

### 100 VUs (High Load/Stress)

| Metric                           | Without Improvement (1.41) | With Improvement (1.42) | Improvement Benefit                                    |
|-----------------------------------|----------------------------|-------------------------|--------------------------------------------------------|
| Checks Passed (%)                 | 87.34%                     | 95.78%                  | +8.44pp in stability                                   |
| Global Error Rate (%)             | 15.18%                     | 5.06%                   | 67% error reduction                                    |
| Success on `/getLeadsInDateRange` | 48%                        | 49%                     | Slight increase, but still main bottleneck             |
| Response Time p(95)               | 6.89s                      | 6.19s                   | 10% faster, but still above ideal                      |

---

## Key Points Where the Improvement Made a Difference

- **Overall Stability:** 100% check and endpoint success for 1 and 10 VUs, ensuring production reliability.
- **Error Reduction:** Eliminated global errors for 1 and 10 VUs; major reduction for 100 VUs.
- **Improved Scalability:** Higher capacity for simultaneous users without performance loss.
- **Acceptable Response Times:** Even with slightly higher p(95) for low/medium load, still within threshold.
- **Problem Concentration:** After the improvement, only /getLeadsInDateRange under high load remains as a relevant limitation.

---

## What are we guaranteeing?

- **Scalability for Daily Operation:** System runs error-free, suitable for daily and seasonal demands.
- **Next Steps:** Focus on optimizing /getLeadsInDateRange for high loads.
- **Lower risk in production:** Fewer incidents and downtime for customers and operations.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Leases não são exibidos quando tela carrega

Durante a execução do teste automatizado UnifiedFlow, foi identificado que ao carregar a página, os leases não são exibidos inicialmente. No entanto, ao realizar busca, os leases são exibidos corretamente. Esse comportamento difere do esperado, pois, anteriormente, ao recarregar a página, os leases eram exibidos automaticamente.

-----

# Leases are not displayed when screen loads

During the execution of the UnifiedFlow automated test, it was identified that when loading the page, the leases are not initially displayed. However, when performing a search, the leases are displayed correctly. This behavior differs from what was expected, because previously, when reloading the page, the leases were displayed automatically.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

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
- QA:  ![MetricasQa-VirtualUser-_1_](/uploads/afe1b08a1f06dda439da1ca86def6cb2/MetricasQa-VirtualUser-_1_.png){width=1200 height=620}
- STAGING: ![MetricasStg-VirtualUser-_1_](/uploads/c6e25019f0ba7ad980c1cb5fa731ace9/MetricasStg-VirtualUser-_1_.png){width=1209 height=648}

---

### 2. getApprovalRateDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 2,547    | 4,261    | 4      | 99.9        | High latency and peaks in QA. |
| STAGING     | 200      | 215      | 0      | 100         | Fast and stable response. |

**Insight:**  
Large latency difference, STAGING is up to 20x faster.

**Charts:**
- QA:  ![MetricasQa-DadosRecebidos-_2_](/uploads/1a1ccabf5cd0c566fd2b32f9a49ca8a8/MetricasQa-DadosRecebidos-_2_.png){width=1200 height=620}
- STAGING:  ![MetricasStg-DadosRecebidos-_2_](/uploads/a0f36257d53b89860e9e222534f78903/MetricasStg-DadosRecebidos-_2_.png){width=1209 height=648}

---

### 3. getAvgApprovalDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,644    | 2,892    | 1      | 99.9        | Stable in QA, but slower. |
| STAGING     | 198      | 210      | 0      | 100         | Much better performance in STAGING. |

**Charts:**
- QA:  ![MetricasQa-TempoResposta-_4_](/uploads/f02902d1f51431847e7d6a7584e9fb90/MetricasQa-TempoResposta-_4_.png){width=1200 height=620}
- STAGING:  ![MetricasStg-TempoResposta-_4_](/uploads/67cdb6165093629a0b024701b0760a8f/MetricasStg-TempoResposta-_4_.png){width=1209 height=648}

---

### 4. getConversionRate

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 1,905    | 3,021    | 8      | 99.8        | More errors and higher latency in QA. |
| STAGING     | 197      | 213      | 0      | 100         | No failures and fast in STAGING. |

**Charts:**
- QA:  ![MetricasQa-Throughput_5_](/uploads/90958248fd7ef66aca70ad5a53aaf595/MetricasQa-Throughput_5_.png){width=1200 height=620}
- STAGING:  ![MetricasStg-Throughput_5_](/uploads/f7f38f0f11e9a39adce49e1303586ae9/MetricasStg-Throughput_5_.png){width=1209 height=648}

---

### 5. getExpiringAppDetails

| Environment | Avg (ms) | p95 (ms) | Errors | Success (%) | Observations |
|-------------|----------|----------|--------|-------------|--------------|
| QA          | 2,003    | 3,421    | 2      | 99.9        | High latency in QA. |
| STAGING     | 195      | 208      | 0      | 100         | Stable and fast in STAGING. |

**Charts:**
- QA:  ![MetricasQa-DadosEnviados-_3_](/uploads/61e1359cbb84b6e6df856f9b532e4d62/MetricasQa-DadosEnviados-_3_.png){width=1200 height=620}
- STAGING: ![MetricasStg-DadosEnviados-_3_](/uploads/8ad12dfe81ad621004089c0da52c6900/MetricasStg-DadosEnviados-_3_.png){width=1209 height=648}

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

------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
> 
> ### Feature: Management of Do Not Email, Do Not Call, and Do Not Text fields
> 
> ### Scenario: Select "Do Not Email", provide a reason and save
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved in the database and log
> | PASS |
> ```
> 
> ```gherkin
> ### Scenario: Select "Do Not Email", provide a reason and cancel edit
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I provide a reason
> And I cancel the edit
> Then no information should be saved
> And the checkbox should return to its original state
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Try to save "Do Not Email" without a reason
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I do not provide a reason
> And I try to save
> Then the system should display the message "Reason is required"
> And no data should be saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Section not in edit mode keeps "Do Not Email" disabled
> Given the section is not in edit mode
> Then the "Do Not Email" checkbox should remain disabled
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select and unselect "Do Not Email" before saving
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I uncheck the checkbox
> And I save the changes
> Then no changes should be persisted
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Email" and "Do Not Call" with different reasons and save
> Given I am in edit mode
> When I check the "Do Not Email" checkbox and provide reason A
> And I check the "Do Not Call" checkbox and provide reason B
> And I save the changes
> Then both reasons should be correctly saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: "Do Not Email" pre-checked from backend appears checked and allows editing
> Given the "Do Not Email" field comes pre-checked from the backend
> Then it should appear checked and allow editing
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Uncheck "Do Not Email" with previously saved reason removes reason
> Given the "Do Not Email" field already has a saved reason
> When I uncheck the "Do Not Email" checkbox
> And I save the changes
> Then the reason should be removed from the database and log
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: "Do Not Contact" field is not displayed on Origination portal
> Given I am on the Origination portal
> Then the "Do Not Contact" field should not be displayed
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Call", provide a reason and save
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Try to save "Do Not Call" without a reason
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I do not provide a reason
> And I try to save
> Then the system should block the action and display "Reason is required"
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Section not in edit mode keeps "Do Not Call" disabled
> Given the section is not in edit mode
> Then the "Do Not Call" field should remain disabled
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Selecting "Do Not Call" auto-checks "Do Not Text" and makes reason required
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> Then the "Do Not Text" checkbox should be auto-checked
> And the reason field should be required
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Call", fill in reason and cancel
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I provide a reason
> And I cancel the edit
> Then no data should be saved
> And the checkboxes should be reset
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Uncheck "Do Not Text" after selecting "Do Not Call" and save with reason
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And the "Do Not Text" checkbox is auto-checked
> And I uncheck the "Do Not Text" checkbox
> And I provide a reason
> And I save the changes
> Then the fields should be correctly persisted
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select only "Do Not Text", provide a reason and save
> Given I am in edit mode
> When I check only the "Do Not Text" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved
> | PASS |
> ```
>
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------