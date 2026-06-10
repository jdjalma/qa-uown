# GoSign — Insights da Daily (28/04/2026)

> Extração da daily UOWN de 28/04/2026 com foco em GoSign e regras de negócio aplicáveis ao escopo de testes/automação.

---

## 1. Status atual do GoSign

| Item | Detalhe | Owner |
|------|---------|-------|
| MR aberto | Fernando abriu hoje após encontrar bugs no fluxo de **assinatura (assignment flow)** | Fernando |
| Comentários pendentes | Ajustes solicitados pelo Sohaib + comentários adicionais da Sowjanya no mesmo MR | Fernando |
| Mudança de pasta (folder change) | Backend está sendo preparado para folder change que sai em breve (talvez hoje) — review do request será feita conforme o formato esperado de envio | Fernando |
| Layout — largura | GoSign empurrou ajustes ontem: a tabela agora pode ser configurada para ocupar largura específica (ex.: 60% em vez dos 800% padrão anterior) | GoSign / Fernando |
| Layout — altura | **Bloqueio aberto**: não é possível reduzir a altura como no SignWell. Time do GoSign ainda está ajustando | GoSign |
| Padronização visual | Após GoSign liberar height, Fernando revisa o documento inteiro para alinhar com o padrão do SignWell | Fernando |
| Testes em curso | Jose na "reta final" — bugs menores reportados ao time. Próximo passo: testar tasks restantes em stage + rodar automação | Jose |

---

## 2. Escopo de teste exigido (Sowjanya)

> **Regra**: o teste do GoSign **NÃO substitui** o teste do SignWell.

- Houve **reestruturação de código** no fluxo de assinatura. Templates antigos do SignWell têm que continuar funcionando.
- O GoSign pode acabar atendendo **apenas o template da Califórnia** caso a decisão final seja não migrar tudo.
- Cobertura mínima de regressão:
  - Fluxo SignWell antigo — todos os templates existentes
  - Fluxo GoSign — template Califórnia + qualquer outro habilitado
  - Não limitar testes ao template da Califórnia

**Implicação para automação:** os testes E2E de assinatura precisam parametrizar o provedor (SignWell vs GoSign) e cobrir os dois caminhos no mesmo run, não como cenários mutuamente exclusivos.

---

## 3. Bug de segurança no payload da signing page (RELEVANTE PARA GOSIGN)

> Discussão entre Priyanka, Marcos Silva e Sowjanya — abre frente de trabalho que afeta diretamente a página de signing usada pelo GoSign.

### Contexto

- A página de signing do origination (`secure.com`) é **pública** — sem firewall, sem VPN, qualquer pessoa com a URL acessa.
- Após o `submit application`, o backend está devolvendo **PII do cliente** (dados sensíveis vindos do protection plan / Buddy) no payload de response para o front-end.
- Antes desse retorno, o `submit application` só devolvia: embedded signing URL + detalhes de pagamento (não-sensível). Comportamento atual quebra esse contrato.

### Restrições

- **Não introduzir fricção** para o cliente (proibido pedir telefone/código adicional como o customer portal faz).
- Apenas codificar o payload **não é suficiente** (Marcos já avaliou).
- Decisão pendente: pesquisa para descobrir solução (provavelmente esconder/criptografar o payload no canal cliente).

### Impacto em testes

- Cenários de teste devem **validar o payload do submit application** e flagar quando PII vazar para o front-end.
- Adicionar a [`docs/taskTestingUown/gowsign_integration/gowsign-integration-test-scenarios.md`](gowsign-integration-test-scenarios.md) cenário negativo: `submit application` deve **NÃO** retornar campos PII na response disponível ao browser.
- Pitfall novo a registrar: signing page é zona aberta, qualquer payload retornado vaza para o mundo.

---

## 4. Configuração de produção (vale para GoSign também)

Priyanka reforçou para Fernando explicitamente:

> "Anyone who's dealing with any external windows, make sure all the production things are pointing production and lowers are pointing lowers."

Checklist para o GoSign antes do deploy:
- [ ] URLs (config) apontando para produção do GoSign
- [ ] Credenciais/tokens da conta de produção do GoSign
- [ ] Webhook URLs configuradas no portal de produção do provedor (SK + Priyanka cuidam do PayNearMe; mesmo padrão deve ser seguido para GoSign)
- [ ] DevOps path da config do `assign service` revisado — Fernando vai checar e abrir draft MR se necessário
- [ ] Verificar via Sentry que requests reais batem em produção (mesma checagem que foi feita no Buddy/Account após Rodrigo atualizar a variável de ambiente)

---

## 5. Regras de negócio (gerais) reforçadas pela Priyanka

Aplicam-se a **toda nova feature/vendor** — Sticky, PayNearMe, **GoSign** e qualquer próximo:

### 5.1 Compreensão obrigatória da business logic

> Antes de implementar OU testar, a equipe inteira tem que entender:
> 1. Qual o propósito do vendor/feature?
> 2. O que ele deve fazer (input → processamento → output)?
> 3. Onde o usuário final vê o resultado das operações (front-end)?
> 4. O que está acontecendo "behind the scenes"?

**Para QA especificamente:**
- Não basta seguir as instruções de teste do dev (são guideline, não checklist exaustivo).
- Tem que pensar de forma independente: "como sei que o pagamento foi recuperado?", "como o cliente vê?", "como testo cada transação individualmente?".
- Só com a business logic dominada o teste é efetivo.

### 5.2 Activity log é mandatório

> "If there is no activity log, that means nothing is happening."

- Toda ação relevante (recovery attempt, refund, signing event, payment) deve ter activity log correspondente.
- Sem log = comportamento inválido. Os testes precisam validar a presença do log junto com a validação da operação em si.

### 5.3 Separação de responsabilidades — vendor vs SVC (princípio arquitetural)

Apesar de ter sido dito sobre PayNearMe, **vale para GoSign**:

- O projeto do vendor (GoSign integration code) é **apenas um placeholder/bridge** para a chamada externa.
- Toda **business logic** mora no SVC.
- O projeto do vendor:
  - Recebe payload do SVC, manda para o vendor
  - Recebe response, parseia e devolve para o SVC
  - Não decide nada, não dispara e-mail/SMS, não tem regra de negócio
- O SVC:
  - Decide quando chamar o vendor
  - Decide o que fazer com a response
  - Dispara efeitos colaterais (e-mail, SMS, links, cancelamentos)
  - Orquestra o fluxo completo

**Implicação para code review do GoSign**: se Fernando (ou qualquer outro) colocar lógica de negócio dentro do projeto GoSign, isso é débito técnico que deve virar ticket de refactor (mesmo padrão que abriram para o PayNearMe).

### 5.4 Rastreamento de tentativas em tabela própria (padrão)

Pelo modelo discutido para o Sticky:
- Cada tentativa/evento de retry/recovery deve ir para uma tabela específica (`sticky_recovery_attempt`-style).
- Status final (recovered/failed) é refletido na tabela original.
- Para o GoSign, se houver retry de assinatura ou eventos de webhook do provedor, mesmo padrão deve ser aplicado: tabela própria + atualização de status final.

---

## 6. Action items de QA / Automação

| # | Ação | Owner sugerido |
|---|------|----------------|
| 1 | Cobrir no plano de teste do GoSign **regressão completa do SignWell** (não só Califórnia) | Jose |
| 2 | Adicionar cenário negativo: `submit application` response **NÃO** deve conter PII (impacto da signing page pública) | Jose / Fernando |
| 3 | Validar activity logs em cada step do fluxo GoSign (preparação, envio para assinatura, callback, completion) | Jose |
| 4 | Antes da release: rodar checagem no Sentry produção para garantir que GoSign aponta para conta de produção (não test) — mesmo padrão usado no Buddy/Account | Jose / Marcos |
| 5 | Validar que a height da tabela foi resolvida pelo GoSign antes do go-live (bloqueio visual conhecido) | Fernando + Jose |
| 6 | Após GoSign liberar height, re-rodar comparação visual GoSign vs SignWell | Jose |
| 7 | Garantir que automação parametriza o provider de assinatura (SignWell / GoSign) para suportar ambos os caminhos no mesmo run | Jose |

---

## 7. Pitfalls a registrar

> Conforme regra inviolável #12 do CLAUDE.md, requisitos descobertos durante debug viram pitfall no protocolo. Os abaixo emergiram da daily:

1. **Signing page é pública** — qualquer dado retornado pelo `submit application` para o front-end é exposto ao mundo. PII NUNCA deve ir para o cliente nessa rota.
2. **Provider switch não é mutuamente exclusivo** — SignWell e GoSign podem coexistir no sistema. Testes não podem assumir que apenas um caminho está ativo.
3. **Height da tabela GoSign** — limitação atual do provider; aceitar workaround visual até GoSign liberar fix.
4. **Folder change no backend** — mudança iminente no envio (em breve, possivelmente hoje 28/04). Reagendar testes que dependem do formato de envio anterior.

---

**Fonte:** [`StandUp - UOWN (26) - PT-BR.md`](../StandUp%20-%20UOWN%20(26)%20-%20PT-BR.md) — daily de 28/04/2026, 16:30 UTC.
