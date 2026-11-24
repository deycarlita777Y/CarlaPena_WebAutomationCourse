---
name: spec-quality-lifecycle-standard
description: Enforce and auto-apply test case quality standards for Playwright + TypeScript projects. Governs preconditions, postconditions, assertion quality, selector resilience, wait strategies, and anti-flakiness patterns inside test bodies. Load when creating, reviewing, or debugging test cases, or when the user says "review tc quality", "check test quality" or "scan for flaky patterns".
---

# spec-quality-lifecycle-standard

Owns the **internal quality of test cases** — what happens inside each `test()` body. Detects violations and auto-applies fixes when safe.

## Domain boundary

| Concern | Owner |
|---|---|
| TC folder / file naming, TC IDs, describe naming, `test.step()` presence | `spec-standards` |
| Imports, fixtures registration, credentials, framework | `test-standards` |
| Page Object structure, locator getters | `pom-architect` |
| Git workflow | `git-standards` |
| **Pre/postconditions, assertion quality, selector resilience, waits, independence** | **this skill** |

Do not re-report what another skill owns (e.g. a missing `test.step()` is `spec-standards`; a step with no assertion is R6 here).

## Project context

- A test is **deterministic** when it gives the same result regardless of order, machine speed or prior state.
- **Precondition**: state required BEFORE the first action. Enforced by fixtures, ASSERTED in the first `test.step()`.
- **Postcondition**: state restored AFTER the test. Enforced by teardown fixtures (`clean<Resource>`) in `src/fixtures/sites/<site>.fixtures.ts`, backed by an API client in `src/api/sites/<site>/` (today: demoqa → `cleanBookshelf` + `AccountController`/`BookController`). A teardown fixture cleans BEFORE and AFTER the test, and the clean is VERIFIED (R11).
- **Shared account**: tests that mutate persistent data of one account must not run concurrently with other runs using that account — a parallel clean/login by another run invalidates sessions and leaves dirty data (R12).
- Playwright auto-waits for actionability; never add manual waits on top.
- Every `test.step()` that performs a user-visible action ends with an assertion on its result.
- Use web-first assertions (`expect(locator).toBeVisible()`), not JS-first (`expect(await locator.textContent())`).
- Prefer role, label, testid and stable text over positional CSS or XPath.
- `{testRoot}` is `testDir` in `playwright.config.ts` (currently `test/`). Read it from the config; never hardcode.

## Flaky test root causes

```
1. Missing precondition assertion  → R1        4. Fragile selector           → R5
2. Missing / unverified teardown   → R2, R11   5. Assertion not tied to action → R6, R10
3. Hardcoded wait / race           → R3, R9    6. Shared account in parallel → R12
Also: order dependence R7, non-determinism R8, point-in-time asserts R4
```

## Modes

### Enforce — scan and report
**Triggers:** "review tc quality", "check test quality", "scan for flaky patterns", "tc quality"

1. Discover `{testRoot}/**/*.spec.ts` (or the single file given) and `src/ui/pages/**/*.ts`.
2. Apply the rules per Scan scope.
3. Auto-fix every AUTO-FIX violation; collect MANUAL-FIX ones (ERRORs before WARNINGs).
4. Emit the report:

```
[spec-quality-lifecycle-standard] SCAN COMPLETE
─────────────────────────────────────────
Scanned:  <N> spec files
Errors:   <N> found — <N> auto-applied
Warnings: <N> found
Remaining manual fixes: <list, or "none">
[spec-quality-lifecycle-standard] ✅ All quality rules satisfied.
```

### Create — scaffold a quality TC
**Triggers:** "create tc", "new test case", "scaffold tc", "write tc"

0. Collect (infer, ask only for missing): `tcId` (`TC{N}` — never invent), `title`, `preconditions`, `steps` (`{action, expectedResult}`), `hasApiTeardown`.
1. Pick fixtures from preconditions: login → the site's `authenticated*` fixture; cleanup → `clean<Resource>`; PO access → the PO fixtures. Import `test`/`expect` from `@fixtures`.
2. First step asserts the precondition:
   ```typescript
   await test.step('Verify <precondition> is met before test begins', async () => {
     await expect(<fixture>.<indicator>).toBeVisible();
   });
   ```
3. Each action step ends with a result assertion:
   ```typescript
   await test.step('<action>', async () => {
     await <fixture>.<action>();
     await expect(<fixture>.<result>).toBeVisible();
   });
   ```
4. Last step verifies the postcondition: `Verify postcondition: <final state>`.
5. Place the file per `spec-standards` and run R1–R12 on it — assert zero violations.

## Output format

```
[spec-quality-lifecycle-standard] SEVERITY — RULE_NAME
File:  <path relative to project root>
Line:  <number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED | MANUAL-FIX
```

## Scan scope

| File glob | Rules |
|---|---|
| `{testRoot}/**/*.spec.ts` | R1, R2, R3, R4, R6, R7, R8, R9, R10 |
| `src/ui/pages/**/*.ts` | R3, R4, R5 |
| `src/fixtures/sites/*.fixtures.ts` · `src/api/sites/**/*.ts` | R11 |
| `playwright.config.ts` + specs using a shared-account fixture | R12 |

## Rules

### R1 — PRECONDITION_ASSERTED (ERROR, MANUAL-FIX)
**Condition:** a `test()` body starts with an action (click, fill, navigate) with no earlier step/assertion confirming the starting state. A fixture-provided navigation counts as the action to verify: assert the page is ready first.
**Why:** acting on an unknown state makes failures point at the wrong place.
```typescript
// ❌
test('TC02: ...', async ({ inventoryPage }) => { await inventoryPage.addFirstItem(); });
// ✅
await test.step('Verify inventory is loaded before test begins', async () => {
  await expect(inventoryPage.title).toBeVisible();
});
```

### R2 — POSTCONDITION_GUARANTEED (ERROR, MANUAL-FIX)
**Condition:** a test creates/mutates **persistent** data (`create`, `submit`, `register`, `upload`, `delete`, `addToCollection`) without a `clean<Resource>` fixture parameter. Session-only state (e.g. cart contents that die with the browser context) is NOT persistent — do not flag it.
**Why:** failed runs leave dirty data that breaks later runs. If no `clean*` fixture exists for the resource, report MANUAL: "create `clean<Resource>` fixture first" — put the API client in `src/api/sites/<site>/` and the fixture in `src/fixtures/sites/<site>.fixtures.ts`, and satisfy R11.
```typescript
test('TC02: ...', async ({ bookStorePage, cleanBookshelf }) => { void cleanBookshelf; /* ... */ });
```

### R3 — NO_HARDCODED_WAITS (ERROR, AUTO-FIX)
**Condition:** `page.waitForTimeout(N)`, `setTimeout(...)`, or `new Promise(r => setTimeout(r, N))` in a spec or Page Object.
**Auto-fix:** replace with a semantic wait:

| Wait for | Replacement |
|---|---|
| element | `await expect(locator).toBeVisible()` |
| navigation | `await page.waitForURL(pattern)` + an assertion |
| element gone | `await expect(locator).toBeHidden()` |
| text change | `await expect(locator).toHaveText(text)` |
| network idle | `page.waitForLoadState('networkidle')` (sparingly) |

If no target element can be inferred from the next action, report MANUAL instead of guessing.

### R4 — WEB_FIRST_ASSERTIONS (ERROR, AUTO-FIX)
**Condition:** `expect(await <locator>.<read>())` where a web-first matcher exists.

| ❌ JS-first | ✅ Web-first |
|---|---|
| `expect(await el.textContent()).toBe('x')` | `expect(el).toHaveText('x')` |
| `expect(await el.isVisible()).toBe(true)` | `expect(el).toBeVisible()` |
| `expect(await el.isEnabled()).toBeTruthy()` | `expect(el).toBeEnabled()` |
| `expect(await el.getAttribute('href')).toBe('/p')` | `expect(el).toHaveAttribute('href', '/p')` |
| `expect(await el.inputValue()).toBe('v')` | `expect(el).toHaveValue('v')` |
| `expect(await page.title()).toBe('T')` | `expect(page).toHaveTitle('T')` |
| `expect(page.url()).toContain('/p')` | `expect(page).toHaveURL(/\/p/)` |

`toContain` on text → `toContainText`. Page Objects must not contain `expect()` at all (`pom-architect` R5/R6) — in POs, R4 applies only to `assert*` methods.

### R5 — RESILIENT_LOCATORS (WARNING, MANUAL-FIX)
**Condition:** a PO locator relies on `.first()`/`.nth(n)` as sole disambiguation, long CSS chains (`div > ul > li:nth-child(2) > span`), XPath, or data-dependent text (`getByText('1 item')`).
**Prefer:** `getByRole(..., { name })` · `getByLabel` · `locator('[data-testid=...]')` · unique `#id` · `getByText(..., { exact: true })` for static text.
`.first()`/`.nth()` is acceptable only when already scoped to a container and position is meaningful — document with a comment.

### R6 — STEP_ASSERTS_RESULT (WARNING, MANUAL-FIX)
**Condition:** a `test.step()` performs user-facing actions but contains no `expect`.
**Why:** a click-through script passes even when the feature is broken.
```typescript
// ❌ await test.step('Add to cart', async () => { await inventoryPage.addFirstItem(); });
// ✅ add: await expect(inventoryPage.cartBadge).toHaveText('1');
```

### R7 — TEST_IS_INDEPENDENT (ERROR, MANUAL-FIX)
**Condition:** (1) module-level `let` mutated inside `test()`; (2) `beforeAll()` setting state consumed by several tests; (3) a `test()` relying on navigation/state from a previous `test()`.
**Fix:** move shared state into fixtures (run per test).

### R8 — NO_CONDITIONAL_IN_TEST_BODY (ERROR, MANUAL-FIX)
**Condition:** `if/else`, `for`, `while`, `switch`, `try/catch` inside a `test()` body (not inside a PO, fixture or `test.step` helper called from outside).
**Fix:** move branching to a Page Object method or fixture; use a loop at file level to generate data-driven tests. A `for` that generates `test()` calls outside the body is fine.

### R9 — NAVIGATE_THEN_ASSERT (ERROR, MANUAL-FIX)
**Condition:** `page.goto()`, `po.navigate()`, `waitForURL()`, or a click that navigates is followed by another action without an assertion confirming the target loaded.
```typescript
await loginPage.login(user, pass);
await expect(inventoryPage.title).toBeVisible();   // ✅ before acting on the new page
```

### R10 — ASSERTION_SPECIFICITY (WARNING, MANUAL-FIX)
**Condition:** the assertion only checks presence/visibility where the TC intent is a VALUE ("message contains Y", "count is N", "row for item X").
```typescript
// ❌ await expect(cart.items.first()).toBeVisible();
// ✅ await expect(cart.itemByName(name)).toBeVisible();   or   toHaveCount(n) / toHaveText(...)
```
The exact value must come from a controlled source (created fixture, mock payload, dataset row, API discovery) — see `spec-data-standard` R13/M4.

### R11 — TEARDOWN_VERIFIED (ERROR, MANUAL-FIX)
**Condition:** a `clean<Resource>` fixture or its API method (a) runs only before OR only after the test, (b) trusts the delete status code (e.g. `204`) without reading the resource back to confirm it is empty, or (c) swallows errors / does not throw when the resource is still dirty.
**Why:** the delete call can succeed while data remains (observed on demoqa: a book stayed in the profile after the run). A cleanup that is not verified silently breaks the next run.
**Fix:** clean before AND after (`await api.clear(); await use(); await api.clear();`); after deleting, GET the resource and assert empty, retrying a few times, then throw with how much is left.
```typescript
// ✅ src/fixtures/sites/demoqa.fixtures.ts (cleanBookshelf) — BookController.deleteAll, read back via AccountController.getUser, retry, throw if not empty
```

### R12 — SHARED_ACCOUNT_ISOLATION (WARNING, MANUAL-FIX)
**Condition:** a spec uses a persistent-data fixture (`clean<Resource>`) tied to ONE account (e.g. `demoqaUser`) while `fullyParallel` / several projects (chromium · firefox · webkit) run it at the same time.
**Why:** each run logs in and clears the same account, so one run's clean or login invalidates another's session (`User not authorized!`) or leaves leftover data.
**Fix (pick one):** a dedicated account per project/worker (e.g. `DEMOQA_USER_<BROWSER>`); or run those specs with one worker / a single project (e.g. `test.skip` for the other browsers, with a written reason). Do not rely on `test.describe.configure({ mode: 'serial' })` — it does not serialise across projects.

## Examples

```
[spec-quality-lifecycle-standard] ERROR — NO_HARDCODED_WAITS
File:  test/ui/smoke/sites/saucedemo/login/TC01-valid-login.spec.ts
Line:  18
Issue: page.waitForTimeout(2000) introduces a fixed delay that causes flakiness.
Fix:   Replace with expect(inventoryPage.title).toBeVisible(). | AUTO-APPLIED

[spec-quality-lifecycle-standard] ERROR — PRECONDITION_ASSERTED
File:  test/ui/smoke/sites/saucedemo/login/TC01-valid-login.spec.ts
Line:  5
Issue: Test begins with an action without asserting the starting state.
Fix:   Add a first step asserting the login form is visible. | MANUAL-FIX
```

## Anti-flakiness quick reference

| Root cause | Rule | Signal |
|---|---|---|
| Unknown start state | R1 | no assertion in first step |
| Dirty previous state | R2, R11 | no `clean<Resource>`, or clean not verified |
| Parallel runs on one account | R12 | `User not authorized!`, leftover data |
| Timing assumption | R3 | `waitForTimeout` |
| Point-in-time evaluation | R4 | `await locator.textContent()` in `expect` |
| DOM dependency | R5 | CSS chains, XPath, `.nth()` |
| Silent action failure | R6 | step without assertion |
| Order dependency | R7 | shared `let` |
| Non-deterministic path | R8 | `if/else` in test |
| Navigation race | R9 | navigate without assert |
| False positive | R10 | `toBeVisible()` when value matters |

Playwright ≥ 1.22 required (`test.step()`).
