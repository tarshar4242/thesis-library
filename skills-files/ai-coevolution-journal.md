---
name: ai-coevolution-journal
description: Complete real work while preserving the user's ideas, decision context, corrections, and reusable learning. Use when the user starts or opens a project, designs a platform or workflow, plans research, collaborates with ChatGPT/Claude/Codex, writes VBA/Python code, creates a skill, or explores a task where new ideas may change direction. Also use when the user needs a detailed AI co-evolution journal, dynamic scope boundaries, a decision record, or reusable rule and skill extraction.
---

# AI Co-evolution Journal

Complete the requested output first. Preserve exploration without allowing every idea to hijack execution. Treat scope as the current best hypothesis, not an immutable contract.

## Non-negotiable principles

- Keep one active main line, but allow it to change through an explicit decision.
- Capture every meaningful idea with its original context before classifying it.
- Distinguish learning-driven change from attractive scope expansion.
- Do not interrupt the task merely to explain the method. Maintain the journal while working and deliver it with the requested output.
- Do not ask the user to reconstruct information already present in the conversation or workspace.
- Stop when the agreed outcome and required journal outputs are complete.
- Never diagnose ADHD; use the system as an executive-function support pattern.

## Start the work

At task start, create a compact internal work contract:

```text
Main line:
Why it matters:
Current definition of done:
Current assumptions:
In scope:
Not now:
Known constraints:
```

Do not require the user to fill this form when context already answers it. Infer conservatively, state only material assumptions, and begin producing.

Select the operating phase:

- `EXPLORE`: assumptions or architecture are still uncertain; permit deliberate divergence.
- `CONVERGE`: direction is selected; protect completion while retaining an explicit reopen path.
- `DELIVER`: finish, verify, document, and stop; accept only blockers or correctness fixes.

## Capture ideas without losing fidelity

When a meaningful idea appears, record:

```text
Idea:
Trigger / Why now:
Potential value:
Affected assumption, component, or decision:
Cost or risk of delaying:
Smallest useful test:
```

Preserve the idea before shortening or categorizing it. A one-line parking item is insufficient when its value depends on the moment in which it appeared.

## Pass every idea through the Idea Gate

Classify the idea:

- `DIRECTION-CHANGING`: challenges the goal, user value, core assumption, or makes the current route wrong. Pause, compare paths, decide explicitly, and update the main line if accepted.
- `ARCHITECTURE-IMPACTING`: affects interfaces, data model, platform, irreversible choices, safety, or likely rework. Run the smallest time-boxed validation needed to decide.
- `ENHANCEMENT`: adds polish, convenience, automation, coverage, or a future feature without invalidating the current route. Preserve it and continue.

Use these gate questions:

1. Does this reveal that the present goal or core assumption is wrong?
2. Would delaying it create substantial rework, lock-in, safety risk, or lost evidence?
3. Is the decision reversible and cheap to postpone?
4. Does it improve the current outcome, or merely enlarge it?
5. What is the smallest test that would reduce uncertainty?

Resolve the gate into one state:

- `NOW`: necessary work already inside the main line.
- `BLOCK`: unresolved issue that prevents a valid result.
- `TEST`: bounded validation for an architecture-impacting idea.
- `PARK`: preserved idea, not active now.
- `NEXT`: eligible candidate after the present definition of done.
- `REJECT`: considered and intentionally declined, with reason.

Read [decision-system.md](references/decision-system.md) when classification is ambiguous, several ideas compete, or a detailed journal is requested.

## Maintain the decision journal

Record events only when they change understanding, direction, or future behavior:

```text
Time / sequence:
Context:
Initial belief:
New signal:
Options considered:
Decision:
Why:
What was not chosen and why:
Consequence:
Confidence / unresolved question:
```

Maintain rejected routes as evidence; do not rewrite the story as if the final answer was obvious from the beginning.

## Run the AI correction loop

When the user corrects the AI:

1. Preserve the specific correction.
2. Identify the reason the output missed the user's intent.
3. Separate a one-off preference from a reusable pattern.
4. Propose a concise rule, anti-pattern, checklist item, or decision gate.
5. Apply the correction to the current work.
6. Include the proposed reusable learning in the final extraction; do not silently change permanent systems unless authorized.

Use:

```text
Observed miss:
User correction:
Underlying cause:
Reusable rule:
Where it should apply:
Evidence needed before promoting it:
```

## Extract reusable skill assets

At completion, inspect the journal for:

- `RULE`: a stable behavioral constraint.
- `PATTERN`: a recurring successful approach.
- `ANTI-PATTERN`: a failure mode to avoid.
- `DECISION GATE`: questions that distinguish two paths.
- `CHECKLIST`: repeatable verification.
- `PROMPT`: reusable initiation or handoff language.
- `WORKFLOW`: a repeatable sequence.
- `KNOWLEDGE GAP`: missing information exposed by real work.

Promote an item only when it is specific, actionable, and supported by the current evidence. Mark uncertain items as candidates rather than rules.

## End and output

End only when:

- the requested real-world output exists;
- the definition of done is satisfied or any genuine blocker is reported;
- material ideas are classified;
- important decisions and corrections are recorded;
- reusable learning is extracted;
- the next action is explicit;
- no unrequested next phase has begun.

For a light request, return a short session record. For a full journal request, copy and complete [journal-template.md](assets/journal-template.md).

Always lead with the completed outcome. Use this final structure unless the user requests another:

```text
1. Completed output
2. AI co-evolution journal
3. Decision ledger
4. Idea inventory by state
5. AI corrections
6. Skill extraction candidates
7. Next action
```
