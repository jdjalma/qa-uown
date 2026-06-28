---
last-reviewed: 2026-06-28
last-reviewed-sha: 6b0f02a
covers:
  - src/pages/servicing/servicing-base.page.ts
  - src/api/clients/svc-payoff.client.ts
---

# Calculadora de Valor Proporcional (Prorated Amount)

> Agente de servicing consulta o valor exato de quitação do lease para uma data específica. Sem botão de calcular — a API dispara automaticamente no `onChange` da data. Operação somente leitura (sem mutação no account).

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Modal abre via ícone `#calculator` na barra de resumo do account | CT-01 |
| AC-02 | Campo "AS OF:" pré-preenchido com a data de hoje em `MM/DD/YYYY` | CT-01 |
| AC-03 | Campo de resultado mostra `"-"` antes de qualquer interação com a data | CT-01 |
| AC-04 | Selecionar data válida dispara cálculo automaticamente e exibe valor em moeda | CT-02 |
| AC-05 | Valor exibido corresponde exatamente ao retorno da API para aquela data | CT-02 |
| AC-06 | Mudar a data recalcula com valor diferente (sem cache da data anterior) | CT-03 |
| AC-07 | CLOSE fecha o modal; dados do account permanecem iguais | CT-04 |
| AC-08 | Operação não cria entrada em `uown_sv_activity_log` | CT-02 + CT-04 |
| AC-09 | Data inválida ou incompleta não dispara cálculo | CT-05 |

## Cenários

```gherkin
Feature: Calculadora de Valor Proporcional
  As a servicing agent
  In order to informar ao cliente o valor exato de quitação para uma data
  The agent must be able to calculate the prorated lease payoff on demand

  Background:
    Given o agente de servicing está autenticado no portal de Servicing
    And o agente está visualizando um lease account ativo

  Scenario: [positive] CT-01 — Modal abre com título, data pré-preenchida e traço inicial
    When o agente abre a calculadora de Prorated Amount na barra de resumo do account
    Then o modal intitulado "Prorated Amount" é exibido
    And o campo "AS OF:" mostra a data de hoje em formato MM/DD/YYYY
    And o campo de resultado mostra "-", indicando que nenhum cálculo foi executado

  Scenario: [positive] CT-02 — Cálculo correto exibido ao selecionar data
    Given o modal de Prorated Amount está aberto para um lease ativo
    When o agente seleciona uma data válida no seletor de data "AS OF:"
    Then o campo de resultado mostra o valor de quitação proporcional para aquela data em moeda
    And o valor mostrado ao agente corresponde ao valor que o sistema retorna para aquela data

  Scenario: [positive] CT-03 — Mudança de data recalcula com valor correto para a nova data
    Given o modal está aberto e o valor proporcional de uma primeira data está exibido
    When o agente seleciona uma data posterior no seletor "AS OF:"
    Then o campo de resultado mostra um valor maior do que o exibido para a data anterior
    And o novo valor corresponde ao retorno do sistema para a nova data

  Scenario: [positive] CT-04 — Fechar o modal não altera o account
    Given o modal de Prorated Amount está aberto para um lease account
    When o agente fecha o modal
    Then o modal não é mais exibido
    And a barra de resumo do account mostra os mesmos status e dados de antes do modal ser aberto
    And nenhuma entrada de activity log foi adicionada para este account

  Scenario: [negative] CT-05 — Data incompleta não dispara cálculo e exibe erro inline
    Given o modal de Prorated Amount está aberto para um lease ativo
    And um cálculo válido já foi exibido para uma data anterior
    When o agente digita uma data incompleta (ex: "12/31") no campo "AS OF:" e sai do campo
    Then o campo "AS OF:" reverte para a data de hoje
    And uma mensagem de erro "Invalid date" é exibida inline abaixo do campo
    And nenhuma chamada à API getProrateAmount é realizada
    And o valor no campo de resultado permanece igual ao último cálculo válido

  Scenario: [negative] CT-05b — Data com mês/dia inválidos é bloqueada na digitação
    Given o modal de Prorated Amount está aberto para um lease ativo
    When o agente tenta digitar uma data com mês inválido (ex: "13/45/2026") no campo "AS OF:"
    Then o campo rejeita os caracteres que tornariam a data inválida
    And o campo exibe o valor anterior válido sem alterar
    And nenhuma chamada à API getProrateAmount é realizada
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log 6b0f02a..HEAD -- src/pages/servicing/servicing-base.page.ts src/api/clients/svc-payoff.client.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Modal abre com título, data pré-preenchida e traço inicial
| Checkpoint | Como verificar |
|---|---|
| Modal aberto e identificado | Container `.modal.show .prorated-amount_proratedContainer__lm_Ez` visível; cabeçalho lê "Prorated Amount" |
| "AS OF:" pré-preenchido | `input#proratedDate` value = data de hoje em `MM/DD/YYYY` (ex: `06/26/2026`) |
| Campo de resultado inicial | Campo read-only dentro de `.modal.show` lê exatamente `"-"` |

### Oracle: CT-02 — Cálculo correto ao selecionar data
| Checkpoint | Como verificar |
|---|---|
| Resultado não é traço | Campo de resultado mostra string com `$` — nunca `"-"` ou vazio |
| Valor correto para a data | Comparar texto do campo com `GET /uown/svc/getProrateAmount/{accountPk}?onDate={data-ISO}` (tolerância ±$0.01). **Nota:** API retorna texto decimal simples (ex: `"131.18"`), sem envelope JSON e sem `$` |
| Campo "AS OF:" retém a data inserida | `input#proratedDate` value = data digitada pelo agente |
| Cálculo disparado sem botão | Log de rede: `GET /uown/svc/getProrateAmount/...` aparece após seleção da data no picker |
| Sem entrada em activity log | `SELECT COUNT(*) FROM uown_sv_activity_log WHERE account_id = {accountPk}` — mesmo count antes e depois |

### Oracle: CT-03 — Mudança de data recalcula corretamente
| Checkpoint | Como verificar |
|---|---|
| Resultado mudou (sem cache) | Texto do campo após mudança de data ≠ texto capturado para a primeira data |
| Novo valor correto | Comparar com `GET /uown/svc/getProrateAmount/{accountPk}?onDate={nova-data-ISO}` (tolerância ±$0.01) |
| Data posterior → valor maior | Valor numérico da data posterior > valor numérico da data anterior (acúmulo diário, BR-ACC-4) |

### Oracle: CT-05 — Data inválida/parcial não dispara cálculo

> Mecanismo descoberto via discovery 2026-06-28 (sandbox, account 17298). Detalhe completo em `docs/knowledge-base/prorated-amount-calculator.md`.

**Pré-condição:** modal aberto, algum cálculo já exibido (ex: $131.18 para 07/27/2026).

| Checkpoint | Como verificar |
|---|---|
| Data parcial → reset | Digitar "12/31" e sair do campo: `input#proratedDate` value = data de hoje (campo reverteu) |
| Erro inline aparece | `div.index-module_inputField__textError__5fU9J` presente no DOM com texto "Invalid date" |
| API não disparou | Log de rede: ausência de novo `GET /uown/svc/getProrateAmount/...` após a entrada inválida |
| Resultado anterior retido | Campo `div.index-module_inputField__readOnly__BsDDX` mantém o último valor calculado (não vira `"-"`) |
| Erro limpa após seleção válida | Após clicar uma data válida no calendar picker, `div.index-module_inputField__textError__5fU9J` desaparece do DOM |

> **Nota CT-05b (bloqueio no keypress):** ao tentar digitar mês > 12 (ex: "13/..."), o handler `onKeyPress` filtra caracteres inválidos durante a digitação; o campo permanece no valor anterior. Nenhum erro inline é exibido neste caso — a rejeição é silenciosa a nível de tecla.

### Oracle: CT-04 — Fechar modal não altera o account
| Checkpoint | Como verificar |
|---|---|
| Modal removido | `.modal.show .prorated-amount_proratedContainer__lm_Ez` ausente do DOM |
| Dados do account iguais | Status, Next Payment e Program Type na barra de resumo = valores capturados antes de abrir o modal |
| Sem entrada em activity log | `SELECT COUNT(*) FROM uown_sv_activity_log WHERE account_id = {accountPk}` — mesmo count antes e depois de fechar |

## Dados de Teste Confirmados (sandbox)

| Account PK | Status | State | Ativado em | EPO Balance | Resultado exemplo |
|---|---|---|---|---|---|
| **17298** | ACTIVE | NY | 2026-06-24 | $805.64 | $131.18 para 07/27/2026 |

> **Regra:** account ACTIVE + data **posterior** à data de ativação → valor real. Data anterior à ativação → resultado `"-"` (API retorna 200 mas sem valor). O account 17298 anteriormente retornava `"-"` porque estava em estado CLOSED durante uma discovery anterior (revertido para ACTIVE em 2026-06-25).

## Notas de Implementação

- **Como o onChange é disparado:** a API `getProrateAmount` só é chamada ao **clicar uma data no calendar picker** — não ao digitar no campo de texto. O `onKeyPress` valida cada caractere antes de inserir. Testes automatizados devem usar `page.click()` em um `gridcell` do calendar, não `fill()` no input.
- Selector do resultado: `div.index-module_inputField__readOnly__BsDDX.index-module_boldFont__R-JxG`
- Selector do erro inline: `div.index-module_inputField__textError__5fU9J`

## Descobertas Complementares (discovery 2026-06-28)

- **Resposta da API (BR-07 — confirmado via network capture):** o endpoint retorna **texto decimal simples** sem envelope JSON — ex.: `"131.18"` para datas válidas e `"0.00"` para datas pré-ativação. O componente exibe `"-"` quando o valor recebido é `"0.00"`. Evidência: requests #49 (2026-07-27 → `131.18`) e #53 (2026-06-01 → `0.00`) capturados via `browser_network_request` em sandbox, account 17298.

- **Permissão `customer_information` (BR-08 — confirmado via source code):** o `div#calculator` é renderizado **incondicionalmente** dentro do componente `AccountSummary` — sem nenhum `{hasXxxPermission && (...)}`. Compare: `makePayment` é gated por `hasPaymentPermission` (linha 332) e `invitation` por `hasViewSendInvitePermission` (linha 346); a calculadora não tem gate equivalente. Todos os agentes com acesso à página Customer Information (`customer_information`) veem o ícone. Evidência: `/home/jose/projects/uown/servicing/components/account-summary/index.tsx` linhas 321–331 (render incondicional) vs 332–358 (renders condicionais).
