# ADR 0005 — Add `spec-data-standard` skill (no new hub mode)

Status: Accepted

## Gap
Setup/teardown **exist** (`api-setup-teardown-standard`, `spec-quality-lifecycle-standard` R2/R11), but nobody owns test-data robustness: isolation between parallel workers, portability between environments, typed sourcing, and the source of expected values. Symptoms in the repo: demoqa specs share ONE account (`Env.demoqaUser`) so the config restricts them to a single project and `cleanBookshelf` bulk-deletes that account's collection (lifecycle R12 documents the risk, nothing fixes it); `Env` loads one fixed `.env` with no `TEST_ENV` selector and defaults to public URLs; no data-impact tags; presence-only assertions possible (`toBeVisible`).

## Modes / skills considered
- **`spec-quality-lifecycle-standard` R10/R12** — reports the symptom (specificity, shared account), has no fix strategy; extending it would pass its 400-line budget.
- **`api-setup-teardown-standard`** — owns API layer structure and teardown existence, not identity scope or expected values.
- **`test-standards`** — credential storage and import hygiene only.
- **`spec-requirements-standard`** — TC documents, not code/config.
- **Hub Mode 6** — reused as router; no new mode (Growth Rule 1).

## Options
1. Extend `spec-quality-lifecycle-standard` — rejected (size, different concern: data vs. test body).
2. New skill + new Mode 8 — rejected: Mode 6 already routes TC-quality requests.
3. **New skill `spec-data-standard` (R1–R15, M0–M5), no new mode; Mode 6 gets triggers, Mode 1 gets a step after `api-setup-teardown-standard`** — chosen. Name follows ADR-001.

## Decision
Create `.claude/skills/spec-data-standard/SKILL.md`. Mode count stays 7 of 10. M5 executes tests against live systems and is therefore never part of Mode 1. `spec-organisation-standard` / `spec-code-standard` in the source prompt map to this repo's `spec-standards` / `test-standards`; the TC lifecycle orchestrator (phases 2/4/5) does not exist yet, so Mode 6 routes directly.
