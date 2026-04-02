------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/devops/configuration/-/issues/10

UOWN | DevOps | Evaluate Infrastructure for Java Version Migration

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Rodrigo Ramos dos Santos @rodddram
Steps to Migrate from Java 11 to Java 17
1. Gradle Compatibility
There is no need to upgrade the current Gradle version (7.4.1), as it supports Java 17:

Gradle compatibility documentation

2. Builder Image Update
A new builder image needs to be created with JDK 17 and build tools like Gradle.

There is an existing builder image registry.uownleasing.com/builders/gradle:1.0.
It would be helpful to retrieve its Dockerfile for reference.
3. Update GRADLE_IMAGE Variable
Update the GRADLE_IMAGE variable in the uwon group in GitLab to match the new builder image name (generated on step #2)

4. Java Repositories Changes
Update the following files in each Java repository:

/build.gradle:
sourceCompatibility:
from sourceCompatibility = '11'
to sourceCompatibility = '17'
java.specification.version:
from assert System.properties["java.specification.version"] == "11" || "12" || "13" || "14" || "15"
to assert System.properties["java.specification.version"] == "11" || "12" || "13" || "14" || "15" || "17"
/gradle/docker.gradle:
Attention point: The base image has been changed because AdoptOpenJDK is no longer maintained (source)

Update base image:
from image = "adoptopenjdk:11-jre-hotspot"
to image = "eclipse-temurin:17.0.13_11-jre"

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Criar aplicação manualmente e definir como funded.
Manually create application and set as funded.

Executar fluxo unificado nos portais Origination, Servicing e Website.
Run unified flow across Origination, Servicing, and Website portals.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in dev3 stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 490 | Progress Mobility | Manually create application and set as funded. |  | PASS |
| 492 | Progress Mobility | Run unified flow across Origination, Servicing, and Website portals. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Executado ACH Sweeps createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep. Sweeps sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep.
Criado aplicação submetendo pelo processo de verificação de identidade Itellicheck. Realizado processo de Underwriting e SubmitApplication. Realizado processo de reverses the ACH payment and reopens the account, changing its status to "ACTIVE"
Todas as tarefas dessa versão e da versão anterior foram testadas no java 17.
| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| -- | -- | ACH Sweeps - createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep |  | PASS | -- |
| -- | -- | Sweeps - sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep |  | PASS | -- |
| 23635 | Progress Mobility | Verify the creation of a lease through the Intellicheck process |  | PASS | -- |
| -- | -- | SharePointService - generateMerchantLeaseReport, latePaymentNoticeEmailSweep, sendFirstPaymentRemindersSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep, generateExportBlacklistReport  |  | WIP | -- |
| 23615 | Progress Mobility | Verify the Underwriting process | -- | PASS | -- |
| 23617 | Progress Mobility | Verify the SubmitApplication process | -- | PASS | -- |
| 206330 | Progress Mobility | Verify that executing reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE" |  | PASS | -- |    
