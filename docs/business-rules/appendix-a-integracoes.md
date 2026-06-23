---
title: "Apendice A: Integracoes com Terceiros"
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-23
sources:
  - code: src/data/merchant-config-contract.ts#offerInsurance
  - svc-source: config/rightfoot/RightFootConfig.java
  - external-doc: https://documenter.getpostman.com/view/28884504/2sBXcEizW5
  - env: qa2
covers: [integracoes, vendors, sentilink, neustar, lexisnexis, seon, plaid, taxcloud, sweeps, rightfoot, gowsign-routing]
---

# Apendice A: Integracoes com Terceiros
## UOwn Leasing - SVC Platform

Referencia completa de todas as integracoes externas do sistema.

---

## Apendice A: Integracoes com Terceiros

| Servico | Funcao | Momento de Uso | Como Ativar/Configurar |
|---------|--------|---------------|----------------------|
| **Sentilink** | Deteccao de identidade sintetica | Aplicacao (UW engine step 1) | Thresholds por merchant |
| **Neustar** | Verificacao de dados de contato | Aplicacao (UW engine step 2) | Checks habilitaveis por merchant |
| **LexisNexis** | Score de risco via registros publicos | Aplicacao (UW engine step 3) | Threshold por merchant |
| **SEON** | Motor de fraude digital (email/phone/IP) | Aplicacao (UW engine step 4) | 4 thresholds por merchant |
| **NeuroID** | Biometria comportamental | Preenchimento do formulario | `useNeuroIdCheck` por merchant |
| **Intellicheck** | Autenticacao de documento de ID | Submissao da aplicacao | `isIntellicheckRequired` por merchant |
| **Kount** | Fraude de cartao de credito | Pagamento | Automatico em todas transacoes CC |
| **Plaid** | Verificacao bancaria e de renda | Segunda chance (UW_REVIEW) | `isPlaidVerificationRequired` por merchant |
| **GDS / Taktile / ABB** | Engines de underwriting | Decisao de credito | Selecao via config por merchant |
| **TaxCloud** | Calculo + compliance de impostos | Toda transacao | `useTaxCloudApi = true` (default) |
| **TaxJar** | Calculo de impostos (alternativo) | Backup do TaxCloud | `useTaxCloudApi = false` |
| **Buddy Insurance** | Plano de protecao | Assinatura ou portal | `offerInsurance = true` no merchant + estados permitidos |
| **Five9** | Call center / IVR | Ligacoes telefonicas | Header `Username: Five9` |
| **Skit.ai** | Bot de cobranca automatizado | Ligacoes via TMS | Sweeps `createSkitDelinquent*` geram arquivos |
| **SignWell / PandaDoc** | Assinatura eletronica | Contrato | Config por merchant |
| **GowSign** | Assinatura eletronica (vendor novo) | Contrato | API `https://api.gowsign.com`, auth `x-api-key` + IP allowlist (ver secao GowSign Vendor API) |
| **Profituity** | Processamento ACH | Pagamentos bancarios | Automatico via sweeps ACH |
| **RightFoot** (R1.53.0) | Verificacao de saldo bancario antes de (re)rodar ACH de inadimplentes | Antes do rerun ACH (sweep diario 15:00 + Qui 09:00) | Config prefix `com.uownleasing.svc.rightfoot.*`; sweeps `DailyAchBalanceCheckSweep` / `RerunAchBalanceCheckSweep` (svc#540). NAO substitui Profituity -- e camada de pre-checagem, nao processador. Detalhes em [09-integracoes-externas.md](09-integracoes-externas.md) secao 48 |
| **Channel Payments / USAePay** | Gateway de CC | Pagamentos cartao | Automatico via sweeps CC |
| **SendGrid** | Envio de emails | Correspondencia | Automatico |
| **Twilio** | Envio de SMS | Correspondencia | Automatico |
| **SharePoint** | Armazenamento de documentos | Relatorios e venda de contas | Sweeps de relatorio |
| **Zendesk** | Tickets de suporte | Portal do cliente | Automatico via portal |
| **RTR** | Importacao de dados RTO/Kornerstone | Migracao de portfolios | Sweep `kornerstoneDailyImportSweep` |
| **PayWallet** | Desconto em folha de pagamento | Pagamentos | Sweep `processPayWalletPaymentsSweep` |
| **TrustPilot** | Avaliacoes de clientes | Pos-servicing | Sweep `refreshTrustPilotAccessKeySweep` |
| **Proget** | Bloqueio de dispositivos IoT/GPS | Inadimplencia | Sweep `progetDeviceLockingSweep` |
| **Vervent** | Documentos de lease para banco | Funding | Sweep `generateVerventOnBoardingFileSweep` |
| **PayPair** | Marketplace de financiamento (widget) | Originacao via merchant externo | Portal publico `dw93bg.paypair.com`, iframe `#llapp-iframe` |

---

## GowSign Vendor API

Contrato externo do vendor de e-sign GowSign (novo provider, em rollout vs SignWell legado). Como **testar** signing → [[gowsign-knowledge]]; routing por estado e fonte unica em [`03-contratos-esign.md`](03-contratos-esign.md) (NAO duplicar aqui).

> **Fonte primaria (autoritativa):** Postman published doc `GOWSIGN API - UOWN` — `https://documenter.getpostman.com/view/28884504/2sBXcEizW5` (capturado 2026-06-23). `[external-doc:postman/gowsign-api,2026-06-23]`

**Base URL:** `https://api.gowsign.com` (host varia por env — em sandbox/dev o iframe roda em `gowsign-app-dev-uown.azurewebsites.net`; ver pitfall em [[gowsign-knowledge]]).

**Auth:** header `x-api-key: YOUR_API_KEY` + IP allowlist (401 se key invalida/inativa/expirada OU IP nao permitido).

**3 fluxos de criacao de documento** (`POST /api/document`):
1. **DOCX:** `document.documentBase64` (DOCX → PDF server-side); campos via `document.fields` (objetos `{term, type, required, signer, width, height}`).
2. **Custom HTML:** `document.customTemplate` + `customTitle`; campos inline em bracket syntax; variaveis `{{var}}` de `document.variables`.
3. **Strapi Template:** `document.templateId` + `document.environment` (deve casar um environment do template); conteudo/titulo vem do Strapi CMS.

**Document status (enum):** `CREATED` → `OUTSTANDING` → `SIGNED` → `COMPLETED` (+ `EXPIRED`, `CANCELED`).

**pdfStatus (enum):** `CREATED_PENDING`, `CREATED_GENERATED`, `SIGNED_PENDING`, `SIGNED_GENERATED`, `AUDIT_TRAIL_PENDING`, `AUDIT_TRAIL_GENERATED`.

**Webhook callback enrichment** (fluxo Strapi — campos adicionados ao `callback`): `event_hash` (SHA-256 de timestamp + integration key), `event_time`, `event_type` = `document_created`, `Provider` = `GOWSign`, `Meta.related_document_hash` = document ID.

**Inline field bracket-syntax (resumo):**

| Sintaxe | Campo |
|---------|-------|
| `[sig\|REQUIRED\|SIGNER\|W\|H]` / `[sign:ID\|...]` | Assinatura (`sig`/`sign` aliases; default 200×50px) |
| `[initials\|...]` / `[initials:ID\|...]` | Rubrica/initials (default 100×40px; gotcha posicional: usar `||` para so dimensoes) |
| `[date\|SIGNER\|FIELD]` | Data de assinatura (auto, read-only) |
| `[text\|REQ\|SIGNER\|NAME\|INIT\|PLACEHOLDER\|W]` | Input de texto |
| `[radio_button\|REQ\|SIGNER\|GROUP\|INIT\|(label;name)...]` | Radio |
| `[checkbox\|REQ_SPEC\|SIGNER\|GROUP\|(label;name;bool)...]` | Checkbox (`req2/5` = min 2 max 5) |
| `[table\|ID]` | Tabela dinamica de `document.variables[ID]` (`{headers, rows}`) |

- **`:ID` explicito** e necessario para targetar o campo no map `document.hidden` (`{"sig:ID": true}`); sem ID os campos sao auto-numerados.
- **Header/footer** (`document.headerTemplate`/`footerTemplate`): suportam `{{page}}` e `{{pageCount}}` (resolvidos por pagina no render) + a mesma bracket syntax (padrao comum: rubrica por pagina no footer).

---

