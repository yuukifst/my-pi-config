# Agent Memory System

How agents read, write, and maintain persistent memory across sessions.

## Files and what goes where

| File | Put this in it |
|---|---|
| `INDEX.md` | Table of all memory files with summaries and last-modified dates. Update after every write. Read first every session. |
| `codebase.md` | Verified architecture facts: module layout, key files at specific paths, dependency chains, naming conventions. Not speculation. |
| `patterns.md` | Reusable strategies: proven workflows, command sequences, how-to guides. "To add a new agent, copy `agents/base.py`, decorate with `@AgentRegistry.register`, import in `__init__.py`." |
| `errors.md` | Error patterns with root cause + fix. "Ollama OOM on entity extraction → reduce `max_tokens_per_page` to 1024." Not "I got an error" — the diagnosis. |

## Entry format

Every entry must have date and context tag:

```
### [Topic] — 2026-06-27 (Ollama timeout)
```

Undated entries are untrustworthy. Entries >3 months old should be re-verified during dreaming.

## When to write

Write only when it would save a future session ≥5 minutes:
- Non-obvious architecture fact (hidden dependency, implicit convention)
- Task required ≥3 attempts to get right
- Command sequence that worked and would be hard to rediscover
- Error with unobvious root cause + verified fix
- Tool/API behaved differently than documented

Never write:
- Fixes already in docs or code comments
- Trivial one-liners with obvious cause
- Guesses or speculation
- API keys, tokens, passwords, or PII

## Dreaming (memory consolidation)

Run as a separate session. Steps:
1. Read `INDEX.md` first
2. Read all memory files
3. Find and merge duplicates
4. Extract patterns across entries → promote to patterns.md
5. Check staleness: entries >3 months, paths that no longer exist
6. Verify accuracy: grep/glob to confirm file paths and patterns still valid
7. Produce a diff for human review — do NOT auto-apply
8. Rebuild `INDEX.md`

Template: `~/.config/opencode/dreaming.md`. Trigger after 5+ sessions or when errors.md has 20+ entries.

## Permission model (implicit)

- `.opencode/memory/` files: agent can read and write
- `CLAUDE.md`, ADRs, project docs: read only (human-curated)
- No secrets ever in memory files

## Anti-patterns

- Writing trivia ("ran npm install")
- Speculation ("I think the frontend uses Redux")
- Stale entries never re-verified
- Using memory instead of reading code
