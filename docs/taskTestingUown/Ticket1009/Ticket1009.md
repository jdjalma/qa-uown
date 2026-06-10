------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1009

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Fix the permissions to display only the allowed information on Bank Account

Synopsis
In the Origination section of Bank Account, information about the Account Number is displayed. 
There are two permissions: one allows partial viewing, and the other allows full access. 
However, regardless of the enabled permission, it is currently displaying the full information.

Business Objective
Fix this so that each permission only displays the allowed information.

Feature Request | Business Requirements
With this correction, we expect the permissions to work properly and no longer expose customer data beyond what is permitted.

Fernando Martins @fernandogmartins
Testing Steps:

Validate if the bank account number is being correctly masked depending on the user permission.

If the permission is account_number[partial] the user should see the account_number masked:
https://gitlab.com/-/project/62182534/uploads/01dad83936e6b38169a2608c9101dcdf/image.png

If the permissions is account_number[full] the user should be able to see the account_number fully:
https://gitlab.com/-/project/62182534/uploads/4b9185db2f67a53f7506502f054db71b/image.png

If the user has no account_number permission, they shouldn't see any account_number information:
https://gitlab.com/-/project/62182534/uploads/c4aa170ae7abf652fde883b597d57dc6/image.png

Also check if the getBankAccounts method is giving a proper response:
https://gitlab.com/-/project/62182534/uploads/dc905ee34b3251cf6afdb0912bb0806e/image.png

And if getFinancialInfo doesn't exist anymore

-----

UOWN | Originação | Corrigir permissões para exibir apenas as informações permitidas em Conta Bancária

Sinopse
Na seção da Conta Bancária em Origination, as informações sobre o Número da Conta são exibidas.
Existem duas permissões: uma permite visualização parcial e a outra concede acesso total.
No entanto, independentemente da permissão ativada, atualmente está exibindo todas as informações.

Objetivo de Negócio
Corrigir isso para que cada permissão exiba apenas as informações permitidas.

Solicitação de Recurso | Requisitos de Negócio
Com essa correção, esperamos que as permissões funcionem corretamente e não exponham dados do cliente além do permitido.

Fernando Martins @fernandogmartins
Passos de Teste:

Validar se o número da conta bancária está sendo mascarado corretamente dependendo da permissão do usuário.

Se a permissão for account_number[partial], o usuário deve ver o número da conta mascarado:
https://gitlab.com/-/project/62182534/uploads/01dad83936e6b38169a2608c9101dcdf/image.png

Se a permissão for account_number[full], o usuário deve conseguir ver o número da conta completo:
https://gitlab.com/-/project/62182534/uploads/4b9185db2f67a53f7506502f054db71b/image.png

Se o usuário não tiver permissão account_number, ele não deve ver nenhuma informação do número da conta:
https://gitlab.com/-/project/62182534/uploads/c4aa170ae7abf652fde883b597d57dc6/image.png

Também verificar se o método getBankAccounts está retornando uma resposta adequada:
https://gitlab.com/-/project/62182534/uploads/dc905ee34b3251cf6afdb0912bb0806e/image.png

E se o getFinancialInfo não existe mais.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

🧪 Cenários de Teste (Gherkin)


1. Exibir número mascarado com permissão parcial

Scenario Outline: 1 - Visualizar número de conta parcialmente mascarado com permissão parcial
  Given que o usuário "<usuario>" está autenticado no portal "<portal>"
  And possui a permissão "account_number[partial]"
  And acessa a seção de contas bancárias
  When o número da conta bancária é exibido
  Then o número da conta deve estar mascarado, exibindo apenas os últimos dígitos

Examples:
  | usuario         | portal       |
  | test_merchant   | origination  |
  | test_agent      | origination  |
  | test_agent      | servicing    |


🔍 Verifique se o número da conta bancária aparece com asteriscos ocultando os primeiros dígitos, mostrando apenas os finais (ex: *****4321).
📝 Explicação: Valida que a permissão partial está sendo respeitada, e que a exibição de dados varia conforme o usuário e o portal.
✅ Resultado Esperado: O número aparece mascarado.

-----

2. Exibir número completo com permissão full

Scenario Outline: 2 - Visualizar número completo da conta com permissão total
  Given que o usuário "<usuario>" está autenticado no portal "<portal>"
  And possui a permissão "account_number[full]"
  And acessa a seção de contas bancárias
  When o número da conta bancária é exibido
  Then o número da conta deve estar visível por completo

Examples:
  | usuario         | portal       |
  | test_merchant   | origination  |
  | test_agent      | origination  |
  | test_agent      | servicing    |

🔍 Verifique se o número da conta é exibido completo para usuários com permissão total.
📝 Explicação: Confirma que os dados sensíveis são exibidos apenas a quem realmente possui a permissão total.
✅ Resultado Esperado: Número da conta completo (ex: 1234567890).

-----

3. Ocultar completamente o número da conta quando não houver permissão

Scenario Outline: 3 - Ocultar número da conta sem permissão
  Given que o usuário "<usuario>" está autenticado no portal "<portal>"
  And não possui a permissão "account_number"
  And acessa a seção de contas bancárias
  When o número da conta bancária é carregado
  Then o número da conta não deve ser exibido em nenhum formato

Examples:
  | usuario         | portal       |
  | test_merchant   | origination  |
  | test_agent      | origination  |
  | test_agent      | servicing    |


🔍 Verifique se o campo account_number não está presente, ou está completamente ausente ou nulo, para usuários sem permissão.
📝 Explicação: Impede a exibição indevida de dados sensíveis, mesmo que parcialmente, para quem não tem permissão.
✅ Resultado Esperado: Campo account_number não aparece.

-----

4. Validar resposta da API getBankAccounts conforme a permissão

Scenario Outline: 4 - Validar resposta da API getBankAccounts conforme a permissão configurada
  Given que uma requisição é feita para o endpoint getBankAccounts
  And o usuário possui a permissão "<permissao>"
  When a resposta da API é recebida
  Then o campo account_number na resposta deve conter "<resultado_esperado>"

Examples:
  | permissao             | resultado_esperado                |
  | account_number[full] | o número completo da conta        |
  | account_number[partial] | o número parcialmente mascarado |
  | (nenhuma)            | nenhuma informação da conta       |

-----

5. Verificar que o endpoint getFinancialInfo foi removido

Scenario: 5 - Verificar que o endpoint getFinancialInfo foi removido
  Given que uma chamada GET é feita para o endpoint getFinancialInfo
  When a requisição é enviada
  Then a resposta deve indicar que o endpoint não existe mais (404 ou mensagem apropriada)

🔍 Verifique se o endpoint getFinancialInfo não está mais disponível e retorna erro 404 ou equivalente.
📝 Explicação: Esse cenário confirma que o endpoint obsoleto foi desativado conforme o requisito técnico
✅ Resultado Esperado: Endpoint indisponível ou removido.

GET https://svc-{{env}}.uownleasing.com/uown/los/getFinancialInfo
GET https://svc-{{env}}.uownleasing.com/uown/svc/getFinancialInfo
-----

🧾 Resumo dos Requisitos e Cenários
|Requisito	                                    |Cenário Coberto|
|Exibir número mascarado com permissão parcial	| Cenário 1     |
|Exibir número completo com permissão total     | Cenário 2     |
|Ocultar número de conta sem permissão	        | Cenário 3     |
|Resposta correta da API conforme a permissão	| Cenário 4     |
|Remoção do endpoint getFinancialInfo           | Cenário 5     |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ 1. Exibir número mascarado com permissão parcial
Verifique se o número da conta bancária é exibido parcialmente mascarado quando o usuário possui a permissão account_number[partial]
Verify that the bank account number is partially masked when the user has the account_number[partial] permission

✅ 2. Exibir número completo com permissão total
Verifique se o número completo da conta bancária é exibido corretamente quando o usuário possui a permissão account_number[full]
Verify that the full bank account number is displayed correctly when the user has the account_number[full] permission

✅ 3. Ocultar número de conta sem permissão
Verifique se o número da conta bancária não é exibido em nenhum formato quando o usuário não possui nenhuma permissão account_number
Verify that the bank account number is not displayed in any format when the user has no account_number permission

✅ 4. Resposta correta da API conforme a permissão
Verifique se a resposta da API getBankAccounts retorna o número da conta de acordo com a permissão do usuário (completo, parcial ou ausente)
Verify that the getBankAccounts API response returns the account number according to the user's permission (full, partial, or omitted)

✅ 5. Remoção do endpoint getFinancialInfo
Verifique se o endpoint getFinancialInfo foi removido e não está mais disponível, retornando erro ou status apropriado.
Verify that the getFinancialInfo endpoint has been removed and is no longer available, returning an appropriate error or status

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8313/3670 | Progress Mobility | Verify that the bank account number is partially masked when the user has the account_number[partial] permission |  | PASS |
| 8313/3670 | Progress Mobility | Verify that the full bank account number is displayed correctly when the user has the account_number[full] permission |  | PASS |
| 8313/3670 | Progress Mobility | Verify that the bank account number is not displayed in any format when the user has no account_number permission |  | PASS |
| 8313/3670 | Progress Mobility | Verify that the getBankAccounts API response returns the account number according to the user's permission (full, partial, or omitted) |  | PASS |
| 8313/3670 | Progress Mobility | Verify that the getFinancialInfo endpoint has been removed and is no longer available, returning an appropriate error or status |  | PASS |
| -- | -- |  |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23352/206274 | Progress Mobility | Verify that the bank account number is partially masked when the user has the account_number[partial] permission |  | PASS |
| 23352/206274 | Progress Mobility | Verify that the full bank account number is displayed correctly when the user has the account_number[full] permission |  | PASS |
| 23352/206274 | Progress Mobility | Verify that the bank account number is not displayed in any format when the user has no account_number permission |  | PASS |
| 23352/206274 | Progress Mobility | Verify that the getBankAccounts API response returns the account number according to the user's permission (full, partial, or omitted) |  | PASS |
| -- | Progress Mobility | Verify that the getFinancialInfo endpoint has been removed and is no longer available, returning an appropriate error or status |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------
