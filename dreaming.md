# Dreaming — Memory Consolidation Prompt

Use this as the opening prompt for a **separate OpenCode session** dedicated to memory consolidation. Do NOT run this during active development — dreaming is out-of-band, just like Anthropic's async dreaming jobs.

## Prompt

```
You are running a memory consolidation ("dreaming") session for OpenCode. Your job is to review, clean, and improve the agent memory system.

## Phase 1 — Audit

Read .opencode/memory/INDEX.md first to understand what exists and when each file was last modified.

Then read every memory file:
- INDEX.md
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

## Phase 4 — Check staleness

For every entry in every memory file:
- Entries older than 3 months: grep/glob to verify they still apply
- File paths that no longer exist → mark [STALE], suggest removal
- Patterns that reference removed APIs/functions → update or remove
- Commands that have changed (e.g. renamed scripts) → update

Staleness check prevents "rot" — memory that was accurate in June but lies in October.

## Phase 5 — Verify accuracy

- For codebase.md: grep/glob to verify file paths and module names still exist
- For patterns.md: are the described workflows still valid?
- For errors.md: have any been fixed at the root level and are now obsolete?

## Phase 6 — Produce changes

Output the changes as a clear list for HUMAN REVIEW before applying:
- [MERGE] entry A + entry B in errors.md → combined entry
- [PROMOTE] "Ollama timeout pattern" from errors.md → patterns.md
- [REMOVE] "Widget import path" — now obvious from file structure
- [REMOVE/STALE] "Docker setup steps" — paths changed, no longer accurate
- [ADD] new pattern discovered across sessions

## Phase 7 — Rebuild INDEX.md

Update INDEX.md to reflect all changes: new last-modified dates, added/removed entries, updated summaries.

## Phase 8 — Apply

After user approval of the proposed diff, apply all changes to the memory files. Do NOT auto-apply — dreaming is non-destructive and human-in-the-loop, exactly like Anthropic's output memory store clone workflow.

## Rules

- Non-destructive: never delete without explicit user approval
- Human-in-the-loop: output is a proposed diff, user applies it
- Evidence-based: cite which sessions/entries support each change
- Conservative: when uncertain, flag for human review instead of auto-modifying
- Update CLAUDE.md if memory rules themselves need adjustment
- After applying, update INDEX.md as the last step
```

## When to run dreaming

- After 5+ significant sessions on the same project
- When you notice the agent re-discovering things that should be in memory
- When errors.md has 20+ entries (time to consolidate)
- Before starting a major new feature (verify memory is current)
- **Triggered by events:** after completing a major task, before a deployment, after a bug that took multiple sessions to fix
- Monthly as maintenance

Anthropic's design supports ad hoc, nightly, hourly, or event-triggered (end of session) dreaming. For OpenCode, the manual equivalent: run dreaming when you notice a pattern of inefficiency or after completing significant work.

## Real-world impact

Harvey (legal AI) saw a **6x increase in completion rates** for their legal benchmark after adopting dreaming. The pattern is consistent: dreaming finds cross-session patterns that individual agents miss, producing a step-change in performance.

## Token efficiency

Anthropic's dreaming achieves ~95% cache hit rate because most processing is agentic and repetitive. The initial investment in curation pays dividends: downstream agents spend fewer tokens re-discovering information. Same principle applies to OpenCode dreaming — the session uses significant tokens once, but all subsequent sessions benefit from cleaner, faster memory access.

## Architecture note: dream harness

Anthropic's dreaming harness spawns one sub-agent per input session for exhaustive parallel analysis. An orchestrator coordinates them. For OpenCode, the dreaming session itself acts as the single orchestrator reviewing all memory files — sufficient for project-scale memory stores.

## How to start

Open a new terminal, navigate to the project, run:

```
opencode "You are running a memory consolidation..."
```

Or use the full prompt above. The agent will read the memory files, analyze them, and propose changes.
