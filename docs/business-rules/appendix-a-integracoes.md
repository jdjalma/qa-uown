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
| **Profituity** | Processamento ACH | Pagamentos bancarios | Automatico via sweeps ACH |
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

