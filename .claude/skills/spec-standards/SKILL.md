---
name: spec-standards
description: Enforce organisational and lifecycle standards for spec files in Playwright + TypeScript projects. Covers folder hierarchy ({testRoot}/{suite}/{feature}/), TC{N}-short-name file naming, test.describe naming, TC ID prefixes on test names, and test.step() for step labelling. Load when creating, reviewing, or reorganising spec files, or when the user says "check spec structure".
---

# spec-standards

Detect spec organisation violations and auto-apply fixes whenever it is safe to do so.

Domain split (do not overlap):

| Skill | Owns |
|---|---|
| `pom-architect` | Page Object layer structure |
| `test-standards` | Spec code quality — imports, fixtures, credentials, framework |
| `spec-standards` | Spec organisation — folders, file names, TC IDs, describe names, `test.step()` |

## Project context

- `{testRoot}` is the `testDir` in `playwright.config.ts` (currently `./test`, so `test/`). Read it from the config — never hardcode `tests/ui`.
- Required layout: `{testRoot}/{suite}/{feature}/TC{N}-{short-kebab-name}.spec.ts`
  - `{suite}` = `smoke` (critical path) or `regression` (edge cases, negative paths). Playwright's `testDir` is recursive, so no config change is needed to nest specs.
  - `{feature}` = the **functionality under test**, kebab-case, not the page name (`login/`, `products/`, `cart/`, `checkout/`).
- Two sites are under test: SauceDemo (`login`, inventory) and automationexercise.com (`products`, via `test.use({ baseURL: Env.automationExerciseUrl })`). Keep that `test.use` line — it is not a violation.
- TC IDs come from the team / a test-management tool. This skill validates **format only**. `TC0` is reserved for exercises outside the main suite.
- One spec file per TC; data-driven variants of the same TC stay in the same file.
- `test.step()` is the only accepted way to label steps. `// Step N:` comments and JSDoc `@steps` are violations.
- Imports are alias-only (`@fixtures`, `@data/*`, `@config/*`), so moving a spec never requires import rewrites. Specs must not be imported by other specs (`test-standards` rule 6).

## Precedence over test-standards

`test-standards` rule 5 says "describe = feature or page name; test name = expected behaviour". `spec-standards` tightens this, and wins on conflict:

- describe name = PascalCase of the feature folder (R3)
- test name = `TC{N}: <expected behaviour>` (R4) — the behaviour wording is kept, the ID prefix is added

## Hard rule: never invent a TC number

If a spec has no TC ID anywhere (filename or `test()` name), R2/R4 are **not auto-fixable**. Ask the user for `N` (or report as MANUAL). Guessing a number silently collides with the team's real IDs.

## Output format

```
[spec-standards] SEVERITY — RULE_NAME
File:  <path relative to project root>
Line:  <number or —>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED | MANUAL — <what is needed from the user>
```

## Rules

### R1 — FOLDER_STRUCTURE (ERROR, AUTO-FIX)
**Condition:** a `*.spec.ts` is not at `{testRoot}/{suite}/{feature}/TC{N}-{name}.spec.ts` (e.g. directly under `test/`).

**Auto-fix:**
1. Pick suite: `regression` for negative-path specs (invalid input, error messages), otherwise `smoke`.
2. Derive feature folder from the `test.describe()` name / functionality (`'Login page'` → `login`).
3. Move with `git mv` (preserves history) — create folders as needed.
4. If one file holds `test()` calls with different TC IDs, split into one file per TC first.

Feature folder examples: authentication → `login/`, catalogue → `products/`, cart → `cart/`, checkout → `checkout/`.

```
Before: test/productDetail.spec.ts
After:  test/smoke/products/TC8-verify-all-products-and-detail.spec.ts
```

### R2 — FILE_NAMING_CONVENTION (ERROR, AUTO-FIX when N known)
**Condition:** filename does not match `TC{N}-{1–5 kebab words}.spec.ts`: `N` is an unpadded non-negative integer, no underscores, no hyphen between `TC` and `N`, no camelCase/PascalCase. `N` must equal the `N` in the `test('TC{N}: …')` inside.

**Auto-fix:** read `N` from the test name, build the description from the first ≤5 significant words after the colon, rename with `git mv`. If no `N` exists → MANUAL (see hard rule).

```
TC0-valid-login.spec.ts  ✅    TC9-search-product.spec.ts  ✅
loginSauceDemo.spec.ts   ❌    TC8_VerifyProducts.spec.ts  ❌    TC-8-products.spec.ts ❌
```

### R3 — DESCRIBE_MATCHES_FEATURE_FOLDER (ERROR, AUTO-FIX)
**Condition:** `test.describe()` name ≠ PascalCase of the parent feature folder (split on `-`, capitalise, join): `login/` → `'Login'`, `shopping-cart/` → `'ShoppingCart'`.

**Auto-fix:** rewrite the describe string. Run after R1.

```typescript
test.describe('Login page', () => {   // ❌ in test/**/login/
test.describe('Login', () => {        // ✅
```

### R4 — TC_ID_NAMING_CONVENTION (ERROR, AUTO-FIX when N known)
**Condition:** a `test()` name does not start with `TC{N}: ` (capital TC, integer, colon, space) or `N` ≠ the filename's `N`.

**Auto-fix:** prepend / correct the prefix using `N` from the filename (validated by R2). If neither has an `N` → MANUAL.

Data-driven variants keep the prefix and add a suffix:
```typescript
test('TC3: Login with incorrect credentials — empty email', …)  // ✅
test('TC8 - verify products', …)                                // ❌ hyphen, no colon
test('shows the product detail information…', …)                // ❌ no TC ID
```

### R5 — USE_TEST_STEP (ERROR, AUTO-FIX)
**Condition:** a `test()` body uses `// Step N:` comments, **or** has several logical action/assertion groups not wrapped in `test.step()`. A body that is a single short group (≤ ~3 statements) may stay unwrapped.

**Why:** `test.step()` entries show up named in the HTML report and traces; comments do not.

**Auto-fix:** remove step comments; wrap each logical group in `await test.step('description', async () => { … })`; return values from the callback when later steps need them. Step names describe the user-visible action, not the code.

```typescript
test('TC8: Verify products and product detail page', async ({ homePage, productsPage, productDetailPage }) => {
  await test.step('Open the Products page', async () => {
    await expect(homePage.featuresItemsHeading).toBeVisible();
    await homePage.openProducts();
    await expect(productsPage.allProductsHeading).toBeVisible();
  });

  await test.step('Open the first product detail page', async () => {
    await productsPage.openFirstProduct();
  });

  await test.step('Verify product detail fields are visible', async () => {
    await expect(productDetailPage.name).toBeVisible();
    await expect(productDetailPage.price).toBeVisible();
  });
});
```

Keep `expect` and `test` imported from `@fixtures` (`test.step` lives on that `test`).

## Scan scope

| Glob | Rules |
|---|---|
| `{testRoot}/**/*.spec.ts` | R1–R5 |
| `{testRoot}/*.spec.ts` (flat) | R1 violation by definition, plus R2–R5 |

Never touch `src/`, `playwright.config.ts`, or `tsconfig.json` from this skill. After any move/rename run `npm run typecheck` and `npx playwright test --list` to confirm every spec is still discovered.

## Future modules (not active)

Tagging (`@smoke` / `@regression` via the `tag` option), lifecycle (`beforeAll`/`afterAll` policy), and `test.only`/`test.skip` justification. Until tagging exists, folder = suite; a `test:smoke` npm script would be `playwright test test/smoke`.
