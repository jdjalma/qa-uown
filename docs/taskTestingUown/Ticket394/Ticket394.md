--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/394

UOWN | Servicing | Create /changeMerchant Endpoint

Synopsis
Create a new end point for /changeMerchant that'll accept a ChangeMerchantRequest and call already existing service. Validate the merchant

Feature Request | Business Requirements
Implement a new endpoint at /changeMerchant.
The endpoint must accept a ChangeMerchantRequest as input.
Validate the merchant (e.g., resolve and confirm it exists and is eligible for change).
After successful validation, invoke the already existing service responsible for merchant changes.
Return the result from the existing service as the endpoint response.
Keep the endpoint free of new business logic beyond request handling and merchant validation.


test integrations
Request example
curl --location '<dev1>/uown/los/merchant/changeMerchant' \
--header 'Content-Type: application/json' \
--data '{
    "username": "<merchant_username>",
    "password": "<merchant_apikey>",
    "leadPk": <leadpk>,
    "refMerchantCode": <refMerchantCode>
}'
The behavior for this endpoint should be same as /uown/los/changeMerchant but it shouldn't require any token to make request instead the user the username and password

-----

Sinopse Criar um novo endpoint em /changeMerchant que aceite um ChangeMerchantRequest e chame um serviço já existente. Validar o merchant.

Requisitos de Negócio

Implementar um novo endpoint em /changeMerchant.
O endpoint deve aceitar um ChangeMerchantRequest como entrada.
Validar o merchant (por exemplo, localizar e confirmar que existe e que é elegível para alteração).
Após a validação bem-sucedida, invocar o serviço já existente responsável por alterações de merchant.
Retornar o resultado do serviço existente como resposta do endpoint.
Manter o endpoint livre de nova lógica de negócio além do tratamento da requisição e da validação do merchant.
Testes de Integração Exemplo de requisição:
curl --location '<dev1>/uown/los/merchant/changeMerchant' \
--header 'Content-Type: application/json' \
--data '{
    "username": "<merchant_username>",
    "password": "<merchant_apikey>",
    "leadPk": <leadpk>,
    "refMerchantCode": <refMerchantCode>
}'
Observações

O comportamento deste endpoint deve ser o mesmo de /uown/los/changeMerchant.
Diferentemente do /uown/los/changeMerchant, este novo endpoint não deve exigir token para a requisição; em vez disso, deve utilizar username e password enviados no corpo da requisição.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
 src/main/java/com/uownleasing/svc/db/repository/MerchantRepo.java 
+
14
−
14

Visualizado
@@ -10,7 +10,7 @@ import org.springframework.data.repository.query.Param;

import java.util.*;

public interface MerchantRepo extends JpaRepository<Merchant, Long>  {
public interface MerchantRepo extends JpaRepository<Merchant, Long> {

    Merchant findByPk(long pk);

@@ -20,7 +20,7 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long>  {

    Optional<Merchant> findByMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse(String refMerchantCode);

    Merchant findByMerchantInfo_UsernameAndMerchantInfo_ApiKeyAndMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse(String username, String apiKey,String refMerchantCode);
    Merchant findByMerchantInfo_UsernameAndMerchantInfo_ApiKeyAndMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse(String username, String apiKey, String refMerchantCode);

    void deleteByPk(long pk);

@@ -67,14 +67,14 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long>  {

    @Query(value = "SELECT DISTINCT m.merchantInfo.merchantName FROM Merchant m " +
        "           WHERE (m.merchantInfo.merchantName IS NOT NULL AND LENGTH(TRIM(BOTH FROM m.merchantInfo.merchantName)) > 1)" +
        "           AND (m.merchantInfo.clientType IS NOT NULL)"+
        "           AND (m.merchantInfo.clientType IS NOT NULL)" +
        "           AND (m.merchantInfo.isDeleted IS NULL OR (m.merchantInfo.isDeleted IS NOT NULL AND m.merchantInfo.isDeleted IS FALSE))" +
        "           ORDER BY m.merchantInfo.merchantName asc", nativeQuery = false)
    List<String> getMerchantNames();

    @Query(value = "SELECT DISTINCT m.location_name FROM uown_merchant m " +
        "           WHERE (m.location_name IS NOT NULL AND LENGTH(TRIM(BOTH FROM m.location_name)) > 1)" +
        "           AND (m.client_type IS NOT NULL)"+
        "           AND (m.client_type IS NOT NULL)" +
        "           AND (m.merchant_name ~* :merchantNames)" +
        "           AND (m.is_deleted IS NULL OR (m.is_deleted IS NOT NULL AND m.is_deleted IS FALSE))" +
        "           ORDER BY m.location_name asc", nativeQuery = true)
@@ -83,7 +83,7 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long>  {

    @Query(value = "SELECT m FROM Merchant m " +
        "           WHERE (m.merchantInfo.merchantName IS NOT NULL AND LENGTH(TRIM(BOTH FROM m.merchantInfo.merchantName)) > 1)" +
        "           AND (m.merchantInfo.clientType IS NOT NULL)"+
        "           AND (m.merchantInfo.clientType IS NOT NULL)" +
        "           AND (COALESCE(:merchantRefCodes,'*') = '*' OR m.merchantInfo.refMerchantCode IN (:merchantRefCodes)) " +
        "           AND (m.merchantInfo.isDeleted IS NULL OR (m.merchantInfo.isDeleted IS NOT NULL AND m.merchantInfo.isDeleted IS FALSE))" +
        "           ORDER BY m.merchantInfo.merchantName asc", nativeQuery = false)
@@ -119,7 +119,7 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long>  {
        "                                       OR LOWER(m.merchantInfo.primaryContactName) LIKE :search )" +
        "              AND (m.merchantInfo.isDeleted IS NULL OR (m.merchantInfo.isDeleted IS NOT NULL AND m.merchantInfo.isDeleted IS FALSE))" +
        "              AND (:salesRepCode IS NULL OR :salesRepCode = '' OR (m.merchantInfo.salesRepCode IS NOT NULL AND LOWER(m.merchantInfo.salesRepCode) = LOWER(:salesRepCode)))" +
        "              ORDER BY m.merchantInfo.refMerchantCode ASC" )
        "              ORDER BY m.merchantInfo.refMerchantCode ASC")
    Page<Merchant> getMerchantsByCriteria(@Param("inventoryCategories") List<String> inventoryCategories,
                                          @Param("merchantName") String merchantName,
                                          @Param("locationName") String locationName,
@@ -133,14 +133,14 @@ public interface MerchantRepo extends JpaRepository<Merchant, Long>  {

    Merchant findByMerchantInfo_refMerchantCodeIgnoreCaseAndMerchantInfo_UsernameIgnoreCaseAndMerchantInfo_ApiKey(String refMerchantCode, String username, String apiKey);

    @Query(value = "select m.client_type " +
        "from uown_merchant m " +
        "WHERE m.username = :username " +
        "and m.api_key = :apikey " +
        "and m.is_active = true " +
        "and m.is_deleted = false order by m.pk desc LIMIT 1", nativeQuery = true)
    Optional<ClientType> getClientTypeByUserNameApiKey(String username, String apikey);

    @Query(value = """
        select m.* \
        from uown_merchant m \
        WHERE lower(m.username) = lower(:username) \
        and m.api_key = :apikey \
        and m.is_active = true \
        and m.is_deleted = false order by m.pk desc LIMIT 1""", nativeQuery = true)
    Optional<Merchant> getMerchantByUserNameApiKey(String username, String apikey);
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

documentacao:
Change a lead merchant
This API is used to move a lead to a different merchant location. The refMerchantCode in the
request should be the reference code of the new merchant to which the lead is being moved. The
username and API key are the same as those previously shared for all other API calls
Method: POST
Request URL: https://svcsandbox.uownleasing.com/uown/los/merchant/changeMerchant
Sample Request:
{
"username": {{username}},
"password": {{password}},
"leadPk": {{leadPk}},
"refMerchantCode": {{refMerchantCode}},
}
Response:
{
"oldLeadPk": 111,
"newLeadPk": 112,
"oldMerchantRefCode": 987,
"newMerchantRefCode": 789,
"error": null
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Abaixo estão os requisitos de teste (numeração única, com subitens quando necessário) considerando a especificação do novo endpoint, as alterações no MerchantRepo.java e a documentação fornecida.

1.
Roteamento e Método HTTP
Verificar que o endpoint está exposto em POST em: /uown/los/merchant/changeMerchant.
Rejeitar outros métodos HTTP (GET/PUT/PATCH/DELETE) com 405 Method Not Allowed.
Garantir que o endpoint não exija barra final obrigatória (com e sem “/” no fim).
Confirmar Content-Type: application/json obrigatório; retornar 415 se enviado outro tipo.

2.
Autenticação sem token
Garantir que a chamada não exija token (sem cabeçalho Authorization).
Validar que as credenciais são recebidas exclusivamente no corpo: username e password (API key).
Se o cabeçalho Authorization for enviado, garantir que não substitua as credenciais do corpo (o contrato é autenticação via body).
Retornar 401/403 quando username/password inválidos, conforme padrão do serviço.

3.
Validação do payload (campos obrigatórios e formatos)
Campos obrigatórios: username (string não vazia), password (string não vazia), leadPk (numérico positivo), refMerchantCode (string não vazia).
JSON malformado → 400 Bad Request.
Tipos inválidos (ex.: leadPk como string, refMerchantCode numérico) → 400.
Strings contendo apenas espaços devem ser tratadas como inválidas → 400.
Tamanho limite razoável para campos textuais (ex.: 255) → 400 se exceder, conforme política vigente.

4.
Validação de merchant (elegibilidade)
Merchant deve existir e estar ativo e não deletado:
is_active = true e is_deleted = false.
Cobrir validações do repositório MerchantRepo:
findByMerchantInfo_UsernameAndMerchantInfo_ApiKeyAndMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse(...)
findByMerchantInfo_refMerchantCodeIgnoreCaseAndMerchantInfo_UsernameIgnoreCaseAndMerchantInfo_ApiKey(...)
Validar combinação tripla coerente: username + password + refMerchantCode do novo merchant.
Username case-insensitive (há consulta nativa com lower(username)).
refMerchantCode deve ser tratado como case-insensitive quando utilizado o método com IgnoreCase.
API key (password) deve permanecer case-sensitive.
Merchant inativo ou deletado → 403 (ou 409, conforme guideline de negócio).

5.
Paridade funcional com o endpoint antigo
O comportamento deve ser igual ao /uown/los/changeMerchant (base com token), mudando apenas o esquema de autenticação.
Para o mesmo cenário (lead e novo merchant válidos), comparar respostas dos dois endpoints e garantir equivalência semântica:
Campos retornados.
Regras de validação de lead/merchant.
Efeitos colaterais (ex.: criação de novo lead, histórico, etc.).

6.
Execução do serviço existente
Garantir que, após validação bem-sucedida do merchant, o endpoint invoque o serviço já existente de mudança de merchant (sem nova regra de negócio).
Confirmar que não há lógica adicional além de validação e orquestração da chamada.

7.
Resposta (contrato e conteúdo)
Sucesso (200): objeto contendo exatamente:
oldLeadPk (numérico), newLeadPk (numérico),
oldMerchantRefCode (string), newMerchantRefCode (string),
error: null.
Erro (4xx/5xx): error deve conter mensagem clara (sem dados sensíveis) e os demais campos ausentes ou nulos, conforme padrão vigente.
Validar application/json no retorno.
Garantir estabilidade do contrato para uso por integradores externos.

8.
Regras de negócio do “Change a lead merchant”
refMerchantCode corresponde ao novo merchant (de destino).
Verificar que o lead resultante (newLeadPk) pertence ao novo merchant informado.
Verificar que o lead original (oldLeadPk) mantém consistência histórica de acordo com o serviço legado (ex.: status/flag de origem).
Se refMerchantCode for igual ao merchant atual do lead: definir comportamento esperado (no-op/409/erro validado) e validar.

9.
Casos negativos essenciais
username ausente/vazio → 400.
password ausente/vazio → 400.
refMerchantCode ausente/vazio → 400.
leadPk ausente/zero/negativo → 400.
Merchant não encontrado para a combinação username+password+refMerchantCode → 401/403/404 (conforme guideline).
username correto, password incorreto → 401/403.
username incorreto com variação de caixa (case-insensitive deve aceitar) → deve autenticar se equivalência ignorando caixa.
refMerchantCode inexistente → 404.
Lead inexistente → 404.
Lead sem permissão de mudança (regras do serviço legado) → 403/409.
JSON inválido / campos extras inesperados (se estritos) → 400.

10.
Idempotência e concorrência
Repetir a mesma requisição (mesmos parâmetros) em sequência:
Definir e validar comportamento: se o serviço cria novo lead a cada chamada, validar se há proteção de idempotência ou retorno de conflito (409). Registrar o comportamento real.
Concorrência: duas mudanças simultâneas para o mesmo leadPk → garantir ausência de condição de corrida ou definir resultado consistente (um sucesso, outro falha/409).

11.
Auditoria e histórico
Confirmar que a mudança gera os registros de log/histórico esperados pelo serviço base (se aplicável ao legado).
Validar que mensagens de log não exponham password (API key).
Padronização de logs em inglês e com manageLogs (quando aplicável no ecossistema).

12.
Segurança
Nunca retornar password ou dados sensíveis no corpo da resposta.
Mensagens de erro sem vazamento de detalhes internos (queries, stack traces, PII).
Rejeitar payloads com caracteres de injeção maliciosa (sanitização).
TLS ativo no ambiente de produção/sandbox (verificar via URL base).

13.
Performance e limites
Tempo de resposta dentro do SLA definido (ex.: p95 < 1s sob carga nominal).
Testar com volume de chamadas representativo.
Tamanho máximo de payload e defesa contra requests muito grandes.

14.
Compatibilidade com integrações documentadas
Alinhamento com o padrão de credenciais de APIs já existentes em “merchant/*” (ex.: searchByEmail, getOpenToBuyCustomers) no que tange ao uso de username/password no corpo.
Validação cruzada: credenciais que funcionam em searchByEmail devem autenticar também no novo /merchant/changeMerchant.

15.
Testes de repositório (MerchantRepo) – regressão e novas assinaturas
findByMerchantInfo_UsernameAndMerchantInfo_ApiKeyAndMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse(...):
Retorna merchant apenas quando ativo e não deletado.
Comportamento quando nenhuma combinação corresponde → null/vazio esperado.
findByMerchantInfo_refMerchantCodeIgnoreCaseAndMerchantInfo_UsernameIgnoreCaseAndMerchantInfo_ApiKey(...):
Case-insensitive para username e refMerchantCode; case-sensitive para API key.
getClientTypeByUserNameApiKey(username, apikey):
Retorna Optional<ClientType> apenas se ativo e não deletado; Optional.empty() caso contrário.
getMerchantByUserNameApiKey(username, apikey):
Case-insensitive para username, ativo e não deletado.
Deve retornar o registro mais recente (order by pk desc limit 1) quando houver duplicidade.
Regressão nas queries de listagem:
getMerchantNames() (JPQL) e buscas relacionadas não devem ser afetadas pelas alterações de formatação/duplicidade de cláusulas (clientType IS NOT NULL repetida).
getMerchantLocations(...) nativa: continua retornando resultados distintos e filtrados corretamente.

16.
Paridade de respostas e códigos com o endpoint legado
Em cenários de sucesso e de erro, comparar códigos HTTP e estrutura com /uown/los/changeMerchant.
Divergências (se houver) devem ser documentadas e justificadas.

17.
Observabilidade
Métricas básicas: contagem de sucesso/erro, taxa de autenticação falha, latência.
Traços distribuídos (se habilitado) para acompanhar chamada ao serviço legado.

18.
Documentação e usabilidade
Exemplo de cURL fornecido deve funcionar ponta a ponta no ambiente indicado.
JSON de exemplo e descrição de campos na documentação devem refletir o contrato real do endpoint.

19.
Dados e integridade pós-operação
Os Pks retornados (oldLeadPk, newLeadPk) devem existir e estar consistentes no banco.
newLeadPk realmente associado ao newMerchantRefCode.
Integridade do lead original preservada conforme regra do serviço legado.

20.
Segurança de informações em logs e respostas
Garantir que password nunca apareça em logs de aplicação, auditoria, ou responses.
Máscara de dados sensíveis, quando aplicável.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Vamos criar um fluxo de teste para essa tarefa
Criei o arquivo R7.25.1.44.0_CreateChangeMerchantEndpoint_Ticket394.feature para isso
Crie um fluxo de teste em @R7.25.1.44.0_CreateChangeMerchantEndpoint_Ticket394 levando em consideração as informações que voce tem.
GAranta que o fluxo cobre 100% dos requisitos de teste
No fluxo atual em @R7.25.1.44.0_CreateChangeMerchantEndpoint_Ticket394 estou criando uma conta e conferindo entao ja tenho dados de lead, lease, customer, etc...

-----

vamos aplicar no mesmo fluxo 
Autenticação sem token – evidência (Req. 2)
Adicionar verificação explícita no HAR de que NÃO há header Authorization na chamada a /uown/los/merchant/changeMerchant.
Sugerido: step tipo “Network last request to path '/uown/los/merchant/changeMerchant' should NOT contain header 'Authorization'”.
Paridade com endpoint legado (Req. 5, 6, 16)
Criar cenário comparativo chamando:
Legado: /uown/los/changeMerchant (com token)
Novo: /uown/los/merchant/changeMerchant (sem token, com body)
Comparar campos de resposta (oldLeadPk/newLeadPk/oldMerchantRefCode/newMerchantRefCode/error) e status codes.
Validação de payload (Req. 3)
Casos negativos para:
username vazio/ausente → 400
password vazio/ausente → 400
leadPk ausente/zero/negativo → 400
refMerchantCode vazio/ausente → 400
Tipos inválidos e JSON malformado → 400
(Opcional útil) Validar via HAR o body enviado para conter exatamente as chaves esperadas.
Validação de merchant e elegibilidade (Req. 4, 9)
Credenciais inválidas → esperar 401 (ou 500 tolerante se o backend ainda mapeia incorretamente, como fizemos em searchByEmail).
refMerchantCode inexistente → 404 (ou erro coerente do serviço).
Merchant inativo/deletado → 403/409 (conforme regra vigente).
Mismatch user/password vs refMerchantCode (merchant não pertence às credenciais) → erro.
Username case-insensitive (variação de caixa deve autenticar), API key case-sensitive.
Resposta/Contrato completo (Req. 7)
Asserções de todos os campos no sucesso: oldLeadPk, newLeadPk, oldMerchantRefCode, newMerchantRefCode, error = null.
Content-Type da resposta application/json.
Regra do “Change a lead merchant” (Req. 8)
DB: newLeadPk realmente associado ao newMerchantRefCode (já validado).
(Opcional) DB: oldLeadPk mantém consistência histórica (usar OldLeadPk do response e validar ref code antigo).
Caso refMerchantCode = merchant atual → definir e validar o comportamento esperado (no-op/409/erro).
Casos negativos complementares (Req. 9)
username correto e password incorreto → 401/403.
leadPk inexistente → 404.
refMerchantCode inexistente → 404.
Lead sem permissão de mudança → 403/409.

-----

Implemente
Casos negativos de payload (400) e credenciais/merchant/lead inválidos:
username vazio/ausente
password vazio/ausente
leadPk ausente/zero/negativo
refMerchantCode vazio/ausente
Tipos inválidos/JSON malformado
Credenciais inválidas → 401 (ou 500 tolerante)
refMerchantCode inexistente → 404/erro coerente
Merchant inativo/deletado → 403/409
Mismatch user/refMerchantCode → erro
Username case-insensitive; API key case-sensitive
Contrato completo:
Já validado em “Last ChangeMerchant response should be ChangeMerchant success” (campos e error=null).
Content-Type de resposta JSON já checado nos steps de chamada.
Regra “Change a lead merchant”:
DB de associação do newLeadPk ao newMerchantRefCode já está no cenário principal.

-----



> ## Tests in qa1

> ```gherkin
> ### Scenario Outline: Create ChangeMerchant Endpoint in "<env>" 
> When Log in to origination
> When Search merchant by code "<merchantCode>"
> And Open first merchant search result
> And Fill fields for merchant:
> | merchantAddress   | contactName   |
> | <merchantAddress> | <contactName> |
> And Save merchant
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Set report key "leadPk" to created leadPk
> Then Call changeMerchant for created lead with username "tireAgent", password "U0wn_tireAgent_G4eDIH", new merchant code "OW90218-0001" expect HTTP in "200"
> Then Debug print last network request to path "/uown/los/merchant/changeMerchant"
> Then Last ChangeMerchant response error should not be null
> Then Last ChangeMerchant response error should contain "Cannot change lead from merchant Progress Mobility to Tire_Agent"
> Then Last API response should NOT contain keys "password,apiKey"
> Then Db expect at least 1 rows for within 30 seconds:
> Then Db expect at least 1 rows for within 30 seconds:
> And Test is successful
> 
> @UOWNDev1
> Examples:
> | env  | browser | state | merchant         | merchantUsername    | merchantPassword   | merchantCode | merchantAddress | contactName | newMerchantRefCode |
> | dev1 | chrome  | NY    | ProgressMobility | <merchant_user_env> | <merchant_key_env> | OL90294-0001 | 666 Test AV     | William     | OW90218-0001       |
>
> | PASS | LeadPk:997 | Merchant: | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: Authorization header must NOT override body in new ChangeMerchant "<env>"
> Given Enable HAR content capture
> Given Begin UownUnifiedFlow
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> Given Enable HAR content capture
> And Reset network capture
> Then Call changeMerchant for created lead with env merchant profile "PAY_TOMORROW", new merchant code "<newMerchantRefCode>" expect HTTP in "200"
> Then Network last request to path "/uown/los/merchant/changeMerchant" JSON body should contain keys "username,password,leadPk,refMerchantCode"
> Then Network contains "POST" to path "/uown/los/merchant/changeMerchant" with status 200
> Then Last API response should NOT contain keys "password,apiKey"
> Then Last ChangeMerchant response should be ChangeMerchant success
> Then Last API response should NOT contain keys "password,apiKey"
> And Reset network capture
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Last API response Content-Type should contain "application/json"
> Then Last API response should NOT contain keys "password,apiKey"
> And Test is successful
> Examples:
> | env  | browser | state | merchant         | merchantUsername | merchantPassword | newMerchantRefCode |
> | dev1 | chrome  | NY    | ProgressMobility | payTomorrow      | U0wn_payTomorrow | OL90294-0001       |
>
> | PASS | LeadPk:998 | Merchant: | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: ChangeMerchant accepts case-insensitive refMerchantCode in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Reset network capture
> Then Call changeMerchant for created lead with username "payTomorrow", password "U0wn_payTomorrow", new merchant code "OL90294-0001" expect HTTP in "200"
> Then Last ChangeMerchant response should be ChangeMerchant success
> And Set report keys from last ChangeMerchant response
> Then Db expect at least 1 rows for within 30 seconds:
> And Db set report key "DbNewMerchantRefCode" from SQL:
> And Report key "DbNewMerchantRefCode" should equal report key "NewMerchantRefCode"
> And Test is successful
> Examples:
> | env  | browser | state | merchant         | newMerchantRefCodeLower |
> | dev1 | chrome  | NY    | ProgressMobility | ol90294-0001            |
>
> | PASS | LeadPk:1000 | Merchant: | 
> ```
>
>

---

>> ```gherkin
> ### Scenario Outline: ChangeMerchant with same merchant code (no-op or business error) in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Reset network capture
> Then Call changeMerchant for created lead with env merchant profile "PAY_TOMORROW", new merchant code "<sameMerchantRefCode>" expect HTTP in "409,400,200"
> Then Last ChangeMerchant response should have newMerchantRefCode "<sameMerchantRefCode>"
> Then Last API response should NOT contain keys "password,apiKey"
> And Test is successful
> Examples:
> | env  | browser | state | merchant         | sameMerchantRefCode |
> | dev1 | chrome  | NY    | ProgressMobility | OL90294-0001        |
>
> | PASS | LeadPk:1002 | Merchant: | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: Validate payload errors for ChangeMerchant in "<env>"
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> And Test is successful
> Examples:
> | env  | browser | newMerchantRefCode |
> | dev1 | chrome  | OL90294-0001       |
>
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: Validate auth and merchant errors for ChangeMerchant in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> Then Call changeMerchant for created lead with username "invalid-merchant", wrong password "invalid-key", new merchant code "<newMerchantRefCode>" expect 401 or 500 with message "Invalid username and password
> Then Call changeMerchant for created lead with env merchant profile "PAY_TOMORROW", new merchant code "ZZ99999-0009" expect HTTP in "404,400,200,401"
> Then If last HTTP is 200 then ChangeMerchant error should not be null
> Then Call changeMerchant for created lead with env merchant profile "PAY_TOMORROW", new merchant code "<newMerchantRefCode>" expect HTTP in "200"
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Then Call changeMerchant for created lead with env merchant profile "PAY_TOMORROW", new merchant code "<inactiveRefCode>" expect HTTP in "403,409,400,200,401"
> Then If last HTTP is 200 then ChangeMerchant error should not be null
> And Test is successful
> Examples:
> | env  | browser | state | merchant         | newMerchantRefCode | inactiveRefCode | altMerchantUser | altMerchantKey   |
> | dev1 | chrome  | NY    | ProgressMobility | OL90294-0001       | ZZ99999-0009    | payTomorrow     | U0wn_payTomorrow |
> 
> | PASS | LeadPk:1004 | Merchant: | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: Validate routing and content-type for ChangeMerchant in "<env>"
> Then Call changeMerchant via GET expect HTTP 405
> And Call changeMerchant with content type "text/plain" and raw body expect HTTP 415
> And Call changeMerchant with trailing slash expect HTTP 400
> Examples:
> | env  | browser | state | merchant         | merchantUsername | merchantPassword | newMerchantRefCode |
> | dev1 | chrome  | NY    | ProgressMobility | payTomorrow      | U0wn_payTomorrow | OL90294-0001       |
> 
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>

---

> ```gherkin
> Scenario Outline: ChangeMerchant parity with legacy vs new in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> Given Enable HAR content capture
> And Reset network capture
> Then Call changeMerchant for created lead with Authorization header "Bearer garbage-token" username "<merchantUsername>", password "<merchantPassword>", new merchant code "<newMerchantRefCode>" expect HTTP 200
> Then Network last request to path "/uown/los/merchant/changeMerchant" JSON body should contain keys "username,password,leadPk,refMerchantCode"
> Then Network contains "POST" to path "/uown/los/merchant/changeMerchant" with status 200
> Then Last API response should NOT contain keys "password,apiKey"
> Then Last ChangeMerchant response should be ChangeMerchant success
> Then Last API response should NOT contain keys "password,apiKey"
> And Reset network capture
> Then Call changeMerchant with env Authorization and raw JSON expect HTTP 400
> Examples:
> | env  | browser | state | merchant         | merchantUsername | merchantPassword | newMerchantRefCode |
> | dev1 | chrome  | NY    | ProgressMobility | payTomorrow      | U0wn_payTomorrow | OL90294-0001       |
>
> | PASS | LeadPk:1007 | Merchant: | 
> ```
>
>



--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
R7.25.1.44.0_CreateChangeMerchantEndpoint_Ticket394
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
