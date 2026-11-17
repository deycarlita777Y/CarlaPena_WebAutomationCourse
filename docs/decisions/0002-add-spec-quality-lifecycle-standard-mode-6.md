# ADR 0002 — Add `spec-quality-lifecycle-standard` skill and hub Mode 6

Status: Accepted

## Gap
No existing skill inspects what happens *inside* a `test()` body: precondition/postcondition assertions, hardcoded waits, JS-first assertions, fragile selectors, shared mutable state, conditionals, navigation races and assertion specificity. These are the root causes of flaky tests.

## Modes / skills considered
- **Mode 1 / `test-standards`** — imports, fixtures, credentials, framework only. Does not inspect test-body behaviour.
- **`spec-standards`** — folder, naming, TC IDs, describe names, `test.step()` presence. Structure, not content quality.
- **`pom-architect`** — Page Object structure. Does not cover wait/assertion quality in specs.
- **Mode 4 / Mode 5** — git and README domains.

## Options
1. Extend `test-standards` — rejected: different domain (code hygiene vs. TC behaviour) and it would exceed the 400-line sub-skill budget (Growth Consideration 1).
2. Extend `spec-standards` — rejected: it owns organisation; mixing in body-level rules breaks Rule 3 (one domain per mode).
3. **New skill `spec-quality-lifecycle-standard` + Mode 6 wrapper** — chosen. Name follows ADR-001 (`{domain}-{objective}-standard`).

## Decision
Create `.claude/skills/spec-quality-lifecycle-standard/SKILL.md` (rules R1–R10, Enforce + Create modes), wire it into Mode 1 after `spec-standards`, and add Mode 6 to `automation-architect` as a thin wrapper. Mode count after change: 6 of the 10 allowed.
