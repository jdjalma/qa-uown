# E2E Test Examples — UOWN Leasing

> Real code examples from the project. Reference when implementing new tests.

## 1. Standard E2E Test Structure

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { SELECTORS } from '@selectors/index.js';
import { OriginationCustomerPage } from '@pages/origination/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import type { TestContext } from '@support/base-test.js';

const testData = [
  {
    env: 'sandbox',
    state: 'NY',
    merchant: 'TerraceFinance',
    orderTotal: '621',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL),
  },
];

for (const data of testData) {
  test.describe(`R1.49.1_featureName_469 - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('should create application and reach UW_APPROVED', async ({ page, api, db, testEnv }) => {
      test.setTimeout(300_000);
      const ctx: TestContext = {
        leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
        contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
        reportKeys: new Map(),
      };

      await test.step('Submit application via API', async () => {
        const result = await setupApplicationViaApi(api, {
          merchant: testEnv.getCredentials('merchant'), // or use td.merchant
          applicant: { /* see api-setup.helpers */ },
          order: { merchandiseDescription: 'Test', merchandiseAmount: data.orderTotal },
          env: data.env,
        });
        ctx.leadPk = result.leadPk;
        ctx.leadUuid = result.leadUuid;
      });

      await test.step('Verify lead status in DB', async () => {
        const status = await db.getLeadStatus(ctx.leadPk);
        expect(status).toBe('UW_APPROVED');
      });

      await test.step('Complete contract in browser', async () => {
        const customerPage = new OriginationCustomerPage(page);
        // Browser interaction
      });
    });
  });
}
```

## 2. API-Only Test Structure

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData } from '@helpers/test-data.helpers.js';

const testData = [
  { env: 'sandbox', merchant: 'TerraceFinance', tag: buildTags(TestTag.REGRESSION) },
];

for (const data of testData) {
  test.describe(`R1.49.1_featureName_469 - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('should submit and get UW_APPROVED via API', async ({ api, db, testEnv }) => {
      test.setTimeout(120_000);
      const td = buildTestData({ env: data.env, state: 'FL', merchant: data.merchant });

      await test.step('Send application', async () => {
        const response = await api.application.sendApplication(td.merchant, td.applicant, td.order);
        expect(response.ok, `sendApplication: ${response.status}`).toBeTruthy();
      });
    });
  });
}
```

## 3. Task Test Structure (GitLab issues)

```typescript
// File: docs/taskTestingUown/{testName}/{testName}.spec.ts
// Project: task-testing (even for DB-only tests — NOT api-only)
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const testData = [
  { env: 'qa1', tag: buildTags(TestTag.REGRESSION, TestTag.QA1) },
];

for (const data of testData) {
  test.describe(`R1.49.1_featureName_469 - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('CT-01: Verify index exists on table', async ({ db }) => {
      test.setTimeout(60_000);

      await test.step('CT-01: Query pg_indexes for expected index', async () => {
        const exists = await db.indexExistsOnTable('idx_name', 'table_name');
        expect(exists).toBe(true);
      });
    });
  });
}
```

## 4. Using ctx for State Sharing

```typescript
test('full flow with shared context', async ({ page }) => {
  const ctx: {
    leadPk?: number;
    contractUrl?: string;
    status?: string;
  } = {};

  await test.step('Step 1 - Create', async () => {
    ctx.leadPk = 12345; // assigned in step 1
  });

  await test.step('Step 2 - Verify', async () => {
    // ctx.leadPk is available here
    expect(ctx.leadPk).toBeDefined();
  });
});
```

## 5. Worker-Scoped Unique IDs

```typescript
import { uniqueEmail, uniqueName, getWorkerRunId } from '@helpers/index.js';

// Parallel-safe unique data
const email = uniqueEmail('fresh.member');  // fresh.member_003120_1710583_0@e2e.test
const name = uniqueName('Test Company');     // Test Company 003120
const runId = getWorkerRunId();              // 003120

// In logs for diagnosis
console.log(`[worker=${getWorkerRunId()}] Creating application...`);
```
