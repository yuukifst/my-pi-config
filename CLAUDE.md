# CLAUDE.md — Global

Cross-project guidance. Lean by design: only what's non-obvious or machine-specific. Project `CLAUDE.md` overrides this; for generic best-practice the model already knows, trust the model. For trivial tasks, use judgment over ceremony.

## Output

- Read files before editing; don't re-read unchanged files.
- Concise output, thorough reasoning. No sycophantic openers/closers, no emojis, no em-dashes. Plain "Done", never "✅ Done".
- Never guess APIs, versions, flags, SHAs, or package names — verify in code/docs first.
- Don't print full files back; show diffs with `...` for omitted parts.

## Working method

- State assumptions; if uncertain or ambiguous, ask before coding. Surface tradeoffs, don't pick silently.
- Simplest code that solves it. No speculative features, abstractions, or config not asked for.
- Surgical: touch only what the request needs. Match existing style. Remove only orphans *your* change created; flag pre-existing dead code, don't delete it.
- Turn tasks into verifiable goals with a clear success check; for refactors, keep existing tests green before and after.
- **No TDD / test-first.** Do NOT use the superpowers `test-driven-development` skill or any red-green-refactor flow. Write the implementation first; add a regression test after a bugfix. This overrides any skill that says "always TDD".
- Same error twice → stop, show error, ask one question. Never install packages to fix errors.

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

**Premise:** one skill alone produces a templated, mediocre front. A magnificent front comes from **layering skills**, each owning one phase. Every frontend task runs the pipeline below and invokes **at least one skill per applicable phase — normally 3–5 skills total, never fewer than the per-task minimum**. Load each via the Skill tool *before* writing the matching code, not after.

**HARD EXCEPTION — Design System projects:** if the project already defines its own Design System (tokens, components, style guide set by the user or repo), DO NOT use any skill in this section. Follow the existing Design System exactly. This whole pipeline applies only to projects with no predefined design language.

The skills split into lanes. **Aesthetic-direction skills CONFLICT** — mixing two visual languages = incoherent UI, so pick **exactly one**. **Craft / motion / review skills STACK** — use every one that applies. The point is not "run all 14"; it is "never build from a single skill" — one direction + several craft layers.

### Phase 0 — Direction: pick exactly ONE aesthetic
Defines the visual language. Choose by brief; do not combine.
- `high-end-visual-design` — premium agency look (default for marketing / landing / product)
- `minimalist-ui` — clean editorial, warm monochrome
- `industrial-brutalist-ui` — raw, mechanical, data-heavy dashboards
- `gpt-taste` — GSAP-driven editorial motion + bento grids

### Phase 1 — Visual reference FIRST (greenfield / high-visual pages)
Generate design references *before* coding. Skip only for small internal CRUD.
- `imagegen-frontend-web` — one reference image per landing section
- `imagegen-frontend-mobile` — mobile app screens / flows
- `image-to-code` — generate the design image, then match it in code
- `brandkit` — when a brand identity / logo system is needed

### Phase 2 — Build with taste (ALWAYS)
- `design-taste-frontend` — anti-slop default; infer direction, avoid templated output (`design-taste-frontend-v1` only if a project pins the old behavior)
- `stitch-design-taste` — when emitting a `DESIGN.md` / design-system semantics

### Phase 3 — Motion + polish (ALWAYS for interactive UI)
- `transitions-dev` — product-motion catalog (badges, dropdowns, modals, page transitions, icon swaps, shimmer, accordions…); run `transitions apply` after components exist (install: `npx skills add Jakubantalik/transitions.dev`)
- `emil-design-eng` — animation + polish philosophy, the invisible details
- `review-animations` — audit existing motion

### Phase 4 — Review pass (ALWAYS, last)
- `impeccable` — UI/UX audit, polish, 23 commands; run before declaring the front done
- `redesign-existing-projects` — when upgrading an existing UI (audit-first; replaces Phase 0–1)

### Minimum bar per front (never ship a front from one skill)
- **Greenfield visual page:** Phase 0 (1) + Phase 1 (1) + Phase 2 + Phase 3 + Phase 4 → ~5 skills.
- **Internal / CRUD UI:** Phase 0 (1) + Phase 2 + Phase 4 → 3 skills.
- **Redesign:** `redesign-existing-projects` + Phase 2 + Phase 3 + Phase 4.

## Code quality & project improvement (MANDATORY — skills drive every change)

**Trigger:** any request to improve the code or project — "improve my code", "make the project better", audit, refactor, harden, optimize, review, "where to next".

**Iron rule:** the agent NEVER improves code from its own judgement. Every change originates from a skill below or from a plan a skill produced. No freelance fixes, no "I'll just clean this up" outside a skill. If no skill covers the work, say so — do not improvise.

**Execution flow — run it end to end; do not stop at the plan:**

1. **Audit → plan.** Run `improve`: it surveys the whole codebase (bugs, security, perf, test gaps, tech debt, migrations, DX) and emits prioritized, self-contained plans. `improve` is read-only — it writes the plan, not the code.
2. **Execute every plan.** Implement each plan `improve` produced, in priority order. Architecture/design work goes through `codebase-design` (vocabulary + deep-module principles) and `improve-codebase-architecture` (deepening opportunities); use `domain-modeling` only when changing the domain model / ubiquitous language. Hard bugs and performance regressions → `diagnosing-bugs`.
3. **Security.** Any auth / input / secrets / endpoint / upload / PII / 3rd-party surface touched → `security-review` while building, and `security-bounty-hunter` for an adversarial attack-surface pass.
4. **Review gate (before declaring done or committing).** `autoreview` on the diff / branch / PR; escalate to `thermo-nuclear-code-quality-review` for high-risk diffs (auth, money, concurrency, data-loss) — brutal audit of correctness, security, performance, races, leaks, API contracts.

**Skills (all in repo `skills/`):**
- `improve` — read-only advisor sweep → prioritized plans. The agent then EXECUTES those plans (steps 2–4); it does not hand them off and stop.
- `codebase-design` — shared vocabulary + deep-module principles for any design/refactor.
- `improve-codebase-architecture` — scan for deepening opportunities → report → grill. Built on `codebase-design`.
- `domain-modeling` — only when changing the domain model / ubiquitous language.
- `diagnosing-bugs` — disciplined loop for hard bugs and performance regressions.
- `security-review` / `security-bounty-hunter` — building the sensitive surface / hunting exploitable vulns.
- `autoreview` / `thermo-nuclear-code-quality-review` — closeout review / brutal max-scrutiny escalation.

Performance has no dedicated repo skill — `improve` finds perf issues, `thermo-nuclear-code-quality-review` audits them, `diagnosing-bugs` handles regressions.

## Agent Memory (self-learning)

Memory is how this agent gets smarter across sessions. Every project has a `.opencode/memory/` directory with MD files the agent reads and writes. This is the OpenCode equivalent of Anthropic's managed agent memory stores.

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

Never run dreaming during active development — it is a separate out-of-band session, just like Anthropic's async dreaming jobs.

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

For agent workflow strategies, see `~/.config/opencode/learnings/agent-best-practices.md`.

## Git — commit & push (read the rules file first)

About to commit or push? Read `~/.claude/rules/git.md` BEFORE acting. It covers: confirming the commit identity (shared/work PC — never commit on the configured identity unconfirmed), Conventional Commits format + allowed types, the `no-mistakes` push gate, and the no-AI-attribution rule (no AI/tool trailers from any agent). Not committing/pushing → skip it.
