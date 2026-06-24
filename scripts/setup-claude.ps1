#!/usr/bin/env pwsh
# Claude Code harness setup (Windows). Run from a clone of this repo.
$ErrorActionPreference = "Stop"

$Repo   = Split-Path $PSScriptRoot -Parent
$Claude = Join-Path $env:USERPROFILE ".claude"
$Bin    = Join-Path $env:USERPROFILE ".local\bin"
$Crg    = Join-Path $env:USERPROFILE ".local\crg-venv"
New-Item -ItemType Directory -Force -Path $Bin, "$Claude\skills" | Out-Null

Write-Host "[1/5] Config files"
Copy-Item "$Repo\CLAUDE.md" "$Claude\CLAUDE.md" -Force
Copy-Item "$Repo\skills\*" "$Claude\skills\" -Recurse -Force

Write-Host "[2/5] rtk"
$rtkUrl = (Invoke-RestMethod "https://api.github.com/repos/rtk-ai/rtk/releases/latest").assets |
  Where-Object name -EQ "rtk-x86_64-pc-windows-msvc.zip" | ForEach-Object browser_download_url
$tmp = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP "rtk-dl")
Invoke-WebRequest $rtkUrl -OutFile "$tmp\rtk.zip"
Expand-Archive "$tmp\rtk.zip" -DestinationPath $tmp -Force
Copy-Item (Get-ChildItem $tmp -Recurse -Filter rtk.exe)[0].FullName "$Bin\rtk.exe" -Force
Remove-Item -Recurse -Force $tmp
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$Bin*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$Bin", "User")
  $env:Path += ";$Bin"
}
& "$Bin\rtk.exe" init -g | Out-Null

Write-Host "[3/5] no-mistakes + code-review-graph + fff"
Invoke-RestMethod "https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.ps1" | Invoke-Expression
python -m venv $Crg
& "$Crg\Scripts\pip.exe" install -q --upgrade pip code-review-graph
Invoke-RestMethod "https://raw.githubusercontent.com/dmtrKovalenko/fff.nvim/main/install-mcp.ps1" | Invoke-Expression

Write-Host "[4/5] MCP servers"
$fff = Join-Path $env:LOCALAPPDATA "fff-mcp\bin\fff-mcp.exe"
foreach ($n in "code-review-graph", "fff", "playwright") { claude mcp remove $n -s user 2>$null }
claude mcp add code-review-graph -s user -- "$Crg\Scripts\code-review-graph.exe" serve
claude mcp add fff -s user -- $fff
claude mcp add playwright -s user -- npx -y "@playwright/mcp@latest"

Write-Host "[5/5] Plugins"
foreach ($m in "JuliusBrussee/caveman", "DietrichGebert/ponytail", "anthropics/claude-plugins-official", "kingbootoshi/goal-ledger") {
  claude plugin marketplace add $m
}
claude plugin install caveman@caveman
claude plugin install ponytail@ponytail
claude plugin install superpowers@claude-plugins-official
claude plugin install goal-ledger@goal-ledger

Write-Host "Settings (disable auto memory)"
@'
import json, os, sys
p = sys.argv[1]
s = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
s.setdefault("env", {})["CLAUDE_CODE_DISABLE_AUTO_MEMORY"] = "1"
json.dump(s, open(p, "w", encoding="utf-8"), indent=2)
'@ | python - "$Claude\settings.json"

Write-Host "Done. Restart Claude Code."
