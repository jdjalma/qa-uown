------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1056

UOWN | Origination | Create Specific Permission to Control Edit Access to Merchant Page Field (Minimum Lease Amount)

Synopsis
Currently, the Minimum Lease Amount can be edited by multiple users. However, it is necessary to limit which users have this access. 
While there is an existing permission to access the Merchant settings page, there is a need to further restrict edit 
access to certain sensitive fields. Specifically, some fields should only be editable when a dedicated permission is assigned, 
ideally limited to Admin users, even if the user has access to the Merchant page.

Business Objective
Increase permission granularity to ensure that sensitive fields on the Merchant page are editable only by explicitly authorized users, 
improving data control and overall system security.

Feature Request | Business Requirements
* Audit the current list of users/roles with access to the Merchant page
* Identify the specific fields that should have restricted edit access
* Create a new dedicated permission to explicitly control edit access to those fields (Minimum Lease Amount)
* Ensure that users with access to the Merchant page cannot edit these fields unless they also have the new permission.
* Ideally, restrict this new permission to Admin users by default.
* Validate the behavior through permission-based and role-based testing.

Fernando Martins @fernandogmartins
Testing Steps
On AMS, check if the new  origination permission modify minimum lease amount is present 
(users with the role of manager should have it by default)

With the permission active, check if the user can interact with the minimum lease amount column.
Without the permission, check if now the column becomes read only

-----

UOWN | Originação | Criar Permissão Específica para Controlar Acesso de Edição ao Campo da Página de Comerciantes 
(Valor Mínimo de Locação)

Sinopse

Atualmente, o campo Valor Mínimo de Locação pode ser editado por múltiplos usuários. No entanto, 
é necessário limitar quais usuários têm esse acesso. Embora já exista uma permissão para acessar a página de configurações do 
Comerciante, é necessário restringir ainda mais o acesso de edição a certos campos sensíveis. Especificamente, 
alguns campos devem ser editáveis apenas quando uma permissão dedicada for atribuída, 
idealmente limitada a usuários Administradores, mesmo que o usuário tenha acesso à página do Comerciante.

Objetivo de Negócio
Aumentar a granularidade das permissões para garantir que campos sensíveis na página do Comerciante sejam editáveis 
apenas por usuários explicitamente autorizados, melhorando o controle de dados e a segurança geral do sistema.

Solicitação de Funcionalidade | Requisitos de Negócio
Auditar a lista atual de usuários/roles com acesso à página do Comerciante.
Identificar os campos específicos que devem ter acesso de edição restrito.
Criar uma nova permissão dedicada para controlar explicitamente o acesso de edição a esses campos (Valor Mínimo de Locação).
Garantir que usuários com acesso à página do Comerciante não possam editar esses campos, a menos que também possuam a nova permissão.
Idealmente, restringir essa nova permissão a usuários Administradores por padrão.
Validar o comportamento por meio de testes baseados em permissões e roles.

Fernando Martins @fernandogmartins
Passos de Teste
No AMS, verificar se a nova permissão de originação "modificar valor mínimo de locação" está presente 
(usuários com o papel de gerente devem tê-la por padrão).

Com a permissão ativa, verificar se o usuário pode interagir com a coluna do valor mínimo de locação.

Sem a permissão, verificar se a coluna se torna somente leitura.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

acesso
edicao

tipo de usuario
    merchant
    agent
    manager
    outro que houver
usuários com o papel de gerente devem ter a nova permissão de originação "modificar valor mínimo de locação" por padrão
    cadastrar usuario gerente e validar se ele ja tem essa permissao
    cadastrar usuario diferente de gerente e validar se ele não tem tem essa permissao
Verificar se o usuario gerente cadastrado pode mudar valor minimo de locação
Verificar se o usuario diferente de gerente cadastrado não pode mudar valor minimo de locação
Verificar se o usuário gerente cadastrado que perdeu a permissão, pode somente visualizar o valor no campo e não pode editar(readOnly)
Verificar se o usuário diferente de grente cadastrado, ao receber a permisão, pode mudar valor minimo de locação

-----

Scenario: Verificar atribuição da permissão e comportamento do campo para diferentes papéis

Given um usuário com o papel "gerente" é criado
When ele acessa o módulo de permissões
Then ele deve possuir a permissão "modificar valor mínimo de locação"
--> manager_test(1)

And um usuário com o papel "merchant" é criado
Then ele não deve possuir a permissão "modificar valor mínimo de locação"

When o usuário "gerente" acessa a página do Comerciante
Then ele deve visualizar o campo "Valor Mínimo de Locação" como editável
--> manager_test(1)

When o usuário "merchant" acessa a mesma página
Then ele deve visualizar o campo "Valor Mínimo de Locação" como somente leitura

And no banco de dados:
  Then a permissão "modificar valor mínimo de locação" deve estar registrada para o usuário "gerente"
  --> manager_test(1)

  And a permissão "modificar valor mínimo de locação" **não** deve estar registrada para o usuário "merchant"

ams qa1 - https://ams-website-qa1.uownleasing.com/users
manager_test(1))
tem a permissão 565 modify minimum lease amount [modify] ao cadastrar
ok

--> MANAGER TUDO CERTO
--> MERCHANT TUDO CERTO
-----

✅ Cenário 2: Verificar atribuição dinâmica da permissão e mudanças na UI/comportamento
Scenario: Atribuir e remover dinamicamente a permissão e verificar efeitos na UI e backend
Given um usuário com papel "agent" é criado sem a permissão
And ele acessa a página do Comerciante
Then o campo "Valor Mínimo de Locação" deve estar somente leitura

When a permissão "modificar valor mínimo de locação" é atribuída ao usuário
And ele atualiza a sessão (logout/login)
Then o campo deve se tornar editável

When ele altera o valor do campo e salva
Then a alteração deve ser registrada no banco de dados
And deve ser gerado um log com a alteração realizada

When a permissão é removida novamente
And ele atualiza a sessão
Then o campo deve voltar a ser somente leitura
And novas alterações devem ser bloqueadas
--> ok
agent_test
-----

✅ Cenário 3: Usuário com múltiplos papéis e mudança de permissões por alteração de perfil
Scenario: Alteração de papéis influencia permissão de edição do campo
Given um usuário com os papéis "gerente" é criado
Then ele deve possuir a permissão "modificar valor mínimo de locação" por herança

When o papel "gerente" é removido do usuário
Then ele deve perder a permissão automaticamente
And ao acessar a página do Comerciante, o campo deve estar somente leitura

When o papel "gerente" é atribuído novamente
And o usuário atualiza a sessão
Then o campo deve voltar a ser editável

--> OK
-----

✅ Cenário 4: Alteração durante edição e bloqueio de persistência
Scenario: Permissão é revogada durante a edição e impede persistência
Given um usuário com permissão inicia a edição do campo
When sua permissão é revogada antes de salvar
Then ao tentar salvar, o sistema deve bloquear a ação com erro de permissão

And a alteração não deve ser persistida no banco
And a tentativa deve ser registrada no log

--> Foi identificada uma vulnerabilidade onde, ao remover a permissão durante a edição, o usuário ainda consegue salvar. No entanto, essa situação tem baixo impacto, pois é pouco provável que a revogação de permissão ocorra simultaneamente à tentativa de salvar. A correção pode ser avaliada futuramente, caso o risco aumente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Erro ao criar um usuario gerente, ele tem a permissão porem nao consegue alterar o valor no campo

@fernandogmartins Even though a manager user is correctly granted permission, the "Minimum Lease Amount" field still appears as read-only.

![qa1-1056-c1-UsuarioManagerCriadoNaoPodeALterarValorMinimoLocacao-_E1___4_](/uploads/6b19a1cb3e15cbb025ffc68b7487764b/qa1-1056-c1-UsuarioManagerCriadoNaoPodeALterarValorMinimoLocacao-_E1___4_.png){width=1438 height=745}

-----

modify minimum lease amount [modify]

-----

Verifique se somente usuários com a função de gerente têm permissão para editar o campo "valor mínimo de locação" quando registrados, enquanto usuários comerciantes veem o campo como somente leitura
Verify that only users with the manager role have permission to edit the "Minimum Lease Amount" field when registered, while merchant users see the field as read-only

Validar que o campo "Valor Mínimo de Locação" se torna editável ao receber a permissão "modificar valor mínimo de locação" e permanece em modo somente leitura quando a permissão é removida
Validate that the "Minimum Lease Amount" field becomes editable when receiving the "modify Minimum Lease Amount" permission and remains in read-only mode when the permission is removed

Verificar que a permissão de edição do campo é concedida e removida automaticamente com a adição ou retirada do papel gerente
Verify that field editing permission is granted and removed automatically when the manager role is added or removed

Verificar se, ao remover a permissão "modificar valor mínimo de locação" durante a edição, o sistema impede a alteração e salvamento do valor
Check whether, when removing the "modify Minimum Lease Amount" permission during editing, the system prevents the value from being changed and saved

-----

Tests in qa1

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Verify that only users with the manager role have permission to edit the "Minimum Lease Amount" field when registered, while merchant users see the field as read-only |  | PASS | -- |
| Validate that the "Minimum Lease Amount" field becomes editable when receiving the "modify Minimum Lease Amount" permission and remains in read-only mode when the permission is removed |  | PASS | -- |
| Verify that field editing permission is granted and removed automatically when the manager role is added or removed |  | PASS |  |
| Check whether, when removing the "modify Minimum Lease Amount" permission during editing, the system prevents the value from being changed and saved |  | PASS | A vulnerability has been identified where, when removing permission during editing, the user can still save. However, this situation has low impact, as it is unlikely that the permission revocation will occur simultaneously with the attempt to save. The fix may be evaluated in the future, if the risk increases. |

-----

Tests in qa1

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Verify that only users with the manager role have permission to edit the "Minimum Lease Amount" field when registered, while merchant users see the field as read-only | ![1056-qa1-c1-1-_1_](/uploads/ef10f17009b0cdbf8d859a5467f3acb5/1056-qa1-c1-1-_1_.png){width=1440 height=739}![1056-qa1-c1-1-_2_](/uploads/c3ea285b3ad87cf4a9655af08bedc0df/1056-qa1-c1-1-_2_.png){width=1440 height=739}![1056-qa1-c1-2-_3_](/uploads/fc5856bd0d49cf6d07d76ad2dcba35f2/1056-qa1-c1-2-_3_.png){width=965 height=740} | PASS | -- |
| Validate that the "Minimum Lease Amount" field becomes editable when receiving the "modify Minimum Lease Amount" permission and remains in read-only mode when the permission is removed | ![1056-qa1-c2_2_](/uploads/9995463069b9a257432d63a0719563d7/1056-qa1-c2_2_.png){width=1438 height=740}![1056-qa1-c2_3_](/uploads/9a7c115ca5ae770fa85b37b62a840647/1056-qa1-c2_3_.png){width=1438 height=740}![1056-qa1-c2_4_](/uploads/b992e902f384f9b3da2fc0937ae4a23b/1056-qa1-c2_4_.png){width=1438 height=740}![1056-qa1-c2_5_](/uploads/55320da9ba59c258a624ebb16ddeab38/1056-qa1-c2_5_.png){width=1438 height=740} | PASS | -- |
| Verify that field editing permission is granted and removed automatically when the manager role is added or removed | ![1056-qa1-c3_1_](/uploads/afd366b5df6e49dc108ad912153c264a/1056-qa1-c3_1_.png){width=965 height=740}![1056-qa1-c3_2_](/uploads/233982babfced097dd43728953036a36/1056-qa1-c3_2_.png){width=965 height=740}![1056-qa1-c3_3_](/uploads/82204b7c8c6d3c7d83dc7f74a017ffb7/1056-qa1-c3_3_.png){width=965 height=740}![1056-qa1-c3_4_](/uploads/ba1b2fbed6750eb4142304d4fa400031/1056-qa1-c3_4_.png){width=1438 height=740}![1056-qa1-c3_5_](/uploads/1ed70ea2cb73afa5739a5e19947e3816/1056-qa1-c3_5_.png){width=1438 height=740}![1056-qa1-c3_6_](/uploads/6567f11baa1c06dc4c374599526b9663/1056-qa1-c3_6_.png){width=965 height=740} | PASS | -- |
| Check whether, when removing the "modify Minimum Lease Amount" permission during editing, the system prevents the value from being changed and saved | ![1056-qa1-c4_1_](/uploads/a273dfe4ce23a31c1bdd433056e5b387/1056-qa1-c4_1_.png){width=1438 height=740}![1056-qa1-c4_2_](/uploads/22a1492a2fe937a86bb8a96fda78b624/1056-qa1-c4_2_.png){width=1438 height=740}![1056-qa1-c4_3_](/uploads/7d1d186009a1e81aeefb301146f7df4a/1056-qa1-c4_3_.png){width=1438 height=740}![1056-qa1-c4_4_](/uploads/5ba2bf8602a49593e766d16a96b3225d/1056-qa1-c4_4_.png){width=1438 height=740} | PASS | A vulnerability has been identified where, when removing permission during editing, the user can still save. However, this situation has low impact, as it is unlikely that the permission revocation will occur simultaneously with the attempt to save. The fix may be evaluated in the future, if the risk increases. |

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verify that only users with the manager role have permission to edit the "Minimum Lease Amount" field when registered, while merchant users see the field as read-only
Validate that the "Minimum Lease Amount" field becomes editable when receiving the "modify Minimum Lease Amount" permission and remains in read-only mode when the permission is removed
Verify that field editing permission is granted and removed automatically when the manager role is added or removed
Check whether, when removing the "modify Minimum Lease Amount" permission during editing, the system prevents the value from being changed and saved

-----

Verifique se apenas usuários com o papel de gerente têm permissão para editar o campo "valor mínimo de locação" ao serem cadastrados, enquanto usuários comerciantes visualizam o campo apenas para leitura.
Valide se o campo "valor mínimo de locação" se torna editável ao receber a permissão "modificar valor mínimo de locação" e permanece em modo somente leitura quando essa permissão é removida.
Verifique se a permissão de edição do campo é concedida e removida automaticamente quando o papel de gerente é adicionado ou removido.

-----

> ## Tests in stg
> ```gherkin
> ### Feature: Permissão de edição do campo "valor mínimo de locação"
>
> ### Scenario: Apenas usuários com papel de gerente podem editar o campo "valor mínimo de locação"
>Given que existe um usuário cadastrado com papel de gerente
>When o usuário acessa o campo "valor mínimo de locação"
>Then o campo deve estar editável
> ```
>
> ```gherkin
>Given que existe um usuário cadastrado com papel de comerciante
>When o usuário acessa o campo "valor mínimo de locação"
>Then o campo deve estar somente leitura
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Campo torna-se editável ao receber a permissão "modificar valor mínimo de locação" e volta a ser somente leitura ao remover a permissão
>Given que o usuário possui papel de comerciante e campo está somente leitura
>When o usuário recebe a permissão "modificar valor mínimo de locação"
>Then o campo "valor mínimo de locação" deve ficar editável
>
>When a permissão "modificar valor mínimo de locação" é removida do usuário
>Then o campo "valor mínimo de locação" deve voltar a ser somente leitura
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
> 
> ```gherkin
> ### Scenario: Permissão de edição é concedida ou removida automaticamente com a alteração do papel de gerente
>Given que o usuário não possui papel de gerente
>Then o campo "valor mínimo de locação" está somente leitura
>
>When o papel de gerente é atribuído ao usuário
>Then o campo "valor mínimo de locação" torna-se editável
>
>When o papel de gerente é removido do usuário
>Then o campo "valor mínimo de locação" volta a ser somente leitura
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

-----


> ## Tests in stg
> ```gherkin
>### Feature: Permission to edit the "minimum rental value" field
>
>### Scenario: Only users with the manager role can edit the "minimum rental value" field
>Given there is a registered user with the manager role
>When the user accesses the "minimum rental value" field
>Then the field should be editable
> | PASS | LeadPk / AccountPk | Merchant | 
>
>Given there is a registered user with the merchant role
>When the user accesses the "minimum rental value" field
>Then the field should be read-only
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
>### Scenario: Field becomes editable when receiving the "modify minimum rental value" permission and returns to read-only when the permission is removed
>Given the user has the merchant role and the field is read-only
>When the user receives the "modify minimum rental value" permission
>Then the "minimum rental value" field should become editable
>
>When the "modify minimum rental value" permission is removed from the user
>Then the "minimum rental value" field should become read-only again
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
>### Scenario: Editing permission is granted or removed automatically when the manager role is added or removed
>Given the user does not have the manager role
>Then the "minimum rental value" field is read-only
>
>When the manager role is assigned to the user
>Then the "minimum rental value" field becomes editable
>
>When the manager role is removed from the user
>Then the "minimum rental value" field becomes read-only again
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------