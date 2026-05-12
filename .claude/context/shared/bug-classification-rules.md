# Bug Classification Rules — UOWN Leasing

> **Propósito:** prevenir classificação prematura de "Bug de Aplicação" por agents e flows diretos. Uma observação isolada num dado pré-existente é HIPÓTESE, não bug. Bug só depois de reprodução + checagem de task existente.
>
> **Aplicável a:** `subagent-validate-results`, `subagent-debug-flaky`, `/qa-flow`, `/new-*` commands, e análises diretas do Claude. **Não é opcional.**
>
> **Por que este arquivo existe:** um falso bug custa tempo do time de dev, polui relatórios e desgasta a relação entre QA e engenharia. No pipeline #491 (2026-04-21), uma "inconsistência crítica" (BUG-APP-A: arrangement=SUCCESS + parcelas=BLOCKED_ACCOUNT em account 11263) virou 4 horas de investigação + recomendação de fix ao dev antes de reproduzir em conta fresh — onde o comportamento foi CORRETO. Era artefato de fixture antiga, já coberta por uma task no backlog.

---

## Regra 1 — Não classifique como bug sem reprodução em dados fresh

Uma ocorrência isolada num registro pré-existente é **observação**, não bug.

- Para virar "Bug de Aplicação" exige reprodução em **conta/lead/dado criado do zero pela própria execução do teste** (preferencialmente) ou em dados fresh do dia corrente.
- Se não reproduziu em fresh data → classificar como `INVESTIGAR` ou `OBSERVAÇÃO A CONFIRMAR`, nunca "bug".
- Se o caso foi observado em registro pré-existente (fixture antiga, seed data, conta manual do QA), a suspeita vale mas exige:
  1. Tentativa de reprodução em conta criada pelo próprio teste, OU
  2. Confirmação no código-fonte de inconsistência determinística (não apenas correlação circunstancial).

---

## Regra 2 — Distinguir artefato de teste vs. defeito de produção

**Indicadores de artefato (não é defeito de produção):**

- `agent='SYSTEM'` em todo o histórico do registro
- PK em faixa conhecida de fixtures (criadas por smoke collection, seed scripts)
- Activity log dominado por `SYSTEM` com revisões humanas esparsas
- Lead criado via Postman collection / automation helper
- Uso de test bank (`routing=123456780`, `account=160781900000`, etc.)
- Nome do cliente no padrão `TestFN<hash>`, `TestLN<hash>`
- Datas do registro > 24 horas antes da execução atual (dado herdado)

**Protocolo:** Se 2 ou mais indicadores presentes → **assumir artefato** até prova em contrário. Reproduzir em dados fresh antes de classificar como bug.

---

## Regra 3 — Checar task/issue existente ANTES de reportar

Antes de escrever seção `## Bugs de Aplicação Encontrados` ou recomendar fix:

1. **Perguntar ao usuário:** "Existe task/issue aberta validando este comportamento?"
2. **Buscar no GitLab** (usar `subagent-fetch-task` se aplicável): filtrar por labels `workflow::ready-for-qa`, `type::bug`, `validation`, `flaky`; buscar por palavra-chave do módulo envolvido.
3. Se houver task/issue existente → NÃO criar novo report; apenas referenciar no texto (`> Observação: comportamento já rastreado em #NNN`).

---

## Regra 4 — NÃO recomendar fix de código em evidência única

Sugestões de código (`entityManager.clear()`, JPA hints, refactors de service) são aceitas SOMENTE quando:

- Bug reproduzido ≥ 2 vezes de forma independente, OU
- Análise estática do código prova inconsistência determinística (não apenas plausibilidade de race condition), OU
- Usuário solicita explicitamente "me dê sugestão de fix".

Caso contrário → apenas descrever sintoma + evidência + handoff: "cabe investigação do time de dev".

---

## Regra 5 — Linguagem conservadora em relatórios

Preferir descrição sobre afirmação; hipótese sobre certeza.

| ❌ Não aceito | ✅ Preferido |
|---------------|--------------|
| "BUG-01 (Critical): dispatcher não popula `data_map`" | "Observação: dispatcher registra `correspondence_logs.error="..."`. Cabe investigação — pode ser deployment gap, dado inconsistente em qa2, ou defeito real" |
| "Confirmado: arrangement termina SUCCESS com parcelas BLOCKED" | "Observado 1x em account 11263. Reprodução em conta fresh (11391) mostra comportamento correto (FAILED). Possível race condition intermitente OU artefato de fixture antiga — investigar antes de classificar" |
| "Causa raiz: cache JPA stale" | "Hipótese técnica: potencial stale read entre múltiplos `@TransactionalEventListener(AFTER_COMMIT)` concorrentes. Requer reprodução controlada para confirmar" |

---

## Checklist obrigatório antes de escrever `## Bugs de Aplicação Encontrados`

- [ ] Reproduzi o comportamento em dado fresh criado pelo próprio teste?
- [ ] Verifiquei se existe task/issue aberta para o caso (pergunta ao user + busca GitLab)?
- [ ] Descartei os indicadores de artefato de fixture antiga?
- [ ] Tenho ≥ 2 ocorrências independentes OU prova estática de inconsistência determinística?
- [ ] Classificação reflete o nível real de confiança (observação ≠ bug)?

**Se qualquer resposta for NÃO → rebaixar para `> Observação: ...` no cenário relevante e NÃO incluir na seção de bugs.**

---

## Exemplos (lições do projeto)

### ✅ Caso correto — BUG-01 do pipeline #491

- Comportamento: `correspondence_logs.error = "No data associated with correspondence request"` bloqueando enfileiramento.
- **Reprodução em fresh:** testado com account 11386 (UOWN fresh) + 11403 (Kornerstone fresh) — MESMO erro nas duas.
- **Task existente:** perguntado ao user — não havia task conhecida.
- **Código:** `CorrespondenceService.createCorrespondence()` visivelmente depende de `CommonDataPojo` populado pela query SQL do template; query retornando 0 rows é inconsistência determinística observável.
- **Veredicto:** Bug legítimo — reproduzível, sem task prévia, causa estática identificada.

### ❌ Caso incorreto — BUG-APP-A do pipeline #491

- Comportamento: `arrangement=SUCCESS` + parcelas `BLOCKED_ACCOUNT` em account 11263.
- **Reprodução em fresh:** NÃO fui testar antes de classificar como "Critical". Quando fui (account 11391), comportamento foi CORRETO (arrangement=FAILED).
- **Task existente:** NÃO perguntei ao user. Depois revelado que havia task de validação no backlog.
- **Código:** Hipótese de "cache JPA stale" baseada em especulação sobre timing — não prova determinística.
- **Veredicto:** Classificação prematura. Era artefato + bug já rastreado. Recomendação de fix desnecessária.

---

## Como agents devem sinalizar

Ao escrever relatórios, usar tags de confiança explícitas:

```markdown
### [CONFIRMADO] BUG-01 — Título
[quando passou o checklist completo]

### [OBSERVAÇÃO] Comportamento X
[quando faltou reproduzir em fresh OU usuário confirma task aberta — NÃO vai em seção de bugs]

### [HIPÓTESE] Possível race condition em Y
[quando evidência é plausível mas única — NÃO vai em seção de bugs]
```

Apenas `[CONFIRMADO]` entra em `## Bugs de Aplicação Encontrados`. `[OBSERVAÇÃO]` e `[HIPÓTESE]` vão como footnotes nos cenários.
