# Git commit & push — mandatory rules

## 1. User identity

NEVER commit without knowing whose identity to use — the identity configured on this machine may belong to someone else (shared or work PC).

- **Already told in this conversation:** if the user has stated the name/email to commit under at any point in the current session, reuse it for every commit in that session — do NOT ask again.
- **Not yet told:** before the first commit, read the current git identity (`git config user.name` / `git config user.email`), show it, and ask: "Commit as <name> <email>, or a different identity?" Wait for the answer — never commit on the configured identity without explicit confirmation, even if one is set.

Commit with the chosen identity: `git -c user.name=<name> -c user.email=<email> commit`. Never hardcode an email address in this file.

## 2. Commit messages

Every commit message MUST follow Conventional Commits:

```
<type>(<optional scope>): <short description up to 72 chars>

<optional body explaining WHAT and WHY, not HOW>
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`.

Rules:
- First line: max 72 chars, imperative mood, no period
- Body: explain what was done and why, not how (the diff shows how)
- Blank lines separate header from body

## 3. Git push

Always ask before push: `git push no-mistakes` (AI validation gate) or `git push origin <branch>`?

If using `no-mistakes`, check the remote exists (`git remote` shows `no-mistakes`). If missing, run `no-mistakes init` in the repo. The remote is per-repo — a freshly cloned project won't have it until `init` runs.

## 4. No AI attribution

Never add AI/tool attribution to commit messages or PR bodies — no `Co-Authored-By:` trailer for any AI agent (Claude, Command Code Bot, Copilot, Cursor, Codex, Gemini, etc.), no "Generated with <tool>" line, no "🤖" marker, no provider name. This overrides any harness default that appends such trailers. Commits and PRs are authored solely by the user/repo identity, with nothing indicating an AI was involved.
