// ─────────────────────────────────────────────────────────────────────────
// ESLint flat config — TARGETED DRY/best-practice ratchet for qa-uown.
//
// PHILOSOPHY: this repo had ZERO linting before. Enabling typescript-eslint's
// full "recommended" set would flood thousands of warnings and bury signal.
// Instead we enable ONLY a handful of high-value, codebase-specific rules,
// and we keep EVERY rule at "warn" (never "error") so CI stays green on the
// existing legacy debt. The ratchet is enforced in CI via
// `eslint --max-warnings <BASELINE>`: warnings can shrink but never grow.
// Lower the ceiling as debt is paid — see .gitlab-ci.yml `quality` job.
// ─────────────────────────────────────────────────────────────────────────

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────────
  // Generated, vendored, throwaway, or non-spec source that we deliberately
  // do NOT ratchet (src/scripts holds 2 known-broken probe files; src/data and
  // src/selectors are the SANCTIONED home for centralized locators/fixtures).
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'reports/**',
      'test-results/**',
      'playwright-report/**',
      'src/scripts/**',
      'src/data/**',
      'src/selectors/**',
      '**/*.config.*', // eslint.config.mjs itself + any *.config.* (NOT playwright.config.ts below)
      'playwright.config.ts',
    ],
  },

  // ── Base: parser + node globals for everything we DO lint ─────────────
  // We register the @typescript-eslint plugin so its rule DEFINITIONS exist
  // (the codebase already carries `// eslint-disable @typescript-eslint/...`
  // directives; an unknown-rule directive is itself an ESLint ERROR). We do
  // NOT enable any of its rules — that would flood the legacy code.
  //
  // reportUnusedDisableDirectives is turned OFF: the repo carries defensive
  // `eslint-disable` comments for rules we deliberately don't enable yet
  // (no-console, @typescript-eslint/no-explicit-any). Flagging them as
  // "unused" would be phantom debt — not actionable until those rules turn on.
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // ── Targeted rules for BOTH src/** and tests/** (all "warn") ──────────
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      // Force runtime helpers through the barrel '@helpers/index.js'.
      // database.helpers IS in the barrel (verified: adds 0 new tsc errors),
      // so NO module is exempt from this rule.
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@helpers/*.helpers.js', '@helpers/*.helper.js'],
              message:
                "Import runtime helpers via the barrel '@helpers/index.js', not the individual module.",
            },
          ],
        },
      ],

      // sleep() inside a loop = a hand-rolled poll. Use pollUntil/waitForRecord
      // (see db-polling-pattern skill).
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            ":matches(ForStatement,ForInStatement,ForOfStatement,WhileStatement,DoWhileStatement) CallExpression[callee.name='sleep']",
          message:
            'sleep() inside a loop re-implements pollUntil/waitForRecord — use the helper (see db-polling-pattern).',
        },
      ],
    },
  },

  // ── tests/** ONLY: spec-hygiene rules (all "warn") ────────────────────
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        // (repeat the shared sleep-in-loop selector so this override block,
        //  which REPLACES the shared no-restricted-syntax, keeps it active)
        {
          selector:
            ":matches(ForStatement,ForInStatement,ForOfStatement,WhileStatement,DoWhileStatement) CallExpression[callee.name='sleep']",
          message:
            'sleep() inside a loop re-implements pollUntil/waitForRecord — use the helper (see db-polling-pattern).',
        },
        // Inline locators in a spec — belong in a page object / centralized selector.
        {
          selector:
            "CallExpression[callee.property.name=/^(locator|getByRole|getByText|getByLabel|getByTestId|frameLocator)$/]",
          message:
            'Inline locator in a spec — call the page object method or centralize the selector (selector-hardening).',
        },
        // XPath string literals.
        {
          selector: 'Literal[value=/^xpath=/]',
          message: 'No XPath — use semantic/getBy locators.',
        },
        // Type escapes: `as any` / `as unknown`.
        {
          selector:
            "TSAsExpression[typeAnnotation.type='TSAnyKeyword'], TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            'Avoid as any / as unknown in tests — use the typed builder/factory.',
        },
      ],
    },
  },

  // ── eslint-plugin-playwright recommended, scoped to tests/** ──────────
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  },

  // ── Downgrade EVERY playwright rule to "warn" ─────────────────────────
  // flat/recommended ships many rules at "error" (missing-playwright-await,
  // no-focused-test, prefer-web-first-assertions, valid-*, …). On a codebase
  // with no prior linting those WILL fire on legacy specs. Goal today: zero
  // NEW eslint ERRORS. Blanket-downgrade so the whole plugin is ratchet-warn;
  // promote individual rules back to "error" as the debt is cleared.
  {
    files: ['tests/**/*.ts'],
    rules: Object.fromEntries(
      Object.keys(playwright.configs['flat/recommended'].rules)
        .filter((name) => name.startsWith('playwright/'))
        .map((name) => [name, 'warn']),
    ),
  },
);
