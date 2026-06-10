-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Manutenção | Renomear relatórios CC


/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun e informe-nos qual é o assunto quando receber o e-mail com o relatório
Por favor pergunte @davi.artur.gow  sobre como acionar a varredura diária de repetição de inadimplência (execuções às 6h e às 10h) e verificar o nome do assunto nos e-mails recebidos.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

atualizar as contas tornando elegiveis

BEGIN;

-- Lista de transações alvo
-- (deixe esta lista igual em todos os subselects abaixo)
-- 29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
-- 29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
-- 29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
-- 29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
-- 29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
-- 29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
-- 29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
-- 29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
-- 29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
-- 29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
-- 29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
-- 29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
-- 29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
-- 29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
-- 29751

-- 1) Conta ativa e rating elegível
UPDATE uown_sv_account a
SET account_status = 'ACTIVE',
    rating = NULL
WHERE a.pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- 2) Cartão com auto_pay = true
UPDATE uown_sv_credit_card cc
SET auto_pay = TRUE
WHERE cc.account_pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- 3) Delinquency até hoje
UPDATE uown_sv_sched_summary s
SET delinquency_as_of_date = CURRENT_DATE
WHERE s.account_pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- (Opcional) inserir sched_summary se faltar (preencha colunas obrigatórias conforme seu schema)
-- INSERT INTO uown_sv_sched_summary (account_pk, delinquency_as_of_date)
-- SELECT cct.account_pk, CURRENT_DATE
-- FROM uown_sv_credit_card_transaction cct
-- LEFT JOIN uown_sv_sched_summary s ON s.account_pk = cct.account_pk
-- WHERE cct.pk IN (... mesma lista ...)
--   AND s.account_pk IS NULL;

-- 4) Ajustar as transações para elegibilidade
UPDATE uown_sv_credit_card_transaction cct
SET status = 'DENIED',                 -- ou 'ERROR'
    posting_date = CURRENT_DATE,
    agent_username = 'qa.automation',  -- evitar 'SpecialProcess#5014'
    cc_transaction_type = 'SCHEDULED',
    cc_action = 'SALE',
    error = NULL,                      -- evitar mensagens bloqueadoras
    comment = NULL                     -- evitar "Idempotent transaction was run. %"
WHERE cct.pk IN (
  29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
  29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
  29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
  29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
  29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
  29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
  29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
  29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
  29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
  29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
  29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
  29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
  29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
  29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
  29751
);

COMMIT;

-- Verificação (opcional)
SELECT cct.pk,
       cct.account_pk,
       cct.status, cct.posting_date, cct.agent_username,
       cct.cc_transaction_type, cct.cc_action, cct.error, cct.comment
FROM uown_sv_credit_card_transaction cct
WHERE cct.pk IN (
  29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
  29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
  29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
  29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
  29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
  29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
  29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
  29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
  29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
  29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
  29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
  29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
  29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
  29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
  29751
);

-----

Você já deixou os registros elegíveis (lista dos cct.pk e contas confirmadas acima).
Agora execute o que o pedido exige:

Disparar o endpoint de CC Denied Rerun
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun
Faça no(s) ambiente(s) corretos .

Disparar as duas execuções do delinquency rerun sweep:
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep

6h (run das 6 AM)
10h (run das 10 AM)
Para cada execução, monitorar a caixa de e-mail que recebe o relatório e registrar exatamente a linha de assunto (subject).
Informar esses subjects no ticket (junto com o ambiente).

Recomendado (boa prática, mas opcional se o pedido for só o subject):
Registrar o HTTP response (status/body) de cada disparo.
Anotar data/hora do disparo e do recebimento do e-mail.
Se o e-mail não chegar em X minutos, checar logs/DB e tentar novamente.
Observações:

Os endpoints/params de 6h/10h variam por ambiente e implementação; confirme com o @davi.artur.gow o caminho exato (ex.: rota única com parâmetro run=6AM/10AM, headers de auth, etc.) e qual mailbox/lista recebe o relatório. Após isso, é só disparar as duas varreduras e reportar os subjects.

-----

update que torna contas elegiveis para delinquency rerun sweep

BEGIN;

-- Lista alvo
-- 10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
-- 10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
-- 10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
-- 10797,10798,10799,10800,10803,10801,10802

-- 1) Conta ativa e rating elegível
UPDATE uown_sv_account a
SET account_status = 'ACTIVE',
    rating = NULL
WHERE a.pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 2) Cartão válido para a conta
UPDATE uown_sv_credit_card cc
SET auto_pay = TRUE,
    is_deleted = FALSE,
    is_valid_card = TRUE
WHERE cc.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 3) Delinquency > 100 dias
UPDATE uown_sv_sched_summary s
SET delinquency_as_of_date = CURRENT_DATE - INTERVAL '101 days'
WHERE s.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 3.1) (Opcional) Inserir sched_summary se faltar (ajuste colunas obrigatórias do seu schema)
-- INSERT INTO uown_sv_sched_summary (account_pk, delinquency_as_of_date)
-- SELECT a.pk, CURRENT_DATE - INTERVAL '101 days'
-- FROM uown_sv_account a
-- LEFT JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
-- WHERE a.pk IN (
--   10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
--   10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
--   10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
--   10797,10798,10799,10800,10803,10801,10802
-- ) AND s.account_pk IS NULL;

-- 4) Garantir pagamento PAID com cc_pk válido (um por conta, mais recente)
UPDATE uown_sv_payment p
SET status = 'PAID',
    cc_pk = (
      SELECT cc.pk
      FROM uown_sv_credit_card cc
      WHERE cc.account_pk = p.account_pk
        AND COALESCE(cc.is_deleted, FALSE) = FALSE
      ORDER BY cc.pk DESC
      LIMIT 1
    )
WHERE p.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
)
AND p.pk IN (
  SELECT DISTINCT ON (p2.account_pk) p2.pk
  FROM uown_sv_payment p2
  WHERE p2.account_pk IN (
    10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
    10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
    10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
    10797,10798,10799,10800,10803,10801,10802
  )
  ORDER BY p2.account_pk, p2.pk DESC
);

COMMIT;

-- Verificação: deve listar as contas agora elegíveis
SELECT DISTINCT s.account_pk
FROM uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
  AND CURRENT_DATE - s.delinquency_as_of_date > 100
  AND a.account_status = 'ACTIVE'
  AND COALESCE(cc.is_deleted, FALSE) = FALSE
  AND COALESCE(cc.auto_pay, FALSE) = TRUE
  AND COALESCE(cc.is_valid_card, TRUE) = TRUE
  AND pmt.status = 'PAID'
  AND pmt.cc_pk IS NOT NULL
  AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
  AND s.account_pk IN (
    10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
    10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
    10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
    10797,10798,10799,10800,10803,10801,10802
  );

-----













-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------












a tarefa pede isso
UOWN | Manutenção | Renomear relatórios CC
/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun e informe-nos qual é o assunto quando receber o e-mail com o relatório
Por favor pergunte @davi.artur.gow  sobre como acionar a varredura diária de repetição de inadimplência (execuções às 6h e às 10h) e verificar o nome do assunto nos e-mails recebidos.

Eu tornei alguns registros elegiveis e executei os endpoints

atualizar as contas tornando elegiveis

BEGIN;

-- Lista de transações alvo
-- (deixe esta lista igual em todos os subselects abaixo)
-- 29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
-- 29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
-- 29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
-- 29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
-- 29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
-- 29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
-- 29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
-- 29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
-- 29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
-- 29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
-- 29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
-- 29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
-- 29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
-- 29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
-- 29751

-- 1) Conta ativa e rating elegível
UPDATE uown_sv_account a
SET account_status = 'ACTIVE',
    rating = NULL
WHERE a.pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- 2) Cartão com auto_pay = true
UPDATE uown_sv_credit_card cc
SET auto_pay = TRUE
WHERE cc.account_pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- 3) Delinquency até hoje
UPDATE uown_sv_sched_summary s
SET delinquency_as_of_date = CURRENT_DATE
WHERE s.account_pk IN (
  SELECT DISTINCT cct.account_pk
  FROM uown_sv_credit_card_transaction cct
  WHERE cct.pk IN (
    29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
    29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
    29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
    29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
    29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
    29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
    29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
    29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
    29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
    29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
    29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
    29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
    29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
    29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
    29751
  )
);

-- (Opcional) inserir sched_summary se faltar (preencha colunas obrigatórias conforme seu schema)
-- INSERT INTO uown_sv_sched_summary (account_pk, delinquency_as_of_date)
-- SELECT cct.account_pk, CURRENT_DATE
-- FROM uown_sv_credit_card_transaction cct
-- LEFT JOIN uown_sv_sched_summary s ON s.account_pk = cct.account_pk
-- WHERE cct.pk IN (... mesma lista ...)
--   AND s.account_pk IS NULL;

-- 4) Ajustar as transações para elegibilidade
UPDATE uown_sv_credit_card_transaction cct
SET status = 'DENIED',                 -- ou 'ERROR'
    posting_date = CURRENT_DATE,
    agent_username = 'qa.automation',  -- evitar 'SpecialProcess#5014'
    cc_transaction_type = 'SCHEDULED',
    cc_action = 'SALE',
    error = NULL,                      -- evitar mensagens bloqueadoras
    comment = NULL                     -- evitar "Idempotent transaction was run. %"
WHERE cct.pk IN (
  29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
  29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
  29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
  29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
  29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
  29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
  29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
  29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
  29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
  29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
  29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
  29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
  29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
  29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
  29751
);

COMMIT;

-- Verificação (opcional)
SELECT cct.pk,
       cct.account_pk,
       cct.status, cct.posting_date, cct.agent_username,
       cct.cc_transaction_type, cct.cc_action, cct.error, cct.comment
FROM uown_sv_credit_card_transaction cct
WHERE cct.pk IN (
  29613,29614,29615,29617,29618,29619,29616,29620,29621,29622,
  29623,29624,29625,29626,29628,29629,29630,29627,29631,29632,
  29633,29635,29634,29636,29637,29639,29638,29640,29641,29642,
  29643,29644,29645,29647,29646,29648,29649,29650,29651,29652,
  29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,
  29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,
  29673,29674,29675,29676,29677,29679,29678,29680,29681,29682,
  29684,29683,29685,29686,29687,29688,29689,29690,29691,29692,
  29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,
  29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,
  29714,29713,29715,29717,29718,29716,29719,29720,29721,29722,
  29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,
  29733,29734,29736,29735,29737,29738,29739,29740,29741,29742,
  29743,29744,29745,29746,29747,29748,29749,29750,29752,29753,
  29751
);

-----

Você já deixou os registros elegíveis (lista dos cct.pk e contas confirmadas acima).
Agora execute o que o pedido exige:

Disparar o endpoint de CC Denied Rerun
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun
Faça no(s) ambiente(s) corretos .

Disparar as duas execuções do delinquency rerun sweep:
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep
6h (run das 6 AM)
10h (run das 10 AM)
Para cada execução, monitorar a caixa de e-mail que recebe o relatório e registrar exatamente a linha de assunto (subject).
Informar esses subjects no ticket (junto com o ambiente).

Recomendado (boa prática, mas opcional se o pedido for só o subject):
Registrar o HTTP response (status/body) de cada disparo.
Anotar data/hora do disparo e do recebimento do e-mail.
Se o e-mail não chegar em X minutos, checar logs/DB e tentar novamente.
Observações:

Os endpoints/params de 6h/10h variam por ambiente e implementação; confirme com o @davi.artur.gow o caminho exato (ex.: rota única com parâmetro run=6AM/10AM, headers de auth, etc.) e qual mailbox/lista recebe o relatório. Após isso, é só disparar as duas varreduras e reportar os subjects.

-----

update que torna contas elegiveis para delinquency rerun sweep

BEGIN;

-- Lista alvo
-- 10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
-- 10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
-- 10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
-- 10797,10798,10799,10800,10803,10801,10802

-- 1) Conta ativa e rating elegível
UPDATE uown_sv_account a
SET account_status = 'ACTIVE',
    rating = NULL
WHERE a.pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 2) Cartão válido para a conta
UPDATE uown_sv_credit_card cc
SET auto_pay = TRUE,
    is_deleted = FALSE,
    is_valid_card = TRUE
WHERE cc.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 3) Delinquency > 100 dias
UPDATE uown_sv_sched_summary s
SET delinquency_as_of_date = CURRENT_DATE - INTERVAL '101 days'
WHERE s.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
);

-- 3.1) (Opcional) Inserir sched_summary se faltar (ajuste colunas obrigatórias do seu schema)
-- INSERT INTO uown_sv_sched_summary (account_pk, delinquency_as_of_date)
-- SELECT a.pk, CURRENT_DATE - INTERVAL '101 days'
-- FROM uown_sv_account a
-- LEFT JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
-- WHERE a.pk IN (
--   10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
--   10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
--   10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
--   10797,10798,10799,10800,10803,10801,10802
-- ) AND s.account_pk IS NULL;

-- 4) Garantir pagamento PAID com cc_pk válido (um por conta, mais recente)
UPDATE uown_sv_payment p
SET status = 'PAID',
    cc_pk = (
      SELECT cc.pk
      FROM uown_sv_credit_card cc
      WHERE cc.account_pk = p.account_pk
        AND COALESCE(cc.is_deleted, FALSE) = FALSE
      ORDER BY cc.pk DESC
      LIMIT 1
    )
WHERE p.account_pk IN (
  10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
  10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
  10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
  10797,10798,10799,10800,10803,10801,10802
)
AND p.pk IN (
  SELECT DISTINCT ON (p2.account_pk) p2.pk
  FROM uown_sv_payment p2
  WHERE p2.account_pk IN (
    10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
    10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
    10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
    10797,10798,10799,10800,10803,10801,10802
  )
  ORDER BY p2.account_pk, p2.pk DESC
);

COMMIT;

-- Verificação: deve listar as contas agora elegíveis
SELECT DISTINCT s.account_pk
FROM uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
  AND CURRENT_DATE - s.delinquency_as_of_date > 100
  AND a.account_status = 'ACTIVE'
  AND COALESCE(cc.is_deleted, FALSE) = FALSE
  AND COALESCE(cc.auto_pay, FALSE) = TRUE
  AND COALESCE(cc.is_valid_card, TRUE) = TRUE
  AND pmt.status = 'PAID'
  AND pmt.cc_pk IS NOT NULL
  AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
  AND s.account_pk IN (
    10767,10768,10769,10772,10770,10775,10771,10773,10774,10776,
    10777,10778,10779,10780,10781,10782,10783,10786,10784,10790,
    10785,10789,10787,10788,10791,10792,10793,10794,10795,10796,
    10797,10798,10799,10800,10803,10801,10802
  );

-----

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_RenameCCReports_ticket385

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun


https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep

diario
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/dailyDelinquencyRerunCCSweep

https://gitlab.com/uown/devops/configuration/-/blob/uown-qa2/config/svc/application.yaml