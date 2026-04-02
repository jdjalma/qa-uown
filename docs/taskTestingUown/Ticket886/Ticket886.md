----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/886

UOWN | Origination | Clean up the logs and make them more presentable

BUG
On origination portal, when a change is made to any screen the logs appear in the activity notes/logs section. However the logs sometimes are repetitive and unnecessary which slows down the process of reading the important content

FIX
Clean up the logs on Origination and make them more presentable and avoid repetitions (if there are any) and showing multiple logs for the same change

Steps-to-Reproduce
1. Create a lead and move it to funded
2. On the origination portal navigate to the lead
3. In the notes section verify that the notes look more presentable and are not repetitive
4. Also, verify that unnecessary generalized log notes are not shown by default

Davi Artur @davi.artur.gow
📝 Documentation: Activity Logs
📌 Context
A feature was implemented to record activity logs in the application. The new approach allows you to define which properties will be logged, 
offering greater flexibility and control.
Among the properties that can be logged, the following stand out:
* ccNumber (credit card number)
* accountNumber (account number)
Since these are sensitive data, this information must not be fully logged. Only the last 4 digits should be visible.

✅ Expected Log Format
Sensitive properties must be logged using masking. Example:
| Property | Correct Example | Incorrect Example |
| accountNumber | accountNumber7890 | accountNumber=1234567890 |

🔍 Validation Queries
Use the query below to verify the notes field and check if the entity being logged is only saving fields that contain the @Loggable annotation.
Query 1 — Broad Validation
SELECT  
  pk,
  agent,
  row_created_timestamp,
  row_updated_timestamp,
  tenant_id,
  lead_pk,
  log_type,
  notes,
  priority,
  ref_account_id
FROM public.uown_sv_activity_log
ORDER BY pk DESC
LIMIT 150;

Queries 2 & 3 — ccNumber & accountNumber Validation
SELECT  
  pk,
  agent,
  row_created_timestamp,
  row_updated_timestamp,
  tenant_id,
  lead_pk,
  log_type,
  notes,
  priority,
  ref_account_id
FROM public.uown_sv_activity_log
WHERE notes LIKE '%ccNumber%' OR notes LIKE '%accountNumber%'
ORDER BY pk DESC
LIMIT 150;

SELECT  
  pk,
  agent,
  row_created_timestamp,
  row_updated_timestamp,
  tenant_id,
  lead_pk,
  log_type,
  notes,
  priority,
  ref_account_id
FROM public.uown_los_activity_log
WHERE notes LIKE '%ccNumber%' OR notes LIKE '%accountNumber%'
ORDER BY pk DESC
LIMIT 150;

-----

UOWN | Origination | Limpar os logs e torná-los mais apresentáveis

BUG
No portal de Origination, quando uma alteração é feita em qualquer tela, os logs aparecem na seção de activity notes/logs. Porém, esses logs às vezes são repetitivos e desnecessários, o que torna a leitura do conteúdo importante mais lenta.

CORREÇÃO
Limpar os logs no Origination, torná-los mais apresentáveis, evitando repetições (se existirem) e múltiplos registros para a mesma alteração.

Passos para Reproduzir

Crie um lead e mova-o para funded

No portal de Origination, navegue até o lead

Na seção de notes, verifique se os registros estão mais apresentáveis e não repetitivos

Verifique também se registros de logs generalizados e desnecessários não são exibidos por padrão

Davi Artur @davi.artur.gow
📝 Documentação: Activity Logs
📌 Contexto
Uma funcionalidade foi implementada para registrar activity logs na aplicação. A nova abordagem permite definir quais propriedades serão registradas, oferecendo maior flexibilidade e controle.
Entre as propriedades que podem ser registradas, destacam-se:

ccNumber (número de cartão de crédito)

accountNumber (número de conta)

Como esses são dados sensíveis, essa informação não deve ser registrada por completo. Apenas os últimos 4 dígitos devem ficar visíveis.

✅ Formato de Log Esperado
As propriedades sensíveis devem ser registradas usando mascaramento. Exemplo:

Propriedade	Exemplo Correto	Exemplo Incorreto
accountNumber	accountNumber7890	accountNumber=1234567890

🔍 Consultas de Validação
Use a consulta abaixo para verificar o campo notes e verificar se a entidade em log está salvando apenas os campos que contenham a anotação @Loggable.

Consulta 1 — Validação Geral
SELECT  
  pk,
  agent,
  row_created_timestamp,
  row_updated_timestamp,
  tenant_id,
  lead_pk,
  log_type,
  notes,
  priority,
  ref_account_id
FROM public.uown_sv_activity_log
ORDER BY pk DESC
LIMIT 150;

Consultas 2 e 3 — Validação de ccNumber & accountNumber
SELECT  
  pk,
  agent,
  row_created_timestamp,
  row_updated_timestamp,
  tenant_id,
  lead_pk,
  log_type,
  notes,
  priority,
  ref_account_id
FROM public.uown_sv_activity_log
WHERE notes LIKE '%ccNumber%' OR notes LIKE '%accountNumber%'
ORDER BY pk DESC
LIMIT 150;

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se os logs exibem informações relevantes sem redundâncias, removem apenas dados de pouca importância e mascaram adequadamente números de contas bancárias e cartões de crédito.
Ensure that the logs display relevant information without redundancy, remove only low-importance data, and properly mask bank account and credit card numbers.

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12762 | Progress Mobility | Ensure that the logs display relevant information without redundancy, remove only low-importance data, and properly mask bank account and credit card numbers. |  | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12762 | Progress Mobility | Ensure that the logs display relevant information without redundancy, remove only low-importance data, and properly mask bank account and credit card numbers. |  | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok n stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------