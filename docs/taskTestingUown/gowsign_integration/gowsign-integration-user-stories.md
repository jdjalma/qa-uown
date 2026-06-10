# User Stories — GowSign Integration

## UOwn Leasing — Substituicao do Signwell pelo GowSign

> **Tarefa GitLab:** UOWN | Origination | Implement GowSign Integration
> **Documentacao API:** https://documenter.getpostman.com/view/28884504/2sBXcEizW5
> **Documentacao Embed:** https://gow-sign-test-embed.vercel.app/en/docs
> **Coleção bruta:** [`docs/external/gowsign-api.postman_collection.json`](../../external/gowsign-api.postman_collection.json)
> **Doc renderizada:** [`docs/external/gowsign-api.md`](../../external/gowsign-api.md)
> **Ultima atualizacao:** 2026-04-27

---

## Objetivo de Negocio

Substituir o **Signwell** (provedor atual de e-sign) pelo **GowSign** como ferramenta padrao de assinatura digital de contratos. Ganhos esperados: maior velocidade e precisao no fluxo de contrato, melhor experiencia do cliente, e flexibilidade dos 3 fluxos de criacao (DOCX / HTML inline / Strapi templates).

A integracao deve **coexistir** com Signwell durante a transicao (rollback possivel) e nao quebrar contratos ja em andamento.

---

## Personas

| Persona | Sigla | Descricao |
|---------|-------|-----------|
| Cliente | **C** | Consumidor final que assina o contrato (signatario unico, signer 1) |
| Merchant | **M** | Loja parceira que dispara a aplicacao e o link do contrato |
| Operador UOwn | **O** | Time de Originacao/Servicing que monitora documentos no portal |
| Backend UOwn | **B** | Microservicos do UOwn (svc, origination) que chamam a API GowSign |
| Sistema GowSign | **G** | API e plataforma de assinatura terceira |
| Webhook Receiver | **W** | Endpoint do UOwn que recebe callbacks de eventos |

---

## Mapa de Epicos

| # | Epico | US Range | Cobertura |
|---|-------|----------|-----------|
| 1 | **Validacao de Provider e Coexistencia** | CUT-01..02 | `esign_client` populado corretamente em uown_esign_document, coexistencia multi-provedor sem cross-talk (sem testar a regra de roteamento — feita pelo backend) |
| 2 | **Criacao de Contrato** (3 fluxos da API) | CRE-01..09 | DOCX, HTML inline, Strapi template, variaveis, parametros opcionais, plano de protecao pre-selecionado pelo merchant |
| 3 | **Campos de Assinatura** (tipos e propriedades) | FLD-01..09 | signature, initial, check, group, inline tags HTML |
| 4 | **Experiencia de Assinatura via Iframe** | EMB-01..10 | postMessage events, embedMode, multi-provedor, fluxo sem Buddy widget (PP pre-selecionado), botao Start gate |
| 5 | **Ciclo de Vida do Documento** (status) | LCY-01..09 | Todos os 6 status, todos os 6 pdfStatus, mapeamento UOwn |
| 6 | **Pos-Assinatura** | POST-01..09 | Lead → SIGNED, Funding, Confetes, BW13/Buddy, contratos antigos, ativacao direta de PP pre-selecionado |
| 7 | **Comunicacao** (email, reminder, expiracao, sandbox) | COM-01..07 | sendSignatureEmail, mustReminder, expirationDate, isSandbox |
| 8 | **Callbacks/Webhooks** | CB-01..04 | callback custom, enriquecimento Strapi, idempotencia |
| 9 | **Visualizacao** (Listagem no portal) | LST-01..04 | paginacao, filtros, busca, ordenacao |
| 10 | **Tratamento de Erros** | ERR-01..12 | 400/401/404/500, indisponibilidade, timeout |
| 11 | **Seguranca** | SEC-01..05 | API key, IP allowlist, base64, PII, sandbox isolation |
| 12 | **Conteudo e Acesso ao Documento** (validacao do contrato + download) | DOC-01..14 | Property Price Tag, LESSOR/LESSEE, item, fees breakdown, EPO chart, ACH grid, datas, template por estado, download button, audit trail |
| 13 | **Status do Lease em Cada Acao da Assinatura** | LSE-01..16 | Cross-check lease status x evento de assinatura, idempotencia, race, reversal protection, FUNDING auto-move |
| 14 | **Operacoes Merchant + Operador no Portal** | OPS-01..12 | Merchant dispara/visualiza/cancela, operador reenvia/corrige/filtra/exporta, CS busca por SSN/phone |
| 15 | **Recovery e Resiliencia do Cliente** | RES-01..07 | Perda conexao, browser fechado, link expirado, re-acesso, multi-device, browser matrix |
| 16 | **Acessibilidade e Multi-Dispositivo** | ACC-01..06 | WCAG, mobile, print, teclado, i18n Spanish, deficiencia motora |
| 17 | **Compliance e Retencao** | LEG-01..05 | Retention policy, GDPR/CCPA, UETA/ESIGN, audit export, compliance ad hoc |
| 18 | **Monitoramento e SRE** | OBS-01..03 | Health check, SLIs/SLOs, alertas |
| 19 | **Edge Cases de Robustez** | EDGE-01..03, EDGE-05..06 | Caracteres especiais, telefones internacionais, PDF corrompido, webhook malformado |
| 20 | **Modify Lease e Pos-Funded** | MOD-01..04 | Modify lease, default, collections, amendment |

---

# Padrao Comum: Validacao de Log no Lease

> **Regra global:** TODA US que toca o lease/contrato exige validacao explicita do log do lease. Status transition silenciosa **nao** e aceita — todo evento da assinatura precisa deixar rastro auditavel para suporte, compliance e diagnostico de incidentes.

## Modelo real do log no UOwn

**Importante:** o UOwn **nao tem tabela dedicada de status_history**. Status atual do lead fica em `uown_los_lead.status`; transicoes sao logadas como **texto livre** em `uown_los_lead_notes`.

## Tabelas reais de log

| Tabela | Estrutura | Funcao | Como validar em testes |
|--------|-----------|--------|------------------------|
| `uown_los_lead_notes` (8 cols) | `pk`, `lead_pk`, `notes` (text), `agent`, `row_created_timestamp` | **Timeline de eventos do lead em texto livre.** Auto-gerada pelo backend durante o pipeline (`[Service][Method] mensagem`). E AQUI que ficam transicoes de status + criacao/envio de contrato + eventos de e-sign | `SELECT notes FROM uown_los_lead_notes WHERE lead_pk=? AND notes LIKE '%pattern%' ORDER BY row_created_timestamp DESC` |
| `uown_los_activity_log` (18 cols) | `pk`, `lead_pk`, `account_pk`, `notes`, `log_type`, `priority`, `is_hidden`, `created_by`, `creation_source`, ... | Log estruturado complementar (com `log_type` categorizado). Use para eventos manuais ou categorizados de origination | `SELECT * WHERE lead_pk=? AND log_type=?` |
| `uown_sv_activity_log` (18 cols) | mesma estrutura de `uown_los_activity_log` | Log estruturado da fase de servicing (apos lease virar account em FUNDING) | `SELECT * WHERE account_pk=?` |
| `uown_esign_event_trigger_log` (17 cols) | `pk`, `esign_doc_pk`, `lead_pk`, `event_name` (text), `device_info`, `embedded_url`, `location_name`, `row_created_timestamp` | Eventos do iframe e-sign (loaded, completed, closed, error) | `SELECT * WHERE esign_doc_pk=? AND event_name=?` |
| `uown_esign_document` (51 cols) | `pk`, `document_key`, `esign_client`, `esign_mode`, `status`, `doc_signed_time_stamp`, `base64signed_document_string IS NOT NULL (flag — sem hash, so blob)`, etc. | Estado do documento e-sign (cross-provider: SIGNWELL/PANDADOC/GOWSIGN) | atualizada in-place |
| `uown_los_contract` | colunas inclui `status`, `doc_signed_time_stamp`, `cancelled_date`, `esign_document_pk` | Estado do contrato UOwn | atualizada in-place |
| `uown_los_lead.status` | varchar | Status atual do lead (NEW, PENDING_UW, UW_APPROVED, CC_AUTH_PASSED, CONTRACT_CREATED, SIGNED, FUNDING, FUNDED, SETTLED, etc.) | atualizada in-place |

## Padroes de substring em `uown_los_lead_notes` (extraidos do DB real)

| Acao | Padrao tipico em `notes` |
|------|--------------------------|
| Lead criado | `[ApplicationRequest][toLeadInfo]` |
| Lead change to PENDING_UW | `[LeadService][saveApplicationData] Change lead status from NEW to PENDING_UW` |
| UW result | `[UnderwritingService][runUnderwriting] UW is run. Lead Status UW_APPROVED` (ou DENIED) |
| Contrato criado | `[UownClient][createContractAndSend] Created contract. esignResultCode : 0 result : SUCCESS` |
| Contrato enviado | `[UownClient][createOrUpdateInvoiceInformation] Sent Contract to customer. Contract EsignDocPk : {N} LeaseType : {LEASE\|LEASE_MOD} and EsignMode : {DOCX\|HTML\|EMAIL}` |
| Lead → SIGNED | `[EsignService][updateLeadStatus] LeadStatus SIGNED` |
| Lead → FUNDING (auto) | `[updateFundingStatus] OldLeadStatus : SIGNED New LeadStatus : FUNDING` |
| Servicing transition | `[EsignService][updateLeadStatus] Moved to servicing for {}, refCode : {}` |

## Invariantes de Log (devem valer em **toda** US do dominio)

- [ ] **Auto-geracao:** transicoes do pipeline (`saveApplicationData`, `runUnderwriting`, `createContractAndSend`, `updateLeadStatus`, `updateFundingStatus`) inserem nota em `uown_los_lead_notes` automaticamente
- [ ] **Encadeamento textual:** sequencia de notas do mesmo `lead_pk` ordenada por `row_created_timestamp` reconstroi a jornada do lease (de `NEW` ate `FUNDED`)
- [ ] **Service+Method tag:** cada nota tem prefixo `[ServiceName][methodName]` que identifica origem do log
- [ ] **Idempotencia (esign):** mesmo evento postMessage + webhook recebido 2x produz **2 linhas em `uown_esign_event_trigger_log`** (auditoria) mas **0 transicoes adicionais** em `uown_los_lead.status` — `LeadStatus SIGNED` aparece exatamente 1x em `uown_los_lead_notes`
- [ ] **Sem regressao:** lead em status terminal (`SIGNED`, `FUNDING`, `FUNDED`, `SETTLED`, `CANCELLED`) nao regride — `uown_los_lead.status` nao muda; nota WARN gerada se evento posterior tentar regredir
- [ ] **Timestamp monotonico:** `row_created_timestamp` em `uown_los_lead_notes` nunca anterior a `uown_los_lead.row_created_timestamp`
- [ ] **FK populada:** `uown_esign_event_trigger_log.esign_doc_pk` referencia `uown_esign_document.pk` correto; `esign_doc_pk` aparece tambem em substring de `uown_los_lead_notes`
- [ ] **Sem PII na nota:** notas auto-geradas referenciam IDs/status/valores agregados — nao SSN, nao CC completo, nao senhas
- [ ] **Auditavel sem JOIN remoto:** jornada completa reconstrutivel via `SELECT * FROM uown_los_lead_notes WHERE lead_pk=? ORDER BY row_created_timestamp` sem chamar API externa

## Como cada US referencia este padrao

Toda US que toca lease/contrato inclui um bullet **`Log no Lease`** declarando:

1. **`uown_los_lead.status`** — status atual esperado apos a acao (atualizada in-place)
2. **`uown_los_lead_notes`** — substring(s) que devem aparecer em pelo menos 1 nota apos a acao (use `notes LIKE '%substring%'`)
3. **`uown_esign_event_trigger_log`** — `event_name` esperado (1+ linhas, vinculadas via `esign_doc_pk`)
4. **`uown_esign_document`** / **`uown_los_contract`** — atualizacoes in-place esperadas (`status`, `doc_signed_time_stamp`, etc.)

Ausencia desse bullet em US que afeta status do lease == US incompleta.

---

# Padrao Comum: Validacao Payload + Response + DB

> **Regra global:** TODA US executavel via teste automatizado declara explicitamente as 3 dimensoes de validacao. Sem esse bloco, agentes de implementacao (`subagent-impl-api`, `subagent-impl-e2e`) precisam improvisar — quebrando reprodutibilidade.

## Bloco padrao

Toda US ganha um bloco `### Validacao API + DB` com 3 sub-secoes:

```markdown
### Validacao API + DB

**Request Payload**
- Method + path (ex: `POST /api/document`)
- Headers obrigatorios (`x-api-key`, `Content-Type`, `Authorization`)
- Body (campos chave + tipos + obrigatoriedade)
- Query params (quando aplicavel)

**Response**
- Status code esperado (200, 400, 401, 404, 500)
- Envelope: `{ data, meta, error, valid, responseData }` (todos presentes no root)
- `valid: true|false` esperado
- Campos chave em `data` (ou em `error`) com formato/regex
- Headers de resposta relevantes (Content-Type, Location)

**DB State After**
- Tabelas afetadas com colunas e valores esperados
- Linhas inseridas/atualizadas/deletadas (cardinalidade)
- FK consistencia (ex: `uown_los_contract.esign_document_pk` referencia `uown_esign_document.pk`)
- Invariantes preservadas (ex: lease nao regride)
- Validacao via SQL: queries esperadas (`SELECT ... WHERE ... → expected count/value`)
```

## Quando usar `N/A`

US sem operacao API/DB direta declaram `N/A` com justificativa:

- **Config/infra** (ex: SEC-04 IP allowlist): `N/A — config de infra, validada via deploy/health-check`
- **Mapeamento conceitual** (ex: LCY-08 mapeamento de status): `N/A — regra de tradução, validada implicitamente em outras US`
- **UI puro sem efeito DB** (ex: parte de POST-04 Confetes): listar apenas validacoes de UI observaveis

## Relacao com "Log no Lease"

- `Log no Lease` cobre o **subconjunto** de DB que afeta lease/contrato (`uown_lead_*`, `uown_esign_*`, `uown_los_contract`)
- `Validacao API + DB` cobre **todas** as tabelas afetadas, incluindo `uown_los_credit_card_transaction`, `uown_los_protection_plan`, `uown_merchant_api_error_log`, etc.
- US com ambos: `Log no Lease` referencia US-LSE-*, `Validacao API + DB` complementa com tabelas auxiliares

## Tolerancias e idempotencia

- Valores monetarios: tolerancia `±$0.01` por arredondamento HALF_EVEN
- Timestamps: tolerancia `±5s` em `change_date`/`received_at`
- UUIDs/hashes: validar formato (regex), nao valor exato
- Idempotencia: SQL count == 1 em retries (vide US-LSE-12)

---

# EPICO 1: VALIDACAO DE PROVIDER E COEXISTENCIA

> **Escopo:** o **roteamento** GowSign vs Signwell e feito pelo codigo backend (sem flag em DB visivel). Os testes deste epico **nao validam a regra de roteamento**, apenas o **resultado observavel** apos uma criacao de contrato — `uown_esign_document.esign_client` deve refletir o provedor correto, e a coexistencia multi-provedor nao deve causar cross-talk.

## US-CUT-01: `esign_client` Populado Corretamente em `uown_esign_document`

**Persona:** B (Backend)
**Trigger:** Apos backend criar um contrato com sucesso

### Historia
Como **time de QA**, quero **validar que `uown_esign_document.esign_client` e populado com o provedor que efetivamente processou o documento** para que **auditoria, reconciliation e metricas saibam por qual sistema cada contrato passou — independente da regra de roteamento (que e lógica do backend)**.

### Criterios de Aceite
- [ ] Apos criacao de contrato bem-sucedida, `uown_esign_document.esign_client` em `{'GOWSIGN', 'SIGNWELL', 'PANDADOC'}` (varchar, nunca null para contratos criados)
- [ ] `uown_esign_document.esign_mode` reflete o fluxo real usado (`'DOCX'`, `'HTML'`, `'STRAPI'`, ou `'EMAIL'` — formato armazenado pelo backend)
- [ ] `uown_esign_document.document_key` populado com o `data.id` UUID retornado pelo provedor
- [ ] `uown_los_contract.esign_document_pk` referencia FK para `uown_esign_document.pk`
- [ ] Quando provedor e GowSign, `document_key` e UUID v4 valido (regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

### Log no Lease
- [ ] **`uown_los_lead_notes`** — substring `'Sent Contract to customer. Contract EsignDocPk : {N}'` aparece em pelo menos 1 nota apos criacao (auto-gerada pelo backend)
- [ ] Substring `'EsignMode : {DOCX|HTML|EMAIL}'` na mesma nota indica modo persistido
- [ ] **`uown_esign_event_trigger_log`** — eventos posteriores referenciam `esign_doc_pk` correto

### Validacao API + DB

**Request Payload** — N/A (esta US valida estado pos-criacao; payload de entrada coberto em CRE-01..03)

**Response** — `data.id` retornado pelo POST do provedor; backend persiste como `document_key`

**DB State After**
```sql
-- Validacao 1: esign_client populado e em enum valido
SELECT esign_client, esign_mode, document_key
FROM uown_esign_document
WHERE pk = (SELECT esign_document_pk FROM uown_los_contract WHERE lead_pk = :leadPk);
-- Espera: esign_client IN ('GOWSIGN', 'SIGNWELL', 'PANDADOC')
--         esign_mode IN ('DOCX', 'HTML', 'STRAPI', 'EMAIL')
--         document_key matches UUID regex

-- Validacao 2: FK consistente
SELECT c.pk, c.esign_document_pk, d.pk AS doc_pk, d.esign_client
FROM uown_los_contract c
JOIN uown_esign_document d ON c.esign_document_pk = d.pk
WHERE c.lead_pk = :leadPk;
-- Espera: c.esign_document_pk = d.pk (FK consistente)
```

### Cobertura Origem
- Resultado observavel da regra de roteamento (cuja logica fica no backend)
- Schema real: `uown_esign_document.esign_client` (varchar 255), `esign_mode` (varchar 255)

---

## US-CUT-02: Coexistencia Multi-Provedor (Sem Cross-Talk)

**Persona:** B (Backend) / C (Cliente)

### Historia
Como **time de QA**, quero **garantir que durante a migracao GowSign + Signwell + PandaDoc convivem sem cross-talk** para que **eventos/webhooks/iframes de um provedor nao afetem documentos do outro provedor**.

### Criterios de Aceite

**Iframe auto-detect:**
- [ ] Auto-detecao de provedor por iframe polling (3s × 12) reconhece **3 provedores**: GowSign, Signwell, PandaDoc
- [ ] Cliente acessa o iframe correto baseado em `data.url` retornada na criacao — nao precisa selecionar provedor

**Webhook isolation:**
- [ ] Webhook handler de GowSign (`/webhook/gowsign`) NAO processa eventos de outros provedores
- [ ] Webhook de Signwell para documento Signwell nao afeta documento GowSign criado em paralelo
- [ ] Cada handler atualiza apenas o `uown_esign_document` cujo `esign_client` corresponde

**Auditoria por provedor:**
- [ ] `SELECT esign_client, COUNT(*) FROM uown_esign_document GROUP BY esign_client` retorna distribuicao real por provedor
- [ ] Documentos antigos preservam `esign_client` original (sem migracao em massa)
- [ ] Reconciliation sweep usa `esign_client` para agrupar por provedor antes de chamar API correspondente

### Log no Lease
- [ ] **`uown_esign_event_trigger_log`** — cada evento vinculado via `esign_doc_pk` ao documento correto (nao cross-talk)
- [ ] Auditoria: `SELECT * FROM uown_esign_event_trigger_log WHERE esign_doc_pk IN (SELECT pk FROM uown_esign_document WHERE esign_client = :provider)` retorna apenas eventos do provedor

### Validacao API + DB

**Request Payload** — N/A (cobertura cruzada por US-CRE-* e US-EMB-*)

**Response** — N/A

**DB State After**
```sql
-- Validacao 1: ambos provedores podem coexistir
SELECT DISTINCT esign_client FROM uown_esign_document WHERE row_created_timestamp > NOW() - INTERVAL '7 days';
-- Espera: pode retornar 1 ou mais provedores em janela de migracao

-- Validacao 2: sem cross-talk em events
SELECT etl.esign_doc_pk, ed.esign_client, COUNT(*)
FROM uown_esign_event_trigger_log etl
JOIN uown_esign_document ed ON etl.esign_doc_pk = ed.pk
WHERE etl.lead_pk = :leadPk
GROUP BY etl.esign_doc_pk, ed.esign_client;
-- Espera: cada doc tem eventos apenas do seu provedor
```

### Cobertura Origem
- Business rules ch.03 § Auto-detection iframe polling
- Tarefa GitLab: "Replace Signwell" — substituicao gradual exige coexistencia

---

# EPICO 2: CRIACAO DE CONTRATO

## US-CRE-01: Criar Contrato via Fluxo DOCX

**Persona:** B (Backend) → G (GowSign)
**Trigger:** Lead atinge `CONTRACT_CREATED`, merchant configurado para fluxo DOCX

### Historia
Como **backend UOwn**, quero **enviar o contrato como DOCX em base64 com campos posicionados via `fields[]`** para que **o GowSign converta para PDF e disponibilize para assinatura**.

### Criterios de Aceite
- [ ] POST `/api/document` com `document.documentBase64` (string base64 valida)
- [ ] `requester` contem `name` (obrig.), `email` (obrig.), `phoneNumber` (opc.)
- [ ] Resposta 200 com `data.id` (UUID), `data.url`, `data.status = "CREATED"`, `data.Requester.id`
- [ ] DB: registro em `uown_esign_document` com `client = 'GOWSIGN'`, `esign_mode = 'DOCX'`, `document_key = data.id`
- [ ] FK `esign_document_pk` em `uown_los_contract` populada
- [ ] PDF gerado em background — `pdfStatus` transiciona `CREATED_PENDING` → `CREATED_GENERATED`
- [ ] Quando PDF pronto, `status` transiciona `CREATED` → `OUTSTANDING`

### Log no Lease
Vide **US-LSE-02** (transicao `CC_AUTH_PASSED` → `CONTRACT_CREATED` apos POST). Para fluxo DOCX, nota inclui `mode='DOCX'`.

### Cobertura Origem
- Doc GowSign § Create Document (DOCX Flow)
- Schema: `uown_esign_document`

---

## US-CRE-02: Criar Contrato via Fluxo HTML Customizado

**Persona:** B (Backend)
**Trigger:** Merchant com `esign_mode = 'HTML'`

### Historia
Como **backend UOwn**, quero **enviar o template HTML completo do contrato com placeholders `{{var}}` e tags inline `[sig|req|signer1]`** para que **o GowSign renderize em PDF e posicione campos de assinatura inline sem precisar de DOCX pre-gerado**.

### Criterios de Aceite
- [ ] POST `/api/document` com `document.customTemplate` (HTML string, obrig.) e `document.customTitle` (string, obrig.)
- [ ] **NAO** envia `document.documentBase64` nem `document.fields[]` (regra do fluxo)
- [ ] Variaveis `{{customerName}}`, `{{contractNumber}}`, `{{amount}}`, etc. sao substituidas no servidor antes do render
- [ ] Tags inline `[sig|req|signer1]`, `[initials|req|signer1]`, `[date|req|signer1]` sao reconhecidas no PDF resultante
- [ ] Variaveis case-sensitive: `{{customerName}}` substitui, `{{customername}}` nao
- [ ] Variavel sem chave correspondente em `variables` substitui por string vazia (sem erro)
- [ ] Loops/condicionais nao suportados — backend pre-expande listas/tabelas no HTML antes de enviar
- [ ] DB: `esign_mode = 'HTML'`, `has_custom_template = true`

### Log no Lease
Vide **US-LSE-02**. Para fluxo HTML, nota inclui `mode='HTML'` e `customTitle={titulo}`.

### Cobertura Origem
- Doc GowSign § Create Document (Custom HTML Flow), § Variable Substitution

---

## US-CRE-03: Criar Contrato via Fluxo Strapi Template

**Persona:** B (Backend)
**Trigger:** Merchant com `esign_mode = 'STRAPI'`

### Historia
Como **backend UOwn**, quero **referenciar um template gerenciado no Strapi pelo `templateId` e ambiente** para que **conteudo, titulo e configuracoes do remetente sejam gerenciados pelo time de operacoes sem deploy de codigo**.

### Criterios de Aceite
- [ ] POST `/api/document` com `document.templateId` (string, obrig.) e `document.callback.environment` (string, obrig.)
- [ ] **NAO** envia `documentBase64`, `fields[]`, `customTemplate` nem `customTitle`
- [ ] `callback.environment` corresponde a um ambiente configurado no template Strapi (ex: `production`, `homologation`, `sandbox`, `stg`)
- [ ] Substituicao de variaveis funciona igual ao fluxo HTML
- [ ] Resposta inclui `strapiTemplateTitle` com titulo do template
- [ ] DB: `esign_mode = 'STRAPI'`, `has_custom_template = false`, `strapi_template_id = templateId`

### Log no Lease
Vide **US-LSE-02**. Para fluxo Strapi, nota inclui `mode='STRAPI'`, `templateId={id}`, `environment={env}`. Callback enriquecido (`event_hash`, `event_time`) persistido em `uown_esign_document.callback`.

### Cobertura Origem
- Doc GowSign § Create Document (Strapi Template Flow), § How It Works

---

## US-CRE-04: Variaveis Dinamicas Preenchidas no Contrato

**Persona:** C (Cliente) le contrato com seus dados
**Trigger:** Cliente abre URL do contrato

### Historia
Como **cliente**, quero **ver meu nome, valores, datas, e info do produto preenchidos no contrato** para que **eu confirme que estou assinando o contrato correto e nao um template generico**.

### Criterios de Aceite
- [ ] Variaveis tipicas do contrato lease substituidas: `customerFirstName`, `customerLastName`, `customerStreetAddress`, `customerCity`, `customerState`, `customerZip`, `customerAccountNumber`, `lessorName`, `retailerName`, `cashPrice`, `leaseCost`, `totalOfPayments`, `initialPayment`, `recurringPayment`, `recurringFrequency`, `numberOfPayments`, `termInMonths`, `productCondition`, `date`
- [ ] Tipos suportados: string, number, boolean — todos renderizam corretamente
- [ ] Valores monetarios formatados com 2 casas decimais (ex: `$2,500.00`)
- [ ] Datas formatadas conforme locale do contrato (ex: `MM/DD/YYYY`)
- [ ] Variaveis sensiveis (SSN completo, CC, conta bancaria) **NAO** sao expostas no template

### Cobertura Origem
- Doc GowSign § Variable Substitution
- Postman example body (Strapi flow tem 30+ variaveis lease)
- Project security.md

---

## US-CRE-05: Tabela Dinamica em Contrato

**Persona:** C (Cliente) / B (Backend)

### Historia
Como **backend**, quero **incluir tabela de cronograma de pagamentos no contrato HTML/Strapi via tag `[table|paymentSchedule]`** para que **o cliente veja todas as parcelas com data e valor sem o backend precisar gerar HTML de tabela manualmente**.

### Criterios de Aceite
- [ ] Tag `[table|tableVarName]` no HTML referencia chave em `variables`
- [ ] Estrutura `{ headers: [], rows: [[]] }` renderiza tabela com headers + linhas
- [ ] Rows aceitam string, number, boolean nas celulas
- [ ] Tabela sem rows renderiza apenas headers (sem erro)
- [ ] Tabela com nome inexistente em variables NAO quebra o documento (string vazia)

### Cobertura Origem
- Doc GowSign § Inline Signature Fields > Table

---

## US-CRE-06: Parametros Opcionais Aplicados Corretamente

**Persona:** B (Backend)

### Historia
Como **backend**, quero **enviar parametros opcionais** (`mustReminder`, `reminderDaysAmount`, `expirationDate`, `isSandbox`, `redirect`, `callback`, `sendSignatureEmail`) para que **o comportamento do contrato (lembretes, expiracao, redirect, sandbox) reflita a regra de negocio do merchant/contexto**.

### Criterios de Aceite
- [ ] `mustReminder=true` + `reminderDaysAmount=N` → reminder enviado apos N dias
- [ ] `mustReminder` ausente → default `false` (sem reminder)
- [ ] `reminderDaysAmount` ausente com `mustReminder=true` → default 3 dias
- [ ] `expirationDate` ISO 8601 → documento bloqueia assinatura apos a data
- [ ] `expirationDate` ausente → documento nao expira
- [ ] `isSandbox=true` → documento marcado como teste, sem validade juridica
- [ ] `redirect` URL → cliente redirecionado apos assinar
- [ ] `redirect` ausente → sem redirect
- [ ] `callback` object → retornado integralmente em webhooks
- [ ] `sendSignatureEmail=false` → email de assinatura NAO enviado (uso embed)
- [ ] `sendSignatureEmail` ausente → default `true` (email enviado)

### Cobertura Origem
- Doc GowSign § Optional Parameters

---

## US-CRE-07: Cancelamento de Contratos Anteriores ao Criar Novo

**Persona:** B (Backend) / O (Operador)
**Trigger:** Cliente solicita reenvio de contrato (mudanca de plano, retorno de revisao, etc.)

### Historia
Como **backend**, quero **cancelar contratos anteriores em status `SENT` ao criar um novo contrato para o mesmo lead** para que **o cliente nao tenha duvida sobre qual link assinar e assinaturas duplicadas nao ocorram**.

### Criterios de Aceite
- [ ] Ao criar novo contrato GowSign para um lead, contratos anteriores com status `SENT` (UOwn) sao marcados como `CANCELLED`
- [ ] Contratos antigos do Signwell tambem sao cancelados (cross-provider)
- [ ] Contratos ja `SIGNED` ou `EXPIRED` nao sao alterados
- [ ] Webhook subsequente do contrato cancelado e ignorado (idempotencia)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease permanece `CONTRACT_CREATED`)
- [ ] **`uown_los_lead_notes`**: 1 nota por contrato cancelado: `"Previous contract cancelled in cascade due to new contract creation — old documentId={uuid}, new documentId={uuid}, provider={SIGNWELL|PANDADOC|GOWSIGN}"`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha por contrato cancelado `esign_event='CANCELLED_BY_NEW_CONTRACT', source='CASCADE'`
- [ ] **`uown_esign_document.status='CANCELED'`** + `cancelled_date=NOW()` para cada antigo
- [ ] **`uown_los_contract.status='CANCELLED'`** para cada antigo
- [ ] Webhook posterior do contrato cancelado: vide US-LSE-14 (ignorado, sem regressao)

### Cobertura Origem
- Business rules ch.03 § Fluxo de Contrato passo 7

---

## US-CRE-08: Contrato Disponivel via URL Apos Criacao

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **acessar o contrato pela URL retornada na criacao** para que **eu possa abrir o contrato no celular ou desktop e assinar**.

### Criterios de Aceite
- [ ] `data.url` retornada apos POST e acessivel publicamente (autenticacao por token na URL)
- [ ] URL formato: `https://{subdomain}.gowsign.com/document/{uuid}`
- [ ] Acesso a URL durante `pdfStatus = CREATED_PENDING` mostra "preparando documento" ou aguarda
- [ ] Acesso apos `pdfStatus = CREATED_GENERATED` mostra PDF pronto para assinar
- [ ] URL valida ate `expirationDate` ou ate `status` mudar para EXPIRED/CANCELED

---

## US-CRE-09: Contrato Inclui Plano de Protecao Pre-Selecionado pelo Merchant

**Persona:** M (Merchant) / B (Backend)
**Trigger:** Merchant marca opt-in de plano de protecao no formulario de aplicacao **antes** de gerar contrato
**Aplicavel a:** Merchants com programa de protecao habilitado (BW13 — TireAgent — e similares)

### Historia
Como **merchant**, quero **selecionar o plano de protecao em nome do cliente no momento de submeter a aplicacao** para que **o cliente assine o contrato ja com o valor da protecao incluido, sem precisar interagir com o widget Buddy durante a assinatura**.

### Criterios de Aceite

**Origem do opt-in (pre-contrato)**:
- [ ] Formulario de aplicacao do merchant tem opcao "Add Protection Plan" (UI no portal merchant ou API)
- [ ] Merchant pode selecionar opt-in **com consentimento prévio do cliente** (compliance: NAO pode forcar PP sem consentimento)
- [ ] Backend valida que o merchant tem permissao para pre-selecionar PP em nome do cliente (config por merchant + jurisdicao)
- [ ] Estados que proibem pre-selecao por merchant: PP nao pode vir pre-selecionado (cliente decide via Buddy)

**Calculo financeiro**:
- [ ] `protectionPlanFee` somada ao `paymentDetailsList[idx]`:
  - `regularPayment` aumenta proporcionalmente
  - `totalOfPayments` reflete soma com PP
  - `costOfRental` recalculado
- [ ] EPO chart recalculado com base no novo `cashPrice + protectionPlanCost`
- [ ] Initial Payment inclui parcela do PP se aplicavel

**Conteudo do contrato (variaveis GowSign)**:
- [ ] Variaveis no template Strapi/HTML refletem PP incluido:
  - `protectionPlanIncluded: true`
  - `protectionPlanFee: "$X.XX"`
  - `protectionPlanProvider: "Buddy"` (ou nome do provedor)
  - `protectionPlanTerms: "..."` (clausula contratual)
- [ ] Property Price Tag mostra valores **com** PP somado
- [ ] Clausula de Protection Plan visivel no contrato (texto state-specific)
- [ ] Linha extra no Initial Payment breakdown: `Protection Plan Fee $X.XX`

**Fluxo backend de criacao**:
- [ ] POST `/api/document` enviado com `document.variables.protectionPlanIncluded=true` + valores
- [ ] `document.callback` inclui `protectionPlanOptIn: true, protectionPlanProvider: 'BUDDY', protectionPlanFee: X.XX` para pos-assinatura
- [ ] Documento gerado normalmente (mesmos status CREATED → OUTSTANDING)

**Diferenca em relacao ao fluxo BW13/Buddy**:
- [ ] Quando PP pre-selecionado: cliente **NAO** ve modal Buddy / botao "See Protection Benefits"
- [ ] Cliente vai direto para "PROCEED TO SIGNATURE" → e-sign GowSign
- [ ] Auto-deteccao em `completeTermsAndConditions()` reconhece PP pre-selecionado e pula o modal

**Auditoria de consentimento**:
- [ ] Origem do opt-in registrada: `merchantPreSelected` flag em `uown_los_lead` ou tabela dedicada
- [ ] Identidade do operador merchant que pre-selecionou capturada (user_id, timestamp)
- [ ] Cliente continua podendo opt-out **antes** de assinar (botao "Remove Protection" no contrato — se config permitir)
- [ ] Se cliente faz opt-out: contrato regerado sem PP, lease volta para fluxo padrao

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 1 linha `from_status=CC_AUTH_PASSED, to_status=CONTRACT_CREATED, source='GOWSIGN_CONTRACT_CREATED'` (igual US-LSE-02)
- [ ] **`uown_los_lead_notes`**: 2 notas:
  1. `"Protection Plan pre-selected by merchant — provider=BUDDY, fee=$X.XX, operator={user_id}"`
  2. `"Contract created via GowSign with Protection Plan included — documentId={uuid}"`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='CREATED', protection_plan_pre_selected=true`
- [ ] **`uown_esign_document.callback`** (JSON) inclui flags do PP para reconciliacao
- [ ] **Tabela de PP** (`uown_los_protection_plan` ou similar) recebe linha:
  - `lead_pk`, `provider='BUDDY'`, `opt_in_source='MERCHANT_PRESELECTED'`, `fee_amount`, `created_date`, `merchant_user_id`
- [ ] Cliente fazendo opt-out antes de assinar gera nota adicional: `"Customer opted out of pre-selected Protection Plan before signing — contract regenerated"`

### Cobertura Origem
- Business rules ch.03 § Fluxo de Plano de Protecao (TireAgent / BW13)
- Tarefa GitLab: novo fluxo solicitado pelo PO (merchant pre-selection)
- Compliance: estados podem restringir pre-selecao automatica

---

# EPICO 3: CAMPOS DE ASSINATURA (TIPOS E PROPRIEDADES)

## US-FLD-01: Posicionamento de Campo Signature

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **assinar onde o contrato indica** para que **minha assinatura aparece no local correto do PDF (linha de assinatura, no fim do contrato)**.

### Criterios de Aceite
- [ ] DOCX flow: `fields[]` com `term`, `type=signature`, `required=true`, `signer=1`, `width`, `height` (positivos)
- [ ] HTML/Strapi flow: tag inline `[sig|req|signer1]` posiciona campo no local da tag
- [ ] Sistema procura `term` no texto do PDF e posiciona o controle no local
- [ ] `term` ausente no PDF → comportamento documentado (erro ou fallback)
- [ ] Apos assinatura, `signatureImage` populado com URL/data da assinatura
- [ ] `pdfStatus` transiciona para `SIGNED_GENERATED` apos assinar todos campos required

### Cobertura Origem
- Doc GowSign § Signature Fields > Field Types > Signature

---

## US-FLD-02: Posicionamento de Campo Initial (Rubrica)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **rubricar paginas do contrato** para que **cada pagina tenha minha confirmacao de leitura**.

### Criterios de Aceite
- [ ] `type=initial` (DOCX) ou tag `[initials|req|signer1]` (HTML) reconhecidos
- [ ] Cada ocorrencia de `term` no PDF gera um campo de rubrica
- [ ] Apos assinar, `rubricaImage` populado
- [ ] `required=true` bloqueia conclusao se nao rubricado
- [ ] `required=false` ou ausente permite pular

### Cobertura Origem
- Doc GowSign § Field Types > Initial

---

## US-FLD-03: Checkbox Individual (Opt-in)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **marcar checkbox de aceite individual** (ex: "Concordo com termos opcionais", "Recebo emails promocionais") para que **eu manifeste consentimento explicito sobre cada item**.

### Criterios de Aceite
- [ ] DOCX flow: `fields[]` com `type=check`, `term` (texto a ser localizado no PDF), `required` boolean, `signer=1`
- [ ] HTML/Strapi flow: tag `[checkbox|req1|signer1|groupName|(Label;name;false)]`
- [ ] `required=true` em check → documento nao conclui sem marcar
- [ ] No payload de assinatura: `signaturePositions` envia `value: true` (marcado) ou `false` (desmarcado)
- [ ] Get Document retorna `fields[]` com `type=check` e `value` boolean

### Cobertura Origem
- Doc GowSign § Field Types > Checkbox, § Checkbox values on sign

---

## US-FLD-04: Checkbox em Grupo (Mutual Exclusivity Yes/No)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **escolher entre opcoes mutualmente exclusivas via checkboxes agrupados** (ex: Yes/No, Sim/Nao, opt-in/opt-out de seguro) para que **eu nao marque opcoes contraditorias por engano**.

### Criterios de Aceite
- [ ] DOCX flow: `fields[]` com `type=check` + `group` (mesmo nome para opcoes do grupo)
- [ ] HTML flow: tag `[checkbox|reqN|signer1|groupName|(Yes;yes;false)(No;no;false)]`
- [ ] Marcar uma opcao do grupo desmarca as outras automaticamente
- [ ] `reqN` (ex: `req1`) exige no minimo N marcacoes no grupo
- [ ] Apos assinar, apenas uma posicao do grupo tem `value=true`

### Cobertura Origem
- Doc GowSign § Field Properties > group, § Field Types > Checkbox

---

## US-FLD-05: Tags Inline Suportadas no HTML

**Persona:** B (Backend) / C (Cliente)

### Historia
Como **backend**, quero **expressar todos os tipos de campo via tags inline** no HTML para que **o template seja autocontido e o backend nao precise calcular posicoes em pixel**.

### Criterios de Aceite
- [ ] **Signature**: `[sig]`, `[sig|req|signer1]`
- [ ] **Initials**: `[initials|req|signer1]`
- [ ] **Date**: `[date|signer1]`, `[date|req|signer1]` — auto-preenchido com data da assinatura
- [ ] **Text Input**: `[text|req|signer1|fieldName|initialValue|placeholder|width]` — valor digitado retorna em `fields[]`
- [ ] **Radio Button**: `[radio_button|req|signer1|groupName|initialValue|(Label1;val1)(Label2;val2)]`
- [ ] **Checkbox**: `[checkbox|reqN|signer1|groupName|(Label;name;init)]`
- [ ] **Table**: `[table|tableVariable]` — referencia chave em `variables`
- [ ] Tags malformadas: comportamento documentado (erro de validacao 400 ou ignoradas)

### Cobertura Origem
- Doc GowSign § Inline Signature Fields

---

## US-FLD-06: Validacao de Campos Required

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **ser impedido de finalizar a assinatura sem preencher campos obrigatorios** para que **eu nao envie um contrato incompleto por engano**.

### Criterios de Aceite
- [ ] `required=true` em qualquer field type bloqueia conclusao se vazio/desmarcado
- [ ] Mensagem visual indica quais campos faltam
- [ ] Sistema GowSign nao transita `OUTSTANDING` → `SIGNED` se houver required pendente
- [ ] `required=false` permite pular o campo

---

## US-FLD-07: Width/Height de Campos

**Persona:** B (Backend)

### Historia
Como **backend**, quero **especificar `width` e `height` em pixels** para que **campos de assinatura/rubrica caibam corretamente em layouts customizados**.

### Criterios de Aceite
- [ ] DOCX flow com `fields[]`: `width` e `height` **obrigatorios** como numeros positivos
- [ ] Valores 0 ou negativos rejeitados com 400 ValidationError
- [ ] Defaults aplicados quando ausente em fluxo HTML/Strapi (ex: 200×50 para signature)
- [ ] Tag inline com width customizado: `[text|...|...|...|...|...|200px]` ou `[...|50%]`

### Cobertura Origem
- Doc GowSign § Field Properties — "When you provide a fields array, each field must include width and height as positive numbers"

---

## US-FLD-08: Multi-Field em Mesmo Documento

**Persona:** B (Backend)

### Historia
Como **backend**, quero **enviar varios campos de tipos diferentes no mesmo contrato** (ex: 1 signature + 5 initials + 3 checkboxes + 2 radio + 1 table) para que **um unico contrato cubra varios consentimentos sem fragmentar em multiplos PDFs**.

### Criterios de Aceite
- [ ] DOCX flow: `fields[]` com mix de `signature`, `initial`, `check` aceito
- [ ] HTML flow: mix de tags inline aceito
- [ ] Ordem de campos preservada na resposta `signatureFields[]`
- [ ] Cada campo tem `term` unico (nao colide)
- [ ] Get Document retorna todos os fields com seus values

---

## US-FLD-09: Apenas Signer 1 Suportado (Atualmente)

**Persona:** B (Backend)

### Historia
Como **backend**, quero **garantir que somente `signer=1` (o requester) seja referenciado** para que **a integracao nao falhe silenciosamente em valores nao suportados pela versao atual da API**.

### Criterios de Aceite
- [ ] Todos os campos enviados usam `signer=1`
- [ ] Tags HTML usam `signer1` como signerName (ou ausente)
- [ ] Outros valores (`signer=2`, `signer2`) tratados como erro de validacao (400) ou ignorados (documentar)

### Cobertura Origem
- Doc GowSign § Field Object Properties — "currently supports signer 1 (the requester)"

---

## US-FLD-10: Documento Sem Campos de Assinatura

**Persona:** B (Backend) / C (Cliente)

### Historia
Como **backend**, quero **garantir comportamento documentado quando contrato e enviado sem `fields[]` (DOCX) e sem tags inline (HTML/Strapi)** para que **um bug que envia template vazio nao gere documento "assinavel" sem campos visiveis**.

### Criterios de Aceite
- [ ] DOCX flow sem `fields[]`: documento criado, mas signaturas/iniciais detectadas no PDF via OCR/term-search (fluxo do GowSign)
- [ ] HTML/Strapi sem tags inline: documento criado mas **nao** assinavel (sem campos para clicar)
- [ ] Cliente acessando documento sem fields: mensagem clara ("Documento sem campos para assinar — contate suporte")
- [ ] Backend valida pelo menos 1 signature field antes de chamar POST (defesa em profundidade)
- [ ] Erro `NO_SIGNATURE_FIELDS` antes de criar documento se nenhum campo detectado

### Validacao API + DB

**Request Payload** — POST `/api/document` sem `fields` (DOCX) ou sem tags `[sig]`/`[initials]` no `customTemplate`

**Response** — 200 OK normal (GowSign aceita); ou 400 se backend UOwn validar e rejeitar antes

**DB State After**
- Se backend rejeita: nada inserido em `uown_esign_document`; linha em `uown_merchant_api_error_log` com `error_type='NO_SIGNATURE_FIELDS'`
- Se passa pra GowSign: `uown_esign_document.signature_fields_count=0` (recomendar coluna)

### Log no Lease
- Se rejeitado: nota em `uown_los_lead_notes`: `"Contract creation rejected — no signature fields in template"`
- Se aceito: nota WARN: `"Contract created without signature fields — manual operator review required"`

### Cobertura Origem
- Edge case derivado da analise de gaps

---

# EPICO 4: EXPERIENCIA DE ASSINATURA VIA IFRAME

## US-EMB-01: Cliente Abre Contrato em Iframe Embed

**Persona:** C (Cliente)
**Portal:** Origination — pagina de assinatura
**Trigger:** Cliente clica "Sign Contract" no portal apos completar cadastro

### Historia
Como **cliente**, quero **assinar o contrato em iframe embutido na pagina UOwn** (sem sair do site) para que **a experiencia seja contigua e eu nao perca confianca por sair do dominio**.

### Criterios de Aceite
- [ ] Iframe `src` aponta para `{document.url}?embedMode=true`
- [ ] Iframe ocupa area visivel adequada (width 100%, height suficiente, ex: 600px+)
- [ ] `style="border: none"` para integracao visual limpa
- [ ] Title do iframe descritivo (acessibilidade)
- [ ] Iframe carrega o contrato com PDF + campos de assinatura

### Cobertura Origem
- Doc Embed § Creating the iframe

---

## US-EMB-02: Sistema Captura Evento `loaded`

**Persona:** C (Cliente) / B (Backend frontend)

### Historia
Como **frontend UOwn**, quero **detectar quando o contrato carregou** (status interno `VIEWED`) para que **eu mostre o contrato e atualize estado de UI ("Aguardando assinatura")**.

### Criterios de Aceite
- [ ] Listener `window.addEventListener('message')` configurado antes do iframe carregar
- [ ] Evento `{ type: 'loaded', documentId: 'abc123' }` recebido
- [ ] `event.origin` validado contra dominio GowSign em producao
- [ ] DB: `uown_esign_event_trigger_log` registra evento `LOADED` com `esign_doc_pk`
- [ ] UI atualiza: spinner removido, contrato visivel, botao "Skip" desabilitado

### Log no Lease
Vide **US-LSE-04** (lease permanece em `CONTRACT_CREATED`, evento logado em `uown_esign_event_trigger_log`).

### Cobertura Origem
- Doc Embed § Supported Events > loaded

---

## US-EMB-03: Cliente Assina e Sistema Captura `completed`

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **finalizar a assinatura e ver confirmacao imediata** para que **eu saiba que terminei e posso prosseguir para a tela de conclusao**.

### Criterios de Aceite
- [ ] Apos signer preencher todos campos required e clicar "Submit/Sign", evento `{ type: 'completed', documentId }` enviado via postMessage
- [ ] Frontend chama backend `/contract/completed?event=completed&ata={uuid}` ou equivalente
- [ ] Backend atualiza:
  - `uown_esign_document.status` (interno) → `COMPLETED`
  - `uown_los_contract.status` → `SIGNED`
  - `uown_los_lead.status` → `SIGNED` (via mapeamento ch.03)
- [ ] Cliente redirecionado para `/{shortCode}/complete` (tela Confetes)
- [ ] Email de confirmacao enviado
- [ ] CC Peek consent extraido do documento assinado
- [ ] Plano de protecao iniciado assincronamente

### Log no Lease
Vide **US-LSE-06** (transicao `CONTRACT_CREATED` → `SIGNED`). Quando merchant tem `isSignedToFunding=true`, encadeia US-LSE-07 (transicao adicional `SIGNED` → `FUNDING`).

### Cobertura Origem
- Doc Embed § Supported Events > completed
- Business rules ch.03 § Fluxo Pos-Assinatura

---

## US-EMB-04: Cliente Fecha Sem Assinar (`closed` → DECLINED)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **poder desistir da assinatura** (fechar sem assinar) para que **se eu tiver duvida, possa sair sem assinar nada que nao concordo**.

### Criterios de Aceite
- [ ] Evento `{ type: 'closed', documentId }` recebido quando cliente fecha sem assinar
- [ ] Status interno GowSign: `DECLINED`
- [ ] Mapeamento UOwn: `uown_los_contract.status` = `CANCELLED`
- [ ] Lead **NAO** transita para SIGNED (permanece em `CONTRACT_CREATED`)
- [ ] Cliente redirecionado para `merchantRedirectUrl?event=canceled&ata={uuid}` se config presente
- [ ] Cliente pode receber novo contrato (nao bloqueia retentativa)

### Log no Lease
Vide **US-LSE-08** (lease permanece em `CONTRACT_CREATED`, contrato → `CANCELLED`, evento `CLOSED` logado, nota descritiva).

### Cobertura Origem
- Doc Embed § Supported Events > closed
- Business rules ch.03 § Mapeamento de Eventos (Signwell `declined,closed,error`)

---

## US-EMB-05: Erro Critico Durante Assinatura (`error`)

**Persona:** C (Cliente) / O (Operador)

### Historia
Como **cliente**, quero **ser informado claramente quando ocorre erro tecnico durante assinatura** para que **eu saiba que precisa retentar (nao que falhou silenciosamente)**.

### Criterios de Aceite
- [ ] Evento `{ type: 'error', documentId, error: 'mensagem' }` recebido
- [ ] Frontend mostra alert/modal com mensagem amigavel ("Tivemos um problema, tente novamente")
- [ ] Backend loga erro em `uown_esign_event_trigger_log` com `esign_event=ERROR` e mensagem
- [ ] Documento permanece em status compativel com retry (nao marcado como signed)
- [ ] Operador no portal ve alerta de erro no documento

### Log no Lease
Vide **US-LSE-09** (lease permanece, evento `ERROR` logado com mensagem sanitizada, nota WARN, alerta operacional).

### Cobertura Origem
- Doc Embed § Supported Events > error

---

## US-EMB-06: Limpeza de Iframe via `close-iframe`

**Persona:** B (Frontend)

### Historia
Como **frontend**, quero **remover o iframe do DOM quando GowSign sinaliza `close-iframe`** para que **recursos sejam liberados e a UI nao fique com iframe orfao**.

### Criterios de Aceite
- [ ] Evento `{ type: 'close-iframe' }` (sem documentId) recebido em momentos especificos do fluxo
- [ ] Frontend chama `iframe.remove()` ou hide
- [ ] UI atualiza para tela seguinte (Confetes ou erro)
- [ ] Sem memory leak (listeners limpos apos remocao do iframe)

### Log no Lease
Vide **US-LSE-10** (sem mudanca de status; evento `CLOSE_IFRAME` em `uown_esign_event_trigger_log` para auditoria de UX).

### Cobertura Origem
- Doc Embed § Supported Events > close-iframe

---

## US-EMB-07: Validacao de Origin (Seguranca)

**Persona:** B (Frontend) / C (Cliente)

### Historia
Como **time de seguranca**, quero **validar que mensagens postMessage vem do dominio GowSign** para que **scripts maliciosos em iframes irmaos nao consigam injetar eventos falsos**.

### Criterios de Aceite
- [ ] Listener verifica `event.origin === 'https://gowsign.com'` (ou subdominio config) **em producao**
- [ ] Origens nao reconhecidas geram log e descarte da mensagem
- [ ] Em dev/qa, validacao pode ser relaxada com flag explicita
- [ ] Mensagem sem `type` ou nao-objeto descartada (safeguard)

### Log no Lease
- [ ] **`uown_esign_event_trigger_log`**: 1 linha por mensagem **descartada** com `esign_event='ORIGIN_REJECTED'`, `dropped_origin={origem}` (auditoria de tentativa de injecao)
- [ ] Sem efeito em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` ou `uown_los_lead_notes` (mensagens descartadas nao afetam lease)
- [ ] Volume anomalo de descarte: alerta operacional (possivel ataque)

### Cobertura Origem
- Doc Embed § About postMessage > Important: Always validate message origins in production

---

## US-EMB-10: Botao Start Gate Antes do Carregamento da Assinatura

**Persona:** C (Cliente) / B (Frontend)
**Trigger:** Cliente abre URL do documento (`status=OUTSTANDING`)

### Historia
Como **cliente**, quero **ver uma tela de pre-visualizacao do contrato com botao "Start"** antes do widget de assinatura carregar, para que **eu possa revisar metadados (remetente, ID, data) e baixar o contrato sem precisar entrar no fluxo de assinatura**.

### Criterios de Aceite

**Estado pre-Start (renderizacao inicial)**:
- [ ] Pagina renderiza com status badge `CREATED` (amarelo) ou `OUTSTANDING` antes do click em Start
- [ ] Tabela de metadados visivel:
  - Linha "Document sent by Uown Leasing (`{senderEmail}`)"
  - Linha "Created on `{MM DD, YYYY}`"
  - Coluna DOCUMENT ID com UUID
  - Coluna Recipient com nome + email do cliente
  - Coluna Status com badge de cor mapeada
- [ ] Conteudo do contrato (`.gowsign-document`) ja renderizado abaixo da tabela (cliente pode rolar e ler antes de Start)
- [ ] Botao Start (`#startSignatureButton`) visivel e habilitado
- [ ] Botoes Download e Close visiveis e habilitados
- [ ] Toggle "Reading mode" disponivel em mobile
- [ ] Evento postMessage `loaded` **AINDA NAO** disparado neste estado (apenas pre-visualizacao)

**Click em Start**:
- [ ] Click em `#startSignatureButton` carrega o widget de assinatura interativo
- [ ] Apenas neste momento o evento postMessage `{ type: 'loaded' }` e disparado para o parent (US-EMB-02)
- [ ] Status interno do documento transita para `VIEWED`
- [ ] Cliente passa a interagir com fields de assinatura (sig, initial, check, etc.)

**Comportamento alternativo (cliente nao clica Start)**:
- [ ] Cliente pode fechar (`Close document`) sem assinar — sem disparar `closed` (nao houve interacao real ainda) OU dispara `closed` conforme regra GowSign (validar)
- [ ] Cliente pode baixar o contrato (`Download`) sem clicar Start — operacao independente
- [ ] Cliente pode rolar e ler todo o conteudo sem disparar nenhum evento

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (sem mudanca de status do lease — pre-visualizacao)
- [ ] **`uown_esign_event_trigger_log`**:
  - **Render inicial**: 0 ou 1 linha (depende de o GowSign disparar evento de page-render — validar; se sim, `esign_event='PAGE_RENDERED'` ou similar)
  - **Click em Start**: 1 linha `esign_event='STARTED'` ou `'LOADED'` (US-EMB-02)
- [ ] **`uown_los_lead_notes`**: opcional `"Customer opened contract preview at {timestamp} — Start not yet clicked"`
- [ ] Distincao entre "abriu contrato" e "iniciou assinatura" preservada para metricas de funil

### Cobertura Origem
- HTML do GowSign Document Viewer (`#startSignatureButton` no header)
- Doc Embed § Supported Events > loaded — semantica refinada com base no comportamento real do widget

---

## US-EMB-09: Assinatura sem Widget Buddy (Plano de Protecao Pre-Selecionado)

**Persona:** C (Cliente) / B (Frontend)
**Trigger:** Cliente abre contrato com `protectionPlanPreSelectedByMerchant=true`

### Historia
Como **cliente cujo merchant ja pre-selecionou o plano de protecao**, quero **assinar o contrato sem ter que interagir com o widget Buddy** para que **a experiencia seja mais rapida (sem espera de 5-12s do iframe Buddy carregar) e nao haja confusao com opcao ja decidida**.

### Criterios de Aceite

**Renderizacao da pagina de contrato**:
- [ ] Pagina de contrato (rota `/{shortCode}/contract`) detecta flag `protectionPlanPreSelectedByMerchant=true` (vinda do backend)
- [ ] Tela de Termos & Condicoes mostra checkbox "Concordo com PP incluido" se config exigir aceite explicito (state-specific)
- [ ] Botao "PROCEED TO SIGNATURE" aparece **direto** apos T&C (sem botao intermediario "See Protection Benefits")
- [ ] Modal `PurchaseInsurance` com Buddy iframe **NAO** e renderizado
- [ ] Sem polling/retry de 5×3s para o widget Buddy (US-POST-05 nao se aplica)

**Fluxo de assinatura GowSign**:
- [ ] Iframe GowSign abre com contrato ja contendo valores de PP no Property Price Tag (US-CRE-09)
- [ ] Eventos postMessage normais: `loaded` → `completed` → `close-iframe`
- [ ] Cliente NAO precisa de etapa adicional para confirmar PP (ja confirmado pelo merchant)

**Opt-out durante visualizacao (opcional)**:
- [ ] Botao "Remove Protection Plan" pode aparecer no contrato (config por estado/merchant)
- [ ] Se cliente clica: contrato e cancelado, novo contrato gerado sem PP, fluxo recomeca em status `CONTRACT_CREATED` (US-CRE-07 cancelamento em cascata aplicado)
- [ ] Se cliente NAO opta-out: assinatura segue normal

**Comparativo com fluxo BW13 padrao**:
- [ ] Tempo medio do fluxo: **menor** que o fluxo BW13 (sem 5-12s do widget Buddy)
- [ ] Numero de cliques: 1 a menos (sem "See Protection Benefits")
- [ ] Auto-deteccao em `completeTermsAndConditions()` retorna `path='PRESELECTED_PP'` (vs `path='BW13_BUDDY'` ou `path='STANDARD'`)

### Log no Lease
- [ ] **`uown_esign_event_trigger_log`**: eventos normais (`LOADED`, `COMPLETED`) com flag `flow_variant='PP_PRESELECTED'`
- [ ] **`uown_los_lead_notes`**: `"Customer signed contract with merchant-preselected Protection Plan — Buddy widget skipped"`
- [ ] Se cliente opta-out durante visualizacao:
  - Nota: `"Customer removed pre-selected Protection Plan during contract review — contract regenerated without PP"`
  - Linha de evento: `esign_event='CONTRACT_REGENERATED', reason='PP_OPT_OUT'`
  - Documento original cancelado (US-LSE-08), novo documento criado (US-LSE-02)
- [ ] Lease permanece em `CONTRACT_CREATED` durante regeneracao (sem regressao)
- [ ] Auditoria: distinguir contratos assinados via fluxo PP-preselected vs BW13-Buddy vs standard nas metricas

### Cobertura Origem
- Business rules ch.03 § Deteccao automatica em `completeTermsAndConditions()`
- US-CRE-09 (origem do opt-in)
- Doc Embed (eventos postMessage padrao)

---

## US-EMB-08: Auto-Detecao do Provedor no Iframe

**Persona:** B (Frontend)

### Historia
Como **frontend UOwn**, quero **detectar automaticamente qual provedor de e-sign esta no iframe** (Signwell, PandaDoc ou GowSign) para que **eu trate eventos do provedor correto sem hardcode no merchant**.

### Criterios de Aceite
- [ ] Polling 3s × 12 (ate 36s total) inspeciona `iframe.src` ou primeira mensagem postMessage
- [ ] Origem `gowsign.com` → handler GowSign
- [ ] Origem `signwell.com` → handler Signwell
- [ ] Origem `pandadoc.com` → handler PandaDoc
- [ ] Apos timeout sem deteccao, log + erro visivel
- [ ] Mapeamento de eventos consistente entre provedores (ex: GowSign `completed` ≡ Signwell `completed` ≡ PandaDoc `completed`)

### Log no Lease
- [ ] **`uown_esign_document.esign_client`** registra provedor detectado (`GOWSIGN`/`SIGNWELL`/`PANDADOC`)
- [ ] **`uown_los_lead_notes`**: 1 nota `"E-sign provider auto-detected: {PROVIDER} (iframe origin={origin}, detected at attempt {N}/12)"`
- [ ] Timeout sem deteccao apos 36s: nota WARN + linha em `uown_merchant_api_error_log`
- [ ] Eventos subsequentes do iframe sao logados com `esign_client={provider}` para correlacao

### Cobertura Origem
- Business rules ch.03 § Auto-detection iframe polling 3s × 12
- Doc GowSign + Embed

---

## US-EMB-11: Browsers Suportados (Matrix de Compatibilidade)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **assinar contrato em qualquer browser moderno comum** para que **eu nao seja bloqueado se uso Safari, Firefox ou um browser mobile**.

### Criterios de Aceite
- [ ] Browsers tier-1 suportados oficialmente (smoke + regressao):
  - **Chrome** (last 2 versions)
  - **Safari** (last 2 versions, iOS Safari)
  - **Firefox** (last 2 versions)
  - **Edge** (last 2 versions)
  - **Mobile Chrome** (Android)
  - **Mobile Safari** (iOS)
- [ ] Browsers nao suportados: deteccao + mensagem clara ("Use Chrome/Safari/Firefox/Edge")
- [ ] postMessage funciona consistentemente em todos tier-1
- [ ] Iframe embedMode renderiza igual em desktop e mobile
- [ ] Download funciona em todos (com download attribute ou nova aba)

### Validacao API + DB
- **Request Payload** — N/A (frontend)
- **Response** — N/A
- **DB State After** — N/A
- **Log no Lease** — `uown_esign_event_trigger_log` registra `user_agent` em cada evento (postMessage). Auditoria de `user_agent` distintos por sucesso/erro alimenta browser matrix observada.

### Cobertura Origem
- Browser support obrigatorio em fintech US

---

# EPICO 5: CICLO DE VIDA DO DOCUMENTO

## US-LCY-01: Status Inicial `CREATED`

**Persona:** B (Backend)

### Historia
Como **backend**, quero **receber `status=CREATED` imediatamente apos POST** para que **eu saiba que o documento foi aceito e esta em fila para processamento de PDF**.

### Criterios de Aceite
- [ ] Resposta 200 do POST contem `data.status = "CREATED"`
- [ ] DB UOwn: `uown_esign_document.status = 'CREATED'` (ou mapeamento)
- [ ] Documento ainda **nao** assinavel (PDF em geracao)

### Log no Lease
Vide **US-LSE-02** — POST de criacao gera transicao do lease + linhas de log (`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`, `uown_los_lead_notes`, `uown_esign_event_trigger_log`).

### Cobertura Origem
- Doc GowSign § Document Status > CREATED

---

## US-LCY-02: Transicao `CREATED` → `OUTSTANDING` (PDF Pronto)

**Persona:** G (GowSign) → B (Backend)

### Historia
Como **backend**, quero **detectar quando o documento esta pronto para assinar** para que **eu envie email/notificacao ao cliente apenas apos PDF estar disponivel**.

### Criterios de Aceite
- [ ] Polling em `GET /api/document/{id}` ate `status = "OUTSTANDING"`
- [ ] Polling com backoff exponencial, max 30 tentativas (config)
- [ ] `pdfStatus` transiciona `CREATED_PENDING` → `CREATED_GENERATED` antes do `OUTSTANDING`
- [ ] Webhook `document.created` (se configurado no GowSign) tambem dispara update
- [ ] Mapeamento UOwn: `uown_los_contract.status` = `SENT`
- [ ] Apenas em `OUTSTANDING` o sistema envia email com link de assinatura (se `sendSignatureEmail=true`)

### Log no Lease
Vide **US-LSE-03** (lease permanece em `CONTRACT_CREATED`; `uown_esign_document.status='OUTSTANDING'`, `pdf_status='CREATED_GENERATED'`; evento `OUTSTANDING` em `uown_esign_event_trigger_log`).

### Cobertura Origem
- Doc GowSign § Document Status > OUTSTANDING

---

## US-LCY-03: Transicao `OUTSTANDING` → `SIGNED`

**Persona:** C (Cliente) → G

### Historia
Como **cliente**, quero **assinar e ver status atualizado** para que **proximo passo (signing fee, funding) seja desbloqueado).

### Criterios de Aceite
- [ ] Apos cliente assinar todos campos required, `status` = `SIGNED`
- [ ] `signedDate` populado com timestamp ISO 8601
- [ ] `signedPdfHash` populado
- [ ] `signatureImage` / `rubricaImage` populados
- [ ] `pdfStatus` transita para `SIGNED_PENDING` → `SIGNED_GENERATED`
- [ ] Mapeamento UOwn: `uown_los_contract.status = 'SIGNED'`, `uown_los_lead.status = 'SIGNED'`

### Log no Lease
Vide **US-LSE-06** — transicao `CONTRACT_CREATED` → `SIGNED` com linha em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` (`source='GOWSIGN_COMPLETED_EVENT'`), nota descritiva, `uown_esign_event_trigger_log` recebe `COMPLETED`.

### Cobertura Origem
- Doc GowSign § Document Status > SIGNED

---

## US-LCY-04: Transicao `SIGNED` → `COMPLETED` (Audit Trail)

**Persona:** G

### Historia
Como **backend**, quero **distinguir `SIGNED` (assinado) de `COMPLETED` (todo o ciclo, incluindo audit trail, finalizado)** para que **eu garanta arquivamento legal antes de finalizar pos-assinatura**.

### Criterios de Aceite
- [ ] Apos `SIGNED`, `pdfStatus` transita `AUDIT_TRAIL_PENDING` → `AUDIT_TRAIL_GENERATED`
- [ ] `status` = `COMPLETED` apos audit trail gerado
- [ ] `lastUpdateDate` reflete cada transicao
- [ ] Webhook `document.completed` disparado (se configurado)
- [ ] PDF final com audit trail disponivel via `pdfUrl`

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease ja em `SIGNED` ou `FUNDING`; SIGNED→COMPLETED do GowSign nao move o lease)
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='AUDIT_TRAIL_GENERATED'` (e/ou `'COMPLETED'`)
- [ ] **`uown_esign_document.status='COMPLETED'`**, `pdf_status='AUDIT_TRAIL_GENERATED'`, `last_update_date=NOW()`
- [ ] **`uown_los_lead_notes`**: 1 nota `"Contract audit trail generated — final PDF available at {pdfUrl}, audit hash={hash[:8]}..."`

### Cobertura Origem
- Doc GowSign § Document Status > COMPLETED, § pdfStatus values

---

## US-LCY-05: Transicao para `EXPIRED`

**Persona:** B (Backend) / C (Cliente)

### Historia
Como **backend**, quero **detectar documentos expirados** para que **leads vinculados sejam tratados (reapresentar contrato ou marcar como cancelado)**.

### Criterios de Aceite
- [ ] Documento criado com `expirationDate` no passado: comportamento documentado (rejeicao 400 ou criacao em estado expirado)
- [ ] Documento criado com `expirationDate` futuro: apos a data, status = `EXPIRED`
- [ ] Apos `EXPIRED`, tentativa de assinar bloqueada
- [ ] Mapeamento UOwn: `uown_los_contract.status = 'EXPIRED'`
- [ ] Lead nao transiciona para `SIGNED`
- [ ] Sweep UOwn detecta documentos `EXPIRED` e atualiza estado

### Log no Lease
Vide **US-LSE-11** — `uown_esign_document.status='EXPIRED'`, `uown_los_contract.status='EXPIRED'`, evento `EXPIRED` logado, nota descritiva. Lease permanece em `CONTRACT_CREATED` (ou transita para `CANCELLED_EXPIRED` conforme config).

### Cobertura Origem
- Doc GowSign § Document Status > EXPIRED

---

## US-LCY-06: Transicao para `CANCELED`

**Persona:** O (Operador) / C (Cliente)

### Historia
Como **operador**, quero **cancelar contrato manualmente** ou **detectar cancelamento pelo cliente** para que **leads em rota de assinatura nao fiquem presos indefinidamente**.

### Criterios de Aceite
- [ ] Documento marcado como `CANCELED` quando:
  - Cliente fecha sem assinar (evento `closed` → DECLINED → CANCELED)
  - Operador cancela manualmente (se endpoint disponivel; senao via novo contrato)
  - Novo contrato criado para mesmo lead (cancelamento em cascata)
- [ ] Status nao reverte (CANCELED e terminal)
- [ ] Mapeamento UOwn: `uown_los_contract.status = 'CANCELLED'`

### Log no Lease
Vide **US-LSE-08** (cliente fechou — DECLINED), **US-CRE-07** (cancelamento em cascata por novo contrato) ou **US-LSE-14** (operador forcando cancelamento). Cada origem tem source diferente em `uown_los_lead_notes` e `uown_esign_event_trigger_log`.

### Cobertura Origem
- Doc GowSign § Document Status > CANCELED
- US-CRE-07 (cascata)

---

## US-LCY-07: Todos os Valores de `pdfStatus`

**Persona:** B (Backend)

### Historia
Como **backend**, quero **monitorar `pdfStatus`** para que **o portal exiba progresso correto e operadores diagnostiquem documentos travados em geracao**.

### Criterios de Aceite
- [ ] Estados observaveis em sequencia:
  1. `CREATED_PENDING` — POST recebido, PDF em fila
  2. `CREATED_GENERATED` — PDF criado, documento `OUTSTANDING`
  3. `SIGNED_PENDING` — Assinatura recebida, PDF assinado em geracao
  4. `SIGNED_GENERATED` — PDF assinado pronto
  5. `AUDIT_TRAIL_PENDING` — Audit trail em geracao
  6. `AUDIT_TRAIL_GENERATED` — Audit trail pronto, `status = COMPLETED`
- [ ] `pdfStatus` regride em cenarios especificos? (documentar; presume-se monotonico)
- [ ] Documento travado em `*_PENDING` por > N minutos: alerta operacional

### Log no Lease
- [ ] Cada transicao de `pdfStatus` gera 1 linha em `uown_esign_event_trigger_log` com `esign_event='PDF_STATUS_{NEW_STATE}'`
- [ ] **`uown_esign_document.pdf_status`** atualizado in-place; `uown_esign_document.last_update_date` reflete cada mudanca
- [ ] Sem mudanca em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` (transicoes de pdfStatus sao internas, nao alteram lead)
- [ ] Documento travado: alerta dispara linha em `uown_merchant_api_error_log` com `error_type='PDF_STATUS_STUCK'` apos N minutos

### Cobertura Origem
- Doc GowSign § Get Document > pdfStatus

---

## US-LCY-08: Mapeamento Status GowSign → Status Contrato UOwn

**Persona:** B (Backend)

### Historia
Como **backend**, quero **traduzir status GowSign em status do contrato UOwn** para que **portais Origination/Servicing usem a taxonomia consistente independente do provedor**.

### Criterios de Aceite
- [ ] Tabela de mapeamento:

| GowSign | UOwn Contrato | UOwn Lead |
|---------|---------------|-----------|
| `CREATED` | `SENT` (transitorio) | `CONTRACT_CREATED` |
| `OUTSTANDING` | `SENT` | `CONTRACT_CREATED` |
| `SIGNED` | `SIGNED` | `SIGNED` |
| `COMPLETED` | `SIGNED` | `SIGNED` |
| `EXPIRED` | `EXPIRED` | (mantem ou `CANCELLED_EXPIRED`) |
| `CANCELED` | `CANCELLED` | (mantem) |
| Erro/`error` event | `ERROR` | (mantem; alerta operacional) |

- [ ] Eventos do iframe mapeados:
  - `loaded` → log `VIEWED` (sem mudanca de status contrato)
  - `completed` → `SIGNED`
  - `closed` → `CANCELLED` (DECLINED)
  - `error` → `ERROR`

### Cobertura Origem
- Business rules ch.03 § Mapeamento Status E-sign
- Doc GowSign § Document Status

---

## US-LCY-09: Persistencia de Estado no UOwn

**Persona:** B (Backend) / O (Operador)

### Historia
Como **operador**, quero **consultar status do contrato sem chamar a API GowSign** para que **o portal seja rapido e funcione mesmo se GowSign estiver lento/indisponivel**.

### Criterios de Aceite
- [ ] `uown_esign_document` populado com:
  - `document_key` = `data.id` GowSign
  - `client = 'GOWSIGN'`
  - `esign_mode` = `DOCX` | `HTML` | `STRAPI`
  - `status` (mapeado de GowSign)
  - `document_name` = titulo do contrato
  - `base64document_string IS NOT NULL (flag)`, `base64signed_document_string IS NOT NULL (flag — sem hash, so blob)`
  - `doc_signed_time_stamp`
- [ ] `uown_esign_event_trigger_log` registra cada evento recebido (postMessage ou webhook)
- [ ] Reconciliation sweep periodica chama `GET /api/document` e atualiza status local
- [ ] Mudancas de status disparam re-avaliacao de regras (lead status, funding eligibility)

### Log no Lease
Esta US **define** o contrato de log. Vide o "Padrao Comum: Validacao de Log no Lease" no inicio do documento para invariantes globais. US-LSE-01..16 detalham o log esperado por cada acao especifica.

### Cobertura Origem
- Schema: `uown_esign_document` (51 cols), `uown_esign_event_trigger_log` (17 cols)

---

# EPICO 6: POS-ASSINATURA

## US-POST-01: Lead Transita para SIGNED

**Persona:** B (Backend)

### Historia
Como **backend**, quero **atualizar lead para `SIGNED` apos assinatura confirmada** para que **proximo passo (Funding/Settled) seja desbloqueado).

### Criterios de Aceite
- [ ] Apos evento `completed` ou status `SIGNED`/`COMPLETED`, `uown_los_lead.status = 'SIGNED'`
- [ ] Audit log registra transicao com timestamp e provedor
- [ ] Lead com state machine: `CONTRACT_CREATED` → `SIGNED` (sem skip)

### Log no Lease
Vide **US-LSE-06** (transicao detalhada).

### Cobertura Origem
- Business rules ch.02 State Machine — Lead Lifecycle

---

## US-POST-02: Auto-Move para FUNDING (Merchants Configurados)

**Persona:** B (Backend)
**Trigger:** Merchant com `isSignedToFunding=true`

### Historia
Como **backend**, quero **mover lead diretamente para `FUNDING` apos `SIGNED` para merchants com flag** para que **o ciclo de funding inicie sem espera operacional manual**.

### Criterios de Aceite
- [ ] `merchant.isSignedToFunding=true` + lead em `SIGNED` → transicao automatica para `FUNDING`
- [ ] Merchants sem flag: lead permanece em `SIGNED` ate operador acionar Funding
- [ ] Transicao logada em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`

### Log no Lease
Vide **US-LSE-07** (2 linhas em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`: `CONTRACT_CREATED→SIGNED` + `SIGNED→FUNDING`, com `source='AUTO_FUNDING_AFTER_SIGN'` na segunda; 2 notas separadas).

### Cobertura Origem
- Business rules ch.03 § Auto-Move para Funding

---

## US-POST-03: Redirect para Merchant Apos Assinar

**Persona:** C (Cliente) / M (Merchant)

### Historia
Como **cliente**, quero **ser redirecionado de volta ao site do merchant apos assinar** para que **eu retome a jornada (recibo, agendamento de entrega) sem perder contexto**.

### Criterios de Aceite
- [ ] Apos `completed`, redirect URL construida com prioridade:
  1. `SVC_URL` env var (ex: `origination-dev1.uownleasing.com`)
  2. `redirect.base.url` config
  3. `merchantRedirectUrl` do merchant
  4. `document.redirect` do GowSign (fallback)
- [ ] Format: `{merchantRedirectUrl}?event=completed&ata={uuid}`
- [ ] Se `merchant.postMessage=true`, adicionar `&postMessage=true` (fluxo iframe)
- [ ] Cancelado: `?event=canceled&ata={uuid}`

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (redirect e UI/HTTP, nao status do lease)
- [ ] **`uown_los_lead_notes`**: 1 nota `"Customer redirected to merchant — url={base}, event={completed|canceled}, ata={uuid}, postMessage={true|false}"`
- [ ] Falha de redirect (URL invalida, host nao resolve): linha em `uown_merchant_api_error_log` com `error_type='REDIRECT_FAILED'`

### Cobertura Origem
- Business rules ch.03 § Construcao da URL de Redirect

---

## US-POST-04: Tela de Confetes Apos Assinatura

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **ver tela de confirmacao animada apos assinar** para que **eu tenha feedback positivo claro de que terminei meu lease**.

### Criterios de Aceite
- [ ] Apos assinar, redirect para `/{shortCode}/complete`
- [ ] Componente Confetes renderizado com:
  - Animacao confetti, fundo teal `#31c3e7`
  - Card branco com icone check
  - "Thank You!" + "Your contract has been successfully signed."
  - Telefone `(877) 353-8696`
- [ ] Animacao clip-path 0.75s
- [ ] Email de copia enviado

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease ja em SIGNED, tela de conclusao e UI)
- [ ] **`uown_los_lead_notes`**: 1 nota `"Customer reached completion screen (Confetti) — copy of contract emailed"`
- [ ] Email de copia: registrar envio em log de comunicacoes (tabela de email/SMS log)

### Cobertura Origem
- Business rules ch.03 § Tela de Conclusao Pos-Assinatura

---

## US-POST-05: Plano de Protecao Iniciado Pos-Assinatura

**Persona:** B (Backend) / C (Cliente)
**Aplicavel a:** Merchants BW13 (ex: TireAgent)

### Historia
Como **cliente de merchant BW13**, quero **completar opt-in/opt-out de seguro apos assinar contrato** para que **a protecao seja registrada corretamente sem bloquear assinatura inicial**.

### Criterios de Aceite
- [ ] Apos `SIGNED`, plano de protecao iniciado **assincronamente**
- [ ] Para merchants nao-BW13: nenhum plano iniciado (skip)
- [ ] Falha no plano nao reverte assinatura

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais
- [ ] **`uown_los_lead_notes`**: 1 nota:
  - Sucesso: `"Protection Plan flow started (BW13/Buddy) — opt_in={true|false}, policy_id={id ou null}"`
  - Falha: `"WARNING: Protection Plan activation failed — provider error: {msg}. Signature preserved."`
- [ ] **`uown_los_protection_plan`**: 1 linha com `opt_in_source='CUSTOMER_BUDDY_WIDGET'`, `status={PENDING|ACTIVE|FAILED}`
- [ ] Comparar com US-POST-09 (`opt_in_source='MERCHANT_PRESELECTED'`) para distinguir origem

### Cobertura Origem
- Business rules ch.03 § Fluxo de Plano de Protecao (TireAgent / BW13)

---

## US-POST-06: Cancelamento de Contratos Anteriores em Cascata

(Coberto em US-CRE-07)

---

## US-POST-07: CC Peek Consent Extraido

**Persona:** B (Backend)

### Historia
Como **backend**, quero **extrair o consentimento de CC Peek do documento assinado** para que **a politica de cobranca de cartao tenha registro juridico do aceite**.

### Criterios de Aceite
- [ ] Apos assinatura, sistema le `signaturePositions[]` ou `fields[]` do GET Document
- [ ] Identifica campos de tipo `check` com `term` correspondente a "CC Peek consent"
- [ ] Persistencia em campo dedicado de `uown_los_lead` ou tabela auditoria

### Log no Lease
- [ ] **`uown_los_lead.cc_peek_consent`** (boolean) ou tabela `[TBD: tabela de consents — verificar se cabe coluna em uown_los_lead ou usar uown_los_lead_notes]` populada com `consent_type='CC_PEEK'`, `granted={true|false}`, `granted_date={iso}`, `source='GOWSIGN_SIGNATURE'`
- [ ] **`uown_los_lead_notes`**: 1 nota `"CC Peek consent extracted from signed document — granted={bool}"`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='CC_PEEK_CONSENT_EXTRACTED'`
- [ ] Falha de extracao (campo nao encontrado): linha em `uown_merchant_api_error_log` + alerta operacional

### Cobertura Origem
- Business rules ch.03 § Fluxo de Contrato passo 5

---

## US-POST-09: Plano de Protecao Pre-Selecionado Ativado Pos-Assinatura (Sem Buddy)

**Persona:** B (Backend) / C (Cliente)
**Trigger:** Apos assinatura (`completed` event) de contrato com `protectionPlanPreSelectedByMerchant=true`

### Historia
Como **backend**, quero **ativar o plano de protecao pre-selecionado imediatamente apos assinatura** (sem aguardar opt-in do cliente via widget Buddy) para que **a cobertura comece valendo no momento da assinatura, igual ao fluxo BW13/Buddy mas com fricao reduzida**.

### Criterios de Aceite

**Acionamento pos-completed**:
- [ ] Apos lead transitar para `SIGNED` (US-LSE-06), backend verifica flag `merchant_pre_selected_pp` em `uown_los_protection_plan` (ou similar)
- [ ] Se `true`: ativacao **automatica** do plano com provedor (Buddy API call para criar policy)
- [ ] Para fluxo BW13 padrao (cliente escolhe via widget): comportamento existente preservado
- [ ] Para fluxo standard (sem PP): nada muda

**Calculo e cobranca**:
- [ ] Valor do PP ja foi capturado no contrato e no schedule de pagamentos (US-CRE-09)
- [ ] Primeira parcela do PP cobrada junto com signing fee + initial payment
- [ ] Falha na ativacao do PP **nao reverte** assinatura (compensacao via reconciliation)
- [ ] Falha na cobranca da parcela: tratada como atraso normal de pagamento

**Sincronizacao com provedor (Buddy)**:
- [ ] POST para Buddy API com dados do cliente, item, valores
- [ ] Resposta: `policyId`, `policyUrl`, `coverageStartDate`
- [ ] Persistencia em `uown_los_protection_plan`: `policy_id`, `policy_url`, `coverage_start_date`, `status='ACTIVE'`
- [ ] Email de confirmacao da policy enviado ao cliente

**Idempotencia**:
- [ ] Re-trigger do completed event (US-LSE-12) NAO ativa policy 2x (chave `(lead_pk, provider)` unica)
- [ ] Se `policy_id` ja existe: skip + log

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease ja em SIGNED, ativacao do PP nao move status)
- [ ] **`uown_los_lead_notes`**: 1 nota:
  - Sucesso: `"Pre-selected Protection Plan activated — provider=BUDDY, policyId={id}, coverageStart={iso}"`
  - Falha: `"WARNING: Pre-selected Protection Plan activation failed — provider error: {msg}. Manual intervention required."`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='PP_ACTIVATED', source='AUTO_POST_SIGN'`
- [ ] **`uown_los_protection_plan`**:
  - `lead_pk`, `provider='BUDDY'`, `opt_in_source='MERCHANT_PRESELECTED'`, `policy_id`, `status='ACTIVE'`, `activated_date=NOW()`, `activation_source='AUTO_AFTER_GOWSIGN_SIGN'`
- [ ] Falha de ativacao: alerta operacional + linha em `uown_merchant_api_error_log` com `error_type='PP_ACTIVATION_FAILED'`
- [ ] Reconciliation sweep periodica re-tenta ativacoes falhas

### Cobertura Origem
- Business rules ch.03 § Fluxo de Plano de Protecao
- US-CRE-09 (origem do opt-in)
- US-EMB-09 (assinatura sem Buddy)

---

## US-POST-08: Signing Fee Cobrada Antes da Assinatura

**Persona:** B (Backend) / C (Cliente)

### Historia
Como **backend**, quero **cobrar signing fee antes do cliente acessar assinatura** para que **o custo inicial seja garantido como compromisso de fechamento**.

### Criterios de Aceite
- [ ] Signing fee processada antes do envio do contrato GowSign (independente do provedor)
- [ ] Falha de cobranca: lead `SIGNING_FEE_DENIED`, contrato GowSign **nao** criado
- [ ] Idempotencia: signing fee ja cobrada nao cobra de novo
- [ ] Recibo enviado por email apos cobranca aprovada

### Log no Lease
- [ ] **Sucesso**: linha em `uown_los_credit_card_transaction` (CAPTURE/SALE, type=FEE, status=APPROVED), nota em `uown_los_lead_notes`: `"Signing fee captured: $X.XX — receipt sent"`
- [ ] **Falha**: lead transita `CC_AUTH_PASSED` → `SIGNING_FEE_DENIED` (1 linha em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` com `source='SIGNING_FEE_FAILURE'`); nota com erro do gateway
- [ ] Idempotencia: tentativa duplicada nao gera segunda transacao (verificacao em `uown_los_credit_card_transaction`)
- [ ] Nenhum chamada a API GowSign acontece se signing fee falhou

### Cobertura Origem
- Business rules ch.03 § 55 Taxa de Assinatura

---

# EPICO 7: COMUNICACAO

## US-COM-01: Email de Assinatura Enviado por Padrao

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **receber email com link do contrato apos backend criar documento** para que **eu acesse e assine pelo link sem precisar do portal aberto**.

### Criterios de Aceite
- [ ] `sendSignatureEmail` ausente ou `true` → email enviado pelo GowSign automaticamente
- [ ] Email contem nome do cliente, titulo do contrato, link `data.url`
- [ ] Remetente: subdominio configurado no template Strapi (ou default GowSign)
- [ ] Idioma: ingles (US) por default

### Cobertura Origem
- Doc GowSign § Optional Parameters > sendSignatureEmail

---

## US-COM-02: Email Suprimido para Fluxo Embed

**Persona:** B (Backend)

### Historia
Como **backend**, quero **suprimir email automatico quando o fluxo for embed** para que **o cliente nao receba dois acessos (link no email + iframe na pagina)**.

### Criterios de Aceite
- [ ] Para fluxos embed (cliente assina no iframe na pagina UOwn), `sendSignatureEmail=false`
- [ ] Sistema confia no iframe, nenhum email de link enviado
- [ ] Email de **confirmacao pos-assinatura** ainda enviado (independente do flag)

---

## US-COM-03: Reminder Apos N Dias Sem Assinatura

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **receber lembrete por email** se eu nao assinei em N dias para que **eu nao perca o lease por esquecimento**.

### Criterios de Aceite
- [ ] `mustReminder=true` + `reminderDaysAmount=N` → email de reminder enviado N dias apos criacao se status ainda `OUTSTANDING`
- [ ] `reminderDaysAmount` ausente: default 3 dias
- [ ] `mustReminder=false` ou ausente: nenhum reminder
- [ ] Reminder nao enviado se documento `SIGNED`, `EXPIRED` ou `CANCELED`
- [ ] Multiplos reminders: comportamento documentado (uma vez por padrao? recorrente?)

### Cobertura Origem
- Doc GowSign § mustReminder, reminderDaysAmount

---

## US-COM-04: Expiracao do Documento

**Persona:** C (Cliente) / O (Operador)

### Historia
Como **operador**, quero **definir prazo de validade do contrato** para que **leases nao fiquem em assinatura indefinidamente**.

### Criterios de Aceite
- [ ] `expirationDate` ISO 8601: documento expira na data
- [ ] Apos expirar, tentativa de assinar bloqueada com mensagem clara
- [ ] Cliente acessando link expirado ve "Contract has expired"
- [ ] Status interno `EXPIRED`, mapeado para `EXPIRED` no UOwn

### Cobertura Origem
- Doc GowSign § expirationDate, § Document Status > EXPIRED

---

## US-COM-05: Sandbox vs Producao

**Persona:** O (Operador) / B (Backend)

### Historia
Como **operador**, quero **testar contratos em ambiente sandbox** sem validade juridica para que **eu valide templates novos sem risco de gerar contrato real**.

### Criterios de Aceite
- [ ] `isSandbox=true`: documento marcado como teste no GowSign
- [ ] Sandbox documents NAO tem validade juridica (watermark/marca visivel)
- [ ] Sandbox NAO conta para limites de uso/cobranca
- [ ] `isSandbox=false` ou ausente: documento real (default)
- [ ] Em ambientes UOwn dev/qa/stg: forcar `isSandbox=true` por config
- [ ] Em ambiente prod UOwn: `isSandbox=false`

### Cobertura Origem
- Doc GowSign § isSandbox

---

## US-COM-06: Idioma do Contrato

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **assinar contrato em ingles** (padrao US) para que **eu entenda o que estou assinando**.

### Criterios de Aceite
- [ ] Templates Strapi e HTML em ingles US
- [ ] Email de assinatura em ingles
- [ ] Suporte futuro a multi-idioma documentado (nao escopo atual)

---

## US-COM-07: Telefone Opcional do Requester

**Persona:** B (Backend)

### Historia
Como **backend**, quero **enviar `phoneNumber` do cliente quando disponivel** para que **GowSign possa fazer SMS de notificacao se aplicavel**.

### Criterios de Aceite
- [ ] `requester.phoneNumber` enviado quando lead tem telefone
- [ ] Format E.164 (ex: `+19071234567`) preferencial
- [ ] Format US (ex: `34999999999`) tambem aceito conforme exemplo Postman
- [ ] Ausencia de telefone NAO bloqueia criacao

### Cobertura Origem
- Doc GowSign § requester.phoneNumber (optional)

---

# EPICO 8: CALLBACKS / WEBHOOKS

## US-CB-01: Callback Custom Retornado em Webhook

**Persona:** B (Backend) / W (Webhook Receiver)

### Historia
Como **backend**, quero **receber meu objeto `callback` original em webhooks pos-assinatura** para que **eu identifique qual lead/contrato/order corresponde sem buscar pelo `documentId`**.

### Criterios de Aceite
- [ ] POST inclui `document.callback = { orderId, customerId, leadPk, ... }`
- [ ] Webhook subsequente entrega `callback` integralmente no payload
- [ ] Tipos preservados (string, number, boolean)
- [ ] Sem limite documentado de tamanho (validar limite real)

### Cobertura Origem
- Doc GowSign § callback (DOCX flow)

---

## US-CB-02: Strapi Enriquece Callback Automaticamente

**Persona:** B (Backend)

### Historia
Como **backend usando fluxo Strapi**, quero **receber metadados de evento no callback** para que **eu possa verificar integridade (hash) e ordem de eventos sem rastrear timestamps localmente**.

### Criterios de Aceite
- [ ] Apos POST Strapi, callback armazenado contem (alem do custom):
  - `event_hash` (SHA-256)
  - `event_time` (ISO 8601 timestamp)
  - `event_type` = `"document_created"`
  - `Meta.related_document_hash` (= documentId)
  - `Provider` = `"GOWSign"`
- [ ] Webhook entrega esses campos junto com callback custom
- [ ] Backend valida `event_hash` em handler de webhook (verificacao de integridade)

### Cobertura Origem
- Doc GowSign § Callback Enrichment (Strapi)

---

## US-CB-03: Idempotencia de Webhook

**Persona:** W (Webhook Receiver)

### Historia
Como **handler de webhook UOwn**, quero **processar o mesmo evento multiplas vezes sem efeito colateral** para que **retries do GowSign nao causem dupla cobranca, dupla atualizacao de status, etc.**

### Criterios de Aceite
- [ ] Webhook recebido com mesmo `documentId` + `event_hash` (ou `event_time`) tratado como idempotente
- [ ] Tabela `uown_esign_event_trigger_log` registra cada recebimento, mas regras de negocio sao aplicadas uma unica vez
- [ ] Eventos fora de ordem (ex: completed antes de loaded) tratados graciosamente

---

## US-CB-04: Falha de Webhook Nao Bloqueia GowSign

**Persona:** B (Backend)

### Historia
Como **backend**, quero **garantir que falha temporaria do meu webhook nao impeca cliente de assinar** para que **uptime do UOwn nao seja prerequisito para uptime do GowSign**.

### Criterios de Aceite
- [ ] Endpoint `/webhook/gowsign` resiliente: 5xx em uma chamada nao reflete em status do documento no GowSign
- [ ] Retry policy do GowSign documentada (assumir N retries com backoff)
- [ ] Reconciliation sweep complementa webhooks: mesmo se webhook for perdido, polling pega mudanca

---

# EPICO 9: VISUALIZACAO (LISTAGEM NO PORTAL)

## US-LST-01: Operador Lista Documentos Paginados

**Persona:** O (Operador)
**Portal:** Origination

### Historia
Como **operador**, quero **listar documentos GowSign com paginacao** para que **eu veja contratos em andamento e finalizados sem carregar a base inteira de uma vez**.

### Criterios de Aceite
- [ ] Endpoint backend UOwn proxy → `GET /api/document?page=N&pageSize=M`
- [ ] Paginacao: `page` default 1, `pageSize` default 10
- [ ] Resposta inclui `meta.pagination = { page, pageSize, total, pageCount }`
- [ ] Portal renderiza lista + controles de paginacao

### Cobertura Origem
- Doc GowSign § List Documents

---

## US-LST-02: Filtro por Status (Single + Multi)

**Persona:** O (Operador)

### Historia
Como **operador**, quero **filtrar por um ou varios status** para que **eu veja "todos OUTSTANDING + SIGNED" sem listar EXPIRED/CANCELED**.

### Criterios de Aceite
- [ ] `?status=OUTSTANDING` filtra por um status
- [ ] `?status=OUTSTANDING&status=SIGNED` filtra por multiplos (OR)
- [ ] Status invalido: comportamento documentado (ignorar ou 400)
- [ ] UI permite seleciona multipla via checkbox

### Cobertura Origem
- Doc GowSign § Query Parameters > status

---

## US-LST-03: Busca por Title ou Email

**Persona:** O (Operador)

### Historia
Como **operador**, quero **buscar contrato por email do cliente ou titulo** para que **eu localize rapido um contrato especifico**.

### Criterios de Aceite
- [ ] `?search=joao.silva@example.com` retorna documentos do email
- [ ] `?search=Rental Agreement` retorna documentos com titulo correspondente
- [ ] Match case-insensitive (validar)
- [ ] Resultado vazio retorna lista vazia (nao 404)

### Cobertura Origem
- Doc GowSign § Query Parameters > search

---

## US-LST-04: Ordenacao por Data

**Persona:** O (Operador)

### Historia
Como **operador**, quero **ordenar por `createdDate` ou `signedDate`** para que **eu priorize contratos antigos sem assinatura ou veja assinados mais recentes**.

### Criterios de Aceite
- [ ] `?orderBy=createdDate:desc` (default)
- [ ] `?orderBy=signedDate:asc` ordena assinados mais antigos primeiro
- [ ] Documentos nao assinados (`signedDate=null`) tratados (final ou inicio da lista, documentar)
- [ ] Direcoes: `asc` e `desc` aceitas

### Cobertura Origem
- Doc GowSign § Query Parameters > orderBy

---

# EPICO 10: TRATAMENTO DE ERROS

## US-ERR-01: Chave de API Invalida (401)

**Persona:** B (Backend)

### Historia
Como **backend**, quero **tratar 401 graciosamente** para que **rotacao de chave ou config errada nao deixe cliente travado sem mensagem util**.

### Criterios de Aceite
- [ ] Request sem header `x-api-key`: 401 `{ error: { type: 401, message: "Missing API key" } }`
- [ ] Header com chave invalida/inativa: 401 `{ error: { type: 401, message: "Invalid or inactive API key" } }`
- [ ] Backend UOwn loga erro e abre alerta operacional (sem expor chave em log)
- [ ] Cliente final ve mensagem amigavel ("Tivemos problema, retente em instantes")

### Cobertura Origem
- Doc GowSign § Authentication Errors

---

## US-ERR-02: IP Nao Permitido (401)

**Persona:** B (Backend)

### Historia
Como **time de seguranca**, quero **validar que apenas IPs allowlisted no GowSign acessem a API** para que **chave vazada de prod nao seja usada de fora da nossa infra**.

### Criterios de Aceite
- [ ] Request de IP nao listado: 401 com mensagem indicativa
- [ ] Allowlist configurada no painel GowSign cobre todos os IPs de saida UOwn (NAT egress)
- [ ] Mudanca de IP de saida (ex: nova region) requer atualizacao previa no GowSign

### Cobertura Origem
- Doc GowSign § Authentication

---

## US-ERR-03: Campo Obrigatorio Ausente (400)

**Persona:** B (Backend)

### Historia
Como **backend**, quero **validar payload antes de enviar** para que **erros de programacao caiam em testes e nao em prod**.

### Criterios de Aceite
- [ ] `requester.name` ausente → 400 com mensagem de validacao
- [ ] `requester.email` ausente → 400
- [ ] DOCX flow: `documentBase64` ausente → 400
- [ ] HTML flow: `customTemplate` ou `customTitle` ausente → 400
- [ ] Strapi flow: `templateId` ou `callback.environment` ausente → 400
- [ ] Mensagem de erro identifica o campo (validar formato real da resposta)

### Cobertura Origem
- Doc GowSign § Error Types > 400 ValidationError

---

## US-ERR-04: Combinacoes Invalidas de Parametros (400)

**Persona:** B (Backend)

### Historia
Como **backend**, quero **respeitar regras de exclusividade dos fluxos** para que **eu nao envie payload ambiguo (ex: DOCX + Strapi)**.

### Criterios de Aceite
- [ ] DOCX + `customTemplate`: rejeitado 400
- [ ] DOCX + `templateId`: rejeitado 400
- [ ] HTML + `documentBase64`: rejeitado 400
- [ ] HTML + `fields[]`: rejeitado 400 ("Fields can only be provided when documentBase64 is present")
- [ ] Strapi + `customTemplate` ou `customTitle`: rejeitado 400
- [ ] Strapi + `documentBase64`: rejeitado 400

### Cobertura Origem
- Doc GowSign § Notes em cada fluxo

---

## US-ERR-05: Width/Height Invalidos em Fields (400)

(Coberto em US-FLD-07)

---

## US-ERR-06: Strapi templateId Inexistente (404)

**Persona:** B (Backend)

### Historia
Como **operador**, quero **detectar quando um templateId esta errado** para que **eu corrija configuracao sem afetar cliente**.

### Criterios de Aceite
- [ ] POST Strapi com `templateId` inexistente: 404 `{ error: { type: 404, message: "Template not found" } }` (ou similar)
- [ ] Backend UOwn loga + alerta
- [ ] Cliente ve mensagem amigavel

### Cobertura Origem
- Doc GowSign § Strapi Error Scenarios > 404

---

## US-ERR-07: Strapi Environment Invalido (500)

**Persona:** B (Backend)

### Historia
Como **backend**, quero **detectar mismatch entre `callback.environment` e ambientes do template Strapi** para que **eu corrija config antes de afetar cliente em massa**.

### Criterios de Aceite
- [ ] `callback.environment` nao corresponde a nenhum env do template: 500 `"Template not available for the requested environment."`
- [ ] Backend pre-valida environment em config antes de enviar (defesa em profundidade)
- [ ] Alerta operacional disparado

### Cobertura Origem
- Doc GowSign § Strapi Error Scenarios

---

## US-ERR-08: Template Strapi Vazio (500)

**Persona:** B (Backend)

### Historia
Como **operador**, quero **ser alertado se template Strapi esta sem conteudo** para que **time de operacoes corrija no CMS antes de afetar mais clientes**.

### Criterios de Aceite
- [ ] Strapi template sem conteudo ou titulo: 500 `"Template content and title are missing."`
- [ ] Alerta tecnico disparado
- [ ] Health check do template no startup do servico (se viavel)

### Cobertura Origem
- Doc GowSign § Strapi Error Scenarios

---

## US-ERR-09: GET com UUID Inexistente (404)

**Persona:** B (Backend) / O (Operador)

### Historia
Como **backend**, quero **tratar `GET /api/document/{uuid}` com UUID errado** para que **portal nao mostre erro 500 generico ao operador**.

### Criterios de Aceite
- [ ] UUID inexistente: 404 `{ error: { type: 404, message: "Document with the given ID not found" } }`
- [ ] UUID malformado: 400 ou 404 (documentar)
- [ ] Portal exibe mensagem amigavel

### Cobertura Origem
- Doc GowSign § Standard API Response Format > error example (404)

---

## US-ERR-10: GowSign Indisponivel (Timeout, 5xx)

**Persona:** C (Cliente) / B (Backend)

### Historia
Como **cliente**, quero **nao ficar travado se GowSign estiver lento ou fora** para que **eu possa tentar novamente em momento posterior sem perder progresso**.

### Criterios de Aceite
- [ ] Timeout de 30s no client HTTP UOwn → erro logado
- [ ] Retry com backoff exponencial (max 3 tentativas)
- [ ] Apos retries falharem, lead permanece em `CONTRACT_CREATED` (nao avanca)
- [ ] Operador alertado via dashboard
- [ ] Cliente final ve mensagem "tente novamente em alguns minutos"

### Cobertura Origem
- Boas praticas de integracao com terceiros

---

## US-ERR-11: Envelope de Erro Padronizado

**Persona:** B (Backend)

### Historia
Como **backend**, quero **parsear o envelope `{ data, meta, error, valid, responseData }` consistentemente** para que **handlers nao precisem de logica diferente por tipo de erro**.

### Criterios de Aceite
- [ ] Toda resposta — sucesso ou erro — tem os 5 campos no root
- [ ] `valid=false` indica falha; `error` populado
- [ ] `valid=true` indica sucesso; `data` populado, `error=null`
- [ ] Parser do client UOwn valida `valid` antes de usar `data`
- [ ] Parser tolerante a `meta`/`responseData` null

### Cobertura Origem
- Doc GowSign § Standard API Response Format

---

## US-ERR-12: Reconciliacao Pos-Falha de Webhook

**Persona:** B (Backend)

### Historia
Como **backend**, quero **detectar contratos que ficaram com status local desatualizado** para que **falha temporaria de webhook seja corrigida pelo proximo polling**.

### Criterios de Aceite
- [ ] Sweep periodica chama `GET /api/document?status=OUTSTANDING&...` para contratos UOwn ainda em `SENT`
- [ ] Para cada documento com status divergente local vs remoto: atualiza local, aplica regras de negocio
- [ ] Sweep registra reconciliations em log para auditoria

---

## US-ERR-13: POST com `expirationDate` no Passado

**Persona:** B (Backend)

### Historia
Como **backend**, quero **detectar `expirationDate` no passado antes de chamar GowSign** para que **eu nao crie documento ja expirado por bug de timezone ou clock skew**.

### Criterios de Aceite
- [ ] Backend valida `expirationDate > NOW()` antes do POST
- [ ] Se passada: 400 ValidationError com mensagem clara, sem chamar GowSign
- [ ] GowSign comportamento se receber expirationDate passada: documentar (rejeicao 400 ou criacao em estado expirado — validar)
- [ ] Tolerancia: `expirationDate` ate 5 minutos no futuro tambem rejeitada (tempo curto demais para cliente assinar)

### Validacao API + DB

**Request Payload** — POST com `document.expirationDate: "2020-01-01T00:00:00Z"` (passado)

**Response** — 400 com `error.type=400, error.message="expirationDate must be in the future"` (esperado do backend UOwn antes de chegar ao GowSign)

**DB State After**
- Nada inserido em `uown_esign_document`
- Linha em `uown_merchant_api_error_log` com `error_type='EXPIRATION_DATE_IN_PAST'`

### Log no Lease
- Lead nao transita; nota WARN: `"Contract creation rejected — expirationDate {iso} in the past"`

### Cobertura Origem
- Edge case ausente da doc GowSign — defesa em profundidade

---

# EPICO 11: SEGURANCA

## US-SEC-01: API Key Nao Exposta em Logs

**Persona:** Time de Seguranca

### Historia
Como **time de seguranca**, quero **garantir que `x-api-key` nunca seja gravada em log** para que **vazamento de logs (CloudWatch, Sentry) nao comprometa credencial**.

### Criterios de Aceite
- [ ] Logs do client HTTP UOwn redigem header `x-api-key` (mask como `***`)
- [ ] Erros propagados nao incluem header
- [ ] Auditoria de logs em qa/stg confirma redacao

### Cobertura Origem
- Project rules `.claude/rules/security.md`

---

## US-SEC-02: documentBase64 Nao Loggado

**Persona:** Time de Seguranca

### Historia
Como **time de seguranca**, quero **garantir que conteudo do contrato (DOCX em base64) nao seja logado** para que **dados sensiveis (PII no contrato) nao vazem via logs**.

### Criterios de Aceite
- [ ] Logger redige campo `documentBase64`, `customTemplate`, `documentVariables` (com PII)
- [ ] Sentry/CloudWatch confirma ausencia em qa
- [ ] Apenas hash/length logada para debug

---

## US-SEC-03: PII no Callback nao Excessivo

**Persona:** Time de Seguranca

### Historia
Como **time de seguranca**, quero **enviar no callback apenas o minimo necessario** (orderId, customerId interno, leadPk) **e nunca SSN, CC, conta bancaria** para que **callback enriquecido pelo Strapi com hash nao exponha PII alem do esperado**.

### Criterios de Aceite
- [ ] `callback` contem apenas IDs internos (orderId, customerId, leadPk, environment)
- [ ] SSN, full CC, full email — NAO em callback
- [ ] Hash dos eventos cobre integridade, mas nao substitui anonimizacao

---

## US-SEC-04: IP Allowlist Atualizada

(Relacionado a US-ERR-02)

### Criterios de Aceite
- [ ] Lista de IPs UOwn registrada com GowSign
- [ ] Mudancas de IP coordenadas previamente
- [ ] Alerta se IP nao listado tentar acesso (visibilidade)

---

## US-SEC-05: Sandbox Isolado de Producao

**Persona:** Time de Seguranca / O (Operador)

### Historia
Como **operador**, quero **ter certeza que dados de teste em sandbox nao misturam com producao** para que **um teste em qa nao afete um cliente real em prod**.

### Criterios de Aceite
- [ ] Chaves GowSign de sandbox e prod separadas
- [ ] Base URLs separadas (`staging.gowsign.com` vs prod URL)
- [ ] Webhook receiver UOwn valida origem por env
- [ ] `isSandbox=true` em ambientes nao-prod (forcado por config)

---

# EPICO 12: CONTEUDO E ACESSO AO DOCUMENTO

> **Gap critico identificado:** o repo automatiza criacao do lease end-to-end, mas **nao valida o conteudo do contrato gerado** contra os valores fornecidos/calculados. Todas as US deste epico endereçam essa lacuna. Aplica-se ao GowSign mas vale para qualquer provedor de e-sign — recomendado extrair para uma camada cross-provider.

## US-DOC-01: Property Price Tag Bate com Calculadora

**Persona:** C (Cliente) / B (Backend)
**Trigger:** Cliente abre contrato apos completar plano de pagamento

### Historia
Como **cliente**, quero **ver no contrato exatamente os valores que a calculadora me mostrou** (Total of Payments, Cost of Rental, Cash Price, Amount of Each Payment, Number of Payments, Rental Period) para que **eu confirme que estou assinando o lease que aceitei e nao surpresa de valor diferente**.

### Criterios de Aceite
- [ ] **TOTAL OF PAYMENTS** no contrato == `paymentDetailsList[idx].totalOfPayments` da API (com tax)
- [ ] **COST OF RENTAL/LEASE** no contrato == `totalOfPayments - cashPrice` (= `leaseCost`)
- [ ] **CASH PRICE** no contrato == soma de items (`itemPrice + deliveryFee` quando aplicavel) sem tax
- [ ] **AMOUNT OF EACH PAYMENT** no contrato == `regularPaymentWithTax` (ou `recurringPayment`) da API
- [ ] **NUMBER OF PAYMENTS** no contrato == `numberOfPayments` da API (= `numberOfPaymentsWithInitialPayment - 1` ou conforme regra)
- [ ] **RENTAL PERIOD / RENEWAL PERIOD** no contrato == `recurringFrequency` da API (WEEKLY / BI-WEEKLY / SEMI-MONTHLY / MONTHLY)
- [ ] Property Price Tag aparece **2 vezes** no contrato (cabecalho + final apos NOTICE TO LESSEE) — ambos valores identicos
- [ ] Validacao matematica: `regularPayment × numberOfPayments == totalOfPayments` (com toleração de centavos por arredondamento)

### Cobertura Origem
- Business rules ch.04 (Calculos Financeiros)
- Doc GowSign § Variables (`totalOfPayments`, `leaseCost`, `cashPrice`, `recurringPayment`, `numberOfPayments`, `recurringFrequency`)
- Property Price Tag legal disclosure (regulamentar US RTO)

---

## US-DOC-02: Dados do LESSEE (Cliente) Conferem com Aplicacao

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **meus dados pessoais corretos no contrato** (nome, endereco, telefone) para que **o contrato seja juridicamente vinculado a mim e nao a outra pessoa**.

### Criterios de Aceite
- [ ] **LESSEE name** == `customerFirstName + ' ' + customerLastName` da aplicacao
- [ ] **LESSEE street address** == `customerStreetAddress` da aplicacao
- [ ] **LESSEE city, state, zip** == `customerCity, customerState customerZip`
- [ ] **LESSEE Telephone** == telefone da aplicacao (formato `(XXX) XXX-XXXX`)
- [ ] Sem typos (acentuacao, abreviacoes incorretas) na renderizacao do template
- [ ] Caracteres especiais escapados corretamente (apostrofo em sobrenomes, virgula em endereco)

### Cobertura Origem
- Doc GowSign § Variable Substitution (variaveis de cliente no Postman example: 30+ campos)

---

## US-DOC-03: Dados do LESSOR Corretos por Estado/Programa

**Persona:** B (Backend) / Compliance

### Historia
Como **time de compliance**, quero **garantir que o LESSOR no contrato corresponda ao estado/programa correto** (Mollie LLC dba Uown vs KW-Choice Alaska LLC para AK, etc.) para que **o contrato seja juridicamente valido conforme regulamentacao estadual**.

### Criterios de Aceite
- [ ] **LESSOR name** == `lessorName` da aplicacao (varia por estado: AK usa "KW-Choice Alaska LLC", maioria usa "Mollie, LLC, dba Uown")
- [ ] **LESSOR address** == `lessorStreetAddress, lessorCity, lessorState lessorZip`
- [ ] **LESSOR phone** == `lessorPhone` (formato regional)
- [ ] **LESSOR email** (quando presente) == `lessorEmailAddress`
- [ ] Para fluxo Strapi: `lessor*` vem do template do estado, **nao** do payload do cliente
- [ ] Para fluxo INSTORE: estado do merchant; ONLINE: estado do cliente (regra `state-tax-EPO`)

### Cobertura Origem
- Business rules ch.03 § Templates por estado
- CLAUDE.md § State → tax + EPO

---

## US-DOC-04: Description of Property Confere com Invoice

**Persona:** C (Cliente) / M (Merchant)

### Historia
Como **cliente**, quero **ver no contrato exatamente os items que comprei** (codigo, descricao, serial number, preco) para que **o contrato cubra os items corretos**.

### Criterios de Aceite
- [ ] Coluna `Item code` == codigo do item da invoice
- [ ] Coluna `Description` == descricao da invoice
- [ ] Coluna `Serial number` (quando aplicavel) == serial da invoice
- [ ] Coluna `Total price` == preco unitario × quantidade
- [ ] **Total Delivery Fee** abaixo da tabela == `deliveryFee` configurado
- [ ] Multi-item: cada linha rendendo corretamente (sem perder itens)
- [ ] Item sem serial number: campo vazio/N/A (sem quebrar layout)

### Cobertura Origem
- Invoice → Contract data flow

---

## US-DOC-05: Breakdown do Initial Payment Bate com Soma

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **ver o breakdown do Initial Payment** (Initial Lease Payment + Processing Fee + Tax = Total Initial Payment) para que **eu confirme cada componente da primeira cobranca**.

### Criterios de Aceite
- [ ] **Initial Lease Payment** == `regularPaymentWithoutTax` (mesmo valor das renovacoes seguintes)
- [ ] **Processing Fee** == `processingFee` (config por estado/programa, ex: $49 CA, $5 default Strapi example)
- [ ] **Tax** == imposto calculado sobre Initial Lease Payment (NAO sobre Processing Fee — validar regra estadual)
- [ ] **Delivery Fee** quando aplicavel (visivel apenas em initial)
- [ ] **Total Initial Payment** == soma exata dos componentes acima (tolerancia $0.01 por arredondamento HALF_EVEN)
- [ ] Para CA: tax pode ser $0 dependendo de regra — validar contra calculadora
- [ ] Initial Payment date == `firstPaymentDate` ou data calculada

### Cobertura Origem
- Business rules ch.04 (Calculos Financeiros) § Signing Fee
- Contrato exemplo: Initial Lease Payment $23.06 + Processing $49 + Tax $0 = $72.06 (CA)

---

## US-DOC-06: EPO Chart Tem N Linhas com Valores Corretos

**Persona:** C (Cliente) / Compliance

### Historia
Como **cliente**, quero **uma tabela com o valor de Early Purchase Option apos cada pagamento** para que **eu saiba exatamente quanto pagar pra quitar antecipado em qualquer momento do contrato**.

### Criterios de Aceite
- [ ] Tabela EPO tem **exatamente `numberOfPayments` linhas** (ex: 56 para 13m WEEKLY, 28 para 13m BI-WEEKLY)
- [ ] Coluna `Payment Number`: 1 a N
- [ ] Coluna `Payment (plus tax)`: linha 1 == `totalInitialPayment`; linhas 2..N == `regularPayment`
- [ ] Coluna `EPO (plus tax)`: linha 1 == `3MonthPayoff` (= `cashPrice + buyoutFee` — payments made = 0); linhas 2..N seguem regra:
  - **Primeiros 3 meses (linhas 2..M onde M = N×3/term):** `cashPrice - 100% × (sum dos pagamentos sem tax e sem fees) + tax`
  - **Apos 3 meses (linhas M+1..N):** `cashPrice × (paymentsRemaining / numberOfPayments) + tax`
  - Rule conforme tipo de estado: CA/NY/HI/WV usam EPO proporcional especifico
- [ ] Linha N: EPO == `regularPayment / 2` aprox. (ultima parcela quase totalmente quitada — valor low residual, ex: $11.12 no exemplo)
- [ ] Salto entre M e M+1 (transicao 3-month → proporcional): valor pula visivelmente (ex: 297 → 478 no exemplo CA, ressalta mudanca de regra)
- [ ] Valores monotonicamente decrescentes apos M+1 (apos transicao)
- [ ] Sem linhas vazias / sem valores duplicados / sem N+1 ou N-1 linhas

### Cobertura Origem
- Business rules ch.04 (Calculos Financeiros) § EPO formula
- CLAUDE.md § State → EPO (CA/NY/HI/WV proporcional)
- Contrato exemplo: 56 linhas, primeiras 13 entre $683-$297, linha 14 salta pra $478, depois desce ate $11.12

---

## US-DOC-07: 3-Month Promotional Payoff Calculado Certo

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **saber o valor exato do payoff promocional dos primeiros 3 meses** para que **eu decida se vale a pena pagar a vista nos primeiros 3 meses**.

### Criterios de Aceite
- [ ] **3-Month Promotional Payoff** valor == `cashPrice + buyoutFee - sum(rentalPaymentsMade) + tax`
- [ ] Calculo na linha 1 (zero pagamentos): `cashPrice + buyoutFee + tax` (ex: $574 + $60 = $634 + tax)
- [ ] **BuyOut Fee** valor declarado em "Early Purchase Options" == config (ex: $60)
- [ ] **3-Month-Promotional-Payoff-Option expires on** == `Initial Payment Date + 90 dias` (ou regra exata)
- [ ] Texto: "If the Property requires delivery, we will extend... from the date of delivery"
- [ ] Telefone para acionar: `(877)357-5474` (config de contato)

### Cobertura Origem
- Contrato exemplo: "$683.00, including tax" + "BuyOut Fee of $60.00"

---

## US-DOC-08: ACH Grid com Frequencias Disponiveis Bate com Termo

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **ver no grid ACH as opcoes de frequencia disponiveis** (Weekly N×$X / Bi-Weekly N/2×$2X) **com o mesmo Total Cost** para que **eu confirme que a frequencia escolhida nao muda meu custo total**.

### Criterios de Aceite
- [ ] Grid mostra **todas as frequencias allowedFrequencies** do merchant (Weekly, Bi-Weekly, Semi-Monthly, Monthly) — nao apenas a escolhida
- [ ] Para cada frequencia: `Number of payments`, `Payment Amount`, `Payment Frequency`, `Total Cost` corretos
- [ ] **Total Cost** identico em todas linhas: `weeklyN × weeklyPay == biweeklyN × biweeklyPay == semimonthlyN × ... == monthlyN × ...`
- [ ] Linha da frequencia escolhida tem **iniciais do cliente** marcadas (ex: "SG"), demais nao
- [ ] Footnote `*` ressalta sales tax incluido
- [ ] Footnote `**` ressalta application/delivery fee incluidos
- [ ] Para merchant com unica frequencia: grid pode ter 1 linha (validar)
- [ ] Para merchant com 2 termos (13m/16m): cada linha mostra termo correto

### Cobertura Origem
- Business rules § Allowed frequencies por merchant
- Contrato exemplo: Weekly 56×$23.06=$1340.50 / Bi-Weekly 28×$46.12=$1340.50

---

## US-DOC-09: Datas no Contrato Conferem com Aplicacao

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **datas corretas no contrato** (Agreement Number, Date, First Payment Date, Promo Expiration Date) para que **eu saiba quando comeca, quando paga e ate quando posso pegar o desconto promocional**.

### Criterios de Aceite
- [ ] **Agreement Number** formato `UOWN_<random>_<leadPk>` (ex: `UOWN_21107_15704`)
- [ ] **Account number** == `leadPk` (ex: `15704`)
- [ ] **Date** (top do contrato) == data de geracao do contrato (formato `MM/DD/YYYY`)
- [ ] **Initial Lease Payment due date** == `firstPaymentDate` (default: primeira segunda-feira apos delivery, ou conforme config merchant)
- [ ] **3-Month-Promotional-Payoff-Option expires on** == `Initial Payment Date + 90 dias`
- [ ] **Beginning [date], you can buy the Property** (apos 3 meses) == `expiration + 1 dia`
- [ ] Datas formatadas conforme locale US (`MM/DD/YYYY`)
- [ ] Timezone: usar timezone do estado do cliente ou UTC documentado

### Cobertura Origem
- Business rules ch.03 § Numero do contrato `UOWN_<random>_<leadPk>`
- Contrato exemplo: "UOWN_21107_15704", "Account: 15704", "Date: 04/27/2026", "due on 05/03/2026", "expires on 07/26/2026"

---

## US-DOC-10: Template de Contrato Correto por Estado

**Persona:** Compliance / B (Backend)

### Historia
Como **time de compliance**, quero **garantir que cada estado renderize o template legal correto** (CA, NY, FL, TX, etc.) para que **o contrato cumpra a regulamentacao RTO especifica do estado**.

### Criterios de Aceite
- [ ] Header do contrato indica estado: `CONSUMER LEASE-PURCHASE AGREEMENT-CA` (sufixo do estado)
- [ ] Clausulas state-specific aparecem (ou nao) conforme estado:
  - **CA**: Reinstatement clause (10 dias / 1 ano)
  - **CA**: Income Interruption Rights (clause 11)
  - **CA**: California Civil Code references quando aplicavel
  - **NY**: NY-specific tax language
  - **HI**: HI-specific disclosures
  - **WV**: WV-specific disclosures
- [ ] Estados bloqueados (NJ, VT, MN, ME): contrato **NAO** gerado (regra `stateCheck`)
- [ ] Telefone/email de contato corretos por estado quando diferentes
- [ ] Footer identifica template version (auditoria de mudancas)
- [ ] Strapi flow: cada combinacao estado+programa resolve para template correto

### Cobertura Origem
- Business rules ch.03 § Template selecionado por estado
- CLAUDE.md § State → tax (CA/NY/HI/WV) e blocked states (NJ/VT/MN/ME)

---

## US-DOC-11: Fees Adicionais e Footnotes Corretos

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **ver claramente todas as taxas adicionais** (returned payment, late fee, processing, delivery) com valores e regras para que **eu saiba o que pode ser cobrado alem das parcelas**.

### Criterios de Aceite
- [ ] **Returned Payment Charge** valor == config (ex: $25.00)
- [ ] **Late Fee** rule == "lesser of 5% of payment or $5, but at least $2" (ou regra do estado)
- [ ] **Late Fee** janela == "7 days if monthly, 3 days if more often" (ou config)
- [ ] **Processing Fee** declaracao reflete o valor cobrado em Initial Payment
- [ ] **Delivery Fee** declaracao reflete o valor cobrado quando aplicavel
- [ ] Notice to Lessee (NOTICE TO LESSEE box) com texto regulamentar exato
- [ ] Texto de Income Interruption Rights consistente com regulacao
- [ ] Texto de Arbitration Clause completo (clausula 19)
- [ ] Texto de Consumer Reports clause completo (clausula 17)

### Cobertura Origem
- Contrato exemplo: clausula 7 (Other Charges), clausula 11 (Income Interruption), clausula 19 (Arbitration)

---

## US-DOC-12: Validacao Cruzada API ↔ Contrato

**Persona:** B (Backend)

### Historia
Como **automacao de teste**, quero **comparar valores de `paymentDetailsList` (API) com valores extraidos do PDF do contrato** para que **qualquer divergencia entre calculo do backend e renderizacao seja capturada antes de chegar ao cliente**.

### Criterios de Aceite
- [ ] Helper `extractContractValues(pdfBuffer)` retorna objeto tipado: `{ totalOfPayments, costOfRental, cashPrice, paymentAmount, numberOfPayments, rentalPeriod, initialPayment, processingFee, deliveryFee, tax, totalInitialPayment, agreementNumber, lesseeName, lessorName, epoChart, threeMonthPayoff, promoExpirationDate }`
- [ ] Helper aceita PDF do `pdfUrl` GowSign (ou equivalente Signwell)
- [ ] Lib de extracao: `pdf-parse` ou `pdfjs-dist` (avaliar trade-offs — `pdf-parse` mais simples, `pdfjs-dist` melhor estrutura)
- [ ] Cada campo extraido e comparado com valor da API (`paymentDetailsList[idx]`)
- [ ] Tolerancia configuravel para arredondamento (`±$0.01`)
- [ ] Falha no extract NAO derruba o teste — registra como warning + falha assertion especifica
- [ ] Helper compartilhado entre Signwell, PandaDoc e GowSign (cross-provider)

### Cobertura Origem
- Gap identificado em exploracao do repo (sem `pdf-parse` no `package.json`, sem `extractContractValues` em helpers)

---

## US-DOC-13: Cliente Baixa o Contrato pelo Botao Download

**Persona:** C (Cliente)
**Trigger:** Cliente clica botao "Download" exibido no contrato (durante visualizacao ou apos assinatura)

### Historia
Como **cliente**, quero **baixar o contrato em PDF a qualquer momento** (antes ou depois de assinar) para que **eu tenha copia local para arquivamento, leitura offline ou compartilhamento com advogado/familiar**.

### Criterios de Aceite

**Antes da assinatura (status `OUTSTANDING`)**:
- [ ] Botao "Download" visivel no contrato (durante visualizacao)
- [ ] Clique baixa PDF nao-assinado (com marca/watermark "DRAFT" ou sem assinatura preenchida)
- [ ] Filename sugestivo: `contract-{agreementNumber}.pdf` ou `lease-purchase-agreement-{leadPk}.pdf`
- [ ] Content-Type: `application/pdf`
- [ ] PDF abre corretamente em readers (Adobe, Preview, Chrome)
- [ ] Tamanho razoavel (< 2 MB para contrato tipico de 20 paginas sem images grandes)

**Depois da assinatura (status `SIGNED` / `COMPLETED`)**:
- [ ] Botao "Download" continua visivel
- [ ] Clique baixa PDF **assinado** com:
  - Assinatura visual nas posicoes corretas
  - Iniciais nas posicoes corretas
  - Data preenchida
  - Audit trail anexado (se `pdfStatus = AUDIT_TRAIL_GENERATED`)
- [ ] Filename muda para `signed-contract-{agreementNumber}.pdf` (sugerido)
- [ ] Hash do PDF baixado == `signedPdfHash` retornado pelo GET Document

**Embed mode (iframe)**:
- [ ] Botao "Download" funciona dentro do iframe sem quebrar postMessage
- [ ] Download dispara em nova aba/janela (nao redireciona o iframe)
- [ ] Eventos `loaded`/`completed` continuam sendo enviados normalmente

**Acesso pos-assinatura via portal/email**:
- [ ] Email de confirmacao apos `completed` inclui link de download
- [ ] Cliente acessando o link `data.url` ou `data.pdfUrl` apos assinatura ve botao Download
- [ ] Operador no Origination portal tambem consegue baixar (com permissao)
- [ ] Tentativa de download de documento `EXPIRED` ou `CANCELED`: PDF retornado com marca de status (ou bloqueado, conforme regra)

**Seguranca e auditoria**:
- [ ] Download requer URL com token (acesso autorizado, nao publico aberto)
- [ ] Download de outro cliente (UUID adivinhado) bloqueado por token de sessao
- [ ] Cada download registrado em audit log (`uown_esign_event_trigger_log` ou tabela dedicada): timestamp, IP, user-agent
- [ ] Download multiplo permitido (sem rate limit excessivo)

### Cobertura Origem
- Doc GowSign § Get Document > `pdfUrl` (only present for DOCX flow after PDF conversion)
- Doc GowSign § Field `signedPdfHash`, `createdPdfHash` (integridade)
- Gap: Signwell/PandaDoc atual NAO tem teste automatizado de download — extrair para padrao cross-provider

---

## US-DOC-14: Audit Trail Anexado ao PDF Final

**Persona:** O (Operador) / Compliance

### Historia
Como **time de compliance**, quero **garantir que o PDF final (apos `COMPLETED`) tenha audit trail anexado** com IP, geo, dispositivo, timestamps de cada evento para que **a assinatura tenha valor legal em caso de disputa**.

### Criterios de Aceite
- [ ] Apos `pdfStatus = AUDIT_TRAIL_GENERATED`, download retorna PDF com pagina(s) de audit trail
- [ ] Audit trail contem:
  - Document ID (`data.id`)
  - Created date / Signed date
  - Requester info (name, email, IP, user-agent)
  - Eventos: `loaded` (timestamp), `completed` (timestamp)
  - Geo location (se coletada via `Metadata.geoLocation`)
  - Device info (`Metadata.deviceInfo`)
  - Hash do PDF assinado (`signedPdfHash`)
- [ ] Hash em audit trail bate com `signedPdfHash` da API
- [ ] PDF antes de `AUDIT_TRAIL_GENERATED`: download retorna PDF assinado **sem** audit trail (ou com indicacao "in progress")

### Cobertura Origem
- Doc GowSign § pdfStatus > AUDIT_TRAIL_*, § Metadata field

---

## US-DOC-15: Geolocalizacao e Device Fingerprint Capturados no Audit Trail

**Persona:** Compliance / O (Operador)

### Historia
Como **time de compliance**, quero **que cada documento assinado tenha geolocation e device fingerprint do signatario capturados** para que **disputas de identidade tenham evidencia robusta de quem assinou, de onde e em qual dispositivo**.

### Criterios de Aceite
- [ ] Apos `loaded` event, GowSign captura via `Metadata`:
  - `clientName` (primeiro/ultimo nome)
  - `email` (do recipient)
  - `userDateTime` (timestamp da abertura)
  - `deviceInfo` (browser, OS, screen size)
  - `geoLocation` (lat/long via IP geolocation, ou GPS se concedido)
  - `ipAddress` (IP de origem)
- [ ] Audit trail (US-DOC-14) renderiza esses campos em pagina dedicada
- [ ] `Metadata` retornado em `GET /api/document/{id}` apos assinatura
- [ ] Se cliente recusar geolocation no browser: campo nulo, mas IP geolocation usada como fallback
- [ ] Privacidade: geolocation precisa de consentimento implicito (ja coberto em T&C); UE/Calif. exigem disclosure

### Validacao API + DB

**Request Payload** — N/A (capturado pelo iframe GowSign)

**Response** — `GET /api/document/{id}` retorna `data.Metadata: { clientName, email, userDateTime, deviceInfo, geoLocation, ipAddress }`

**DB State After**
- `uown_esign_document.metadata` (JSONB ou colunas dedicadas) populado apos signed
- Validacao: SELECT campos do Metadata retorna nao-null apos `SIGNED`
- Audit trail no PDF final: regex/OCR do PDF detecta linhas com IP/geo/device

### Log no Lease
- `uown_los_lead_notes`: `"Signature metadata captured — IP={ip}, geo={city, state}, device={browser/OS}"` (mascarar parcialmente o IP em logs publicos)
- `uown_esign_event_trigger_log`: 1 linha `esign_event='METADATA_CAPTURED'`

### Cobertura Origem
- Doc GowSign § Get Document > `Metadata` field

---

# EPICO 13: STATUS DO LEASE EM CADA ACAO DA ASSINATURA

> Toda US deste epico cumpre o **Padrao Comum: Validacao de Log no Lease** acima. Cada acao do fluxo de assinatura e cross-checked contra o status do lead/contrato e a trilha de log no DB UOwn — sem confianca cega no estado retornado pela API GowSign.

## Tabela de Acoes vs Status (Master Reference)

| # | Acao da Assinatura | Status GowSign | Status Lease (UOwn) | Status Contrato | Linha em status_history? | Linha em event_log? | Nota? |
|---|--------------------|----------------|---------------------|-----------------|--------------------------|---------------------|-------|
| 1 | Pre-criacao do contrato | (n/a) | `CC_AUTH_PASSED` | (n/a) | nao | nao | nao |
| 2 | POST cria documento | `CREATED` | `CONTRACT_CREATED` | `SENT` | sim (CC_AUTH_PASSED→CONTRACT_CREATED) | sim (`CREATED`) | sim |
| 3 | PDF gerado (`pdfStatus=CREATED_GENERATED`) | `OUTSTANDING` | `CONTRACT_CREATED` | `SENT` | nao | sim (`OUTSTANDING`) | nao |
| 4 | Iframe abre + `loaded` event | `OUTSTANDING` (VIEWED interno) | `CONTRACT_CREATED` | `SENT` | nao | sim (`VIEWED`/`LOADED`) | opcional |
| 5 | Cliente interage com fields | `OUTSTANDING` | `CONTRACT_CREATED` | `SENT` | nao | nao (UI-only) | nao |
| 6 | `completed` event recebido | `SIGNED` → `COMPLETED` | `SIGNED` | `SIGNED` | sim (CONTRACT_CREATED→SIGNED) | sim (`COMPLETED`) | sim |
| 7 | Auto-move FUNDING (merchant flag) | `COMPLETED` | `FUNDING` | `SIGNED` | sim (SIGNED→FUNDING) | nao (transicao interna) | sim |
| 8 | `closed` event (DECLINED) | `CANCELED` | `CONTRACT_CREATED` (sem regressao) | `CANCELLED` | nao | sim (`CLOSED`) | sim |
| 9 | `error` event | (mantido) | `CONTRACT_CREATED` | `ERROR` | nao | sim (`ERROR`) | sim |
| 10 | `close-iframe` event | (sem mudanca) | (sem mudanca) | (sem mudanca) | nao | sim (`CLOSE_IFRAME`) | nao |
| 11 | `EXPIRED` (expirationDate atingida) | `EXPIRED` | `CONTRACT_CREATED` | `EXPIRED` | nao | sim (`EXPIRED`) | sim |
| 12 | Reconciliation sweep detecta divergencia | (varia) | (corrige se necessario) | (corrige) | sim se divergente | sim (`RECONCILED`) | sim |

> **Regra geral:** lease so transita para `SIGNED` no evento 6 (`completed`); todos os outros eventos do iframe sao logados mas nao mexem status do lease.

---

## US-LSE-01: Pre-condicao — Lease em CC_AUTH_PASSED Antes de Criar Contrato

**Persona:** B (Backend)
**Trigger:** Sistema decide criar contrato GowSign

### Historia
Como **backend**, quero **garantir que o lease esta em `CC_AUTH_PASSED` (ou `CONTRACT_CREATED` para retry)** antes de chamar `POST /api/document` para que **contratos nao sejam criados para leases em estados invalidos** (`UW_DENIED`, `SIGNING_FEE_DENIED`, `SIGNED`, `FUNDED`, `SETTLED_IN_FULL`).

### Criterios de Aceite
- [ ] Backend valida `lead.status IN ('CC_AUTH_PASSED', 'CONTRACT_CREATED')` antes do POST
- [ ] Lead em status invalido: rejeicao com erro `INVALID_LEAD_STATUS_FOR_CONTRACT`, sem chamar GowSign
- [ ] Lead em `SIGNED`: erro `Invalid lead status Contract Signed` (regra existente — Task #1240)
- [ ] Lead em `SIGNING_FEE_DENIED`: erro especifico, contrato nao criado

### Log no Lease
- [ ] Tentativa rejeitada **NAO** gera linha em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` (sem transicao)
- [ ] Erro registrado em `uown_merchant_api_error_log` com `error_type`, `lead_pk`, `attempted_action='CREATE_CONTRACT_GOWSIGN'`
- [ ] Nota em `uown_los_lead_notes` para troubleshooting do operador

---

## US-LSE-02: Lease Transita para CONTRACT_CREATED Apos POST de Criacao

**Persona:** B (Backend)
**Trigger:** POST `/api/document` retorna 200 com `data.id`

### Historia
Como **backend**, quero **transicionar lease para `CONTRACT_CREATED`** assim que o GowSign aceita o documento para que **portais Origination/Servicing reflitam que ha um contrato ativo aguardando assinatura**.

### Criterios de Aceite
- [ ] `data.status = "CREATED"` da resposta GowSign
- [ ] Lead transita: `CC_AUTH_PASSED` → `CONTRACT_CREATED`
- [ ] Transicao na **mesma transacao DB** que insere `uown_esign_document` e `uown_los_contract`
- [ ] Falha apos POST aceito (ex: DB down): documento orfao no GowSign — registrar para reconciliation
- [ ] Em retry (lease ja em `CONTRACT_CREATED`): novo contrato criado, antigos cancelados (US-CRE-07), lease permanece em `CONTRACT_CREATED`

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 1 linha `from_status=CC_AUTH_PASSED, to_status=CONTRACT_CREATED, source='GOWSIGN_CONTRACT_CREATED', change_date=NOW()`
- [ ] **`uown_los_lead_notes`**: `"Contract created via GowSign — documentId={uuid}, mode={DOCX|HTML|STRAPI}"`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='CREATED', esign_doc_pk={pk}, received_at=NOW()`
- [ ] **`uown_esign_document`**: `status='CREATED', document_key={uuid}, esign_client='GOWSIGN', esign_mode={...}`
- [ ] **`uown_los_contract`**: `status='SENT', esign_document_pk={pk}, esign_mode='GOWSIGN'`

---

## US-LSE-03: Lease Permanece em CONTRACT_CREATED Apos PDF Gerado

**Persona:** B (Backend)
**Trigger:** Polling `GET /api/document/{id}` detecta `status=OUTSTANDING` + `pdfStatus=CREATED_GENERATED`

### Historia
Como **backend**, quero **NAO transicionar o lease quando o PDF terminar de ser gerado** (apenas atualizar estado do documento) para que **a maquina de estados do lead reflita exclusivamente intencao do cliente, nao detalhes de processamento backend**.

### Criterios de Aceite
- [ ] Documento transita `CREATED` → `OUTSTANDING`
- [ ] Lead **permanece** em `CONTRACT_CREATED` (sem nova linha em status_history)
- [ ] Email de assinatura enviado quando `OUTSTANDING` (se `sendSignatureEmail=true`)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (regressao explicita: ausencia e o aceite)
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='OUTSTANDING'`
- [ ] **`uown_esign_document.status='OUTSTANDING'`, `pdf_status='CREATED_GENERATED'`**
- [ ] **`uown_los_lead_notes`**: opcional, ex: `"Document ready for signing — link sent to customer"`

---

## US-LSE-04: Lease Permanece Inalterado Apos Evento `loaded`

**Persona:** B (Backend) / C (Cliente)
**Trigger:** Cliente abre iframe, `postMessage({type: 'loaded', documentId})`

### Historia
Como **backend**, quero **registrar que o cliente abriu o contrato sem mover o lease** para que **eu saiba que o cliente engajou (proxy de funil) sem indicar erroneamente que ele assinou**.

### Criterios de Aceite
- [ ] Evento `loaded` capturado pelo frontend e enviado ao backend (REST + DB)
- [ ] Lead **permanece** em `CONTRACT_CREATED`
- [ ] Documento marcado internamente como `VIEWED` (subestado de OUTSTANDING)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='LOADED'` (ou `VIEWED`), `received_at=NOW()`
- [ ] **`uown_los_lead_notes`**: opcional, ex: `"Customer opened contract iframe at {timestamp}"`
- [ ] **`uown_esign_document.last_update_date`** atualizada
- [ ] Multiplos `loaded` no mesmo documento: cada um registra event_log (auditoria de re-aberturas), lead nao muda

---

## US-LSE-05: Interacao com Fields NAO Move Status do Lease

**Persona:** C (Cliente) / B (Backend)
**Trigger:** Cliente clica em campo, desenha assinatura, marca checkbox, etc.

### Historia
Como **backend**, quero **garantir que interacoes intermediarias com campos (clicar, desenhar, digitar) nao movam status do lease** para que **somente a finalizacao explicita (`completed` event) seja o gatilho de transicao**.

### Criterios de Aceite
- [ ] Provedor pode disparar webhooks intermediarios (ex: `field_filled`) — backend UOwn ignora para fins de transicao
- [ ] Lead **permanece** em `CONTRACT_CREATED`
- [ ] Documento **permanece** em `OUTSTANDING`
- [ ] Mesmo se cliente preencher 95% dos fields e fechar, lease nao transita (ate `completed`)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais
- [ ] **`uown_esign_event_trigger_log`**: linhas opcionais para eventos intermediarios (auditoria de comportamento), tipo `esign_event='FIELD_INTERACTION'`
- [ ] **`uown_los_lead_notes`**: nada (evita ruido)

---

## US-LSE-06: Lease Transita para SIGNED Apos Evento `completed`

**Persona:** C (Cliente) / B (Backend)
**Trigger:** Cliente finaliza assinatura, `postMessage({type: 'completed', documentId})` recebido

### Historia
Como **backend**, quero **transicionar lease para `SIGNED`** assim que receber o evento `completed` para que **a cadeia pos-assinatura (signing fee, plano protecao, redirect, Confetes, FUNDING) seja desbloqueada imediatamente**.

### Criterios de Aceite
- [ ] Evento `completed` recebido via postMessage **OU** webhook (qualquer um vence)
- [ ] Backend valida que `documentId` corresponde a um documento em `OUTSTANDING` (rejeitar se nao)
- [ ] Lead transita: `CONTRACT_CREATED` → `SIGNED`
- [ ] Documento transita: `OUTSTANDING` → `SIGNED` (depois `COMPLETED` quando audit trail pronto)
- [ ] Contrato UOwn transita: `SENT` → `SIGNED`
- [ ] `doc_signed_time_stamp` populado em `uown_esign_document` e `uown_los_contract`
- [ ] `base64signed_document_string IS NOT NULL (flag — sem hash, so blob)` salvo
- [ ] CC Peek consent extraido (US-POST-07)
- [ ] Plano protecao iniciado assincronamente (US-POST-05)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 1 linha `from_status=CONTRACT_CREATED, to_status=SIGNED, source='GOWSIGN_COMPLETED_EVENT', change_date=NOW()`
- [ ] **`uown_los_lead_notes`**: `"Contract signed via GowSign — documentId={uuid}, signedAt={iso}, signedPdfHash={hash[:8]}..."`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='COMPLETED', esign_doc_pk={pk}, source='POSTMESSAGE'|'WEBHOOK'`
- [ ] **`uown_esign_document`**: `status='SIGNED'`, `doc_signed_time_stamp={iso}`, `base64signed_document_string IS NOT NULL (flag — sem hash, so blob)={hash}`, `pdf_status='SIGNED_PENDING'`→`SIGNED_GENERATED`
- [ ] **`uown_los_contract`**: `status='SIGNED'`, `doc_signed_time_stamp={iso}`

---

## US-LSE-07: Auto-Move SIGNED → FUNDING Loga Transicao Encadeada

**Persona:** B (Backend)
**Trigger:** Apos SIGNED, merchant tem `isSignedToFunding=true`

### Historia
Como **backend**, quero **encadear a transicao SIGNED → FUNDING** apos assinatura (para merchants configurados) com **rastro auditavel separado** para que **suporte distinga "cliente assinou" de "lease entrou em funding" mesmo ocorrendo no mesmo segundo**.

### Criterios de Aceite
- [ ] Apos transicao para `SIGNED`, backend verifica `merchant.isSignedToFunding`
- [ ] Se `true`: nova transicao `SIGNED` → `FUNDING` (assincrona ou sincrona conforme merchant ref code/client type — ch.03)
- [ ] Se `false`: lead permanece em `SIGNED`
- [ ] Falha na transicao para FUNDING **nao reverte** SIGNED (compensacao via reconciliation)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: **2 linhas** (CONTRACT_CREATED→SIGNED + SIGNED→FUNDING) — nao colapsadas em 1
- [ ] Linha 2: `source='AUTO_FUNDING_AFTER_SIGN', change_date >= linha1.change_date`
- [ ] **`uown_los_lead_notes`**: 2 notas separadas: `"Contract signed..."` + `"Auto-moved to FUNDING (merchant isSignedToFunding=true)"`
- [ ] **`uown_esign_event_trigger_log`**: nao recebe linha adicional (transicao interna, nao evento de e-sign)

---

## US-LSE-08: Lease Permanece em CONTRACT_CREATED Apos Evento `closed` (DECLINED)

**Persona:** C (Cliente) / B (Backend)
**Trigger:** Cliente fecha iframe sem assinar, `postMessage({type: 'closed', documentId})`

### Historia
Como **backend**, quero **registrar a desistencia do cliente sem regredir o lease** para que **o cliente possa receber novo link de contrato (retentativa) sem precisar refazer a aplicacao toda**.

### Criterios de Aceite
- [ ] Evento `closed` capturado
- [ ] Documento transita: `OUTSTANDING` → `CANCELED`
- [ ] Contrato UOwn: `SENT` → `CANCELLED`
- [ ] Lead **permanece** em `CONTRACT_CREATED` (regra explicita — ate retentativa ou expiracao do lead)
- [ ] Cliente redirecionado para `merchantRedirectUrl?event=canceled&ata={uuid}`
- [ ] Novo contrato pode ser criado em retry sem bloqueio

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease nao mudou)
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='CLOSED'`
- [ ] **`uown_los_lead_notes`**: `"Customer declined contract via GowSign — documentId={uuid}, action=closed_without_signing"`
- [ ] **`uown_esign_document.status='CANCELED'`, `cancelled_date=NOW()`**
- [ ] **`uown_los_contract.status='CANCELLED'`, `cancelled_date=NOW()`**

---

## US-LSE-09: Lease Permanece Apos Evento `error` (com Alerta Operacional)

**Persona:** C (Cliente) / O (Operador)
**Trigger:** Erro critico no iframe, `postMessage({type: 'error', documentId, error})`

### Historia
Como **operador**, quero **ver alerta quando um cliente teve erro durante assinatura** para que **eu intervenha (reenviar contrato, ligar para cliente) sem deixar lease congelado**.

### Criterios de Aceite
- [ ] Evento `error` capturado com `error.message`
- [ ] Documento status: pode permanecer `OUTSTANDING` (cliente pode tentar de novo) ou marcar com `error` flag interno
- [ ] Lead **permanece** em `CONTRACT_CREATED`
- [ ] Alerta operacional disparado (dashboard / Slack / email para ops)
- [ ] Cliente ve mensagem amigavel para retentativa

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='ERROR'`, `error_message={msg sanitizada sem PII}`
- [ ] **`uown_los_lead_notes`**: `"E-sign error — documentId={uuid}, message='{msg}'. Customer may retry."` (severidade WARN)
- [ ] **`uown_merchant_api_error_log`** ou tabela equivalente recebe linha para alerta

---

## US-LSE-10: Evento `close-iframe` e Apenas UI (Sem Mudanca de Lease)

**Persona:** B (Frontend)
**Trigger:** Frontend recebe `postMessage({type: 'close-iframe'})`

### Historia
Como **frontend**, quero **registrar a intencao de fechar o iframe sem afetar o lease** para que **auditoria de UX seja preservada (reliability event) sem ruido em status_history**.

### Criterios de Aceite
- [ ] Frontend remove iframe do DOM
- [ ] Lead **permanece** em qualquer status (geralmente apos `completed` ou `closed`, mas pode chegar antes)
- [ ] Evento e idempotente: receber 2x nao causa duplo cleanup

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='CLOSE_IFRAME'` (auditoria de UX)
- [ ] **`uown_los_lead_notes`**: nada

---

## US-LSE-11: Documento EXPIRED Durante Espera de Assinatura

**Persona:** B (Backend) / C (Cliente)
**Trigger:** Sweep ou polling detecta `status=EXPIRED` em documento que estava `OUTSTANDING`

### Historia
Como **backend**, quero **marcar contrato como expirado quando GowSign expira** sem mover lease para SIGNED para que **leases nao avancem por engano e operador veja claramente que precisa criar novo contrato**.

### Criterios de Aceite
- [ ] `expirationDate` definida na criacao
- [ ] Apos a data, GowSign retorna `status=EXPIRED` no GET
- [ ] Tentativa do cliente de assinar apos expirar: bloqueada com mensagem clara
- [ ] Documento UOwn: `OUTSTANDING` → `EXPIRED`
- [ ] Contrato UOwn: `SENT` → `EXPIRED`
- [ ] Lead **permanece** em `CONTRACT_CREATED` (ou transita para `CANCELLED_EXPIRED` se config)
- [ ] Novo contrato pode ser criado para o mesmo lead

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 ou 1 linha (depende de regra para `CANCELLED_EXPIRED`)
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='EXPIRED', source='RECONCILIATION_SWEEP'|'GOWSIGN_WEBHOOK'`
- [ ] **`uown_los_lead_notes`**: `"Contract expired (expirationDate={iso}) without signing — documentId={uuid}"`
- [ ] **`uown_esign_document.status='EXPIRED'`**
- [ ] **`uown_los_contract.status='EXPIRED'`, `expired_date=NOW()`**

---

## US-LSE-12: Idempotencia — `completed` Recebido 2x Nao Move Lease 2x

**Persona:** B (Backend)
**Trigger:** GowSign envia evento `completed` via postMessage E webhook (ou retry de webhook)

### Historia
Como **backend**, quero **garantir que mesmo evento recebido por 2 canais (postMessage + webhook) ou em retry produza apenas 1 transicao do lease** para que **lead nao receba 2 linhas de history identicas e cadeia pos-assinatura nao execute em duplicata**.

### Criterios de Aceite
- [ ] Detector de idempotencia: chave `(documentId, event_type)` ou `event_hash`
- [ ] 1a chamada: processa transicao + cadeia pos-assinatura
- [ ] 2a chamada (mesma chave): retorna 200 OK sem efeito colateral
- [ ] CC Peek nao capturado 2x; protection plan nao iniciado 2x; email de confirmacao nao enviado 2x

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: **exatamente 1 linha** `CONTRACT_CREATED→SIGNED` (nao 2)
- [ ] **`uown_los_lead_notes`**: 1 nota `"Contract signed via GowSign..."`
- [ ] **`uown_esign_event_trigger_log`**: 2 linhas `esign_event='COMPLETED'` (auditoria mostra que o evento chegou 2x), mas com flag `is_duplicate=true` na 2a OU dedup explicito
- [ ] **Validacao**: `SELECT COUNT(*) FROM uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y') WHERE lead_pk=? AND to_status='SIGNED'` == 1

---

## US-LSE-13: Race Condition — postMessage Antes de Webhook (ou Vice-Versa)

**Persona:** B (Backend)
**Trigger:** postMessage chega no t=100ms, webhook chega no t=300ms (ou inverso)

### Historia
Como **backend**, quero **garantir que dois canais concorrentes nao causem corrupcao de estado** para que **mesmo com race entre postMessage rapido e webhook lento (ou rede lenta), o lease termine no estado correto**.

### Criterios de Aceite
- [ ] Lock distribuido (DB row lock, Redis lock, ou advisory lock por `documentId`) ao processar evento
- [ ] 1o que adquire lock processa transicao
- [ ] 2o que tenta apos lock liberado detecta idempotencia e retorna sem efeito
- [ ] Sem deadlock se lock em ordem consistente
- [ ] Timeout de lock razoavel (ex: 5s) com retry

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 1 linha (mesmo invariante de US-LSE-12)
- [ ] **`uown_esign_event_trigger_log`**: 2 linhas com `received_at` diferentes — auditoria mostra ordem real de chegada
- [ ] **`uown_los_lead_notes`**: 1 nota
- [ ] Stress test: rodar 100 pares (postMessage + webhook) em paralelo, validar que 100 leads tem exatamente 1 linha de SIGNED em history cada

---

## US-LSE-14: Reversal Protection — Lease em SIGNED/FUNDING Nao Regride por `closed` Tardio

**Persona:** B (Backend)
**Trigger:** Cliente assinou (status=SIGNED), depois (cenario raro) iframe envia `closed` por bug ou retry

### Historia
Como **backend**, quero **proteger lease ja em status terminal contra eventos posteriores que tentem regredir** para que **bug do provedor ou ataque nao desfaca uma assinatura valida**.

### Criterios de Aceite
- [ ] Antes de processar evento, backend valida status atual do lease
- [ ] Lease em `SIGNED`/`FUNDING`/`FUNDED`/`SETTLED`: evento `closed`/`error` posterior **logado mas ignorado para fins de transicao**
- [ ] Documento ja em `SIGNED`: webhook `closed` posterior nao reverte para `CANCELED`
- [ ] Operador alertado (anomalia)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (sem regressao)
- [ ] **`uown_esign_event_trigger_log`**: 1 linha com flag `was_ignored=true, ignore_reason='LEAD_TERMINAL_STATE'`
- [ ] **`uown_los_lead_notes`**: `"WARNING: received '{event_type}' event for already-{status} lead — ignored. documentId={uuid}"`
- [ ] **Validacao**: `SELECT to_status FROM uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y') WHERE lead_pk=? ORDER BY change_date DESC LIMIT 1` retorna SIGNED/FUNDING (nao alterado)

---

## US-LSE-15: Cancelamento em Cascata Nao Regride Lease Assinado

**Persona:** B (Backend)
**Trigger:** Operador (raro) ou retry cria novo contrato para um lead ja em SIGNED

### Historia
Como **backend**, quero **bloquear criacao de novo contrato para lead ja em SIGNED** ou, se permitido (caso de excecao), garantir que cancelamento dos antigos nao regrida o lease para que **historia de assinatura permaneca consistente**.

### Criterios de Aceite
- [ ] Tentativa de criar novo contrato com lease em `SIGNED` ou alem: rejeitada com `INVALID_LEAD_STATUS_FOR_CONTRACT`
- [ ] Se config permite (excecao operacional): lease nao regride; novos contratos criam paralelo (raro), antigos cancelados em cascata mantem historia

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 0 linhas adicionais (lease permanece SIGNED)
- [ ] **`uown_los_lead_notes`**: `"Attempted contract recreation rejected — lead already SIGNED"` ou (em excecao autorizada) `"Operator forced new contract — old contracts cancelled, lead remains SIGNED"`
- [ ] Auditoria de operador: identidade de quem forcou a excecao

---

## US-LSE-16: Reconciliacao Detecta Divergencia Local vs Remoto

**Persona:** B (Backend)
**Trigger:** Sweep periodico chama `GET /api/document?status=OUTSTANDING&...` para contratos UOwn em `SENT`

### Historia
Como **backend**, quero **detectar e corrigir divergencias entre status local UOwn e remoto GowSign** para que **falha temporaria de webhook ou postMessage seja recuperada sem intervencao manual**.

### Criterios de Aceite
- [ ] Sweep diario (ou mais frequente em prod) compara `uown_esign_document.status` com GowSign `GET /api/document/{id}.status`
- [ ] Divergencias detectadas:
  - Local `OUTSTANDING` + Remoto `SIGNED` → reconciliar para SIGNED + transicionar lease
  - Local `OUTSTANDING` + Remoto `EXPIRED` → reconciliar para EXPIRED
  - Local `OUTSTANDING` + Remoto `CANCELED` → reconciliar para CANCELLED
- [ ] Reconciliation aplica mesma logica de transicao que evento real (US-LSE-06, LSE-08, LSE-11) com `source='RECONCILIATION_SWEEP'`
- [ ] Sweep nao re-aplica regras se status ja consistentes (evita loops)

### Log no Lease
- [ ] **`uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`**: 1 linha **se** divergencia exigia transicao (ex: SIGNED reconciliado), com `source='RECONCILIATION_SWEEP'`
- [ ] **`uown_los_lead_notes`**: `"Reconciliation detected status divergence — local=OUTSTANDING, remote=SIGNED. Applied SIGNED transition."`
- [ ] **`uown_esign_event_trigger_log`**: 1 linha `esign_event='RECONCILED', source='SWEEP'`
- [ ] **Metrica**: contador de reconciliations por dia (alerta se subir — indica falha de webhook)

---

# Matriz de Rastreabilidade — Requisitos Originais → US

## Documentacao GowSign (API)

| Secao | Cobertura |
|-------|-----------|
| Authentication | ERR-01, ERR-02, SEC-01, SEC-04 |
| Standard API Response Format | ERR-11 |
| Create Document - DOCX Flow | CRE-01, FLD-01..09 |
| Create Document - HTML Flow | CRE-02, FLD-05 |
| Create Document - Strapi Flow | CRE-03, ERR-06, ERR-07, ERR-08, CB-02 |
| Optional Parameters | CRE-06, COM-01..05 |
| Get Document | LCY-02, LCY-09, ERR-09 |
| List Documents | LST-01..04 |
| Document Status (6 valores) | LCY-01..06, LCY-08 |
| pdfStatus (6 valores) | LCY-07 |
| Signature Fields > Field Types (3) | FLD-01..04 |
| Signature Fields > Properties (term, type, required, signer, width, height, group) | FLD-01..09 |
| Inline Fields HTML (sig, initials, date, text, radio, checkbox, table) | FLD-05, CRE-05 |
| Variable Substitution | CRE-04 |
| Callback Enrichment (Strapi) | CB-02 |
| Error Types (400/401/404/500) | ERR-01..09 |

## Documentacao Embed (postMessage)

| Evento | Cobertura |
|--------|-----------|
| `loaded` | EMB-02 |
| `completed` | EMB-03 |
| `closed` | EMB-04 |
| `error` | EMB-05 |
| `close-iframe` | EMB-06 |
| iframe + embedMode | EMB-01 |
| Validacao de origin | EMB-07 |

## Tarefa GitLab — Business Requirements

| Requisito | Cobertura |
|-----------|-----------|
| Implement integration with GowSign | EPICOS 2-5 |
| Follow technical specifications | EPICOS 2-3, 7 |
| Use GowSign as new contract signature solution | CUT-01 |
| Replace Signwell | CUT-01, CUT-02 (validacao do resultado — coexistencia sem cross-talk) |
| Ensure contract signing flow continues to function | EMB-08, LCY-08, POST-01..08 |

## Business Rules Internas (UOwn)

| Regra | Cobertura |
|-------|-----------|
| State Machine (CONTRACT_CREATED → SIGNED) | POST-01 |
| Auto-Move FUNDING (isSignedToFunding) | POST-02 |
| Auto-detect provider (3s × 12 polling) | EMB-08, CUT-02 |
| Mapeamento Status E-sign → Contrato | LCY-08 |
| URL de Redirect (SVC_URL > redirect.base.url > merchantRedirectUrl) | POST-03 |
| Tela de Confetes | POST-04 |
| Plano de Protecao BW13 (Buddy iframe — cliente escolhe) | POST-05 |
| Plano de Protecao pre-selecionado pelo merchant (sem Buddy) | CRE-09, EMB-09, POST-09 |
| Roteamento por estado feito pelo backend (testar so resultado) | CUT-01 (validar `uown_esign_document.esign_client` apos criacao) |
| Cancelamento de Contratos Anteriores | CRE-07 |
| CC Peek consent extraction | POST-07 |
| Signing Fee | POST-08 |
| Calculos Financeiros (ch.04) — totalOfPayments / costOfRental / EPO | DOC-01, DOC-06, DOC-07 |
| Templates por estado / state-tax-EPO | DOC-03, DOC-10 |
| Numero do contrato `UOWN_<random>_<leadPk>` | DOC-09 |
| Property Price Tag (regulamentar RTO) | DOC-01 |
| Allowed frequencies por merchant | DOC-08 |
| pdfUrl / signedPdfHash | DOC-13, DOC-14 |

---

# EPICO 14: OPERACOES MERCHANT + OPERADOR NO PORTAL

## US-OPS-01: Merchant Submete Aplicacao Que Dispara Criacao de Contrato

**Persona:** M (Merchant)
**Trigger:** Merchant submete aplicacao no portal merchant ou via API

### Historia
Como **merchant**, quero **submeter aplicacao do meu cliente** para que **o backend UOwn dispare automaticamente a criacao do contrato GowSign apos UW + CC auth aprovados**.

### Criterios de Aceite
- [ ] Merchant submete aplicacao via portal ou API
- [ ] Pipeline UOwn executa (UW → SSN → CC auth)
- [ ] Apos `CC_AUTH_PASSED`, sistema chama POST GowSign automaticamente (sem acao adicional do merchant)
- [ ] Merchant nao precisa conhecer GowSign — abstracao completa
- [ ] Resposta com `providerURL` para o merchant compartilhar com cliente

### Validacao API + DB
- **Request Payload** — POST `/api/application` (UOwn) com SSN, address, items, etc.
- **Response** — 200 com `creditLimit`, `providerURL`, `paymentDetailsList`
- **DB State After**: vide US-LSE-02 (cadeia desde criacao)
- **Log no Lease** — vide US-LSE-01 + US-LSE-02

### Cobertura Origem
- Business rules ch.02 § Originacao Pipeline

---

## US-OPS-02: Merchant Visualiza Status do Contrato no Portal

**Persona:** M (Merchant)

### Historia
Como **merchant**, quero **ver status do contrato dos meus clientes no portal merchant** para que **eu acompanhe se o cliente assinou e posso preparar a entrega**.

### Criterios de Aceite
- [ ] Portal merchant exibe lista de aplicacoes com status (`SENT`, `SIGNED`, `EXPIRED`, `CANCELLED`)
- [ ] Status atualiza em ate 30s apos transicao (polling ou push)
- [ ] Merchant ve apenas seus contratos (multi-tenancy)
- [ ] Filtros: por status, por cliente (nome/email), por data range
- [ ] Notificacao visual quando contrato muda para `SIGNED`

### Validacao API + DB
- **Request Payload** — GET `/api/merchant/{id}/contracts?status=...&...` (UOwn endpoint)
- **Response** — 200 com array de contratos; cada item tem `id`, `status`, `customer`, `createdDate`, `signedDate`
- **DB State After** — read-only; query com `WHERE merchant_pk = ?` para isolamento
- **Log no Lease** — N/A (operacao read-only)

### Cobertura Origem
- Gap de visibilidade do merchant identificado

---

## US-OPS-03: Merchant Cancela Contrato Manualmente

**Persona:** M (Merchant)

### Historia
Como **merchant**, quero **cancelar contrato pendente** se o cliente desistiu ou eu errei algo no envio para que **lead nao fique preso e novo contrato possa ser criado**.

### Criterios de Aceite
- [ ] Botao "Cancel Contract" no portal merchant para contratos em `SENT`
- [ ] Confirmacao antes de cancelar (modal)
- [ ] Apos cancelar: contrato → `CANCELLED`, lead permanece em `CONTRACT_CREATED`
- [ ] GowSign documento: cancelado via API (se endpoint disponivel) ou marcado localmente como abandonado
- [ ] Cliente acessando link cancelado ve "This contract was cancelled by the merchant"
- [ ] Cancelamento pos-`SIGNED` bloqueado (US-LSE-14)

### Validacao API + DB
- **Request Payload** — POST `/api/contract/{id}/cancel` (UOwn) com `reason`, `cancelled_by_merchant=true`
- **Response** — 200 OK; ou 409 se contrato ja signed
- **DB State After**:
  - `uown_los_contract.status='CANCELLED'`, `cancelled_date=NOW()`, `cancelled_by_user_pk={merchant_user_pk}`
  - `uown_esign_document.status='CANCELED'`
- **Log no Lease**:
  - 0 linhas em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` (lease permanece)
  - Nota: `"Contract cancelled by merchant — operator={user_id}, reason={reason}"`
  - Evento `CANCELLED_BY_MERCHANT` em `uown_esign_event_trigger_log`

### Cobertura Origem
- Gap de gestao do merchant

---

## US-OPS-04: Merchant Recebe Notificacao Quando Cliente Assina

**Persona:** M (Merchant)

### Historia
Como **merchant**, quero **receber notificacao automatica** quando meu cliente assinar para que **eu prepare entrega/agendamento sem ficar verificando portal**.

### Criterios de Aceite
- [ ] Email enviado ao merchant config (`merchant.notification_email`) apos `completed`
- [ ] Email contem: nome cliente, ID contrato, valor lease, link para portal merchant
- [ ] Webhook para merchant URL (se config presente): POST `merchant.webhook_url` com payload do evento
- [ ] Falha de notificacao nao reverte assinatura (best-effort)

### Validacao API + DB
- **Request Payload** — N/A (notificacao saiente do UOwn para o merchant)
- **Response** — N/A
- **DB State After**:
  - `uown_correspondence_logs` (ou similar) registra envio: `recipient={merchant_email}`, `type='CONTRACT_SIGNED_NOTIFICATION'`, `status='SENT'|'FAILED'`
- **Log no Lease**:
  - Nota: `"Merchant notified of contract signing — channel=email/webhook, status=SENT"`

### Cobertura Origem
- Gap de notificacao identificado

---

## US-OPS-05: Operador Reenvia Link de Assinatura ao Cliente

**Persona:** O (Operador UOwn)
**Trigger:** Cliente liga dizendo que perdeu/nao recebeu o email com o link

### Historia
Como **operador**, quero **reenviar email com link de assinatura para o cliente** sem precisar criar novo contrato para que **suporte resolva caso comum (cliente perdeu email) em segundos**.

### Criterios de Aceite
- [ ] Botao "Resend Email" no portal Origination para contratos em `SENT`/`OUTSTANDING`
- [ ] Opcao de mudar email do destinatario (cliente forneceu novo)
- [ ] Email reenviado via GowSign (chamada API se disponivel) ou via UOwn como fallback
- [ ] Limite de N reenvios por dia (anti-abuse)
- [ ] Auditoria: quem reenviou, quando

### Validacao API + DB
- **Request Payload** — POST `/api/contract/{id}/resend-email` (UOwn) com `new_email?` (opcional)
- **Response** — 200 OK
- **DB State After**:
  - `uown_correspondence_logs`: nova linha `type='SIGNATURE_LINK_RESENT'`, `recipient={email}`, `sent_by_user_pk={operator_pk}`
  - Counter de reenvios incrementado em `uown_los_lead.resend_count` (ou similar)
- **Log no Lease**:
  - Nota: `"Signature email resent by operator {user_id} to {email} (resend #{N})"`
  - Evento `EMAIL_RESENT` em `uown_esign_event_trigger_log`

### Cobertura Origem
- Gap operacional comum

---

## US-OPS-06: Operador Cancela Contrato Manualmente (Sem Cascata)

**Persona:** O (Operador)

### Historia
Como **operador**, quero **cancelar contrato manualmente** (fraude detectada, erro de origem) **sem disparar criacao de novo contrato** para que **eu interrompa um lease problematico cirurgicamente**.

### Criterios de Aceite
- [ ] Operador acessa contrato no portal e clica "Cancel" com motivo obrigatorio
- [ ] Confirmacao com 2-fator (PIN ou re-login) — operacao destrutiva
- [ ] Lead transita para `CANCELLED_BY_OPERATOR` (status novo) ou permanece em `CONTRACT_CREATED` conforme regra
- [ ] Cliente acessando link ve mensagem com motivo (ou generica "Contract was cancelled — contact support")
- [ ] Bloqueio de cancelamento de contratos `SIGNED` (US-LSE-14)

### Validacao API + DB
- **Request Payload** — POST `/api/contract/{id}/operator-cancel` com `reason` (obrig.), `confirm_pin`
- **Response** — 200 OK; 403 se sem permissao; 409 se signed
- **DB State After**:
  - `uown_los_contract.status='CANCELLED'`, `cancelled_by_user_pk={operator_pk}`, `cancellation_reason={reason}`
  - Lead status conforme regra (configurar)
- **Log no Lease**:
  - Linha em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')` se lease transita
  - Nota detalhada: `"Contract cancelled manually by operator {user_id} — reason: {reason}"` (severidade INFO ou WARN)
  - Evento `CANCELLED_BY_OPERATOR` em `uown_esign_event_trigger_log`

### Cobertura Origem
- Gap de operacao ad hoc

---

## US-OPS-07: Operador Corrige Dados Antes de Enviar Contrato

**Persona:** O (Operador)
**Trigger:** Operador detecta typo no endereco/nome/email apos lead criado mas antes do contrato

### Historia
Como **operador**, quero **corrigir dados** (nome, endereco, email) **antes do contrato GowSign ser criado** para que **typos nao gerem contrato com dados errados que precisam ser refeitos**.

### Criterios de Aceite
- [ ] Edicao permitida apenas se lead em `CC_AUTH_PASSED` ou anterior (antes do contrato)
- [ ] Campos editaveis: `customerFirstName`, `customerLastName`, `customerStreetAddress`, `customerCity`, `customerState`, `customerZip`, `email`, `phoneNumber`
- [ ] SSN nao editavel (compliance)
- [ ] Apos edicao, contrato e gerado com dados atualizados
- [ ] Audit log: campo antigo → novo, operador, timestamp

### Validacao API + DB
- **Request Payload** — PATCH `/api/lead/{id}` com `{ field: oldValue → newValue }`
- **Response** — 200 com lead atualizado
- **DB State After**:
  - `uown_los_lead` colunas atualizadas
  - `uown_los_lead_notes` (recomendar) com `field`, `old_value`, `new_value`, `changed_by`, `changed_at`
- **Log no Lease**:
  - Nota: `"Operator {user_id} updated {field} from '{old}' to '{new}'"`

### Cobertura Origem
- Gap de correcao operacional pre-contrato

---

## US-OPS-08: Operador Filtra Documentos por Merchant

**Persona:** O (Operador)

### Historia
Como **operador**, quero **filtrar lista de documentos por merchant** para que **eu investigue problemas de um merchant especifico (ex: alta taxa de declined)**.

### Criterios de Aceite
- [ ] Query param `?merchant_pk=N` ou `?merchant_code={code}` na lista
- [ ] Resultado filtra apenas contratos do merchant
- [ ] Combinavel com filtros existentes (status, search, orderBy)

### Validacao API + DB
- **Request Payload** — GET `/api/document?merchant_pk=42&status=OUTSTANDING`
- **Response** — 200 com lista filtrada
- **DB State After** — N/A (read-only); SQL JOIN entre `uown_esign_document` e `uown_los_lead.merchant_pk`
- **Log no Lease** — N/A

### Cobertura Origem
- Doc GowSign § List Documents (estende US-LST-02)

---

## US-OPS-09: Operador Filtra por Estado e Data Range

**Persona:** O (Operador)

### Historia
Como **operador**, quero **filtrar por estado e janela de datas** para que **eu monitore volumes por jurisdicao e periodos de pico**.

### Criterios de Aceite
- [ ] Query params `?state=CA&created_after=2026-04-01&created_before=2026-04-30`
- [ ] Combinavel com outros filtros
- [ ] Datas em ISO 8601
- [ ] State case-insensitive

### Validacao API + DB
- **Request Payload** — GET com filtros
- **Response** — 200 com lista filtrada
- **DB State After** — N/A
- **Log no Lease** — N/A

### Cobertura Origem
- Estende US-LST-02

---

## US-OPS-10: Operador Exporta Lista de Documentos (CSV)

**Persona:** O (Operador)

### Historia
Como **operador**, quero **exportar lista de documentos em CSV/Excel** para que **eu produza relatorios e analise em planilhas externas**.

### Criterios de Aceite
- [ ] Botao "Export" no portal Origination
- [ ] Filtros aplicados na lista refletem no CSV exportado
- [ ] CSV inclui: `documentId`, `customer_name`, `email`, `state`, `merchant`, `status`, `created_date`, `doc_signed_time_stamp`, `total_payments`, `cash_price`
- [ ] CSV nao expoe SSN ou CC completo
- [ ] Limite de 10k linhas por export (paginar com filtros)
- [ ] Audit log: quem exportou, quando, filtros aplicados

### Validacao API + DB
- **Request Payload** — GET `/api/document/export?format=csv&...filters` (UOwn)
- **Response** — 200 com `Content-Type: text/csv`, `Content-Disposition: attachment; filename=...`
- **DB State After**:
  - `uown_los_lead_notes`: `action='DOCUMENT_LIST_EXPORTED'`, `user_pk={operator}`, `filters_json={...}`, `row_count={N}`
- **Log no Lease** — N/A (operacao agregada, nao por lease)

### Cobertura Origem
- Gap de relatorio operacional

---

## US-OPS-11: Operador Distingue Sandbox de Producao

**Persona:** O (Operador)

### Historia
Como **operador**, quero **distinguir contratos sandbox (teste) de producao na lista** para que **eu nao confunda dados de teste com clientes reais**.

### Criterios de Aceite
- [ ] Coluna ou badge `[SANDBOX]` vermelho para `isSandbox=true`
- [ ] Filtro `?include_sandbox=true|false` (default: false em portal prod, true em qa)
- [ ] Sandbox documents nao contam em metricas operacionais
- [ ] Em prod portal: sandbox so visivel com permissao especial

### Validacao API + DB
- **Request Payload** — GET `/api/document?include_sandbox=true`
- **Response** — 200 com lista filtrada
- **DB State After** — N/A
- **Log no Lease** — N/A

### Cobertura Origem
- Estende US-COM-05

---

## US-OPS-12: Customer Service Busca Contrato por SSN ou Telefone

**Persona:** O (Operador / Customer Service)

### Historia
Como **agente de Customer Service**, quero **buscar contrato pelo SSN ou telefone do cliente** (alem de email) para que **eu localize cliente que liga sem ter ID a mao**.

### Criterios de Aceite
- [ ] Query param `?search_by=ssn&search={ssn}` (4 ultimos digitos OU completo conforme permissao)
- [ ] Query param `?search_by=phone&search={phone}` (formatos US aceitos)
- [ ] SSN completo: requer permissao especial (PII access)
- [ ] Match exato no SSN, fuzzy no phone (com/sem mascara)
- [ ] Audit log de toda busca por PII

### Validacao API + DB
- **Request Payload** — GET com `search_by` + `search`
- **Response** — 200 com lista (geralmente 1-2 leads)
- **DB State After**:
  - `uown_los_lead_notes`: `action='PII_SEARCH'`, `field='ssn'|'phone'`, `user_pk={cs_user}`, `query_hash={sha}` (nao o valor cru)
- **Log no Lease** — N/A (busca, nao mexe lease)

### Cobertura Origem
- Gap de Customer Service identificado

---

# EPICO 15: RECOVERY E RESILIENCIA DO CLIENTE

## US-RES-01: Cliente Perde Conexao Durante Assinatura

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **continuar de onde parei se perder conexao** durante a assinatura para que **eu nao precise refazer tudo ao reconectar**.

### Criterios de Aceite
- [ ] Frontend GowSign detecta offline (event `offline` do navigator)
- [ ] Banner visivel: "You're offline — your progress is saved"
- [ ] Reconexao automatica detecta `online`, sincroniza estado com servidor
- [ ] Campos preenchidos NAO sao perdidos (cache local OU server-side autosave)
- [ ] Se `completed` foi enviado no momento da queda: idempotencia garante que ao reconectar nao duplica (US-LSE-12)
- [ ] Timeout de 5 min offline: documento fica em estado seguro, cliente pode reabrir do email

### Validacao API + DB
- **Request Payload** — N/A (frontend behavior)
- **Response** — N/A
- **DB State After** — depende do momento; se `completed` foi recebido, vide US-LSE-06
- **Log no Lease**:
  - Evento `CONNECTION_LOST` em `uown_esign_event_trigger_log` (se frontend reportar)
  - Evento `CONNECTION_RESTORED` apos reconectar

### Cobertura Origem
- UX comum em fintech mobile

---

## US-RES-02: Cliente Fecha Browser Sem Assinar (Link Continua Valido)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **fechar o browser e voltar mais tarde** sem perder o link para que **eu termine quando puder, sem o link expirar imediatamente**.

### Criterios de Aceite
- [ ] Fechar browser sem assinar **NAO** dispara `closed` (apenas se cliente clicou "Close document")
- [ ] Link permanece valido ate `expirationDate` (config) ou `OUTSTANDING` virar `EXPIRED`/`CANCELED`
- [ ] Reabrir o link no mesmo ou outro browser: pre-visualizacao mostra status atual
- [ ] Se cliente havia preenchido fields: comportamento documentado (perde progresso ou retoma — validar com GowSign)

### Validacao API + DB
- **Request Payload** — N/A
- **Response** — N/A
- **DB State After**:
  - `uown_esign_document.status='OUTSTANDING'` permanece
  - 0 transicoes em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`
- **Log no Lease**:
  - Nenhum evento gerado por fechar browser (sem signal explicito)
  - Quando cliente reabre: novo `LOADED` em `uown_esign_event_trigger_log` (US-LSE-04)

### Cobertura Origem
- UX padrao

---

## US-RES-03: Cliente Acessa Link Expirado e Solicita Novo

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **solicitar novo link** se o atual expirou para que **eu nao perca a aprovacao por demora**.

### Criterios de Aceite
- [ ] Acessar link `EXPIRED` mostra mensagem clara + botao "Request new link"
- [ ] Botao envia email para suporte ou cria ticket automatico
- [ ] Ou: redireciona para tela onde cliente confirma email + envia pedido
- [ ] Operador recebe notificacao para criar novo contrato
- [ ] Limite anti-abuse: max N pedidos por hora por SSN

### Validacao API + DB
- **Request Payload** — POST `/api/document/{id}/request-renewal` com `email` (auto-validado)
- **Response** — 200 com mensagem "Request received, you'll receive a new link soon"
- **DB State After**:
  - `[TBD: registrar em uown_los_lead_notes com substring 'Renewal requested']` (ou tabela equivalente): linha com `lead_pk`, `requested_at`, `requester_email`
- **Log no Lease**:
  - Nota: `"Customer requested new contract link — original document {uuid} was EXPIRED"`
  - Evento `RENEWAL_REQUESTED`

### Cobertura Origem
- Gap UX

---

## US-RES-04: Cliente Re-Acessa Contrato Ja Assinado (Read-Only)

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **acessar meu contrato assinado a qualquer momento** para que **eu consulte termos sem precisar pedir copia ao suporte**.

### Criterios de Aceite
- [ ] Link permanece valido apos `SIGNED`/`COMPLETED`
- [ ] Modo read-only: assinaturas visiveis, sem campos editaveis, sem botao Start
- [ ] Botao Download ativo e baixa PDF assinado (US-DOC-13)
- [ ] Tempo de retencao: pelo menos 30 dias apos signing (alinhar com retention policy US-LEG-01)
- [ ] Apos retencao expirar: mensagem "Contract no longer available — contact support"

### Validacao API + DB
- **Request Payload** — GET URL do documento (mesma de antes)
- **Response** — pagina renderiza em modo readonly
- **DB State After**:
  - 0 mudancas em `uown_esign_document` (re-acesso nao muda status)
  - `uown_esign_event_trigger_log`: 1 linha `esign_event='REACCESSED_AFTER_SIGN'`
- **Log no Lease**:
  - Nota opcional: `"Customer re-accessed signed contract at {timestamp}"`

### Cobertura Origem
- UX padrao + compliance (cliente tem direito a acesso)

---

## US-RES-05: Cliente Faz Download Multiplas Vezes Sem Corrupcao

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **baixar o contrato varias vezes** sem que arquivos diferentes sejam gerados ou corrompidos para que **eu tenha copias identicas e confiaveis**.

### Criterios de Aceite
- [ ] Cada download retorna o **mesmo PDF byte-a-byte** (mesmo SHA-256)
- [ ] Sem rate limit razoavel (10/min ok, 1000/min bloqueado)
- [ ] Hash do download bate com `signedPdfHash` retornado pela API
- [ ] Filename consistente entre downloads
- [ ] Audit log de cada download

### Validacao API + DB
- **Request Payload** — GET URL de download (multiplas vezes)
- **Response** — 200 com mesmo conteudo cada vez; `ETag` ou hash header consistente
- **DB State After**:
  - `uown_esign_event_trigger_log`: N linhas `esign_event='DOWNLOAD'` (1 por download)
- **Log no Lease**:
  - Notas opcionais (alta cardinalidade — talvez agregar): `"Contract downloaded {N} times today"` em sweep diario

### Cobertura Origem
- Estende US-DOC-13

---

## US-RES-06: Cliente Em 2 Dispositivos Simultaneamente

**Persona:** C (Cliente)
**Trigger:** Cliente abre link no celular E no laptop ao mesmo tempo

### Historia
Como **cliente**, quero **abrir o contrato em dois dispositivos** sem que um cancele o outro para que **eu possa comparar ou trocar de dispositivo no meio do processo**.

### Criterios de Aceite
- [ ] Multiplas sessoes podem coexistir em modo de leitura
- [ ] Se ambas tentam clicar Start: lock no primeiro que clica; segundo recebe mensagem "Already started in another session"
- [ ] Se cliente assina em um: outro detecta (polling ou postMessage cross-tab) e atualiza para read-only
- [ ] Sem corrupcao de fields (ambos preenchidos diferente — qual prevalece? Lock por sessao)

### Validacao API + DB
- **Request Payload** — GET URL de cada sessao
- **Response** — 200 em ambas; segunda tentativa de Start: 409 ou mensagem
- **DB State After**:
  - `uown_esign_event_trigger_log`: 2 linhas `LOADED` (1 por sessao); 1 linha `STARTED` (apenas da que ganhou lock)
- **Log no Lease**:
  - Auditoria de IPs/devices distintos no mesmo documento

### Cobertura Origem
- Gap UX multi-device

---

## US-RES-07: Browser Support Matrix (referencia US-EMB-11)

Vide **US-EMB-11** — coberto la.

---

# EPICO 16: ACESSIBILIDADE E MULTI-DISPOSITIVO

## US-ACC-01: Conformidade WCAG (Screen Reader e Contraste)

**Persona:** C (Cliente com deficiencia visual)

### Historia
Como **cliente com deficiencia visual usando screen reader**, quero **navegar e assinar contrato** para que **eu nao seja excluido do servico (ADA compliance)**.

### Criterios de Aceite
- [ ] WCAG 2.1 nivel AA conformidade
- [ ] Todos botoes com `aria-label` ou texto descritivo
- [ ] Imagens com `alt` text significativo
- [ ] Contraste de cor minimo 4.5:1 para texto normal, 3:1 para grande
- [ ] Status badge nao depende **apenas** de cor (vide A.3 — adicionar `data-status` recomendado)
- [ ] Teste com NVDA/JAWS/VoiceOver — fluxo completo navegavel
- [ ] Erros de validacao sao anunciados (`role="alert"`)

### Validacao API + DB
- **Request Payload** — N/A
- **Response** — N/A (validar HTML output via axe-core ou Lighthouse)
- **DB State After** — N/A
- **Log no Lease** — N/A

### Cobertura Origem
- ADA / WCAG 2.1 AA

---

## US-ACC-02: Fluxo Completo em Mobile

**Persona:** C (Cliente em smartphone)

### Historia
Como **cliente em smartphone**, quero **completar todo o fluxo de assinatura no celular** para que **eu nao precise de desktop para assinar**.

### Criterios de Aceite
- [ ] Layout responsivo: < 768px reorganiza header, esconde colunas (HTML mostra `max-md:hidden`)
- [ ] Toggle "Reading mode" (HTML do header) funcional em mobile (renderiza scroll continuo vs paginas)
- [ ] Botoes Start/Download/Close acessiveis com toque (min 44x44px touch target)
- [ ] Assinatura via touch funciona (canvas drawing)
- [ ] iOS Safari + Android Chrome: testar
- [ ] postMessage funciona em iframe mobile

### Validacao API + DB
- **Request Payload** — N/A (UI)
- **Response** — N/A
- **DB State After** — Lead/Document igual ao fluxo desktop
- **Log no Lease**:
  - `uown_esign_event_trigger_log.user_agent` distingue mobile (`Mobile`/`Android`/`iPhone` no UA)

### Cobertura Origem
- UX padrao + HTML do GowSign suporta mobile

---

## US-ACC-03: Print do Contrato

**Persona:** C (Cliente)

### Historia
Como **cliente**, quero **imprimir o contrato** (antes ou depois de assinar) para que **eu tenha copia fisica para arquivamento**.

### Criterios de Aceite
- [ ] HTML do GowSign tem classes `print:hidden` em elementos UI (header, botoes) — confirmado no HTML fornecido
- [ ] `Ctrl+P` (browser native) gera print sem header/botoes/UI clutter
- [ ] Conteudo do contrato preserva formatacao em print
- [ ] EPO chart cabe em paginas (sem corte mid-row)
- [ ] LESSOR/LESSEE table renderiza identico em print

### Validacao API + DB
- **Request Payload** — N/A
- **Response** — N/A (CSS print media query)
- **DB State After** — N/A
- **Log no Lease** — N/A

### Cobertura Origem
- HTML observado tem `print:hidden` widespread

---

## US-ACC-04: Navegacao por Teclado (Keyboard-Only)

**Persona:** C (Cliente sem mouse)

### Historia
Como **cliente que usa apenas teclado** (deficiencia motora ou preferencia), quero **navegar e assinar todo o fluxo via Tab/Enter** para que **eu nao dependa de mouse/touch**.

### Criterios de Aceite
- [ ] Tab order logico (header → metadados → conteudo → fields → botao Submit)
- [ ] Foco visivel (outline) em todos elementos interativos
- [ ] Enter ativa botoes (Start, Download, Close, Submit)
- [ ] Space marca/desmarca checkboxes
- [ ] Arrow keys em radio buttons
- [ ] Escape fecha modais
- [ ] Sem keyboard traps

### Validacao API + DB
- **Request Payload** — N/A
- **Response** — N/A
- **DB State After** — N/A
- **Log no Lease** — N/A

### Cobertura Origem
- WCAG 2.1.1 (Keyboard) + 2.1.2 (No Keyboard Trap)

---

## US-ACC-05: Internacionalizacao para Hispanohablantes

**Persona:** C (Cliente que so fala Espanhol)

### Historia
Como **cliente hispanohablante** em estado com populacao hispana grande (CA, TX, FL), quero **assinar contrato em Espanhol** para que **eu compreenda termos legais antes de assinar**.

### Criterios de Aceite
- [ ] Suporte a `Accept-Language: es` ou parametro `?lang=es` na URL
- [ ] Templates Strapi tem versao ES (ou fallback EN se nao disponivel)
- [ ] Email de assinatura tambem em ES
- [ ] UI do widget GowSign em ES (se GowSign suportar) ou EN com label ES nos botoes principais
- [ ] Disclosures legais state-specific traduzidos por advogado (compliance)
- [ ] Detecao automatica via browser locale ou opcao explicita

### Validacao API + DB
- **Request Payload** — POST GowSign com `document.locale: 'es'` ou `templateId` da versao ES
- **Response** — 200; `data.url` com `?lang=es`
- **DB State After**:
  - `uown_esign_document.locale='es'`
- **Log no Lease**:
  - Nota: `"Contract created in Spanish (locale=es) for state {state}"`

### Cobertura Origem
- Mercado US Hispano

---

## US-ACC-06: Acessibilidade da Assinatura (Cliente com Deficiencia Motora)

**Persona:** C (Cliente com deficiencia motora)

### Historia
Como **cliente com deficiencia motora** que dificulta desenhar assinatura no canvas, quero **alternativas de captura de assinatura** para que **eu tambem possa assinar (compliance ADA)**.

### Criterios de Aceite
- [ ] Opcao "Type your signature" (digitar nome + fonte cursiva) alem de desenho
- [ ] Opcao "Upload signature image" (PNG transparente)
- [ ] Validacao juridica: assinatura digitada/uploaded tem mesma validade conforme UETA
- [ ] Audit trail registra metodo (`signature_method='DRAWN'|'TYPED'|'UPLOADED'`)

### Validacao API + DB
- **Request Payload** — N/A (UI do GowSign)
- **Response** — `Get Document` retorna `signatureImage` regardless do metodo
- **DB State After**:
  - `uown_esign_document.signature_method` (recomendar coluna)
- **Log no Lease**:
  - Auditoria do metodo no audit trail PDF

### Cobertura Origem
- ADA Title III

---

# EPICO 17: COMPLIANCE E RETENCAO

## US-LEG-01: Retention Policy de Contratos Assinados

**Persona:** Compliance / B (Backend)

### Historia
Como **time de compliance**, quero **definir e cumprir periodo de retencao** de contratos assinados para que **UOwn cumpra obrigacoes legais (US RTO leis exigem 7+ anos) sem armazenar indefinidamente**.

### Criterios de Aceite
- [ ] Retention policy: minimo **7 anos** apos signing (validar regulamento por estado)
- [ ] Politica documentada e enforced via job de purge
- [ ] Apos retencao: PDF removido de storage, mas metadados (hash, doc_signed_time_stamp) preservados em DB para auditoria
- [ ] Cliente acessando link apos retencao: 410 Gone com mensagem "Contract archived — contact support"
- [ ] GowSign tambem precisa cumprir retencao (validar termo de servico)

### Validacao API + DB
- **Request Payload** — N/A (job interno)
- **Response** — N/A
- **DB State After**:
  - `uown_esign_document.purged_at` populado quando arquivado
  - `uown_esign_document.signed_pdf_url` torna-se null (storage removido)
  - Metadados (`base64signed_document_string IS NOT NULL (flag — sem hash, so blob)`, `doc_signed_time_stamp`) preservados
- **Log no Lease**:
  - Nota: `"Contract PDF purged after retention period (7y) — metadata preserved"`

### Cobertura Origem
- Compliance US RTO

---

## US-LEG-02: GDPR/CCPA Right to Deletion

**Persona:** C (Cliente) / Compliance

### Historia
Como **cliente cidadao da California (CCPA) ou UE (GDPR)**, quero **solicitar exclusao de meus dados** mesmo apos contrato assinado para que **meu direito de privacidade seja respeitado**.

### Criterios de Aceite
- [ ] Cliente solicita exclusao via portal ou suporte
- [ ] Avaliacao legal: contratos assinados podem ter retencao mandatoria que se sobrepoe a GDPR/CCPA (validar com advogado)
- [ ] Se aprovado: PII anonimizada (`name='REDACTED'`, `email='redacted@uown.local'`, address removido)
- [ ] PDF assinado: anonimizar campos visuais ou marcar como "REDACTED PER REQUEST" overlay
- [ ] Auditoria detalhada: quem aprovou, quando, base legal

### Validacao API + DB
- **Request Payload** — POST `/api/customer/{id}/redaction-request`
- **Response** — 202 Accepted (processamento manual)
- **DB State After**:
  - `[TBD: tabela de redaction nao existe — criar ou usar uown_los_lead_notes com substring 'PII redaction']`: linha com `status='PENDING'|'APPROVED'|'DENIED'`
  - Apos aprovacao: PII em `uown_los_lead`, `uown_esign_document.requester_*` anonimizados
- **Log no Lease**:
  - Nota auditavel: `"PII redaction applied per CCPA/GDPR request — approved by {legal_user_id} on {date}"`

### Cobertura Origem
- GDPR Art. 17, CCPA 1798.105

---

## US-LEG-03: Conformidade UETA / ESIGN Act

**Persona:** Compliance

### Historia
Como **time de compliance**, quero **garantir que assinatura digital tenha validade juridica plena** sob UETA (state-level) e ESIGN Act (federal) para que **contratos sejam executaveis em juizo**.

### Criterios de Aceite
- [ ] Cliente recebe **disclosure de consentimento** ao uso de e-sign (UETA section 7)
- [ ] Cliente pode optar por papel se preferir (right to opt-out documentado)
- [ ] **Identificacao do signatario** robusta (email + IP + geo + device)
- [ ] **Intent to sign** explicito (botao "I agree to sign electronically" ou checkbox)
- [ ] **Record retention** legivel pelo signatario por anos (US-LEG-01)
- [ ] Audit trail completo (US-DOC-14)

### Validacao API + DB
- **Request Payload** — Templates Strapi/HTML incluem clausula de e-sign disclosure
- **Response** — N/A
- **DB State After**:
  - `uown_esign_document.intent_to_sign_accepted_at` (recomendar)
  - `uown_esign_document.opt_out_paper_offered=true`
- **Log no Lease**:
  - Auditoria: cliente nao optou por papel + clicou consentimento eletronico

### Cobertura Origem
- UETA + ESIGN Act 15 USC 7001

---

## US-LEG-04: Audit Trail Export para Subpoena/Litigation

**Persona:** Compliance / Legal

### Historia
Como **time legal**, quero **exportar audit trail completo de um contrato** (incluindo todos eventos, IPs, timestamps, hashes) **para responder a subpoena ou disputa judicial**.

### Criterios de Aceite
- [ ] Endpoint admin `/api/admin/document/{id}/full-audit` (acesso restrito)
- [ ] Exporta JSON + PDF com:
  - Todos eventos de `uown_esign_event_trigger_log` com timestamps
  - Metadata completa (IPs, geo, device)
  - Hashes (`createdPdfHash`, `signedPdfHash`)
  - Operadores que tocaram o registro (`uown_los_lead_notes`)
  - Comunicacoes (emails enviados, logs)
- [ ] Assinatura digital do export (chain of custody)
- [ ] Auditoria de quem exportou

### Validacao API + DB
- **Request Payload** — GET admin endpoint
- **Response** — 200 com JSON + PDF anexo
- **DB State After**:
  - `uown_los_lead_notes`: `action='FULL_AUDIT_EXPORTED'`, `legal_case_ref`, `requested_by`
- **Log no Lease**:
  - Nota: `"Full audit trail exported for legal case {ref} by {user_id}"`

### Cobertura Origem
- Litigation/discovery requirements

---

## US-LEG-05: Compliance Audit Ad Hoc

**Persona:** Compliance

### Historia
Como **time de compliance**, quero **rodar auditoria periodica nos contratos** para que **eu detecte regressoes (ex: clausula state-specific ausente, retention nao aplicada)**.

### Criterios de Aceite
- [ ] Job mensal compara amostra de contratos com checklist:
  - Template do estado correto (US-DOC-10)
  - Property Price Tag bate com calculadora (US-DOC-01)
  - LESSOR/LESSEE corretos (US-DOC-02, 03)
  - Audit trail completo
- [ ] Falhas geram tickets para investigacao
- [ ] Dashboard com taxa de conformidade por mes

### Validacao API + DB
- **Request Payload** — Job interno (cron)
- **Response** — Report
- **DB State After**:
  - `[TBD: tabela de compliance audit nao existe — criar ou usar uown_los_lead_notes]`: linhas com `audit_date`, `sample_size`, `pass_count`, `fail_count`, `findings`
- **Log no Lease**:
  - Para leads em sample: nota `"Compliance audit performed — result: PASS|FAIL ({finding})"`

### Cobertura Origem
- Compliance program

---

# EPICO 18: MONITORAMENTO E SRE

## US-OBS-01: Health Check da Integracao GowSign

**Persona:** SRE / O (Operador)

### Historia
Como **time SRE**, quero **endpoint de health check** que valida conectividade com GowSign para que **deploys e dashboards saibam se a integracao esta saudavel**.

### Criterios de Aceite
- [ ] Endpoint `GET /healthz/gowsign` retorna 200 ou 503
- [ ] 200 quando: GowSign API responde em < 5s, chave valida, ultimo POST bem-sucedido em < 5min
- [ ] 503 quando: timeout, 401 (chave problema), 5xx persistente
- [ ] Response body: `{ status: 'healthy|unhealthy', last_check, latency_ms, last_error }`
- [ ] Cache de 30s (evita rate limit em GowSign)

### Validacao API + DB
- **Request Payload** — GET `/healthz/gowsign`
- **Response** — 200/503 com JSON
- **DB State After**:
  - `[NA: health checks ficam em sistema externo (Datadog/Grafana) — nao DB transacional]` (recomendar): linha por check com `service='GOWSIGN'`, `status`, `latency_ms`
- **Log no Lease** — N/A

### Cobertura Origem
- SRE basics

---

## US-OBS-02: SLIs/SLOs e Dashboards

**Persona:** SRE / Product

### Historia
Como **time de produto**, quero **dashboards com SLIs/SLOs** da integracao GowSign para que **regressoes sejam detectadas antes de virar incidente**.

### Criterios de Aceite
- [ ] **SLIs medidos**:
  - Taxa de sucesso de POST /api/document (target SLO: 99.5%)
  - Latencia P50/P95/P99 do POST (target: P95 < 2s)
  - Time-to-OUTSTANDING (target P95: < 30s)
  - Time-to-SIGNED (median): metric, sem SLO (depende de comportamento humano)
  - Taxa de erros 5xx (target: < 0.1%)
- [ ] Dashboard em Grafana/Datadog
- [ ] Alertas quando SLO violado por 15 min consecutivos

### Validacao API + DB
- **Request Payload** — N/A (metricas em background)
- **Response** — N/A
- **DB State After**:
  - Metricas em sistema de timeseries (Prometheus, etc.) — nao no DB transacional
- **Log no Lease** — N/A

### Cobertura Origem
- SRE / Product analytics

---

## US-OBS-03: Alertas Operacionais

**Persona:** SRE / O (Operador on-call)

### Historia
Como **on-call**, quero **alertas acionaveis** sobre problemas com GowSign para que **eu intervenha antes de afetar muitos clientes**.

### Criterios de Aceite
- [ ] Alertas configurados:
  - Taxa de erro POST > 5% por 5 min → page
  - Documento travado em `*_PENDING` > 30 min → ticket
  - Taxa de `error` event > 2% por 10 min → page
  - Webhook receiver com 5xx > 1% por 5 min → page
  - Reconciliation sweep detectou > 100 divergencias num ciclo → ticket
- [ ] Alertas tem runbook linkado
- [ ] Test fire mensal (gameday)

### Validacao API + DB
- **Request Payload** — N/A
- **Response** — N/A
- **DB State After** — N/A
- **Log no Lease** — N/A (tooling externo)

### Cobertura Origem
- SRE on-call

---

# EPICO 19: EDGE CASES DE ROBUSTEZ

## US-EDGE-01: Caracteres Especiais em Nomes e Enderecos

**Persona:** C (Cliente)

### Historia
Como **cliente com nome contendo caracteres especiais** (apostrofo `O'Brien`, acento `Pena`, `n` `Munoz`, hifen `Smith-Jones`), quero **ver meu nome correto no contrato** para que **o documento seja juridicamente valido em meu nome real**.

### Criterios de Aceite
- [ ] Variaveis substituidas preservam: `'`, `-`, `.`, espacos, e caracteres latin extended (acentos, til, cedilha)
- [ ] Encoding UTF-8 end-to-end (DB, API, GowSign)
- [ ] Sem escape HTML que vire `&apos;` ou `&#39;` no PDF
- [ ] Nome em LESSEE: `O'Brien-Munoz Pena` renderiza corretamente

### Validacao API + DB
- **Request Payload** — POST com `customerLastName: "O'Brien-Munoz"`
- **Response** — 200 OK; `data.Requester.name` preserva
- **DB State After**:
  - `uown_los_lead.last_name` armazenado UTF-8 sem escape
- **Log no Lease**:
  - `uown_los_lead_notes` tambem preserva (sem escape duplo)

### Cobertura Origem
- Edge case textual

---

## US-EDGE-02: Nomes e Enderecos Muito Longos

**Persona:** C (Cliente)

### Historia
Como **cliente com nome ou endereco muito longo**, quero **ver dados completos no contrato** sem truncamento para que **o documento seja juridicamente preciso**.

### Criterios de Aceite
- [ ] Nome completo > 50 caracteres: renderiza completo (sem truncar com `...`)
- [ ] Endereco com complemento longo (`Apt 12345 Building C, Suite 200B`): cabe em layout
- [ ] Quebra de linha automatica em campos largos
- [ ] Limite de DB suficiente: VARCHAR(255) ou TEXT
- [ ] Sem overflow visual no PDF

### Validacao API + DB
- **Request Payload** — POST com nomes/enderecos longos
- **Response** — 200; sem rejeicao por tamanho (a menos que > limite documentado)
- **DB State After**:
  - Colunas armazenam sem truncar
- **Log no Lease**:
  - Notas truncadas a N caracteres se necessario, mas dados em colunas dedicadas inteiros

### Cobertura Origem
- Edge case dimensional

---

## US-EDGE-03: Telefones Internacionais (E.164)

**Persona:** C (Cliente com numero internacional)

### Historia
Como **cliente com numero de telefone internacional** (cliente recente nos US, numero ainda do Mexico/Canada), quero **fornecer telefone em formato variado** sem rejeicao para que **eu nao seja bloqueado por formatacao**.

### Criterios de Aceite
- [ ] Formatos aceitos:
  - E.164: `+19071234567`
  - US sem +: `9071234567`
  - Com mascara: `(907) 123-4567`
  - Internacional: `+525555551234`
- [ ] Backend normaliza para E.164 antes de enviar a GowSign
- [ ] Validacao basica de formato (10+ digitos)
- [ ] Sem rejeicao de phones validos

### Validacao API + DB
- **Request Payload** — POST GowSign com `requester.phoneNumber` em E.164
- **Response** — 200 OK
- **DB State After**:
  - `uown_los_lead.phone` armazenado em E.164
- **Log no Lease** — N/A direto

### Cobertura Origem
- Doc GowSign + edge case

---

## US-EDGE-05: PDF Corrompido Recebido do GowSign

**Persona:** B (Backend)

### Historia
Como **backend**, quero **detectar PDF corrompido** retornado pelo GowSign (raro, mas possivel em network issues) para que **eu nao envie PDF quebrado para storage/cliente**.

### Criterios de Aceite
- [ ] Apos download do PDF, validar:
  - Header magic bytes `%PDF-`
  - Footer `%%EOF`
  - SHA-256 bate com `signedPdfHash` (se disponivel)
- [ ] Corrupcao detectada: alerta + retry; **nao** marcar lease como signed
- [ ] Apos N retries: alerta operacional, ticket aberto

### Validacao API + DB
- **Request Payload** — GET PDF do GowSign
- **Response** — Validar bytes
- **DB State After**:
  - Em caso de corrupcao: linha em `uown_merchant_api_error_log` com `error_type='PDF_CORRUPTED'`
- **Log no Lease**:
  - Nota WARN: `"PDF download corrupted from GowSign — retrying"`

### Cobertura Origem
- Edge case de integridade

---

## US-EDGE-06: Webhook com Payload JSON Malformado

**Persona:** B (Webhook receiver)

### Historia
Como **handler de webhook**, quero **rejeitar JSON malformado** sem derrubar o servico para que **um bug ou ataque no formato nao cause downtime**.

### Criterios de Aceite
- [ ] JSON parser try-catch
- [ ] Malformado: 400 Bad Request, log com sample sanitizado (sem PII)
- [ ] Sem retry imediato (parser nao vai melhorar com retry)
- [ ] Metric de payload malformado por hora (alerta se subir)
- [ ] Body size limit (ex: 1 MB) rejeitado pre-parsing

### Validacao API + DB
- **Request Payload** — POST `/webhook/gowsign` com body malformado (`{ invalid json`)
- **Response** — 400 com `{ error: 'invalid JSON' }`
- **DB State After**:
  - `uown_los_inbound_api_log` (ou similar): linha com `status='REJECTED_MALFORMED'`, `payload_sample` (truncated/redacted)
- **Log no Lease** — N/A (sem document_id parseavel)

### Cobertura Origem
- Robustez basica

---

# EPICO 20: MODIFY LEASE E POS-FUNDED

## US-MOD-01: Modify Lease Pos-Assinatura Gera Novo Contrato

**Persona:** C (Cliente) / O (Operador)

### Historia
Como **cliente** apos assinar contrato mas antes de funded, quero **modificar termos** (mudar frequencia de pagamento, ajustar items) para que **eu adapte o contrato ate ser efetivado**.

### Criterios de Aceite
- [ ] Modify lease permitido entre `SIGNED` e `FUNDED` (regra de negocio)
- [ ] Modificacao gera **novo contrato GowSign** com novos termos
- [ ] Contrato anterior cancelado em cascata (US-CRE-07)
- [ ] Cliente assina novamente
- [ ] Lead volta para `CONTRACT_CREATED`, depois `SIGNED`, depois eventualmente `FUNDING`

### Validacao API + DB
- **Request Payload** — POST `/api/lease/{id}/modify` com novos termos
- **Response** — 200 com new contract URL
- **DB State After**:
  - Contrato antigo: `CANCELLED`
  - Contrato novo: `SENT`
  - Lead: regressao para `CONTRACT_CREATED` permitida nesse contexto especifico
- **Log no Lease**:
  - 2 transicoes em `uown_los_lead_notes (substring de transicao: ex: 'Change lead status from X to Y' ou 'LeadStatus Y')`: `SIGNED→CONTRACT_CREATED` (excecao por modify) + futuro `CONTRACT_CREATED→SIGNED`
  - Nota: `"Lease modified by {user_id} — new contract generated, old contract cancelled"`

### Cobertura Origem
- Business rule de modify lease

---

## US-MOD-02: Lease em Default — Contrato Original Acessivel

**Persona:** O (Operador) / Collections

### Historia
Como **time de Collections**, quero **acessar contrato original** mesmo com lease em default para que **eu use o documento como prova em cobranca/litigio**.

### Criterios de Aceite
- [ ] Lease em status `DEFAULT`/`DELINQUENT`: contrato continua acessivel
- [ ] Operador no portal vê PDF assinado + audit trail
- [ ] Cliente NAO acessa mais o link publico (regra a confirmar)

### Validacao API + DB
- **Request Payload** — GET `/api/document/{id}` (operator endpoint)
- **Response** — 200 com PDF
- **DB State After** — N/A (read-only)
- **Log no Lease**:
  - Acesso por operador logado: `"Contract accessed by {operator} for collections review"`

### Cobertura Origem
- Servicing / Collections workflow

---

## US-MOD-03: Lease em Collections — Contrato Acessivel ao Operador

**Persona:** O (Operador Collections)

### Historia
Como **operador de collections**, quero **anexar contrato em comunicacoes legais** para que **notificacoes ao cliente tenham respaldo documental**.

### Criterios de Aceite
- [ ] Funcionalidade de "Attach contract to letter" no portal
- [ ] Email/carta gerada inclui PDF do contrato como anexo
- [ ] Audit log: quando contrato foi enviado em comunicacao

### Validacao API + DB
- **Request Payload** — POST `/api/communication/letter` com `attach_contract=true`
- **Response** — 200 OK
- **DB State After**:
  - `uown_correspondence_logs`: `attachment='contract', contract_id={id}`
- **Log no Lease**:
  - Nota: `"Contract attached to {letter_type} letter sent to customer"`

### Cobertura Origem
- Collections playbook

---

## US-MOD-04: Contract Amendment Sem Refazer

**Persona:** O (Operador) / Compliance

### Historia
Como **operador**, quero **adicionar amendment ao contrato existente** (correcao de typo legal, adicao de clausula) sem refazer toda a assinatura para que **mudancas pequenas nao invalidem assinatura existente**.

### Criterios de Aceite
- [ ] Amendment e novo documento GowSign linkado ao contrato original
- [ ] Cliente assina **apenas** o amendment (nao todo o contrato)
- [ ] Contrato original permanece valido + amendment vinculado
- [ ] Audit trail abrangente: original + amendments em ordem cronologica

### Validacao API + DB
- **Request Payload** — POST `/api/contract/{id}/amendment` com novo conteudo do amendment
- **Response** — 200 com new amendment URL
- **DB State After**:
  - `[TBD: tabela de amendment nao existe — usar novo registro em uown_los_contract com referencia ao contract_pk original]` (recomendar): linha vinculada a `contract_pk` original
  - Novo `uown_esign_document` para o amendment
- **Log no Lease**:
  - Nota: `"Contract amendment created — amendmentId={id}, original contractId={id}"`

### Cobertura Origem
- Operacao avancada de contratos

---

# Apendice A: Seletores HTML — GowSign Document Viewer

> Seletores extraidos do HTML real do viewer GowSign (estado pre-assinatura, status `CREATED`). Servem como base canonica para o Page Object `gowsign-document-viewer.page.ts` e para os agents de teste.
>
> **Estrategia de seletor (preferencia):**
> 1. **ID** quando disponivel (mais estavel)
> 2. **`aria-label` ou `aria-*`** (acessibilidade — estavel)
> 3. **Classe customizada nao-Tailwind** (ex: `.gowsign-document`, `.price-tag`, `.styles_*`)
> 4. **`data-testid`** (recomendar adicao se nao existir)
> 5. **Texto** (`getByText`) como ultimo recurso
>
> **Evitar:** classes Tailwind atomicas (`.bg-white`, `.text-3xl`) e classes hash do CSS Module sem prefixo do componente.

## A.1 — Header (Toolbar Fixo)

| Elemento | Seletor preferido | Fallback | US relacionada |
|----------|-------------------|----------|----------------|
| Container do header | `.sticky.top-0.z-20` ou `[role="banner"]` (recomendar) | `text=^CA_2025_SAC$` (nome do doc) | EMB-01 |
| Titulo do contrato (nome interno) | `h1.overflow-hidden.overflow-ellipsis` | primeiro `h1` da pagina | DOC-09 (Agreement Number tambem) |
| Botao **Start** (iniciar assinatura) | `#startSignatureButton` | `button:has-text("Start")` | **EMB-10** |
| Botao **Download** | `button:has-text("Download")` (sem ID) | `button:has(svg.lucide-download)` (recomendar adicao de `data-testid="download-contract-btn"`) | **DOC-13** |
| Botao **Close document** | `button[aria-label="Close document"]` | `button:has(svg.lucide-x)` | EMB-06 |
| Toggle "Reading mode" (mobile) | `#headlessui-switch-_r_0_` (ID dinamico Headless UI — instavel!) | `[role="switch"]:has(+ *, text="Reading mode")` ou `getByLabel("Reading mode")` | EMB-01 |

> **Risco:** ID `headlessui-switch-_r_0_` muda a cada render. Usar `aria-label` ou contexto de texto. Recomendar: `data-testid="reading-mode-toggle"`.

---

## A.2 — Tabela de Metadados Pre-Assinatura

| Campo | Seletor | Conteudo esperado | US |
|-------|---------|-------------------|-----|
| Bloco "Document sent by" | `text=Document sent by` | `Document sent by Uown Leasing ({email})` | DOC-09 |
| "Created on" | `text=Created on` | `Created on {Mon DD, YYYY}` | DOC-09 |
| Header **DOCUMENT ID** | `th:has-text("DOCUMENT ID")` ou `:has(svg.lucide-file-digit)` | label apenas | LCY-09 |
| Valor DOCUMENT ID | `td:right-of(:text("DOCUMENT ID"))` (desktop) ou texto sob `.lucide-file-digit` (mobile) | UUID v4 | LCY-09, US-LSE-02 |
| Header **Recipient** | `th:has-text("Recipient")` ou `:has(svg.lucide-user-round)` | label | DOC-02 |
| Nome do recipient | `td:right-of(:text("Recipient")) >> span:has(svg.lucide-mail) >> nth=0` | `{firstName} {lastName}` | DOC-02 |
| Email do recipient | `td span.text-blue-600:has(svg.lucide-mail)` | `{email}` | DOC-02 |
| Header **Status** | `th:has-text("Status")` ou `:has(svg.lucide-file-clock)` | label | LCY-01..06 |
| Badge de **Status** | `span.rounded-md.text-white:has-text("CREATED|OUTSTANDING|SIGNED|COMPLETED|EXPIRED|CANCELED")` | badge com cor por status (ver A.3) | LCY-01..06, **US-LSE-***  |

---

## A.3 — Mapeamento Cor → Status (Status Badge)

| Status | Classe Tailwind do badge (observada/inferida) | Cor visivel |
|--------|----------------------------------------------|-------------|
| `CREATED` | `bg-yellow-500` (confirmado pelo HTML) | amarelo |
| `OUTSTANDING` | `bg-blue-500` (inferido — confirmar) | azul |
| `SIGNED` | `bg-green-500` (inferido) | verde |
| `COMPLETED` | `bg-green-700` (inferido — distinguir de SIGNED) | verde escuro |
| `EXPIRED` | `bg-gray-500` (inferido) | cinza |
| `CANCELED` | `bg-red-500` (inferido) | vermelho |

> **Acao recomendada:** abrir um documento em cada status e capturar HTML real. Atualizar tabela com classes confirmadas. Idealmente o time GowSign adiciona `data-status="{STATUS}"` no badge para selecao estavel sem depender de cor.

---

## A.4 — Conteudo do Documento (Pre/Pos-Start)

| Elemento | Seletor | Notas | US |
|----------|---------|-------|-----|
| Container raiz do documento | `.gowsign-document` | classe explicita, estavel | DOC-12 |
| Numero da pagina (rodape de cada pagina) | `.styles_page-number__oHQFD` | texto `Page N of M` | DOC-12 |
| Quebra de pagina (separador visual) | `.gowsign-page-break` | usado para identificar fim de pagina em scraping | DOC-12 |
| **Property Price Tag** (tabela) | `table.price-tag` | classe explicita | **DOC-01** |
| TOTAL OF PAYMENTS (valor) | `table.price-tag td:has(strong:has-text("TOTAL OF")) >> strong:has-text("$")` | extrair valor monetario | DOC-01 |
| COST OF LEASE (valor) | `table.price-tag td:has(strong:has-text("COST OF LEASE")) >> strong:has-text("$")` |  | DOC-01 |
| CASH PRICE (valor) | `table.price-tag td:has(strong:has-text("CASH PRICE")) >> strong:has-text("$")` |  | DOC-01 |
| AMOUNT OF EACH PAYMENT (valor) | `table.price-tag td:has(strong:has-text("AMOUNT OF EACH PAYMENT")) >> strong` | inclui frequencia entre parenteses | DOC-01 |
| NUMBER OF PAYMENTS | `table.price-tag td:has(strong:has-text("NUMBER OF")) >> strong` | numero inteiro | DOC-01 |
| RENEWAL PERIOD | `table.price-tag td:has(strong:has-text("RENEWAL PERIOD")) >> strong` | `WEEKLY`/`BI_WEEKLY`/`SEMI_MONTHLY`/`MONTHLY` | DOC-01 |
| Tabela LESSOR/LESSEE | `table:has(td:has-text("LESSOR:"))` (1a tabela apos titulo do agreement) | 2 colunas | DOC-02, DOC-03 |
| LESSEE name | `td:has(strong:has-text("LESSEE:")) >> p >> nth=1` | extrair texto | DOC-02 |
| LESSEE address | `td:has(strong:has-text("LESSEE:")) >> p:nth-of-type(3..4)` | linhas de endereco | DOC-02 |
| LESSEE telephone | `td:has(strong:has-text("LESSEE:")) >> p:has-text("Telephone:")` |  | DOC-02 |
| Tabela de items (Description of Property) | `table#leaseItems` | repetida no HTML — usar `>> nth=2` para a com tbody, ou `:has(tr td)` | DOC-04 |
| Cabecalho de coluna (`Item code` etc.) | `table#leaseItems thead th` | 4 colunas | DOC-04 |
| Linha de item | `table#leaseItems tr:has(td)` | 1 linha por item | DOC-04 |
| Total Delivery Fee | `p:has-text("Total Delivery Fee") >> u` | valor sublinhado | DOC-04 |
| Initial Lease Payment breakdown (linhas) | `p:has-text("Initial Lease Payment") >> span[style*="float: right"]` | valor da direita | DOC-05 |
| Processing Fee linha | `p:has-text("Processing Fee") >> span[style*="float: right"]` |  | DOC-05 |
| Tax linha | `p:has-text("^Tax")  >> span[style*="float: right"]` |  | DOC-05 |
| Total Initial Payment | `p:has-text("Total Initial Payment") >> span[style*="float: right"]` |  | DOC-05 |
| Agreement Number | `p:has-text("Agreement Number:") >> strong` | `UOWN_<random>_<leadPk>` | DOC-09 |
| Account number | `p:has-text("Account:") >> strong` |  | DOC-09 |
| Date (top do contrato) | `p:has(strong:has-text("Date:")) >> span[style*="float: right"]` | `MM/DD/YYYY` | DOC-09 |
| Initial Payment due date | `p:has-text("initial Lease payment due on")` | extrair via regex | DOC-09 |
| 3-Month Promo expiration | `p:has-text("3-Month-Promotional-Payoff-Option") >> p:has-text("expires on")` |  | DOC-07, DOC-09 |
| EPO chart (tabela completa) | `table:has(th:has-text("Payment Number")):has(th:has-text("EPO"))` | 1 linha por payment | **DOC-06** |
| EPO row N | `table:has(th:has-text("EPO")) >> tr:nth-child({N+1})` | linha 1 = header | DOC-06 |
| ACH grid (Weekly/Bi-Weekly options) | `table:has(th:has-text("Number of payments")):has(th:has-text("Total Cost"))` |  | DOC-08 |
| Iniciais do cliente em ACH grid | `td:has-text("X Initial")` ou `[data-signature-field]` (recomendar) | onde cliente assina | FLD-01..04 |

---

## A.5 — Campos de Assinatura (Pos-Start)

> Apos clicar `#startSignatureButton`, o widget de assinatura adiciona campos interativos. Selectores aproximados (validar com HTML real apos Start):

| Tipo de campo | Seletor presumido | US |
|---------------|-------------------|-----|
| Campo de assinatura (`signature`) | `[data-field-type="signature"]`, ou `button:has-text("Sign")` ou `canvas` (se for desenho) | FLD-01 |
| Campo de rubrica (`initial`) | `[data-field-type="initial"]` ou `input[name^="initial_"]` | FLD-02 |
| Checkbox individual | `input[type="checkbox"][data-required]` | FLD-03 |
| Checkbox em grupo | `input[type="checkbox"][data-group="{groupName}"]` | FLD-04 |
| Radio button group | `input[type="radio"][name="{groupName}"]` | FLD-05 |
| Campo de texto | `input[type="text"][data-field-type="text"]` | FLD-05 |
| Campo de data (auto) | `[data-field-type="date"]` | FLD-05 |
| Botao **Submit/Sign** (final) | `button:has-text("Submit"), button:has-text("Sign")` ou `[data-action="submit-signature"]` (recomendar) | EMB-03, US-LSE-06 |
| Mensagem de field obrigatorio nao preenchido | `[role="alert"]:has-text("required")` | FLD-06 |

> **Acao recomendada:** capturar HTML do widget pos-Start em estado "metade preenchido" e em estado "submetido" para fechar este apendice.

---

## A.6 — Estados de UI por Status do Documento

| Status do documento | Comportamento esperado da UI | Botoes habilitados |
|---------------------|------------------------------|---------------------|
| `CREATED` (PDF em geracao) | Documento renderiza com loading ou skeleton para assinatura | Download (PDF draft), Close. **Start desabilitado** ate `OUTSTANDING` |
| `OUTSTANDING` (PDF pronto) | Documento + tabela de metadados + Start habilitado | Start, Download, Close, Reading mode |
| `SIGNED` (apos signer concluir) | Documento mostra assinaturas/iniciais visualmente; sem campos editaveis | Download (assinado), Close. Start oculto/desabilitado |
| `COMPLETED` (audit trail pronto) | Documento + audit trail anexado; download retorna PDF final | Download (com audit trail), Close |
| `EXPIRED` | Mensagem visivel "Contract has expired"; sem opcao de assinar | Download (PDF como estava), Close |
| `CANCELED` | Mensagem visivel "Contract was cancelled"; sem opcao de assinar | Download (opcional), Close |

---

## A.7 — Eventos postMessage Esperados Apos Cada Acao da UI

| Acao da UI | Evento postMessage disparado | US |
|------------|------------------------------|-----|
| Pagina renderiza (sem click) | nenhum (vide US-EMB-10) | EMB-10 |
| Click em `#startSignatureButton` | `{ type: 'loaded', documentId }` (semantica refinada) | EMB-02, EMB-10 |
| Click em campo de assinatura | nenhum (interno) | FLD-01, US-LSE-05 |
| Submit de assinatura completa | `{ type: 'completed', documentId }` | EMB-03, US-LSE-06 |
| Click em `aria-label="Close document"` | `{ type: 'closed', documentId }` (se nao assinado) | EMB-04, US-LSE-08 |
| Erro durante operacao | `{ type: 'error', documentId, error }` | EMB-05, US-LSE-09 |
| Limpeza do iframe | `{ type: 'close-iframe' }` | EMB-06, US-LSE-10 |
| Click em **Download** | nenhum evento postMessage; navega ou abre nova aba | DOC-13 |

---

## A.8 — Recomendacoes de Estabilidade (para o time GowSign)

Para reduzir flakiness em testes E2E, sugerir ao time GowSign adicionar:

- [ ] `data-testid="start-signature-btn"` no botao Start
- [ ] `data-testid="download-contract-btn"` no botao Download
- [ ] `data-testid="close-document-btn"` no botao Close (ja tem `aria-label`, otimo)
- [ ] `data-status="{CREATED|OUTSTANDING|...}"` no badge de status (independente de cor)
- [ ] `data-document-id="{uuid}"` no container raiz `.gowsign-document` (facilita assercao)
- [ ] `data-recipient-email="{email}"` na celula correspondente
- [ ] `data-field-type="{signature|initial|check|...}"` em cada campo da assinatura
- [ ] `data-required="true|false"` em cada campo
- [ ] IDs dinamicos do Headless UI (`headlessui-switch-_r_0_`) substituidos por `aria-label` semantico

---

# Glossario

| Termo | Definicao |
|-------|-----------|
| **GowSign** | Provedor SaaS de assinatura digital — substitui Signwell |
| **Signwell** | Provedor anterior (sera descontinuado) |
| **PandaDoc** | Provedor alternativo (mantido para alguns merchants) |
| **DOCX Flow** | Cria contrato enviando arquivo Word em base64 |
| **HTML Flow** | Cria contrato enviando template HTML completo com tags inline |
| **Strapi Flow** | Cria contrato referenciando template gerenciado no CMS Strapi |
| **postMessage** | API do browser para comunicacao iframe ↔ pagina pai |
| **embedMode** | Query param `?embedMode=true` na URL do contrato para abrir em iframe |
| **Audit Trail** | PDF final com log de eventos (visualizacao, assinatura, IP, geo) gerado apos `SIGNED` |
| **Requester** | Signatario unico (signer 1) — atualmente o cliente UOwn |
| **Strapi** | Headless CMS onde templates de contrato sao gerenciados |
| **Callback Enrichment** | Metadados (event_hash, event_time, etc.) adicionados pelo GowSign no fluxo Strapi |
| **Sandbox** | Modo teste — documento sem validade juridica |

---

# Proximos Passos

1. **Validar US com Product Owner** (Yuri Araujo / Fernando Martins) — confirmar escopo e cortes
2. **Refinar criterios de aceite** com base em respostas do GowSign integration manager (chave de teste, IP allowlist, environment Strapi)
3. **Decompor US em tasks de implementacao** no backend (svc + origination)
4. **Gerar test plans** a partir das US — cada US gera 1+ cenarios automatizados
5. **Mapear riscos** por US (similar ao formato `jornada-completa-lease.md` — fraud, credit, compliance, operational)
6. **Confirmar** se cancelamento manual de documento existe (endpoint nao documentado)

---

> **Fonte unica de verdade:** este arquivo. Atualizar conforme novos requisitos da tarefa, descobertas de implementacao, ou mudancas na API GowSign.
