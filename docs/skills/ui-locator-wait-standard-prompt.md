# Run prompt: ui-locator-wait-standard on demoqa TC07 and TC08 (Claude)

Adapted from [ui-locator-wait-standard-prompt.md](ui-locator-wait-standard-prompt.md), the meta-prompt that **created** the skill. This file does not create anything: it tells Claude how to **apply** the existing skill `.claude/skills/ui-locator-wait-standard/SKILL.md` to two test cases.

**Status: prepared, not executed.** Paste the block under "Prompt" into Claude Code when ready.

## What was adapted

| Meta-prompt (creation) | This run prompt (application) |
|---|---|
| Generates `SKILL.md`, hub updates, reinforcements, ADR | None of that: the skill, ADR 0006 and hub rows already exist. Do not touch them |
| Project-agnostic placeholders (`<pages-dir>`, `tests`, `ui-pom-standard`) | Resolved for this repo: `src/ui/pages/sites/demoqa/`, `test/`, `pom-architect`, `test-standards`, `spec-standards` |
| Validation loop over "two TCs from Module 7" | Scope fixed to demoqa **TC07** and **TC08** only |
| Runs M0 on the whole project | M0 on the scope only, with the prior baseline as input |
| Any browser project | `--project=demoqa` (the `chromium`, `firefox`, `webkit` projects ignore demoqa specs through `testIgnore`) |
| No history | Starts from the 2026-11-25 results (15/15 deterministic, Level 3) and the open findings |

## Scope

| Item | Value |
|---|---|
| Specs | `test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts` · `…/TC08-delete-book-from-collection.spec.ts` |
| Page Objects | `BookStoreLoginPage` · `BookStorePage` · `BookDetailPage` · `ProfilePage` in `src/ui/pages/sites/demoqa/` |
| Fixtures / API | `createdBook`, `createdBooks`, `workerUser`, `bookController` (read only: they are inputs, not targets) |
| Out of scope | TC02, automationexercise TC8 (similar name, different spec), saucedemo, `playwright.config.ts` edits, fixtures, data files, TC documents |

## Known starting state (do not rediscover)

Source: [notes-trigger-ui-locator-wait-demoqa-tc02-tc07-tc08.md](../wiki/manual/notes-trigger-ui-locator-wait-demoqa-tc02-tc07-tc08.md) · [notes-adapt-ui-locator-wait-standard.md](../wiki/manual/notes-adapt-ui-locator-wait-standard.md) §8 · [notes-TC07-TC08-progression-TaskModule8.md](../wiki/manual/notes-TC07-TC08-progression-TaskModule8.md)

- No test-id contract for demoqa (`testIdAttribute: 'data-test'` is saucedemo only). Hierarchy used: role → label → placeholder → text → alt text → title → CSS with reason.
- Level 3 (Synchronised). M6 on 2026-11-25: 15/15 passed, `--repeat-each=5 --workers=4 --retries=0`, verdict deterministic.
- DOM facts already verified (R4), reuse them:
  - `/books` has no heading element. `getByText('Book Store', { exact: true })` is the sidebar item.
  - Delete modal: `role="dialog"`, `aria-modal="true"`, accessible name "Delete Book". A page-wide `getByRole('button', { name: 'OK' })` matches 3 elements, so the dialog scope is required.
- Open findings to re-check:

| # | Rule | Where | Finding |
|---|---|---|---|
| 1 | R7 | `BookStorePage.getBookTitles()` · `ProfilePage.getBookTitles()` | `allInnerTexts()` without a prior count assertion. Not called by TC07/TC08 |
| 2 | R5 | `BookStorePage.firstBookLink` | `.first()` with a `// position:` reason. Not used by TC07/TC08 |
| 3 | R2 | `ProfilePage.usernameValue` · `BookDetailPage.titleValue` / `bookInfoBlock` | CSS (`#userName-value`, `#title-wrapper`) with `// locator:` reasons. Confirm no tier 1-7 option exists |

- Candidates found while preparing this prompt (not yet verified, treat as hypotheses):

| # | Rule | Where | Hypothesis |
|---|---|---|---|
| A | R1 / R4 | `ProfilePage.deleteIconForBook` | `getByTitle('Delete')` is tier 7. Check the DOM for a role, label or accessible name on the icon |
| B | R14 / R15 | `BookStoreLoginPage.login()` + spec step 2 | `login()` already ends in `waitForURL('**/profile')`, and step 2 asserts `toHaveURL(/\/profile$/)` again. Decide whether the PO wait or the spec assertion is the redundant one |
| C | R19 | `confirmDeletion()` · `addToCollection()` | `waitForEvent('dialog')` has no explicit timeout, so it inherits the test timeout (90 s in the `demoqa` project). Check against the timeout hierarchy |
| D | R14 | TC07 step 10 | After `addToCollection()` the only terminal signal is the browser alert. Confirm the step does not need a further UI wait before step 11 navigates |

## Prompt

```text
Load the skill ui-locator-wait-standard and apply it to demoqa TC07 and TC08 only.

Scope
- Specs: test/ui/regression/sites/demoqa/books/TC07-replace-book-in-collection.spec.ts
         test/ui/regression/sites/demoqa/books/TC08-delete-book-from-collection.spec.ts
- Page Objects: src/ui/pages/sites/demoqa/{BookStoreLoginPage,BookStorePage,BookDetailPage,ProfilePage}.ts
- Read-only inputs: fixtures, data files, API layer, playwright.config.ts, docs/test-cases/demoqa/book-store-crud-test-cases.md
- Do not edit anything outside the scope. If a fix needs a fixture, data or config change, report it, do not apply it.

Context to read first (do not re-derive)
- docs/wiki/manual/notes-trigger-ui-locator-wait-demoqa-tc02-tc07-tc08.md
- docs/wiki/manual/notes-adapt-ui-locator-wait-standard.md (section 8)
- docs/skills/ui-locator-wait-standard-demoqa-tc07-tc08-prompt.md ("Known starting state")

Project conventions to report in the M0 header
- pages-dir src/ui/pages/sites/demoqa/, specs-dir test/, runner-config playwright.config.ts
- test-id contract for demoqa: none (confirm in the runner config)
- run with --project=demoqa, never --project=chromium (testIgnore skips demoqa specs)

Steps
1. M0 (read-only): inventory locators by tier and waits by type for the scope; score the level;
   list blockers to the next level, each mapped to a mode and rule. Re-check the open findings 1-3
   and the hypotheses A-D from the prompt file.
2. R4 gate: before changing any locator, inspect the live DOM and record what you observed
   (role, accessible name, label, attributes, match counts). Reuse the facts already verified.
   Never write a value you did not observe. If a value cannot be verified, use
   "// TODO: verify locator in DOM" and report it.
3. Apply M1 -> M2 -> M3 -> M4 -> M5 in order. Auto-fix AUTO-FIX violations; list MANUAL-FIX items
   with the proposed change and wait for my decision before applying anything that changes behaviour.
4. Keep spec step labels, TC IDs, tags and assertions' intent unchanged. Do not add or remove steps.
5. M6: --project=demoqa --repeat-each=5 --workers=4 --retries=0 --trace=retain-on-failure on TC07 and TC08.
   Compare with the 2026-11-25 baseline (15/15, which covered TC02 as well, so compare the TC07 and TC08 share).
6. Run npm run typecheck after any edit.

Safety (live site, shared state)
- demoqa.com is a real public site. The run creates one account per worker and books through the
  fixtures; the fixtures empty the collections in teardown. Keep workers at 4 or fewer.
- A DOM inspection script that needs an authenticated session must live outside the repo
  (scratchpad), create its own account, and try to delete it at the end (GenerateToken first, then
  DELETE /Account/v1/User/{id}; the earlier attempt returned 401). Report any account left behind.
- Do not commit, push or open a PR. Do not modify the skill, the ADR or the hub.

Output
- M0 report in the skill's format, before and after.
- One violation block per finding in the skill's format.
- A table: change | file | rule | DOM evidence.
- M6 verdict block, before/after.
- Anything with no matching rule: list it as a rule-gap candidate for the skill prompt, do not invent a rule.

Stop and ask if
- a fix would change what a step asserts, or needs a fixture, data or config change;
- M6 shows a failure caused by data or isolation (hand off to spec-data-standard M5);
- the live DOM contradicts a fact recorded in the notes.
```

## After the run (manual follow-up, not part of the prompt)

1. Append a section to [notes-adapt-ui-locator-wait-standard.md](../wiki/manual/notes-adapt-ui-locator-wait-standard.md) or a new `notes-` page with the before/after evidence.
2. If a finding had no rule, record it under the rule as *Added in iteration N* in [ui-locator-wait-standard-prompt.md](ui-locator-wait-standard-prompt.md), then update `SKILL.md`.
3. Review the diff, then commit with the git-standards conventions.
