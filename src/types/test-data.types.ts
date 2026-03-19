import type { EnvName } from '../config/environment.js';

/**
 * Base interface for the `testData` array used in all test files.
 *
 * Tests iterate over testData to generate parameterized test.describe blocks:
 * ```typescript
 * const testData: MyTestData[] = [
 *   { env: 'qa1', tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL) }
 * ];
 * for (const data of testData) {
 *   test.describe(`My Test - ${data.env}`, { tag: splitTags(data.tag) }, () => {
 *     test.use({ envName: data.env });
 *     ...
 *   });
 * }
 * ```
 *
 * Extend this for test-specific fields:
 * ```typescript
 * interface MyTestData extends TestDataEntry {
 *   state: string;
 *   merchant: string;
 *   orderTotal: string;
 *   existingAccountPks?: string[];
 * }
 * ```
 */
export interface TestDataEntry {
  /** Target environment. Must be a valid EnvName (validated at runtime by ConfigEnvironment). */
  env: EnvName;
  /**
   * Test tags as a space-separated string.
   * Use buildTags() from @types/enums.js:
   * @example buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1)
   */
  tag: string;
}
