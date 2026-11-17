# Notes: fix for TC02-add-book-to-collection.spec.ts (Chromium)

Spec: `test/smoke/books/TC02-add-book-to-collection.spec.ts`
Test: `TC02: adds a book to the user's collection`
Date: 2026-11-14

## Error
Project: chromium. Step: `Click "Add To Your Collection" and accept the alert`.

```
Expected: "Book added to your collection."
Received: "User not authorized!"
```

The failure is a server-side auth rejection from demoqa, not a locator or timing problem.

## Cause (most likely, not proven)
All three browser projects (chromium, firefox, webkit) run in parallel (`fullyParallel`) and
share one demoqa account (`users.demoqaUser`). The `cleanBookshelf` fixture
(`src/fixtures/index.ts`) does an API login and deletes the whole collection before and after
each test. Overlapping runs can invalidate the session or wipe the collection another run is
using. The failing browser changed between runs, which fits this explanation.

## Evidence
| Command | Result |
|---------|--------|
| all projects, parallel (3 runs) | 1-2 browsers failed each run; failing browser varied |
| all projects, `--workers=1` (2 runs) | 3 passed; then 2 passed, 1 failed (firefox) |
| `--project=chromium --workers=1 --repeat-each=4` | 4 passed |
| `--project=chromium --workers=1` (final run) | 1 passed (23.3s) |
| `--project=firefox --workers=1 --repeat-each=3` | 3 passed |

No certificate errors appeared in any run (see `notes_fixCertificate.md`).

## Fix (Chromium only)
No source files were changed. Run Chromium on its own, with one worker:

```bash
npx playwright test test/smoke/books/TC02-add-book-to-collection.spec.ts --project=chromium --workers=1
```

Optional: add `"test:chromium": "playwright test --project=chromium"` to `package.json`.
This was suggested but not applied.

## Not fixed
- Firefox failure in an earlier run (`#userName-value` not found on `/profile`) and the WebKit
  failures. They are probably the same shared-account problem; Firefox passed 3/3 alone.
- A fix for all browsers would give each browser its own demoqa user or run them one after another.
