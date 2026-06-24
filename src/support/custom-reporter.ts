/**
 * Custom Test Reporter
 *
 * Generates a JSON summary report with test results, timing, and metadata.
 * Outputs to reports/test-summary.json after each test run.
 *
 * Supplements the built-in Playwright HTML reporter with a machine-readable
 * summary useful for CI/CD dashboards, Slack notifications, etc.
 */
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface TestSummaryEntry {
  title: string;
  file: string;
  project: string;
  status: string;
  duration: number;
  retries: number;
  error?: string;
  tags: string[];
}

interface TestSummaryReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  totalDuration: number;
  tests: TestSummaryEntry[];
}

class CustomReporter implements Reporter {
  private tests: TestSummaryEntry[] = [];
  private startTime = 0;
  private outputDir: string;

  constructor(options?: { outputDir?: string }) {
    this.outputDir = options?.outputDir || path.resolve(process.cwd(), 'reports');
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    this.tests = [];
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const entry: TestSummaryEntry = {
      title: test.title,
      file: test.location.file.replace(process.cwd() + '/', ''),
      project: test.parent.project()?.name || 'unknown',
      status: result.status,
      duration: result.duration,
      retries: result.retry,
      tags: test.tags,
    };

    if (result.status === 'failed' || result.status === 'timedOut') {
      const error = result.errors[0];
      if (error) {
        entry.error = error.message?.substring(0, 500);
      }
    }

    this.tests.push(entry);
  }

  async onEnd(_result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startTime;

    const summary: TestSummaryReport = {
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || 'sandbox',
      totalTests: this.tests.length,
      passed: this.tests.filter(t => t.status === 'passed').length,
      failed: this.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length,
      skipped: this.tests.filter(t => t.status === 'skipped').length,
      flaky: this.tests.filter(t => t.status === 'passed' && t.retries > 0).length,
      totalDuration,
      tests: this.tests,
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const outputPath = path.join(this.outputDir, 'test-summary.json');
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Environment: ${summary.environment}`);
    console.log(`  Total:       ${summary.totalTests}`);
    console.log(`  Passed:      ${summary.passed}`);
    console.log(`  Failed:      ${summary.failed}`);
    console.log(`  Skipped:     ${summary.skipped}`);
    console.log(`  Flaky:       ${summary.flaky}`);
    console.log(`  Duration:    ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`  Report:      ${outputPath}`);
    console.log('='.repeat(60) + '\n');
  }
}

export default CustomReporter;
