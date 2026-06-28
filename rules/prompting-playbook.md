# Prompt Maintenance Playbook

Process-oriented rules for keeping prompts (including CLAUDE.md) effective over time.

## Prompt hygiene

Remove these on sight:
- Instructions patching old model limitations that no longer apply
- Content copy-pasted from websites (hero images, cookie references)
- Model described as a human ("you are a helpful assistant")
- Policy, data, and guidelines all in one blob

**Test:** "Can I distinguish policy from data from guidelines at a glance?" If not, the model can't either.

## Evaluations

Every prompt change needs test cases:
1. Control case (happy path — must always pass)
2. Edge cases (previously seen failures)
3. Refusal case (model should say no)
4. Escalation case (model should defer to human/tool)
5. Calculation case (numeric precision)

For CLAUDE.md: if an instruction is ignored 3 times in a row, it's either unclear or out of date.

## Instruction quality

| Pattern | Bad | Good |
|---|---|---|
| Tool over verbal | "Make sure imports are correct" | "Run `mypy .` after editing" |
| Balanced tradeoffs | "Never escalate" | "Escalation costs $8, but getting it wrong costs trust" |
| Positive framing | "Don't use enums, don't use default exports" | "Use const objects, use named exports" |
| Concrete over vague | "Handle errors properly" | "Wrap in try/except with specific types, log the traceback" |

Ban lists force navigation around forbidden territory. Positive instructions give a clear target.

## Information withholding

Opposite of hallucination: a defensive instruction ("never give wrong info") can be stronger than the accuracy instruction ("give accurate info"). The model stays silent rather than risk saying something wrong.

Fix: "Give accurate information. If uncertain, state what you checked and why you're uncertain."

## CLAUDE.md-specific maintenance

- Separate concerns: `## Output` = format policies, `## Working method` = decision rules, `## Architecture` = project data, `## Code rules` = hard constraints
- Every defensive rule needs a git commit explaining why it was added
- During dreaming, re-check if model outgrew old patches
- Periodically test: is every instruction still relevant after 10+ sessions?
- Positive over negative: "Use functional components" not "Don't use class components"
