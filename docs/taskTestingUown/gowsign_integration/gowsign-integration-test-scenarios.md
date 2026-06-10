# Test Scenarios — GowSign Integration

## Cenarios Derivados das User Stories

> **Origem:** [`gowsign-integration-user-stories.md`](./gowsign-integration-user-stories.md) — 160 US em 20 epicos
> **Formato:** Gherkin (Given/When/Then) compativel com Playwright + Cucumber-style steps
> **Cobertura:** cada US tem 1+ cenarios (positivo, negativo, edge cases conforme aplicavel)
> **Ultima atualizacao:** 2026-04-27

---

## Convencoes

### Tags

| Tag | Significado |
|-----|-------------|
| `@smoke` | Suite minima de validacao pos-deploy |
| `@regression` | Suite completa, roda em CI/nightly |
| `@e2e` | End-to-end com browser real (Playwright) |
| `@api` | API-only (sem browser) |
| `@hybrid` | Mistura API + browser |
| `@db-validation` | Inclui assercoes em `uown_*` tables |
| `@priority-high` | Bloqueia release se falhar |
| `@priority-medium` | Falhas geram tickets |
| `@priority-low` | Roda em nightly, falhas sao tracked |
| `@manual` | Cenario manual (acessibilidade, browser matrix, etc.) |
| `@flaky-tracked` | Marcado como flaky com ticket de investigacao |

### Estrutura

- **Background**: pre-condicoes compartilhadas por todos cenarios da US
- **Cenario**: caso de teste individual
- **Examples (Scenario Outline)**: tabela parametrizada quando aplicavel
- **Then ... And `uown_*`**: assercoes em DB (verificar com `db.queryOne()` / `db.waitForRecord()`)

### Padrao de assercao DB

```gherkin
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') tem nova linha com to_status='SIGNED'
And uown_los_lead_notes contem texto "Contract signed via GowSign"
And uown_esign_document.status = 'SIGNED'
```

---

# EPICO 1: VALIDACAO DE PROVIDER E COEXISTENCIA

> **Escopo:** roteamento GowSign vs Signwell e logica do backend — **nao validamos a regra**, apenas o **resultado** apos criacao (`uown_esign_document.esign_client` correto) e ausencia de cross-talk em coexistencia.

## US-CUT-01: `esign_client` Populado Corretamente em `uown_esign_document`

### Cenario 1.1: Apos criacao bem-sucedida, esign_client e populado
`@smoke @regression @api @db-validation @priority-high`

```gherkin
Given lead em CC_AUTH_PASSED para estado "CA"
When backend cria contrato com sucesso (resposta 200, data.id retornado)
Then uown_esign_document tem nova linha com:
  | esign_client | em {'GOWSIGN', 'SIGNWELL', 'PANDADOC'} (nao null)        |
  | esign_mode   | em {'DOCX', 'HTML', 'STRAPI', 'EMAIL'} (nao null)         |
  | document_key  | matches UUID v4 regex                                     |
And uown_los_contract.esign_document_pk referencia FK valida
And uown_los_lead_notes contem substring 'Sent Contract to customer. Contract EsignDocPk : {pk}'
And substring 'EsignMode : {DOCX|HTML|EMAIL}' aparece na nota
```

### Cenario 1.2: document_key retornado pelo provedor matches formato esperado
`@regression @api @db-validation @priority-medium`

```gherkin
Given documento criado, esign_client='GOWSIGN'
When SELECT document_key FROM uown_esign_document WHERE pk = :doc_pk
Then document_key matches regex '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' (UUID v4)
And valor === data.id retornado pelo POST do GowSign
```

---

## US-CUT-02: Coexistencia Multi-Provedor (Sem Cross-Talk)

### Cenario 2.1: Webhook GowSign nao afeta documento Signwell
`@regression @api @db-validation @priority-high`

```gherkin
Given existem 2 documentos OUTSTANDING:
  | id          | esign_client | document_key   |
  | doc-pk-1    | SIGNWELL     | signwell-uuid |
  | doc-pk-2    | GOWSIGN      | gowsign-uuid  |
When webhook GowSign chega com event=completed para "gowsign-uuid"
Then uown_esign_document WHERE pk=doc-pk-2 transita para status='SIGNED'
And uown_esign_document WHERE pk=doc-pk-1 permanece status='OUTSTANDING'
And uown_esign_event_trigger_log nova linha tem esign_doc_pk=doc-pk-2 (nao doc-pk-1)
```

### Cenario 2.2: Auto-detect 3 provedores via iframe polling
`@e2e @hybrid @priority-high`

```gherkin
Given iframe carrega URL retornada pela API (data.url do provedor que processou)
When frontend faz polling de 3s × 12 inspecionando origin do iframe
Then handler correto e selecionado entre [GOWSIGN, SIGNWELL, PANDADOC]
And eventos postMessage subsequentes sao roteados para o handler correto
And uown_esign_event_trigger_log eventos tem esign_doc_pk vinculado ao documento correto
```

### Cenario 2.3: Distribuicao multi-provedor coexiste sem migracao em massa
`@regression @api @db-validation @priority-medium`

```gherkin
When SELECT esign_client, COUNT(*) FROM uown_esign_document
     WHERE row_created_timestamp > NOW() - INTERVAL '7 days'
     GROUP BY esign_client
Then resultado pode incluir multiplos provedores em janela de migracao
And documentos antigos (criados pre-cutover) preservam esign_client original
```

---

# EPICO 2: CRIACAO DE CONTRATO

## US-CRE-01: Criar Contrato via Fluxo DOCX

### Cenario 1.1: POST DOCX com payload valido retorna 200
`@smoke @api @db-validation @priority-high`

```gherkin
Given lead em status CC_AUTH_PASSED
And merchant configurado para fluxo DOCX
When backend envia POST /api/document com:
  | document.documentBase64 | UEsDBBQAAAAI... (DOCX valido) |
  | requester.name          | John Doe                      |
  | requester.email         | john@example.com              |
Then resposta retorna 200 com:
  | data.id        | UUID v4 |
  | data.status    | CREATED |
  | valid          | true    |
  | error          | null    |
And uown_esign_document tem linha com esign_client="GOWSIGN", esign_mode="DOCX"
And uown_los_contract.esign_document_pk referencia uown_esign_document.pk
And uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') registra CC_AUTH_PASSED→CONTRACT_CREATED
```

### Cenario 1.2: POST DOCX com fields posicionados
`@regression @api @priority-high`

```gherkin
Given mesma pre-condicao do cenario 1.1
When POST envia fields=[
  {term:"sig_1", type:"signature", required:true, signer:1, width:200, height:50},
  {term:"init_1", type:"initial", required:true, signer:1, width:50, height:30}
]
Then resposta 200 OK
And GET /api/document/{id} retorna signatureFields com 2 entradas correspondentes
```

### Cenario 1.3: PDF transita CREATED→OUTSTANDING via polling
`@regression @api @priority-high`

```gherkin
Given documento criado retornou status=CREATED
When polling GET /api/document/{id} a cada 5s, max 30 tentativas
Then status transita para "OUTSTANDING" em < 30s
And pdfStatus passa por CREATED_PENDING → CREATED_GENERATED
And uown_esign_document.status = "OUTSTANDING"
And email com link enviado ao cliente (se sendSignatureEmail=true)
```

---

## US-CRE-02: Criar Contrato via Fluxo HTML

### Cenario 2.1: HTML com tags inline e variaveis substituidas
`@smoke @api @priority-high`

```gherkin
Given merchant configurado para fluxo HTML
When POST envia:
  | customTemplate | <h1>{{customerName}}</h1>[sig\|req\|signer1] |
  | customTitle    | Lease Agreement                              |
  | variables      | {customerName: "John Doe"}                   |
Then resposta 200 com data.id
And ao acessar URL do documento, PDF renderiza "John Doe" no h1
And tag [sig] foi substituida por campo de assinatura clicavel
And uown_esign_document.has_custom_template = true
```

### Cenario 2.2: HTML rejeita combinacao com documentBase64
`@regression @api @priority-medium`

```gherkin
Given POST envia tanto customTemplate quanto documentBase64
Then resposta 400 com error.message identificando conflito
And nada inserido em uown_esign_document
```

### Cenario 2.3: Variavel ausente substitui por string vazia
`@regression @api @priority-low`

```gherkin
Given customTemplate contem "{{undefined_var}} test"
When POST sem entry "undefined_var" em variables
Then PDF gerado mostra " test" (string vazia substituida)
And nenhum erro retornado
```

---

## US-CRE-03: Criar Contrato via Fluxo Strapi

### Cenario 3.1: Strapi com templateId valido
`@smoke @api @priority-high`

```gherkin
Given templateId "mt1qzbrsbjkp0agv16fk998a" cadastrado em Strapi
When POST envia document.templateId="mt1qzbrsbjkp0agv16fk998a", callback.environment="stg"
Then resposta 200 com data.strapiTemplateTitle preenchido
And uown_esign_document.esign_mode = "STRAPI"
And uown_esign_document.strapi_template_id = "mt1qzbrsbjkp0agv16fk998a"
And callback enriquecido com event_hash, event_time, Provider="GOWSign"
```

### Cenario 3.2: templateId inexistente retorna 404
`@regression @api @priority-medium`

```gherkin
Given templateId "nao-existe" nao cadastrado
When POST envia document.templateId="nao-existe", callback.environment="stg"
Then resposta 404 com error.type=404
And nada inserido em uown_esign_document
And alerta operacional disparado
```

### Cenario 3.3: Environment invalido retorna 500
`@regression @api @priority-medium`

```gherkin
Given templateId valido com environments=["production", "stg"]
When POST envia callback.environment="dev1" (nao listado)
Then resposta 500 com error.message="Template not available for the requested environment."
```

---

## US-CRE-04: Variaveis Dinamicas no Contrato

### Cenario 4.1: 30+ variaveis lease substituidas corretamente
`@regression @api @hybrid @db-validation @priority-high`

```gherkin
Given lead com dados completos em uown_los_lead
When backend cria contrato Strapi com variables={customerFirstName, customerLastName, customerStreetAddress, ..., totalOfPayments, leaseCost, cashPrice, recurringPayment, numberOfPayments, ...}
And cliente abre URL do contrato
Then PDF renderiza todos valores nos lugares corretos
And valores monetarios formatados como "$X,XXX.XX"
And datas formatadas MM/DD/YYYY
And SSN/CC NAO aparecem no contrato (PII excluida)
```

---

## US-CRE-05: Tabela Dinamica em Contrato

### Cenario 5.1: Tabela com headers e rows renderiza corretamente
`@regression @api @hybrid @priority-medium`

```gherkin
Given customTemplate contem "[table|paymentSchedule]"
And variables.paymentSchedule = {headers: ["Date", "Amount"], rows: [["05/01", "$23.06"], ["05/15", "$23.06"]]}
When PDF gerado e cliente abre
Then tabela renderiza com 2 colunas e 2 linhas
And valores correspondem aos rows fornecidos
```

### Cenario 5.2: Tabela inexistente em variables nao quebra documento
`@regression @api @priority-low`

```gherkin
Given customTemplate contem "[table|inexistente]"
And variables NAO tem entry "inexistente"
When PDF gerado
Then documento criado sem erro
And local da tag substituido por string vazia
```

---

## US-CRE-06: Parametros Opcionais Aplicados

### Cenario Outline: Cada parametro opcional gera comportamento esperado
`@regression @api @priority-medium`

```gherkin
Examples:
  | parametro              | valor                       | comportamento esperado                          |
  | mustReminder           | true                        | reminder enviado apos N dias                    |
  | reminderDaysAmount     | 5                           | reminder em 5 dias (override do default 3)      |
  | expirationDate         | 2026-12-31T23:59:59Z        | documento expira na data                        |
  | expirationDate         | (ausente)                   | documento nao expira                            |
  | isSandbox              | true                        | documento marcado como teste                    |
  | redirect               | https://merchant.com/signed | cliente redirecionado apos assinar              |
  | sendSignatureEmail     | false                       | email NAO enviado (uso embed)                   |
  | sendSignatureEmail     | (ausente ou true)           | email enviado                                   |
```

---

## US-CRE-07: Cancelamento de Contratos Anteriores em Cascata

### Cenario 7.1: Novo contrato cancela contratos SENT anteriores
`@regression @api @db-validation @priority-high`

```gherkin
Given lead pk=42 tem 2 contratos em status "SENT" (provider=SIGNWELL e GOWSIGN)
When backend cria 3o contrato GowSign para lead 42
Then resposta 200 com novo data.id
And uown_los_contract.status para os 2 antigos = "CANCELLED"
And cada antigo tem cancelled_date populada
And uown_esign_document para cada antigo tem status="CANCELED"
And uown_esign_event_trigger_log tem 2 linhas esign_event="CANCELLED_BY_NEW_CONTRACT"
And lead permanece em CONTRACT_CREATED (sem regressao)
```

### Cenario 7.2: Contratos SIGNED nao sao cancelados
`@regression @api @priority-high`

```gherkin
Given lead tem contrato em status "SIGNED"
When backend tenta criar novo contrato para o lead
Then operacao rejeitada com "INVALID_LEAD_STATUS_FOR_CONTRACT" (lead ja signed)
And contrato signed permanece intocado
```

---

## US-CRE-08: Contrato Disponivel via URL

### Cenario 8.1: URL acessivel com PDF pronto retorna o documento
`@smoke @e2e @priority-high`

```gherkin
Given documento criado com pdfStatus=CREATED_GENERATED
When cliente acessa data.url no browser
Then pagina renderiza com botao Start, metadados do contrato e PDF visivel
And status badge mostra "OUTSTANDING"
```

### Cenario 8.2: URL durante geracao mostra "preparando"
`@regression @e2e @priority-medium`

```gherkin
Given documento em pdfStatus=CREATED_PENDING
When cliente acessa data.url
Then pagina mostra spinner ou mensagem "Preparing your document"
And botao Start desabilitado
```

---

## US-CRE-09: Contrato com Plano de Protecao Pre-Selecionado pelo Merchant

### Cenario 9.1: Merchant pre-seleciona PP, contrato inclui valor
`@regression @api @hybrid @db-validation @priority-high`

```gherkin
Given merchant tem permissao para pre-selecionar PP
And merchant submete aplicacao com protectionPlanOptIn=true
When backend cria contrato Strapi
Then variables incluem protectionPlanIncluded=true, protectionPlanFee=$X.XX
And Property Price Tag mostra valores SOMADOS com PP
And uown_los_protection_plan tem linha com opt_in_source="MERCHANT_PRESELECTED"
And uown_los_lead_notes registra "Protection Plan pre-selected by merchant"
```

### Cenario 9.2: Cliente faz opt-out durante review e contrato e regerado
`@e2e @hybrid @priority-medium`

```gherkin
Given documento criado com PP pre-selecionado
When cliente clica "Remove Protection Plan" antes de assinar
Then contrato atual cancelado
And novo contrato gerado SEM PP
And lease permanece em CONTRACT_CREATED
And uown_los_lead_notes registra "Customer opted out of pre-selected Protection Plan"
```

---

# EPICO 3: CAMPOS DE ASSINATURA

## US-FLD-01: Posicionamento de Signature

### Cenario 1.1: DOCX com signature field renderiza no PDF
`@regression @e2e @priority-high`

```gherkin
Given POST DOCX com fields=[{term:"sig_1", type:"signature", ...}]
When cliente abre URL do contrato
Then PDF mostra campo de assinatura clicavel posicionado onde "sig_1" aparece no texto
And ao assinar, signatureImage populado em GET response
```

### Cenario 1.2: HTML com [sig|req|signer1] inline
`@regression @e2e @priority-high`

```gherkin
Given customTemplate contem "I agree to the terms.[sig|req|signer1]"
When PDF e renderizado
Then campo de assinatura aparece logo apos "I agree to the terms."
And campo e marcado como required
```

---

## US-FLD-02: Campo Initial (Rubrica)

### Cenario 2.1: Initial em multiplas paginas
`@regression @e2e @priority-medium`

```gherkin
Given DOCX com fields=[{term:"init_each_page", type:"initial", required:true, ...}]
And termo "init_each_page" aparece em 5 paginas
When cliente assina
Then todos 5 campos de rubrica devem estar preenchidos para conclusao
And rubricaImage populada apos signed
```

---

## US-FLD-03: Checkbox Individual

### Cenario 3.1: Checkbox required deve ser marcado
`@regression @e2e @priority-high`

```gherkin
Given fields=[{term:"agree_terms", type:"check", required:true, signer:1}]
When cliente clica Submit sem marcar
Then GowSign bloqueia submissao com mensagem de campo obrigatorio
And documento permanece OUTSTANDING
```

### Cenario 3.2: Checkbox marcado retorna value=true em GET
`@regression @api @e2e @priority-medium`

```gherkin
Given checkbox term="cc_peek_consent" marcado pelo cliente
When backend chama GET /api/document/{id}
Then response.data.fields contem entry com type="check", term="cc_peek_consent", value=true
```

---

## US-FLD-04: Checkbox em Grupo (Mutual Exclusivity)

### Cenario 4.1: Marcar uma opcao desmarca outras do grupo
`@regression @e2e @priority-medium`

```gherkin
Given checkboxes ["yes_protection", "no_protection"] no mesmo group="protection_choice"
When cliente marca "yes_protection"
And depois marca "no_protection"
Then "yes_protection" e desmarcado automaticamente
And so "no_protection" tem value=true em GET response
```

---

## US-FLD-05: Tags Inline Suportadas no HTML

### Cenario 5.1: Cada tipo de tag inline e processado
`@regression @api @hybrid @priority-high`

Examples:
| tag                                               | tipo esperado | comportamento                          |
| `[sig\|req\|signer1]`                             | signature     | campo de assinatura required           |
| `[initials\|req\|signer1]`                        | initial       | campo de rubrica required              |
| `[date\|signer1]`                                 | date          | auto-preenchido com data assinatura    |
| `[text\|req\|signer1\|customerNotes\|\|Type here\|200px]` | text          | input width=200px com placeholder      |
| `[radio_button\|req\|signer1\|payment\|\|(Wk;weekly)(Mn;monthly)]` | radio | grupo "payment" com 2 opcoes        |
| `[checkbox\|req1\|signer1\|consents\|(I agree;agree;false)]` | checkbox  | min 1 checked obrigatorio            |
| `[table\|paymentSchedule]`                        | table         | renderiza tabela do variables          |

---

## US-FLD-06: Validacao de Campos Required

### Cenario 6.1: Submit bloqueado sem campos required preenchidos
`@regression @e2e @priority-high`

```gherkin
Given documento com 3 campos required (signature, initial, checkbox)
When cliente preenche apenas 2
And clica Submit
Then GowSign exibe mensagem visual indicando campos faltantes
And status permanece OUTSTANDING (nao transita SIGNED)
```

---

## US-FLD-07: Width/Height de Campos

### Cenario 7.1: width/height obrigatorios em DOCX flow
`@regression @api @priority-medium`

```gherkin
Given DOCX flow com fields=[{term:"sig", type:"signature", required:true, signer:1}] (sem width/height)
When POST enviado
Then resposta 400 ValidationError
And mensagem identifica width/height ausentes
```

### Cenario 7.2: Defaults aplicados em fluxo HTML inline
`@regression @api @priority-low`

```gherkin
Given customTemplate com "[sig|req|signer1]" (sem width)
When PDF gerado
Then campo renderizado com width default (~200px)
```

---

## US-FLD-08: Multi-Field em Mesmo Documento

### Cenario 8.1: Mix de tipos no mesmo contrato
`@regression @api @hybrid @priority-medium`

```gherkin
Given DOCX com fields=[1 signature, 5 initials, 3 checkboxes]
When POST enviado
Then resposta 200; signatureFields[] retorna 9 entradas na ordem fornecida
And cada term e unico
```

---

## US-FLD-09: Apenas Signer 1 Suportado

### Cenario 9.1: signer=2 rejeitado ou ignorado
`@regression @api @priority-low`

```gherkin
Given fields=[{type:"signature", signer:2, ...}]
When POST enviado
Then comportamento documentado: ou 400 ValidationError ou ignorado (sem field criado)
```

---

## US-FLD-10: Documento Sem Campos de Assinatura

### Cenario 10.1: Backend rejeita criacao sem fields
`@regression @api @db-validation @priority-medium`

```gherkin
Given DOCX flow sem fields[] e sem termos detectaveis no PDF
When backend tenta POST GowSign
Then operacao rejeitada com error_type="NO_SIGNATURE_FIELDS"
And uown_merchant_api_error_log recebe linha
And nada criado em uown_esign_document
```

---

# EPICO 4: EXPERIENCIA DE ASSINATURA VIA IFRAME

## US-EMB-01: Cliente Abre Contrato em Iframe

### Cenario 1.1: Iframe carrega contrato com embedMode=true
`@smoke @e2e @hybrid @priority-high`

```gherkin
Given documento criado com data.url e pdfStatus=CREATED_GENERATED
When pagina UOwn cria iframe src=`{data.url}?embedMode=true`
Then iframe carrega sem erros 4xx/5xx
And contrato visivel no iframe
And cliente pode rolar e ler todo o conteudo
```

---

## US-EMB-02: Captura Evento `loaded`

### Cenario 2.1: postMessage loaded recebido apos Start
`@e2e @hybrid @db-validation @priority-high`

```gherkin
Given iframe aberto, cliente clicou em Start
When GowSign dispara postMessage {type:"loaded", documentId}
Then frontend UOwn captura event
And uown_esign_event_trigger_log registra esign_event="LOADED" com documentId correto
And lead permanece em CONTRACT_CREATED (vide US-LSE-04)
```

---

## US-EMB-03: Cliente Assina, Captura `completed`

### Cenario 3.1: Sucesso de assinatura completa fluxo end-to-end
`@e2e @hybrid @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING, todos campos required preenchidos
When cliente clica Submit
And GowSign dispara postMessage {type:"completed", documentId}
Then backend UOwn:
  - atualiza uown_esign_document.status="SIGNED"
  - atualiza uown_los_contract.status="SIGNED"
  - atualiza uown_los_lead.status="SIGNED"
And cliente redirecionado para /{shortCode}/complete (Confetes)
And email de copia enviado
```

---

## US-EMB-04: Cliente Fecha Sem Assinar (`closed`)

### Cenario 4.1: Click em Close document dispara closed
`@e2e @hybrid @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING, cliente abriu iframe mas nao assinou
When cliente clica botao "Close document"
Then postMessage {type:"closed", documentId} disparado
And uown_los_contract.status="CANCELLED"
And lead permanece em CONTRACT_CREATED (sem regressao)
And cliente redirecionado para merchantRedirectUrl?event=canceled&ata={uuid}
And novo contrato pode ser criado (sem bloqueio)
```

---

## US-EMB-05: Erro Critico (`error`)

### Cenario 5.1: postMessage error recebido com mensagem
`@regression @e2e @hybrid @priority-medium`

```gherkin
Given erro critico ocorre no iframe (ex: PDF corrompido)
When GowSign dispara postMessage {type:"error", documentId, error:"description"}
Then frontend UOwn mostra modal amigavel "Tivemos um problema, tente novamente"
And uown_esign_event_trigger_log registra esign_event="ERROR" com mensagem sanitizada
And lead permanece em CONTRACT_CREATED
And alerta operacional disparado
```

---

## US-EMB-06: Limpeza de Iframe via `close-iframe`

### Cenario 6.1: Iframe removido do DOM apos close-iframe
`@e2e @hybrid @priority-medium`

```gherkin
Given iframe ativo na pagina
When postMessage {type:"close-iframe"} recebido
Then frontend chama iframe.remove()
And listeners de postMessage limpos (sem memory leak)
And UI atualiza para tela seguinte (Confetes ou erro)
```

---

## US-EMB-07: Validacao de Origin

### Cenario 7.1: Mensagem de origem nao reconhecida descartada
`@regression @e2e @priority-high`

```gherkin
Given listener postMessage configurado em producao
When mensagem chega de origin="https://malicious.com"
Then mensagem descartada (sem efeito)
And uown_esign_event_trigger_log registra ORIGIN_REJECTED com origem
And nenhuma transicao de status ocorre
```

---

## US-EMB-08: Auto-Detecao do Provedor

### Cenario 8.1: Iframe gowsign.com → handler GowSign
`@regression @e2e @hybrid @priority-high`

```gherkin
Given iframe.src aponta para subdomain.gowsign.com
When polling de 3s × 12 inspeciona origin
Then handler GowSign selecionado em < 6s
And eventos completed/closed/error mapeados corretamente
And uown_esign_document.client = "GOWSIGN"
```

### Cenario 8.2: Timeout sem deteccao gera erro visivel
`@regression @e2e @priority-medium`

```gherkin
Given iframe com origin nao reconhecido
When polling 3s × 12 expira sem deteccao
Then erro visivel ao cliente
And uown_merchant_api_error_log registra "PROVIDER_DETECTION_TIMEOUT"
```

---

## US-EMB-09: Assinatura Sem Widget Buddy

### Cenario 9.1: PP pre-selecionado pula tela do Buddy
`@regression @e2e @hybrid @priority-medium`

```gherkin
Given documento com protectionPlanPreSelectedByMerchant=true
When cliente completa T&C
Then botao "PROCEED TO SIGNATURE" aparece direto (sem "See Protection Benefits")
And modal Buddy NAO renderiza
And cliente vai direto para iframe GowSign
```

---

## US-EMB-10: Botao Start Gate

### Cenario 10.1: Pagina renderiza com Start visivel mas sem disparar loaded
`@regression @e2e @priority-high`

```gherkin
Given documento OUTSTANDING
When cliente acessa data.url
Then pagina mostra:
  - Tabela de metadados (DOCUMENT ID, Recipient, Status)
  - Botoes Start, Download, Close
  - Conteudo do contrato visivel (`.gowsign-document`)
And NENHUM postMessage "loaded" foi disparado
```

### Cenario 10.2: Click em Start dispara loaded
`@regression @e2e @hybrid @db-validation @priority-high`

```gherkin
Given pre-condicao do cenario 10.1
When cliente clica em #startSignatureButton
Then postMessage {type:"loaded", documentId} e disparado
And widget de assinatura interativo carrega
And uown_esign_event_trigger_log recebe linha LOADED
```

---

## US-EMB-11: Browser Support Matrix

### Cenario Outline: Fluxo funciona em browsers tier-1
`@regression @e2e @manual @priority-medium`

```gherkin
Examples:
  | browser           | versao  | resultado                  |
  | Chrome            | latest  | fluxo completo OK          |
  | Chrome            | latest-1| fluxo completo OK          |
  | Safari            | latest  | fluxo completo OK          |
  | Firefox           | latest  | fluxo completo OK          |
  | Edge              | latest  | fluxo completo OK          |
  | Mobile Chrome     | Android | fluxo completo OK          |
  | Mobile Safari     | iOS     | fluxo completo OK          |
  | IE 11             | -       | bloqueado, mensagem clara  |
```

---

# EPICO 5: CICLO DE VIDA DO DOCUMENTO

## US-LCY-01: Status Inicial CREATED

### Cenario 1.1: Resposta do POST tem data.status=CREATED
`@smoke @api @priority-high`

```gherkin
When backend envia POST GowSign
Then resposta 200 com data.status="CREATED"
And documento ainda nao assinavel (PDF em geracao)
```

---

## US-LCY-02: Transicao CREATED → OUTSTANDING

### Cenario 2.1: Polling detecta OUTSTANDING em < 30s
`@regression @api @priority-high`

```gherkin
Given documento criado com status=CREATED
When polling GET a cada 5s
Then status="OUTSTANDING" detectado em < 30s
And pdfStatus="CREATED_GENERATED"
And email de assinatura enviado
```

---

## US-LCY-03: Transicao OUTSTANDING → SIGNED

### Cenario 3.1: Apos cliente assinar, signedDate populado
`@regression @api @e2e @hybrid @priority-high`

```gherkin
Given cliente completou assinatura
When backend chama GET /api/document/{id}
Then status="SIGNED"
And signedDate em formato ISO 8601
And signedPdfHash em formato SHA-256 hex
And signatureImage e rubricaImage populados (URLs ou data URIs)
```

---

## US-LCY-04: Transicao SIGNED → COMPLETED

### Cenario 4.1: Audit trail gerado leva a COMPLETED
`@regression @api @priority-medium`

```gherkin
Given documento em status=SIGNED
When polling GET ate pdfStatus="AUDIT_TRAIL_GENERATED"
Then status transita para "COMPLETED"
And pdfUrl disponivel (DOCX flow)
And uown_esign_document.status="COMPLETED"
And uown_los_lead_notes inclui "audit trail generated"
```

---

## US-LCY-05: Transicao para EXPIRED

### Cenario 5.1: Documento com expirationDate no passado vira EXPIRED
`@regression @api @priority-medium`

```gherkin
Given documento criado com expirationDate=NOW+5min (para teste rapido)
When aguarda 6 minutos
And GET /api/document/{id}
Then status="EXPIRED"
And cliente acessando link ve "Contract has expired"
And uown_los_contract.status="EXPIRED"
```

---

## US-LCY-06: Transicao para CANCELED

### Cenario 6.1: Cliente fecha sem assinar leva a CANCELED
`@e2e @hybrid @priority-high`

```gherkin
Given documento OUTSTANDING
When cliente clica Close document (postMessage closed)
Then status="CANCELED" (terminal)
And novas tentativas de assinar bloqueadas
```

### Cenario 6.2: Novo contrato cancela em cascata
Vide US-CRE-07.

---

## US-LCY-07: Todos os Valores de pdfStatus

### Cenario 7.1: Sequencia completa de pdfStatus observavel
`@regression @api @priority-medium`

```gherkin
Given documento criado e cliente assina
When backend monitora pdfStatus via polling
Then sequencia observada:
  CREATED_PENDING → CREATED_GENERATED → SIGNED_PENDING → SIGNED_GENERATED → AUDIT_TRAIL_PENDING → AUDIT_TRAIL_GENERATED
And cada transicao registrada em uown_esign_event_trigger_log
And uown_esign_document.pdf_status atualizado in-place
```

---

## US-LCY-08: Mapeamento Status GowSign → UOwn

### Cenario 8.1: Tabela de mapeamento aplicada corretamente
`@regression @api @db-validation @priority-high`

Examples:
| GowSign status | uown_los_contract.status | uown_los_lead.status |
| CREATED        | SENT                     | CONTRACT_CREATED     |
| OUTSTANDING    | SENT                     | CONTRACT_CREATED     |
| SIGNED         | SIGNED                   | SIGNED               |
| COMPLETED      | SIGNED                   | SIGNED               |
| EXPIRED        | EXPIRED                  | (mantem)             |
| CANCELED       | CANCELLED                | (mantem)             |

---

## US-LCY-09: Persistencia de Estado no UOwn

### Cenario 9.1: uown_esign_document populado com todos campos
`@regression @api @db-validation @priority-high`

```gherkin
Given documento criado e assinado
When SELECT * FROM uown_esign_document WHERE document_key={uuid}
Then linha contem:
  - document_key, esign_client, esign_mode, status
  - document_name, base64document_string IS NOT NULL (flag), base64signed_document_string IS NOT NULL (flag — schema real nao tem hash, apenas blob)
  - doc_signed_time_stamp (apos signed)
And uown_esign_event_trigger_log tem >= 3 eventos (CREATED, OUTSTANDING, COMPLETED)
```

---

# EPICO 6: POS-ASSINATURA

## US-POST-01: Lead Transita para SIGNED

Vide US-LSE-06 para detalhes completos. Cenarios cobrem positivo e idempotencia (US-LSE-12).

---

## US-POST-02: Auto-Move para FUNDING

### Cenario 2.1: Merchant com isSignedToFunding=true encadeia FUNDING
`@regression @api @db-validation @priority-high`

```gherkin
Given merchant com isSignedToFunding=true
When cliente assina contrato
Then transicoes em uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y'):
  - linha 1: CONTRACT_CREATED → SIGNED, source="GOWSIGN_COMPLETED_EVENT"
  - linha 2: SIGNED → FUNDING, source="AUTO_FUNDING_AFTER_SIGN"
And uown_los_lead_notes tem 2 notas separadas
```

### Cenario 2.2: Merchant sem flag mantem em SIGNED
`@regression @api @db-validation @priority-medium`

```gherkin
Given merchant com isSignedToFunding=false
When cliente assina
Then lease em SIGNED (nao transita FUNDING automaticamente)
```

---

## US-POST-03: Redirect para Merchant

### Cenario 3.1: Redirect com prioridade SVC_URL
`@regression @e2e @priority-medium`

```gherkin
Given env var SVC_URL="origination-dev1.uownleasing.com"
And merchant.merchantRedirectUrl="https://merchant.com/return"
When cliente assina (postMessage completed)
Then redirect URL = "https://origination-dev1.uownleasing.com/{shortCode}/complete?event=completed&ata={uuid}"
```

### Cenario 3.2: Cancelado redireciona com event=canceled
```gherkin
Given mesma config
When cliente fecha (closed event)
Then redirect URL contem "?event=canceled&ata={uuid}"
```

---

## US-POST-04: Tela de Confetes

### Cenario 4.1: Apos signed, Confetes renderiza
`@e2e @priority-medium`

```gherkin
Given cliente acabou de assinar
When redirect para /{shortCode}/complete
Then componente Confetes renderiza com:
  - Animacao confetti, fundo teal #31c3e7
  - Card branco com check icon
  - "Thank You!" + "Your contract has been successfully signed."
  - Telefone (877) 353-8696
And email de copia enviado
```

---

## US-POST-05: Plano de Protecao BW13

### Cenario 5.1: Merchant BW13 (TireAgent) abre widget Buddy
`@e2e @hybrid @priority-medium`

```gherkin
Given merchant TireAgent (BW13) sem PP pre-selecionado
When cliente completa T&C
Then botao "See Protection Benefits" aparece (substitui PROCEED)
And modal PurchaseInsurance abre com Buddy iframe
And widget carrega em 5-12s (com retry loop 5×3s)
```

---

## US-POST-06: Cancelamento de Contratos Anteriores

Vide US-CRE-07.

---

## US-POST-07: CC Peek Consent Extraido

### Cenario 7.1: Apos signed, CC Peek consent persistido
`@regression @api @db-validation @priority-high`

```gherkin
Given documento com checkbox term="cc_peek_consent" marcado
When cliente assina
Then GET /api/document/{id} retorna fields[] com "cc_peek_consent" value=true
And uown_los_lead.cc_peek_consent=true (ou tabela auditoria)
And uown_los_lead_notes inclui "CC Peek consent extracted from signed document"
```

---

## US-POST-08: Signing Fee Cobrada

### Cenario 8.1: Signing fee cobrada antes do POST GowSign
`@regression @api @db-validation @priority-high`

```gherkin
Given lead em CC_AUTH_PASSED
When sistema dispara fluxo de signing fee
Then uown_los_credit_card_transaction tem linha CAPTURE/SALE com type="FEE", status="APPROVED"
And recibo enviado por email
And entao backend chama POST GowSign (em sequencia)
```

### Cenario 8.2: Falha de signing fee bloqueia GowSign
```gherkin
Given CC sem fundos
When sistema tenta cobrar signing fee
Then transacao retorna DECLINED
And lead transita para SIGNING_FEE_DENIED
And POST GowSign NAO e chamado
```

---

## US-POST-09: PP Pre-Selecionado Ativado

### Cenario 9.1: Apos signed, PP merchant-preselected ativa policy automaticamente
`@regression @api @db-validation @priority-medium`

```gherkin
Given lead com uown_los_protection_plan.opt_in_source="MERCHANT_PRESELECTED"
When cliente assina
Then backend chama Buddy API para criar policy
And uown_los_protection_plan.policy_id populado
And uown_los_protection_plan.status="ACTIVE"
And uown_los_lead_notes inclui "Pre-selected Protection Plan activated"
```

### Cenario 9.2: Falha na ativacao alerta operacional sem reverter assinatura
```gherkin
Given Buddy API retorna 5xx
When ativacao falha
Then signed permanece valido
And uown_los_protection_plan.status="FAILED"
And alerta operacional disparado para retry manual
```

---

# EPICO 7: COMUNICACAO

## US-COM-01: Email de Assinatura Default

### Cenario 1.1: sendSignatureEmail=true gera email
`@regression @api @e2e @priority-high`

```gherkin
When POST com sendSignatureEmail=true (ou ausente)
Then email enviado pelo GowSign automaticamente
And email contem nome do cliente, titulo do contrato, link data.url
```

---

## US-COM-02: Email Suprimido para Embed

### Cenario 2.1: sendSignatureEmail=false nao envia email
`@regression @api @priority-medium`

```gherkin
When POST com sendSignatureEmail=false (fluxo embed)
Then nenhum email de link enviado
And email de confirmacao pos-assinatura ainda enviado (independente)
```

---

## US-COM-03: Reminder Apos N Dias

### Cenario 3.1: mustReminder=true + reminderDaysAmount=3 envia em 3 dias
`@regression @api @priority-low`

```gherkin
Given documento OUTSTANDING criado em D
And mustReminder=true, reminderDaysAmount=3
When 3 dias passam sem signed
Then reminder enviado em D+3
```

---

## US-COM-04: Expiracao do Documento

Vide US-LCY-05.

---

## US-COM-05: Sandbox vs Producao

### Cenario 5.1: isSandbox=true marca documento como teste
`@regression @api @priority-medium`

```gherkin
When POST com isSandbox=true
Then documento criado com flag visivel
And NAO tem validade juridica
And NAO conta para limites de uso
```

### Cenario 5.2: Em ambientes nao-prod, isSandbox forcado
```gherkin
Given env=qa1
When backend cria contrato
Then isSandbox=true forcado por config (mesmo se request omitir)
```

---

## US-COM-06: Idioma do Contrato

### Cenario 6.1: Default em ingles US
`@regression @api @priority-medium`

```gherkin
When POST sem locale
Then templates renderizam em ingles US
And email em ingles
```

---

## US-COM-07: Telefone Opcional

### Cenario 7.1: phoneNumber em E.164 aceito
`@regression @api @priority-low`

```gherkin
When POST com requester.phoneNumber="+19071234567"
Then resposta 200 OK
And data.Requester.phoneNumber preserva formato
```

### Cenario 7.2: phoneNumber ausente nao bloqueia
```gherkin
When POST sem phoneNumber
Then resposta 200 OK
And documento criado normalmente
```

---

# EPICO 8: CALLBACKS / WEBHOOKS

## US-CB-01: Callback Custom Retornado

### Cenario 1.1: Callback custom preserva campos no webhook
`@regression @api @db-validation @priority-medium`

```gherkin
Given POST com callback={orderId:"ORD-123", customerId:"CUST-456"}
When evento webhook chega apos signed
Then payload do webhook inclui callback original integralmente
And tipos preservados (string, number, boolean)
```

---

## US-CB-02: Strapi Enriquece Callback

### Cenario 2.1: Fluxo Strapi adiciona event_hash, event_time, etc.
`@regression @api @priority-medium`

```gherkin
Given POST Strapi com callback={orderId:"ORD-1"}
When webhook chega
Then payload contem:
  - callback.orderId="ORD-1"
  - callback.event_hash (SHA-256 valido)
  - callback.event_time (ISO 8601)
  - callback.event_type="document_created"
  - callback.Provider="GOWSign"
  - callback.Meta.related_document_hash={documentId}
```

---

## US-CB-03: Idempotencia de Webhook

### Cenario 3.1: Mesmo evento 2x produz 1 transicao
`@regression @api @db-validation @priority-high`

```gherkin
Given webhook completed recebido para documento X
When mesmo webhook recebido novamente (retry)
Then 2a chamada retorna 200 sem efeito colateral
And uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') tem 1 linha (nao 2) para CONTRACT_CREATED→SIGNED
And email de confirmacao enviado 1 vez
```

---

## US-CB-04: Falha de Webhook Nao Bloqueia GowSign

### Cenario 4.1: Webhook receiver com 5xx nao reverte status no GowSign
`@regression @api @priority-medium`

```gherkin
Given webhook receiver UOwn retorna 503 temporariamente
When GowSign tenta entregar webhook completed
Then GowSign retenta com backoff
And documento no GowSign permanece SIGNED
And reconciliation sweep eventualmente sincroniza UOwn (US-LSE-16)
```

---

# EPICO 9: VISUALIZACAO (LISTAGEM NO PORTAL)

## US-LST-01: Listagem Paginada

### Cenario 1.1: GET /api/document?page=1&pageSize=10 retorna pagina
`@smoke @api @priority-medium`

```gherkin
Given existem 25 documentos
When GET /api/document?page=1&pageSize=10
Then resposta 200 com data array de 10 items
And meta.pagination = {page:1, pageSize:10, total:25, pageCount:3}
```

---

## US-LST-02: Filtro por Status

### Cenario 2.1: ?status=OUTSTANDING&status=SIGNED filtra multiplos
`@regression @api @priority-medium`

```gherkin
Given documentos em varios status
When GET /api/document?status=OUTSTANDING&status=SIGNED
Then resposta contem apenas documentos com esses 2 status
```

---

## US-LST-03: Busca por Title ou Email

### Cenario 3.1: Busca por email retorna match
`@regression @api @priority-medium`

```gherkin
Given documento criado para "joao.silva@example.com"
When GET /api/document?search=joao.silva@example.com
Then resposta contem o documento
```

### Cenario 3.2: Busca sem match retorna lista vazia
```gherkin
When GET /api/document?search=nao-existe@x.com
Then resposta 200 com data=[] (lista vazia, nao 404)
```

---

## US-LST-04: Ordenacao por Data

### Cenario 4.1: orderBy=signedDate:desc ordena
`@regression @api @priority-low`

```gherkin
When GET /api/document?orderBy=signedDate:desc
Then primeiros documentos sao os assinados mais recentes
And documentos com signedDate=null sao tratados conforme regra (final ou inicio)
```

---

# EPICO 10: TRATAMENTO DE ERROS

## US-ERR-01: Chave de API Invalida (401)

### Cenario 1.1: Sem header x-api-key retorna 401
`@regression @api @priority-high`

```gherkin
When POST sem header x-api-key
Then resposta 401 com error.type=401
And envelope completo: {data:null, meta:null, error:{type, message}, valid:false, responseData:null}
```

### Cenario 1.2: Chave invalida retorna 401
```gherkin
When POST com x-api-key="invalid_key"
Then resposta 401 com error.message="Invalid or inactive API key"
```

---

## US-ERR-02: IP Nao Permitido

### Cenario 2.1: Request de IP fora da allowlist rejeitado
`@regression @api @priority-high`

```gherkin
Given chave configurada com IP allowlist
When request vem de IP nao listado
Then resposta 401
And alerta operacional disparado
```

---

## US-ERR-03: Campo Obrigatorio Ausente

### Cenario Outline: Cada campo obrigatorio gera 400
`@regression @api @priority-high`

Examples:
| campo ausente              | flow   | error esperado                                 |
| requester.name             | DOCX   | "name is required"                             |
| requester.email            | DOCX   | "email is required"                            |
| document.documentBase64    | DOCX   | "documentBase64 is required"                   |
| document.customTemplate    | HTML   | "customTemplate is required"                   |
| document.customTitle       | HTML   | "customTitle is required"                      |
| document.templateId        | STRAPI | "templateId is required"                       |
| document.callback.environment | STRAPI | "environment is required"                  |

```gherkin
When POST com campo {campo} ausente
Then resposta 400 com error.type=400
And mensagem identifica o campo
```

---

## US-ERR-04: Combinacoes Invalidas

### Cenario 4.1: DOCX + customTemplate rejeitado
`@regression @api @priority-medium`

```gherkin
When POST envia documentBase64 + customTemplate
Then resposta 400 com mensagem identificando conflito
```

### Cenario 4.2: HTML + fields[] rejeitado
```gherkin
When POST com customTemplate + fields[]
Then resposta 400: "Fields can only be provided when documentBase64 is present"
```

---

## US-ERR-05: Width/Height Invalidos

Vide US-FLD-07.

---

## US-ERR-06: Strapi templateId Inexistente

### Cenario 6.1: 404 com mensagem clara
`@regression @api @priority-medium`

```gherkin
When POST Strapi com templateId="nao-existe"
Then resposta 404 com error.type=404
And mensagem indica template nao encontrado
```

---

## US-ERR-07: Strapi Environment Invalido

### Cenario 7.1: Environment nao listado retorna 500 com mensagem
`@regression @api @priority-medium`

```gherkin
Given templateId valido com environments=["production","stg"]
When POST com callback.environment="dev"
Then resposta 500 com error.message="Template not available for the requested environment."
```

---

## US-ERR-08: Template Strapi Vazio

### Cenario 8.1: Template sem conteudo retorna 500
`@regression @api @priority-low`

```gherkin
Given template existe no Strapi mas sem content/title
When POST com esse templateId
Then resposta 500 com error.message="Template content and title are missing."
```

---

## US-ERR-09: GET com UUID Inexistente

### Cenario 9.1: GET com UUID nao cadastrado retorna 404
`@regression @api @priority-medium`

```gherkin
When GET /api/document/00000000-0000-0000-0000-000000000000
Then resposta 404 com error.message="Document with the given ID not found"
```

---

## US-ERR-10: GowSign Indisponivel

### Cenario 10.1: Timeout 30s gera retry com backoff
`@regression @api @priority-medium`

```gherkin
Given GowSign nao responde
When backend POST timeout em 30s
Then 3 retries com backoff exponencial
And lead permanece em CONTRACT_CREATED apos falhas
And alerta operacional
```

---

## US-ERR-11: Envelope de Erro Padronizado

### Cenario 11.1: Toda resposta tem 5 campos no root
`@regression @api @priority-high`

```gherkin
Given qualquer resposta GowSign (sucesso ou erro)
Then JSON root contem: data, meta, error, valid, responseData
And valid:boolean (true em sucesso, false em erro)
And error preenchido apenas em valid=false
```

---

## US-ERR-12: Reconciliacao Pos-Falha

Vide US-LSE-16.

---

## US-ERR-13: expirationDate no Passado

### Cenario 13.1: Backend valida e rejeita
`@regression @api @priority-medium`

```gherkin
When POST com document.expirationDate="2020-01-01T00:00:00Z"
Then resposta 400 ValidationError
And nenhum POST chega ao GowSign
And uown_merchant_api_error_log recebe linha
```

---

# EPICO 11: SEGURANCA

## US-SEC-01: API Key Nao Logada

### Cenario 1.1: Logs mascaram x-api-key
`@regression @api @priority-high`

```gherkin
When backend chama POST GowSign
Then logs do client HTTP UOwn contem "x-api-key: gs_***"
And nunca a chave completa
```

---

## US-SEC-02: documentBase64 Nao Logado

### Cenario 2.1: Logger redige content
`@regression @api @priority-high`

```gherkin
When POST com documentBase64
Then logs contem hash/length do base64, nunca conteudo bruto
```

---

## US-SEC-03: PII no Callback Nao Excessiva

### Cenario 3.1: Callback nao contem SSN/CC
`@regression @api @priority-high`

```gherkin
Given callback={orderId, customerId, leadPk}
When inspecao do callback enviado
Then NAO contem ssn, full_credit_card, account_number
```

---

## US-SEC-04: IP Allowlist Atualizada

### Cenario 4.1: IPs UOwn registrados no GowSign
`@manual @priority-medium`

```gherkin
Given lista de IPs de saida UOwn (NAT egress)
Then todos estao na allowlist do painel GowSign
And nova region adicionada antes de mudanca de IP
```

---

## US-SEC-05: Sandbox Isolado

### Cenario 5.1: Chaves separadas, base URLs separadas
`@manual @priority-high`

```gherkin
Given config de sandbox e prod
Then chaves diferentes, URLs diferentes
And webhook receiver valida origem por env
And isSandbox=true forcado em qa
```

---

# EPICO 12: CONTEUDO E ACESSO AO DOCUMENTO

## US-DOC-01: Property Price Tag Bate com Calculadora

### Cenario 1.1: Valores no contrato == paymentDetailsList API
`@regression @api @hybrid @priority-high`

```gherkin
Given lead com paymentDetailsList[idx]={totalOfPayments:1340.50, leaseCost:766.50, cashPrice:574.00, regularPaymentWithTax:23.06, numberOfPayments:56, recurringFrequency:"WEEKLY"}
When PDF gerado e extraido via pdf-parse
Then Property Price Tag mostra:
  - TOTAL OF PAYMENTS = $1340.50
  - COST OF LEASE = $766.50
  - CASH PRICE = $574.00
  - AMOUNT OF EACH PAYMENT = $23.06
  - NUMBER OF PAYMENTS = 56
  - RENEWAL PERIOD = WEEKLY
And validacao matematica: 23.06 × 56 = 1291.36 ≈ totalOfPayments-tax (tolerancia $0.01)
And Property Price Tag aparece 2x no contrato (header + final apos NOTICE)
```

---

## US-DOC-02: Dados do LESSEE

### Cenario 2.1: Nome, endereco, telefone batem com aplicacao
`@regression @hybrid @priority-high`

```gherkin
Given lead com customerFirstName="Andrey", customerLastName="Galvin", customerStreetAddress="1120 S Grand Ave", ...
When PDF e extraido
Then LESSEE name = "Andrey Galvin"
And LESSEE address = "1120 S Grand Ave, Los Angeles, CA 90015"
And LESSEE telephone formato (XXX) XXX-XXXX
```

---

## US-DOC-03: LESSOR Correto por Estado

### Cenario 3.1: AK usa "KW-Choice Alaska LLC"
`@regression @hybrid @priority-high`

```gherkin
Given lead com customerState="AK"
When contrato gerado
Then LESSOR name = "KW-Choice Alaska LLC"
```

### Cenario 3.2: Maioria dos estados usa "Mollie, LLC, dba Uown"
```gherkin
Given lead com customerState="CA"
When contrato gerado
Then LESSOR name = "Mollie, LLC, dba Uown"
```

---

## US-DOC-04: Description of Property

### Cenario 4.1: Items batem com invoice
`@regression @hybrid @priority-high`

```gherkin
Given invoice tem items=[{code:"CA-WASH-45FT", desc:"Washer 4.5 cu ft", serial:"SKU-CA-WASH-001", price:596.00}]
When PDF extraido
Then tabela #leaseItems contem linha correspondente
And Total Delivery Fee = $25.00 (config)
```

---

## US-DOC-05: Initial Payment Breakdown

### Cenario 5.1: Soma dos componentes = Total Initial Payment
`@regression @hybrid @priority-high`

```gherkin
Given Initial Lease Payment=$23.06, Processing Fee=$49.00, Tax=$0.00
When PDF extraido
Then breakdown mostra cada componente
And Total Initial Payment = $72.06 (soma exata, tolerancia $0.01)
```

---

## US-DOC-06: EPO Chart com N Linhas

### Cenario 6.1: 56 linhas para 13m WEEKLY
`@regression @hybrid @priority-high`

```gherkin
Given documento com numberOfPayments=56
When EPO chart extraido
Then tabela tem exatamente 56 linhas
And linha 1: Payment=$72.06, EPO=$683.00 (3-month payoff)
And linha 13: EPO ≈ $297 (final do periodo promocional)
And linha 14: EPO ≈ $478 (salto de regra para proporcional)
And linha 56: EPO ≈ $11.12 (valor residual minimo)
And valores monotonicamente decrescentes apos linha 14
```

### Cenario 6.2: 28 linhas para 13m BI_WEEKLY
```gherkin
Given numberOfPayments=28
Then EPO chart tem 28 linhas
```

---

## US-DOC-07: 3-Month Promotional Payoff

### Cenario 7.1: Valor calculado corretamente
`@regression @hybrid @priority-medium`

```gherkin
Given cashPrice=$574.00, buyoutFee=$60.00, tax=0
When promocional payoff extraido
Then valor = $574.00 + $60.00 = $634.00 + tax (renderizado como $683.00 no exemplo)
And expirationDate = Initial Payment Date + 90 dias
```

---

## US-DOC-08: ACH Grid

### Cenario 8.1: Total Cost identico em todas frequencias
`@regression @hybrid @priority-high`

```gherkin
Given allowedFrequencies=[Weekly, Bi-Weekly]
When ACH grid extraido
Then linhas mostram:
  - Weekly: 56 × $23.06 = $1340.50
  - Bi-Weekly: 28 × $46.12 = $1340.50
And Total Cost identico em todas (validacao matematica)
And linha da frequencia escolhida tem iniciais marcadas (ex: "SG")
```

---

## US-DOC-09: Datas no Contrato

### Cenario 9.1: Agreement Number formato UOWN_<rand>_<leadPk>
`@regression @hybrid @priority-high`

```gherkin
Given lead pk=15705
When contrato gerado
Then Agreement Number = "UOWN_<rand>_15705"
And Account = "15705"
And Date = MM/DD/YYYY de geracao
And Initial Payment due date = firstPaymentDate
And 3-Month Promo expiration = Initial + 90 dias
```

---

## US-DOC-10: Template por Estado

### Cenario 10.1: Header indica sufixo do estado
`@regression @hybrid @priority-high`

```gherkin
Given customerState="CA"
When PDF extraido
Then header contem "CONSUMER LEASE-PURCHASE AGREEMENT-CA"
And clausula 11 (Income Interruption) presente (CA-specific)
And clausula 8 (Reinstatement 10 dias / 1 ano) presente
```

### Cenario 10.2: Estado bloqueado nao gera contrato
```gherkin
Given customerState="NJ"
Then stateCheck rejeita aplicacao no Step 1
And contrato GowSign NAO e criado
```

---

## US-DOC-11: Fees Adicionais

### Cenario 11.1: Returned Payment Charge = $25.00
`@regression @hybrid @priority-medium`

```gherkin
When PDF extraido
Then clausula 7(a) menciona "$25.00"
And Late Fee rule = "lesser of 5% of payment or $5, but at least $2"
```

---

## US-DOC-12: Validacao Cruzada API ↔ Contrato

### Cenario 12.1: Helper extractContractValues() retorna tipado
`@regression @hybrid @db-validation @priority-high`

```gherkin
Given documento assinado com pdfUrl
When helper extractContractValues(pdf) executado
Then retorna objeto com {totalOfPayments, costOfRental, cashPrice, paymentAmount, numberOfPayments, rentalPeriod, agreementNumber, lesseeName, lessorName, epoChart, ...}
And cada campo bate com paymentDetailsList[idx] da API (tolerancia $0.01)
```

---

## US-DOC-13: Cliente Baixa Contrato pelo Botao Download

### Cenario 13.1: Download pre-assinatura retorna PDF draft
`@e2e @priority-high`

```gherkin
Given documento OUTSTANDING
When cliente clica botao Download
Then PDF baixado com Content-Type=application/pdf
And filename = "contract-{agreementNumber}.pdf"
And PDF abre corretamente em readers
And size < 2 MB para contrato tipico
```

### Cenario 13.2: Download pos-assinatura tem hash do signedPdfHash
`@regression @hybrid @priority-high`

```gherkin
Given documento SIGNED com signedPdfHash retornado pelo GET
When cliente clica Download
Then SHA-256 do PDF baixado == signedPdfHash
And PDF mostra assinaturas/iniciais visualmente
And audit trail anexado se pdfStatus=AUDIT_TRAIL_GENERATED
```

### Cenario 13.3: Download multiplo nao corrompe
Vide US-RES-05.

### Cenario 13.4: Download em embed mode abre nova aba
`@e2e @priority-medium`

```gherkin
Given iframe ativo
When cliente clica Download
Then nova aba/janela abre com PDF
And iframe permanece ativo (sem redirect)
And eventos postMessage continuam funcionando
```

---

## US-DOC-14: Audit Trail Anexado

### Cenario 14.1: PDF apos AUDIT_TRAIL_GENERATED tem audit pages
`@regression @hybrid @priority-medium`

```gherkin
Given documento em pdfStatus=AUDIT_TRAIL_GENERATED
When PDF baixado e extraido
Then ultimas paginas contem audit trail com:
  - Document ID, Created/Signed dates
  - Requester info, IP, user-agent
  - Eventos loaded/completed com timestamps
  - geoLocation, deviceInfo
  - signedPdfHash
And hash em audit trail bate com API
```

---

## US-DOC-15: Geolocalizacao e Device Fingerprint

### Cenario 15.1: Metadata capturado apos signed
`@regression @hybrid @priority-medium`

```gherkin
Given cliente assina contrato
When GET /api/document/{id}
Then data.Metadata contem clientName, email, userDateTime, deviceInfo, geoLocation, ipAddress
And uown_esign_document.metadata (JSONB) populado
And audit trail PDF reflete esses dados
```

---

# EPICO 13: STATUS DO LEASE EM CADA ACAO

## US-LSE-01: Pre-Condicao Lease em CC_AUTH_PASSED

### Cenario 1.1: Lead em UW_DENIED rejeitado pre-POST
`@regression @api @db-validation @priority-high`

```gherkin
Given lead pk=42 em status="UW_DENIED"
When backend tenta criar contrato
Then operacao rejeitada com "INVALID_LEAD_STATUS_FOR_CONTRACT"
And POST GowSign NAO executado
And uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem nova linha
And uown_merchant_api_error_log recebe linha
```

### Cenario 1.2: Lead em SIGNED bloqueia recriacao
```gherkin
Given lead em "SIGNED"
When backend tenta criar novo contrato
Then operacao rejeitada com "Invalid lead status Contract Signed" (Task #1240)
```

---

## US-LSE-02: Lease → CONTRACT_CREATED Apos POST

### Cenario 2.1: Transicao + log atomicos
`@regression @api @db-validation @priority-high`

```gherkin
Given lead em "CC_AUTH_PASSED"
When POST GowSign retorna 200 com data.id
Then na MESMA transacao DB:
  - uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') nova linha CC_AUTH_PASSED→CONTRACT_CREATED, source="GOWSIGN_CONTRACT_CREATED"
  - uown_los_lead_notes nova linha "Contract created via GowSign — documentId={uuid}, mode={DOCX|HTML|STRAPI}"
  - uown_esign_event_trigger_log nova linha esign_event="CREATED"
  - uown_esign_document inserido com status="CREATED"
  - uown_los_contract.status="SENT"
```

---

## US-LSE-03: Lease Permanece Apos PDF Gerado

### Cenario 3.1: pdfStatus=CREATED_GENERATED nao move lease
`@regression @api @db-validation @priority-high`

```gherkin
Given documento criado, pdfStatus=CREATED_PENDING
When polling detecta pdfStatus=CREATED_GENERATED, status=OUTSTANDING
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem novas linhas (regressao explicita)
And uown_esign_event_trigger_log recebe esign_event="OUTSTANDING"
And uown_esign_document.status="OUTSTANDING", pdf_status="CREATED_GENERATED"
```

---

## US-LSE-04: Lease Inalterado Apos `loaded`

### Cenario 4.1: postMessage loaded nao move lease
`@regression @hybrid @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING
When evento loaded recebido (cliente clicou Start)
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem nova linha
And uown_esign_event_trigger_log recebe esign_event="LOADED"
And lead permanece em CONTRACT_CREATED
```

### Cenario 4.2: Re-load (cliente abre 2x) gera 2 logs
```gherkin
When cliente clica Start no mesmo documento 2x (em sessoes diferentes)
Then uown_esign_event_trigger_log tem 2 linhas LOADED
And lease permanece em CONTRACT_CREATED
```

---

## US-LSE-05: Interacoes Com Fields Nao Movem

### Cenario 5.1: Cliente preenche 95% dos campos sem submeter
`@regression @e2e @hybrid @priority-medium`

```gherkin
Given cliente preencheu signature, todas iniciais, mas nao clicou Submit
When ele fecha browser
Then lead permanece em CONTRACT_CREATED
And documento OUTSTANDING (nao SIGNED)
And uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem nova linha
```

---

## US-LSE-06: Lease → SIGNED Apos `completed`

### Cenario 6.1: Transicao completa com log
`@smoke @e2e @hybrid @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING
When postMessage completed recebido
Then na MESMA transacao DB:
  - uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y'): CONTRACT_CREATED→SIGNED, source="GOWSIGN_COMPLETED_EVENT"
  - uown_los_lead_notes: "Contract signed via GowSign — documentId, signedAt, hash"
  - uown_esign_event_trigger_log: esign_event="COMPLETED"
  - uown_esign_document.status="SIGNED", doc_signed_time_stamp populado, base64signed_document_string IS NOT NULL (flag — schema real nao tem hash, apenas blob) populado
  - uown_los_contract.status="SIGNED", doc_signed_time_stamp populado
And cadeia pos-assinatura iniciada (CC Peek, plano, redirect)
```

---

## US-LSE-07: Auto-Move SIGNED → FUNDING

### Cenario 7.1: 2 linhas distintas em status_history
`@regression @api @db-validation @priority-high`

```gherkin
Given merchant.isSignedToFunding=true
When cliente assina
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') tem EXATAMENTE 2 linhas novas:
  | linha 1 | from=CONTRACT_CREATED | to=SIGNED  | source=GOWSIGN_COMPLETED_EVENT     |
  | linha 2 | from=SIGNED           | to=FUNDING | source=AUTO_FUNDING_AFTER_SIGN     |
And uown_los_lead_notes tem 2 notas separadas
And linha 2.change_date >= linha 1.change_date
```

---

## US-LSE-08: Lease Permanece Apos `closed`

### Cenario 8.1: Cliente fecha sem assinar
`@e2e @hybrid @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING
When postMessage closed recebido
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem nova linha
And uown_los_lead_notes: "Customer declined contract via GowSign — action=closed_without_signing"
And uown_esign_event_trigger_log: esign_event="CLOSED"
And uown_esign_document.status="CANCELED"
And uown_los_contract.status="CANCELLED"
And lead permanece em CONTRACT_CREATED (sem regressao)
```

---

## US-LSE-09: Lease Permanece Apos `error`

### Cenario 9.1: Error recebido com mensagem
`@regression @e2e @hybrid @db-validation @priority-medium`

```gherkin
Given documento OUTSTANDING
When postMessage error recebido com error.message="Document not found"
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem nova linha
And uown_los_lead_notes WARN: "E-sign error — message='Document not found'"
And uown_esign_event_trigger_log: esign_event="ERROR" com mensagem sanitizada
And uown_merchant_api_error_log recebe linha
And alerta operacional disparado
```

---

## US-LSE-10: `close-iframe` Apenas UI

### Cenario 10.1: Sem mudanca de DB alem de event_log
`@regression @hybrid @db-validation @priority-low`

```gherkin
When postMessage close-iframe recebido
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') sem mudanca
And uown_esign_event_trigger_log: esign_event="CLOSE_IFRAME"
And uown_los_lead_notes nao recebe linha (evita ruido)
```

---

## US-LSE-11: EXPIRED Durante Espera

### Cenario 11.1: Reconciliation detecta expirou
`@regression @api @db-validation @priority-medium`

```gherkin
Given documento criado com expirationDate=NOW+1min
When 2 minutos passam
And reconciliation sweep ou polling detecta status=EXPIRED no GowSign
Then uown_esign_document.status="EXPIRED"
And uown_los_contract.status="EXPIRED"
And lead permanece em CONTRACT_CREATED
And uown_los_lead_notes: "Contract expired — documentId without signing"
And uown_esign_event_trigger_log: esign_event="EXPIRED"
```

---

## US-LSE-12: Idempotencia `completed` 2x

### Cenario 12.1: Mesmo evento via postMessage E webhook
`@regression @api @db-validation @priority-high`

```gherkin
Given documento OUTSTANDING
When postMessage completed recebido em t=100ms
And webhook completed recebido em t=300ms (mesmo documentId, mesmo event_hash)
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') tem EXATAMENTE 1 linha CONTRACT_CREATED→SIGNED
And uown_los_lead_notes tem 1 nota (nao 2)
And uown_esign_event_trigger_log tem 2 linhas COMPLETED com flag is_duplicate=true na 2a
And cadeia pos-assinatura executada 1 vez (CC Peek nao 2x, etc.)
```

---

## US-LSE-13: Race Condition postMessage vs Webhook

### Cenario 13.1: Stress test 100 pares paralelos
`@regression @api @db-validation @priority-high`

```gherkin
Given 100 leads em OUTSTANDING
When para cada lead, disparar postMessage E webhook quase simultaneamente
Then cada lead termina com EXATAMENTE 1 linha SIGNED em uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y')
And nao ha deadlock observado
And lock por documentId previne corrupcao
```

---

## US-LSE-14: Reversal Protection

### Cenario 14.1: closed apos SIGNED ignorado
`@regression @api @db-validation @priority-high`

```gherkin
Given lead em SIGNED
When postMessage closed recebido (cenario raro/bug)
Then uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') SEM nova linha (sem regressao)
And uown_esign_event_trigger_log: linha com flag was_ignored=true, ignore_reason="LEAD_TERMINAL_STATE"
And uown_los_lead_notes WARN: "received 'closed' event for already-SIGNED lead — ignored"
And SELECT to_status FROM uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') WHERE lead_pk ORDER BY change_date DESC LIMIT 1 retorna SIGNED (inalterado)
```

---

## US-LSE-15: Cancelamento em Cascata Nao Regride

### Cenario 15.1: Tentativa de novo contrato em SIGNED bloqueada
`@regression @api @priority-high`

```gherkin
Given lead em SIGNED
When backend tenta criar novo contrato
Then operacao rejeitada com "INVALID_LEAD_STATUS_FOR_CONTRACT"
And lead permanece em SIGNED
```

---

## US-LSE-16: Reconciliacao Detecta Divergencia

### Cenario 16.1: Sweep corrige status local
`@regression @api @db-validation @priority-medium`

```gherkin
Given documento UOwn em OUTSTANDING (local)
And documento real GowSign em SIGNED (webhook foi perdido)
When reconciliation sweep executa
Then detecta divergencia
And aplica transicao SIGNED com source="RECONCILIATION_SWEEP"
And uown_los_lead_notes: "Reconciliation detected status divergence"
And uown_esign_event_trigger_log: esign_event="RECONCILED"
And metrica de reconciliations incrementa
```

---

# EPICO 14: OPERACOES MERCHANT + OPERADOR

## US-OPS-01: Merchant Submete Aplicacao

### Cenario 1.1: Pipeline completo do merchant ate criacao GowSign
`@e2e @hybrid @db-validation @priority-high`

```gherkin
Given merchant autenticado no portal
When merchant submete aplicacao com SSN, address, items
Then pipeline UOwn executa (UW → SSN → CC auth)
And apos CC_AUTH_PASSED, POST GowSign disparado automaticamente
And resposta inclui providerURL para o merchant
And uown_esign_document criado com esign_client conforme resolver
```

---

## US-OPS-02: Merchant Visualiza Status

### Cenario 2.1: Lista filtrada apenas do merchant
`@regression @e2e @api @priority-medium`

```gherkin
Given operador merchant pk=42
When GET /api/merchant/42/contracts
Then resposta contem apenas contratos do merchant 42 (multi-tenancy)
And cada item tem id, status, customer, dates
```

### Cenario 2.2: Status atualiza em < 30s apos transicao
```gherkin
Given merchant olhando lista
When cliente assina contrato (signed)
Then status no portal merchant atualiza para SIGNED em < 30s (polling ou push)
```

---

## US-OPS-03: Merchant Cancela Contrato

### Cenario 3.1: Cancelamento manual em SENT
`@regression @api @db-validation @priority-medium`

```gherkin
Given contrato SENT pertencente ao merchant
When merchant clica Cancel + confirma
Then uown_los_contract.status="CANCELLED", cancelled_by_user_pk=merchant
And uown_esign_document.status="CANCELED"
And lead permanece em CONTRACT_CREATED
And cliente acessando link ve "Contract was cancelled by the merchant"
```

### Cenario 3.2: Tentativa de cancelar SIGNED bloqueada
```gherkin
Given contrato SIGNED
When merchant tenta cancelar
Then operacao rejeitada com 409 Conflict
```

---

## US-OPS-04: Merchant Recebe Notificacao de Assinatura

### Cenario 4.1: Email enviado apos signed
`@regression @api @priority-medium`

```gherkin
Given merchant.notification_email="ops@merchant.com"
When cliente assina contrato
Then email enviado para ops@merchant.com com assunto "Contract signed: {customer name}"
And uown_correspondence_logs: type="CONTRACT_SIGNED_NOTIFICATION", status="SENT"
```

### Cenario 4.2: Webhook merchant chamado
```gherkin
Given merchant.webhook_url configurado
When cliente assina
Then POST para webhook_url com payload do evento
And falha (5xx) nao reverte assinatura
```

---

## US-OPS-05: Operador Reenvia Link

### Cenario 5.1: Reenvio gera novo email com link existente
`@regression @api @db-validation @priority-medium`

```gherkin
Given operador autenticado, contrato OUTSTANDING
When operador clica "Resend Email"
Then email reenviado para mesmo destinatario
And uown_correspondence_logs: type="SIGNATURE_LINK_RESENT", sent_by_user_pk=operador
And uown_los_lead_notes: "Signature email resent by operator {id}"
```

### Cenario 5.2: Limite de N reenvios por dia
```gherkin
Given 3 reenvios ja feitos hoje (limite=3)
When operador tenta reenviar 4o
Then resposta 429 com mensagem de limite
```

---

## US-OPS-06: Operador Cancela Manualmente

### Cenario 6.1: Cancelamento com motivo + confirmacao 2-fator
`@regression @api @db-validation @priority-medium`

```gherkin
Given operador admin, contrato em CONTRACT_CREATED
When operador clica Cancel + insere reason="Fraud detected" + PIN
Then operacao requer confirmacao 2-fator
And uown_los_contract.status="CANCELLED"
And uown_los_lead_notes: "Contract cancelled manually by operator {id} — reason: Fraud detected"
And uown_esign_event_trigger_log: esign_event="CANCELLED_BY_OPERATOR"
```

---

## US-OPS-07: Operador Corrige Dados Pre-Contrato

### Cenario 7.1: Edicao de endereco antes do contrato
`@regression @api @db-validation @priority-medium`

```gherkin
Given lead em CC_AUTH_PASSED
When operador edita customerStreetAddress de "123 Main" para "123 Main Apt 4"
Then uown_los_lead.street_address atualizado
And uown_los_lead_notes: field="street_address", old="123 Main", new="123 Main Apt 4", user_id, timestamp
And contrato gerado em seguida usa endereco corrigido
```

### Cenario 7.2: Edicao apos contrato bloqueada
```gherkin
Given lead em CONTRACT_CREATED (contrato GowSign ja criado)
When operador tenta editar endereco
Then operacao rejeitada — exige cancelar contrato e refazer
```

---

## US-OPS-08: Filtro por Merchant

### Cenario 8.1: GET com merchant_pk filtra
`@regression @api @priority-medium`

```gherkin
When GET /api/document?merchant_pk=42
Then todos resultados sao do merchant 42
And combinavel com status, search, orderBy
```

---

## US-OPS-09: Filtro por Estado e Data

### Cenario 9.1: GET com state + date range
`@regression @api @priority-medium`

```gherkin
When GET /api/document?state=CA&created_after=2026-04-01&created_before=2026-04-30
Then resultados restritos ao estado e janela
```

---

## US-OPS-10: Export CSV

### Cenario 10.1: Export retorna CSV com filtros aplicados
`@regression @api @db-validation @priority-medium`

```gherkin
Given operador filtrou por status=OUTSTANDING
When operador clica Export
Then resposta com Content-Type=text/csv, attachment filename
And CSV NAO contem SSN ou CC completo
And uown_los_lead_notes: action="DOCUMENT_LIST_EXPORTED", filters_json, row_count
```

### Cenario 10.2: Limite de 10k linhas
```gherkin
Given filtro retornaria 15k linhas
When export
Then resposta limitada a 10k + mensagem "Refine filters for full export"
```

---

## US-OPS-11: Sandbox Distinto de Producao

### Cenario 11.1: Badge SANDBOX em qa
`@regression @e2e @priority-low`

```gherkin
Given env=qa1, documento com isSandbox=true
When operador abre lista
Then badge "[SANDBOX]" vermelho visivel na linha
And por default oculto em prod
```

---

## US-OPS-12: CS Busca por SSN/Telefone

### Cenario 12.1: Busca por SSN com permissao especial
`@regression @api @db-validation @priority-medium`

```gherkin
Given CS com role="CS_PII_ACCESS"
When GET /api/document?search_by=ssn&search=123-45-6789
Then resposta com leads correspondentes
And uown_los_lead_notes: action="PII_SEARCH", field="ssn", user_pk=CS, query_hash (nao valor cru)
```

### Cenario 12.2: Busca por telefone com fuzzy match
```gherkin
When GET /api/document?search_by=phone&search=9071234567
Then match com numeros formatados como (907) 123-4567 ou +19071234567
```

---

# EPICO 15: RECOVERY E RESILIENCIA

## US-RES-01: Cliente Perde Conexao

### Cenario 1.1: Offline detectado e progresso preservado
`@e2e @hybrid @priority-medium`

```gherkin
Given cliente preencheu 50% dos campos
When conexao cai (event offline)
Then banner visivel "You're offline — your progress is saved"
When conexao volta (event online)
Then estado sincronizado, campos preservados
And cliente pode continuar
```

---

## US-RES-02: Cliente Fecha Browser

### Cenario 2.1: Fechar browser sem clicar Close nao dispara closed
`@regression @e2e @priority-medium`

```gherkin
Given cliente abriu link mas nao clicou Close document
When ele fecha browser
Then nenhum postMessage closed disparado
And documento permanece OUTSTANDING
And cliente pode reabrir o link normalmente
```

---

## US-RES-03: Link Expirado Solicita Novo

### Cenario 3.1: Acesso a link EXPIRED mostra opcao de renovar
`@e2e @api @db-validation @priority-medium`

```gherkin
Given documento EXPIRED
When cliente acessa data.url
Then mensagem "Contract has expired" + botao "Request new link"
When cliente clica "Request new link"
Then ticket criado em [TBD: uown_los_lead_notes com substring 'Renewal requested']
And operador notificado para criar novo contrato
```

### Cenario 3.2: Anti-abuse limita pedidos por hora
```gherkin
Given 5 pedidos ja feitos na ultima hora
When cliente tenta 6o
Then resposta 429 com mensagem de limite
```

---

## US-RES-04: Re-Acesso Apos Signed

### Cenario 4.1: Link signed renderiza modo read-only
`@e2e @priority-high`

```gherkin
Given documento SIGNED
When cliente acessa data.url
Then PDF renderiza com assinaturas visiveis
And sem campos editaveis
And botao Start ausente
And botao Download ativo (US-DOC-13)
```

### Cenario 4.2: Apos retencao, link mostra arquivado
```gherkin
Given documento purged (apos 7 anos)
When cliente acessa link
Then 410 Gone com mensagem "Contract no longer available — contact support"
```

---

## US-RES-05: Download Multiplas Vezes

### Cenario 5.1: Hash consistente em N downloads
`@regression @hybrid @priority-medium`

```gherkin
Given documento SIGNED com signedPdfHash="abc123..."
When cliente baixa 5 vezes consecutivas
Then SHA-256 de cada download === signedPdfHash
And filename consistente
And uown_esign_event_trigger_log tem 5 linhas DOWNLOAD
```

---

## US-RES-06: 2 Dispositivos Simultaneamente

### Cenario 6.1: Lock previne assinatura concorrente
`@regression @e2e @hybrid @priority-medium`

```gherkin
Given cliente abre link no laptop e celular
When cliente clica Start em ambos
Then primeiro adquire lock; segundo recebe "Already started in another session"
When cliente assina em um
Then outro detecta (polling) e atualiza para read-only
```

---

## US-RES-07: Browser Support Matrix

Vide US-EMB-11.

---

# EPICO 16: ACESSIBILIDADE

## US-ACC-01: WCAG (Screen Reader)

### Cenario 1.1: NVDA navega fluxo completo
`@manual @priority-medium`

```gherkin
Given NVDA ou JAWS ativo
When QA navega pelo documento
Then todos botoes anunciados com aria-label
And status badge anunciado independente de cor
And erros anunciados com role="alert"
And contraste 4.5:1 minimo (verificar com axe-core)
```

---

## US-ACC-02: Mobile Completo

### Cenario 2.1: iOS Safari completa fluxo
`@e2e @manual @priority-medium`

```gherkin
Given iPhone com Safari mobile
When cliente abre link, clica Start, assina, conclui
Then fluxo end-to-end funciona
And touch targets >= 44×44px
And toggle Reading Mode funcional
```

---

## US-ACC-03: Print

### Cenario 3.1: Ctrl+P imprime sem UI clutter
`@regression @e2e @manual @priority-low`

```gherkin
Given pagina do contrato aberta
When cliente pressiona Ctrl+P
Then preview de impressao mostra apenas conteudo do contrato
And botoes/header escondidos (print:hidden CSS)
And tabelas EPO nao quebram mid-row
```

---

## US-ACC-04: Navegacao por Teclado

### Cenario 4.1: Tab order navega tudo, Enter ativa
`@manual @priority-medium`

```gherkin
Given cliente sem mouse
When ele usa Tab/Shift+Tab para navegar
Then ordem logica: header → metadados → fields → Submit
And foco visivel (outline) em cada elemento
And Enter ativa botoes
And Space marca/desmarca checkboxes
And Escape fecha modais
And SEM keyboard traps
```

---

## US-ACC-05: i18n Spanish

### Cenario 5.1: Acesso com lang=es retorna template ES
`@regression @api @hybrid @priority-low`

```gherkin
Given templateId tem versao ES cadastrada no Strapi
When POST com locale="es"
Then template ES usado
And email em espanhol
And UI do widget em espanhol (se suportado)
```

---

## US-ACC-06: Acessibilidade da Assinatura

### Cenario 6.1: Type signature como alternativa a desenho
`@manual @priority-low`

```gherkin
Given cliente com deficiencia motora
When ele escolhe "Type your signature"
Then ele digita nome, fonte cursiva renderiza
And assinatura tem mesma validade (UETA)
And uown_esign_document.signature_method="TYPED"
```

---

# EPICO 17: COMPLIANCE E RETENCAO

## US-LEG-01: Retention Policy

### Cenario 1.1: PDF purged apos 7 anos
`@regression @api @db-validation @priority-medium`

```gherkin
Given documento SIGNED em 2019-01-01
When job de retencao executa em 2026-01-01
Then PDF removido de storage
And uown_esign_document.purged_at populado
And metadados (hash, doc_signed_time_stamp) preservados em DB
And cliente acessando link recebe 410 Gone
```

---

## US-LEG-02: GDPR/CCPA Right to Deletion

### Cenario 2.1: Pedido de redacao processado
`@regression @api @db-validation @priority-low`

```gherkin
Given cliente solicitou exclusao via portal
When legal aprovou pedido
Then PII em uown_los_lead anonimizada (name="REDACTED", email="redacted@uown.local")
And PDF assinado com overlay "REDACTED PER REQUEST"
And [TBD: criar tabela ou usar uown_los_lead_notes com substring 'PII redaction'].status="APPROVED"
And auditoria: quem aprovou, quando, base legal
```

---

## US-LEG-03: UETA / ESIGN Act

### Cenario 3.1: Disclosure de e-sign aceito explicitamente
`@regression @e2e @priority-medium`

```gherkin
Given cliente abre contrato pela primeira vez
Then disclosure de e-sign visivel ANTES da assinatura
And cliente marca "I agree to use electronic signature" (intent to sign explicito)
And uown_esign_document.intent_to_sign_accepted_at populado
And opcao "Switch to paper signing" disponivel
```

---

## US-LEG-04: Audit Trail Export

### Cenario 4.1: Endpoint admin exporta tudo
`@regression @api @priority-medium`

```gherkin
Given user com role=LEGAL
When GET /api/admin/document/{id}/full-audit
Then resposta com JSON + PDF anexo contendo:
  - Todos eventos de uown_esign_event_trigger_log
  - Metadata completa (IPs, geo)
  - Hashes
  - Operadores que tocaram (uown_los_lead_notes)
  - Comunicacoes
And export tem assinatura digital (chain of custody)
And uown_los_lead_notes: action="FULL_AUDIT_EXPORTED"
```

---

## US-LEG-05: Compliance Audit Ad Hoc

### Cenario 5.1: Job mensal valida amostra
`@regression @api @priority-low`

```gherkin
Given primeiro dia do mes
When job de compliance audit executa em amostra de 100 contratos
Then cada contrato e validado contra:
  - Template do estado correto (US-DOC-10)
  - Property Price Tag bate com calculadora (US-DOC-01)
  - LESSOR/LESSEE corretos
And [TBD: uown_los_lead_notes com substring 'Compliance audit'] recebe linha com pass/fail counts
And falhas geram tickets
```

---

# EPICO 18: MONITORAMENTO E SRE

## US-OBS-01: Health Check

### Cenario 1.1: GET /healthz/gowsign retorna 200 quando saudavel
`@smoke @api @priority-high`

```gherkin
Given GowSign respondendo, ultimo POST OK em < 5min
When GET /healthz/gowsign
Then resposta 200 com {status:"healthy", last_check, latency_ms}
```

### Cenario 1.2: Retorna 503 quando degradado
```gherkin
Given GowSign retornando 5xx persistente
Then GET /healthz/gowsign retorna 503
And alerta operacional
```

---

## US-OBS-02: SLIs/SLOs

### Cenario 2.1: Dashboard mostra metricas chave
`@manual @priority-medium`

```gherkin
Given Grafana/Datadog dashboard
Then exibe:
  - POST success rate (target 99.5%)
  - POST latency P50/P95/P99 (P95 < 2s)
  - Time-to-OUTSTANDING P95 < 30s
  - Error rate 5xx < 0.1%
```

---

# EPICO 19: EDGE CASES

## US-EDGE-01: Caracteres Especiais

### Cenario 1.1: Nome com apostrofo e acento
`@regression @api @hybrid @priority-medium`

```gherkin
Given customerLastName="O'Brien-Pena"
When contrato gerado
Then PDF mostra exatamente "O'Brien-Pena" (sem &apos; ou &#39;)
And uown_los_lead.last_name preserva UTF-8
And LESSEE block no contrato mostra correto
```

---

## US-EDGE-02: Nomes/Enderecos Longos

### Cenario 2.1: Nome de 80 caracteres renderiza completo
`@regression @api @hybrid @priority-low`

```gherkin
Given customerFirstName="Maria Jose Antonia da Silva Souza" (40 chars), customerLastName="Bezerra de Oliveira Santos" (30 chars)
When contrato gerado
Then nome renderiza completo sem truncamento
And quebra de linha automatica se necessario
And uown_los_lead.first_name + last_name armazena sem truncar
```

---

## US-EDGE-03: Telefones Internacionais

### Cenario 3.1: Phone com formato variado normalizado para E.164
`@regression @api @priority-low`

```gherkin
Examples:
  | input              | normalizado     |
  | (907) 123-4567     | +19071234567    |
  | 9071234567         | +19071234567    |
  | +19071234567       | +19071234567    |
  | +525555551234      | +525555551234   |

When POST com phoneNumber em formato variado
Then backend normaliza para E.164 antes de chamar GowSign
```

---

## US-EDGE-05: PDF Corrompido

### Cenario 5.1: Magic bytes ausentes detectado
`@regression @api @db-validation @priority-medium`

```gherkin
Given GowSign retorna bytes que nao iniciam com "%PDF-"
When backend valida
Then detectado como corrompido
And retry executado
After N retries falham
Then uown_merchant_api_error_log: error_type="PDF_CORRUPTED"
And alerta operacional
And lease NAO marcado signed
```

---

## US-EDGE-06: Webhook Payload Malformado

### Cenario 6.1: JSON invalido rejeitado
`@regression @api @priority-medium`

```gherkin
When POST /webhook/gowsign com body "{ invalid json"
Then resposta 400
And nenhuma transicao ocorre
And uown_los_inbound_api_log: status="REJECTED_MALFORMED"
And servico permanece estavel (sem crash)
```

---

# EPICO 20: MODIFY LEASE E POS-FUNDED

## US-MOD-01: Modify Lease Pos-Assinatura

### Cenario 1.1: Modify entre SIGNED e FUNDED gera novo contrato
`@regression @api @db-validation @priority-medium`

```gherkin
Given lease em SIGNED, ainda nao FUNDED
When operador (ou cliente) solicita modify (mudar frequencia)
Then contrato anterior cancelado em cascata
And novo contrato GowSign criado com novos termos
And lease regride para CONTRACT_CREATED (excecao documentada)
When cliente assina o novo
Then lease volta para SIGNED → eventualmente FUNDING
And uown_los_lead_notes (substring 'Change lead status from X to Y' ou 'LeadStatus Y') captura ambas transicoes
```

---

## US-MOD-02: Lease em Default

### Cenario 2.1: Operador acessa contrato signed mesmo em DEFAULT
`@regression @api @priority-medium`

```gherkin
Given lease em DEFAULT (delinquencia)
When operador (collections) abre contrato
Then PDF assinado + audit trail acessivel
And cliente NAO acessa mais o link publico (regra a confirmar)
And uown_los_lead_notes: "Contract accessed by {operator} for collections review"
```

---

## US-MOD-03: Collections Anexa Contrato

### Cenario 3.1: Letra com contrato anexado
`@regression @api @priority-low`

```gherkin
Given operador collections com letra de cobranca
When operador clica "Attach contract"
Then email/letra gerada com PDF do contrato como anexo
And uown_correspondence_logs: attachment="contract", contract_id={id}
And uown_los_lead_notes: "Contract attached to collections letter"
```

---

## US-MOD-04: Contract Amendment

### Cenario 4.1: Amendment vinculado ao contrato original
`@regression @api @db-validation @priority-low`

```gherkin
Given contrato SIGNED original
When operador cria amendment (correcao de typo)
Then amendment e novo documento GowSign vinculado ao original
And cliente assina apenas o amendment
And contrato original permanece valido
And [TBD: uown_los_contract novo registro vinculado ao contract_pk original] vinculado a contract_pk original
And audit trail abrangente (original + amendments cronologicamente)
```

---

# Matriz de Cobertura: US → Cenarios

| Epico | US Range | Cenarios |
|-------|----------|----------|
| 1. Validacao de Provider e Coexistencia | CUT-01..02 | 5 cenarios |
| 2. Criacao | CRE-01..09 | 17 cenarios |
| 3. Campos | FLD-01..10 | 14 cenarios |
| 4. Iframe | EMB-01..11 | 15 cenarios |
| 5. Ciclo de Vida | LCY-01..09 | 11 cenarios |
| 6. Pos-assinatura | POST-01..09 | 11 cenarios |
| 7. Comunicacao | COM-01..07 | 8 cenarios |
| 8. Callbacks | CB-01..04 | 4 cenarios |
| 9. Listagem | LST-01..04 | 5 cenarios |
| 10. Erros | ERR-01..13 | 14 cenarios |
| 11. Seguranca | SEC-01..05 | 5 cenarios |
| 12. Conteudo | DOC-01..15 | 21 cenarios |
| 13. Status Lease | LSE-01..16 | 18 cenarios |
| 14. Operacoes | OPS-01..12 | 14 cenarios |
| 15. Recovery | RES-01..07 | 8 cenarios |
| 16. Acessibilidade | ACC-01..06 | 6 cenarios (5 manuais) |
| 17. Compliance | LEG-01..05 | 5 cenarios |
| 18. Monitoramento | OBS-01..02 | 3 cenarios |
| 19. Edge Cases | EDGE-01..06 (sem 04 e 07) | 5 cenarios |
| 20. Modify Lease | MOD-01..04 | 4 cenarios |
| **Total** | **160 US** (155 com cenarios; 5 US sem cenario apos remocao) | **~193 cenarios** |

---

# Proximos Passos

1. **Validar cenarios com PO** — confirmar prioridades e tags
2. **Decompor por suite**:
   - `@smoke` (~15 cenarios) — roda em cada deploy, < 5 min
   - `@regression` (~150 cenarios) — roda em CI/nightly, < 30 min
   - `@manual` (~20 cenarios) — acessibilidade, browser matrix, compliance
3. **Implementar fixtures** — reutilizar `merchantConfig`, criar `gowsignClient`, `extractContractValues` helper (US-DOC-12)
4. **Mapear para spec files** — 1 arquivo Playwright por epico ou por sub-suite
5. **CI/CD integration** — `@smoke` em PR, `@regression` em main merge, `@manual` em release candidates

---

> **Fonte:** este arquivo deriva de [`gowsign-integration-user-stories.md`](./gowsign-integration-user-stories.md). Atualizar ambos em sincronia conforme novos requisitos.
