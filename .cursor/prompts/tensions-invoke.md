---
description: "Surface all active unresolved trade-offs from the current project's TENSIONS.md."
---

Read `reference/steering/TENSIONS.md` and present all active tensions for this project.

For each tension:
1. Summarize the original decision and what was at stake
2. State what risk was accepted
3. Evaluate: has the "revisit when" condition been met based on current project state?
4. If yes: flag for reconsideration and briefly note what has changed

Format:

**Active tensions:** [count]

For each:
```
## [Decision summary]
Decided: [date]
Chose [X] over [Y] because [reason]
Risk: [accepted downside]
Revisit trigger: [condition] — Status: [not yet triggered / TRIGGERED / unclear]
```

If TENSIONS.md is empty or doesn't exist, say so and explain that tensions accumulate from counterpoint-tier sessions.
