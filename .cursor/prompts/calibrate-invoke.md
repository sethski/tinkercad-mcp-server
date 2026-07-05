---
description: "For the last response: assign numeric confidence, list evidence, state what would change the answer."
---

Your task: **calibrate** the previous response in this conversation.

Re-examine your last substantive response and produce:

```
**Confidence:** [Band] ([percentage])

**Evidence supporting this recommendation:**
1. [Specific source — code read, docs checked, mechanism verified]
2. [...]
3. [...]

**Assumptions made (not verified):**
- [Assumption]: [what happens if wrong]

**Would change recommendation if:**
- [Specific new information or condition]
- [...]

**Verified vs unverified:**
- Verified: [what you actually checked in this session]
- Unverified: [what you inferred or assumed]
```

Use the confidence bands from `.cursor/harness/calibration.md`. Be honest — this is a self-audit, not a sales pitch.

If the previous response was a simple factual answer with high certainty, say so briefly without the full format.
