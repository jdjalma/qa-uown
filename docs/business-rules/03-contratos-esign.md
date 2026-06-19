---
title: Contratos e Assinatura Eletrônica
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/state-merchant-matrix.ts#STATE_MATRIX
  - code: src/data/state-merchant-matrix.ts#SigningProvider
  - code: src/helpers/esign-db.helpers.ts#EsignDocument
  - env: qa2
covers: [esign, signwell, gowsign, pandadoc, contracts, signing-fee, state-routing]
---

# Contratos e Assinatura Eletronica
## UOwn Leasing - SVC Platform

Geracao de contratos, assinatura eletronica (SignWell/PandaDoc), taxa de assinatura e redirect pos-assinatura.

---

## 8. Contratos e Assinatura Eletronica (E-sign)

### Fluxo de Contrato

1. **Contrato gerado** com numero `UOWN_<random>_<leadPk>`
2. **Template selecionado** por estado (INSTORE = estado merchant, ONLINE = estado cliente)
3. **Enviado para e-sign** via SignWell (default) ou PandaDoc
4. **Cliente assina** eletronicamente
5. **CC Peek consent** e extraido do documento assinado
6. **Lead atualizado** para SIGNED
7. **Contratos anteriores** com status SENT sao cancelados

### Mapeamento Status E-sign -> Status Contrato

| E-sign | Contrato |
|--------|----------|
| SENT_TO_CUSTOMER, IN_PROGRESS, VIEWED | `SENT` |
| COMPLETED, SIGNED | `SIGNED` |
| CANCELLED | `CANCELLED` |
| ERROR | `ERROR` |
| EXPIRED | `EXPIRED` |

### Auto-Move para Funding

Se merchant tem `isSignedToFunding = true`, apos assinatura o lead move automaticamente para `FUNDING`.

---

## 55. Taxa de Assinatura (Signing Fee)

### O Que e

Servico que gerencia o calculo e cobranca de taxas no momento da assinatura do contrato -- inclui processing fee, security deposit e taxa do plano de protecao.

### Para Que Serve

Garante que o cliente pague a taxa obrigatoria antes de finalizar o contrato. Funciona como barreira de comprometimento e cobertura inicial de risco.

### Calculo do Valor

O valor cobrado e o **MAXIMO** entre:

| Componente | Fonte |
|------------|-------|
| Amount Charged at Signing | Programa do merchant |
| Processing Fee | Estado ou programa |
| Security Deposit | Estado |
| Protection Plan Fee | Plano de protecao |
| Zero | Valor minimo (floor) |

Se nao houver schedule summary, delega para `CalculatorService`.

### Pre-requisitos para Cobranca

| Condicao | Obrigatorio |
|----------|-------------|
| Taxa > $0 | Sim |
| Taxa nao ja cobrada (idempotencia) | Sim |
| CC ativo no arquivo via auto-pay | Sim |
| Transacao AUTHENTICATION aprovada existente | Sim |

### Fluxo de Cobranca

1. **Verificacao de idempotencia:** Busca transacoes existentes do tipo `CAPTURE` ou `SALE` com valor da taxa, tipo `FEE` e status `APPROVED`
2. **Se ja cobrada:** Retorna `true` sem processar novamente
3. **Se CC nao existe:** Status do lead muda para `SIGNING_FEE_DENIED`, retorna `false`
4. **Captura da transacao:** Cria transacao `CAPTURE` vinculada a autorizacao, valor arredondado com `HALF_EVEN`
5. **Se captura falhar:** Lead recebe status `SIGNING_FEE_DENIED`, nota adicionada com erro
6. **Se captura aprovada:** Envia recibo de pagamento ao cliente

### Recibo de Pagamento

- **Template:** `InitialPaymentReceipt`
- **Numero do recibo:** `UOWNCC{PaymentPk}`
- **Envio:** Configuravel (sincrono ou assincrono com delay configuravel, default 1000ms)

### Configuracoes

| Config | Default | Descricao |
|--------|---------|-----------|
| `check.if.cc.is.charged` | true | Verifica se taxa ja foi cobrada |
| `checkTimedOutCaptures` | false | Reutiliza capturas com timeout |
| `send.payment.receipt` | true | Envia recibo ao cliente |
| `send.payment.receipt.in.async` | true | Envio assincrono |

---

## 63. Redirect de E-sign e Pos-Assinatura

### O Que e

Gerencia o fluxo de redirecionamento apos assinatura eletronica, mapeando eventos do provedor de e-sign para acoes no sistema.

### Para Que Serve

Apos o cliente assinar (ou cancelar) o contrato, o sistema precisa: redirecionar o cliente de volta ao merchant, atualizar o status do lead, e iniciar fluxos pos-assinatura.

### Mapeamento de Eventos

| Provedor | Evento Assinado | Evento Cancelado |
|----------|----------------|-----------------|
| **SignWell** | `completed` (config: `sw.esign.event.signed`) | `declined, closed, error` (config: `sw.esign.event.canceled`) |
| **PandaDoc** | `completed` (config: `pd.esign.event.signed`) | `exception` (config: `pd.esign.event.canceled`) |

### Construcao da URL de Redirect

**Prioridade de URL base:**
1. Variavel de ambiente `SVC_URL` (ex: `svc-dev1` -> `origination-dev1.uownleasing.com`)
2. Config `redirect.base.url` (fallback)
3. `merchantRedirectUrl` do merchant (se configurado)

**Formato da URL para merchant:**
```
{merchantRedirectUrl}?event={completed|canceled}&ata={uuid}
```

**Post-Message:** Se merchant tem `postMessage = true`, adiciona `&postMessage=true` para fluxos em iframe.

### Fluxo Pos-Assinatura

1. **Verificacao de assinatura:** Chama `isLeaseOrLeaseModSigned()`
2. **Atualizacao de status:** Se assinado, atualiza status do lead
3. **Execucao sincrona/assincrona:** Merchants especificos executam sincrono (por ref code ou client type), demais usam `CompletableFuture`
4. **Plano de protecao:** Iniciado assincronamente apos atualizacao de status

### Fluxo de Plano de Protecao (TireAgent / BW13)

Merchants com plano BW13 (ex: TireAgent) habilitam o fluxo de protecao no formulario de contrato. O comportamento difere do fluxo padrao:

**Fluxo padrao (sem seguro):**
1. Cliente aceita checkboxes de T&C
2. Botao "PROCEED TO SIGNATURE" → vai direto para e-sign

**Fluxo com seguro (BW13 — TireAgent):**
1. Cliente aceita checkboxes de T&C
2. Botao "See Protection Benefits" substitui "PROCEED TO SIGNATURE"
3. Clique abre modal `PurchaseInsurance` com widget Buddy (`buddy.insure` iframe)
4. Cliente escolhe opt-in ou opt-out no widget
5. Botao "PROCEED TO SIGNATURE" aparece no modal de protecao → vai para e-sign

**Comportamento do widget Buddy:**
- O iframe `buddy.insure` carrega de forma assincrona — os radio buttons de opt-in/opt-out nao estao disponiveis imediatamente apos a pagina renderizar
- Tempo de carregamento tipico: 5–12s
- Automacao deve aguardar com loop de retentativas (5× com 3s de intervalo = 15s no total) antes de tentar clicar o radio button
- Nao remover o loop de retentativas — sem ele o click falha silenciosamente e o teste trava no botao "PROCEED TO SIGNATURE" desabilitado

**Deteccao automatica em `completeTermsAndConditions()`:**
- Apos marcar todos os checkboxes, verifica se "See Protection Benefits" esta visivel
- Se sim: clica no botao e chama `completeProtectionPlan(false)` (opt-out automatico)
- Se nao: prossegue para "PROCEED TO SIGNATURE" (fluxo padrao)

---

### Tela de Conclusao Pos-Assinatura (Confetes)

Apos assinatura eletronica bem-sucedida, o cliente e redirecionado para a rota `/{shortCode}/complete` que exibe a tela de conclusao.

**Design atual (R1.50.0 — componente Confetes):**

| Elemento | Descricao |
|----------|-----------|
| Fundo | Animacao de confetti com fundo teal (`#31c3e7`) |
| Card | Card branco centralizado com icone de check |
| Titulo | "Thank You!" (heading) |
| Mensagem principal | "Your contract has been successfully signed." |
| Agradecimento | "Thank you for using our services." + "We hope you enjoy your product(s)!" |
| Contato | "If you have any questions, please contact us:" + telefone `(877) 353-8696` |
| Rodape | "A copy has been sent to your email" |

**Mudancas em relacao ao design anterior:**
- Removido: link "View Document" (nao mais exibido)
- Adicionado: animacao de confetti, icone de check, informacoes de contato
- Animacao: clip-path reveal com duracao de 0.75s

---

### Tela de Selecao de Programa de Pagamento (MissingPaymentProgram)

Quando o cliente acessa a rota `/{shortCode}/complete` **sem o parametro `planId`** na query string, o sistema exibe a tela de selecao de programa de pagamento (componente `MissingPaymentProgram`) em vez de ir direto para o formulario de CC/banco.

**Quando aparece:**
- URL sem `planId`: `/{shortCode}/complete` → tela de selecao
- URL com `planId`: `/{shortCode}/complete?planId=WK13` → pula direto para CC/banco (backend auto-resolve o programa)

**Design redesenhado (R1.50.0 — Task #1233, MR !1408):**

| Elemento | Descricao |
|----------|-----------|
| Container | `paymentProgramModal__paymentProgramContainer` (CSS Module) |
| Logo | Imagem UOWN (`#payment-program-image`) |
| Titulo | "Choose the payment program that works best for you" |
| Subtitulo | "Select the option that fits your budget" |
| Cards de pagamento | Um card por frequencia disponivel (Weekly, Bi-Weekly, Twice a Month, Monthly) |
| Cada card | Titulo da frequencia + descricao + preco + linhas de detalhe (Term, First Payment, Last Payment, etc.) + botao "Choose Payment Program" |
| Tabs de termo | Tabs "X Months Terms" (ex: "13 Months Terms", "16 Months Terms") — visivel apenas quando o merchant tem ambos os termos disponiveis |
| Rodape | "Questions? We're here to help" + telefone "(877) 353-8696" |

**Labels descritivos por frequencia:**

| Frequencia | Titulo do Card | Descricao |
|------------|---------------|-----------|
| Weekly | Weekly Payment Program | Pay more often, smaller amounts |
| Bi-Weekly | Bi-Weekly Payment Program | Most popular |
| Twice a Month | Twice a Month Payment Program | Lower frequency, larger payments |
| Monthly | Monthly Payment Program | Lower frequency, larger payments |

**Comportamento dos tabs de termo:**
- Se o merchant tem apenas um termo (ex: 13 meses), os tabs nao sao renderizados
- Se o merchant tem multiplos termos (ex: 13 e 16 meses), os tabs aparecem e o usuario pode alternar
- A troca de tab atualiza os cards exibidos (cada termo pode ter diferentes precos/detalhes)
- O tab ativo recebe a classe `termSelection__tabSelected`

**Fluxo apos selecao:**
1. Cliente clica "Choose Payment Program" em um card
2. Tela de selecao desaparece
3. Formulario de CC/banco aparece (mesmo fluxo de `completeApplication` com `planId`)
4. Segue para T&C → e-sign → tela de conclusao (Confetes)

**Bug conhecido (BUG-01):** SSN `888888888` causa NullPointerException no backend (HTTP 500). Usar SSN auto-gerado com `generateTestSSN(true)`.

---

