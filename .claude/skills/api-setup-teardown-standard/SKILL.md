---
name: api-setup-teardown-standard
description: Enforce and scaffold the API layer infrastructure for Playwright + TypeScript projects. Governs the structure of ApiClient, endpoints, models, controllers and mocks under src/api/, and how fixtures consume them for setup and teardown. Two modes - New (scaffold the API layer for a first resource) and Add (extend an existing API layer with a new resource). Load when implementing API-based setup, teardown or route mocking for any test case, or when the user says "setup api layer", "scaffold api", "new controller" or "lifecycle add".
---

# api-setup-teardown-standard

Owns the **API layer structure and lifecycle infrastructure**: how setup and teardown are implemented through the API so tests are deterministic, parallel-safe and portable. Detects violations, auto-applies safe fixes and scaffolds new API resources.

## Domain boundary

| Concern | Owner |
|---|---|
| Page Object structure | `pom-architect` |
| Spec imports, fixture registration, credentials, framework | `test-standards` |
| Spec folder / file naming, TC IDs, `test.step()` | `spec-standards` |
| Pre/postcondition assertions, "clean is verified", shared-account runs | `spec-quality-lifecycle-standard` |
| Git workflow | `git-standards` |
| **`src/api/` architecture · teardown contract · fixture naming · no lifecycle objects in specs** | **this skill** |

Do not re-report what another skill owns. Import-alias hygiene in fixtures is `test-standards`; whether a teardown fixture also *verifies* the clean is `spec-quality-lifecycle-standard` R11; this skill only checks that the teardown exists, is paired, and is built from the layered API classes.

## Project context

The repo is split per site. Shared pieces: `ApiClient` and `src/config`. Everything else is under `sites/<site>/`.

```
src/api/
  client/ApiClient.ts                     only HTTP entry point (shared by all sites)
  sites/<site>/
    endpoints/<resource>.endpoints.ts     URL constants and path builders
    models/<resource>.model.ts            request / response interfaces
    controllers/<Resource>Controller.ts   business operations
    mocks/<resource>.mock.ts              page.route() stub factories
src/fixtures/sites/<site>.fixtures.ts     wire controllers into fixtures (setup + teardown)
```

- Alias `@api/*` → `src/api/*`; imports are always via aliases, never relative.
- `ApiClient` is the only class allowed to call `request.get/post/put/patch/delete`.
- Controllers receive `ApiClient`, never `APIRequestContext`.
- Endpoints are URL-only (no HTTP logic, no imports from `client/`); models are interfaces only.
- Mocks use `page.route()` with endpoint constants, never hardcoded URLs.
- Fixtures wire controllers; they do not call `ApiClient` methods directly.
- Specs receive controllers and data as **fixture parameters**; they never instantiate them and never create/delete through the API themselves (they may read and assert on injected data).
- `{testRoot}` is `testDir` in `playwright.config.ts`; read it from there.
- Bounded polling (`ui-locator-wait-standard` R17–R18) needs state reads: controllers expose `get<Resource>Status` and `models/` declares the state union (including terminal failure states). Add them when a resource has asynchronous state.

**demoqa reference:** the layer is `ApiClient` + `AccountController` + `BookController` with endpoints and models. The retry + verify-empty behaviour lives in the `cleanBookshelf` fixture.

### Fixture injection decision table

| Need | Fixture type | Name pattern | Provides |
|---|---|---|---|
| Read / verify existing data | Controller fixture | `<resource>Controller` | the controller |
| Create data, assert, clean up | Data fixture with teardown | `created<Resource>` | the created resource |
| Verify clean state before + clean after | Setup + teardown fixture | `clean<Resource>` | controller or `void` |
| Stub a route for this test | Mock fixture / mock factory | `mock<Resource>` | registered stub |

## Layer responsibilities

| Layer | Responsibility | May depend on |
|---|---|---|
| `client/ApiClient.ts` | wrap `APIRequestContext`; base URL, auth header, status check, parsing | nothing in `src/api/` |
| `endpoints` | URL constants / path builders | nothing |
| `models` | interfaces | nothing |
| `controllers` | business operations | `ApiClient` · `endpoints` · `models` |
| `mocks` | route stub factories | `endpoints` · `models` |

## Modes

### Mode: New — scaffold the API layer

**Triggers:** "setup api layer" · "scaffold api" · "new api resource" · "create controller" · "lifecycle new"
**Use when:** `src/api/client/ApiClient.ts` does not exist yet.

**Step 0 — Parameters** (infer; ask only for what is missing): `site` (e.g. `demoqa`) · `resourceName` (PascalCase singular) · `baseUrl` (API base path) · `operations` (`get` `create` `delete` `update`) · `needsMock` (bool).

1. **`ApiClient`** — `src/api/client/ApiClient.ts`: constructor `(request: APIRequestContext, baseUrl?: string)`; `setAuthToken(token)`; private `buildHeaders()`; only the HTTP methods the operations need; every method checks `response.ok()` and throws (R10).
2. **Endpoints** — `src/api/sites/<site>/endpoints/<resource>.endpoints.ts`: `export const <Resource>Endpoints = { base: '...', byId: (id: string) => ... } as const` (`byId` only if delete/update).
3. **Models** — `.../models/<resource>.model.ts`: interface `<Resource>` plus `<Action><Resource>Payload` per request.
4. **Controller** — `.../controllers/<Resource>Controller.ts`: constructor takes `ApiClient` only; one method per operation.
5. **Mock** (only if `needsMock`) — `.../mocks/<resource>.mock.ts`: one factory per stub, `(page: Page, payload)`, URL from endpoint constants.
6. **Fixtures** — edit `src/fixtures/sites/<site>.fixtures.ts`: a controller fixture for reads and a `created<Resource>` / `clean<Resource>` fixture with teardown when create/delete exist. Then run `test-standards` on that file and assert zero violations.

```
[api-setup-teardown-standard] SCAFFOLD COMPLETE — New
─────────────────────────────────────────────
Created:  src/api/client/ApiClient.ts
Created:  src/api/sites/<site>/endpoints/<resource>.endpoints.ts
Created:  src/api/sites/<site>/models/<resource>.model.ts
Created:  src/api/sites/<site>/controllers/<Resource>Controller.ts
Created:  src/api/sites/<site>/mocks/<resource>.mock.ts      (if needsMock)
Updated:  src/fixtures/sites/<site>.fixtures.ts
```

### Mode: Add — extend the API layer

**Triggers:** "add api support" · "extend api" · "new controller for" · "lifecycle add"
**Use when:** `ApiClient` exists and a site/resource needs API support.

0. Confirm `ApiClient.ts` exists and passes R1 and R10; auto-fix first if not.
1. Collect parameters (as New, Step 0).
2. Run New steps 2–6 (skip step 1; add `ApiClient` methods only if an operation needs one that is missing). A new site also needs its fixture file added to the `mergeTests(...)` call in `src/fixtures/index.ts`.
3. Run R1–R6 and R10 on all of `src/api/`; auto-fix what the new files introduced; list manual items.

Output: same block as New with `— Add` and without the `ApiClient` line.

## Rules

Severity: ERROR must be fixed · WARNING should be fixed.

### R1 — API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT (ERROR, AUTO-FIX)
**Condition:** a file other than `src/api/client/ApiClient.ts` calls `request.get/post/put/patch/delete` directly.
**Fix:** replace with the `ApiClient` equivalent; add the method to `ApiClient` if missing.
```typescript
// before                                              // after
const r = await this.request.get(BooksEndpoints.base); return this.client.get<Book[]>(BooksEndpoints.base);
return r.json();
```

### R2 — ENDPOINTS_CENTRALIZED (ERROR, AUTO-FIX)
**Condition:** a hardcoded URL (`'/api/...'`, `http(s)://...`, or `Env.*Url` concatenation) in a controller, fixture or mock.
**Fix:** use the endpoint constant; create the endpoints file if none exists.
```typescript
return this.client.get<Book[]>('/BookStore/v1/Books');   // ✗
return this.client.get<Book[]>(BooksEndpoints.base);     // ✓
```

### R3 — CONTROLLER_DEPENDENCY_CONTRACT (ERROR, AUTO-FIX)
**Condition:** a controller constructor parameter is typed `APIRequestContext` instead of `ApiClient`.
**Fix:** retype to `ApiClient` and update usages.

### R4 — TEARDOWN_MIRRORS_SETUP (ERROR, MANUAL-FIX)
**Condition:** a fixture in `src/fixtures/**` calls a create/post controller method before `use()` and has no delete/cleanup call after `use()`. Applies equally to `{ scope: 'worker' }` fixtures (`spec-data-standard` M1).
**Why manual:** the cleanup needs the identifier returned by the create call; guessing risks wrong deletes.
```typescript
createdBook: async ({ request }, use) => {
  const controller = new BookController(new ApiClient(request));
  const book = await controller.create(payload);
  await use(book);
  await controller.delete(book.bookId);   // teardown — required
},
```

### R5 — MOCKS_USE_CENTRALIZED_ENDPOINTS (ERROR, AUTO-FIX)
**Condition:** `page.route()` receives a hardcoded URL instead of an endpoint constant.
**Fix:** ``page.route(`**${BooksEndpoints.base}`, ...)``.

### R6 — CORRECT_FOLDER_PLACEMENT (ERROR, AUTO-FIX)
**Condition:** an API file is outside its folder.

| File type | Required folder |
|---|---|
| HTTP client | `src/api/client/` |
| URL constants | `src/api/sites/<site>/endpoints/` |
| Interfaces | `src/api/sites/<site>/models/` |
| Business operations | `src/api/sites/<site>/controllers/` |
| Route stubs | `src/api/sites/<site>/mocks/` |

**Fix:** move the file and update all imports.

### R7 — NO_LIFECYCLE_INSTANTIATION_IN_SPEC (ERROR, AUTO-FIX)
**Condition:** a spec (`{testRoot}/**/*.spec.ts`) instantiates `ApiClient` or a controller, or calls `request.*`, inside `test()` or a hook.
**Why:** it couples the test to infrastructure and bypasses fixture teardown.
**Fix:** move the instantiation and setup call into a fixture in `src/fixtures/sites/<site>.fixtures.ts` (reuse an existing one if it matches), then inject it in the `test()` signature.
```typescript
test('TC10: …', async ({ page, request }) => { const c = new BookController(new ApiClient(request)); … });  // ✗
test('TC10: …', async ({ page, createdBook }) => { … });                                                    // ✓
```

### R8 — LIFECYCLE_FIXTURE_NAMING_CONVENTION (WARNING, AUTO-FIX)
**Condition:** a lifecycle fixture does not follow the pattern in the decision table (`<resource>Controller`, `created<Resource>`, `clean<Resource>`, `mock<Resource>`; `worker<Resource>` for worker-scoped identities per `spec-data-standard`).
**Fix:** rename the key and every spec reference.

### R9 — TOKEN_REFRESH_IN_TEARDOWN (WARNING, MANUAL-FIX)
**Condition:** a fixture generates an API token before `use()` **and** its specs perform a UI login (a `login()` PO call) — but teardown API calls do not regenerate the token first.
**Why:** identity providers with a single-active-token policy (e.g. demoqa) invalidate the setup token on UI login; teardown then gets `401`.
**Why manual:** deciding which teardown call needs the fresh token needs judgement.
```typescript
cleanBookshelf: async ({ request }, use) => {
  const client = new ApiClient(request);
  const account = new AccountController(client);
  client.setAuthToken(await account.generateToken(user.username, user.password));   // setup token
  const books = new BookController(client);
  await books.deleteAll(user.id);                                                    // pre-test clean
  await use(books);                                                                  // UI login happens → token invalid
  client.setAuthToken(await account.generateToken(user.username, user.password));   // MUST refresh
  await books.deleteAll(user.id);
},
```

### R10 — API_CLIENT_STATUS_CHECKED (ERROR, AUTO-FIX)
**Condition:** an `ApiClient` method (`get`, `post`, `put`, `patch`, `delete`) does not check `response.ok()` and throw on non-2xx.
**Why:** a silent `401`/`404` lets the fixture continue as if setup/teardown succeeded.
**Fix:** after every response add the check below.
```typescript
if (!response.ok()) {
  const body = await response.text().catch(() => '');
  throw new Error(`DELETE ${url} failed — status ${response.status()}: ${body}`);
}
```

## Reference implementation

```typescript
// src/api/client/ApiClient.ts
import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  private token?: string;
  constructor(private readonly request: APIRequestContext, private readonly baseUrl = '') {}

  setAuthToken(token: string): void { this.token = token; }

  private buildHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async check(method: string, url: string, response: { ok(): boolean; status(): number; text(): Promise<string> }) {
    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`${method} ${url} failed — status ${response.status()}: ${body}`);
    }
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.request.get(this.baseUrl + url, { headers: this.buildHeaders() });
    await this.check('GET', url, response);
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await this.request.post(this.baseUrl + url, { data, headers: this.buildHeaders() });
    await this.check('POST', url, response);
    return response.json() as Promise<T>;
  }

  async delete(url: string, options?: { data?: unknown; params?: Record<string, string> }): Promise<void> {
    const response = await this.request.delete(this.baseUrl + url, { ...options, headers: this.buildHeaders() });
    await this.check('DELETE', url, response);
  }
}
```

```typescript
// src/api/sites/demoqa/endpoints/books.endpoints.ts
export const BooksEndpoints = { base: '/BookStore/v1/Books', byId: (id: string) => `/BookStore/v1/Books/${id}` } as const;

// src/api/sites/demoqa/controllers/BookController.ts
import { ApiClient } from '@api/client/ApiClient';
import { BooksEndpoints } from '@api/sites/demoqa/endpoints/books.endpoints';
import { Book, CreateBookPayload } from '@api/sites/demoqa/models/book.model';

export class BookController {
  constructor(private readonly client: ApiClient) {}
  getAll(): Promise<Book[]> { return this.client.get<Book[]>(BooksEndpoints.base); }
  create(payload: CreateBookPayload): Promise<Book> { return this.client.post<Book>(BooksEndpoints.base, payload); }
  delete(bookId: string): Promise<void> { return this.client.delete(BooksEndpoints.byId(bookId)); }
}

// src/api/sites/demoqa/mocks/book.mock.ts
import { Page } from '@playwright/test';
import { BooksEndpoints } from '@api/sites/demoqa/endpoints/books.endpoints';
import { Book } from '@api/sites/demoqa/models/book.model';

export async function mockGetBooks(page: Page, books: Book[]): Promise<void> {
  await page.route(`**${BooksEndpoints.base}`, (route) => route.fulfill({ json: books }));
}
```

Fixture wiring (`src/fixtures/sites/<site>.fixtures.ts`): create `new ApiClient(request, Env.<site>Url)` and the controller inside the fixture; setup before `use()`, teardown after.

## Scan scope

| File glob | Rules |
|---|---|
| `src/api/client/**/*.ts` | R1, R10 |
| `src/api/sites/*/controllers/**/*.ts` | R1, R2, R3, R6 |
| `src/api/sites/*/endpoints/**/*.ts` | R6 |
| `src/api/sites/*/models/**/*.ts` | R6 |
| `src/api/sites/*/mocks/**/*.ts` | R2, R5, R6 |
| `src/fixtures/sites/*.fixtures.ts` | R2, R4, R8, R9 |
| `{testRoot}/**/*.spec.ts` | R7 |

## Violation output format

```
[api-setup-teardown-standard] SEVERITY — RULE_NAME
File:  <path from project root>
Line:  <number>
Issue: <one sentence>
Fix:   <one sentence> | AUTO-APPLIED | MANUAL-FIX
```

```
[api-setup-teardown-standard] ERROR — TEARDOWN_MIRRORS_SETUP
File:  src/fixtures/sites/demoqa.fixtures.ts
Line:  34
Issue: 'createdBook' creates a book via API but has no teardown after use().
Fix:   Add await controller.delete(book.bookId) after use(). | MANUAL-FIX
```

Final summary: `[api-setup-teardown-standard] ✅ All rules satisfied.` or `X violations — Y auto-applied — Z manual: <list>`.

## Growth path

Database-level setup/teardown · auth token caching across fixtures · environment-scoped teardown policies (e.g. skip destructive teardown on staging).
