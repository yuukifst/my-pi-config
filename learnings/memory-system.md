# Self-Learning Agent Memory System — Applied to OpenCode

Synthesized from Anthropic's "Memory and dreaming for self-learning agents" and "Agents that remember" workshops.

## Core insight

Agents operating in isolation waste effort. Every session reinvents understanding of the codebase, repeats mistakes, and fails to leverage strategies that worked in prior sessions. Memory persistence is the primitive that transforms a stateless agent into a self-learning one.

## The three-layer model (Anthropic)

| Layer | Anthropic API | OpenCode equivalent |
|---|---|---|
| **Storage** | Managed memory store API | `.opencode/memory/` directory with MD files |
| **Structure** | File-like organization, content types | `codebase.md`, `patterns.md`, `errors.md` |
| **Process** | Dreaming (async batch job) | Manual dreaming session via dreaming.md prompt |

## Memory files — what agents record

Agents write to these files at session end:

- **`codebase.md`** — Discovered architecture: module boundaries, key files, dependency chains, naming conventions. "This project has 16 agents communicating via `agent_tasks` table." Not speculation — only what was verified via grep/read.
- **`patterns.md`** — Reusable patterns: "To add a new agent, copy `agents/base.py`, register with `@AgentRegistry.register`, import in `__init__.py`." Also: successful command sequences, known workflow templates.
- **`errors.md`** — Error patterns with root cause + fix: "Ollama OOM on entity extraction → reduce `max_tokens_per_page` to 1024." Not "I got an error" — the diagnosis.

## Dreaming — memory consolidation

Dreaming is a **separate OpenCode session** that:

1. Reads all files in `.opencode/memory/` across projects
2. Finds duplicates (same error documented twice → merge)
3. Extracts patterns (3 sessions hit the same Ollama timeout → promote to `patterns.md`)
4. Verifies accuracy (does `codebase.md` still match the current file tree?)
5. Produces a consolidated diff — user reviews and approves

The dreaming prompt template lives at `~/.config/opencode/dreaming.md`.

Dreaming is non-destructive: it reads current memory, produces proposed changes, and the user applies them. Just like the Anthropic API clones the input memory store before modifying it.

## Why this works in OpenCode

1. **CLAUDE.md is injected into every system prompt.** Adding memory-read/write instructions there means the agent sees them in every session — no opt-in, no remembering to enable it.
2. **The agent already has Write/Edit/Bash tools.** It can create and update MD files. No new infrastructure needed.
3. **File system IS the memory store.** No API keys, no external service. Works offline.
4. **Git history is the version log.** Every memory change is tracked, revertible, attributable.

## Anti-patterns to avoid

- **Memory inflation:** Writing to memory after every trivial task ("fixed a typo"). Only write when something would help a future session.
- **Speculation in memory:** "I think the frontend uses Redux" — never write guesses. Only verified facts.
- **Stale memory:** Codebase evolves, memory files don't auto-update. Dreaming should verify accuracy.
- **Memory as crutch:** Memory supplements code reading, never replaces it. Always verify before trusting.

## When to memory-write

Write to memory when:
- You discovered a non-obvious architecture fact (hidden dependency, implicit convention)
- A task required ≥3 attempts to get right (the fix pattern is worth recording)
- A command sequence worked that you'd need to rediscover later
- You hit an error with an unobvious root cause
- A tool/API behaved differently than documented

Don't write when:
- The fix was in the docs already
- The task was trivial and the code is self-documenting
- It's a guess, not a verified finding
