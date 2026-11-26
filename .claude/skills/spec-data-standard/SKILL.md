---
name: spec-data-standard
description: Enforce and auto-apply test data robustness standards for Playwright + TypeScript projects. Classifies test data, assesses data maturity (levels 0-4), and enforces parallel isolation, typed data sourcing and data-driven datasets, environment portability, and deterministic expected values. Includes a verification mode that runs the suite in parallel and per environment to produce evidence. Load when writing tests that create or read data, enabling parallel execution, adding an environment, or diagnosing failures that only appear in parallel or in one environment. Triggers - "assess test data", "data maturity", "data robustness", "parallel safe", "multi environment", "verify robustness".
---

# spec-data-standard

Owns **test data robustness**: how data is classified, sourced, isolated, made portable across environments, and used as the source of expected values.

**Objective — the hermetic test:** depends on nothing it does not control: not other tests, not execution order, not the environment, not data that "should be there".

Gap filled: other skills guarantee setup/teardown **exist**; none guarantees data is **isolated** between workers, **portable** between environments, or **known** well enough to assert exact values.

## Project Context

- Parallel safety and environment portability are consequences of hermeticity, not separate goals.
- Each Playwright worker is a **separate process**: module-level variables are NOT shared. Partition per worker with `testInfo.parallelIndex` (stable, 0..workers-1), never `workerIndex` (changes on worker restart).
- Fixtures support `{ scope: 'worker' }` for resources created once per worker.
- Specs never read `process.env`; they use the config module (`Env`).
- Credential **storage** is owned by `test-standards` (no hardcoded credentials). This skill governs **which identity** a test uses (shared / per worker / per test).

### Project conventions (resolve before applying rules)

Resolve each placeholder from the repo (hub Project Context, `tsconfig.json` paths, folder tree); use the default only if the project defines nothing. Report resolved values in the M0 header. The skill is project-agnostic: site names come from `src/data/sites/*`, never from this file.

| Placeholder | Meaning | This project |
|---|---|---|
| `<data-dir>` | Test data per site (`@data/*`) | `src/data/sites/<site>/` |
| `<config-module>` | Env config exporting `Env` (`@config/*`) | `src/config/Env.ts` |
| `<fixtures-module>` | Per-site fixtures merged by `mergeTests` | `src/fixtures/sites/<site>.fixtures.ts` |
| `<api-layer>` | ApiClient + controllers (`@api/*`) | `src/api/sites/<site>/` |
| `<runner-config>` | Playwright config | `playwright.config.ts` |
| `<test-root>` | `testDir` of the runner config | `test/` |
| `<tc-docs-dir>` | TC specification documents | `docs/test-cases/` |

### Data classification (classify before applying rules)

| Class | Example | Mutable? | Strategy |
|---|---|---|---|
| Reference | Catalog, products, countries | No | Share; discover via API |
| Environment | Base URL, seed IDs, feature flags | Per environment | Typed config per environment |
| Transactional | New user, order, collection item | Yes | Create per test/worker; isolate; clean |
| Secret | Passwords, tokens | Per environment | Outside the repo (`.env.*`, CI secrets) |
| Simulated | Mocked API responses | Controlled by test | `mock<Resource>` fixture |

Most robustness bugs come from treating **Transactional** data as **Reference** data.

Lifecycle: DEFINE (typed shape) → PROVISION (create · discover · mock) → USE (test · worker · pool scope) → CLEAN (scoped teardown).

### Maturity levels (scored per site)

| Level | State | Exit criteria (to reach next) |
|---|---|---|
| 0 — Hardcoded | Data inside the spec | All inputs and expected values moved to `<data-dir>` |
| 1 — Externalised | `<data-dir>` + datasets | Env config selectable per environment, validated, secrets outside the repo |
| 2 — Per environment | Typed `TEST_ENV` config | No shared mutable identity; unique generated data |
| 3 — Isolated | Per-worker / per-test data | Data self-provisioned via API; env literals replaced by discovery |
| 4 — Self-provisioned | Hermetic | Maintain: run M5 on every new TC |

### Domain coordination (do not re-report what another skill owns)

| Concern | Owner | Interaction |
|---|---|---|
| TC document data section | `spec-requirements-standard` | Input: classified data items + source per TC |
| Teardown exists after `use()`, token refresh, fixture naming | `api-setup-teardown-standard` R4, R8, R9 | This skill checks teardown **scope** (R12) |
| Controllers for provisioning | `api-setup-teardown-standard` (Add mode) | Request `create<Identity>` / `delete<Identity>` when missing |
| Credential storage, imports | `test-standards` | Not re-checked |
| Independence, module state, clean-verified, shared account | `spec-quality-lifecycle-standard` R7, R11, R12 | R1 here is the structural fix for its R12 |
| Assertion specificity | `spec-quality-lifecycle-standard` R10 | R13 provides the expected-value source |
| Folder/naming/tag syntax | `spec-standards` | R11 defines tag **meaning** only |

## Modes

No dedicated hub mode: reached through hub **Mode 6** (TC Quality Review) or by loading this skill directly. **M0 is the default.**

### M0 — Maturity Assessment (read-only)
**Triggers:** "assess test data" · "data maturity" · "spec data" · "data robustness"

1. Discover `<data-dir>/**`, `<config-module>`, `<fixtures-module>`, `<runner-config>`, `<test-root>/**/*.spec.ts`.
2. Inventory every data item a test consumes; classify it.
3. Detect shared mutable identities (fixtures mutating state of an identity loaded from one static source).
4. Score the maturity level **per site** (highest level whose exit criteria are fully met).
5. List blockers for the next level, each mapped to mode + rule. Do NOT modify files.

```
[spec-data-standard] MATURITY ASSESSMENT
─────────────────────────────────────────
Resolved: data=<..> config=<..> fixtures=<..> testRoot=<..>
Site: <site>            Level: <0-4> — <name>
  Data inventory:  <N> reference · <N> environment · <N> transactional · <N> secret · <N> simulated
  Blockers to level <N+1>:
    - <issue> → M<n> / R<n>
Recommended next mode: M<n>
```

### M1 — Parallel Isolation
**Triggers:** "parallel safe" · "isolate data" · "fix parallel failures" · "spec data m1"
**Question:** can N workers run at once without touching each other's data?

1. Run R1–R5, R15 on fixtures, specs, data factories, `<runner-config>`.
2. For each shared mutable identity pick a strategy (table below).
3. If provisioning needs missing controller methods, invoke `api-setup-teardown-standard` (Add mode).
4. Auto-fix AUTO-FIX violations; list MANUAL-FIX items.

| Situation | Strategy | Fixture pattern |
|---|---|---|
| Test creates/mutates data; API available | Create per test + scoped teardown | `created<Resource>` |
| Costly identity with mutable state | One identity per worker | `worker<Resource>` (`scope: 'worker'`) |
| Identities cannot be created (fixed accounts) | Account pool indexed by `parallelIndex` | `worker<Resource>` from pool |
| Read-only reference data | Share it | `<resource>Controller` |
| UI behaviour independent of backend state | Mock | `mock<Resource>` |
| Global state, unavoidable | Serialise, justified | `mode: 'serial'` + `// spec-data: serial — <reason>` |

Canonical worker-scoped identity (inside `test.extend<…, WorkerFixtures>`):

```typescript
workerUser: [async ({ playwright }, use, workerInfo) => {
  const request = await playwright.request.newContext({ baseURL: Env.baseUrl });
  const accounts = new AccountController(new ApiClient(request, Env.baseUrl));
  const user = buildUser(workerInfo.parallelIndex);   // unique, prefixed (R2, R3)
  const created = await accounts.createUser(user);
  await use({ ...user, id: created.id });
  await accounts.deleteUser(created.id, user);        // scoped teardown (R12)
  await request.dispose();
}, { scope: 'worker' }],
```

### M2 — Data Sourcing & Data-Driven
**Triggers:** "data driven" · "externalise data" · "load test data" · "spec data m2"
**Question:** where does each test get its data; is it typed and reusable?

| Need | Source | Location |
|---|---|---|
| Small, typed, reviewed datasets | TypeScript module | `<data-dir>/{feature}.data.ts` |
| Large / business-maintained | JSON/CSV + typed loader | `<data-dir>/{feature}.json` + loader in `.data.ts` |
| Unique values per run | Factory / builder | `<data-dir>/factories/<resource>.factory.ts` |
| Differs per environment | Environment data map | `<data-dir>/env.data.ts` (M3) |

Steps: run R6–R8 · move inline datasets and expected values out of specs (R7) · wrap JSON/CSV in a typed loader that validates and fails fast (R6) · merge copy-pasted tests that differ only in data into a loop (R8).

```typescript
import { test, expect } from '@fixtures';
import { invalidLoginCases } from '@data/sites/<site>/login.data';

test.describe('Login', () => {
  for (const row of invalidLoginCases) {
    test(`${row.id}: Reject login for ${row.description}`, async ({ loginPage }) => {
      await test.step('1. Submit credentials; the error message matches the row', async () => {
        await loginPage.login(row.username, row.password);
        await expect(loginPage.errorMessage).toHaveText(row.expectedError);
      });
    });
  }
});
```

Rows that need a different flow are a different TC, not a different row (`spec-quality-lifecycle-standard` R8).

### M3 — Environment Portability
**Triggers:** "multi environment" · "run on staging" · "env config" · "spec data m3"
**Question:** does the suite run against another environment with zero code changes?

1. Run R9–R12.
2. `<config-module>` selects `.env.<TEST_ENV>` (default: plain `.env`) and validates every required variable.
3. Replace environment literals with the environment data map or runtime discovery (R10).
4. Tag tests by data impact (R11); guard destructive cleanup per environment (R12).
5. `.env.*` git-ignored (keep `!.env.example`); `.env.example` documents every variable.

```typescript
const TEST_ENV = process.env.TEST_ENV ?? 'local';
dotenv.config({ path: path.resolve(__dirname, `../../.env.${TEST_ENV}`), quiet: true });
// validate REQUIRED_VARS, then:
export const Env = { name: TEST_ENV, baseUrl: process.env.BASE_URL as string,
  allowDestructiveCleanup: process.env.ALLOW_DESTRUCTIVE_CLEANUP === 'true' } as const;
```

Data-impact tags (native `{ tag: [...] }`, Playwright ≥ 1.42; syntax owned by `spec-standards`):

| Tag | Meaning |
|---|---|
| `@mutates-data` | Creates, updates or deletes persistent data; excluded from production-like runs |
| `@read-only` | Reads only; safe in any environment (smoke everywhere) |
| `@env:<name>` | Valid only in that environment |

`TEST_ENV=staging npx playwright test --grep-invert @mutates-data`

**Environment Readiness Map** — always produced by M3. When fewer than two environments exist it replaces the per-environment run as M3/M5 evidence. Status per row: ✅ done · 🔧 would change (name the file) · ➖ n/a.

| # | Reinforcement point | Where | Problem if missing | Rule |
|---|---|---|---|---|
| E1 | Environment selector + per-env files | `<config-module>` | One hardcoded target | R9 |
| E2 | Fail-fast validation of required variables | `<config-module>` | Late, cryptic failures | R9 |
| E3 | Base URL from config; relative paths in steps | `<runner-config>`, specs, TC docs | Tests tied to one host | R10 |
| E4 | Secrets per environment outside the repo | `.env.*`, CI secrets | Leaks; manual setup per env | — |
| E5 | Self-provisioned identities (no seeded users/IDs) | `<fixtures-module>`, `<api-layer>` | Seed data must exist in every env | R1 · R10 |
| E6 | Reference data discovered at runtime | `<fixtures-module>`, specs | IDs/SKUs differ per env | R10 |
| E7 | Oracles from controlled sources | specs, TC docs | Expected values differ per env | R13 |
| E8 | Cleanup scoped and guarded per env | `<fixtures-module>` | Destructive cleanup in shared envs | R12 |
| E9 | Data-impact tags for selection | specs | Mutating tests run where they must not | R11 |
| E10 | CI matrix: one job per env with its secrets | CI pipeline | Portability never exercised | — |

```
[spec-data-standard] ENVIRONMENT READINESS — <site>
Environments available: <n> (<names>)   Mode: run | readiness map
E1 ✅|🔧|➖ <evidence or file to change>
...
Ready: <n>/10   Next: <first 🔧 item>
```

### M4 — Deterministic Data & Value Assertions
**Triggers:** "assert values" · "deterministic data" · "mock data" · "spec data m4"
**Question:** does the test know the **exact** values it expects, and assert them? Presence is not correctness: `toBeVisible()` on a list passes when every value is wrong.

| Expected-value source (in order of preference) | When | Assertion |
|---|---|---|
| Data the test created (`created<Resource>`) | Transactional | each field equals `created.field` |
| Mock payload (`mock<Resource>`) | Rendering, formatting, edge cases | every rendered field vs payload |
| Dataset row (M2) | Data-driven | `toHaveText(row.expected)` |
| API discovery (`<resource>Controller`) | Reference data owned by the system | UI value vs API value, same entity |

Steps: run R13–R14 · identify the expected-value source of every assertion on data-bearing elements · replace presence-only assertions with value assertions · where live data is not owned, add a `mock<Resource>` fixture with a typed payload from `<data-dir>` (mock factory: `api-setup-teardown-standard`).

### M5 — Robustness Verification (evidence)
**Triggers:** "verify robustness" · "stress parallel" · "run data verification" · "spec data m5"
**Question:** does it stay green in parallel, repeatedly, and per environment?

**Executes tests and never modifies code.** It hits the real target system and mutates its data: confirm scope with the user before running against shared third-party sites or accounts.

1. Select scope (TC, feature or site) and one browser project (from `<runner-config>`).
2. Parallel stress: `npx playwright test <scope> --project=<project> --workers=<N> --repeat-each=<K> --retries=0` (default N=4, K=4).
3. Environment run per configured `TEST_ENV` (≥ 2). With fewer, attach the M3 Readiness Map and say so in the verdict.
4. Orphan check: query leftover data with the test prefix (R3); expected 0.
5. Classify every failure:

| Category | Signal |
|---|---|
| Collision | Data changed/deleted by another test |
| Session invalidation | 401/403 after another worker logged in (R15) |
| Missing data | Record/ID not found in this environment |
| Order dependency | Passes alone, fails in suite |
| Non-data flakiness | Timing/selector → hand off to `spec-quality-lifecycle-standard` |

6. Compare with the previous run (before/after) when available.

```
[spec-data-standard] ROBUSTNESS VERIFICATION
─────────────────────────────────────────
Scope:     <scope>   Project: <project>
Parallel:  workers=<N> repeat=<K> → <passed>/<total> passed · <flaky> flaky
Env <a>:   <passed>/<total> passed
Orphans:   <N> records with prefix '<prefix>'
Failures by cause: collision <n> · session <n> · missing-data <n> · order <n> · other <n>
Verdict:   ✅ HERMETIC  |  ❌ NOT HERMETIC → run M<n> for <rule>
```

## Rules

### R1 — NO_SHARED_MUTABLE_IDENTITY (ERROR, MANUAL-FIX) · M1
**Condition:** a test-scoped fixture creates, mutates or bulk-deletes state of an identity loaded from a single static source (one env var, one data constant) while more than one worker (or project) can run.
**Why:** all workers act on one account: one cleanup erases another's data; one login invalidates another's token.
**Fix:** per-test identity, `worker<Resource>`, or pool (M1 table).

### R2 — UNIQUE_CREATED_DATA (ERROR, AUTO-FIX) · M1
**Condition:** data created by a test/fixture uses a static literal for a field that must be unique (username, email, name, title, code).
**Auto-fix:** build it from prefix + `parallelIndex` + timestamp + random suffix; `Date.now()` alone is not unique across workers.
```typescript
export const uniqueSuffix = (i: number) =>
  `${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
```

### R3 — TEST_DATA_PREFIXED (WARNING, AUTO-FIX) · M1
**Condition:** generated transactional data does not start with the test-data prefix (`Env.testDataPrefix`, default `qa_`).
**Why:** makes orphans detectable (M5) and enables a sweep after failed runs.

### R4 — PARALLELISM_NOT_SUPPRESSED (WARNING, MANUAL-FIX) · M1
**Condition:** `workers: 1`, `fullyParallel: false` or `mode: 'serial'` without a `// spec-data: serial — <reason>` comment. A project-level restriction that keeps a shared identity from running twice (e.g. a single project for a shared account) must say so in a comment.
**Why:** suppressing parallelism hides isolation bugs instead of fixing them.

### R5 — NO_GLOBAL_STATE_ASSERTION (WARNING, MANUAL-FIX) · M1
**Condition:** a total count or full-collection equality is asserted on data the test does not own (`toHaveCount(N)` on a shared list).
**Fix:** assert on the records the test created, or own the whole collection (`worker<Resource>` / `created<Resource>`).

### R6 — TYPED_DATA_SOURCE (ERROR, AUTO-FIX) · M2
**Condition:** a JSON/CSV file is imported or parsed in a spec, or loaded without an interface and required-field validation.
**Auto-fix:** typed loader in `<data-dir>/{feature}.data.ts` that validates and throws a descriptive error; spec imports the loader.

### R7 — DATA_OUTSIDE_SPEC (ERROR, AUTO-FIX) · M2
**Condition:** a spec declares inline datasets or literal expected values that are test data (not UI labels). Credentials excluded (`test-standards`).
**Auto-fix:** move to `<data-dir>/{feature}.data.ts` with an exported type; import via `@data/*`.

### R8 — DATA_DRIVEN_TITLES_UNIQUE (ERROR, AUTO-FIX) · M2
**Condition:** a loop generates `test()` titles without a unique row id, or ≥ 2 tests differ only in literal data.
**Auto-fix:** add `${row.id}` to the title; merge copy-paste tests into dataset + loop.

### R9 — ENV_RESOLVED_FROM_CONFIG (ERROR, AUTO-FIX) · M3
**Condition:** (1) `process.env` read outside `src/config/` (the runner-config `CI` / `NODE_USE_SYSTEM_CA` runtime flags are exempt); (2) `<config-module>` loads one fixed `.env` with no `TEST_ENV` selector; (3) a variable used by tests is not validated at startup — optional variables defaulting to `''` or a public URL count as unvalidated when a test requires them.
**Auto-fix:** route reads through `Env`, add the selector, declare the variable in required/optional lists and `.env.example`.

### R10 — NO_ENV_SPECIFIC_LITERALS (ERROR, MANUAL-FIX) · M3
**Condition:** a spec, fixture or data file holds an environment-dependent literal assumed to exist: absolute host URL, record ID/UUID, SKU/ISBN, seeded username. Public demo-site defaults in `Env` (`?? 'https://…'`) are reported as WARNING, not ERROR.
**Fix:** prefer runtime discovery via a `<resource>Controller`; otherwise `<data-dir>/env.data.ts` keyed by `Env.name`.

### R11 — DATA_IMPACT_TAGGED (WARNING, AUTO-FIX) · M3
**Condition:** a test that uses a `created<Resource>`, `clean<Resource>` or `worker<Resource>` fixture, or persists data, has no `@mutates-data`; an environment-restricted test has no `@env:<name>`.
**Auto-fix:** add via `{ tag: [...] }` (syntax per `spec-standards`). Requires Playwright ≥ 1.42.

### R12 — SCOPED_AND_GUARDED_CLEANUP (ERROR, MANUAL-FIX) · M1 · M3
**Condition:** a teardown bulk-deletes (`deleteAll`, sweep by query) data the test/worker does not exclusively own, or does so without checking `Env.allowDestructiveCleanup`.
**Fix:** delete only identifiers created by this fixture; allow bulk cleanup only for an identity owned by the test/worker and only where the environment allows it.

### R13 — EXPECTED_VALUE_FROM_CONTROLLED_SOURCE (WARNING, MANUAL-FIX) · M4
**Condition:** an assertion on a data-bearing element (title, price, name, status, row) (1) checks presence only (`toBeVisible`, `toHaveCount(>0)`) when the TC intent is a value, or (2) compares against a literal whose source is not a created fixture, mock payload, dataset row or API discovery. Values read from the UI and only compared with each other (`bookA ≠ bookB`) do not satisfy (2) for the entity under test.
**Fix:** assert the exact value from the M4 source table. Feeds `spec-quality-lifecycle-standard` R10. Values used in `filter({ hasText })` (`ui-locator-wait-standard` R6) follow the same controlled sources.

### R14 — MOCK_FOR_UNOWNED_CONTENT (WARNING, MANUAL-FIX) · M4
**Condition:** a test validates rendering/formatting/edge cases of content it does not own (live catalog, third-party data) and cannot predict exact values.
**Fix:** inject `mock<Resource>` with a typed payload from `<data-dir>`; assert each rendered field; keep one non-mocked integration test per feature.

### R15 — SINGLE_SESSION_PER_IDENTITY (ERROR, MANUAL-FIX) · M1
**Condition:** within one test, more than one fixture or step generates an auth token/session for the same identity (UI login + API authenticate counts).
**Why:** systems with one active token per user invalidate the earlier one; failure is intermittent (whoever authenticates last wins).
**Fix:** one fixture owns the identity's token per test; others reuse it or do unauthenticated reads. When a UI login is the test's subject, every API call afterwards must re-authenticate first (`api-setup-teardown-standard` R9) and the residual risk is reported.

## Violation output format

```
[spec-data-standard] SEVERITY — RULE_NAME (M<n>)
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED | MANUAL-FIX
```

## Scan scope

| File glob | Rules |
|---|---|
| `src/fixtures/**/*.ts` | R1, R2, R3, R12, R15 |
| `src/data/**` | R2, R3, R6, R10 |
| `src/config/**/*.ts` | R9 |
| `playwright.config.ts` | R4 |
| `{testRoot}/**/*.spec.ts` | R4, R5, R6, R7, R8, R9, R10, R11, R13, R14, R15 |

Ownership boundary with `api-setup-teardown-standard` (R4, R8, R9) and `test-standards` on `src/fixtures/**`: those skills own teardown existence, naming and token refresh; this skill owns identity scope and data uniqueness only.
