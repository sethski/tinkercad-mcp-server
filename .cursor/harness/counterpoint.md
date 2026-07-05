# Counterpoint reasoning protocol

When the router selects the **counterpoint** tier, execute this protocol inside extended thinking before producing a response.

This is not a checklist to announce. It is a reasoning discipline. The user sees only the synthesis unless verbosity is set to `transparent`.

---

## Stage 1 — Decompose (~100 tokens)

Identify the actual decision being made. Do not restate the user's question — decompose it.

Ask:
- What are the **decision axes**? (e.g., "simplicity vs extensibility", "latency vs correctness", "security vs usability")
- What **assumptions** is the user making? (unstated constraints, implied preferences)
- What **information is missing** that would change the answer?
- What is the **blast radius** of getting this wrong?

Output: 2-4 named axes of tension. If there is only one reasonable answer and no real tension, note this and skip to Stage 5 (early termination).

---

## Stage 2 — Steelman (~200-400 tokens per perspective)

For each decision axis, generate the **strongest possible argument** for each position.

Rules:
- Each perspective argues FROM its specialty, not as a generic critic
- Argue FOR, not against. Build the best case. Make each position sound compelling.
- Use concrete evidence, mechanisms, and precedent — not appeals to authority or "best practice"
- Maximum perspectives: read `Max perspectives` from `knobs.md` (default 4)
- Select perspectives using `.cursor/harness/perspectives.md` activation rules

The goal is to make each position maximally strong BEFORE testing it. Weak steelmen produce weak analysis.

---

## Stage 3 — Cross-examine (~200 tokens)

Now challenge each steelmanned position:

- "If this claim were true, what else would we expect to see?"
- "What evidence would DISPROVE this position?"
- "What is this perspective ignoring or underweighting?"
- "Where does this argument depend on an unstated assumption?"

Flag:
- **Unsupported claims** — asserted without evidence
- **Contradicted claims** — evidence exists against them
- **Assumption-dependent claims** — true only if [X] holds

If `Early termination` is `on` in knobs and all perspectives agreed in Stage 2, skip this stage.

---

## Stage 4 — Tensions (~100 tokens)

Classify each disagreement:

| Type | Meaning | Action |
|------|---------|--------|
| **RESOLVED** | One side is clearly wrong after cross-examine | Eliminate the weaker position |
| **TRADE-OFF** | Genuine tension; requires user values to decide | Document what is gained and lost with each choice |
| **UNKNOWN** | Cannot resolve without information we don't have | Flag as remaining uncertainty |

For TRADE-OFFs: state exactly what the user gains and loses with each choice. No hedging.

---

## Stage 5 — Synthesize (becomes the response)

Produce the final response. Format depends on `Counterpoint verbosity` in `knobs.md`:

### When verbosity is `synthesis` (default):

```
Route: counterpoint — [one-line reason]

[Primary recommendation]

[Explanation: 2-5 sentences on WHY, grounded in evidence from the analysis]

**Rejected alternatives:**
- [Alternative]: [one-line reason it lost]

**Trade-offs accepted:**
- [What this sacrifices] for [what it gains]. Revisit if [condition].

**Confidence:** [band] ([percentage])
Based on: [evidence sources]
Would change if: [specific new information]
```

### When verbosity is `transparent`:

```
Route: counterpoint — [one-line reason]

**Decision axes:** [list]
**Perspectives activated:** [list]

**Steelman positions:**
[Summary of each position]

**Cross-examine results:**
[What survived, what didn't]

**Tensions:**
[RESOLVED / TRADE-OFF / UNKNOWN for each axis]

**Synthesis:**
[Same as synthesis format above]
```

### When verbosity is `tensions-only`:

```
Route: counterpoint — [one-line reason]

[Primary recommendation in 1-2 sentences]

**Tensions:**
- [Axis]: chose [X] over [Y] because [reason]. Risk: [what could go wrong].
```

---

## After responding

If the analysis surfaced TRADE-OFF tensions, append to `reference/steering/TENSIONS.md`:

```markdown
## [DATE] — [Decision summary]
Tension: [axis]
Chose: [option] because [reason]
Risk accepted: [downside of chosen option]
Revisit when: [trigger condition]
```

---

## Anti-patterns in counterpoint reasoning

- Do NOT produce perspectives that all agree from the start — that means the question wasn't worth counterpoint. Downgrade to poteto.
- Do NOT let one perspective dominate by generating 3x more text — equal weight.
- Do NOT average positions into mush. Pick a winner and explain WHY it won.
- Do NOT hedge the synthesis with "it depends on your needs" — name the specific needs and their implications.
- Do NOT manufacture fake disagreement to justify the tier. If the answer is obvious, say so and move on.
