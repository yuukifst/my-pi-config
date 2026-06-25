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
| [agent-browser](https://agent-browser.dev) | The agent drives a real browser to verify things actually work end-to-end — navigate, click, fill, assert via ref-based accessibility snapshots. Native Rust, ~10x fewer tokens than Playwright MCP. Vercel Labs (37k stars). | MCP server `agent-browser` (`agent-browser mcp`), user scope. |

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

## Setup

Both agents get the **same** toolset (rtk, caveman, superpowers, ponytail,
code-review-graph, fff, agent-browser, no-mistakes, goal mode); only the
install mechanism differs per platform. Run the script for your agent from a
clone of this repo — it installs binaries, registers MCP servers, wires
plugins, and copies config. Idempotent: safe to re-run.

### Claude Code

```bash
git clone https://github.com/YuukiFST/my-harness-config && cd my-harness-config
pwsh -File scripts/setup-claude.ps1     # Windows
bash scripts/setup-claude.sh            # macOS / Linux
```

Installs to `~/.claude`: copies `CLAUDE.md` + `skills/`; installs rtk (+`rtk init
-g` hook), no-mistakes, code-review-graph, fff; registers the code-review-graph,
fff and agent-browser MCP servers; installs the caveman, ponytail, superpowers and
goal-ledger plugins; sets `env.CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` in
`settings.json` (auto-memory off — stale Claude-only memory degrades decisions;
keep durable context in `CLAUDE.md`/`AGENTS.md` instead).

### OpenCode (Linux / macOS)

```bash
git clone https://github.com/YuukiFST/my-harness-config && cd my-harness-config
bash scripts/setup-opencode.sh
```

Installs to `~/.config/opencode`: copies `opencode.jsonc` + `skills/` (auto-
discovered, no `skills.paths` needed); installs rtk (+`rtk init -g --opencode`),
no-mistakes, code-review-graph (symlinked onto PATH so the bare MCP command
resolves), fff, agent-browser; installs the caveman plugin. ponytail
(`@dietrichgebert/ponytail`) and superpowers are referenced in `opencode.jsonc`
and resolve on launch.

After the script finishes, **restart the agent**. Then, in each repo you push
from, run `no-mistakes init` once to create the `no-mistakes` push remote.


## Install reference

| Tool | Install |
|------|---------|
| rtk | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh \| sh` then `rtk init -g` |
| no-mistakes | `curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh \| sh` — then run `no-mistakes init` **inside each repo** to create the `no-mistakes` push remote (without it `git push no-mistakes` has no remote to hit) |
| code-review-graph | `python3 -m venv ~/.local/crg-venv && ~/.local/crg-venv/bin/pip install code-review-graph` (expose `code-review-graph` on PATH) |
| fff (Windows) | `irm https://raw.githubusercontent.com/dmtrKovalenko/fff.nvim/main/install-mcp.ps1 \| iex` → `%LOCALAPPDATA%\fff-mcp\bin\fff-mcp.exe` |
| fff (macOS/Linux) | `curl -L https://dmtrkovalenko.dev/install-fff-mcp.sh \| bash` |
| agent-browser | `npm install -g agent-browser && agent-browser install` |

> rtk corrupts `prisma`/`tsc`/`vitest` output — run those raw, never through rtk.
