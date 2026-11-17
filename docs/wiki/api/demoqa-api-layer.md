# API Layer — `src/api/`

> Path alias: `@api/*` → `src/api/*`
> Rules that govern it: `api-setup-teardown-standard` **R1–R10** (layer structure, teardown contract) and `spec-quality-lifecycle-standard` **R2** (postcondition), **R11** (teardown verified), **R12** (shared account). See [skill notes](../../retros/notes_lifecycle-architect-skill-prompt.md).
> Last verified against the code: 2026-11-15.

The API layer exists for **test setup and teardown only**. Specs never call it directly; fixtures do (`api-setup-teardown-standard` R7).

---

## Structure

```
src/api/
  client/
    ApiClient.ts                      ← only HTTP entry point (shared by all sites)
  sites/demoqa/
    endpoints/
      account.endpoints.ts            ← AccountEndpoints (login, user)
      books.endpoints.ts              ← BooksEndpoints (base, book)
    models/
      account.model.ts                ← LoginPayload, LoginResponse, UserAccount
      book.model.ts                   ← Book, BooksResponse, AddBooksPayload, DeleteBookPayload
    controllers/
      AccountController.ts            ← authenticate, getUser
      BookController.ts               ← getAll, addToCollection, deleteOne, deleteAll
```

| Layer | Responsibility | May depend on |
|---|---|---|
| `ApiClient` | Wraps `APIRequestContext`: base URL, bearer header, status check, JSON parsing | nothing in `src/api/` |
| `endpoints` | URL constants only | nothing |
| `models` | Interfaces only | nothing (`account.model` imports `Book`) |
| `controllers` | Business operations | `ApiClient`, `endpoints`, `models` |

Only `ApiClient` calls `request.get/post/delete`. Controllers receive an `ApiClient`, never an `APIRequestContext`.

---

## `ApiClient` (`src/api/client/ApiClient.ts`)

`new ApiClient(request, Env.demoqaUrl)` — the second argument is prepended to every URL.

| Member | Description |
|---|---|
| `setAuthToken(token)` | Stores the token; sent as `Authorization: Bearer <token>` on later calls |
| `get<T>(url, options?)` | GET, returns parsed JSON; `options.params` for query strings |
| `post<T>(url, data)` | POST, returns parsed JSON |
| `delete(url, options?)` | DELETE with optional `data` / `params`; returns nothing |

Every method throws on a non-2xx response: `<METHOD> <url> failed — status <code>: <body>` (R10), so a silent `401` or `404` can never look like a successful setup or teardown.

---

## Controllers

### `AccountController`

| Method | Endpoint | Description |
|---|---|---|
| `authenticate(username, password)` | `POST /Account/v1/Login` | Logs in, sets the token on the client, returns `userId` |
| `getUser(userId)` | `GET /Account/v1/User/{userId}` | Returns `UserAccount` (includes `books`) |

### `BookController`

| Method | Endpoint | Description |
|---|---|---|
| `getAll()` | `GET /BookStore/v1/Books` | Returns the catalog as `Book[]` |
| `addToCollection(userId, isbns)` | `POST /BookStore/v1/Books` | Adds books to the user's collection |
| `deleteOne(userId, isbn)` | `DELETE /BookStore/v1/Book` | Removes one book from the collection |
| `deleteAll(userId)` | `DELETE /BookStore/v1/Books?UserId=` | Empties the user's collection |

`addToCollection`, `deleteOne` and `getAll` are not used by any fixture yet. Write operations need an authenticated client (call `AccountController.authenticate` first).

---

## Fixture: `cleanBookshelf` (`src/fixtures/sites/demoqa.fixtures.ts`)

The fixture builds the client and controllers, then defines one `emptyCollection()` helper:

```
repeat up to 3 times:
  account.authenticate()          → fresh userId + token every attempt
  books.deleteAll(userId)         → DELETE /BookStore/v1/Books
  account.getUser(userId)         → read the collection back
  if 0 books: return              ✅
throw "cleanBookshelf could not empty the collection after 3 attempts (books left: N)"
```

```typescript
await emptyCollection();   // before — removes leftovers from a previous failed run
await use();
await emptyCollection();   // after  — removes what the test added (also runs if the test fails)
```

- **Why verify (R11):** a `204` from the delete call did not guarantee an empty collection — a book stayed in the user's profile after a run. Reading it back is the only proof. If it still isn't empty, the fixture throws instead of leaving dirty data silently.
- **Why log in again every time (R9):** demoqa keeps a single active token per user. The UI login done by the test invalidates the token captured at setup, so teardown would get `401 User not authorized!`. Authenticating inside `emptyCollection()` guarantees a fresh token.
- Credentials come from `demoqaUser` (`@data/sites/demoqa/auth.data`), which reads `DEMOQA_USER` / `DEMOQA_PASSWORD` from `.env`. The base URL comes from `Env.demoqaUrl` (`DEMOQA_URL`). Never hardcode either.
- A spec requests the fixture as a parameter and marks it used: `void cleanBookshelf;` (see TC02).

---

## Known limitations

| Limitation | Effect | Mitigation |
|---|---|---|
| **One shared demoqa account** for all browser projects | Parallel runs log in and clear the same account, invalidating each other's session (`User not authorized!`) and leaving data | TC02 runs on chromium only (`test.skip` for other browsers). Long term: one account per browser (`DEMOQA_USER_<BROWSER>`) — R12 |
| Node must trust the corporate proxy certificate | API calls fail with `unable to get local issuer certificate` | `process.env.NODE_USE_SYSTEM_CA ??= '1'` in `playwright.config.ts`; never `ignoreHTTPSErrors`. See [certificate notes](../../retros/notes_fixCertificate.md) |
| demoqa is a shared public demo site | Occasional slowness / flakiness outside our control | Verified cleanup (R11); keep specs independent |
| Retry + verify logic lives in the fixture, not a controller | Another fixture needing the same clean would duplicate it | Move it into a `BookController` method if a second fixture needs it |

---

## Used by

- Fixture: `src/fixtures/sites/demoqa.fixtures.ts` (`cleanBookshelf`)
- Spec: `test/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts`
- Test cases: [Book Store CRUD (UI)](../../test-cases/demoqa/book-store-crud-test-cases.md) · [Book Store CRUD (API)](../../test-cases/demoqa/book-store-api-crud-test-cases.md)

## Keep this page in sync

Update it in the same change whenever `src/api/` changes (new endpoint, controller method, model or site). The trigger map is in [living-docs-prompt](../../skills/living-docs-prompt.md).
