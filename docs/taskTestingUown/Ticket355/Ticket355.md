------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/355

UOWN | Servicing | Exception in sendACHPaymentsSweep due to rollback and LocalDate access issue

BUG
During the execution of the sendACHPaymentsSweep, the following exception was raised:
Exception in sendACHPaymentsSweep() with cause = 'NULL' and exception = 'Transaction silently rolled back because it has been marked as rollback-only'
Additionally, when inspecting the ACH payments sweep, a specific record (ACH pks: 194740) throws:
java.lang.reflect.InaccessibleObjectException: Unable to make field private final int java.time.LocalDate.year accessible
This seems related to the module java.base not opening java.time to unnamed modules.
https://svc-website-qa2.uownleasing.com/customer-information/10509

Test Instructions - Java 17 Compatibility (Gson)
Context:
A global update was made to replace direct usage of new Gson() with JsonUtils.getGson(), including support for serialization and deserialization of LocalDate and LocalDateTime, ensuring compatibility with Java 17.
What needs to be tested:
All testing should be done in the QA2 environment, which will receive the deployment with Java 17.

⚠️ Important: Please verify that all functionalities behave the same in QA2 as they currently do in QA1 (which is still running Java 11). The behavior must remain consistent between the two environments.

Impacted Areas (directly or indirectly):
✅ ACH Sweeps
✅ Intellicheck
✅ SharePointService
✅ Underwriting - 12595
✅ SubmitApplication

-----
UOWN | Atendimento | Exceção em sendACHPaymentsSweep devido a rollback e problema de acesso ao LocalDate
BUG
Durante a execução do método sendACHPaymentsSweep, a seguinte exceção foi lançada:

Exceção em sendACHPaymentsSweep() com causa = 'NULL' e exceção = 'Transação revertida silenciosamente porque foi marcada como rollback-only'
Além disso, ao inspecionar o sweep de pagamentos ACH, um registro específico (ACH pks: 194740) gera a seguinte exceção:

java.lang.reflect.InaccessibleObjectException: Não foi possível tornar o campo private final int java.time.LocalDate.year acessível
Isso parece estar relacionado ao módulo java.base não abrir java.time para módulos não nomeados.

https://svc-website-qa2.uownleasing.com/customer-information/10509

Instruções de Teste - Compatibilidade com Java 17 (Gson)
Contexto:

Foi realizada uma atualização global para substituir o uso direto de new Gson() por JsonUtils.getGson(), incluindo suporte para serialização e desserialização de LocalDate e LocalDateTime, garantindo compatibilidade com o Java 17.

O que precisa ser testado:

Todos os testes devem ser realizados no ambiente QA2, que receberá a implantação com Java 17.

⚠️ Importante: Verifique se todas as funcionalidades se comportam da mesma forma no QA2 como atualmente no QA1 (que ainda está executando Java 11). O comportamento deve permanecer consistente entre os dois ambientes.

Áreas Impactadas (direta ou indiretamente):

✅ Sweeps ACH

✅ Intellicheck

✅ SharePointService

✅ Underwriting - 12595

✅ SubmitApplication

------------------------------------------------------------------------------------------------------------------------------------------------------------------


✅ ACH Sweeps
    https://svc-{{env}}.uownleasing.com/uown/svc/createScheduledACHPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/sendACHPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/getSendACHPaymentsStatusSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/getStatusDatePaymentsListSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/rerunACHSweep
        rerunACHPaymentsSweep

✅ Sweeps
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/sendDailyBorrowingBaseReport
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/saleFileGenerationSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/sendUnutilizedApprovalsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/generateMerchantLeaseReport
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/rerunCCPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/latePaymentNoticeEmailSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/sendFirstPaymentRemindersSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/sendRecurringPaymentRemindersSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/createScheduledCreditCardPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/sendCreditCardPaymentsSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/storedDocServiceSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/eSignDocumentStatusSweep
    https://svc-{{env}}.uownleasing.com/uown/svc/checkLeadExpirationSweep

✅ Verifique a criação de um lease passando pelo processo Intellicheck
    12608
✅ SharePointService
    Serviço 1 - Create Folder:
    Cria um serviço POST e na url coloca isso aqui (http://localhost:8080/uown/create-folder?parentFolderId=root&newFolderName=test-uown)
    Sendo que essa ultima parte aonde ta escrito "test-uown", troca para tipo "test-jose-sharepoint" 
    Algo assim, pois esse endpoint ele vai criar uma nova pasta no sharepoint, e essa "test-uown" eu já usei.
    https://svc-{{env}}.uownleasing.com/uown/create-folder?parentFolderId=root&newFolderName=qa2-355-c4(1)
    --
    Serviço 2 - Get Folder
    Cria um serviço GET e cola assim na url -> http://localhost:8080/uown/get-folder-url?folderId=01SMRZHINR6LVC2G2XM5CZGNOEUPG7NWFL
    sendo que essa variável "01SMRZHINR6LVC2G2XM5CZGNOEUPG7NWFL", tu vai trocar ela pelo ID que for retornado no serviço 1.
    Esse endpoint ele vai retornar a url que você pode colar no browser para abrir a pasta nova criada. Sò vai servir pra isso mesmo, pra vc recuperar a pasta que foi criada, o caminho dela, pra depois tu tentar acessar.
    https://svc-{{env}}.uownleasing.com/uown/get-folder-url?folderId=01SMRZHINR6LVC2G2XM5CZGNOEUPG7NWFL
    https://svc-{{env}}.uownleasing.com/uown/get-folder-url?folderId=01SMRZHIKWPFTBLXTXAZHI6R6RYM4XS546
    --
    Serviço 3 - Upload File
    Cria um serviço POST e cola isso aqui -> http://localhost:8080/uown/upload-file
    Na **Aba Body** 
    * Selecione: `form-data`
    * Adicione os campos:
    
    | Key              | Type | Value                          |
    | ---------------- | ---- | ------------------------------ |
    | `parentFolderId` | Text | (cole aqui o folder ID gerado no serviço 1) |
    | `file`           | File | (selecione o arquivo real, pode ser um arquivo .xlsx do excel. Eu criei um novo zerado, coloquei um texto dentro e enviei.)     |
    Esse último depois de clicar em SEND, tu deve receber uma resposta assim:
        {
            "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('6127fc5d-69e2-4b00-b2af-0b13ededb89f')/drive/items/$entity",
            "@microsoft.graph.downloadUrl": "https://mnghllc.sharepoint.com/sites/UownLeasing/_layouts/15/download.aspx?UniqueId=6da0bc1d-e25a-40bc-87fd-90d2f9cc657b&Translate=false&tempauth=v1.eyJzaXRlaWQiOiI2MTI3ZmM1ZC02OWUyLTRiMDAtYjJhZi0wYjEzZWRlZGI4OWYiLCJhcHBfZGlzcGxheW5hbWUiOiJVb3duTGVhc2luZyBTaGFyZXBvaW50IFByb2dyYW1tYXRpYyBVcGxvYWQiLCJuYW1laWQiOiJlMWQ1NzY3ZS01OGM2LTRjY2MtYmMzOS1hZWYwM2ViYzdmZmRAMGQ1N2M5MzktYzM1Ni00NWJiLWE2MmEtZjA0YmVkMTVmYWE4IiwiYXVkIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwL21uZ2hsbGMuc2hhcmVwb2ludC5jb21AMGQ1N2M5MzktYzM1Ni00NWJiLWE2MmEtZjA0YmVkMTVmYWE4IiwiZXhwIjoiMTc0Nzc1ODYxMyJ9.CgoKBHNuaWQSAjY0EgsI4P3Z9Kfviz4QBRoMNDAuMTI2LjI3Ljk2KixueVJWWlZhbThlSC9PT2JoN0ZSbHE4MXFFSTVtNDZqR2FVSk8zY090M2JzPTCIATgBQhChoAfeuHAAgNK9oeHFr52uShBoYXNoZWRwcm9vZnRva2VuegExugENc2VsZWN0ZWRzaXRlc8gBAQ.HYrA78PgQSlE_0HMcWSbLKCdizxQU99HmoXw-FRHw2s&ApiVersion=2.0",
            "createdDateTime": "2025-05-20T15:20:49Z",
            "eTag": "\"{6DA0BC1D-E25A-40BC-87FD-90D2F9CC657B},2\"",
            "id": "01SMRZHII5XSQG2WXCXRAIP7MQ2L44YZL3",
            "lastModifiedDateTime": "2025-05-20T15:30:13Z",
            "name": "testJose.xlsx",
            "webUrl": "https://mnghllc.sharepoint.com/sites/UownLeasing/_layouts/15/Doc.aspx?sourcedoc=%7B6DA0BC1D-E25A-40BC-87FD-90D2F9CC657B%7D&file=testJose.xlsx&action=default&mobileredirect=true",
            "cTag": "\"c:{6DA0BC1D-E25A-40BC-87FD-90D2F9CC657B},4\"",
            "size": 16002,
            "createdBy": {
                "application": {
                    "id": "e1d5767e-58c6-4ccc-bc39-aef03ebc7ffd",
                    "displayName": "UownLeasing Sharepoint Programmatic Upload"
                },
                "user": {
                    "displayName": "SharePoint App"
                }
            },
            "lastModifiedBy": {
                "application": {
                    "id": "e1d5767e-58c6-4ccc-bc39-aef03ebc7ffd",
                    "displayName": "UownLeasing Sharepoint Programmatic Upload"
                },
                "user": {
                    "displayName": "SharePoint App"
                }
            },
            "parentReference": {
                "driveType": "documentLibrary",
                "driveId": "b!XfwnYeJpAEuyrwsT7e24n7ZHQnZjYANEnJ9IJfT3lqlf_klqC_9TQYrQaS1G3KZN",
                "id": "01SMRZHINR6LVC2G2XM5CZGNOEUPG7NWFL",
                "name": "teste-uown",
                "path": "/drive/root:/teste-uown",
                "siteId": "6127fc5d-69e2-4b00-b2af-0b13ededb89f"
            },
            "file": {
                "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "hashes": {
                    "quickXorHash": "l6V4oY6HfdvL1zjzHVMpJ66JJN8="
                }
            },
            "fileSystemInfo": {
                "createdDateTime": "2025-05-20T15:20:49Z",
                "lastModifiedDateTime": "2025-05-20T15:30:13Z"
            },
            "shared": {
                "scope": "users"
            }
        }
        https://svc-{{env}}.uownleasing.com/uown/upload-file
            {
                "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('6127fc5d-69e2-4b00-b2af-0b13ededb89f')/drive/items/$entity",
                "@microsoft.graph.downloadUrl": "https://mnghllc.sharepoint.com/sites/UownLeasing/_layouts/15/download.aspx?UniqueId=927d6c4f-669e-4e05-bf2b-3aa5b6b8cbda&Translate=false&tempauth=v1.eyJzaXRlaWQiOiI2MTI3ZmM1ZC02OWUyLTRiMDAtYjJhZi0wYjEzZWRlZGI4OWYiLCJhcHBfZGlzcGxheW5hbWUiOiJVb3duTGVhc2luZyBTaGFyZXBvaW50IFByb2dyYW1tYXRpYyBVcGxvYWQiLCJuYW1laWQiOiJlMWQ1NzY3ZS01OGM2LTRjY2MtYmMzOS1hZWYwM2ViYzdmZmRAMGQ1N2M5MzktYzM1Ni00NWJiLWE2MmEtZjA0YmVkMTVmYWE4IiwiYXVkIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwL21uZ2hsbGMuc2hhcmVwb2ludC5jb21AMGQ1N2M5MzktYzM1Ni00NWJiLWE2MmEtZjA0YmVkMTVmYWE4IiwiZXhwIjoiMTc0Nzc2Mzc4NCJ9.CgoKBHNuaWQSAjY0EgsIipXil6nyiz4QBRoNNDAuMTI2LjI3LjE2MyosL3M0NlhrZlBjbUhPZDdzdVJLVU9XeXIrVG8ramJHOHh1aWdkeHd6dWxhMD0wiAE4AUIQoaAMzR4QAJAFKOZ7rRfCLUoQaGFzaGVkcHJvb2Z0b2tlbnoBMboBDXNlbGVjdGVkc2l0ZXPIAQE.hnQFjMLGS7JAXp2CAiGlic12deCAyfRXHge1Qjfv5RE&ApiVersion=2.0",
                "createdDateTime": "2025-05-20T16:56:24Z",
                "eTag": "\"{927D6C4F-669E-4E05-BF2B-3AA5B6B8CBDA},1\"",
                "id": "01SMRZHIKPNR6ZFHTGAVHL6KZ2UW3LRS62",
                "lastModifiedDateTime": "2025-05-20T16:56:24Z",
                "name": "qa2-355-c4-SharePoint(1).xlsx",
                "webUrl": "https://mnghllc.sharepoint.com/sites/UownLeasing/_layouts/15/Doc.aspx?sourcedoc=%7B927D6C4F-669E-4E05-BF2B-3AA5B6B8CBDA%7D&file=qa2-355-c4-SharePoint(1).xlsx&action=default&mobileredirect=true",
                "cTag": "\"c:{927D6C4F-669E-4E05-BF2B-3AA5B6B8CBDA},2\"",
                "size": 14302,
                "createdBy": {
                    "application": {
                        "id": "e1d5767e-58c6-4ccc-bc39-aef03ebc7ffd",
                        "displayName": "UownLeasing Sharepoint Programmatic Upload"
                    },
                    "user": {
                        "displayName": "SharePoint App"
                    }
                },
                "lastModifiedBy": {
                    "application": {
                        "id": "e1d5767e-58c6-4ccc-bc39-aef03ebc7ffd",
                        "displayName": "UownLeasing Sharepoint Programmatic Upload"
                    },
                    "user": {
                        "displayName": "SharePoint App"
                    }
                },
                "parentReference": {
                    "driveType": "documentLibrary",
                    "driveId": "b!XfwnYeJpAEuyrwsT7e24n7ZHQnZjYANEnJ9IJfT3lqlf_klqC_9TQYrQaS1G3KZN",
                    "id": "01SMRZHIKWPFTBLXTXAZHI6R6RYM4XS546",
                    "name": "qa2-355-c4(1)",
                    "path": "/drive/root:/qa2-355-c4(1)",
                    "siteId": "6127fc5d-69e2-4b00-b2af-0b13ededb89f"
                },
                "file": {
                    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "hashes": {
                        "quickXorHash": "PeyESTN8p7ftvdMqIexy78Cg40s="
                    }
                },
                "fileSystemInfo": {
                    "createdDateTime": "2025-05-20T16:56:24Z",
                    "lastModifiedDateTime": "2025-05-20T16:56:24Z"
                },
                "shared": {
                    "scope": "users"
                }
            }
✅ Verifique o processo de Underwriting
    12595
✅ Verifique o processo de SubmitApplication
    12593
✅ Verifique se a execução do reverseAchPaymentsSweep reverte corretamente o pagamento ACH e reabre a conta, alterando seu status para "ATIVA."
    12609/10564

Tests in qa2

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | ACH Sweeps - createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep, rerunACHSweep |  | PASS |
| -- | -- | Sweeps - sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep |  | PASS |
| 12608 | Progress Mobility | Verify the creation of a lease through the Intellicheck process |  | PASS |
| -- | -- | SharePointService |  | WIP |
| 12595 | Progress Mobility | Verify the Underwriting process |  | PASS |
| 12593 | Progress Mobility | Verify the SubmitApplication process |  | PASS |
| 12609/10564 | Progress Mobility | Verify that executing reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE" |  | PASS |

-----

getStatusDatePaymentsListSweep
generateMerchantLeaseReport
latePaymentNoticeEmailSweep
sendFirstPaymentRemindersSweep
eSignDocumentStatusSweep
checkLeadExpirationSweep
getCompletedESignDocumentStatusSweep

-----

getStatusDatePaymentsListSweep
→ Varredura para obter a lista de pagamentos por data de status

generateMerchantLeaseReport
→ Gerar relatório de arrendamento do comerciante
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/generateMerchantLeaseReport
https://mnghllc.sharepoint.com/:x:/r/sites/UOWNSharePointAPIAccess/_layouts/15/Doc.aspx?sourcedoc=%7B9E58D3BA-6604-48CE-8BF2-F40C018D9C32%7D&file=Merchant-Lease-Details_Report_2025-05-21_test.xlsx&action=default&mobileredirect=true
    ok

Please access the URL above for the Daily Payments report.

latePaymentNoticeEmailSweep
→ Varredura para envio de e-mails de aviso de pagamento em atraso
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/latePaymentNoticeEmailSweep
    

sendFirstPaymentRemindersSweep
→ Varredura para envio de lembretes do primeiro pagamento
https://svc-{{env}}.uownleasing.com/uown/svc/sendFirstPaymentRemindersSweep
    ok

eSignDocumentStatusSweep
→ Varredura do status de documentos assinados eletronicamente
https://svc-{{env}}.uownleasing.com/uown/svc/eSignDocumentStatusSweep
    ok

checkLeadExpirationSweep
→ Varredura para verificar expiração de leads
https://svc-{{env}}.uownleasing.com/uown/svc/checkLeadExpirationSweep

getCompletedESignDocumentStatusSweep
→ Varredura para obter status de documentos eletrônicos concluídos
https://svc-{{env}}.uownleasing.com/uown/svc/getCompletedESignDocumentStatusSweep
    ok

generateExportBlacklistReport
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/generateExportBlacklistReport
    ok

-----

José, achei esses sweeps aqui.
Sendo que o último é um endpoint e não sweep, mas faz uso do método uploadDocument.
 
dailyFundingReportSweep

dailyFundedReportSweep

dailyRefundReportSweep

dailyRefundedReportSweep

saleFileGenerationSweep

getDocumentsForSoldAccountsWithFile
 
Ae pode passar pra elas.
 
Elas dando permissão pra gente pelo menos nas pastas que são jogados os arquivos dos sweeps a gente já consegue validar.
 

Hello Sowjanya Kaligineedi, we need access to the following reports in Sharepoint:

dailyFundingReportSweep

dailyFundedReportSweep

dailyRefundReportSweep

dailyRefundedReportSweep

saleFileGenerationSweep

getDocumentsForSoldAccountsWithFile
 
Mumu sent me these reports, so if there is one missing that generates a report and is not on the list, please let me know so I can check it too.
 
-----

Tests in qa2

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| -- | -- | ACH Sweeps - createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep, rerunACHSweep | ![qa2-355-c1-achSweeps_1_](/uploads/b7708870a9279f058a6fe602ea4a01f1/qa2-355-c1-achSweeps_1_.png){width=1095 height=39}![qa2-355-c1-achSweeps_2_](/uploads/d90024720522eae5a4d68c9c5df99a4f/qa2-355-c1-achSweeps_2_.png){width=1095 height=39}![qa2-355-c1-achSweeps_3_](/uploads/552804709194dc285ac3721007da4124/qa2-355-c1-achSweeps_3_.png){width=1095 height=39}![qa2-355-c1-achSweeps_4_](/uploads/e09db3b9aef5215550692bfb03e2af8a/qa2-355-c1-achSweeps_4_.png){width=1095 height=39}![qa2-355-c1-achSweeps_5_](/uploads/71a3c55352fcd782a504476dbbc0a43d/qa2-355-c1-achSweeps_5_.png){width=1095 height=39} | PASS | -- |
| -- | -- | Sweeps - sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep | ![qa2-355-c2_Sweeps_1__](/uploads/6af9bcb31994d5e5a25a2e3f97c0cbfa/qa2-355-c2_Sweeps_1__.png){width=1095 height=39}![qa2-355-c2_Sweeps_2__](/uploads/eec0bc85131cbdf10e8836f1d9034b61/qa2-355-c2_Sweeps_2__.png){width=1095 height=39}![qa2-355-c2_Sweeps_3__](/uploads/79832ac3113e1668d8c60460f58c2549/qa2-355-c2_Sweeps_3__.png){width=1095 height=39}![qa2-355-c2_Sweeps_4__](/uploads/fc64e41b5e84f3f4ffb90f8e3d079f13/qa2-355-c2_Sweeps_4__.png){width=1095 height=39}![qa2-355-c2_Sweeps_5__](/uploads/1e14a56b844f93276c34c127b267a17e/qa2-355-c2_Sweeps_5__.png){width=1095 height=39}![qa2-355-c2_Sweeps_6__](/uploads/f8519b3447c67219a5d46ba4cbd580ce/qa2-355-c2_Sweeps_6__.png){width=1095 height=39}![qa2-355-c2_Sweeps_7__](/uploads/4a53a7aa0044972cbe92f5c6c15e5881/qa2-355-c2_Sweeps_7__.png){width=1095 height=39}![qa2-355-c2_Sweeps_8__](/uploads/d6e0595f6a3794df0acfa597046c755b/qa2-355-c2_Sweeps_8__.png){width=1095 height=39}![qa2-355-c2_Sweeps_9__](/uploads/0996083d0781c60ebb8c35bebe46fde3/qa2-355-c2_Sweeps_9__.png){width=1167 height=42}![qa2-355-c2_Sweeps_10__](/uploads/94f8701c6fd8fe7720fc468299ab14c8/qa2-355-c2_Sweeps_10__.png){width=1095 height=39}![qa2-355-c2_Sweeps_11__](/uploads/9d3b4832733a92293eab7b2dc75ee487/qa2-355-c2_Sweeps_11__.png){width=1167 height=42}![qa2-355-c2_Sweeps_12__](/uploads/bfea27a83e243c1ec09a0168746ddd59/qa2-355-c2_Sweeps_12__.png){width=1095 height=39}![qa2-355-c2_Sweeps_13__](/uploads/a94a65db351558a5c3e9880310fb1b96/qa2-355-c2_Sweeps_13__.png){width=1167 height=42}![qa2-355-c2_Sweeps_14__](/uploads/764e8fa18dc9670f030747f0e6a5d36e/qa2-355-c2_Sweeps_14__.png){width=1167 height=42}![qa2-355-c2_Sweeps_15__](/uploads/00f8576a3a1ef831216331f77d5ee116/qa2-355-c2_Sweeps_15__.png){width=1095 height=39} | PASS | -- |
| 12608 | Progress Mobility | Verify the creation of a lease through the Intellicheck process | ![qa2-355-c3_Intellicheck_1__](/uploads/33c412f6d057e38c5117f0cf2042912f/qa2-355-c3_Intellicheck_1__.png){width=1440 height=741} | PASS | -- |
| -- | -- | SharePointService - generateMerchantLeaseReport, latePaymentNoticeEmailSweep, sendFirstPaymentRemindersSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep, generateExportBlacklistReport  | ![qa2-355-generateMerchantLeaseReport_1_](/uploads/054318dd562326d772e4f55c5e758230/qa2-355-generateMerchantLeaseReport_1_.png){width=1068 height=61}![qa2-355-generateMerchantLeaseReport_2_](/uploads/f0bc85eb532c8adf7011c1598134886d/qa2-355-generateMerchantLeaseReport_2_.png){width=1438 height=564}![qa2-355-generateMerchantLeaseReport_3_](/uploads/55fec5d451da9bad0c28d16a4d8b7d02/qa2-355-generateMerchantLeaseReport_3_.png){width=955 height=39}![qa2-355-generateMerchantLeaseReport_4_](/uploads/ebd158f6dbbac96613468effb415d7a8/qa2-355-generateMerchantLeaseReport_4_.png){width=1402 height=268}![qa2-355-generateMerchantLeaseReport_5_](/uploads/e2e9bad25bd869f1e2b51383e57eddfd/qa2-355-generateMerchantLeaseReport_5_.png){width=1402 height=268}![qa2-355-latePaymentNoticeEmailSweep_1_](/uploads/9fcf55fd3f99826720fba2c08d48901c/qa2-355-latePaymentNoticeEmailSweep_1_.png){width=1041 height=38}![qa2-355-sendFirstPaymentRemindersSweep_1_](/uploads/d1ae0f5352273aa818ddd57d93e4edc5/qa2-355-sendFirstPaymentRemindersSweep_1_.png){width=1033 height=42}![qa2-355-eSignDocumentStatusSweep_1_](/uploads/1e9294d94bb02425d45444d3011e51d0/qa2-355-eSignDocumentStatusSweep_1_.png){width=1028 height=38}![qa2-355-getCompletedESignDocumentStatusSweep_1_](/uploads/2fa38411eea6155ed6a35081861a9687/qa2-355-getCompletedESignDocumentStatusSweep_1_.png){width=1163 height=38}![qa2-355-generateExportBlacklistReport_1_](/uploads/c54ac7707b40df7faa3db22d638991ca/qa2-355-generateExportBlacklistReport_1_.png){width=1041 height=38}![qa2-355-generateExportBlacklistReport_2_](/uploads/0a41a8e77e9a2afebd559626b0d13ebb/qa2-355-generateExportBlacklistReport_2_.png){width=692 height=505} | WIP | -- |
| 12595 | Progress Mobility | Verify the Underwriting process | ![qa2-355-c5-Underwriting_1__](/uploads/912a940af27232885c7285c37060caf6/qa2-355-c5-Underwriting_1__.png){width=1438 height=745} | PASS | -- |
| 12593 | Progress Mobility | Verify the SubmitApplication process | ![qa2-355-c6-SubmitApplication_1_](/uploads/2053d05accd5c1a24c362ab4b5a92ddb/qa2-355-c6-SubmitApplication_1_.png){width=1438 height=745} | PASS | -- |
| 12609/10564 | Progress Mobility | Verify that executing reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE" | ![qa2-355-c7-SubmitApplication_1_](/uploads/75372f8850351ada64e1f33d2bb7a945/qa2-355-c7-SubmitApplication_1_.png){width=1438 height=745} | PASS | -- |

-----

Tests in qa2

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| -- | -- | ACH Sweeps - createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep, rerunACHSweep | ![qa2-355-c1-achSweeps_1_](/uploads/b7708870a9279f058a6fe602ea4a01f1/qa2-355-c1-achSweeps_1_.png){width=1095 height=39}![qa2-355-c1-achSweeps_2_](/uploads/d90024720522eae5a4d68c9c5df99a4f/qa2-355-c1-achSweeps_2_.png){width=1095 height=39}![qa2-355-c1-achSweeps_3_](/uploads/552804709194dc285ac3721007da4124/qa2-355-c1-achSweeps_3_.png){width=1095 height=39}![qa2-355-c1-achSweeps_4_](/uploads/e09db3b9aef5215550692bfb03e2af8a/qa2-355-c1-achSweeps_4_.png){width=1095 height=39}![qa2-355-c1-achSweeps_5_](/uploads/71a3c55352fcd782a504476dbbc0a43d/qa2-355-c1-achSweeps_5_.png){width=1095 height=39} | PASS | -- |
| -- | -- | Sweeps - sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep | ![qa2-355-c2_Sweeps_1__](/uploads/6af9bcb31994d5e5a25a2e3f97c0cbfa/qa2-355-c2_Sweeps_1__.png){width=1095 height=39}![qa2-355-c2_Sweeps_2__](/uploads/eec0bc85131cbdf10e8836f1d9034b61/qa2-355-c2_Sweeps_2__.png){width=1095 height=39}![qa2-355-c2_Sweeps_3__](/uploads/79832ac3113e1668d8c60460f58c2549/qa2-355-c2_Sweeps_3__.png){width=1095 height=39}![qa2-355-c2_Sweeps_4__](/uploads/fc64e41b5e84f3f4ffb90f8e3d079f13/qa2-355-c2_Sweeps_4__.png){width=1095 height=39}![qa2-355-c2_Sweeps_5__](/uploads/1e14a56b844f93276c34c127b267a17e/qa2-355-c2_Sweeps_5__.png){width=1095 height=39}![qa2-355-c2_Sweeps_6__](/uploads/f8519b3447c67219a5d46ba4cbd580ce/qa2-355-c2_Sweeps_6__.png){width=1095 height=39}![qa2-355-c2_Sweeps_7__](/uploads/4a53a7aa0044972cbe92f5c6c15e5881/qa2-355-c2_Sweeps_7__.png){width=1095 height=39}![qa2-355-c2_Sweeps_8__](/uploads/d6e0595f6a3794df0acfa597046c755b/qa2-355-c2_Sweeps_8__.png){width=1095 height=39}![qa2-355-c2_Sweeps_9__](/uploads/0996083d0781c60ebb8c35bebe46fde3/qa2-355-c2_Sweeps_9__.png){width=1167 height=42}![qa2-355-c2_Sweeps_10__](/uploads/94f8701c6fd8fe7720fc468299ab14c8/qa2-355-c2_Sweeps_10__.png){width=1095 height=39}![qa2-355-c2_Sweeps_11__](/uploads/9d3b4832733a92293eab7b2dc75ee487/qa2-355-c2_Sweeps_11__.png){width=1167 height=42}![qa2-355-c2_Sweeps_12__](/uploads/bfea27a83e243c1ec09a0168746ddd59/qa2-355-c2_Sweeps_12__.png){width=1095 height=39}![qa2-355-c2_Sweeps_13__](/uploads/a94a65db351558a5c3e9880310fb1b96/qa2-355-c2_Sweeps_13__.png){width=1167 height=42}![qa2-355-c2_Sweeps_14__](/uploads/764e8fa18dc9670f030747f0e6a5d36e/qa2-355-c2_Sweeps_14__.png){width=1167 height=42}![qa2-355-c2_Sweeps_15__](/uploads/00f8576a3a1ef831216331f77d5ee116/qa2-355-c2_Sweeps_15__.png){width=1095 height=39} | PASS | -- |
| 12608 | Progress Mobility | Verify the creation of a lease through the Intellicheck process | ![qa2-355-c3_Intellicheck_1__](/uploads/33c412f6d057e38c5117f0cf2042912f/qa2-355-c3_Intellicheck_1__.png){width=1440 height=741} | PASS | -- |
| -- | -- | SharePointService - generateMerchantLeaseReport, latePaymentNoticeEmailSweep, sendFirstPaymentRemindersSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep, generateExportBlacklistReport  | ![qa2-355-generateMerchantLeaseReport_1_](/uploads/054318dd562326d772e4f55c5e758230/qa2-355-generateMerchantLeaseReport_1_.png){width=1068 height=61}![qa2-355-generateMerchantLeaseReport_2_](/uploads/f0bc85eb532c8adf7011c1598134886d/qa2-355-generateMerchantLeaseReport_2_.png){width=1438 height=564}![qa2-355-generateMerchantLeaseReport_3_](/uploads/55fec5d451da9bad0c28d16a4d8b7d02/qa2-355-generateMerchantLeaseReport_3_.png){width=955 height=39}![qa2-355-generateMerchantLeaseReport_4_](/uploads/ebd158f6dbbac96613468effb415d7a8/qa2-355-generateMerchantLeaseReport_4_.png){width=1402 height=268}![qa2-355-generateMerchantLeaseReport_5_](/uploads/e2e9bad25bd869f1e2b51383e57eddfd/qa2-355-generateMerchantLeaseReport_5_.png){width=1402 height=268}![qa2-355-latePaymentNoticeEmailSweep_1_](/uploads/9fcf55fd3f99826720fba2c08d48901c/qa2-355-latePaymentNoticeEmailSweep_1_.png){width=1041 height=38}![qa2-355-sendFirstPaymentRemindersSweep_1_](/uploads/d1ae0f5352273aa818ddd57d93e4edc5/qa2-355-sendFirstPaymentRemindersSweep_1_.png){width=1033 height=42}![qa2-355-eSignDocumentStatusSweep_1_](/uploads/1e9294d94bb02425d45444d3011e51d0/qa2-355-eSignDocumentStatusSweep_1_.png){width=1028 height=38}![qa2-355-getCompletedESignDocumentStatusSweep_1_](/uploads/2fa38411eea6155ed6a35081861a9687/qa2-355-getCompletedESignDocumentStatusSweep_1_.png){width=1163 height=38}![qa2-355-generateExportBlacklistReport_1_](/uploads/c54ac7707b40df7faa3db22d638991ca/qa2-355-generateExportBlacklistReport_1_.png){width=1041 height=38}![qa2-355-generateExportBlacklistReport_2_](/uploads/0a41a8e77e9a2afebd559626b0d13ebb/qa2-355-generateExportBlacklistReport_2_.png){width=692 height=505} | PASS |  |
| 12595 | Progress Mobility | Verify the Underwriting process | ![qa2-355-c5-Underwriting_1__](/uploads/912a940af27232885c7285c37060caf6/qa2-355-c5-Underwriting_1__.png){width=1438 height=745} | PASS | -- |
| 12593 | Progress Mobility | Verify the SubmitApplication process | ![qa2-355-c6-SubmitApplication_1_](/uploads/2053d05accd5c1a24c362ab4b5a92ddb/qa2-355-c6-SubmitApplication_1_.png){width=1438 height=745} | PASS | -- |
| 12609/10564 | Progress Mobility | Verify that executing reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE" | ![qa2-355-c7-SubmitApplication_1_](/uploads/75372f8850351ada64e1f33d2bb7a945/qa2-355-c7-SubmitApplication_1_.png){width=1438 height=745} | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Foram executadas diversas varreduras:

ACH Sweeps:
CreateScheduledACHPaymentsSweep
SendACHPaymentsSweep  
getSendACHPaymentsStatusSweep  
getStatusDatePaymentsListSweep  
rerunACHPaymentsSweep 

Sweeps Gerais:
sendDailyBorrowingBaseReport  
saleFileGenerationSweep  
UnutilizedApprovalSweep  
generateMerchantLeaseReport  
rerunCCPaymentsSweep  
latePaymentNoticeEmailSweep  
delinquencyRerunCCPaymentsSweep  
FirstPaymentReminderSweep  
RecurringPaymentReminderSweep  
CreateScheduledCreditCardPaymentsSweep  
SendCreditCardPaymentsSweep  
storedDocServiceSweep  
eSignDocumentStatusSweep  
checkLeadExpirationSweep  
getCompletedESignDocumentStatusSweep  

SharePointService:
generateMerchantLeaseReport  
latePaymentNoticeEmailSweep  
sendFirstPaymentRemindersSweep  
eSignDocumentStatusSweep  
checkLeadExpirationSweep  
getCompletedESignDocumentStatusSweep  
generateExportBlacklistReport  

Foi submetido o Intellicheck e ao Seon.  
Realizou-se o underwriting e o SubmitApplication.  
Executou-se o reverseAchPaymentsSweep, que reverteu o pagamento ACH e reabriu a conta, alterando seu status para ATIVO.  
Todas as tarefas desta versão e da versão anterior foram testadas no Java 17.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ ACH Sweeps
    https://svc-{{env}}.uownleasing.com/uown/svc/createScheduledACHPaymentsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/sendACHPaymentsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/getSendACHPaymentsStatusSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/getStatusDatePaymentsListSweep - ok

✅ Sweeps
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/sendDailyBorrowingBaseReport - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/saleFileGenerationSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/sendUnutilizedApprovalsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/latePaymentNoticeEmailSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/sendRecurringPaymentRemindersSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/createScheduledCreditCardPaymentsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/sendCreditCardPaymentsSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/storedDocServiceSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/eSignDocumentStatusSweep - ok
    https://svc-{{env}}.uownleasing.com/uown/svc/checkLeadExpirationSweep - ok


✅ Verifique o processo de Underwriting
    23615
✅ Verifique o processo de SubmitApplication
    23617
✅ Verifique se a execução do reverseAchPaymentsSweep reverte corretamente o pagamento ACH e reabre a conta, alterando seu status para "ATIVA."
    ERRO - executar novamente

-----

Tests in stg

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| -- | -- | ACH Sweeps - createScheduledACHPaymentsSweep,sendACHPaymentsSweep, getSendACHPaymentsStatusSweep, getStatusDatePaymentsListSweep |  | PASS | -- |
| -- | -- | Sweeps - sendDailyBorrowingBaseReport, saleFileGenerationSweep, sendUnutilizedApprovalsSweep, generateMerchantLeaseReport, rerunCCPaymentsSweep, latePaymentNoticeEmailSweep, delinquencyRerunCCPaymentsSweep, sendFirstPaymentRemindersSweep, sendRecurringPaymentRemindersSweep, createScheduledCreditCardPaymentsSweep, sendCreditCardPaymentsSweep, storedDocServiceSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep |  | PASS | -- |
| 23635 | Progress Mobility | Verify the creation of a lease through the Intellicheck process |  | PASS | -- |
| -- | -- | SharePointService - generateMerchantLeaseReport, latePaymentNoticeEmailSweep, sendFirstPaymentRemindersSweep, eSignDocumentStatusSweep, checkLeadExpirationSweep, getCompletedESignDocumentStatusSweep, generateExportBlacklistReport  |  | WIP | -- |
| 23615 | Progress Mobility | Verify the Underwriting process | -- | PASS | -- |
| 23617 | Progress Mobility | Verify the SubmitApplication process | -- | PASS | -- |
| 206330 | Progress Mobility | Verify that executing reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE" |  | PASS | -- |    

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
