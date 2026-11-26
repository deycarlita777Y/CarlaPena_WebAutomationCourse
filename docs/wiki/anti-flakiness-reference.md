# Anti-Flakiness Reference

> Index of the causes of flaky UI tests and the skill rule that prevents each one.
> This page does not define rules. The skills own them. Update this page when a skill
> adds, renames or moves a rule.
>
> Related: `docs/decisions/0006-add-ui-locator-wait-standard.md`

---

## 1 — Where each concern lives

| Concern | Owner skill | Rules |
|---------|-------------|-------|
| Locator strategy, uniqueness, action semantics | `ui-locator-wait-standard` | R1–R12 |
| Waits and synchronisation | `ui-locator-wait-standard` | R13–R16 |
| Polling and timeouts | `ui-locator-wait-standard` | R17–R20 |
| Page Object structure (getters, async actions, no `page.*` in specs, no assertions) | `pom-architect` | Rules 2, 3, 4, 6 (this skill numbers rules 1–8 without an `R` prefix) |
| Preconditions, assertions, independence | `spec-quality-lifecycle-standard` | R1, R2, R4, R6, R7, R9, R10 (R3 and R5 delegate to `ui-locator-wait-standard`) |
| Test data isolation (parallel, environments) | `spec-data-standard` | R1–R5, R15 (isolation) · R9–R10 (environments) |
| API setup/teardown, mocks | `api-setup-teardown-standard` | R4 (teardown) · R5 (mocks) · R10 (status checked) |

---

## 2 — Selectors and locators

| Flaky symptom | Cause | Rule | Fix |
|---------------|-------|------|-----|
| Element not found after a UI release | Dynamic ID or generated class | R3 | Role, label or test id |
| `strict mode violation: resolved to N elements` | Locator matches several elements | R5–R8 | Scope + `filter()`, not `.first()` |
| Wrong row or card is clicked | Positional locator (`nth`, `first`) | R5 | Filter by business data |
| Passes locally, fails in another site or environment | Test id assumed, not observed | R1, R4 | Inspect the DOM; follow the test-id contract in `playwright.config.ts` |
| Test passes when it should fail | Strict-mode error silenced (`strict: false`, `try/catch`) | R8 | Make the locator unique |
| Click works only with `force: true` | Actionability bypassed | R10 | Wait for the blocker to clear |
| Stale element errors | `ElementHandle` or `page.$` used | R11 | Use `Locator` |

## 3 — Waits and synchronisation

| Flaky symptom | Cause | Rule | Fix |
|---------------|-------|------|-----|
| Fails on slow CI, passes locally | `waitForTimeout` | R13 | Wait on the terminal state |
| Next step runs against the old state | No wait after a state-changing action | R14 | Assert the final observable state |
| `networkidle` hangs or returns too early | Generic wait that proves nothing | R14 | `toHaveText`, `toHaveURL`, `toBeHidden` |
| Misleading failure one step after the real problem | `expect.soft()` used as synchronisation | R16 | Use a hard `expect()` |
| Noise and masked intent | Duplicate waits before an action | R15 | Rely on auto-waiting |

## 4 — Polling and timeouts

| Flaky symptom | Cause | Rule | Fix |
|---------------|-------|------|-----|
| Job test runs to timeout on failure | Only the success state is polled | R18 | Fail fast on terminal failure states |
| Hand-written retry loops | Unbounded or custom polling | R17 | `expect.poll` / `toPass` with `timeout` and `intervals` |
| Test timeout hit before polling finishes | Test timeout is not greater than polling timeout | R19 | Keep test > polling > request/assertion |
| Timeout failure without context | No message or last state | R20 | Add `message` and last observed state |

## 5 — Causes outside this skill

| Symptom | Where to look |
|---------|---------------|
| Fails only with several workers | `spec-data-standard` R1–R5, R15 (isolation) |
| Fails only in one environment | `spec-data-standard` R9–R10 (environments) |
| Depends on another test's leftovers | `spec-quality-lifecycle-standard` R7 (independence), `api-setup-teardown-standard` R4 (teardown) |
| Missing precondition or weak assertion | `spec-quality-lifecycle-standard` R1, R4, R10 |

---

## 6 — Proving stability

Run `ui-locator-wait-standard` M6 ("verify interactions"). It repeats the tests, classifies each
failure by cause and maps it to a rule:

```
npx playwright test <scope> --project=<browser> --repeat-each=5 --workers=4 --retries=0 --trace=retain-on-failure
```

Use `retain-on-failure` traces to see the cause. Compare the before and after runs as evidence.
