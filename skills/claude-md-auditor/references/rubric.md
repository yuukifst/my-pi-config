# Audit Rubric

Score the file on four dimensions (plus the cross-cutting checks at the end,
which also feed the report). Each has a healthy state and a failure state.
Quote real lines from the file as evidence — never score in the abstract.

The grounding evidence (Gloaguen et al., "Evaluating AGENTS.md"): context files
don't reliably raise task success and cost 20%+ extra; agents obey every
instruction, so unnecessary requirements make tasks *harder*, not just pricier.
The only content that pays off is **minimal, non-obvious, this-repo-only facts**
(above all, the exact tooling to use) that a competent engineer couldn't guess
and the model can't read from the code. Everything else is overhead the agent
pays on every run. (Keeping such a file is worth it to persist that hard-won
knowledge so the agent doesn't rediscover it each session, but that durability
is the rationale for having a file, not a measured result of this paper.)

---

## 1. Conciseness — is every line earning its token cost?

The agent re-reads this file every session and follows it literally. Length is
not free: more instructions → more exploration, more tests, more searching, the
same or lower success.

**Bloated signals:**
- Restating general best practices the model already does by default ("write
  clean code", "use meaningful variable names", "handle errors", "add comments").
- Long prose where a 1-line rule would do.
- Duplicated rules stated in three sections.
- Exhaustive enumerations the agent could read from the code (full file trees,
  every route, every component name) — unless they're a genuine index that saves
  a search.

**Healthy signals:**
- Dense, rule-per-line.
- Every line is something the agent would get *wrong or slower* without it.

Test for any line: *"If I delete this, does the agent behave worse on a real
task?"* No → cut candidate.

---

## 2. Specificity — generic vs project-specific

Generic instructions are the worst offenders: they add ceremony and exploration
without encoding anything the model didn't know. Specific, non-obvious facts are
the whole point of the file.

**Generic (cut or it's noise):**
- "Follow SOLID principles." "Prefer composition." "Keep functions small."
- "Always test your code." (without saying *how* this repo runs tests)

**Specific (keep — this is domain expertise):**
- "rtk corrupts prisma/tsc/vitest output — run those raw via PowerShell, not rtk."
- "data_inicio/data_fim are set by a Django signal, never user-input — don't add
  form fields for them."
- "DB is localhost:54322, user postgres, password postgres."

A good line is something a competent engineer new to *this* repo couldn't guess.

---

## 3. Hierarchy — monolithic vs conditional

The paper's headline is *minimalism*: include only minimal, task-relevant
requirements, because every unnecessary instruction the agent obeys lowers
success and raises cost. Hierarchy is the structural tactic that serves it
("if you do X, check y.md; otherwise ignore it"), so rarely-needed rules don't
load on every unrelated task. Conditional loading is this skill's extrapolation
from the paper's "concise, task-relevant" recommendation; the paper measures
content, not file structure. A monolithic file forces every rule into every
session even when most is irrelevant to the task at hand.

**Monolithic (flag):**
- One giant file (or a root that `@import`s everything unconditionally) where DB
  rules, UI rules, security rules, and deploy steps all load every time.

**Hierarchical (reward):**
- Lean root with conditional pointers: "Changing schema.prisma? Read
  references/database.md first. Otherwise skip it."
- Sub-files loaded only when the task touches that area.

The restructure win is usually *not* deletion — it's moving a large, valuable
section behind a one-line conditional pointer so it loads on demand. A 200-line
database-design doc is great as `references/database.md`, wasteful inlined into
a file read on every unrelated task.

When you see large topical sections (database, security, testing, deploy, design
system), check: does this need to be in the always-loaded file, or can it be a
pointer? Imports that always fire are still monolithic — hierarchy means
*conditional* loading.

---

## 4. Signal ratio — domain knowledge vs filler

Estimate the fraction of the file that is genuine, non-derivable domain
knowledge (the asset that survives between sessions) versus filler (generic
advice, restated defaults, derivable facts).

**High signal:** machine-specific setup, non-obvious gotchas, business rules,
"we tried X and it broke because Y", canonical helper locations, hard
constraints with a stated reason.

**Filler:** motivational best-practice, defaults the model already follows,
ceremony ("be concise", "think before coding" stated generically), and
exhaustive lists better fetched on demand.

Report the rough ratio and name the biggest filler blocks.

---

## Cross-cutting checks

- **Codebase overviews / directory trees (paper-proven low value):** the study
  found files enumerating directories did *not* help agents reach relevant files
  faster, concluding context files are "not effective at providing a repository
  overview." Flag any "Project structure" / file-tree / folder-tour section for
  deletion, unless it's a genuine index that saves a real search ("the canonical
  X lives at path Y", not a tour of the tree).
- **Documentation-substitute calibration:** the file's value is highest when the
  repo is under-documented, lowest when docs already cover the ground. Thorough
  README/docs present means push harder to cut (the file likely restates them);
  sparse docs means a few orienting facts may earn their place.
- **Contradictions:** rules that conflict (one section says do X, another forbids
  it). Agents follow context files literally — contradictions cause thrash.
- **Stale facts:** references to files, flags, or commands that may no longer
  exist. Flag for the user to verify; don't assert they're dead.
- **Unexplained absolutes:** walls of ALL-CAPS MUST/NEVER without a *why*. The
  reason is what lets the agent generalize correctly; a bare absolute invites
  either blind compliance or quiet violation. Recommend adding the rationale or
  softening to a rule-with-reason — but only flag, don't rewrite the user's
  hard-won rules without asking.

## What NOT to penalize

- Length alone, if the content is dense domain knowledge. A long, specific,
  well-sectioned file is healthy. The enemy is *filler* and *always-loaded
  irrelevance*, not size.
- Project-specific jargon, non-English content, or unconventional structure that
  clearly works for the user.
