# Teste Exploratório QA - Dev3 (Junho 2026)

**Ambiente:** dev3 | 5 sessoes | 2026-06-01 a 2026-06-03
**Resultado:** ✅ Cobertura exploratoria concluida | 1 bug confirmado bloqueador (Move Due Date) | 1 bug ja reportado (CreateScheduled CC/ACH) | 2 gaps de provisioning | 5 observacoes a escalar

---

> ### TL;DR
> 6 areas cobertas em 5 sessoes: portais Origination, Servicing e Customer Portal (exploracao completa de features), 57 sweeps de negocio (57/57), Payment Arrangement (ciclo de vida completo) e Move Due Date.
> 1 bug bloqueador confirmado: Move Due Date completamente inoperante via UI em dev3 e stg por barra extra na URL do frontend (fix de 1 caractere identificado). 1 bug ja reportado ao dev: pipeline de agendamento automatico CC/ACH quebrado em dev3 por alias SQL incompativel com binario atualizado. 2 gaps de provisioning em dev3 (tabela e coluna ausentes). 5 observacoes a escalar ao produto/dev.
> Acao imediata: 1-char fix no frontend para Move Due Date; confirmar status do fix SQL CreateScheduled com o dev.

---

## Resumo

O ciclo de teste exploratorio em dev3 cobriu os 3 portais da plataforma (Origination, Servicing e Customer Portal), o inventario completo de 57 sweeps de negocio, o ciclo de vida de Payment Arrangement e o fluxo de Move Due Date. A abordagem partiu sempre da interface visual, com verificacao de banco de dados para confirmar persistencia dos estados de negocio.

O ambiente dev3 opera de forma estavel na maior parte das funcionalidades. O bug confirmado nesta sessao (Move Due Date) e de codigo presente tambem em stg, com causa raiz isolada e fix de 1 caractere no frontend. O inventario de sweeps revelou que o pipeline de pagamento automatico CC/ACH estava quebrado por incompatibilidade de versao entre o binario e o SQL do banco; este bug ja foi reportado ao dev em 2026-06-02.

---

## Cobertura

| # | Area | Funcionalidades exploradas | Status |
|---|---|---|---|
| 1 | Origination | 18 telas: Login, Overview, Error Log, New Application, Funding Report, Modification Report, Merchant Modification, Alerts, Merchant List/Detail, Programs, Program Groups, Rebate, Blacklist, Open To Buy, Merchant Setting, Calculator | Explorado - 1 ponto de atencao de seguranca (OBS-1) |
| 2 | Servicing | Quick Search, Customer Information, Scheduled Payments (Move Due Date + Add Fee), Payment Arrangement, 9 abas de historico (ACH, CC, Email, Items Purchased, Payments, PayNearMe, Phone, Due Date, Frequency), Account Sale | Explorado - 1 bug bloqueador (Move Due Date) |
| 3 | Customer Portal | Login/OTP, validacao de inputs, envio de codigo por email, layout responsivo (375/768/1440px) | Explorado - achados menores de UX |
| 4 | Sweeps (57 ativos) | Inventario completo: 17 com resultado de negocio confirmado, 10 com selecao SQL provada, 22 trigger-acceptance, 8 com erro nos logs | 57/57 cobertos - 1 bug ja reportado + 2 gaps de provisioning |
| 5 | Payment Arrangement | Criacao via modal UI, ciclo NOT_STARTED / IN_PROGRESS / SUCCESS / FAILED, efeitos colaterais (rating P, desativacao de autopay CC e ACH) | Documentado sem bugs |
| 6 | Move Due Date | Fluxo UI completo, cap de 3 dias para contas WEEKLY, gravacao em banco e log de atividade | BUG CONFIRMADO - feature inoperante via UI |

---

## Areas exploradas

#### 1. Origination

O portal Origination foi explorado em todas as 18 telas, do login ate as funcionalidades de configuracao de merchant. Todas as paginas retornaram corretamente; CSV e Email CSV funcionam nas paginas que os expõem. 4 erros de console aparecem no carregamento da tela principal do Origination (isolados: o Servicing nao apresenta os mesmos erros). A tela de Merchant List exibe dados bancarios de parceiros (routing number e account number) sem mascara, inclusive no formulario de edicao (ponto de atencao de seguranca, ver OBS-1).

**Evidencia:** login com credenciais de gerente, todas as 18 telas acessadas via browser, varredura de Network requests.

---

#### 2. Servicing

O Servicing foi explorado em Quick Search, Customer Information, todas as 9 abas de historico, Scheduled Payments, Payment Arrangement e Account Sale. O Customer Information registra automaticamente uma entrada de "review" no log de atividade ao abrir qualquer conta (comportamento de auditoria). O campo de quantidade de dias para mover o vencimento aceita uma data em vez de um numero inteiro de dias (possivel bug de UI, O-022). A funcionalidade Move Due Date esta completamente inoperante via browser (ver Bloqueadores).

**Evidencia:** contas 104, 138, 166, 187, 219 e 223 inspecionadas via browser; historicos e logs validados.

---

#### 3. Customer Portal

O Customer Portal foi validado nas 3 dimensoes de viewport (mobile 375px, tablet 768px e desktop 1440px). O fluxo OTP funciona corretamente: o cliente digita email ou telefone, recebe o codigo em ate 30 segundos e os 6 campos com auto-submit completam o login. O script de prevencao de fraude de terceiros nao carrega em dev3 (variavel de ambiente nao configurada), mas o login e a navegacao nao sao afetados. A mensagem de validacao do campo de OTP sempre menciona "email" mesmo quando o usuario digitou um numero de telefone (UX menor, C-001).

**Evidencia:** login via fintechgroup777@gmail.com, viewports testados em sequencia via browser.

---

#### 4. Sweeps (57 ativos)

A cobertura de sweeps foi realizada em duas fases: exploracao manual de 20 sweeps (sessao 2) e automatizacao completa via 7 suites de testes (sessao 4), atingindo 57/57 sweeps ativos do dev3. A profundidade varia conforme o ambiente permite: 17 sweeps tiveram o resultado de negocio real confirmado; 10 tiveram a logica de selecao SQL provada sem o processamento final; 22 foram validados via trigger-acceptance; 8 apresentaram erros nos logs (1 bug reportado, 2 gaps de provisioning, 4 erros de ambiente esperados).

**Legenda de profundidade de cobertura:**

- **Nivel A — Outcome real confirmado:** o sweep rodou E produziu um resultado de negocio verificavel. Algo mudou de estado e foi confirmado no banco ou na UI. Exemplos: `removeRatingLetterSweep` confirmou rating P removido das contas 138/165/167; `SendACHPaymentsSweep` confirmou registros PENDING→PICKED_TO_SEND; `settledInFullAccountEmailSweep` confirmou email enfileirado para conta com status SETTLED_IN_FULL.

- **Nivel B — Selecao SQL provada:** a logica de selecao do sweep foi verificada (o SQL pega os registros certos), mas o processamento final nao foi confirmado porque o ambiente dev3 nao tem processador CC/ACH real ou os dados elegíveis nao existiam no momento. `processed=0` sem erro nao e necessariamente falha — o sweep rodou mas nao havia o que processar.

- **Nivel C — Trigger-acceptance:** nivel mais raso. O endpoint de trigger retornou HTTP 200 e a row apareceu em `uown_sweep_logs`. Nao havia registro elegivel no banco para o sweep processar, entao `processed=0` e nenhuma acao de negocio aconteceu. Confirmamos apenas que o mecanismo de disparo funciona — o sweep "acordou". A logica interna nao foi validada.

- **Loga OK (report-sweep):** para sweeps de relatorio (funding, tax, merchant, monitor etc.), o sweep disparou, retornou 200 e apareceu nos logs sem erro. O artefato gerado (arquivo, email, Sharepoint) nao foi aberto nem verificado — sabemos que rodou sem travar, nao sabemos se o conteudo esta correto.

**Nota de honestidade:** 57/57 cobertos nao significa que todos os 57 foram validados ponta-a-ponta. Os 17 do nivel A tem cobertura solida; os 10 do nivel B tem cobertura parcial (logica de selecao); os 22 do nivel C confirmam apenas que o trigger e aceito. Os sweeps de relatorio precisam de verificacao do artefato gerado para atingir nivel A.

**Evidencia:** 7 suites automatizadas cobrindo todos os sweeps, varredura de uown_sweep_logs.error nos ultimos 7 dias em dev3.

---

#### 5. Payment Arrangement

O ciclo completo de Payment Arrangement foi mapeado via UI no Servicing. A criacao e feita no modal "Make Payment" marcando o checkbox "Payment Arrangement", que expoe campos de Start Date, End Date, Frequency, Tipo (NORMAL ou SETTLEMENT) e tabela editavel de parcelas. Ao criar um arrangement CC, o sistema eleva automaticamente o rating da conta para P e desativa os autopays CC e ACH; quando o arrangement finaliza em SUCCESS, rating e autopay retornam ao estado anterior. Nao existe funcionalidade de editar ou cancelar um arrangement criado em nenhum status, nem via UI nem via API (OBS-7).

**Evidencia:** contas 166 (arrangements pk=79 SUCCESS e pk=118 NOT_STARTED) e 187 (pk=100 IN_PROGRESS) testadas.

---

#### 6. Move Due Date

O fluxo de Move Due Date foi validado via UI (modal na pagina "Due Amounts" no Servicing) e confirmado via API direta. O backend esta correto: a chamada sem barra retorna 200, move a data e grava em uown_due_date_moves com log de atividade DUE_DATE_MOVES. O frontend, porem, monta a URL com uma barra extra antes do `?`, que o backend rejeita com 404, tornando a feature completamente inoperante via browser. Detalhes no Bloqueador abaixo.

**Evidencia:** contas 219 e 223; requests de rede capturados via browser (com barra = 404; sem barra via API = 200 + row criada).

---

## Observacoes (nao bloqueiam release)

### OBS-1: Dados bancarios de merchants em plaintext no Origination (H-004)

> Routing number e account number de merchants ficam visiveis sem mascara nas telas Merchant List e Merchant Detail, incluindo no formulario de edicao.

<details>
<summary><b>Impacto e recomendacao</b></summary>

**Quando ocorre:** qualquer usuario com acesso ao Origination consegue visualizar e copiar os dados bancarios completos de todos os merchants cadastrados. Nao ha mascara de exibicao (ex: `***1234`) nem acao explicita de "revelar" necessaria.

**Impacto:** exposicao indevida de dados bancarios de parceiros comerciais para todos os usuarios com acesso ao portal interno. Em producao, o acesso ao Origination e restrito, o que mitiga o risco mas nao elimina.

**Ocorrencia relacionada:** CPF e dados bancarios de clientes tambem aparecem sem mascara em telas de lead/conta no Origination (H-009, H-010).

**Recomendacao:** aplicar mascara padrao de exibicao nos campos de routing number e account number nas telas de listagem e detalhe; exibir valor completo somente em acao explicita de edicao com permissao elevada. Verificar se o mesmo gap existe em producao.

</details>

**Classificacao:** [OBSERVACAO]. Ponto de atencao de seguranca. Verificar com o time se ha mascara aplicada em producao ou se e gap geral da plataforma.

---

### OBS-2: CreateScheduled CC e ACH - pipeline de pagamento automatico inoperante em dev3 (SW-BUG-001, ja reportado)

> Os sweeps de criacao de pagamentos automaticos CC e ACH falham em dev3 com erro de alias SQL. Nenhum pagamento SCHEDULED e criado; os sweeps de envio subsequentes encontram 0 registros. Bug ja reportado ao dev em 2026-06-02.

<details>
<summary><b>Causa raiz e fix</b></summary>

**Erro em logs:** `java.lang.IllegalArgumentException: Unknown alias [accountPk]` (CC) e `Unknown alias [pk]` (ACH).

**Causa raiz:** o binario de dev3 usa uma versao atualizada que mapeia resultados SQL pelo nome exato do campo Java. O SQL configurado no banco ainda usa aliases com sufixos duplos (`"accountPkk"`, `"amountt"`, `"postingDatee"`) criados para a versao anterior. Os dois estao incompativeis.

**Sweeps afetados:** CreateScheduledCreditCardPaymentsSweep (pk=16), CreateScheduledACHPaymentsSweep (pk=15), CCDailyScheduledDeniedRerun (pk=68).

**Fix:** atualizar o SQL das tasks pk=15, 16 e 68 em uown_scheduled_task para aliases sem aspas duplas, alinhados com os nomes dos campos Java.

**Status:** reportado ao dev em 2026-06-02.

</details>

**Classificacao:** [OBSERVACAO]. Bug confirmado, ja reportado. Aguardando fix do dev.

---

### OBS-3: Gaps de provisioning em dev3 - sweeps de delinquency e Vervent nao operam (SW-BUG-002/003)

> Dois grupos de sweeps nao funcionam em dev3 por ausencia de objetos de banco. Ambos funcionam normalmente em stg.

<details>
<summary><b>Detalhes</b></summary>

**delinquencyOfferEmailSweep e delinquencyReminderEmailSweep:** erro `relation "uown_accounts_to_be_sold" does not exist`. A tabela existe em stg mas nao foi criada em dev3. O sweep seleciona 0 contas independente do dia da semana; cobertura em dev3 limitada ao mecanismo (presenca nos logs sem erro de produto).

**generateVerventOnBoardingFileSweep:** erro `column ss.tax_per_scheduled_payment does not exist`. Coluna ausente em dev3, presente em stg. Confirmado via consulta SQL direta.

**Acao:** provisionar a tabela `uown_accounts_to_be_sold` e a coluna `tax_per_scheduled_payment` em dev3 (migration), ou direcionar a validacao desses sweeps exclusivamente para stg.

</details>

**Classificacao:** [OBSERVACAO]. Gap de provisioning de ambiente, nao bug de produto. Validar em stg onde os objetos existem.

---

### OBS-4: monitorSweep - falha intermitente ao enfileirar email (SW-OBS-007)

> O monitorSweep tenta criar uma entrada na fila de email sem corpo em alguns casos, gerando erro de validacao. Comportamento intermitente.

<details>
<summary><b>Detalhes</b></summary>

**Erro em logs:** `Validation failed: 'Please provide emailBody'` ao tentar persistir na fila de email.

**Frequencia:** 4 ocorrencias nos ultimos 7 dias em dev3. Nao reproduzido de forma isolada com dados novos.

**Natureza provavel:** data-dependent. O template de monitoramento pode gerar corpo vazio quando nao ha dados de alerta para incluir.

**Pergunta para o dev:** e comportamento esperado (nao envia quando nao ha alertas) ou o sweep deveria ter uma guarda antes de tentar criar o email?

</details>

**Classificacao:** [OBSERVACAO]. Escalar ao dev para confirmar se e comportamento esperado ou bug de robustez.

---

### OBS-5: cancelProtectionPlanSweep - NullPointerException ocasional (SW-OBS-008)

> O sweep de cancelamento de plano de protecao lanca NullPointerException ao processar alguns registros com campo nulo nao tratado.

<details>
<summary><b>Detalhes</b></summary>

**Erro em logs:** `NullPointerException: Cannot invoke "Integer.intValue()" because "defaultValue" is null`.

**Frequencia:** 3 ocorrencias nos ultimos 7 dias em dev3.

**Causa provavel:** campo `defaultValue` pode ser nulo em alguns registros de historico de plano de protecao. O codigo tenta chamar `.intValue()` sem verificar null antes.

**Impacto:** o sweep falha para os registros afetados, que ficam sem cancelamento processado.

</details>

**Classificacao:** [OBSERVACAO]. Escalar ao dev. NullPointerException deve ser tratado com verificacao de null ou Optional.

---

### OBS-6: customerPortalReminderSweep - possivel duplo envio no dia 2 de cada mes (SW-OBS-006)

> A logica de disparo do sweep nao impede re-execucao no mesmo dia, o que pode resultar em dois lembretes enviados para o mesmo cliente no dia 2 de cada mes.

<details>
<summary><b>Comportamento observado</b></summary>

**Em dev3:** o sweep rodou as 03:00 (67 emails) e novamente as 18:15 (14 emails adicionais) no mesmo dia 2. A condicao `EXTRACT(DAY FROM CURRENT_DATE) = 2 AND COUNT(e) > 2` nao tem guarda de "ja enviou hoje", permitindo re-trigger no mesmo dia.

**Pergunta para o produto:** e comportamento intencional (cron deveria ser configurado para rodar apenas 1x no dia 2) ou o SQL precisa de guarda diaria (verificar se ja existe email do dia antes de enfileirar)?

</details>

**Classificacao:** [OBSERVACAO]. Escalar ao produto para confirmar intencionalidade. Se nao intencional, adicionar guarda diaria no SQL ou ajustar o cron.

---

### OBS-7: Payment Arrangement - sem opcao de editar ou cancelar (O-NEW-001)

> Nao existe fluxo de editar ou cancelar um Payment Arrangement em nenhum status. Uma vez criado, o arrangement nao pode ser ajustado pelo agente via sistema.

<details>
<summary><b>Impacto operacional</b></summary>

**Confirmado:** o portal Servicing exibe apenas a visualizacao dos arrangements. Nao ha botao, icone ou acao que permita editar valores, datas ou cancelar o arrangement. O backend tambem nao expoe nenhum endpoint para essas operacoes.

**Workaround disponivel:** nenhum via UI ou API.

**Impacto:** agente que cria um arrangement com datas ou valores incorretos nao consegue corrigir sem intervencao manual no banco de dados.

</details>

**Classificacao:** [OBSERVACAO]. Verificar com o produto se e lacuna conhecida ou se ha plano de implementacao.

---

## Bloqueadores

### BUG-001 [CONFIRMADO] - Move Due Date completamente inoperante via UI (dev3 e stg)

A acao "Move Due Date" na tela "Due Amounts" do Servicing nao funciona. O agente preenche o modal com a data agendada e a nova data desejada, clica SAVE, e recebe a mensagem `"No static resource uown/svc/moveDueDatesByDays/{pk}."`. A data de vencimento nao e alterada.

<details>
<summary><b>Causa raiz, prova deterministica e fix</b></summary>

**Causa raiz:** o frontend monta a URL com uma barra extra antes do `?`:

```
POST /uown/svc/moveDueDatesByDays/219/?fromDueDate=2026-06-09&moveNumberOfDays=2  -> 404
                                      ^ barra extra aqui
```

O backend (Spring Boot 3) rejeita URLs com trailing slash por padrao, pois o controller declara `@PostMapping("/moveDueDatesByDays/{accountPk}")` sem barra.

**Prova deterministica:**

| Request | Resultado |
|---------|-----------|
| COM barra `../219/?params` | 404 "No static resource" |
| SEM barra `../219?params` | 200 - data move, grava uown_due_date_moves (pk=11, moved_by_days=2) |

**Fix (1 caractere):**
```diff
- url: `/uown/svc/moveDueDatesByDays/${accountPk}/?fromDueDate=...`,
+ url: `/uown/svc/moveDueDatesByDays/${accountPk}?fromDueDate=...`,
```
Arquivo: `servicing/domain/stores/payment.tsx:408`

**Escopo:** dev3 e stg afetados (bug de codigo, nao de provisioning). Backend esta correto e funciona sem a barra.

**Impacto adicional:** a barra extra mascara as mensagens de validacao do backend. Tentativa de mover 26 dias numa conta WEEKLY deveria retornar `"Due date offset cannot exceed 3 days for WEEKLY frequency"` (400), mas com a barra retorna apenas `404 No static resource`. O agente nunca ve o motivo real da falha.

</details>

---

## Recomendacao

> ✅ **Cobertura exploratoria concluida. Fix de BUG-001 deve preceder a validacao em stg.**

- 6 areas da plataforma cobertas em dev3 com abordagem UI-first
- 57/57 sweeps ativos mapeados e categorizados por nivel de cobertura alcancado no ambiente
- Payment Arrangement: ciclo completo documentado, sem bugs funcionais
- Move Due Date: bug de 1 caractere no frontend com causa raiz e fix identificados

**Acoes necessarias:**

1. Fix no frontend do Servicing para Move Due Date (`payment.tsx:408`) - 1-char, escalar ao dev de frontend (afeta dev3 e stg)
2. Confirmar com o dev o status do fix para CreateScheduled CC/ACH (reportado em 2026-06-02, OBS-2)
3. Provisionar tabela `uown_accounts_to_be_sold` e coluna `tax_per_scheduled_payment` em dev3, ou planejar validacao desses sweeps em stg (OBS-3)
4. Definir com o produto a intencionalidade de: monitorSweep (OBS-4), cancelProtectionPlan (OBS-5), customerPortalReminder dia 2 (OBS-6), ausencia de Edit/Cancel em Payment Arrangement (OBS-7)
5. Avaliar com o time de seguranca a exposicao de dados bancarios de merchants sem mascara no Origination (OBS-1)

**Proximas sessoes de cobertura:**

- Spec E2E Move Due Date via browser (deve reprovar ate o fix de BUG-001 ser aplicado)
- Exploracao de Frequency Change e Scheduled (future) Payment
- Revalidacao em stg de delinquency sweeps e Vervent (OBS-3)
