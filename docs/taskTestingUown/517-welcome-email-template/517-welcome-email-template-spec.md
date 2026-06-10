# SPEC — 517 Update Welcome Email Template (UOWN + Kornerstone)

## Source

- **GitLab**: uown/backend/svc#517 — *UOWN | Template | Update Welcome Email Template*
- **Pipeline classification**: backend template update (sem mudança de portal) — API-trigger + IMAP-read
- **Date**: 2026-05-20
- **Author**: qa-planner

---

## 1. Scope

### IN

- Validar render do **novo Welcome Email** para conta **UOWN** (template "image 12").
- Validar render do **novo Welcome Email** para conta **Kornerstone** (template "image 13").
- Validar **isolamento de brand** (conta UOWN não pode receber template Kornerstone, e vice-versa).
- Validar **requisito de hosting de imagens em GCS** (zero URLs externas no HTML).
- Validar **substituição de placeholders** dinâmicos (`{FirstName}`, valores monetários, número de pagamentos).
- Validar **diferenças estruturais por brand** (cor primária, social icons, telefone footer, CS hours, e-mail de contato, endereço).
- Validar **activity log** gerado pelo envio (regra inviolável #13).
- Validar **negative path** (AccountPk inválido).
- **Trigger**: `POST {svc}/uown/sendWelcomeEmail/{AccountPk}` + sweep `POST {svc}/uown/svc/triggerScheduledTask/emailSweep`.
- **Leitura do email entregue**: IMAP `fintechgroup777@gmail.com` com plus-addressing por runId (helper `EmailHelpers` existente).

### OUT (explicitamente fora de escopo)

- **Mudanças no fluxo de application/signing** — task altera apenas template; não toca lifecycle. Justificativa: minimizar superfície e respeitar atomicidade.
- **Customer Portal / Servicing UI** — feature não tem afordância de UI (regra #14, ver Seção 6).
- **Outros templates de email** (Welcome SMS, Late Payment, Verification, etc.) — fora do escopo da #517.
- **Acessibilidade WCAG completa** — limitado a presença de `alt` em `<img>` como sanity (exploratório, não bloqueador).
- **Compatibilidade com clientes de email reais** (Outlook desktop, dark mode iOS Mail, etc.) — fora do escopo automatizado; cobrir manual se PO pedir.
- **Anti-spam / SPF / DKIM** — infra, não template.
- **Tradução / i18n** — produto é EN-US único.

### FATOS CONFIRMADOS (probe DB qa1 — 2026-05-20)

Probe rodado em `qa1` (45 envios de Welcome nos últimos 60 dias, último em 2026-05-18 17:07). Scripts: `scripts/probe_welcome.ts` + `scripts/probe_notes_schema.ts`. Body HTML salvo em `/tmp/welcome_email_body_238707.html`.

- **CF-01 — `uown_email_queue.template_name = 'Welcome'`** (string exata, case-sensitive). Subject também `"Welcome"`. `email_body_type = 'HTML'`. Status na fila: `PENDING` → após sweep → `SENT` com `sent_time` populado.
- **CF-02 — Domínio GCS confirmado: `storage.googleapis.com/uown/`** (bucket = `uown`). Template atual usa 5 imagens, todas neste prefixo (`logo_top_62.png`, `icon-facebook.png`, `icon-twitter.png`, `icon-instagram.png`, `logos-05.png`). Zero URLs externas no template atual. **Resolve PT-04.**
- **CF-03 — `uown_los_lead_notes` NÃO tem coluna `note_type`** (só `pk`, `agent`, `lead_pk`, `tenant_id`, `web_user_id`, `notes` text, timestamps). A "tipagem" é prefixo no próprio texto: `[ServiceName][methodName]` ou texto livre. **Resolve PT-01 — sem `note_type`; query por `notes ILIKE`.**
- **CF-04 — Welcome Email NÃO gera nota em `uown_los_lead_notes` atualmente** (0 matches para `notes ILIKE '%welcome%'` em 60 dias, apesar de 45 emails enviados). **Gap de observabilidade** vs Regra Inviolável #13 — deve ser sinalizado ao PO/dev. Evidência de "welcome enviado" hoje é exclusivamente a linha em `uown_email_queue` com `status='SENT'`.
- **CF-05 — Template atual (snapshot pré-#517) diverge severamente do novo mockup** — confirma que a #517 ainda não foi deployada em qa1. Divergências:
  | Elemento | Atual (qa1) | Novo mockup |
  |---|---|---|
  | Greeting | "Welcome, {Name}! You've signed a lease for $X, with Uown." | "{Name}, welcome to Uown!" |
  | Body | 3 parágrafos centralizados | bullets |
  | "Good to know" | ausente | presente (💡) |
  | Closing | ausente | "Thank you for choosing Uown — you've got this. The Uown Team" |
  | Banner | "Call the number below..." | "Have questions or need assistance?..." |
  | CS hours | Mon-Sat 9am-10pm / Sun 11am-9pm ET | Mon-Sat 8am-12am / Sun 11am-11pm EST |
  | Telefone | (877) 357-5474 | (877) 353-8696 |
  | Social | FB + **Twitter** + Instagram | FB + **LinkedIn** + Instagram |
  | Foto CS rep | ausente | presente |
  | Footer address | ausente | "10500 University Center Drive, Suite 150, Tampa, FL 33612" |
  | Brand Kornerstone | **NÃO EXISTE** | obrigatório |
  | Placeholder estranho atual | `"over the next <span>13,</span> months"` (vírgula HTML quebrada) + `"You have 56 total payments"` (weekly) | esperado: `"13 total payments"` (consolidado mensal) |
- **CF-06 — Sweep funciona em qa1/dev1** (envios reais com `status=SENT` evidenciam). Disponibilidade em stg só pode ser confirmada com VPN/IP externo — fora do alcance imediato.

### AMBIGUOUS / Pendências técnicas (restantes)

- ~~PT-01~~ → resolvido por CF-03 + CF-04 (não há `note_type`; e Welcome não loga). Ação: registrar como gap e perguntar ao PO se #517 deveria adicionar log.
- **PT-02** Existe **idempotência** documentada? Se chamar `sendWelcomeEmail/{pk}` 2x, sistema envia 2 emails ou bloqueia? — exploratório (CT07).
- **PT-03** **AccountPk sem lease ativo** — comportamento esperado? — exploratório (CT09).
- ~~PT-04~~ → resolvido por CF-02. Allow-list = `storage.googleapis.com/uown/`.
- **PT-05** Template é program-aware (13 vs 16 meses)? — confirma com PO antes de CT11. **Observação adicional**: template atual mostra "56 total payments" (contagem weekly), não "13 total payments" — comportamento esperado da nova versão precisa ser confirmado.
- ~~PT-06~~ → parcial. qa1/dev1 OK. stg requer VPN; recomendar dev/stg via dev backend.
- ~~PT-07~~ → N/A confirmado (Welcome é pós-active).

---

## 2. Acceptance Criteria (DERIVADOS — task não trouxe AC formal)

Derivados a partir de Synopsis + Business Requirements + Image Hosting Requirement + anexos visuais (image 12 / image 13).

### AC1 — Template UOWN é renderizado para contas UOWN
- DADO uma conta UOWN com lease ativo
- QUANDO trigger `POST /uown/sendWelcomeEmail/{pk}` + sweep emailSweep
- ENTÃO email entregue contém: logo UOWN ("YOU'VE GOT THIS"), greeting `"<FirstName>, welcome to Uown!"`, closing `"The Uown Team"`, banner CS com `info@UownLeasing.com` + `(877) 353-8696` + CS hours `Mon-Sat: 8am-12am EST / Sun 11am-11pm`, 3 social icons (FB+LinkedIn+Instagram), footer com endereço Tampa.

### AC2 — Template Kornerstone é renderizado para contas KS
- DADO uma conta Kornerstone (merchant KS3015) com lease ativo
- QUANDO trigger + sweep
- ENTÃO email entregue contém: logo KORNERSTONE LIVING (verde+chevron), greeting `"<FirstName>, welcome to Kornerstone!"`, closing `"The Kornerstone Team"`, banner CS com `cs@kornerstoneliving.com` + `(877) 353-8696` + CS hours `Mon-Fri 8am-11pm / Sat 9am-11pm / Sun 10am-11pm`, 2 social icons (FB+Instagram, sem LinkedIn), footer phone `(888) 521-5111`.

### AC3 — Isolamento de brand
- Conta UOWN nunca recebe payload Kornerstone (sem string "Kornerstone" no HTML, sem cor verde primária, sem `cs@kornerstoneliving.com`).
- Conta Kornerstone nunca recebe payload UOWN (sem "YOU'VE GOT THIS", sem `info@UownLeasing.com`, sem footer endereço Tampa).

### AC4 — Imagens hospedadas em GCS
- Todo elemento `<img src="…">` no HTML aponta para **`https://storage.googleapis.com/uown/<filename>`** (allow-list confirmada em CF-02).
- **Nenhuma** URL externa de imagem (regex: zero matches para `<img[^>]+src="(?!https://storage\.googleapis\.com/uown/)`).

### AC5 — Placeholders substituídos
- Email entregue **não contém** literais: `{FirstName}`, `{Amount}`, `{N}`, `$0.00`, `XX`, `null`, `undefined`, `[object Object]`.
- Greeting contém **primeiro nome real** da conta de teste.
- Bullet de payment contém valor monetário **formatado** (regex `\$\d{1,3}(,\d{3})*\.\d{2}`).
- Bullet de duração contém número de pagamentos **coerente com o programa** (13 ou 16).

### AC6 — Evidência de envio em `uown_email_queue` + (opcional) activity log
- **Primário (confirmado)**: após trigger + sweep, `uown_email_queue` tem 1 linha com `template_name='Welcome'`, `account_pk=:pk`, `to_email_addresses=:email`, `status='SENT'`, `sent_time IS NOT NULL`, `email_body_type='HTML'`.
- **Secundário (opcional, gap observado em CF-04)**: idealmente `uown_los_lead_notes` deveria ter uma nota referenciando "Welcome Email" (Regra #13). Atualmente NÃO acontece. CT06 testa essa expectativa — se continuar ausente após #517, reporta como **observação de gap** (não bloqueador da #517).

### AC7 — Negative path: AccountPk inválido retorna erro tratado
- `POST /uown/sendWelcomeEmail/{inexistente}` → HTTP 4xx (preferencial 404 ou 400). Não pode 500 nem 200 silencioso.

### AC8 — Diferenças por brand (tabela em Anexos) preservadas
- Os 9 elementos diferenciais (logo, cor, greeting, email contato, telefone footer, CS hours, social count, endereço, closing brand) estão corretos por brand.

---

## 3. AC Coverage Matrix

| AC | Cenários |
|----|----------|
| AC1 | CT01, CT10 |
| AC2 | CT02, CT10 |
| AC3 | CT03 |
| AC4 | CT04 |
| AC5 | CT05 |
| AC6 | CT06 |
| AC7 | CT08 |
| AC8 | CT10 |
| (exploratório) | CT07, CT09, CT11 |

*(CT12 SignWell↔GoSign removido — Welcome é pós-activation, signing provider não influencia conteúdo.)*

---

## 4. Risk Analysis

| # | Area | Risk | Probabilidade | Impacto | Coverage |
|---|------|------|---------------|---------|----------|
| R1 | Imagens externas residuais no HTML | Marketing entrega template com `<img>` apontando para `cdn.mailchimp.com` etc.; dev esquece de migrar 1-2 assets → quebra requisito crítico de hosting | **Alta** (típico em migração de template) | **Alto** (descumpre requisito explícito + risco de quebra se origem cair) | CT04 |
| R2 | Brand cross-contamination | Switch brand-aware com bug → conta UOWN recebe HTML KS ou pior, mistura (logo UOWN + email KS) | Média | **Crítico** (comunicação errada ao cliente final, dano de marca) | CT02, CT03 |
| R3 | Placeholder não substituído | `{FirstName}`, `$X.XX`, `13 total payments` literal no email recebido | Média (regressão clássica de Mustache/Velocity) | Alto (cliente vê email "cru") | CT05 |
| R4 | Email não enviado / log ausente | Endpoint retorna 200 mas SMTP/sweep falha em background; sem activity log → time não detecta | Baixa-Média | Alto (cliente nunca recebe, e ninguém percebe) | CT06 |
| R5 | Render visual quebrado em cliente real | HTML válido mas layout quebra em Gmail/Outlook por inline CSS errado, tabela mal aninhada, etc. | Baixa (automação) | Médio | Parcial — leitura via IMAP captura HTML cru, não render. **Mitigação manual recomendada**. |
| R6 | Diferenças por brand erradas (CS hours, social icons count) | Update de marketing manteve só greeting/cor; CS hours/social ficaram com versão antiga | Média | Médio | CT10 (asserções textuais) |
| R7 | Regressão em 16m vs 13m | Template hard-codado em "13 payments" e ignora `term_in_months` do programa | Média | Alto se merchant 16m | CT11 (exploratório) |
| R8 | Idempotência ausente | Sweep enfileira múltiplos sends e cliente recebe N emails | Baixa | Médio | CT07 (exploratório) |

**Top-3 a concentrar esforço**: R1 (regex bloqueador), R2 (isolation matrix), R3 (anti-literal assertions).

---

## 5. Test Strategy

- **Abordagem**: **API-first** — trigger via REST + sweep, leitura via IMAP + parse HTML (cheerio ou regex robusto).
- **Justificativa UI-first principle (regra #14)**: feature **NÃO tem fluxo de UI no portal**. É template de comunicação disparado por endpoint admin (`sendWelcomeEmail`) + scheduled task (`emailSweep`). **Validação visual = ler o email entregue (cliente real recebe), não banco/log**. Portanto a leitura do HTML via IMAP **atende** o princípio: simula a percepção do cliente que abre o Gmail. NÃO é "API-only lendo log de backend".
- **Ambiente alvo recomendado**: **stg** (estável; precisa confirmar disponibilidade do sweep — PT-06). Fallback: **dev1** (sweep documentado pelo dev). Evitar qa1 enquanto outage DV360 não for resolvido (impacta criação fresh de account; usar conta pré-existente se ficar em qa1).
- **Test Data Hierarchy (regra #9)**: DEFAULT = criar 1 conta UOWN + 1 conta KS via automação (`createPreQualifiedApplication` → sign → activate). EXCEÇÃO permitida = reusar conta pré-existente **se** outage de DV360 bloquear criação em qa1, **com justificativa escrita** + tentativa fresh em outro env.
- **Merchant preflight (regra #12)**: obrigatório para conta UOWN nova e conta KS nova (KS3015). `createPreQualifiedApplication` já chama `ensureMerchantReady`; manter `AUTO_HEAL_MERCHANT=true`.
- **IMAP**: `fintechgroup777@gmail.com` com plus-addressing `fintechgroup777+517-<runId>-<brand>@gmail.com` para cada conta. Helper `EmailHelpers` (`src/helpers/email.helpers.ts`) existe — reusar `snapshotInboxUid` → `getEmailContent`. Spec NÃO implementa, apenas referencia.
- **Activity log validation (regra #13)**: TODO cenário happy-path inclui SELECT em `uown_los_lead_notes` após trigger. Query bloqueada por PT-01 (precisa do `note_type` exato) — spec deixa placeholder `:expected_note_type`.
- **Suites a ativar / não ativar**:
  - **Dual-brand**: SIM (CT01 + CT02 + CT03 = matriz UOWN×KS).
  - **Signing regression (SignWell↔GoSign)**: **N/A** — Welcome Email é pós-activation; signing já completou. Anotado em PT-07.
  - **EPO / Payment flows**: N/A.
  - **Lease-edit**: N/A.

---

## 6. Scenarios (Prioritized)

> Prefixos: **CT** = caso de teste. Prioridade P0/P1/P2.

### CT01 — Template UOWN renderiza corretamente (P0, smoke happy path)

- **Técnica**: equivalence partitioning (classe válida: brand=UOWN).
- **Persona**: novo customer UOWN que acabou de ter o lease ativado.
- **Setup**:
  - Criar lead UOWN via `createPreQualifiedApplication` (merchant preflight automático).
  - Avançar até `signed` + `active` (lifecycle).
  - Email do customer = `fintechgroup777+517-<runId>-uown@gmail.com`.
  - FirstName de teste pré-conhecido (ex.: `Egino` ou outro fixo para asserção exata).
- **Steps**:
  1. Capturar `accountPk` da conta criada (SELECT `uown_los_lead`).
  2. `POST {svc-stg}/uown/sendWelcomeEmail/{accountPk}` → esperar 2xx.
  3. `POST {svc-stg}/uown/svc/triggerScheduledTask/emailSweep` → esperar 2xx.
  4. Aguardar email no IMAP (timeout 60s, polling 5s) usando `snapshotInboxUid` → `getEmailContent`.
- **Validations**:
  - **Email recebido**: subject contém `"Welcome"` ou `"welcome to Uown"` (asserção flexível).
  - **HTML body**:
    - Greeting regex: `/^\s*<FirstName>,\s*welcome to Uown!/m` (substituído pelo nome real).
    - Closing: `"The Uown Team"` presente.
    - Banner: `info@UownLeasing.com`, `(877) 353-8696`, `Mon-Sat: 8am-12am EST` presentes.
    - Footer: `Tampa`, `33612` presentes.
    - 3 social icons (FB + LinkedIn + Instagram) — contar `<a>` / `<img>` de social.
  - **DB**: SELECT em `uown_los_lead_notes` WHERE `lead_pk=:pk` AND `note_type=:expected_note_type` (PT-01) AND `created_at >= :trigger_ts`. Expect: ≥ 1 linha.
  - **Activity log content**: nota referencia "Welcome Email" (regra #13).
- **Edge cases cobertos**: brand padrão; lease recém-ativo.
- **Pitfalls considerados**:
  - Sweep async — usar polling, não sleep fixo.
  - Plus-addressing entrega ao mesmo inbox; filtrar UID > snapshot.
  - Merchant config drift (mitigado por preflight).

---

### CT02 — Template Kornerstone renderiza corretamente (P0, smoke happy path)

- **Técnica**: equivalence partitioning (classe válida: brand=KS).
- **Persona**: novo customer Kornerstone (merchant KS3015) com lease ativo.
- **Setup**:
  - Criar lead via merchant **KS3015** (FifthAveFurnitureNY — disponível em stg, dev, qa1, qa2 conforme MEMORY).
  - Avançar até active.
  - Email = `fintechgroup777+517-<runId>-ks@gmail.com`.
- **Steps**: idênticos ao CT01, trocando accountPk.
- **Validations**:
  - **HTML body**:
    - Greeting: `welcome to Kornerstone!`.
    - Closing: `"The Kornerstone Team"`.
    - Banner: `cs@kornerstoneliving.com`, `(877) 353-8696`, `Mon-Fri: 8am-11pm EST`, `Sat: 9am-11pm EST`, `Sun: 10am-11pm EST`.
    - Footer phone: `(888) 521-5111`.
    - 2 social icons (FB + Instagram). **Asserção negativa: nenhum `linkedin` no HTML**.
    - **Asserções negativas de cross-brand**: HTML NÃO contém `YOU'VE GOT THIS`, `info@UownLeasing.com`, `Tampa`, `33612`, `The Uown Team`.
  - **DB**: activity log conforme CT01.
- **Pitfalls**: programa 16m disponível no KS3015 — confirmar que setup usa 13m para baseline (CT11 cobre 16m).

---

### CT03 — Isolamento de brand (P0, regressão)

- **Técnica**: decision table / matrix coverage.
- **Persona**: garantia de não-vazamento.
- **Setup**: reusa contas do CT01 + CT02 (não duplica criação).
- **Steps**: a validação é parte de CT01/CT02 (asserções negativas cross-brand). Este CT formaliza a **matriz** num único relatório:
  | | UOWN account | KS account |
  |---|---|---|
  | "welcome to Uown" | MUST | MUST NOT |
  | "welcome to Kornerstone" | MUST NOT | MUST |
  | `info@UownLeasing.com` | MUST | MUST NOT |
  | `cs@kornerstoneliving.com` | MUST NOT | MUST |
  | `(888) 521-5111` | MUST NOT | MUST |
  | `Tampa` | MUST | MUST NOT |
  | LinkedIn icon | MUST | MUST NOT |
- **Validations**: matriz 100% verde.
- **Pitfalls**: se feature flag `brand` mudar dinâmico, registrar valor no setup.

---

### CT04 — Imagens hospedadas em GCS (P0, regressão crítica)

- **Técnica**: regex-based negative assertion (sem domínios externos).
- **Setup**: reusa email do CT01 (UOWN) e CT02 (KS).
- **Steps**:
  1. Extrair todas as `<img src="...">` do HTML (cheerio ou regex `/<img[^>]+src="([^"]+)"/g`).
  2. Para cada URL: verificar que pertence ao domínio GCS aprovado (PT-04).
- **Validations**:
  - Cada src ∈ `{storage.googleapis.com/<bucket>, <cdn-aprovado>}` (definir em PT-04).
  - **Asserção negativa**: zero matches para `cdn.mailchimp.com`, `mc.us20.list-manage.com`, `imgur`, `mailgun`, `sendgrid`, `cloudfront` (não-UOWN), e qualquer domínio externo conhecido.
  - **Para ambas as brands**.
- **Edge cases**: imagens em CSS background (`background-image:url(...)`) — incluir no regex.
- **Pitfalls**: alt text vazio não falha o teste (acessibilidade fora de escopo); apenas src.

---

### CT05 — Placeholders substituídos (P0)

- **Técnica**: anti-literal assertion + boundary (valor monetário formatado).
- **Setup**: reusa CT01 e CT02.
- **Steps**:
  1. Parse HTML body como texto puro.
  2. Buscar literais proibidos: `{FirstName}`, `{Amount}`, `{N}`, `${`, `{{`, `$0.00`, `XX`, `null`, `undefined`, `[object Object]`, `NaN`.
- **Validations**:
  - Nenhum literal proibido presente.
  - Greeting contém **primeiro nome real** da conta (capturado do setup).
  - Regex `\$\d{1,3}(,\d{3})*\.\d{2}` ocorre **≥ 2 vezes** (first payment + regular payment).
  - Regex `\b(13|16)\s+total\s+payments\b` ocorre **= 1 vez**.
- **Pitfalls**: nome com caracteres especiais (apóstrofe, hífen) — usar conta com nome simples no setup.

---

### CT06 — Evidência de envio em `uown_email_queue` (P0, primária) + activity log gap (P2, observação)

- **Técnica**: post-action validation contra a tabela canônica de fila + observação do gap.
- **Setup**: reusa CT01 (UOWN) e CT02 (KS).
- **Steps**:
  1. Capturar `trigger_ts` antes do POST.
  2. Após sweep, polling DB (timeout 30s).
- **SELECT primário (confirmado pelo schema real)**:
  ```sql
  SELECT pk, account_pk, lead_pk, to_email_addresses,
         subject, template_name, status, sent_time, email_body_type
    FROM uown_email_queue
   WHERE account_pk = :accountPk
     AND template_name = 'Welcome'
     AND row_created_timestamp >= :trigger_ts
   ORDER BY row_created_timestamp DESC
   LIMIT 1;
  ```
  - Asserções: linha existe; `status='SENT'`; `sent_time IS NOT NULL`; `to_email_addresses` == email do customer; `template_name='Welcome'` (case-sensitive); `email_body_type='HTML'`.
- **SELECT secundário (observação do gap CF-04)**:
  ```sql
  SELECT pk, lead_pk, notes, row_created_timestamp
    FROM uown_los_lead_notes
   WHERE lead_pk = :leadPk
     AND row_created_timestamp >= :trigger_ts
     AND LOWER(notes) LIKE '%welcome%';
  ```
  - Hoje retorna 0 linhas (CF-04). Asserção: registrar count observado; se 0 → marcar como **observação** no report (não falha o teste).
- **Pitfalls**:
  - Tabela `uown_los_lead_notes` NÃO tem `note_type` — usar `notes ILIKE` (skill `activity-log-validation` referenciava coluna inexistente; foi corrigida em 2026-05-20).
  - `template_name` é case-sensitive em PostgreSQL para `=` (literal `'Welcome'`).
  - Sweep é assíncrono; `sent_time` só popula após o pickup. Polling 30s com timeout.

---

### CT07 — Idempotência: trigger 2x não duplica (P2, exploratório — PT-02)

- **Técnica**: state/sequence coverage.
- **Setup**: 1 conta UOWN nova (ou reuso de CT01 com novo runId).
- **Steps**:
  1. `POST sendWelcomeEmail/{pk}`.
  2. Aguardar sweep + email 1.
  3. Repetir `POST sendWelcomeEmail/{pk}` (em ≤ 5min).
  4. Aguardar 60s adicionais.
- **Validations**:
  - **Inbox**: contagem de emails para `+517-<runId>` = **1** (idempotente) **OU** = 2 (não-idempotente).
  - Registrar comportamento observado; PO decide se é defeito.
- **Marcado**: EXPLORATÓRIO. Não bloqueia regressão.

---

### CT08 — AccountPk inválido retorna erro tratado (P1, negativo)

- **Técnica**: equivalence partitioning (classes inválidas).
- **Casos**:
  - `pk = 0`
  - `pk = 999999999` (inexistente)
  - `pk = 'abc'` (não numérico)
  - `pk = null` (path vazio: `/sendWelcomeEmail/`)
- **Validations**:
  - HTTP 4xx para cada classe (preferencial 404 para inexistente, 400 para malformado).
  - **NUNCA** 500 ou 200 + email não enviado silenciosamente.
  - Resposta JSON tem `error`/`message` legível.
- **Pitfalls**: alguns endpoints retornam 200 com body de erro — falhar nesse caso.

---

### CT09 — Conta sem lease ativo (P2, exploratório — PT-03)

- **Técnica**: state coverage (lead em outros estados).
- **Setup**: lead UOWN em `pre-qualified` (sem signed/active).
- **Steps**: `POST sendWelcomeEmail/{pk}` + sweep.
- **Validations**:
  - Observar: o endpoint envia? Retorna 4xx? Bloqueia silenciosamente?
- **Marcado**: EXPLORATÓRIO. PO confirma comportamento esperado.

---

### CT10 — Termos exatos batem com mockup (P1, asserção textual ampla)

- **Técnica**: golden-master / assertion checklist.
- **Setup**: reusa HTML capturado em CT01 e CT02.
- **Validations**: tabela completa de 9 diferenças (ver §Anexos). Cada célula é uma asserção independente. Falha em qualquer = falha do CT10 com detalhamento de qual elemento divergiu.
- **Pitfalls**: pequenas diferenças tipográficas (em-dash vs hífen, NBSP) — normalizar string antes de comparar.

---

### CT11 — Programa 16m vs 13m (P2, exploratório — PT-05)

- **Técnica**: boundary + regressão de regra "16m por merchant config" (MEMORY).
- **Setup**: lead Kornerstone com merchant programa `term_in_months=16` (KS3015 já suporta 16m conforme MEMORY).
- **Steps**: trigger Welcome + sweep.
- **Validations**:
  - Bullet de duração contém `16 total payments` (se template for program-aware).
  - **OU** se template é hard-coded em 13: registrar como **BUG candidato** + abrir ticket.
- **Marcado**: EXPLORATÓRIO. PT-05 determina o expected.

---

---

## 7. Out-of-scope decisions (recap)

| Item | Razão |
|------|-------|
| Customer/Servicing portal UI | Feature não tem UI affordance (regra #14, justificada). |
| Outros templates (SMS, Verification, Late Payment) | Atomic scope — task #517 cobre só Welcome. |
| Render em clientes reais (Outlook/Gmail/iOS Mail) | Fora do automatizável; sugerir teste manual paralelo. |
| Acessibilidade WCAG (alt text, contraste, ARIA) | Fora do escopo declarado da task. |
| SPF/DKIM/DMARC | Infra de email, não template. |
| Tradução / i18n | Produto EN-US único. |
| Signing regression | CT12 = N/A justificado. |

---

## 8. Test Data

| Conta | Brand | Merchant | Programa | Email IMAP |
|-------|-------|----------|----------|------------|
| A1 (CT01, CT04, CT05, CT06, CT07, CT08, CT09, CT10) | UOWN | UOWN default | 13m | `+517-<runId>-uown@gmail.com` |
| A2 (CT02, CT04, CT05, CT06, CT10) | Kornerstone | KS3015 | 13m | `+517-<runId>-ks@gmail.com` |
| A3 (CT11) | Kornerstone | KS3015 | 16m | `+517-<runId>-ks16@gmail.com` |
| A4 (CT09) | UOWN | UOWN default | 13m (não ativada) | `+517-<runId>-prequal@gmail.com` |

Criação: `createPreQualifiedApplication` + sign + activate (helper a usar conforme catálogo `helpers-catalog`). Reuso permitido entre CTs do mesmo brand para reduzir custo.

---

## 9. Environment

- **Recomendado**: **stg** (confirmar sweep — PT-06).
- **Fallback**: dev1 (sweep documentado).
- **Evitar**: qa1 enquanto outage DV360 ativo (impacta `sendApplication`); se forçado, usar conta pré-existente.
- **Bloqueador**: PT-04 (domínio GCS) + PT-06 (sweep no stg) — resolver antes de implementação.

---

## 10. Anexos

### Tabela de diferenças por brand (CT10)

| # | Elemento | UOWN | Kornerstone |
|---|----------|------|-------------|
| 1 | Logo | UOWN azul + "YOU'VE GOT THIS" | KORNERSTONE LIVING verde + chevron |
| 2 | Cor primária | Azul | Verde |
| 3 | Greeting | `welcome to Uown!` | `welcome to Kornerstone!` |
| 4 | Email contato | `info@UownLeasing.com` | `cs@kornerstoneliving.com` |
| 5 | Telefone footer | `(877) 353-8696` | `(888) 521-5111` |
| 6 | CS hours | `Mon-Sat: 8am-12am EST / Sun 11am-11pm` | `Mon-Fri 8am-11pm / Sat 9am-11pm / Sun 10am-11pm` |
| 7 | Social icons | FB + LinkedIn + Instagram (3) | FB + Instagram (2, sem LinkedIn) |
| 8 | Footer address | `10500 University Center Drive, Suite 150, Tampa, Florida, 33612, USA` | Sem endereço físico |
| 9 | Closing brand | `The Uown Team` | `The Kornerstone Team` |

### Pendências técnicas (consolidado)

- PT-01 `note_type` exato no `uown_los_lead_notes` (bloqueia CT06).
- PT-02 Idempotência (define expected do CT07).
- PT-03 Comportamento sem lease ativo (define expected do CT09).
- PT-04 Domínio GCS aprovado (bloqueia CT04 — define a allow-list).
- PT-05 Template program-aware (13 vs 16) — define expected do CT11.
- PT-06 Disponibilidade do sweep em stg/qa2.
- PT-07 (anotado e concluído como N/A) SignWell vs GoSign.

### Helpers / clients existentes a reutilizar

- `src/helpers/email.helpers.ts` — IMAP (snapshotInboxUid, getEmailContent, plus-addressing).
- `src/api/clients/svc-email.client.ts` — verificar se já tem `sendWelcomeEmail` / sweep; se não, qa-implementer adiciona.
- `createPreQualifiedApplication` + `ensureMerchantReady` — setup de leads.

### Helpers / clients a criar (handoff para qa-implementer)

- Método `sendWelcomeEmail(accountPk)` no `svc-email.client.ts` (se ausente).
- Método `triggerEmailSweep()` (sweep trigger).
- Helper `WelcomeEmailAssertions` (parse HTML, asserções por brand) — opcional, decisão do implementer.

---

## 11. Definition of Done

- Todos CT P0 (CT01-CT06) verdes em **stg**.
- CT08 (negativo) verde.
- CT10 (diff por brand) verde.
- CT07, CT09, CT11 executados como exploratórios + comportamento documentado.
- Activity log validation (CT06) executada — se DB não tem nota, abrir pitfall + escalar.
- Report final em `docs/taskTestingUown/517-welcome-email-template/517-welcome-email-template-report.md` com todos status, evidência (HTML cru salvo em `artifacts/`), ambiente, runId.

---

**Ready for: qa-implementer**

(Bloqueio sugerido: resolver PT-01 e PT-04 antes de iniciar implementação — sem `note_type` o CT06 vira asserção frouxa, e sem domínio GCS o CT04 vira regex inútil.)
