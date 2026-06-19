---
title: Portal, Comunicacoes e Atendimento
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-18
sources:
  - db: uown_email_queue
  - db: uown_sms_queue
  - env: qa2
covers: [tms, portal-cliente, correspondencia, email, sms, consentimento, contato]
---

# Portal, Comunicacoes e Atendimento
## UOwn Leasing - SVC Platform

TMS (agentes telefonicos), portal do cliente, correspondencia (email/SMS), gestao de consentimento, preferencias de contato e convite para portal.

---

## 26. TMS (Sistema para Agentes Telefonicos)

### O Que e

TMS (Telephony Management System) e a API dedicada para agentes de call center e bots de cobranca (como Skit.ai). Fornece endpoints otimizados para operacoes durante chamadas telefônicas.

### Para Que Serve

Da aos agentes tudo que precisam durante uma ligacao: ver resumo da conta, processar pagamentos, calcular quitacao, mover datas de vencimento, e registrar notas -- tudo sem sair da interface do telefone.

### O Que um Agente Pode Fazer via TMS

| Endpoint | Funcao | Descricao |
|----------|--------|-----------|
| `getAccountSummary` | Ver resumo | Nome, status, proximo vencimento, saldo, dias em atraso, EPO, merchant |
| `getPayoffAmount` | Calcular quitacao | Valor para quitar a conta (EPO) |
| `makeCreditCardPayment` | Cobrar CC | Processar pagamento de cartao |
| `makeCreditCardPayments` | Arranjo CC | Multiplas transacoes (payment arrangement) |
| `makeAchPayment` | Cobrar ACH | Iniciar debito bancario |
| `moveDueDatesByDays` | Mover vencimentos | Adiar parcelas por N dias |
| `getBankAccounts` | Ver bancos | Contas bancarias em arquivo |
| `getCreditCards` | Ver cartoes | Cartoes tokenizados em arquivo |
| `addLogNote` | Registrar nota | Nota da ligacao (Skit.ai usa tipo `SKIT_CALL_LOG`) |

### Como o Cliente e Impactado

O cliente nunca ve o TMS diretamente. Ele interage com o agente ou bot por telefone, e o TMS e o backend que torna tudo possivel em tempo real.

---

## 27. Portal do Cliente

### O Que e

Interface web de autoatendimento onde clientes gerenciam suas contas de lease.

### Para Que Serve

Reduz volume do call center permitindo autoatendimento 24/7.

### Autenticacao

| Metodo | Descricao |
|--------|-----------|
| Dados pessoais | Nome, sobrenome, ultimos 4 do SSN, data de nascimento |
| Verificacao por codigo | Envia codigo de 6 digitos por SMS ou email. Expira em 5 minutos |

### O Que o Cliente Pode Fazer

| Funcao | Descricao |
|--------|-----------|
| **Ver pagamentos** | Historico completo de pagamentos da conta |
| **Fazer pagamentos** | Criar ou modificar pagamentos |
| **Suporte** | Enviar ticket de suporte (integrado com Zendesk) |
| **Plano de protecao** | Ver elegibilidade e inscrever-se (se elegivel) |
| **Correspondencia** | Rastreamento de emails/SMS enviados |

### Branding por Empresa

| Empresa | Portal |
|---------|--------|
| UOwn | URL padrao UOwn |
| Kornerstone | `portal.kornerstoneliving.com` (prod) / `website-{env}.kornerstoneliving.com` |

### Ticket de Suporte (Contact Routing via Zendesk)

O portal do cliente permite envio de tickets de suporte com roteamento automatico por categoria. Implementado em `SupportTicketService`.

**Categorias disponiveis (configuraveis via `ConfigurationManagement`):**

| Categoria | Label exibido | Email destino |
|-----------|--------------|---------------|
| `billing` | Billing / Payment Inquiry | `accountmanagement@uownleasing.com` |
| `payment_arrangement` | Payment Arrangement Request | `accountmanagement@uownleasing.com` |
| `merchant` | Merchandise / Merchant Concern | `merchantsupport@uownleasing.com` |
| `other` | Other | `accountmanagement@uownleasing.com` |

**Formato do assunto do email:**
```
[EMPRESA] - Support Ticket - [Account Number] - [Customer Name]
```

**Campos obrigatorios do formulario:** Nome, email, telefone, categoria, descricao.

**Fluxo de processamento:**
1. Cliente seleciona categoria e preenche formulario no portal
2. Sistema determina empresa (UOwn ou Kornerstone) pela conta
3. Template HTML renderizado com Thymeleaf
4. Email enviado para o endereco mapeado pela categoria
5. Zendesk recebe o email e roteia para fila/departamento correto
6. Activity log criado na conta com tipo `CORRESPONDENCE`

**Configuracao:** As categorias sao configuraveis via chave `com.uownleasing.svc.service.SupportTicketService.email.categories` no formato pipe-delimited: `valor|label|email,valor|label|email`.

---

## 29. Correspondencia (Email/SMS)

### Templates por Empresa

| Empresa | Prefixo | From Email (prod) |
|---------|---------|-------------------|
| UOwn | (nenhum) | `CustomerService@uownleasing.com` |
| Kornerstone | `KORNERSTONE_` | `CS@kornerstoneliving.com` |

### Tipos de Correspondencia Observados

| Tipo | Quando |
|------|--------|
| Welcome Email | Apos importacao para SVC |
| Approval Email/SMS | Apos aprovacao de UW |
| Decline Email | Apos negacao de UW |
| First Payment Reminder | Antes do primeiro pagamento |
| Past Due Reminder | Conta em atraso |
| Delinquency Offer (30/60/90/150 dias) | Faixas de inadimplencia |
| Paid in Full | Conta quitada |
| Settled in Full | Conta liquidada por acordo |
| Bank Verification Declined | Verificacao bancaria negada |
| Finalize Purchase | Apos verificacao, link para finalizar |
| Portal Invitation | Convite para portal do cliente |

### Envio

| Modo | Descricao |
|------|-----------|
| Imediato | Enviado na hora |
| Enfileirado | Adicionado a fila de envio |
| Async | Delay configuravel antes do envio (default 3s) |
| SMS | Via Twilio, se telefone valido |

---

## 61. Gestao de Consentimento (Consent Management)

### O Que e

Gerencia preferencias de consentimento do cliente, especificamente o consentimento para CC Peek (captura parcial de cartao).

### Para Que Serve

O consentimento de CC Peek controla se a UOwn pode capturar um valor parcial do cartao quando o saldo nao e suficiente para o valor total. O cliente pode permitir ou negar essa pratica.

### Como Funciona

- **Comparacao null-safe** usando `Objects.equals()` para verificar mudanca
- **Activity log** criado apenas se o valor realmente mudar (idempotente)
- **Mensagem de log:** `"CC Peek Consent changed from [anterior] to [novo]"`
- **Tipo de log:** `DATA_CHANGE`
- **Username** do operador registrado via `ThreadAttributes`

### Como Alterar

Via interface administrativa ou `ServicingInformationService`. Toda mudanca e registrada em activity log.

---

## 72. Preferencias de Contato (Do Not Call / Do Not Email / Do Not Text)

### O Que e

Sistema de gerenciamento de preferencias de contato do cliente que controla quais canais de comunicacao podem ser utilizados (telefone, email, SMS). Respeita regulamentacoes de opt-out e exige justificativa para alteracoes.

### Para Que Serve

Garante conformidade regulatoria (TCPA, CAN-SPAM) e respeita a vontade do cliente de nao ser contatado por canais especificos. Integra com Five9 (call center) para atualizacao automatica via IVR.

### Campos de Preferencia

| Campo | Disponivel em | Editavel em | Descricao |
|-------|--------------|-------------|-----------|
| **Do Not Email** | Servicing + Origination | Servicing | Bloqueia envio de emails |
| **Do Not Call** | Servicing + Origination | Servicing | Bloqueia ligacoes telefonicas |
| **Do Not Text** | Servicing + Origination | Servicing | Bloqueia envio de SMS |
| **Do Not Contact** | **Servicing apenas** | Servicing | Master switch - bloqueia TODOS os canais |

### Regras de Comportamento

**Modo de edicao:**
- Campos sao **desabilitados visualmente** fora do modo de edicao
- Agente precisa clicar no botao de edicao da secao para habilitar alteracoes
- Clicar em Cancelar **reverte todas as mudancas** sem salvar nada (visual ou banco)

**Motivo obrigatorio:**
- Campo de razao/motivo e **obrigatorio** antes de salvar qualquer alteracao
- Se motivo vazio ao salvar → erro: "Reason is required"
- Cada alteracao gera registro no activity log com o motivo

**Do Not Contact (regra master):**
- Quando marcado → automaticamente marca Do Not Email, Do Not Call e Do Not Text
- Todos os checkboxes individuais ficam **desabilitados** enquanto Do Not Contact estiver ativo
- Nao e possivel desmarcar canais individualmente enquanto Do Not Contact estiver ativo
- Persistente entre navegacoes de pagina

**Origination vs Servicing:**
- Origination: Do Not Contact **nao e visivel** (apenas Do Not Call, Email, Text)
- Origination: campos sao exibidos mas com edicao limitada
- Servicing: todos os 4 campos disponiveis e editaveis

### Integracao com Five9 (IVR)

O Five9 pode atualizar a preferencia `doNotText` automaticamente via API (`Five9Service.updateContactPreferences`):

1. Recebe `phoneNumber` e `doNotText` (ambos obrigatorios)
2. Valida formato de telefone US (10 digitos, remove prefixo "1" de 11 digitos)
3. Busca todos os registros de telefone com esse numero
4. Atualiza `doNotText` em todos os registros encontrados
5. Cria activity log em cada conta associada

### Impacto no Sistema

As preferencias de contato afetam diretamente:
- **Sweeps de email/SMS:** Contas com `doNotEmail`/`doNotText` sao excluidas
- **Convite para portal:** Respeita `doNotEmail` e `doNotText` (Secao 66)
- **Correspondencia automatica:** Welcome, lembretes, ofertas de delinquency
- **Five9/Skit.ai:** Listas de discagem excluem `doNotCall`

---

## 66. Convite para Portal do Cliente

### O Que e

Servico que envia convites por email e SMS para que clientes acessem o portal de autoatendimento.

### Para Que Serve

Aumenta a adocao do portal, reduzindo o volume de ligacoes ao call center.

### Logica de Envio

| Canal | Config de Habilitacao | Template | Condicao de Envio |
|-------|----------------------|----------|-------------------|
| **Email** | `send.customer.portal.link.email` (default: true) | `CustomerPortalReminderEmail` | Email existe E `doNotEmail = false` |
| **SMS** | `send.customer.portal.link.sms` (default: true) | `CustomerPortalReminderSms` | Telefone existe E `doNotText = false` |

### Respeito ao Opt-Out

O sistema respeita duas camadas de opt-out:
1. **Configuracao global:** Admin pode desabilitar envio por canal
2. **Preferencia do cliente:** `doNotEmail` e `doNotText` no registro do cliente

### Mensagens de Resposta

| Cenario | Mensagem |
|---------|----------|
| Ambos enviados | "Customer portal reminder email and SMS sent successfully." |
| Apenas email | "Email sent successfully. SMS not sent due to [opt-out/disabled]." |
| Apenas SMS | "SMS sent successfully. Email not sent due to [opt-out/disabled]." |
| Nenhum enviado | "Email not sent due to [reason], SMS not sent due to [reason]." |

---

