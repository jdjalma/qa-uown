<!-- PT-BR: Árvore completa de diretórios do projeto e convenções de localização de arquivos. -->

# Project Structure

```
fintech-playwright/
├── .claude/
│   ├── agents/                        # 13 specialized subagents (see CLAUDE.md for catalog)
│   │   ├── subagent-spec-test.md
│   │   ├── subagent-fetch-task.md
│   │   ├── subagent-impl-e2e.md
│   │   ├── subagent-impl-api.md
│   │   ├── subagent-impl-api-client.md
│   │   ├── subagent-impl-page-object.md
│   │   ├── subagent-impl-db-validation.md
│   │   ├── subagent-refactor-page-object.md
│   │   ├── subagent-debug-flaky.md
│   │   ├── subagent-audit.md
│   │   ├── subagent-validate-results.md
│   │   ├── subagent-docs-update.md
│   │   └── subagent-data.md
│   ├── context/                       # Reference documentation
│   │   ├── INDEX.md
│   │   ├── project-overview.md
│   │   ├── project-structure.md       # (this file)
│   │   ├── architecture.md
│   │   ├── coding-standards.md
│   │   ├── test-patterns.md
│   │   ├── business-rules.md
│   │   ├── environments.md
│   │   └── glossary.md
│   ├── prompt/                        # Historical prompt journal
│   └── settings.local.json
│
├── src/
│   ├── api/
│   │   ├── clients/                   # BaseClient → domain clients
│   │   │   ├── base.client.ts
│   │   │   ├── application.client.ts
│   │   │   ├── invoice.client.ts
│   │   │   ├── lead.client.ts
│   │   │   ├── settlement.client.ts
│   │   │   ├── credit-card.client.ts
│   │   │   ├── scheduled-task.client.ts
│   │   │   ├── payment-arrangement.client.ts
│   │   │   ├── account.client.ts
│   │   │   ├── merchant.client.ts
│   │   │   ├── svc-contact.client.ts
│   │   │   ├── svc-phone.client.ts
│   │   │   ├── svc-email.client.ts
│   │   │   ├── svc-payoff.client.ts
│   │   │   ├── los-partner-auth.client.ts
│   │   │   ├── los-partner-application.client.ts
│   │   │   ├── ams.client.ts
│   │   │   ├── seon.client.ts
│   │   │   └── index.ts
│   │   ├── bodies/                    # Request payload interfaces/builders
│   │   │   └── index.ts
│   │   └── responses/                 # Response interfaces + ApiResponse<T>
│   │       └── index.ts
│   │
│   ├── config/
│   │   ├── environment.ts             # ConfigEnvironment per env
│   │   └── constants.ts               # Timeouts, test cards, SSN/phone generation
│   │
│   ├── support/
│   │   ├── base-test.ts               # Unified fixture + auto-hooks
│   │   ├── config.ts                  # TestConfig singleton
│   │   ├── browser-factory.ts         # 8 device profiles
│   │   ├── hooks.ts                   # CSS animations, screenshots, metadata
│   │   ├── custom-reporter.ts         # JSON summary reporter
│   │   └── index.ts
│   │
│   ├── pages/
│   │   ├── base.page.ts               # BasePage (spinner, toast, modal)
│   │   ├── login.page.ts              # LoginPage (shared)
│   │   ├── search.page.ts             # SearchPage (cross-portal)
│   │   ├── origination/               # OriginationBasePage → pages
│   │   │   ├── origination-base.page.ts
│   │   │   ├── customer.page.ts
│   │   │   ├── overview.page.ts
│   │   │   ├── contract.page.ts       # extends BasePage (consumer-facing)
│   │   │   ├── funding.page.ts
│   │   │   ├── lease-agreement.page.ts
│   │   │   ├── metrics-calculator.page.ts
│   │   │   ├── paytomorrow-portal.page.ts  # extends BasePage (external portal)
│   │   │   ├── paypair-portal.page.ts      # extends BasePage (PayPair/TireAgent portal)
│   │   │   ├── application-wizard.page.ts  # ApplicationWizardPage (consumer-facing)
│   │   │   ├── programs.page.ts            # ProgramsPage
│   │   │   ├── leads.page.ts               # LeadsPage
│   │   │   ├── merchant-setting.page.ts    # MerchantSettingPage
│   │   │   ├── error-log.page.ts           # ErrorLogPage
│   │   │   ├── open-to-buy.page.ts         # OpenToBuyPage
│   │   │   ├── new-application-filters.page.ts
│   │   │   ├── merchant-mod-history.page.ts
│   │   │   ├── modification-report.page.ts
│   │   │   └── index.ts
│   │   ├── servicing/                 # ServicingBasePage → pages
│   │   │   ├── servicing-base.page.ts
│   │   │   ├── customer.page.ts
│   │   │   ├── payment-transaction.page.ts
│   │   │   ├── ach-history.page.ts
│   │   │   ├── scheduled-payment.page.ts
│   │   │   ├── log.page.ts
│   │   │   ├── servicing-search.page.ts
│   │   │   ├── payment-arrangement.page.ts
│   │   │   ├── due-date-moves-history.page.ts
│   │   │   ├── frequency-changes-history.page.ts
│   │   │   ├── credit-card-history.page.ts
│   │   │   └── index.ts
│   │   ├── website/                   # WebsiteBasePage → pages
│   │   │   └── index.ts
│   │   └── ams/                       # AmsBasePage → AmsPage
│   │       ├── ams-base.page.ts
│   │       ├── ams.page.ts
│   │       ├── ams-user-merchants.page.ts
│   │       ├── ams-user-details.page.ts
│   │       └── index.ts
│   │
│   ├── helpers/
│   │   ├── common.helpers.ts          # waitForSpinner, toast, dropdown
│   │   ├── database.helpers.ts        # PostgreSQL pool, polling backoff
│   │   ├── email.helpers.ts           # IMAP OTP extraction + email link extraction (Gmail)
│   │   ├── date.helpers.ts            # calculateDate, addBusinessDays
│   │   ├── table.helpers.ts           # Table navigation, modifiers
│   │   ├── auth.helpers.ts            # Auth state helpers
│   │   ├── navigation.helpers.ts      # Navigation utilities
│   │   ├── signwell.helpers.ts        # SignWell e-sign helpers
│   │   ├── api-setup.helpers.ts       # setupApplicationViaApi, buildTestData
│   │   ├── test-data.helpers.ts       # Test data builders
│   │   ├── test-artifact.helpers.ts   # attachJson, report attachment helpers
│   │   ├── downloads.helpers.ts       # File download helpers
│   │   ├── worker-id.helper.ts        # Parallel worker ID utility
│   │   └── template-engine.ts         # JSON template interpolation
│   │
│   ├── data/
│   │   ├── merchants.ts               # 16 merchants catalog
│   │   ├── tire-agent.data.ts         # PayPair portal data (product, config, JSON builders)
│   │   ├── state-address-mapper.ts    # State → address mapping
│   │   └── test-accounts.ts           # Save/load test accounts
│   │
│   ├── fixtures/
│   │   ├── test-context.fixture.ts    # API test entry point
│   │   └── api-templates/             # JSON request templates
│   │       ├── submitApplication.json
│   │       └── ... (6 templates)
│   │
│   ├── selectors/
│   │   └── common.selectors.ts        # ALL CSS/XPath selectors
│   │
│   ├── types/
│   │   ├── enums.ts                   # Portal, LeadStatus, etc.
│   │   ├── payment.types.ts           # CreditCardInfo, TEST_CARDS
│   │   └── status.types.ts            # StatusType, isValidStatus
│
├── docs/taskTestingUown/                    # Task tests from GitLab issues (project: task-testing)
│   └── R1.49.1_implementEnvVariablesForIsProd_1228.spec.ts
│
├── tests/
│   ├── api/                           # API-only tests (no browser)
│   │   ├── new-application-api.spec.ts
│   │   ├── lease-cancellation-api.spec.ts
│   │   └── seon-id-verification-bypass.spec.ts
│   ├── e2e/                           # E2E browser tests
│   │   ├── origination/
│   │   │   ├── credit-card-decline-check.spec.ts
│   │   │   ├── lease-cancellation.spec.ts
│   │   │   ├── modify-approval-amount.spec.ts
│   │   │   ├── modify-lease.spec.ts
│   │   │   ├── new-application.spec.ts
│   │   │   └── protection-plan-cancellation.spec.ts
│   │   ├── paytomorrow-refund-flow.spec.ts    # Multi-portal (root e2e)
│   │   ├── tire-agent-unified-flow.spec.ts   # PayPair portal (root e2e)
│   │   ├── unified-flow.spec.ts              # Full lifecycle (root e2e)
│   │   ├── servicing/                 # (in development)
│   │   ├── website/                   # (in development)
│   │   └── ams/                       # (in development)
│   ├── ci/                            # CI-optimized tests
│   │   └── unified-flow.spec.ts
│   └── smoke/                         # Smoke tests
│       ├── new-application-funding.spec.ts
│       └── portal-flow.spec.ts
│
├── docs/
│   ├── adrs/                          # Architecture Decision Records
│   │   ├── ADR-001-playwright-typescript.md
│   │   ├── ADR-002-monorepo-4-portals.md
│   │   ├── ADR-003-page-object-model-hierarchy.md
│   │   ├── ADR-004-centralized-selectors.md
│   │   ├── ADR-005-api-client-baseclient.md
│   │   ├── ADR-006-exponential-backoff-polling.md
│   │   ├── ADR-007-postgresql-pg-pool.md
│   │   ├── ADR-008-imap-otp-extraction.md
│   │   ├── ADR-009-json-template-engine.md
│   │   ├── ADR-010-custom-json-reporter.md
│   │   ├── ADR-011-unified-fixture-base-test.md
│   │   └── ADR-013-app-source-integration.md
│   ├── business-rules/                # 11 chapters + 6 appendices (PT-BR)
│   ├── AGENTS.md
│   ├── PROJECT.md
│   └── TESTING.md
│
├── reports/                           # Generated (gitignored)
├── scripts/                           # Utilities
├── .auth/                             # Auth state (gitignored)
├── .mcp.json                          # Playwright MCP + Postman MCP
├── playwright.config.ts               # 12 projects
├── tsconfig.json                      # Strict, ESModules, path aliases
├── CLAUDE.md                          # Project instructions + orchestrator
└── README.md
```

## File Placement Conventions

| Type | Pattern | Location |
|------|---------|----------|
| Page object | `{name}.page.ts` | `src/pages/{portal}/` |
| API client | `{domain}.client.ts` | `src/api/clients/` |
| Request body | `{domain}.body.ts` | `src/api/bodies/` |
| Response type | `{domain}.response.ts` | `src/api/responses/` |
| Helper | `{domain}.helpers.ts` | `src/helpers/` |
| Task test | `{milestone}_{camelCaseTitle}_{number}.spec.ts` | `docs/taskTestingUown/` |
| E2E test | `{flow}.spec.ts` | `tests/e2e/{portal}/` |
| API test | `{flow}-api.spec.ts` | `tests/api/` |
| JSON template | `{actionName}.json` | `src/fixtures/api-templates/` |
| Enum/Type | `{domain}.types.ts` | `src/types/` |
| Selectors | `common.selectors.ts` | `src/selectors/` |
| ADR | `ADR-NNN-kebab-case.md` | `docs/adrs/` |
