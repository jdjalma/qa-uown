------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/336

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Adicionar nome de anfitrião em assuntos de e-mail de relatório

Davi Artur @davi.artur.gow
@jose.memesdev

Varredura para verificar o e-mail do relatório:

⁠dailyAgentTransactionReportSweep
⁠sendDailyReportsToBBWheelsSweep
⁠monthlyTaxReportSweep
sendDailyPaymentsSharepointSweep
⁠- activeLeaseDailyReport
⁠- rerunACHWeeklyReport
⁠- sendDailyBorrowingBaseReport
⁠- delinquencyRerunCCPaymentsSweep
dailyDelinquencyRerunCCSweep



POST /uown/svc/triggerScheduledTask/{sweepName}

Após a ativação, você deve esperar que o e-mail do relatório seja enviado para você

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Confirm the receipt of the email BB Wheels Daily Report, after the execution of the endpoint ⁠sendDailyReportsToBBWheelsSweep |  | PASS |
| Confirm the receipt of the email Uown Sales Tax Report, after the execution of the endpoint ⁠monthlyTaxReportSweep |  | PASS |
| Confirm the receipt of the email Uown Daily Payments Daily Report, after the execution of the endpoint sendDailyPaymentsSharepointSweep |  | PASS |
| Confirm the receipt of the email Uown Active Leases Daily Report, after the execution of the endpoint activeLeaseDailyReport |  | PASS |
| Confirm the receipt of the email Uown Rerun ACH Weekly Report, after the execution of the endpoint rerunACHWeeklyReport |  | PASS |
| Confirm the receipt of the email Uown Borrowing Base Daily Report, after the execution of the endpoint sendDailyBorrowingBaseReport |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Confirm the receipt of the email BB Wheels Daily Report, after the execution of the endpoint ⁠sendDailyReportsToBBWheelsSweep
Confirm the receipt of the email Uown Sales Tax Report, after the execution of the endpoint ⁠monthlyTaxReportSweep
Confirm the receipt of the email Uown Daily Payments Daily Report, after the execution of the endpoint sendDailyPaymentsSharepointSweep
Confirm the receipt of the email Uown Active Leases Daily Report, after the execution of the endpoint activeLeaseDailyReport
Confirm the receipt of the email Uown Rerun ACH Weekly Report, after the execution of the endpoint rerunACHWeeklyReport
Confirm the receipt of the email Uown Borrowing Base Daily Report, after the execution of the endpoint sendDailyBorrowingBaseReport

------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in qa1 ok

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Confirm the receipt of the email BB Wheels Daily Report, after the execution of the endpoint ⁠sendDailyReportsToBBWheelsSweep | -- | PASS |
| Confirm the receipt of the email Uown Sales Tax Report, after the execution of the endpoint ⁠monthlyTaxReportSweep |  | PASS |
| Confirm the receipt of the email Uown Daily Payments Daily Report, after the execution of the endpoint sendDailyPaymentsSharepointSweep |  | PASS |
| Confirm the receipt of the email Uown Active Leases Daily Report, after the execution of the endpoint activeLeaseDailyReport |  | PASS |
| Confirm the receipt of the email Uown Rerun ACH Weekly Report, after the execution of the endpoint rerunACHWeeklyReport |  | PASS |
| Confirm the receipt of the email Uown Borrowing Base Daily Report, after the execution of the endpoint sendDailyBorrowingBaseReport |  | PASS |
| Confirm the receipt of the email Uown Daily Transaction Report Sweep, after the execution of the endpoint ⁠dailyAgentTransactionReportSweep |  | PASS |
| Confirm the receipt of the email Uown Delinquency Rerun CC Payments Sweep, after the execution of the endpoint delinquencyRerunCCPaymentsSweep |  | WIP |
| Confirm the receipt of the email Uown Daily Delinquency Rerun CC Sweep, after the execution of the endpoint dailyDelinquencyRerunCCSweep |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in staging ok

------------------------------------------------------------------------------------------------------------------------------------------------------------------

