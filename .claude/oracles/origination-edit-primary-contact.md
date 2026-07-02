---
last-reviewed: 2026-06-30
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - origination/pages/customers/[leadPk].tsx
  - origination/domain/stores/customer.tsx
---

# Oracle: Editar Primary Contact (Portal Origination)

> Operação: clicar no lápis de edição no card Primary Contact (`#PrimaryContact-edit`) de `/customers/{leadPk}` no portal Origination — cobre Address (Line 1/2, City, State, ZIP), Primary Email, Mobile Phone, flags de do-not-contact, e preferências de comunicação — alterar um ou mais campos, e salvar. Card/operação distinta de [[origination-edit-primary-applicant]] (nome/DOB/SSN/licença), que fica na mesma página mas tem seu próprio lápis e endpoint.

## Pré-condições

- O gating de lápis pré-assinatura/pós-assinatura análogo ao Primary Applicant é plausível mas NÃO verificado para este card nesta sessão — tratar como `[HYPOTHESIS]` até ser observado em um lead FUNDING/FUNDED/SIGNED.
- O agente precisa ter permissão para editar dados de contato (chave de permissão exata não confirmada; presume-se análoga a `create_or_update_primary_customer_info`).

## Checkpoints

### Oracle

| CT | Descrição | Esperado |
|---|---|---|
| CT-01 | Ícone de lápis visível no header do card Primary Contact | SVG `<span id="PrimaryContact-edit">` presente; o header do card também tem um controle separado de chevron-collapse — clicar no ícone errado colapsa o card em vez de entrar em modo de edição |
| CT-02 | Clicar no lápis entra em modo de edição | Address Line 1/2, City, ZIP, Primary Email, Mobile Phone viram textboxes `<input>`; State vira um combobox; Preferred communication channel / Preferred language viram comboboxes; botões CANCEL e SAVE aparecem |
| CT-03 | Campos pré-preenchidos com os valores atuais | Todos os campos mostram os valores existentes ao abrir o formulário `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-04 | CANCEL restaura o modo de leitura sem chamada de rede | Ao clicar em CANCEL: inputs desaparecem, divs somente-leitura retornam, nenhum POST para `createOrUpdatePrimaryCustomerContactInfo` é disparado `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-05 | SAVE dispara `POST /uown/los/createOrUpdatePrimaryCustomerContactInfo` | Rede: POST retorna 200; payload contém `leadAddresses[].addressInfo`, `leadEmails[].emailInfo`, `leadPhones[].phoneInfo`, `leadPk` `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-06 | Painel atualiza após SAVE com os valores novos | `GET /uown/los/getPrimaryCustomerContactInfo/{leadPk}` dispara após o POST 200; painel volta ao modo de leitura exibindo os novos valores `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-07 | O DB persiste a mudança | A linha `uown_los_address` do cliente do lead mostra o novo `street_address1`/`city`/`state`/`zip_code` e um `row_updated_timestamp` atualizado `[confirmed stg 2026-06-30 lead 7218266, address pk 6863041: streetAddress1 "3579 Cherry Ave" → "482 Magnolia Court"]` |
| CT-08 | Entrada de activity log É criada (difere do Primary Applicant) | Uma entrada `DATA_CHANGE` É gravada em `uown_los_activity_log` após uma edição do Primary Contact — DIFERENÇA comportamental confirmada em relação ao card Primary Applicant na mesma página ([[origination-edit-primary-applicant]] CT-09), que não grava nenhuma. `[confirmed stg 2026-06-30 lead 7218266: "UPDATED : Address[ zipCode9 changed from null to 93721 ]"]` |
| CT-08b | `[OBSERVATION]` O conteúdo da mensagem de log não nomeia o campo realmente editado | O texto da nota DATA_CHANGE referencia `zipCode9` (null → 93721) mesmo que o campo alterado pelo usuário e persistido tenha sido `streetAddress1`; a nota nunca menciona `streetAddress1`. Observação única, não isolada/reproduzida contra uma edição de apenas um campo — não classificada como bug. Reconferir se o Primary Contact for testado novamente, idealmente alterando um campo por vez. |
| CT-09 | Painel de atividade "Notes" da UI não atualiza automaticamente após salvar | O grid de Notes na página ainda mostrava as mesmas 10 linhas do topo imediatamente após SAVE; a nova linha DATA_CHANGE era visível via query no DB mas não no grid renderizado sem um reload manual `[confirmed stg 2026-06-30 lead 7218266]` |
| CT-10 | Toast de sucesso aparece | `[gap — não confirmado nesta sessão; timing do toast não capturado]` |

### Comando de verificação de obsolescência

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- origination/pages/customers/\[leadPk\].tsx origination/domain/stores/customer.tsx
```

> Rodar a partir da raiz do repo da app origination. Sem output = BDD atual. Com output = prefixar `[BDD MAY BE STALE]`.
