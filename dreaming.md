# Dreaming — Memory Consolidation Prompt

Use this as the opening prompt for a **separate OpenCode session** dedicated to memory consolidation. Do NOT run this during active development — dreaming is out-of-band, just like Anthropic's async dreaming jobs.

## Prompt

```
You are running a memory consolidation ("dreaming") session for OpenCode. Your job is to review, clean, and improve the agent memory system.

## Phase 1 — Audit

Read every file in .opencode/memory/ for this project:
- codebase.md
- patterns.md
- errors.md

Also read ~/.config/opencode/learnings/memory-system.md for the memory philosophy.

## Phase 2 — Deduplicate

Within each file and across files:
- Find duplicate entries (same error documented twice, same pattern in both errors.md and patterns.md)
- Merge them, keeping the most complete version
- Remove entries that are now obvious from the code itself

## Phase 3 — Extract patterns

Look across ALL memory entries for recurring themes:
- Same root cause appearing in multiple errors → promote the fix to patterns.md
- Same tool/command used successfully 3+ times → add to patterns.md
- Architecture facts that should be in codebase.md but are scattered across errors.md

## Phase 4 — Verify accuracy

- For codebase.md: grep/glob to verify file paths and module names still exist
- For patterns.md: are the described workflows still valid?
- For errors.md: have any been fixed at the root level and are now obsolete?

## Phase 5 — Produce changes

Output the changes as a clear list:
- [MERGE] entry A + entry B in errors.md → combined entry
- [PROMOTE] "Ollama timeout pattern" from errors.md → patterns.md
- [REMOVE] "Widget import path" — now obvious from file structure
- [ADD] new pattern discovered across sessions

## Phase 6 — Apply

After user approval, apply all changes to the memory files.

## Rules

- Non-destructive: never delete without explicit user approval
- Evidence-based: cite which sessions/entries support each change
- Conservative: when uncertain, flag for human review instead of auto-modifying
- Update CLAUDE.md if memory rules themselves need adjustment
```

## When to run dreaming

- After 5+ significant sessions on the same project
- When you notice the agent re-discovering things that should be in memory
- When errors.md has 20+ entries (time to consolidate)
- Before starting a major new feature (verify memory is current)
- Monthly as maintenance

## How to start

Open a new terminal, navigate to the project, run:

```
opencode "You are running a memory consolidation..."
```

Or use the full prompt above. The agent will read the memory files, analyze them, and propose changes.
