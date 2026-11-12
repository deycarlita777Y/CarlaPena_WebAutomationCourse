---
name: pom-architect
description: Enforce and auto-apply Page Object Model rules for Playwright + TypeScript projects. Detects violations and fixes them: locators as getters, actions as async methods, no direct page usage in test bodies, assertions only in specs, navigate() using baseURL. Load when creating, reviewing, or refactoring Page Objects or spec files.
---

# pom-architect

Detect Page Object Model violations and auto-apply fixes whenever possible.

## Project context

- `BasePage` lives at `src/ui/pages/BasePage.ts` — `abstract class`, `protected readonly page: Page`, `async navigate(path = '/')`. All Page Objects extend it.
- tsconfig `target: ES2022` → `useDefineForClassFields: true` → locators MUST be getters, not constructor fields.
- `baseURL` is configured in `playwright.config.ts` via `process.env.BASE_URL` (loaded by dotenv).
- `src/config/Env.ts` validates all required env vars at startup with descriptive errors.
- `src/data/auth.data.ts` defines test users: `appUser` (from Env), plus site-specific accounts.
- Path aliases are the only allowed import style — relative paths are always a violation (see `test-standards`).

## Output format

Report every violation as:

```
[pom-architect] SEVERITY — RULE NAME
File:  <path>
Line:  <number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED
```

Use `AUTO-APPLIED` in the `Fix` line when the fix was applied; otherwise describe the manual fix.

## Rules

### 1. All Page Objects extend BasePage
Never define a constructor or `navigate()` directly in a Page Object.

`BasePage` must exist at `src/ui/pages/BasePage.ts`:

```typescript
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }
}
```

All Page Objects: `export class LoginPage extends BasePage { ... }` — only getters and action methods.

**Auto-fix:** Add `extends BasePage`, remove the duplicate constructor and `navigate()`. Create `BasePage` if missing.

### 2. Locators as getters
Page Object locators must be `get` properties, never constructor-initialised fields.

- Reason: Playwright Locators are lazy; ES2022 `useDefineForClassFields: true` causes `this.page` to be undefined during class field initialisation.

**Auto-fix:** Convert constructor-initialised or field-initialised locators to `get` properties.

### 3. Actions as async methods
UI interactions must be encapsulated in `async` methods in the Page Object, never performed directly in spec files.

**Auto-fix:** Extract interaction sequences from spec files into Page Object methods and call those instead.

### 4. No direct `page.*` in test body
All interactions go through the Page Object.

- Exception: `page.goto()` in `beforeEach`, only when no fixture handles navigation.

**Auto-fix:** Replace direct `page.*` calls in the test body with Page Object method calls.

### 5. `navigate()` uses baseURL
`navigate()` / `page.goto()` must use `'/'` or a relative path, never a hardcoded full URL.

**Auto-fix:** Replace hardcoded URLs with `'/'` or the relative path.

### 6. `expect()` only in spec files
Page Objects must not contain `expect()`, unless the method name starts with `assert` and has JSDoc.

- Post-action locators needed for assertions must be public `get` properties.

**Auto-fix:** Move `expect()` to the spec; expose the needed locators as public getters.

### 7. Correct folder placement
- Page Objects → `src/ui/pages/`
- Components → `src/ui/components/`
- Fixtures → `src/fixtures/`
- Test data → `src/data/`
- Config/Env → `src/config/`

**Auto-fix:** Move the file to the correct folder and update all imports.

### 8. No hardcoded credentials or test data in Page Objects
Parametrise or use data files (`@data/*`).

**Auto-fix:** Replace hardcoded values with method parameters.
