------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1032

UOWN | Origination | Investigate and Fix Missing Lead Recording in Database

A lead recording was not saved in the uown_lead_recording database table. No related logs were found in uown_los_activity_log. However, the recording exists in Sentry.

Business Objective
Ensure that all lead recordings are correctly saved in the database and properly logged, avoiding data loss and improving reliability.

Feature Request | Business Requirements
Investigate and resolve inconsistencies between Sentry and the database. Implement additional error handling and logging to detect and alert on failed save operations for lead recordings.

test instructions
Scenarios aren't reproducible outside production

Remaining assertions
Checkout if the lowers are uploading recording to sentry.io; if where they are being upload to where and ensure it's not production.

-----

https://gitlab.com/uown/frontend/origination/-/issues/1032

UOWN | Originação | Investigar e Corrigir Falha no Registro de Lead no Banco de Dados
Um registro de lead não foi salvo na tabela uown_lead_recording do banco de dados. Nenhum log relacionado foi encontrado em uown_los_activity_log. No entanto, o registro existe no Sentry.

Objetivo de Negócio
Garantir que todos os registros de leads sejam corretamente salvos no banco de dados e devidamente registrados em log, evitando perda de dados e melhorando a confiabilidade.

Requisito de Funcionalidade | Requisitos de Negócio
Investigar e resolver inconsistências entre o Sentry e o banco de dados. Implementar tratamento de erros adicional e logging para detectar e alertar sobre falhas nas operações de salvamento de registros de leads.

instruções de teste
Cenários não são reproduzíveis fora do ambiente de produção

Verificações restantes
Verifique se os ambientes inferiores (lowers) estão enviando gravações para o sentry.io; caso estejam, verifique para onde estão sendo enviadas e garanta que não seja para o ambiente de produção.

------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in qa2

Scenario Outline: Verificar o armazenamento da gravação do Sentry em diferentes etapas do contrato no banco de dados
  Given o processo de assinatura do contrato foi iniciado para o LeadPk <LeadPk> do Merchant <Merchant>
    And o cliente está na etapa de <etapa>
  When o cliente <acao>
  Then um registro deve ser salvo na tabela `uown_lead_recording` com a data de criação, `LeadPk` e `UUID`
    And um request do tipo `replay_event` deve ser enviado ao Sentry
    And o request deve conter o campo `request.url` com o endereço da etapa acessada

  | LeadPk | Merchant          | etapa                         | acao                                | Status |
  |--------|-------------------|-------------------------------|--------------------------------------|--------|
  | 12591  | Progress Mobility | inserção de dados financeiros | insere nome e dados financeiros     | PASS   |
  | 12591  | Progress Mobility | aceitação dos termos          | aceita os termos do contrato        | PASS   |
  | 12591  | Progress Mobility | assinatura do contrato        | assina o contrato com sessão ativa  | PASS   |


Scenario: Verificar o armazenamento da gravação do Sentry em diferentes etapas do contrato no banco de dados para um cliente que já tem contrato assinado
  Given o cliente já possui um contrato anterior finalizado
  When um novo contrato é iniciado para esse mesmo cliente
    And o cliente preenche os dados iniciais e avança para a etapa de inserção de dados financeiros
  Then um novo registro deve ser criado na tabela `uown_lead_recording` com novo UUID e LeadPk
    And um novo request deve ser enviado ao Sentry contendo o novo `replay_id`
    And o request deve conter o campo `request.url` referente à nova jornada

  | LeadPk | Merchant          | Status |
  |--------|-------------------|--------|
  | 12593  | Progress Mobility |  PASS  |

Scenario: Verificar o armazenamento da gravação do Sentry em diferentes etapas do contrato no banco de dados ao cancelar fatura, criar nova fatura e assinar contrato
  Given existe uma fatura ativa vinculada ao contrato
  When a fatura é cancelada
    And uma nova fatura é gerada e vinculada ao mesmo contrato
    And o cliente acessa a etapa de assinatura e assina o contrato
  Then um novo registro com UUID distinto deve ser armazenado na tabela `uown_lead_recording` para o mesmo LeadPk
    And requests consecutivos devem ser enviados ao Sentry para o mesmo registro

  | LeadPk | Merchant          | Status |
  |--------|-------------------|--------|
  | 12594  | Progress Mobility |  PASS  |


------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a gravação é armazenada corretamente na tabela uown_lead_recording ao preencher os dados financeiros, aceitar os termos e concluir a assinatura do contrato
Verify that the recording is properly stored in the uown_lead_recording table when entering financial information, accepting the terms, and completing the contract signing process


Verifique se a gravação é corretamente armazenada na tabela uown_lead_recording para o LeadPk correspondente, em diferentes etapas do contrato, no caso de um cliente que já possui um contrato assinado
Verify that the recording is correctly stored in the uown_lead_recording table for the corresponding LeadPk at different contract stages, for a client who already has a signed contract


Verifique se a gravação é corretamente armazenada na tabela uown_lead_recording, em diferentes etapas do contrato, no cenário de cancelamento de uma fatura, criação de uma nova e posterior assinatura do contrato
Verify that the recording is correctly stored in the uown_lead_recording table at different contract stages when an invoice is canceled, a new one is created, and the contract is signed

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12591 | Progress Mobility | Verify that the recording is properly stored in the uown_lead_recording table when entering financial information, accepting the terms, and completing the contract signing process |  | PASS |
| 12593 and 12594 | Progress Mobility | Verify that the recording is correctly stored in the uown_lead_recording table for the corresponding LeadPk at different contract stages, for a client who already has a signed contract |  | PASS |
| 12594 | Progress Mobility | Verify that the recording is correctly stored in the uown_lead_recording table at different contract stages when an invoice is canceled, a new one is created, and the contract is signed |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a gravação é armazenada corretamente na tabela uown_lead_recording ao preencher os dados financeiros, aceitar os termos e concluir a assinatura do contrato
Verify that the recording is properly stored in the uown_lead_recording table when entering financial information, accepting the terms, and completing the contract signing process


Verifique se a gravação é corretamente armazenada na tabela uown_lead_recording para o LeadPk correspondente, em diferentes etapas do contrato, no caso de um cliente que já possui um contrato assinado
Verify that the recording is correctly stored in the uown_lead_recording table for the corresponding LeadPk at different contract stages, for a client who already has a signed contract

-----

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23611 | Progress Mobility | Verify that the recording is properly stored in the uown_lead_recording table when entering financial information, accepting the terms, and completing the contract signing process |  | PASS |
| 23612 and 23612 | Progress Mobility | Verify that the recording is correctly stored in the uown_lead_recording table for the corresponding LeadPk at different contract stages, for a client who already has a signed contract |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------