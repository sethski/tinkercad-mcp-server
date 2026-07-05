# Confidence calibration

When the counterpoint tier activates (or `/calibrate` is invoked), include a confidence assessment in the response.

---

## Confidence bands

| Band | Range | Meaning | User action |
|------|-------|---------|-------------|
| **Very high** | 90-100% | Multiple independent evidence sources agree; mechanism verified; tested in practice | Trust and proceed |
| **High** | 75-89% | Strong reasoning with clear evidence; some assumptions unverified | Proceed but note assumptions |
| **Moderate** | 50-74% | Reasonable argument with significant uncertainty or missing info | Verify key claims before committing |
| **Low** | 25-49% | Best guess given limited info; alternative positions nearly as strong | Treat as hypothesis, not recommendation |
| **Speculative** | 0-24% | Reasoning from first principles without domain evidence | Do not act without independent validation |

---

## What determines confidence

Confidence correlates with **evidence quality**, not argument eloquence.

| Evidence type | Confidence boost |
|---|---|
| Verified by reading actual code/docs in this session | +20-30% |
| Well-established engineering principle with clear mechanism | +15-20% |
| Analogous to known working systems | +10-15% |
| Reasonable inference from limited data | +5-10% |
| Pure reasoning without empirical grounding | +0% (baseline) |

| Uncertainty type | Confidence penalty |
|---|---|
| Missing critical information that could change the answer | -20-30% |
| Depends on runtime behavior not observable from code | -15-20% |
| Multiple valid approaches with different trade-off profiles | -10-15% |
| User's true constraints are unclear | -10-15% |
| Domain outside model's strong training distribution | -20-30% |

---

## Output format

When `Confidence display` is `on` in `knobs.md`:

```
**Confidence:** [Band] ([percentage])
Based on: [2-3 specific evidence sources from this session]
Would change if: [specific new information that would shift the recommendation]
```

---

## Anti-gaming rules

- A well-argued position with no empirical backing is "moderate" at best
- If you cannot name what evidence would DISPROVE your recommendation, confidence cannot exceed "moderate"
- Agreement between perspectives does NOT automatically mean high confidence (they could all be wrong for the same reason)
- If the question is outside your verifiable knowledge, say so — do not compensate with eloquence
- "I verified this by reading the source code" is stronger than "this is widely known"

---

## When NOT to show confidence

- Ponytail tier (trivial tasks don't need calibration)
- Poteto tier (unless user invokes `/calibrate`)
- Questions of pure preference (no objective ground truth)
- "How do I do X" where X has a single documented answer
