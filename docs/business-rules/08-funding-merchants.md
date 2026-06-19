---
title: Funding e Gestão de Merchants
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/merchant-config-contract.ts
  - code: src/config/constants.ts#generateTestSSN
  - db: uown_scheduled_task
  - env: qa2
covers: [funding, merchants, webhooks, ssn, los-svc-import, integration-api]
derived_from: [underwriting-and-funding-test-data-paths]
---

# Funding e Gestao de Merchants
## UOwn Leasing - SVC Platform

Fila de financiamento, importacao LOS-SVC, webhooks, gestao de merchants/leads, API de integracao e auditoria de funding.

---

## 9. Fila de Financiamento (Funding)

### O Que e Funding

Funding e o processo pelo qual **a UOwn paga o merchant** pelo produto que o cliente levou. E o momento em que a UOwn assume o risco financeiro.

### Como o Merchant e Pago

```
Valor liquido ao merchant = Invoice Amount
  - Dealer Discount (% retido)
  - Platform Fee (% da UOwn, default 2%)
  - CC Processing Fee (% de processamento)
  + Dealer Rebate (% devolvido como incentivo)
```

### Transicoes de Status

```
FUNDING ──────> FUNDED ──────> REQUEST_REFUND ──────> REFUNDED
    ^               |
    └───────────────┘
    (Reversao: FUNDED -> FUNDING)
```

| Transicao | O que acontece |
|-----------|---------------|
| -> FUNDING | Lead importado para SVC, conta criada, `fundRequestDateTime` registrado |
| FUNDING -> FUNDED | Merchant recebeu pagamento, transacao FUNDED criada, lead -> FUNDED |
| FUNDED -> FUNDING | Reversao (erro), status revertido |
| REQUEST_REFUND -> REFUNDED | Dinheiro clawback do merchant |

### Mudanca de Invoice Apos Funding

| Se lead em | Acao |
|-----------|------|
| FUNDING | Transacoes existentes canceladas, novas criadas |
| FUNDED | Transacao REQUEST_REFUND criada |

---

## 10. Importacao LOS para SVC

### O Que Acontece

Quando um lead e financiado, seus dados sao importados do sistema de originacao (LOS) para o sistema de servicing (SVC), criando uma conta ativa.

### Dados Importados

Conta, clientes, enderecos, emails, telefones, emprego, contas bancarias (deduplicadas), transacoes CC (apenas APPROVED), recebiveis, plano de protecao.

### Regras Especiais

| Regra | Detalhe |
|-------|---------|
| Termo 16 meses | EPO desabilitado (`earlyPayoffDateExpiry = hoje`) |
| Security deposit > 0 | Pagamento tipo `DEPOSIT` |
| Email de boas-vindas | Enviado apos importacao |
| Conta cancelada apos update | Trigger cancelamento com reembolso |

---

## 28. Webhooks (Notificacoes para Merchants)

### O Que e

Sistema de callbacks HTTP que envia notificacoes em tempo real para sistemas de merchants parceiros quando status de leads mudam.

### Para Que Serve

Merchants precisam saber quando coisas acontecem: cliente assinou, deal financiado, aplicacao expirou. Em vez de merchants consultarem a UOwn constantemente, a UOwn envia updates proativamente.

### Status que Disparam Webhook

Default: `CONTRACT_CREATED, EXPIRED, CANCELLED_DUP_SSN, FUNDING, FUNDED, SIGNED`

### Como Funciona

1. Status do lead muda
2. Sistema verifica se merchant tem `useWebhook = true`
3. Se merchant requer autenticacao: obtem token OAuth primeiro
4. Payload JSON construido a partir de query SQL configuravel (customizavel por merchant sem code change)
5. POST enviado para URL do merchant com headers de autorizacao

### Impacto no Merchant

Quando webhook de FUNDED dispara, o merchant sabe que pode liberar a mercadoria ao cliente. Quando EXPIRED dispara, merchant para de segurar inventario.

---

## 48. Gestao de Merchants (Lojistas)

### Criacao

| Campo | Requerido | Descricao |
|-------|-----------|-----------|
| clientType | Sim | Tipo de integracao |
| refMerchantCode | Sim | Codigo de referencia |
| username, apiKey, merchantUrl | Default do clientType | Credenciais |

### Ativacao/Desativacao

| Acao | Como Ativar | Impacto |
|------|-------------|---------|
| Desativacao | Admin Panel -> Merchant -> Desativar | Lock de usuarios via AMS. Novas aplicacoes continuam mas podem ser auto-denied |
| Ativacao | Admin Panel -> Merchant -> Ativar | Unlock de usuarios |
| Remover de usuarios | Admin Panel (so se inativo) | Remove merchant de todos os perfis |
| Auto-Deny | Setar `autoDenyApplication = TRUE` no merchant | Nega todas as aplicacoes automaticamente |

### Clone

Cria copia do merchant: `pk = 0`, `clonedFrom = originalPk`, codigo += `_clone`. Programas copiados.

### Como Disparar

- **Criar:** `POST /uown/createMerchant`
- **Atualizar:** `POST /uown/updateMerchant`
- **Clonar:** `POST /uown/cloneMerchant/{merchantPk}`
- **Desativar:** `POST /uown/deactivateMerchant/{merchantPk}`

---

## 49. Gestao de Leads

### Transicoes Permitidas via ChangeLeadStatus

Somente para: `UW_APPROVED`, `EXPIRED`, `SIGNED`

### Regras Especiais

| Transicao | Regra |
|-----------|-------|
| EXPIRED -> UW_APPROVED | Requer nova expiration date |
| UW_DENIED -> UW_APPROVED | Altera valor de aprovacao |
| -> SIGNED (com conta existente) | Cancela conta se configurado, reembolsa se configurado |
| Status nao elegivel -> UW_APPROVED | Re-executa steps de UW restantes com reset de servicos de fraude |

### Como Disparar

- **Mudar status:** `POST /uown/los/changeLeadStatus`
- **Blacklistar lead:** `POST /uown/los/blacklistLead/{leadPk}`
- **Re-aprovar:** Via Admin Panel ou endpoint de change status

---

## 51. API de Integracao para Merchants (Full API)

### O Que e

A UOwn Leasing API permite integracao completa com a plataforma de financiamento UOwn, habilitando merchants a automatizar submissao de aplicacoes, processamento de invoices, gerenciamento de contratos e rastreamento de status -- tudo via API sem necessidade de interacao manual com o Merchant Portal.

### Para Que Serve

Merchants que possuem sistemas proprios (e-commerce, POS, ERP) podem integrar diretamente com a UOwn para oferecer financiamento aos seus clientes sem sair da plataforma do merchant.

### Autenticacao

Toda requisicao deve incluir credenciais de autenticacao no body:

| Campo | Descricao | Obrigatorio |
|-------|-----------|-------------|
| `userName` | Username atribuido ao merchant | Sim |
| `setupPassword` | Senha de autenticacao | Sim |
| `merchantNumber` | Identificador unico do merchant (ex: `OL90202-0001`) | Sim |

**Como obter credenciais:**
1. Contatar a equipe UOwn
2. Fornecer dados do merchant e caso de uso
3. Receber `userName`, `setupPassword` e `merchantNumber`

**Requisitos de rede:** IPs de egresso devem ser whitelistados. Fornecer a UOwn: nome do merchant, ambiente (Sandbox/Producao), tipo de acesso, e IPs estaticos. Recomendado usar NAT Gateway para IPs consistentes.

### Fluxos de Integracao

#### Fluxo 1: Aplicacao Completa (Com Invoice/Carrinho)

```
1. Merchant envia sendApplication COM itens do carrinho
2. UOwn processa aplicacao + underwriting
3. Se aprovado: retorna link para finalizacao do lease
4. Cliente completa dados de pagamento e assina contrato via link
5. Merchant chama settleApplication para iniciar funding
```

**Quando usar:** Quando o cliente ja escolheu os itens antes de aplicar. Mais rapido para finalizacao.

#### Fluxo 2: Pre-Aprovacao (Sem Invoice)

```
1. Merchant envia sendApplication SEM itens (pre-aprovacao)
2. UOwn retorna valor aprovado (creditLimit)
3. Cliente escolhe itens com base no credito aprovado
4. Merchant envia sendInvoice com os itens selecionados
5. UOwn retorna link para finalizacao do lease
6. Cliente completa dados de pagamento e assina contrato
7. Merchant chama settleApplication para iniciar funding
```

**Quando usar:** Quando o merchant quer dar ao cliente um limite de credito antes da compra. Mais flexibilidade.

### Finalizacao do Lease (Assinatura)

Apos aprovacao, o cliente deve completar:
1. Inserir dados de pagamento (CC ou ACH)
2. Revisar termos do lease
3. Decidir sobre plano de protecao (opt-in/opt-out)
4. Assinar contrato digital

**Duas formas de finalizacao:**

| Metodo | Descricao |
|--------|-----------|
| **Portal UOwn** | Cliente acessa link retornado pela API (`redirectUrl`) e completa no site da UOwn |
| **Pagina Embarcada (Iframe)** | Merchant embarca as paginas de finalizacao dentro da propria plataforma via iframe |

### Notificacoes de Finalizacao

Apos o cliente assinar ou recusar o contrato, a UOwn notifica o merchant de 3 formas:

#### 1. URL Redirect

O cliente e redirecionado para o `returnUrl` fornecido pelo merchant com parametros:
- `event=completed` (assinou) ou `event=cancelled` (recusou)
- `ata={UUID}` (identificador unico da aplicacao)

**Exemplo:** `{returnUrl}?event=completed&ata=892828a0-f766-4183-add7-781cbbc1ac83`

#### 2. PostMessage do Iframe

Se a assinatura ocorre em iframe embarcado, a UOwn envia `postMessage` ao completar. O merchant escuta o evento e atualiza seu sistema.

#### 3. Webhook

A UOwn envia POST para URL de webhook configurada com status atualizado do lease. Mensagem e URL configuraveis por merchant.

---

### Endpoints da API

#### 51.1 POST /uown/los/sendApplication

**O que faz:** Submete aplicacao de cliente para avaliacao de credito. Pode incluir ou nao os itens do carrinho.

**Campos obrigatorios do request:**

| Campo | JSON Tag | Obrigatorio | Formato/Notas |
|-------|----------|-------------|---------------|
| Username | `userName` | Sim | |
| Senha | `setupPassword` | Sim | |
| Merchant Number | `merchantNumber` | Sim | |
| Nome | `mainFirstName` | Sim | |
| Sobrenome | `mainLastName` | Sim | |
| Data Nascimento | `mainDOB` | Sim | MMDDYYYY |
| SSN | `mainSSN` | Sim | Apenas digitos, sem hifens |
| Endereco | `mainAddress1` | Sim | |
| Cidade | `mainCity` | Sim | |
| CEP | `mainPostalCode` | Sim | Apenas digitos |
| Celular | `mainCellPhone` | Sim | Apenas digitos, 10 digitos |
| Empregador | `mainEmployerName` | Sim | |
| Renda (mensal ou anual) | `mainMonthlyIncome` ou `mainAnnualIncome` | Sim | Um dos dois obrigatorio |
| Email | `emailAddress` | Sim | |
| IP | `ipaddress` | Sim | |
| SEON Fingerprint | `seonFingerprintText` | Sim | Protecao contra fraude |

**Campos opcionais importantes:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| URL de retorno | `returnUrl` | Redirect apos assinatura |
| ID externo | `externalReferenceId` | Identificador do merchant por aplicacao |
| UUID | `uuid` | Identificador unico gerado pelo merchant |
| Codigo do cliente | `customerCode` | ID do cliente no sistema do merchant |
| Frequencia desejada | `desiredPaymentFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Proxima data pagamento | `mainNextPayDate` | MMDDYYYY (configuravel por merchant) |
| Frequencia salarial | `mainPayFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Ultimo pagamento | `mainLastPayDate` | MMDDYYYY |
| Idioma | `languagePreference` | E = English, S = Spanish |
| Indicador individual/joint | `individualJointIndicator` | I = Individual, J = Joint |
| Locale | `localeString` | Default: en_US |
| Deposito | `depositAmount` | Decimal, ate 10 digitos |
| Total do pedido | `orderTotal` | Decimal (obrigatorio se com carrinho) |
| Subtotal merchandise | `merchandiseSubtotal` | Soma antes de imposto |
| Sales Tax | `salesTax` | Decimal |
| Desconto | `discountAmount` | Ate 10 digitos |
| Frete | `deliveryCharge` | Decimal |
| Instalacao | `installationCharge` | Decimal |
| Taxas diversas | `miscellaneousFees` | Decimal |
| Valor solicitado | `requestedLoanAmount` | Decimal |
| Falencia passada | `mainPastBankruptcy` | boolean |
| Falencia atual/futura | `mainCurrentOrFutureBankruptcy` | boolean |
| Envio = endereco cliente | `shipToSameAsConsumer` | boolean |

**Campos opcionais de endereco e residencia:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Estado | `mainStateOrProvince` | Sigla do estado |
| Complemento | `mainAddress2` | |
| Morando desde | `mainAtAddressFrom` | Formato MMYY |
| Telefone residencial | `mainHomePhone` | Apenas digitos |
| Status habitacional | `mainHousingStatus` | O=Owner, R=Renter, PR=Parents/Relatives, OT=Other |
| Pagamento mensal moradia | `mainMonthlyHousingPayment` | Decimal |
| Saldo da hipoteca | `mainMortgageBalance` | Inteiro |
| Valor do imovel | `mainHomeValue` | Inteiro |
| Endereco anterior 1 | `mainPrevAddress1` | |
| Endereco anterior 2 | `mainPrevAddress2` | |
| Cidade anterior | `mainPrevCity` | |
| Estado anterior | `mainPrevStateOrProvince` | |
| CEP anterior | `mainPrevPostalCode` | Apenas digitos |
| Morando endereco anterior desde | `mainAtPrevAddressFrom` | Formato MMYY |

**Campos opcionais bancarios:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Conta corrente | `mainCheckingAccount` | Y ou N |
| Conta poupanca | `mainSavingsAccount` | Y ou N |
| Duracao da conta | `mainBankAccountDuration` | Enum |
| Numero da conta | `mainBankAccountNumber` | Apenas digitos |
| Routing number | `mainBankRoutingNumber` | Apenas digitos |
| Data abertura da conta | `mainBankAccountOpenedDate` | MMDDYYYY |
| Tipo de conta | `mainBankAccountType` | CHECKING ou SAVINGS |

**Campos opcionais de emprego:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Status emprego | `mainEmplStatus` | D=Disabled, E=Employed, etc. |
| Empregado desde | `mainAtEmployerFrom` | Formato MMYY |
| Ocupacao | `mainOccupation` | |
| Telefone empregador | `mainEmployerPhone` | Apenas digitos |
| Renda liquida mensal | `mainMonthlyNetIncome` | Inteiro |
| Estado civil | `mainMaritalStatus` | M=Married, U=Unmarried |
| Nome solteira da mae | `mainMotherMaidenName` | |

**Campos de itens do carrinho (se incluidos):**

| Campo | JSON Tag | Obrigatorio | Notas |
|-------|----------|-------------|-------|
| Numero da linha | `lineItemLineNumber` | Sim | |
| Numero do produto | `lineItemProductNumber` | Sim | SKU |
| Descricao | `lineItemProductDescription` | Sim | |
| Categoria | `lineItemProductCategory` | Sim | |
| Tipo | `lineItemType` | Sim | D = Debito/Venda, C = Credito/Devolucao |
| Quantidade | `lineItemQuantityOrdered` | Sim | |
| Preco unitario | `lineItemUnitPrice` | Sim | Ate 10 digitos, 2 decimais |
| Preco total | `lineItemExtendedPrice` | Sim | Preco x quantidade |
| Numero serial | `lineItemSerialNumber` | Nao | Numero de serie do produto |
| Preco base | `lineItemBasePrice` | Nao | Decimal |
| Imposto do item | `lineItemTaxAmount` | Nao | Decimal |

**SEON Fingerprint (Protecao contra Fraude):**
A UOwn usa a plataforma SEON para protecao contra fraude via device fingerprinting. Merchants devem implementar o SEON SDK em seus sites/apps:
- **Websites:** Incluir SEON JavaScript Agent, chamar `seon.config()` e `seon.getBase64Session()`
- **iOS:** Integrar via CocoaPods
- **Android:** Integrar via Gradle
O valor gerado deve ser passado como `seonFingerprintText`.

**Exemplo de request (com carrinho):**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "mainFirstName": "Joe",
    "mainLastName": "Sample",
    "mainDOB": "01011998",
    "mainSSN": "881469868",
    "emailAddress": "joesample@outlook.com",
    "mainAddress1": "666 Test Street",
    "mainCity": "Test City",
    "mainPostalCode": "77494",
    "mainCellPhone": "5038784427",
    "languagePreference": "E",
    "mainEmployerName": "BestBuy",
    "mainNextPayDate": "05252025",
    "mainPayFrequency": "MONTHLY",
    "seonFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "merchandiseSubtotal": 1200.00,
    "salesTax": 0.00,
    "orderTotal": 1200.00,
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Exemplo de resposta (aprovado):**

```json
{
    "faults": false,
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "authorizationNumber": "8280",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 1200,
    "transactionStatus": "E0",
    "appApprovalStatus": "APPROVED",
    "creditLimit": 5136,
    "programType": "LTO",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 100.63,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        }
    ]
}
```

**Exemplo de resposta (negada - SSN termina em 9):**

```json
{
    "faults": false,
    "fieldInError1": "SSN : ending with 9 is rejected on test server",
    "accountNumber": "b5444312-2c6e-4238-8bf7-37088d9d527b",
    "authorizationNumber": "8279",
    "transactionStatus": "E4",
    "appApprovalStatus": "DECLINED",
    "creditLimit": 0,
    "programType": "LTO"
}
```

**Exemplo de resposta (erro de validacao - 400):**

```json
{
    "faults": true,
    "fieldInError1": "mainNextPayDate",
    "sorErrorDescription": "NextPayDate should be in the future. Received 2025-03-05",
    "transactionStatus": "E3",
    "appApprovalStatus": "DECLINED"
}
```

**Campos importantes da resposta:**

| Campo | Descricao |
|-------|-----------|
| `accountNumber` | UUID da aplicacao (usar em chamadas futuras) |
| `appApprovalStatus` | APPROVED ou DECLINED |
| `creditLimit` | Valor maximo aprovado |
| `transactionStatus` | E0 = nao aprovado para transacao, E1 = aprovado, E3 = erro validacao, E4 = negado |
| `paymentDetailsList` | Opcoes de pagamento com `redirectUrl` para finalizacao |
| `redirectUrl` | Link para o cliente completar a assinatura |
| `totalContractAmountWithTax` | Valor total do contrato com imposto |
| `totalContractAmountNoTax` | Valor total do contrato sem imposto |
| `regularPaymentWithTax` | Valor da parcela regular |
| `numberOfPayments` | Total de parcelas |
| `firstPaymentWithFeesAndTax` | Primeiro pagamento incluindo taxas e impostos |
| `firstPaymentWithFeesNoTax` | Primeiro pagamento incluindo taxas sem impostos |
| `firstPaymentDate` | Data do primeiro pagamento |
| `paymentDueToday` | Valor a pagar hoje (security deposit) |
| `purchaseNowTotal` | Total para compra imediata |
| `faults` | true = erro, false = sucesso |
| `fieldInError1` | Campo com erro (em caso de falha) |
| `sorErrorDescription` | Descricao detalhada do erro |

---

#### 51.2 POST /uown/los/sendInvoice

**O que faz:** Envia invoice separadamente quando nao incluida no sendApplication. Tambem usado para cancelar, devolver ou modificar invoices.

**Operacoes suportadas via `orderType`:**

| orderType | Operacao | Descricao |
|-----------|----------|-----------|
| `1` | **Submeter Invoice** | Envia itens para completar lease |
| `5` | **Cancelar Invoice** | Remove invoice mas mantem aprovacao ativa |
| `1` (com itens tipo C) | **Devolver Itens** | Devolucao parcial ou total |
| `1` (itens modificados) | **Modificar Invoice** | Atualiza itens/valores existentes |

**Campos do request:**

| Campo | JSON Tag | Obrigatorio | Descricao |
|-------|----------|-------------|-----------|
| Username | `userName` | Sim | |
| Senha | `setupPassword` | Sim | |
| Merchant Number | `merchantNumber` | Sim | |
| Account Number | `accountNumber` | Sim | UUID retornado do sendApplication |
| Order Type | `orderType` | Sim | 1 = venda, 5 = cancelamento |
| Invoice Number | `invoiceNumber` | Recomendado | Numero de referencia do merchant |
| Order Total | `orderTotal` | Sim | Total do pedido |
| Frequencia | `selectedPaymentFrequency` | Opcional | WEEKLY, BI_WEEKLY, etc. |
| Line Items | `lineItem` | Sim (para vendas) | Array de itens |

**Exemplo - Submeter Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderType": "1",
    "invoiceNumber": "INV123456",
    "orderTotal": 1200.00,
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Exemplo - Cancelar Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "5",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderTotal": "0.00"
}
```

**Exemplo - Devolver Itens (Parcial):**

Para devolucao parcial, incluir itens devolvidos com `lineItemType: "C"` e itens mantidos com `lineItemType: "D"`:

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "1",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "invoiceNumber": "INV123456",
    "orderTotal": 300.00,
    "lineItem": [
        {
            "lineItemLineNumber": "001",
            "lineItemProductNumber": "SKU67890",
            "lineItemProductDescription": "Wireless Headphones",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "C",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        },
        {
            "lineItemLineNumber": "002",
            "lineItemProductNumber": "SKU67891",
            "lineItemProductDescription": "Mouse",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        }
    ]
}
```

**Para devolucao total:** Deixar lista de itens vazia e `orderTotal = 0.00`.

**Exemplo - Modificar Invoice:**

Enviar `orderType: "1"` com `invoiceNumber` existente, `orderTotal` atualizado e lista de itens atualizada. Nao incluir itens cancelados/devolvidos. Garantir que totais calculados correspondam a lista de itens.

**Resposta de sucesso - submeter invoice (`transactionStatus: "A1"`):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1200,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15993,
            "lineItemLineNumber": 101,
            "lineItemProductNumber": "SKU98765",
            "lineItemSerialNumber": "SN12345678",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200,
            "lineItemExtendedPrice": 1200,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Smart TV 55-inch 4K"
        }
    ],
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2817.73,
            "totalContractAmountNoTax": 2651.97,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 50.32,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

**Resposta de sucesso - modificar invoice:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1800,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15996,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15997,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Resposta de sucesso - devolver item:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1500,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15998,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15999,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "CREDIT_RETURN",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "RETURNED",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Resposta de erro (conta nao encontrada - 400):**

```json
{
    "faults": true,
    "fieldInError1": "CustomerCode Or AccountNumber",
    "sorErrorDescription": "Lead could not be found with the given parameters",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

---

#### 51.3 POST /uown/los/getApplicationStatus

**O que faz:** Consulta status atual de uma aplicacao de lease. Permite rastrear progresso, confirmar transicoes de estado, e verificar dados do lease.

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "localeString": "en_US",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Campos importantes da resposta:**

| Campo | JSON Tag | Descricao |
|-------|----------|-----------|
| Aplicacao encontrada | `applicationFound` | true/false |
| Status atual | `currentStatus` | UW_APPROVED, UW_DENIED, DENIED, CONTRACT_CREATED, SIGNED, FUNDING, FUNDED, etc. |
| Descricao do status | `statusDescription` | Detalhes adicionais |
| Lease assinado | `hasSignedLease` | true/false |
| Pode continuar | `canContinue` | Se a aplicacao pode prosseguir ao proximo step |
| Valor aprovado | `approvedAmount` | Limite de credito aprovado |
| Open to Buy | `openToBuy` | Credito remanescente disponivel |
| Saldo da conta | `accountBalance` | Saldo atual do lease |
| Ultimo pagamento | `lastPayment` / `lastPaymentDate` | Valor e data |
| Proximo vencimento | `paymentDueDate` | Data do proximo pagamento |
| Valor a ser financiado | `amountToBeFunded` | Total que sera pago ao merchant |
| Data request funding | `fundRequestDateTime` | Quando funding foi solicitado |
| Data funded | `fundedDateTime` | Quando merchant recebeu pagamento |
| Desconto merchant | `merchantDiscountPercent` / `merchantDiscountAmount` | % ou valor de desconto |
| Rebate merchant | `merchantRebatePercent` / `merchantRebateAmount` | % ou valor de rebate |
| ID externo | `externalReferenceId` | Identificador do merchant |
| Itens | `lineItem` | Lista de itens do lease |

**Valores possiveis de `currentStatus`:**

| Status | Descricao |
|--------|-----------|
| `UW_APPROVED` | Aprovado pelo underwriting |
| `UW_DENIED` | Negado pelo underwriting |
| `DENIED` | Negado |
| `CONTRACT_CREATED` | Contrato criado |
| `SIGNED` | Contrato assinado |
| `FUNDING` | Em processo de financiamento |
| `FUNDED` | Financiado com sucesso |
| `CANCELLED_DUP_SSN` | Cancelado por SSN duplicado |

**Exemplo de resposta (UW_APPROVED):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-04-08T19:40:20.777815",
    "appUuid": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "leadPk": 8365,
    "currentStatus": "UW_APPROVED",
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "merchantName": "Progress Mobility Acquisition LLC",
    "refMerchantCode": "OL90294-0001",
    "totalInvoiceAmount": 1200,
    "merchantInvoiceNumber": "R123456",
    "transactionStatus": "I0",
    "merchantDiscountPercent": 0.5,
    "merchantRebatePercent": 0,
    "merchantRebateType": "DAILY"
}
```

**Exemplo de resposta (FUNDING - apos assinatura e settlement):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "currentStatus": "FUNDING",
    "hasSignedLease": true,
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "paymentDueDate": "2025-04-15",
    "fundRequestDateTime": "2025-04-08T20:29:53.727201",
    "fundedDateTime": null,
    "amountToBeFunded": 600,
    "merchantDiscountPercent": 0.5,
    "merchantDiscountAmount": 600,
    "merchantRebatePercent": 0,
    "merchantRebateAmount": 0,
    "merchantRebateType": "DAILY"
}
```

---

#### 51.4 POST /uown/los/settleApplication

**O que faz:** Finaliza uma aplicacao de lease apos o cliente assinar o contrato e os produtos terem sido entregues. Dispara o processo de **funding** (pagamento ao merchant).

**Quando usar:** Somente apos:
1. Cliente ter assinado o lease digitalmente
2. Merchant ter entregue a mercadoria

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Campos da resposta:**

| Campo | JSON Tag | Descricao |
|-------|----------|-----------|
| Transaction Status | `transactionStatus` | A0 = nao settled, A1 = settled |
| Amount | `amount` | Valor envolvido na transacao |
| Transaction Message | `transactionMessage` | Mensagem descritiva (em caso de A0) |
| Payment Details | `paymentDetailsList` | Detalhes dos pagamentos |
| Account Number | `accountNumber` | Mesmo do request |
| Authorization Number | `authorizationNumber` | Se sucesso (A1) |

**Exemplo de resposta (nao elegivel - A0):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionMessage": "LeadStatus UW_APPROVED is not eligible for settlement",
    "transactionStatus": "A0",
    "amount": 0,
    "paymentDetailsList": []
}
```

**Exemplo de resposta (settled com sucesso - A1):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionStatus": "A1",
    "amount": 1200,
    "paymentDetailsList": []
}
```

---

#### 51.5 POST /uown/los/addLease

**O que faz:** Cria um **lease adicional** usando o credito remanescente de um lease previamente financiado do mesmo cliente.

**Pre-condicoes:**
1. Lease original deve estar **FUNDED**
2. Cliente deve ter feito o **primeiro pagamento** em dia
3. Deve existir **credito remanescente** disponivel (`openToBuy > 0`)

**Request:** Estrutura identica ao sendInvoice, mas usando endpoint diferente.

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "customerCode": "ABC123",
    "orderType": "1",
    "invoiceNumber": "R91931",
    "orderTotal": "250.00",
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "1",
            "lineItemProductNumber": "A123SKU5987",
            "lineItemProductDescription": "Product test description",
            "lineItemProductCategory": "Cat1",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "250",
            "lineItemExtendedPrice": "250.00"
        }
    ]
}
```

**Resposta de erro (lease nao finalizado):**

```json
{
    "faults": false,
    "sorErrorDescription": "Cannot add a lease before the lease contract is finalized.",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

**Resposta de sucesso (add lease aprovado):**

```json
{
    "faults": false,
    "accountNumber": "049819e0-c4fe-47a1-a2d7-613bed206c08",
    "authorizationNumber": "8367",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 250,
    "purchaseNowTotal": 0,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.48,
            "regularPaymentWithTax": 10.49,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 10.49,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.50,
            "regularPaymentWithTax": 20.96,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 20.96,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

---

#### 51.6 POST /uown/los/merchant/changeMerchant

**O que faz:** Altera o merchant associado a uma aplicacao. Usado quando uma aplicacao precisa ser transferida para outro merchant.

**NOTA:** Este endpoint usa campos de autenticacao diferentes dos demais (`username`/`password` em vez de `userName`/`setupPassword`).

**Request:**

```json
{
    "username": "admin_user",
    "password": "admin_pass",
    "refMerchantCode": "OL90294-0002",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

| Campo | JSON Tag | Obrigatorio | Descricao |
|-------|----------|-------------|-----------|
| Username | `username` | Sim | Diferente dos demais endpoints (lowercase) |
| Password | `password` | Sim | Diferente dos demais endpoints |
| Codigo Merchant | `refMerchantCode` | Sim | Codigo do novo merchant |
| Account Number | `accountNumber` | Sim | UUID da aplicacao |

---

### Requisito de IP Whitelisting

Os IPs de saida (egress) do sistema do merchant devem ser registrados e liberados pela UOwn antes de poder acessar a API. Para provedores de nuvem, recomenda-se usar **NAT Gateway** para garantir IPs consistentes de saida.

---

### Regras do Sandbox e QA1 para Testes

> **Importante:** As regras de SSN abaixo se aplicam apenas a **sandbox e qa1**, onde a engine de underwriting e mockada. Em **qa2**, a engine BlackBox/ABB e real e ignora o sufixo do SSN — o resultado depende da avaliacao live do lead.

| Regra | Ambientes | Descricao |
|-------|-----------|-----------|
| **SSN terminando em 9** | sandbox, qa1 | Aplicacao sera **negada** (simula falha via mock UW) |
| **SSN terminando em 0-8** | sandbox, qa1 | Aplicacao sera **aprovada** (simula sucesso via mock UW) |
| **SSN qualquer sufixo** | qa2 | Resultado determinado pela engine real (nao ha trigger confiavel para negacao sem autorizacao de DevOps/PO) |
| **Valor minimo do lease** | todos os envs | **$250** - aplicacoes abaixo deste valor nao serao aprovadas |

### Resumo de Endpoints

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/uown/los/sendApplication` | POST | Submete aplicacao (com ou sem carrinho) |
| `/uown/los/sendInvoice` | POST | Envia/cancela/devolve/modifica invoice |
| `/uown/los/getApplicationStatus` | POST | Consulta status da aplicacao |
| `/uown/los/settleApplication` | POST | Finaliza lease e dispara funding |
| `/uown/los/addLease` | POST | Cria lease adicional com credito remanescente |
| `/uown/los/merchant/changeMerchant` | POST | Transfere aplicacao para outro merchant |

### Codigos de Status da Resposta

| Codigo | Campo | Significado |
|--------|-------|-------------|
| `E0` | `transactionStatus` | Aplicacao recebida, nao aprovada para transacao |
| `E1` | `transactionStatus` | Aplicacao aprovada para transacao |
| `E3` | `transactionStatus` | Erro de validacao (campo invalido no request) |
| `E4` | `transactionStatus` | Aplicacao negada (declined) |
| `A0` | `transactionStatus` | Settlement nao realizado / invoice nao processada |
| `A1` | `transactionStatus` | Settlement realizado / invoice processada com sucesso |
| `I0` | `transactionStatus` | Status informativo (consulta) |
| `APPROVED` | `appApprovalStatus` / `authApprovalStatus` | Aprovado |
| `DECLINED` | `appApprovalStatus` / `authApprovalStatus` | Negado |


## 67. Auditoria de Modificacoes de Funding

### O Que e

Registra e rastreia todas as modificacoes de status no processo de funding, mantendo trilha de auditoria completa.

### Para Que Serve

Compliance e troubleshooting. Permite reconstruir o historico completo de mudancas de status de funding para qualquer lead.

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `leadPk` | Identificador do lead |
| `oldFundingQueueStatus` | Status anterior (FUNDING, FUNDED, etc.) |
| `newFundingQueueStatus` | Novo status |
| `oldLeadStatus` | Status anterior do lead |
| `newLeadStatus` | Novo status do lead |
| `username` | Usuario que fez a alteracao |
| `timestamp` | Data/hora da modificacao |

### Transicoes Validas de Funding

| Transicao | Descricao |
|-----------|-----------|
| `FUNDING -> FUNDED` | Merchant recebeu pagamento (fluxo normal) |
| `FUNDED -> FUNDING` | Reversao (erro ou correcao) |
| `REQUEST_REFUND -> REFUNDED` | Reembolso completado |
| Outra | Transicao invalida/default |

### Como Consultar

```
POST /uown/svc/getFundingModifications
Body: FundingModificationsRequest { leadPk, oldStatus, newStatus, username, startDate, endDate }
```

Suporta paginacao e filtros opcionais (todos os campos sao nullable).

---

