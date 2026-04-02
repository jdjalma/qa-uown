------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/354

UOWN | Servicing | PayTomorrow Funding Transactions

Create a new API that returns all funding transactions for all payTomorrow merchants in a given date range. Default to current date if startDate is null
". No FE work required. (Reference : Funding report scheduled task ) 

-----

Davi Artur @davi.artur.gow
@jose.mendesdev , tests steps here: https://gitlab.com/groups/uown/-/wikis/Technical-Documentation/BackEnd-Applications/SVC/MerchantFundingService

-----

MerchantFundingService

📄 Funding Transactions Date Range API Documentation

✅ Purpose
Provides an endpoint to retrieve funding transactions within a specified date range for the PAY_TOMORROW client type.

📍 Endpoint
POST /uown/getFundingTransactionsForDateRange
Content-Type: application/json
Response format: application/json

📥 Request Body
{
  "fromDate": "2024-01-01",
  "toDate": "2024-01-31",
  "username": "your-username",
  "password": "your-password"
}

Field
Type
Required
Description

fromDate
string
✅
Start date in YYYY-MM-DD format


toDate
string
✅
End date in YYYY-MM-DD format


username
string
✅
Authentication username


password
string
✅
Authentication password

🔒 Credentials are passed in the request body (not secure – may be improved later).

📤 Response Structure

✅ Success (200 OK)
{
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
    // More records
  ],
  "status": "OK"
}


❌ Validation Error (400 Bad Request)

{
  "message": "fromDate cannot be greater than toDate",
  "status": "BAD_REQUEST"
}


❌ Internal Error (500 Internal Server Error)

{
  "message": "Error retrieving funding transactions",
  "status": "INTERNAL_SERVER_ERROR"
}


🧪 QA Test Scenarios

✅ Valid Request
Given valid fromDate, toDate, username, and password
When the request is submitted
Then response should have:
status = OK
data with transaction records


❌ Invalid Date Range
Given fromDate is after toDate
When the request is submitted
Then response should have:
status = BAD_REQUEST
message = fromDate cannot be greater than toDate


❌ Missing Required Fields
Test cases with missing:
fromDate
toDate
username
password
Expected: 400 Bad Request or internal error (depending on controller validation)


❌ SQL/Server Error
Simulate a failure retrieving the SQL (e.g., SQL config missing or malformed)
Expected:
status = INTERNAL_SERVER_ERROR
message = Error retrieving funding transactions


⚙️ Internal Notes (FYI)
SQL is dynamically loaded from database (SvSqlConfigService)
SQL placeholders :clientType, :fromDate, :toDate are replaced manually
Query runs natively with Hibernate and returns a list of key-value maps

-----

Funding Transactions Date Range API Documentation

Objetivo
Fornece um endpoint para recuperar transações de funding dentro de um intervalo de datas especificado para o tipo de cliente PAY_TOMORROW.

Endpoint
POST /uown/getFundingTransactionsForDateRange
Content-Type: application/json
Response format: application/json

Corpo da Requisição
{
  "fromDate": "2024-01-01",
  "toDate":   "2024-01-31",
  "username": "your-username",
  "password": "your-password"
}
| Campo    | Tipo   | Obrigatório | Descrição                            |
| -------- | ------ | ----------- | ------------------------------------ |
| fromDate | string | ✔️          | Data inicial no formato `YYYY-MM-DD` |
| toDate   | string | ✔️          | Data final no formato `YYYY-MM-DD`   |
| username | string | ✔️          | Nome de usuário para autenticação    |
| password | string | ✔️          | Senha para autenticação              |
🔒 As credenciais são enviadas no corpo da requisição (não é seguro – poderá ser melhorado posteriormente).

Estrutura de Resposta
Sucesso (200 OK)
{
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
    // Mais registros
  ],
  "status": "OK"
}

Erro de Validação (400 Bad Request)
{
  "message": "fromDate cannot be greater than toDate",
  "status": "BAD_REQUEST"
}

Erro Interno (500 Internal Server Error)
{
  "message": "Error retrieving funding transactions",
  "status": "INTERNAL_SERVER_ERROR"
}

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
| **Cenário**                                                                                 | **O que está cobrindo**                                               |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **1. Requisição Válida**                                                                    | • Endpoint correto (`POST /uown/getFundingTransactionsForDateRange`)  |
| • Cabeçalhos obrigatórios (`Content-Type: application/json`)                                |                                                                       |
| • Body com `fromDate`, `toDate`, `username`, `password` válidos                             |                                                                       |
| • Resposta 200 OK (`status = OK` + `data` com registros)                                    |                                                                       |
|                                                                                             |                                                                       |
| **2. Intervalo de Datas Inválido**                                                          | • Validação de negócio: `fromDate > toDate`                           |
| • Erro 400 Bad Request com mensagem `"fromDate cannot be greater than toDate"`              |                                                                       |
|                                                                                             |                                                                       |
| **3. Formato de Data Inválido**                                                             | • Validação de sintaxe do JSON: formatos diferentes de `YYYY-MM-DD`   |
| • Erro 400 Bad Request com mensagem de formato de data inválido                             |                                                                       |
|                                                                                             |                                                                       |
| **4. Intervalo de Datas Muito Grande**                                                      | • Limite de intervalo suportado (por exemplo, gap > 1 ano)            |
| • Erro 400 Bad Request ou 413 Payload Too Large com mensagem apropriada                     |                                                                       |
|                                                                                             |                                                                       |
| **5. Conjunto de Dados Vazio**                                                              | • Cenário “sem transações” dentro do intervalo                        |
| • Resposta 200 OK com `data: []`                                                            |                                                                       |
|                                                                                             |                                                                       |
| **6. Campos Obrigatórios Faltando**                                                         | • Faltas de cada campo (`fromDate`, `toDate`, `username`, `password`) |
| • Erro 400 Bad Request ou 500 Internal Server Error (dependendo da validação no controller) |                                                                       |
|                                                                                             |                                                                       |
| **7. Credenciais Inválidas / Não Autorizado**                                               | • Autenticação: `username`/`password` incorretos                      |
| • Erro 401 Unauthorized com mensagem tipo `Invalid credentials`                             |                                                                       |
|                                                                                             |                                                                       |
| **8. Content-Type Incorreto**                                                               | • Header `Content-Type` diferente de `application/json`               |
| • Erro 415 Unsupported Media Type                                                           |                                                                       |
|                                                                                             |                                                                       |
| **9. JSON Malformado**                                                                      | • Body JSON sintaticamente inválido (vírgula a mais, aspas faltando…) |
| • Erro 400 Bad Request com mensagem de parsing                                              |                                                                       |
|                                                                                             |                                                                       |
| **10. Erro SQL/Servidor**                                                                   | • Falha ao carregar/executar SQL via `SvSqlConfigService`             |
| • Erro 500 Internal Server Error com `"Error retrieving funding transactions"`              |                                                                       |
|                                                                                             |                                                                       |
| **11. Teste de Performance / Carga**                                                        | • Comportamento sob alto volume (latência, percentis, taxa de erro)   |
| • Não documentado explicitamente, mas importante para SLA                                   |                                                                       |
|                                                                                             |                                                                       |
| **12. Teste de Concurrency / Corrida**                                                      | • Dois requests simultâneos ao mesmo intervalo                        |
| • Garante ausência de deadlock ou dados corrompidos                                         |                                                                       |
|                                                                                             |                                                                       |
| **13. Segurança – Injeção SQL**                                                             | • Tentativa de SQL injection em `fromDate`/`toDate`                   |
| • API deve recusar (400) sem expor ou alterar o banco                                       |                                                                       |
|                                                                                             |                                                                       |
| **14. Timezone / Fuso Horário**                                                             | • Cliente e servidor em fusos diferentes                              |
| • Garante que intervalo considere corretamente offsets de data/hora                         |                                                                       |
|                                                                                             |                                                                       |
| **15. Limite de Taxa (Rate Limiting)**                                                      | • Excesso de requisições por minuto/hora                              |
| • Erro 429 Too Many Requests                                                                |                                                                       |
|                                                                                             |                                                                       |
| **16. Paginação / Segmentação**                                                             | • Quando o volume de `data` for muito grande                          |
| • Verifica parâmetros como `limit`/`page` (caso implementados)                              |                                                                       |
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Recuperar transações de funding por intervalo de datas
  Como cliente do sistema PAY_TOMORROW
  Quero recuperar transações de funding em um intervalo de datas especificado
  Para poder reconciliar os dados de transação

  Background:
    Given the API endpoint POST /uown/getFundingTransactionsForDateRange
    And the request header Content-Type is "application/json"

  Scenario: Requisição Válida
    Given a request body:
      """
      {
        "fromDate": "2024-01-01",
        "toDate":   "2024-01-31",
        "username": "usuario-valido",
        "password": "senha-valida"
      }
      """
    When the request is submitted
    Then the response status code should be 200
    And the JSON response should contain:
      | field  | value           |
      | status | "OK"            |
      | data   | Non-empty array |
https://svc-{{env}}.uownleasing.com/uown/getFundingTransactionsForDateRange
 {
    "fromDate": "2025-05-01",
    "toDate":   "2025-05-31",
    "username": "jmendes.gow",
    "password": "Uown_gow"
}
{
    "data": [
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-20",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTQFPAH",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+CTLEM@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12612,
            "fund_date_time": "2025-05-20T18:38:09.177+00:00",
            "LAST NAME": "TESTERIVSEQ",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R67648",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "745-136-1642"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-20",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTUZVAW",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+30QOM@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12606,
            "fund_date_time": "2025-05-20T12:04:18.828+00:00",
            "LAST NAME": "TESTERAGMLS",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R66985",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "786-126-0162"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-19",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTNXYAX",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+7QVMX@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12600,
            "fund_date_time": "2025-05-19T20:02:51.752+00:00",
            "LAST NAME": "TESTERUGSWS",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R22037",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "206-236-4868"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 870.00,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 870.00,
            "SALES TAX": 60.90,
            "FUNDED DATE": "2025-05-19",
            "MERCHANT API TAX": 0.00,
            "FIRST NAME": "CHRISTINE",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "CHRISTINEDBLEDSOE@JOURRAPIDE.COM",
            "SHIPPING": 0.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12591,
            "fund_date_time": "2025-05-19T19:16:38.766+00:00",
            "LAST NAME": "BLEDSOE",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 870.00,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R10008",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "402-896-6980"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-19",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTANFVL",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+2THRS@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12585,
            "fund_date_time": "2025-05-19T08:51:51.798+00:00",
            "LAST NAME": "TESTERUZPWP",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R55155",
            "APPROVAL AMOUNT": 4090.00,
            "MOBILE": "313-441-1047"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 114.25,
            "FUNDED DATE": "2025-05-19",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTDJRXH",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+2HMOG@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12584,
            "fund_date_time": "2025-05-19T08:45:39.130+00:00",
            "LAST NAME": "TESTERPUGJZ",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R80022",
            "APPROVAL AMOUNT": 4090.00,
            "MOBILE": "149-506-8476"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-15",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTILSLU",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+JTEBC@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12561,
            "fund_date_time": "2025-05-15T17:49:13.720+00:00",
            "LAST NAME": "TESTERDRHUT",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R74327",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "137-981-6521"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-15",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTQOFRQ",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+HE4GO@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12560,
            "fund_date_time": "2025-05-15T13:22:06.898+00:00",
            "LAST NAME": "TESTERDMPUP",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R83810",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "761-220-0306"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 114.25,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTZXUNY",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+XPQGS@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12530,
            "fund_date_time": "2025-05-06T19:18:54.920+00:00",
            "LAST NAME": "TESTERQYWBK",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R56421",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "309-768-1746"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1305.70,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 91.40,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTJPSCY",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+PRUO5@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12528,
            "fund_date_time": "2025-05-06T19:18:54.444+00:00",
            "LAST NAME": "TESTERIRFTF",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R25528",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "515-259-2994"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTPLABB",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+BCJPA@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12531,
            "fund_date_time": "2025-05-06T19:18:47.940+00:00",
            "LAST NAME": "TESTERICWQM",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R49233",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "640-859-5335"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTKIIRY",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+RKCTF@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12529,
            "fund_date_time": "2025-05-06T19:18:43.950+00:00",
            "LAST NAME": "TESTERSUTSE",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R29873",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "119-374-7712"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTSAVOV",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+4GMCX@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12526,
            "fund_date_time": "2025-05-06T19:06:41.922+00:00",
            "LAST NAME": "TESTERJRNGE",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R79350",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "434-177-0100"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTTGSQL",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+9PBNY@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12527,
            "fund_date_time": "2025-05-06T19:06:41.748+00:00",
            "LAST NAME": "TESTERVCSTS",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R61105",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "276-917-1480"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTULCGG",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+SRTQ6@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12525,
            "fund_date_time": "2025-05-06T19:06:37.537+00:00",
            "LAST NAME": "TESTERWAYDS",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R69616",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "185-170-1609"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTGGFSE",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+I4UVE@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12524,
            "fund_date_time": "2025-05-06T19:06:36.619+00:00",
            "LAST NAME": "TESTERAFFHW",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R41149",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "462-862-9970"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1305.70,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 91.40,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTZFDRO",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+QHBBM@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12521,
            "fund_date_time": "2025-05-06T18:56:06.499+00:00",
            "LAST NAME": "TESTEREXQOV",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R27367",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "462-866-6771"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1250.00,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1250.00,
            "SALES TAX": 87.50,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 60.00,
            "FIRST NAME": "BRENT",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "BRENTLWADE@TELEWORM.US",
            "SHIPPING": 50.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12511,
            "fund_date_time": "2025-05-06T16:48:49.985+00:00",
            "LAST NAME": "WADE",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1310.00,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R91931",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "507-834-2502"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 349.00,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 349.00,
            "SALES TAX": 27.92,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 25.00,
            "FIRST NAME": "ERIC",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "WILLIAMALADOUCEUR@ARMYSPY.COM",
            "SHIPPING": 25.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12510,
            "fund_date_time": "2025-05-06T16:39:11.918+00:00",
            "LAST NAME": "DELAGAZRZA",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 374.00,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R91931",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "518-406-2532"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTQELMV",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+BRNKX@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12508,
            "fund_date_time": "2025-05-06T16:32:36.090+00:00",
            "LAST NAME": "TESTERGIJPE",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R92443",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "376-783-0892"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTPIUHN",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+1UNWY@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12507,
            "fund_date_time": "2025-05-06T16:32:09.294+00:00",
            "LAST NAME": "TESTEROECRT",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R61039",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "602-590-0919"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTZTJWP",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+LGNM7@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12497,
            "fund_date_time": "2025-05-06T15:45:33.893+00:00",
            "LAST NAME": "TESTERYJBMT",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R76471",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "376-657-5949"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTHATQL",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+EGQIC@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12500,
            "fund_date_time": "2025-05-06T15:45:33.524+00:00",
            "LAST NAME": "TESTEREPNKA",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R37747",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "402-941-6520"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTDWFWY",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+T3ZHZ@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12496,
            "fund_date_time": "2025-05-06T15:45:33.478+00:00",
            "LAST NAME": "TESTERRDGXF",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R93924",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "103-509-8487"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTSXYZV",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+9CI1H@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12498,
            "fund_date_time": "2025-05-06T15:45:33.048+00:00",
            "LAST NAME": "TESTERFEDPJ",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R78832",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "611-393-3399"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTCHRSX",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+1PF37@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12495,
            "fund_date_time": "2025-05-06T14:22:34.964+00:00",
            "LAST NAME": "TESTEREJTQO",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R65398",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "859-725-7208"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTMALJU",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+MTK8G@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12491,
            "fund_date_time": "2025-05-06T14:20:10.411+00:00",
            "LAST NAME": "TESTERAMYKF",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R54955",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "197-726-6337"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 349.00,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 349.00,
            "SALES TAX": 27.92,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 25.00,
            "FIRST NAME": "NICHOLAS",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "NICHOLASVSTROH@ARMYSPY.COM",
            "SHIPPING": 25.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12484,
            "fund_date_time": "2025-05-06T13:02:38.579+00:00",
            "LAST NAME": "STROH",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 374.00,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R91931",
            "APPROVAL AMOUNT": 3906.00,
            "MOBILE": "740-583-7172"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 349.00,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 349.00,
            "SALES TAX": 27.92,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 25.00,
            "FIRST NAME": "NICHOLAS",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "NICHOLASVSTROH@ARMYSPY.COM",
            "SHIPPING": 25.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12481,
            "fund_date_time": "2025-05-06T12:52:02.183+00:00",
            "LAST NAME": "STROH",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 374.00,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R91931",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "740-583-7172"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-06",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTHERBZ",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+27HZV@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12471,
            "fund_date_time": "2025-05-06T07:54:00.044+00:00",
            "LAST NAME": "TESTERGEHPJ",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R10244",
            "APPROVAL AMOUNT": 4090.00,
            "MOBILE": "226-340-7402"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-05",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTKJODC",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+MBAKO@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12462,
            "fund_date_time": "2025-05-05T17:29:53.608+00:00",
            "LAST NAME": "TESTERUYCWS",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R30443",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "647-627-5423"
        },
        {
            "EXTERNAL REF ID": null,
            "FUNDED": 1318.76,
            "TRANSACTION TYPE": "FUNDED",
            "LEASE AMOUNT": 1305.70,
            "SALES TAX": 117.51,
            "FUNDED DATE": "2025-05-05",
            "MERCHANT API TAX": 55.67,
            "FIRST NAME": "TESTXNVHK",
            "MERCHANT DISCOUNT": 1242.6108000,
            "EMAIL": "FINTECHGROUP777+QH8EI@GMAIL.COM",
            "SHIPPING": 57.00,
            "STORE NAME": "Progress Mobility",
            "REF ID": 12461,
            "fund_date_time": "2025-05-05T17:19:03.594+00:00",
            "LAST NAME": "TESTERPUBXY",
            "DISCOUNT PERCENT": "0.03000",
            "GROSS INVOICE AMOUNT": 1361.37,
            "REF MERCHANT CODE": "OL90294-0001",
            "FUNDING QUEUE STATUS": "FUNDED",
            "ORDER ID": "R52620",
            "APPROVAL AMOUNT": 4280.00,
            "MOBILE": "561-893-1736"
        }
    ],
    "status": "OK"
}
-----

  Feature: Recuperar transações de funding por intervalo de datas
  Como cliente do sistema PAY_TOMORROW  
  Quero obter transações de funding dentro de um intervalo de datas especificado  
  Para reconciliar os dados de transação

  Background:
    Given o endpoint POST /uown/getFundingTransactionsForDateRange
    And o header Content-Type é "application/json"

  Scenario: Requisição válida
    Given um corpo de requisição:
      """
      {
        "fromDate": "2024-01-01",
        "toDate":   "2024-01-31",
        "username": "usuario-valido",
        "password": "senha-valida"
      }
      """
    When a requisição for enviada
    Then o código de status da resposta deve ser 200
    And o JSON de resposta deve conter:
      | field  | value           |
      | status | "OK"            |
      | data   | vetor não vazio |
ok
-----

  Scenario Outline: Formato de data inválido
    Given um corpo de requisição em que o campo de data "<dateField>" está em formato inválido "<badDate>" e o outro campo de data está correto:
      """
      {
        "<dateField>": "<badDate>",
        "<otherField>": "2024-01-31",
        "username":     "usuario-valido",
        "password":     "senha-valida"
      }
      """
    When a requisição for enviada
    Then o código de status da resposta deve ser 400
    And o JSON de resposta deve conter:
      | field   | assertion                                         |
      | status  | equal to "BAD_REQUEST"                            |
      | message | contains "invalid date format" or "YYYY-MM-DD"    |

    Examples:
      | dateField | badDate      | otherField |
      | fromDate  | 01/31/2024   | toDate     |
      | toDate    | 2025-13-01   | fromDate   |
      | toDate    | 2025/05/31   | fromDate   |
OK
-----
  Scenario: Conjunto de dados vazio
    Given um corpo de requisição com datas válidas mas sem transações:
      """
      {
        "fromDate": "2025-01-01",
        "toDate":   "2025-01-31",
        "username": "usuario-valido",
        "password": "senha-valida"
      }
      """
    When a requisição for enviada
    Then o código de status da resposta deve ser 200
    And o JSON de resposta deve conter `"data": []`
OK
-----

  Scenario Outline: Campos obrigatórios faltando
    Given um corpo de requisição sem o campo "<missingField>":
      """
      {
        <bodyFields>
      }
      """
    When a requisição for enviada
    Then o código de status da resposta deve ser 400 ou 500

    Examples:
      | missingField | bodyFields                                                                                  |
      | fromDate     | `"toDate": "2024-01-31", "username": "u", "password": "p"`                                  |
      | toDate       | `"fromDate": "2024-01-01", "username": "u", "password": "p"`                                |

ERROR
-----

  Scenario: Teste de segurança injeção SQL
    Given um corpo de requisição com input malicioso:
      """
      {
        "fromDate": "2024-01-01'; DROP TABLE users; --",
        "toDate":   "2024-01-31",
        "username": "usuario-valido",
        "password": "senha-valida"
      }
      """
    When a requisição for enviada
    Then o código de status da resposta deve ser 400
    And o banco de dados deve permanecer intacto
OK
-----

Verificar se é exibido resultados ao modificar o client_type de um comerciante


-----

novo merchant clonado com client type
OK - lease criado para este merchant entra no resultado

------------------------------------------------------------------------------------------------------------------------------------------------------------------





  {
    "fromDate": "2025-01-01",
    "toDate":   "2025-01-31",
    "username": "jmendes.gow",
    "password": "Uown_gow"
  }

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.

Verificar se é exibida a mensagem informando intervalo de datas inválido.
Check if a message indicating an invalid date range is displayed.

2.

Verificar se é exibida a mensagem de erro correspondente ao campo obrigatório ausente.
Check if the correct error message for a missing required field is displayed.

3.

Verificar se é exibida a mensagem de erro do servidor quando há inconsistências no servidor.
Check if a server error message is displayed when there are server inconsistencies.

4.

Verificar se os leases financiados no período definido para comerciantes que utilizam as credenciais PayTomorrow e o tipo de cliente PAY_TOMORROW são retornados ao enviar uma requisição válida.
Check if the financed leases for the specified period are returned for merchants using the PayTomorrow credentials and customer type PAY_TOMORROW when a valid request is sent.


5.

Verificar se os leases são exibidos para um merchant cujo client_type foi alterado.
Check if leases are displayed for a merchant whose client_type has been changed.
Ao mudar o client type do merchant não é exibido resultados em getFundingTransactionsForDateRange, todos os client_type devem ser PAY_TOMORROW senão resultados não são exibidos
Observação: Há cadastros de comerciantes que usam o usuário e senha paytomorrow porém o client_type não é pay_tomorrow, leases desses comerciantes não entram na relação.

6.

Verificar se, ao cadastrar um novo merchant clonado com usuário e senha PayTomorrow e client_type PAY_TOMORROW, criar um lease, marcá-lo como funded e chamar o endpoint, esse lease aparece na listagem; e se o status do lease mudar, ele é removido da lista.
Check if, when registering a new cloned merchant with PayTomorrow credentials and client_type PAY_TOMORROW, creating a lease, marking it as funded and invoking the endpoint, that lease appears in the listing; and if the lease’s status changes, it is removed from the list.
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Check if a message indicating an invalid date range is displayed. |  | PASS |  |
| Check if the correct error message for a missing required field is displayed. |  | PASS |  |
| Check if a server error message is displayed when there are server inconsistencies. |  | PASS |  |
| Check if the financed leases for the specified period are returned for merchants using the PayTomorrow credentials and customer type PAY_TOMORROW when a valid request is sent. |  | PASS |  |
| Check if leases are displayed for a merchant whose client_type has been changed. |  | PASS |  |
| Check if, when registering a new cloned merchant with PayTomorrow credentials and client_type PAY_TOMORROW, creating a lease, marking it as funded and invoking the endpoint, that lease appears in the listing; and if the lease’s status changes, it is removed from the list. |  | PASS |  |

-----

Tests in qa2

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Check if a message indicating an invalid date range is displayed. | ![qa2-354-c1_1_](/uploads/cb6480bdb76c29cb68cbe7d4c09c7768/qa2-354-c1_1_.png){width=1107 height=518} | PASS |  |
| Check if the correct error message for a missing required field is displayed. | ![qa2-354-c2_1_](/uploads/a674eb243c7b1ab176d97e22d66aae90/qa2-354-c2_1_.png){width=1107 height=518}![qa2-354-c2_2_](/uploads/ae998fed3ebee6c1d89e4c1ed9ca29f0/qa2-354-c2_2_.png){width=1107 height=518}![qa2-354-c2_3_](/uploads/f12016b93837bbaace8d462848f7024a/qa2-354-c2_3_.png){width=1107 height=518}![qa2-354-c2_4_](/uploads/1a6cbf8945dd67373fbe8ba286e51794/qa2-354-c2_4_.png){width=1107 height=518} | PASS |  |
| Check if a server error message is displayed when there are server inconsistencies. | ![qa2-354-c3_1_](/uploads/76f340fa8375e1c9da299e5bc05da528/qa2-354-c3_1_.png){width=1111 height=203} | PASS |  |
| Check if the financed leases for the specified period are returned for merchants using the PayTomorrow credentials and customer type PAY_TOMORROW when a valid request is sent. | ![qa2-354-c4_1_](/uploads/a8da6b3ef1a59b5c9137c46efbd1ce2a/qa2-354-c4_1_.png){width=1108 height=404}![qa2-354-c4_1_](/uploads/021fc23f7ed9d5f1bd15f9e83ff74971/qa2-354-c4_1_.png){width=1108 height=404}![qa2-354-c4_2_](/uploads/49c2c71ce5a8bcd3f457cd4c76fe5339/qa2-354-c4_2_.png){width=780 height=576}![qa2-354-c4_3_](/uploads/8001427af78a2ea709e4af73c9a40766/qa2-354-c4_3_.png){width=780 height=576}![qa2-354-c4_4_](/uploads/d36f2c7574674c8e05a4057e8ad19d26/qa2-354-c4_4_.png){width=780 height=576}![qa2-354-c4_5_](/uploads/da2b6fea8fc7984b62d5b2c837b4ea12/qa2-354-c4_5_.png){width=780 height=576}![qa2-354-c4_6_](/uploads/ad2fd7d46532341c1f6f7a78e8876576/qa2-354-c4_6_.png){width=1437 height=741}![qa2-354-c4_7_](/uploads/33fbe4ff8562ec117ce0bcb975460a00/qa2-354-c4_7_.png){width=1437 height=741}![qa2-354-c4_8_](/uploads/33b6cf3cce068b759003a56ec43ff113/qa2-354-c4_8_.png){width=1437 height=741}![qa2-354-c4_9_](/uploads/63713d7960e5c6cd9bf71c71c177576f/qa2-354-c4_9_.png){width=1429 height=744}![qa2-354-c4_10_](/uploads/6eaa429ac114b85c3dfa95892b330326/qa2-354-c4_10_.png){width=1128 height=689} | PASS |  |
| Check if leases are displayed for a merchant whose client_type has been changed. | ![qa2-354-c5_1_](/uploads/fd1a67eac9c67bbe326ed98ffe278750/qa2-354-c5_1_.png){width=1179 height=87}![qa2-354-c5_2_](/uploads/09558efc19cba214b9c7db714b11012e/qa2-354-c5_2_.png){width=1108 height=404}![qa2-354-c5_3_](/uploads/f4a789c84d5834c5eeb1ea1fa63847a5/qa2-354-c5_3_.png){width=780 height=576}![qa2-354-c5_4_](/uploads/8e7557dc884eb816731f2eeecf979e32/qa2-354-c5_4_.png){width=780 height=576}![qa2-354-c5_5_](/uploads/17bc8954255e4c6d4d5940b7ae9145d2/qa2-354-c5_5_.png){width=780 height=576}![qa2-354-c5_6_](/uploads/242deeecabdd42c454374059775fde49/qa2-354-c5_6_.png){width=780 height=576}![qa2-354-c5_7_](/uploads/632bcc36834d3776d0b6500d77eb8267/qa2-354-c5_7_.png){width=1176 height=78}![qa2-354-c5_8_](/uploads/de723cc2b89fc698fbe16ffdb58f0cfa/qa2-354-c5_8_.png){width=786 height=572}![qa2-354-c5_9_](/uploads/c504c9b1f9999036a856b2a06c0b70f8/qa2-354-c5_9_.png){width=786 height=572}![qa2-354-c5_10_](/uploads/bad709946a60cb8ec8ffaf09d8086fdf/qa2-354-c5_10_.png){width=786 height=572}![qa2-354-c5_11_](/uploads/b36247e4c1ba2f8f956eb57e4fa26ac1/qa2-354-c5_11_.png){width=786 height=572}![qa2-354-c5_12_](/uploads/1e535514387e65747a5c624154d6fffc/qa2-354-c5_12_.png){width=1434 height=744}![qa2-354-c5_13_](/uploads/f9dc3f7ed1fb6ddf4ab13fdf47569fa4/qa2-354-c5_13_.png){width=1128 height=729}![qa2-354-c5_14_](/uploads/59b9ce6f2fa16cc47907fa75f66ed3e2/qa2-354-c5_14_.png){width=1437 height=746}![qa2-354-c5_15_](/uploads/e9ed3c597e08d2bb90344364c0778e8f/qa2-354-c5_15_.png){width=1126 height=658} | PASS |  |
| Check if, when registering a new cloned merchant with PayTomorrow credentials and client_type PAY_TOMORROW, creating a lease, marking it as funded and invoking the endpoint, that lease appears in the listing; and if the lease’s status changes, it is removed from the list. | ![qa2-354-c6_1_](/uploads/cec6f2446951c6cad035a717f1ea2bd2/qa2-354-c6_1_.png){width=1438 height=750}![qa2-354-c6_2_](/uploads/d7c4dbb1b2a91bf75d25c647c5c54f23/qa2-354-c6_2_.png){width=1438 height=750}![qa2-354-c6_3_](/uploads/c837bd5f0c61fad164b2cceb9c004a7b/qa2-354-c6_3_.png){width=1122 height=744}![qa2-354-c6_4_](/uploads/8e7eafc19162423d0f3e412dc36826e7/qa2-354-c6_4_.png){width=1120 height=686}![qa2-354-c6_5_](/uploads/d8314b9e86377f4a5215cca312835231/qa2-354-c6_5_.png){width=1120 height=686}![qa2-354-c6_6_](/uploads/27808a81d4e9abaf79e89b3fbdfcd118/qa2-354-c6_6_.png){width=1438 height=740}![qa2-354-c6_7_](/uploads/e93be2e8bbdeb3f9540b0d5b5653532a/qa2-354-c6_7_.png){width=1128 height=389} | PASS |  |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Check if a message indicating an invalid date range is displayed. |  | PASS |  |
| Check if the correct error message for a missing required field is displayed. |  | PASS |  |
| Check if the financed leases for the specified period are returned for merchants using the PayTomorrow credentials and customer type PAY_TOMORROW when a valid request is sent. |  | PASS |  |
| Check if leases are displayed for a merchant whose client_type has been changed. |  | PASS |  |
| Check if, when registering a new cloned merchant with PayTomorrow credentials and client_type PAY_TOMORROW, creating a lease, marking it as funded and invoking the endpoint, that lease appears in the listing; and if the lease’s status changes, it is removed from the list. |  | PASS |  |


Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Check if a message indicating an invalid date range is displayed. | ![stg-354-c1_1_](/uploads/af616b4daca84d11fb3598c83b9ec22d/stg-354-c1_1_.png){width=1083 height=587} | PASS |
| Check if the correct error message for a missing required field is displayed. | ![stg-354-c2_1_](/uploads/ebd8caa7b249735e9e9158b89d688fb2/stg-354-c2_1_.png){width=1083 height=587}![stg-354-c2_2_](/uploads/7d46d64aa711545b3f61d371f004a5d1/stg-354-c2_2_.png){width=1083 height=587}![stg-354-c2_3_](/uploads/4651b3bf911977c93e7a672ec1cbe39d/stg-354-c2_3_.png){width=1083 height=587}![stg-354-c2_4_](/uploads/680d8550eda6a20e83813dfcfdf0aeb6/stg-354-c2_4_.png){width=1083 height=587} | PASS |
| Check if the financed leases for the specified period are returned for merchants using the PayTomorrow credentials and customer type PAY_TOMORROW when a valid request is sent. | ![stg-354-c3_1_](/uploads/af44435ba28ba0c4e8d8aef2cc9bb734/stg-354-c3_1_.png){width=1089 height=722}![stg-354-c3_2_](/uploads/243a0027e2012c12face11ba47caddaa/stg-354-c3_2_.png){width=448 height=429} | PASS |
| Check if leases are displayed for a merchant whose client_type has been changed. | ![stg-354-c4_1_](/uploads/3d25c1c8b203a436867c742ad6757bd3/stg-354-c4_1_.png){width=524 height=262}![stg-354-c4_2_](/uploads/c1ac4e74fa1cb08042904ee5e636d4bc/stg-354-c4_2_.png){width=1086 height=539}![stg-354-c4_3_](/uploads/ed49124da968c8ebbc14413190592998/stg-354-c4_3_.png){width=530 height=391}![stg-354-c4_4_](/uploads/3ee9508f363e65f00142681dbc882388/stg-354-c4_4_.png){width=1083 height=717} | PASS |
| Check if, when registering a new cloned merchant with PayTomorrow credentials and client_type PAY_TOMORROW, creating a lease, marking it as funded and invoking the endpoint, that lease appears in the listing; and if the lease’s status changes, it is removed from the list. | ![stg-354-c5_1_](/uploads/d6fb7e0f491a2e4e6743a8b438ea45f2/stg-354-c5_1_.png){width=435 height=271}![stg-354-c5_2_](/uploads/8d9215d184b6ad3673b3fdc8816a7198/stg-354-c5_2_.png){width=510 height=247}![stg-354-c5_3_](/uploads/b848beb71738fcb2b3431be5a2bb67a4/stg-354-c5_3_.png){width=1092 height=716}![stg-354-c5_4_](/uploads/4bdc37b3752cacaf7073f13c4de706bb/stg-354-c5_4_.png){width=510 height=362} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
