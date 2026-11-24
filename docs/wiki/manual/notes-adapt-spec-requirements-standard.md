# Notes — spec-requirements-standard (Specify phase)

Prompt: `docs/skills/spec-requirements-standard-prompt.md`
Skill: `.claude/skills/spec-requirements-standard/SKILL.md` (256 lines, budget 400)
ADR: `docs/decisions/0004-add-spec-requirements-standard.md`
Document under test: `docs/test-cases/demoqa/book-store-crud-test-cases.md`

## What was created

| File | Change |
|---|---|
| `.claude/skills/spec-requirements-standard/SKILL.md` | New skill: rules Q1–Q13, modes M0 Assess · M1 Write · M2 Refine · M3 Coverage · M4 Automation Readiness |
| `docs/decisions/0004-add-spec-requirements-standard.md` | ADR: gap, options (extend vs. new mode vs. new skill), decision |
| `.claude/skills/automation-architect/SKILL.md` | Mode 1 step 0 (M0, report only) · Mode 6 routing + triggers · Registry · Scan scope ownership · Invocation reference · Pipeline output · Execution order |
| `docs/test-cases/demoqa/book-store-crud-test-cases.md` | TC02 and TC07 rewritten to the template with a change log |

## How the prompt was adapted to this project

| Prompt said | Project reality | Adaptation |
|---|---|---|
| Hub Mode 7 routes to the lifecycle orchestrator | Mode 6 is TC Quality Review; Mode 7 is API infrastructure | Triggers added to Mode 6, routing by target (document → this skill, code → `spec-quality-lifecycle-standard`) |
| Hub Mode 5 "Docs Sync" adds TC rows | Mode 5 is README sync | Update 6 dropped; scan ownership states Mode 5 never edits `docs/test-cases/**` |
| Registry has an "Added" column | It does not | Column omitted |
| `spec-data-standard`, `spec-organisation-standard` | Not implemented when the skill was written | Data sourcing → `api-setup-teardown-standard` / `test-standards`; TC IDs → `spec-standards` R2/R4 |
| Generic `worker<Resource>` fixtures | Project has `cleanBookshelf`, `createdBook(s)`, `AccountController`, `BookController` | Handoff example uses the real names |
| ADR-003 | `0003-…` already exists | Numbered `0004` |

## Validation loop evidence

### Baseline M0 (hand-scored, ERROR = 3, WARNING = 1)

| TC | Score | Grade | Main gaps |
|---|---|---|---|
| TC01 | 39% | Incomplete | Q4, Q6, Q7, Q9 |
| TC02 | 29% | Incomplete | Q13, Q3, Q4, Q6, Q9 |
| TC03 | 68% | Needs refinement | Q6 |
| TC04 | 48% | Incomplete | Q3, Q7, Q8 |
| TC05 | 48% | Incomplete | Q4, Q6, Q7 |
| TC06 | 48% | Incomplete | Q3, Q6, Q10 |
| TC07 | 48% | Incomplete | Q3, Q9, Q10 |
| TC08 | 29% | Incomplete | Q3, Q8, Q9, Q10 |
| TC09 | 29% | Incomplete | Q3, Q7, Q9, Q10 |
| TC10 | 29% | Incomplete | Q3, Q4, Q7, Q9, Q10 |

Average 41%, Ready 0/10. Every TC failed Q1, Q2, Q5, Q11, Q12 (no metadata, objective or automation decision; absolute URLs).

### M2 results

| TC | Before → after | Fixed | Remaining |
|---|---|---|---|
| TC02 | 29% → 90% | Q2–Q13 (incl. corrupted `**Steps:ate to…` header and wrong "step 3" reference) | Q1: requirement ID = `TBD` |
| TC07 | 48% → 90% | Q2–Q13 (incl. missing login step, Book A/B as data items) | Q1: requirement ID = `TBD` |

After both: average 51% (10 TCs), Ready 0/10. Both refined TCs are capped at **Needs refinement** only by the `TBD` requirement ID.

### M4

Not run. M4 requires a **Ready** TC (≥ 90 and no `TBD`). Unblock by providing a requirement ID for TC02 and TC07 (or agree a convention such as `BOOKSTORE-ADD-01`), re-run M0, then M4.

## Findings

1. The document is the contract for the spec, not a mirror. TC07's refined doc now includes a login step and the `Book deleted.` alert because the spec does; the original doc was missing both.
2. TC02's refined oracle takes the first catalog row from API discovery instead of `Git Pocket Guide`. `TC02-add-book-to-collection.spec.ts` was not touched and may differ.
3. TC07 now documents a risk: it needs at least 2 catalog books in a stable order.
4. Shared demoqa account (spec-quality-lifecycle-standard R12): run mutating TCs with `--workers=1`.


