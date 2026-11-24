# Notes — spec-data-standard: creation, M0 assessment, M1 + M3 applied

Prompt: [spec-data-standard-prompt.md](../../skills/spec-data-standard-prompt.md)
Skill: `.claude/skills/spec-data-standard/SKILL.md` (344 lines) · ADR: [0005-add-spec-data-standard.md](../../decisions/0005-add-spec-data-standard.md)
Reference scenario: demoqa Book Store (TC02, TC07, TC08)

## 1. Adapting the prompt to this repo

| Prompt says | This repo |
|---|---|
| `spec-code-standard` / `spec-organisation-standard` | `test-standards` / `spec-standards` |
| `src/config/env.ts`, `ENV` | `src/config/Env.ts`, `Env` |
| `tests/**` | `test/**` (`{testRoot}`), per-site layers under `sites/<site>` |
| `ADR-002-…` | `0005-add-spec-data-standard.md` (numbering follows 0001–0004) |
| Hub "Mode 7 = TC quality" | Hub Mode 6 (TC Quality Review); Mode 7 is API lifecycle |
| Lifecycle orchestrator (phases 2/4/5) | Does not exist yet; Mode 6 routes directly to the skill |

No new hub mode (7 of 10 slots stay used). Hub updates applied: registry row, scan-scope ownership, Mode 1 step 7 (auto-fix R2, R3, R6–R9, R11; M0 and M5 are never run by the pipeline), Mode 6 triggers and routing note, execution order (after `api-setup-teardown-standard`), invocation rows, breaking-change note, folder annotations.

Reinforcements applied as one-line notes: lifecycle R10 (value source → R13), api-setup R4 (worker fixtures) and R8 (`worker<Resource>`), test-standards credential rule (identity → R1), pom-architect / test-standards references to `workerUser`.

## 2. M0 assessment (before)

| Site | Level | Reason |
|---|---|---|
| demoqa | 1 — Externalised | One static account for every worker; one fixed `.env`; default URLs |
| automationexercise | 0–1 | Data in `src/data`, nothing self-provisioned |
| saucedemo | 0–1 | Public demo accounts, read-only |

Main findings: R1/R12 (all demoqa fixtures mutate and `deleteAll` one shared account), R15 (UI login + API calls on the same identity), R9 (no `TEST_ENV`), R10 (URL and search literals), R4 (single demoqa project because of the shared account), R13/R5/R14 (presence-only and `toBeGreaterThan(0)` assertions), R11 (no data-impact tags), R3 (no prefix).

Environment Readiness Map before: 3/10 (E3, E4, E6 done). Only one environment exists, so the map replaced the per-environment run.

## 3. What M1 changed (parallel isolation)

| File | Change |
|---|---|
| `src/fixtures/sites/demoqa.fixtures.ts` | New worker-scoped `workerUser` fixture: creates one account per worker (`testInfo.parallelIndex`), deletes it at the end. `cleanBookshelf`, `createdBook`, `createdBooks` use it |
| `src/api/sites/demoqa/controllers/AccountController.ts` | `createUser`, `deleteUser` |
| `src/api/sites/demoqa/endpoints/account.endpoints.ts`, `models/account.model.ts` | `createUser`, `generateToken` endpoints; `CreateUserResponse`, `TokenResponse` |
| `src/data/factories/unique.ts` | `uniqueSuffix`, `uniqueName` (prefix + worker index + timestamp + random) — R2, R3 |
| `src/data/sites/demoqa/auth.data.ts` | `buildWorkerUser()` replaces the env-backed `bookStoreUsers` / `demoqaUser` |
| TC02, TC07, TC08 specs | Log in with `workerUser`; tagged `@mutates-data` (R11) |
| `playwright.config.ts` | Comment updated: workers no longer share an identity |

## 4. What M3 changed (environment portability)

| File | Change |
|---|---|
| `src/config/Env.ts` | `TEST_ENV` selector (default `local`): loads `.env.<TEST_ENV>`, then `.env`. Adds `name`, `testDataPrefix`, `allowDestructiveCleanup`. Site URL defaults exist only for `local`; any other environment must set them or the run fails fast |
| `.env.example` | Documents `TEST_ENV`, site URLs, `TEST_DATA_PREFIX`, `ALLOW_DESTRUCTIVE_CLEANUP`; `DEMOQA_USER` / `DEMOQA_PASSWORD` removed |

Check: `TEST_ENV=staging npx playwright test --list` fails with `Missing environment variable: "AUTOMATION_EXERCISE_URL"` instead of silently using the public site.

## 5. Findings about demoqa found while applying M1

1. **A freshly created account has no usable token.** The token returned by `POST /Account/v1/Login` is rejected (401, `User not authorized!`) until `POST /Account/v1/GenerateToken` has been called once. `createUser` calls it once.
2. **Do not call GenerateToken on every authenticate.** The first version did, and TC07 failed every time with `User not authorized!` on "Add To Your Collection". The same failure happened on the old shared account, and reverting to the Login-only `authenticate` made TC07 pass. So the cause was that change, and it was removed.
3. Deleting a user needs a bearer token (`DELETE /Account/v1/User/{id}`); a second delete returns 200 with `User Id not correct!`.

## 6. Verification result (after)

| Run | Result |
|---|---|
| `npm run typecheck` | Clean |
| TC08 alone | Passed |
| TC02 | Passed in every run |
| TC07 alone | Passed 4 of 4 |
| `--project=demoqa --workers=3` (all specs) | TC02 and TC08 passed; TC07 failed once (`User not authorized!`) |
| `--workers=3 --repeat-each=2` | 3 passed, 3 passed (TC07 ×2 ; TC08 ×2) |
| `--workers=1` (all specs) | TC02, TC08 passed; TC07 passed |

Each run created and deleted real accounts on demoqa.com.

