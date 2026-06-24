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

echo "[3/5] no-mistakes + code-review-graph + fff"
curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh | sh
python3 -m venv "$crg"
"$crg/bin/pip" install -q --upgrade pip code-review-graph
curl -fsSL https://dmtrkovalenko.dev/install-fff-mcp.sh | bash

echo "[4/5] MCP servers"
for n in code-review-graph fff playwright; do claude mcp remove "$n" -s user 2>/dev/null || true; done
claude mcp add code-review-graph -s user -- "$crg/bin/code-review-graph" serve
claude mcp add fff -s user -- fff-mcp
claude mcp add playwright -s user -- npx -y @playwright/mcp@latest

echo "[5/5] Plugins"
for m in JuliusBrussee/caveman DietrichGebert/ponytail anthropics/claude-plugins-official kingbootoshi/goal-ledger; do
  claude plugin marketplace add "$m" || true
done
claude plugin install caveman@caveman || true
claude plugin install ponytail@ponytail || true
claude plugin install superpowers@claude-plugins-official || true
claude plugin install goal-ledger@goal-ledger || true

case ":$PATH:" in *":$bin:"*) ;; *) echo "Note: add $bin to PATH";; esac
echo "Done. Restart Claude Code."
