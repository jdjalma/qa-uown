---
name: fetch-gitlab-task
description: Carregue quando o input do user contém URL de issue do GitLab (https://*/issues/{iid}). Busca via API v4, extrai título/descrição/labels/comentários/milestone, classifica tipo de pipeline, gera test name padronizado.
disable-model-invocation: true
---

# Fetch GitLab Task

## Quando aplicar

Input do user contém URL do tipo `https://{host}/{project_path}/-/issues/{iid}`.

Padrão de detecção: regex `/-/issues/\d+`.

## Procedimento

### 1. Verificar token

```bash
test -n "$GITLAB_TOKEN" && echo OK || echo "MISSING — abort"
```

`GITLAB_TOKEN` deve estar em `.env`. Se ausente, **pare** e peça ao user.

### 2. Parse URL

```
https://{host}/{project_path}/-/issues/{iid}
```

`project_path` precisa URL-encode (`/` → `%2F`).

### 3. Fetch issue

```bash
curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://{host}/api/v4/projects/{encoded_path}/issues/{iid}"
```

Extraia:
- `title`
- `description`
- `labels[]`
- `milestone.title` (ex: `R1.49.1`)
- `assignee.name`
- `state`
- `web_url`
- `related_merge_requests`

### 4. Fetch comments

```bash
curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://{host}/api/v4/projects/{encoded_path}/issues/{iid}/notes?sort=asc"
```

Filtre `system=false` — só comentários humanos.

### 5. Classificar pipeline type

| Labels presentes | Pipeline sugerido |
|------------------|-------------------|
| `e2e`, `test`, `automation` | new-flow |
| `api`, `endpoint`, `integration` | new-api |
| `bug`, `flaky`, `broken` | debug |
| `refactor`, `tech-debt` | refactor |
| `docs`, `documentation` | docs |
| Sem match claro | custom |

### 6. Gerar test name

Convenção do projeto:

```
{milestone}_{camelCaseTitle}_{iid}
```

Exemplo: `R1.49.1_separateShortCodeInANewEntity_469`

camelCase rule:
- lowercase a primeira palavra
- capitalize a primeira letra de cada palavra subsequente
- remover spaces e special chars

File name idêntico + `.spec.ts`.

## Output esperado

```markdown
## Issue: {title}
- URL: {web_url}
- Labels: {labels}
- Milestone: {milestone}
- Issue Number: {iid}
- State: {state}
- Pipeline sugerido: {pipeline_type}

## Descrição
{description}

## ACs detectados
{listar ACs extraídos da descrição — se não tem AC explícito, FLAG: "task sem AC — não testar antes de definir com PO"}

## Comentários relevantes
{comentários humanos resumidos}

## Test naming
- describe: `{milestone}_{camelCaseTitle}_{iid}`
- file: `{milestone}_{camelCaseTitle}_{iid}.spec.ts`

## Próximo passo
Encaminhar para qa-planner com este contexto.
```

## DoR check (memory `project_qa_task_structure`)

Antes de prosseguir:

- AC explícito? Se não, **flag** "sem AC = não testa".
- Cenários definidos? Se não, agent vai gerar via [[scope-analysis]] + [[test-design-techniques]].
- DoD claro? Se não, flag — DoD do projeto exige QA + Staging + regressão.

## Pitfalls

- Token expirado retorna 401 → mensagem amigável.
- Issue privada sem acesso → 404 — peça ao user verificar perms.
- URL com fragmento `#note_123` → ignorar fragmento, usar só `/issues/{iid}`.

## Cross-links

- Memory: `project_qa_task_structure`
- Skill [[scope-analysis]] — consome este output
- Skill [[acceptance-criteria-review]] — analisa AC extraído
