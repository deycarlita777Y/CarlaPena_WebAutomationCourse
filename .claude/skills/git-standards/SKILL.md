---
name: git-standards
description: Enforce and execute git workflow conventions for Playwright + TypeScript projects. Two capabilities - Validate (read-only check of branch name, commit format, feat/fix coverage, README sync) and Execute (create branch, commit, push, open PR following the conventions). Load when the user says "check git", "verify commits", "git conventions", "pre-PR check", "create branch", "commit", "push", "create PR" or "git workflow", or invoke through automation-architect Mode 4.
---

# git-standards

Validate branch and commit conventions (read-only), or execute git operations that follow them.

Domain split (do not overlap):

| Skill | Owns |
|---|---|
| `pom-architect` | Page Object layer structure |
| `test-standards` | Spec code quality — imports, fixtures, credentials, framework |
| `spec-standards` | Spec organisation — folders, file names, TC IDs, `test.step()` |
| `git-standards` | Git workflow — branch names, commit messages, push, PR |

## Project context

- Branch pattern: `(test|fix)/<kebab-case-scope>` — `test/` = new test cases, `fix/` = defect corrections.
- Commits follow Conventional Commits: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `chore`, `docs`
  - Scope optional; kebab-case when present
  - Description starts lowercase, no trailing period
  - Only the **subject line** is validated. A `Co-Authored-By:` trailer in the body is expected and is not a violation.
- Every branch needs at least one `feat` or `fix` commit before merging.
- PR base is always `main`. Never push to `main`/`master`.
- Remote is GitHub; PRs are created with the `gh` CLI.
- The shell on this machine is Windows. Commands below work in both PowerShell and Git Bash unless a variant is noted.

## Safety rules (non-negotiable)

- Never push to `main` or `master`.
- Never `--force` / `--force-with-lease` without explicit user confirmation in the current conversation.
- Never `--no-verify`, `--no-gpg-sign`, or otherwise bypass hooks.
- Never amend a commit that is already on the remote.
- Stage named files only — never `git add .`, `git add -A` or `git commit -a`.
- Run Validate before any write operation, and stop if it reports an ERROR.
- Never run interactive git (`rebase -i`, `add -i`) — Claude Code cannot drive an editor. Use the non-interactive alternatives in the fix table.
- Do not commit, push or open a PR unless the user asked for that specific step (a request for "validate" never implies a write).

## Capability 1 — Validate (read-only)

**Triggers:** "check git", "verify commits", "git conventions", "pre-PR check"

Never modifies commits, branches or files. Gather state with these read-only commands (run independent ones in parallel):

```bash
git branch --show-current
git log origin/main..HEAD --format=%s      # fallback if origin/main is missing: main..HEAD
git diff origin/main...HEAD --name-only    # fallback: main...HEAD
git status --short
```

If the current branch is `main`, report C2 as a violation and stop — there is no branch range to validate.

### C1 — COMMIT_FORMAT (ERROR)

Every subject must match:

```
^(feat|fix|refactor|chore|docs)(\([a-z0-9][a-z0-9-]*\))?: [a-z].+[^.]$
```

| Valid | Invalid | Why |
|---|---|---|
| `feat(tc8): add products page verification` | `Added products test` | no type |
| `fix(login): correct redirect after logout` | `feat: Added products test` | uppercase description |
| `chore: update playwright version` | `fix: correct redirect.` | trailing period |
| `refactor(products): extract search method` | `Feature(tc8): add products page` | type not lowercase |

### C2 — BRANCH_NAME (ERROR)

Current branch must match `^(test|fix)/[a-z0-9][a-z0-9-]*$`.

Valid: `test/tc8-verify-products`, `fix/login-redirect`. Invalid: `feature/products` (prefix), `test/TC8_VerifyProducts` (case, underscore), `main` (no prefix), `fix/` (empty scope).

### C3 — SUBSTANTIVE_COMMIT (ERROR)

The branch has no `feat` or `fix` commit. A branch of only `chore`/`docs`/`refactor` is not mergeable.

### C4 — README_SYNC (WARNING)

The branch diff touches any of these but not `README.md`:

```
.claude/skills/**
playwright.config.ts
package.json
tsconfig.json
src/ui/pages/BasePage.ts
```

Warning only — the developer decides whether the change merits a README update. Suggest updating the README; if `automation-architect` has a README-sync mode (Mode 5), mention it, otherwise say the README must be updated manually. Do not edit the README from this skill.

### Output format

```
[git-standards] VALIDATE
──────────────────────────────────────
Branch name:      PASS | VIOLATION — <detail>
Commit format:    <N> valid / <N> invalid
  VIOLATION: "<raw subject>"
             — expected: type(scope): description
             — allowed types: feat, fix, refactor, chore, docs
Commit coverage:  PASS | VIOLATION — no feat or fix commit on this branch
README sync:      IN SYNC | WARNING — architectural files changed, README.md untouched
──────────────────────────────────────
[git-standards] ✅ Conventions valid — ready to push / open PR.
             OR
[git-standards] ⚠️  <N> issue(s) found — resolve before proceeding.
```

### Fix guidance (print when violations exist; do not apply during Validate)

| Violation | Fix |
|---|---|
| Bad branch name | `git branch -m <new-name>` (only if not pushed; otherwise create the new branch and tell the user) |
| Bad **last** commit message, **not pushed** | `git commit --amend -m "type(scope): description"` |
| Bad older commit message, not pushed | Ask the user to run `git rebase -i origin/main` themselves and `reword` the commits — Claude Code cannot drive the editor. |
| Bad commit already pushed | Do not rewrite. Add a corrective commit, or ask the user to approve a force-push explicitly. |
| No `feat`/`fix` commit | Add a `feat` or `fix` commit before pushing |

## Capability 2 — Execute (write operations)

Each operation validates first. Use `AskUserQuestion` when a required value (type, scope, files, description) cannot be inferred; otherwise infer and state what you inferred.

### E1 — Create branch

**Triggers:** "create branch", "new branch", "start branch"

1. Determine type (`test` or `fix`) and kebab-case scope (e.g. `tc8-verify-products`).
2. Check `{type}/{scope}` against C2 before creating.
3. `git checkout -b {type}/{scope}` — uncommitted changes carry over; mention that if the tree is dirty.

Output: `[git-standards] BRANCH CREATED — Branch: <name>`

### E2 — Commit

**Triggers:** "commit", "git commit", "create commit"

1. Validate C2 — stop if the branch name fails (and refuse on `main`).
2. `git status --short` and `git diff --cached --name-only`.
   - **Anything already staged that the user did not ask to include must be surfaced.** Pre-staged files (renames, earlier `git add`) go into the commit silently otherwise. Ask whether to include them or unstage them with `git restore --staged <file>`.
3. Decide files (explicit list), type, optional scope, and a lowercase imperative description with no period.
4. Validate the subject against the C1 regex before running anything.
5. `git add <file1> <file2> ...`
6. Commit with the attribution trailer the Claude Code session requires. Bash:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(tc8): add products page verification

   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
   EOF
   )"
   ```
   PowerShell:
   ```powershell
   git commit -m @'
   feat(tc8): add products page verification

   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
   '@
   ```
   (Use whatever attribution line the current session instructs; if none is given, omit the trailer.)
7. If a pre-commit hook fails, fix the cause and create a **new** commit — never `--amend` after a failed hook, never `--no-verify`.

Output: `[git-standards] COMMIT CREATED` with message and staged files.

### E3 — Push

**Triggers:** "push", "git push", "push branch"

1. Full Validate — stop on any ERROR.
2. Confirm with the user before pushing (outward-facing, hard to reverse) unless they already asked to push in this turn.
3. Tracking check — PowerShell needs the quotes around `@{u}`:
   ```bash
   git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
   ```
4. No upstream → `git push -u origin <branch>`; upstream exists → `git push`.

Output: `[git-standards] PUSHED — <branch> → origin/<branch>`

### E4 — Create PR

**Triggers:** "create PR", "open PR", "pull request", "new PR"

1. Full Validate — stop on any ERROR. Verify the branch is pushed (E3 first if not).
2. Confirm `gh` is available and authenticated: `gh auth status`. If `gh` is missing, stop and tell the user to install/authenticate it — do not fall back to anything else.
3. Gather metadata:
   - Title: last `feat`/`fix` commit subject on the branch.
   - Test cases: `test()` names in spec files changed in `git diff origin/main...HEAD --name-only`.
   - Changed files: same diff.
4. Create the PR with the body in a file or heredoc (avoids shell-quoting problems with backticks and newlines):
   ```bash
   gh pr create --base main --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   <description from feat/fix commits>

   ## Test Cases
   <TC{N}: names from changed spec files>

   ## Changes
   <new or modified files>

   ## Checklist
   - [ ] All tests pass locally
   - [ ] No hardcoded credentials
   - [ ] Spec files follow TC folder/naming conventions
   - [ ] Page Objects follow POM rules

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```
   In PowerShell use a single-quoted here-string assigned to `$body`, then `gh pr create ... --body $body`.
5. Never tick checklist boxes you did not verify. Leave them unchecked.

Output: `[git-standards] PR CREATED — Title / URL`

### E5 — Full workflow

**Triggers:** "git workflow", "commit push PR", "full git", "submit work"

validate → E2 commit → E3 push → E4 PR. Stop at the first failure and report which step it was. A single "submit work" request authorises all three writes, so no extra push confirmation is needed in this flow; the safety rules above still apply.

```
[git-standards] WORKFLOW COMPLETE
──────────────────────────────────────
Committed:  <subject>
Pushed:     <branch> → origin
PR:         <url>
──────────────────────────────────────
[git-standards] ✅ Work submitted — ready for review.
```
