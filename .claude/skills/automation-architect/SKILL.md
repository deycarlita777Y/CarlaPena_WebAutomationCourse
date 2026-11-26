---
name: automation-architect
description: Hub skill that orchestrates pom-architect, test-standards, spec-standards, spec-requirements-standard, spec-quality-lifecycle-standard, ui-locator-wait-standard, api-setup-teardown-standard, spec-data-standard and git-standards for Playwright + TypeScript projects. Use for full architecture enforcement (review + auto-fix) on existing files, to scaffold new Page Objects, fixtures and spec files, to sync the README with the architecture, or to consult the project context, sub-skill registry and framework growth rules. Invoke sub-skills independently for targeted checks.
---

# automation-architect (hub)

Orchestrates `pom-architect`, `ui-locator-wait-standard` (locators and waits), `test-standards`, `spec-standards` (TC organisation rules), `spec-requirements-standard` (TC specification documents), `spec-quality-lifecycle-standard` (TC body quality), `api-setup-teardown-standard` (API layer + setup/teardown infrastructure) and `git-standards` (git workflow conventions). Invoke those sub-skills directly for targeted checks.

## Project Context

Verified against the repo files. If a value below disagrees with the real file, the file wins — fix this section (see Growth Consideration 6).

### Tech stack

| Dependency | Version | Impact on rules |
|---|---|---|
| `@playwright/test` | ^1.64.1 | `test.step()` ✅ · native `tag` option ✅ · trace viewer ✅ |
| `typescript` | ^7.0.2 | strict mode · ES2022 target |
| `dotenv` | ^18.0.9 | env vars loaded in `src/config/Env.ts` before any test runs |
| `@types/node` | ^26.6.5 | `"type": "commonjs"` in package.json |

### tsconfig.json settings

| Setting | Value | Why it matters |
|---|---|---|
| `target` | `ES2022` | `useDefineForClassFields: true` → locators MUST be `get` properties |
| `module` / `moduleResolution` | `NodeNext` | affects how path aliases resolve |
| `strict` | `true` | no implicit any |
| `noUncheckedIndexedAccess` | `true` | index access returns `T \| undefined` |
| `noImplicitOverride` | `true` | subclass overrides need `override` |
| `noEmit` | `true` | type-check only |

### Path aliases (only allowed import style — relative paths are always a violation)

| Alias | Resolves to | Used by |
|---|---|---|
| `@pages/*` | `src/ui/pages/*` | pom-architect, test-standards |
| `@components/*` | `src/ui/components/*` | pom-architect |
| `@fixtures` · `@fixtures/*` | `src/fixtures/index` · `src/fixtures/*` | test-standards |
| `@data/*` | `src/data/*` | test-standards, pom-architect |
| `@config/*` | `src/config/*` | test-standards |
| `@test/*` | `test/*` | spec files |
| `@api/*` | `src/api/*` | test-standards (API setup/teardown, per site) |
| `@helpers/*` | `src/helpers/*` | reserved (folder does not exist yet) |

### Folder structure

```
src/ui/pages/BasePage.ts                shared base class (all sites)
src/ui/pages/sites/<site>/              Page Objects per site (pom-architect)      src/ui/components/  reserved
src/api/client/ApiClient.ts             only HTTP entry point (shared)             (api-setup-teardown-standard)
src/api/sites/<site>/                   per site: endpoints/ (URL constants) · models/ (interfaces) ·
                                        controllers/ (business operations) · mocks/ (route stubs)   (api-setup-teardown-standard)
src/data/sites/<site>/                  test data per site (auth.data.ts, ...)   (spec-data-standard)
src/fixtures/index.ts                   mergeTests(...) of the per-site fixture files
src/fixtures/sites/<site>.fixtures.ts   Playwright fixtures per site (test-standards)
src/config/Env.ts                       validated env vars (shared; fails fast if BASE_URL missing)   (spec-data-standard)
test/ui/{suite}/sites/<site>/{feature}/TC{N}-name.spec.ts   specs — {testRoot}/ui/{suite}/sites/<site>/{feature}/
docs/decisions/     ADRs for hub growth
.claude/skills/     skill definitions
```

Layered, per-site architecture: every layer (ui, api, data, fixtures, tests) is split by site under a `sites/` folder. Current sites: `saucedemo`, `automationexercise`, `demoqa`. A new site means a new `<site>` folder in each layer it needs. Only `BasePage` and `config` are shared across sites.

### playwright.config.ts

| Setting | Value |
|---|---|
| `testDir` | `./test` (this is `{testRoot}`; never hardcode it elsewhere) |
| `baseURL` | `Env.baseUrl` (from `.env` `BASE_URL`) |
| `fullyParallel` | `true` |
| `retries` / `workers` | `2` / `1` on CI, `0` / default locally |
| `forbidOnly` | `true` on CI |
| `trace` / `screenshot` | `retain-on-failure` / `only-on-failure` |
| `reporter` | `list` + `html` (`open: 'never'`) |
| Projects | chromium · firefox · webkit |

### npm scripts

`typecheck` (`tsc --noEmit` — run after any code change) · `test` (`playwright test`). No `test:smoke` yet; e.g. `playwright test test/ui/smoke`.

### BasePage contract (`src/ui/pages/BasePage.ts`)

`abstract class BasePage` · `constructor(protected readonly page: Page)` · `get currentPage(): Page` (for fixtures passing the page to another PO) · `async navigate(path = '/')`. All Page Objects extend it; none redeclares the constructor or overrides `navigate()`.

## Modes (7 of 10 slots used)

### Mode 1 — Full pipeline (default)
**Triggered by:** "aplicar arquitectura", "apply architecture", "full review", "enforce all rules"

0. Run `spec-requirements-standard` M0 on `docs/test-cases/**` (report only, no auto-fix except Q13). TCs graded Incomplete are listed as manual items.
1. Identify all relevant files (specs, Page Objects, fixtures, data files).
2. Run `pom-architect` — detect + auto-fix all POM violations.
3. Run `ui-locator-wait-standard` (M1–M5 rules) on Page Objects, specs, fixtures and config — auto-fix R1 (test-id contract), R9, R11, R13, R15, R16, R20; collect R1–R8, R10, R12, R14, R17–R19 as manual fixes. M0 (assessment) is report-only and M6 (executes tests) is never run by the pipeline.
4. Run `test-standards` — detect + auto-fix all test writing violations.
5. Run `spec-standards` — detect + auto-fix folder, naming, TC ID and `test.step()` violations (never invents TC numbers; reports those as manual).
6. Run `spec-quality-lifecycle-standard` on `{testRoot}/**/*.spec.ts` — auto-fix R4; collect R1, R2, R6–R12 as manual fixes (R3, R5 are delegated to `ui-locator-wait-standard`).
7. Run `api-setup-teardown-standard` on `src/api/**`, `src/fixtures/sites/*.fixtures.ts` and `{testRoot}/**/*.spec.ts` — auto-fix R1–R3, R5–R8, R10; collect R4 (teardown) and R9 (token refresh) as manual fixes.
8. Run `spec-data-standard` (M1–M4 rules) on `src/fixtures/**`, `src/data/**`, `src/config/**`, `playwright.config.ts` and specs — auto-fix R2, R3, R6–R9, R11; collect R1, R4, R5, R10, R12–R15 as manual fixes. M0 (assessment) and M5 (executes tests) are never run by the pipeline.
9. Output a unified summary. Run order matters — see Growth Consideration 8.

### Mode 2 — Structure only
**Triggered by:** "revisar estructura", "check structure", "verify folders"

1. Check all files are in their correct folder.
2. Check all imports use path aliases.
3. Report only — no auto-fix unless explicitly requested.

### Mode 3 — Scaffold new file
**Triggered by:** "generar", "crear", "scaffold", "nuevo Page Object", "new page"

1. Ask: page name + URL path + locators + requires authentication? (infer from context where possible).
2. Generate `src/ui/pages/sites/<site>/<Name>Page.ts` (ask which site) extending `BasePage` — only getters and action methods, no constructor, no `navigate()`.
   Getters follow the `ui-locator-wait-standard` R1 hierarchy for the resolved test-id contract and use only locators observed in the DOM (R4); otherwise generate the getter with `// TODO: verify locator in DOM`.
3. Register the fixture in `src/fixtures/sites/<site>.fixtures.ts` (it reaches `@fixtures` through `mergeTests` in `src/fixtures/index.ts`; a new site also needs its file added to that `mergeTests` call):
   - No auth → `async ({ page }, use)` → call `navigate()`.
   - Auth required → `async ({ authenticatedPage }, use)` → use `authenticatedPage.page`.
4. Generate `{testRoot}/ui/{suite}/sites/<site>/{feature}/TC{N}-<name>.spec.ts` (per `spec-standards`; ask for `N`) importing from `@fixtures` and `@data`, with a `describe` block named after the feature folder and steps in `test.step()`.
5. Verify zero relative imports in all generated files.

### Mode 4 — Git workflow
**Triggered by:** "check git", "verify commits", "git conventions", "git workflow", "commit push PR", "create PR"

Thin wrapper — no git logic lives in the hub.

1. Invoke `git-standards` (Skill tool) with the user's request.
2. Forward its output verbatim.

Load `git-standards` directly for standalone git work without activating the hub.

### Mode 5 — README sync
**Triggered by:** "update readme", "sync readme", "readme out of date", "update docs". Also suggested by `git-standards` C4 when architectural files change without a README edit.

**Use after:** adding/retiring a skill or mode, changing structure, adding an npm script, or finishing a course module.

Tracked sections (source of truth → README section, numbering from `docs/skills/readme-update-prompt.md`):

| README section | Source of truth |
|---|---|
| §3 Prerequisites | `package.json` devDependencies + `.claude/` presence |
| §5 Available Commands | `package.json` scripts |
| §6 Repository Structure | real folder tree + `.claude/skills/` directories |
| §7 Framework Architecture | `BasePage.ts` · `src/fixtures/index.ts` |
| §9 Claude Code Skills | `.claude/skills/*/SKILL.md` frontmatter (`name`, `description`) |
| §10 Git Workflow | `git-standards` SKILL.md conventions |

Manual-only (report as out of scope, never edit): §1 Description · §2 Learning Path · §4 Quick Start · §8 Environment Setup · §11 Contribution.

Steps:
1. Read `README.md`. If it is still the placeholder stub (no numbered sections), stop and tell the user to generate the README from `docs/skills/readme-update-prompt.md` first.
2. Compare each tracked section with its source; update in place only where they differ. Leave in-sync sections untouched.
3. Do not commit — hand off to Mode 4 if the user wants that.

```
[automation-architect] README SYNC
─────────────────────────────────────────
§3 Prerequisites:     IN SYNC | UPDATED
§5 Commands:          IN SYNC | UPDATED — <what>
§6 Structure:         IN SYNC | UPDATED — <what>
§7 Architecture:      IN SYNC | UPDATED — <what>
§9 Claude Code Skills: IN SYNC | UPDATED — <what>
§10 Git Workflow:     IN SYNC | UPDATED — <what>
[automation-architect] ✅ README is up to date. | README updated — <N> section(s) changed.
```

### Mode 6 — TC Quality Review
**Triggered by:** "review tc quality", "check test quality", "scan for flaky patterns", "tc quality", "assess test cases", "refine test case", "write test case", "tc coverage", "automation readiness", "data robustness", "parallel safe", "multi environment", "assess test data", "verify robustness"

Thin wrapper — no quality rules live in the hub. Use after writing/refactoring test cases, when a test is intermittently failing, and before any PR with new or modified specs.

1. Route by target: TC **documents** (`docs/test-cases/**`, or the "assess / refine / write / coverage / automation readiness" triggers) → invoke `spec-requirements-standard` (phase 1, Specify). TC **code** → invoke `spec-quality-lifecycle-standard` (Skill tool): single file given → Enforce on that file; otherwise all `{testRoot}/**/*.spec.ts`.
   Locator / wait / polling requests ("review locators", "fix waits", "assess locators", "strict mode violation", "polling", "verify interactions", "flaky interaction") → invoke `ui-locator-wait-standard` (no mode of its own): Act → M0–M5, Run → M6.
   Test **data robustness** requests ("data robustness", "parallel safe", "multi environment", "assess test data", "verify robustness") → invoke `spec-data-standard` (no mode of its own): assess/Arrange → M0–M3, Assert → M4, Run → M5.
2. Forward its output verbatim.

Load `spec-requirements-standard`, `spec-quality-lifecycle-standard`, `ui-locator-wait-standard` or `spec-data-standard` directly for standalone TC review without activating the hub.

### Mode 7 — Lifecycle Infrastructure
**Triggered by:** "setup api layer", "scaffold api", "new controller", "add lifecycle support", "lifecycle architect"

Thin wrapper — no API-layer rules live in the hub. Use when implementing API-based setup/teardown for a test case or extending the API layer with a new resource.

1. Invoke `api-setup-teardown-standard` (Skill tool).
2. Pick the mode automatically: `src/api/client/ApiClient.ts` missing → **New**; it exists and the site/resource has no controller → **Add**.
3. Forward its output verbatim.

Load `api-setup-teardown-standard` directly for standalone API-layer work without activating the hub.

## Output format

Full pipeline:

```
[automation-architect] PIPELINE COMPLETE
─────────────────────────────────────────
pom-architect:    X violations found — Y auto-applied
ui-locator-wait-standard: X violations found — Y auto-applied
test-standards:   X violations found — Y auto-applied
spec-standards:   X violations found — Y auto-applied
spec-requirements-standard: X TC gaps found — Y auto-applied (Q13 only)
spec-quality-lifecycle-standard: X violations found — Y auto-applied
api-setup-teardown-standard: X violations found — Y auto-applied
spec-data-standard: X violations found — Y auto-applied
Remaining manual fixes: <list if any, or "none">
[automation-architect] ✅ All rules satisfied.
```

Scaffold:

```
[automation-architect] SCAFFOLD COMPLETE
─────────────────────────────────────────
Created:  src/ui/pages/sites/<site>/<Name>Page.ts
Updated:  src/fixtures/sites/<site>.fixtures.ts
Created:  {testRoot}/ui/{suite}/sites/<site>/{feature}/TC{N}-<name>.spec.ts
```

## Sub-Skill Registry

Single source of truth for all skills. Update whenever a skill is added, changed or retired.

| Skill | Domain | File scope | Rules / checks | Status |
|---|---|---|---|---|
| `pom-architect` | Page Object structure | `src/ui/pages/**/*.ts` (incl. `sites/<site>/`) · `src/ui/components/**/*.ts` | R1–R8 | Active |
| `ui-locator-wait-standard` | Locator strategy · uniqueness · action semantics · waits · polling · timeouts | `src/ui/pages/**` · `src/ui/components/**` · `{testRoot}/**/*.spec.ts` · `src/fixtures/**` · `playwright.config.ts` | R1–R20 · M0–M6 | Active |
| `test-standards` | Spec code quality | `test/**/*.spec.ts` · `src/fixtures/**/*.ts` | R1–R9 | Active |
| `spec-standards` | Spec organisation & lifecycle | `{testRoot}/**/*.spec.ts` | R1–R5 | Active |
| `spec-requirements-standard` | TC specification: traceability · preconditions · data · oracles · postconditions · readiness | `docs/test-cases/**/*.md` | Q1–Q13 · M0–M4 | Active |
| `spec-quality-lifecycle-standard` | TC body quality · preconditions · assertions · independence | `{testRoot}/**/*.spec.ts` · `src/ui/pages/**/*.ts` · `src/fixtures/sites/*.fixtures.ts` · `src/api/sites/**` | R1–R12 | Active |
| `api-setup-teardown-standard` | API layer structure · setup/teardown · fixture injection | `src/api/**/*.ts` · `src/fixtures/sites/*.fixtures.ts` · `{testRoot}/**/*.spec.ts` | R1–R10 | Active |
| `spec-data-standard` | Test data: classification · isolation · sourcing · environments · expected values | `src/data/**` · `src/config/**` · `src/fixtures/**` · `playwright.config.ts` · `{testRoot}/**/*.spec.ts` | R1–R15 · M0–M5 | Active |
| `git-standards` | Git workflow | git state (no files) | C1–C4, E1–E5 | Active |

### Scan scope ownership

Each file type is owned by exactly one skill per concern; no two skills check the same property on the same file.

| File / scope | Owner | Concern |
|---|---|---|
| `src/ui/pages/**`, `src/ui/components/**` | `pom-architect` | POM structure, locators, actions |
| `src/fixtures/**/*.ts` | `test-standards` | fixture completeness, import hygiene |
| specs — imports, fixtures, credentials | `test-standards` | code quality |
| specs — folder, naming, TC IDs, steps | `spec-standards` | organisation |
| `docs/test-cases/**/*.md` | `spec-requirements-standard` | specification content quality (Q1–Q13); Mode 5 never edits these files |
| specs — preconditions/postconditions | `spec-quality-lifecycle-standard` | R1, R2, R11, R12 |
| specs — assertion quality, navigation | `spec-quality-lifecycle-standard` | R4, R6, R9, R10 |
| `src/ui/pages/**` — locator expression and actions | `ui-locator-wait-standard` | R1–R12 (replaces `spec-quality-lifecycle-standard` R5) |
| specs — waits and synchronisation | `ui-locator-wait-standard` | R13–R16 (replaces `spec-quality-lifecycle-standard` R3) |
| specs · `src/fixtures/**` — polling and timeouts | `ui-locator-wait-standard` | R17–R20 |
| `playwright.config.ts` — test-id contract, timeout layers | `ui-locator-wait-standard` | R1, R19 |
| specs — independence, determinism | `spec-quality-lifecycle-standard` | R7, R8 |
| `src/api/client/**` | `api-setup-teardown-standard` | HTTP entry point, status checking (R1, R10) |
| `src/api/sites/*/controllers/**` | `api-setup-teardown-standard` | controller structure and dependencies (R1–R3, R6) |
| `src/api/sites/*/endpoints/**`, `models/**` | `api-setup-teardown-standard` | URL centralisation, interface placement (R6) |
| `src/api/sites/*/mocks/**` | `api-setup-teardown-standard` | route stub structure (R2, R5, R6) |
| `src/fixtures/sites/*.fixtures.ts` — teardown contract, naming, token refresh | `api-setup-teardown-standard` | R4, R8, R9 (other fixture concerns stay with `test-standards`) |
| specs — controller/client instantiation | `api-setup-teardown-standard` | R7 |
| `src/data/**` — shape, typing, uniqueness | `spec-data-standard` | R2, R3, R6 |
| `src/config/**` — environment selection and validation | `spec-data-standard` | R9 |
| `src/fixtures/**` — fixture scope and data identity | `spec-data-standard` | R1, R12, R15 (teardown contract stays with `api-setup-teardown-standard`) |
| `playwright.config.ts` — parallelism suppression | `spec-data-standard` | R4 |
| specs — data sourcing, env literals, data tags, expected-value source | `spec-data-standard` | R5, R7, R8, R10, R11, R13, R14 |
| other `src/**/*.ts` | `test-standards` | import hygiene only |
| branch + commit history | `git-standards` | workflow conventions |

### Sub-skill invocation reference

| Goal | Skill to load | Trigger phrase example |
|---|---|---|
| Fix Page Object violations | `pom-architect` | "check page objects" |
| Fix spec code quality (imports, fixtures, credentials) | `test-standards` | "check test standards" |
| Fix TC folder / naming / step violations | `spec-standards` | "check spec structure" |
| Score TC specifications | `spec-requirements-standard` | "assess test cases" |
| Upgrade an incomplete TC | `spec-requirements-standard` | "refine test case TC02" |
| Prepare a TC for automation | `spec-requirements-standard` | "automation readiness TC02" |
| Review TC quality and anti-flakiness patterns | `spec-quality-lifecycle-standard` | "review tc quality" |
| Assess locator and wait maturity | `ui-locator-wait-standard` | "assess locators" |
| Fix fragile locators / strict-mode violations | `ui-locator-wait-standard` | "review locators" |
| Replace fixed waits / add bounded polling | `ui-locator-wait-standard` | "fix waits" |
| Prove interactions are stable with evidence | `ui-locator-wait-standard` | "verify interactions" |
| Scaffold or extend the API layer for setup/teardown | `api-setup-teardown-standard` | "scaffold api for books" |
| Assess test data maturity | `spec-data-standard` | "assess test data" |
| Make tests safe in parallel | `spec-data-standard` | "parallel safe" |
| Verify robustness with evidence | `spec-data-standard` | "verify robustness" |
| Validate git conventions or run full git workflow | `git-standards` | "check git" / "git workflow" |

Individual violations are reported in the sub-skill format:

```
[skill-name] SEVERITY — RULE NAME
File:  <path>
Line:  <number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED
```

## Hub Growth Policy

Modes are added only as the course progresses. To prevent uncontrolled growth and context overload, these rules are mandatory:

**Rule 1 — Add a mode only for a real gap.** State which existing modes were considered and why they do not cover it.

**Rule 2 — Document the gap in an ADR first.** `docs/decisions/` records the gap, options (extend vs. add) and decision. No ADR, no mode.

**Rule 3 — One domain per mode.** A mode spanning unrelated domains must be split or merged into the closest existing mode.

**Rule 4 — Maximum 10 modes.** Beyond 10, review existing modes for consolidation first (keeps this file within one context window).

**Rule 5 — Retire modes that no longer apply.** Mark `[RETIRED — reason]`; do not delete.

**Rule 6 — Update the README when the architecture changes.** Run Mode 5 before or alongside the PR.

| Event | README sections affected |
|---|---|
| Skill added or retired / mode added | §9 Claude Code Skills, §6 Repository Structure |
| New folder | §6 Repository Structure |
| New npm script | §5 Available Commands |
| Git conventions change | §10 Git Workflow |
| New framework pattern | §7 Framework Architecture |
| Course module completes | §2 Learning Path (manual) |

These rules are enforced by the team, not by the skill itself.

## Framework Growth Considerations

Complement the Hub Growth Policy, which governs mode slots.

1. **Context budget.** Hub `SKILL.md` < 500 lines (review modes when exceeded); any sub-skill < 400 lines (split into two focused skills). Estimate line cost before adding; prefer concise rules.
2. **Scan scope discipline.** Before adding a rule, check Scan scope ownership. Unclaimed → add and update the table. Claimed → extend the owning skill.
3. **New skill checklist.** Confirm the domain gap (Policy Rule 1) · ADR in `docs/decisions/` (Rule 2) · `SKILL.md` in `.claude/skills/<name>/` with valid `name` + `description` frontmatter · Registry + ownership rows · wire into Mode 1 · invocation-reference row · zero scan overlap · note minimum Playwright version for version-specific APIs.
4. **Playwright versions.** `test.step()` needs 1.22 (`spec-standards` R5); native `{ tag: [] }` needs 1.42 (future tagging rules). `ui-locator-wait-standard` depends on `getByTestId` / `getByAltText` / `getByTitle`, `pressSequentially` (≥ 1.38, replaces `type`) and `expect.poll` / `toPass` options. Document version-specific APIs inline when a rule depends on them.
5. **tsconfig impact.** `target` below ES2022 → review `pom-architect` getter rule · `strict` off → type-safety rules less critical · alias added/removed → update the alias map in `test-standards` and `pom-architect` · `moduleResolution` changed → re-verify import examples in all skills.
6. **Breaking-change propagation.** `BasePage` → `pom-architect` R1, R5 · `src/fixtures/sites/*.fixtures.ts` pattern → `test-standards` R3, R4 · `src/data/sites/<site>/auth.data.ts` → `test-standards` R8, `pom-architect` R8 · `src/config/Env.ts` (new variable / `TEST_ENV`) → data-hygiene examples, `spec-data-standard` R9 · `playwright.config.ts` `testDir` → `spec-standards` R1 · `playwright.config.ts` `testIdAttribute` / timeouts → `ui-locator-wait-standard` R1, R19 and `pom-architect` getter examples. Also re-check this Project Context section.
7. **Deprecation.** Mark `[DEPRECATED — reason — YYYY-MM]`, keep one full module cycle without auto-fixing it, remove at the start of the next module with an ADR note, update the Registry counts. Never delete immediately.
8. **Execution order (Mode 1).** `spec-requirements-standard` (report only) → `pom-architect` → `ui-locator-wait-standard` → `test-standards` → `spec-standards` → `spec-quality-lifecycle-standard` → `api-setup-teardown-standard` → `spec-data-standard` → `git-standards` (last, before push/PR). Unfixed PO violations cause false positives in the spec skills.
