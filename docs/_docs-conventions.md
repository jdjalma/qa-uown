# Documentation Conventions — UOWN Leasing QA

> **Single source** of the frontmatter schema, the promotion protocol, and the loading protocol for `docs/business-rules/` and `docs/knowledge-base/`. Consumed by agents (`qa-planner`, `qa-doc-keeper`), skills (`discovery`, `test-scenarios`, `volatile-knowledge-registry`), and the tooling (`scripts/docs-tooling.mjs`).
>
> Changed the schema here? Update `scripts/docs-tooling.mjs` (validation) and re-run `node scripts/docs-tooling.mjs index`.

---

## 1. The two folders — mental model

| | `docs/business-rules/` | `docs/knowledge-base/` |
|---|---|---|
| **What it is** | Consolidated, stable product base | Point-in-time investigations per feature (dated snapshots) |
| **Granularity** | Full domain (chapters `NN-*.md` + `appendix-*`) | 1 file per feature/entity (`<topic>.md`, kebab-case) |
| **Who writes it** | Curation via `qa-doc-keeper` (promotion from the KB) | The `/discovery` skill automatically |
| **Typical volatility** | `stable` | `snapshot` (captured at a point in time) |
| **Reliability** | Source of truth that you cite | Field notebook — requires cross-check (Rule #16) |

Flow: `/discovery` investigates (UI→API→DB) → writes to `knowledge-base/` → when the finding becomes stable truth → **promoted** to `business-rules/` by `qa-doc-keeper` (see §4).

---

## 2. Frontmatter schema (YAML)

Every `.md` file in both folders — **except** `_index.md` (generated) and this file — starts with a frontmatter block. It goes **above** any existing content (title, Charter block, etc. remain intact just below).

```yaml
---
title: Funding and Merchant Management       # human, short
domain: business-rules                       # business-rules | knowledge-base
status: stable                               # stable | snapshot | hypothesis
volatility: volatile                         # stable | volatile  → drives the staleness budget
last_verified: 2026-06-18                     # YYYY-MM-DD — date of the last check against the primary source
sources:                                      # primary sources that back the doc's claims
  - code: src/data/merchant-config-contract.ts
  - code: src/config/constants.ts#generateTestSSN
  - db: uown_scheduled_task
  - env: qa2
  - lead: 16651
covers: [funding, merchants, webhooks]        # topics — feeds the _index.md and relevance search
# --- only in business-rules/ (promotion provenance): ---
derived_from: [underwriting-and-funding-test-data-paths]
# --- only in knowledge-base/ (where it graduated to, if already promoted): ---
promoted_to: [appendix-c-tabelas-banco, appendix-f-sql-reference]
---
```

### Fields

| Field | Required | Values | Meaning |
|-------|-------------|---------|-------------|
| `title` | yes | string | Short human name |
| `domain` | yes | `business-rules` \| `knowledge-base` | Source folder (sanity check) |
| `status` | yes | `stable` \| `snapshot` \| `hypothesis` | Epistemic confidence. `snapshot` = valid at capture time; `hypothesis` = not confirmed in fresh data |
| `volatility` | yes | `stable` \| `volatile` | `volatile` if it falls into a `volatile-knowledge-registry` category (merchant config, sweep SQL, rating letters, env provisioning, vendor health, activity log schema, portal naming, recently refactored selectors) |
| `last_verified` | yes | `YYYY-MM-DD` | Last time the content was checked against the primary source |
| `sources` | yes (≥1) | list of `{type: value}` | See §3 |
| `covers` | yes | list of slugs | Topics covered — for index/relevance |
| `derived_from` | no (BR only) | list of KB slugs | Which KB files were promoted here |
| `promoted_to` | no (KB only) | list of BR slugs | Where this KB graduated to (empty = not yet promoted) |

---

## 3. `sources` — provenance semantics (what the drift-check validates)

Each entry is a `type: value` pair. Types:

| Type | Example | Auto-verifiable? | What `check` does |
|------|---------|-------------------|---------------------|
| `code` | `src/data/state-merchant-matrix.ts` | **yes** | The file must exist |
| `code` (with token) | `src/config/constants.ts#generateTestSSN` | **yes** | The file exists **and** the token (`#...`) appears in it |
| `db` | `uown_scheduled_task` | partial | Records the cited table (re-querying requires credentials — only in `check --db`) |
| `env` | `qa2` | no | Context. Counts toward the staleness budget |
| `lead` / `account` | `16651` | no | Traceable evidence (manual reproduction) |
| `gitlab` / `flyway` | `20260609155406` | no | External reference |

**Golden rule:** every technical claim that **mirrors code** (state matrix, constants, enums, sweep SQL) MUST have a `source: code` with a token — that is what lets you catch drift automatically. This was exactly the gap that let `state-merchant-matrix.ts` (NY/OH) diverge from the KB without anyone noticing.

### Staleness budget

`check` emits a WARN when `last_verified` is older than:

- `volatility: volatile` → **30 days**
- `volatility: stable` → **180 days**

`status: snapshot` is informational (does not expire on its own), but if it is also `volatile`, the 30-day budget applies.

---

## 4. Promotion protocol (`knowledge-base` → `business-rules`)

Owner: **`qa-doc-keeper`** (runs last in every pipeline).

### Trigger (all criteria)

A KB finding is ready for promotion when:
1. **`status: stable`** — confirmed in **fresh data** (not an isolated observation in a pre-existing record);
2. Reproduced in **≥2 environments** OR confirmed against **code/DDL** (not just UI);
3. It is no longer a `snapshot` of a feature in rollout (the feature is stably deployed).

### Mechanics

1. Migrate/synthesize the content into the correct `business-rules/` subordinate (do not copy the whole notebook — distill the rule).
2. In the `business-rules/` file: add the KB slug to `derived_from:`.
3. In the `knowledge-base/` file: add the BR slug to `promoted_to:`.
4. Update the BR's `last_verified` to the promotion date.

Bidirectional link = traceability: you can go from the consolidated fact back to the investigation that originated it, and vice versa.

> Real example (2026-06-18): the **Merchant Settings Snapshot** feature lived only in `underwriting-and-funding-test-data-paths.md`. It was distilled into `appendix-c-tabelas-banco.md` (tables) and `appendix-f-sql-reference.md` (queries). `derived_from` / `promoted_to` record the link.

---

## 5. Loading protocol (consumers)

Every agent/skill that needs product knowledge loads **in this order**:

1. **`node scripts/docs-tooling.mjs resolve <topic>`** — mandatory (mandatory protocol in CLAUDE.md §Signal → canonical docs): resolves the topic into the canonical file + section (deep-link) + freshness + related KB, without reading anything speculatively. Fallback: read the folder's `_index.md`.
2. **`docs/business-rules/`** first (consolidated base) — open the section that `resolve` pointed to, not the whole chapter.
3. **`docs/knowledge-base/`** next (specific investigations, fresher — cross-check mandatory).

Rules:
- **Never** answer from memory about a `volatile` category — cross-check against the primary `source` (Rule #16 + `volatile-knowledge-registry`).
- Found a doc-vs-code divergence? That's a finding: fix the `source` and update `last_verified` (or open a task if it is a product bug).
- `business-rules/` wins over `knowledge-base/` in a conflict **only if** the BR's `last_verified` is more recent; otherwise, the KB (fresher) wins and should trigger a promotion.

---

## 6. Tooling

```bash
node scripts/docs-tooling.mjs check          # validates frontmatter + code anchors + staleness + vocabulary
node scripts/docs-tooling.mjs index          # (re)generates _index.md + _index.json per folder
                                             # + updates the generated block in volatile-knowledge-registry
node scripts/docs-tooling.mjs resolve <theme> # resolves a topic → canonical file + section + freshness
```

npm shortcuts: `npm run docs:check` · `npm run docs:index` · `npm run docs:resolve <theme>`.

`check` exits with a code ≠ 0 if there is a **broken code-anchor** or a **file without frontmatter** — ready for CI/pre-commit. Staleness and non-canonical topics are **WARN** (they don't fail the build).

### Controlled vocabulary (`docs/_topics.json`)

`covers:` accepts only **canonical** topics (keys in `_topics.json`) or **aliases** declared there. A slug outside the vocabulary → WARN in `check`. **To add a term, register it as an alias of the existing canonical** in `_topics.json` — don't create a loose new slug (that's how `gowsign` / `gowsign-routing` / `esign-provider` drifted). PT-BR is absorbed via aliases (e.g., `reembolso` → `refund`).

### `resolve` — the consumption resolver

`resolve <theme>` is how agents/skills **locate the source** instead of `Glob`+read-everything:
1. Normalizes the theme (alias → canonical).
2. Returns the **canonical business-rules file(s)** with a section deep-link (`file.md#anchor`), `last_verified`, and a **STALE** flag if volatile and out of budget.
3. Lists the **related KB** (fresher, requires cross-check).
4. Emits the primary-source reminder for the `volatile` category.

It reads the generated `_index.json` files — run `index` first. Consumers should prefer `resolve` over manual navigation (see §5).

---

## 7. Authority boundary — skill ↔ business-rules ↔ knowledge-base

Three layers talk about the same themes (e.g., GowSign lives in the `gowsign-knowledge` skill + `03-contratos-esign.md` + 3 KBs). So that the consumer does not pick a source by eye nor repeat content, each layer has **one exclusive role**:

| Layer | Answers | Does NOT contain |
|--------|----------|------------|
| **Skill** (`.claude/skills/`) | **How to test** — procedures, patterns, suite catalog, mandatory regression, helpers | Canonical product behavior (routing, rules, state matrix) |
| **business-rules** | **What the product does** — canonical behavior, rules, enums, formulas | How to drive the test; point-in-time observations from a run |
| **knowledge-base** | **What we observed recently** — dated, fresh, `volatile` investigation | Established rule (that's a promotion → business-rules, §4) |

**Non-repetition rule:** a layer **points** to the canonical source instead of rewriting it. A skill that needs a behavior fact (which state routes to which provider) links `business-rules` / says "run `resolve <topic>`" — it does not keep a second copy that will drift. A behavior fact duplicated in a skill = the same class of bug as the monolithic master (§1).

When consuming: a **behavior** question → `resolve` → business-rules; "**how do I drive the test**" → skill; "**is there a recent gotcha**" → knowledge-base.
