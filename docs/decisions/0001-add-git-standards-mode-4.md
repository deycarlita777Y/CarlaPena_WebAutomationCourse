# ADR 0001 — Add `git-standards` skill and hub Mode 4

Status: Accepted

## Gap
No existing skill or mode covers git workflow: branch names, commit message format, and the commit → push → PR sequence. Modes 1–3 only inspect or generate code files.

## Options considered
1. **Extend Mode 2 (structure check)** — rejected. It checks files and imports; git history is a different domain (Hub Growth Policy rule 3).
2. **Put git rules directly in the hub** — rejected. It would bloat `SKILL.md` and prevent standalone use.
3. **New independent skill `git-standards` + thin Mode 4 wrapper** — chosen. Matches how `pom-architect`, `test-standards` and `spec-standards` are wired.

## Decision
Create `.claude/skills/git-standards/SKILL.md` (Validate + Execute) and add Mode 4 to `automation-architect` that only delegates. Mode count after change: 4 of the 10 allowed.
