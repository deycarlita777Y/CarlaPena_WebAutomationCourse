---
name: ui-locator-wait-standard
description: Enforce and auto-apply locator and wait standards for Playwright + TypeScript projects. Assesses interaction maturity (levels 0-4) and enforces the locator hierarchy (team test-id contract first when defined, then role, label, placeholder, text, alt text, title, and justified CSS/XPath), element uniqueness and composition, action semantics, condition-based waits, bounded polling, timeout hierarchy, and diagnostic wait messages. Includes a verification mode that repeats tests to prove interactions are stable. Load when writing or reviewing locators, Page Object getters, actions, waits or polling, or when diagnosing timeouts, strict-mode violations, or timing-related flaky tests. Triggers - "assess locators", "review locators", "fix waits", "strict mode violation", "polling", "verify interactions", "flaky interaction".
---

# ui-locator-wait-standard

Owns **how a test interacts with the UI**: which locator identifies an element, how repeated elements are disambiguated, which action represents the user interaction, and how the test synchronises with the application.

**Objective — the deterministic interaction:** every interaction targets exactly one element through a locator that expresses user intent (or the team's explicit test contract), and every wait is a bounded condition that proves the operation completed and explains itself when it fails.

Gap filled: `pom-architect` guarantees locators live in getters, not that they are the **right** locators. No skill governed the locator hierarchy, test-id contracts, collections, action semantics, terminal-state synchronisation, bounded polling, timeout hierarchy or wait diagnostics. This skill took over `spec-quality-lifecycle-standard` R3 (waits) and R5 (locators).

## Project Context

- **Selector vs. locator:** a selector is a string (the address). A locator is a lazy Playwright object that wraps it, re-queries the DOM on every use, auto-waits for actionability and retries assertions. Pass locators, never selector strings or handles.
- **Auto-waiting synchronises actions; assertions verify behaviour.** A clickable button does not prove the operation completed. Every state-changing action is followed by a wait for the observable state that proves completion.
- **Strict mode:** a locator matching more than one element fails on action. That failure is information — fix the locator, never silence it with a position.
- Locators are declared in Page Object getters (`pom-architect` R2). This skill decides **which** locator; `pom-architect` decides **where** it lives.
- AI may inspect, compare and propose locators, but must never invent attributes, roles, names or API states that were not observed.

### Project conventions (resolve before applying rules)

Resolve each placeholder from the repo (hub Project Context, `tsconfig.json` paths, folder tree, runner config, ADRs); use the default only if the project defines nothing. Report resolved values in the M0 header. The skill is project-agnostic: site names come from `src/ui/pages/sites/*`, never from this file.

| Placeholder | Meaning | This project |
|---|---|---|
| `<pages-dir>` | Page Objects and components | `src/ui/pages/sites/<site>/` · `src/ui/components/` |
| `<specs-dir>` | Spec files (`testDir` of the runner config) | `test/` |
| `<fixtures-module>` | Fixtures merged by `mergeTests` | `src/fixtures/sites/<site>.fixtures.ts` |
| `<api-layer>` | API client + controllers (used for polling) | `src/api/sites/<site>/` |
| `<runner-config>` | Playwright config | `playwright.config.ts` |
| `<testid-contract>` | Team test-id contract: `testIdAttribute` in `<runner-config>` (global or per project) **or** a convention declared in CLAUDE.md / AGENTS.md / an ADR | none defined |
| `<testid-attribute>` | Attribute name of the contract | `data-testid` (Playwright default) |

### Locator hierarchy (R1)

Resolve `<testid-contract>` **per site** before ranking. The contract applies to an element only when the attribute exists on that element in the inspected DOM.

| # | Contract defined and element carries it | No contract, or element lacks it |
|---|---|---|
| 1 | `getByTestId()` | `getByRole()` |
| 2 | `getByRole()` | `getByLabel()` |
| 3 | `getByLabel()` | `getByPlaceholder()` |
| 4 | `getByPlaceholder()` | `getByText()` |
| 5 | `getByText()` | `getByAltText()` |
| 6 | `getByAltText()` | `getByTitle()` |
| 7 | `getByTitle()` | `getByTestId()` |
| 8 | CSS / XPath — with a reason (R2) | CSS / XPath — with a reason (R2) |

Choose the highest tier that identifies the element uniquely. Composition (`filter`, scoping, child locators) is preferred over going down a tier.

### Wait types

| Type | Example | Status |
|---|---|---|
| Fixed | `waitForTimeout(3000)`, sleep | Forbidden (R13) |
| Implicit | Actionability auto-wait, web-first assertion retry | Rely on it; do not duplicate (R15) |
| Explicit | `expect(locator).toHaveText()`, `expect(page).toHaveURL()`, `waitForResponse` tied to the action | Preferred after every state-changing action (R14) |
| Condition-based | `expect.poll()`, `expect().toPass()` | For state not visible in the DOM (API jobs); always bounded (R17–R20) |

Preferred direction: fixed time → condition → terminal state → bounded failure.

### Timeout layers

| Layer | Governs | Set in |
|---|---|---|
| Test timeout | Whole test (fixtures included) | `<runner-config>` (global or per project) or `test.setTimeout` / test options |
| Assertion timeout | One `expect` condition | `expect.timeout` or the matcher option |
| Action / navigation timeout | One action or navigation | `use.actionTimeout` / `navigationTimeout` |
| Request timeout | One HTTP response | API client options |
| Polling timeout | Reaching a terminal state | `expect.poll` options |

Invariant: **test timeout > polling timeout > single request / assertion timeout**.

### Maturity levels (scored per site)

| Level | State | Exit criteria (to reach the next level) |
|---|---|---|
| 0 — Time-driven | Fixed waits; positional or generated selectors | No fixed waits (R13); no dynamic IDs or generated classes (R3) |
| 1 — Structural | CSS/XPath dominate; waits by element presence | Hierarchy applied per contract (R1); every CSS/XPath justified (R2) |
| 2 — Semantic | Intent-based locators; positions still used to disambiguate | Positions replaced by scope/filter (R5–R8); actions match element (R9–R11) |
| 3 — Synchronised | Every state change waits for its terminal state | Polling bounded with failure states (R17–R18); timeout hierarchy (R19); diagnostics (R20) |
| 4 — Bounded & diagnosable | Deterministic interaction | Maintain: run M6 on every new TC |

### Domain coordination (do not re-report what another skill owns)

| Concern | Owner | Interaction |
|---|---|---|
| Where locators live (getters, no constructor fields) | `pom-architect` R2 | Not re-checked; this skill judges the locator **expression** |
| No `page.*` in test bodies | `pom-architect` R4 | Not re-checked; spec-level locator chains on PO getters are in scope |
| No `expect()` in Page Objects | `pom-architect` R6 | Not re-checked |
| Observable completion condition per step | `spec-requirements-standard` Q5–Q7 | Input: the oracle each wait must reach (R14) |
| Values used inside filters (`hasText`) | `spec-data-standard` R10 · R13 | Filters use created / mock / dataset values, not env literals |
| HTTP calls during polling | `api-setup-teardown-standard` R1 · R10 | Polling calls a controller; status is checked by the client |
| Assertion type, step results, specificity, hard vs. soft for validation | `spec-quality-lifecycle-standard` R4 · R6 · R10 | R16 covers only soft assertions used as synchronisation |
| Preconditions / navigate-then-assert | `spec-quality-lifecycle-standard` R1 · R9 | Not re-checked |
| Test file organisation, `test.step()`, tags | `spec-standards` | Not re-checked |

## Modes

Each mode targets one domain question and owns its rules (one rule belongs to exactly one mode). **M0 is the default** when no mode is specified. There is no hub mode of its own: hub Mode 6 routes here (M1–M5 = Act, M6 = Run).

### M0 — Interaction Assessment (read-only)

**Triggers:** "assess locators" · "assess waits" · "interaction maturity" · "locator wait"

1. Discover `<pages-dir>/**`, `<specs-dir>/**/*.spec.ts`, `<fixtures-module>`, `<runner-config>`.
2. Resolve `<testid-contract>` per site.
3. Inventory every locator expression and classify it by hierarchy tier (1–8).
4. Inventory every wait and classify it (fixed / implicit / explicit / condition-based).
5. Score the maturity level **per site** (highest level whose exit criteria are fully met).
6. List blockers for the next level, each mapped to the mode and rule that fixes it.
7. Do NOT modify files.

```
[ui-locator-wait-standard] INTERACTION ASSESSMENT
─────────────────────────────────────────
Site: <site>     Test-id contract: <attribute> (<source>) | none     Level: <0-4> — <name>
  Locators: <N> total · tier 1–7 <N> (<pct>%) · CSS/XPath <N> (<N> justified) · positional <N>
  Waits:    fixed <N> · explicit <N> · condition-based <N> (<N> bounded) · redundant <N>
  Blockers to level <N+1>:
    - <issue> → M<n> / R<n>
Recommended next mode: M<n>
```

### M1 — Locator Strategy

**Triggers:** "review locators" · "locator strategy" · "fix selectors" · "locator wait m1"
**Question:** does each locator express user intent or the team's explicit test contract?

1. Inspect the DOM before deciding: DevTools (HTML, accessibility tree), `npx playwright codegen`, `npx playwright test --debug` (Inspector locator picker).
2. Run R1–R4 on Page Objects, components and spec-level locator chains.
3. Auto-fix AUTO-FIX violations; list MANUAL-FIX items with the proposed locator per tier.
4. When an element has no stable contract (no role/name, label or test id), report a **markup request** for the development team instead of building a fragile selector.

| Fragile situation | Strategy |
|---|---|
| Dynamic ID (`#button-847392`) | Role / label / text / test id |
| Generated class (`.css-1x2y3z`, `.sc-abc`) | Role / test id |
| Deep structural chain | Scope to a region + semantic child locator |
| Same label in several places | Scope to the region (form, dialog, row) — see M2 |
| No stable contract | Request markup change; temporary CSS/XPath with reason (R2) |

### M2 — Uniqueness & Composition

**Triggers:** "locator uniqueness" · "strict mode violation" · "repeated elements" · "locator wait m2"
**Question:** does every locator resolve to exactly one element, by business criteria instead of position?

1. Run R5–R8.
2. Replace positions with scope (region/component) + `filter({ hasText })` / `filter({ has })` + unique child locator.
3. For collections: filter first, assert the count, then iterate or read the list.

```typescript
get rowFor() {
  return (name: string) => this.page.getByRole('row').filter({ hasText: name });
}
// spec
const row = ordersPage.rowFor(created.name);
await expect(row, `Exactly one row should exist for ${created.name}`).toHaveCount(1);
await row.getByRole('button', { name: 'Archive' }).click();
```

### M3 — Action & Read Semantics

**Triggers:** "review actions" · "action semantics" · "locator wait m3"
**Question:** does each action represent the real user interaction, without bypassing Playwright's checks?

| Element | Action |
|---|---|
| Button / link | `click()` |
| Text input | `fill()` (`pressSequentially()` only when per-key behaviour is under test) |
| Checkbox / radio | `check()` / `uncheck()` / `setChecked()` |
| Select | `selectOption()` |
| File input | `setInputFiles()` |
| Keyboard | `press()` |

Steps: run R9–R12; use role, HTML type and the manual user behaviour to choose the action.

### M4 — Wait Strategy

**Triggers:** "fix waits" · "remove hardcoded waits" · "synchronisation" · "locator wait m4"
**Question:** does the test wait for the observable condition that proves completion — never for time?

1. Run R13–R16.
2. For each state-changing action, identify the terminal state from the TC oracle (`spec-requirements-standard`): text, visibility, hidden spinner, URL, attribute, count.
3. Replace fixed and generic waits with an explicit wait on that state.

| Change | Wait |
|---|---|
| Text / status | `expect(locator).toHaveText(...)` |
| Element appears / disappears | `toBeVisible()` / `toBeHidden()` |
| Navigation | `expect(page).toHaveURL(...)` |
| Attribute / state | `toHaveAttribute(...)` · `toBeEnabled()` · `toBeChecked()` |
| List size | `toHaveCount(n)` on owned data |
| Backend response the UI depends on | `page.waitForResponse(...)` started **before** the action, then a UI assertion |

### M5 — Polling & Timeouts

**Triggers:** "polling" · "wait for api state" · "timeouts" · "locator wait m5"
**Question:** is every condition-based wait bounded, aware of failure states and diagnosable?

1. Run R17–R20 on specs, fixtures and helpers.
2. Take the state model from the API contract (`<api-layer>` `models/` / docs). If states are not documented, report `TBD: state model` — never invent states.
3. Check the timeout hierarchy against `<runner-config>` (global **and** per project).

```typescript
const FAILED = ['failed', 'cancelled', 'expired'];
await expect.poll(async () => {
  const { status } = await jobController.getStatus(job.id);   // controller, not request.*
  if (FAILED.includes(status)) throw new Error(`Job ${job.id} reached terminal failure "${status}"`);
  return status;
}, {
  message: `Job ${job.id} should reach "completed"`,
  timeout: 5 * 60_000,
  intervals: [2_000, 5_000, 10_000, 15_000],
}).toBe('completed');
// test options: { timeout: 6 * 60_000 }  → test timeout > polling timeout
```

### M6 — Interaction Verification (evidence)

**Triggers:** "verify interactions" · "stress locators" · "flaky interaction" · "locator wait m6"
**Question:** do the interactions stay green when repeated, in parallel, under load?

**Executes** tests and produces evidence; never modifies code. Never part of hub Mode 1. Tests that hit live external systems (e.g. API setup against a remote site) create real data: tell the user before running and scope to the smallest set.

1. Select the scope (single TC, feature or site) and one browser project (`--project` must exist in `<runner-config>`).
2. Repeat run (default K=5, N=4):
   `npx playwright test <scope> --project=<project> --repeat-each=<K> --workers=<N> --retries=0 --trace=retain-on-failure`
3. Classify every failure from the trace and error message:

| Category | Signal | Rule |
|---|---|---|
| Strict-mode violation | `resolved to N elements` | R5–R8 |
| Locator not found | Timeout waiting for locator | R1–R4 |
| Not actionable | Not visible / not stable / intercepted | R10 · R14 |
| Premature assertion | Action passed, assertion saw the old state | R14 · R15 |
| Polling exhausted | `expect.poll` timeout / terminal failure | R17–R20 |
| Data / isolation | Collision, 401, missing record | hand off to `spec-data-standard` M5 |

4. Compare with the previous run (before/after) when available.

```
[ui-locator-wait-standard] INTERACTION VERIFICATION
─────────────────────────────────────────
Scope:   <scope>   Project: <project>   repeat=<K> workers=<N>
Result:  <passed>/<total> passed · <flaky> flaky
Failures by cause: strict <n> · not-found <n> · actionability <n> · premature <n> · polling <n> · data <n>
Verdict: ✅ DETERMINISTIC  |  ❌ NOT DETERMINISTIC → run M<n> for <rule>
```

## Rules

### R1 — LOCATOR_HIERARCHY (ERROR, MANUAL-FIX) · M1
**Condition:** a locator uses a lower tier of the hierarchy when a higher tier identifies the same element uniquely. When `<testid-contract>` is defined and the element carries `<testid-attribute>`, any other strategy is a lower tier.
**Auto-fix (partial):** `locator('[<testid-attribute>="x"]')` → `getByTestId('x')` when the contract is configured in `<runner-config>`.
```typescript
// contract: testIdAttribute = 'data-test'
get submitButton() { return this.page.locator('[data-test="login-button"]'); }  // ❌
get submitButton() { return this.page.getByTestId('login-button'); }            // ✅
// no contract
get submitButton() { return this.page.getByRole('button', { name: 'Login' }); } // ✅
```
If the contract exists but the element lacks the attribute, fall back to the semantic order and report a markup request. Never use the attribute without seeing it in the DOM (R4).

### R2 — JUSTIFIED_CSS_XPATH (WARNING, MANUAL-FIX) · M1
**Condition:** a CSS or XPath locator (tier 8) has no `// locator: <reason>` comment explaining why no tier 1–7 locator works.
**Fix:** move to a higher tier, or add the reason (e.g. `// locator: third-party widget, no role or label`).

### R3 — NO_FRAGILE_SELECTORS (ERROR, MANUAL-FIX) · M1
**Condition:** a locator depends on a dynamic ID (digits/hash segment), a generated class (`css-*`, `sc-*`, `jss*`, hashed suffix), a CSS/XPath chain deeper than 3 levels, `:nth-child`, or XPath indexes (`[2]`).
**Fix:** apply the M1 fragile → robust table.

### R4 — NO_INVENTED_ATTRIBUTES (ERROR, MANUAL-FIX) · M1
**Condition:** a locator references a test id, role name, label or attribute that was not observed in the DOM (codegen, Inspector, DevTools or page snapshot) — typically AI-generated.
**Fix:** inspect the page and replace it with an observed value. If it cannot be verified, mark the getter `// TODO: verify locator in DOM` and report it; never guess.

### R5 — NO_POSITIONAL_WITHOUT_RULE (WARNING, MANUAL-FIX) · M2
**Condition:** `.first()`, `.last()` or `.nth(n)` is the only disambiguation, without a `// position: <business rule>` comment (e.g. "newest item is always first").
**Fix:** scope and filter by business data (R6). Keep the position only when the order itself is the requirement.

### R6 — SCOPE_AND_FILTER (WARNING, MANUAL-FIX) · M2
**Condition:** similar elements are distinguished by a long selector string instead of composition: region scoping, `filter({ hasText })`, `filter({ has })`, `filter({ hasNot })` or a unique child locator.
```typescript
this.page.locator('div.cards > div:has-text("Playwright") button.add');           // ❌
this.page.getByRole('article').filter({ hasText: 'Playwright' })
  .getByRole('button', { name: 'Add to cart' });                                   // ✅
```
Filter values come from controlled data (`spec-data-standard` R13), not environment literals.

### R7 — FILTER_BEFORE_ITERATE (WARNING, MANUAL-FIX) · M2
**Condition:** a collection is iterated (`for`, `.all()`, `count()` loop) or read as a list (`allTextContents`, `evaluateAll`) before it is filtered by business criteria and its expected count asserted.
**Fix:** filter → `expect(collection).toHaveCount(n)` → iterate or read.

### R8 — AMBIGUITY_FAILS_CLEARLY (ERROR, MANUAL-FIX) · M2
**Condition:** a strict-mode ambiguity is silenced: `.first()` added after a `resolved to N elements` failure, `{ strict: false }`, or a `try/catch` around an action that hides a missing element.
**Fix:** make the locator unique (R6). A missing or ambiguous element must fail with a clear error.

### R9 — ACTION_MATCHES_ELEMENT (ERROR, AUTO-FIX) · M3
**Condition:** the action does not represent the user interaction for the element type: `click()` on a checkbox/radio, `type()` (deprecated) or `pressSequentially()` for plain input, `click()` on an `<option>`, keyboard tricks to choose a select value, or `fill()` on a file input.
**Auto-fix:** replace with the action from the M3 table.

### R10 — NO_ACTIONABILITY_BYPASS (ERROR, MANUAL-FIX) · M3
**Condition:** an action bypasses actionability checks: `{ force: true }`, `dispatchEvent('click')`, `evaluate(el => el.click())`, or JavaScript value assignment instead of `fill()`.
**Why:** if a real user cannot click it (covered, hidden, disabled), the test must not either.
**Fix:** wait for the blocking condition to clear (overlay hidden, element enabled), or scroll/open the region the user would. Allowed only with `// bypass: <reason>` for a documented product limitation.

### R11 — LOCATOR_NOT_HANDLE (ERROR, AUTO-FIX) · M3
**Condition:** `page.$()`, `page.$$()`, `ElementHandle`, `page.waitForSelector()`, or a raw selector string passed between methods instead of a `Locator`.
**Auto-fix:** `page.$(s)` → `page.locator(s)`; `waitForSelector(s)` → `await expect(locator).toBeVisible()`; methods receive and return `Locator`.

### R12 — INTENTIONAL_READS (WARNING, MANUAL-FIX) · M3
**Condition:** a locator read (`textContent`, `innerText`, `getAttribute`, `inputValue`, `boundingBox`, `evaluate(getComputedStyle)`) is used for something other than (a) capturing a value a later step needs, or (b) an intentional visual check marked `// visual: <reason>`.
**Fix:** to verify a value use a web-first assertion (`spec-quality-lifecycle-standard` R4). Prefer accessibility and business behaviour over styles and coordinates.

### R13 — NO_FIXED_WAITS (ERROR, AUTO-FIX) · M4
*Owner moved from `spec-quality-lifecycle-standard` R3.*
**Condition:** `page.waitForTimeout(n)`, `setTimeout`, `new Promise(r => setTimeout(r, n))` or any sleep helper in a spec, Page Object, fixture or helper.
**Auto-fix:** replace with the explicit wait on the terminal state (M4 table). If the terminal state is unknown, leave `// TODO: wait for <terminal state>` and report MANUAL-FIX.
```typescript
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(3000);                                           // ❌
await expect(page.getByRole('status')).toHaveText('Saved');                // ✅
```

### R14 — WAIT_FOR_TERMINAL_STATE (ERROR, MANUAL-FIX) · M4
**Condition:** a state-changing action (submit, save, delete, navigate, upload) is followed by (1) no wait for the state that proves completion before the next action, or (2) a generic wait that does not prove completion: `waitForLoadState('networkidle')`, `waitForLoadState()` alone, or a wait on an intermediate state (spinner visible) instead of the final one.
**Fix:** wait for the final observable state from the TC oracle (`toHaveText`, `toBeHidden` on the spinner **and** the result, `toHaveURL`, `toHaveCount`).

### R15 — NO_REDUNDANT_WAITS (WARNING, AUTO-FIX) · M4
**Condition:** an explicit wait duplicates auto-waiting: `locator.waitFor()` or `expect(locator).toBeVisible()` immediately before an action on the **same** locator, with no other purpose.
**Auto-fix:** remove it. Keep it only when it is the step's assertion or a precondition (`spec-quality-lifecycle-standard` R1).

### R16 — NO_SOFT_ASSERT_AS_SYNC (ERROR, AUTO-FIX) · M4
**Condition:** `expect.soft()` checks a state the next action depends on (the element is then acted on, or it gates navigation).
**Why:** a failed soft assertion does not stop the test; the next action runs in the wrong state and fails with a misleading error. Soft assertions are for independent evidence only.
**Auto-fix:** convert to a hard `expect()`.

### R17 — BOUNDED_POLLING (ERROR, MANUAL-FIX) · M5
**Condition:** a condition-based wait has no explicit bound or is hand-rolled: `expect.poll` or `toPass` without `timeout` and `intervals`, or a `while` / `for` / recursive loop with `try/catch` and retries.
**Fix:** use `expect.poll` (state value) or `expect(...).toPass` (block of assertions) with `timeout` and `intervals`. Poll through the API-layer controller (`api-setup-teardown-standard` R1).

### R18 — TERMINAL_FAILURE_STATES (ERROR, MANUAL-FIX) · M5
**Condition:** a polling loop only checks the success state, so a terminal failure (`failed`, `cancelled`, `expired`, error page) keeps polling until timeout, or the polled states are not in the API contract.
**Fix:** fail immediately on terminal failure states with the observed state in the error. Take states from the API models; unknown → `TBD: state model`.

### R19 — TIMEOUT_HIERARCHY (WARNING, MANUAL-FIX) · M5
**Condition:** any of (1) a polling or assertion timeout ≥ the effective test timeout; (2) a magic-number timeout in a spec/PO with no constant or comment (`{ timeout: 47000 }`); (3) a global timeout raised in `<runner-config>` to hide one slow operation.
**Fix:** keep test > polling > request/assertion. Raise the timeout only on the slow operation, with a named constant or `// timeout: <business reason>`. A per-project `timeout` with a written reason is acceptable.

### R20 — DIAGNOSTIC_WAIT_MESSAGE (WARNING, AUTO-FIX) · M5
**Condition:** a long-running wait (`expect.poll`, `toPass`, or a matcher with a custom `timeout`) has no message, or its failure does not state the last observed state.
**Auto-fix:** add `message` stating the expected state and the entity; on custom failure throw with the last state and elapsed time:
```typescript
throw new Error(`Job ${id} did not complete within ${elapsed}s. Last known status: "${last ?? 'unknown'}".`);
```

## Violation output format

```
[ui-locator-wait-standard] SEVERITY — RULE_NAME (M<n>)
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED | MANUAL-FIX
```

Final summary: `[ui-locator-wait-standard] ✅ All rules satisfied.` or `X violations — Y auto-applied — Z manual: <list>`.

## Scan scope

| File glob | Rules |
|---|---|
| `src/ui/pages/**/*.ts` · `src/ui/components/**/*.ts` | R1–R13, R15 |
| `{testRoot}/**/*.spec.ts` | R5–R20 |
| `src/fixtures/**/*.ts` · helpers | R13, R17–R20 |
| `playwright.config.ts` | R1 (contract resolution), R19 |

APIs depended on: `getByTestId` · `getByAltText` · `getByTitle` · `pressSequentially` (≥ 1.38, replaces `type`) · `expect.poll` / `toPass` options.
