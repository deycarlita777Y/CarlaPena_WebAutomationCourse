# Notes — TC07 + TC08: spec-requirements-standard (M0, M2) and spec-data-standard (M0, B, C, M5)

Date: 2026-11-21
Related: [notes-TC7.md](notes-TC7.md) · [notes-TC8.md](notes-TC8.md) · [notes-spec-requirements-standard.md](notes-spec-requirements-standard.md) · [notes-spec-data-standard.md](notes-spec-data-standard.md)
TC document: `docs/test-cases/demoqa/book-store-crud-test-cases.md` (TC07, TC08)

## 1. M0 assessment (before)

The specs already used the per-worker `workerUser` account. The TC document still described the old shared account `bookStoreUsers.appUser`, which no longer exists in `src/`.

| TC | Score | Grade | Gaps |
|---|---|---|---|
| TC07 | 77% | Needs refinement | Q4, Q10, Q5 |
| TC08 | 68% | Needs refinement | Q4, Q10, Q6, Q5 |

| Rule | TC | Issue |
|---|---|---|
| Q4 | 07, 08 | `credentials` declared as Secret from `bookStoreUsers.appUser`; the code uses a generated Transactional `workerUser` |
| Q10 | 07, 08 | Risk note said "shared account, must not run concurrently"; each worker owns its account |
| Q6 | 08 | Step 3 oracle "non-empty and different"; titles were read back from the UI although `createdBooks` knows them |
| Q5 | 07 (steps 1, 7), 08 (step 1) | Steps combined two actions |

spec-data-standard M0: demoqa at **level 3 — Isolated**. Findings: R12 (`cleanBookshelf` bulk delete without the `Env.allowDestructiveCleanup` check), R13 (TC07 `bookB` and TC08 `bookA`/`bookB` taken from the UI; TC08 `void createdBooks`), R4 (`workers` cap without a serial comment), R10 (public default URL in `Env`, local only). R15 passes with residual risk: all API logins finish before the UI login and teardown re-authenticates.

## 2. M2 refinement (TC document only)

| TC | Score | Changes |
|---|---|---|
| TC07 | 77% → 100% (Ready) | `credentials` → Transactional, `buildWorkerUser` via `workerUser`; `siteUrl` (Environment) added; `bookB` → API discovery; precondition P1 (per-worker account); postcondition scope = worker's own account; steps 1 and 7 split (9 → 11 steps) |
| TC08 | 68% → 100% (Ready) | Same credentials and scope fixes; `bookA`/`bookB` = `createdBooks[0]`/`[1]`; step 4 asserts one row per title, row order not asserted; step 1 split (6 → 7 steps) |

Change log and the M4 YAML handoff were updated in both TCs.

## 3. Code changes (B and C)

| File | Change |
|---|---|
| `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts` | `bookB` from `bookController.getAll()` via `otherBookTitle` (API), 11 numbered steps matching the doc, URL check uses the `page` fixture |
| `test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts` | Titles from `createdBooks`, no `void createdBooks`, no row-order assumption, 7 numbered steps; message from `bookAlerts.deleted` |
| `src/fixtures/sites/demoqa.fixtures.ts` | New `bookController` fixture (read-only API catalog access; first named `catalogBooks`, renamed after the api-setup-teardown R8 check, see section 6). New `removeBooks` helper used by `cleanBookshelf` and the seed teardown: bulk `deleteAll` only when `Env.allowDestructiveCleanup` is true, otherwise `deleteOne` for each book listed on the worker's account (R12) |
| `playwright.config.ts` | `// spec-data: serial — …` comment on `workers` (R4) |

`tsc --noEmit` passes.

## 4. M5 robustness verification (evidence)

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
- Orphan check not possible: demoqa has no API to list users. Teardown deletes each account and showed no errors, which is indirect evidence only.

## 5. Cross-skill verification (spec-standards, test-standards, spec-quality-lifecycle, pom-architect, api-setup-teardown)

Fixed in code (the specs, Page Objects, data file and fixtures):

| Skill / rule | Finding | Fix |
|---|---|---|
| spec-quality-lifecycle R8 | `if (...) throw` guards inside both test bodies | `otherBookTitle()` and `seededTitles()` in `books.data.ts` throw outside the body |
| spec-quality-lifecycle R4 | `expect(await getBookTitles())` read once, no auto-retry | `bookTitleLinks` + `toHaveText([bookB])`; `bookLinkByTitle` + `toBeVisible()` |
| pom-architect R3 | Specs clicked `deleteIconForBook(...)` directly | `ProfilePage.openDeleteDialog(title)` |
| api-setup-teardown R8 | Fixture `catalogBooks` did not follow the naming table | Renamed to `bookController` |

After these changes: `tsc --noEmit` passes, both specs are still listed by `playwright test --list`, and 6/6 passed (workers=4, repeat=3).

Passing: test-standards 1–9, spec-standards R1, R3, R4 (prefix), R5, api-setup-teardown R1–R7 and R9–R10, spec-quality-lifecycle R1–R3, R5 (PO changes), R6, R7, R9–R12, pom-architect 1, 2, 4–8.

Decided: **spec-standards R2** — the spec files use a padded ID (`TC07`, `TC08`; `TC02` too) while the rule said unpadded. Decision: keep the project's `TC07` convention. The skill (`.claude/skills/spec-standards/SKILL.md`, R2 and R4) now defines padding per site: unpadded by default; `demoqa` uses two-digit padded IDs because its TC document numbers `TC01`–`TC10`; `saucedemo` and `automationexercise` stay unpadded. Mixing padded and unpadded inside one site is the violation. No files were renamed, so R2 now passes for TC07 and TC08.
