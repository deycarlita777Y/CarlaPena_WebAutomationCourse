# Notes — TC08: Delete a specific book from the user's collection

Source TC: [book-store-crud-test-cases.md](book-store-crud-test-cases.md) › TC08
Spec: `test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts`
Site: https://demoqa.com/profile · Swagger: https://demoqa.com/swagger

## Execution result

| Item | Result |
|---|---|
| Command | `npx playwright test test/ui/regression/sites/demoqa --project=demoqa --workers=1` |
| Project | `demoqa` (chromium engine) |
| Outcome | **1 passed** (26.4 s). Run together with TC07 (2 passed in 59.4 s) |
| Typecheck | `npm run typecheck` — clean |
| Post-run account state | The first run was checked through the API: 0 books left. The final run was not checked separately; `cleanBookshelf` throws if the collection is not empty, and it did not throw |

The first run happened before the `seedCollection()` refactor (see below). The result above is from the re-run after it.

## What was created for this TC (prerequisites)

| File | Change |
|---|---|
| `src/ui/pages/sites/demoqa/ProfilePage.ts` | Added `deleteConfirmationDialog`, `deleteDialogOkButton`, `deleteDialogCancelButton`, `deleteIconForBook(title)`, `getBookTitles()`, `confirmDeletion()` |
| `src/data/sites/demoqa/books.data.ts` | Added `seededCollection` (`size: 2`, `deleteSuccessMessage`). TC07 later added `bookAlerts` and `singleBookCollection` to the same file |
| `src/fixtures/sites/demoqa.fixtures.ts` | Added `createdBooks` fixture (API setup + teardown). Its logic now lives in the shared `seedCollection()` helper, which TC07's `createdBook` also uses |
| `test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts` | New spec, 7 `test.step()` blocks covering the 11 TC steps |

Already present and reused: `ApiClient`, `AccountController`, `BookController`, `cleanBookshelf`, `BookStoreLoginPage`.

## Lifecycle design

- **Precondition ("at least two books")** — `createdBooks` depends on `cleanBookshelf` (collection verified empty). `seedCollection(request, 2)` authenticates through the API, takes the first 2 catalog books and adds them with `POST /BookStore/v1/Books`.
- **Test body** — logs in through the UI, opens `/profile`, deletes Book A (the first row) through the UI.
- **Postcondition** — the teardown re-authenticates (the UI login invalidates the setup token — `api-setup-teardown-standard` R9) and calls `deleteAll`. `deleteAll` is idempotent. `deleteOne` would return 400 because the test already removed one book. `cleanBookshelf` then runs its own verified clean.
- The spec never instantiates controllers or `ApiClient` (R7); it only receives `createdBooks` as a fixture parameter.

## Findings about the live site

1. `/profile` renders a **plain HTML table** (`<table>/<tbody>/<tr>`), not react-table. `.rt-tbody` / `.rt-tr-group` locators do not exist. The header row also has the `row` role, so `bookRows` keeps only rows that contain a link.
2. The delete icon is `<span id="delete-record-<isbn>" title="Delete">` containing an SVG. It is reachable with `getByTitle('Delete')` inside the book's row.
3. Delete is a **two-stage confirmation**: an in-page modal (`.modal-content`, title "Delete Book", text "Do you want to delete this book?", buttons `#closeSmallModal-ok` / `#closeSmallModal-cancel`), then, after OK, a **native browser alert** "Book deleted." that must be accepted. The TC text only mentions the modal, so `confirmDeletion()` handles the alert too.
4. Table order follows insertion order, so "first book" is the first seeded catalog book.

## Environment notes

- A corporate proxy certificate caused `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` for API calls made outside the test runner. `playwright.config.ts` already sets `NODE_USE_SYSTEM_CA=1`. Ad-hoc Node scripts need the same variable.
- Credentials come from `.env` (`DEMOQA_USER`, `DEMOQA_PASSWORD`), which is git-ignored. They are not hardcoded anywhere.
- All demoqa specs share one account (spec-quality-lifecycle-standard R12). Run TC08 with `--workers=1` and do not run it in parallel with other demoqa specs.

## Pending / not done

- The full pipeline (automation-architect Mode 1) was not run on this spec.
- Duplicated constant: the spec uses `seededCollection.deleteSuccessMessage`, while `bookAlerts.deleted` holds the same string. Switching the spec to `bookAlerts.deleted` and removing `deleteSuccessMessage` would leave one source of truth.
- TC02 and TC04 (smoke) were not re-run after the `seedCollection()` refactor. They do not use `createdBooks`, but they share `cleanBookshelf` and the fixture file.
- Spec placed in `regression`; move to `smoke` if preferred.
- Nothing committed.
- The TC wording for steps 5–8 could mention the follow-up "Book deleted." alert.
