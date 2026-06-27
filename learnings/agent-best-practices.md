# Agent Best Practices — Adapted for OpenCode

Synthesized from Anthropic's "Claude Code best practices" workshop by Cal (Applied AI team). Extracts the patterns that apply directly to OpenCode usage.

## CLAUDE.md is the foundation

The single highest-leverage practice: maintain a good CLAUDE.md.

**What it must contain:**
- How to run tests (exact commands)
- How to lint/typecheck (exact commands)
- Project structure overview (where things live)
- Code conventions (naming, patterns, style)
- Tool preferences (which MCP/tool to use for what)

**Why it matters:** CLAUDE.md is the "stable form" mentioned in prompting best practices — cached, always present, and the first thing the agent sees. Every session inherits it.

## Planning before coding

**Anti-pattern:** "Fix this bug." → agent jumps to editing without understanding.

**Better:** "Here's a bug in `calculateTotal`. Search the codebase, read the callers, and give me a plan to fix it." → agent explores, then presents a plan.

**OpenCode equivalent:** Use Plan mode for complex tasks. Ask the agent to explore first, plan second, execute third. The CLAUDE.md `## Working method` section already encodes "state assumptions" and "ask before coding" — this reinforces that.

## Context window awareness

OpenCode sessions accumulate context over time. In very long sessions (>30 turns of complex work):

- The agent should consider whether context is stale or contradictory
- If the session drifts from the original task, compact/reset
- The CLAUDE.md `## Agent Memory` system partially solves this — memory persists even when context window is fresh

**Pattern:** When starting a new major task in the same project after a long session, open a new session. The memory store provides continuity.

## Permission management (OpenCode equivalent)

Claude Code has auto-accept modes for frequently run commands. OpenCode's equivalent:
- Use `/help` to understand what commands are available
- Trust the agent with routine file reads; verify writes
- For sensitive operations (git push, rm, secrets), always review

## Multiple agents / parallel work

The video mentions running multiple Claude instances with shared markdown files for context.

**OpenCode equivalent:**
- Use `dispatching-parallel-agents` skill for independent tasks
- The `.opencode/memory/` system IS the shared markdown file — multiple sessions read/write the same memory store
- For truly independent tasks, launch separate terminal sessions

## Commit hygiene

"Regular commits help safeguard against deviations from the intended path."

Applied to OpenCode:
- Commit after each completed feature chunk, not after hours of work
- Write Conventional Commits (already in the git rules)
- Review diffs before committing — the agent should show what changed

## Monitoring and control

"Escape is your best friend." — The user should watch the agent's actions and interrupt if it goes wrong.

**OpenCode equivalent:**
- The agent logs its actions — the user should skim the output
- If the agent loops or goes in the wrong direction, stop it and redirect
- Don't let the agent work unattended for long stretches on complex tasks

## IDE integrations

Claude Code now integrates with VS Code and JetBrains, recognizing the currently open file. OpenCode's equivalent:
- OpenCode knows the project directory context
- The CLAUDE.md and memory files establish file-level understanding
- LSP support means the agent can navigate code structures

## TDD not always mandatory

The original video recommends TDD. The user's CLAUDE.md explicitly disables TDD: "No TDD / test-first." This is correct — the user's preference overrides. Write implementation first, add regression tests after.

## Comments discipline

"The model loves to leave comments." The CLAUDE.md already contains output rules against unnecessary comments. If the agent still adds comments, strengthen the instruction or add a memory entry documenting the pattern.

## Stay updated

The Anthropic workshop recommends checking changelogs regularly. For OpenCode:
- Check `~/.config/opencode/` for new skill versions
- Run `opencode --version` to stay current
- New thinking capabilities (extended thinking between tool calls) improve with each release
