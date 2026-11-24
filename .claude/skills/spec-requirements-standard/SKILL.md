---
name: spec-requirements-standard
description: Write, assess, and refine high-quality test case specifications for Playwright + TypeScript projects. Governs docs/test-cases/**: traceability, provisioned preconditions, classified test data, one action with an exact and deterministic expected result per step, postconditions, independence, coverage variants, and automation readiness. Produces the handoff consumed by spec-quality-lifecycle-standard and api-setup-teardown-standard when a TC is automated. Load before automating a TC, when writing TCs from requirements, or when reviewing TC documents (user says "assess test cases", "refine test case", "write test case", "tc coverage", "automation readiness").
---

# spec-requirements-standard

Owns the **test case specification** — the document that states *what* a TC verifies, *from which state*, *with which data*, *with which exact expected results* and *how it leaves the system*. It is written and validated **before** code exists. This skill is the **Specify** phase of the TC lifecycle; it has no hub mode of its own (hub Mode 6 routes here).

| Lifecycle phase | Owner | Output |
|---|---|---|
| **1. Specify** | **this skill** | TC specification + automation handoff |
| 2. Arrange | `api-setup-teardown-standard` (`spec-data-standard` planned) | Provisioned, isolated data; setup + teardown fixtures |
| 3. Act | `pom-architect` · `spec-quality-lifecycle-standard` R3/R5 | POM structure, robust waits and locators |
| 4. Assert | `spec-quality-lifecycle-standard` | Exact, descriptive assertions |
| 5. Run | `playwright.config.ts` / CI | Evidence in parallel and per environment |

**Gap this skill fills:** `docs/test-cases/**` had no content owner. Nobody checked that a TC is complete, deterministic, independent and automatable.

## Project Context

- TC specifications live in `docs/test-cases/<site>/{feature}-test-cases.md` (one file per feature, one `###` section per TC, IDs `TC01`, `TC02`…). Current: `docs/test-cases/demoqa/book-store-crud-test-cases.md`.
- A specification is **ready** when another engineer (or an agent) can automate it without asking a single question.
- **Oracle**: the exact expected result a step is compared against. A step without an exact, deterministic and verifiable oracle is not a test step.
- **Captured value**: a value read during the test and reused later. Name it with braces (`{bookTitle}`) instead of "the value from step N".
- Steps use **relative paths** (`/books`, `/profile`). The base URL comes from `Env.baseUrl` (`BASE_URL` in `.env`).
- Data classes: **Reference** (stable catalog data) · **Environment** (URL, host) · **Transactional** (created by the test, unique) · **Secret** (credentials → env vars, never written in the doc) · **Simulated** (mocked response).
- Existing provisioning building blocks (demoqa): fixtures `cleanBookshelf` (empties the collection before and after, verified), `createdBook` / `createdBooks` (seed books via API); controllers `AccountController`, `BookController` in `src/api/sites/demoqa/`; credentials via `@data/auth.data`. Reference them by name in *Provisioned by*.
- A TC doc is the contract for the spec file `TC{N}-<name>.spec.ts`; the same `TC{N}` ID appears in both (naming owned by `spec-standards` R2/R4).

### Domain coordination

| Concern | Owner | Interaction |
|---|---|---|
| Hub routing (Mode 6, Mode 1 step 0) | `automation-architect` | Forwards TC-document requests here |
| TC body quality in code | `spec-quality-lifecycle-standard` | Consumes the M4 handoff `steps` block (Create flow) |
| Fixtures, controllers, mocks | `api-setup-teardown-standard` | Consumes the handoff `fixtures` block |
| Spec file naming / TC IDs in code | `spec-standards` R2, R4 | Same `TC{N}` in doc and spec; this skill never creates spec files |
| Test data files | `test-standards` R8 | Handoff `data` block names `@data/*` sources |
| README sync | `automation-architect` Mode 5 | Never touches `docs/test-cases/**` |

Do not re-report what another skill owns: a spec missing `test.step()` is `spec-standards`; a vague assertion *in code* is `spec-quality-lifecycle-standard` R6. This skill checks the **document**, never `.spec.ts`.

## TC specification template

Every TC section follows this template. Fields marked * are mandatory.

````markdown
### TC{N}: <Imperative title> *

| Field | Value |
|---|---|
| Requirement / AC * | <REQ-ID> · <acceptance criterion it verifies> |
| Objective * | <one sentence: behaviour verified and why it matters> |
| Priority * | High · Medium · Low |
| Suite * | smoke · regression |
| Type * | positive · negative · boundary · data-driven |
| Tags | `@mutates-data` · `@read-only` · `@env:<name>` |
| Automation * | Automatable · Partial (<reason + workaround>) · Manual (<reason>) |

**Preconditions** *

| # | State | Provisioned by | Scope |
|---|---|---|---|
| P1 | <exact state> | API · fixture · mock · UI | test · worker · shared read-only |

**Test data** *

| Item | Value or generation rule | Class | Source |
|---|---|---|---|
| <name> | <exact value / `qa_` + unique suffix / first entry from API> | Reference · Transactional · … | dataset · factory · discovery · mock · env |

**Steps** *

| # | Action | Expected result (oracle) |
|---|---|---|
| 1 | <one user action> | <exact, deterministic, verifiable result> |

**Postconditions** *

| State after the test | Cleanup | Scope |
|---|---|---|
| <final state> | <what is removed and how> | only data created by this TC |

**Risks / notes** — parallel, environment or product constraints (optional)
````

## Modes

**M0 is the default** when no mode is specified.

### M0 — Assess (read-only)

**Triggers:** "assess test cases" · "tc spec review" · "spec requirements"

1. Discover `docs/test-cases/**/*.md`; split into TC sections (`### TC{N}`).
2. Apply Q1–Q13 to each TC.
3. Score: `score = 100 × passed weight / total weight` (ERROR = 3, WARNING = 1). A rule that does not apply to the TC (e.g. Q9 on a read-only TC) counts as passed.
4. Grade: **Ready** ≥ 90 and no ERROR failed · **Needs refinement** 60–89 · **Incomplete** < 60.
5. Do NOT modify files.

```
[spec-requirements-standard] ASSESSMENT
─────────────────────────────────────────
File: docs/test-cases/<site>/<feature>-test-cases.md
TC01  <score>%  <grade>   top gaps: Q4, Q6, Q12
TC02  <score>%  <grade>   top gaps: Q3, Q9, Q13
...
Average: <score>%   Ready: <n>/<total>
Most frequent gaps: Q6 (<n>) · Q9 (<n>) · Q3 (<n>)
Recommended next mode: M2 on <lowest-score TC>
```

### M1 — Write

**Triggers:** "write test case" · "new tc spec" · "spec from requirement"

**Step 0 — Collect** (infer from context; ask only for missing items): requirement or user story, acceptance criteria, feature, site, known business rules.

1. One TC per acceptance criterion (more if M3 derives variants).
2. Fill the template; mark every unknown value `TBD: <question>` — never invent an oracle.
3. Run Q1–Q13; a TC containing `TBD` cannot be graded **Ready**.
4. Append to `docs/test-cases/<site>/{feature}-test-cases.md` with the next free `TC{N}` (never reuse or renumber an ID that has a spec file).

### M2 — Refine

**Triggers:** "refine test case" · "improve tc" · "make tc robust"

1. Run M0 on the target TC for the baseline score.
2. Rewrite it in the template, fixing each failed rule.
3. Keep the TC ID and original intent. If the intent itself is untestable, propose a split and flag it — never silently change scope.
4. Add a **Change log** under the TC: `Qn — <what changed and why>`.
5. Re-run M0 and report `before → after`.

```
[spec-requirements-standard] REFINED — TC{N}
Score: <before>% → <after>%   Grade: <before> → <after>
Changes: Q3 provisioning added · Q6 exact oracle · Q9 postcondition · Q13 step refs fixed
Open questions: <TBD list or "none">
```

### M3 — Coverage

**Triggers:** "tc coverage" · "derive negative cases" · "traceability matrix"

**Techniques:** equivalence partitioning · boundary values · state transitions (resource lifecycle: create → read → update → delete) · role/auth variants (anonymous, owner, other user) · error guessing · data-driven rows.

1. Build the traceability matrix: requirement/AC × TC.
2. For each AC, list the missing variants by technique.
3. Variants that differ only in data become **one data-driven TC** with a dataset table.
4. Write new TCs through M1.

```
[spec-requirements-standard] COVERAGE
REQ / AC          positive  negative  boundary  auth   data-driven
<REQ-1 · AC1>     TC02      —         —         —      —
Missing: <n> variants → proposed TC<N>…TC<M>
```

### M4 — Automation Readiness

**Triggers:** "automation readiness" · "handoff tc" · "ready to automate"

**Precondition:** the TC is graded **Ready** (M0 ≥ 90, no `TBD`). Otherwise stop and recommend M2.

1. Confirm the automation decision (Q12). For `Partial`, describe the workaround (e.g. provision through the API instead of a CAPTCHA-protected form).
2. Map each precondition to a fixture: existing one (`cleanBookshelf`, `createdBook`) or a new `clean<Resource>` / `created<Resource>` / `mock<Resource>` to be built by `api-setup-teardown-standard`.
3. Map each data item to its source (`@data/*` file, factory, API discovery via `<resource>Controller`, `Env`).
4. Emit the handoff block and append it under the TC. Do not generate code.

```yaml
tc: TC{N}
title: <title>
suite: smoke
tags: ['@mutates-data']
automation: automatable
fixtures:
  state: cleanBookshelf             # precondition + postcondition owner (api-setup-teardown-standard)
  seed: createdBook                 # optional: pre-existing resource
data:
  - name: credentials
    class: secret
    source: '@data/auth.data'       # env-backed, never inline
  - name: book
    class: reference
    source: discovery               # bookController.getAll()[0]
captured: [bookTitle]
steps:
  - action: open /profile
    oracle: books table contains exactly 1 row with title = {bookTitle}
postconditions:
  - only books added by this TC are removed
```

## Rules

Severity: **ERROR** blocks *Ready*; **WARNING** lowers the score.

| ID | Rule | Sev. | Condition (violation) | Fix |
|---|---|---|---|---|
| Q1 | `TC_METADATA_COMPLETE` | ERROR | Missing requirement/AC, priority, suite, type or automation field | Fill the field; unknown → `TBD:` |
| Q2 | `OBJECTIVE_STATED` | WARNING | No one-sentence objective, or it repeats the title | State behaviour and value |
| Q3 | `PRECONDITIONS_PROVISIONED` | ERROR | A precondition has no "provisioned by" or no scope ("user is logged in") | Add method (API/fixture/mock/UI) and scope |
| Q4 | `TEST_DATA_DECLARED` | ERROR | Values inline in steps, marked "e.g.", static values for unique fields, or secrets written in clear | Move to the data table with class and source; unique → generation rule; secrets → env reference |
| Q5 | `ONE_ACTION_PER_STEP` | WARNING | A step has several actions, or an action has no expected result | Split; one action, one oracle |
| Q6 | `EXACT_ORACLE` | ERROR | Oracle checks presence only ("visible", "non-empty", "at least one") when a value is knowable | State the exact value or the data item it equals |
| Q7 | `DETERMINISTIC_ORACLE` | ERROR | Oracle contains "or", "e.g.", "should", "some", "any", "any of", or another alternative outcome | Choose the single correct outcome; if unknown → `TBD:` |
| Q8 | `VERIFIABLE_ORACLE` | ERROR | Oracle needs a reference that does not exist ("no unrelated results" without a known dataset) | Add the reference: dataset, mock or API discovery |
| Q9 | `POSTCONDITIONS_DEFINED` | ERROR | TC creates, changes or deletes data and no postcondition or cleanup scope is stated | Add the final state and scoped cleanup |
| Q10 | `INDEPENDENT_TC` | ERROR | TC relies on data or state produced by another TC, or destroys state other TCs use | Provision via precondition; isolate destructive TCs (own identity) |
| Q11 | `ENV_AGNOSTIC_STEPS` | WARNING | Absolute URLs, hosts or environment IDs in steps | Relative paths; env values in the data table (class Environment) |
| Q12 | `AUTOMATION_DECISION` | WARNING | No automation decision, or "manually or via workaround" without a defined workaround | Automatable / Partial (workaround) / Manual (reason) |
| Q13 | `STEP_REFERENCES_VALID` | ERROR | Gaps in step numbering, broken formatting, or "value from step N" pointing to the wrong step | Renumber; use captured values `{name}` |

**Before (fails Q4, Q6, Q7, Q11):**
```markdown
3. Enter a unique username (e.g., `john_auto01`).
9. Assert the button is not visible or is disabled.
```

**After:**
```markdown
| Item | Value or generation rule | Class | Source |
| username | `qa_` + unique suffix | Transactional | factory |

| 3 | Enter `{username}` in Username | Field value = `{username}` |
| 9 | Open `/profile` with an empty collection | "Delete All Books" button is not rendered |
```

## Violation output format

```
[spec-requirements-standard] SEVERITY — RULE_NAME
File:  docs/test-cases/<site>/<feature>-test-cases.md
TC:    TC{N} · step <n> (if applicable)
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

Q13 numbering and formatting fixes are AUTO-APPLIED. Every other rule is applied only by M2 with a change log, because it changes the TC meaning. In hub Mode 1 this skill runs report-only (M0) except Q13.

## Scan scope

| File glob | Rules |
|---|---|
| `docs/test-cases/**/*.md` | Q1–Q13 |

Never scans or edits `*.spec.ts`, fixtures, Page Objects or `src/api/**`.

## Validation loop

1. **Objective:** TC specifications that can be automated without questions.
2. **Execute:** M0 on an existing TC document → baseline.
3. **Analyse:** group gaps by rule; every gap a human reviewer finds must map to a rule (if not, refine the rules).
4. **Refactor:** M2 on the weakest TC, then M4 for the handoff.
5. **Re-verify:** M0 again. The `before → after` score and the handoff block are the evidence.
