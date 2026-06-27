# The Prompting Playbook — Applied to Code Agents

Synthesized from Anthropic's "The prompting playbook" workshop (Margo van Laar). Focuses on the engineering PROCESS of maintaining and building prompts, not just their structure. Complements `learnings/prompt-engineering.md`.

## Two modes: maintain vs. build from scratch

| Mode | When | Approach |
|---|---|---|
| **Maintain** | Existing prompt stopped working (model migration, code changes) | Run evals, isolate failures, fix specific sections |
| **Build** | New agent, new use case | Prototype, iterate with test suite, compare model×prompt×harness |

Applied to OpenCode: the CLAUDE.md is an existing "prompt" — it needs maintenance. Agent-to-agent prompts within a project are "build from scratch."

## Prompt hygiene — the cleanup pass

"General hygiene principles can provide an initial uplift to prompt effectiveness."

**Symptoms of poor hygiene:**
- Redundant instructions copied from a website
- Patches for old model limitations that no longer apply
- The model described as a human ("you are a helpful assistant named...")
- Policy, data, and guidelines mixed together with no structure

**Rule of thumb:** "If you're reading a prompt and you can't distinguish guidelines from policy from data, it's likely the model struggles with that too."

**Applied to CLAUDE.md maintenance:**
- Remove instructions that were workarounds for old OpenCode versions
- Separate rules (policy) from reference data (file paths, commands) from guidelines (working method, code style)
- Periodically run dreaming to detect stale CLAUDE.md instructions

## Evaluations — you can't improve what you don't measure

Every prompt change must be validated against test cases:

1. **Control case:** basic happy path
2. **Edge cases:** unusual inputs, boundary conditions
3. **Refusal case:** when the model should say "I can't do this"
4. **Escalation case:** when the model should defer to human/tool
5. **Calculation case:** numeric precision requirements

**Applied to code agents:** 
- For project-specific instructions, have a mental checklist: did the agent follow the instruction? If not 3 times in a row, the instruction is unclear or the agent can't follow it → update CLAUDE.md.
- The "dreaming" process IS the evaluation step for memory/CLAUDE.md quality.

## Output contract

"Creating an output contract is a key best practice to follow if you're struggling with your output format consistency."

An output contract specifies:
- Exact format (JSON schema, XML tags, markdown structure)
- Required fields vs. optional fields
- Error format (what to output when something fails)
- Stop conditions (when to stop generating)

**Applied to code agents:**
- When asking for code generation: "Output only the diff, no explanation"
- When asking for analysis: "Format as `file:line → finding → suggestion`"
- When asking for a plan: "Return numbered list with file paths and estimated changes"

## Generate-evaluate-repair loop

Instead of solving complex problems in one pass, split into three independent stages:

```
1. GENERATE — Produce a solution (minimal prompt, no self-critique)
2. EVALUATE — Check the solution against constraints (separate prompt, focused on finding violations)
3. REPAIR — Fix only the violations found (separate prompt, targeted fixes)
```

**Why this works:**
- Each stage has a single, clear objective
- The model doesn't critique and generate simultaneously (which degrades both)
- Repair is cheaper than regeneration from scratch
- Token usage is more predictable
- Evaluation can be automated with test suites

**Applied to code agents — debugging workflow:**
1. Generate a fix
2. Run lint + tests (evaluation)
3. Repair only the failures found
Repeat until clean.

**Applied to CLAUDE.md maintenance:**
1. Dreaming reviews memory (evaluate)
2. Produces proposed diff (repair)
3. User applies after review
Same loop, different scale.

## Tool use over verbal instruction

"Telling the model it's critical to do a calculation right doesn't make it better at mental math."

Don't say "be careful with X." Instead, give it the tool/process for X.

| Bad instruction | Good instruction |
|---|---|
| "Make sure imports are correct" | "Run `mypy .` after editing" |
| "Handle errors properly" | "Wrap in try/except with specific error types, log the traceback" |
| "Keep the code clean" | "No more than one blank line, functions under 50 lines, match existing style" |

## Balanced instructions

The model needs both sides of a tradeoff. If you only mention cost, it avoids the action. If you only mention benefit, it overdoes it.

"Escalating to a human costs $8, but getting this wrong costs a refund AND customer trust."

**Applied to code agents:**
| Unbalanced | Balanced |
|---|---|
| "Never install packages" | "Never install packages to fix errors. If a new dependency is genuinely needed, confirm with the user." |
| "Always use the shortest solution" | "Use the simplest solution that's correct on edge cases. Simplicity is not an excuse for flimsy algorithms." |
| "Don't add comments" | "Don't add comments to explain what code does — the code should be clear. Add comments only for WHY when non-obvious." |

## Model selection

Different models have different reasoning capabilities, token efficiency, and latency profiles. The same prompt produces different results on different models.

**Applied to OpenCode:**
- The CLAUDE.md instructions should work for different models (the global CLAUDE.md is model-agnostic)
- For project agents (like OpenGEO Lab's Ollama agents), match model to task complexity as specified in `docs/agents.md`

## Prompt architecture — separate concerns

Complex prompts should have clear sections with distinct purposes:
1. **System role** — what the agent is, its capabilities
2. **Policies** — hard constraints, never-violate rules
3. **Data** — reference information, facts, context
4. **Instructions** — step-by-step process, decision rules

**Applied to CLAUDE.md architecture:**
- `## Output` = policies (format rules)
- `## Working method` = instructions (decision rules)
- `## Architecture quick reference` = data (project facts)
- `## Code rules` = policies (hard constraints)

## Version control for prompt changes

From the workshop: "A best practice is using version control. Wherever we are making defensive changes in the prompt, we are tracking the reason why we've introduced these. Sometimes they're necessary, but in the future these changes can produce unwanted effects, so that we can backtrack on them."

**Applied to CLAUDE.md:**
- Every defensive instruction (like "never X" or "always Y") should have a git commit explaining WHY it was added
- When reviewing CLAUDE.md during dreaming, check if defensive patches are still needed or if the model has outgrown them
- The transcript example: "Never give a customer the wrong plan details. Instead, point them to the URL." — was a patch for an old model that a newer model overfitted to. The rule became counterproductive.

## Positive instructions over ban lists

From the workshop wrap-up: "Avoiding long ban lists" was cited as a key takeaway.

**Anti-pattern:**
```
Don't use TypeScript enums
Don't use default exports
Don't use class components
Don't use relative imports beyond ../../
```

**Better — positive framing:**
```
Use const objects with `as const` for enumerated values
Use named exports
Use functional components with hooks
Keep imports within the src/ directory
```

The model optimizes for what you tell it. A ban list forces it to navigate around forbidden territory. Positive instructions give it a clear target to aim for.

**Applied to CLAUDE.md:** Audit existing instructions. Replace "don't do X" patterns with "do Y instead" wherever possible.

## Self-check before output

From the scheduling agent segment: "Most critically telling it to check its work before outputting it."

The model can produce reasoning, code, or analysis — and then review its own output for violations before presenting it. This is the self-verification pattern, separate from the generate-evaluate-repair loop.

**Applied to code agents:**
- After generating code, the agent should run lint/typecheck on its own output before showing it
- After writing memory, verify the file is syntactically correct
- After proposing a diff, confirm it applies cleanly

## Information withholding (opposite of hallucination)

From the transcript: "We worry a lot about hallucinations or the invention of facts and numbers, but actually the opposite can also happen. The model can withhold information that it actually has access to."

This happens when a defensive instruction ("never give the customer wrong information") is stronger than the instruction to provide accurate data. The model chooses silence over potential inaccuracy.

**Applied to code agents:**
- "Don't add comments" → agent removes ALL comments, even license headers
- "Don't guess" → agent says "I don't know" for questions it could answer by reading a file
- Fix: "Don't add explanatory comments. Keep license headers and existing docstrings. When uncertain, read the relevant file before answering."
