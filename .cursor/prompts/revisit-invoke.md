---
description: "Re-examine a past decision from DECISIONS.md or TENSIONS.md with fresh context. Has anything changed?"
---

Your task: **revisit** the decision or tension the user references.

Procedure:
1. Read `reference/steering/DECISIONS.md` and `reference/steering/TENSIONS.md`
2. Find the referenced entry (by topic, date, or keyword match)
3. Evaluate with current context:
   - Has the "revisit when" condition been triggered?
   - Has new information emerged that wasn't available at decision time?
   - Have project constraints changed?
   - Has the risk materialized?
4. If the decision still holds: say so concisely with updated reasoning
5. If the decision should be reconsidered: run a lightweight counterpoint analysis (Decompose → Steelman alternatives → Recommend)

Do not re-run the full counterpoint protocol unless the user explicitly requests it. A focused reassessment is sufficient.

End with one of:
- "Decision holds. No action needed."
- "Recommend reconsidering. [One-line reason]. Say `/counterpoint` to run full analysis."

Check output against `.cursor/harness/anti-slop.md`.
