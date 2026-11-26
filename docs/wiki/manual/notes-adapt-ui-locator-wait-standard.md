# Notes — ui-locator-wait-standard applied to demoqa TC07 and TC08

Prompt: [ui-locator-wait-standard-demoqa-tc07-tc08-prompt.md](../../skills/ui-locator-wait-standard-demoqa-tc07-tc08-prompt.md) · Skill: `.claude/skills/ui-locator-wait-standard/SKILL.md` · Earlier run: [notes-trigger-ui-locator-wait-demoqa-tc02-tc07-tc08.md](notes-trigger-ui-locator-wait-demoqa-tc02-tc07-tc08.md)
Date: 2026-11-26 · Scope: `TC07-replace-book-in-collection`, `TC08-delete-book-from-collection` (demoqa) and the Page Objects `BookStoreLoginPage`, `BookStorePage`, `BookDetailPage`, `ProfilePage`

## 1. Scope and conventions

| Item | Value |
|---|---|
| Specs | `test/ui/regression/sites/demoqa/books/TC07-…` · `…/TC08-…` |
| Page Objects | `src/ui/pages/sites/demoqa/` |
| Read-only inputs | Fixtures, data files, API layer, `playwright.config.ts`, TC document |
| Test-id contract | None for demoqa (`testIdAttribute: 'data-test'` is saucedemo only) |
| Playwright project | `demoqa` (`chromium`, `firefox`, `webkit` ignore demoqa specs through `testIgnore`) |
| Out of scope | TC02, automationexercise TC8 (different spec), saucedemo, config, fixtures, data, TC documents |

## 2. M0 assessment (static)

| Check | Result |
|---|---|
| Locators | Mostly tier 2–4 (`getByRole`, `getByPlaceholder`) plus composition with `filter` and scoping |
| CSS locators | 3 (`#userName-value` ×2, `#title-wrapper`), all with a `// locator:` reason |
| Positional | One `.first()` (`BookStorePage.firstBookLink`) with a `// position:` reason; used only by TC02 |
| Waits | None fixed. `waitForURL`, `waitForEvent('dialog')` registered before the click, `toBeHidden`, `toHaveCount` |
| Handles, `force`, `expect.soft`, polling | None |
| Level | **4 — Bounded & diagnosable** (all Level 3 exit criteria met for this scope; static score, not a full M0 run) |

## 3. Hypotheses from the prompt

| # | Hypothesis | Result |
|---|---|---|
| A | `ProfilePage.deleteIconForBook` uses `getByTitle('Delete')` (tier 7) when a higher tier exists | **Rejected.** The icon is `<span id="delete-record-…" data-toggle="tooltip" title="Delete">` with an svg inside. No role, label or accessible name: `getByRole('button', { name: 'Delete' })` = 0, `getByLabel('Delete')` = 0, `getByRole('img')` = 2 (not unique). `getByTitle` is the best available |
| B | `login()` ends in `waitForURL('**/profile')` and step 2 asserts `toHaveURL` again | **Rejected.** The PO wait establishes the session for every caller; the spec assertion is the TC oracle. R15 targets a wait on the same locator before an action, which this is not |
| C | `waitForEvent('dialog')` has no explicit timeout | **Not a violation.** None of the three R19 conditions apply (no magic number, no raised global timeout, no polling). The actual default was not verified |
| D | TC07 step 10 needs a UI wait after `addToCollection()` | **Rejected.** The browser alert is the terminal signal (the oracle is the alert message); step 11 asserts with auto-retry |

## 4. DOM inspection (R4: nothing invented)

A throwaway script (outside the repo) created one account per run through the API, added a book, and drove Chromium against demoqa.com.

| Probe | Result |
|---|---|
| Profile: book row by title | 1 match |
| Profile: delete icon | `getByTitle('Delete')` = 1; role, label and name alternatives found nothing unique (see §3 A) |
| Profile: `#userName-value` | 1 match, a `<label>` with no accessible name; `getByText(username, { exact: true })` also = 1 |
| Detail: `#title-wrapper` | 1 match, a plain `div` with no role |
| Detail: `#userName-value` | **9 matches.** The id repeats; it is unique only inside `#title-wrapper` |
| Detail: `getByText('Title :')` | 2 matches (also "Sub Title :"); `getByLabel('Title :')` = 0 |
| Detail: `getByText(title, { exact: true })` | 1 match, but it needs the title as a parameter and would make the TC07 assertion circular |
| Detail: "Add To Your Collection", "Back To Book Store" buttons | 1 match each |

Note: `count()` does not auto-wait. The first probe read 0 rows because the table had not rendered; waiting for the first row fixed it.

## 5. Change applied

| File | Change | Rule |
|---|---|---|
| `src/ui/pages/sites/demoqa/BookDetailPage.ts` | `titleValue` comment corrected. It said "ids are unique and stable"; it now says the id repeats (9 matches on the detail view) and is unique only inside `#title-wrapper`. Locator unchanged | R2 (accurate reason) |

`npm run typecheck`: clean. No spec, fixture, data or config file was edited.

## 6. M6 verification

Command:

```
npx playwright test <TC07> <TC08> --project=demoqa --repeat-each=5 --workers=4 --retries=0 --trace=retain-on-failure
```

```
[ui-locator-wait-standard] INTERACTION VERIFICATION
Scope:   TC07 + TC08   Project: demoqa   repeat=5 workers=4
Result:  10/10 passed · 0 flaky (2.2 min)
Failures by cause: strict 0 · not-found 0 · actionability 0 · premature 0 · polling 0 · data 0
Verdict: ✅ DETERMINISTIC
```

Baseline (2026-11-25) covered TC02 as well: 15/15 passed, 0 flaky. Only the TC07 and TC08 share is comparable.

## 7. Open items (not changed)

| # | Rule | Where | Note |
|---|---|---|---|
| 1 | R7 | `BookStorePage.getBookTitles()` · `ProfilePage.getBookTitles()` | `allInnerTexts()` without a prior count assertion. Nothing calls them any more (grep over `src` and `test`); deleting them is the cleanest fix and is outside this scope |

## 8. Side effects and clean-up

- The inspection created two temporary demoqa accounts. Both were deleted (`DELETE` → 204); the second was confirmed gone (`User not found`).
- The first run left an account behind because `DELETE` returned 401: logging in through the UI invalidates the API token. The password was recovered and the account removed with a fresh API login. Deleting after a fresh login is the working pattern.
- The M6 run created one account per worker through the `workerUser` fixture; fixtures empty the collections in teardown.
- Scripts live in the scratchpad, not in the repo. Nothing was committed.
