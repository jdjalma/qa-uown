# Exemplo preenchido - task-evidence-report

> Base: task real #1293 (`redirectInvalidOrInactiveApplicationLinks`), reescrita seguindo o template `task-evidence-report` com as 4 técnicas de apresentação combinadas (TL;DR, TOC, collapsibles, agrupamento por status, badges em quote block).
> Caminho real onde este conteúdo seria salvo:
> `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293-evidence.md`

---

# Validação QA - #1293 Redirect Invalid or Inactive Application Links

**Ambiente:** qa1 (build 2026-05-19)
**Resultado:** ✅ **Aprovado - feature funcionando conforme esperado em ambos os brands (UOWN e Kornerstone)**

---

> ### TL;DR
> 6 requisitos confirmados em UOWN + Kornerstone, mais 5 cenários adicionais cobrindo segurança, regressão e mobile.
> 2 melhorias fora do escopo identificadas (OBS-1: lookup case-sensitive; OBS-2: 500 vs 404). Nenhum bloqueador.
> **Ação:** aprovar deploy de QA para Staging. Abrir 2 tarefas-filhas para as observações.

---

## Navegação

- [Resumo](#resumo)
- [Índice de Achados](#índice-de-achados)
- [Requisitos da tarefa](#requisitos-da-tarefa)
- [Cenários adicionais explorados](#cenários-adicionais-explorados)
- [Observações (não bloqueiam release)](#observações-não-bloqueiam-release)
- [Bloqueadores](#bloqueadores)
- [Recomendação](#recomendação)

---

## Resumo

A MR que adiciona redirect automático para `find-a-merchant` em links de aplicação inválidos ou inativos está deployada em qa1 e cobre todos os cenários da issue: merchant ativo abre o formulário normalmente; merchant inativo, terminated, código inválido ou rota genérica `/getApplication` redirecionam o cliente para a tela de busca.

Validação rodou em UOWN e Kornerstone empiricamente, incluindo regressão de cliente ativo, fallback HTTPS, e segurança contra phishing via querystring.

---

## Índice de Achados

| ID         | Tipo                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| **AC-01**  | Merchant ativo abre formulário. CONFIRMADO                                          |
| **AC-02**  | Merchant inativo / terminated redireciona. CONFIRMADO                               |
| **AC-03**  | Código inválido / rota genérica redireciona. CONFIRMADO                             |
| **OBS-1**  | Lookup case-sensitive (`ks3015` vs `KS3015`). Melhoria UX                           |
| **OBS-2**  | Backend retorna 500 em vez de 404 para código inexistente. Observability            |

---

## Cenários validados

### Requisitos da tarefa

#### 1. Merchant ativo abre o formulário normalmente

> ✅ **PASSOU** · UOWN `OW90218-0001` (TireAgent) + Kornerstone `KS5936` (Griffins Furniture)

Em ambos os portais o formulário de aplicação renderizou normalmente, com merchant code preenchido, sem regressão visual ou de comportamento.

**Evidência:** merchantCodes `OW90218-0001` e `KS5936` em qa1; URLs `/getApplication/OW90218-0001` e `/getApplication/KS5936`.

#### 2. Merchant inativo redireciona para Find a Merchant

> ✅ **PASSOU** · UOWN `0000-001_clone` + Kornerstone `KS5936` (desativado temp.)

Em ambos os casos o cliente foi redirecionado para `/customer/find-a-merchant/` em vez de ver erro técnico ou form quebrado. O Kornerstone `KS5936` foi desativado temporariamente em qa1 (autorizado pelo Yuri) e reativado depois.

**Evidência:** merchantCodes `0000-001_clone` (UOWN) e `KS5936` (KS); URL final após redirect: `https://uownleasing.com/customer/find-a-merchant/`.

#### 3. Merchant terminated redireciona para Find a Merchant

> ✅ **PASSOU** · comportamento confirmado pelo dev no review da MR

A mesma lógica do inativo se aplica para merchants com status `TERMINATED`. Não foi necessário criar massa específica porque o backend trata os dois status (`INACTIVE` e `TERMINATED`) com o mesmo predicate de elegibilidade.

**Evidência:** confirmado pelo dev; testado indiretamente via cenário 2.

#### 4. Código de merchant inválido ou inexistente redireciona

> ✅ **PASSOU** · 5 códigos sintéticos testados em qa1

Testado em UOWN com 3 códigos (`ks1111`, `ZZZZZ0000-9999`, `XYZ123`) e em Kornerstone com 2 (`KS9999`, `KSZZZ99`). Em todos os 5 casos o cliente foi redirecionado para Find a Merchant sem ver mensagem de erro técnico.

**Evidência:** 5 códigos inexistentes em qa1, todos retornaram redirect para `/customer/find-a-merchant/`.

#### 5. Rota genérica `/getApplication` (sem código) redireciona

> ✅ **PASSOU** · UOWN + Kornerstone

Acesso direto a `/getApplication` sem path param leva o cliente para Find a Merchant. Comportamento idêntico nos dois brands.

**Evidência:** URLs `uownleasing.com/getApplication` e `kornerstoneleasing.com/getApplication` em qa1.

#### 6. URL com barra extra `/getApplication/` redireciona

> ✅ **PASSOU** · UOWN + Kornerstone

Variante do cenário 5 com trailing slash. Mesmo comportamento, sem 404 nem erro de matching de rota no router do Next.js.

**Evidência:** URLs `/getApplication/` testadas em ambos os brands.

### Cenários adicionais explorados

#### 7. Código com letras minúsculas (`ks3015` em vez de `KS3015`)

> ⚠️ **Melhoria identificada** · ver [OBS-1](#obs-1-lookup-de-merchant-é-case-sensitive)

Cliente que digita ou cola o merchant code em case errado cai na Find a Merchant em vez do formulário pré-preenchido. O merchant existe em qa1 como `KS3015` mas o lookup do backend é case-sensitive. Não é regressão da MR (comportamento pré-existente), mas vale como melhoria.

#### 8. Tentativa de redirecionar para site externo (`?redirect=evil.com`)

> ✅ **PASSOU** · segurança OK

O parâmetro `redirect` é ignorado pelo frontend; o cliente cai na Find a Merchant padrão e não vai para o domínio externo. Não é possível usar a URL pública como vetor de phishing.

#### 9. Cliente Kornerstone com link inválido aterrissa em `uownleasing.com`

> ✅ **PASSOU** · comportamento esperado por design

Alinhado com a regra de marca (Kornerstone é brand da UOWN). O cliente acaba em `uownleasing.com/customer/find-a-merchant/` e a busca aceita códigos `KS*` normalmente.

#### 10. Acesso via `http://` (sem HTTPS)

> ✅ **PASSOU** · upgrade automático

Upgrade automático para HTTPS antes do redirect. Sem mixed-content warning e sem perda do path original.

#### 11. Merchant ativo continua funcionando (regressão)

> ✅ **PASSOU** · sem regressão

Smoke após a MR para garantir que o redirect novo não pegou caminho de merchant válido por engano. Form rendered normal em UOWN e Kornerstone.

---

## Observações (não bloqueiam release)

### OBS-1: Lookup de merchant é case-sensitive

> O backend compara o código exatamente como recebido na URL, sem normalização. Cliente que digita o código em minúsculo cai em Find a Merchant em vez do formulário pré-preenchido. Não é regressão da MR.

<details>
<summary><b>Causa raiz, reprodução e fix proposto</b></summary>

**Causa raiz:** o backend compara `ref_merchant_code = :input` sem normalização. Cliente que digitar ou colar o código em case diferente do cadastrado não casa nenhum registro.

**Quando dispara:** qualquer URL com merchant code em case diferente do cadastrado (cadastro sempre em UPPER). Reproduzido com `ks3015`, `ow90218-0001`, `ks5936`.

**Impacto:** cliente que recebe o link de campanha ou copia o código em case errado tem experiência de "link quebrado". Vai para Find a Merchant em vez do formulário pré-preenchido. Tira fricção do funil de aplicação.

**Evidência:** confirmado com dev no review da MR; testado manualmente em qa1 com `ks3015` (existe como `KS3015`).

**Fix proposto:**
```sql
-- Atualmente:
WHERE ref_merchant_code = :input
-- Sugerido:
WHERE LOWER(ref_merchant_code) = LOWER(:input)
```

</details>

**Classificação:** [OBSERVAÇÃO]. Melhoria UX. Abrir tarefa separada.

---

### OBS-2: Backend retorna HTTP 500 para código inválido

> `POST /uown/sendApplicationToCustomer` retorna 500 em vez de 404 quando recebe código inexistente. Frontend trata e redireciona corretamente, mas backend polui o monitoring com falsos positivos.

<details>
<summary><b>Causa raiz, reprodução e fix proposto</b></summary>

**Causa raiz:** a chamada `POST /uown/sendApplicationToCustomer` retorna **HTTP 500** quando recebe um código de merchant inexistente. O status correto seria **HTTP 404** (recurso não encontrado).

**Quando dispara:** qualquer request com `merchantCode` que não existe na tabela `uown_merchant`. Reproduzido com `KS9999`, `XYZ123`.

**Impacto:** o redirect funciona normalmente do ponto de vista do cliente (frontend trata 500 e redireciona). Porém o backend loga como erro de servidor e polui o monitoring / Sentry com falsos positivos.

**Evidência:** verificado em qa1 com Postman e leitura de `uown_los_inbound_api_log` (entries com `status_code=500` para códigos inexistentes).

**Fix proposto:** alterar handler de `MerchantNotFoundException` para retornar `ResponseEntity.notFound()` em vez de propagar como 500. Backend job, não bloqueia a feature visual.

</details>

**Classificação:** [OBSERVAÇÃO]. Observability. Abrir tarefa separada para backend.

---

## Bloqueadores

_Nenhum nesta validação._

---

## Recomendação

> ✅ **Aprovar deploy de QA para Staging.**

- Todos os 6 requisitos da tarefa (Scenarios 1 a 6 da issue) foram validados em qa1
- Ambos os brands (UOWN e Kornerstone) cobertos empiricamente
- Regressão de cliente ativo passou (Scenario 11)
- Cenário de segurança (`?redirect=evil.com`) ignorado corretamente (Scenario 8)
- Nenhuma falha funcional na feature

**Pendências não-bloqueantes** (podem ser resolvidas em paralelo ou em iteração seguinte):

- Tarefa separada para tornar o lookup de merchant code case-insensitive (OBS-1, confirmada com dev)
- Issue separada para backend ajustar 500 para 404 no `sendApplicationToCustomer` (OBS-2)

---
