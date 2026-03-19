---
paths:
  - "src/api/**/*.ts"
---

# API Client Rules

## Structure

```
❌ API client without extending BaseClient
❌ Hardcoded URLs or headers — inherit from BaseClient
❌ Raw fetch() or axios — always use BaseClient.request()
❌ Untyped response — every method must have a typed return interface
❌ Import from internal files — use barrel exports

✅ Placement: src/api/clients/{domain}.client.ts
✅ Request bodies: src/api/bodies/{domain}.body.ts
✅ Response interfaces: src/api/responses/{domain}.response.ts
✅ Barrel export in src/api/clients/index.ts
✅ Add to ApiClients interface in src/support/base-test.ts
```

## Client Template

```typescript
import { BaseClient } from '../base-client.js';
import type { SomethingBody } from '../bodies/something.body.js';
import type { SomethingResponse } from '../responses/something.response.js';

export class SomethingClient extends BaseClient {
  async doAction(body: SomethingBody): Promise<SomethingResponse> {
    return this.request<SomethingResponse>('POST', '/uown/svc/doAction', { body });
  }
}
```

## Definition of Done

- Extends `BaseClient`
- Typed body interface (in `bodies/`)
- Typed response interface (in `responses/`)
- Barrel export in `src/api/clients/index.ts`
- Added to `ApiClients` in `base-test.ts`
- `tsc --noEmit` passes
