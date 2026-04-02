------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1014

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Display Merchant banking informations on the Create Lease page based on permission

Synopsis
On the Lease Create page in Origination, merchant information is currently visible to everyone. 
Therefore, it will be necessary to modify this to ensure that this information is not displayed unless the user has the necessary permission.

Business Objective
This change will prevent their employees from having unrestricted access to merchant information, ensuring better data protection.

Feature Request | Business Requirements
Criteria:
The system should check the user's permissions before displaying the merchant information.
The merchant information should only be visible to users with specific permissions.
If the user does not have permission, the information should be hidden.

Marcos Silvano @marcos.pacheco.silva
Test instructions:
Create a new lease for a merchant with account and routing number. 
Sign that lease and add items, the lease details page it should bank information for the merchant shouldn't be displayed.

Caveat: The component will display the bank information for the customer before displaying the merchant info

-----

UOWN | Origination | Exibir informações bancárias do comerciante na página Create Lease baseado em permissão
Resumo:
Na página de Criação de Leasing em Origination, informações do comerciante estão visíveis para todos usuários.
É necessário modificar para que essas informações não sejam exibidas sem a permissão adequada.

Objetivo Comercial:
Esta mudança impedirá acesso irrestrito às informações do comerciante, garantindo melhor proteção de dados.
    quais as informacoes do merchant na tela de criação de lease?
        Account Holder Name
        Bank Name
        Account Type
        Account Number
        Routing Number

Requisitos:

O sistema deve verificar permissões do usuário antes de exibir informações do comerciante
Informações do comerciante devem ser visíveis apenas para usuários com permissões específicas
Se o usuário não tiver permissão, as informações devem ser ocultadas

Instruções de teste:
Criar um novo leasing para um comerciante com número de conta e roteamento. Assinar o leasing e adicionar itens. Na página de detalhes, as informações bancárias do comerciante não devem ser exibidas.
Observação: O componente exibirá informações bancárias do cliente antes de exibir as informações do comerciante.

-----

Marcos:
tem um peguinha com relação a isso to pegando aqui
Precisa de duas permissões na verdade
invoice [access]
invoice merchant bank info [access]
invoice [access]
e tipo a permissão pai da 
invoice merchant bank info [access]
 sem ela a primeira a seguinda não funciona.

Primeiro vai tentar exibir o banking info do customer quando tiver, caso não tenha ai os dados do merchant são usados

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Exibir informações bancárias do comerciante na página de Criação de Leasing em Origination apenas para usuários com permissões específicas.
A tarefa visa garantir que informações sensíveis do comerciante, como nome do titular da conta, nome do banco, tipo de conta, número da conta e número de roteamento, só sejam visíveis para usuários com as permissões adequadas.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se as informações bancárias do comerciante são exibidas corretamente para usuários com permissões adequadas

Scenario: 1 - Verificar se as informações bancárias do comerciante são exibidas corretamente para usuários com permissões adequadas
  Given que o usuário tem permissão para visualizar as informações bancárias do comerciante
  When o usuário acessa a página de Criação de Lease
  Then as informações bancárias do comerciante devem ser exibidas corretamente, incluindo:
    | Account Holder Name | Bank Name | Account Type | Account Number | Routing Number |

🔍 Verifique se as informações bancárias do comerciante (como nome do titular, nome do banco, tipo de conta, número da conta e número de roteamento) são exibidas corretamente para usuários com permissões adequadas.
📝 Explicação: Este cenário valida que as informações bancárias do comerciante são exibidas corretamente para usuários com permissão para visualizar esses dados.
✅ Resultado Esperado: As informações bancárias são exibidas corretamente na página de Criação de Lease.

-----

Scenario 2 - Verificar se as informações bancárias do comerciante não são exibidas para usuários sem permissões adequadas

Scenario: 2 - Verificar se as informações bancárias do comerciante não são exibidas para usuários sem permissões adequadas
  Given que o usuário não tem permissão para visualizar as informações bancárias do comerciante
  When o usuário acessa a página de Criação de Lease
  Then as informações bancárias do comerciante não devem ser exibidas

🔍 Verifique se as informações bancárias do comerciante não são exibidas quando o usuário não tem permissão para visualizá-las.
📝 Explicação: Este cenário valida que, para usuários sem permissão, as informações bancárias do comerciante são ocultadas corretamente na página de Criação de Lease.
✅ Resultado Esperado: As informações bancárias não são exibidas na página de Criação de Lease.

-----

Scenario Outline - Verificar se as informações bancárias do comerciante são exibidas corretamente com a concessão ou remoção de permissões

Scenario Outline: 3 - Verificar se as informações bancárias do comerciante são exibidas corretamente com a concessão ou remoção de permissões
  Given que o administrador <action> a permissão para visualizar as informações bancárias do comerciante para o usuário
  When o usuário acessa a página de Criação de Lease
  Then as informações bancárias do comerciante devem ser <visibility_status> para o usuário

Examples:
  | action   | visibility_status |
  | concede  | visíveis          |
  | remover  | ocultas           |

🔍 Verifique se, ao conceder ou remover a permissão para o usuário visualizar as informações bancárias do comerciante, as informações bancárias são exibidas ou ocultadas corretamente.
📝 Explicação: Esse cenário valida se, ao conceder ou remover a permissão pelo administrador, as informações bancárias do comerciante são exibidas ou ocultadas na página de Criação de Lease conforme o esperado.
✅ Resultado Esperado:
Quando a permissão é concedida: As informações bancárias são exibidas.
Quando a permissão é removida: As informações bancárias são ocultadas.
Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao conceder ou remover a permissão para visualizar as informações bancárias do comerciante, as informações são exibidas ou ocultadas corretamente na página de Criação de Lease, conforme o estado da permissão.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se as informações bancárias número da conta e número de roteamento do comerciante são exibidas corretamente para usuários com permissão "invoice merchant bank info [access]"
Verifique se as informações bancárias número da conta e número de roteamento do comerciante não são exibidas corretamente para usuários sem permissão "invoice merchant bank info [access]"
Verificar se as informações bancárias do comerciante são exibidas corretamente com a concessão ou remoção de permissões

-----

Verificar se usuários com permissão "invoice merchant bank info [access]" visualizam corretamente o número da conta e número de roteamento bancário do comerciante
Verify if users with "invoice merchant bank info [access]" permission correctly see the merchant's account number and routing number

Verificar se usuários sem permissão "invoice merchant bank info [access]" não visualizam o número da conta e número de roteamento bancário do comerciante
Verify if users without "invoice merchant bank info [access]" permission do not see the merchant's account number and routing number

Verificar se a exibição das informações bancárias do comerciante responde corretamente à concessão ou remoção de permissões
Verify if the merchant's banking information display responds correctly to permission grants or removals

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify if users with "invoice merchant bank info [access]" permission correctly see the merchant's account number and routing number |  | PASS |
| Verify if users without "invoice merchant bank info [access]" permission do not see the merchant's account number and routing number |  | PASS |
| Verify if the merchant's banking information display responds correctly to permission grants or removals |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify if users with "invoice merchant bank info [view]" permission correctly see the merchant's account number and routing number |  | PASS |
| Verify if users without "invoice merchant bank info [view]" permission do not see the merchant's account number and routing number |  | PASS |
| Verify if the merchant's banking information display responds correctly to permission grants or removals |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------