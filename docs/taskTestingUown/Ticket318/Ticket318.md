------------------------------------------------------------------------------------------------------------------------------------------------------------------
<!-- https://gitlab.com/uown/backend/svc/-/issues/318 -->

Uown | SVC | Adicionar Novo Estado de Pagamento de 90 Dias (PAID_OUT_EARLY_EPO)

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Sinopse
Introduza um novo status chamado PAGO_OUT_EARLY_EPO diferenciar arrendamentos finalizados dentro do período de elegibilidade de Early Pay Off (EPO) (por exemplo, 90 ou 120 dias, dependendo dos regulamentos estaduais) de outros cenários de pagamento.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Objetivo Empresarial
Melhore a visibilidade e os relatórios para pagamentos feitos nos primeiros 90 dias

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Pedido de Funcionalidade | Requisitos de Negócio

Processo API:
Na consulta que executa o processo de pagamento, altere a verificação de pagamento antecipado para verificar se o contrato de locação se enquadra no período elegível do EPO (por exemplo, 90 dias, 120 dias, etc., com base no estado). Se for esse o caso, ele usará o novo status, se não for, usará paid_out_early.

Processo manual:
Adicionar um novo status PAGO_OUT_EARLY_EPO para o menu suspenso de status existente.
Permitir que os agentes selecionem manualmente o PAGO_OUT_EARLY_EPO.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Anexos(s)
https://777digitalsolutions.zendesk.com/agent/tickets/5379

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Etapas de Teste

Fernando Martins
@fernandogmartins

Acesse o portal de serviços e verifique se o novo status é uma opção na lista

(ViewImage 1)

Teste se é possível ser configurado manualmente.

Para testar a alteração de status, vá para uma conta ativa que é elegível para pagamento antecipado

(ViewImage 2)

E faça um pagamento proporcional ao valor devido. Depois de pago, o novo status deve ser PAID_OUT_EARLY_EPO. 
Verifique os logs também.

(ViewImage 3)


------------------------------------------------------------------------------------------------------------------------------------------------------------------


Quando eu faço o pagamento de todas as parcelas e tenho direito ao pagamento em 90 dias, então o status é PAID_OUT_EARLY_EPO e o pagador provavelmente pagará sem taxas.

Quando eu faço o pagamento de todas as parcelas e NÃO tenho direito ao pagamento em 90 dias, então o status é PAID_OUT_EARLY, indicando que foi pago antecipadamente, mas com taxas.

Quando eu faço o pagamento de todas as parcelas após o prazo estabelecido na Data de Vencimento de 90 dias, e tenho direito ao pagamento em 90 dias, o status é PAID_OUT_EARLY, indicando que foi pago antecipadamente, mas com taxas.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Validação do Status de Pagamento com PAID_OUT_EARLY_EPO

  Background:
    Given que estou logado no portal de serviços
    And acesso a conta do cliente no sistema de gerenciamento

  Scenario Outline: Alteração manual do status pelo agente
    Given que estou na página de gerenciamento de contas
    When seleciono manualmente o status "<status_selecionado>"
    Then o status deve ser atualizado para "<status_esperado>"
    And o log de alterações deve registrar a mudança para "<status_esperado>"

    Examples:
      | status_selecionado        | status_esperado        |
      | PAID_OUT                  | PAID_OUT               |
      | PAID_OUT_EARLY            | PAID_OUT_EARLY         |
      | PAID_OUT_EARLY_EPO        | PAID_OUT_EARLY_EPO     |
      | CHARGED_OFF               | CHARGED_OFF            |
      | CLOSED                    | CLOSED                 |
      | CANCELLED                 | CANCELLED              |
      | SOLD                      | SOLD                   |
      | SETTLED_IN_FULL           | SETTLED_IN_FULL        |

"Verificar a atualização manual do status pelo agente e o registro no log de alterações."
"Verify the manual status update by the agent and the record in the change log."      


  Scenario Outline: Pagamento dentro do período elegível para EPO
    Given a conta do cliente está com "Eligible for 90-day Pay Off" definido como "<eligibilidade>"
    And a "90-day Expiration Date" é uma data futura "<data_expiracao>"
    When realizo um pagamento no valor de "<valor_pagamento>"
    Then o status da conta deve ser atualizado para "PAID_OUT_EARLY_EPO"
    And o log deve registrar que o pagamento "<valor_pagamento>" satisfaz o EPO de "<valor_necessario>"

    Examples:
      | eligibilidade | data_expiracao | valor_pagamento | valor_necessario |
      | Yes          | 03/15/2025      | 3500.00         | 3285.00          |

"Verificar que um pagamento dentro do período elegível para EPO atualiza corretamente o status da conta e registra a transação no log."
"Verify that a payment within the eligible EPO period correctly updates the account status and logs the transaction."


  Scenario Outline: Pagamento não elegível para EPO
    Given a conta do cliente está com "Eligible for 90-day Pay Off" definido como "<eligibilidade>"
    And a "90-day Expiration Date" está definida para uma data passada "<data_expiracao>"
    When realizo um pagamento no valor de "<valor_pagamento>"
    Then o status da conta deve ser atualizado para "PAID_OUT_EARLY"
    And o log deve registrar que o pagamento "<valor_pagamento>" foi realizado, mas não satisfaz EPO
    And o status na Origination deve refletir "PAID_OUT_EARLY"
    And o status no registro de pagamento deve ser atualizado corretamente

    Examples:
      | eligibilidade | data_expiracao | valor_pagamento |
      | No           | 12/31/2024      | 3500.00         |

Verificar se, ao realizar o pagamento de todas as parcelas sem o direito ao pagamento em 90 dias, o status é PAID_OUT_EARLY e registra a transação no log
Verify that when paying all installments without the right to payment in 90 days, the status is PAID_OUT_EARLY and logs the transaction


    Scenario Outline: Pagamento fora do período elegível para EPO
    Given a conta do cliente está com "Eligible for 90-day Pay Off" definido como "<eligibilidade>"
    And a "90-day Expiration Date" é uma data futura "<data_expiracao>"
    When realizo um pagamento no valor de "<valor_pagamento>"
    And a data do pagamento deve ser 121 dias ou mais a frente da data atual
    Then o status da conta deve ser atualizado para "PAID_OUT_EARLY"
    And o log deve registrar que o pagamento "<valor_pagamento>" não satisfaz o EPO

    Examples:
      | eligibilidade | data_expiracao | valor_pagamento | valor_necessario |
      | Yes          | 03/15/2025      | 3500.00         | 3285.00          |

Verificar se, ao realizar o pagamento de todas as parcelas após o prazo estabelecido na Data de Vencimento de 90 dias, tendo direito ao pagamento em 90 dias, o status é PAID_OUT_EARLY e registra a transação no log
Verify that when paying all installments after the deadline set in the 90-day Due Date, having the right to payment in 90 days, the status is PAID_OUT_EARLY and logs the transaction





mudar status para cancelado selecionando refund payments


------------------------------------------------------------------------------------------------------------------------------------------------------------------

Explicação dos cenários:


Pagamento dentro do período elegível para EPO → Simula uma conta que ainda está no prazo para Early Pay Off, garantindo que o status atualizado seja PAID_OUT_EARLY_EPO.

Pagamento fora do período elegível para EPO → Simula uma conta cujo período EPO já expirou, verificando se o status correto é aplicado (PAID_OUT_EARLY e não PAID_OUT_EARLY_EPO).

Alteração manual do status pelo agente → Testa se os agentes podem alterar manualmente o status para qualquer valor disponível no menu suspenso.


------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1 

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3580 | Tire Agent | Verify the manual status update by the agent and the record in the change log | ![c1-1_1_Screenshot_From_2025-01-31_04-27-46](/uploads/87031cc309182f2c4bac28aa7b8830c6/c1-1_1_Screenshot_From_2025-01-31_04-27-46.png)![c1-1_1_Screenshot_From_2025-01-31_04-28-57](/uploads/04943d143b8e29835f734178954e10cf/c1-1_1_Screenshot_From_2025-01-31_04-28-57.png)![c1-1_1_Screenshot_From_2025-01-31_04-29-12](/uploads/84d992b812be8b5ccb3c9a9aab474a2f/c1-1_1_Screenshot_From_2025-01-31_04-29-12.png)![c1-1_1_Screenshot_From_2025-01-31_04-31-52](/uploads/0381c49e9c8e5ccfac1cb9193c7716bd/c1-1_1_Screenshot_From_2025-01-31_04-31-52.png)![c1-2_1_Screenshot_From_2025-01-31_04-30-20](/uploads/c6820abe95641adf4aab0eb510ee877b/c1-2_1_Screenshot_From_2025-01-31_04-30-20.png)![c1-2_1_Screenshot_From_2025-01-31_04-31-09](/uploads/6a49e43b0228c6a17c96066d51916e07/c1-2_1_Screenshot_From_2025-01-31_04-31-09.png)![c1-2_1_Screenshot_From_2025-01-31_04-31-27](/uploads/d0f93af2c5ffb3c25be62513e5693aba/c1-2_1_Screenshot_From_2025-01-31_04-31-27.png)![c1-2_1_Screenshot_From_2025-01-31_04-31-39](/uploads/037c844a3600ade453e28188d07ecc76/c1-2_1_Screenshot_From_2025-01-31_04-31-39.png)![c1-3_1_Screenshot_From_2025-01-31_04-33-05](/uploads/ba12ada627e9a463138d2b59e01f1ca3/c1-3_1_Screenshot_From_2025-01-31_04-33-05.png)![c1-3_1_Screenshot_From_2025-01-31_04-33-24](/uploads/52231a21cfb98ec8ed1a551a923bd769/c1-3_1_Screenshot_From_2025-01-31_04-33-24.png)![c1-3_1_Screenshot_From_2025-01-31_04-33-35](/uploads/990d073fc822ad8686566183da7a2491/c1-3_1_Screenshot_From_2025-01-31_04-33-35.png)![c1-3_1_Screenshot_From_2025-01-31_04-33-44](/uploads/a6eef39d47c576ca9e82119e76da8217/c1-3_1_Screenshot_From_2025-01-31_04-33-44.png)![c1-4_1_Screenshot_From_2025-01-31_04-34-22](/uploads/e0e5b1f576fe7046a900f0e7fd3da8a2/c1-4_1_Screenshot_From_2025-01-31_04-34-22.png)![c1-4_1_Screenshot_From_2025-01-31_04-34-34](/uploads/165b4515fbc946b3802772c30a55ebb1/c1-4_1_Screenshot_From_2025-01-31_04-34-34.png)![c1-4_1_Screenshot_From_2025-01-31_04-34-43](/uploads/475feced2980439c6c82250125fb0b8e/c1-4_1_Screenshot_From_2025-01-31_04-34-43.png)![c1-4_1_Screenshot_From_2025-01-31_04-35-01](/uploads/86f4e24c4c48060e69d8471bbacac81f/c1-4_1_Screenshot_From_2025-01-31_04-35-01.png)![c1-5_1_Screenshot_From_2025-01-31_04-35-35](/uploads/4ec2f218ac061db525cfa22f342797cc/c1-5_1_Screenshot_From_2025-01-31_04-35-35.png)![c1-5_1_Screenshot_From_2025-01-31_04-35-48](/uploads/514a6904fe81c5ee868a7cbb850b4230/c1-5_1_Screenshot_From_2025-01-31_04-35-48.png)![c1-5_1_Screenshot_From_2025-01-31_04-36-03](/uploads/a59c2bd7dc1422980ccecaaf76d9cecc/c1-5_1_Screenshot_From_2025-01-31_04-36-03.png)![c1-5_1_Screenshot_From_2025-01-31_04-36-33](/uploads/a4101ec8e94aa9b19684725ae11a1684/c1-5_1_Screenshot_From_2025-01-31_04-36-33.png)![c1-6_1_Screenshot_From_2025-01-31_04-37-08](/uploads/563930765759735f797ad0e4ff7f2660/c1-6_1_Screenshot_From_2025-01-31_04-37-08.png)![c1-6_1_Screenshot_From_2025-01-31_04-37-58](/uploads/6f2ea5ac45004fc8d24c5fbbb368dba6/c1-6_1_Screenshot_From_2025-01-31_04-37-58.png)![c1-6_1_Screenshot_From_2025-01-31_04-38-18](/uploads/6702b2cf2dfd6d83093db74b957e7a33/c1-6_1_Screenshot_From_2025-01-31_04-38-18.png)![c1-6_1_Screenshot_From_2025-01-31_04-38-30](/uploads/fd8b5cc37a68c17cc8e11a870661b704/c1-6_1_Screenshot_From_2025-01-31_04-38-30.png)![c1-7_1_Screenshot_From_2025-01-31_04-38-54](/uploads/1f1a90176b394ba727c3736491815f27/c1-7_1_Screenshot_From_2025-01-31_04-38-54.png)![c1-7_1_Screenshot_From_2025-01-31_04-39-07](/uploads/e9dc951b0ce26b2925718881aec0c9ce/c1-7_1_Screenshot_From_2025-01-31_04-39-07.png)![c1-7_1_Screenshot_From_2025-01-31_04-39-39](/uploads/4335a84918e6c327d631c86786dd8688/c1-7_1_Screenshot_From_2025-01-31_04-39-39.png)![c1-7_1_Screenshot_From_2025-01-31_04-39-46](/uploads/44602cb37819fe0dab99df6f86f9fe9c/c1-7_1_Screenshot_From_2025-01-31_04-39-46.png)![c1-8_1_Screenshot_From_2025-01-31_04-40-03](/uploads/fdbb344fce38e69f007a79ecabafbfa9/c1-8_1_Screenshot_From_2025-01-31_04-40-03.png)![c1-8_1_Screenshot_From_2025-01-31_04-40-14](/uploads/adaa549d90bc712e1f02c1f75b37be4f/c1-8_1_Screenshot_From_2025-01-31_04-40-14.png)![c1-8_1_Screenshot_From_2025-01-31_04-40-33](/uploads/fc911cff748068c15b1cc59c9d1c929c/c1-8_1_Screenshot_From_2025-01-31_04-40-33.png)![c1-8_1_Screenshot_From_2025-01-31_04-40-45](/uploads/3e8263aca100fe2a2d8f024d209c7495/c1-8_1_Screenshot_From_2025-01-31_04-40-45.png) | PASS |
| 3583 and 7953 | Tire Agent | Verify that a payment within the eligible EPO period correctly updates the account status and logs the transaction | ![c2-1_1_Screenshot_From_2025-01-31_05-49-41](/uploads/26839ffb6bdc3fc3fdd7e1ccbb71d8fb/c2-1_1_Screenshot_From_2025-01-31_05-49-41.png)![c2-1_1_Screenshot_From_2025-01-31_05-50-00](/uploads/640d3f595f84381edfaeb0ffcb5cad1c/c2-1_1_Screenshot_From_2025-01-31_05-50-00.png)![c2-1_1_Screenshot_From_2025-01-31_05-50-14](/uploads/340f838bcbed5c2040bd6c68972f7811/c2-1_1_Screenshot_From_2025-01-31_05-50-14.png)![c2-1_1_Screenshot_From_2025-01-31_05-50-41](/uploads/0686b6fb89f2d4b7c6ac55810aea9920/c2-1_1_Screenshot_From_2025-01-31_05-50-41.png)![c2-1_1_Screenshot_From_2025-01-31_05-51-05](/uploads/d71ebce173e3598791bb8a1b9068db22/c2-1_1_Screenshot_From_2025-01-31_05-51-05.png)![c2-1_1_Screenshot_From_2025-01-31_05-52-01](/uploads/7bde5148781587e63cc26257b41932c3/c2-1_1_Screenshot_From_2025-01-31_05-52-01.png)![c2-1_2_Screenshot_From_2025-01-31_06-15-23](/uploads/9ad8f6c303f90b0a48f80973197f11dc/c2-1_2_Screenshot_From_2025-01-31_06-15-23.png)![c2-1_2_Screenshot_From_2025-01-31_06-15-32](/uploads/dd1c55c9b23994f06b90ad59aebaeabe/c2-1_2_Screenshot_From_2025-01-31_06-15-32.png)![c2-1_2_Screenshot_From_2025-01-31_06-16-42](/uploads/93414d84a7a92f7da04ec33e6d1114b2/c2-1_2_Screenshot_From_2025-01-31_06-16-42.png)![c2-1_2_Screenshot_From_2025-01-31_06-17-10](/uploads/6b581ba899d42894773c0ba45dbf84f0/c2-1_2_Screenshot_From_2025-01-31_06-17-10.png)![c2-1_2_Screenshot_From_2025-01-31_06-17-28](/uploads/036e4bca6da532d6f6a1f029029d794d/c2-1_2_Screenshot_From_2025-01-31_06-17-28.png)![c2-1_2_Screenshot_From_2025-01-31_06-17-40](/uploads/f9da7e8f3470165b13d8b5302ede7b93/c2-1_2_Screenshot_From_2025-01-31_06-17-40.png)![c2-1_2_Screenshot_From_2025-01-31_06-17-56](/uploads/24e877b9312150074f5dea7abc0f83bc/c2-1_2_Screenshot_From_2025-01-31_06-17-56.png)![c2-1_2_Screenshot_From_2025-01-31_06-19-08](/uploads/8c3fbf9182f417e0f645d2abe2ff6bff/c2-1_2_Screenshot_From_2025-01-31_06-19-08.png) | PASS |
| 3587 | Tire Agent | Verify that when paying all installments without the right to payment in 90 days, the status is PAID_OUT_EARLY and logs the transaction | ![2-Screenshot_From_2025-01-31_06-59-17](/uploads/79cde0b37c27405ffc54ef039b8b38e5/2-Screenshot_From_2025-01-31_06-59-17.png)![2-Screenshot_From_2025-01-31_06-59-33](/uploads/7639663df55740b30da7283a1c591c91/2-Screenshot_From_2025-01-31_06-59-33.png)![2-Screenshot_From_2025-01-31_07-00-10](/uploads/13da945e7704ded0709b57f0848ec9fb/2-Screenshot_From_2025-01-31_07-00-10.png)![2-Screenshot_From_2025-01-31_07-01-02](/uploads/cdd4d54dbca53eaa45ea61e0276e62d6/2-Screenshot_From_2025-01-31_07-01-02.png)![2-Screenshot_From_2025-01-31_07-01-54](/uploads/25bf7a6e9befc5befb298fa00213468e/2-Screenshot_From_2025-01-31_07-01-54.png)![2-Screenshot_From_2025-01-31_07-03-07](/uploads/ab7bb35f1de5ed6943d33a0857f6b677/2-Screenshot_From_2025-01-31_07-03-07.png)![2-Screenshot_From_2025-01-31_07-03-26](/uploads/55a67771442fa5cd26f7a06e0a6410bb/2-Screenshot_From_2025-01-31_07-03-26.png)![2-Screenshot_From_2025-01-31_09-07-09](/uploads/8514419377dd0f1b759c48dd79973235/2-Screenshot_From_2025-01-31_09-07-09.png)![2-Screenshot_From_2025-01-31_09-07-23](/uploads/d82883d1df41da84098ed2d2cc000150/2-Screenshot_From_2025-01-31_09-07-23.png)![2-Screenshot_From_2025-01-31_11-44-17](/uploads/3b5872d1ad3ed08eb8c481015167b96a/2-Screenshot_From_2025-01-31_11-44-17.png)![2-Screenshot_From_2025-01-31_11-44-33](/uploads/ec49a8111428de7419f283436e552349/2-Screenshot_From_2025-01-31_11-44-33.png)![2-Screenshot_From_2025-01-31_11-45-05](/uploads/fe2d28bda4c06fd8b27db24c34d14a0b/2-Screenshot_From_2025-01-31_11-45-05.png)![2-Screenshot_From_2025-01-31_11-45-29](/uploads/a993b838de49fbac845b0624c995252a/2-Screenshot_From_2025-01-31_11-45-29.png)![2-Screenshot_From_2025-01-31_11-45-39](/uploads/5fd3963cd2bc6af6da4ea7fd6bb05e4c/2-Screenshot_From_2025-01-31_11-45-39.png)![2-Screenshot_From_2025-01-31_11-46-18](/uploads/f0b1c9310de16c7b6b4a48e40c0bd1e2/2-Screenshot_From_2025-01-31_11-46-18.png)![2-Screenshot_From_2025-01-31_11-46-37](/uploads/d03c6cac872c60b8261984d8b60d448d/2-Screenshot_From_2025-01-31_11-46-37.png)![2-Screenshot_From_2025-01-31_11-47-11](/uploads/8aabb77eed301450c781e693c6d491e9/2-Screenshot_From_2025-01-31_11-47-11.png)![2-Screenshot_From_2025-01-31_11-47-36](/uploads/fd2b12fb8fce90eb557d7273548a6a7f/2-Screenshot_From_2025-01-31_11-47-36.png)![2-Screenshot_From_2025-01-31_11-48-33](/uploads/121a71081d7325ad2e3570939d926b1d/2-Screenshot_From_2025-01-31_11-48-33.png) | PASS |
| qa1 3597 and stg 205888 | Daniel's Jewelers | Verify that when paying all installments after the deadline set in the 90-day Due Date, having the right to payment in 90 days, the status is PAID_OUT_EARLY and logs the transaction | ![318-Screenshot_From_2025-02-06_08-58-26](/uploads/fbade9f8911a159111354b9d9d4a30d1/318-Screenshot_From_2025-02-06_08-58-26.png)![318-Screenshot_From_2025-02-06_08-59-48](/uploads/ae9ae1237f133e44e8d2cf0c2dadfa08/318-Screenshot_From_2025-02-06_08-59-48.png)![318-Screenshot_From_2025-02-06_09-00-18](/uploads/b3226828b2f5408bf6ce6e8aab8f8be6/318-Screenshot_From_2025-02-06_09-00-18.png)![318-Screenshot_From_2025-02-06_09-00-40](/uploads/43b380ccbc13d5145a595426033058c6/318-Screenshot_From_2025-02-06_09-00-40.png)![318-Screenshot_From_2025-02-06_09-00-55](/uploads/cb0a04602d2fc8d7beadb2920d746c4d/318-Screenshot_From_2025-02-06_09-00-55.png)![318-Screenshot_From_2025-02-06_09-01-07](/uploads/7bff40611e52a38954f13d60080fb808/318-Screenshot_From_2025-02-06_09-01-07.png) | PASS |
| 3471 | Tire Agent | Verify that a payment made through the customer portal, within the eligible EPO period, correctly updates the account status and records the transaction. |  | PASS |
| 3469 | Tire Agent | Verify that when you make a payment in the customer portal for all installments not due for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is recorded correctly. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique a atualização manual do status pelo agente e o registro no log de alterações
Verify the manual status update by the agent and the record in the change log

Verifique se um pagamento realizado através do portal de manutenção, dentro do período EPO elegível, atualiza corretamente o status da conta e registra a transação.
Verify that a payment made through the maintenance portal, within the eligible EPO period, correctly updates the account status and records the transaction.

Verifique se, ao efetuar um pagamento no portal de manutenção para todas as parcelas sem direito ao pagamento em 90 dias, o status da conta é atualizado para PAID_OUT_EARLY e a transação é registrada corretamente.
Verify that when making a payment through the maintenance portal for all installments not eligible for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is properly recorded.

Verifique se um pagamento realizado através do portal do cliente, dentro do período EPO elegível, atualiza corretamente o status da conta e registra a transação.
Verify that a payment made through the customer portal, within the eligible EPO period, correctly updates the account status and records the transaction.

Verifique se, ao efetuar um pagamento no portal do cliente para todas as parcelas sem direito ao pagamento em 90 dias, o status da conta é atualizado para PAID_OUT_EARLY e a transação é registrada corretamente.  
Verify that when you make a payment in the customer portal for all installments not due for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is recorded correctly.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 205920 | MyEyeMed | Verify the manual status update by the agent and the record in the change log |  | PASS |
| 205919 | WeGetFinancing | Verify that a payment made through the maintenance portal, within the eligible EPO period, correctly updates the account status to PAID_OUT_EARLY_EPO and records the transaction |  | PASS |
| 205914 | Msa PoweSports | Verify that when making a payment through the maintenance portal for all installments not eligible for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is properly recorded |  | PASS |
| 205918 | Tire Agent | Verify that a payment made through the customer portal, within the eligible EPO period, correctly updates the account status to PAID_OUT_EARLY_EPO and records the transaction |  | PASS |
| 205917 | Tire Agent | Verify that when you make a payment in the customer portal for all installments not due for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is recorded correctly. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique a atualização manual do status pelo agente e o registro no log de alterações
Verify the manual status update by the agent and the record in the change log

Verifique se um pagamento realizado através do portal de manutenção, dentro do período EPO elegível, atualiza corretamente o status da conta para PAID_OUT_EARLY_EPO e registra a transação.
Verify that a payment made through the maintenance portal, within the eligible EPO period, correctly updates the account status to PAID_OUT_EARLY_EPO and records the transaction.

Verifique se, ao efetuar um pagamento no portal de manutenção para todas as parcelas sem direito ao pagamento em 90 dias, o status da conta é atualizado para PAID_OUT_EARLY e a transação é registrada corretamente.
Verify that when making a payment through the maintenance portal for all installments not eligible for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is properly recorded.

Verifique se um pagamento feito através do portal do cliente, dentro do período de EPO elegível, atualiza corretamente o status da conta para PAID_OUT_EARLY_EPO e registra a transação
Verify that a payment made through the customer portal, within the eligible EPO period, correctly updates the account status to PAID_OUT_EARLY_EPO and records the transaction

Verifique se, ao efetuar um pagamento no portal do cliente para todas as parcelas sem direito ao pagamento em 90 dias, o status da conta é atualizado para PAID_OUT_EARLY e a transação é registrada corretamente.  
Verify that when you make a payment in the customer portal for all installments not due for payment within 90 days, the account status is updated to PAID_OUT_EARLY and the transaction is recorded correctly.

------------------------------------------------------------------------------------------------------------------------------------------------------------------