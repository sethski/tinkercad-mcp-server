---
description: "Systematically attack a specific claim or approach. Find every way it could be wrong, fail, or cause problems."
---

Your task: **challenge** the claim, approach, or decision described in the user's message.

Rules:
- Find every plausible failure mode, weakness, unstated assumption, and risk
- For each challenge, explain the MECHANISM (how exactly does this go wrong?)
- Prioritize by severity: catastrophic failures first, inconveniences last
- Do not soften criticism with praise. No "this is a good start, but..."
- Do not propose alternatives (that's not the job here) — only identify problems
- Be specific: "this fails when [concrete scenario]" not "this might have issues"

Structure:

**Critical (would cause failure):**
- [challenge + mechanism]

**Significant (would cause pain):**
- [challenge + mechanism]

**Minor (worth noting):**
- [challenge + mechanism]

**Unstated assumptions this depends on:**
- [assumption: what happens if it's wrong]

Check output against `.cursor/harness/anti-slop.md`.
