# Onboarding QA — UOwn Leasing

---

## 1. O Produto

UOwn é uma plataforma fintech de **Lease-to-Own** (aluguel com opção de compra). O sistema opera através de **4 portais**:

| Portal | Função |
|--------|--------|
| **Origination** | Pipeline de aplicação — do lead ao funding (17 etapas) |
| **Servicing** | Gestão de contas ativas — pagamentos, modificações, cancelamentos |
| **Website** | Portal do cliente — login, pagamentos, visualização |
| **AMS** | Administração — gestão de usuários e merchants |

O backend é **Java 17 + Spring Boot + PostgreSQL**. A documentação de regras de negócio cobre **69+ seções** em [docs/business-rules/](business-rules/), incluindo: pipeline de aplicação, underwriting, contratos e e-sign, cálculos financeiros, pagamentos (CC/ACH), funding, inadimplência, e mais.

---

## 2. Processo de Trabalho do QA

O fluxo de trabalho segue estas etapas:

### a) Refinamento

- Participamos das calls de refinamento para entender o escopo da tarefa
- Anoto tudo que é dito durante a call
- Se fica alguma dúvida, pergunto na própria call. Se ainda ficar, envio para os responsáveis(indianas) depois

### b) Recebimento da tarefa

- Os devs entregam a tarefa marcada como pronta, contendo os **passos de teste**

### c) Análise manual

- Faço o processo manualmente seguindo os passos de teste
- Valido **persistência no banco de dados** — isso me permite descobrir tabelas novas e avaliar o impacto da alteração

### d) Criação de cenários com IA

- Pego o conteúdo da tarefa + as informações da minha análise e envio para a IA
- Peço para gerar cenários de teste considerando:
  - O conteúdo da tarefa
  - As regras de negócio documentadas ([docs/business-rules/](business-rules/))
  - O projeto de backend (svc)
  - O projeto que a tarefa contempla (origination, servicing, etc.)

### e) Revisão dos cenários

- Releio todos os cenários gerados pela IA
- Valido se cobrem os requisitos da tarefa e as descobertas da análise manual

### f) Execução paralela

- Quando os cenários cobrem tudo, peço para a IA **criar e executar os testes automatizados**
- Simultaneamente, faço os **testes manuais** usando o documento de cenários como guia

### g) Análise de resultados

- Analiso os resultados do meu teste manual
- Leio o relatório de teste gerado pela IA

### h) Relatório na tarefa

- Trato o relatório e insiro na tarefa do GitLab
- Formato: padrão próprio do projeto (definido em `.claude/context/shared/e2e-test-report-standard.md`)
- **Não usamos Gherkin/Cucumber** — migramos de Selenium+Cucumber para Playwright e não adicionamos a camada de Cucumber porque não é utilizada pela equipe de desenvolvimento

---

## 3. O Projeto de Testes Automatizados

### Stack

- **Playwright** `^1.50.0` — automação de browser + testes de API
- **TypeScript** `^5.6.0` (strict mode) — tipagem forte
- **PostgreSQL** via `pg` — validação de persistência
- **IMAP** via `imapflow` — extração de OTP de emails
- **Allure** — relatórios estendidos
- **GitLab CI** — integração contínua

### Estrutura

```
automation/
├── src/
│   ├── api/          → 19 clientes REST tipados + bodies + responses
│   ├── pages/        → Page Objects por portal (herança hierárquica)
│   ├── support/      → Fixtures, hooks, reporter customizado
│   ├── config/       → Configuração de ambiente, constantes
│   ├── helpers/      → Database, email, datas, tabelas, navegação
│   ├── selectors/    → Seletores CSS/XPath centralizados
│   ├── data/         → Dados de teste (merchants, cartões, estados)
│   └── types/        → Enums e interfaces
├── tests/
│   ├── e2e/          → Testes de browser (por portal)
│   ├── api/          → Testes API-only (sem browser)
│   ├── ci/           → Testes críticos para CI/CD
│   ├── smoke/        → Smoke tests
│   └── taskTestingUown/  → Testes vinculados a tarefas do GitLab (300+)
├── docs/
│   ├── business-rules/   → Regras de negócio (12 capítulos + 6 apêndices)
│   └── taskTestingUown/  → Relatórios persistentes por tarefa
└── .claude/
    ├── agents/       → 13 subagentes de IA especializados
    ├── context/      → Documentação de referência para agentes
    ├── commands/     → Comandos slash (/qa-flow)
    └── rules/        → Regras por domínio
```

### Como cada teste funciona

Todo teste recebe automaticamente via fixtures (`src/support/base-test.ts`):

| Fixture | O que fornece |
|---------|---------------|
| `testEnv` | URLs, credenciais, config do banco para o ambiente |
| `api` | 19 clientes API tipados prontos para uso |
| `db` | Pool PostgreSQL com polling (`waitForRecord()`) |
| `email` | Extração de OTP via IMAP |
| `ctx` | Estado compartilhado entre steps (leadPk, accountNumber, etc.) |
| `page` | Página do Playwright com screenshot automático em falha |

Validação em **3 camadas**:

1. **Payload/Response** — status HTTP + campos do body
2. **Banco de dados** — query na tabela, verifica registros criados/alterados
3. **UI** — navega na página, verifica renderização

### Ambientes disponíveis

`sandbox` (default), `qa1`, `qa2`, `stg`, `dev1`, `dev2`, `dev3`

### Testes por tarefa (Task Testing)

Cada tarefa do GitLab gera um diretório em `docs/taskTestingUown/` seguindo a convenção:

```
{milestone}_{camelCaseTitle}_{issueNumber}
Exemplo: R1.49.1_separateShortCodeInANewEntity_469
```

Contendo:

- `{testName}.spec.ts` — arquivo de teste
- `{testName}-report.md` — relatório persistente de execução

### Agentes de IA

O projeto usa **13 subagentes especializados** orquestrados pelo `CLAUDE.md`. Cada um tem função atômica:

| Agente | O que faz |
|--------|-----------|
| `subagent-fetch-task` | Busca issue do GitLab, extrai requisitos |
| `subagent-spec-test` | Gera SPEC de teste (cenários, dados, validações) |
| `subagent-impl-e2e` | Implementa teste E2E a partir do SPEC |
| `subagent-impl-api` | Implementa teste API-only |
| `subagent-impl-page-object` | Cria page object novo |
| `subagent-impl-api-client` | Cria client API tipado |
| `subagent-validate-results` | Executa teste e gera relatório |
| `subagent-debug-flaky` | Diagnostica e corrige testes instáveis |
| `subagent-docs-update` | Atualiza documentação (sempre por último) |

Esses agentes rodam em **pipelines** conforme o tipo de tarefa:

| Tipo | Pipeline |
|------|----------|
| `new-flow` | spec → artefatos → teste → validação → docs |
| `new-api` | spec → client → teste → validação → docs |
| `debug` | debug-flaky → audit → validate → docs |
| `qa-flow` | Fluxo completo de QA em 10 fases (comando `/qa-flow`) |

---

## 4. Resumo do fluxo ponta a ponta

```
Refinamento → Tarefa pronta (devs) → Análise manual (banco + impacto)
    → IA gera cenários (task + business rules + backend)
    → Revisão dos cenários
    → Execução paralela (IA = automatizado | QA = manual)
    → Análise de resultados (manual + relatório IA)
    → Relatório inserido na tarefa
```
