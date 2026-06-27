# Prompt Engineering — Applied to Code Agents

Synthesized from Anthropic's "Prompting 101" workshop. While the video focuses on human → model prompting, every principle applies to agent → agent and agent → code generation interactions.

## The prompt structure template

Every effective prompt has three layers:

```
1. TASK — Clear, explicit description of what to do
2. CONTEXT — Dynamic content to analyze (code, logs, specs)
3. INSTRUCTIONS — Step-by-step reasoning guide + output format
```

**Example (bad):** "Fix this bug"
**Example (good):** "The function `calculateTotal` in `src/billing.ts` returns NaN when passed a negative quantity. Read the function, trace the flow, propose a minimal fix, and output the diff."

## Task clarity

- Be explicit about the domain context. Ambiguous context → wrong assumptions → wrong solution.
- Specify the output format: "JSON only", "just the code change", "a plan first, then code"
- Define confidence levels: "State if uncertain" prevents hallucination

## Context ordering matters

Order information in the prompt the same way a human would reason:

1. **Form first** (stable, structural context) — codebase rules, schema, conventions
2. **Content second** (dynamic, instance data) — the specific file, error log, test output
3. **Analysis last** — then proceed to solve

Wrong order = the agent processes details before understanding the framework, leading to misinterpretation.

Applied to OpenCode: the CLAUDE.md itself is "form first" — it sets the stable rules. Project files are "content second."

## Stable form in system prompt

Information that's the same every time (code conventions, lint commands, architectural rules) belongs in CLAUDE.md (the system prompt equivalent). This is the "stable form" the Prompting 101 video describes — included once, cached, reused across sessions.

## Delimiters and structure

Use clear delimiters to separate sections:
- XML tags: `<instructions>...</instructions>` `<output>...</output>`
- Markdown headers: `## Task`, `## Context`, `## Instructions`
- Triple backticks for code blocks

Claude/OpenCode respects structural boundaries — delimiters prevent context bleeding between task description and code to analyze.

## Few-shot examples

For complex or ambiguous tasks, include 1-2 examples of correct input/output pairs. Examples:
- Ground the model in the expected format
- Demonstrate edge case handling
- Are more effective than paragraphs of explanation

Applied to code agents: when asking for a specific code pattern, show a working example from the existing codebase.

## Anti-hallucination guardrails

1. Remind of the specific task at the end of instructions
2. Instruct to state "insufficient data" rather than fabricate
3. Require citations/references for claims: "cite specific file:line"
4. Set a confidence bar: "Only answer if you can verify in the codebase"

## Output formatting

Always specify the expected output shape:
- "Return valid JSON matching this schema"
- "Output only the git diff, no explanation"
- "Format as markdown with `file:line` references"

Structured output (JSON, XML, typed code) is parseable and verifiable. Free text is ambiguous.

## Step-by-step reasoning

For complex tasks, break reasoning into sequential steps:

```
Step 1: Read all callers of the function
Step 2: Trace the failing input through each caller
Step 3: Identify the root cause (not symptom)
Step 4: Propose the minimal fix
```

This mirrors how the best human developers debug — and how the model thinks most effectively.

## Prefilled responses — "put words in Claude's mouth"

A technique from the Anthropic workshop: start the model's output with the expected opening tag or format symbol. This forces parsing-friendly output without preamble.

```
System: ... full instructions ...

User: Analyze this form and return your verdict.

Assistant: <final_verdict>
```

The model continues from `<final_verdict>` instead of generating "Based on my analysis of the form..." preamble. The output is directly parseable.

**Applied to code agents:**
- When asking for code: prefill with ` ```python\n` or ` ```diff\n`
- When asking for structured data: prefill with `{` or `<output>`
- When asking for a list: prefill with `1. `

## Extended thinking as prompt debugging tool

From the workshop: Claude (and modern models) have extended thinking — a scratchpad where reasoning happens between tool calls. You can analyze that reasoning transcript to understand HOW the model approaches data.

**The insight:** If the model produces wrong results, don't guess why. Read the thinking transcript. Find where the reasoning went wrong. Then update the prompt to guide the model through the correct reasoning path.

This is "baking human intuition into the system prompt" — extracting the model's own successful reasoning patterns and making them part of the stable instructions.

**Applied to OpenCode:**
- When the agent repeatedly fails at a task, don't just add a "don't do X" rule
- Trace the agent's actual reasoning steps
- Find where it diverged from the correct path
- Add a step-by-step reasoning guide to CLAUDE.md that walks through the correct approach

This is the same loop as dreaming, but at the single-task level: observe failure → trace reasoning → bake correct pattern into instructions.

## Cite evidence for every claim

From the workshop: "If it wants to say vehicle B turned right, it should say I know this based on the fact that box two is clearly checked."

Every factual claim should reference the specific source:
- Code facts: `file:line`
- Architecture claims: which file/grep confirmed it
- Error fixes: which log line or stack trace entry
- Memory entries: which session discovered it

This is the difference between "the frontend uses Redux" and "grep `createSlice` found in `src/store/slices/` — the frontend uses Redux Toolkit."

## Temperature 0 for deterministic tasks

The workshop uses temperature 0 for factual analysis. Same applies to code generation: deterministic output benefits from low temperature. Higher temperature is for creative/varied output (report prose, UI copy).

## Iteration is the process

Prompt engineering is empirical. If the first prompt produces wrong output:
1. Identify what was misunderstood
2. Add that clarification to the prompt
3. Re-run and compare
4. Repeat until consistent

Applied to OpenCode: if the agent repeatedly misunderstands a task, that pattern should be recorded in `.opencode/memory/errors.md` and the CLAUDE.md should be updated to prevent recurrence.
