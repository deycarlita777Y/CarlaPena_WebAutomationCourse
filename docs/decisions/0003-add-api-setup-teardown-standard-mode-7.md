# ADR 0003 — Add `api-setup-teardown-standard` skill and hub Mode 7

Status: Accepted

## Gap
Nothing governs `src/api/`. The `@api/*` alias exists, but how the client, endpoints, models, controllers and mocks are built, how fixtures use them for setup/teardown, and that specs must receive them as fixture parameters is unenforced. `src/api/sites/demoqa/BookStoreApi.ts` already mixes HTTP calls, URLs and business logic in one class.

## Modes / skills considered
- **`test-standards`** — owns fixture import hygiene, not API layering.
- **`spec-quality-lifecycle-standard`** — owns whether pre/postconditions are asserted and the clean is verified, not how the API layer is structured.
- **`pom-architect`** — UI layer only.
- **Modes 1–6** — none cover scaffolding or enforcing an API layer.

## Options
1. Extend `test-standards` — rejected: different domain, and it would pass the 400-line sub-skill budget.
2. Extend `spec-quality-lifecycle-standard` — rejected: quality of test bodies is a different concern from layer architecture.
3. **New skill `api-setup-teardown-standard` + Mode 7 wrapper** — chosen. Name follows ADR-001.

## Decision
Create `.claude/skills/api-setup-teardown-standard/SKILL.md` (rules R1–R10, New + Add modes), wire it into Mode 1 after `spec-quality-lifecycle-standard`, and add Mode 7 to `automation-architect` as a thin wrapper. Mode count after change: 7 of the 10 allowed.
