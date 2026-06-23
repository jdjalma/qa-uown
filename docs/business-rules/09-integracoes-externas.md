---
title: Integracoes com Terceiros
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/data/merchant-config-contract.ts#offerInsurance
  - db: uown_sv_protection_plan
  - svc-source: config/rightfoot/RightFootConfig.java
  - env: qa2
covers: [buddy-insurance, taxcloud, taxjar, five9, kornerstone, proget, skit-ai, vendor-health, rightfoot]
---

# Integracoes com Terceiros
## UOwn Leasing - SVC Platform

Buddy Insurance, TaxCloud/TaxJar, Five9, RTR/Kornerstone, Proget e Skit.ai.

---

## 23. Plano de Protecao (Buddy Insurance)

### O Que e

O plano de protecao e um **produto de seguro opcional** oferecido ao cliente, operado pela **Buddy Insurance** (parceira da AON). O produto e `AON_PURCHASEPROTECTION` -- seguro de protecao de compra para a mercadoria alugada.

### Para Que Serve

Protege o cliente contra danos, roubo ou perda do produto alugado durante o periodo do lease.

### Preco

**$12.99/mes** (mensal), $38.97 (trimestral), $155.88 (pagamento unico). A Buddy coleta diretamente via token de cartao do cliente.

### Como o Cliente Seleciona

**Canal 1 - Na Originacao (durante assinatura):**
O formulario de e-sign apresenta a oferta do plano. O cliente marca `optIn = true` para participar ou `optIn = false` para recusar.

**Canal 2 - No Portal do Cliente (pos-funding):**
Endpoint `GET /getPlanEligibilityForAccount/{accountPk}` verifica elegibilidade, e `POST /enrollAccountInProtectionPlan` efetua a inscricao.

### Verificacao de Elegibilidade (Portal)

| Condicao | Requerido |
|----------|-----------|
| Conta ACTIVE | Sim |
| Merchant tem `offerInsurance = true` | Sim |
| Estado do cliente na lista de estados permitidos | Sim |
| Nao esta ja inscrito | Sim |
| Nenhuma outra conta com mesmo email ja tem plano ativo | Sim |

### Fluxo de Inscricao (Opt-In)

1. **Tokenizacao do cartao:** Cria token de pagamento via USA ePay para que a Buddy possa cobrar diretamente
2. **Chamada ao Buddy:** POST para `https://partners.buddyinsurance.com/v3/policy` com dados do cliente e token de pagamento
3. **Resposta:** Recebe `policyId` e `customerId`
4. **Status:** COMPLETED com `enrollmentDate = hoje`

### Cross-Coverage (Cobertura Cruzada)

Se o cliente optou por NAO participar, o sistema verifica se ele ja tem cobertura via outro lead/conta com o mesmo email. Se sim, marca `alreadyCovered = true` e copia os dados da policia existente.

### Impacto nos Pagamentos e Financeiro

| Aspecto | Impacto |
|---------|---------|
| Recebiveis | Para contas UOWN atuais: Buddy coleta diretamente (sem receivable). Para Kornerstone migradas: receivable `PROTECTION_PLAN_FEE` criado |
| EPO | Taxas do plano sao **excluidas** do calculo de pagamentos para EPO |
| Saldo do contrato | Taxas do plano somadas como "Protection Plan AddOn To Date" |
| Funding | Fee incluido no calculo de custo de funding |

### Cancelamento

**Por parte da UOwn:** Quando lease e cancelado/expirado, sistema autentica com Buddy via OAuth e chama API de cancelamento. Cancela em cascata para todos os leads associados.

**Por parte da Buddy:** Buddy envia CSVs via SFTP para pasta `buddy/cancellations`. Sweep semanal (sexta 8h) processa os arquivos.

### Configuracoes Principais

| Config | Descricao |
|--------|-----------|
| `cancel.protection.plan` | Kill switch para cancelamento (default: true) |
| `offer.insurance.in.states` | Estados onde o plano e oferecido |
| `BuddyClient.base.url` | URL da API da Buddy |
| `BuddyClient.partner.id` | ID do parceiro (producao: `p-19g61kzm0yy7d`) |

---

## 24. Taxas e Impostos (TaxCloud / TaxJar)

### O Que e

O sistema de impostos calcula automaticamente a **taxa de imposto sobre vendas** (sales tax) para cada transacao baseado no endereco do cliente ou merchant.

### Para Que Serve

Compliance fiscal. Nos EUA, cada estado, condado e cidade pode ter taxas diferentes. A UOwn precisa calcular e recolher o imposto correto para cada jurisdicao.

### Como o Roteamento Funciona

O `TaxService` e a camada de roteamento:

1. **Verifica isencao:** Se merchant e `taxExempted` para o estado do cliente -> taxa = 0%
2. **Roteia para provedor:** Config `useTaxCloudApi` (default: true)
   - True -> TaxCloud
   - False -> TaxJar

### TaxCloud (Provedor Principal)

**O que faz:**
1. **Rate lookup:** Dado endereco completo, retorna taxa combinada (estado + condado + cidade + distrito)
2. **Compliance reporting:** Recebe dados de cada pagamento e reembolso diariamente para filing automatico

**Cache:** Resultados armazenados na tabela `TaxForZip`. Se existir resultado nao expirado para o mesmo endereco, nao faz chamada de API.

**Sweeps diarios:**
- `DailyTaxCloudPaymentsSync`: Envia todas as alocacoes de pagamento do dia para TaxCloud (10 threads)
- `DailyTaxCloudRefundsSync`: Envia todos os pagamentos revertidos do dia para TaxCloud (5 threads)

**Como o usuario interno usa:** Admin pode consultar taxa via `GET /getTaxForZip/{zipCode}`. Sweeps rodam automaticamente.

**Como afeta o cliente:** Imposto e calculado transparentemente em cada parcela do lease.

### TaxJar (Provedor Alternativo/Legado)

**O que faz:** Apenas rate lookup (sem compliance reporting).

**Diferenciais:**
- Suporta override por zip code (util para correcoes)
- Cache com expiracao configuravel (default 30 dias)
- Armazena mais detalhes (nome do condado, resposta completa)

**Quando usar:** Se TaxCloud tiver problemas, admin pode trocar via config flag sem deploy.

---

## 25. Five9 (Call Center e IVR)

### O Que e

Five9 e uma plataforma de **call center na nuvem** que opera o sistema IVR (Interactive Voice Response) da UOwn -- o sistema telefonica automatizado.

### Para Que Serve

Permite que clientes interajam com a UOwn por telefone e que agentes facam discagem de cobranca. A integracao sincroniza preferencias do cliente entre Five9 e o sistema da UOwn.

### Como o Cliente Interage

O cliente liga para o numero da UOwn. Durante o fluxo IVR, pode ser perguntado sobre preferencias de comunicacao (ex: "Deseja continuar recebendo mensagens de texto?"). A resposta e capturada e enviada automaticamente para o sistema da UOwn.

### Como Funciona Tecnicamente

Five9 envia um POST para `POST /uown/tms/updateContactPreferences` com:
- Numero de telefone
- Flag `doNotText`

O sistema busca todos os registros de telefone correspondentes, atualiza a flag, e cria log de atividade nas contas associadas.

### Impacto

Quando cliente opta por nao receber textos via IVR, `doNotText = true` e setado em seus registros de telefone, prevenindo futuras comunicacoes SMS.

---

## 43. RTR (Real Time Reporting / Migracao Kornerstone)

### O Que e

Integracao com sistema externo RTR para importacao de dados do legado Kornerstone/Katerba.

### Para Que Serve

Migra portfolios do sistema antigo (Kornerstone) para o novo sistema UOwn. Sincroniza contas, dados de clientes e transacoes.

### Como Funciona

**Servidor remoto:** `http://34.69.198.41:8080`

| Metodo | Funcao |
|--------|--------|
| `getAccountsThatChanged()` | Busca contas com dados alterados |
| `getImportPojoByRtrAccounData()` | Importa dados completos da conta |
| `getImportPojoByApplicationId()` | Busca por ID de aplicacao |
| `getAllCompanyInfo()` | Dados de referencia de empresas |
| `processRtoData()` | Processa dados RTO |
| `processKatabatData()` | Importa de arquivo Katabat |

### Como Disparar

- **Sweep automatico:** `kornerstoneDailyImportSweep` (10:00 PM diario)
- **Manual:** Via API interna do MigrationService

---

## 44. Proget (Bloqueio de Dispositivos)

### O Que e

Integracao com sistema **Proget** para bloqueio remoto de dispositivos (IoT/GPS tracking) associados a mercadorias em lease.

### Para Que Serve

Quando um cliente fica inadimplente, os dispositivos associados ao produto podem ser bloqueados remotamente como incentivo ao pagamento.

### Como Funciona

Sweep diario `progetDeviceLockingSweep` identifica contas inadimplentes e envia comandos de bloqueio ao Proget.

### Como Ativar

- Sweep roda automaticamente a meia-noite
- Requer integracao Proget configurada no merchant
- Para disparar manualmente: `POST /uown/svc/triggerScheduledTask/progetDeviceLockingSweep`

---

## 45. Skit.ai (Bot de Cobranca Automatizado)

### O Que e

Integracao com **Skit.ai**, plataforma de bot de voz para cobranca automatizada.

### Para Que Serve

O bot liga para clientes inadimplentes automaticamente, oferece acordos de pagamento e processa transacoes via TMS -- sem necessidade de agente humano.

### Como Funciona

1. **Sweeps geram arquivos** com dados de clientes inadimplentes:
   - `createSkitDelinquentFileSweep` - Lista de inadimplentes
   - `createSkitDelinquentOfferFileSweep` - Lista com ofertas de settlement
2. **Arquivos enviados via SFTP** para Skit.ai
3. **Bot liga para clientes** e negocia
4. **Se cliente aceita:** Bot usa TMS para processar pagamento
5. **Notas registradas** com tipo `SKIT_CALL_LOG` via `addLogNote`

### Como Ativar

- Sweeps rodam automaticamente a meia-noite
- Para gerar arquivo manualmente: `POST /uown/svc/triggerScheduledTask/createSkitDelinquentFileSweep`
- SQL do sweep define criterios de selecao (configuravel via banco)

---

## 46. PayPair (Portal de Merchant Externo)

### O Que e

PayPair e uma plataforma de **marketplace de financiamento** que permite merchants oferecerem multiplas opcoes de leasing/financiamento (incluindo UOWN) aos clientes atraves de um unico widget.

### Para Que Serve

Merchants como TireAgent usam o portal PayPair (`dw93bg.paypair.com`) para oferecer financiamento ao cliente final sem precisar integrar diretamente com cada provedor. O widget PayPair apresenta planos de bread, koalafi, paytomorrow e uown.

### Como Funciona

1. **Acesso ao portal:** Merchant acessa `dw93bg.paypair.com` (pagina publica, sem login)
2. **Selecao de merchant:** Dropdown com lista de merchants configurados
3. **Preenchimento de dados:** Textareas JSON com dados pessoais do cliente e carrinho de compras
4. **Configuracao:** Provider=`anybody`, prequalification=`false`, productSelectionType=`ShopByVehicle`
5. **Widget modal:** Botao "Get lease" abre iframe `#llapp-iframe` (src: `fesandbox2.paypair.com/widget`)

### Fluxo do Cliente no Widget

| Etapa | Acao | Detalhes |
|-------|------|---------|
| 1 | Verificacao de telefone | Telefone (prefixo 111/222 no sandbox) → OTP enviado via SMS |
| 2 | Captura de OTP | Interceptado via response da API `/api/v1/users/send_code` → campo `otp_code` |
| 3 | Dados da aplicacao | SSN, renda, data de nascimento |
| 4 | Pre-qualificacao | Sistema avalia elegibilidade → banner "Congratulations" se aprovado |
| 5 | Selecao de plano | 4 planos disponiveis: bread(0), koalafi(1), paytomorrow(2), uown(3) |
| 6 | Frequencia de pagamento | Weekly / Bi-Weekly / Twice a month |
| 7 | Pagamento | Iframe aninhado `#pt-iframe` dentro de `#llapp-iframe` para formulario CC/banco UOWN |
| 8 | E-sign | ContractPage.completeESign() via UOWN Origination |

### Arquitetura de Iframes

```
Pagina (dw93bg.paypair.com)
└── #llapp-iframe (PayPair widget sandbox)
    ├── Phone input / OTP / Dados / Planos
    └── #pt-iframe (formulario de pagamento UOWN)
        └── Campos CC/Banco
```

### Merchants Integrados via PayPair

| Merchant | Produto | Preco |
|----------|---------|-------|
| TireAgent | Michelin Primacy 4 Tire Set | $800 + $10 tax |

### Diferenciais em Relacao ao PayTomorrow

| Aspecto | PayTomorrow | PayPair |
|---------|-------------|---------|
| Login | Requer login no portal | Sem login (publico) |
| OTP | Email (IMAP) | Telefone (network intercept) |
| Iframe | Pagina direta | Duplo nesting (#llapp → #pt) |
| Provedores | Apenas PayTomorrow | 4 provedores (bread, koalafi, paytomorrow, uown) |
| Textareas | N/A | JSON via evaluate() |

---

## 47. Podium (Gestao de Avaliacoes de Clientes)

### O Que e

Podium e uma plataforma de **gestao de reputacao e avaliacoes online** (reviews). A integracao permite que agentes do portal Servicing enviem convites de avaliacao diretamente para clientes, sem sair da interface da UOwn.

### Para Que Serve

Facilitar a coleta de avaliacoes de clientes satisfeitos via Google, Yelp e outras plataformas gerenciadas pelo Podium. O agente nao precisa copiar emails nem usar o portal Podium separadamente.

### Como o Agente Usa

1. **Acesso ao modal Send Invite:** Na pagina de Customer Information do portal Servicing, o agente clica no icone de envelope (`#invitation`) na barra lateral esquerda
2. **Botao Send Podium Link:** Visivel dentro do modal apenas para usuarios com a permissao `send_podium_link` (permissao `customer_information.modify.send_podium_link`)
3. **Confirmacao:** O agente clica em "Send Podium Link" e confirma no modal de confirmacao ("Please Confirm" / "Continue")
4. **Feedback:** Toast verde "Podium invitation sent successfully." confirma o envio

### Como Funciona Tecnicamente

**Endpoint:** `POST /uown/svc/accounts/{accountPk}/podium-link`

**Backend:**
1. Valida que existe um cliente primario para a conta (`No primary customer found for this account.` se nao existir)
2. Obtem ou renova o token OAuth2 Podium via ciclo de vida gerenciado automaticamente
3. Envia o convite via API Podium para o email/telefone do cliente primario
4. Registra a chamada em `sv_outbound_api_log` (schema SVC separado)

**Autenticacao com Podium (OAuth2):**
- Token armazenado em `uown_podium_token` (`access_token`, `refresh_token`, `expiration_time`)
- O sistema renova automaticamente o token antes de cada chamada se necessario
- Flyway migration: `V20260317121000__create_podium_token_table.sql`

### Controle de Acesso

| Permissao | Papel |
|-----------|-------|
| `send_podium_link` | Necessaria para ver/usar o botao no modal Send Invite |
| Usuarios sem a permissao | Modal Send Invite pode estar acessivel, mas o botao "Send Podium Link" nao e renderizado |

### Estrutura de Banco de Dados

**Tabela `uown_podium_token`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `pk` | bigint | PK auto-incremento |
| `access_token` | text | Token OAuth2 ativo |
| `refresh_token` | text | Token de renovacao |
| `expiration_time` | timestamp | Data/hora de expiracao do access_token |
| `tenant_id` | bigint | FK para tenant |
| `row_created_timestamp` | timestamp | Audit: criacao |
| `row_updated_timestamp` | timestamp | Audit: ultima atualizacao |

**Tabela `sv_outbound_api_log`** (schema SVC separado):
Registra cada chamada de saida para o Podium com `url`, `call_type`, `request` e `response`. Nao e acessivel via conexao DB dos testes (schema boundary).

### Tratamento de Erros

| Situacao | Resposta da API |
|----------|----------------|
| `accountPk` inexistente | HTTP 400 -- `"No primary customer found for this account."` |
| Token expirado | Sistema renova automaticamente antes de chamar o Podium |
| Erro na API Podium | HTTP 5xx com mensagem de erro do Podium |

### Milestone

RU03.26.1.50.0 -- Task #442 (`uownSvcPodiumApiIntegration`)

---

## 48. RightFoot (Verificacao de Saldo Bancario ACH) — R1.53.0

### O Que e

RightFoot e um fornecedor externo de **verificacao de saldo bancario (bank balance check)** para pagamentos ACH, introduzido em R1.53.0 (svc#540). Base URL `https://api.rightfoot.com` (mesma em prod e sandbox).

### Para Que Serve

Confirmar que a conta bancaria do cliente tem **fundos suficientes antes de criar/retentar um debito ACH**, reduzindo retornos NSF. Um novo ACH so e semeado quando `exposure + requested_amount + buffer $100 <= balance` (buffer hardcoded em `DailyRerunACHCreate.sql:70`).

### Escopo (Quando Roda)

Aplica-se a contas **ACTIVE com auto-pay ACH em janela de inadimplencia**. Ambos os sweeps de balance-check selecionam `account_status='ACTIVE'`, `auto_pay_types LIKE '%ACH%'`, conta bancaria com `auto_pay=true`, dentro da janela de delinquencia. **Nao ha flag por merchant nem por client-type** — a selecao e puramente account-state/delinquency-driven (via SQL seedado).

### Fluxo (3 Etapas)

1. Um **sweep de balance-check** submete requests ao RightFoot (`rightFootBalanceCheckService.submit`).
2. RightFoot responde via **webhook** que completa o batch (`POST /uown/webhooks/rightfoot/batch-ready`).
3. O evento Spring `RightFootBatchCompleteEvent` (listener **AFTER_COMMIT**) dispara `DailyRerunAchCreationService.createDailyRerunACHs(batchIds)`, que cria as linhas `uown_sv_achpayment`.

### Sweeps

| Sweep | Cron seedado | process_type | Selecao (resumo) | Batch |
|-------|--------------|--------------|------------------|-------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` (15:00 diario) | `DAILY_RERUN_DELINQUENT` | janela `CURRENT_DATE-150 .. -15`, ultimo ACH SETTLED por conta, `LIMIT 5000` | 5000, pool 3 threads |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` (Qui 09:00) | `RERUN` | `SCHEDULED` ou `REQUEST` ligado a arranjo `SETTLEMENT`; `return_code IN (R01,R09)`; `status IN (RETURNED,REVERSED)`; `tries<2`; delinquency `<45d`; sem RERUN previo | 500 (config), single-thread |
| `DailyRerunAchCreationService` | **nao e Quartz** — disparado pelo evento de batch-complete + REST | — | SQL `DailyRerunACHCreate` | 1000, pool 4 threads, `username=SYSTEM` |

### Gating do ACH (`DailyRerunACHCreate.sql`)

Um ACH so e criado quando o balance check correspondente satisfaz: `status='SUCCESS'`, `response_timestamp IS NOT NULL`, **mesmo routing+account number** da conta bancaria, dentro da janela, e `exposure + requested_amount + 100 <= balance`. O novo `uown_sv_achpayment` carrega a FK `right_foot_balance_check_pk` de volta ao balance check aprovado. **Guard de duplicidade**: nenhum novo ACH `DAILY_RERUN_DELINQUENT` e criado se ja houver um in-flight (`PENDING/PICKED_TO_SEND/STATUS_UPDATE_PENDING/SENT`) para a conta.

### Webhook & Batch

- Endpoint inbound: `POST /uown/webhooks/rightfoot/batch-ready` (aceita JSON ou text/plain) -> `RightFootWebhookService.handleWebhook`.
- `uown_right_foot_batch` guarda `webhook_payload`, `errors`, `status`, `process_type`, `webhook_payload_received_at`, e `batch_complete_event_fired` (BOOLEAN default FALSE) — flag de idempotencia do evento de conclusao.
- Triggers admin (`RightFootController`, `/uown/rightfoot`): `POST /uown/rightfoot/batch-result` (reprocessa 1 batch), `POST /uown/rightfoot/ach-payments/daily-rerun` (cria ACH manualmente a partir de uma lista de batchIds).

### Status & Failure

Unico valor confirmado em codigo svc: `uown_right_foot_balance_check.status = 'SUCCESS'` (condicao do gate). Os demais valores de `status`/`failure_reason` e o parser do webhook vivem na lib `com.uownleasing:rightfoot:1.53.0`, que **nao esta disponivel em disco** (nao checked-out, nao no cache Gradle). **[HIPOTESE]** — nao assumir valores alem de `SUCCESS`.

### Configuracoes

Prefixo `com.uownleasing.svc.rightfoot.`, via `ConfigurationManagement`/Hazelcast — **nao** presentes em `application.yaml`:

| Chave | Default | Observacao |
|-------|---------|------------|
| `api.key` | prod vazio / sandbox literal | **[SEGURANCA]** fallback sandbox hardcoded em `RightFootConfig.java:26-28` |
| `base.url` | `https://api.rightfoot.com` | |
| `webhook.url` | host + `/uown/webhooks/rightfoot/batch-ready` | |
| `balance.threshold` | 100 | sem caller em svc — **[HIPOTESE]** consumido na lib; buffer real e literal no SQL |
| `balance.check.sweep.cron` | `0 0 8 ? * THU` | **[OBSERVACAO]** divergente do cron seedado (`0 0 15 * * ?`); getter sem caller em svc |
| `...RerunAchBalanceCheckSweep.batchSize` | 500 | |
| `...DailyRerunAchCreationService.interrupt` | false | kill-switch |

### Tabelas

- `uown_right_foot_balance_check` — `authorizer_unique_id` UNIQUE (`RFBC-{accountPk}-{snowflakeId}`), `account_pk`, `batch_id`, `routing_number`/`account_number`, `requested_amount` (= `next_payment_with_tax`, ou `amount` do ACH em arranjo SETTLEMENT), `balance`, `status`, `failure_reason`, `process_type`, `request/response_timestamp`.
- `uown_right_foot_batch` — `batch_id`, `status`, `webhook_payload`, `errors`, `process_type`, `batch_complete_event_fired`.
- `uown_right_foot_outbound_api_log` — log de chamadas de saida (endpoint, url, method, headers, request/response, http_status, stack_trace).
- `uown_sv_achpayment.right_foot_balance_check_pk` — FK do ACH para o balance check.
- Cleanup: `CleanupService.deleteOldEntries(deletionCutOff)` purga linhas antigas das duas primeiras tabelas.

### Observacoes para o Time (R1.53.0)

- **[OBSERVACAO]** Divergencia de cron entre config default e task seedada (acima).
- **[OBSERVACAO]** Artefato de sintaxe em `DailyAchBalanceCheckSweep.java:241` — `TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,\n,\n` contem virgula solta (`,\n,\n`) que quebraria a query se executada verbatim. Confirmar com o time.
- **[SEGURANCA]** API key literal hardcoded como fallback sandbox (`RightFootConfig.java:26-28`).

### Fontes (svc R1.53.0)

`config/rightfoot/RightFootConfig.java` · `service/sweeps/rightfoot/{DailyAchBalanceCheckSweep,RerunAchBalanceCheckSweep,RightFootBalanceCheckMapper}.java` · `service/ach/DailyRerunAchCreationService.java` · `service/ach/listener/RightFootCompleteListener.java` · `rest/svc/{RightFootController,RightFootWebhookController}.java` · `service/BootstrapService.java` (~2275) · `resources/sqls/DailyRerunACHCreate.sql` · migrations `V20260612102430` / `V20260616122043` / `V20260619131000`. Lib `com.uownleasing:rightfoot:1.53.0` (internals nao disponiveis em disco).

### Milestone

R1.53.0 — svc#540 (Implement rightfoot foundation), svc#540 (RerunAchBalanceCheckSweep), duplicate payment checks

---

