# CLAUDE.md — Global

Cross-project guidance. Lean by design: only what's non-obvious or machine-specific. Project `CLAUDE.md` overrides this; for generic best-practice the model already knows, trust the model. For trivial tasks, use judgment over ceremony.

## Output

- Read files before editing; don't re-read unchanged files.
- Concise output, thorough reasoning. No sycophantic openers/closers, no emojis, no em-dashes. Plain "Done", never "✅ Done".
- Never guess APIs, versions, flags, SHAs, or package names — verify in code/docs first.
- Don't print full files back; show diffs with `...` for omitted parts.
- When writing or substantially editing long Markdown files, put each full sentence on its own line.
- Never manually modify CHANGELOG.md files or any files marked as auto-generated.

## Working method

- State assumptions; if uncertain or ambiguous, ask before coding. Surface tradeoffs, don't pick silently.
- Simplest code that solves it. No speculative features, abstractions, or config not asked for.
- Surgical: touch only what the request needs. Match existing style. Remove only orphans *your* change created; flag pre-existing dead code, don't delete it.
- Turn tasks into verifiable goals with a clear success check; for refactors, keep existing tests green before and after.
- **Generate-evaluate-repair loop for debugging:** produce a fix → run tests/lint → repair only failures → repeat until clean. Don't critique and generate simultaneously.
- **Check your work before outputting.** After generating code or edits, run lint/typecheck on your own output before showing it. Verify files are valid, diffs apply correctly.
- **No TDD / test-first.** Do NOT use the superpowers `test-driven-development` skill or any red-green-refactor flow. Write the implementation first; add a regression test after a bugfix. This overrides any skill that says "always TDD".
- Same error twice → stop, show error, ask one question. Never install packages to fix errors.
- When making technical decisions, prefer quality, simplicity, robustness, scalability, and long-term maintainability over development cost.
- **Bug fixes:** reproduce the bug in an E2E setting first, as close to how an end user experiences it. This ensures you find the real problem, not a symptom.
- **Lint/test hygiene:** if you see a lint failure, test failure, or test flakiness, fix it — even if it wasn't caused by your change. Leave the codebase cleaner than you found it.
- **UI work:** be obsessive about pixel perfection. If something looks off, even if unrelated to your task, try to fix it along the way.

## Code rules (override model defaults)

- **Before a helper:** grep for the canonical one. Duplicating an existing helper is a failure, not a nit.
- **File > 1000 lines = decompose first**, don't append.
- **Types explicit:** no `any`, no `@ts-ignore`, no `as X` papering over an invariant. No `T | undefined` on always-set fields.
- **Tests:** cover bugfixes with a regression test. Mock external I/O with named fakes.

## Tools (machine-specific)

- **code-review-graph MCP before Grep/Glob/Read** when the project has it — faster, gives callers/dependents/coverage. Fall back only when the graph doesn't cover the need.
  - Explore: `semantic_search_nodes` / `query_graph`. Impact: `get_impact_radius`. Review: `detect_changes` + `get_review_context`. Architecture: `get_architecture_overview`.
- **fff MCP for file search/grep** in a git-indexed dir — prefer `ffgrep`/`fffind`/`fff-multi-grep` over spawning ripgrep/fzf (in-memory index, frecency-ranked, typo-tolerant). Configured for Claude Code + OpenCode. After code-review-graph, before raw Grep/Glob.
- **gh-axi for GitHub ops** — prefer `gh-axi` (subcommands `issue`/`pr`/`run`/`workflow`/`release`/`repo`/`label`/`search`/`api`) over plain `gh`: AXI-format output, ~50% fewer tokens and fewer turns at same task success. Uses the existing `gh auth login` session. Fall back to raw `gh` only for what gh-axi doesn't cover.
- **RTK:** a PreToolUse hook (`rtk hook claude`, installed by `rtk init -g`) auto-rewrites Bash commands to their `rtk` form — don't manually prefix. `rtk gain` views savings.
  - Known break: `rtk` corrupts `prisma`/`tsc`/`vitest` output — run those via the PowerShell tool to bypass the hook, never through rtk.

## Frontend design — multi-skill pipeline (MANDATORY)

Working on frontend/UI? Read `~/.claude/rules/frontend.md` first — it defines the skill pipeline, phases, and minimum bar. Otherwise skip it.

## Code quality & project improvement (MANDATORY — skills drive every change)

Improving the project (audit, refactor, harden, optimize, review)? Read `~/.claude/rules/code-quality.md` first — it defines the execution flow and skill inventory. Otherwise skip it.

## Agent Memory (self-learning)

Memory is how this agent gets smarter across sessions. Every project has a `.opencode/memory/` directory with MD files the agent reads and writes.

### Session protocol (ALWAYS)

**Start of session — before any action:**
- Check if `.opencode/memory/` exists in the project. If it does, read `INDEX.md` first to know what's available, then read relevant files (`codebase.md`, `patterns.md`, `errors.md`) for context relevant to the current task.
- Don't re-read memory in the same session unless the task domain changes.

**End of session — after completing work:**
- If you discovered something a future session would benefit from, write it to the appropriate memory file (see taxonomy below).
- Never write guesses. Only verified facts.
- Trivial actions ("ran npm install") do NOT get written. Threshold: "would this save a future session ≥5 minutes?"

**When to write:**
- Non-obvious architecture fact (hidden dependency, implicit convention)
- Task required ≥3 attempts to get right (record the fix pattern)
- Command sequence that worked and would be hard to rediscover
- Error with unobvious root cause + verified fix
- Tool/API behavior that differs from documentation

**When NOT to write:**
- Fix was already in docs or code comments
- Trivial one-liner with obvious cause
- Speculation or guess about how something works

### Memory file taxonomy

| File | Content | Trigger to write |
|---|---|---|
| `INDEX.md` | Navigation map: summaries + last-modified dates for all memory files | After every write to any memory file |
| `codebase.md` | Architecture: module boundaries, key files, dependency chains, conventions | Discovered a non-obvious structural fact |
| `patterns.md` | Reusable strategies: workflows, command sequences, how-to guides | Completed a task that required a novel approach |
| `errors.md` | Error patterns: root cause + fix | Diagnosed and fixed an error with unobvious cause |

### Dreaming (memory consolidation)

After 5+ significant sessions on a project, suggest the user run a dreaming session. A dreaming session reads all memory files, deduplicates, extracts cross-session patterns, verifies accuracy, and produces cleaned-up files.

Dreaming prompt template: `~/.config/opencode/dreaming.md`
Memory philosophy reference: `~/.config/opencode/learnings/memory-system.md`

Never run dreaming during active development — it is a separate out-of-band session.

### Context window management

In very long sessions (>30 complex turns), context accumulates and can drift. When starting a new major task after extensive work, suggest a fresh session — the memory store preserves learnings across sessions.

## Prompting — writing effective instructions

When writing prompts for sub-agents, tools, or LLM calls, apply these principles (from `~/.config/opencode/learnings/prompt-engineering.md`):

1. **Task first, context second.** State exactly what to do before providing data to analyze.
2. **Use delimiters.** Markdown headers, XML tags, or triple backticks separate instructions from content — prevents context bleeding.
3. **Set the output format upfront.** "JSON only", "just the diff", "file:line references."
4. **Include an example** for non-obvious tasks. One correct input/output pair is worth paragraphs of explanation.
5. **Add anti-hallucination guardrails.** "State if uncertain", "cite file:line", "insufficient data → say so."
6. **Order matters.** Stable context first (rules, schemas), dynamic data second (logs, code), analysis last.
7. **Prompt hygiene.** Periodically review instructions for stale cruft — patches for old model limitations, redundant constraints, contradictory rules. If a rule hasn't been relevant in 10+ sessions, remove it. See `~/.config/opencode/learnings/prompting-playbook.md` for the maintenance playbook.
8. **Version control defensive changes.** Every "never X" or "always Y" rule in CLAUDE.md should have a git commit explaining WHY it was added. During dreaming, check whether defensive patches have become counterproductive.

For agent workflow strategies, see `~/.config/opencode/learnings/agent-best-practices.md`.

## Git — commit & push (read the rules file first)

About to commit or push? Read `~/.claude/rules/git.md` BEFORE acting. It covers: confirming the commit identity (shared/work PC — never commit on the configured identity unconfirmed), Conventional Commits format + allowed types, the `no-mistakes` push gate, and the no-AI-attribution rule (no AI/tool trailers from any agent). Not committing/pushing → skip it.
