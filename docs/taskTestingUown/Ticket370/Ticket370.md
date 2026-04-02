---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/370

------


Task Description (EN)
UOWN | Servicing | Scheduled Process to Cancel Protection Plan Based on Buddy SFTP File

We need to implement a backend process to automatically mark protection plans as CANCELLED on our side when the associated accounts have been cancelled or refunded on the Buddy side. This information will be provided via a file uploaded to our SFTP server by Buddy every Thursday.

Business Objective
Ensure data consistency between our system and Buddy by automatically syncing protection plan statuses based on external cancellations or refunds. This reduces manual work and prevents discrepancies.

Business Requirements
Create a scheduled job that runs every Friday morning.
The process should read the file uploaded by Buddy to the SFTP server on Thursday.
Parse the file, which includes details of cancelled/refunded accounts.
For each matching record, update the corresponding protection plan status in our system to CANCELLED.
Ensure that the update is idempotent and handles failures gracefully (e.g., retries or logs errors for manual review).
Log all changes and maintain an audit trail for tracking updates applied.
Validate the job end-to-end in QA and Staging environments before deploying to Production.


-----

Descrição da Tarefa (PT-BR)
UOWN | Servicing | Scheduled Process to Cancel Protection Plan Based on Buddy SFTP File

Precisamos implementar um processo backend para marcar automaticamente planos de proteção como CANCELADOS no nosso sistema quando as contas associadas forem canceladas ou reembolsadas no Buddy. Essas informações serão disponibilizadas via arquivo enviado para nosso servidor SFTP pelo Buddy toda quinta-feira.

Objetivo de Negócio
Garantir a consistência dos dados entre nosso sistema e o Buddy, sincronizando automaticamente o status dos planos de proteção baseados em cancelamentos/reembolsos externos. Isso reduz o trabalho manual e evita discrepâncias.

Requisitos do Negócio
Criar um job agendado que rode toda sexta-feira de manhã.
O processo deve ler o arquivo enviado pelo Buddy no SFTP na quinta-feira.
Fazer o parse do arquivo, que contém detalhes das contas canceladas/reembolsadas.
Para cada registro correspondente, atualizar o status do plano de proteção para CANCELADO no nosso sistema.
Garantir que a atualização seja idempotente e trate falhas de forma resiliente (ex: retries ou logs de erro para análise manual).
Logar todas as mudanças e manter um audit trail para rastreio.
Validar o job de ponta a ponta nos ambientes de QA e Staging antes de subir em Produção.

-----

Requisitos Extraídos & Itens de Teste
REGRAS FUNCIONAIS (CORE)
 1. O job é executado automaticamente toda sexta-feira de manhã.
 2. O job lê o arquivo CSV (upload Buddy) da pasta correta no SFTP.
 3. O arquivo é processado linha a linha, realizando parse correto das informações.
 4. Para cada linha, o sistema busca correspondências nos planos de proteção (lead e/ou account).
 5. Os planos elegíveis devem ter opt_in = true ou already_covered = true.
 6. O plano só pode ser atualizado se o status não for CANCELLED.
 7. Critérios para encontrar plano de proteção:
 a. (policy_id e customer_id presentes) OU
 b. (policy_id e customer_id nulos e request contém o email)
 c. (no caso de account, order_id igual)
 8. Para account: a conta precisa estar com status ACTIVE.
 9. Para lead: o lead não pode estar em status: UW_APPROVED, CANCELLED_DUP_SSN, EXPIRED, INCOMPLETE.
 10. Todos os campos são atualizados corretamente: cancellation_date, refund_amount, cancellation_reason, request, status.
 11. O status é atualizado para CANCELLED em todos os registros encontrados.
 12. Se encontrar lead e account para o mesmo email, ambos são atualizados.

FALHAS E IDPOTÊNCIA
 13. O job é idempotente (reprocessar o mesmo arquivo/linha não cria inconsistência).
 14. Se um erro ocorrer em uma linha, as outras são processadas normalmente.
 15. Todos os erros são logados, inclusive detalhes da linha com erro.
 16. O job envia relatório de erro via e-mail (quando houver erro).

TRILHA DE AUDITORIA E LOG
 17. Todas as alterações feitas pelo job são auditadas (audit trail/logs).
 18. O nome do arquivo processado e quantidade de registros processados é logado.
 19. Informações de execução (hostname/pod, horário, etc) são logadas no início e fim.

AMBIENTE E ARQUIVOS
 20. O job pode ser validado usando arquivo de teste (ex: all_cancellations_06262025_1628EDT-07032025_0902EDT_-_Sheet1.csv) na pasta de test do SFTP.
 21. O job só processa arquivos com extensão .csv.
 22. O endpoint /uown/svc/cancelProtectionPlanSweep pode ser usado para trigger manual.

BANCO DE DADOS
 23. Após rodar o job, os dados nas tabelas uown_los_protection_plan e uown_sv_protection_plan refletem o cancelamento para as linhas elegíveis.
 24. Valide que para cada atualização de status para CANCELLED, os campos relacionados também foram atualizados.
 25. Valide a lógica SQL utilizada:
 a. Query correta para leads.
 b. Query correta para accounts.

EXTRAS DEV/ALTERAÇÕES
 26. O campo cancellation_date é preenchido automaticamente ao setar o status como CANCELLED.
 27. Se não houver correspondência em los, deve tentar atualizar em svc.
 28. Valide que o job NÃO atualiza planos que já estejam CANCELLED.

-----

 Preparar dados: inserir registros de lead/account em status elegível e não elegível.
 Subir arquivo de exemplo no SFTP test.
 Executar job (esperar agendamento ou trigger manual).
 Verificar nos bancos o status e os campos atualizados.
 Forçar falhas (ex: arquivo malformado) e validar logs/relatórios.
 Reexecutar o job com mesmo arquivo para testar idempotência.

-----

 SQL para Validação das Contas e Leads Elegíveis
 WITH check_accounts AS (
  SELECT DISTINCT
    'account' AS source,
    a.pk AS id,
    a.account_status AS status
  FROM uown_sv_protection_plan pp
  JOIN uown_sv_account a ON a.pk = pp.account_pk AND a.account_status = 'ACTIVE'
  JOIN uown_sv_email em ON em.account_pk = a.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
),
check_leads AS (
  SELECT DISTINCT
    'lead' AS source,
    l.pk AS id,
    l.lead_status AS status
  FROM uown_los_protection_plan pp
  JOIN uown_los_lead l ON l.pk = pp.lead_pk
  JOIN uown_los_email le ON le.lead_pk = l.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
    AND l.lead_status NOT IN ('UW_APPROVED', 'CANCELLED_DUP_SSN', 'EXPIRED', 'INCOMPLETE')
)
SELECT * FROM check_accounts
UNION ALL
SELECT * FROM check_leads;

Orientações para Acesso ao SFTP
Dados do SFTP (Ambiente de Teste)
Host: uown-sftp.uownleasing.com
Porta: 2022
Usuário: UownBuddyTest
Senha: 67^H57CK@7@0gk9a
Pasta: buddy/test/cancelamentos

Exemplo de acesso via terminal (Linux/macOS):
sftp -oPort=2022 UownBuddyTest@uown-sftp.uownleasing.com
# depois de conectado:
cd buddy/test/cancelamentos
ls
# para baixar arquivo de teste:
get all_cancellations_06262025_1628EDT-07032025_0902EDT_-_Sheet1.csv
# para subir um novo arquivo:
put seu_arquivo.csv

-----

WITH check_accounts AS (
  SELECT DISTINCT
    pp.account_pk,
    NULL::bigint AS lead_pk,
    pp.row_created_timestamp AS dt,
    pp.policy_id,
    pp.order_id,
    pp.customer_id,
    em.email_address,
    pp.refund_amount,
    pp.cancellation_reason
  FROM uown_sv_protection_plan pp
  JOIN uown_sv_account a ON a.pk = pp.account_pk AND a.account_status = 'ACTIVE'
  JOIN uown_sv_email em ON em.account_pk = a.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
),
check_leads AS (
  SELECT DISTINCT
    NULL::bigint AS account_pk,
    pp.lead_pk,
    pp.row_created_timestamp AS dt,
    pp.policy_id,
    pp.order_id,
    pp.customer_id,
    le.email_address,
    pp.refund_amount,
    pp.cancellation_reason
  FROM uown_los_protection_plan pp
  JOIN uown_los_lead l ON l.pk = pp.lead_pk
  JOIN uown_los_email le ON le.lead_pk = l.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
    AND l.lead_status NOT IN ('UW_APPROVED', 'CANCELLED_DUP_SSN', 'EXPIRED', 'INCOMPLETE')
)
SELECT
  account_pk,
  lead_pk,
  to_char(dt, 'MM/DD/YYYY HH24:MI:SS') AS "data/hora",
  policy_id,
  order_id,
  customer_id,
  email_address,
  COALESCE(refund_amount, 0.00) AS refund_amount,
  COALESCE(cancellation_reason, 'QA Test') AS cancellation_reason
FROM check_accounts
UNION ALL
SELECT
  account_pk,
  lead_pk,
  to_char(dt, 'MM/DD/YYYY HH24:MI:SS') AS "data/hora",
  policy_id,
  order_id,
  customer_id,
  email_address,
  COALESCE(refund_amount, 0.00) AS refund_amount,
  COALESCE(cancellation_reason, 'QA Test') AS cancellation_reason
FROM check_leads
;

-----

SELECT pp.cancellation_reason  ,pp.* 
FROM uown_los_protection_plan pp 
WHERE pp.lead_pk IN (
  84558,84632,84636,85669,86932,86944,86948,87136,87707,87710,87757,87758,87771,88049,88428,88456,88553,89042,89125,89127,89167,89169,89174,89176,89178,89180,89245,89501,89518,89519,89618,89634,89649,89676,89704,89705,89725,89726,89744,89760,89775,89798,89858,89959,90035,90042,90044,90050,90052,90128,90129,90211,90212,90213,90230,90231,90310
)
;

-----

SELECT pp.cancellation_reason  ,pp.* 
FROM uown_sv_protection_plan pp 
WHERE pp.account_pk  IN (
  5090,5095,5394,5399,5412,5643,5652,5661,5662,5663,5685,5688,5695,5698,5706,5708,5709,5710,5711,5712,5714,5724,5734,5736,5749,5750,5757,5778
)
;

-----
lead_pk
84558,84632,84636,85669,86932,86944,86948,87136,87707,87710,87757,87758,87771,88049,88428,88456,88553,89042,89125,89127,89167,89169,89174,89176,89178,89180,89245,89501,89518,89519,89618,89634,89649,89676,89704,89705,89725,89726,89744,89760,89775,89798,89858,89959,90035,90042,90044,90050,90052,90128,90129,90211,90212,90213,90230,90231,90310

account_pk
5090,5095,5394,5399,5412,5643,5652,5661,5662,5663,5685,5688,5695,5698,5706,5708,5709,5710,5711,5712,5714,5724,5734,5736,5749,5750,5757,5778

-----

--> Extrai os dados para guardar no sftp

WITH check_accounts AS (
  SELECT DISTINCT
    pp.row_created_timestamp AS dt,
    pp.policy_id,
    pp.order_id,
    pp.customer_id,
    em.email_address,
    pp.refund_amount,
    pp.cancellation_reason
  FROM uown_sv_protection_plan pp
  JOIN uown_sv_account a ON a.pk = pp.account_pk AND a.account_status = 'ACTIVE'
  JOIN uown_sv_email em ON em.account_pk = a.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
),
check_leads AS (
  SELECT DISTINCT
    pp.row_created_timestamp AS dt,
    pp.policy_id,
    pp.order_id,
    pp.customer_id,
    le.email_address,
    pp.refund_amount,
    pp.cancellation_reason
  FROM uown_los_protection_plan pp
  JOIN uown_los_lead l ON l.pk = pp.lead_pk
  JOIN uown_los_email le ON le.lead_pk = l.pk
  WHERE
    pp.status <> 'CANCELLED'
    AND (pp.opt_in = TRUE OR pp.already_covered = TRUE)
    AND (
      (pp.policy_id IS NOT NULL AND pp.customer_id IS NOT NULL)
      OR (pp.policy_id IS NULL AND pp.customer_id IS NULL AND pp.request ILIKE '%@%')
    )
    AND l.lead_status NOT IN ('UW_APPROVED', 'CANCELLED_DUP_SSN', 'EXPIRED', 'INCOMPLETE')
)
SELECT
  to_char(dt, 'MM/DD/YYYY HH24:MI:SS') AS "data/hora",
  policy_id,
  order_id,
  customer_id,
  email_address,
  COALESCE(refund_amount, 0.00) AS refund_amount,
  COALESCE(cancellation_reason, 'QA Test') AS cancellation_reason
FROM check_accounts
UNION ALL
SELECT
  to_char(dt, 'MM/DD/YYYY HH24:MI:SS') AS "data/hora",
  policy_id,
  order_id,
  customer_id,
  email_address,
  COALESCE(refund_amount, 0.00) AS refund_amount,
  COALESCE(cancellation_reason, 'QA Test') AS cancellation_reason
FROM check_leads;

-----

Endpoint:
POST /uown/svc/cancelProtectionPlanSweep

-----

Depois de executar, valide no banco se os registros foram atualizados conforme esperado (status = CANCELLED, demais campos preenchidos, etc.).

-----

https://svc-{{env}}.uownleasing.com/uown/svc/cancelProtectionPlanSweep

status → CANCELLED
cancellation_date → data atual
refund_amount, cancellation_reason, request, etc.
Salva log/auditoria da ação.


funded 24068
signed 23915
funding 23405
expired 19861
Lease Modification Requested ---
Incomplete ---
Cancelled 19618


select 
ull.pk ,ull.internal_status,ulpp.status  ,ulpp.policy_id ,ulpp.connector_token   ,ulpp.customer_id,
ull.* ,ulpp.*
from 
uown_los_lead ull 
left join uown_los_protection_plan ulpp on ulpp.lead_pk = ull.pk 
where 
--ull.internal_status like '%CANC%'
--and ulpp.pk is not null
ulpp.lead_pk IN (24068,23915,23405,19861,19618)
order by ull.pk desc
;


6/27/2025 9:02:45,UOWN 000000062001,o-19g6jm9u1svcu,buddy-19g6jm9u1svc4,asml8@yahoo.com,0,Payment failure - account overdue,
6/27/2025 9:02:45,UOWN 000000080901,o-19g6jma0htvbw,buddy-19g6jma0htvbj,kevongreene318@gmail.com,0,Payment failure - account overdue,
6/27/2025 9:02:46,UOWN 000000058101,o-19g6jm9smwy52,buddy-19g6jm9smwy4n,ernestabbott41@yahoo.com,0,Payment failure - account overdue,
6/27/2025 9:02:46,UOWN 000000065601,o-19g6jm9uphfp9,buddy-19g6jm9uphfow,techpwruser@gmail.com,0,Payment failure - account overdue,
6/27/2025 9:02:46,UOWN 000000064101,o-19g6jm9udjo1a,buddy-19g6jm9udjo0x,smithers_tyler17@icloud.com,0,Payment failure - account overdue,

UOWN 000000062001  |   o-19g6jm9u1svcu  |  buddy-19g6jm9u1svc4

UOWN 000000080901  |   o-19g6jma0htvbw  |  buddy-19g6jma0htvbj

UOWN 000000058101  |   o-19g6jm9smwy52  |  buddy-19g6jm9smwy4n

UOWN 000000065601  |   o-19g6jm9uphfp9  |  buddy-19g6jm9uphfow

UOWN 000000064101  |   o-19g6jm9udjo1a  |  buddy-19g6jm9udjo0x

6/26/2025 15:40:00,UOWN 000000030101,o-19g6jm9cvtu45,buddy-19g6jm9cvtu3t,edburrell35@hotmail.com,-38.97,Customer Request,

6/27/2025 9:02:47,UOWN 000000066001,o-19g6jm9vdskfc,buddy-19g6jm9vdskev,garza.a.lori@gmail.com,0,Payment failure - account overdue,


------



WITH vals AS (
  SELECT *
  FROM (
    VALUES
      ('6/26/2025 14:04:23', 'UOWN 000000073301', 'o-19g6jm9xd3p0u', 'buddy-19g6jm9xd3p0i', 'rsutton877@gmail.com'),
    ('6/26/2025 15:40:00', 'UOWN 000000030101', 'o-19g6jm9cvtu45', 'buddy-19g6jm9cvtu3t', 'edburrell35@hotmail.com'),
    ('6/26/2025 14:04:23', 'UOWN 000000073301', 'o-19g6jm9xd3p0u', 'buddy-19g6jm9xd3p0i', 'rsutton877@gmail.com'),
	('6/26/2025 14:04:23', 'UOWN 000000073301', 'o-19g6jm9xd3p0u', 'buddy-19g6jm9xd3p0i', 'rsutton877@gmail.com'),
('6/26/2025 15:40:00', 'UOWN 000000030101', 'o-19g6jm9cvtu45', 'buddy-19g6jm9cvtu3t', 'edburrell35@hotmail.com'),
('6/26/2025 18:46:50', 'UOWN 000000030301', 'o-19g6jm9cvzh4o', 'buddy-19g6jm9cvzh4e', 'bigdog12190@gmail.com'),
('6/26/2025 23:17:24', 'UOWN 000000165401', 'o-19g6jmcdiwfwo', 'buddy-19g6jmcdiwfwd', 'codyn6339@gmail.com'),
('6/27/2025 9:02:42', 'UOWN 000000068301', 'o-19g6jm9vz4che', 'buddy-19g6jm9vz4ch4', 'marianny0401@gmail.com'),
('6/27/2025 9:02:43', 'UOWN 000000059701', 'o-19g6jm9t12a8f', 'buddy-19g6jm9t12a82', 'marieaclark1987@gmail.com'),
('6/27/2025 9:02:43', 'UOWN 000000080601', 'o-19g6jma0drbzp', 'buddy-19g6jma0drbza', 'kc9913@icloud.com'),
('6/27/2025 9:02:43', 'UOWN 000000058701', 'o-19g6jm9stican', 'buddy-19g6jm9stica0', 'skylarmclucas14@icloud.com'),
('6/27/2025 9:02:44', 'UOWN 000000067401', 'o-19g6jm9vu872g', 'buddy-19g6jm9vu8726', 'tavist1993@gmail.com'),
('6/27/2025 9:02:44', 'UOWN 000000060501', 'o-19g6jm9t570ye', 'buddy-19g6jm9t570y2', 'shortygilker2@icloud.com'),
('6/27/2025 9:02:44', 'UOWN 000000066401', 'o-19g6jm9vjbvdk', 'buddy-19g6jm9vjbvd8', 'gillian.rebecca@gmail.com'),
('6/27/2025 9:02:45', 'UOWN 000000062001', 'o-19g6jm9u1svcu', 'buddy-19g6jm9u1svc4', 'asml8@yahoo.com'),
('6/27/2025 9:02:45', 'UOWN 000000080901', 'o-19g6jma0htvbw', 'buddy-19g6jma0htvbj', 'kevongreene318@gmail.com'),
('6/27/2025 9:02:46', 'UOWN 000000058101', 'o-19g6jm9smwy52', 'buddy-19g6jm9smwy4n', 'ernestabbott41@yahoo.com'),
('6/27/2025 9:02:46', 'UOWN 000000065601', 'o-19g6jm9uphfp9', 'buddy-19g6jm9uphfow', 'techpwruser@gmail.com'),
('6/27/2025 9:02:46', 'UOWN 000000064101', 'o-19g6jm9udjo1a', 'buddy-19g6jm9udjo0x', 'smithers_tyler17@icloud.com'),
('6/27/2025 9:02:47', 'UOWN 000000066001', 'o-19g6jm9vdskfc', 'buddy-19g6jm9vdskev', 'garza.a.lori@gmail.com'),
('6/27/2025 9:02:47', 'UOWN 000000065201', 'o-19g6jm9uk4ak6', 'buddy-19g6jm9uk4ajv', 'caraveocarlos@ymail.com'),
('6/27/2025 9:02:47', 'UOWN 000000057601', 'o-19g6jm9skxwwk', 'buddy-19g6jm9skxww7', 'mackwarren71@gmail.com'),
('6/27/2025 9:02:47', 'UOWN 000000061101', 'o-19g6jm9tb0hqn', 'buddy-19g6jm9tb0hq8', 'santosmaldonado11@yahoo.com'),
('6/27/2025 9:02:47', 'UOWN 000000059501', 'o-19g6jm9sx2b5c', 'buddy-19g6jm9sx2b51', 'steven.clapper87@gmail.com'),
('6/27/2025 9:02:48', 'UOWN 000000058301', 'o-19g6jm9spse6j', 'buddy-19g6jm9spse67', 'universaldragon04@gmail.com'),
('6/27/2025 9:02:48', 'UOWN 000000065901', 'o-19g6jm9uyei6x', 'buddy-19g6jm9uyei6h', 'feblesraymond5@gmail.com'),
('6/27/2025 9:02:48', 'UOWN 000000067001', 'o-19g6jm9vs3wh6', 'buddy-19g6jm9vs3wgw', 'smithbelinda682@gmail.com'),
('6/27/2025 9:02:48', 'UOWN 000000068401', 'o-19g6jm9w0fvga', 'buddy-19g6jm9w0fvfz', 'jonjon6633@gmail.com'),
('6/27/2025 9:02:49', 'UOWN 000000058401', 'o-19g6jm9spwrfn', 'buddy-19g6jm9spwrf6', 'lumeysanchez@yahoo.com'),
('6/27/2025 9:02:48', 'UOWN 000000064001', 'o-19g6jm9udb5xy', 'buddy-19g6jm9udb5xl', 'mswhasian82@gmail.com'),
('6/27/2025 9:02:49', 'UOWN 000000065401', 'o-19g6jm9unfmph', 'buddy-19g6jm9unfmp3', 'cma_alexander@yahoo.com'),
('6/27/2025 9:02:50', 'UOWN 000000066101', 'o-19g6jm9vgl01c', 'buddy-19g6jm9vgl012', 'hughestammy853@gmail.com'),
('6/27/2025 9:02:50', 'UOWN 000000059601', 'o-19g6jm9t047hf', 'buddy-19g6jm9t047h3', 'larrywilson0964@gmail.com'),
('6/27/2025 9:02:51', 'UOWN 000000080701', 'o-19g6jma0edgy3', 'buddy-19g6jma0edgxr', 'standifirdr@yahoo.com'),
('6/27/2025 9:02:52', 'UOWN 000000062101', 'o-19g6jm9u2m6lp', 'buddy-19g6jm9u2m6lc', 'rosapassians@gmail.com'),
('6/27/2025 9:02:58', 'UOWN 000000064601', 'o-19g6jm9uf0ufk', 'buddy-19g6jm9uf0uf6', 'davelldobson7@gmail.com'),
('6/27/2025 9:02:58', 'UOWN 000000066301', 'o-19g6jm9vip2gh', 'buddy-19g6jm9vip2g4', 'darrelldaniel14@gmail.com')
      -- ... outras linhas ...
  ) AS v(data_hora, policy_id, order_id, customer_id, email_address)
),
eligibles AS (
  SELECT upp.pk, ROW_NUMBER() OVER () as rn
  FROM uown_sv_protection_plan upp
  WHERE upp.status <> 'CANCELLED'
    AND (upp.opt_in = TRUE OR upp.already_covered = TRUE)
),
match_vals AS (
  SELECT e.pk, v.*
  FROM eligibles e
  JOIN (SELECT *, ROW_NUMBER() OVER () as rn FROM vals) v ON e.rn = v.rn
)
UPDATE uown_sv_protection_plan upp
SET
  policy_id   = mv.policy_id,
  order_id    = mv.order_id,
  customer_id = mv.customer_id
FROM match_vals mv
WHERE upp.pk = mv.pk
RETURNING upp.pk, upp.policy_id, upp.order_id, upp.customer_id,upp.lead_pk ,upp.account_pk ;

-----

3	UOWN 000000073301	o-19g6jm9xd3p0u	buddy-19g6jm9xd3p0i	19575	205786
9	UOWN 000000030101	o-19g6jm9cvtu45	buddy-19g6jm9cvtu3t	19623	205801
4	UOWN 000000073301	o-19g6jm9xd3p0u	buddy-19g6jm9xd3p0i	19594	205789
5	UOWN 000000073301	o-19g6jm9xd3p0u	buddy-19g6jm9xd3p0i	19601	205790
7	UOWN 000000030101	o-19g6jm9cvtu45	buddy-19g6jm9cvtu3t	19612	205796
8	UOWN 000000030301	o-19g6jm9cvzh4o	buddy-19g6jm9cvzh4e	19618	205797
10	UOWN 000000165401	o-19g6jmcdiwfwo	buddy-19g6jmcdiwfwd	19624	205802