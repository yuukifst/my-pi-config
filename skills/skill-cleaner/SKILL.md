---
name: skill-cleaner
description: "Audit Claude Code skills: loaded roots, duplicate skills, unused personal skills, prompt-budget costs, compact descriptions."
---

# Skill Cleaner

Use when trimming skill prompt budget, finding duplicate skills, auditing enabled/disabled roots, or deciding which skills/plugins to remove.

## Workflow

1. Run the analyzer:

```bash
node --experimental-strip-types "C:\Users\tisao\.claude\skills\skill-cleaner\scripts\skill-cleaner.ts" --months 3
```

Useful variants:

```bash
# No log scanning (faster)
node --experimental-strip-types "...\skill-cleaner.ts" --no-logs

# Extended log history
node --experimental-strip-types "...\skill-cleaner.ts" --months 6 --max-log-mb 800 --deep-logs

# Override context window
node --experimental-strip-types "...\skill-cleaner.ts" --context-tokens 200000 --budget-percent 2 --no-logs

# Add extra root (e.g. project skills)
node --experimental-strip-types "...\skill-cleaner.ts" --root ~/path/to/extra/skills --no-logs
```

2. Read the report in this order:
- `Skill Budget`: Claude model context size, 2% skills budget, budgeted usage, and pre-budget full-list pressure.
- `Description candidates`: long descriptions where relaxed grammar saves prompt budget.
- `Duplicates`: same skill name or near-identical body across personal (`~/.claude/skills/`) and plugin cache (`~/.claude/plugins/cache/`).
- `Unused candidates`: personal skills with no recent Skill tool invocation, `$skill` mention, or `SKILL.md` read in `~/.claude/sessions/` logs. Plugin bundle skills are excluded (they're enabled as a whole).
- `Root summary`: where skills came from and how many are enabled vs disabled (uninstalled plugins).

3. Before deleting or editing:
- Verify the kept copy exists and is loaded.
- Prefer deleting personal `~/.claude/skills/` copies when a plugin version covers the same capability with more features.
- Preserve trigger nouns in descriptions: product, tool, action, object.

## Analyzer Notes

- Scans `~/.claude/skills/` (personal) and `~/.claude/plugins/cache/` (installed plugins).
- Plugin skill enabled = its `installPath` is in `~/.claude/plugins/installed_plugins.json`. Skills from old cached versions are marked disabled.
- Plugin prefix derived from cache path: `cache/<marketplace>/<plugin>/<version>/skills/<name>/SKILL.md` → prefix is `<plugin>`.
- Default model: `claude-sonnet-4-6` (200k context). Override: `--model claude-opus-4-8` or `--context-tokens N`.
- Budget rule: `ceil(utf8_bytes / 4)` tokens, 2% of context window.
- Log scanning: `~/.claude/history.jsonl` + `~/.claude/sessions/**/*.jsonl`. Detects Skill tool calls (`"skill": "name"`), `$skill` tokens, and `SKILL.md` file reads.
- Usage scores are heuristic — all-zero means "no log evidence", not "never used". Log files must exist and be recent.
- `--deep-logs` also scans `~/.claude/archived_sessions/`.
- `--root <path>` adds extra skill roots (e.g. per-project `.claude/skills/`).

## Output Policy

- Suggest first; edit only when the user asks.
- If asked to apply cleanup, make small grouped changes: descriptions first, then deletes.
- Do not delete plugin skills — uninstall the plugin instead.
- Do not delete personal skills without confirming they are not the only copy of important logic.
