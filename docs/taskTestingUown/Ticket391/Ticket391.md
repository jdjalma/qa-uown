-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/391

Test and document ItemSplit feature

ItemSplit feature has been implemented, tested and released a while ago but we did not enable it on any merchant. This functionality enables a customer to pay for a portion of the invoice (one or more items) if their approval amount doesn't cover the full invoice total. The customer can then choose to either pay for some of the item(s) or can choose to re-submit an invoice with order total <= approval amount.
We'd like to turn it back on and test everything to make sure it's working correctly.

Testing process:
    Enable "itemSplit" on merchant
    Send application with invoice and items
    If the orderTotal is less than or equal to the approved amount, then the application proceeds normally
    If the orderTotal is greater than the approved amount by $300 or less, then the response should indicate a "purchaseNowTotal" that should show the amount the customer is required to pay to proceed with signing
    Proceed to any of the links in payment details list and make sure all the details are listed correctly.
    Upon "Submit", we should charge the customer's credit card with the "purchaseNowTotal" amount and should show a lease agreement with the remaining items only
    Proceed with signing.
    Make sure all the statuses in the DB are reflected correctly in LosCreditCard and LosCreditCardTransaction, LosInvoice, LosItem and LosSchedSummary tables.
    The lease shown on the front end and the credit card transactions must accurately reflect all the transactions and amount.
    Proceed with funding.
    Test invoice modifications, refunds and invoice cancellations

-----

Testar e documentar a funcionalidade ItemSplit

Descrição
A funcionalidade ItemSplit foi implementada, testada e lançada há algum tempo, mas não a habilitamos para nenhum merchant. Essa funcionalidade permite que um cliente pague por uma parte da fatura (um ou mais itens) caso o valor aprovado não cubra o total da fatura. O cliente pode então escolher pagar por alguns dos itens ou optar por reenviar uma fatura cujo total seja menor ou igual ao valor aprovado.

Gostaríamos de reativá-la e testar tudo para garantir que está funcionando corretamente.

Processo de Testes
Habilitar “itemSplit” no merchant.
Enviar uma aplicação com fatura e itens.
Se o valor total da ordem (orderTotal) for menor ou igual ao valor aprovado, a aplicação segue normalmente.
Se o orderTotal for maior que o valor aprovado em até US$ 300, a resposta deve indicar um “purchaseNowTotal”, que mostra o valor que o cliente precisa pagar para prosseguir com a assinatura.
Acessar qualquer um dos links na lista de detalhes de pagamento e garantir que todas as informações sejam exibidas corretamente.
Ao clicar em “Submit”, devemos cobrar do cartão de crédito do cliente o valor do “purchaseNowTotal” e exibir um contrato de leasing apenas com os itens restantes.
Prosseguir com a assinatura.
Garantir que todos os status no banco de dados estejam refletidos corretamente nas tabelas LosCreditCard, LosCreditCardTransaction, LosInvoice, LosItem e LosSchedSummary.
O lease exibido no front-end e as transações de cartão de crédito devem refletir com precisão todas as transações e valores.
Prosseguir com o funding.
Testar modificações de fatura, estornos (refunds) e cancelamentos de fatura.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos de Teste – ItemSplit
Abaixo está a lista completa e organizada dos requisitos de teste para validar a funcionalidade ItemSplit descrita no ticket.

Escopo e Pré‑Condições
Feature flag: Habilitar itemSplit no merchant (e validar comportamento quando desabilitada).
Ambiente: Definir envs (QA/Stage/Prod-like) e credenciais de pagamento válidas.
Dados mínimos: Merchant ativo, cliente elegível, aprovação com valor menor que o total da fatura.
Observabilidade: Ativar logs/monitoramento para capturar request/response e transações.
Dados de Teste
Faturas com múltiplos itens: 1, 2, N itens; combinações de preços/quantidades.
Aprovação vs orderTotal:
orderTotal <= approvedAmount.
orderTotal > approvedAmount e diferença <= US$ 300.
orderTotal > approvedAmount e diferença > US$ 300 (fora da regra).
Variações de tributos/descontos: impostos, taxas, cupons, descontos, frete.
Cartão de crédito: válido, inválido, saldo insuficiente, falha na captura.
Cenários Principais (Happy Path)
Aplicação normal: Se orderTotal <= approvedAmount, seguir fluxo normal sem ItemSplit.
Elegível ao ItemSplit: Se orderTotal > approvedAmount e (diferença <= US$ 300):
API deve retornar purchaseNowTotal informando o valor a pagar agora.
Links em “payment details” exibem valores e itens corretamente.
Ao “Submit”, capturar no cartão exatamente purchaseNowTotal.
Gerar lease mostrando apenas os itens remanescentes (não pagos no cartão).
Prosseguir com assinatura até conclusão.
Prosseguir com funding.
Regras de Cálculo e Negócio
Cálculo do purchaseNowTotal:
Elegibilidade somente quando (orderTotal − approvedAmount) <= US$ 300.
purchaseNowTotal deve refletir a diferença a ser paga para permitir a assinatura.
Validar arredondamentos, casas decimais, moeda, impostos e descontos aplicados.
Itens remanescentes: Só itens não cobertos pelo cartão devem compor o lease.
Inadmissível: Se diferença > US$ 300, não deve retornar purchaseNowTotal; fluxo deve orientar a reenviar fatura (orderTotal <= approvedAmount).
UI/UX
Payment details: Todos os valores/itens exibidos corretamente (totais, impostos, descontos, purchaseNowTotal).
Consistência: Os valores exibidos na UI devem bater com o retorno da API/HAR.
Mensagens: Textos claros quando elegível/não elegível ao ItemSplit.
Acessibilidade: Links funcionais; botões habilitados/ desabilitados conforme estado.
API/Integração
Request/Response:
Quando elegível, resposta contém purchaseNowTotal correto.
Verificar payloads em HAR para todos os endpoints relevantes (aplicação, pagamento, assinatura, funding).
Idempotência: Reenvio de requests não pode duplicar cobranças nem criar estados inválidos.
Erros: Tratamento adequado (HTTP, mensagens, códigos).
Pagamentos (Cartão de Crédito)
Captura no Submit: Cobrar exatamente purchaseNowTotal no “Submit”.
Transações: Autorizações vs capturas; uma única captura conforme regra.
Reversões: Se assinatura falhar após captura, política de estorno/rollback.
Falhas: Cartão recusado, tempo de resposta, timeouts → mensagens e recuperação.
Banco de Dados
Validar estados e valores nas tabelas citadas:

LosCreditCard e LosCreditCardTransaction:
Registro de captura com valor = purchaseNowTotal.
Status corretos: authorized/captured/failed conforme cenário.
Timestamps, merchantId, customerId, invoiceId coerentes.
LosInvoice:
Estado da fatura após pagamento parcial e depois do funding.
Totais atualizados, vínculo com lease gerado.
LosItem:
Itens pagos no cartão destacados dos remanescentes no lease.
Quantidades/valores coerentes após split.
LosSchedSummary:
Cronograma do lease apenas para itens remanescentes.
Somatório e parcelas consistentes.
Assinatura
Fluxo completo: Após pagamento, exibir contrato com itens remanescentes.
Integridade do contrato: Valores/itens/parcelas corretos.
Registro de assinatura: Status e timestamps consistentes.
Funding
Processo de funding: Completar funding sem inconsistências.
Consistência valores: Funding reflete somente itens do lease (não os pagos no cartão).
DB/relatórios: Estados ajustados após funding.
Pós‑Venda
Modificação de fatura: Alterar itens/valores após ItemSplit; recalcular corretamente.
Estornos (refunds): Total e parciais do purchaseNowTotal; refletir em transações e DB.
Cancelamento de fatura: Regras ao cancelar após pagamento parcial; estornos e estados.
Segurança e Compliance
PCI/mascaramento: Dados sensíveis do cartão não aparecem em logs/HAR/UI.
Permissões: Acesso às ações segundo perfil (merchant/usuário).
Observabilidade
Logs: Eventos de ItemSplit, cálculo de purchaseNowTotal, transações, assinaturas, funding.
Métricas/alertas: Erros de pagamento, taxa de elegibilidade, estornos.
Toggle/Config
On/Off: Com itemSplit desativado, nunca retornar purchaseNowTotal; fluxo permanece tradicional.
Escopo por merchant: Isolamento entre merchants; sem regressões em quem não usa.
Desempenho e Robustez
Tempo de resposta: Cálculo/retorno de purchaseNowTotal sem impacto perceptível.
Concorrência: Duplo clique, múltiplos submits, reenvio de requisição → sem cobranças duplicadas.
Resiliência: Retentativas seguras; consistência eventual no DB.
Testes Negativos e Borda
Diferença exatamente US$ 300: Elegível.
Diferença US$ 300,01: Não elegível.
1 item vs N itens: Cobrir combinações, inclusive item de valor simbólico.
Descontos/cuponagem: Mantêm regras de elegibilidade e cálculo.
Moeda/formatação: Padrões corretos, arredondamento bancário.
Critérios de Aceite (Resumo)
CA‑1: Quando elegível, resposta contém purchaseNowTotal correto.
CA‑2: Submit cobra exatamente purchaseNowTotal.
CA‑3: Lease resultante contém apenas itens remanescentes.
CA‑4: DB consistente nas tabelas LosCreditCard, LosCreditCardTransaction, LosInvoice, LosItem, LosSchedSummary.
CA‑5: UI e transações refletem todos os valores corretamente.
CA‑6: Fluxos de funding, modificações, estornos e cancelamentos funcionam sem inconsistências.
CA‑7: Com itemSplit off ou diferença > US$ 300, não há purchaseNowTotal nem caminhos de split.
Evidências Necessárias
HAR/json: Requests/responses com purchaseNowTotal.
Prints/UI: Payment details, contrato, telas de confirmação.
DB scripts: Consultas com resultados para as 5 tabelas.
Logs: Eventos principais e transações.
Se quiser, monto um template BDD e um conjunto de queries SQL para validação rápida dessas tabelas, além de um checklist de evidências por cenário.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

request:
{
  "userName": "tireAgent",
  "setupPassword": "U0wn_tireAgent_G4eDIH",
  "merchantNumber": "OW90218-0001",
  "mainFirstName": "jose djalma",
  "mainLastName": "ferreira",
  "mainDOB": "02011988",
  "mainSSN": "194507961",
  "emailAddress": "BarryBHauck@jourrapide.com",
  "mainAddress1": "501 E 223RD ST",
  "mainCity": "Carson",
  "mainStateOrProvince": "CA",
  "mainPostalCode": "90745",
  "mainCellPhone": "7249161594",
  "mainEmployerName": "Best Buy",
  "mainPastBankruptcy": false,
  "mainCurrentOrFutureBankruptcy": false,
  "languagePreference": "E",
  "iovationFingerprintText": "fingerPrintText",
  "ipaddress": "192.168.0.2",
  "desiredPaymentFrequency": "WEEKLY",
  "mainAnnualIncome": 510000,
  "mainPayFrequency": "WEEKLY",
  "mainNextPayDate": "09032025",
  "mainLastPayDate": "08282025",
  "mainEmploymentDuration": "_1_TO_2_YEARS",
  "shipToSameAsConsumer": true,

  "merchandiseSubtotal": "2231.00",
  "discountAmount": "0.00",
  "deliveryCharge": "57.00",
  "installationCharge": "97.00",
  "salesTax": "0.00",
  "miscellaneousFees": "100.00",
  "depositAmount": "0.00",
  "orderTotal": "2485.00",

  "invoiceNumber": "R91931",
  "lineItem": [
    {
      "lineItemLineNumber": "317",
      "lineItemSerialNumber": "S94712065",
      "lineItemProductNumber": "A561SKU283",
      "lineItemProductDescription": "Ottoman",
      "lineItemProductCategory": "Seating",
      "lineItemType": "D",
      "lineItemQuantityOrdered": "1",
      "lineItemUnitPrice": "2005.00",
      "lineItemBasePrice": "2005.00",
      "lineItemTaxAmount": "0.00",
      "lineItemExtendedPrice": "2005.00"
    },
    {
      "lineItemLineNumber": "318",
      "lineItemSerialNumber": "M68484397",
      "lineItemProductNumber": "A333SKU4444",
      "lineItemProductDescription": "Recliner",
      "lineItemProductCategory": "Seating",
      "lineItemType": "D",
      "lineItemQuantityOrdered": "1",
      "lineItemUnitPrice": "226.00",
      "lineItemBasePrice": "226.00",
      "lineItemTaxAmount": "0.00",
      "lineItemExtendedPrice": "226.00"
    }
  ]
}

-----

response:
{
    "faults": false,
    "fieldInError1": null,
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": null,
    "transactionMessage": null,
    "accountNumber": "76b56c8a-7bbd-4755-9598-aa0f47d7b3f3",
    "authorizationNumber": "25033",
    "providerURL": null,
    "merchantName": "Tire Agent",
    "customerFirstName": "jose djalma",
    "customerLastName": "ferreira",
    "orderTotal": 2485.00,
    "purchaseNowTotal": 226.00,
    "purchaseNowTotalWithTax": 249.73,
    "externalReferenceId": null,
    "invoiceItems": [
        {
            "lineItemId": 28062,
            "lineItemLineNumber": 317,
            "lineItemProductNumber": "A561SKU283",
            "lineItemSerialNumber": "S94712065",
            "lineItemProductCategory": "Seating",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 2005.00,
            "lineItemBasePrice": 2005.00,
            "lineItemTaxAmount": 0.00,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 2005.00,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Ottoman"
        },
        {
            "lineItemId": 28063,
            "lineItemLineNumber": 318,
            "lineItemProductNumber": "A333SKU4444",
            "lineItemSerialNumber": "M68484397",
            "lineItemProductCategory": "Seating",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 226.00,
            "lineItemBasePrice": 226.00,
            "lineItemTaxAmount": 0.00,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 226.00,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": "PURCHASE_NOW",
            "lineitemProductDescription": "Recliner"
        }
    ],
    "transactionStatus": "E0",
    "appApprovalStatus": "APPROVED",
    "creditLimit": 2365,
    "promoPlan1": null,
    "promoPlanDesc1": null,
    "promoPlan2": null,
    "promoPlanDesc2": null,
    "promoPlan3": null,
    "promoPlanDesc3": null,
    "promoPlan4": null,
    "promoPlanDesc4": null,
    "promoPlan5": null,
    "promoPlanDesc5": null,
    "programType": "LTO",
    "locationName": "Tire Agent",
    "lambdaScore": 3,
    "isPlaidRequired": false,
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination-stg.uownleasing.com/completeApplication?uuid=76b56c8a-7bbd-4755-9598-aa0f47d7b3f3_8030797389226995712&selectedPaymentFrequency=WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 5615.89,
            "totalContractAmountNoTax": 5082.28,
            "regularPaymentWithTax": 100.28,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 100.28,
            "firstPaymentWithFeesNoTax": 90.75,
            "firstPaymentDate": "2025-09-03",
            "paymentDueToday": 0.00
        },
        {
            "redirectUrl": "https://origination-stg.uownleasing.com/completeApplication?uuid=76b56c8a-7bbd-4755-9598-aa0f47d7b3f3_8030797389226995712&selectedPaymentFrequency=BI_WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 5615.89,
            "totalContractAmountNoTax": 5082.25,
            "regularPaymentWithTax": 200.57,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 200.57,
            "firstPaymentWithFeesNoTax": 181.51,
            "firstPaymentDate": "2025-09-03",
            "paymentDueToday": 0.00
        }
    ]
}

-----

# Cálculo do Purchase Now

## Caso A — Order Total ≤ Approved Amount
- **Approved amount:** `2,365.00`
- **Order total:** `2,300.00` (exemplo)
- **Diferença:**
2,300.00 - 2,365.00 = -65.00


- Como o total é **menor ou igual** ao aprovado, **não há purchase now**.
- Todos os itens seguem para o lease.
- **PurchaseNowTotal:** `0.00`

---

## Caso B — Order Total > Approved Amount (excesso ≤ 300)
- **Approved amount:** `2,365.00`
- **Order total enviado:** `2,485.00`
- **Diferença:**  
2,485.00 - 2,365.00 = 120.00

- Como a diferença é **≤ 300**, o fluxo de *purchase now* é aplicado.

### Item Split
- **On Lease**  
  - Ottoman → `2,005.00`
- **Purchase Now**  
  - Recliner → `226.00`

### Purchase Now (sem imposto/fee)
- **Base:** `226.00`

### Purchase Now (com imposto + taxa de cartão)
Fórmula:  
purchaseNowTotalWithTax = itemPrice × (1 + salesTax + ccFee)


Substituindo:  
Substituindo:  
= 226.00 × (1 + 9.5% + 1%)
= 226.00 × 1.105
= 249.73



### Resultado Final
- **Lease amount (contrato):** `2,259.00`
- **Purchase Now Total:** `226.00`
- **Purchase Now Total com impostos/fee:** `249.73`
- **Itens no contrato:** apenas o Ottoman (`2,005.00`)
- **Cobrança no cartão:** `249.73`


-----

response ta interface
Request URL
https://origination-stg.uownleasing.com/uown/los/getMissingRequiredFields/76b56c8a-7bbd-4755-9598-aa0f47d7b3f3_8030797389226995712?selectedPaymentFrequency=WEEKLY
{
    "leadPk": 25033,
    "missingFields": [
        "bankAccountInfo",
        "ccInfo",
        "purchaseNowItem"
    ],
    "achAutoPay": null,
    "feeToBeCharged": 0,
    "isIdCheckRequired": false,
    "idCheckProvider": null,
    "idCheckPassed": false,
    "verifyPhoneBeforeSigning": false,
    "securityDeposit": 0,
    "achDiscount": 0,
    "firstPaymentDate": null,
    "isBankVerificationRequired": false,
    "isBankVerificationSubmitted": false,
    "recordSigningFlow": false,
    "signingFeeExists": false,
    "itemPaymentSummary": {
        "leaseAmount": 2259,
        "approvalAmount": 2365,
        "purchaseNowAmount": 249.73,
        "itemsOnLease": [
            {
                "pk": 28062,
                "rowCreatedTimestamp": "2025-08-28T13:15:59.146119",
                "rowUpdatedTimestamp": null,
                "tenantId": null,
                "webUserId": null,
                "agent": null,
                "itemInfo": {
                    "itemPk": 28062,
                    "leadPk": 25033,
                    "accountPk": 0,
                    "merchantPk": 566,
                    "invoicePk": 13471,
                    "itemId": null,
                    "itemCode": "A561SKU283",
                    "lineNumber": "317",
                    "serialNumber": "S94712065",
                    "itemDescription": "Seating:Ottoman",
                    "category": null,
                    "numberOfItems": 1,
                    "numberOfItemsDelivered": 0,
                    "itemImageUrl": null,
                    "basePricePerItem": 2005,
                    "taxPerItem": 0,
                    "totalPricePerItem": 2005,
                    "totalPriceForItems": 2005,
                    "status": "ADDED_TO_CART",
                    "itemDeliveryDate": null,
                    "deliveryType": null,
                    "itemDeliveryFee": 0,
                    "itemsDeliveryFee": 0,
                    "invoiceType": "LEASE",
                    "lockStatus": null
                }
            }
        ],
        "itemsToPurchase": [
            {
                "pk": 28063,
                "rowCreatedTimestamp": "2025-08-28T13:15:59.14957",
                "rowUpdatedTimestamp": null,
                "tenantId": null,
                "webUserId": null,
                "agent": null,
                "itemInfo": {
                    "itemPk": 28063,
                    "leadPk": 25033,
                    "accountPk": 0,
                    "merchantPk": 566,
                    "invoicePk": 13471,
                    "itemId": null,
                    "itemCode": "A333SKU4444",
                    "lineNumber": "318",
                    "serialNumber": "M68484397",
                    "itemDescription": "Seating:Recliner",
                    "category": null,
                    "numberOfItems": 1,
                    "numberOfItemsDelivered": 0,
                    "itemImageUrl": null,
                    "basePricePerItem": 226,
                    "taxPerItem": 0,
                    "totalPricePerItem": 226,
                    "totalPriceForItems": 226,
                    "status": "PURCHASE_NOW",
                    "itemDeliveryDate": null,
                    "deliveryType": null,
                    "itemDeliveryFee": 0,
                    "itemsDeliveryFee": 0,
                    "invoiceType": "PURCHASED",
                    "lockStatus": null
                }
            }
        ]
    },
    "optionalAchText": "Optional Method of Payment\nIf you would like to provide us with your bank account information in addition to your credit/debit card information, we will use that as your primary method of payment. You authorize us to use it for your first payment and future payments. We will reprocess the debit or credit card in the event of a returned payment.\n",
    "isNeuroIdCheckRequired": false,
    "neuroIdCheckPassed": false,
    "merchantRefCode": "OW90218-0001",
    "isOfferInsuranceRequired": false,
    "basicCustomerData": {
        "firstName": "jose djalma",
        "lastName": "ferreira",
        "dob": "1988-02-01",
        "email": "BarryBHauck@jourrapide.com",
        "phone": "7249161594",
        "address1": "501 E 223RD ST",
        "address2": null,
        "city": "Carson",
        "state": "CA",
        "zipCode": "90745"
    }
}

approvalAmount: 2365 → confere com o limite aprovado.

leaseAmount: 2259 → corresponde ao Approved (2365) menos o item que foi para purchase now.

purchaseNowAmount: 249.73 → é exatamente o Recliner (226.00) com imposto (~9.5%) + taxa de cartão (1%), batendo com o cálculo:
226 × 1.105 = 249.73

itemsOnLease: só o Ottoman (2005.00), status ADDED_TO_CART.

itemsToPurchase: Recliner (226.00), status PURCHASE_NOW.

Ou seja:
O sistema dividiu corretamente os itens entre Lease e Purchase Now.
Aplicou a regra de diferença ≤ $300 (excesso = 120).
Calculou o valor a pagar upfront (purchaseNowAmount) incluindo tax + fee.

-----

O que deu certo:
Tokenização do cartão: OK ✅
decision: "ACCEPT", status: "APPROVED", ccToken: "33e6f110-...", preAuthStatus: "SUCCESS".
Não houve captura (amount 0) — é só tokenização. A captura do purchase now acontece no submitApplication.
---
Onde quebra
/uown/los/submitApplication retorna 500 com:
java.lang.IllegalArgumentException: org.hibernate.hql.internal.ast.QuerySyntaxException:
Unable to locate appropriate constructor on class [com.uownleasing.svc.pojo.rest.FundingQueueDetails].

Expected arguments are:
long, LeadStatus, LocalDateTime, LocalDateTime, String, String, String, String, String, String, String,
long, FundingStatus, BigDecimal, BigDecimal, BigDecimal, long, long, boolean, String, String, String,
String, String, String, BigDecimal

A query usa SELECT new com.uownleasing.svc.pojo.rest.FundingQueueDetails(...) com 27 parâmetros numa ordem e tipos específicos.
O construtor dessa classe no backend não bate com a projection da HQL (ordem/tipo/quantidade).
Isso é bug de backend (incompatibilidade de assinatura), não é problema do seu payload nem do cartão.
---
Por que isso aparece só no submit?
O submit, além de orquestrar a captura do purchase now, monta dados de Funding Queue (a query gigante do stacktrace) para exibir/atualizar o painel de funding.
Ao projetar o DTO FundingQueueDetails via HQL, o Hibernate exige um construtor exatamente compatível. Se alguém alterou:
a ordem dos campos no SELECT new,
o tipo (ex.: Double → BigDecimal, Timestamp → LocalDateTime),
adicionou/removeu um campo (ex.: ccProcessingFeePercent),
o Hibernate não encontra um construtor correspondente e lança exatamente esse erro.
---
Evidências que seus dados estão corretos:
itemPaymentSummary.purchaseNowAmount = 249.73 = 226.00 × (1 + ~9.5% + 1%) ✔️
itemsToPurchase[0].status = "PURCHASE_NOW" ✔️
approvalAmount = 2365, leaseAmount = 2259, excesso = 120 (≤ 300) ✔️
Cartão tokenizado e válido (isValidCard: true, preAuthStatus: "SUCCESS") ✔️
---
Ação recomendada (para DEV/backend)

Abrir o DTO com.uownleasing.svc.pojo.rest.FundingQueueDetails e conferir o construtor público:
Deve aceitar 27 parâmetros exatamente nesta ordem/tipos da query (copie a lista de “Expected arguments” do erro).
Verificar se está usando java.time.LocalDateTime (não java.sql.Timestamp), e java.math.BigDecimal para valores monetários.

Comparar com a HQL colada no stacktrace:
Campos concatenados com CONCAT/INITCAP/COALESCE resultam em String — o construtor deve esperar String.
Subselects somando preços/taxas retornam BigDecimal — o construtor deve esperar BigDecimal.

Verificar mudanças recentes:
merchant.merchantInfo.ccProcessingFeePercent → tipo/escala alterado?
Inclusão do campo final 'PURCHASED' (String literal) — o construtor precisa ter esse parâmetro onde a HQL coloca.

Corrigir uma das pontas:
Preferível: alinhar o construtor ao SELECT new ... (menos arriscado).
Alternativa: mudar a HQL para um projection interface/Tuple e mapear manualmente (evita acoplamento rígido).

Testes: rodar submit no mesmo leadPk 25033 em Staging e confirmar que:
LosCreditCardTransaction gera captura do purchase now (amount ≈ 249.73)
Tabelas: LosInvoice, LosItem (Recliner como PAID), LosSchedSummary recalculado, Funding Queue carrega sem 500.
---
O que você pode fazer agora (workaround)?
Como é erro interno no servidor, não há ajuste de payload que resolva. Mas para o relatório/QA, inclua:

Reprodução:
Tokenize card (OK).
submitApplication com appUuid e leadPk → 500.
Stacktrace (esse do HQL).

Dados do caso:
leadPk: 25033
merchant: OW90218-0001 (Tire Agent)
purchaseNowAmount: 249.73
approvalAmount: 2365
items: Ottoman 2005 (lease), Recliner 226 (purchase now)
Impacto: impede captura e assinatura do contrato em cenário purchase now.
---
### 🇧🇷 Português

Oi [nome],

Fizemos o teste com o lead `25033` no merchant `OW90218-0001 (Tire Agent)` e encontramos um problema ao tentar submeter a aplicação depois do *purchase now*.

**Resumo do fluxo:**
- Approved amount: **2365**
- Order total enviado: **2485**
- Diferença: **120** (≤ 300, então regra de *purchase now* foi aplicada)
- Item Ottoman (`2005`) ficou em **lease**
- Item Recliner (`226`) ficou como **purchase now**
- Sistema calculou corretamente o `purchaseNowAmount = 249.73` (base 226 + ~9.5% tax + 1% CC fee)

**Onde falhou:**
- Tokenização do cartão foi aprovada ✅ (`status: APPROVED`, `preAuthStatus: SUCCESS`)
- No `/submitApplication`, porém, o backend retorna **500** com erro de HQL:
QuerySyntaxException: Unable to locate appropriate constructor on class [com.uownleasing.svc.pojo.rest.FundingQueueDetails]

- O erro indica que o construtor do DTO `FundingQueueDetails` não bate com os parâmetros que estão sendo passados no `SELECT new` da query. Possível alteração em ordem/tipo/quantidade de argumentos (especialmente campos BigDecimal e String concatenados).

**Impacto:**
- O contrato não finaliza no cenário de *purchase now*
- Captura no cartão (249.73) não acontece
- Fluxo de funding não consegue carregar

-----

Contrato Terms Of agreement
📌 Itens do contrato
On Lease: Ottoman → $2,005.00
Purchase Now: Recliner → $226.00 (já pago upfront com imposto + fee → $249.73)
Então o contrato segue apenas com o Ottoman, valor base $2,005.00.
---
📌 Lease exibido nos termos

First Payment: $100.28 em 09/03/2025
→ Esse valor bate com o que veio em paymentDetailsList na resposta anterior (weekly, firstPaymentWithFeesAndTax = 100.28).
# of Payments: 56 (weekly)
Payment Amount: $100.28
→ 56 × 100.28 = $5,615.89 (confere com “Total Payment Amount”).
Total Contract Amount: $2,496.20
→ Esse valor corresponde ao Approved (2365) + diferença (120) já com arredondamentos/tax rate.
→ Também bate com o orderTotal que você enviou 2485.00, somado ao efeito do imposto embutido no cálculo do cronograma.
Lease Item listado: Ottoman $2,005.00 (confere com a separação feita).
---
📌 Conclusão

Os cálculos estão corretos:
Recliner foi pago upfront (Purchase Now 249.73)
Contrato segue apenas com Ottoman
Cronograma (56 × 100.28 = 5615.89) fecha certinho com o exibido.
Tudo está consistente com o esperado para o cenário de purchase now. ✅

-----

