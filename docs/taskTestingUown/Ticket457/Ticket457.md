--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/457

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Exibir status do item no Servicing
Melhore a seção de Histórico de Itens Comprados no Portal de Servicing para garantir um melhor acompanhamento dos itens, 
incluindo a visibilidade do status e as atualizações corretas quando uma fatura for cancelada após a criação da conta.

Solicitação de Recurso | Requisitos de Negócio
Lista de Funcionalidades / Requisitos a serem implementados pela Equipe de Desenvolvimento:

O serviço do BE deve retornar todos os itens, independentemente do status.
Atualizar os itens no Servicing quando uma fatura do lead for cancelada após a criação da conta 
(quando account_pk em los_lead não for nulo).
Exibir o status do item no FE.

Sowjanya Kaligineedi @skaligineedi

Atualmente, quando um lead com uma conta existente é cancelado, os itens não estão sendo atualizados como 'cancelados' 
no lado da conta. Para resolver isso, faça as seguintes alterações:

Substituir a chamada cancelAccountService.cancelAccountForLead pela updateAccountForLead(losLead, false)
na linha 554 do UownClient.
Modificar o método em LeadInfo para incluir LeadStatus.UW_APPROVED, 
pois esse será o status do lead quando todos os itens forem cancelados. 
Verifique onde isso é usado em AccountInfo e entenda por que essa alteração é necessária. 
Se houver dúvidas, nos avise. As alterações 1 e 2 garantirão que os itens sejam atualizados no lado do Servicing.
Após isso, atualizar getAccountSummary no SvAccountService (linha 612) para buscar todos os itens, 
em vez de apenas os não cancelados. Assim, teremos visibilidade de todos os itens também no lado do Servicing.

--------------------------

PASSOS PARA REPRODUZIR
- Criar um lead.
- Concluir o processo de assinatura → enviar para financiamento (o que cria uma conta).
- Realizar a modificação do contrato de leasing → excluir todos os itens, o que aciona o cancelamento do lead e da conta.
Verificar se:
- O status do lead está em UW_APPROVED.
- O status da conta está como "cancelado".
- A tela de Servicing exibe todos os itens e seus respectivos status (cancelado, neste caso).

SELECT ull.lead_status, usa.account_status, usa.pk AS Account_PK, * 
FROM uown_los_lead ull
INNER JOIN uown_sv_account usa ON usa.pk = ull.account_pk
WHERE ull.pk = (use the account key);

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: UOWN Servicing - Exibir status e quantidade de itens em Purchased Items History

  # 1. Verificar atualização dos status após cancelamento total
  Scenario: Verificar atualização dos status do lead e da conta após cancelamento total da fatura
    Given que um lead foi criado e o processo de assinatura foi concluído, enviando para financiamento
    When o contrato de leasing for modificado para excluir todos os itens, acionando o cancelamento do lead e da conta
    Then o status do lead deve estar como "UW_APPROVED"
    And o status da conta deve estar como "cancelado"
    And o banco de dados deve refletir que o lead possui status "UW_APPROVED" e a conta está "cancelada"

Verificar atualização dos status do lead e da conta após cancelamento total da fatura
Resumo:
Valida que, após o cancelamento total da fatura (ou seja, todos os itens cancelados), o status do lead seja atualizado para "UW_APPROVED" e o status da conta para "cancelado".
---------------------------------------------

  # 2. Verificar exibição de todos os itens no Servicing após cancelamento total
  Scenario: Verificar que a tela de Servicing exibe todos os itens com seus respectivos status após cancelamento total
    Given que um lead com conta existente teve sua fatura cancelada e todos os itens foram atualizados para "cancelado"
    When o usuário acessar o portal de Servicing
    Then a tela de Purchased Items History deve exibir todos os itens com status "cancelado"
    And o banco de dados deve confirmar que todos os itens possuem status "cancelado"

Verificar exibição de todos os itens no Servicing após cancelamento total
Resumo:
Confirma que, quando todos os itens são cancelados, a tela de Servicing (Purchased Items History) exibe todos os itens com o status "cancelado", garantindo que nenhum item fique oculto.
---------------------------------------------

  # 3. Verificar atualização parcial dos status após cancelamento de alguns itens
  Scenario: Verificar atualização dos status dos itens cancelados e não cancelados em Purchased Items History
    Given que um lead com conta existente possui múltiplos itens comprados
    When o usuário cancelar apenas alguns dos itens do contrato de leasing
    Then os itens cancelados devem exibir o status "cancelado"
    And os itens não cancelados devem manter o status "active"
    And a quantidade total de Items Purchased deve refletir a redução dos itens cancelados
    And o banco de dados deve registrar a atualização dos status para os itens cancelados e ativos

Verificar atualização dos status dos itens cancelados e não cancelados em Purchased Items History
Resumo:
Testa o cenário de cancelamento parcial: ao cancelar apenas alguns itens, os itens cancelados devem apresentar o status "cancelado", enquanto os itens que permanecem ativos devem manter o status "active". Além disso, a quantidade total de itens exibidos deve refletir essa alteração.
---------------------------------------------

  # 4. Verificar adição de itens em invoice existente com status ADDED_TO_CART
  Scenario: Verificar que a adição de novos itens atualiza a quantidade e exibe os itens com status "ADDED_TO_CART" mantendo o status "active"
    Given que um lead com conta existente possui uma invoice já criada com itens comprados
    When o usuário adicionar novos itens à invoice
    Then a quantidade de Items Purchased no Servicing deve aumentar
    And os itens adicionados devem ser apresentados na Purchased Items History com status "ADDED_TO_CART" e o status geral dos itens deve permanecer "active"
    And o banco de dados deve refletir o aumento na quantidade e o status "ADDED_TO_CART" para os novos itens

Verificar que a adição de novos itens atualiza a quantidade e exibe os itens com status "ADDED_TO_CART" mantendo o status "active"
Resumo:
Valida que, ao adicionar novos itens a uma invoice já existente, a quantidade total de Items Purchased aumenta. Os itens recém-adicionados devem aparecer na Purchased Items History com o status "ADDED_TO_CART", e o status geral dos itens ativos deve permanecer "active".
---------------------------------------------

  # 5. Verificar atualização de quantidade após cancelamento parcial
  Scenario: Verificar que o cancelamento parcial de itens reduz a quantidade de Items Purchased
    Given que um lead possui vários itens na invoice
    When o usuário cancelar alguns desses itens
    Then a quantidade exibida em Items Purchased deve diminuir proporcionalmente ao número de itens cancelados
    And o banco de dados deve mostrar a quantidade correta de itens restantes

Verificar atualização de quantidade após cancelamento parcial
Resumo:
Garante que, quando apenas parte dos itens é cancelada, a quantidade exibida em Items Purchased diminui proporcionalmente ao número de itens cancelados.

**A quantidade de itens não foi reduzida, ao contrário, dobrou ao considerar o item cancelado. Inicialmente, 
havia 2 itens, e após o cancelamento de um deles, a quantidade exibida foi 4 em vez de 1.**
---------------------------------------------

  # 6. Verificar atualização de quantidade após adição de itens
  Scenario: Verificar que a adição de itens incrementa a quantidade de Items Purchased
    Given que um lead possui uma invoice com uma quantidade inicial de itens comprados
    When o usuário adicionar mais itens à invoice
    Then a quantidade exibida em Items Purchased deve aumentar de acordo com o número de itens adicionados
    And o banco de dados deve confirmar o incremento na quantidade de itens

Verificar atualização de quantidade após adição de itens
Resumo:
Confirma que, ao adicionar itens a uma invoice, a quantidade exibida em Items Purchased aumenta de acordo com o número de itens adicionados.
---------------------------------------------    

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao excluir todos os itens de um contrato de leasing, o status do lead é atualizado para "UW_APPROVED" e da conta para "cancelado", refletido no banco de dados.
Verify that deleting all items from a lease contract updates the lead status to "UW_APPROVED" and account status to "canceled," reflected in the database.

Verifique se, ao cancelar a fatura de um lead com conta existente, todos os itens aparecem como "cancelado" na tela Purchased Items History e no banco de dados.
Verify that canceling an invoice for a lead with an existing account marks all items as "canceled" in the Purchased Items History screen and database.

Verifique se, ao cancelar alguns itens do contrato, os cancelados mostram "cancelado" e os não cancelados mantêm "added to cart".
Verify that canceling some contract items shows them as "canceled," while non-canceled items keep "added to cart."

Verifique se, ao adicionar itens à invoice, a quantidade de Items Purchased aumenta corretamente e o banco de dados registra a mudança.
Verify that adding items to an invoice correctly increases the Items Purchased quantity, updated in the database.

Verifique se, ao excluir todos os itens da invoice exceto um, a quantidade de itens permanece e os excluídos aparecem como "CANCELLED".
Verify that deleting all invoice items except one keeps the item count, with deleted items shown as "CANCELLED."

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that deleting all items from a lease contract updates the lead status to "UW_APPROVED" and account status to "canceled," reflected in the database. |  | PASS |
| X | X | Verify that canceling an invoice for a lead with an existing account marks all items as "canceled" in the Purchased Items History screen and database. |  | PASS |
| X | X | Verify that canceling some contract items shows them as "canceled," while non-canceled items keep "added to cart." |  | PASS |
| X | X | Verify that adding items to an invoice correctly increases the Items Purchased quantity, updated in the database. |  | PASS |
| X | X | Verify that deleting all invoice items except one keeps the item count, with deleted items shown as "CANCELLED." |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging 

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206042 | Tire Agent | Verify that deleting all items from a lease contract updates the lead status to "UW_APPROVED" and account status to "canceled," reflected in the database. |  | PASS |
| 206042 | Tire Agent | Verify that canceling an invoice for a lead with an existing account marks all items as "canceled" in the Purchased Items History screen and database. |  | PASS |
| 206043 | Progress Mobility | Verify that canceling some contract items shows them as "canceled," while non-canceled items keep "added to cart." |  | PASS |
| 206044 | Tire Agent | Verify that adding items to an invoice correctly increases the Items Purchased quantity, updated in the database. |  | PASS |
| 206045 | Tire Agent | Verify that deleting all invoice items except one keeps the item count, with deleted items shown as "CANCELLED." |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------