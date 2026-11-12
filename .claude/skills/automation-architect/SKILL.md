---
name: automation-architect
description: Hub skill that orchestrates pom-architect, test-standards, spec-standards and git-standards for Playwright + TypeScript projects. Use for full architecture enforcement (review + auto-fix) on existing files, to scaffold new Page Objects, fixtures and spec files, to sync the README with the architecture, or to consult the project context, sub-skill registry and framework growth rules. Invoke sub-skills independently for targeted checks.
---

# automation-architect (hub)

Orchestrates `pom-architect`, `test-standards`, `spec-standards` (TC organisation rules) and `git-standards` (git workflow conventions). Invoke those sub-skills directly for targeted checks.

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
| `@helpers/*` · `@api/*` | `src/helpers/*` · `src/api/*` | reserved (folders do not exist yet) |

### Folder structure

```
src/ui/pages/       Page Objects (pom-architect)       src/ui/components/  reserved
src/fixtures/       Playwright fixtures (test-standards)
src/data/           test data: auth.data.ts, products.data.ts
src/config/Env.ts   validated env vars (fails fast if BASE_URL missing)
test/               specs — target layout {testRoot}/{suite}/{feature}/TC{N}-name.spec.ts
docs/decisions/     ADRs for hub growth
.claude/skills/     skill definitions
```

Current specs sit flat in `test/`; `spec-standards` R1 moves them into `{suite}/{feature}/`.

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

`typecheck` (`tsc --noEmit` — run after any code change) · `test` (`playwright test`). No `test:smoke` yet; once suites are folders it would be `playwright test test/smoke`.

### BasePage contract (`src/ui/pages/BasePage.ts`)

`abstract class BasePage` · `constructor(protected readonly page: Page)` · `get currentPage(): Page` (for fixtures passing the page to another PO) · `async navigate(path = '/')`. All Page Objects extend it; none redeclares the constructor or overrides `navigate()`.

## Modes (5 of 10 slots used)

### Mode 1 — Full pipeline (default)
**Triggered by:** "aplicar arquitectura", "apply architecture", "full review", "enforce all rules"

1. Identify all relevant files (specs, Page Objects, fixtures, data files).
2. Run `pom-architect` — detect + auto-fix all POM violations.
3. Run `test-standards` — detect + auto-fix all test writing violations.
4. Run `spec-standards` — detect + auto-fix folder, naming, TC ID and `test.step()` violations (never invents TC numbers; reports those as manual).
5. Output a unified summary. Run order matters — see Growth Consideration 8.

### Mode 2 — Structure only
**Triggered by:** "revisar estructura", "check structure", "verify folders"

1. Check all files are in their correct folder.
2. Check all imports use path aliases.
3. Report only — no auto-fix unless explicitly requested.

### Mode 3 — Scaffold new file
**Triggered by:** "generar", "crear", "scaffold", "nuevo Page Object", "new page"

1. Ask: page name + URL path + locators + requires authentication? (infer from context where possible).
2. Generate `src/ui/pages/<Name>Page.ts` extending `BasePage` — only getters and action methods, no constructor, no `navigate()`.
3. Register the fixture in `src/fixtures/index.ts`:
   - No auth → `async ({ page }, use)` → call `navigate()`.
   - Auth required → `async ({ authenticatedPage }, use)` → use `authenticatedPage.page`.
4. Generate `{testRoot}/{suite}/{feature}/TC{N}-<name>.spec.ts` (per `spec-standards`; ask for `N`) importing from `@fixtures` and `@data`, with a `describe` block named after the feature folder and steps in `test.step()`.
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

Tracked sections (source of truth → README section, numbering from `readme-update-prompt.md`):

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
1. Read `README.md`. If it is still the placeholder stub (no numbered sections), stop and tell the user to generate the README from `readme-update-prompt.md` first.
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

## Output format

Full pipeline:

```
[automation-architect] PIPELINE COMPLETE
─────────────────────────────────────────
pom-architect:    X violations found — Y auto-applied
test-standards:   X violations found — Y auto-applied
spec-standards:   X violations found — Y auto-applied
Remaining manual fixes: <list if any>
[automation-architect] ✅ All rules satisfied.
```

Scaffold:

```
[automation-architect] SCAFFOLD COMPLETE
─────────────────────────────────────────
Created:  src/ui/pages/<Name>Page.ts
Updated:  src/fixtures/index.ts
Created:  {testRoot}/{suite}/{feature}/TC{N}-<name>.spec.ts
```

## Sub-Skill Registry

Single source of truth for all skills. Update whenever a skill is added, changed or retired.

| Skill | Domain | File scope | Rules / checks | Status |
|---|---|---|---|---|
| `pom-architect` | Page Object structure | `src/ui/pages/**/*.ts` · `src/ui/components/**/*.ts` | R1–R8 | Active |
| `test-standards` | Spec code quality | `test/**/*.spec.ts` · `src/fixtures/index.ts` | R1–R8 | Active |
| `spec-standards` | Spec organisation & lifecycle | `{testRoot}/**/*.spec.ts` | R1–R5 | Active |
| `git-standards` | Git workflow | git state (no files) | C1–C4, E1–E5 | Active |

### Scan scope ownership

Each file type is owned by exactly one skill per concern; no two skills check the same property on the same file.

| File / scope | Owner | Concern |
|---|---|---|
| `src/ui/pages/**`, `src/ui/components/**` | `pom-architect` | POM structure, locators, actions |
| `src/fixtures/index.ts` | `test-standards` | fixture completeness, import hygiene |
| specs — imports, fixtures, credentials | `test-standards` | code quality |
| specs — folder, naming, TC IDs, steps | `spec-standards` | organisation |
| other `src/**/*.ts` | `test-standards` | import hygiene only |
| branch + commit history | `git-standards` | workflow conventions |

### Sub-skill invocation reference

| Goal | Skill to load | Trigger phrase example |
|---|---|---|
| Fix Page Object violations | `pom-architect` | "check page objects" |
| Fix spec code quality (imports, fixtures, credentials) | `test-standards` | "check test standards" |
| Fix TC folder / naming / step violations | `spec-standards` | "check spec structure" |
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
4. **Playwright versions.** `test.step()` needs 1.22 (`spec-standards` R5); native `{ tag: [] }` needs 1.42 (future tagging rules). Document version-specific APIs inline when a rule depends on them.
5. **tsconfig impact.** `target` below ES2022 → review `pom-architect` getter rule · `strict` off → type-safety rules less critical · alias added/removed → update the alias map in `test-standards` and `pom-architect` · `moduleResolution` changed → re-verify import examples in all skills.
6. **Breaking-change propagation.** `BasePage` → `pom-architect` R1, R5 · `src/fixtures/index.ts` pattern → `test-standards` R3, R4 · `src/data/auth.data.ts` → `test-standards` R7, `pom-architect` R8 · `src/config/Env.ts` → data-hygiene examples · `playwright.config.ts` `testDir` → `spec-standards` R1. Also re-check this Project Context section.
7. **Deprecation.** Mark `[DEPRECATED — reason — YYYY-MM]`, keep one full module cycle without auto-fixing it, remove at the start of the next module with an ADR note, update the Registry counts. Never delete immediately.
8. **Execution order (Mode 1).** `pom-architect` → `test-standards` → `spec-standards` → `git-standards` (last, before push/PR). Unfixed PO violations cause false positives in the spec skills.
