# Environments & Configuration

> Ambientes, URLs, variáveis de ambiente, timeouts e projetos Playwright. Referenciado pelo CLAUDE.md.

---

## Ambientes suportados

| Ambiente | URL Pattern | DB Suffix |
|----------|-------------|-----------|
| `sandbox` | `*-sandbox.uownleasing.com` | `SBX` (fallback: `SANDBOX`) |
| `qa1` | `*-qa1.uownleasing.com` | `QA1` (fallback: `QA`) |
| `qa2` | `*-qa2.uownleasing.com` | `QA2` (fallback: `QA`) |
| `stg` / `staging` | `*-stg.uownleasing.com` | `STG` |
| `dev1` / `dev2` / `dev3` | `*-dev{N}.uownleasing.com` | `DEV{N}` |

## URLs por portal

| Portal | Pattern |
|--------|---------|
| Origination | `https://origination-{env}.uownleasing.com` |
| Servicing | `https://svc-website-{env}.uownleasing.com` |
| Website | `https://website-{env}.uownleasing.com` |
| AMS | `https://ams-website-{env}.uownleasing.com` |
| SVC API | `https://svc-{env}.uownleasing.com` |

---

## Variáveis de ambiente

**Loading order:** `.env` base → `.env.{env}` override. Todos gitignored.

**`.env` base (compartilhados):**
* `UOWN_API_KEY`, `UOWN_API_AUTHORIZATION` — API keys cross-environment
* `EMAIL`, `EMAIL_PASSWORD` — Gmail compartilhado para OTP
* `UOWN_DB_URL_{SUFFIX}`, `UOWN_DB_USER_{SUFFIX}`, `UOWN_DB_PASS_{SUFFIX}` — DB por ambiente
* Tokens: `ORIGINATION_TOKEN`, `PAYPAIR_TOKEN`, `FIVE9_TMS_API_KEY`, `GITLAB_TOKEN`
* Credit cards de teste: `CC_SUBSCRIPTION_*`, `SERV_CC_*`

**`.env.{env}` (por ambiente):**
* `ORIGINATION_URL`, `SERVICING_URL`, `WEBSITE_URL`, `AMS_URL`
* `{ROLE}_USERNAME`, `{ROLE}_PASSWORD` (admin, manager, readonly, merchant, supervisor, agent)
* **Nota:** `MERCHANT_USERNAME` difere — sandbox usa `wjunio.gow`, demais `AutotestMerchant`

**CI detection:** `CI=true` ou `GITHUB_ACTIONS` ou `JENKINS_URL` → headless, 1 retry, screenshots only-on-failure, trace on-first-retry.

---

## Timeouts

| Timeout | Valor | Multiplicável | Fonte |
|---------|-------|---------------|-------|
| Test global | 120s | Yes | `config.ts` |
| Action | 15s | Yes | `config.ts` |
| Navigation (PW config) | 30s | Yes | `config.ts` |
| Navigation (helper) | 15s | No | `constants.ts` |
| Spinner | 30s | No | `constants.ts` |
| Toast | 5s | No | `constants.ts` |
| Modal | 10s | No | `constants.ts` |
| DB poll | 100ms→2s (1.5x backoff) | No | `constants.ts` |
| DB wait total | 30s | No | `constants.ts` |
| Email OTP | 150s | No | `email.helpers.ts` |

---

## Projetos Playwright (12)

| Projeto | Diretório | Browser | Auth |
|---------|-----------|---------|------|
| `auth-origination` | `tests/` | Desktop Chrome | setup only |
| `auth-servicing` | `tests/` | Desktop Chrome | setup only |
| `origination-ui` | `tests/e2e/origination` | Chrome | `.auth/origination.json` |
| `servicing-ui` | `tests/e2e/servicing` | Chrome | `.auth/servicing.json` |
| `website-ui` | `tests/e2e/website` | Chrome | none |
| `ams-ui` | `tests/e2e/ams` | Chrome | none |
| `website-firefox` | `tests/e2e/website` | Firefox | none |
| `website-webkit` | `tests/e2e/website` | Safari/WebKit | none |
| `website-mobile-ios` | `tests/e2e/website` | iPhone 12 Pro | none |
| `website-mobile-android` | `tests/e2e/website` | Pixel 5 | none |
| `website-tablet` | `tests/e2e/website` | iPad Pro 11 | none |
| `api-only` | `tests/api` | nenhum | none |

---

## Scripts npm

```json
{
  "test": "npx playwright test",
  "test:origination": "npx playwright test --project=origination-ui",
  "test:servicing": "npx playwright test --project=servicing-ui",
  "test:website": "npx playwright test --project=website-ui",
  "test:ams": "npx playwright test --project=ams-ui",
  "test:api": "npx playwright test --project=api-only",
  "test:cicd": "npx playwright test --grep @cicd",
  "test:smoke": "npx playwright test --grep @smoke",
  "test:sanity": "npx playwright test --grep @sanity",
  "test:regression": "npx playwright test --grep @regression",
  "test:critical": "npx playwright test --grep @critical",
  "report": "npx playwright show-report reports/html",
  "report:summary": "cat reports/test-summary.json",
  "lint": "tsc --noEmit"
}
```

## CI e métricas

* Pipeline: `lint` → `test:cicd` → relatório HTML + JSON summary.
* Custom reporter gera `reports/test-summary.json`.
* Allure opcional (`ALLURE=true`).

---

## qa2 Known Issues

| Issue | Affected | Symptom | Notes |
|-------|----------|---------|-------|
| Backend slowness / hangs on `sendApplication` | Saslow's (`OW90337-0001`), Daniel's (`OL90205-0079`), some others | `sendApplication` times out at 300s or takes >180s for denied path | qa2 backend load issue, not a feature defect. Tests should use generous timeouts or `existingAccountPks` bypass. Confirmed 2026-05-06. |
| `MerchantConfigurator.configureByName` fails silently | Daniel's, Saslow, Dickinson, Kornerstone, FirstApp | Configurator returns 0 merchants; preflight skipped silently | `configureByName` sends lowercase `refCode` key but qa2 stores `ref_merchant_code` with original casing. Use `skipMerchantPreflight: true` or pass `merchant.number` directly. See `.claude/context/shared/common-operations.md § MerchantConfigurator`. |
| `makeCreditCardPayments` HTTP 500 FK violation | All merchants in qa2 | `DataIntegrityViolationException: constraint [fk_uown_cc_transaction_arrangement]` on new accounts | Active svc bug (pitfall #11 in application-lifecycle-protocol.md). No automation workaround. |
| `/v2/customers/search` HTTP 500 SQL error | All | `leadStatus` column not projected by mapper | Confirmed bug Task #510. Tests must expect potential 500 and skip rather than fail. |
