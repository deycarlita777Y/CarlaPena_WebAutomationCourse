# ADR 0006 — Add `ui-locator-wait-standard` skill (no new hub mode)

Status: Accepted

## Gap
`pom-architect` guarantees locators live in getters (R2), not that they are the **right** locators. `spec-quality-lifecycle-standard` had one locator rule (R5, WARNING: no `.first()`/long CSS) and one wait rule (R3: no fixed waits). Nobody owned: the locator hierarchy and test-id contract, element uniqueness and filtering, action semantics, terminal-state synchronisation (`waitForLoadState('networkidle')`, intermediate-state waits), bounded polling, the timeout hierarchy, or diagnostic wait messages. Symptoms in the repo: PO getters with `.first()` as sole disambiguation (`ProductsPage`, `BookStorePage`), CSS `a[href^=…]` selectors without reason, a per-project `timeout: 90_000` without a written bound, no polling standard for API-driven state.

## Modes / skills considered
- **`spec-quality-lifecycle-standard` R3/R5** — too narrow, and extending it (234 lines) would cross the 400-line budget with 18 more rules.
- **`pom-architect`** — owns structure (where), not which locator or how to wait; mixing would blur its 8 structural rules.
- **`api-setup-teardown-standard`** — owns the API client/controllers used by polling, not UI synchronisation.
- **`spec-data-standard`** — owns the values used in filters (R13), not the locator.
- **Hub Mode 6** — reused as router; no new mode (Growth Rule 1).

## Options
1. Extend `spec-quality-lifecycle-standard` — rejected (size, different concern: interaction vs. test body).
2. New skill + new hub Mode 8 — rejected: Mode 6 already routes TC-quality requests.
3. **New skill `ui-locator-wait-standard` (R1–R20, M0–M6), no new mode; Mode 6 gets triggers, Mode 1 gets a step after `pom-architect`; `spec-quality-lifecycle-standard` R3 and R5 become delegations** — chosen. Name follows ADR-001 (`ui` domain, `locator-wait` objective).

## Decision
Create `.claude/skills/ui-locator-wait-standard/SKILL.md`. Mode count stays 7 of 10. M6 executes tests (against live systems for demoqa) and is never part of Mode 1. Source-prompt names map to this repo: `ui-pom-standard` → `pom-architect`, `spec-code-standard` → `test-standards`, `spec-organisation-standard` → `spec-standards`, `git-workflow-docs-standard` → `git-standards`; `tests/` → `test/`; the TC lifecycle orchestrator does not exist yet, so Mode 6 routes directly (M1–M5 Act, M6 Run). No test-id contract is defined in this repo today (`playwright.config.ts` has no `testIdAttribute`), so R1 uses the semantic order.
