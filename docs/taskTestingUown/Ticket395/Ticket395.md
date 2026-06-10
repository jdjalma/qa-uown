--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/395

UOWN | Servicing | Create /searchByEmail Endpoint

Synopsis
Create a new endpoint /searchByEmail that accepts an EmailSearchRequest containing username, password, and emailAddress. 
Validate the merchant and return leads that match the provided email for the applicable client type.

Business Objective

Feature Request | Business Requirements
Implement endpoint: /searchByEmail.
Request: EmailSearchRequest must include username, password, and emailAddress.
Authenticate using username and password.
Validate the merchant before processing.
Return leads that match emailAddress, restricted to the relevant client type.

Test instructions
Besides the new endpoint, this issue also introduced changes to servicing and origination portals in existing features, which will need to be re-tested.
search component on both portals was modified
on origination the search leads in the /leads page, the buttons related to the search must the tested as well (download csv, send email)
and on servicing the search in the /search page, the buttons related to the search must the tested as well (download csv, send email)

new endpoint
The new endpoint will return all leads matching an email address, restricted to leads from merchants whose type matches the one specified by the provided username and password credentials.
Example request:
curl --location 'https://svc-dev1.uownleasing.com/uown/los/merchant/searchByEmail' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "marcos.silva.gow@uownleasing.com",
    "username": "<merchant name>",
    "password": "<merchant api key>",
    "pageNumber": 2,  # optional, default 1
    "maxResults": 20  # optional, default 50
}'

-----

Título UOWN | Servicing | Criar endpoint /searchByEmail

Sinopse Criar um novo endpoint /searchByEmail que receba um EmailSearchRequest contendo username, password e emailAddress.
Validar o merchant e retornar os leads que correspondam ao e-mail fornecido para o tipo de cliente aplicável.

Objetivo de Negócio Entrega de funcionalidade para permitir busca de leads por e-mail via endpoint autenticado, considerando o tipo de cliente do merchant autenticado.

Requisitos de Negócio
    Implementar endpoint: /searchByEmail.
    Requisição: EmailSearchRequest deve incluir username, password e emailAddress.
    Autenticar usando username e password.
    Validar o merchant antes do processamento.
    Retornar leads que correspondam a emailAddress, restritos ao tipo de cliente relevante.

Instruções de Teste
Além do novo endpoint, esta issue introduziu mudanças nos portais de servicing e origination em funcionalidades já existentes, que precisam ser re-testadas:
    O componente de busca em ambos os portais foi modificado.
    No origination, a busca de leads na página /leads: testar também os botões relacionados à busca (download csv, send email).
    No servicing, a busca na página /search: testar também os botões relacionados à busca (download csv, send email).
Novo Endpoint O novo endpoint retornará todos os leads que correspondam a um endereço de e-mail, 
restritos aos leads de merchants cujo tipo corresponda ao especificado pelas credenciais (username e password) fornecidas.
Exemplo de Requisição (mantido em inglês conforme padrão de código/logs):
curl --location 'https://svc-dev1.uownleasing.com/uown/los/merchant/searchByEmail' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "marcos.silva.gow@uownleasing.com",
    "username": "<merchant name>",
    "password": "<merchant api key>",
    "pageNumber": 2,  # optional, default 1
    "maxResults": 20  # optional, default 50
}'

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

alterações dev:
src/main/java/com/uownleasing/svc/pojo/rest/EmailSearchRequest.java  0 → 100644
+
12
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import lombok.Data;

@Data
public class EmailSearchRequest {
    private String email;
    private String username;
    private String password;
    Integer pageNumber = 1;
    Integer maxResults = 50;
}
 src/main/java/com/uownleasing/svc/pojo/rest/SearchByEmailResult.java  0 → 100644
+
24
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import com.uownleasing.common.enumeration.LeadStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class SearchByEmailResult extends SearchResultBase {
    private Long leadPk;
    private Long accountPk;
    private String uuid;
    private LeadStatus leadStatus;
    private String firstName;
    private String lastName;
    private String ssn;
    private String email;
    private String areaCode;
    private String phone;
    private String invoiceNumber;
    private String last4CC;
    private String refMerchantCode;
    private String locationName;
}
 src/main/java/com/uownleasing/svc/rest/los/MerchantController.java  0 → 100644
+
22
−
0

Visualizado
package com.uownleasing.svc.rest.los;

import com.uownleasing.svc.pojo.rest.EmailSearchRequest;
import com.uownleasing.svc.pojo.rest.SearchByEmailResult;
import com.uownleasing.svc.pojo.rest.SearchResults;
import com.uownleasing.svc.service.LosMerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/los/merchant", produces = MediaType.APPLICATION_JSON_VALUE)
public class MerchantController {
    private final LosMerchantService losMerchantService;

    @PostMapping("/searchByEmail")
    public SearchResults<SearchByEmailResult> searchByEmail(
        @RequestBody EmailSearchRequest emailSearchRequest) {
        return losMerchantService.findLeadsByEmail(emailSearchRequest);
    }
}
 src/main/java/com/uownleasing/svc/service/LosMerchantService.java  0 → 100644
+
46
−
0

Visualizado
package com.uownleasing.svc.service;

import com.uownleasing.svc.db.repository.MerchantRepo;
import com.uownleasing.svc.enumeration.ClientType;
import com.uownleasing.svc.pojo.rest.EmailSearchRequest;
import com.uownleasing.svc.pojo.rest.SearchByEmailResult;
import com.uownleasing.svc.pojo.rest.SearchResult;
import com.uownleasing.svc.pojo.rest.SearchResults;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;

@Service
@AllArgsConstructor
@Slf4j
public class LosMerchantService {
    private SearchService searchService;
    private final MerchantRepo merchantRepo;

    public SearchResults<SearchByEmailResult> findLeadsByEmail(EmailSearchRequest emailSearchRequest) {
        if (StringUtils.isBlank(emailSearchRequest.getUsername())) {
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, "username is required");
        }
        if (StringUtils.isBlank(emailSearchRequest.getPassword())) {
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, "password is required");
        }
        if (StringUtils.isBlank(emailSearchRequest.getEmail())) {
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, "email is required");
        }
        ClientType clientType = getClientTypeByUserNameApiKey(emailSearchRequest.getUsername(), emailSearchRequest.getPassword());
        if (clientType == null) {
            throw new HttpServerErrorException(HttpStatus.UNAUTHORIZED, "Invalid username and password");
        }

        return searchService.getLosLeadsByEmail(emailSearchRequest.getEmail(), clientType.toString(), emailSearchRequest.getPageNumber(), emailSearchRequest.getMaxResults());
    }

    private ClientType getClientTypeByUserNameApiKey(String username, String password) {
        if (StringUtils.isBlank(username) || StringUtils.isBlank(password))
            return null;
        return merchantRepo.getClientTypeByUserNameApiKey(username, password).orElse(null);
    }
}

-----


Além do novo endpoint, esta issue introduziu mudanças nos portais de servicing e origination em funcionalidades já existentes, que precisam ser re-testadas:
    O componente de busca em ambos os portais foi modificado.
        Origination
        Servicing
    No origination, a busca de leads na página /leads: testar também os botões relacionados à busca (download csv, send email).
    No servicing, a busca na página /search: testar também os botões relacionados à busca (download csv, send email).
Novo Endpoint O novo endpoint retornará todos os leads que correspondam a um endereço de e-mail, 
restritos aos leads de merchants cujo tipo corresponda ao especificado pelas credenciais (username e password) fornecidas.
Exemplo de Requisição (mantido em inglês conforme padrão de código/logs):
curl --location 'https://svc-dev1.uownleasing.com/uown/los/merchant/searchByEmail' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "marcos.silva.gow@uownleasing.com",
    "username": "<merchant name>",
    "password": "<merchant api key>",
    "pageNumber": 2,  # optional, default 1
    "maxResults": 20  # optional, default 50
}'
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Escopo

Validar o novo endpoint autenticado /uown/los/merchant/searchByEmail.
Re-testar os componentes de busca nos portais:
    Origination: página /leads (+ botões “download csv”, “send email”).
    Servicing: página /search (+ botões “download csv”, “send email”).
Verificar coerência de resultados entre API e UI (mesmo email e mesma restrição por clientType do merchant autenticado).

1 - API /searchByEmail – Requisitos de Teste Baseado nos arquivos:
Controller: src/main/java/com/uownleasing/svc/rest/los/MerchantController.java
Service: src/main/java/com/uownleasing/svc/service/LosMerchantService.java
Request: src/main/java/com/uownleasing/svc/pojo/rest/EmailSearchRequest.java
Result: src/main/java/com/uownleasing/svc/pojo/rest/SearchByEmailResult.java

1.1. Sucesso básico
Deve aceitar payload com email, username, password e retornar 200 com SearchResults<SearchByEmailResult>.
Deve respeitar paginação:
    Defaults: pageNumber=1 e maxResults=50 (omitir ambos e verificar defaults).
    pageNumber e maxResults informados (e.g., 2 e 20) retornam a fatia correta.
Deve restringir resultados ao clientType obtido pelas credenciais (MerchantRepo.getClientTypeByUserNameApiKey).
    Validar que todos os leads retornados pertencem a merchants do mesmo clientType.
Campos do SearchByEmailResult presentes e coerentes:
    leadPk, accountPk, uuid, leadStatus, firstName, lastName, ssn, email, areaCode, phone, invoiceNumber, last4CC, refMerchantCode, locationName.
    Se houver políticas de máscara (ssn/last4CC), validar JSON retornado conforme regra vigente.
Deve chamar searchService.getLosLeadsByEmail(email, clientType, pageNumber, maxResults) com os valores corretos.

1.2. Validações e erros (defensivos)
BAD_REQUEST (400) quando:
    username em branco.
    password em branco.
    email em branco.
    Mensagens coerentes com o código (e.g., "username is required", etc.).
UNAUTHORIZED (401) quando credenciais são inválidas:
    getClientTypeByUserNameApiKey retorna vazio → “Invalid username and password”.
Email inválido (formato):
    Se houver validação de formato, garantir 400; se não houver, documentar comportamento atual.
Limites de paginação:
maxResults muito alto (testar limite superior aceito ou truncamento).
pageNumber negativo ou zero → comportamento/erro esperado (documentar).
Segurança de dados:
Verificar ausência de dados sensíveis indevidos (e.g., SSN completo).
Verificar cabeçalhos e CORS, se aplicável.

1.3. Restrições por clientType (criticamente exigido pela regra de negócio)
    Usar credenciais de um merchant do tipo A → garantir que resultados não tragam leads do tipo B.
    Repetir com credenciais de outro tipo para garantir isolamento por tipo de cliente.

1.4. Consistência de filtros (email)
    E-mail com case diferente (UPPER/lower/mixed) retorna os mesmos leads (case-insensitive, se esperado).
    E-mail com espaços antes/depois é trimado (se aplicável).
    E-mail inexistente → lista vazia com 200.

1.5. Performance mínima
    Resposta aceitável sob volume moderado (ex.: 200 ms-1 s em dev, ajustado ao ambiente).
    Paginado mantendo ordem consistente entre páginas.

1.6. Observabilidade
    Logs de erro informativos para 400/401.
    Não logar segredos (password) em plaintext.

2 - Origination – Página /leads (Componente de Busca Modificado)
Acessar página origination /leads.
Validar funcionamento do campo/filtros de busca (usar enum das opções de busca, conforme feature).
Verificar retenção de filtros após busca (se aplicável).
Validação da tabela:
    Colunas esperadas.
    Resultados compatíveis com filtros aplicados (use validateColumnValues).
Botões relacionados:
    Download CSV:
        Clique habilitado.
        Inicia download com arquivo gerado.
        Estrutura e conteúdo do CSV consistentes com os resultados exibidos.
    Send email:
        Ação habilitada.
        Disparo do fluxo de e-mail (verificar tela de confirmação, logs ou fila, conforme suporte no ambiente).
Estados edge:
    Sem resultados: mensagem de “no results”/grid vazia correta.
    Erros de backend: tratamento de erro/alerta na UI.
UX/Comportamento:
    Botões desabilitados quando não há resultados (se regra).
    Paginação funciona e reflete contagem.

3 - Servicing – Página /search (Componente de Busca Modificado)
Acessar servicing /search.
Validar funcionamento do campo/filtros de busca.
Validação da tabela:
    Colunas esperadas e coerentes.
    Resultados compatíveis com filtros aplicados.
Botões relacionados:
    Download CSV:
        Arquivo é gerado e baixado.
    Conteúdo consistente com resultados.
    Send email:
        Disparo efetivo (confirmar via UI/logs).
Estados edge:
    Sem resultados e mensagens adequadas.
    Tratamento de erro quando backend falha.
Paginação/retensão:
    Paginação consistente.
    Retenção de filtros (se aplicável).

4 - Integração API x UI (Consistência e Autorização)
Para um merchant do tipo X:
    Chamar API searchByEmail por um e-mail.
    Executar a mesma busca nas UIs (Origination /leads e Servicing /search) com o mesmo e-mail.
    Os resultados devem ser consistentes e respeitar o clientType do merchant autenticado no endpoint.
Cruzar merchants:
    Merchant A (tipo X) deve ver apenas leads do tipo X na API; na UI, dependendo do perfil, comportamento deve ser consistente.
E-mails com múltiplos leads:
    Verificar paginação e total counts iguais entre API e UI (na medida do possível).
CSV/e-mail:
    CSV exportado e e-mail enviado devem refletir o conjunto filtrado que corresponde ao e-mail e tipo de cliente.

5 - Segurança e Acesso
Autenticação no endpoint com credenciais corretas (200) vs incorretas (401).
Tentativa de injeção/valores malformados em email, username, password não deve quebrar o serviço (defesa básica).
Não exposição de segredos em logs/respostas.

6 - Dados/Preparação (Test Data)
Criar/usar contas com e-mails conhecidos para validar retornos.
Garantir merchants de tipos distintos para testar restrição por clientType.
Verificar comportamento quando o e-mail pertence a múltiplos merchants de mesmo tipo.

7 - Não Funcionais
Performance sob carga leve (smoke).
Robustez contra intermitência (retries no nível dos testes, se necessário).
Observabilidade (logs e correlação de chamadas).

8 - Critérios de Aceite
Endpoint /searchByEmail:
    Retorna 200 com resultados paginados corretos e restritos ao clientType das credenciais.
    Retorna 400 para campos obrigatórios ausentes com mensagens adequadas.
    Retorna 401 para credenciais inválidas.
Origination /leads:
    Busca funcional.
    CSV download e send email operacionais e coerentes com os resultados.
Servicing /search:
    Busca funcional.
    CSV download e send email operacionais e coerentes com os resultados.
Consistência API ↔ UI garantida para o mesmo e-mail e restrições de clientType.

9 - Observações de implementação nos testes
Para UI, priorizar verifyPanel + ValidationType nas verificações.
Seletores estáveis centralizados em Elements.java.
Fallbacks com wait.until para comportamentos assíncronos.
Para API, usar ApiSteps e padronizar payloads (JSON em inglês).
Logs sempre em inglês.    

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
fluxo:
Vamos criar um fluxo automatizado de teste para atender aos requisitos de teste da implementação.
Criar uma conta
Realizar busca no componente de busca alterado em Origination usando todas as opcoes
Acessar pagina de leads
Realizar busca usando os filtros
Confrontar parametros de busca com resultados exibidos na tabela
Fazer download arquivo csv e validar que arquivo foi disponibilizado para download
Enviar arquivo csv via email e validar que email foi disparado
Realizar consulta ao endpoint searchByEmail para um merchant
Acessar pagina search em Servicing
Realizar busca usando os filtros
Confrontar parametros de busca com resultados exibidos na tabela
Fazer download arquivo csv e validar que arquivo foi disponibilizado para download
Enviar arquivo csv via email e validar que email foi disparado
Realizar consulta ao endpoint para um merchant diferente do usado na primeira consulta


Criar um fluxo de teste no mesmo arquivo feature onde é disparado endpoint com usuario e senha incorretos
Criar um fluxo de teste no mesmo arquivo feature onde é disparado endpoint sem usuario e senha

vamos melhorar o passo
When Apply filters on "origination" page "leads" from "<firstFrom>" to "<firstTo>" with merchant "<merchantFilter>" location "<location>" and client type "<clientType>" and execute search if the following argument is yes: "yes"
deixando mais generico. Atualmente ele esta recebendo 
with merchant "<merchantFilter>" location "<location>" and client type "<clientType>"
quero deixar esses campo genericos para ele receber qualquer campo e qualquer quantidade de campo para preencher e realizar a busca ou nao dependnendo do outro parametros

Veja no projeto se temos um step pronto para comparar o que é busca com o que esta na tabela de resultados e se nao tem um step para isso iremos criar reutilizando nossos metodos.

Veja no projeto se temos um step pronto para fazer download recebendo o botão como parametro porque assim poderemos fazer download em qualquer botão

Precisamos de um step que verifica se o endpoint foi disparado porque desa forma podemos usar no envio de email e em qualquer outro local

Criei o arquivo feature legacy-project/ui_automation\src\test\resources\uownfeatures\templates\specific_tickets\R7.25.1.44.0_CreateSearchByEmailEndpoint_Ticket395.feature
para receber nossa implementação.

Verifique no projeto se temos os steps e metodos necessarios, se nao tem vamos criar mas sempre que possivel reutilizando nossos metodos.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in -qa1

> ```gherkin
> ### Scenario Outline: Create searchByEmail Endpoint in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Check the account has been successfully created in origination
> And Transition to the contract URL
> And Complete application payment information, with validation if the following argument is yes: "no"
> And Check for contract created payment status, waiting a maximum of "60" seconds
> And Complete signing of the application
> And Navigate to the individual customer page
> And Get document status updated
> And Check the account status on customer page
> 
> Then Check change to signed button is not visible
> Then Perform quick search by "invoice" option in portal "origination"
> Then Settle the new lease
> And Proceed to funding and send to funding, then funded
> Then Navigate to the individual customer page and get the accountPk
> 
> Then Perform quick search by "lead" option in portal "origination"
> Then Perform quick search by "account" option in portal "origination"
> Then Perform quick search by "phone" option in portal "origination"
> Then Perform quick search by "email" option in portal "origination"
> Then Perform quick search by "uuid" option in portal "origination"
> Then Perform quick search by "name" option in portal "origination"
> Then Perform quick search by "last4cc" option in portal "origination"
> Then Perform quick search by "ssn" option in portal "origination"
> 
> And Access the "origination" portal and page "leads"
> When Fill Leads date range from "<firstFrom>" to "<firstTo>"
> When Fill non-date filters on "origination" page "leads" with:
> | field        | value               |
> | email        | <emailLeads>        |
> | customerName | <customerNameLeads> |
> And Reset network capture
> When Click search button
> Then Results table should match:
> | column       | value               |
> | email        | <emailLeads>        |
> Then Network contains "POST" to path "/uown/los/getLeadsByCriteria" with status 200
> And Click button "Download CSV" and verify a file is downloaded within 30 seconds
> And Click button "Send Email" and verify a file is downloaded within 30 seconds
> And Reset network capture
> Then Call searchByEmail with username "payTomorrow", password "U0wn_payTomorrow", email "<emailLeads>" and expect HTTP 200
> Then Last API response array size should be less than or equal to 50
> Then All items in last API response should have email "<emailLeads>"
> Then Last API response should contain email "<emailLeads>"
> Then Network contains "POST" to path "/uown/los/merchant/searchByEmail" with status 200
> 
> And Transfer to servicing main page
> And Log in to service portal
> And Access the "servicing" portal and page "search"
> When Fill Leads date range from "<firstFrom>" to "<firstTo>"
> When Fill non-date filters on "servicing" page "search" with:
> | field | value        |
> | email | <emailLeads> |
> And Reset network capture
> When Click search button
> Then Results table should match:
> | column | value        |
> | email  | <emailLeads> |
> Then Network contains "POST" to path "/uown/svc/getAccountsByCriteria" with status 200
> And Click button "Download CSV" and verify a file is downloaded within 30 seconds
> And Click button "Send Email" and verify a file is downloaded within 30 seconds
> And Reset network capture
> Then Call searchByEmail with username "payTomorrow", password "U0wn_payTomorrow", email "<emailLeads>" and expect HTTP 200
> Then Last API response array size should be less than or equal to 50
> Then All items in last API response should have email "<emailLeads>"
> Then Network contains "POST" to path "/uown/los/merchant/searchByEmail" with status 200
> 
> And Reset network capture
> Then Call searchByEmail with username "payTomorrow", password "U0wn_payTomorrow", email "<emailLeads>" page 2 max 5 and expect HTTP 200
> Then Last API response array size should be less than or equal to 5
> Then Network contains "POST" to path "/uown/los/merchant/searchByEmail" with status 200
> And Reset network capture
> Then Call searchByEmail with username "invalid-merchant", password "invalid-key", email "<emailLeads>" and expect HTTP 401 or 500 with message "Invalid username and password"
> 
> And Test is successful
> Examples:
> | env | state | merchant         | browser | firstFrom  | firstTo    | ssnLeads  | emailLeads                | phoneLeads | customerNameLeads | merchantLeads | locationLeads | searchLeads | expectedClientType |
> | qa1 | NY    | ProgressMobility | chrome  | 01-01-2025 | 09-22-2025 | 123456780 | fintechgroup777@gmail.com | 1234567890 | test              | test          | test          | test        | PAY_TOMORROW       |
>
> | PASS | LeadPk:9983 | AccountPk:4129 | Merchant:Progress Mobility | 
> ```
>

---

> ```gherkin
> ### Scenario Outline: Validate client type restriction in "<env>"
> And Reset network capture
> Then Call searchByEmail with username "payTomorrow", password "U0wn_payTomorrow", email "<emailLeads>" and expect HTTP 200
> Then Last API response should contain email "<emailLeads>"
> Then All items in last API response should have field "refMerchantCode" starting with "OL"
> Then Network contains "POST" to path "/uown/los/merchant/searchByEmail" with status 200
> 
> And Reset network capture
> Then Call searchByEmail with alt merchant env credentials and email "<emailLeads>" expect HTTP 200
> Then All items in last API response should have field "refMerchantCode" starting with "OW"
> Then Network contains "POST" to path "/uown/los/merchant/searchByEmail" with status 200
> 
> And Test is successful
> 
>  Examples:
> | env | browser | emailLeads                |
> | qa1 | chrome  | fintechgroup777@gmail.com |
> 
> | PASS | Merchant:Progress Mobility | 
> ```
>
>

>
>

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

MELHORIA - busca aceitar phone com mascara. ex:(378) 864-4213
MELHORIA - busca aceitar ssn com mascara. ex:478-09-7074

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.44.0_CreateSearchByEmailEndpoint_Ticket395

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
