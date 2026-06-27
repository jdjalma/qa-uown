---
title: Nova Aplicação — Formulário do Cliente (Customer Form Flow)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-26
sources:
  - env: sandbox
covers: [new-application, customer-form, apply-portal, sendApplication, blocked-state, form-validation, shortCode]
promoted_to: []
---

# Nova Aplicação — Formulário do Cliente (Customer Form Flow)

> Charter: Discovery do fluxo completo do formulário do cliente após receber link de convite — mapeamento de domínio, estrutura de steps, comportamento de validação, estado bloqueado e resposta de aprovação. Executado em sandbox via MCP Playwright em 2026-06-26.

---

## Domínio e URL do Formulário

O domínio do formulário do cliente depende da **marca do merchant**:

| Marca | Domínio (sandbox) | Código do merchant |
|---|---|---|
| UOWN | `apply-sandbox.uownleasing.com/{shortCode}/start` | `OL*` (ex: `OL90402-0001`) |
| Kornerstone | `apply-sandbox.kornerstoneliving.com/{shortCode}/start` | `KS*` (ex: `KS16559`, `KS16775`) |

**Fonte do shortCode:** corpo da resposta HTTP de `POST /uown/sendApplicationToCustomer` (texto puro, URL completa). Não usar `lead_uuid` diretamente — o padrão URL com UUID não existe.

```ts
// Extração correta do shortCode
const redirectUrl = await sendApplicationToCustomerResponse.text();
const shortCode = new URL(redirectUrl).pathname.split('/').filter(Boolean)[0];
// Ex: "TI4W8wQR" de "https://apply-sandbox.kornerstoneliving.com/TI4W8wQR/start"
```

Mesma lógica já implementada em `src/helpers/api-setup.helpers.ts`.

---

## Estrutura do Formulário (3 Etapas)

| Etapa | Título | Campos principais |
|---|---|---|
| Step 1 | Your Info | First Name, Last Name, Mobile Phone, Email, Street Address, Zip Code, City, State (auto), SSN, DOB |
| Step 2 | Employment & Financial | Pay Schedule (dropdown), Last Pay Date (`#mainLastPayDate`), Next Pay Date (`#mainNextPayDate`), Gross Monthly Income, Bank Routing Number, Bank Account Number, First 6 Digits CC (`#mainCreditCardBin`) |
| Step 3 | Legal & Disclaimer | Bankruptcy status (dropdown), SMS consent (`#isAgreedToStatements`), Privacy Policy (`#isAgreedToPrivacyPolicy`) |

Barra de progresso exibe botões numerados "1", "2", "3" com labels "Your Info", "Employment", "Disclaimer".

---

## Comportamentos Confirmados

### State auto-fill
`input[placeholder="State"]` é preenchido automaticamente e **desabilitado** via `GET /uown/getStateForZipcode/{zip}` após o usuário digitar um ZIP válido. O campo não pode ser editado manualmente. Sem ZIP → State fica vazio e Next permanece desabilitado.

### SSN — campo mascarado
`input[placeholder="Social Security Number"]` usa input mascarado. O `fill()` do Playwright não funciona — o valor é rejeitado silenciosamente. **Obrigatório usar `pressSequentially()`**.

### Datas de pagamento
Step 2 tem dois campos com placeholder `MM/DD/YYYY`. Distinguir pelos IDs: `#mainLastPayDate` e `#mainNextPayDate`. Localizador por placeholder gera strict mode violation.

### Botão Next / Submit
- Next fica `disabled` enquanto há campo obrigatório vazio na etapa atual.
- Submit (Step 3) fica `disabled` até ambas as checkboxes estarem marcadas.
- Erros inline aparecem por campo após tentativa de avanço com campo vazio.

---

## Comportamento de Estado Bloqueado (NJ, VT, MN, ME)

**CORREÇÃO:** A recusa para estados bloqueados NÃO ocorre de forma imediata no Step 1.

1. O cliente preenche as 3 etapas completas sem qualquer bloqueio visual.
2. Após `POST /uown/los/sendApplication`, a UI exibe: **"Sorry, unfortunately your application is not accepted"** com link para `https://www.kornerstoneliving.com/`.
3. A razão da recusa está apenas na resposta de rede (`transactionMessage: "We do not offer leasing in NJ"`), **não exibida ao cliente**.

**API response para estado bloqueado:**
```json
{
  "appApprovalStatus": "DECLINED",
  "transactionStatus": "E4",
  "transactionMessage": "We do not offer leasing in NJ",
  "providerURL": null,
  "paymentDetailsList": []
}
```

O `authorizationNumber` na resposta corresponde ao `leadPk` no Origination. O lead fica com status "Denied".

---

## Erro de Sandbox — sendApplication

Em sandbox, `POST /uown/los/sendApplication` retorna HTTP 500 para merchants sem campanha UW configurada:

```
NullPointerException: Cannot invoke "java.lang.Integer.intValue()"
because the return value of "com.uownleasing.svc.pojo.UWResponse.getCampaignId()" is null
```

**Merchants afetados em sandbox (2026-06-26):**
- `KS16559` (Tire Agent) — 500 para CA (estado válido)
- `GOW0007` (GowMerchantKS) — DECLINED "No credit remaining"

Para testar aprovação (CT-09): usar QA1 ou QA2 com merchant que tenha campanha UW ativa.

---

## Fluxo de Aprovação (Pendente — não testável em sandbox)

Da estrutura de código (`src/helpers/api-setup.helpers.ts` e `src/api/clients/application.client.ts`):

```json
{
  "appApprovalStatus": "APPROVED",
  "providerURL": "<URL de assinatura de contrato>",
  "paymentDetailsList": [
    { "redirectUrl": "<URL do contrato>" }
  ]
}
```

`canContinueApplication` response inclui `leadFound: true`, `canContinueApplication: true`, e `uuid` do lead.

---

## Business Rules

- BR-01: Domínio do formulário é determinado pela marca do merchant (UOWN vs Kornerstone). `[confirmed-sandbox]`
- BR-02: shortCode = 8 chars alfanuméricos, retornado como URL completa no corpo de `POST /uown/sendApplicationToCustomer`. `[confirmed-sandbox]`
- BR-03: State é preenchido e desabilitado automaticamente após ZIP válido. Não há campo editável de estado. `[confirmed-sandbox]`
- BR-04: Recusa por estado bloqueado ocorre APÓS submissão completa (3 etapas), não no Step 1. `[confirmed-sandbox]`
- BR-05: UI de rejeição exibe mensagem genérica; a razão específica (`transactionMessage`) não é exposta ao cliente. `[confirmed-sandbox]`
- BR-06: SSN requer `pressSequentially` — campo mascarado rejeita `fill()`. `[confirmed-sandbox]`
- BR-07: Os dois campos de data em Step 2 têm o mesmo placeholder; usar `#mainLastPayDate` / `#mainNextPayDate`. `[confirmed-sandbox]`

---

## Referências

- `ccbin-employment-financial-step.md` — detalhes do campo CCBIN e card visualization (task #1322)
- `src/helpers/api-setup.helpers.ts` — helper `sendApplicationToCustomer` + extração do shortCode
- `src/api/clients/application.client.ts` — `canContinueApplication`, `getMissingFields`
- `docs/scenarios/new-application.md` — BDD oracle com checkpoints para CT-01 a CT-08
