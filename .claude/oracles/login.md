---
last-reviewed: 2026-06-26
last-reviewed-sha: dc1773c
covers:
  - src/pages/login.page.ts
  - src/pages/website/website-base.page.ts
  - src/helpers/auth.helpers.ts
---

# Login

> Contrato de autenticação para todos os portais. Portais de agente (Origination/Servicing/AMS): username + password. Portal Website (cliente): OTP por e-mail ou SMS.

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Credenciais válidas → dashboard exibido, formulário de login removido | CT-01 |
| AC-02 | Senha incorreta → mensagem de erro, formulário permanece visível | CT-02 |
| AC-03 | 5 falhas consecutivas → conta bloqueada, credenciais válidas também rejeitadas | CT-03 |
| AC-04 | E-mail registrado → modal OTP exibido, formulário inicial removido | CT-04 |
| AC-05 | Telefone registrado → modal OTP exibido via SMS | CT-05 |
| AC-06 | OTP correto → cliente autenticado, modal fechado | CT-04b/CT-05b |
| AC-07 | OTP inválido → erro dentro do modal, modal permanece aberto | CT-07 |
| AC-08 | Reenvio de OTP → inputs limpos, novo código enviado | CT-06 |

## Cenários — Portais de Agente (Origination / Servicing / AMS)

```gherkin
Feature: Login — Portais de Agente (username + password)

  Background:
    Given a página de login do portal está aberta na URL do ambiente

  Scenario: [negative] CT-02 — Login rejeitado com senha incorreta
    When o agente submete senha incorreta para um e-mail válido
    Then uma mensagem de erro é exibida na página de login
    And a página de login permanece visível

  Scenario: [negative] CT-03 — Conta bloqueada após tentativas consecutivas
    When o agente submete credenciais incorretas 5 vezes seguidas
    Then a conta é bloqueada e uma mensagem de bloqueio é exibida
    And tentativas subsequentes com credenciais válidas também são rejeitadas

  Scenario: [positive] CT-01 — Login bem-sucedido com credenciais válidas
    When o agente submete credenciais válidas para o seu perfil
    Then o dashboard é exibido
    And o formulário de login não é mais visível
```

## Cenários — Portal Website (Cliente, OTP)

```gherkin
Feature: Login — Portal Website (OTP por e-mail ou SMS)

  Scenario: [negative] CT-07 — OTP inválido rejeitado
    Given o modal de OTP está exibido
    When o cliente submete um código de 6 dígitos incorreto
    Then uma mensagem de erro é exibida dentro do modal de OTP
    And o modal de OTP permanece aberto

  Scenario: [positive] CT-04 — Modal OTP exibido após e-mail
    Given a página de login do portal Website está aberta
    When o cliente submete um endereço de e-mail registrado
    Then um código de verificação de 6 dígitos é enviado para o e-mail
    And o modal de entrada de OTP é exibido

  Scenario: [positive] CT-05 — Modal OTP exibido após telefone
    Given a página de login do portal Website está aberta
    When o cliente submete um número de telefone registrado
    Then um código de verificação de 6 dígitos é enviado por SMS
    And o modal de entrada de OTP é exibido

  Scenario: [positive] CT-04b/CT-05b — Cliente autenticado após OTP correto
    Given o modal de OTP está exibido
    When o cliente submete o código de 6 dígitos correto
    Then o dashboard do cliente é exibido e o modal de OTP não é mais visível

  Scenario: [positive] CT-06 — Novo OTP solicitado e aceito
    Given o modal de OTP está exibido com um código pendente
    When o cliente solicita um novo código de verificação
    Then os inputs de OTP são limpos e um novo código é enviado ao e-mail ou telefone
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> Portais de agente: `git log dc1773c..HEAD -- src/pages/login.page.ts src/helpers/auth.helpers.ts`
> Portal Website: `git log dc1773c..HEAD -- src/pages/website/website-base.page.ts src/helpers/auth.helpers.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Login bem-sucedido (portais de agente)
| Checkpoint | Como verificar |
|---|---|
| URL mudou para o dashboard | URL contém `/overview` e NÃO contém `/login` |
| Formulário de login removido | `input[type='password']` não está visível na página |
| Menu de navegação presente | Itens "Overview", "Leads", "Funding" estão visíveis |
| Username exibido | Barra de navegação superior exibe o username autenticado |

### Oracle: CT-02 — Login rejeitado
| Checkpoint | Como verificar |
|---|---|
| Ainda na página de login | URL ainda contém `/login` ou não mudou |
| Mensagem de erro visível | Texto sobre credenciais inválidas ou senha errada está visível |
| Formulário de login ainda presente | Input de e-mail + input de senha + botão LOG IN ainda visíveis |

### Oracle: CT-03 — Conta bloqueada
| Checkpoint | Como verificar |
|---|---|
| Mensagem de bloqueio visível | Texto contém "locked", "too many attempts" ou equivalente |
| Credenciais válidas também rejeitadas | Login com credenciais corretas retorna erro (sem redirecionamento para o dashboard) |

### Oracle: CT-04/CT-05 — Modal OTP exibido após e-mail ou telefone
| Checkpoint | Como verificar |
|---|---|
| Modal de OTP aberto | 6 campos de entrada de dígito único visíveis |
| Formulário inicial removido | O input inicial de e-mail/telefone não está mais visível |

### Oracle: CT-04b/CT-05b — Cliente autenticado após OTP correto
| Checkpoint | Como verificar |
|---|---|
| URL não contém `/login` | Dashboard do cliente exibido |
| Modal de OTP fechado | Os 6 campos de dígito não estão mais visíveis |

### Oracle: CT-06 — Reenvio de OTP
| Checkpoint | Como verificar |
|---|---|
| Inputs de OTP limpos | Todos os 6 campos estão vazios após clicar em "Resend" |
| Modal permanece aberto | 6 campos de input ainda visíveis para o cliente inserir o novo código |

### Oracle: CT-07 — OTP inválido
| Checkpoint | Como verificar |
|---|---|
| Mensagem de erro visível | Texto de erro exibido dentro do modal de OTP |
| Modal permanece aberto | 6 campos de input ainda visíveis |
| Não autenticado | URL ainda contém `/login` ou o dashboard do cliente NÃO está exibido |
