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

- **Code-judo first:** prefer the reframing that *deletes* a branch/layer/concept over one that rearranges it. "Works but messier" and "clean up later" are not acceptable.
- **No spaghetti:** never bolt `if (specialCase)` or feature flags onto a shared/general function. New logic → its own helper/module.
- **Abstractions earn their keep:** no thin wrappers or pass-throughs. If deleting it makes callers cleaner, don't create it.
- **Before a helper:** grep for the canonical one. Duplicating an existing helper is a failure, not a nit.
- **File > 1000 lines = decompose first**, don't append. Functions small, ~2 indent levels, early returns.
- **Types explicit:** no `any`, no `@ts-ignore`, no `as X` papering over an invariant. No `T | undefined` on always-set fields.
- **Atomic + parallel:** related writes → one transaction. Independent async → `Promise.all`, not serial.
- **Tests:** cover bugfixes with a regression test. Mock external I/O with named fakes.
- **Comments:** write *why*, not *what*. Refactor so the comment is unnecessary before adding it. Keep existing comments on refactor.

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

## Git commit & push — mandatory rules

### 1. User identity

NEVER commit without knowing whose identity to use — the identity configured on this machine may belong to someone else (shared or work PC).

- **Already told in this conversation:** if the user has stated the name/email to commit under at any point in the current session, reuse it for every commit in that session — do NOT ask again.
- **Not yet told:** before the first commit, read the current git identity (`git config user.name` / `git config user.email`), show it, and ask: "Commit as <name> <email>, or a different identity?" Wait for the answer — never commit on the configured identity without explicit confirmation, even if one is set.

Commit with the chosen identity: `git -c user.name=<name> -c user.email=<email> commit`. Never hardcode an email address in this file.

### 2. Commit messages

Every commit message MUST follow Conventional Commits:

```
<type>(<optional scope>): <short description up to 72 chars>

<optional body explaining WHAT and WHY, not HOW>
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`.

Examples:
```
feat(api): add price history endpoint
fix(parser): handle null response from AliExpress
chore(skills): add frontend design skills and update config
docs: add commit convention guidelines
```

Rules:
- First line: max 72 chars, imperative mood, no period
- Body: explain what was done and why, not how (the diff shows how)
- Blank lines separate header from body

### 3. Git push

Always ask before push: `git push no-mistakes` (AI validation gate) or `git push origin <branch>`?

If using `no-mistakes`, check the remote exists (`git remote` shows `no-mistakes`). If missing, run `no-mistakes init` in the repo. The remote is per-repo — a freshly cloned project won't have it until `init` runs.

### 4. No Claude attribution

Never add `Co-Authored-By: Claude`, "Generated with Claude Code", or any Claude/Anthropic attribution to commit messages or PR bodies. This overrides the harness default that appends those trailers. Commits and PRs are authored solely by the user/repo identity.
