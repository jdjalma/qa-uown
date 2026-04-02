------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/342

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Refactor Handle Financial Information Update

Synopsis
Refactor handleFinancialInfoUpdate and related methods to separate the logic for credit card and bank account information.

Business Objective
Ensure each is managed independently for better clarity and maintainability.

Fernando Martins @fernandogmartins
Testing Steps:

Access the table uown_sv_account
1. Verify that when no payment method with autoPay enabled exists, the auto_pay_types column is set to NONE.
2. If a bank account payment method with autoPay enabled exists, check that ACH appears in the column.
3. If a credit card payment method with autoPay enabled exists, ensure that CC is included.
4. When both a bank account and a credit card with autoPay enabled are present, confirm that the column shows both ACH,CC (order can vary, e.g., CC, ACH).
5. Check that if one of the autoPay types is removed (for example, if the associated payment method is deleted), the corresponding type is also removed from the column.

Sanitary Testing on Panels
Adding and deleting bank accounts and credit cards.

UpdateAutoPay Testing (Servicing Information Panel)
In the servicing information section, test the interaction between the rating letter and autoPay:

Case 1: When the rating letter is null, verify that any active autoPay payment methods (bank account and/or credit card) are still displayed.
https://gitlab.com/-/project/62177899/uploads/14f55fe03950b73e826358ec87ccc8a0/image.png

Case 2: When the rating letter is changed to C, P, or M (or any rating that triggers removal based on configuration), check that the existing autoPay methods are removed accordingly.

Confirm that with each rating letter change, a log entry is generated detailing the change (including the previous rating letter and the new value), and that any alerts are created as needed.

Ensure that when the rating letter is updated, the account’s last rating time is refreshed and notes are updated to reflect the change.

Validate that the database reflects the updated autoPay types.

-----

UOWN | Manutenção | Refatoração da Atualização de Informações Financeiras

Sinopse
Refatorar o método handleFinancialInfoUpdate e métodos relacionados para separar a lógica de informações de cartão de crédito e conta bancária.

Objetivo de Negócio
Garantir que cada um seja gerenciado de forma independente para maior clareza e manutenibilidade.

Fernando Martins @fernandogmartins
Passos de Teste:

Acesse a tabela uown_sv_account
Verifique que, quando não existe um método de pagamento com autoPay habilitado, a coluna auto_pay_types é definida como NONE.
Se existir um método de pagamento de conta bancária com autoPay habilitado, confirme que ACH aparece na coluna.
    habilitar autopay para ach e validar no banco de dados
    desabilitar autopay para ach e validar no banco de dados

Se existir um método de pagamento de cartão de crédito com autoPay habilitado, assegure que CC está incluído.
    abilitar autopay para cc e validar no banco de dados
    desabilitar autopay para cc e validar no banco de dados

Quando tanto uma conta bancária quanto um cartão de crédito com autoPay habilitado estão presentes, confirme que a coluna exibe ACH,CC (a ordem pode variar, por exemplo, CC, ACH).

Verifique que, se um dos tipos de autoPay for removido (por exemplo, se o método de pagamento associado for excluído), o tipo correspondente também seja removido da coluna.
    excluir metodo de pagamento ach pelo portal servicing, validar na interface e no banco de dados se ach foi removido
    excluir metodo de pagamento cc pelo portal servicing, validar na interface e no banco de dados se cc foi removido
    excluir metodo de pagamento ach pelo portal website, validar na interface e no banco de dados se ach foi removido
    excluir metodo de pagamento cc pelo portal website, validar na interface e no banco de dados se cc foi removido
    adicionar metodo de pagamento ach pelo portal servicing, validar na interface e no banco de dados se ach foi incluido
    adicionar metodo de pagamento cc pelo portal servicing, validar na interface e no banco de dados se cc foi incluido
    adicionar metodo de pagamento ach pelo portal website, validar na interface e no banco de dados se ach foi incluido
    adicionar metodo de pagamento cc pelo portal website, validar na interface e no banco de dados se cc foi incluido

Teste Sanitário nos Painéis
Adicionar e excluir contas bancárias e cartões de crédito.

Teste de Atualização de AutoPay (Painel de Informações de Manutenção)
Na seção de informações de manutenção, teste a interação entre a carta de classificação e o autoPay:

Caso 1: Quando a carta de classificação é nula, verifique que quaisquer métodos de pagamento ativos com autoPay (conta bancária e/ou cartão de crédito) ainda são exibidos.
https://gitlab.com/-/project/62177899/uploads/14f55fe03950b73e826358ec87ccc8a0/image.png

Caso 2: Quando a carta de classificação é alterada para C, P ou M (ou qualquer classificação que dispare uma remoção com base na configuração), confirme que os métodos de autoPay existentes são removidos conforme esperado.
Confirme que, a cada mudança na carta de classificação, uma entrada de log é gerada detalhando a alteração (incluindo a carta de classificação anterior e o novo valor) e que quaisquer alertas são criados conforme necessário.

Assegure que, quando a carta de classificação é atualizada, o último horário de classificação da conta é atualizado e as notas são ajustadas para refletir a mudança.

Valide que o banco de dados reflete os tipos de autoPay atualizados.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da Tarefa
Refatoração do método handleFinancialInfoUpdate e métodos relacionados para separar a lógica de informações de cartão de crédito e conta bancária, 
assegurando que cada tipo de pagamento seja gerenciado de forma independente. Além disso, é necessário garantir que o banco de dados, a 
interface e os logs sejam corretamente atualizados conforme as modificações no autoPay de cada método de pagamento.

🧪 Cenários de Teste Gherkin


Scenario 1 – Verificar a coluna auto_pay_types quando não há método de pagamento com autoPay habilitado

Scenario: 1 - Verificar coluna auto_pay_types com autoPay desabilitado
  Given que o usuário acessa a tabela uown_sv_account
  When não existe um método de pagamento com autoPay habilitado
  Then a coluna auto_pay_types deve ser definida como NONE
  And verifique na interface que o valor exibido em AutoPay é "NONE"
  And verifique no banco de dados que a coluna auto_pay_types contém "NONE"

🔍 Verifique se a coluna auto_pay_types exibe "NONE" quando não há métodos de pagamento com autoPay habilitado.
📝 Explicação: Este cenário testa o comportamento quando não há nenhum método de pagamento com autoPay ativo.
✅ Resultado Esperado: A coluna auto_pay_types mostra "NONE" na interface, no banco de dados e nos logs.

qa1:
8350-3680 Progress Mobility
8353-3681 Progress Mobility
-----

Scenario 2 – Verificar a coluna auto_pay_types com ACH e autoPay habilitado

Scenario: 2 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When ACH é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "ACH"

🔍 Verifique se a coluna auto_pay_types mostra "ACH" quando o ACH é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay ACH quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH" na interface

-----

Scenario 3 – Verificar a coluna auto_pay_types com cartão de crédito e autoPay habilitado

Scenario: 3 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When CC é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "CC"

🔍 Verifique se a coluna auto_pay_types mostra "CC" quando o CC é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay CC quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface

-----

Scenario 4 – Verificar a coluna auto_pay_types com ACH e cartão de crédito com autoPay habilitado

Scenario: 4 - Verificar coluna auto_pay_types com ACH e CC com autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When "ACH, CC" ou "CC, ACH" é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "ACH, CC" ou "CC, ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH, CC" ou "CC, ACH"

🔍 Verifique se a coluna auto_pay_types exibe tanto "ACH" quanto "CC" quando o "ACH, CC" ou "CC, ACH" é atribuido a auto_pay_types.
📝 Explicação: Este cenário valida exibição de autopay "ACH, CC" ou "CC, ACH" quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH, CC" ou "CC, ACH" na interface.


Scenario 3 – Verificar a coluna auto_pay_types com cartão de crédito e autoPay habilitado

Scenario: 2 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When CC é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "CC"

🔍 Verifique se a coluna auto_pay_types mostra "CC" quando o CC é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay CC quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface
-----

Scenario 5 – Verificar a remoção de autoPay ao excluir o método de pagamento ACH pelo portal Servicing

Scenario: 5 - Verificar remoção de autoPay ao excluir ACH pelo portal Servicing
  Given que o usuário exclui o método de pagamento ACH pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "ACH"
  And verifique no banco de dados que a coluna auto_pay_types não contém "ACH"
  And verifique nos logs que a exclusão de ACH foi registrada

🔍 Verifique se, ao excluir o método de pagamento ACH pelo portal Servicing, a coluna auto_pay_types é removida.
📝 Explicação: Este cenário garante que, quando um método de pagamento com autoPay habilitado é excluído, a coluna é atualizada corretamente.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 6 – Verificar a remoção de autoPay ao excluir o método de pagamento CC pelo portal Servicing

Scenario: 6 - Verificar remoção de autoPay ao excluir CC pelo portal Servicing
  Given que o usuário exclui o método de pagamento CC pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para CC
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "CC"
  And verifique no banco de dados que a coluna auto_pay_types não contém "CC"
  And verifique nos logs que a exclusão de CC foi registrada

🔍 Verifique se, ao excluir o método de pagamento CC pelo portal Servicing, a coluna auto_pay_types é removida.
📝 Explicação: Garante que a remoção do método de pagamento com autoPay seja refletida na interface, no banco de dados e nos logs.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "CC" na interface, no banco de dados e nos logs.

--> ERRO
Ao excluir forma de pagamento CC autopay, não é registrado no log alteração no campo autopay
-----

Scenario 7 – Verificar a remoção de autoPay ao excluir método ACH pelo portal Website

Scenario: 7 - Verificar remoção de autoPay ao excluir ACH pelo portal Website
  Given que o usuário exclui o método de pagamento ACH pelo portal Website
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "ACH"
  And verifique no banco de dados que a coluna auto_pay_types não contém "ACH"
  And verifique nos logs que a exclusão de ACH foi registrada

🔍 Verifique se, ao excluir o método de pagamento ACH pelo portal Website, a coluna auto_pay_types é removida.
📝 Explicação: Esse cenário valida a remoção de autoPay quando um método de pagamento é excluído pelo portal Website.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 8 – Verificar a remoção de autoPay ao excluir método CC pelo portal Website

Scenario: 8 - Verificar remoção de autoPay ao excluir CC pelo portal Website
  Given que o usuário exclui o método de pagamento CC pelo portal Website
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para CC
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "CC"
  And verifique no banco de dados que a coluna auto_pay_types não contém "CC"
  And verifique nos logs que a exclusão de CC foi registrada

🔍 Verifique se, ao excluir o método de pagamento CC pelo portal Website, a coluna auto_pay_types é removida.
📝 Explicação: Valida a remoção do tipo de pagamento CC da coluna ao excluir o método de pagamento pelo portal Website.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "CC" na interface, no banco de dados e nos logs.

--> ERRO
Ao excluir forma de pagamento CC autopay, não é registrado no log alteração no campo autopay
-----

Scenario 9 – Verificar a inclusão de autoPay ao adicionar método ACH pelo portal Servicing

Scenario: 9 - Verificar inclusão de autoPay ao adicionar ACH pelo portal Servicing
  Given que o usuário adiciona o método de pagamento ACH pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH"
  And verifique nos logs que a adição de ACH foi registrada

🔍 Verifique se a coluna auto_pay_types inclui "ACH" quando um método de pagamento ACH é adicionado com autoPay habilitado.
📝 Explicação: Este cenário garante que a inclusão do método ACH com autoPay habilitado é refletida na coluna auto_pay_types.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 10 – Verificar a inclusão de autoPay ao adicionar método CC pelo portal Servicing

Scenario: 10 - Verificar inclusão de autoPay ao adicionar CC pelo portal Servicing
  Given que o usuário adiciona o método de pagamento CC pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir CC
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "CC"
  And verifique no banco de dados que a coluna auto_pay_types contém "CC"
  And verifique nos logs que a adição de CC foi registrada

🔍 Verifique se a coluna auto_pay_types inclui "CC" quando um método de pagamento CC é adicionado com autoPay habilitado.
📝 Explicação: Garante que a inclusão do método CC com autoPay habilitado seja refletida na coluna auto_pay_types.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface, no banco de dados e nos logs.

-----

verificar quando tenho mais de uma conta ach e faço a exclusao de uma, como fica o autopay?Se eu excluir a conta autopay true remove a tag? se eu excluir um autopay false mantem?

verificar quando tenho mais de uma conta cc e faço a exclusao de uma, como fica o autopay?Se eu excluir a conta autopay true remove a tag? se eu excluir um autopay false mantem? 

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a interface exibe "NONE" quando não há métodos de pagamento com autoPay habilitado
Verifique se a interface exibe "ACH" quando o método de pagamento ACH com autoPay está habilitado
Verifique se a interface exibe "CC" quando o método de pagamento ACH com autoPay está habilitado
Verifique se a interface exibe tanto "ACH" quanto "CC" quando o "ACH, CC" ou "CC, ACH" é atribuido a auto_pay_types
Verifique que ao excluir o método de pagamento ACH com autopay true, pelo portal Servicing, ACH é removido do campo autopay na interface, da coluna auto_pay_types tabela uown_sv_account no banco de dados e no log é registrado que ACH foi removido
Verifique que ao excluir o método de pagamento CC com autopay true, pelo portal Servicing, CC é removido do campo autopay na interface, da coluna auto_pay_types tabela uown_sv_account no banco de dados e no log é registrado que CC foi removido
Verifique que ao excluir o método de pagamento ACH com autopay true, pelo portal Website, ACH é removido do campo autopay na interface, da coluna auto_pay_types tabela uown_sv_account no banco de dados e no log é registrado que ACH foi removido
Verifique que ao excluir o método de pagamento CC com autopay true, pelo portal Website, CC é removido do campo autopay na interface, da coluna auto_pay_types tabela uown_sv_account no banco de dados e no log é registrado que CC foi removido




Inglês
Check if the interface displays "NONE" when no payment methods have autoPay enabled
Verifique se a interface exibe "NONE" quando nenhum método de pagamento tem autoPay habilitado

Check if the interface displays "ACH" when the ACH payment method with autoPay is enabled
Verifique se a interface exibe "ACH" quando o método de pagamento ACH com autoPay está habilitado

Check if the interface displays "CC" when the CC payment method with autoPay is enabled
Verifique se a interface exibe "CC" quando o método de pagamento CC com autoPay está habilitado

Check if the interface displays both "ACH" and "CC" when "ACH, CC" or "CC, ACH" is assigned to auto_pay_types
Verifique se a interface exibe "ACH" e "CC" quando "ACH, CC" ou "CC, ACH" é atribuído a auto_pay_types

Verify that deleting an ACH payment method with autoPay true via the Servicing portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal
Confirme que ao excluir um método de pagamento ACH com autoPay true pelo portal Servicing, o ACH é removido do campo autopay na interface, da coluna auto_pay_types na tabela uown_sv_account no banco de dados, e o log registra a remoção do ACH

Verify that deleting a CC payment method with autoPay true via the Servicing portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal
Confirme que ao excluir um método de pagamento CC com autoPay true pelo portal Servicing, o CC é removido do campo autopay na interface, da coluna auto_pay_types na tabela uown_sv_account no banco de dados, e o log registra a remoção do CC

Verify that deleting an ACH payment method with autoPay true via the Website portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal
Confirme que ao excluir um método de pagamento ACH com autoPay true pelo portal Website, o ACH é removido do campo autopay na interface, da coluna auto_pay_types na tabela uown_sv_account no banco de dados, e o log registra a remoção do ACH

Verify that deleting a CC payment method with autoPay true via the Website portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal
Confirme que ao excluir um método de pagamento CC com autoPay true pelo portal Website, o CC é removido do campo autopay na interface, da coluna auto_pay_types na tabela uown_sv_account no banco de dados, e o log registra a remoção do CC


Check if the interface displays "NONE" when no payment methods have autoPay enabled
Check if the interface displays "ACH" when the ACH payment method with autoPay is enabled
Check if the interface displays "CC" when the CC payment method with autoPay is enable
Check if the interface displays both "ACH" and "CC" when "ACH, CC" or "CC, ACH" is assigned to auto_pay_types
Verify that deleting an ACH payment method with autoPay true via the Servicing portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal 
Verify that deleting a CC payment method with autoPay true via the Servicing portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal
Verify that deleting an ACH payment method with autoPay true via the Website portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal 
Verify that deleting a CC payment method with autoPay true via the Website portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal 


------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3680 | Progress Mobility | Check if the interface displays "NONE" when no payment methods have autoPay enabled |  | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays "ACH" when the ACH payment method with autoPay is enabled |  | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays "CC" when the CC payment method with autoPay is enabled |  | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays both "ACH" and "CC" when "ACH, CC" or "CC, ACH" is assigned to auto_pay_types |  | PASS |  |
| 3683 | Progress Mobility | Verify that deleting an ACH payment method with autoPay true via the Servicing portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal |  | PASS |  |
| 3685 | Progress Mobility | Verify that deleting a CC payment method with autoPay true via the Servicing portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal |  | WIP | When deleting the CC autopay payment method, no changes to the autopay field are recorded in the log. |
| 3686 | Progress Mobility | Verify that deleting an ACH payment method with autoPay true via the Website portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal |  | PASS |  |
| 3687 | Progress Mobility | Verify that deleting a CC payment method with autoPay true via the Website portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal |  | WIP | When deleting the CC autopay payment method, no changes to the autopay field are recorded in the log. |

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3680 | Progress Mobility | Check if the interface displays "NONE" when no payment methods have autoPay enabled | ![qa1-342-c1_1_](/uploads/0b4c4fd18301393d48a84a58a9cebc68/qa1-342-c1_1_.png){width=1425 height=197}![qa1-342-c1_2_](/uploads/cce9748a46284b1ced36162fc3175270/qa1-342-c1_2_.png){width=1026 height=59}![qa1-342-c1_3_](/uploads/17a8054ddd680ba8cd425cd9a4a8421a/qa1-342-c1_3_.png){width=1425 height=192}![qa1-342-c1_4_](/uploads/ac626e053bee995675fd45ee30fd60c5/qa1-342-c1_4_.png){width=1026 height=59} | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays "ACH" when the ACH payment method with autoPay is enabled | ![qa1-342-c2_1_](/uploads/cb5ce3467852729f142ae142ad285de4/qa1-342-c2_1_.png){width=1419 height=739}![qa1-342-c2_2_](/uploads/cdba3e2826830abeec2acb061e94ae7a/qa1-342-c2_2_.png){width=1028 height=59} | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays "CC" when the CC payment method with autoPay is enabled | ![qa1-342-c3_1_](/uploads/bf45fbb05ccd7081f2dc378f61b48021/qa1-342-c3_1_.png){width=1428 height=233}![qa1-342-c3_2_](/uploads/93dc816a4e3663a1045f6bcebee10a90/qa1-342-c3_2_.png){width=1031 height=60} | PASS |  |
| 3682 | Progress Mobility | Check if the interface displays both "ACH" and "CC" when "ACH, CC" or "CC, ACH" is assigned to auto_pay_types | ![qa1-342-c4_1_](/uploads/b94d0b7434f4ea2bfc75d670ab15b485/qa1-342-c4_1_.png){width=1425 height=224}![qa1-342-c4_2_](/uploads/d1f9b35a2bef9b2fc930c30696c3d859/qa1-342-c4_2_.png){width=1028 height=52}![qa1-342-c4_3_](/uploads/f4b46ac120d34ce6dcb2359de784dfd0/qa1-342-c4_3_.png){width=1419 height=189}![qa1-342-c4_4_](/uploads/110ff7870e59ab02aa594c857d3a58c2/qa1-342-c4_4_.png){width=1027 height=63} | PASS |  |
| 3683 | Progress Mobility | Verify that deleting an ACH payment method with autoPay true via the Servicing portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal | ![qa1-342-c5_1_](/uploads/1b191310d062c71129db9c0c1aa6e205/qa1-342-c5_1_.png){width=1431 height=738}![qa1-342-c5_2_](/uploads/989cabf8467229c57aabcc8d1953133f/qa1-342-c5_2_.png){width=1431 height=738}![qa1-342-c5_3_](/uploads/dd6a87cfcc29a50b70fc57513e5bf12d/qa1-342-c5_3_.png){width=1431 height=201}![qa1-342-c5_4_](/uploads/72bd42ddfb81dfc6d6879930b094b7af/qa1-342-c5_4_.png){width=1026 height=66}![qa1-342-c5_5_](/uploads/1430b462a09eea23cbb19ca9387f1369/qa1-342-c5_5_.png){width=1426 height=281} | PASS |  |
| 3685 | Progress Mobility | Verify that deleting a CC payment method with autoPay true via the Servicing portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal | ![qa1-342-c6_E1___1_](/uploads/be4d348f0c08cde965fceb85436536d5/qa1-342-c6_E1___1_.png){width=1426 height=281}![qa1-342-c6_E1___2_](/uploads/f65cc819f44a4aa6d3604ef9a97f9852/qa1-342-c6_E1___2_.png){width=1426 height=281}![qa1-342-c6_E1___3_](/uploads/8fc117face3d893c84f4505a50f723fb/qa1-342-c6_E1___3_.png){width=1426 height=199}![qa1-342-c6_E1___4_](/uploads/ac3f0243c089ee0f6877411318c167e4/qa1-342-c6_E1___4_.png){width=1028 height=54}![qa1-342-c6_E1___5_](/uploads/b435efc39ed93bec80455f989816040f/qa1-342-c6_E1___5_.png){width=1427 height=282} | WIP | @fernandogmartins When deleting the CC autopay payment method, no changes to the autopay field are recorded in the log. |
| 3686 | Progress Mobility | Verify that deleting an ACH payment method with autoPay true via the Website portal removes ACH from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the ACH removal | ![qa1-342-c7_1_](/uploads/30c71d16855a050a50098178b9ce0bb0/qa1-342-c7_1_.png){width=1427 height=438}![qa1-342-c7_2_](/uploads/1f4e2303d5a822eb94a3ee0012d5962f/qa1-342-c7_2_.png){width=1427 height=729}![qa1-342-c7_3_](/uploads/3aa8b3c43a20b7b0b1b48388e1b1fc3d/qa1-342-c7_3_.png){width=1427 height=741}![qa1-342-c7_4_](/uploads/89a61adcf60197b421931246df13de36/qa1-342-c7_4_.png){width=1026 height=63}![qa1-342-c7_5_](/uploads/13d48e3a5a4781912cac4e5967bbf436/qa1-342-c7_5_.png){width=1434 height=467} | PASS |  |
| 3687 | Progress Mobility | Verify that deleting a CC payment method with autoPay true via the Website portal removes CC from the autopay field in the interface, the auto_pay_types column in the uown_sv_account table, and logs the CC removal | ![qa1-342-c8_E1___1_](/uploads/fee3d0882cc021d278b83ceb35bc5991/qa1-342-c8_E1___1_.png){width=1434 height=467}![qa1-342-c8_E1___2_](/uploads/832d77f25baffa75e0665c957b6f5e65/qa1-342-c8_E1___2_.png){width=1434 height=737}![qa1-342-c8_E1___3_](/uploads/8c60798d8f6336d13fd2babf58f45ce8/qa1-342-c8_E1___3_.png){width=1434 height=737}![qa1-342-c8_E1___4_](/uploads/850aadf86551ecec4aad683f8d4257eb/qa1-342-c8_E1___4_.png){width=1028 height=63}![qa1-342-c8_E1___5_](/uploads/8f630f886df0f789a2cca932a9734a7e/qa1-342-c8_E1___5_.png){width=1433 height=300}![qa1-342-c8_E1___6_](/uploads/697934157a977538594ccb36953deda6/qa1-342-c8_E1___6_.png){width=1418 height=742} | WIP | @fernandogmartins When deleting the CC autopay payment method, no changes to the autopay field are recorded in the log. |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Teste o fluxo completo de exclusão e adição de nova conta bancária e cartões de crédito. Deve exibir os logs se um método de pagamento autoPay foi alterado, 
mas não deve exibir se o método excluído/adicionado não tem autoPay=true.
Resultados Esperados:

Alterações de CC devem ser exibidas corretamente nos logs agora.
NONE deve aparecer apenas quando alterado para outro valor, nunca ao lado de outro valor.
CC/ACH que não possui pagamento automático não deve acionar a criação de log para alteração de pagamento automático.
Se por algum motivo os valores de autopay definidos nas informações de atendimento não corresponderem ao CC/ACH ativo (foi alterado manualmente, por exemplo), 
após fazer uma alteração (excluir/criar), deve acionar a alteração de log no caso:

informações de atendimento têm ACH/CC, mas não há ACH/CC com pagamento automático:

Os casos mencionados permanecem os mesmos, mas os logs para cartão de crédito serão diferentes:
Exemplos:

Adicionando CC (autoPay=true) a uma conta sem métodos autoPay:
Excluindo CC (autoPay=true):
Adicionando ACH (autoPay=true) em uma conta sem métodos de pagamento automático:
Adicionando ACH (autoPay=false) em uma conta sem métodos de pagamento automático:

Deve exibir um log para o ACH adicionado, mas não um log para alteração de autoPay


Adicionando ACH (autoPay=true) a uma conta com um CC existente:

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


🧪 Cenários de Teste Gherkin


Scenario 1 – Verificar a coluna auto_pay_types quando não há método de pagamento com autoPay habilitado

Scenario: 1 - Verificar coluna auto_pay_types com autoPay desabilitado
  Given que o usuário acessa a tabela uown_sv_account
  When não existe um método de pagamento com autoPay habilitado
  Then a coluna auto_pay_types deve ser definida como NONE
  And verifique na interface que o valor exibido em AutoPay é "NONE"
  And verifique no banco de dados que a coluna auto_pay_types contém "NONE"

🔍 Verifique se a coluna auto_pay_types exibe "NONE" quando não há métodos de pagamento com autoPay habilitado.
📝 Explicação: Este cenário testa o comportamento quando não há nenhum método de pagamento com autoPay ativo.
✅ Resultado Esperado: A coluna auto_pay_types mostra "NONE" na interface, no banco de dados e nos logs.

qa1:
8745
-----

Scenario 2 – Verificar a coluna auto_pay_types com ACH e autoPay habilitado

Scenario: 2 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When ACH é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "ACH"

🔍 Verifique se a coluna auto_pay_types mostra "ACH" quando o ACH é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay ACH quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH" na interface

-----

Scenario 3 – Verificar a coluna auto_pay_types com cartão de crédito e autoPay habilitado

Scenario: 3 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When CC é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "CC"

🔍 Verifique se a coluna auto_pay_types mostra "CC" quando o CC é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay CC quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface

-----

Scenario 4 – Verificar a coluna auto_pay_types com ACH e cartão de crédito com autoPay habilitado

Scenario: 4 - Verificar coluna auto_pay_types com ACH e CC com autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When "ACH, CC" ou "CC, ACH" é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "ACH, CC" ou "CC, ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH, CC" ou "CC, ACH"

🔍 Verifique se a coluna auto_pay_types exibe tanto "ACH" quanto "CC" quando o "ACH, CC" ou "CC, ACH" é atribuido a auto_pay_types.
📝 Explicação: Este cenário valida exibição de autopay "ACH, CC" ou "CC, ACH" quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH, CC" ou "CC, ACH" na interface.


Scenario 3 – Verificar a coluna auto_pay_types com cartão de crédito e autoPay habilitado

Scenario: 2 - Verificar coluna auto_pay_types com ACH e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When CC é atribuido a coluna auto_pay_types
  Then na interface o valor exibido na coluna auto_pay_types é "CC"

🔍 Verifique se a coluna auto_pay_types mostra "CC" quando o CC é atribuido a auto_pay_types.
📝 Explicação: Este cenário testa a exibição de autopay CC quando manipulado o banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface
-----

Scenario 5 – Verificar a remoção de autoPay ao excluir o método de pagamento ACH pelo portal Servicing

Scenario: 5 - Verificar remoção de autoPay ao excluir ACH pelo portal Servicing
  Given que o usuário exclui o método de pagamento ACH pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "ACH"
  And verifique no banco de dados que a coluna auto_pay_types não contém "ACH"
  And verifique nos logs que a exclusão de ACH foi registrada

🔍 Verifique se, ao excluir o método de pagamento ACH pelo portal Servicing, a coluna auto_pay_types é removida.
📝 Explicação: Este cenário garante que, quando um método de pagamento com autoPay habilitado é excluído, a coluna é atualizada corretamente.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 6 – Verificar a remoção de autoPay ao excluir o método de pagamento CC pelo portal Servicing

Scenario: 6 - Verificar remoção de autoPay ao excluir CC pelo portal Servicing
  Given que o usuário exclui o método de pagamento CC pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para CC
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "CC"
  And verifique no banco de dados que a coluna auto_pay_types não contém "CC"
  And verifique nos logs que a exclusão de CC foi registrada

🔍 Verifique se, ao excluir o método de pagamento CC pelo portal Servicing, a coluna auto_pay_types é removida.
📝 Explicação: Garante que a remoção do método de pagamento com autoPay seja refletida na interface, no banco de dados e nos logs.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "CC" na interface, no banco de dados e nos logs.

--> ERRO
Ao excluir forma de pagamento CC autopay, não é registrado no log alteração no campo autopay
-----

Scenario 7 – Verificar a remoção de autoPay ao excluir método ACH pelo portal Website

Scenario: 7 - Verificar remoção de autoPay ao excluir ACH pelo portal Website
  Given que o usuário exclui o método de pagamento ACH pelo portal Website
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "ACH"
  And verifique no banco de dados que a coluna auto_pay_types não contém "ACH"
  And verifique nos logs que a exclusão de ACH foi registrada

🔍 Verifique se, ao excluir o método de pagamento ACH pelo portal Website, a coluna auto_pay_types é removida.
📝 Explicação: Esse cenário valida a remoção de autoPay quando um método de pagamento é excluído pelo portal Website.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 8 – Verificar a remoção de autoPay ao excluir método CC pelo portal Website

Scenario: 8 - Verificar remoção de autoPay ao excluir CC pelo portal Website
  Given que o usuário exclui o método de pagamento CC pelo portal Website
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para CC
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "CC"
  And verifique no banco de dados que a coluna auto_pay_types não contém "CC"
  And verifique nos logs que a exclusão de CC foi registrada

🔍 Verifique se, ao excluir o método de pagamento CC pelo portal Website, a coluna auto_pay_types é removida.
📝 Explicação: Valida a remoção do tipo de pagamento CC da coluna ao excluir o método de pagamento pelo portal Website.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "CC" na interface, no banco de dados e nos logs.

--> ERRO
Ao excluir forma de pagamento CC autopay, não é registrado no log alteração no campo autopay
-----

Scenario 9 – Verificar a inclusão de autoPay ao adicionar método ACH pelo portal Servicing

Scenario: 9 - Verificar inclusão de autoPay ao adicionar ACH pelo portal Servicing
  Given que o usuário adiciona o método de pagamento ACH pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH"
  And verifique nos logs que a adição de ACH foi registrada

🔍 Verifique se a coluna auto_pay_types inclui "ACH" quando um método de pagamento ACH é adicionado com autoPay habilitado.
📝 Explicação: Este cenário garante que a inclusão do método ACH com autoPay habilitado é refletida na coluna auto_pay_types.
✅ Resultado Esperado: A coluna auto_pay_types exibe "ACH" na interface, no banco de dados e nos logs.

-----

Scenario 10 – Verificar a inclusão de autoPay ao adicionar método CC pelo portal Servicing

Scenario: 10 - Verificar inclusão de autoPay ao adicionar CC pelo portal Servicing
  Given que o usuário adiciona o método de pagamento CC pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir CC
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "CC"
  And verifique no banco de dados que a coluna auto_pay_types contém "CC"
  And verifique nos logs que a adição de CC foi registrada

🔍 Verifique se a coluna auto_pay_types inclui "CC" quando um método de pagamento CC é adicionado com autoPay habilitado.
📝 Explicação: Garante que a inclusão do método CC com autoPay habilitado seja refletida na coluna auto_pay_types.
✅ Resultado Esperado: A coluna auto_pay_types exibe "CC" na interface, no banco de dados e nos logs.

-----

Scenario 11 – Verificar se a exclusão de CC (autoPay=true) cria o log de alteração no autoPay

Scenario: 11 - Verificar se a exclusão de CC (autoPay=true) cria o log de alteração no autoPay
  Given que o usuário exclui o método de pagamento CC com autoPay habilitado pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser removida para CC
  And verifique na interface que o valor exibido na coluna auto_pay_types não contém "CC"
  And verifique no banco de dados que a coluna auto_pay_types não contém "CC"
  And verifique nos logs que a exclusão de CC com autoPay habilitado foi registrada

🔍 Verifique se a exclusão de CC com autoPay habilitado cria o log de alteração no autoPay e remove corretamente o método de pagamento no banco de dados e na interface.
📝 Explicação: Este cenário valida que a exclusão do CC com autoPay habilitado resulta na criação de um log de alteração e que o método de pagamento é removido da interface e do banco de dados.
✅ Resultado Esperado: A coluna auto_pay_types não exibe "CC", e a exclusão é registrada nos logs.

-----

Scenario 12 – Verificar se a adição de CC (autoPay=true) a uma conta sem métodos autoPay cria o log de alteração no autoPay

Scenario: 12 - Verificar se a adição de CC (autoPay=true) a uma conta sem métodos autoPay cria o log de alteração no autoPay
  Given que o usuário adiciona o método de pagamento CC com autoPay habilitado pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir CC
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "CC"
  And verifique no banco de dados que a coluna auto_pay_types contém "CC"
  And verifique nos logs que a adição de CC com autoPay habilitado foi registrada

🔍 Verifique se a adição de CC com autoPay habilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface.
📝 Explicação: Este cenário valida que a adição de CC com autoPay habilitado a uma conta sem métodos autoPay existentes cria o log e reflete a adição no banco de dados e na interface.
✅ Resultado Esperado: A coluna auto_pay_types inclui "CC", e a adição é registrada nos logs.

-----

Scenario 13 – Verificar se a adição de ACH (autoPay=true) a uma conta sem métodos de pagamento automático cria o log de alteração no autoPay

Scenario: 13 - Verificar se a adição de ACH (autoPay=true) a uma conta sem métodos de pagamento automático cria o log de alteração no autoPay
  Given que o usuário adiciona o método de pagamento ACH com autoPay habilitado pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH"
  And verifique nos logs que a adição de ACH com autoPay habilitado foi registrada

🔍 Verifique se a adição de ACH com autoPay habilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface.
📝 Explicação: Este cenário valida que a adição de ACH com autoPay habilitado a uma conta sem métodos de pagamento automático existentes cria o log e reflete a adição no banco de dados e na interface.
✅ Resultado Esperado: A coluna auto_pay_types inclui "ACH", e a adição é registrada nos logs.

-----

Scenario 14 – Verificar se a adição de ACH (autoPay=false) a uma conta sem métodos de pagamento automático cria o log de alteração no autoPay,

Scenario: 14 - Verificar se a adição de ACH (autoPay=false) a uma conta sem métodos de pagamento automático cria o log de alteração no autoPay
  Given que o usuário adiciona o método de pagamento ACH com autoPay desabilitado pelo portal Servicing
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve incluir ACH
  And verifique na interface que o valor exibido na coluna auto_pay_types inclui "ACH"
  And verifique no banco de dados que a coluna auto_pay_types contém "ACH"
  And verifique nos logs que a adição de ACH com autoPay desabilitado foi registrada

🔍 Verifique se a adição de ACH com autoPay desabilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface.
📝 Explicação: Este cenário valida que a adição de ACH com autoPay desabilitado a uma conta sem métodos de pagamento automático existentes cria o log e reflete a adição no banco de dados e na interface.
✅ Resultado Esperado: A coluna auto_pay_types inclui "ACH", e a adição é registrada nos logs, mas sem autoPay habilitado.

-----

Scenario 15 – Verificar a remoção de ACH ou CC do autoPay pelo agente e a atualização das opções de autoPay na interface

Scenario: 15 - Verificar a remoção de ACH ou CC do autoPay pelo agente e a atualização das opções de autoPay na interface
  Given que o agente acessa a página de informações de serviço no portal Servicing
  And o agente remove o autoPay ACH das informações de serviço a pedido do cliente
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve exibir "CC" se o CC estiver no autoPay ou "NONE" se não houver CC no autoPay
  And verifique na interface que o valor exibido em autoPay é "CC" ou "NONE" conforme o caso
  And verifique no banco de dados que a coluna auto_pay_types reflete corretamente a remoção de ACH e a adição ou não de CC
  And verifique nos logs que a remoção do autoPay ACH e a alteração de autoPay foram registradas corretamente
  When o agente remove o autoPay CC das informações de serviço a pedido do cliente
  Then a coluna auto_pay_types deve exibir "ACH" se o ACH estiver no autoPay ou "NONE" se não houver ACH no autoPay
  And verifique na interface que o valor exibido em autoPay é "ACH" ou "NONE" conforme o caso
  And verifique no banco de dados que a coluna auto_pay_types reflete corretamente a remoção de CC e a adição ou não de ACH
  And verifique nos logs que a remoção do autoPay CC e a alteração de autoPay foram registradas corretamente
  Given que não há ACH ou CC no autoPay cadastrado
  When o agente tenta editar as informações de serviço
  Then as opções de ACH ou CC no autoPay não devem ser editáveis
  And verifique na interface que os campos de ACH ou CC no autoPay não podem ser selecionados
  And verifique nos logs que nenhuma alteração foi registrada para o campo autoPay

🔍 Verifique se, ao remover ou adicionar ACH ou CC no autoPay, a interface reflete corretamente a atualização, o banco de dados contém as alterações e os logs registram corretamente as modificações realizadas pelo agente.
📝 Explicação: Este cenário agora valida não apenas a interface e o banco de dados, mas também garante que as alterações no autoPay sejam registradas corretamente nos logs, seja para remoção ou adição de ACH ou CC. Também valida a não edição das opções de autoPay quando nenhum método de pagamento está registrado.
✅ Resultado Esperado:
* As informações bancárias são atualizadas corretamente no banco de dados e na interface.
* Os logs de remoção ou adição de ACH ou CC no autoPay são registrados corretamente.
* Quando não há ACH ou CC no autoPay, as opções no Portal de Servicing não podem ser editadas e não são registradas alterações nos logs.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao remover ou adicionar ACH ou CC no autoPay pelo agente, a interface, o banco de dados e os logs são atualizados corretamente, 
refletindo as modificações realizadas e garantindo que nenhuma alteração seja registrada quando não houver métodos de pagamento no autoPay.

-----

🧾 Resumo dos Requisitos e Cenários

Requisito	Cenário(s) que cobre
Adicionar e remover métodos de pagamento com autoPay, gerando logs para alterações de autoPay	11, 12, 13, 14, 15
Exibir informações de autoPay quando o método de pagamento está ativado e ocultá-las quando desativado	11, 12, 13, 14
Validar a criação de logs de alteração no autoPay	11, 12, 13, 14, 15
Garantir que CC ou ACH com autoPay desabilitado não acionem logs de alteração de autoPay	14

-----

Verifique se a exclusão de CC com autoPay habilitado cria o log de alteração no autoPay e remove corretamente o método de pagamento no banco de dados e na interface
Verify if deleting CC with autoPay enabled creates a change log in autoPay and correctly removes the payment method in the database and interface

Verifique se a adição de CC com autoPay habilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface
Verify if adding CC with autoPay enabled creates a change log in autoPay and correctly adds the payment method in the database and interface

Verifique se a adição de ACH com autoPay habilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface
Verify if adding ACH with autoPay enabled creates a change log in autoPay and correctly adds the payment method in the database and interface

Verifique se a adição de ACH com autoPay desabilitado cria um log de alteração no autoPay e adiciona corretamente o método de pagamento no banco de dados e na interface
Verify if adding ACH with autoPay disabled creates a change log in autoPay and correctly adds the payment method in the database and interface

Verifique se, ao remover ou adicionar ACH ou CC no autoPay, a interface reflete corretamente a atualização, o banco de dados contém as alterações e os logs registram corretamente as modificações realizadas
Verify if, when removing or adding ACH or CC in autoPay, the interface correctly reflects the update, the database contains the changes, and the logs correctly record the modifications made

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3829 | Progress Mobility | Verify if deleting CC with autoPay enabled creates a change log in autoPay and correctly removes the payment method in the database and interface |  | PASS |
| 3829 | Progress Mobility | Verify if adding CC with autoPay enabled creates a change log in autoPay and correctly adds the payment method in the database and interface |  | PASS |
| 3829 | Progress Mobility | Verify if adding ACH with autoPay enabled creates a change log in autoPay and correctly adds the payment method in the database and interface |  | PASS |
| 3829 | Progress Mobility | Verify if adding ACH with autoPay disabled creates a change log in autoPay and correctly adds the payment method in the database and interface |  | PASS |
| 3829 | Progress Mobility | Verify if, when removing or adding ACH or CC in autoPay, the interface correctly reflects the update, the database contains the changes, and the logs correctly record the modifications made |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Scenario 1 – Verificar a exibição e alteração da coluna auto_pay_types com ACH ou CC e autoPay habilitado
Objetivo: Verificar a correta exibição e alteração da coluna auto_pay_types na interface, banco de dados e logs ao adicionar ou remover métodos de pagamento (ACH/CC) com autoPay habilitado.

Scenario Outline: Verificar a exibição e alteração da coluna auto_pay_types com ACH ou CC e autoPay habilitado
  Given que o usuário acessa a tabela uown_sv_account
  When o método de pagamento "<payment_method>" com autoPay "<autoPay_status>" é <action> no sistema
  Then a coluna auto_pay_types deve ser "<expected_auto_pay_types>"
  And verifique na interface que o valor exibido na coluna auto_pay_types é "<expected_auto_pay_types>"
  And verifique no banco de dados que a coluna auto_pay_types contém "<expected_auto_pay_types>"
  And verifique nos logs que a ação foi registrada como "<log_action>"

Examples:
  | payment_method | autoPay_status | action    | expected_auto_pay_types | log_action                    |
  | ACH            | true           | adicionado | ACH                       | ACH exibido no painel Autopay  |
  | CC             | true           | adicionado | CC                        | CC com autoPay habilitado    |
  | ACH            | false          | adicionado | ACH                       | ACH com autoPay desabilitado |
  | CC             | false          | adicionado | CC                        | CC com autoPay desabilitado  |
  | ACH            | true           | removido   | NONE                      | Remoção de ACH com autoPay   |
  | CC             | true           | removido   | NONE                      | Remoção de CC com autoPay    |

🔍 Verifique se, ao adicionar ou remover ACH/CC com autoPay habilitado ou desabilitado, a coluna auto_pay_types é corretamente atualizada, e se os logs e banco de dados refletem a alteração corretamente
📝 Explicação: Este cenário usa Scenario Outline para validar a adição e remoção de ACH/CC com autoPay habilitado ou desabilitado. A interface, banco de dados e logs são verificados.
✅ Resultado Esperado: A coluna auto_pay_types será corretamente atualizada na interface, banco de dados e logs.

-----

Scenario 2 - Verificar a inclusão e exclusão de ACH ou CC com autoPay habilitado e a geração de log de alteração

Scenario Outline: Verificar a inclusão e exclusão de ACH ou CC com autoPay habilitado e geração do log de alteração
  Given que o usuário realiza a ação "<action>" do método de pagamento "<payment_method>" com autoPay "<autoPay_status>" pelo "<portal>"
  When o banco de dados e a interface são acessados
  Then a coluna auto_pay_types deve ser "<expected_auto_pay_types>"
  And verifique na interface que o valor exibido na coluna auto_pay_types é "<expected_auto_pay_types>"
  And verifique no banco de dados que a coluna auto_pay_types contém "<expected_auto_pay_types>"
  And verifique nos logs que a ação de "<action>" de "<payment_method>" com autoPay "<autoPay_status>" foi registrada

Examples:
  | action    | payment_method | autoPay_status | portal   | expected_auto_pay_types |
  | adicionado | ACH            | true           | Servicing | ACH                       |
  | adicionado | CC             | true           | Servicing | CC                        |
  | adicionado | ACH            | true           | Website   | ACH                       |
  | adicionado | CC             | true           | Website   | CC                        |
  | removido   | ACH            | true           | Servicing | NONE                      |
  | removido   | CC             | true           | Servicing | NONE                      |
  | removido   | ACH            | true           | Website   | NONE                      |
  | removido   | CC             | true           | Website   | NONE                      |

🔍 Verifique se, ao adicionar ou remover ACH ou CC manualmente do painel Autopay e se os logs e banco de dados refletem a alteração corretamente
📝 Explicação: Este cenário usa Scenario Outline para testar tanto a adição quanto a remoção de ACH/CC com autoPay habilitado. A interface, banco de dados e logs são verificados para cada ação.
✅ Resultado Esperado: A coluna auto_pay_types será corretamente atualizada na interface, banco de dados e logs, dependendo da ação (adição ou remoção) realizada.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao adicionar ou remover ACH ou CC com autoPay habilitado pelo agente, a interface, o banco de dados e os logs são atualizados corretamente, refletindo as modificações realizadas.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao adicionar ou remover ACH/CC com autoPay habilitado ou desabilitado, a coluna auto_pay_types é corretamente atualizada, e se os logs e banco de dados refletem a alteração corretamente
Verifique se, ao adicionar ou remover ACH ou CC manualmente do painel Autopay e se os logs e banco de dados refletem a alteração corretamente

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206269 | Progress Mobility | Verify if deleting CC with autoPay enabled creates a change log in autoPay and correctly removes the payment method in the database and interface |  | PASS |
| 206269 | Progress Mobility | Verify if adding CC with autoPay enabled creates a change log in autoPay and correctly adds the payment method in the database and interface |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------