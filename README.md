# my-harness-config

My global config for **Claude Code** and **OpenCode** — tuned for three things:
spend fewer tokens, write better code, and verify it actually works.
Everything below exists to serve one of those goals.

## Why each tool, and how it's wired

### Token economy

| Tool | Why I use it | How it's wired |
|------|--------------|----------------|
| [rtk](https://github.com/rtk-ai/rtk) | Compresses shell output before it hits the model (60–90% fewer tokens) — a 200-line test fail becomes ~20 lines. | Hook that auto-rewrites every shell command (both agents). Never prefix manually. Corrupts `prisma`/`tsc`/`vitest` output → run those outside the hook. |
| [caveman](https://github.com/JuliusBrussee/caveman) | Compresses the agent's *replies* ~75% (drops filler, keeps the technical content). | Plugin, always-on every session (both agents). |
| [fff](https://github.com/dmtrKovalenko/fff) | In-memory, frecency-ranked file search — faster and cheaper than spawning ripgrep/fzf per call. | MCP server `fff` (`ffgrep`/`fffind`/`fff-multi-grep`). `CLAUDE.md` tells the agent to prefer it. |
| [code-review-graph](https://github.com/tirth8205/code-review-graph) | Tree-sitter graph that feeds the agent only the blast-radius of a change — ~82× fewer tokens than reading the whole repo. | MCP server. `CLAUDE.md` tells the agent to use it before raw Grep/Glob. |

### Code quality

| Tool | Why I use it | How it's wired |
|------|--------------|----------------|
| [ponytail](https://github.com/DietrichGebert/ponytail) | Forces the laziest-senior-dev discipline: stdlib/native before custom code → 80–94% less code. | Plugin (both agents). |
| [no-mistakes](https://github.com/kunchenguid/no-mistakes) | Validation gate on push — runs review/test/lint on a throwaway worktree, auto-fixes slop, opens the PR only when green. | `git push no-mistakes` instead of `git push origin`. `CLAUDE.md` makes me pick the gate each push. |
| [superpowers](https://github.com/obra/superpowers) | Discipline skills (brainstorming, debugging, planning, verification) that gate *how* the agent works. | Plugin (both agents). |
| code-quality skills | `/thermo-nuclear-code-quality-review` (max-intensity quality audit), `/improve` (advisor audit → read-only plans), `/improve-codebase-architecture` (architecture refactor planning). | Copied into the agent's skills dir (`skills/`). |

### Verification / E2E

| Tool | Why I use it | How it's wired |
|------|--------------|----------------|
| [playwright-mcp](https://github.com/microsoft/playwright-mcp) | The agent drives a real browser to verify things actually work end-to-end — navigate, click, fill, assert via structured a11y snapshots. Official Microsoft server; multi-browser (Chromium/Firefox/WebKit) + headless. Replaced chrome-devtools-axi. | MCP server `playwright` (`npx -y @playwright/mcp@latest`), user scope. |

## Skills

Files stay **flat** in `skills/` — Claude Code discovers a personal skill only at
`~/.claude/skills/<name>/SKILL.md` (one level, single searchable namespace), so
category subfolders would hide them on install. The grouping below is by purpose,
not by directory.

| Category | Skills |
|----------|--------|
| **Code quality** | `thermo-nuclear-code-quality-review` (max-intensity audit), `improve` (advisor audit → read-only plans), `improve-codebase-architecture` (architecture deepening), `autoreview` (review closeout before commit/ship) |
| **Planning & handoff** | `grill-me` (interrogate a plan), `grill-with-docs` (grill against the domain model + ADRs), `to-prd` (conversation → PRD), `handoff` (compact context for the next agent) |
| **Context & skill authoring** | `claude-md-auditor` (audit CLAUDE/AGENTS/GEMINI files), `write-a-skill` (author new skills), `skill-cleaner` (audit installed skills + prompt budget), `setup-matt-pocock-skills` (wire an Agent-skills block into AGENTS.md) |
| **Research & learning** | `storm-research` (Stanford STORM multi-perspective research), `teach` (teach a concept in-workspace), `prototype` (throwaway prototype to flesh out a design) |
| **System config** | `omarchy` (Linux desktop / window-manager / dotfile customization) |

## Copy-paste setup

Paste the block for your agent as your first message. It installs **only** what
applies to that platform, detects your OS, and verifies downloads before running.

Both agents get the **same** toolset (rtk, caveman, superpowers, ponytail,
code-review-graph, fff, playwright-mcp, no-mistakes, goal mode); only the
install mechanism differs per platform.

### Claude Code

```text
Set up my coding-agent harness from https://github.com/YuukiFST/my-harness-config for Claude Code on THIS machine. Detect my OS and use matching commands. Review before running — this clones a repo, downloads binaries, and edits ~/.claude.

1. Clone the repo to a temp dir and read README.md.
2. Copy CLAUDE.md -> ~/.claude/CLAUDE.md and skills/* -> ~/.claude/skills/. Merge settings.json into ~/.claude/settings.json (keep my existing keys; add the rtk PreToolUse hook + enabledPlugins/marketplaces: caveman, superpowers, ponytail).
3. Binaries from the "Install reference" table: rtk then `rtk init -g`, no-mistakes, code-review-graph. On Windows install to a dir on PATH, not ~/.local/bin.
4. MCP servers (register via `claude mcp add -s user <name> -- <cmd>`): code-review-graph (the installed binary, arg `serve`); fff (install the fff-mcp binary for my OS, verify sha256, then register it); playwright (`claude mcp add playwright -s user -- npx -y @playwright/mcp@latest`).
5. goal mode (parity with OpenCode's goal plugin): install the goal-ledger plugin from https://github.com/kingbootoshi/goal-ledger (it provides `/goal`).
6. Do NOT touch OpenCode config. List what was installed and tell me to restart Claude Code.
```

### OpenCode

```text
Set up my coding-agent harness from https://github.com/YuukiFST/my-harness-config for OpenCode on THIS machine. Detect my OS and use matching commands. Review before running — this clones a repo, downloads binaries, and edits ~/.config/opencode.

1. Clone the repo to a temp dir and read README.md.
2. Copy opencode.jsonc -> ~/.config/opencode/opencode.jsonc. It uses the author's absolute Linux paths (/home/yk/...) — rewrite every absolute path (ponytail plugin, code-review-graph command, skills path) for MY home dir and OS.
3. Binaries from the "Install reference" table: rtk, no-mistakes, code-review-graph. Then enable rtk for OpenCode: `rtk init -g --opencode`.
4. Plugins for OpenCode parity with my Claude setup:
   - caveman: `npx -y github:JuliusBrussee/caveman -- --only opencode`
   - ponytail: already referenced in opencode.jsonc as the npm package `@dietrichgebert/ponytail` — OpenCode resolves it on launch, no clone needed.
   - superpowers is already referenced in opencode.jsonc.
5. MCP servers in opencode.jsonc (already present — just make them resolve): code-review-graph (path to the installed binary + `serve`); fff (install the fff-mcp binary for my OS, verify sha256; binary dir on PATH so `fff-mcp` resolves, or use its absolute path); playwright (add an MCP entry running `npx -y @playwright/mcp@latest`).
6. Do NOT touch Claude Code config (~/.claude). List what was installed and tell me to restart OpenCode.
```


## Install reference

| Tool | Install |
|------|---------|
| rtk | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh \| sh` then `rtk init -g` |
| no-mistakes | `curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh \| sh` — then run `no-mistakes init` **inside each repo** to create the `no-mistakes` push remote (without it `git push no-mistakes` has no remote to hit) |
| code-review-graph | `python3 -m venv ~/.local/crg-venv && ~/.local/crg-venv/bin/pip install code-review-graph` (expose `code-review-graph` on PATH) |
| fff (Windows) | `irm https://raw.githubusercontent.com/dmtrKovalenko/fff.nvim/main/install-mcp.ps1 \| iex` → `%LOCALAPPDATA%\fff-mcp\bin\fff-mcp.exe` |
| fff (macOS/Linux) | `curl -L https://dmtrkovalenko.dev/install-fff-mcp.sh \| bash` |

> rtk corrupts `prisma`/`tsc`/`vitest` output — run those raw, never through rtk.
