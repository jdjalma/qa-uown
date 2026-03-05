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

