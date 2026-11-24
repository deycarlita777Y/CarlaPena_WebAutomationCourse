# Book Store — CRUD Test Cases

**Site:** https://demoqa.com/books  
**Entity under test:** User book collection (profile shelf)

---

## Prerequisites

- A registered user account exists with known credentials.
- The user is logged in before any test that requires authentication (unless the TC is testing an unauthenticated flow).
- The test user's collection is empty at the start of each test (clean state), unless the TC explicitly requires existing data.

---

## CREATE

---

### TC01: Register a new user account

**Steps:**

1. Navigate to `https://demoqa.com/register`.
2. Assert the "Register to Book Store" form is visible with fields: First Name, Last Name, Username, Password, and the CAPTCHA widget.
3. Enter a valid first name (e.g., `John`).
4. Enter a valid last name (e.g., `Doe`).
5. Enter a unique username (e.g., `johndoe_auto01`).
6. Enter a valid password that meets the strength requirements (e.g., `Test@12345!`).
7. Complete the CAPTCHA verification manually or via automation workaround.
8. Click the **Register** button.
9. Assert a success alert with the text `"User Register Successfully."` appears.
10. Dismiss the alert.
11. Assert the page redirects to `https://demoqa.com/login`.

---

### TC02: Add a book to the user's collection

| Field | Value |
|---|---|
| Requirement / AC | TBD: REQ-ID · "A logged-in user can add a catalog book to their collection" |
| Objective | Verify an authenticated user can add a book from its detail page and see it in the profile collection. |
| Priority | High |
| Suite | smoke |
| Type | positive |
| Tags | `@mutates-data` |
| Automation | Automatable |

**Preconditions**

| # | State | Provisioned by | Scope |
|---|---|---|---|
| P1 | User's collection is empty (verified) | fixture `cleanBookshelf` (API, via `AccountController` + `BookController`) | test |
| P2 | User is not logged in | fresh browser context (no stored session) | test |

**Test data**

| Item | Value or generation rule | Class | Source |
|---|---|---|---|
| credentials | `username` / `password` of the demoqa test account | Secret | env (`DEMOQA_USER_*` via `@data/auth.data` → `demoqaUser`) |
| book | first entry of the catalog | Reference | discovery (`BookController.getAll()[0]`) |
| {bookTitle} | title of `book`, captured at step 5 | Reference | discovery |
| addedMessage | `Book added to your collection.` | Reference | dataset (`bookAlerts.added`) |

**Steps**

| # | Action | Expected result (oracle) |
|---|---|---|
| 1 | Open `/books` | Catalog first row title = `{bookTitle}` |
| 2 | Click **Login** | URL path = `/login` |
| 3 | Log in with `credentials` | URL path = `/profile`; username label = `credentials.username` |
| 4 | Open `/books` | Catalog first row title = `{bookTitle}` |
| 5 | Click the title of the first row | URL contains `?book=<book.isbn>`; **Title** field = `{bookTitle}` |
| 6 | Click **Add To Your Collection** | Browser alert text = `addedMessage` |
| 7 | Accept the alert | Alert closes; **Add To Your Collection** button remains visible |
| 8 | Open `/profile` | Books table has exactly 1 row; its title = `{bookTitle}` |

**Postconditions**

| State after the test | Cleanup | Scope |
|---|---|---|
| User's collection is empty | `cleanBookshelf` empties it after the test via API and verifies 0 books | only the account's collection; no other data created |

**Risks / notes** — Shared demoqa account: do not run concurrently with other runs using the same account (spec-quality-lifecycle-standard R12). Flagged: a UI login invalidates API tokens; `cleanBookshelf` re-authenticates.

**Change log**
- Q1 — metadata table added; requirement ID unknown → `TBD`.
- Q2 — objective stated.
- Q3 — P1/P2 provisioned (`cleanBookshelf`, fresh context) with scope.
- Q4 — "e.g. Git Pocket Guide" and "correct credentials" moved to the data table (discovery / env secret).
- Q5 — one action per step with its own oracle.
- Q6/Q7 — "at least one" / "non-empty" replaced with exact values (`{bookTitle}`, alert text, row count 1).
- Q8 — oracle references exist: discovery via `BookController`, `bookAlerts.added`.
- Q9 — postconditions and scoped cleanup added.
- Q11 — absolute URLs replaced with relative paths.
- Q12 — automation decision stated.
- Q13 — corrupted `**Steps:ate to…` header repaired; "title added in step 3" replaced with `{bookTitle}`.

---

## READ

---

### TC03: Browse all available books in the catalog

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Assert the page header `"Book Store"` is visible.
3. Assert the search input field is visible and empty.
4. Assert the books list is rendered with at least one book row.
5. For the first book row, assert all of the following are visible and non-empty:
   - Book cover image.
   - Book title link.
   - Author name.
   - Publisher name.
6. Assert the total number of displayed book rows is greater than zero.

---

### TC04: Search for a book by title

**Prerequisite:** Book Store catalog page is open.

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Assert the search input is visible.
3. Type `Git` in the search input field.
4. Assert the book list updates to show only books whose title or author contains `"Git"`.
5. Assert no books unrelated to the search term are shown.
6. Clear the search input field (delete all text).
7. Assert the full catalog is restored and shows all books.

---

### TC05: View a book's detail page

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Click on the title of any book in the catalog.
3. Assert the URL changes to `https://demoqa.com/books?book=<isbn>`.
4. Assert the following fields are visible and non-empty on the detail page:
   - Book cover image.
   - **Title**.
   - **Sub Title**.
   - **Author**.
   - **Publisher**.
   - **Total Pages** (numeric value > 0).
   - **Website** (clickable link).
   - **ISBN**.
5. Assert the **"Add To Your Collection"** button (or a login prompt for unauthenticated users) is present.
6. Assert the **"Back To Book Store"** link is visible.
7. Click **"Back To Book Store"**.
8. Assert the catalog page (`https://demoqa.com/books`) is displayed again.

---

### TC06: View the user's book collection in the profile

**Prerequisite:** User is logged in and has at least one book in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the profile page is displayed.
3. Assert the **UserName** label and the logged-in username value are visible.
4. Assert the **User ID** label and a non-empty UUID value are visible.
5. Assert the books table is present and contains the expected columns: image, title, author, publisher, action.
6. Assert at least one book row is visible in the table.
7. For the first book row, assert title, author, and publisher cells are non-empty.
8. Assert the **"Delete Account"** button is visible.

---

## UPDATE

> **Note:** The demoqa Book Store UI does not provide an "edit book" form. The Update scenario is modelled as replacing a book in the collection: deleting an existing entry and adding a different one, resulting in a net-zero collection size change.

---

### TC07: Replace a book in the user's collection

| Field | Value |
|---|---|
| Requirement / AC | BOOKS-14 · "A user can replace a book in their collection (delete the existing one, add a different one)" |
| Objective | Verify deleting the only book and adding a different one leaves the collection with exactly the new book, so no stale entry survives a replacement. |
| Priority | Medium |
| Suite | regression |
| Type | positive |
| Tags | `@mutates-data` |
| Automation | Automatable |

**Preconditions**

| # | State | Provisioned by | Scope |
|---|---|---|---|
| P1 | A demoqa account unique to this worker exists | fixture `workerUser` (API `AccountController.createUser`, deleted when the worker ends) | worker |
| P2 | Collection of that account holds exactly 1 book (Book A = first catalog entry) | fixture `createdBook` (API, depends on `cleanBookshelf`) | test |
| P3 | User is not logged in | fresh browser context | test |

**Test data**

| Item | Value or generation rule | Class | Source |
|---|---|---|---|
| credentials | `username` = `qa_user_` + `parallelIndex` + timestamp + random suffix; `password` = generated policy-compliant value (upper, lower, digit, special, 8+ chars); never written in the doc | Transactional | factory `buildWorkerUser(parallelIndex)` via fixture `workerUser` |
| {bookA} | title of the seeded book = first catalog entry | Reference | `createdBook.title` (API discovery: `BookController.getAll()[0]`) |
| {bookB} | title of the first catalog entry whose title ≠ `{bookA}` (second entry) | Reference | API discovery: `BookController.getAll()` (not read from the UI) |
| collectionSize | `1` | Reference | dataset (`singleBookCollection.size`) |
| deletedMessage | `Book deleted.` | Reference | dataset (`bookAlerts.deleted`) |
| addedMessage | `Book added to your collection.` | Reference | dataset (`bookAlerts.added`) |
| siteUrl | demoqa base URL | Environment | `Env.demoqaUrl` (`DEMOQA_URL`; no default outside `local`) |

**Steps**

| # | Action | Expected result (oracle) |
|---|---|---|
| 1 | Open `/login` | Username input is visible |
| 2 | Log in with `{credentials}` | URL path = `/profile` |
| 3 | Open `/profile` | Username value = `{credentials.username}` |
| 4 | Read the books table | Exactly `collectionSize` (1) row; its title = `{bookA}` |
| 5 | Click the delete icon for `{bookA}` | Confirmation dialog is shown with an **OK** button |
| 6 | Click **OK** | Alert text = `deletedMessage`; dialog is closed |
| 7 | Read the books table | `{bookA}` row count = 0; total rows = 0 |
| 8 | Open `/books` | Catalog lists `{bookB}` |
| 9 | Click the title `{bookB}` | URL contains `?book=` of `{bookB}`; detail **Title** = `{bookB}` |
| 10 | Click **Add To Your Collection** | Alert text = `addedMessage` |
| 11 | Open `/profile` | `{bookB}` row is present; `{bookA}` row count = 0; total rows = `collectionSize` (1) |

**Postconditions**

| State after the test | Cleanup | Scope |
|---|---|---|
| Worker account's collection is empty | `createdBook` teardown + `cleanBookshelf` empty it via API (idempotent; verified 0 books); the account itself is deleted by `workerUser` when the worker ends | only the worker's own account |

**Risks / notes** — Parallel-safe: every worker owns its account (`workerUser`), so no other run touches this collection. Requires the catalog to hold ≥ 2 books in a stable order; `{bookB}` is derived from API discovery, not hardcoded. Spec lives in `test/ui/regression/…` (suite = regression). Spec follow-up (not done here): derive `{bookB}` from `BookController.getAll()` instead of the UI list, and align `test.step()` labels with the 11 steps above.

**Change log**
- Q1 — metadata table added; requirement ID unknown → `TBD`.
- Q2 — objective stated.
- Q3/Q10 — "user is logged in, has exactly one book" provisioned by `createdBook`/fresh context with scope; no reliance on other TCs.
- Q4/Q8 — `Book A`/`Book B` defined as data items with a source; credentials as env secret; messages from `bookAlerts`.
- Q5/Q6 — assert-only steps merged into action→oracle rows with exact values and counts.
- Q9 — postconditions and scoped cleanup added.
- Q11 — absolute URLs replaced with relative paths.
- Q12 — automation decision stated.
- Q13 — login step (present in the spec, missing in the doc) added; steps renumbered 1–9.
- Q1 — requirement ID set to BOOKS-14 (was `TBD`).
- M2 Q4 — `credentials` reclassified Secret → Transactional, source `buildWorkerUser` via `workerUser` (the shared `bookStoreUsers.appUser` no longer exists); `siteUrl` added as Environment item; `{bookB}` source set to API discovery.
- M2 Q10 — "shared account, must not run concurrently" removed; P1 added (per-worker account); postcondition scope narrowed to the worker's own account.
- M2 Q5 — steps 1 and 7 (open + act) split; steps renumbered 1–11.

**Automation handoff (M4)**

```yaml
tc: TC07
title: Replace a book in the user's collection
requirement: BOOKS-14
suite: regression
tags: ['@mutates-data']
automation: automatable
fixtures:
  identity: workerUser               # per-worker account (spec-data-standard R1)
  state: cleanBookshelf              # precondition + postcondition owner (api-setup-teardown-standard)
  seed: createdBook                  # exactly 1 book, seeded via API, torn down after the test
data:
  - name: credentials
    class: transactional
    source: factory                  # buildWorkerUser(parallelIndex) via workerUser; generated, never inline
  - name: siteUrl
    class: environment
    source: env                      # Env.demoqaUrl
  - name: collectionSize
    class: reference
    source: '@data/sites/demoqa/books.data'   # singleBookCollection.size
  - name: bookA
    class: reference
    source: discovery                # createdBook.title (BookController.getAll()[0])
  - name: bookB
    class: reference
    source: discovery                # BookController.getAll(): first title != bookA
  - name: deletedMessage
    class: reference
    source: '@data/sites/demoqa/books.data'   # bookAlerts.deleted
  - name: addedMessage
    class: reference
    source: '@data/sites/demoqa/books.data'   # bookAlerts.added
captured: [bookA, bookB]
steps:
  - action: open /login
    oracle: username input visible
  - action: log in with credentials
    oracle: URL path = /profile
  - action: open /profile
    oracle: username value = credentials.username
  - action: read books table
    oracle: exactly collectionSize (1) row, title = {bookA}
  - action: click delete icon for {bookA}
    oracle: confirmation dialog shown with OK button
  - action: click OK
    oracle: alert text = deletedMessage; dialog closed
  - action: read books table
    oracle: "{bookA} row count = 0; total rows = 0"
  - action: open /books
    oracle: catalog lists {bookB}
  - action: click title {bookB}
    oracle: URL contains ?book= of {bookB}; detail Title = {bookB}
  - action: click Add To Your Collection
    oracle: alert text = addedMessage
  - action: open /profile
    oracle: "{bookB} row present; {bookA} row count = 0; total rows = 1"
postconditions:
  - worker account's collection empty (createdBook teardown + cleanBookshelf, via API)
  - only the worker's own account is touched
```

---

## DELETE

---

### TC08: Delete a specific book from the user's collection

| Field | Value |
|---|---|
| Requirement / AC | BOOKS-12 · "A user can delete a specific book from their collection without affecting the other books" |
| Objective | Verify deleting one book removes only that book and leaves every other book in the collection intact, so a targeted delete never causes collateral data loss. |
| Priority | High |
| Suite | regression |
| Type | positive |
| Tags | `@mutates-data` |
| Automation | Automatable |

**Preconditions**

| # | State | Provisioned by | Scope |
|---|---|---|---|
| P1 | A demoqa account unique to this worker exists | fixture `workerUser` (API `AccountController.createUser`, deleted when the worker ends) | worker |
| P2 | Collection of that account holds exactly `collectionSize` (2) books: `{bookA}` and `{bookB}` | fixture `createdBooks` (API, depends on `cleanBookshelf`) | test |
| P3 | User is not logged in | fresh browser context | test |

**Test data**

| Item | Value or generation rule | Class | Source |
|---|---|---|---|
| credentials | `username` = `qa_user_` + `parallelIndex` + timestamp + random suffix; `password` = generated policy-compliant value (upper, lower, digit, special, 8+ chars); never written in the doc | Transactional | factory `buildWorkerUser(parallelIndex)` via fixture `workerUser` |
| collectionSize | `2` | Reference | dataset (`seededCollection.size`) |
| {bookA} | title of the first seeded book | Reference | `createdBooks[0].title` (API discovery: `BookController.getAll()[0]`) |
| {bookB} | title of the second seeded book | Reference | `createdBooks[1].title` (API discovery: `BookController.getAll()[1]`) |
| deletedMessage | `Book deleted.` | Reference | dataset (`bookAlerts.deleted`) |
| siteUrl | demoqa base URL | Environment | `Env.demoqaUrl` (`DEMOQA_URL`; no default outside `local`) |

**Steps**

| # | Action | Expected result (oracle) |
|---|---|---|
| 1 | Open `/login` | Username input is visible |
| 2 | Log in with `{credentials}` | URL path = `/profile` |
| 3 | Open `/profile` | Books table has exactly `collectionSize` (2) rows |
| 4 | Read the titles in the books table | Row count for `{bookA}` = 1 and for `{bookB}` = 1 (row order is not asserted) |
| 5 | Click the delete icon in the Action column of the `{bookA}` row | Confirmation dialog is shown with an **OK** and a **Cancel** button |
| 6 | Click **OK** | Alert text = `deletedMessage`; dialog is closed |
| 7 | Read the books table | `{bookA}` row count = 0; total rows = 1; the remaining row title = `{bookB}` |

**Postconditions**

| State after the test | Cleanup | Scope |
|---|---|---|
| Worker account's collection is empty | `createdBooks` teardown + `cleanBookshelf` empty it via API (idempotent; verified 0 books); the account itself is deleted by `workerUser` when the worker ends | only the worker's own account |

**Risks / notes** — Parallel-safe: every worker owns its account (`workerUser`). Seed size is fixed by `seededCollection.size`. Oracles come from the seeded books, never from values read back from the UI. Spec follow-up (not done here): use `createdBooks[0].title` / `createdBooks[1].title` instead of reading titles from the table (the spec currently does `void createdBooks`), drop the row-order assumption, and align `test.step()` labels with the 7 steps above.

**Change log**
- Q1 — metadata table added; requirement ID unknown → `TBD`.
- Q2 — objective stated.
- Q3/Q10 — "logged in, at least two books" provisioned by `createdBooks` / fresh context with scope; no reliance on other TCs or leftover state.
- Q4/Q8 — credentials as env secret; `{bookA}`/`{bookB}` captured from the seeded collection; message from dataset; "unchanged" replaced by the known `{bookB}` reference.
- Q5 — assert-only steps merged into action → oracle rows.
- Q6/Q7 — "at least two" → exactly 2; "unchanged" → remaining row = `{bookB}`.
- Q9 — postconditions and scoped cleanup added.
- Q11 — absolute URL replaced with relative paths.
- Q12 — automation decision stated.
- Q13 — login step (present in the spec, missing in the doc) added; steps renumbered 1–6.
- Q1 — requirement ID set to BOOKS-12 (was `TBD`).
- M2 Q4 — `credentials` reclassified Secret → Transactional, source `buildWorkerUser` via `workerUser` (the shared `bookStoreUsers.appUser` no longer exists); `siteUrl` added; `deletedMessage` source unified to `bookAlerts.deleted`.
- M2 Q6/Q8 — `{bookA}`/`{bookB}` now come from `createdBooks[0]`/`[1]` instead of the UI table; step 4 asserts both titles by exact row count instead of "non-empty and different"; row order no longer assumed.
- M2 Q10 — "shared account, must not run concurrently" removed; P1 added (per-worker account); postcondition scope narrowed to the worker's own account.
- M2 Q5 — step 1 (open + log in) split; steps renumbered 1–7.

**Automation handoff (M4)**

```yaml
tc: TC08
title: Delete a specific book from the user's collection
requirement: BOOKS-12
suite: regression
tags: ['@mutates-data']
automation: automatable
fixtures:
  identity: workerUser               # per-worker account (spec-data-standard R1)
  state: cleanBookshelf              # precondition + postcondition owner (api-setup-teardown-standard)
  seed: createdBooks                 # exactly seededCollection.size (2) books, seeded via API, torn down after
data:
  - name: credentials
    class: transactional
    source: factory                  # buildWorkerUser(parallelIndex) via workerUser; generated, never inline
  - name: siteUrl
    class: environment
    source: env                      # Env.demoqaUrl
  - name: collectionSize
    class: reference
    source: '@data/sites/demoqa/books.data'   # seededCollection.size
  - name: bookA
    class: reference
    source: discovery                # createdBooks[0].title
  - name: bookB
    class: reference
    source: discovery                # createdBooks[1].title
  - name: deletedMessage
    class: reference
    source: '@data/sites/demoqa/books.data'   # bookAlerts.deleted
captured: [bookA, bookB]
steps:
  - action: open /login
    oracle: username input visible
  - action: log in with credentials
    oracle: URL path = /profile
  - action: open /profile
    oracle: books table has exactly collectionSize (2) rows
  - action: read titles in books table
    oracle: "row count for {bookA} = 1 and for {bookB} = 1 (order not asserted)"
  - action: click delete icon in the {bookA} row
    oracle: confirmation dialog shown with OK and Cancel buttons
  - action: click OK
    oracle: alert text = deletedMessage; dialog closed
  - action: read books table
    oracle: "{bookA} row count = 0; total rows = 1; remaining row title = {bookB}"
postconditions:
  - worker account's collection empty (createdBooks teardown + cleanBookshelf, via API)
  - only the worker's own account is touched
```

---

### TC09: Delete all books from the user's collection

**Prerequisite:** User is logged in and has at least two books in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the books table contains at least two book rows.
3. Assert the **"Delete All Books"** button is visible and enabled.
4. Click **"Delete All Books"**.
5. Assert a confirmation dialog appears.
6. Click **OK** to confirm.
7. Assert the dialog closes.
8. Assert the books table is now empty (zero book rows visible).
9. Navigate away from the profile page (e.g., to `https://demoqa.com/books`).
10. Navigate back to `https://demoqa.com/profile`.
11. Assert the books table remains empty after the page reload.
12. Assert the **"Delete All Books"** button is no longer visible or is disabled when the collection is empty.

---

### TC10: Delete the user account

**Prerequisite:** User is logged in.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the profile page is displayed with the correct username.
3. Assert the **"Delete Account"** button is visible and enabled.
4. Click **"Delete Account"**.
5. Assert a confirmation dialog appears asking to confirm account deletion.
6. Click **OK** to confirm.
7. Assert the dialog closes.
8. Assert the user is logged out and redirected to the login page (`https://demoqa.com/login`).
9. Attempt to log in using the deleted account's credentials.
10. Assert a login error message is displayed (e.g., `"Invalid username or password!"`).
11. Assert the user is **not** redirected to the profile or any authenticated page.
