# Prompt Engineering — Rules for Writing Instructions

Apply these when writing prompts for sub-agents, tools, or LLM calls.

## Structure

```
1. TASK — What to do. Be explicit: "Fix calculateTotal() returning NaN for negative inputs."
2. CONTEXT — Dynamic data to analyze (code, logs, specs).
3. INSTRUCTIONS — Step-by-step reasoning + output format.
```

Bad: "Fix this bug."
Good: "Read `calculateTotal` in `src/billing.ts`. Trace negative quantity through callers. Output the minimal diff."

## Rules (ordered by priority)

1. **Task first.** State what to do before providing data. Stable context (rules, schemas) before dynamic data (logs, code).
2. **Use delimiters.** XML tags or markdown headers separate instructions from content. Prevents context bleeding.
3. **Output format upfront.** "JSON only", "just the diff", "file:line references."
4. **Few-shot for complex tasks.** One correct input/output pair > paragraphs of explanation. Show an existing pattern from the codebase.
5. **Anti-hallucination guardrails.** "State if uncertain", "cite file:line", "insufficient data → say so." Remind of the task at the end.
6. **Step-by-step reasoning.** Break complex tasks into sequential steps. Order matters: read form → analyze sketch → make verdict.
7. **Prefilled output.** Start the response with the expected format token to suppress preamble: prefill with `{` for JSON, `<tag>` for XML, ` ```diff` for code.
8. **Tool over verbal.** Don't say "be careful with X." Give a specific tool/process: "Run `mypy .` after editing" not "make sure imports are correct."
9. **Balanced instructions.** Give both sides of every tradeoff. "Never install packages to fix errors. If a new dependency is genuinely needed, confirm with the user."
10. **Version control for defensive rules.** Every "never X" or "always Y" needs a git commit explaining WHY. Re-check during dreaming — model improvements may make the rule counterproductive.

## Debugging prompts

- **Extended thinking transcript:** read the model's reasoning to find where it went wrong. Bake the correct path into the prompt.
- **Iterate empirically:** identify the misunderstanding → add clarification → re-run → repeat.
- **Cite evidence:** every factual claim must reference its source (`file:line`, log line, session ID).

## Output contracts

Specify: exact format (JSON schema / XML tags), required vs optional fields, error format, stop conditions.
