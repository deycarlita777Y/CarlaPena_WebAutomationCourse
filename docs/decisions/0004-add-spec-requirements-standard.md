# ADR 0004 — Add `spec-requirements-standard` skill (no new hub mode)

Status: Accepted

## Gap
`docs/test-cases/**` has no content owner. Hub Mode 5 only syncs the README; `spec-standards` owns spec file names and TC IDs; `spec-quality-lifecycle-standard` owns the quality of the test body in code. Nobody checks that a TC document is complete, has provisioned preconditions, classified data, exact and deterministic oracles, postconditions, independence and an automation decision. The existing demoqa TC document shows the symptoms: "e.g." data, "at least one" oracles, "or" outcomes, absolute URLs, a corrupted step list in TC02.

## Modes / skills considered
- **`spec-quality-lifecycle-standard`** — enforces R1–R12 on `.spec.ts` after the code exists; a vague TC document is already too late there.
- **`spec-standards`** — file/ID naming only.
- **`test-standards`** — code and data hygiene, not TC prose.
- **Hub Mode 5** — README sync only.
- **Hub Mode 6 (TC Quality Review)** — same lifecycle, earlier phase; reused as the router.

## Options
1. Extend `spec-quality-lifecycle-standard` — rejected: different artifact (markdown vs code) and it would grow past the 400-line budget.
2. New skill and new Mode 8 — rejected: Growth Rule 1; Mode 6 already routes TC-quality requests.
3. **New skill `spec-requirements-standard`, no new mode; Mode 6 gets the new triggers and Mode 1 gets a report-only step 0** — chosen. Name follows ADR-001.

## Decision
Create `.claude/skills/spec-requirements-standard/SKILL.md` (rules Q1–Q13, modes M0–M4). Scan scope: `docs/test-cases/**/*.md`. Mode count stays 7 of 10. `spec-data-standard` and `spec-organisation-standard` referenced in the source prompt do not exist yet: data sourcing is delegated to `api-setup-teardown-standard` and `test-standards`, TC IDs to `spec-standards`.
