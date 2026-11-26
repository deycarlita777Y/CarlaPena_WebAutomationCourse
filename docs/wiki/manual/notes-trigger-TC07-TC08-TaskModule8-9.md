# Notes — ui-locator-wait-standard on demoqa TC02, TC07, TC08: assessment, DOM inspection, fixes

Skill: `.claude/skills/ui-locator-wait-standard/SKILL.md` · Related: [notes-adapt-ui-locator-wait-standard.md](notes-adapt-ui-locator-wait-standard.md) (§8 is the short version of this page) · [notes-TC8.md](notes-TC8.md)
Date: 2026-11-25 · Scope: `TC02-add-book-to-collection`, `TC07-replace-book-in-collection`, `TC08-delete-book-from-collection` (all demoqa)

## 1. Scope and project choice

| Item | Value |
|---|---|
| Specs | `test/ui/smoke/sites/demoqa/books/TC02-…`, `test/ui/regression/sites/demoqa/books/TC07-…`, `…/TC08-…` |
| Page Objects | `BookStoreLoginPage`, `BookStorePage`, `BookDetailPage`, `ProfilePage` |
| Browser | Chromium engine |
| Playwright project | **`demoqa`**, not `chromium` |

`--project=chromium` matches **zero** demoqa specs: `playwright.config.ts` sets `testIgnore: DEMOQA_SPECS` on the `chromium`, `firefox` and `webkit` projects. The `demoqa` project is Desktop Chrome (Chromium engine) with `baseURL: Env.demoqaUrl` and a 90 s test timeout.

`TC8-verify-products-and-detail.spec.ts` (automationexercise) has a similar name to TC08 but is a different spec and was **not** part of this scope.

## 2. M0 assessment (static scan)

| Check | Result |
|---|---|
| Test-id contract | None for demoqa (`testIdAttribute: 'data-test'` applies to saucedemo only) |
| Locator tiers | Mostly tier 2–4: `getByRole`, `getByPlaceholder`, `getByTitle`; text filters via `filter({ hasText })` |
| CSS locators | 3 (`#title-wrapper`, `#userName-value` ×2, `.modal-content`); the first two have a `// locator:` reason (R2) |
| Positional | One `.first()` in `BookStorePage.firstBookLink`, with a `// position:` rule (R5) |
| Fixed waits, `networkidle`, `force`, handles, `expect.soft` | None |
| Synchronisation | `waitForURL('**/profile')` after login; `waitForEvent('dialog')` registered before the click; `toBeHidden` on the dialog; `toHaveCount` on owned data |
| Level | 3 — Synchronised (not 4) |

## 3. M6 verification run (evidence)

Command (3 specs, `demoqa` project):

```
npx playwright test <TC07> <TC08> <TC02> --project=demoqa --repeat-each=5 --workers=4 --retries=0 --trace=retain-on-failure
```

| Metric | Value |
|---|---|
| Result | 15/15 passed, 0 flaky, 0 retries (2.8 min) |
| Failures by cause | none (strict 0, not-found 0, actionability 0, premature 0, polling 0, data 0) |
| Verdict | ✅ DETERMINISTIC |

The run creates real data on demoqa.com (one account per worker through the `workerUser` fixture, plus books); fixtures empty the collections in teardown.

## 4. Findings from the static scan

| # | Severity | Rule | Where | Finding | Status |
|---|---|---|---|---|---|
| 1 | WARNING | R4 / R2 | `ProfilePage.deleteConfirmationDialog` | `.modal-content`; the comment said the dialog role was never verified | **Fixed** (§6) |
| 2 | WARNING | R7 | `BookStorePage.getBookTitles()`, `ProfilePage.getBookTitles()` | Lists read with `allInnerTexts()` without a prior count assertion (does not auto-wait) | Open — not called by TC02/07/08 |
| 3 | WATCH | R1 / R6 | `BookStorePage.pageHeading` | `getByText('Book Store', { exact: true })` is tier 5 | **Resolved** (§6): matches the sidebar item, renamed |

## 5. DOM inspection (R4: nothing invented)

A throwaway Node script (outside the repo) drove Chromium against the live site. The modal needs an authenticated session with one book in the collection, so it created one temporary account through the API.

### 5.1 Heading — `/books` (unauthenticated)

| Probe | Result |
|---|---|
| `getByText('Book Store', { exact: true })` | 1 match: `<span class="text">Book Store</span>` inside `a.router-link` inside `li.btn.btn-light.active` — the **left sidebar menu item** |
| `getByRole('heading')` | **0 elements** |
| `getByRole('heading', { name: 'Book Store' })` | 0 (exact and substring) |

Conclusion: the locator is unique, so there is no strict-mode risk, but it never pointed at a page heading. TC02 step 1 ("Navigate to Book Store catalog") would pass even if the catalog area were broken, because the sidebar renders regardless. `getByRole('heading')` is not an option: the page exposes no heading.

### 5.2 Delete modal — `/profile` (authenticated, one book)

| Probe | Result |
|---|---|
| `.modal-content` | 1 match |
| `getByRole('dialog')` | **1 match**: `div.fade.modal.show`, `role="dialog"`, `aria-modal="true"` |
| Accessible name | `"Delete Book"` (via `aria-labelledby`) |
| Ancestors of `.modal-content` | `div.modal-dialog.modal-sm` → `div[role=dialog]` (the dialog contains `.modal-content`) |
| Text | "Delete Book Do you want to delete this book? OK Cancel" |
| Buttons inside the modal | `""` (× close), `"OK"`, `"Cancel"` |
| Page-wide `getByRole('button', { name: 'OK' })` | **3 matches** — the dialog scope is required |

## 6. Changes applied

| File | Change | Rule |
|---|---|---|
| `src/ui/pages/sites/demoqa/ProfilePage.ts` | `deleteConfirmationDialog`: `locator('.modal-content')` → `getByRole('dialog', { name: 'Delete Book' })`. The `// locator:` reason is replaced by a note that role and name were verified in the DOM. `deleteDialogOkButton` and `deleteDialogCancelButton` scope from it and are unchanged | R1, R2, R4 |
| `src/ui/pages/sites/demoqa/BookStorePage.ts` | `pageHeading` → `bookStoreMenuItem`, with a doc comment (sidebar entry; `/books` has no heading). Locator expression unchanged | naming accuracy |
| `test/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts` | Step 1 asserts `bookStorePage.bookStoreMenuItem` | |

Re-run after the changes: `tsc --noEmit` clean; `--project=demoqa --repeat-each=3 --workers=4 --retries=0` → 9/9 passed.


