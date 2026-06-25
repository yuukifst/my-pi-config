#!/usr/bin/env bash
# Claude Code harness setup (Linux/macOS). Run from a clone of this repo.
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
claude="$HOME/.claude"
bin="$HOME/.local/bin"
crg="$HOME/.local/crg-venv"
mkdir -p "$claude/skills" "$bin"

echo "[1/5] Config files"
cp "$repo/CLAUDE.md" "$claude/CLAUDE.md"
cp -r "$repo/skills/." "$claude/skills/"

echo "[2/5] rtk"
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
rtk init -g

echo "[3/5] no-mistakes + code-review-graph + fff + portless + agent-browser"
curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh | sh
python3 -m venv "$crg"
"$crg/bin/pip" install -q --upgrade pip code-review-graph
curl -fsSL https://dmtrkovalenko.dev/install-fff-mcp.sh | bash
npm install -g portless agent-browser

echo "[4/5] MCP servers"
# agent-browser (agent-browser.dev) is a shell CLI for agents, NOT an MCP server — installed
# above and called directly via Bash. Kept in the remove loop only to clean any stale entry.
for n in code-review-graph fff agent-browser; do claude mcp remove "$n" -s user 2>/dev/null || true; done
claude mcp add code-review-graph -s user -- "$crg/bin/code-review-graph" serve
claude mcp add fff -s user -- fff-mcp

echo "[5/5] Plugins"
for m in JuliusBrussee/caveman DietrichGebert/ponytail anthropics/claude-plugins-official kingbootoshi/goal-ledger; do
  claude plugin marketplace add "$m" || true
done
claude plugin install caveman@caveman || true
claude plugin install ponytail@ponytail || true
claude plugin install superpowers@claude-plugins-official || true
claude plugin install goal-ledger@goal-ledger || true

echo "Settings (disable auto memory)"
python3 - "$claude/settings.json" <<'PY'
import json, os, sys
p = sys.argv[1]
s = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
s.setdefault("env", {})["CLAUDE_CODE_DISABLE_AUTO_MEMORY"] = "1"
json.dump(s, open(p, "w", encoding="utf-8"), indent=2)
PY

case ":$PATH:" in *":$bin:"*) ;; *) echo "Note: add $bin to PATH";; esac
echo "Done. Restart Claude Code."
