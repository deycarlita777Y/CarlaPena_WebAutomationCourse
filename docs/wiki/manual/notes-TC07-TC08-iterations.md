# Notes — TC07 + TC08: iterations to reach the expected results

Date: 2026-11-24
Related: [notes-TC7.md](notes-TC7.md) · [notes-TC8.md](notes-TC8.md) · [notes-TC07-TC08-spec-requirements-and-data-run.md](notes-TC07-TC08-spec-requirements-and-data-run.md)
Specs:
- `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts`
- `test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts`

This document summarises the three iterations the specs went through. It was compiled from the existing notes and the uncommitted `git diff`. The tests were not re-run to write it.

## Iteration 0 — first version (commit `2bfa2b1`)

| Item | What it took |
|---|---|
| Run command | The first attempt used `--project=chromium` and failed with "No tests found". The Playwright project is named `demoqa`. |
| Live-site findings | `/profile` is a plain HTML table, not react-table, so `bookRows` keeps only rows that contain a link. The delete icon is found with `getByTitle('Delete')`. Delete has two stages: an in-page modal, then a native alert "Book deleted." that must be accepted. `confirmDeletion()` handles both. |
| Lifecycle | The `createdBook` and `createdBooks` fixtures seed the collection by API. Teardown re-authenticates, because the UI login invalidates the setup token (api-setup-teardown R9). Teardown then calls `deleteAll`, which is idempotent. |
| Environment | `NODE_USE_SYSTEM_CA=1` is needed for the corporate proxy certificate (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`). |
| Result | TC07: 1 passed (31.6s). TC08: 1 passed (26.4s). Both ran with `--workers=1` on the shared account. |

Remaining problems in this version:
- The specs logged in with the shared account `bookStoreUsers.appUser`.
- TC07 read Book B from the UI.
- TC08 read `bookA` and the remaining titles back from the UI.
- Step labels were loosely worded and did not match the TC document.

## Iteration 1 — spec-requirements-standard and spec-data-standard

### Assessment before the changes

| TC | Score | Grade | Gaps |
|---|---|---|---|
| TC07 | 77% | Needs refinement | Q4, Q10, Q5 |
| TC08 | 68% | Needs refinement | Q4, Q10, Q6, Q5 |

| Rule | TC | Issue |
|---|---|---|
| Q4 | 07, 08 | `credentials` declared as Secret from `bookStoreUsers.appUser`. The code uses a generated Transactional `workerUser`. |
| Q10 | 07, 08 | Risk note said "shared account, must not run concurrently". Each worker owns its account. |
| Q6 | 08 | Step 3 oracle was "non-empty and different". Titles were read back from the UI although `createdBooks` knows them. |
| Q5 | 07 (steps 1, 7), 08 (step 1) | Steps combined two actions. |

spec-data-standard M0 put demoqa at level 3 (Isolated). Findings:
- R12: `cleanBookshelf` did a bulk delete without the `Env.allowDestructiveCleanup` check.
- R13: TC07 `bookB` and TC08 `bookA`/`bookB` were taken from the UI, and TC08 had `void createdBooks`.
- R4: the `workers` cap had no comment explaining it.
- R10: public default URL in `Env` (local only).
- R15: passes with residual risk. All API logins finish before the UI login, and teardown re-authenticates.

### Changes

TC document:

| TC | Score | Changes |
|---|---|---|
| TC07 | 77% → 100% | `credentials` → Transactional via `workerUser`. `siteUrl` (Environment) added. `bookB` → API discovery. Precondition P1 (per-worker account). Postcondition scoped to the worker's own account. Steps 1 and 7 split (9 → 11 steps). |
| TC08 | 68% → 100% | Same credentials and scope fixes. `bookA`/`bookB` = `createdBooks[0]`/`[1]`. Step 4 asserts one row per title with no row order. Step 1 split (6 → 7 steps). |

Code:

| File | Change |
|---|---|
| TC07 spec | `bookB` from `bookController.getAll()` via `otherBookTitle`. 11 numbered steps matching the document. URL check uses the `page` fixture. `@mutates-data` tag. |
| TC08 spec | Titles from `createdBooks`. No `void createdBooks`. No row-order assumption. 7 numbered steps. Message from `bookAlerts.deleted`. `@mutates-data` tag. |
| `src/fixtures/sites/demoqa.fixtures.ts` | New `bookController` fixture (read-only catalog access). New `removeBooks` helper: bulk `deleteAll` only when `Env.allowDestructiveCleanup` is true, otherwise `deleteOne` per listed book. |
| `playwright.config.ts` | `// spec-data: serial — …` comment on `workers`. |

### Evidence (M5 robustness verification)

```
Scope:     TC07, TC08   Project: demoqa
Parallel:  workers=4 repeat=4 retries=0 → 8/8 passed · 0 flaky (1.6m)
Guard off: ALLOW_DESTRUCTIVE_CLEANUP=false (workers=2) → 2/2 passed
Failures by cause: collision 0 · session 0 · missing-data 0 · order 0 · other 0
Orphans:   not measured
Verdict:   HERMETIC for parallel runs (partial evidence)
```

- Longest run: 38.5s against the 90s project timeout.
- Only one environment (`local`) exists, so there was no per-environment run.
- Orphans could not be counted: demoqa has no API to list users. Teardown showed no errors, which is indirect evidence only.

## Iteration 2 — cross-skill fixes

| Skill and rule | Finding | Fix |
|---|---|---|
| spec-quality-lifecycle R8 | `if (...) throw` guards inside both test bodies | `otherBookTitle()` and `seededTitles()` in `books.data.ts` throw outside the body |
| spec-quality-lifecycle R4 | `expect(await getBookTitles())` read once, with no auto-retry | `bookTitleLinks` + `toHaveText([bookB])`; `bookLinkByTitle` + `toBeVisible()` |
| pom-architect R3 | Specs clicked `deleteIconForBook(...)` directly | Added `ProfilePage.openDeleteDialog(title)` |
| api-setup-teardown R8 | Fixture `catalogBooks` broke the naming table | Renamed to `bookController` |
| spec-standards R2 | Padded IDs (`TC07`) against an unpadded rule | Kept the padding. The skill now sets padding per site (`demoqa` is two-digit padded). No files were renamed. |

Result: `tsc --noEmit` passes, both specs are still listed by `playwright test --list`, and 6/6 passed (workers=4, repeat=3).

Rules that pass: test-standards 1–9, spec-standards R1, R3, R4 (prefix), R5, api-setup-teardown R1–R7 and R9–R10, spec-quality-lifecycle R1–R3, R5 (PO changes), R6, R7, R9–R12, pom-architect 1, 2, 4–8.

## Summary of the progression

🔄 = changed in this iteration. ➖ = same as the previous iteration.

| Aspect | Iteration 0: first version | Iteration 1: requirements and data | Iteration 2: cross-skill fixes | Final state |
|---|---|---|---|---|
| **Account** | Shared `appUser` | 🔄 Per-worker `workerUser` | ➖ Unchanged | Per-worker `workerUser` |
| **Expected titles** | Read from the UI | 🔄 From `createdBooks` and the API | 🔄 Resolved outside the test body | Resolved outside the test body |
| **Steps** | Loose labels | 🔄 Numbered, matching the TC document | ➖ Unchanged | Numbered, matching the TC document |
| **Cleanup** | `deleteAll` always | 🔄 Guarded by `Env.allowDestructiveCleanup` | ➖ Unchanged | Guarded by `Env.allowDestructiveCleanup` |
| **Assertions on titles** | Single read | ➖ Unchanged | 🔄 Auto-retrying locators | Auto-retrying locators |
| **Delete click** | Direct locator in the spec | ➖ Unchanged | 🔄 `openDeleteDialog()` in the Page Object | `openDeleteDialog()` in the Page Object |
| **Parallel evidence** | `--workers=1` only | 🔄 **8/8** at workers=4 | 🔄 **6/6** at workers=4 | **6/6** at workers=4 |


