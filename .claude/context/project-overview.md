<!-- PT-BR: Visão geral do projeto — stack, portais, projetos Playwright e path aliases. -->

# Project Overview

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform.

## Stack

- **Playwright** `^1.50.0` + **TypeScript** `^5.6.0` strict
- **Node.js** ESModules (`"module": "NodeNext"`)
- **PostgreSQL** via `pg` (pool, polling with backoff)
- **Email**: IMAP via `imapflow` (Gmail OTP)
- **Reporters**: HTML, list, custom JSON, Allure (optional)

## 4 Portals

| Portal | URL Pattern | Tests |
|--------|-------------|-------|
| Origination | `origination-{env}.uownleasing.com` | `tests/e2e/origination/` |
| Servicing | `svc-website-{env}.uownleasing.com` | `tests/e2e/servicing/` |
| Website | `website-{env}.uownleasing.com` | `tests/e2e/website/` |
| AMS | `ams-website-{env}.uownleasing.com` | `tests/e2e/ams/` |
| SVC API | `svc-{env}.uownleasing.com` | `tests/api/` |

## 12 Playwright Projects

Auth: `auth-origination`, `auth-servicing`
Desktop: `origination-ui`, `servicing-ui`, `website-ui`, `ams-ui`
Cross-browser: `website-firefox`, `website-webkit`
Mobile: `website-mobile-ios`, `website-mobile-android`
Tablet: `website-tablet`
API: `api-only`

## Path Aliases

```
@config/* → src/config/*    @types/* → src/types/*      @data/* → src/data/*
@fixtures/* → src/fixtures/* @helpers/* → src/helpers/*   @pages/* → src/pages/*
@selectors/* → src/selectors/* @api/* → src/api/*        @support/* → src/support/*
```

## Origin

Migrated from `fintech-qaautomation` (Java/Cucumber).
