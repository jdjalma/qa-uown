--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/401


UOWN | SVC | Create an API for Five9 to Update doNotText


Synopsis
More info Soon.

QA — Steps to Reproduce: updateContactPreferences (Five9)
Overview
New backend service to update Do Not Text preference for a phone number.

    Controller: Five9Controller
    Route base: /uown/tms
    Endpoint: POST /uown/tms/updateContactPreferences


Auth:
    Header Authorization = valid TMS API key
    Header username must be exactly Five9


Behavior:
    Finds all SvPhone records by phone number.
    Sets PhoneInfo.doNotText to requested value (idempotent; only updates if different).
    Writes an Activity Log entry per impacted accountPk (if any).


Preconditions

Environment up and reachable (base URL known).

Have the TMS API Key.

At least one test phone in DB:
    Case A: phone exists under one or more accounts.
    Case B: phone does not exist.

Optional: know one existing accountPk that owns the phone (for log verification).


Endpoint Details
URL
POST /uown/tms/updateContactPreferences

Headers
Content-Type: application/json
Authorization: <TMS_API_KEY>
username: Five9

Request body
{
  "accountPk": 12345,          // optional; used only for logging if present on the phone
  "phoneNumber": 8886576577,   // required; NANP, 10 digits (11 starting with '1' also accepted)
  "doNotText": true            // required; boolean
}

Responses
204 No Content on success.
400 Bad Request: invalid payload or invalid phone format.
401 Unauthorized: missing/invalid API key.
403 Forbidden: header username not equal to Five9.
404 Not Found: phone not found in the system.
500 Internal Server Error: unexpected failure.


Sample cURL Commands
Success (with accountPk)

curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"accountPk":12345,"phoneNumber":8886576577,"doNotText":true}'


Success (without accountPk)

curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":8886576577,"doNotText":false}'


Invalid phone (400)

curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":123,"doNotText":true}'


Phone not found (404)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":9998887777,"doNotText":true}'


Missing/invalid API key (401)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -d '{"phoneNumber":8886576577,"doNotText":true}'


DB Verification — Check do_not_text column
Use the query below to confirm the update on the uown_sv_phone table:
SELECT
  usp.account_pk,
  usp.do_not_text,
  usp.area_code,
  usp.phone_number,
  *
FROM uown_sv_phone usp;


Tip: run it before and after the API call to confirm the flag change.

-----

UOWN | SVC | Criar uma API para a Five9 atualizar doNotText

Sinopse Mais informações em breve.

QA — Passos para Reproduzir: updateContactPreferences (Five9) Visão geral Novo serviço backend para atualizar a preferência “Do Not Text” (não enviar SMS) para um número de telefone.

Controller: Five9Controller
Rota base: /uown/tms
Endpoint: POST /uown/tms/updateContactPreferences
Autenticação

Header Authorization = TMS API key válida
Header username deve ser exatamente Five9
Comportamento

Localiza todos os registros SvPhone pelo número de telefone.
Define PhoneInfo.doNotText para o valor solicitado (idempotente; só atualiza se estiver diferente).
Escreve uma entrada de Activity Log por cada accountPk impactado (se houver).
Pré-condições

Ambiente ativo e acessível (URL base conhecida).
Possuir a TMS API Key.
Ao menos um telefone de teste no banco:
Caso A: telefone existe sob uma ou mais contas.
Caso B: telefone não existe.
Opcional: conhecer um accountPk existente que seja dono do telefone (para verificação de log).
Detalhes do Endpoint URL POST /uown/tms/updateContactPreferences

Headers

Content-Type: application/json
Authorization: <TMS_API_KEY>
username: Five9

Corpo da requisição
{
  "accountPk": 12345,          // opcional; usado apenas para logging se o phone pertencer a essa conta
  "phoneNumber": 8886576577,   // obrigatório; NANP, 10 dígitos (11 iniciando com '1' também é aceito)
  "doNotText": true            // obrigatório; boolean
}

Respostas
204 No Content: sucesso.
400 Bad Request: payload inválido ou formato de telefone inválido.
401 Unauthorized: API key ausente/inválida.
403 Forbidden: header username diferente de Five9.
404 Not Found: telefone não encontrado no sistema.
500 Internal Server Error: falha inesperada.


Exemplos de cURL Sucesso (com accountPk)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"accountPk":12345,"phoneNumber":8886576577,"doNotText":true}'


Sucesso (sem accountPk)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":8886576577,"doNotText":false}'


Telefone inválido (400)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":123,"doNotText":true}'


Telefone não encontrado (404)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -H "Authorization: <TMS_API_KEY>" \
  -d '{"phoneNumber":9998887777,"doNotText":true}'


API key ausente/inválida (401)
curl -i -X POST "https://<HOST>/uown/tms/updateContactPreferences" \
  -H "Content-Type: application/json" \
  -H "username: Five9" \
  -d '{"phoneNumber":8886576577,"doNotText":true}'



Verificação no Banco de Dados — Conferir a coluna do_not_text Use a query abaixo para confirmar a atualização na tabela uown_sv_phone:
SELECT
  usp.account_pk,
  usp.do_not_text,
  usp.area_code,
  usp.phone_number,
  *
FROM uown_sv_phone usp;



--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
src/main/java/com/uownleasing/svc/exceptions/Five9Exception.java  0 → 100644
+
5
−
0

Visualizado
package com.uownleasing.svc.exceptions;

public class Five9Exception extends RuntimeException {
    public Five9Exception(String message) { super(message); }
}
 src/main/java/com/uownleasing/svc/pojo/rest/IVRContactPreferences.java  0 → 100644
+
22
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Getter
@Setter
public class IVRContactPreferences {

    @Positive
    private Long accountPk;

    @NotNull(message = "Phone number is required")
    private Long phoneNumber;

    @NotNull(message = "Do not text flag required")
    private Boolean doNotText;

}
 src/main/java/com/uownleasing/svc/rest/svc/Five9Controller.java  0 → 100644
+
37
−
0

Visualizado
package com.uownleasing.svc.rest.svc;

import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.pojo.rest.IVRContactPreferences;
import com.uownleasing.svc.service.Five9Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/tms", produces = MediaType.APPLICATION_JSON_VALUE)
public class Five9Controller {

    private final Five9Service five9Service;

    @PostMapping("/updateContactPreferences")
    public ResponseEntity<Void> updateContactPreferences(@RequestBody @Valid IVRContactPreferences request) {

        String username = ThreadAttributes.getUsername();
        if (username == null || !username.equalsIgnoreCase("Five9")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid or missing username header.");
        }

        five9Service.updateContactPreferences(request);

        return ResponseEntity.noContent().build();
    }
}
 src/main/java/com/uownleasing/svc/rest/svc/TmsController.java 
+
1
−
1

Visualizado
@@ -82,7 +82,6 @@ public class TmsController {
        if(CollectionUtils.isEmpty(creditCards))
            return null;
        return creditCards.get(0);

    }

    @PostMapping("/makeAchPayment")
@@ -100,4 +99,5 @@ public class TmsController {
            ThreadAttributes.getUsername()
        );
    }

}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos de teste:

Aqui está uma lista numerada de requisitos de testes extraídos da especificação da tarefa e das alterações de desenvolvimento indicadas.

Endpoint e Roteamento
Validar que o endpoint está disponível em POST /uown/tms/updateContactPreferences no Five9Controller.
Confirmar que o produces é application/json, mas a resposta de sucesso é 204 No Content (sem body).
Autorização — API Key (TMS)
Enviar chamada com Authorization: <TMS_API_KEY> válido e esperar 204.
Sem Authorization ou com chave inválida deve retornar 401 Unauthorized.
Header de Username — Five9
Especificação: “Header username must be exactly Five9”.
Implementação (Dev): equalsIgnoreCase("Five9") em Five9Controller (aceita variações de caixa).
Testes:
username: Five9 → aceitar (204).
username: five9 → verificar se aceita (204) conforme implementação (divergência da spec).
Qualquer outro valor → 403 Forbidden.
Content-Type
Requisições com Content-Type: application/json devem ser aceitas.
Envio sem JSON válido deve resultar em 400 Bad Request (falha de parse/validação).
Validação de Payload — Campos Obrigatórios e Regras
phoneNumber obrigatório (Bean Validation: @NotNull) → ausente: 400.
doNotText obrigatório (Bean Validation: @NotNull) → ausente: 400.
accountPk opcional; quando presente deve ser @Positive → valores <= 0 devem retornar 400.
Rejeitar valores não numéricos para phoneNumber (ex.: string): 400.
Formato de Telefone (NANP)
Aceitar 10 dígitos.
Aceitar 11 dígitos somente se iniciar por ‘1’.
Qualquer outro comprimento/forma inválida → 400 Bad Request (conforme spec “Invalid phone (400)”).
Telefone Não Encontrado
Quando não houver registros SvPhone para o phoneNumber, retornar 404 Not Found e não alterar nada no banco nem gerar logs.
Atualização Idempotente do Campo do_not_text
Quando doNotText solicitado for diferente do atual:
Atualizar todos os registros uown_sv_phone do número informado (todas as contas vinculadas).
Retornar 204 No Content.
Quando já estiver igual (idempotência):
Não alterar banco.
Não escrever Activity Log adicional.
Retornar 204 No Content.
Cenário Multi-Conta (mesmo telefone em várias contas)
Atualizar do_not_text em todos os SvPhone pertencentes ao phoneNumber.
Criar uma entrada de Activity Log por accountPk impactado (somente quando há mudança de valor).
Rechamar com o mesmo valor não deve criar logs adicionais (idempotência).
Uso do accountPk no Payload (opcional, “usado apenas para logging se presente no phone”)
Quando accountPk fornecido pertence a um dos donos do telefone:
Verificar que a Activity Log reflete corretamente o contexto desta conta.
Quando accountPk fornecido não é dono do telefone:
Confirmar que a atualização e logs ainda ocorrem para as contas realmente impactadas (conforme “per impacted accountPk (if any)”).
Quando accountPk ausente:
Atualização e logs devem ocorrer normalmente para as contas impactadas.
Respostas HTTP — Mapeamento
204 em sucesso (com ou sem accountPk).
400 para payload inválido (campos obrigatórios ausentes, accountPk <= 0, phoneNumber inválido).
401 quando Authorization ausente/inválida.
403 quando username diferente de “Five9” (atenção: código considera case-insensitive).
404 quando telefone não existe no sistema.
500 para falhas inesperadas (ex.: Five9Exception ou exceções internas).
Verificação HTTPS
Assegurar que chamadas reais aconteçam sobre HTTPS.
Caso de teste: rejeitar/considerar inválida uma tentativa em HTTP (usar infraestrutura/ambiente para garantir apenas HTTPS).
Persistência em Banco — Tabela uown_sv_phone
Executar a query antes e depois:
sql
SELECT usp.account_pk, usp.do_not_text, usp.area_code, usp.phone_number, *
FROM uown_sv_phone usp;
Verificar:
Quando muda o valor: do_not_text atualizado em todas as linhas do número.
Quando é idempotente: nenhum registro alterado.
Activity Log — Auditoria
Criar uma entrada por accountPk impactado quando houver mudança.
Não criar log quando a operação for idempotente (sem mudança).
Garantir que o usuário/a origem seja corretamente associado (ThreadAttributes/“Five9”).
Confiabilidade em Repetição
Repetir a mesma requisição (mesmo phoneNumber e doNotText) várias vezes:
Sempre 204, sem alterações no banco além da primeira chamada.
Sem logs duplicados.
Robustez contra Payloads Extras
Enviar chaves adicionais não previstas no payload:
Verificar que não causam erro (a não ser que a configuração rejeite), e que apenas os campos esperados são usados.
Tamanho/Tipo de Dados
phoneNumber muito grande (overflow de Long) ou negativo → 400.
accountPk com tipo inválido (string) → 400.
Comportamento sob Concorrência
Duas requisições simultâneas para o mesmo phoneNumber com valores diferentes (true/false):
O estado final deve ser consistente (última escrita define o valor).
Não gerar inconsistência em logs (1 log por mudança efetiva).
Observação de Divergência (Spec vs Dev)
Especificação exige username “exatamente Five9”.
Implementação usa equalsIgnoreCase("Five9").
Incluir casos de teste que verifiquem aceitação de five9/FIVE9, registrando a divergência para o time.
Casos dos Exemplos cURL (Smoke Tests)
Sucesso com accountPk.
Sucesso sem accountPk.
Telefone inválido (400).
Telefone não encontrado (404).
API key ausente/inválida (401).
Integração com Ferramentas de QA (HAR/Proxy) — Opcional
Se a suíte usar proxy/HAR (conforme novos steps adicionados em 
ApiSteps.java
):
Validar que a “last request to path '/uown/tms/updateContactPreferences' should use HTTPS”.
Validar que o JSON body contém phoneNumber e doNotText e, quando enviado, accountPk.
Validar ausência de chaves indevidas no body.
Tratamento de Exceções Internas
Forçar o Five9Service.updateContactPreferences a lançar Five9Exception (quando possível em ambiente de teste) e verificar retorno 500.
Compatibilidade de Normalização de Telefone
Confirmar que a busca de SvPhone considera o esquema de armazenamento (area_code + phone_number) e que o input (10 dígitos / 11 com ‘1’) mapeia corretamente para 
as linhas existentes.
Esses requisitos cobrem os cenários funcionais, de segurança, validação de dados, persistência, auditoria e idempotência previstos pela especificação
e reforçados pelas alterações de código (novas classes Five9Controller, IVRContactPreferences, Five9Exception e as validações declarativas via Bean Validation).

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Fluxo de teste

Abaixo está um esquema objetivo dos fluxos de teste, organizado por temas, para cobrir integralmente os requisitos funcionais, de segurança, 
validação, persistência, auditoria, idempotência e divergência Spec vs Dev.

Fluxo Happy Path — Sucesso com accountPk
Objetivo: Atualizar do_not_text quando há mudança, com accountPk presente.
Pré-condições: Telefone existente (em 1+ contas) e estado atual diferente do solicitado.
Passos:
Coletar estado atual no DB (query em uown_sv_phone).
POST /uown/tms/updateContactPreferences com headers válidos e body com accountPk, phoneNumber, doNotText.
Validações:
HTTP 204.
DB atualizado em todas as linhas do phoneNumber.

1 Activity Log por accountPk impactado (ator “Five9”).
HAR: última request HTTPS e body contém phoneNumber, doNotText, accountPk (quando enviado).
Fluxo Happy Path — Sucesso sem accountPk
Objetivo: Atualizar do_not_text quando há mudança, sem accountPk.

Passos/Validações: Idêntico ao Fluxo 1, exceto sem accountPk no body. Logs por contas impactadas.
Fluxo Idempotente — Sem mudanças subsequentes
Objetivo: Garantir idempotência (repetição segura).
Passos:
Executar fluxo de sucesso que muda o valor.
Repetir a mesma chamada (mesmo doNotText).
Validações:
HTTP 204 em ambas.
DB sem alterações na 2ª chamada.
Sem novos Activity Logs na 2ª chamada.
Matriz de Autorização — API Key
Objetivo: Verificar Authorization.
Casos:
Válida → 204 (se dados corretos).
Ausente/Inválida → 401.
Validações: Status code conforme esperado; nenhuma alteração de DB em 401.
Matriz de Username — Spec vs Dev (divergência)
Objetivo: Verificar username header.
Casos:
“Five9” → 204.
“five9”/“FIVE9” → 204 (implementação usa equalsIgnoreCase).
Qualquer outro → 403.
Observação: Registrar a divergência entre Spec (exatamente “Five9”) e Dev (case-insensitive).
Content-Type e JSON inválido
Objetivo: Verificar rejeição de payload inválido.
Casos:
Content-Type: application/json com JSON válido → segue fluxo normal.
JSON malformado/ausente → 400.
Validações: Status 400 e sem alterações no DB.
Validações de Payload — Campos obrigatórios e regras
Objetivo: Testar Bean Validation (em IVRContactPreferences).
Casos:
Sem phoneNumber → 400.
Sem doNotText → 400.
accountPk <= 0 → 400.
phoneNumber não numérico → 400.
Formato de Telefone (NANP)
Objetivo: Validar formato aceito.
Casos:
10 dígitos → aceitar.
11 dígitos iniciando por ‘1’ → aceitar.
Outros comprimentos ou 11 sem ‘1’ → 400.
Validações: Status code e nenhuma alteração de DB em 400.
Telefone Não Encontrado
Objetivo: Quando não há SvPhone para o número.
Passos:
Garantir inexistência do número (ou usar número garantidamente ausente).
Executar POST válido.
Validações:
HTTP 404.
DB inalterado e sem Activity Logs.
Cenário Multi-Conta (mesmo telefone em várias contas)
Objetivo: Atualizar todas as contas e log por conta.
Passos:
Número associado a 2+ account_pk.
Mudar doNotText.
Validações:
204.
DB: todas as linhas do número atualizadas.
Activity Log: 1 por conta impactada.
Repetição idempotente não cria logs extras.
Uso de accountPk (opcional)
Objetivo: Validar uso apenas para logging quando pertence ao phone.
Casos:
accountPk é dono do phoneNumber → log contextual correto.
accountPk não é dono → atualização/ logs ocorrem para donos reais; não associar indevidamente.
Sem accountPk → logs por contas impactadas normalmente.
Mapeamento de Respostas HTTP
Objetivo: Garantir todos os códigos cobertos.
Casos: 204, 400, 401, 403, 404, 500 (conforme requisitos).
Validações: Status code e efeitos colaterais adequados (DB/Logs apenas em 204 com mudança).
Verificação HTTPS (HAR)
Objetivo: Garantir uso de HTTPS.
Passos:
Executar chamada válida.
Usar validação HAR (steps novos em 
ApiSteps.java
) para checar HTTPS.
Validações: Última request a /uown/tms/updateContactPreferences usa HTTPS.
Persistência em Banco — Antes e Depois
Objetivo: Confirmar atualização de do_not_text.
Passos:
Rodar SELECT antes e depois:
SELECT usp.account_pk, usp.do_not_text, usp.area_code, usp.phone_number, * FROM uown_sv_phone usp
Validações:
Mudança somente quando valor difere.
Idempotente não altera.
Activity Log — Auditoria
Objetivo: Validar logging por conta e ator “Five9”.
Passos:
Executar mudança e consultar logs.
Validações:
1 log por accountPk impactado quando houver alteração.
Sem log adicional em idempotência.
Origem/usuário atrelado a “Five9”.
Robustez a Campos Extras no Payload
Objetivo: Enviar chaves desconhecidas.
Expectativa: Não causar erro (a não ser configuração contrária), sem usar campos inesperados.
Validações: 204 e somente campos esperados considerados.
Tipos e Limites de Dados
Objetivo: Validar tipos e limites.
Casos:
phoneNumber negativo ou excedendo Long → 400.
accountPk string → 400.
Validações: Sem efeitos colaterais no DB em 400.
Concorrência (Last Write Wins)
Objetivo: Consistência sob concorrência.
Passos:
Disparar duas requisições quase simultâneas com doNotText opostos.
Observar estado final e logs.
Validações:
Estado final consistente (última escrita prevalece).
Logs refletem somente mudanças efetivas (por transição de valor).
Tratamento de Exceções Internas (500)
Objetivo: Validar fallback de erro interno.
Passos:
Simular Five9Service.updateContactPreferences lançando Five9Exception (em ambiente controlado/flag).
Validações:
HTTP 500.
Sem alteração de DB para requisição que gerou 500.
Smoke Tests — cURL de exemplo
Objetivo: Garantir exemplos funcionais.
Casos:
Sucesso com accountPk.
Sucesso sem accountPk.
Telefone inválido (400).
Telefone não encontrado (404).
API key ausente/inválida (401).
Observabilidade com HAR (opcional no pipeline)
Objetivo: Validar conteúdo do JSON body e ausência de chaves indevidas.
Passos:
Usar steps novos em 
ApiSteps.java
:
“last request … should use HTTPS”
“JSON body should contain json paths …”
“JSON body should NOT contain keys …”
Validações: Body mínimo contém phoneNumber e doNotText, e accountPk quando enviado.
Sugestões práticas de execução

Pré-condições: Gerar/identificar phoneNumber de teste com 1 conta e com múltiplas contas.
DB: Usar DatabaseUtil para captura/limpeza de estado quando aplicável.
API: Centralizar chamadas via ApiSteps (padrão do projeto).
HAR: Habilitar proxy (BrowserMob) para usar steps de rede recém-adicionados em 
ApiSteps.java
.
Registro de divergência: Documentar aceitação de username case-insensitive como desvio da Spec.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🔎 Casos de Teste — updateContactPreferences (Five9)
------------------------------------------------------------------------------------------------
Sucesso — telefone válido, com accountPk - 6106898168 - 4142

Enviar phoneNumber existente e accountPk correspondente.

Esperado: 204 No Content.

Verificar: coluna do_not_text atualizada e Activity Log criado para o accountPk.
------------------------------------------------------------------------------------------------
Sucesso — telefone válido, sem accountPk

Enviar apenas phoneNumber existente e doNotText.

Esperado: 204 No Content.

Verificar: coluna do_not_text atualizada em todos os accounts do telefone.

Sem Activity Log vinculado a accountPk.
------------------------------------------------------------------------------------------------
Sucesso — telefone válido vinculado a múltiplos accountPk

Usar phoneNumber que pertence a mais de um account.

Esperado: 204 No Content.

Verificar: todos os registros do_not_text do mesmo número atualizados.

Logs criados para cada accountPk.
------------------------------------------------------------------------------------------------
Idempotência — repetir requisição com mesmo valor de doNotText

Fazer a mesma chamada duas vezes seguidas.

Esperado: segunda chamada não altera nada (continua 204).

Verificar: nenhum log duplicado (só se houve update na primeira).
------------------------------------------------------------------------------------------------
Erro — phoneNumber inválido (menos de 10 dígitos)

Ex.: "phoneNumber": 123.

Esperado: 400 Bad Request.
------------------------------------------------------------------------------------------------
Erro — phoneNumber inexistente

Ex.: "phoneNumber": 9998887777 (não existe no DB).

Esperado: 404 Not Found.
------------------------------------------------------------------------------------------------
Erro — sem phoneNumber no body

Mandar JSON sem esse campo.

Esperado: 400 Bad Request.
------------------------------------------------------------------------------------------------
Erro — sem doNotText no body

Mandar JSON com só phoneNumber.

Esperado: 400 Bad Request.
------------------------------------------------------------------------------------------------
Erro — sem API Key

Omitir o header Authorization.

Esperado: 401 Unauthorized.
------------------------------------------------------------------------------------------------
Erro — API Key inválida

Usar valor incorreto no header Authorization.

Esperado: 401 Unauthorized.
------------------------------------------------------------------------------------------------
Erro — username incorreto

Usar "username": "Five9Test".

Esperado: 403 Forbidden.
------------------------------------------------------------------------------------------------
Erro genérico / servidor

Simular falha (ex.: desligar DB).

Esperado: 500 Internal Server Error.
------------------------------------------------------------------------------------------------
👉 Com essa lista numerada você consegue rodar no Postman/cURL e depois validar no banco (do_not_text) e logs.

Quer que eu organize essa lista também em formato tabela (cenário | entrada | resposta esperada | verificação no DB/logs)?


alterar o telefone do cliente e consultar
consultar e ver o cliente, remover o telefone

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

> ```gherkin
> Nonexistent phone – Validated that the endpoint correctly returns phone not found when providing a nonexistent number.
> ```
>
>

> ```gherkin
> With accountPk – Updated contact preferences (checked and unchecked) by providing phone and accountPk, validating log entries and database persistence.
> ```
>
>

> ```gherkin
> Without accountPk – Updated contact preferences (checked and unchecked) by providing only phone, validating log entries and database persistence.
> ```
>
>

> ```gherkin
> Multiple records scenario – Identified an error when multiple records exist with the same phone and different preferences; in this case, the endpoint does not apply the update correctly.
> ```
>
>

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.44.0_CreateAnAPIForFive9ToUpdateDoNotText_Ticket401

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------