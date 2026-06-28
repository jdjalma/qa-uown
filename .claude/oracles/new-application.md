---
last-reviewed: 2026-06-28
last-reviewed-sha: 6b0f02a
covers:
  - src/pages/origination/new-application-filters.page.ts
  - src/selectors/common.selectors.ts
  - src/api/clients/application.client.ts
  - src/api/bodies/application.body.ts
---

# Nova Aplicação

> Fluxo em duas partes: (1) agente cria convite no Portal de Originação → lead "Pending"; (2) cliente preenche formulário via link → UW pipeline → "Approved"/"Denied".
>
> **Domínio do formulário do cliente:** depende da marca do merchant — `apply-{env}.uownleasing.com/{shortCode}/start` (UOWN, códigos `OL*`) ou `apply-{env}.kornerstoneliving.com/{shortCode}/start` (Kornerstone, códigos `KS*`).
> `shortCode` retornado no corpo (texto puro, URL completa) de `POST /uown/sendApplicationToCustomer`; extrair com `new URL(redirectUrl).pathname.split('/').filter(Boolean)[0]`.
> Ver knowledge-base: `new-application-customer-form-flow.md`.
>
> **Estrutura do formulário:** 3 etapas — "Your Info" → "Employment & Financial" → "Legal & Disclaimer". Estado é preenchido automaticamente e desabilitado via `GET /uown/getStateForZipcode/{zip}` após digitação do ZIP. SSN requer `pressSequentially` (campo mascarado).

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Merchant obrigatório — botão Send fica desabilitado sem merchant | CT-01 |
| AC-02 | E-mail obrigatório — botão Send fica desabilitado sem e-mail | CT-02 |
| AC-03 | Telefone obrigatório — botão Send fica desabilitado sem telefone | CT-03 |
| AC-04 | Location dropdown só popula após seleção de merchant | CT-04 |
| AC-05 | Toast "Application sent to {email} and {phone}" na submissão | CT-05 |
| AC-06 | Lead aparece na tabela com leadPk, merchant, e-mail, telefone, status "Pending" | CT-05 |
| AC-07 | Activity log registra CORRESPONDENCE + DATA_CHANGE no lead criado | CT-06 |
| AC-08 | Cliente vê formulário de 3 etapas ao abrir link; Next desabilitado sem campos obrigatórios | CT-07 + CT-08 |
| AC-09 | Botão Next desabilitado e erros inline quando campos obrigatórios estão vazios | CT-08 |
| AC-10 | Estado bloqueado (NJ, VT, MN, ME) → recusa exibida **após** submissão completa das 3 etapas | CT-07 |
| AC-11 | Aprovação exibe tela de congratulações e envia e-mail de confirmação ao cliente; `providerURL` retorna `null` no fluxo do cliente — link de contrato é gerado pelo agente no Origination em etapa posterior | CT-09 |

## Cenários — Parte 1: Agente (Portal de Originação)

```gherkin
Feature: Nova Aplicação — Agente Cria o Convite

  Background:
    Given o agente está autenticado no Portal de Originação
    And a tela New Application está aberta

  Scenario: [negative] CT-01 — Botão Send desabilitado sem merchant
    Given e-mail e telefone estão preenchidos e nenhum merchant está selecionado
    When o agente tenta submeter o formulário
    Then o botão Send está desabilitado e o formulário não é enviado

  Scenario: [negative] CT-02 — Botão Send desabilitado sem e-mail
    Given merchant, localização e telefone estão preenchidos e o e-mail está vazio
    When o agente tenta submeter o formulário
    Then o botão Send está desabilitado e o formulário não é enviado

  Scenario: [negative] CT-03 — Botão Send desabilitado sem telefone
    Given merchant, localização e e-mail estão preenchidos e o telefone está vazio
    When o agente tenta submeter o formulário
    Then o botão Send está desabilitado e o formulário não é enviado

  Scenario: [positive] CT-04 — Location dropdown popula após seleção do merchant
    Given nenhum merchant está selecionado
    When o agente seleciona um merchant no dropdown
    Then o dropdown de localização exibe as localizações do merchant selecionado
    And não exibe localizações de outros merchants

  Scenario: [positive] CT-05 — Submissão bem-sucedida cria lead Pending
    Given e-mail, telefone, merchant e localização estão preenchidos
    When o agente submete o formulário
    Then o toast exibe "Application sent to {email} and {phone}"
    And a tabela exibe nova linha: leadPk numérico · merchant · e-mail · telefone · status "Pending" · agente logado
    And o leadPk é um link para /customers/{leadPk}

  Scenario: [positive] CT-06 — Activity log registra convite e mudança de dados
    Given uma nova aplicação foi submetida
    When o agente abre a página de detalhes do lead criado
    Then a seção Notes exibe CORRESPONDENCE/SYSTEM: "Created KORNERSTONE_SendApplicationEmail to be sent as EMAIL"
    And exibe DATA_CHANGE: "createdFrom = PORTAL" · "ccPeekConsent = TRUE" · "sendApplicationToEmail = {email}"
```

## Cenários — Parte 2: Cliente (Portal Kornerstone via link)

> **Fluxo contínuo — sem pausa para confirmação.** Após CT-05 e CT-06 passarem (lead "Pending" + link enviado), o agente avança diretamente para a Part 2 sem pedir permissão. O `shortCode` é extraído da URL retornada por `POST /uown/sendApplicationToCustomer` e usado imediatamente.

```gherkin
Feature: Nova Aplicação — Cliente Submete Formulário de Aplicação

  Background:
    Given a Parte 1 foi concluída — lead "Pending" criado e link de convite enviado via CT-05
    And o cliente abriu o link de convite recebido por e-mail
    And o formulário é exibido em apply-{env}.{brand}.com/{shortCode}/start

  Scenario: [negative] CT-07 — Recusa exibida após submissão completa para estado bloqueado
    Given o endereço do cliente está em estado bloqueado (NJ, VT, MN ou ME)
    When o cliente preenche as 3 etapas do formulário e submete
    Then a página exibe "Sorry, unfortunately your application is not accepted"
    And um link para a página inicial de Kornerstone é exibido
    And o status do lead no Origination fica "Denied"

  Scenario: [negative] CT-08 — Botão Next desabilitado e erros inline sem campos obrigatórios
    Given o formulário de aplicação está aberto em qualquer etapa
    When campos obrigatórios estão vazios
    Then o botão Next está desabilitado
    And mensagens de erro inline são exibidas por campo ao tentar avançar

  Scenario: [positive] CT-09 — Aprovação exibe tela de congratulações e envia e-mail ao cliente
    Given os dados do cliente são válidos e o estado não está bloqueado
    When o cliente preenche as 3 etapas do formulário e submete
    Then a página exibe "Congratulations, {firstName}!"
    And o texto menciona o valor aprovado e o nome do merchant
    And o cliente é informado que um e-mail de confirmação foi enviado
    And o status do lead no Origination muda para "Approved"
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log 6b0f02a..HEAD -- src/pages/origination/new-application-filters.page.ts src/selectors/common.selectors.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Send desabilitado sem merchant
| Checkpoint | Como verificar |
|---|---|
| Botão disabled antes da seleção | `document.querySelector('button.btn-secondary').disabled === true` |
| Clique não submete | URL permanece em `/newApplication`, sem toast, sem nova linha |

### Oracle: CT-02 — Send desabilitado sem e-mail
| Checkpoint | Como verificar |
|---|---|
| Botão disabled com e-mail vazio | `button.btn-secondary.disabled === true` antes de preencher o e-mail |
| Preencher e-mail habilita o botão | `disabled === false` após digitar e-mail válido |

### Oracle: CT-03 — Send desabilitado sem telefone
| Checkpoint | Como verificar |
|---|---|
| Botão disabled com telefone vazio | `button.btn-secondary.disabled === true` antes de preencher o telefone |
| Preencher telefone habilita o botão | `disabled === false` após digitar telefone válido |

### Oracle: CT-04 — Location dropdown popula após merchant
| Checkpoint | Como verificar |
|---|---|
| Antes: só placeholder | React-select mostra "Select a location", sem `[id^="react-select-3-option"]` no DOM |
| Depois: pelo menos uma opção | `[id^="react-select-3-option"]` presente após seleção do merchant |
| Opções pertencem ao merchant | Nomes visíveis correspondem às localizações conhecidas do merchant |

### Oracle: CT-05 — Submissão cria lead Pending
| Checkpoint | Como verificar |
|---|---|
| Toast com texto correto | `[role="alert"]` textContent = "Application sent to {email} and {phone}" |
| Nova linha na tabela | Primeira linha do tbody contém e-mail e telefone submetidos |
| leadPk numérico e link | Primeira célula: valor numérico + `<a href="/customers/{n}">` |
| Status "Pending" | Célula Status da nova linha lê "Pending" |
| User = agente logado | Célula User lê o username do agente autenticado |

### Oracle: CT-06 — Activity log registra convite e DATA_CHANGE
| Checkpoint | Como verificar |
|---|---|
| CORRESPONDENCE/SYSTEM presente | Notas: Tipo=CORRESPONDENCE, Usuário=SYSTEM, texto contém "Created KORNERSTONE_SendApplicationEmail to be sent as EMAIL" |
| DATA_CHANGE com campos corretos | Notas: Tipo=DATA_CHANGE, contém "createdFrom = PORTAL", "ccPeekConsent = TRUE", "sendApplicationToEmail = {EMAIL}" |

### Oracle: CT-07 — Recusa para estado bloqueado (pós-submissão)
| Checkpoint | Como verificar |
|---|---|
| Formulário completo antes de recusar | Cliente atravessa as 3 etapas (Your Info → Employment & Financial → Legal & Disclaimer) sem erro inline |
| UI de rejeição exibida | Elemento visível contém texto exato: "Sorry, unfortunately your application is not accepted" |
| Link para home Kornerstone | `<a>` com href `https://www.kornerstoneliving.com/` visível na página de rejeição |
| Status do lead no Origination | Lead fica "Denied" na tabela do portal de Originação |
| API response | `POST /uown/los/sendApplication` → `appApprovalStatus: "DECLINED"`, `transactionStatus: "E4"`, `providerURL: null` |
| Razão não exibida ao cliente | `transactionMessage` (ex: "We do not offer leasing in NJ") visível apenas na resposta de rede, não na UI |

### Oracle: CT-08 — Validação inline por campo
| Checkpoint | Como verificar |
|---|---|
| Botão Next desabilitado | `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Next').disabled === true` enquanto há campo obrigatório vazio |
| Erros inline por campo | Após tentativa de avanço: mensagens como "Social Security Number is required." aparecem adjacentes ao campo |
| SSN requer pressSequentially | `input[placeholder="Social Security Number"]` — valor não é aceito via `fill()`; requer digitação sequencial (masked input) |
| State auto-preenchido e bloqueado | `input[placeholder="State"]` recebe valor e fica `disabled` automaticamente após digitar ZIP code válido |
| Submit desabilitado sem checkboxes | Botão Submit do Step 3 desabilitado até `#isAgreedToStatements` e `#isAgreedToPrivacyPolicy` estarem marcados |

### Oracle: CT-09 — Aprovação exibe tela de congratulações
| Checkpoint | Como verificar |
|---|---|
| Texto de congratulações | Elemento visível contém "Congratulations, {firstName}!" |
| Valor aprovado exibido | Texto menciona o creditLimit formatado em moeda (ex: "approved for a $1,946.00 lease") |
| Nome do merchant | Texto menciona o nome da localização (ex: "at Tire Agent") |
| Informação sobre e-mail | Texto contém "A copy of this approval has been sent to your email address on file" |
| API `appApprovalStatus` | `POST /uown/los/sendApplication` → `appApprovalStatus: "APPROVED"`, `transactionStatus: "E0"` |
| `creditLimit` não nulo | Resposta contém `creditLimit` numérico (ex: `1946`) |
| `approvedTermMonths` | Array não vazio (ex: `["13"]`) |
| `providerURL` nulo neste fluxo | `providerURL: null` — contrato é gerado pelo agente, não exposto ao cliente na tela |
| Status do lead no Origination | Lead com `authorizationNumber` = leadPk fica "Approved" na tabela |

