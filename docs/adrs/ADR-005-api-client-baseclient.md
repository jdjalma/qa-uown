<!-- PT-BR: Decisão de usar BaseClient + ApiResponse<T> como padrão para API clients tipados. -->

# ADR-005: API Clients with BaseClient and ApiResponse\<T\>

## Status
Accepted

## Date
2025-02-01

## Context
Tests need to interact with UOWN platform REST APIs to: create applications, send invoices, change lead statuses, authorize credit cards, etc. Each endpoint requires authentication headers (Authorization + 4 API key variants) and consistent response handling.

Options considered:
- **Playwright `request` directly**: no abstraction, headers repeated on each call
- **Utility functions**: less repetition, but no response typing
- **Base class with domain clients**: complete typing, auto-injected headers, extensible

## Decision
**BaseClient → domain client** pattern with `ApiResponse<T>` wrapper:

```typescript
class BaseClient {
  constructor(request, env, { host: 'svc' | 'origination' })
  protected post<T>(path, body): Promise<ApiResponse<T>>
  protected get<T>(path): Promise<ApiResponse<T>>
  withHeader(name, value): this  // chainable
}

interface ApiResponse<T> {
  ok: boolean; status: number; statusText: string;
  headers: Record<string, string>; body: T; raw: APIResponse;
}
```

Each domain client extends BaseClient and defines typed methods. Host determines base URL: `svc-{env}.uownleasing.com` or `origination-{env}.uownleasing.com`.

## Consequences

**Positive:**
- Auth headers injected automatically — never forgotten
- Typed responses — autocomplete and compile-time validation
- `ApiResponse<T>` standardizes access to status, body, headers
- New clients follow the same pattern (simple extension)

**Negative:**
- Each new endpoint requires: client + response type + body type + barrel exports
- More files than inline approach

**Mitigations:**
- `subagent-impl-api-client` agent automates creation
- JSON templates in `src/fixtures/api-templates/` simplify complex bodies
- Barrel exports keep imports clean

## References
- `src/api/clients/base.client.ts`
- `src/api/responses/`, `src/api/bodies/`
- `src/helpers/template-engine.ts`
