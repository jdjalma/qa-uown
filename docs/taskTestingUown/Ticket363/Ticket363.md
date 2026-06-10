---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/363

UOWN | Servicing | CC Convenience Fee

Synopsis
Enable and validate the credit card convenience fee mechanism across selected lower environments (Dev1/QA1) to ensure that a $1.00 fee is correctly
applied and logged in gateway transactions.

Business Objective
To introduce and validate the automated application of a fixed $1.00 convenience fee for credit card transactions,
ensuring proper integration with our external payment gateway and readiness for a full rollout in July. This test ensures that all logic tied to this fee,
flag toggling, transaction handling, and logging, is functioning properly and is reflected in the credit card transaction records.

Feature Request | Business Requirements
Configuration Activation:
* Add an Option to allow agent to bypass CCFee
* Activate the "charge_fee" flag (or equivalent configuration key) in the appropriate configuration store (e.g., database or feature flags).
* Ensure the change is applied in the Dev1 and QA1 environments.

Transaction Execution:
* Perform at least two credit card transactions through the Servicing application post-activation.
* Confirm the gateway receives and processes a total amount + $1.00 fee correctly.

Validation:
* Retrieve the transaction ID and gateway request/response logs.

Verify:
* The original amount.
* The fee ($1.00).
* The final charged amount.
* Validate that the fee is logged in the CreditCardTransaction table.

Priyanka Namburu @pnamburu:
Add "chargeFee" column to CCTransactionInfo on BE
Add "charge convenience fee" checkbox to the Make Payment model on FE when agent selects "Credit Card Payment" option (default to true) but agent should be able to unselect it.
Send this to BE and change chargeFee to be retrieved from this instead of configuration

Priyanka Namburu @pnamburu:
@davimarrauownleasing  Since you mentioned that fee is being returned in the response, please save it to CCTransaction

Priyanka Namburu @pnamburu:
We just have to add disclosure of this to the portal and payment reminders.
On the payment Reminder we should but an * next to the amount and then in the footer add details that say "$1 Convenience Fee charged by processor on all Debit or Credit Card Payments.  ACH payments are not subject to the fee.  If you would like to switch your payment method to ACH, please log into customer portal at portal.uownleasing.com."
Need similar wording on payment screen on customer portal.

davi marra @davimarrauownleasing
Steps for Reproduction
Customer Portal (Website)
On the Make Payment page, at the bottom, the following message should be visible to notify users about the $1 convenience fee for credit card payments:
"$1 Convenience Fee charged by processor on all Debit or Credit Card Payments. ACH payments are not subject to the fee. If you would like to switch your payment method to ACH, please click here."
Additionally, the new field chargeFee must always be sent as true to the makeCreditCardPayment endpoint for payments made using credit card on this portal.

Servicing Portal
1. Credit Card Transactions Page
On the Credit Card Transactions page (accessible via the top menu: History → CC Transactions), two new columns should now be visible:
* Charge Fee Amount
* Charge Fee
2. Payment Modal (Top Right Dollar Icon)
Clicking the dollar ($) icon on the top-right corner of the screen opens the payment modal. In this modal, a new checkbox labeled:
* "Charge convenience fee"
should appear. Its default value must be true, but it can be manually changed to false.
* Visibility Rule: This new checkbox should only be visible if the user has the view_charge_fee permission enabled in AMS.
If the permission is not active, the field must be hidden.
Data Base Behavior
The new field charge_fee can be found in the database table:
* uown_sv_credit_card_transaction.
* If charge_fee is true, the charge_fee_amount column must store the actual fee amount that was charged.
This value comes from the gateway_response field, also located in the same table.
* If charge_fee is false, no fee amount should be stored.

-----

UOWN | Atendimento | Taxa de Conveniência para Cartão de Crédito

Resumo
Habilitar e validar o mecanismo de taxa de conveniência para cartão de crédito em ambientes selecionados de nível inferior
(Dev1/QA1) para garantir que uma taxa de $1,00 seja corretamente aplicada e registrada nas transações do gateway.

Objetivo de Negócio
Introduzir e validar a aplicação automatizada de uma taxa de conveniência fixa de $1,00 para transações com cartão de crédito,
garantindo integração adequada com nosso gateway de pagamento externo e preparação para uma implementação completa em julho.
Este teste assegura que toda a lógica relacionada a essa taxa, ativação de flags, manipulação de transações e registro,
está funcionando corretamente e refletida nos registros de transações com cartão de crédito.

Solicitação de Recurso | Requisitos de Negócio
Ativação da Configuração:
* Adicionar uma opção para permitir que o agente ignore a taxa de conveniência (CCFee).
* Ativar a flag "charge_fee" (ou chave de configuração equivalente) no armazenamento de configuração apropriado (ex.: banco de dados ou flags de funcionalidade).
* Garantir que a alteração seja aplicada nos ambientes Dev1 e QA1.

Execução de Transações:
Realizar pelo menos duas transações com cartão de crédito por meio do aplicativo de Atendimento após a ativação.
Confirmar que o gateway recebe e processa o valor total + a taxa de $1,00 corretamente.

Validação:
Recuperar o ID da transação e os logs de solicitação/resposta do gateway.

Verificar:
O valor original.
A taxa ($1,00).
O valor final cobrado.
Validar que a taxa está registrada na tabela CreditCardTransaction.

Priyanka Namburu @pnamburu:
Adicionar a coluna "chargeFee" à tabela CCTransactionInfo no backend.
Adicionar uma caixa de seleção "Cobrar taxa de conveniência" ao modelo de Pagamento no frontend quando o agente selecionar a opção "Pagamento com Cartão de Crédito" (padrão como verdadeiro), mas o agente deve poder desmarcá-la.
Enviar isso para o backend e alterar o chargeFee para ser obtido a partir dessa seleção, em vez de vir da configuração.

Priyanka Namburu @pnamburu:
@davimarrauownleasing Como você mencionou que a taxa está sendo retornada na resposta, por favor, salve-a na tabela CCTransaction.

Priyanka Namburu @pnamburu:
Precisamos adicionar a divulgação disso no portal e nos lembretes de pagamento.
No lembrete de pagamento, devemos colocar um * ao lado do valor e, no rodapé, adicionar detalhes informando:
"$1 de Taxa de Conveniência cobrada pelo processador em todos os pagamentos com cartão de débito ou crédito. Pagamentos via ACH não estão sujeitos à taxa. Se desejar mudar seu método de pagamento para ACH, faça login no portal do cliente em portal.uownleasing.com."
Necessitamos de uma redação semelhante na tela de pagamento do portal do cliente.

Davi Marra @davimarrauownleasing
Passos para Reprodução
Portal do Cliente (Site)
Na página de Fazer Pagamento, na parte inferior, a seguinte mensagem deve estar visível para notificar os usuários
sobre a taxa de conveniência de $1 para pagamentos com cartão de crédito:
"$1 de Taxa de Conveniência cobrada pelo processador em todos os pagamentos com cartão de débito ou crédito.
Pagamentos via ACH não estão sujeitos à taxa. Se desejar mudar seu método de pagamento para ACH, clique aqui."
Além disso, o novo campo chargeFee deve ser sempre enviado como verdadeiro para o endpoint makeCreditCardPayment para pagamentos realizados com cartão de crédito neste portal.

Portal de Atendimento
Página de Transações com Cartão de Crédito
Na página de Transações com Cartão de Crédito (acessível pelo menu superior: Histórico → Transações CC), duas novas colunas devem estar visíveis:
Valor da Taxa de Cobrança
Taxa de Cobrança
Modal de Pagamento (Ícone de Cifrão no Canto Superior Direito)
Ao clicar no ícone de cifrão ($) no canto superior direito da tela, o modal de pagamento é aberto. Neste modal, uma nova caixa de seleção rotulada como:
"Cobrar taxa de conveniência"
deve aparecer. Seu valor padrão deve ser verdadeiro, mas pode ser alterado manualmente para falso.
Regra de Visibilidade: Esta nova caixa de seleção só deve estar visível se o usuário tiver a permissão view_charge_fee habilitada no AMS.
Se a permissão não estiver ativa, o campo deve permanecer oculto.
Comportamento do Banco de Dados
O novo campo charge_fee pode ser encontrado na tabela do banco de dados:
uown_sv_credit_card_transaction.
Se charge_fee for verdadeiro, a coluna charge_fee_amount deve armazenar o valor real da taxa cobrada.
Esse valor vem do campo gateway_response, também localizado na mesma tabela.
Se charge_fee for falso, nenhum valor de taxa deve ser armazenado.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Checklist de Testes – Taxa de Conveniência

## Configuração e Backend

- [OK] Adicionar opção para permitir que o agente ignore a taxa de conveniência (CCFee)
- [OK] Ativar a permissão `charge_fee` (ou equivalente) no armazenamento de configuração (banco de dados/feature flag)
Inserir descrição na permissão no banco de dados
- [OK] Verificar existência do campo `charge_fee` na tabela `uown_sv_credit_card_transaction`
- [OM] Se `charge_fee` for verdadeiro, garantir que a coluna `charge_fee_amount` armazene o valor real da taxa cobrada (do campo `gateway_response`)
- [OK] Se `charge_fee` for falso, garantir que nenhum valor de taxa seja armazenado na coluna `charge_fee_amount`
- [OK] O campo `chargeFee` deve ser enviado para o backend a partir da seleção do frontend, não mais de configuração

## Transações e Integração
- [OK] Realizar pelo menos duas transações com cartão de crédito após ativação da flag
- [OK] Confirmar que o gateway recebe e processa o valor total + taxa de $1 corretamente
- [OK] Recuperar o ID da transação e logs de solicitação/resposta do gateway
- [OK] Validar que a taxa está registrada na tabela `CreditCardTransaction`
- [OK] Conferir se a taxa está sendo retornada na resposta e salvá-la na tabela `CCTransaction`
- [OK] Verificar valores:
- [OK] Valor original
- [OK] Valor da taxa ($1,00)
- [OK] Valor final cobrado

## Frontend (Portal do Cliente e Servicing)
- [OK] Adicionar caixa de seleção **"Cobrar taxa de conveniência"** no modelo de Pagamento ao selecionar "Pagamento com Cartão de Crédito"
- [OK] Padrão marcado como verdadeiro, mas possível desmarcar
- [OK] Enviar seleção para backend (definindo `chargeFee`)
- [OK] No Portal do Cliente (Site):
- [OK] Página de Fazer Pagamento: Exibir mensagem informando da taxa de $1 para cartões
- [OK] O campo `chargeFee` deve ser sempre enviado como `true` para o endpoint `makeCreditCardPayment` (pagamentos por cartão)
- [] No Servicing (Histórico → Transações CC):
- [OK] Duas novas colunas: **Valor da Taxa de Cobrança** e **Taxa de Cobrança**(**Charge Fee Amount** and **Charge Fee**)
- [OK] No Servicing (Modal de Pagamento):
- [OK] Nova caixa de seleção "Cobrar taxa de conveniência" (default true, pode ser alterada para false)
- [OK] Só exibir se o usuário tiver permissão `view_charge_fee` ativa no AMS
- [OK] Esconder campo se permissão não estiver ativa

## Comunicação e UX
- [?] No lembrete de pagamento, colocar * ao lado do valor e adicionar rodapé:
> "$1 de Taxa de Conveniência cobrada pelo processador em todos os pagamentos com cartão de débito ou crédito. Pagamentos via ACH não estão sujeitos à taxa. Se desejar mudar seu método de pagamento para ACH, faça login no portal do cliente em portal.uownleasing.com."
- [OK] Na tela de pagamento do portal do cliente, adicionar aviso semelhante sobre a taxa de conveniência
- [OK] Garantir que a mensagem esteja visível e de fácil entendimento
- [OK] No portal do cliente, na página de pagamento, mostrar a mensagem:
> "$1 de Taxa de Conveniência cobrada pelo processador em todos os pagamentos com cartão de débito ou crédito.
> Pagamentos via ACH não estão sujeitos à taxa. Se desejar mudar seu método de pagamento para ACH, clique aqui."

## Validações Finais
- [OK] Validar que o campo `chargeFee` está sendo corretamente enviado e processado em todos os fluxos
- [OK] Validar que o cálculo do valor cobrado está correto em todos os casos (com e sem taxa)
- [OK] Validar visibilidade/ocultação da caixa de seleção conforme permissões do usuário
- [OK] Validar todos os textos/comunicações exibidos ao usuário


-----


delinquencyRerunCCPaymentsSweep
dailyDelinquencyRerunCCSweep
CreateScheduledCreditCardPaymentsSweep
UnutilizedApprovalSweep
rerunCCPaymentsSweep
SendCreditCardPaymentsSweep
CCDailyScheduledDeniedRerun

https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/dailyDelinquencyRerunCCSweep
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/CreateScheduledCreditCardPaymentsSweep
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/UnutilizedApprovalSweep
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/rerunCCPaymentsSweep
https://svc-{{env}}.uownleasing.com/uown/svc/sendCreditCardPaymentsSweep
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun


select * from uown_email_queue ueq where ueq.created_by between '2025-07-15 00:00:00.000' and '2025-07-15 23:59:59.999' ;

delinquencyRerunCCPaymentsSweep
SELECT distinct (s.account_pk)
FROM uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
AND CURRENT_DATE - s.delinquency_as_of_date > 100
AND a.account_status = 'ACTIVE'
AND cc.is_deleted IS NOT TRUE
AND cc.auto_pay IS TRUE
AND cc.is_valid_card IS NOT FALSE
AND pmt.status = 'PAID'
AND pmt.cc_pk IS NOT NULL
AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))


dailyDelinquencyRerunCCSweep
SELECT distinct(ss.account_pk) FROM uown_sv_credit_card_transaction cc
JOIN uown_sv_sched_summary ss ON ss.account_pk = cc.account_pk
JOIN uown_sv_account acc ON acc.pk = ss.account_pk
WHERE cc.posting_date = CURRENT_DATE
AND cc.cc_action = 'SALE'
AND cc.status = 'APPROVED'
AND ss.delinquency_as_of_date < CURRENT_DATE
AND acc.account_status = 'ACTIVE'
AND (acc.rating IS NULL OR acc.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))


CreateScheduledCreditCardPaymentsSweep

with
receivable as (select a.pk accountPk, r.pk receivablePk, r.receivable_type receivableType, r.total_amount, r.due_date nextDueDate
from
uown_sv_account a
join uown_sv_receivable r on r.account_pk = a.pk and r.status = 'ACTIVE' and ((r.allocation_status = 'UNPAID' and
r.receivable_type NOT IN ( 'EARLY_PAY_OFF')) OR (r.allocation_status = 'PARTIALLY_PAID' and r.receivable_type = 'PROCESSING_FEE'))
and r.due_date = current_date+2 and (r.skipped is null or r.skipped=false)
)
,nextreceivable as (
select nextRec.accountPk accountPk, nextRec.receivablePk receivablePk, nextRec.receivableType receivableType, nextRec.total_amount, nextRec.nextDueDate nextDueDate
from(
select a.pk accountPk, r.pk receivablePk, r.receivable_type receivableType, r.total_amount,
r.due_date nextDueDate, rank() OVER (ORDER BY r.due_date) AS rnk
from
uown_sv_account a
join uown_sv_receivable r on r.account_pk = a.pk and r.status = 'ACTIVE' and ((r.allocation_status = 'UNPAID' and
r.receivable_type NOT IN ( 'EARLY_PAY_OFF')) OR (r.allocation_status = 'PARTIALLY_PAID' and r.receivable_type = 'PROCESSING_FEE'))
and r.due_date > current_date+2 and (r.skipped is null or r.skipped=false)
order by r.due_date
) nextRec
where nextRec.rnk <=1
)
select account.pk as "accountPkk",rec.total_amount-rec.partial_payment_amount as "amountt", receivable.nextDueDate as "postingDatee"
from receivable
join uown_sv_account account on account.pk = receivable.accountPk and account.auto_pay_types like '%CC%' and account.auto_pay_types not like '%ACH%' and account.auto_pay_types not like '%PAY_WALLET%'
join uown_sv_receivable rec on rec.account_pk = account.pk and rec.status = 'ACTIVE' and rec.pk = receivable.receivablePk
join uown_sv_credit_card creditCard on creditCard.account_pk = account.pk and creditCard.auto_pay = true
where account.account_status = 'ACTIVE'
and (account.rating IS NULL OR account.rating NOT IN ('B','C','P'))
and rec.due_date = receivable.nextDueDate
and rec.receivable_type NOT IN ('EARLY_PAY_OFF')
and rec.total_amount > 0
and CASE WHEN rec.receivable_type NOT IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
THEN ((select count(*) from receivable where accountPk = account.pk and receivableType IN ('REGULAR_PAYMENT')) >= 1)
ELSE TRUE
END
and (select count(*) from uown_sv_achpayment ach where ach.account_pk = account.pk and ach.status IN ('PENDING','PICKED_TO_SEND','STATUS_UPDATE_PENDING')
and (ach.posting_date <= receivable.nextDueDate or ach.posting_date <= (select COALESCE(nextreceivable.nextDueDate,receivable.nextDueDate)  from nextreceivable where nextreceivable.accountPk = account.pk))) = 0
and (select count(*) from uown_sv_credit_card_transaction cc where cc.account_pk = account.pk and cc.status IN ('PENDING', 'FUTURE_PENDING', 'PICKED_TO_SEND')
and (cc.posting_date <= receivable.nextDueDate or cc.posting_date <= (select COALESCE(nextreceivable.nextDueDate,receivable.nextDueDate) from nextreceivable where nextreceivable.accountPk = account.pk)) )= 0



UnutilizedApprovalSweep
SELECT DISTINCT lead.pk
FROM uown_los_lead lead
JOIN uown_los_uwdata uw ON lead.pk = uw.lead_pk
WHERE uw.uw_status = 'APPROVED'
AND (uw.decision_made_at \:\: date = current_date-7 OR uw.decision_made_at \:\: date = current_date-21)
AND lead.lead_status = 'UW_APPROVED'
AND (SELECT count(*) FROM uown_email_queue emailQueue WHERE template_name='UnutilizedApproval' and lead.pk = emailQueue.lead_pk) <= 1


rerunCCPaymentsSweep
SELECT DISTINCT ON(t.account_pk) t.*
FROM uown_sv_credit_card_transaction t
JOIN uown_sv_account a ON a.pk = t.account_pk
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
WHERE t.status = 'DENIED'
AND t.is_nsf
AND t.cc_action = 'SALE'
AND t.cc_transaction_type = 'SCHEDULED'
AND (t.number_of_tries is null or t.number_of_tries < 4)
AND a.account_status NOT IN ('CANCELLED', 'PAID_OUT', 'PAID_OUT_EARLY', 'CLOSED','CHARGED_OFF')
AND (a.rating IS NULL OR a.rating NOT IN ('P', 'C', 'D'))
AND (a.auto_pay_types like '%CC%' and a.auto_pay_types not like '%ACH%')
AND t.posting_date >= '2022-06-10'
AND t.posting_date < CURRENT_DATE
AND (t.rerun_status is null or t.rerun_status in ('DENIED', 'SKIPPED'))
AND ( s.delinquency_as_of_date IS null or s.delinquency_as_of_date < current_date)
AND (t.posting_date = current_date-1 or extract(dow from current_date) in (4,5,6))
ORDER BY t.account_pk, t.row_created_timestamp desc


SendCreditCardPaymentsSweep
WITH ccTransaction as (
WITH nextreceivable as (
select account_pk as accountPk, min(due_date) as nextDueDate from uown_sv_receivable r
where r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE') AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
and status = 'ACTIVE'
group by account_pk
)
UPDATE uown_sv_credit_card_transaction t
SET status =
CASE
WHEN ((nextRec.nextDueDate IS NOT null AND nextRec.nextDueDate <= current_date AND (account.rating IS NULL or account.rating <> 'P')) OR (t.cc_transaction_type is null or t.cc_transaction_type = 'REQUEST'))
THEN 'PICKED_TO_SEND'
ELSE 'CANCELLED'
END,
comment =
CASE
WHEN ((nextRec.nextDueDate IS NOT null AND nextRec.nextDueDate <= current_date AND (account.rating IS NULL or account.rating <> 'P')) OR (t.cc_transaction_type is null or t.cc_transaction_type = 'REQUEST'))
THEN 'Send Scheduled CC Sweep at '||  (NOW() AT TIME ZONE 'America/New_York')
ELSE 'Cancelled as rating is P or delinquency date is '|| nextRec.nextDueDate || ' at ' || (NOW() AT TIME ZONE 'America/New_York')
END
FROM uown_sv_account account
JOIN nextreceivable nextRec ON nextRec.accountPk = account.pk
WHERE account.pk = t.account_pk AND posting_date <= current_date AND status = 'PENDING'
AND account.account_status not in ('CANCELLED', 'PAID_OUT', 'PAID_OUT_EARLY', 'CLOSED','CHARGED_OFF')
AND (account.rating IS NULL OR account.rating NOT IN ('B','C'))
RETURNING t.*)
SELECT ccTransaction.*
FROM ccTransaction
WHERE ccTransaction.status != 'CANCELLED'


CCDailyScheduledDeniedRerun
SELECT cct.account_pk as "accountPkk",cct.amount as "amountt", cct.posting_date as "postingDatee"
FROM
uown_sv_credit_card_transaction cct
JOIN uown_sv_account a ON a.pk = cct.account_pk
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc on cc.auto_pay = true and cc.account_pk = a.pk
where status IN ('DENIED', 'ERROR')
AND posting_date = CURRENT_DATE
AND agent_username NOT IN ('SpecialProcess#5014')
AND cc_transaction_type = 'SCHEDULED'
AND cct.cc_action = 'SALE'
AND a.account_status = 'ACTIVE'
AND (a.rating IS NULL OR a.rating NOT IN ('P', 'C', 'D'))
AND error not in ('Card is expired',
'Card number error',
'Closed account',
'Hold card (stolen)'
'Hold card (pick up card)',
'Hold card (lost)',
'Withdrawal limit exceeded',
'PIN tries exceeded')
AND s.delinquency_as_of_date <= current_date
AND cct.comment not like 'Idempotent transaction was run. %'


-----

acordo de Pagamento
reverter pagamento
mobile



@jose.mendesdev Por favor, rode também o sweep CreateScheduledCreditCardPayments
e certifique-se de que as transações criadas na tabela sv_credit_card_transaction tenham o campo chargeFee como true.
Você pode rodar o sweep SendCreditCardPayments depois.

Antes de rodar o sweep CreateScheduledCreditCardPayments, garanta que existam múltiplas contas com vencimento em 2 dias e que os campos
PROCESSING_FEE, REGULAR_PAYMENT e NSF_FEE estejam todos com vencimento no mesmo dia.
Você pode manipular essas datas na tabela sv_receivable ou fazer isso via o módulo de Servicing.

CreateScheduledCreditCardPayments
3996
3997
3222
3271
3354
3355
3357
3359
3554
3664
3706
3707
3708
3835
3938
3939
3941
3942
3943
3940
3988







Given the agent is on the credit card payment flow with feature flag enabled

### Scenario: charge_fee field exists and is sent from frontend
Given the user selects "Cobrar taxa de conveniência"
When the payment is submitted
Then the frontend must include `chargeFee = true` in the request payload
| ✅ PASS | 10501 |


Permitir que o agente ignore a taxa de conveniência (CCFee)
Ativar a permissão `charge_fee` (ou equivalente) no armazenamento de configuração (banco de dados/feature flag)
Inserir descrição na permissão no banco de dados
Verificar existência do campo `charge_fee` na tabela `uown_sv_credit_card_transaction`
Validar que o campo chargeFee está sendo corretamente enviado do frontend para o backend conforme a seleção do usuário (ou configuração default) e processado em todos os fluxos
O campo `chargeFee` deve ser enviado para o backend a partir da seleção do frontend, não mais de configuração
Realizar pelo menos duas transações com cartão de crédito após ativação da flag
Confirmar que o gateway recebe e processa o valor total + taxa de $1 corretamente
Recuperar o ID da transação e logs de solicitação/resposta do gateway
Validar que a taxa está registrada na tabela `CreditCardTransaction`
Conferir se a taxa está sendo retornada na resposta e salvá-la na tabela `CCTransaction`
Verificar valores valor original, valor da taxa ($1,00) e valor final cobrado
Adicionar caixa de seleção **"Cobrar taxa de conveniência"** no modelo de Pagamento ao selecionar "Pagamento com Cartão de Crédito"
Padrão marcado como verdadeiro, mas possível desmarcar
Enviar seleção para backend (definindo `chargeFee`)
No Portal do Cliente (Site):

O campo `chargeFee` deve ser sempre enviado como `true` para o endpoint `makeCreditCardPayment` (pagamentos por cartão)
No Servicing (Histórico → Transações CC):
Duas novas colunas em Servicing, Histórico → Transações CC. **Valor da Taxa de Cobrança** e **Taxa de Cobrança**
No Servicing (Modal de Pagamento):
Nao modal de pagamento em servicing nova caixa de seleção "Cobrar taxa de conveniência" (default true, pode ser alterada para false)
Só exibir se o usuário tiver permissão `view_charge_fee` ativa no AMS
Esconder campo se permissão `view_charge_fee`  não estiver ativa
Na tela de pagamento do portal do cliente, adicionar aviso semelhante sobre a taxa de conveniência, garantir que a mensagem esteja visível e de fácil entendimento
Validar que o campo `chargeFee` está sendo corretamente enviado e processado em todos os fluxos
Validar que o cálculo do valor cobrado está correto em todos os casos (com e sem taxa)
Validar visibilidade/ocultação da caixa de seleção conforme permissões do usuário
Validar todos os textos/comunicações exibidos ao usuário







Permitir que o agente ignore a taxa de conveniência (CCFee).
Ativar a permissão charge_fee (ou equivalente) no banco de dados ou feature flag.
Inserir descrição para a permissão charge_fee no banco de dados.
Verificar a existência e o correto preenchimento do campo charge_fee na tabela uown_sv_credit_card_transaction.
Validar que o campo chargeFee está sendo corretamente enviado do frontend para o backend conforme a seleção do usuário, não mais a partir da configuração.
Realizar ao menos duas transações com cartão de crédito após ativação da flag, validando o fluxo completo
Confirmar que o gateway recebe e processa o valor total incluindo a taxa de $1 corretamente
Recuperar o ID da transação e logs de solicitação e resposta do gateway.
Validar que a taxa está registrada nas tabelas CreditCardTransaction e CCTransaction.
Conferir os valores de transação: valor original, valor da taxa ($1,00) e valor final cobrado.
Adicionar caixa de seleção "Cobrar taxa de conveniência" no modelo de Pagamento ao selecionar "Pagamento com Cartão de Crédito", marcada como verdadeira por padrão, mas permitindo desmarcar.
Enviar a seleção da caixa de seleção para o backend (definindo chargeFee).
No Portal do Cliente, garantir que o campo chargeFee seja sempre enviado como true para o endpoint makeCreditCardPayment.
Adicionar e validar duas novas colunas em Servicing, Histórico → Transações CC: Valor da Taxa de Cobrança e Taxa de Cobrança.
No modal de pagamento do Servicing, adicionar a caixa de seleção "Cobrar taxa de conveniência" (default true, podendo ser alterada para false), exibindo-a apenas para usuários com permissão view_charge_fee ativa no AMS; ocultar para os demais.
Exibir, na tela de pagamento do portal do cliente, um aviso claro e visível sobre a cobrança da taxa de conveniência.
Validar que o cálculo do valor cobrado está correto em todos os casos (com e sem taxa).
Validar a visibilidade ou ocultação da caixa de seleção conforme as permissões do usuário.
Validar todos os textos e comunicações exibidos ao usuário durante o fluxo.


| Test Case                                                                                                                                | Test Data | Status | Observation |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----------- |
| Validar que o agente pode ignorar a taxa de conveniência (CCFee) ao realizar um pagamento.                                               |           | PASS   |             |
| Ativar a permissão `charge_fee` no banco de dados ou feature flag e garantir funcionamento.                                              |           | PASS   |             |
| Verificar que a permissão `charge_fee` possui uma descrição adequada no banco de dados.                                                  |           | PASS   |             |
| Validar a existência e o correto preenchimento do campo `charge_fee` na tabela `uown_sv_credit_card_transaction`.                        |           | PASS   |             |
| Validar que o campo `chargeFee` é enviado do frontend para o backend conforme a seleção do usuário.                                      |           | PASS   |             |
| Realizar pelo menos duas transações com cartão de crédito após ativação da flag, validando todo o fluxo.                                 |           | PASS   |             |
| Confirmar que o gateway recebe e processa o valor total incluindo a taxa de \$1 corretamente.                                            |           | PASS   |             |
| Recuperar o ID da transação e validar os logs de solicitação e resposta do gateway.                                                      |           | PASS   |             |
| Validar que a taxa está registrada corretamente nas tabelas `CreditCardTransaction` e `CCTransaction`.                                   |           | PASS   |             |
| Conferir o valor original, a taxa de \$1,00 e o valor final cobrado nas transações.                                                      |           | PASS   |             |
| Validar a exibição da caixa de seleção "Cobrar taxa de conveniência" no pagamento com cartão, marcada por padrão e permitindo alteração. |           | PASS   |             |
| Validar que a seleção da caixa de seleção é enviada para o backend (definindo `chargeFee`).                                              |           | PASS   |             |
| Garantir que no Portal do Cliente o campo `chargeFee` seja sempre enviado como `true` para o endpoint `makeCreditCardPayment`.           |           | PASS   |             |
| Validar a presença das colunas "Valor da Taxa de Cobrança" e "Taxa de Cobrança" no histórico de transações CC do Servicing.              |           | PASS   |             |
| Validar a exibição da caixa de seleção "Cobrar taxa de conveniência" no modal de pagamento do Servicing, conforme permissões.            |           | PASS   |             |
| Exibir aviso claro e visível sobre a taxa de conveniência na tela de pagamento do portal do cliente.                                     |           | PASS   |             |
| Validar que o cálculo do valor cobrado está correto em todos os cenários (com e sem taxa).                                               |           | PASS   |             |
| Validar visibilidade ou ocultação da caixa de seleção conforme as permissões do usuário.                                                 |           | PASS   |             |
| Validar todos os textos e comunicações exibidos ao usuário durante o fluxo de pagamento.                                                 |           | PASS   |             |


| Test Case                                                                                                                                                  | Test Data | Status |
| ------------------------------------------------------------------------------------------------------------------------------                             | --------- | ------ |
| Validate that the agent can ignore the convenience fee (CCFee) when making a payment.                                                                      |           | PASS   |
| Activate the `charge_fee` permission in the database or feature flag and ensure functionality.                                                             |           | PASS   |
| Verify that the `charge_fee` permission has an appropriate description in the database.                                                                    |           | PASS   |
| Validate the existence and correct filling of the `charge_fee` field in the `uown_sv_credit_card_transaction` table.                                       |           | PASS   |
| Validate that the `chargeFee` field is sent from the frontend to the backend according to the user's selection.                                            |           | PASS   |
| Perform at least two credit card transactions after enabling the flag, validating the entire flow.                                                         |           | PASS   |
| Confirm that the gateway receives and processes the total amount including the \$1 fee correctly.                                                          |           | PASS   |
| Retrieve the transaction ID and validate the gateway request and response logs.                                                                            |           | PASS   |
| Validate that the fee is correctly recorded in the `CreditCardTransaction` and `CCTransaction` tables.                                                     |           | PASS   |
| Check the original amount, the \$1 fee, and the final charged amount in transactions.                                                                      |           | PASS   |
| Validate the display of the "Charge convenience fee" checkbox on credit card payment, checked by default but allowing changes.                             |           | PASS   |
| Validate that the selection of the checkbox is sent to the backend (setting `chargeFee`).                                                                  |           | PASS   |
| Ensure that in the Client Portal the `chargeFee` field is always sent as `true` to the `makeCreditCardPayment` endpoint.                                   |           | PASS   |
| Validate the presence of the columns "Charge Fee Value" and "Charge Fee" in the Servicing CC transactions history.                                         |           | PASS   |
| Validate the display of the "Charge convenience fee" checkbox in the Servicing payment modal, according to permissions.                                    |           | PASS   |
| Display a clear and visible notice about the convenience fee on the Client Portal payment screen.                                                          |           | PASS   |
| Validate that the calculation of the amount charged is correct in all scenarios (with and without fee).                                                    |           | PASS   |
| Validate the visibility or hiding of the checkbox according to user permissions.                                                                           |           | PASS   |
| Validate all texts and communications displayed to the user during the payment flow.                                                                       |           | PASS   |
| Verificar se taxa de cobrança é setado como false para transacoes de pagamentos de NSF_FEE criadas ao executar verredura CreateScheduledCreditCardPayments |           | PASS   |


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


| Test Case                                                                                                                      | Test Data | Status |
| ------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| Validate that the agent can ignore the convenience fee (CCFee) when making a payment.                                          |     ![363-qa1-PermissionActiveDesactive-_7_](/uploads/1919c4a890707b9d00d62ddb1c678649/363-qa1-PermissionActiveDesactive-_7_.png){width=996 height=744}      | PASS   |
| Activate the `charge_fee` permission in the database or feature flag and ensure functionality.                                 |     ![363-qa1-ccConvenienceFee-_3_](/uploads/98d11dc185f0dd148d0181b8ba52ffd6/363-qa1-ccConvenienceFee-_3_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_4_](/uploads/cbb8ab5f66921fde47d1ce3c3641b326/363-qa1-ccConvenienceFee-_4_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_5_](/uploads/5f2eccd6992183b5140efcd9fecc9934/363-qa1-ccConvenienceFee-_5_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_6_](/uploads/32b72558b4221abe8d6efaa8423f9f44/363-qa1-ccConvenienceFee-_6_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_7_](/uploads/149651d3fef6e39a660d4f4235744976/363-qa1-ccConvenienceFee-_7_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_8_](/uploads/38d297896aca8239da41dd8ca035ffc7/363-qa1-ccConvenienceFee-_8_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_9_](/uploads/0c39844426a40a94381c1d64a4a625cc/363-qa1-ccConvenienceFee-_9_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_10_](/uploads/80c7065970655f74539ff7b791c85428/363-qa1-ccConvenienceFee-_10_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_11_](/uploads/cd9965dc98796dbdfc67569a2a8d4e9e/363-qa1-ccConvenienceFee-_11_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_12_](/uploads/7465e2fbe8b647dca3f2813c7d4b0db5/363-qa1-ccConvenienceFee-_12_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_13_](/uploads/4d5a32ec54c4f98c98e73cd73c6fde5c/363-qa1-ccConvenienceFee-_13_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_14_](/uploads/84515cbecfdac11bd5cab481a8adc8ce/363-qa1-ccConvenienceFee-_14_.png){width=1036 height=41}![363-qa1-ccConvenienceFee-_15_](/uploads/b96cd2ddd52ec8056ae8dcdfeae809f6/363-qa1-ccConvenienceFee-_15_.png){width=645 height=540}      | PASS   |
| Validate the existence and correct filling of the `charge_fee` field in the `uown_sv_credit_card_transaction` table.           |      ![image](/uploads/9742e977e12a101e55dfa4d99c0e0b32/image.png)     | PASS   |
| Validate that the `chargeFee` field is sent from the frontend to the backend according to the user's selection.                |    ![363-qa1-servicing-ChargeFeeFalse-OK-_1_](/uploads/e51c27a2d7cb7c8c945046895f600a35/363-qa1-servicing-ChargeFeeFalse-OK-_1_.png){width=840 height=739}![363-qa1-servicing-ChargeFeeFalse-OK-_2_](/uploads/f7b8bbd088f84a8f7650ba7e734ce41e/363-qa1-servicing-ChargeFeeFalse-OK-_2_.png){width=1428 height=354}![363-qa1-servicing-ChargeFeeFalse-OK-_3_](/uploads/ec6df00cf9eda606da382fdec18e5ed3/363-qa1-servicing-ChargeFeeFalse-OK-_3_.png){width=957 height=21}![363-qa1-servicing-ChargeFeeFalse-OK-_4_](/uploads/771974cfc8717a8534836278829748b4/363-qa1-servicing-ChargeFeeFalse-OK-_4_.png){width=1096 height=49}![363-qa1-servicing-ChargeFeeFalse-OK-_5_](/uploads/07a028562fef1ee5d7a13658e3b03eb4/363-qa1-servicing-ChargeFeeFalse-OK-_5_.png){width=1428 height=739}![363-qa1-servicing-ChargeFeeTrue-OK-_1_](/uploads/a39d576a28c3eb5fe0a2f606e0d12e34/363-qa1-servicing-ChargeFeeTrue-OK-_1_.png){width=1435 height=738}![363-qa1-servicing-ChargeFeeTrue-OK-_2_](/uploads/6bb11f8eb78e8e01265a966e444cdd46/363-qa1-servicing-ChargeFeeTrue-OK-_2_.png){width=560 height=647}![363-qa1-servicing-ChargeFeeTrue-OK-_3_](/uploads/3406db1151b86d9830113a623618459a/363-qa1-servicing-ChargeFeeTrue-OK-_3_.png){width=1435 height=734}![363-qa1-servicing-ChargeFeeTrue-OK-_4_](/uploads/b670d97dae2f0644a87dcb72fd16f50e/363-qa1-servicing-ChargeFeeTrue-OK-_4_.png){width=1435 height=734}![363-qa1-servicing-ChargeFeeTrue-OK-_5_](/uploads/c775e0f1ee91de004722f1a3f55542d9/363-qa1-servicing-ChargeFeeTrue-OK-_5_.png){width=1435 height=734}![363-qa1-servicing-ChargeFeeTrue-OK-_6_](/uploads/872d69fd8f5cdff17b4d81b9c1f44778/363-qa1-servicing-ChargeFeeTrue-OK-_6_.png){width=1435 height=734}![363-qa1-servicing-ChargeFeeTrue-OK-_7_](/uploads/104894bd7c2132b684f8ae469417f97e/363-qa1-servicing-ChargeFeeTrue-OK-_7_.png){width=1101 height=39}![363-qa1-servicing-ChargeFeeTrue-OK-_8_](/uploads/7ff3c8a7e47398460ab2621e1c4991ce/363-qa1-servicing-ChargeFeeTrue-OK-_8_.png){width=651 height=14}![363-qa1-servicing-ChargeFeeTrue-OK-_9_](/uploads/59aff864db17ed4826795b68a81d1fb3/363-qa1-servicing-ChargeFeeTrue-OK-_9_.png){width=778 height=276}![363-qa1-servicing-ChargeFeeTrue-OK-_10_](/uploads/8f519b53844a0b5dcdc521cb2381565c/363-qa1-servicing-ChargeFeeTrue-OK-_10_.png){width=778 height=276}       | PASS   |
| Perform at least two credit card transactions after enabling the flag, validating the entire flow.                             |      --     | PASS   |
| Confirm that the gateway receives and processes the total amount including the \$1 fee correctly.                              |      ![363-qa1-ccConvenienceFee-_24_](/uploads/33d9bce2c9963761114d6c33d5e92c4d/363-qa1-ccConvenienceFee-_24_.png){width=687 height=201}![363-qa1-ccConvenienceFee-_25_](/uploads/c86293eb81a9a3d479fc607590aa4bed/363-qa1-ccConvenienceFee-_25_.png){width=687 height=566}![363-qa1-ccConvenienceFee-_26_](/uploads/9c7c34910e85c0379b9e5f996c2ea17c/363-qa1-ccConvenienceFee-_26_.png){width=439 height=26}![363-qa1-ccConvenienceFee-_27_](/uploads/6fe2b5c620214c11128284e36da02d01/363-qa1-ccConvenienceFee-_27_.png){width=1357 height=39}![363-qa1-ccConvenienceFee-_28_](/uploads/921254204c44036cc78db8399fa81fcb/363-qa1-ccConvenienceFee-_28_.png){width=1357 height=39}     | PASS   |
| Validate that the fee is correctly recorded in the `CreditCardTransaction` and `CCTransaction` tables.                         |     ![363-qa1-servicing-ChargeFeeTrue-OK-_6_](/uploads/8861a66a1abb4e912b08241c0f3fe852/363-qa1-servicing-ChargeFeeTrue-OK-_6_.png){width=1435 height=734}![363-qa1-servicing-ChargeFeeTrue-OK-_7_](/uploads/eebfeeec94e161f4a179714abfe1ad53/363-qa1-servicing-ChargeFeeTrue-OK-_7_.png){width=1101 height=39}![363-qa1-servicing-ChargeFeeTrue-OK-_8_](/uploads/83b1cb0e691e7bd7ad72c6895632b0e8/363-qa1-servicing-ChargeFeeTrue-OK-_8_.png){width=651 height=14}      | PASS   |
| Check the original amount, the \$1 fee, and the final charged amount in transactions.                                          |        ![363-qa1-servicing-ChargeFeeFalse-OK-_3_](/uploads/3cb192d733e2f035cb81bddb459de271/363-qa1-servicing-ChargeFeeFalse-OK-_3_.png){width=957 height=21}   | PASS   |
| Validate the display of the "Charge convenience fee" checkbox on credit card payment, checked by default but allowing changes. |      ![363-qa1-PermissionActiveDesactive-_7_](/uploads/4163b2c0bc2ed67c5f47a1fd8d92ad87/363-qa1-PermissionActiveDesactive-_7_.png){width=996 height=744}![363-qa1-servicing-ChargeFeeFalse-OK-_1_](/uploads/0593b360a2c25da4667e7f5c6ed09e55/363-qa1-servicing-ChargeFeeFalse-OK-_1_.png){width=840 height=739}     | PASS   |
| Validate that the selection of the checkbox is sent to the backend (setting `chargeFee`).                                      |       ![363-qa1-servicing-ChargeFeeFalse-OK-_4_](/uploads/86d73463d64cbd26b4f4a46417658bd5/363-qa1-servicing-ChargeFeeFalse-OK-_4_.png){width=1096 height=49}    | PASS   |
| Ensure that in the Client Portal the `chargeFee` field is always sent as `true` to the `makeCreditCardPayment` endpoint.       |     ![363-qa1-ccConvenienceFee-_5_](/uploads/935ff6a0af99fdacc49f198874b3e931/363-qa1-ccConvenienceFee-_5_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_6_](/uploads/281a73060b4a677452444e1e9987f664/363-qa1-ccConvenienceFee-_6_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_7_](/uploads/f77fb17797fa7af10a3b280794ff0c1c/363-qa1-ccConvenienceFee-_7_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_8_](/uploads/489a63be29d4289cbbcfa186634d7106/363-qa1-ccConvenienceFee-_8_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_9_](/uploads/e2b824cc56975f4fd57a571890eb5682/363-qa1-ccConvenienceFee-_9_.png){width=1436 height=741}![363-qa1-ccConvenienceFee-_10_](/uploads/83504ab7ef6132bc37e7930e251a9666/363-qa1-ccConvenienceFee-_10_.png){width=1436 height=741}      | PASS   |
| Validate the presence of the columns "Charge Fee Value" and "Charge Fee" in the Servicing CC transactions history.             |     ![363-qa1-servicing-ChargeFeeTrue-OK-_9_](/uploads/c84e53f4513c10667ac7486bcdfc76f5/363-qa1-servicing-ChargeFeeTrue-OK-_9_.png){width=778 height=276}![363-qa1-servicing-ChargeFeeTrue-OK-_10_](/uploads/8f7de387d2f5593aa98baae986f6c4a4/363-qa1-servicing-ChargeFeeTrue-OK-_10_.png){width=778 height=276}      | PASS   |
| Validate the display of the "Charge convenience fee" checkbox in the Servicing payment modal, according to permissions.        |     ![363-qa1-PermissionActiveDesactive-_1_](/uploads/b8371b3549a7e59853ccc6bceb756ebe/363-qa1-PermissionActiveDesactive-_1_.png){width=904 height=126}![363-qa1-PermissionActiveDesactive-_2_](/uploads/99c0ba0ba6b5141242f09d035d7253c1/363-qa1-PermissionActiveDesactive-_2_.png){width=554 height=648}![363-qa1-PermissionActiveDesactive-_3_](/uploads/86f70c4305572a3b49f7a98dd83dcea2/363-qa1-PermissionActiveDesactive-_3_.png){width=1431 height=741}![363-qa1-PermissionActiveDesactive-_4_](/uploads/f4b54e9cf33389ebda32248b79d9c68e/363-qa1-PermissionActiveDesactive-_4_.png){width=997 height=741}![363-qa1-PermissionActiveDesactive-_5_](/uploads/fa25fbba3b822d6432afc0e0a8e6b942/363-qa1-PermissionActiveDesactive-_5_.png){width=167 height=53}![363-qa1-PermissionActiveDesactive-_6_](/uploads/d260b3146cbaade31b811b793fd68fe4/363-qa1-PermissionActiveDesactive-_6_.png){width=786 height=204}![363-qa1-PermissionActiveDesactive-_7_](/uploads/2443cd469495d359cc9f02b69467271f/363-qa1-PermissionActiveDesactive-_7_.png){width=996 height=744}      | PASS   |
| Display a clear and visible notice about the convenience fee on the Client Portal payment screen.                              |      ![363-qa1-website-OK-FuncionalidadeSelecionarFormaDePagamentoAntesDePagarMantida-_2_](/uploads/8920153e13844075157536fcba977107/363-qa1-website-OK-FuncionalidadeSelecionarFormaDePagamentoAntesDePagarMantida-_2_.png){width=817 height=741}     | PASS   |
| Validate that the calculation of the amount charged is correct in all scenarios (with and without fee).                        |     --     | PASS   |
| Validate the visibility or hiding of the checkbox according to user permissions.                                               |     --    | PASS   |
| Verify that the charge fee is set to false for NSF_FEE payment transactions created when running the CreateScheduledCreditCardPayments sweep |     ![363-qa1-NsfFee-_1_](/uploads/56bac24bdc6c27e874fba61d994a11d9/363-qa1-NsfFee-_1_.png){width=1411 height=712}![363-qa1-NsfFee-_2_](/uploads/90fcd557abeb720231e2fe30138c0cac/363-qa1-NsfFee-_2_.png){width=1161 height=62}![363-qa1-NsfFee-_3_](/uploads/4c8922e45badf695751ac010403d7d37/363-qa1-NsfFee-_3_.png){width=1219 height=180}      | PASS   |

Validate that the agent can ignore the convenience fee (CCFee) when making a payment.                                         
Activate the `charge_fee` permission in the database or feature flag and ensure functionality.                                
Validate the existence and correct filling of the `charge_fee` field in the `uown_sv_credit_card_transaction` table.          
Validate that the `chargeFee` field is sent from the frontend to the backend according to the user's selection.               
Perform at least two credit card transactions after enabling the flag, validating the entire flow.                            
Confirm that the gateway receives and processes the total amount including the \$1 fee correctly.                             
Validate that the fee is correctly recorded in the `CreditCardTransaction` and `CCTransaction` tables.                        
Check the original amount, the \$1 fee, and the final charged amount in transactions.                                         
Validate the display of the "Charge convenience fee" checkbox on credit card payment, checked by default but allowing changes.
Validate that the selection of the checkbox is sent to the backend (setting `chargeFee`).                                     
Ensure that in the Client Portal the `chargeFee` field is always sent as `true` to the `makeCreditCardPayment` endpoint.      
Validate the presence of the columns "Charge Fee Value" and "Charge Fee" in the Servicing CC transactions history.            
Validate the display of the "Charge convenience fee" checkbox in the Servicing payment modal, according to permissions.       
Display a clear and visible notice about the convenience fee on the Client Portal payment screen.                             
Validate that the calculation of the amount charged is correct in all scenarios (with and without fee).                       
Validate the visibility or hiding of the checkbox according to user permissions.                                              
Verify that the charge fee is set to false for NSF_FEE payment transactions created when running the CreateScheduledCreditCardPayments sweep

-----

Validar que o agente pode ignorar a taxa de conveniência (CCFee) ao realizar um pagamento.
Ativar a permissão charge_fee no banco de dados ou feature flag e garantir a funcionalidade.
Validar a existência e o correto preenchimento do campo charge_fee na tabela uown_sv_credit_card_transaction.
Validar que o campo chargeFee é enviado do frontend para o backend de acordo com a seleção do usuário.
Realizar pelo menos duas transações com cartão de crédito após habilitar a flag, validando todo o fluxo.
Confirmar que o gateway recebe e processa corretamente o valor total incluindo a taxa de $1.
Validar que a taxa é registrada corretamente nas tabelas CreditCardTransaction e CCTransaction.
Verificar o valor original, a taxa de $1 e o valor final cobrado nas transações.
Validar a exibição do checkbox "Cobrar taxa de conveniência" no pagamento com cartão de crédito, marcado por padrão, mas permitindo alterações.
Validar que a seleção do checkbox é enviada para o backend (definindo chargeFee).
Garantir que, no Portal do Cliente, o campo chargeFee seja sempre enviado como true para o endpoint makeCreditCardPayment.
Validar a presença das colunas "Valor da Taxa de Cobrança" e "Cobrar Taxa" no histórico de transações de cartão de crédito do Servicing.
Validar a exibição do checkbox "Cobrar taxa de conveniência" no modal de pagamento do Servicing, conforme permissões.
Exibir um aviso claro e visível sobre a taxa de conveniência na tela de pagamento do Portal do Cliente.
Validar que o cálculo do valor cobrado está correto em todos os cenários (com e sem taxa).
Validar a visibilidade ou ocultação do checkbox de acordo com as permissões do usuário.
Verificar que a taxa de cobrança está definida como falsa para transações de pagamento NSF_FEE criadas ao executar o sweep CreateScheduledCreditCardPayments.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

>
> Scenario: Agente ignora a taxa de conveniência ao realizar um pagamento
> Given o agente está na tela de pagamento com cartão de crédito
> When o agente desmarca o checkbox "Cobrar taxa de conveniência"
> And realiza o pagamento
> Then a taxa de conveniência não deve ser cobrada na transação
> | ERROR | AccountPk 206397 | Merchant Progress Mobility  |
> | Ao efetuar um pagamento com cartão de crédito para EPO Only, ocorre o erro "Request processing failed; nested exception is java.lang.NullPointerException" na rota /uown/svc/makeCreditCardPayment. |
> ```
>

> 
> ```gherkin
> Scenario: Persistência e envio do campo charge_fee/chargeFee conforme seleção do usuário
> Given o usuário marca ou desmarca o checkbox "Cobrar taxa de conveniência" na tela de pagamento
> When realiza o pagamento com cartão de crédito
> Then o campo "chargeFee" deve ser enviado do frontend para o backend conforme a seleção feita
> And o campo "charge_fee" deve estar corretamente preenchido na tabela "CreditCardTransaction"
> | ERROR | LeadPk / AccountPk | Merchant | 
> | O valor da taxa não é enviado ao backend |
> ```
>

> 
> ```gherkin
> Scenario: Fluxo completo de transações após habilitar a flag
> Given a flag de cobrança de taxa de conveniência está habilitada
> When o usuário realiza pelo menos duas transações com cartão de crédito
> Then todo o fluxo das transações deve ser validado, incluindo cobrança da taxa quando aplicável
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Gateway recebe valor total incluindo a taxa de $1
> Given uma transação de cartão de crédito com taxa de conveniência é realizada
> Then o gateway de pagamento deve receber e processar o valor total incluindo a taxa de $1
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Verificação do valor original, taxa de $1 e valor final cobrado na transação
> Given uma transação de cartão de crédito é efetuada com a taxa de conveniência
> Then o valor original, a taxa de $1 e o valor final cobrado devem estar corretos na transação
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Exibição e visibilidade do checkbox "Cobrar taxa de conveniência" conforme permissões
> Given um usuário está na tela de pagamento com cartão de crédito
> Then o checkbox "Cobrar taxa de conveniência" deve ser exibido, marcado por padrão, permitindo alterações se o usuário possuir permissão
> And o checkbox deve estar visível ou oculto de acordo com as permissões atribuídas ao usuário
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Envio de chargeFee como true no Portal do Cliente
> Given o usuário realiza um pagamento com cartão de crédito pelo Portal do Cliente
> Then o campo "chargeFee" deve ser sempre enviado como true para o endpoint "makeCreditCardPayment"
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Presença das colunas "Valor da Taxa de Cobrança" e "Cobrar Taxa" no histórico de transações do Servicing
> Given o usuário acessa o histórico de transações de cartão de crédito no Servicing
> Then devem estar presentes as colunas "Valor da Taxa de Cobrança" e "Cobrar Taxa"
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Exibição de aviso claro sobre taxa de conveniência no Portal do Cliente
> Given o usuário acessa a tela de pagamento com cartão de crédito no Portal do Cliente
> Then deve ser exibido um aviso claro e visível sobre a cobrança da taxa de conveniência
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Cálculo correto do valor cobrado em todos os cenários (com e sem taxa)
> Given uma transação de cartão de crédito é realizada
> Then o valor cobrado deve estar correto em todos os cenários, considerando ou não a taxa de conveniência
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Taxa de cobrança falsa para transações NSF_FEE criadas via sweep CreateScheduledCreditCardPayments
> Given o sweep "CreateScheduledCreditCardPayments" é executado gerando transações do tipo NSF_FEE
> Then a taxa de cobrança deve estar definida como falsa nessas transações
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

-----

> ## Tests in stg
> ```gherkin
> ### Scenario: Agent ignores the convenience fee when making a payment
>Given the agent is on the credit card payment screen
>When the agent unchecks the "Charge convenience fee" checkbox
>And makes the payment
>Then the convenience fee should not be charged in the transaction
>| ERROR | AccountPk 206397 | Merchant Progress Mobility  |
>| When making a credit card payment for EPO Only, the error "Request processing failed; nested exception is java.lang.NullPointerException" occurs on the route /uown/svc/makeCreditCardPayment. |
> ```
>

> 
> ```gherkin
> Scenario: Persistence and submission of the charge_fee/chargeFee field based on user selection
> Given the user checks or unchecks the "Charge convenience fee" checkbox on the payment screen
> When the user makes a credit card payment
> Then the "chargeFee" field must be sent from the frontend to the backend according to the selection made
> And the "charge_fee" field must be correctly populated in the "CreditCardTransaction" table
> | ERROR | LeadPk / AccountPk | Merchant |
> | The fee amount is not sent to the backend. |
> ```
>

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


with 
receivable as (select a.pk accountPk, r.pk receivablePk, r.receivable_type receivableType, r.total_amount, r.due_date nextDueDate
                 from
                 uown_sv_account a
                 join uown_sv_receivable r on r.account_pk = a.pk and r.status = 'ACTIVE' and ((r.allocation_status = 'UNPAID' and  
 r.receivable_type NOT IN ( 'EARLY_PAY_OFF')) OR (r.allocation_status = 'PARTIALLY_PAID' and r.receivable_type = 'PROCESSING_FEE'))  
 and r.due_date = current_date+2 and (r.skipped is null or r.skipped=false)
 )
 ,nextreceivable as (
 select nextRec.accountPk accountPk, nextRec.receivablePk receivablePk, nextRec.receivableType receivableType, nextRec.total_amount, nextRec.nextDueDate nextDueDate 
from(
 select a.pk accountPk, r.pk receivablePk, r.receivable_type receivableType, r.total_amount,
 r.due_date nextDueDate, rank() OVER (ORDER BY r.due_date) AS rnk
 from
 uown_sv_account a
 join uown_sv_receivable r on r.account_pk = a.pk and r.status = 'ACTIVE' and ((r.allocation_status = 'UNPAID' and  
 r.receivable_type NOT IN ( 'EARLY_PAY_OFF')) OR (r.allocation_status = 'PARTIALLY_PAID' and r.receivable_type = 'PROCESSING_FEE'))  
 and r.due_date > current_date+2 and (r.skipped is null or r.skipped=false)
 order by r.due_date
 ) nextRec
 where nextRec.rnk <=1
 ),
fees as (
    select a.pk as accountPk, coalesce(sum(r.total_amount), 0.0) as totalFees from uown_sv_account a
    left join uown_sv_receivable r on r.account_pk = a.pk and r.status = 'ACTIVE' and r.receivable_type not in ('REGULAR_PAYMENT', 'EARLY_PAY_OFF', 'PROCESSING_FEE', 'PROTECTION_PLAN_FEE')
    group by a.pk
),
contractBalance as (
    select a.pk as accountPk, s.total_contract_amount_with_tax_and_fees - (coalesce(sum(p.payment_amount), 0.0) - coalesce(f.totalFees, 0.0)) as balance from uown_sv_account a
    join uown_sv_sched_summary s on s.account_pk = a.pk
    left join uown_sv_payment p on p.account_pk = a.pk and p.status = 'PAID'
    left join fees f on f.accountPk = a.pk
    group by a.pk, s.pk, f.totalFees)
 select account.pk as "accountPkk", least(rec.total_amount-rec.partial_payment_amount, balance.balance) as "amountt", receivable.nextDueDate as "postingDatee"
 from receivable
 join uown_sv_account account on account.pk = receivable.accountPk and account.auto_pay_types like '%CC%' and account.auto_pay_types not like '%ACH%' and account.auto_pay_types not like '%PAY_WALLET%'
 join uown_sv_receivable rec on rec.account_pk = account.pk and rec.status = 'ACTIVE' and rec.pk = receivable.receivablePk
 join uown_sv_credit_card creditCard on creditCard.account_pk = account.pk and creditCard.auto_pay = true
 join contractBalance balance on balance.accountPk = account.pk
 where account.account_status = 'ACTIVE' 
   and (account.rating IS NULL OR account.rating NOT IN ('B','C','P'))
   and rec.due_date = receivable.nextDueDate
   and rec.receivable_type NOT IN ('EARLY_PAY_OFF')
   and rec.total_amount > 0
   and balance.balance > 0
   and CASE WHEN rec.receivable_type NOT IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
          THEN ((select count(*) from receivable where accountPk = account.pk and receivableType IN ('REGULAR_PAYMENT')) >= 1)
          ELSE TRUE
          END
    and (select count(*) from uown_sv_achpayment ach where ach.account_pk = account.pk and ach.status IN ('PENDING','PICKED_TO_SEND','STATUS_UPDATE_PENDING')
    and (ach.posting_date <= receivable.nextDueDate or ach.posting_date <= (select COALESCE(nextreceivable.nextDueDate,receivable.nextDueDate)  from nextreceivable where nextreceivable.accountPk = account.pk))) = 0
    and (select count(*) from uown_sv_credit_card_transaction cc where cc.account_pk = account.pk and cc.status IN ('PENDING', 'FUTURE_PENDING', 'PICKED_TO_SEND')
    and (cc.posting_date <= receivable.nextDueDate or cc.posting_date <= (select COALESCE(nextreceivable.nextDueDate,receivable.nextDueDate) from nextreceivable where nextreceivable.accountPk = account.pk)) )= 0
    ;

-----
