# Notes — TC07 + TC08: progression table (TaskModule8)

Related: [notes-TC07-TC08-iterations.md](notes-TC07-TC08-iterations.md) (source narrative, unchanged) · [notes-TC7.md](notes-TC7.md) · [notes-TC8.md](notes-TC8.md)
Specs:
- `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts`
- `test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts`

Compiled from the existing notes and `git diff`. The tests were not re-run to write this page.

Legend: 🔄 changed in this stage · ➖ same as the previous stage · ⭐ turning point · ✅ final state

## 1. Stage overview

| | **Iteration 0**<br>First version | **Iteration 1**<br>Requirements and data | **Iteration 2**<br>Cross-skill fixes | **Post-iteration**<br>Uncommitted edit |
|---|---|---|---|---|
| **Date / commit** | 2026-11-17 · `2bfa2b1` | 2026-11-24 · `c69257a` | 2026-11-24 (the source note gives no separate date; the TC07/TC08 spec changes are included in `c69257a`) | 2026-11-25 · working tree |
| **Driver** | Make both specs run against the live site | spec-requirements-standard + spec-data-standard (M0 assessment) | spec-quality-lifecycle, pom-architect, api-setup-teardown, spec-standards | TC07 step 8 redundancy |
| **Result** | TC07 ✅ 31.6s · TC08 ✅ 26.4s (`--workers=1`, shared account) | TC document score: TC07 77% → **100%**, TC08 68% → **100%** | `tsc --noEmit` clean | One assertion removed |
| **Parallel evidence** | None (workers=1 only) | ⭐ **8/8** passed, workers=4, repeat=4, retries=0, 0 flaky (1.6m); guard off: 2/2 (workers=2) | **6/6** passed, workers=4, repeat=3 | Not re-run |

## 2. What changed, aspect by aspect

| Aspect | Iteration 0 | Iteration 1 | Iteration 2 | ✅ Final state |
|---|---|---|---|---|
| **Account** | Shared `bookStoreUsers.appUser` | 🔄 ⭐ Per-worker generated `workerUser` | ➖ | Per-worker `workerUser` |
| **Expected titles** | Read from the UI (TC07 Book B; TC08 `bookA` and remaining titles) | 🔄 From the API: TC07 `bookController.getAll()` via `otherBookTitle`; TC08 `createdBooks[0]`/`[1]` | 🔄 Resolved outside the test body (`otherBookTitle()`, `seededTitles()` in `books.data.ts`) | Resolved outside the test body |
| **Steps** | Loose labels that did not match the TC document | 🔄 Numbered to match the TC document: TC07 9 → 11 steps, TC08 6 → 7 | ➖ | Numbered, matching the TC document |
| **Row order (TC08)** | Assumed (`titles[0]`, `slice(1)`) | 🔄 Step 4 asserts one row per title, no order | ➖ | No order assumed |
| **Alert message** | `seededCollection.deleteSuccessMessage` | 🔄 `bookAlerts.deleted` | ➖ | `bookAlerts.deleted` |
| **Tags** | None | 🔄 `@mutates-data` | ➖ | `@mutates-data` |
| **Cleanup** | `deleteAll` always | 🔄 `removeBooks`: bulk `deleteAll` only if `Env.allowDestructiveCleanup`, otherwise `deleteOne` per book | ➖ | Guarded by `Env.allowDestructiveCleanup` |
| **Fixtures** | `createdBook` / `createdBooks`, teardown re-authenticates | 🔄 New `bookController` fixture (read-only catalog access) | 🔄 Fixture `catalogBooks` renamed to `bookController` (api-setup-teardown R8) | `bookController` |
| **Title assertions** | Single read, no auto-retry | ➖ | 🔄 `bookTitleLinks` + `toHaveText([bookB])`; `bookLinkByTitle` + `toBeVisible()` | Auto-retrying locators |
| **Delete click** | Direct `deleteIconForBook(...).click()` in the spec | ➖ | 🔄 `ProfilePage.openDeleteDialog(title)` (pom-architect R3) | Page Object method |
| **Guards in test body** | `if (...) throw` guards | ➖ | 🔄 Moved out of the body (spec-quality-lifecycle R8) | None in the body |
| **TC07 step 8** | n/a | `bookList.first()` visible, then `bookLinkByTitle(bookB)` visible | ➖ | 🔄 `bookList.first()` assertion removed; `bookLinkByTitle(bookB)` check remains (uncommitted) |
| **File naming** | `TC07` / `TC08` (padded) | ➖ | Padding kept; skill now sets padding per site (demoqa is two-digit padded); no files renamed | Padded names |

## 3. Problems found and how each was resolved

| Stage | Finding | Resolution |
|---|---|---|
| **0** | `--project=chromium` → "No tests found" | Project is named `demoqa` |
| **0** | `/profile` is a plain HTML table, not react-table | `bookRows` keeps only rows that contain a link |
| **0** | Delete has two stages (in-page modal, then native alert) | `confirmDeletion()` handles both |
| **0** | UI login invalidates the setup token (api-setup-teardown R9) | Teardown re-authenticates, then calls the idempotent `deleteAll` |
| **0** | `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` (corporate proxy) | `NODE_USE_SYSTEM_CA=1` |
| **1** | Q4 (TC07, TC08): `credentials` declared Secret from `appUser`; code uses a generated Transactional `workerUser` | `credentials` → Transactional via `workerUser`; `siteUrl` (Environment) added |
| **1** | Q10 (TC07, TC08): risk note said "shared account, must not run concurrently" | Postcondition scoped to the worker's own account; P1 per-worker account added (TC07) |
| **1** | Q6 (TC08): oracle "non-empty and different"; titles read from the UI | `bookA`/`bookB` = `createdBooks[0]`/`[1]` |
| **1** | Q5 (TC07 steps 1 and 7; TC08 step 1): steps combined two actions | Steps split (TC07 9 → 11, TC08 6 → 7) |
| **1** | R12: `cleanBookshelf` bulk delete without the `Env.allowDestructiveCleanup` check | `removeBooks` helper with the guard |
| **1** | R13: TC07 `bookB` and TC08 `bookA`/`bookB` taken from the UI; TC08 had `void createdBooks` | Titles from the API / `createdBooks`; `void` removed |
| **1** | R4: `workers` cap had no comment | `// spec-data: serial — …` comment in `playwright.config.ts` |
| **1** | R10: public default URL in `Env` | Local only (no change recorded) |
| **1** | R15: residual risk | Passes; all API logins finish before the UI login, teardown re-authenticates |
| **2** | spec-quality-lifecycle R8, R4 | Guards moved out; auto-retrying locators |
| **2** | pom-architect R3 | `openDeleteDialog()` |
| **2** | api-setup-teardown R8 | Fixture renamed |
| **2** | spec-standards R2 (padding) | Padding kept, rule updated per site |

## 4. Evidence from Iteration 1 (M5 robustness verification)

| Metric | Value |
|---|---|
| Scope / project | TC07, TC08 · `demoqa` |
| Parallel run | workers=4, repeat=4, retries=0 → **8/8 passed · 0 flaky** (1.6m) |
| Guard-off run | `ALLOW_DESTRUCTIVE_CLEANUP=false` (workers=2) → **2/2 passed** |
| Failures by cause | collision 0 · session 0 · missing-data 0 · order 0 · other 0 |
| Longest run | 38.5s (project timeout 90s) |
| Orphans | Not measured: demoqa has no API to list users. Teardown showed no errors (indirect evidence only) |
| Environments | Only `local` exists, so no per-environment run |
| Verdict | ⭐ **HERMETIC for parallel runs (partial evidence)** |

## 5. Rules that pass at the end of Iteration 2

| Skill | Rules passing |
|---|---|
| test-standards | 1–9 |
| spec-standards | R1, R3, R4 (prefix), R5 |
| api-setup-teardown-standard | R1–R7, R9–R10 |
| spec-quality-lifecycle-standard | R1–R3, R5 (PO changes), R6, R7, R9–R12 |
| pom-architect | 1, 2, 4–8 |
