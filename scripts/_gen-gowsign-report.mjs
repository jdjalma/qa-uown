#!/usr/bin/env node
/**
 * Parses Playwright JSON results and emits a markdown test report for the
 * GowSign qa2 full-suite run.
 *
 * Usage:
 *   node scripts/_gen-gowsign-report.mjs reports/gowsign-qa2-full/results.json > reports/gowsign-qa2-full/report.md
 */
import { readFileSync } from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: _gen-gowsign-report.mjs <results.json>');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, 'utf-8'));

// Walk Playwright's JSON tree and flatten tests
function flattenTests(suites, parentFile = '') {
  const out = [];
  for (const suite of suites ?? []) {
    const file = suite.file || parentFile;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.[test.results.length - 1] ?? {};
        out.push({
          file,
          title: spec.title,
          fullTitle: `${suite.title ? suite.title + ' › ' : ''}${spec.title}`,
          status: result.status ?? 'unknown',
          durationMs: result.duration ?? 0,
          retry: result.retry ?? 0,
          error: result.error?.message ?? null,
          tags: spec.tags ?? [],
        });
      }
    }
    if (suite.suites) {
      out.push(...flattenTests(suite.suites, file));
    }
  }
  return out;
}

const tests = flattenTests(raw.suites ?? []);

// Aggregate by file
const fileMap = new Map();
for (const t of tests) {
  if (!fileMap.has(t.file)) {
    fileMap.set(t.file, { passed: 0, failed: 0, skipped: 0, timedOut: 0, durationMs: 0, tests: [] });
  }
  const agg = fileMap.get(t.file);
  agg.tests.push(t);
  agg.durationMs += t.durationMs;
  if (t.status === 'passed') agg.passed++;
  else if (t.status === 'failed') agg.failed++;
  else if (t.status === 'skipped') agg.skipped++;
  else if (t.status === 'timedOut') agg.timedOut++;
}

const total = tests.length;
const passed = tests.filter(t => t.status === 'passed').length;
const failed = tests.filter(t => t.status === 'failed').length;
const skipped = tests.filter(t => t.status === 'skipped').length;
const timedOut = tests.filter(t => t.status === 'timedOut').length;
const totalDurationMs = tests.reduce((a, t) => a + t.durationMs, 0);

function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

const startedAt = raw.stats?.startTime ?? null;
const today = new Date().toISOString().slice(0, 10);

const out = [];
out.push(`# GowSign Integration — Test Report`);
out.push('');
out.push(`**Suite:** GowSign qa2 (TireAgent CA) — full active set`);
out.push(`**Date:** ${today}`);
out.push(`**Environment:** qa2 / TireAgent (OW90218-0001) / state CA`);
if (startedAt) out.push(`**Started:** ${startedAt}`);
out.push('');

out.push('## Summary');
out.push('');
out.push(`| Metric | Value |`);
out.push(`|--------|-------|`);
out.push(`| Total tests | ${total} |`);
out.push(`| ✅ Passed | ${passed} |`);
out.push(`| ❌ Failed | ${failed} |`);
out.push(`| ⏱️ Timed out | ${timedOut} |`);
out.push(`| ⏸ Skipped | ${skipped} |`);
out.push(`| **Pass rate (executed)** | **${total - skipped > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : '—'}%** |`);
out.push(`| Total runtime | ${fmtDuration(totalDurationMs)} |`);
out.push('');

out.push('## Per-file results');
out.push('');
out.push('| Spec file | Pass | Fail | Skip | Duration |');
out.push('|-----------|------|------|------|----------|');
const sortedFiles = [...fileMap.keys()].sort();
for (const file of sortedFiles) {
  const agg = fileMap.get(file);
  const fileShort = file.replace(/^.*tests\/e2e\/gowsign\//, '');
  out.push(`| \`${fileShort}\` | ${agg.passed} | ${agg.failed} | ${agg.skipped} | ${fmtDuration(agg.durationMs)} |`);
}
out.push('');

if (failed + timedOut > 0) {
  out.push('## ❌ Failures');
  out.push('');
  for (const t of tests.filter(x => x.status === 'failed' || x.status === 'timedOut')) {
    const fileShort = t.file.replace(/^.*tests\/e2e\/gowsign\//, '');
    out.push(`### ${fileShort} → ${t.title}`);
    out.push(`- Status: \`${t.status}\` (retries: ${t.retry})`);
    out.push(`- Duration: ${fmtDuration(t.durationMs)}`);
    if (t.error) {
      out.push('');
      out.push('```');
      out.push(t.error.split('\n').slice(0, 12).join('\n'));
      out.push('```');
    }
    out.push('');
  }
}

out.push('## All tests detail');
out.push('');
out.push('| Status | Test | Duration |');
out.push('|--------|------|----------|');
for (const t of tests) {
  const icon = t.status === 'passed' ? '✅'
    : t.status === 'failed' ? '❌'
    : t.status === 'timedOut' ? '⏱️'
    : t.status === 'skipped' ? '⏸'
    : '❔';
  const titleEsc = t.title.replace(/\|/g, '\\|');
  out.push(`| ${icon} | ${titleEsc} | ${fmtDuration(t.durationMs)} |`);
}
out.push('');

out.push('---');
out.push(`Generated from \`${inputPath}\``);

console.log(out.join('\n'));
