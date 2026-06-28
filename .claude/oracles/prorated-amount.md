---
last-reviewed: 2026-06-26
last-reviewed-sha: dc1773c
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
| AC-09 | Data inválida ou incompleta não dispara cálculo | ⚠️ Pendente |

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
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log dc1773c..HEAD -- src/pages/servicing/servicing-base.page.ts src/api/clients/svc-payoff.client.ts`
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
| Valor correto para a data | Comparar texto do campo com `GET /uown/svc/getProrateAmount/{accountPk}?onDate={data-ISO}` (tolerância ±$0.01) |
| Campo "AS OF:" retém a data inserida | `input#proratedDate` value = data digitada pelo agente |
| Cálculo disparado sem botão | Log de rede: `GET /uown/svc/getProrateAmount/...` aparece após seleção da data no picker |
| Sem entrada em activity log | `SELECT COUNT(*) FROM uown_sv_activity_log WHERE account_id = {accountPk}` — mesmo count antes e depois |

### Oracle: CT-03 — Mudança de data recalcula corretamente
| Checkpoint | Como verificar |
|---|---|
| Resultado mudou (sem cache) | Texto do campo após mudança de data ≠ texto capturado para a primeira data |
| Novo valor correto | Comparar com `GET /uown/svc/getProrateAmount/{accountPk}?onDate={nova-data-ISO}` (tolerância ±$0.01) |
| Data posterior → valor maior | Valor numérico da data posterior > valor numérico da data anterior (acúmulo diário, BR-ACC-4) |

### Oracle: CT-04 — Fechar modal não altera o account
| Checkpoint | Como verificar |
|---|---|
| Modal removido | `.modal.show .prorated-amount_proratedContainer__lm_Ez` ausente do DOM |
| Dados do account iguais | Status, Next Payment e Program Type na barra de resumo = valores capturados antes de abrir o modal |
| Sem entrada em activity log | `SELECT COUNT(*) FROM uown_sv_activity_log WHERE account_id = {accountPk}` — mesmo count antes e depois de fechar |

## Itens Pendentes

- **AC-09 — Data inválida:** o que acontece ao digitar data parcial (`12/31`) ou inválida (`13/45/2026`) e sair do campo? A API dispara? O resultado permanece `"-"`? Há erro inline? Executar `/discovery` no modal com entradas inválidas antes de escrever o cenário.
- **Permissão `customer_information`:** visibilidade do ícone `#calculator` para agentes sem essa permissão é inferida — não confirmada via teste de perfil. Credenciais de perfil restrito só autenticam em QA1/QA2/STG.
- **Dados de teste:** account 17298 no sandbox retornou `"-"` para todos os cálculos. Confirmar qual estado (ACTIVE + EPO receivable presente) produz valor real antes de executar CT-02 e CT-03.
