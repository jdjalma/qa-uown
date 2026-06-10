------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/322

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | ChannelPayments | Implementar manipulador de repetição idempotente para garantir a resiliência a falhas

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Sinopse
Atualmente, 504 erros de tempo limite no Channel Payments dificultam a determinação de se uma transação foi processada com sucesso. 
Embora as chaves de idempotência tenham sido implementadas na versão mais recente para rastrear tentativas de transação, 
o sistema ainda não possui um processo automatizado para verificar e atualizar transações que foram cronometradas anteriormente.
Para aumentar a resiliência a falhas, uma varredura de pós-processamento automatizada precisa ser implementada. 
Este processo será executado após a varredura da manhã (pós 7 AM) para verificar se há transações que cronometraram e atualizar seus status de acordo.

Objetivo Empresarial
Certifique-se de que as transações que falharam devido a tempos limite sejam reprocessadas ou sinalizadas corretamente com segurança.

Pedido de Funcionalidades | Requisitos de Negócio


Automatize a Verificação da Transação Após a Varredura Matinal (Post 7 AM):
      Implementar um processo agendado para identifique transações que foram cronometradas anteriormente.
      Use o chave idempotência para verificar se a transação foi processada pela Channel Payments.
      Atualize o status da transação no banco de dados de acordo.

Priyanka Namburu @pnamburu
Implementado varredura "idempotentCCSweep" para executar todos os dias às 11 AM para

escolha todas as CCTransactions com CCAction 'SALE' e data de postagem de hoje com "timeout" ou "Um erro ocorreu" na coluna gatewayResponse
Reinicie todas essas transações (reenvie-as para o ChannelPayments) usando idempotencyKey para sabermos se elas foram NEGADAS ou APROVADAS
Instruções de Teste

Escolha qualquer conta que tenha aprovado ou NEGADO ou ERRO CCTransações do tipo SALE.
Atualize a resposta do gateway no DB para conter a palavra "timeout"
Execute essa consulta para garantir que a varredura escolha algumas transações
selecione cct.* de uown_sv_credit_card_transaction cct onde posting_date >= CURRENT_DATE-1 e cc_action = 'SALE' e (gateway_response ilike '%An Error Occured%' ou gateway_response ilike '%timeout%') e vendedor = 'CHANNEL_PAYMENTS_CC'

Varredura de gatilho /uown/svc/triggerScheduledTask/idempotentCCSweep
Verifique a tabela sweep_log para garantir que a varredura seja acionada
Verifique a tabela CCTransaction para certificar-se de que a resposta do gateway é atualizada para APPROVED ou DENIED ou ERROR (mas não deve ter tempo limite)
Se for APROVADO, ele deve criar um pagamento na tabela sv_payment para esse cc_pk      

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Passos para testar a funcionalidade:
1️⃣ Escolher uma conta com transações relevantes
📌 Ação: Identifique uma conta que possua transações de cartão de crédito (CCTransactions) com cc_action = 'SALE' e status APPROVED, DENIED ou ERROR.
📌 Consulta SQL para encontrar contas relevantes:

sql:
SELECT *
FROM uown_sv_credit_card_transaction
WHERE cc_action = 'SALE'
AND status IN ('APPROVED', 'DENIED', 'ERROR')
AND vendor = 'CHANNEL_PAYMENTS_CC';

Se a conta não existir, crie uma transação fictícia para teste.


2️⃣ Simular um erro alterando a resposta do gateway
📌 Ação: Atualize o banco de dados para inserir um erro simulado na resposta do gateway da transação.
📌 Consulta SQL para simular erro "timeout":

sql:
UPDATE uown_sv_credit_card_transaction
SET gateway_response = 'timeout'
WHERE cc_action = 'SALE'
AND vendor = 'CHANNEL_PAYMENTS_CC'
AND posting_date >= CURRENT_DATE - 1;

Isso força a transação a ser reconsiderada pela varredura.



3️⃣ Garantir que a varredura vai pegar essas transações
📌 Ação: Execute a seguinte consulta para verificar se a varredura irá processar as transações com erro.
📌 Consulta SQL para confirmar se as transações serão varridas:

sql:
SELECT *
FROM uown_sv_credit_card_transaction
WHERE posting_date >= CURRENT_DATE - 1
AND cc_action = 'SALE'
AND (gateway_response ILIKE '%An Error Occurred%' OR gateway_response ILIKE '%timeout%')
AND vendor = 'CHANNEL_PAYMENTS_CC';

Se a consulta retornar registros, significa que a varredura encontrará as transações corretamente.



4️⃣ Acionar a varredura manualmente
📌 Ação: Agora, dispare manualmente a varredura para processar as transações.
📌 Comando para acionar a varredura via API:
bash:
curl -X POST "https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/idempotentCCSweep"
Isso forçará a execução do idempotentCCSweep imediatamente, sem esperar pelo agendamento automático.



5️⃣ Verificar se a varredura foi acionada corretamente
📌 Ação: Consulte a tabela sweep_log para verificar se a varredura foi disparada corretamente.
📌 Consulta SQL para validar a execução da varredura:

sql:
SELECT *
FROM sweep_log
WHERE task_name = 'idempotentCCSweep'
ORDER BY created_at DESC
LIMIT 5;
Se a varredura foi disparada corretamente, deve haver uma entrada correspondente nessa tabela.



6️⃣ Validar a atualização das transações no banco
📌 Ação: Confirme se as transações afetadas tiveram seu status atualizado corretamente (não podem mais estar em timeout).
📌 Consulta SQL para verificar a atualização:

sql:
SELECT cct.*, sp.*
FROM uown_sv_credit_card_transaction cct
LEFT JOIN sv_payment sp ON cct.pk = sp.cc_transaction_pk
WHERE cct.cc_action = 'SALE'
AND cct.posting_date >= CURRENT_DATE - 1
AND cct.vendor = 'CHANNEL_PAYMENTS_CC';

O que validar aqui:
O campo gateway_response não pode mais conter "timeout".
O status da transação deve ser APPROVED, DENIED ou ERROR.



7️⃣ Se a transação foi APROVADA, validar pagamento criado
📌 Ação: Se a transação foi APROVADA, um pagamento correspondente deve ter sido criado na tabela sv_payment.
📌 Consulta SQL para verificar se o pagamento foi criado:

sql:
SELECT *
FROM sv_payment
WHERE cc_transaction_pk IN (
    SELECT pk
    FROM uown_sv_credit_card_transaction
    WHERE status = 'APPROVED'
    AND posting_date >= CURRENT_DATE - 1
    AND vendor = 'CHANNEL_PAYMENTS_CC'
);

Se um registro correspondente existir, significa que o sistema criou corretamente um pagamento após a aprovação.


Critérios de Aprovação do Teste ✅
O teste será considerado bem-sucedido se todas as condições abaixo forem atendidas:

A varredura foi acionada com sucesso (sweep_log registra a execução).
As transações foram reprocessadas e não contêm mais "timeout".
O status das transações foi atualizado corretamente (APPROVED, DENIED ou ERROR).
Se alguma transação foi APROVADA, um pagamento foi criado na tabela sv_payment.

Possíveis Erros e Soluções 🚨
Erro Encontrado	Possível Causa	Solução
A varredura não aparece no sweep_log |	A API não foi chamada corretamente |	Verifique a URL e tente novamente.
Nenhuma transação foi processada |	Nenhuma transação com timeout estava no banco |	Volte ao passo 2 e injete manualmente um erro na transação.
A transação ainda contém timeout após a varredura |	O sweep pode ter falhado ou não foi acionado |	Verifique logs e tente novamente.
Pagamento não foi criado após APPROVED |	O sistema pode estar falhando ao gerar o pagamento |	Verifique logs e peça suporte para investigar.



Resumo Final 📌
Injetamos um erro (timeout) em transações no banco para testar se a varredura processa corretamente.
Executamos a varredura manualmente via API.
Verificamos logs e tabelas para confirmar que a varredura processou as transações corretamente.
Validamos se transações APPROVED criaram pagamentos na tabela sv_payment.
Se todos esses passos foram concluídos corretamente, a funcionalidade está validada e funcionando como esperado! ✅

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verify creation of payment records in uown_sv_payment after running idempotentCCSweep endpoint execution process

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify creation of payment records in uown_sv_payment after running idempotentCCSweep endpoint execution process |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify creation of payment records in uown_sv_payment after running idempotentCCSweep endpoint execution process |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------