--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/138

UOWN | Customer Portal | Simplify Payment History Display
Aberto
  Tíquete criado 1 mês atrás por Yuri Araujo
Tíquete
UOWN | Customer Portal | Simplify Payment History Display
Synopsis
Customers have been confused by the Payment History screen, where a single payment can generate multiple line items. This has led some users to believe they were charged multiple times.
The request is to simplify the display so that only one entry per payment is shown, reflecting its latest status.
Additionally, any payment with a CANCELLED status should be removed from the display to avoid unnecessary clutter.

Business Objective
Improve user experience and reduce customer complaints by providing a cleaner, clearer view of payment activity. Showing a single, consolidated record per payment — with its most recent status — eliminates misunderstandings related to duplicate-looking entries.

Features & Requirements
1. Show only one entry per payment
The Payment History must include only one row per payment.
That row must display the most recent status of the payment.
Older or duplicate rows referring to the same payment should be removed from view.
2. Remove CANCELLED payments
Entries with CANCELLED status must not appear in the list.
Only relevant and active payment data should be shown.
3. Transaction ID no longer required
Since the display will now show one line per payment, a Transaction ID indicator is no longer necessary.
An example of a transactionID can be seen in Servicing on the CC Transactions page, at the end of the table.
4. No changes to payment logic
This update must affect only the UI/UX layer.
Payment processing, refund workflows, and backend logic must remain unchanged.

![alt text](image.png)

--------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | Portal do Cliente | Simplificar Exibição do Histórico de Pagamentos

**Aberto**
Tíquete criado há 1 mês por Yuri Araujo

### Tíquete

**UOWN | Portal do Cliente | Simplificar Exibição do Histórico de Pagamentos**

### Sinopse

Os clientes têm demonstrado confusão na tela de **Histórico de Pagamentos**, onde um único pagamento pode gerar múltiplas linhas. Isso tem levado alguns usuários a acreditarem que foram cobrados mais de uma vez.

A solicitação é simplificar a exibição para que apenas **uma entrada por pagamento** seja mostrada, refletindo o **status mais recente** desse pagamento.

Além disso, qualquer pagamento com status **CANCELLED** deve ser removido da exibição para evitar poluição visual desnecessária.

### Objetivo de Negócio

Melhorar a experiência do usuário e reduzir reclamações de clientes ao fornecer uma visualização mais limpa e clara da atividade de pagamentos. Exibir um único registro consolidado por pagamento — com seu status mais recente — elimina interpretações equivocadas relacionadas a entradas que aparentam duplicidade.

### Funcionalidades & Requisitos

#### 1. Exibir apenas uma entrada por pagamento

* O Histórico de Pagamentos deve conter apenas **uma linha por pagamento**.
* Essa linha deve exibir o **status mais recente** do pagamento.
* Linhas antigas ou duplicadas referentes ao mesmo pagamento devem ser removidas da visualização.

#### 2. Remover pagamentos CANCELLED

* Entradas com status **CANCELLED** não devem aparecer na lista.
* Apenas dados de pagamentos relevantes e ativos devem ser exibidos.

#### 3. Transaction ID não é mais necessário

* Como a exibição passará a mostrar apenas uma linha por pagamento, o indicador de **Transaction ID** deixa de ser necessário.
* Um exemplo de *transactionID* pode ser visto no Servicing, na página **CC Transactions**, ao final da tabela.

#### 4. Nenhuma alteração na lógica de pagamentos

* Esta atualização deve afetar **somente a camada de UI/UX**.
* Processamento de pagamentos, fluxos de reembolso e lógica de backend devem permanecer inalterados.

--------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 2 arquivos
+
170
−
133
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uownlea
‎sing/svc/service‎

PaymentSe
‎rvice.java‎
+0 -4

resourc
‎es/sqls‎

customerpa
‎yments.sql‎
+170 -129

 src/main/java/com/uownleasing/svc/service/PaymentService.java 
+
0
−
4

Visualizado
@@ -145,9 +145,6 @@ public class PaymentService {
        return transactionSummary;
    }

--------------------------------------------------------------------------------------------------------------------------------------------------------

    public List<CustomerPayment> getAllCustomerPaymentsForAccount(long accountPK){
        SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("customerpayments");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery();
@@ -155,7 +152,6 @@ public class PaymentService {
        query.setParameter("accountPk", accountPK);
        List<CustomerPayment> customerPayments  = query.setResultTransformer(Transformers.aliasToBean(CustomerPayment.class)).getResultList();
        return customerPayments;

    }

    public CustomerPayment createOrUpdateCustomerPayment(CustomerPayment customerPayment){
 src/main/resources/sqls/customerpayments.sql 
+
170
−
129

Visualizado
WITH refundPayment as
         (SELECT ach.posting_date, ach.ach_type, ach.ach_process_type, ach.account_pk, ach.payment_pk, ach.row_created_timestamp
          FROM uown_sv_achpayment ach
          WHERE ach.ach_type = 'ACHDebit'
            AND ach.status = 'REFUNDED'),
     refundCCPayment as
         (SELECT cc.posting_date, cc.cc_action, cc.cc_transaction_type, cc.account_pk, cc.payment_pk, cc.row_created_timestamp
          FROM uown_sv_credit_card_transaction cc
          WHERE cc.cc_action = 'SALE'
            AND cc.status = 'REFUNDED')
SELECT * FROM (
                  SELECT ach.account_pk as "accountPkk",
                         COALESCE(refundPayment.posting_date,ach.posting_date) as "postingDate",
                         ach.amount as "amount",
                         'ACH' as "paymentType",
                         CASE
                             WHEN ach.ach_type = 'ACHCredit' and ach.status IN ('PENDING')
                                 THEN 'PENDING_REFUND'
                             WHEN  ach.ach_type = 'ACHCredit' and ach.status IN ('SETTLED')
                                 THEN 'REFUNDED'
                             WHEN ach.status IN ('PENDING')
                                 THEN 'PENDING'
                             WHEN ach.status IN ('REFUNDED')
                                 THEN 'PAID'
                             WHEN ach.status IN('SENT','ACK_RECEIVED', 'PICKED_TO_SEND','STATUS_UPDATE_PENDING')
                                 THEN 'SENT_TO_BANK'
                             WHEN ach.status IN ('COMPLETED', 'SETTLED')
                                 THEN 'PAID'
                             WHEN ach.status IN ('RETURNED')
                                 THEN 'RETURNED'
                             WHEN ach.status IN ('REVERSED', 'MANUAL_REVERSE', 'SETTLED_IN_RERUN')
                                 THEN 'REVERSED'
                             WHEN ach.status IN ('ERROR', 'ERROR_SENDING', 'ACK_ERROR')
                                 THEN 'ERROR'
                             WHEN ach.status IN ('CANCELLED', 'INACTIVE')
                                 THEN 'CANCELLED'
                             ELSE
                                 'UNKNOWN'
                             END
                             as "status",
                         ach.pk as "achPkk",
                         0 as "ccPkk",
                         CASE
                             WHEN ach.ach_type = 'ACHCredit' and ach.status IN ('PENDING')
                                 THEN false
                             WHEN ach.ach_process_type = 'RERUN' AND ach.status IN ('PENDING')
                                 THEN false
                             WHEN ach.status IN ('PENDING')
                                 THEN true
                             ELSE false
                             END
                             as "canBeModified",
                         ach.comments as "comments",
                         COALESCE(refundPayment.row_created_timestamp,ach.row_created_timestamp) as "paymentTime",
                         ach.account_number as "accountNumber",
                         '0' as "ccNumber"
                  FROM public.uown_sv_achpayment ach
                           LEFT JOIN refundPayment
                                     ON refundPayment.account_pk = ach.account_pk
                                         AND refundPayment.payment_pk = ach.payment_pk
                  WHERE ach.account_pk = :accountPk
                  --AND NOT (ach.status = 'REFUNDED' and ach.ach_type = 'ACHDebit')
                  UNION ALL
                  SELECT cc.account_pk as "accountPkk",
                         COALESCE(refundCCPayment.posting_date,cc.posting_date) as "postingDate",
                         cc.amount as "amount",
                         'CC' as "paymentType",
                         CASE
                             WHEN cc.cc_action = 'CREDIT' and cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                 THEN 'PENDING_REFUND'
                             WHEN cc.cc_action = 'CREDIT' and cc.status IN ('APPROVED')
                                 THEN 'REFUNDED'
                             WHEN cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                 THEN 'PENDING'
                             WHEN cc.status IN ('REFUNDED')
                                 THEN 'PAID'
                             WHEN cc.status IN ('APPROVED')
                                 THEN 'PAID'
                             WHEN cc.status IN ('DENIED')
                                 THEN 'DENIED'
                             WHEN cc.status IN ('MANUAL_REVERSE')
                                 THEN 'REVERSED'
                             WHEN cc.status IN ('ERROR')
                                 THEN 'ERROR'
                             WHEN cc.status IN ('CANCELLED')
                                 THEN 'CANCELLED'
                             ELSE
                                 'UNKNOWN'
                             END
                             as "status",
                         0 as "achPkk",
                         cc.pk as "ccPkk",
                         CASE
                             WHEN cc.cc_action = 'CREDIT' and cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                 THEN false
                             WHEN cc.status IN ('PENDING','FUTURE_PENDING')
                                 THEN true
                             ELSE false
                             END
                             as "canBeModified",
                         cc.comment as "comments",
                         COALESCE(refundCCPayment.posting_date,cc.row_created_timestamp) as "paymentTime",
                         '0' as "accountNumber",
                         cc.cc_number as "ccNumber"
                  FROM public.uown_sv_credit_card_transaction cc
                           LEFT JOIN refundCCPayment
                                     ON refundCCPayment.account_pk = cc.account_pk
                                         AND refundCCPayment.payment_pk = cc.payment_pk
                  WHERE cc.account_pk = :accountPk
                    --AND NOT (cc.status = 'REFUNDED' and cc.cc_action = 'SALE')
                    AND cc.cc_action <> 'TOKENIZATION'
                  UNION ALL
                  SELECT payment.account_pk as "accountPkk",
                         payment.payment_date as "postingDate",
                         payment.payment_amount as "amount",
                         payment.payment_type as "paymentType",
                         payment.status as "status",
                         0 as "achPkk",
                         0 as "ccPkk",
                         false as "canBeModified",
                         payment.reason as "comments",
                         payment.row_created_timestamp as "paymentTime",
                         '0' as "accountNumber",
                         '0' as "ccNumber"
                  FROM public.uown_sv_payment payment
                  WHERE payment.account_pk = :accountPk
                    AND (payment.payment_type NOT IN ('ACH','CC','DEPOSIT') )
              ) as payments
ORDER BY payments."postingDate" desc
WITH payments AS (
    WITH refundPayment as
             (SELECT ach.posting_date, ach.ach_type, ach.ach_process_type, ach.account_pk, ach.payment_pk, ach.row_created_timestamp
              FROM uown_sv_achpayment ach
              WHERE ach.ach_type = 'ACHDebit'
                AND ach.status = 'REFUNDED'),
         refundCCPayment as
             (SELECT cc.posting_date, cc.cc_action, cc.cc_transaction_type, cc.account_pk, cc.payment_pk, cc.row_created_timestamp
              FROM uown_sv_credit_card_transaction cc
              WHERE cc.cc_action = 'SALE'
                AND cc.status = 'REFUNDED')
    SELECT * FROM (
                      SELECT ach.account_pk as "accountPkk",
                             COALESCE(refundPayment.posting_date,ach.posting_date) as "postingDate",
                             ach.amount as "amount",
                             'ACH' as "paymentType",
                             CASE
                                 WHEN ach.ach_type = 'ACHCredit' and ach.status IN ('PENDING')
                                     THEN 'PENDING_REFUND'
                                 WHEN  ach.ach_type = 'ACHCredit' and ach.status IN ('SETTLED')
                                     THEN 'REFUNDED'
                                 WHEN ach.status IN ('PENDING')
                                     THEN 'PENDING'
                                 WHEN ach.status IN ('REFUNDED')
                                     THEN 'PAID'
                                 WHEN ach.status IN('SENT','ACK_RECEIVED', 'PICKED_TO_SEND','STATUS_UPDATE_PENDING')
                                     THEN 'SENT_TO_BANK'
                                 WHEN ach.status IN ('COMPLETED', 'SETTLED')
                                     THEN 'PAID'
                                 WHEN ach.status IN ('RETURNED')
                                     THEN 'RETURNED'
                                 WHEN ach.status IN ('REVERSED', 'MANUAL_REVERSE', 'SETTLED_IN_RERUN')
                                     THEN 'REVERSED'
                                 WHEN ach.status IN ('ERROR', 'ERROR_SENDING', 'ACK_ERROR')
                                     THEN 'ERROR'
                                 WHEN ach.status IN ('CANCELLED', 'INACTIVE')
                                     THEN 'CANCELLED'
                                 ELSE
                                     'UNKNOWN'
                                 END
                                 as "status",
                             ach.pk as "achPkk",
                             0 as "ccPkk",
                             CASE
                                 WHEN ach.ach_type = 'ACHCredit' and ach.status IN ('PENDING')
                                     THEN false
                                 WHEN ach.ach_process_type = 'RERUN' AND ach.status IN ('PENDING')
                                     THEN false
                                 WHEN ach.status IN ('PENDING')
                                     THEN true
                                 ELSE false
                                 END
                                 as "canBeModified",
                             ach.comments as "comments",
                             COALESCE(refundPayment.row_created_timestamp,ach.row_created_timestamp) as "paymentTime",
                             ach.account_number as "accountNumber",
                             '0' as "ccNumber"
                      FROM public.uown_sv_achpayment ach
                               LEFT JOIN refundPayment
                                         ON refundPayment.account_pk = ach.account_pk
                                             AND refundPayment.payment_pk = ach.payment_pk
                      WHERE ach.account_pk = :accountPk
                      --AND NOT (ach.status = 'REFUNDED' and ach.ach_type = 'ACHDebit')
                      UNION ALL
                      SELECT cc.account_pk as "accountPkk",
                             COALESCE(refundCCPayment.posting_date,cc.posting_date) as "postingDate",
                             cc.amount as "amount",
                             'CC' as "paymentType",
                             CASE
                                 WHEN cc.cc_action = 'CREDIT' and cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                     THEN 'PENDING_REFUND'
                                 WHEN cc.cc_action = 'CREDIT' and cc.status IN ('APPROVED')
                                     THEN 'REFUNDED'
                                 WHEN cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                     THEN 'PENDING'
                                 WHEN cc.status IN ('REFUNDED')
                                     THEN 'PAID'
                                 WHEN cc.status IN ('APPROVED')
                                     THEN 'PAID'
                                 WHEN cc.status IN ('DENIED')
                                     THEN 'DENIED'
                                 WHEN cc.status IN ('MANUAL_REVERSE')
                                     THEN 'REVERSED'
                                 WHEN cc.status IN ('ERROR')
                                     THEN 'ERROR'
                                 WHEN cc.status IN ('CANCELLED')
                                     THEN 'CANCELLED'
                                 ELSE
                                     'UNKNOWN'
                                 END
                                 as "status",
                             0 as "achPkk",
                             cc.pk as "ccPkk",
                             CASE
                                 WHEN cc.cc_action = 'CREDIT' and cc.status IN ('PENDING','FUTURE_PENDING', 'PICKED_TO_SEND')
                                     THEN false
                                 WHEN cc.status IN ('PENDING','FUTURE_PENDING')
                                     THEN true
                                 ELSE false
                                 END
                                 as "canBeModified",
                             cc.comment as "comments",
                             COALESCE(refundCCPayment.posting_date,cc.row_created_timestamp) as "paymentTime",
                             '0' as "accountNumber",
                             cc.cc_number as "ccNumber"
                      FROM public.uown_sv_credit_card_transaction cc
                               LEFT JOIN refundCCPayment
                                         ON refundCCPayment.account_pk = cc.account_pk
                                             AND refundCCPayment.payment_pk = cc.payment_pk
                      WHERE cc.account_pk = :accountPk
                        --AND NOT (cc.status = 'REFUNDED' and cc.cc_action = 'SALE')
                        AND cc.cc_action <> 'TOKENIZATION'
                      UNION ALL
                      SELECT payment.account_pk as "accountPkk",
                             payment.payment_date as "postingDate",
                             payment.payment_amount as "amount",
                             payment.payment_type as "paymentType",
                             payment.status as "status",
                             0 as "achPkk",
                             0 as "ccPkk",
                             false as "canBeModified",
                             payment.reason as "comments",
                             payment.row_created_timestamp as "paymentTime",
                             '0' as "accountNumber",
                             '0' as "ccNumber"
                      FROM public.uown_sv_payment payment
                      WHERE payment.account_pk = :accountPk
                        AND (payment.payment_type NOT IN ('ACH','CC','DEPOSIT') )
                  ) as payments
    ORDER BY payments."postingDate" desc
    ),
    numbered AS (
        SELECT
            p.*,
            ROW_NUMBER() OVER (
                PARTITION BY
                    p."accountPkk",
                    p."paymentType",
                    p."amount",
                    p."status"
                ORDER BY p."paymentTime"
            ) AS rn
        FROM payments p
        WHERE p."status" <> 'CANCELLED'
)
SELECT
    n."accountPkk"        AS "accountPkk",
    n."postingDate"       AS "postingDate",
    n."amount"            AS "amount",
    n."paymentType"       AS "paymentType",
    n."status"            AS "status",
    n."achPkk"            AS "achPkk",
    n."ccPkk"             AS "ccPkk",
    n."canBeModified"     AS "canBeModified",
    n."comments"          AS "comments",
    n."paymentTime"       AS "paymentTime",
    n."accountNumber"     AS "accountNumber",
    n."ccNumber"          AS "ccNumber"
FROM numbered n
LEFT JOIN numbered r
    ON r."accountPkk" = n."accountPkk"
   AND r."paymentType" = n."paymentType"
   AND r."amount" = n."amount"
   AND r."status" = 'REFUNDED'
   AND n."status" = 'PAID'
   AND r.rn = n.rn
WHERE
    n."status" <> 'PAID'
    OR r."accountPkk" IS NULL
ORDER BY n."postingDate" DESC;

--------------------------------------------------------------------------------------------------------------------------------------------------------

A seguir está a **lista de requisitos comportamentais**, derivada da tarefa original **e das alterações de desenvolvimento**, seguida da **avaliação objetiva dos testes manuais realizados**.

---

## Lista de Requisitos (foco no comportamento do usuário)

1. O usuário visualiza **apenas uma linha por pagamento** no Histórico de Pagamentos.
2. Cada pagamento exibido representa o **estado mais recente** daquele pagamento.
3. O usuário **não visualiza pagamentos com status CANCELLED**.
4. O usuário **não visualiza múltiplas linhas** referentes ao mesmo pagamento, ainda que existam eventos intermediários (rerun, refund, reverse).
5. O usuário **não visualiza identificador de Transaction ID** no Histórico de Pagamentos.
6. O usuário visualiza corretamente pagamentos **ACH, CC e outros tipos**, consolidados conforme regra de deduplicação.
7. O usuário visualiza corretamente pagamentos **reembolsados**, sem confusão entre valores pagos e reembolsados.
8. O usuário visualiza corretamente pagamentos **revertidos**, sem duplicidade entre pagamento original e reversão.
9. O usuário não é impactado por alterações em **lógica de pagamento, reembolso ou backend funcional** (apenas exibição).
10. A ordenação apresentada ao usuário segue a **data de posting mais recente**.

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---
- The user sees **only one row per payment** in the Payment History.
- Each displayed payment represents the **most recent state** of that payment.
- The user **does not see payments with CANCELLED status**.
- The user **does not see multiple rows** for the same payment, even when intermediate events exist (rerun, refund, reversal).
- The user **does not see a Transaction ID identifier** in the Payment History.
- The user correctly sees **ACH, CC, and other payment types**, consolidated according to the deduplication rules.
- The user correctly sees **refunded payments**, without confusion between paid and refunded amounts.
- The user correctly sees **reversed payments**, without duplication between the original payment and the reversal.
- The user is **not impacted by changes to payment logic, refund workflows, or backend processing** (display-only changes).
- The list displayed to the user is ordered by the **most recent posting date**.

---

### Reverse

![Screenshot_at_Jan_09_12-10-46](/uploads/94f45c30e5074c39e15a24dd82244160/Screenshot_at_Jan_09_12-10-46.png){width=900 height=461}

![Screenshot_at_Jan_09_12-11-22](/uploads/b6ddee6d20fa7e1f29471450cbbe8cb7/Screenshot_at_Jan_09_12-11-22.png){width=900 height=382}

![Screenshot_at_Jan_09_12-12-07](/uploads/819245356f9054987adadabb56213c33/Screenshot_at_Jan_09_12-12-07.png){width=900 height=441}

**| PASS |**

**| LeadPk: 10444 |**

**| AccountPk: 4299 |**

---

### Partially Refunded

![image](/uploads/aa7c80ae0635f89a25cf5dbacb0184b1/image.png){width=900 height=272}

![image](/uploads/49d044418d884f21a61df5f05d0626cc/image.png){width=900 height=207}

![image](/uploads/3540b246a1a7033e8617b33dc6236a7b/image.png){width=900 height=206}

![image](/uploads/b5b21fb93990dff3b7fec1496ba4d5d8/image.png){width=900 height=455}

**| PASS |**

**| LeadPk: 10518 |**

**| AccountPk: 4322 |**

---


---

### Fully Refunded

![Screenshot_at_Jan_09_12-17-28](/uploads/7decb2f2f6e97fc05c725f25a3a042fa/Screenshot_at_Jan_09_12-17-28.png){width=900 height=240}

![Screenshot_at_Jan_09_12-18-09](/uploads/22ce5a435d6ca2a358f9d649cbda8f67/Screenshot_at_Jan_09_12-18-09.png){width=900 height=422}

![Screenshot_at_Jan_09_12-19-15](/uploads/ca93142202e2b3844a5e313d4971a69a/Screenshot_at_Jan_09_12-19-15.png){width=900 height=27}

![Screenshot_at_Jan_09_12-19-27](/uploads/ab779da53fbee4eff64271e83f86d066/Screenshot_at_Jan_09_12-19-27.png){width=900 height=24}

![Screenshot_at_Jan_09_12-19-58](/uploads/b7b80fb143909e78ef392d024f8d9e53/Screenshot_at_Jan_09_12-19-58.png){width=589 height=386}

![Screenshot_at_Jan_09_12-26-01](/uploads/5ed99dcca8d05b500a13ac9f590d328f/Screenshot_at_Jan_09_12-26-01.png){width=900 height=269}


![image](/uploads/f5a5ae94da7fc4289130b404e4b8f9ba/image.png){width=900 height=82}

![image](/uploads/3dce0babcc157258525a9a0304960731/image.png){width=900 height=85}

![image](/uploads/af1a18da0474f831403005f1c385adcf/image.png){width=900 height=425}

![image](/uploads/47bbd2e17c75eef267eaac4c8bc43e01/image.png){width=900 height=230}

![image](/uploads/5e614d2407bd8ad84e4601b8625e46bd/image.png){width=900 height=109}

![image](/uploads/55a53eba974c871c0c93f5e4a86a78c4/image.png){width=900 height=105}

**| PASS |**

**| LeadPk: 10327 |**

**| AccountPk: 4290 |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in stg

---
- The user sees **only one row per payment** in the Payment History.
- Each displayed payment represents the **most recent state** of that payment.
- The user **does not see payments with CANCELLED status**.
- The user **does not see multiple rows** for the same payment, even when intermediate events exist (rerun, refund, reversal).
- The user **does not see a Transaction ID identifier** in the Payment History.
- The user correctly sees **ACH, CC, and other payment types**, consolidated according to the deduplication rules.
- The user correctly sees **refunded payments**, without confusion between paid and refunded amounts.
- The user correctly sees **reversed payments**, without duplication between the original payment and the reversal.
- The user is **not impacted by changes to payment logic, refund workflows, or backend processing** (display-only changes).
- The list displayed to the user is ordered by the **most recent posting date**.

---

### Reverse


**| PASS |**

**| LeadPk:  |**

**| AccountPk:  |**

---

### Partially Refunded



**| PASS |**

**| LeadPk:  |**

**| AccountPk:  |**

---


---

### Fully Refunded



**| PASS |**

**| LeadPk:  |**

**| AccountPk:  |**

---