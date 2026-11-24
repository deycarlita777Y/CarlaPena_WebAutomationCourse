---
name: test-standards
description: Enforce and auto-apply test writing and organisation standards for Playwright + TypeScript projects. Covers import hygiene (path aliases), fixture pattern, per-site placement of new test cases and their supporting files, test structure, test independence, and data hygiene. Load when writing, reviewing, or refactoring spec files or fixture files.
---

# test-standards

Detect test writing and organisation violations and auto-apply fixes whenever possible.

## Project context

- `BasePage` at `src/ui/pages/BasePage.ts` — all Page Objects extend it.
- tsconfig `target: ES2022` → `useDefineForClassFields: true` → locators are getters.
- `baseURL` is configured in `playwright.config.ts` via `process.env.BASE_URL` (loaded by dotenv).
- `src/config/Env.ts` validates all required env vars at startup with descriptive errors.
- `src/data/sites/<site>/auth.data.ts` defines test users per site (e.g. saucedemo `users.appUser` from Env; demoqa `workerUser` fixture, built by `buildWorkerUser`).
- Path aliases are the only allowed import style — relative paths are always a violation.
- Layered, per-site architecture: every layer is split by site under a `sites/` folder. Sites: `saucedemo` · `automationexercise` · `demoqa`. Only `BasePage` and `src/config/` are shared.

| Layer | Location for a site |
|---|---|
| Specs | `test/ui/{smoke\|regression}/sites/<site>/<feature>/TC{N}-<name>.spec.ts` |
| Page Objects | `src/ui/pages/sites/<site>/` |
| Fixtures | `src/fixtures/sites/<site>.fixtures.ts` (merged into `@fixtures` by `src/fixtures/index.ts` via `mergeTests`) |
| Data | `src/data/sites/<site>/` |
| API clients | `src/api/sites/<site>/` |

How to tell which site a spec belongs to (check in order):
1. `test.use({ baseURL: Env.<site>Url })` — `automationExerciseUrl` → `automationexercise`, `demoqaUrl` → `demoqa`.
2. No `baseURL` override → default `Env.baseUrl` → `saucedemo`.
3. The fixtures it destructures (e.g. `bookStorePage` → `demoqa`, `homePage` → `automationexercise`, `loginPage`/`inventoryPage` → `saucedemo`).

If the signals disagree, or the site is new, ask the user — never guess.

## Output format

```
[test-standards] SEVERITY — RULE NAME
File:  <path>
Line:  <number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED
```

## Rules

### 1. Path aliases on all imports (universal — no exceptions)
Every import in `src/` and `test/` must use a path alias. Relative paths (`../`, `./`) are forbidden everywhere.

Aliases (defined in `tsconfig.json`):

| Alias | Resolves to |
|---|---|
| `@pages/*` | `src/ui/pages/*` (Page Objects live in `sites/<site>/`, e.g. `@pages/sites/demoqa/ProfilePage`) |
| `@components/*` | `src/ui/components/*` |
| `@fixtures` | `src/fixtures/index` (merges the per-site files in `src/fixtures/sites/`) |
| `@fixtures/*` | `src/fixtures/*` |
| `@data/*` | `src/data/*` (per site: `@data/sites/<site>/...`) |
| `@config/*` | `src/config/*` |
| `@helpers/*` | `src/helpers/*` |
| `@api/*` | `src/api/*` (per site: `@api/sites/<site>/...`) |

**Auto-fix:** Replace every relative import with its path alias equivalent.

### 2. Import `test` and `expect` from `@fixtures`
Spec files must not import from `@playwright/test` directly.

- Exception: `src/fixtures/index.ts` itself re-exports `expect` from `@playwright/test`; per-site fixture files import `test` from `@playwright/test`.

**Auto-fix:** Replace the `@playwright/test` import in spec files with `@fixtures`.

### 3. No manual `beforeEach` for Page Object initialisation
That is the fixture's responsibility.

**Auto-fix:** Extract the `beforeEach` Page Object initialisation into the site's fixture file `src/fixtures/sites/<site>.fixtures.ts`.

### 4. New Page Objects registered in fixture with correct auth dependency
Register the fixture in the file of the Page Object's site (`src/fixtures/sites/<site>.fixtures.ts`). A new site gets a new `<site>.fixtures.ts` AND must be added to the `mergeTests(...)` call in `src/fixtures/index.ts`.

- No auth required → depends on `{ page }`, calls `navigate()` before `use()`.
- Auth required → depends on `{ authenticatedPage }`, does NOT call `navigate()` again.

The `authenticatedPage` fixture MUST always exist (saucedemo: `src/fixtures/sites/saucedemo.fixtures.ts`, exposed through `@fixtures`):

```typescript
authenticatedPage: async ({ page }, use) => {
  const lp = new LoginPage(page);
  await lp.navigate();
  await lp.login(users.appUser.username, users.appUser.password);
  await use(lp);
}
```

Playwright destroys the browser context after each test — no logout needed.

**Auto-fix:** Register the fixture with the correct dependency; create `authenticatedPage` if missing.

### 5. New test cases and their supporting files live in the correct site folder
Applies when a spec is created, moved or reviewed. Determine the site (see "How to tell which site a spec belongs to"), then verify every file of the test case is in that site's folders:

- Spec → `test/ui/{smoke|regression}/sites/<site>/<feature>/TC{N}-<name>.spec.ts`. `{suite}` and `{feature}` follow `spec-standards`.
- Page Objects the spec uses → `src/ui/pages/sites/<site>/` (extending `@pages/BasePage`).
- Fixtures it needs → `src/fixtures/sites/<site>.fixtures.ts`.
- Test data it imports → `src/data/sites/<site>/` (import as `@data/sites/<site>/...`, never the old flat `@data/auth.data`).
- API setup/teardown clients → `src/api/sites/<site>/` (import as `@api/sites/<site>/...`).
- A spec must not use Page Objects, data or fixtures of a different site.

**Violation examples:** a spec directly under `test/` or `test/smoke/`; a demoqa spec under `.../sites/saucedemo/`; a new Page Object at `src/ui/pages/<Name>Page.ts`; data in `src/data/<name>.data.ts`; an import of `@pages/<Name>Page` without `sites/<site>/`.

**Auto-fix:** Move the file(s) to the correct site folder (`git mv` for tracked files), update alias imports, then run `tsc --noEmit` and `playwright test --list`. If the site is ambiguous, ask instead of moving.

### 6. Tests wrapped in `describe` with descriptive names
Every `test()` must be inside `test.describe()`.

- Describe name = feature or page name.
- Test name = expected behaviour (not the action).

**Auto-fix:** Wrap bare `test()` calls in a `describe`; rename generic names such as `'test'`.

### 7. No cross-spec imports
Specs must not import from other spec files.

- Shared data → `src/data/sites/<site>/`. Shared setup → `src/fixtures/sites/<site>.fixtures.ts`.

**Auto-fix:** Move shared data to `src/data/sites/<site>/` and update imports.

### 8. No hardcoded credentials in specs
Credentials must come from the site's data file (e.g. `users.*` from `@data/sites/saucedemo/auth.data`, `workerUser` (fixture) for demoqa) or `Env.*` (from `@config/Env`). Which identity a test uses (shared / per worker / per test) is governed by `spec-data-standard` R1.

**Auto-fix:** Replace string literals with `users.appUser.username` / `users.appUser.password`.

### 9. Only `@playwright/test` as test framework
No jest, mocha, chai, or any other test utility.

**Auto-fix:** Replace non-Playwright imports with `@playwright/test` equivalents (via `@fixtures` in specs).
