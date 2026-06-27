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

## Iteration is the process

Prompt engineering is empirical. If the first prompt produces wrong output:
1. Identify what was misunderstood
2. Add that clarification to the prompt
3. Re-run and compare
4. Repeat until consistent

Applied to OpenCode: if the agent repeatedly misunderstands a task, that pattern should be recorded in `.opencode/memory/errors.md` and the CLAUDE.md should be updated to prevent recurrence.
