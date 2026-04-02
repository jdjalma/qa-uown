------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/454

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Aplicar Campo de Comentário Obrigatório para Alterações de Status

BUG
Atualmente, o campo “Adicionar um comentário” que aparece ao alterar o estado de uma conta permite aos utilizadores guardar sem introduzir qualquer texto. 
Isso resulta em alterações de status sendo concluídas sem contexto ou documentação adequada.

FIXAR
Implementar lógica de validação para garantir que o campo “Adicionar um comentário” é obrigatório durante as alterações de estado

Etapas de Teste
Verifique se o aplicativo requer um comentário ao alterar o status da conta
Verifique se ao adicionar um comentário, a alteração é permitida.
Verifique se o comentário também é necessário via api

Use a curl
curl --location 'https://svc-qa1.uownleasing.com/uown/svc/createOrUpdateAccountInfo' 
--header 'Content-Type: application/json' 
--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' 
--data '{
"accountPk": 60,
"leadPk": 373,
"refAccountId": 373,
"taxForZipPk": 112991,
"merchantPk": 566,
"merchantProgramPk": 12,
"accountStatus": "PAID_OUT_EARLY",
"importDateTime": "2025-10-03T10:30:00.899786",
"welcomeCallTimestamp": null,
"lastPhoneContactTimestamp": null,
"activationDate": "2025-10-03",
"company": "UOWN",
"productType": "LEASE",
"isOkForSMS": true,
"isOkForEmail": true,
"ccAutoPay": true,
"achAutoPay": true,
"notes": "",
"comment": null,
"payOffDate": "2025-11-03",
"pastBankruptcy": false,
"currentOrFutureBankruptcy": false,
"showAlerts": true,
"rating": null,
"overPaymentAmount": 0.00,
"is90DayEligible": false,
"is90DayEligibleOverride": null,
"payOffDateTime": "2025-11-03T13:46:03.152695"
}'

Testando o método ChangeAccountStatus
Verifique se os horários apropriados estão sendo definidos para status diferente;
Verifique o fluxo de alteração de status cancelado;
Faça testes gerais de sanidade no método.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1: O sistema deve exigir um comentário ao tentar alterar o status da conta
Feature: Validação do Campo de Comentário ao Alterar o Status da Conta

  Scenario Outline: O sistema deve exigir um comentário ao alterar o status da conta para <NovoStatus>
    Given o usuário acessa a página de alteração de status da conta
    When o usuário tenta alterar o status da conta para "<NovoStatus>"
    And não insere um comentário no campo "Adicionar um comentário"
    Then o sistema deve exibir uma mensagem de erro informando que o comentário é obrigatório
    And a alteração do status não deve ser salva

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the system requires a comment when changing the account status to <NovoStatus>.
📌 Frase em português: Verifique se o sistema exige um comentário ao alterar o status da conta para <NovoStatus>.

Cenário 2: Permitir a alteração do status quando um comentário válido for inserido
Scenario Outline: O sistema deve permitir a alteração do status para <NovoStatus> quando um comentário for inserido
    Given o usuário acessa a página de alteração de status da conta
    When o usuário insere um comentário válido no campo "Adicionar um comentário"
    And altera o status da conta para "<NovoStatus>"
    Then o sistema deve permitir a alteração do status com sucesso
    And o comentário deve ser registrado no log da conta

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the system allows status change to <NovoStatus> when a valid comment is entered.
📌 Frase em português: Verifique se o sistema permite alterar o status para <NovoStatus> quando um comentário válido é inserido.

Cenário 3: Verificar se a API rejeita solicitações de alteração de status sem comentário
Scenario Outline: A API deve rejeitar a solicitação de alteração de status para <NovoStatus> sem um comentário
    Given um usuário faz uma requisição para alterar o status da conta via API
    When a requisição contém "<NovoStatus>" mas não contém um valor para o campo "comentário"
    Then a API deve retornar um erro informando que o comentário é obrigatório
    And a alteração do status não deve ser processada
Comment:newStatus:
  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the API rejects status change requests to <NovoStatus> without a comment.
📌 Frase em português: Verifique se a API rejeita solicitações de alteração de status para <NovoStatus> sem um comentário.

Cenário 4: Verificar se a API permite a alteração do status quando um comentário é informado
Scenario Outline: A API deve permitir a alteração de status para <NovoStatus> quando um comentário válido é enviado
    Given um usuário faz uma requisição para alterar o status da conta via API
    When a requisição contém "<NovoStatus>" e um campo "comentário" com um valor válido
    Then a API deve processar a alteração do status com sucesso
    And a resposta deve confirmar que o status foi atualizado

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the API allows status change requests to <NovoStatus> when a valid comment is provided.
📌 Frase em português: Verifique se a API permite solicitações de alteração de status para <NovoStatus> quando um comentário válido é fornecido.

Cenário 5: Verificar se os horários apropriados são definidos para cada status
Scenario Outline: O sistema deve definir horários apropriados para diferentes status de conta
    Given um usuário altera o status da conta para "<NovoStatus>"
    When a alteração é confirmada
    Then o sistema deve registrar corretamente os horários associados ao novo status

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the system correctly sets timestamps for the <NovoStatus> status change.
📌 Frase em português: Verifique se o sistema define corretamente os horários para a alteração de status <NovoStatus>.

Cenário 6: Verificar se o fluxo de alteração de status cancelado impede a alteração
Scenario Outline: O sistema deve impedir a alteração de status para <NovoStatus> caso o usuário cancele a operação
    Given o usuário inicia a alteração do status da conta para "<NovoStatus>"
    When o usuário clica para cancelar a operação antes da confirmação
    Then a alteração não deve ser processada
    And o status da conta deve permanecer inalterado

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the status change to <NovoStatus> is not processed if the user cancels the operation.
📌 Frase em português: Verifique se a alteração de status para <NovoStatus> não é processada caso o usuário cancele a operação.

Cenário 7: Verificar se o campo "comentário" é armazenado corretamente no histórico da conta
Scenario Outline: O comentário deve ser salvo no histórico da conta após a alteração do status para <NovoStatus>
    Given um usuário altera o status da conta para "<NovoStatus>" e insere um comentário válido
    When a alteração do status é processada com sucesso
    Then o comentário deve ser registrado corretamente no histórico da conta
    And o histórico deve exibir a data e hora da alteração

  Examples:
    | NovoStatus           |
    | ACTIVE               |
    | PAID_OUT             |
    | PAID_OUT_EARLY       |
    | PAID_OUT_EARLY_EPO   |
    | CHARGED_OFF          |
    | CLOSED               |
    | CANCELLED            |
    | SOLD                 |
    | SETTLED_IN_FULL      |
📌 Frase em inglês: Verify that the comment is properly stored in the account history after a status change to <NovoStatus>.
📌 Frase em português: Verifique se o comentário é armazenado corretamente no histórico da conta após a alteração de status para <NovoStatus>.


📌 Resumo
Os cenários acima cobrem tanto a interface do usuário quanto a API, garantindo que a nova validação seja aplicada corretamente. 
Se precisar de ajustes ou cenários adicionais, me avise! 🚀

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3610 | Progress Mobilty | Verify that the system requires a comment when changing the account status to new Status |  | PASS |
| 3610 | Progress Mobilty | Verify that the system allows status change to new Status when a valid comment is entered |  | PASS |
| 3610 | Progress Mobilty | Verify that the API rejects status change requests to new Status without a comment |  | PASS |
| 3612 | MyEyeMed | Verify that the API allows status change requests to new Status when a valid comment is provided |  | PASS |
| 3612 | MyEyeMed | Verify that the system correctly sets timestamps for the new Status change |  | PASS |
| 3612 | MyEyeMed | Verify that the status change to <NovoStatus> is not processed if the user cancels the operation |  | PASS |
| 3612 | MyEyeMed | Verify that the comment is properly stored in the account log after a status change to new Status |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📌 Frase em inglês: Verify that the system requires a comment when changing the account status to <NovoStatus>.
📌 Frase em português: Verifique se o sistema exige um comentário ao alterar o status da conta para <NovoStatus>.

📌 Frase em inglês: Verify that the system allows status change to <NovoStatus> when a valid comment is entered.
📌 Frase em português: Verifique se o sistema permite alterar o status para <NovoStatus> quando um comentário válido é inserido.

📌 Frase em inglês: Verify that the API rejects status change requests to <NovoStatus> without a comment.
📌 Frase em português: Verifique se a API rejeita solicitações de alteração de status para <NovoStatus> sem um comentário.

📌 Frase em inglês: Verify that the API allows status change requests to <NovoStatus> when a valid comment is provided.
📌 Frase em português: Verifique se a API permite solicitações de alteração de status para <NovoStatus> quando um comentário válido é fornecido.

📌 Frase em inglês: Verify that the system correctly sets timestamps for the <NovoStatus> status change.
📌 Frase em português: Verifique se o sistema define corretamente os horários para a alteração de status <NovoStatus>.

📌 Frase em inglês: Verify that the status change to <NovoStatus> is not processed if the user cancels the operation.
📌 Frase em português: Verifique se a alteração de status para <NovoStatus> não é processada caso o usuário cancele a operação.

📌 Frase em inglês: Verify that the comment is properly stored in the account history after a status change to <NovoStatus>.
📌 Frase em português: Verifique se o comentário é armazenado corretamente no histórico da conta após a alteração de status para <NovoStatus>.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 205916 | Daniel's Jewelers | Verify that the system requires a comment when changing the account status to new Status |  | PASS |
| 205916 | Daniel's Jewelers | Verify that the system allows status change to new Status when a valid comment is entered |  | PASS |
| 205916 | Daniel's Jewelers | Verify that the API rejects status change requests to new Status without a comment |  | PASS |
| 205923 | Progress Mobility | Verify that the API allows status change requests to new Status when a valid comment is provided |  | PASS |
| 205923 | Progress Mobility | Verify that the system correctly sets timestamps for the new Status change |  | PASS |
| 205923 | Progress Mobility | Verify that the status change to <NovoStatus> is not processed if the user cancels the operation |  | PASS |
| 205923 | Progress Mobility | Verify that the comment is properly stored in the account log after a status change to new Status |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

parou no cenario 4

