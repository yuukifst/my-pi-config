# Self-Learning Agent Memory System — Applied to OpenCode

Synthesized from Anthropic's "Memory and dreaming for self-learning agents" and "Agents that remember" workshops.

## Core insight

Agents operating in isolation waste effort. Every session reinvents understanding of the codebase, repeats mistakes, and fails to leverage strategies that worked in prior sessions. Memory persistence is the primitive that transforms a stateless agent into a self-learning one.

## The three-layer model (Anthropic)

| Layer | Anthropic API | OpenCode equivalent |
|---|---|---|
| **Storage** | Managed memory store API, permission scopes, optimistic concurrency | `.opencode/memory/` directory with MD files, git for versioning |
| **Structure** | File-like organization, index files, content taxonomy | `INDEX.md` (navigation map), `codebase.md`, `patterns.md`, `errors.md` |
| **Process** | Dreaming (async batch job, multi-agent harness) | Manual dreaming session via `dreaming.md`, human-in-the-loop review |

## Memory file taxonomy (expanded)

| File | Purpose | Writable by agent | Readable by agent |
|---|---|---|---|
| `INDEX.md` | Navigation map: lists all memory files with summaries, last-modified dates | After each write to other files | Always, first thing |
| `codebase.md` | Discovered architecture: modules, dependencies, conventions | Verified facts only | Yes |
| `patterns.md` | Reusable strategies, proven workflows, command sequences | Yes | Yes |
| `errors.md` | Error patterns with root cause + fix | Yes | Yes |

**INDEX.md is the shortcut.** Instead of reading all 3 memory files every session, the agent reads INDEX.md first (small, fast) and only reads the files relevant to the current task. This mirrors Anthropic's design: "the first thing it does is see that note in its memory store that says 'we already did this investigation'."

## Memory entry metadata

Every entry should include context for future sessions:

```
### [Topic] — added 2026-06-27 (Ollama timeout pattern)
```

Format: title, date added, brief context tag. Dates enable staleness detection: entries older than 3 months should be re-verified during dreaming.

## Memory files — what agents record

Agents write to these files at session end:

- **`codebase.md`** — Discovered architecture: module boundaries, key files, dependency chains, naming conventions. "This project has 16 agents communicating via `agent_tasks` table." Not speculation — only what was verified via grep/read.
- **`patterns.md`** — Reusable patterns: "To add a new agent, copy `agents/base.py`, register with `@AgentRegistry.register`, import in `__init__.py`." Also: successful command sequences, known workflow templates.
- **`errors.md`** — Error patterns with root cause + fix: "Ollama OOM on entity extraction → reduce `max_tokens_per_page` to 1024." Not "I got an error" — the diagnosis.
- **`INDEX.md`** — Updated after every write. Keeps a compact table of what's in each file with last-modified dates.

## Dreaming — memory consolidation

Dreaming is a **separate OpenCode session** that:

1. Reads `INDEX.md` first to know what exists
2. Reads all memory files
3. Finds duplicates (same error documented twice → merge)
4. Extracts patterns (3 sessions hit the same Ollama timeout → promote to `patterns.md`)
5. Checks staleness (entries >3 months old, code paths that no longer exist)
6. Verifies accuracy (does `codebase.md` still match the current file tree?)
7. Produces a consolidated diff — user reviews and approves (human-in-the-loop QA)
8. Rebuilds `INDEX.md` to reflect changes

The dreaming prompt template lives at `~/.config/opencode/dreaming.md`.

Dreaming is non-destructive: it reads current memory, produces proposed changes as a diff, and the user applies them after review. Just like the Anthropic API clones the input memory store before modifying it, and just like their human-in-the-loop review for error detection.

### Why dreaming is out-of-band

Dreaming runs as a separate session because:
- It doesn't block active development
- It can look across multiple sessions simultaneously (like Anthropic's multi-agent harness)
- Memory quality becomes its own objective, separate from task performance
- It reduces latency — no in-band memory cleanup slows down the current task

## Real-world impact

Anthropic reported that teams using the memory system achieved a **90% reduction in initial mistakes** (Rakuten use case). Applied to OpenCode: the agent stops re-discovering which command to run, which file to edit, and which error fix to apply — because it's in memory.

## Why this works in OpenCode

1. **CLAUDE.md is injected into every system prompt.** Adding memory-read/write instructions there means the agent sees them in every session — no opt-in, no remembering to enable it.
2. **The agent already has Write/Edit/Bash tools.** It can create and update MD files. No new infrastructure needed.
3. **File system IS the memory store.** No API keys, no external service. Works offline.
4. **Git history is the version log.** Every memory change is tracked, revertible, attributable. This is the equivalent of Anthropic's version history + audit log.

## Anti-patterns to avoid

- **Memory inflation:** Writing to memory after every trivial task ("fixed a typo"). Only write when something would help a future session.
- **Speculation in memory:** "I think the frontend uses Redux" — never write guesses. Only verified facts.
- **Stale memory:** Codebase evolves, memory files don't auto-update. Dreaming should verify accuracy. Entries >3 months old get re-checked.
- **Memory as crutch:** Memory supplements code reading, never replaces it. Always verify before trusting.
- **Memory without metadata:** Undated, contextless entries are hard to trust. Always include date and brief context.

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
