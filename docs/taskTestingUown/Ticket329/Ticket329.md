------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/329

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Integração com Buddy API para Cancelamento do Plano de Proteção

Sowjanya Kaligineedi @skaligineedi
@marcos.pacheco.silva Please assist @jose.mendesdev with testing these scenarios.

1. Send Application
Call 'sendapplication' or create new application for a merchant with "Offer Insurance" set to true.
Use a unique email address for this application.

2. Opt-In and Sign Lease for First Lead created in step 1
Set Opt-In = true for the protection plan.
Complete the lease signing process for the first lead.

3. Verify Protection Plan Entry for First Lead
Confirm an entry is created in uown_los_protection_plan for the first lead with the following details:
Opt-In = true
Connector Token, Customer ID, and Policy ID populated.
Status = COMPLETED.

4. Create Another Lead with Same Email
Submit a new application using the same email address as in step 1.

5. Check Buddy Page for New Lead
Verify that the Buddy Page shows "Customer Already Covered" for the new lead.

6. Sign Lease for Second Lead
Complete the lease signing process for the second lead.

7. Verify Protection Plan Entry for Second Lead
Confirm an entry in uown_los_protection_plan for the second lead with:
Opt-In = false.
Customer ID and Policy ID filled (same as for Lead 1).
Already Covered Flag = true.

8. Cancel First Lead
Cancel the first lead created in step 1.

9. Check Protection Plan Status after Canceling First Lead
Ensure the Protection Plan status remains COMPLETED for both leads because the second lead is still active.

10. Cancel Second Lead
Cancel the second lead created in step 4.

11. Verify Cancellation for Both Leads
Confirm that the Protection Plan status is CANCELLED for both leads as both are now in UW_APPROVED (Cancelled) status.
Other Scenarios to Test

12. New Lead with Distinct Email and Opt-In False
Submit a new lead with a distinct email and Opt-In = false for the protection plan.
Ensure that cancelling the lead does not change the Opt-In status and the Protection Plan status stays COMPLETED in uown_los_protection_plan.

13. Create Lead with Same Email Address as Another Lead (No Protection Plan)
Create a lead with the same email address as an existing lead (which had no protection plan prior to Buddy changes) and Opt-In = true for the protection plan on the new lead.
Cancel the lead with the same email address (which does not have a protection plan).
Ensure that the new lead with the protection plan remains unaffected and is not cancelled.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Integração com Buddy API para Cancelamento do Plano de Proteção

  Cenário: Enviar uma aplicação com seguro ativado
    Dado que envio uma aplicação com "Offer Insurance" ativado
    E utilizo um email único para a aplicação
    Então a aplicação deve ser criada com sucesso

  Cenário: Opt-In e assinatura do contrato para o primeiro lead
    Dado que defino Opt-In como "true" para o plano de proteção
    E completo o processo de assinatura do contrato para o primeiro lead
    Então o contrato deve ser assinado com sucesso

  Cenário: Verificar a entrada do plano de proteção para o primeiro lead
    Dado que verifico a tabela "uown_los_protection_plan" para o primeiro lead
    Então a entrada deve conter:
      | Opt-In  | Status     | Connector Token | Customer ID | Policy ID |
      | true    | COMPLETED  | preenchido     | preenchido  | preenchido |

  Cenário: Criar um novo lead com o mesmo email
    Dado que envio uma nova aplicação com o mesmo email usado no primeiro lead
    Então a aplicação deve ser criada com sucesso

  Cenário: Verificar a página Buddy para o novo lead
    Dado que acesso a página Buddy do novo lead
    Então a mensagem "Customer Already Covered" deve ser exibida

  Cenário: Assinar o contrato para o segundo lead
    Dado que completo a assinatura do contrato para o segundo lead
    Então o contrato deve ser assinado com sucesso

  Cenário: Verificar a entrada do plano de proteção para o segundo lead
    Dado que verifico a tabela "uown_los_protection_plan" para o segundo lead
    Então a entrada deve conter:
      | Opt-In  | Customer ID | Policy ID | Already Covered |
      | false   | igual ao lead 1 | igual ao lead 1 | true |

  Cenário: Cancelar o primeiro lead
    Dado que cancelo o primeiro lead criado
    Então o status do plano de proteção deve permanecer como COMPLETED para ambos os leads

  Cenário: Cancelar o segundo lead
    Dado que cancelo o segundo lead criado
    Então o status do plano de proteção deve ser CANCELLED para ambos os leads

  Cenário: Criar um novo lead com email distinto e Opt-In false
    Dado que envio uma nova aplicação com um email distinto
    E o Opt-In do plano de proteção está definido como "false"
    Então cancelar este lead não deve alterar o status do plano de proteção
    E o status do plano de proteção deve permanecer como COMPLETED em "uown_los_protection_plan"

  Cenário: Criar lead com mesmo email de outro lead sem plano de proteção
    Dado que envio uma nova aplicação com um email já usado por outro lead sem plano de proteção
    E o Opt-In do plano de proteção está definido como "true" para o novo lead
    Quando cancelo o lead com o mesmo email (que não tem plano de proteção)
    Então o novo lead com plano de proteção deve permanecer ativo e não ser cancelado

------------------------------------------------------------------------------------------------------------------------------------------------------------------

curl --location --request POST 'https://svc-qa1.uownleasing.com/uown/los/cancelProtectionPlanOnLead?leadPk=8147'

------------------------------------------------------------------------------------------------------------------------------------------------------------------

custumer id = policyId

------------------------------------------------------------------------------------------------------------------------------------------------------------------

SELECT ulpp.lead_pk, ulpp.status, ull.lead_status, ull.funding_status, ull.internal_status 
FROM public.uown_los_protection_plan AS ulpp
JOIN public.uown_los_lead ull ON ull.pk = ulpp.lead_pk
WHERE customer_id = :customerId and policy_id = :policyId

<span style="background-color:rgb(41,41,41);color:rgb(255,255,255);font-size:inherit">;</span>

<span style="background-color:rgb(41,41,41);color:rgb(255,255,255);font-size:inherit">WITH cancel_protection_plan AS (</span>
    SELECT
        CAST(json_agg(
            jsonb_build_object('lead_pk', pp.lead_pk, 'lead_status', l.lead_status)
        ) AS TEXT) AS leads,
        CASE
            WHEN NOT EXISTS (
                SELECT 1
                FROM uown_los_lead l2
                WHERE l2.pk = pp.lead_pk
                AND l2.lead_status NOT IN ('UW_APPROVED', 'CANCELLED_DUP_SSN', 'EXPIRED')
            ) THEN TRUE  -- All leads are in ('UW_APPROVED', 'CANCELLED_DUP_SSN', 'EXPIRED'), can cancel
            ELSE FALSE  -- At least one lead has a different status, cannot cancel
        END AS canCancel
    FROM uown_los_protection_plan pp
    LEFT JOIN uown_los_lead l ON l.pk = pp.lead_pk
    WHERE pp.customer_id = :customerId
    AND pp.policy_id = :policyId
    AND pp.lead_pk <> :leadPk
    GROUP BY canCancel
)
SELECT
    cancel_protection_plan.canCancel AS canCancel,
    cancel_protection_plan.leads AS leads
FROM cancel_protection_plan
UNION ALL
SELECT TRUE, null  -- Return default values if no rows in cancel_protection_plan
    WHERE NOT EXISTS (SELECT 1 FROM cancel_protection_plan)

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Verifique que para o primeiro lead a entrada no plano de proteção apresenta opt-in verdadeiro, status COMPLETED e dados preenchidos; que a criação de um novo lead com o mesmo e-mail resulta em uma aplicação bem-sucedida com a mensagem "Customer Already Covered" na página Buddy; que a assinatura do contrato para o segundo lead é concluída com sucesso, com sua entrada no plano exibindo opt-in falso, Customer ID e Policy ID iguais ao primeiro e "Already Covered" verdadeiro; e que o status do plano permanece COMPLETED se apenas o primeiro lead for cancelado, passando para CANCELLED quando ambos os leads forem cancelados.
Verify that for the first lead the protection plan entry displays opt-in as true, COMPLETED status, and complete data; that creating a new lead with the same email results in a successful application with the message "Customer Already Covered" on the Buddy page; that the contract signing for the second lead is successfully completed, with its protection plan entry showing opt-in as false, and Customer ID and Policy ID identical to the first lead, with "Already Covered" as true; and that the plan status remains COMPLETED if only the first lead is canceled, turning to CANCELLED when both leads are canceled.

Verifique que, para um novo lead criado com e-mail distinto e com opt-in do plano de proteção definido como falso, o cancelamento do lead não altera o status, que permanece COMPLETED em "uown_los_protection_plan".
Verify that for a new lead created with a distinct email and with the protection plan opt-in set to false, canceling the lead does not change the status, which remains COMPLETED in "uown_los_protection_plan".

Verifique que, ao cancelar o lead sem plano de proteção, o novo lead com o mesmo e-mail e opt-in verdadeiro para o plano de proteção permanece ativo.
Verify that when canceling the lead without a protection plan, the new lead with the same email and with protection plan opt-in set to true remains active.

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8229 and 8230 | weGetFinancing | Verify that for the first lead the protection plan entry displays opt-in as true, COMPLETED status, and complete data; that creating a new lead with the same email results in a successful application with the message "Customer Already Covered" on the Buddy page; that the contract signing for the second lead is successfully completed, with its protection plan entry showing opt-in as false, and Customer ID and Policy ID identical to the first lead, with "Already Covered" as true; and that the plan status remains COMPLETED if only the first lead is canceled, turning to CANCELLED when both leads are canceled. |  | PASS |
| 8232 and 8233 | weGetFinancing | Verify that when canceling the lead without a protection plan, the new lead with the same email and with protection plan opt-in set to true remains active. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 19981 and 19982 | MyEyeMed | Verify that for the first lead the protection plan entry displays opt-in as true, COMPLETED status, and complete data; that creating a new lead with the same email results in a successful application with the message "Customer Already Covered" on the Buddy page; that the contract signing for the second lead is successfully completed, with its protection plan entry showing opt-in as false, and Customer ID and Policy ID identical to the first lead, with "Already Covered" as true; and that the plan status remains COMPLETED if only the first lead is canceled, turning to CANCELLED when both leads are canceled. |  | PASS |
| 19981 and 19982 | MyEyeMed | Verify that when canceling the lead without a protection plan, the new lead with the same email and with protection plan opt-in set to true remains active. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------