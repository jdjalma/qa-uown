---
last-reviewed: 2026-06-29
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - origination/pages/customers/[leadPk].tsx
  - origination/domain/stores/customer.tsx
---

# Oracle: Editar Primary Applicant (Portal Origination)

> Operação: clicar no lápis de edição no card Primary Applicant de `/customers/{leadPk}` no portal Origination, alterar um ou mais campos, e salvar.

## Pré-condições

- O lead precisa estar em **status pré-assinatura** (ex: UW_APPROVED, NEW, APPROVED). Leads em estados pós-assinatura (FUNDING, FUNDED, SIGNED) **não** exibem o lápis de edição — os campos são renderizados somente leitura.
- O agente precisa ter a permissão `create_or_update_primary_customer_info` (controla a visibilidade do lápis).
- As sub-permissões `dob` e `ssn` controlam esses campos específicos (mesmo comportamento do equivalente em Servicing).

## Checkpoints

### Oracle

| CT | Descrição | Esperado |
|---|---|---|
| CT-01 | Ícone de lápis visível no header do card Primary Applicant (lead pré-assinatura) | `<span id="PrimaryApplicant-edit">` com SVG `data-icon="pen"` presente e visível |
| CT-02 | Clicar no lápis entra em modo de edição | As 7 divs `readOnly` `inputField__readOnly` são substituídas por elementos `<input>`; contagem de `readOnlyFields` = 0; botões CANCEL e SAVE aparecem |
| CT-03 | Campo Middle Name aparece somente em modo de edição | Input `#applicantMiddleName` visível em modo de edição; não renderizado na view de leitura |
| CT-04 | Campos pré-preenchidos com os valores atuais | `#applicantFirstName`, `#applicantLastName`, `#applicantDOB`, `#applicantSSN` têm os valores existentes ao abrir o formulário |
| CT-05 | CANCEL restaura o modo de leitura sem chamada de rede | Ao clicar em CANCEL: inputs desaparecem, divs readOnly retornam, nenhum POST para `createOrUpdatePrimaryCustomerInfo` é disparado |
| CT-06 | SAVE dispara `POST /uown/los/createOrUpdatePrimaryCustomerInfo` | Rede: POST para `/uown/los/createOrUpdatePrimaryCustomerInfo` retorna 200; payload contém `primaryCustomerInformation.leadPk` |
| CT-07 | Painel atualiza após SAVE com os valores novos | `GET /uown/los/getPrimaryCustomerInfo/{leadPk}` dispara após o POST 200; painel volta ao modo de leitura exibindo os novos valores |
| CT-08 | Toast de sucesso aparece | Toast variante "success" exibido após salvar `[gap — mensagem exata não confirmada; observar na execução]` |
| CT-09 | Nenhuma entrada de activity log é criada (Origination difere de Servicing) | **Nenhuma** entrada DATA_CHANGE é gravada em `uown_los_activity_log` após uma edição do Primary Applicant no portal Origination. O único log criado durante o fluxo é o REVIEW automático ("Lead has been reviewed") na abertura da página. Essa é uma diferença comportamental confirmada em relação ao portal Servicing, que grava DATA_CHANGE em toda edição de painel. `[confirmed stg 2026-06-29 lead 7218266]` |
| CT-10 | Nenhum lápis em lead pós-assinatura | Para leads em status FUNDING/FUNDED/SIGNED, o header do card Primary Applicant **não** tem SVG `pen` — apenas `chevron-down` |

### Comando de verificação de obsolescência

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- origination/pages/customers/\[leadPk\].tsx origination/domain/stores/customer.tsx
```

> Rodar a partir da raiz do repo da app origination. Sem output = BDD atual. Com output = prefixar `[BDD MAY BE STALE]`.
