---
name: autoreview
description: "Use when running a closeout code review before commit/ship — after non-trivial edits, or when the user asks for a code review, second-model review, or autoreview of a local branch or PR. Claude Code and OpenCode."
---

# Auto Review

Closeout code-review pass before final/commit/ship. This is code review, not approval routing.

Default reviewer is **Claude** (the session model). A second engine is opt-in for a panel — never switch the requested engine silently.

Use when:

- user asks for a code review / autoreview / second-model review
- after non-trivial code edits, before final/commit/ship
- reviewing a local branch or PR branch after fixes

## Contract

- Treat review output as **advisory**. Never blindly apply it.
- Verify every finding by reading the real code path and adjacent files before acting on it.
- Read dependency docs/source/types when a finding depends on external behavior.
- Reject unrealistic edge cases, speculative risks, broad rewrites, and fixes that over-complicate the code.
- Prefer small fixes at the right ownership boundary; no refactor unless it clearly improves the bug class.
- Loop until the review returns no accepted/actionable findings.
- If a review-triggered fix changes code, rerun focused tests and rerun the review.
- Security perspective is always included, but must not cripple legitimate functionality. Report a security finding only when the change creates a concrete, actionable risk or removes an important safety check.
- If you reject a finding as intentional, add a brief inline comment only when it documents a real invariant or ownership decision a future reviewer should know.
- Do not push just to review. Push only when the user asked to push/ship/update the PR.
- Stop as soon as the review is clean. Do not run an extra pass for a nicer "clean" line or a redundant second opinion.

## Pick Target

Build the diff from git, then review that bundle. Pick the smallest target that covers the change.

Dirty local work (unstaged/staged/untracked in the current checkout):

```bash
git diff HEAD          # + git status for untracked
```

Branch / PR work — diff against the real base:

```bash
base=$(gh pr view --json baseRefName --jq .baseRefName 2>/dev/null || echo main)
git diff "origin/$base"...HEAD
```

Already-landed single commit:

```bash
git show HEAD
```

Reviewing a clean branch against its own base is usually an empty diff after push — review the commit(s) or the branch before merge, not `main` vs `origin/main`.

## Running the review

**Claude Code** — two equivalent paths:

1. Built-in slash command on the current diff:

   ```text
   /code-review            # add --comment to post inline PR comments, --fix to apply
   ```

2. Dispatch a reviewer subagent (Task tool) with the diff bundle + this Contract as the brief. Good agent choices: `caveman:cavecrew-reviewer` (terse, severity-tagged) or `thermo-nuclear-code-quality-review` (deep quality audit). The main agent still verifies every accepted finding before fixing.

**OpenCode** — run its review command / a reviewer subagent against the same git diff bundle, applying the identical Contract.

Keep target selection, the review call, and the accept/reject decision in one path. If output is noisy, summarize it after it returns; don't ask another agent to rerun the whole review.

## Panels (opt-in)

Use a second engine only when explicitly requested or when risk justifies the spend. Run both reviewers against the **same frozen diff bundle**, then the main agent reconciles — verifying each accepted finding against real code before fixing.

```text
Reviewer 1: Claude (session model)
Reviewer 2: a second model/engine, only if asked
```

## Parallel closeout

Format first if formatting can move line locations, then tests and review may run in parallel. Tests may force code changes that stale the review — if either leads to edits, rerun the affected tests and rerun review until clean, then stop.

## Final report

Include:

- review path used (`/code-review`, subagent, or panel) and the target diff
- tests / proof run
- findings accepted vs rejected, briefly why
- the clean result of the final review run, or why a remaining finding was consciously rejected

Do not run another review solely to improve the report wording. If the final run was clean, report that run.
