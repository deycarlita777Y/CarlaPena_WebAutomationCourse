# docs/

Documentation root for the Web Automation course project. Everything that explains the framework, records a decision, specifies test cases or captures what we learned lives here, in one predictable place.

Written in English. One topic per file. Keep the code and the docs in sync (see [Keeping docs in sync](#keeping-docs-in-sync)).

## Structure

```
docs/
  README.md             ← this index and the documentation rules
  decisions/            ← ADRs: why we chose X over Y (numbered, never rewritten)
  specs/                ← tech specs: how something should be built
  wiki/                 ← living docs: what the framework IS right now
    api/                   one file per site API layer: {site}-api-layer.md
    framework/             patterns, fixtures, POM design — add new guides here
  skills/               ← meta-prompts used to create or update AI skills
  agents/
    claude/             ← skill reference in Claude format
  test-cases/
    {site}/             ← TC specifications, one folder per site, one file per feature area
  retros/               ← lessons learned, fixes and run notes (what happened, what we learned)
  reports/              ← output of skill runs / reviews (generated)
  course/               ← presentation slides per course module (read-only)
```

Sites: `saucedemo`, `automationexercise`, `demoqa` — the same names used in `src/**/sites/<site>/` and `test/ui/**/sites/<site>/`.

## Where does a new document go?

| You are writing… | Put it in | File name |
|---|---|---|
| An architectural decision (why X over Y) | `decisions/` | `NNNN-short-title.md` (next free number) |
| An implementation plan or technical spec | `specs/` | `short-title.md` |
| A description of how a framework layer works today | `wiki/` (`wiki/api/` for API layers) | `{site}-api-layer.md`, `topic.md` |
| A guide on patterns, fixtures or POM design | `wiki/framework/` | `topic.md` |
| A meta-prompt that creates or updates a skill | `skills/` | `{skill-name}-prompt.md` |
| Full rules of the skills in a given agent format | `agents/<agent>/` | `skill-reference.md` |
| Test case specifications for a site | `test-cases/<site>/` | `{feature}-test-cases.md` |
| Notes from fixing a problem or running a TC; lessons learned | `retros/` | `{topic}.md` or `{date}-{topic}.md` |
| The output of a skill run or review | `reports/` | `{date}-{skill}.md` |

If a document fits two places, pick by the question it answers: *why* → `decisions/`, *how to build* → `specs/`, *what it is now* → `wiki/`, *what happened* → `retros/`.

## Current documents

| Area | Document |
|---|---|
| Decisions | [0001 git-standards Mode 4](decisions/0001-add-git-standards-mode-4.md) · [0002 spec-quality-lifecycle Mode 6](decisions/0002-add-spec-quality-lifecycle-standard-mode-6.md) · [ADR-001 skill naming](decisions/ADR-001-skill-naming-convention.md) · [0006 ui-locator-wait-standard](decisions/0006-add-ui-locator-wait-standard.md) |
| Specs | [Security for AI-assisted automation frameworks](specs/security-ai-framework.md) |
| Wiki | [AI governance](wiki/ai-governance.md) · [Getting started with Claude](wiki/getting-started-claude.md) · [Dual-agent setup](wiki/dual-agent-setup.md) · [Init script](wiki/init-script.md) |
| Wiki — API | [demoqa API layer](wiki/api/demoqa-api-layer.md) |
| Agents | [Skill reference (Claude)](agents/claude/skill-reference.md) |
| Test cases — demoqa | [Book Store CRUD (UI)](test-cases/demoqa/book-store-crud-test-cases.md) · [Book Store CRUD (API)](test-cases/demoqa/book-store-api-crud-test-cases.md) |
| Skill meta-prompts | [automation-architect](skills/automation-architect-skill-prompt.md) · [hub context update](skills/hub-context-update-prompt.md) · [git-conventions](skills/git-conventions-prompt.md) · [git-workflow-docs](skills/git-workflow-docs-standard-prompt.md) · [spec-standards](skills/spec-standards-prompt.md) · [spec-organisation](skills/spec-organisation-standard-prompt.md) · [spec-quality-lifecycle](skills/spec-quality-lifecycle-standard-prompt.md) · [ui-locator-wait](skills/ui-locator-wait-standard-prompt.md) · [api-setup-teardown](skills/api-setup-teardown-standard-prompt.md) · [living-docs](skills/living-docs-prompt.md) · [README update](skills/readme-update-prompt.md) · [AI automation SDLC onboarding](skills/ai-automation-sdlc-onboarding-prompt.md) |
| Retros | [spec-quality-lifecycle skill notes (rules R1–R12, TC02, API layer)](retros/notes_lifecycle-architect-skill-prompt.md) · [Certificate fix](retros/notes_fixCertificate.md) · [TC02 fix](retros/notes_Fix_TC02-add-book-to-collection.md) |

## Conventions

- **`decisions/`** — append-only. Do not edit an accepted ADR; add a new one that supersedes it.
- **`wiki/`** — living documentation; update it in the same change as the code. One file per layer or site.
- **`skills/`** — update the meta-prompt first, then the skill, then the test that uses the rule.
- **`test-cases/`** — one subfolder per site; one file per feature area; one entry per TC (`TC{N}`).
- **`retros/`** — written after the fact; record the symptom, the cause, the fix and the evidence (commands run and results).
- **`course/`** — read-only course material, do not edit.
- Link with relative paths. Name files in lowercase kebab-case (except ADRs and `README.md`).
- Do not paste secrets, credentials or tokens into any doc (see [security spec](specs/security-ai-framework.md)).

## Keeping docs in sync

| When this changes… | Update… |
|---|---|
| `src/api/sites/<site>/` | `wiki/api/<site>-api-layer.md` |
| a spec under `test/ui/**/sites/<site>/` | `test-cases/<site>/` |
| a skill's rules or modes | `skills/<skill>-prompt.md`, then `.claude/skills/<skill>/SKILL.md`, then `agents/claude/skill-reference.md` |
| the folder layout of `src/` or `test/` | `wiki/`, `.claude/skills/automation-architect/SKILL.md` |
| an architectural choice | add a new file in `decisions/` |

The full trigger map is in [skills/living-docs-prompt.md](skills/living-docs-prompt.md).

## Known gaps

- Many moved documents still mention older paths (flat `tests/`, `src/api/client/`, `controllers/`); they are being aligned one by one. The code is the source of truth: the API layer is `src/api/client/ApiClient.ts` plus per-site `endpoints/`, `models/` and `controllers/` under `src/api/sites/<site>/`.
- `docs/wiki/api/` only documents demoqa; `wiki/framework/` and `reports/` are empty.
