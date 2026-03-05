# Originacao e Pipeline de Aplicacao
## UOwn Leasing - SVC Platform

Pipeline de 17 steps, verificacao de fraude, underwriting, validacao pre-assinatura, valores aprovados, continuacao/finalizacao, verificacao de endereco e geolocalizacao.

---

## 4. Pipeline de Aplicacao (17 Steps)

### Visao Geral

Quando um cliente submete uma aplicacao, ela passa por um **pipeline sequencial de 17 steps**. Se qualquer step retornar `DECLINED`, o pipeline **para imediatamente** -- steps seguintes nao executam.

### Controle de Concorrencia

O sistema mantem um `ConcurrentHashMap` indexado por SSN. Se ja existe uma aplicacao em andamento para o mesmo SSN, retorna erro `"Application already in progress"`. O SSN e removido do mapa em um bloco `finally`.

### Ordem Configuravel por Client Type

A ordem dos steps e configuravel por tipo de merchant via:
```
application.steps.{ClientType} = "stateCheck, merchantAutoDenyCheck, ..."
```

Isso permite que merchants especificos pulem ou reordenem steps conforme necessidade do negocio.

### Toggles Individuais por Step

Cada step pode ser habilitado/desabilitado individualmente via configuracao:

| Config | Step | Default |
|--------|------|---------|
| `check.valid.states` | State Check | true |
| `check.black.list` | Blacklist Check | true |
| `check.for.previous.denied.uw` | Previous UW Denied | true |
| `check.for.previous.signed` | Future FPD Check | true |
| `check.duplicate.info` | Duplicate Check | true |
| `check.previous.leads.for.delinquency` | Eligible for Reapproval | true |
| `check.neuroid.on.send.application` | NeuroID Check | true |

### Step 1: State Check (Verificacao de Estado)

**O que e:** Verifica se a UOwn opera no estado do cliente e se existem programas de lease disponiveis naquele estado.

**Para que serve:** Compliance regulatorio -- alguns estados proibem ou restringem operacoes de lease-to-own.

**Como funciona para o usuario interno:** Configuravel via `no.business.in.state` (default: NJ, VT, MN, ME). Admins podem adicionar/remover estados bloqueados sem deploy.

**Como afeta o cliente:** Cliente recebe mensagem "We do not offer leasing in {estado}".

**Resultado se negado:** Status `DENIED`, interno `NO_BUSINESS_IN_STATE` ou `NO_PROGRAM_IN_STATE`. Sem email de negacao.

### Step 2: Merchant Auto Deny

**O que e:** Verifica se o merchant foi sinalizado para negar automaticamente todas as aplicacoes.

**Para que serve:** Usado quando um merchant e suspenso, desativado ou investigado por fraude. Permite bloquear novas aplicacoes sem desativar o merchant completamente.

**Como funciona para o usuario interno:** Admin ativa a flag `autoDenyApplication = TRUE` no cadastro do merchant.

**Como afeta o cliente:** Cliente recebe negacao generica "Denied". Sem email de negacao.

**Resultado:** Status `DENIED`, interno `MERCHANT_AUTO_DENIED`.

### Step 3: Source Check (Verificacao de Fonte de Trafego)

**O que e:** Negacao **probabilistica** baseada na fonte/canal de trafego do cliente. Certas categorias de trafego tem taxas de negacao configuradas.

**Para que serve:** Controle de qualidade de trafego. Se uma campanha de marketing especifica gera muita fraude, a taxa de negacao pode ser aumentada sem desligar a campanha inteira.

**Como funciona:** Gera um numero aleatorio e compara com a taxa de negacao da categoria. Ex: categoria "111706798993" tem 80% de negacao -- 8 em cada 10 aplicacoes dessa fonte sao negadas.

**Aplicavel apenas a:** Merchants do tipo `BUY_ON_TRUST` (configuravel).

**Resultado se negado:** Status `DENIED`, interno `SOURCE_INELIGIBLE`. Sem email de negacao.

### Step 4: Blacklist Check (Verificacao de Lista Negra)

**O que e:** Verifica se os dados pessoais do cliente correspondem a qualquer entrada na lista negra de fraude.

**Para que serve:** Prevencao de fraude. Clientes previamente identificados como fraudadores sao impedidos de aplicar novamente.

**Campos verificados:** Nome, sobrenome, email, celular, SSN, CEP, numero de conta bancaria, routing number, endereco.

**Como funciona para o usuario interno:** Agentes podem adicionar/remover entradas na blacklist via Admin Panel. Tambem podem blacklistar um lead inteiro (todos os dados de uma vez).

**Como afeta o cliente:** Cliente recebe "Fraud check failed". **Sem email de negacao** (para nao alertar fraudadores).

**Resultado:** Status `DENIED`, interno `BLACKLIST_DENIED`.

### Step 5: Data Mismatch Check (Verificacao de Divergencia de Dados)

**O que e:** Compara dados da aplicacao atual com dados de aplicacoes anteriores do mesmo cliente. Detecta mudancas suspeitas de nome, endereco, etc.

**Para que serve:** Fraude por impersonacao -- alguem usando o SSN de outra pessoa pode mudar nome/endereco para receber a mercadoria.

**Ativado por:** Codigos de merchant especificos ou flag por `clientName`.

**Resultado se divergencia:** Status `DENIED`, **email de negacao enviado**.

### Step 6: Previous Leads (Busca de Leads Anteriores)

**O que e:** Busca e cancela leads anteriores do mesmo cliente, calculando quanto da aprovacao ja foi consumida.

**Para que serve:** Garante que um cliente nao tenha multiplos leads ativos e calcula credito remanescente.

**IMPORTANTE:** Este step **NUNCA nega**. E puramente de coleta de dados.

**Efeitos:** Leads anteriores sao cancelados. `consumedApprovalAmount` e calculado para uso em steps posteriores.

### Step 7: Previous UW Denied (UW Anterior Negado)

**O que e:** Verifica se o cliente ja foi negado pelo underwriting anteriormente.

**Para que serve:** Evita reprocessamento desnecessario -- se o cliente foi negado recentemente, nao faz sentido rodar UW novamente (a menos que haja override).

**Resultado se negado:** Status `UW_DENIED`, **email de negacao enviado**.

### Step 8: Future FPD Check (Lease Assinado com Pagamento Futuro)

**O que e:** Impede nova aplicacao se o cliente tem um lease assinado cuja primeira data de pagamento (FPD) ainda esta no futuro.

**Para que serve:** Previne que o cliente obtenha multiplos leases simultaneamente antes que o primeiro comece a gerar pagamentos.

**Condicoes de negacao (TODAS devem ser verdadeiras):**
- Lead anterior com status `SIGNED`
- `accountPk` e null (ainda nao virou conta)
- `firstPaymentDueDate` e posterior a hoje

**Resultado:** Status `DENIED`, interno `SIGNED_FPD_IN_FUTURE`. Sem email.

### Step 9: Duplicate Check (Verificacao de Duplicidade)

**O que e:** Verifica se o cliente tem multiplas aplicacoes usando o mesmo email, telefone ou dados bancarios.

**Para que serve:** Previne abuso -- um mesmo individuo tentando obter multiplos leases usando variantes de contato.

| Verificacao | Limite Default | O que acontece |
|-------------|---------------|----------------|
| Emails duplicados | 3 usos | `EMAIL_COUNT_FAILED` |
| Telefones duplicados | 3 usos | `PHONE_COUNT_FAILED` |
| Contas duplicadas por email | Via servico | `{status}_DUP_EMAIL` |
| Contas duplicadas por telefone | Via servico | `{status}_DUP_PHONE` |
| Contas duplicadas por banco | Via servico | `{status}_DUP_BANK_INFO` |

### Step 10: Eligible for Reapproval (Elegibilidade para Re-aprovacao)

**O que e:** Verifica se um cliente que ja tem contas existentes esta inadimplente nelas.

**Para que serve:** Impede que clientes inadimplentes obtenham novos leases.

**Como funciona:** Se o cliente tem contas existentes, verifica se alguma esta em atraso. Se sim, nega com "Ineligible for re-approval".

### Step 11: NeuroID Check (Biometria Comportamental)

**O que e:** Analisa **como** o cliente preencheu o formulario (velocidade de digitacao, movimentos de mouse, padroes de copiar/colar, hesitacoes). Descrito em detalhes na secao 5.

### Step 12: Underwriting (Analise de Credito)

Descrito em detalhes na secao 6.

### Step 13: Invoice Placeholder

**O que e:** Para merchants especificos (ex: `SYNCHRONY`), cria uma invoice usando o valor de aprovacao como total do pedido.

**Para que serve:** Alguns merchants nao enviam invoice antecipadamente. O sistema cria um placeholder para que o calculo possa prosseguir.

### Step 14: Calculate Max Approval (Calculo de Valor Maximo)

**O que e:** Calcula o valor maximo de aprovacao considerando credito ja consumido em leads anteriores.

**Resultado se <= 0:** Negado com "No credit remaining", interno `NO_REMAINING_AMOUNT`.

### Step 15: Compare Cost Check (Comparacao Custo vs Aprovacao)

**O que e:** Compara o custo do carrinho com o valor de aprovacao.

| Cenario | Resultado |
|---------|-----------|
| Custo <= aprovacao | Passa |
| Custo > aprovacao, elegivel para item split | Passa com flag para split |
| Client type isento (PAY_TOMORROW, TIRE_AGENT, PAY_POSSIBLE) | Passa sem checagem |
| Custo > aprovacao, sem split | Negado, mas cliente recebe notificacao de aprovacao |

### Step 16: Item Split (Divisao de Carrinho)

Descrito em detalhes na secao 31.

### Step 17: Calculator (Calculadora de Pagamentos)

Descrito em detalhes na secao 7.

---

## 5. Sistema de Verificacao de Fraude e Identidade

### Visao Geral da Estrategia de Defesa

A UOwn utiliza uma estrategia de **defesa em camadas** com multiplos servicos terceirizados, cada um verificando um angulo diferente. Nenhum servico decide sozinho -- a combinacao de resultados forma a decisao final.

### 5.1 Sentilink (Deteccao de Identidade Sintetica)

**O que e:** Servico especializado em detectar **identidades sinteticas** (identidades fabricadas misturando dados reais e falsos de diferentes pessoas) e **roubo de identidade** (uso dos dados de outra pessoa real).

**Para que serve:** Fraude de identidade sintetica e o tipo de fraude financeira que mais cresce. Identidades sinteticas podem passar em verificacoes de credito tradicionais porque constroem historico real ao longo do tempo. O Sentilink detecta o que bureaus de credito nao conseguem.

**Quando roda:** Primeiro step do engine de UW -- se a identidade e falsa, nao faz sentido rodar os demais checks.

**Dados enviados:** Nome, sobrenome, data de nascimento, SSN, email, telefone, endereco completo.

**Tres scores analisados:**
- **Synthetic Score** -- probabilidade da identidade ser fabricada
- **Identity Theft Score** -- probabilidade de impersonacao
- **Abuse Score** -- probabilidade de fraude de primeira pessoa (aplica com dados proprios mas intencao de default)

**Configuracao:** Thresholds sao **por merchant** -- diferentes merchants toleram diferentes niveis de risco. Resultados anteriores podem ser reutilizados dentro de uma janela configuravel de dias.

**Possiveis resultados:** APPROVE, DECLINE (score acima do threshold), SSN_TYPO (SSN parece manipulado), ERROR.

### 5.2 Neustar (Verificacao de Dados de Contato)

**O que e:** Plataforma de inteligencia de dados que cruza telefone, email, endereco e nome do cliente contra bases massivas de telecom e dados de consumidores.

**Para que serve:** Fraudadores nao conseguem montar um conjunto perfeitamente consistente de dados de contato. O telefone pode ser pre-pago, o endereco nao corresponde aos registros da operadora, ou o email foi criado dias antes. O Neustar detecta essas inconsistencias.

**Quando roda:** Segundo step do engine de UW.

**Verificacoes realizadas (cada uma pode negar independentemente):**
- Telefone nao corresponde ao nome
- Endereco nao corresponde ao telefone
- Email nao corresponde ao telefone
- Email nao corresponde ao nome
- Telefone e pre-pago/burner
- Tempo de servico do telefone muito curto
- Uso do telefone muito baixo (2 meses)
- Mudanca de nome recente suspeita
- Email invalido ou muito novo
- Endereco invalido (USPS), vago, ou de prisao
- Falha na validacao DPV (Delivery Point Validation)

**Configuracao:** Cada verificacao pode ser habilitada/desabilitada por merchant. Thresholds por merchant.

### 5.3 LexisNexis (Risco de Identidade e Registros Publicos)

**O que e:** Servico de score de risco baseado em registros publicos, registros judiciais, registros de propriedade e dados de credito.

**Para que serve:** Adiciona uma camada que nem Sentilink nem Neustar cobrem: analise profunda de registros publicos. Detecta se um SSN foi emitido recentemente (possivelmente a um menor), se o candidato tem historico de fraude em registros judiciais, ou se multiplas aplicacoes vem de enderecos ligados a fraude conhecida.

**Quando roda:** Terceiro step do engine de UW.

**Possiveis resultados:** PASS (score abaixo do threshold), FAIL -> `LEXISNEXIS_DENIED`, ERROR.

### 5.4 SEON (Motor de Fraude Digital)

**O que e:** Motor de fraude que analisa a **pegada digital** do candidato -- email, telefone, IP e device fingerprint.

**Para que serve:** Captura a "camada digital" da fraude. Um fraudador pode ter montado uma identidade convincente no papel, mas seu comportamento digital o trai: usando VPN de outro pais, email temporario criado no mesmo dia, telefone VoIP, ou nenhuma presenca em redes sociais.

**Quando roda:** Quarto e ultimo step do engine de UW -- atua como rede de seguranca final.

**O que analisa:**
- **Email:** Vinculado a redes sociais? Idade? Provedor descartavel? Score de fraude?
- **Telefone:** Real? Vinculado a redes sociais? Numero VoIP?
- **IP:** VPN, proxy ou Tor? Geolocalizacao? IP de data center?
- **Device fingerprint:** Comportamento do dispositivo/navegador

**Quatro scores independentes:** Email, IP, telefone e score geral de fraude, cada um com threshold **por merchant**.

### 5.5 NeuroID (Biometria Comportamental)

**O que e:** Analisa **como** o candidato preenche o formulario de aplicacao, nao **o que** ele digita.

**Para que serve:** Inovacao em deteccao de fraude. Um fraudador pode ter a identidade roubada perfeita com documentos correspondentes, mas nao consegue replicar os padroes comportamentais da pessoa real. Alguem digitando seu proprio nome e SSN de memoria se comporta fundamentalmente diferente de alguem lendo de uma tela ou colando de um banco de dados.

**O que monitora:**
- Velocidade e ritmo de digitacao
- Padroes de movimento de mouse
- Padroes de hesitacao (pausa antes de digitar SSN, como se estivesse lendo de algum lugar)
- Comportamento de copiar/colar
- Padroes de interacao com o dispositivo

**Quando roda:** O SDK JavaScript coleta dados durante o preenchimento do formulario. A verificacao e consultada durante a submissao.

**Possiveis resultados:** APPROVE, DECLINE, PROFILE_NOT_FOUND (JS desabilitado), ERROR.

### 5.6 Intellicheck (Autenticacao de Documento de Identidade)

**O que e:** Servico de autenticacao de documentos de identidade que le o **codigo de barras** na parte traseira de carteiras de motorista e IDs.

**Para que serve:** Fraudadores podem criar IDs visualmente convincentes, mas acertar a codificacao do codigo de barras no padrao exato do estado emissor e extremamente dificil. O Intellicheck detecta documentos forjados, alterados e falsificados.

**Como o cliente usa:** Durante a submissao da aplicacao, o cliente fotografa a frente e o verso de sua carteira de motorista. As imagens sao enviadas ao Intellicheck.

**O que verifica:**
- Dados do codigo de barras sao consistentes com a frente do documento
- Formato do documento corresponde ao padrao do estado emissor
- Documento nao esta expirado
- Sem sinais de adulteracao

**Verificacao adicional:** Apos o Intellicheck, o sistema faz **fuzzy name matching** entre o nome no documento e o nome na aplicacao, e opcionalmente verifica data de nascimento.

### 5.7 SEON ID (Verificacao de ID via SEON)

**O que e:** Alternativa ao Intellicheck. O cliente fotografa seu ID e o SEON extrai dados e verifica correspondencia.

**Verificacoes:** Nome corresponde? Estado corresponde? CEP corresponde? Data de nascimento corresponde?

**Configuracao:** Merchant escolhe entre Intellicheck ou SEON ID via flags `isIntellicheckRequired` e `isSeonIdCheckRequired`.

### 5.8 Kount (Fraude de Cartao de Credito)

**O que e:** Servico de deteccao de fraude para transacoes de cartao de credito. Avalia o risco **antes** de cobrar o cartao.

**Para que serve:** Mesmo apos aprovar a aplicacao, a UOwn precisa garantir que o cartao usado para pagamento nao e roubado. O Kount previne chargebacks e fraude de pagamento.

**Quando roda:** No momento do **pagamento** (nao durante a aplicacao). Tanto para novos leads quanto para contas existentes.

**O que analisa:**
- BIN do cartao (primeiros 6 digitos) e ultimos 4
- Sessao do dispositivo (fingerprint via SDK JavaScript)
- IP do pagador
- Nome, endereco, email e data de nascimento do titular
- Valor e detalhes da transacao

**Possiveis resultados:** APPROVE (risco baixo), DECLINE (risco alto), ERROR.

**Cache inteligente:** Verifica se ja existe decisao recente para a mesma pessoa + cartao. Se sim, reutiliza sem nova chamada de API.

### 5.9 Plaid (Verificacao Bancaria e de Renda)

**O que e:** Servico que se conecta diretamente a **conta bancaria** do cliente (com permissao dele) para verificar propriedade, renda, e saude financeira.

**Para que serve:** Verificacoes de credito tradicionais perdem muitos clientes com credito limitado (thin-file). O Plaid fornece dados alternativos baseados em transacoes bancarias reais para determinar capacidade de pagamento.

**Quando roda:** **Condicionalmente** -- apenas quando:
1. Merchant habilitou Plaid (`isPlaidVerificationRequired`)
2. Underwriting colocou o lead em "lambda segment" dentro de uma faixa configurada
3. Status do lead e `UW_REVIEW` (underwriting incerto)

Ou seja, Plaid e um **mecanismo de segunda chance** para candidatos na zona cinzenta.

**Como o cliente usa:**
1. Recebe link para conectar seu banco via widget do Plaid
2. Autentica com suas credenciais bancarias
3. Plaid analisa 180 dias de historico bancario

**Possiveis resultados:** PLAID_SUCCESS (aprovado via banco), PLAID_FAILED (negado), PLAID_ABANDONED (cliente desistiu), PLAID_ERROR.

### Ordem de Execucao Completa

```
PREENCHIMENTO DO FORMULARIO
  -> NeuroID coleta biometria comportamental silenciosamente

UPLOAD DE ID
  -> Intellicheck OU SEON ID autentica documento

SUBMISSAO (Engine de UW)
  1. Sentilink -> Identidade sintetica/roubada?
  2. Neustar   -> Dados de contato consistentes?
  3. LexisNexis -> Red flags em registros publicos?
  4. SEON Fraud -> Pegada digital indica fraude?

DECISAO DE CREDITO
  -> Se engine passa: roda BlackBox (modelo de credito)
  -> Se BlackBox incerto: Plaid como segunda chance

PAGAMENTO
  -> Kount pre-autoriza transacao de cartao
```


## 6. Underwriting (Analise de Credito)

### O Que e Underwriting

Apos os checks de fraude passarem, o sistema avalia a **capacidade de credito** do cliente. Tres engines de decisao estao disponiveis:

| Engine | Descricao | Prioridade |
|--------|-----------|------------|
| **GDS** | Motor de decisao externo | 1 (se habilitado) |
| **Taktile** | Motor de decisao alternativo | 2 (se habilitado) |
| **ABB** | Motor de decisao padrao (BlackBox) | Default |

### Decisao de Rodar vs Reusar UW

| Condicao | Acao |
|----------|------|
| Lead status: NEW, EXPIRED, PENDING_UW, UW_DENIED, UW_ERROR | Roda UW novo |
| Dados de UW nao existem | Roda UW novo |
| Aprovacao expirada | Roda UW novo |
| Caso contrario | Reusa UW anterior |

### Skip UW (Bypass para Merchants Especificos)

Alguns merchants podem pular o UW inteiramente. Condicoes (TODAS devem ser verdadeiras):
- `clientType` na lista de skip-UW
- Threshold check nao requerido OU lead atende threshold
- Score check nao requerido OU lead tem score

Resultado do skip: `decision = "ACCEPT"`, `creditLimit = loanAmount`.

### Expiracao da Aprovacao

`approvalExpirationDate = hoje + merchant.numDaysApprovalExp dias`

### Selecao de Programa e Roteamento (13 vs 16 Meses) — Task #439

Apos a decisao de credito, o underwriting avalia **routing inputs** para determinar qual fluxo e programa usar:

**Routing Inputs:**
1. Presenca de dados bancarios (routing number + account number)
2. Elegibilidade do BIN do cartao de credito (primeiros 6 digitos)

**Cenarios de Roteamento:**

| Cenario | Condicao | Fluxo | Programa |
|---------|----------|-------|----------|
| 1 | Banking data presente **E** BIN elegivel | **Kornerstone** | Avalia 16 meses primeiro, fallback para 13 meses |
| 2 | Banking data ausente **OU** BIN nao elegivel | **UOWN** | Apenas 13 meses |

**Regras importantes:**
- Programas sao **pre-definidos** — o underwriting **seleciona**, nao constroi
- No cenario Kornerstone, se o programa de 16 meses nao atende os criterios (valor, estado, etc.), cai para 13 meses automaticamente
- A selecao de programa usa `planId` (novo formato) para identificar unicamente a combinacao frequencia + termo
- O `planId` e composto por: abreviacao da frequencia + termo em meses (ex: `WK13`, `BWK16`, `SM13`, `MN16`)

**Formato do planId:**

| Frequencia | Abreviacao | Exemplo 13m | Exemplo 16m |
|------------|------------|-------------|-------------|
| WEEKLY | WK | WK13 | WK16 |
| BI_WEEKLY | BWK | BWK13 | BWK16 |
| SEMI_MONTHLY | SM | SM13 | SM16 |
| MONTHLY | MN | MN13 | MN16 |

**Impacto no backend:**
- `planId` adicionado ao `SchedSummaryInfo`
- `setMerchantProgramForLead` removido do `UnderwritingService` (programas pre-selecionados)
- `buildScheduleForFrequency` agora gera `planId` = frequencia + termo
- `SubmitApplicationService` usa `planId` para localizar o `PaymentOption` correto
- Redirect URL atualizado para incluir `planId`

### Campanhas Peak/Off-Peak

Em producao, entre `peakStartHour` e `peakEndHour` usa `peakCampaignId`, senao usa `offPeakCampaignId`. Em ambientes de teste, sempre usa peak.

---

## 39. Validacao Pre-Assinatura (Missing Required Fields)

### O Que e

Servico **gatekeeper** que valida se todos os dados obrigatorios estao preenchidos antes de permitir que o cliente assine o contrato.

### Para Que Serve

Impede que contratos sejam assinados com dados incompletos, o que causaria problemas no funding e servicing.

### Campos Validados

| Campo | Condicao | Config |
|-------|----------|--------|
| Itens/Carrinho | Nao pode ser vazio (exceto merchants configurados) | `items.can.be.empty.for.merchant.*` |
| Valor da Invoice | Deve ser > $0 | Direto |
| Verificacao de ID | Requerido por merchant (Intellicheck/SEON) | Flag do merchant |
| Dados ACH | Routing + Account number se ACH habilitado | Flag do merchant |
| Verificacao Bancaria | Opcional mas configuravel por merchant | Flag do merchant |
| Dados CC | Requerido se pagamento CC habilitado | Flag do merchant |
| Data Primeiro Pagamento | Requerido por merchant | `isFpdRequired` |
| Emprego | Proximo pagamento + frequencia (se ACH) | Validacao |
| Frequencia de Pagamento | Selecao obrigatoria | `desiredPaymentFrequency` |
| NeuroID Check | Verificacao de fraude opcional | `useNeuroIdCheck` |
| Oferta de Seguro | Dependente do estado | `offer.insurance.in.states` |
| Item Split Payment | Divisao lease vs. compra imediata | `isItemSplit` |

### Como e Acionado

Chamado automaticamente durante o fluxo de assinatura:
- **Endpoint legado:** `GET /missing-fields/{shortCode}` (usa `selectedPaymentFrequency`)
- **Endpoint com planId (Task #439):** `GET /missing-fields/{shortCode}?planId={planId}` (aceita `planId` no lugar de `selectedPaymentFrequency`)

**Compatibilidade:** Ambos `selectedPaymentFrequency` e `planId` funcionam. O `planId` contem tanto a frequencia quanto o termo (ex: `WK13`), enquanto `selectedPaymentFrequency` contem apenas a frequencia (ex: `WEEKLY`).

### O Que Retorna

`RequiredFields` contendo: lista de campos faltantes, taxas calculadas, security deposit, data do primeiro pagamento, elegibilidade para seguro.

---

## 40. Valores Aprovados por Segmento de Risco

### O Que e

Sistema de **limites maximos de aprovacao** baseados no segmento de risco do cliente.

### Para Que Serve

Controla exposicao a risco. Clientes de alto risco recebem limites menores; clientes de baixo risco recebem limites maiores.

### Como Funciona

Dados carregados de arquivo CSV (`combined_approval_amounts.csv`):

| Campo | Descricao |
|-------|-----------|
| `lambdaSegment` | Segmento de risco 1-10 (1 = melhor) |
| `riskType` | PRIME, GOOD, FAIR, POOR, etc. |
| `maxApprovedAmountCR` | Valor maximo aprovado |

### Como Atualizar

```
POST /uown/loadApprovedAmountsFromExcel
```
Upload de novo arquivo CSV com limites atualizados.

### Impacto

O valor de aprovacao do cliente e limitado ao `maxApprovedAmountCR` do seu segmento. Afeta diretamente quanto o cliente pode financiar.

---

## 62. Continuacao e Finalizacao de Aplicacao

### 62.1 Continuacao de Aplicacao (Can Continue)

**O que e:** Verifica se uma aplicacao pode ser continuada, validando existencia do lead e requisitos pendentes.

**Logica de busca do lead:**
- Aceita UUID ou short code
- UUID e dividido no underscore e apenas a primeira parte e usada

**Verificacoes:**

| Verificacao | Resultado |
|-------------|-----------|
| Lead nao encontrado | `leadFound = false`, retorna |
| Merchant nao encontrado | Retorna incompleto |
| Cliente primario nao existe | Pode continuar (`canContinue = true`) |
| Cliente existe | Verifica elegibilidade para Plaid |

**Verificacao Plaid:**
- Depende do status do lead, flag `isPlaidVerificationRequired` do merchant, e dados de UW
- Se Plaid requerido e config habilitada, verificacao de telefone tambem e requerida

**Endpoint:** `POST /uown/los/canContinueApplication`

### 62.2 Finalizacao de Aplicacao

**O que e:** Recupera campos obrigatorios faltantes e envia comunicacoes de aprovacao.

**Campos de emprego verificados:**
- `nextPayDate` (proxima data de pagamento)
- `payFrequency` (frequencia salarial)
- `employer` (nome do empregador)

**Se lead DENIED:** Mensagem de nao aprovacao retornada, sem email/SMS enviado.

**Se lead aprovado:**
- **Email de aprovacao** enviado (sincrono ou assincrono, configuravel)
- **SMS de aprovacao** enviado se telefone com area code valido existir
- Formato do telefone: `areaCode + phoneNumber`

**Endpoint:** `GET /uown/los/getFinalApprovalDetails/{leadPk}`

---

## 64. Verificacao de Endereco (Melissa Data)

### O Que e

Servico de verificacao e padronizacao de enderecos usando o servico externo Melissa Data, com mecanismo de cache para evitar chamadas redundantes.

### Para Que Serve

Garante que enderecos fornecidos pelos clientes sao validos e padronizados conforme USPS. Enderecos invalidos podem indicar fraude ou causar problemas de entrega.

### Mecanismo de Cache

| Condicao | Acao |
|----------|------|
| Endereco nao verificado anteriormente | Executa Melissa Data |
| Verificacao existente, `lastRun` > 30 dias atras | Executa Melissa Data novamente |
| Verificacao existente, `lastRun` <= 30 dias atras | Retorna resultado em cache |

**Config:** `days.past.last.run` (default: 30 dias)

### Correspondencia de Endereco

Busca por quatro componentes:
- Street Address 1
- City
- State
- ZIP Code

---

## 65. Geolocalizacao por CEP

### O Que e

Servico que converte CEP (ZIP code) em informacao de condado (county) usando fonte externa.

### Para Que Serve

A informacao de condado e necessaria para calculo correto de impostos, pois nos EUA cada condado pode ter taxas diferentes. Tambem usado para compliance regulatorio.

### Como Funciona

- **Fonte:** `https://www.getzips.com/cgi-bin/ziplook.exe?Zip={zipcode}`
- **Parser:** JSoup para extrair condado do HTML retornado
- **Fallback:** Retorna `null` silenciosamente em caso de erro
- **Sem cache:** Cada consulta faz chamada HTTP

---

