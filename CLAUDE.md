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

## Code quality (rules that override model defaults)

- **Before a helper:** grep for the canonical one. Duplicating an existing helper is a failure, not a nit.
- **File > 1000 lines = decompose first**, don't append.
- **Types explicit:** no `any`, no `@ts-ignore`, no `as X` papering over an invariant. No `T | undefined` on always-set fields.
- **Tests:** cover bugfixes with a regression test. Mock external I/O with named fakes.

## Tools (machine-specific)

- **code-review-graph MCP before Grep/Glob/Read** when the project has it — faster, gives callers/dependents/coverage. Fall back only when the graph doesn't cover the need.
  - Explore: `semantic_search_nodes` / `query_graph`. Impact: `get_impact_radius`. Review: `detect_changes` + `get_review_context`. Architecture: `get_architecture_overview`.
- **fff MCP for file search/grep** in a git-indexed dir — prefer `ffgrep`/`fffind`/`fff-multi-grep` over spawning ripgrep/fzf (in-memory index, frecency-ranked, typo-tolerant). Configured for Claude Code + OpenCode. After code-review-graph, before raw Grep/Glob.
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

## Git — commit & push (read the rules file first)

About to commit or push? Read `~/.claude/rules/git.md` BEFORE acting. It covers: confirming the commit identity (shared/work PC — never commit on the configured identity unconfirmed), Conventional Commits format + allowed types, the `no-mistakes` push gate, and the no-AI-attribution rule (no AI/tool trailers from any agent). Not committing/pushing → skip it.
