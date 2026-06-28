# Agent Workflow Patterns

Non-obvious patterns for working with code agents (extracted from Anthropic's best-practices workshop).

## Before coding

- **Plan first for complex tasks.** "Here's a bug — search the codebase and give me a plan" not "Fix this bug."
- **Fresh session for new domains.** After 30+ turns, context accumulates and drifts. Start a new session; memory store preserves learnings.

## During coding

- **Generate-evaluate-repair.** Produce a fix → run lint/tests → repair only failures. Don't critique and generate simultaneously.
- **Check work before showing.** Run lint/typecheck on your output before presenting it.
- **Commit after each feature chunk.** Not after hours of work. Review diffs before committing.

## Multiple agents

- **Shared state via `.opencode/memory/`.** Multiple sessions read/write the same memory files. No other coordination needed.
- **Independent tasks = parallel sessions.** Use `dispatching-parallel-agents` skill or separate terminals.

## CLAUDE.md maintenance

- Periodically review for stale instructions (prompt hygiene).
- Test: has every rule been relevant in the last 10 sessions? No → remove or move to conditional sub-file.
- Use conditional pointers (`Read X before doing Y, otherwise skip`) for domain-specific rules.
