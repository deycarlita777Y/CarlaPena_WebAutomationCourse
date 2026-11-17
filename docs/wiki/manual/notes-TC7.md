# Notes — TC07: Replace a book in the user's collection

Source TC: [book-store-crud-test-cases.md](book-store-crud-test-cases.md) › TC07
Spec: `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts`
Site: https://demoqa.com/profile · Swagger: https://demoqa.com/swagger

## Execution result

| Item | Result |
|---|---|
| Command | `npx playwright test TC07-replace --project=demoqa --workers=1` |
| Project | `demoqa` (chromium engine) |
| Outcome | **1 passed** (31.6 s; test itself 30.6 s) |
| Typecheck | `npm run typecheck` — clean |
| Post-run account state | Not checked separately. The teardown (`createdBook` → `cleanBookshelf`) throws if the collection is not empty, and it did not throw. |

The first attempt used `--project=chromium` and failed with "No tests found": the Playwright project is named `demoqa`, not `chromium`.

## What was created for this TC (prerequisites)

| File | Change |
|---|---|
| `src/fixtures/sites/demoqa.fixtures.ts` | Added `createdBook` fixture (exactly one seeded book). Extracted the shared seed/teardown logic into a `seedCollection()` helper now also used by `createdBooks` (TC08) |
| `src/data/sites/demoqa/books.data.ts` | Added `bookAlerts` (`added`, `deleted`) and `singleBookCollection` (`size: 1`) |
| `src/ui/pages/sites/demoqa/BookStorePage.ts` | Added `getBookTitles()` and `clickBookByTitle(title)` |
| `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts` | New spec, 9 `test.step()` blocks covering the 17 TC steps |

Already present and reused: `ApiClient`, `AccountController`, `BookController`, `cleanBookshelf`, `BookStoreLoginPage`, `BookDetailPage.addToCollection()`, and from TC08 the `ProfilePage` delete helpers (`deleteIconForBook`, `confirmDeletion`, dialog locators). No change was needed in the endpoints or models.

## Lifecycle design

- **Precondition ("exactly one book, Book A")** — `createdBook` depends on `cleanBookshelf` (collection verified empty), authenticates through the API, takes the first catalog book and adds it with `POST /BookStore/v1/Books`. Book A is the fixture value (`createdBook.title`).
- **Test body** — logs in through the UI, deletes Book A through the UI, then picks Book B in the catalog (first title different from Book A) and adds it through the UI.
- **Postcondition** — `createdBook` teardown re-authenticates (the UI login invalidates the setup token — `api-setup-teardown-standard` R9) and calls `deleteAll`, which is idempotent. It removes Book B, which the test added and the fixture did not know about. `cleanBookshelf` then runs its own verified clean.
- The spec never instantiates controllers or `ApiClient` (R7); it only receives `createdBook` as a fixture parameter.

## Rule review (applied by hand, no skill run)

| Skill | Result |
|---|---|
| `api-setup-teardown-standard` | R4, R7, R8, R9 satisfied; `ApiClient`/controllers untouched |
| `spec-quality-lifecycle-standard` | R1 (precondition asserted), R2/R11 (clean fixture, verified), R8 (no `if`/`for` in the test body), R9, R10 satisfied |
| `spec-standards` | Folder, file name, `describe` = feature folder, `TC07:` prefix, `test.step()` |
| `test-standards` / `pom-architect` | Alias imports only, no credentials in the spec, new PO members are getter-free actions with a title-based selector |

## Findings

1. Same UI behaviour as TC08: deleting shows an in-page modal, then a native alert "Book deleted." The TC text only mentions the modal. `confirmDeletion()` handles both, and the spec asserts the alert text via `bookAlerts.deleted`.
2. TC07 step 13 expects the alert "Book added to your collection." (`bookAlerts.added`). TC02 still hardcodes the same string. It could use `bookAlerts.added` too.
3. Swagger also exposes `PUT /BookStore/v1/Books/{ISBN}`, which replaces a book in one call. TC07 describes the UI flow (delete then add), so the API call was not used. It would fit an API-level TC.
4. Book B is chosen at run time from the catalog, so the TC does not depend on specific titles.

## Environment notes

- Credentials come from `.env` (`DEMOQA_USER`, `DEMOQA_PASSWORD`), which is git-ignored. They are not hardcoded anywhere.
- All demoqa specs share one account (spec-quality-lifecycle-standard R12). Run TC07 with `--workers=1` and do not run it in parallel with other demoqa specs.

## Pending / not done

- The full pipeline (automation-architect Mode 1) was not run; the rules above were checked manually.
- TC08 was re-run together with TC07 after the `seedCollection()` refactor (2 passed, 59.4 s). TC02 and TC04 (smoke) were not re-run.
- Spec placed in `regression`; move to `smoke` if preferred.
- Nothing committed.
