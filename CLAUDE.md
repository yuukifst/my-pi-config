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

## Frontend design skills

Every frontend task MUST use a design/frontend skill from `~/.agents/skills/`. Load the relevant skill via `skill tool` before writing any frontend code.

**Exception:** Do NOT use these skills if the project already has a predefined Design System (tokens, components, style guide defined by the user). In that case, follow the existing Design System.

Available frontend/design skills:
- `design-taste-frontend` — default frontend design skill (v2 experimental)
- `design-taste-frontend-v1` — previous version for compatibility
- `high-end-visual-design` — high-end agency-level visual design
- `impeccable` — UI/UX review, polish, animation, 23 commands
- `minimalist-ui` — clean editorial-style UI
- `industrial-brutalist-ui` — mechanical/data-heavy interfaces
- `emil-design-eng` — UI polish and animation philosophy
- `brandkit` — brand identity and visual guidelines
- `redesign-existing-projects` — upgrade existing projects to premium quality
- `gpt-taste` — GSAP motion, bento grids, typography
- `image-to-code` — generate design image first, then code
- `imagegen-frontend-web` — visual direction for landing pages
- `imagegen-frontend-mobile` — visual direction for mobile apps
- `stitch-design-taste` — Google Stitch design system semantics

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
