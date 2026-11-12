---
name: test-standards
description: Enforce and auto-apply test writing and organisation standards for Playwright + TypeScript projects. Covers import hygiene (path aliases), fixture pattern, test structure, test independence, and data hygiene. Load when writing, reviewing, or refactoring spec files or fixture files.
---

# test-standards

Detect test writing and organisation violations and auto-apply fixes whenever possible.

## Project context

- `BasePage` at `src/ui/pages/BasePage.ts` — all Page Objects extend it.
- tsconfig `target: ES2022` → `useDefineForClassFields: true` → locators are getters.
- `baseURL` is configured in `playwright.config.ts` via `process.env.BASE_URL` (loaded by dotenv).
- `src/config/Env.ts` validates all required env vars at startup with descriptive errors.
- `src/data/auth.data.ts` defines test users: `appUser` (from Env), plus site-specific accounts.
- Path aliases are the only allowed import style — relative paths are always a violation.

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
Every import in `src/` and `tests/` must use a path alias. Relative paths (`../`, `./`) are forbidden everywhere.

Aliases (defined in `tsconfig.json`):

| Alias | Resolves to |
|---|---|
| `@pages/*` | `src/ui/pages/*` |
| `@components/*` | `src/ui/components/*` |
| `@fixtures` | `src/fixtures/index` |
| `@fixtures/*` | `src/fixtures/*` |
| `@data/*` | `src/data/*` |
| `@config/*` | `src/config/*` |
| `@helpers/*` | `src/helpers/*` |
| `@api/*` | `src/api/*` |

**Auto-fix:** Replace every relative import with its path alias equivalent.

### 2. Import `test` and `expect` from `@fixtures`
Spec files must not import from `@playwright/test` directly.

- Exception: `src/fixtures/index.ts` itself re-exports `expect` from `@playwright/test`.

**Auto-fix:** Replace the `@playwright/test` import in spec files with `@fixtures`.

### 3. No manual `beforeEach` for Page Object initialisation
That is the fixture's responsibility.

**Auto-fix:** Extract the `beforeEach` Page Object initialisation into `src/fixtures/index.ts`.

### 4. New Page Objects registered in fixture with correct auth dependency
- No auth required → depends on `{ page }`, calls `navigate()` before `use()`.
- Auth required → depends on `{ authenticatedPage }`, does NOT call `navigate()` again.

The `authenticatedPage` fixture MUST always exist in `src/fixtures/index.ts`:

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

### 5. Tests wrapped in `describe` with descriptive names
Every `test()` must be inside `test.describe()`.

- Describe name = feature or page name.
- Test name = expected behaviour (not the action).

**Auto-fix:** Wrap bare `test()` calls in a `describe`; rename generic names such as `'test'`.

### 6. No cross-spec imports
Specs must not import from other spec files.

- Shared data → `src/data/`. Shared setup → `src/fixtures/`.

**Auto-fix:** Move shared data to `src/data/` and update imports.

### 7. No hardcoded credentials in specs
Credentials must come from `users.*` (from `@data/auth.data`) or `Env.*` (from `@config/Env`).

**Auto-fix:** Replace string literals with `users.appUser.username` / `users.appUser.password`.

### 8. Only `@playwright/test` as test framework
No jest, mocha, chai, or any other test utility.

**Auto-fix:** Replace non-Playwright imports with `@playwright/test` equivalents (via `@fixtures` in specs).
