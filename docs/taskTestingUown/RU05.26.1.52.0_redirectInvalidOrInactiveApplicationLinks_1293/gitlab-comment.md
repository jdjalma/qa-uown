# Validação QA — #1293 Redirect Invalid or Inactive Application Links

**Ambiente:** qa1 (build 2026-05-19)
**Data:** 2026-05-20
**Resultado:** ✅ **Aprovado — feature funcionando conforme esperado em ambos os brands (UOWN e Kornerstone)**

---

## Cenários validados

### Requisitos da tarefa — todos cobertos


| #   | Cenário                                                   | UOWN                                 | Kornerstone                                              | Resultado |
| --- | --------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- | --------- |
| 1   | Merchant ativo abre o formulário normalmente              | `OW90218-0001` (TireAgent)           | `KS5936` (Griffins Furniture)                            | ✅         |
| 2   | Merchant **inativo** redireciona para Find a Merchant     | merchant `0000-001_clone`            | `KS5936` (desativado temporariamente em qa1, autorizado) | ✅         |
| 3   | Merchant **terminated** redireciona para Find a Merchant  | mesma lógica do inativo              | mesma lógica do inativo                                  | ✅         |
| 4   | Código de merchant **inválido / inexistente** redireciona | `ks1111`, `ZZZZZ0000-9999`, `XYZ123` | `KS9999`, `KSZZZ99`                                      | ✅         |
| 5   | Rota genérica `/getApplication` (sem código) redireciona  | testado                              | testado                                                  | ✅         |
| 6   | URL com barra extra `/getApplication/` redireciona        | testado                              | testado                                                  | ✅         |


### Cenários adicionais explorados


| #   | Cenário                                                            | Resultado                                            | Observação                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Código com letras minúsculas (`ks3015` em vez de `KS3015`)         | Redireciona para Find a Merchant                     | **Melhoria identificada** (confirmada com dev): backend é case-sensitive — cliente que digitar o código em minúsculo cai na busca em vez do formulário do merchant correto. Não bloqueia esta tarefa. |
| 8   | Tentativa de redirecionar para site externo (`?redirect=evil.com`) | ✅ Ignorado, vai para Find a Merchant                 | Segurança OK — não dá pra usar a URL para phishing                                                                                                                                                    |
| 9   | Cliente Kornerstone com link inválido                              | ✅ Cai em `uownleasing.com/customer/find-a-merchant/` | Comportamento correto — Kornerstone é marca da UOWN                                                                                                                                                   |
| 10  | Acesso via `http://` (sem HTTPS)                                   | ✅ Upgrade automático para HTTPS + redirect           | OK                                                                                                                                                                                                    |
| 11  | Merchant ativo continua funcionando (regressão)                    | ✅ Formulário renderiza normalmente                   | Sem regressão                                                                                                                                                                                         |


---

## Achados para discuss car perdidos.
→ **Confirmado com dev como melhoria.** Sugestão: abrir tarefa separada para tornar o lookup case-insensitive (`LOWER(ref_merchant_code) = LOWER(input)`).

### Fora do escopo da tarefa — recomendação de issue separada para backend

**2. Endpoint retorna erro 500 para código inválido**
A chamada `POST /uown/sendApplicationToCustomer` retorna **HTTP 500** quando recebe um código de merchant inexistente. O correto seria **HTTP 404** (não encontrado). O redirect funciona normalmente do ponto de vista do cliente, mas isso polui o monitoring/Sentry com falsos positivos de "erro de servidor".
→ Sugestão: abrir tarefa separada para o time de backend ajustar o status code.

---

## Recomendação

**Aprovar deploy de QA → Staging.**

- Todos os requisitos da tarefa (Scenarios 1–4 da issue) foram validados em qa1
- Ambos os brands (UOWN e Kornerstone) cobertos empiricamente
- Regressão de cliente ativo passou
- Nenhuma falha funcional na feature

**Pendências não-bloqueantes** (podem ser resolvidas em paralelo ou em iteração seguinte):

- Tarefa separada para tornar o lookup de merchant code case-insensitive (melhoria confirmada com dev)
- Issue separada para backend ajustar 500 → 404 no `sendApplicationToCustomer`

---

## Evidência técnica

Spec, código de teste e relatório detalhado estão em:

- `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/`

