# Notes — `spec-quality-lifecycle-standard` (adapting the Kiro prompt to Claude Code)

Source prompt: [spec-quality-lifecycle-standard-prompt.md](../skills/spec-quality-lifecycle-standard-prompt.md)
Result: [.claude/skills/spec-quality-lifecycle-standard/SKILL.md](../../.claude/skills/spec-quality-lifecycle-standard/SKILL.md)
Decision record: [docs/decisions/0002-add-spec-quality-lifecycle-standard-mode-6.md](../decisions/0002-add-spec-quality-lifecycle-standard-mode-6.md)

Last updated: 2026-11-15 (API layer split into `client/` + `endpoints/` + `models/` + `controllers/`; `api-setup-teardown-standard` now exists; TC02 reviewed with Mode 6). Earlier: 2026-11-14 (layered per-site structure, rules R11–R12, hardened teardown).

## What the skill does

Owns the quality **inside** each `test()` body (the other skills own structure, imports and Page Objects). It targets the root causes of flaky tests with **12 rules**:

| Rule | Name | Severity | Fix | Scope |
|---|---|---|---|---|
| R1 | PRECONDITION_ASSERTED | ERROR | manual | specs |
| R2 | POSTCONDITION_GUARANTEED | ERROR | manual | specs |
| R3 | NO_HARDCODED_WAITS | ERROR | auto | specs, Page Objects |
| R4 | WEB_FIRST_ASSERTIONS | ERROR | auto | specs, Page Objects (`assert*`) |
| R5 | RESILIENT_LOCATORS | WARNING | manual | Page Objects |
| R6 | STEP_ASSERTS_RESULT | WARNING | manual | specs |
| R7 | TEST_IS_INDEPENDENT | ERROR | manual | specs |
| R8 | NO_CONDITIONAL_IN_TEST_BODY | ERROR | manual | specs |
| R9 | NAVIGATE_THEN_ASSERT | ERROR | manual | specs |
| R10 | ASSERTION_SPECIFICITY | WARNING | manual | specs |
| **R11** | **TEARDOWN_VERIFIED** | ERROR | manual | `src/fixtures/sites/*.fixtures.ts`, `src/api/sites/**` |
| **R12** | **SHARED_ACCOUNT_ISOLATION** | WARNING | manual | `playwright.config.ts` + specs using a shared-account fixture |

Two modes: **Enforce** (scan + report) and **Create** (scaffold a TC with precondition step, action+assertion steps, postcondition step).

### Latest rules (R11, R12) — why they exist
Both came from running TC02 for real:
- **R11 — TEARDOWN_VERIFIED.** A `clean<Resource>` fixture must clean **before and after** the test, and the clean must be **verified** by reading the resource back (retry, then throw if anything is left). A `204` from the delete call did not guarantee an empty collection: a book stayed in the user's profile after a run.
- **R12 — SHARED_ACCOUNT_ISOLATION.** chromium, firefox and webkit ran in parallel against one demoqa account. Each run logs in and clears that account, so runs invalidated each other (`User not authorized!`, leftover data). Fix: one account per browser, or one worker / one project (e.g. `test.skip` for the other browsers with a written reason). `describe.configure({ mode: 'serial' })` does not help across projects.

## Kiro → Claude Code adaptations

| Prompt said | Applied here | Why |
|---|---|---|
| `.kiro/skills/` | `.claude/skills/` | where this repo's skills live |
| `tests/` | `{testRoot}` (= `test/`, read from `playwright.config.ts`) | repo uses `testDir: ./test`; never hardcode |
| Sub-skills `ui-pom-standard`, `spec-code-standard`, `spec-organisation-standard`, `api-setup-teardown-standard` | `pom-architect`, `test-standards`, `spec-standards` (no API skill yet) | those are the real skill names; ADR-001 renaming is not applied |
| New skill = 7th, new mode = Mode 7, "7 of 10 slots" | 5th skill, **Mode 6**, "6 of 10 slots" | hub had 5 modes |
| Pipeline step after `api-setup-teardown-standard` | step 5, after `spec-standards` | that skill doesn't exist |
| R2 flags any mutating action | only **persistent** data; session-only state (e.g. SauceDemo cart) is ignored | avoids false positives |
| R4 applies to Page Objects | only inside `assert*` methods | `pom-architect` already forbids `expect()` in POs |
| BookStore examples | SauceDemo examples | match existing specs |

The skill name follows ADR-001 (`{domain}-{objective}-standard`). The hub's Growth Policy required an ADR before adding the mode, so ADR 0002 was written first.

## Hub changes ([automation-architect/SKILL.md](../../.claude/skills/automation-architect/SKILL.md))

Description/intro · Mode 1 step 5 · new Mode 6 (thin wrapper, no rules in hub) · pipeline output line · Sub-Skill Registry (now R1–R12 and the fixture/API scope) · Scan scope ownership (R11, R12 added) · invocation reference · execution order (`… → spec-standards → spec-quality-lifecycle-standard → git-standards`) · layered per-site folder tree and aliases.

## Project structure (layered, per site)

Every layer is split by site under `sites/`. Sites: `saucedemo`, `automationexercise`, `demoqa`. Only `BasePage` and `src/config/` are shared.

| Layer | Location |
|---|---|
| Specs | `test/ui/{smoke\|regression}/sites/<site>/<feature>/TC{N}-<name>.spec.ts` |
| Page Objects | `src/ui/pages/sites/<site>/` (+ shared `src/ui/pages/BasePage.ts`) |
| Fixtures | `src/fixtures/sites/<site>.fixtures.ts`, merged with `mergeTests` in `src/fixtures/index.ts` |
| Data | `src/data/sites/<site>/` |
| API | `src/api/sites/<site>/` |

## First real use: TC02 (demoqa Book Store)

Prompt: scaffold TC02 "Add a book to the user's collection" via the hub + the Create mode.

Created:
- Spec: `test/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts`
- Page Objects: `src/ui/pages/sites/demoqa/` — `BookStorePage`, `BookStoreLoginPage`, `BookDetailPage`, `ProfilePage`
- API: `src/api/` (see "API layer" below)
- Fixtures: `src/fixtures/sites/demoqa.fixtures.ts` — page fixtures plus `cleanBookshelf` (API clean before **and** after)
- Data/config: `demoqaUser` in `src/data/sites/demoqa/auth.data.ts`; `demoqaUrl` / `demoqaUser` in `src/config/Env.ts`

(The first version lived at `test/smoke/books/` and `src/fixtures/index.ts`; it was moved when the project switched to the per-site structure.)

How the rules showed up in the spec: R1 first step asserts "not logged in + catalog reachable" · R2 `cleanBookshelf` · R6/R9 every action step ends with an assertion, navigation is followed by one · R10 the added book is asserted **by title**, not just "a row exists" · R11 `cleanBookshelf` verifies the collection is empty · R12 the spec runs on chromium only (`test.skip` for other browsers, with a reason).

Result: passes on chromium (~24 s); firefox and webkit are skipped on purpose (R12).

## API layer: `src/api/`

**Current state (2026-11-15):** layered per `api-setup-teardown-standard`. Details: [demoqa-api-layer.md](../wiki/api/demoqa-api-layer.md).

```
src/api/
  client/ApiClient.ts                      only HTTP entry point (throws on non-2xx)
  sites/demoqa/
    endpoints/   account.endpoints.ts · books.endpoints.ts
    models/      account.model.ts · book.model.ts
    controllers/ AccountController.ts (authenticate, getUser)
                 BookController.ts (getAll, addToCollection, deleteOne, deleteAll)
```

- The cleanup (authenticate, delete all, read back, retry up to 3 times, throw with the number of books left — R11) lives in the `cleanBookshelf` fixture's `emptyCollection()` helper, built from the controllers. It re-authenticates on every attempt because the UI login invalidates the setup token (`api-setup-teardown-standard` R9).
- `getAll`, `addToCollection` and `deleteOne` are not used by any fixture yet.
- Verified: `tsc --noEmit` passes and `playwright test --list` finds all 21 tests. The Playwright run itself was not repeated after the refactor.

### Lessons / gotchas
- **Credentials** live in `.env` (`DEMOQA_USER`, `DEMOQA_PASSWORD`, gitignored), exposed through `demoqaUser`. Never in specs (`test-standards` R8).
- **SSL:** Node API calls failed with `unable to get local issuer certificate` (corporate proxy). Fix: `process.env.NODE_USE_SYSTEM_CA ??= '1'` in `playwright.config.ts`. The browser is unaffected. Do not "fix" it with `ignoreHTTPSErrors`. See `notes_fixCertificate.md`.
- **Locators:** demoqa's table classes (`.rt-tr-group`) didn't match; role-based `getByRole('row')` did (R5).
- The TC doc says "title added in step 3" — it is really step 5 (first book's title). The spec captures the title from the catalog.
- Alert handling lives in `BookDetailPage.addToCollection()` (`waitForEvent('dialog')`), which returns the message so the spec asserts it (no `expect` in POs).
- Parallel browsers on one account caused `User not authorized!` and leftover books — see R11/R12 and `notes_Fix_TC02-add-book-to-collection.md`.

## Open items
- ~~Run Mode 6 on the existing specs~~ — done for TC02 (2026-11-15): 0 errors, 1 warning (R5: `BookStorePage.pageHeading` uses a bare `.first()`). The other specs are not scanned yet.
- ~~Split the single API class into `client/` + `controllers/`~~ — done; the wiki page was rewritten. `skill-reference.md` and `api-setup-teardown-standard-prompt.md` still need a check against the code.
- Re-run TC02 on chromium to confirm the refactored `cleanBookshelf` passes against the live site.
- ~~Fix the R5 warning: replace the bare `.first()` in `BookStorePage.pageHeading` after checking the real DOM.~~ — done: `.first()` removed, and the locator was renamed `bookStoreMenuItem` after the DOM check showed it is a sidebar item (see `notes-adapt-ui-locator-wait-standard.md` §8).
- Give each browser its own demoqa account (`DEMOQA_USER_<BROWSER>`) to re-enable firefox/webkit for TC02.
- Run Mode 5 to sync README §6/§9 with the new skills, folders and `src/api/`.
- Decide: add `NODE_USE_SYSTEM_CA=1` to the `test` npm script, or fix the proxy certificate locally.
- Nothing from the API refactor is committed yet (`src/api/` and `src/fixtures/sites/` are untracked); use Mode 4.
