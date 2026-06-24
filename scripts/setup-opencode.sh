#!/usr/bin/env bash
# OpenCode harness setup (Linux/macOS). Run from a clone of this repo.
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
cfg="$HOME/.config/opencode"
bin="$HOME/.local/bin"
crg="$HOME/.local/crg-venv"
mkdir -p "$cfg/skills" "$bin"

echo "[1/4] Config files"
cp "$repo/opencode.jsonc" "$cfg/opencode.jsonc"
cp -r "$repo/skills/." "$cfg/skills/"

echo "[2/4] rtk"
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
rtk init -g --opencode

echo "[3/4] no-mistakes + code-review-graph + fff"
curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh | sh
python3 -m venv "$crg"
"$crg/bin/pip" install -q --upgrade pip code-review-graph
ln -sf "$crg/bin/code-review-graph" "$bin/code-review-graph"
curl -fsSL https://dmtrkovalenko.dev/install-fff-mcp.sh | bash

echo "[4/4] caveman (ponytail + superpowers resolve from opencode.jsonc on launch)"
npx -y github:JuliusBrussee/caveman -- --only opencode

case ":$PATH:" in *":$bin:"*) ;; *) echo "Note: add $bin to PATH (opencode resolves code-review-graph/fff-mcp from it)";; esac
echo "Done. Restart OpenCode."
