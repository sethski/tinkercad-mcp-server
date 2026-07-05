# Router — classify, gate, execute

The always-on rule (`.cursor/rules/counterpoint.mdc`) points here for details.

## A. Word band

Read thresholds from `knobs.md`.

| Band | Condition |
|------|-----------|
| short | <= Short prompt words |
| mid | between Short and Long |
| long | >= Long prompt words |

## B. Classification dimensions

### Complexity (content — paths do not downgrade)

**Low** — all plausible:

- Single action on one known file (typo, blank line, rename, constant tweak)
- No bug, perf, refactor, feature, investigation, or verify-before-ship

**High** — any of:

- Bug, perf, refactor, migration, feature, investigation, CI/PR, architecture
- "how/why should", design fork, autonomous/long-running work
- Multi-file or unknown blast radius
- Large paste, stack trace, or `@`-attached context

**Naming a path does not lower complexity** when the task is still fix, refactor, investigate, or feature work.

### Stakes (decision weight — does this matter long-term?)

**High stakes** — any of:

- Architecture, system design, data model, API contract
- Security, auth, trust boundaries, encryption
- Migration, breaking change, deprecation
- "should we", "which approach", trade-off, strategy
- Production incident, data loss risk
- Irreversible or expensive-to-reverse decisions

**Low stakes** — all of:

- Implementation detail within established patterns
- Formatting, naming, single-file change
- Documentation, comments, tests for existing behavior
- Reversible in minutes

**Default:** If stakes are ambiguous, treat as mid (route to gate).

## C. Route matrix

When dimensions **agree**, route silently (no gate). Overrides or non-`auto` default → skip matrix.

| Word | Complexity | Stakes | Route |
|------|------------|--------|-------|
| short | low | low | **Ponytail** |
| mid | low | low | **Ponytail** |
| short | high | low | **Gate** |
| short | high | high | **Gate** |
| mid | high | low | **Poteto** |
| mid | high | high | **Counterpoint** |
| long | high | high | **Counterpoint** |
| long | high | low | **Poteto** |
| long | low | any | **Gate** |
| mid | mid | any | **Gate** |

## D. QA gate

When `QA gate` is `on` in `knobs.md` and matrix says **Gate**:

1. **Turn 1:** AskQuestion only — no Read, Grep, Shell, SemanticSearch, or subagents until the user answers. Classify from the user's message text and harness docs only.
2. One sentence why (~N words + complexity + stakes reason).
3. Options: **Counterpoint** / **Poteto** / **Ponytail only** (same order always).
4. **Gate once per thread** unless scope clearly escalates.
5. User ignores → default **Poteto**.

If gate is `off`: short+high → Poteto; long+low → Poteto; mid+mid → Poteto.

## E. Execute

### Ponytail

- No counterpoint process or todolist.
- **Trivial cap:** <=3 **task** tools before edit (read target → optional grep → edit). Harness reads for classification don't count.
- Ladder: `ladder.md`. Proof: one smallest check if non-trivial.

### Poteto

1. Gather enough context, make a short plan when scope is unclear.
2. Use subagents when parallel exploration or verification helps.
3. Apply `ladder.md` at implementation.
4. Verify the real path affected by the change before final response.

### Counterpoint

1. **Inside extended thinking**, follow `.cursor/harness/counterpoint.md` protocol fully.
2. Select perspectives per `.cursor/harness/perspectives.md` (max from `knobs.md`).
3. Apply `ladder.md` at implementation.
4. Include confidence per `.cursor/harness/calibration.md`.
5. Log tensions to `reference/steering/TENSIONS.md` when trade-offs surface.
6. Output format depends on `Counterpoint verbosity` in `knobs.md`.

### Auto-escalation

If during poteto planning, the agent discovers genuine disagreement between approaches (not just uncertainty but conflicting valid arguments), escalate to counterpoint. Announce: `Escalating to counterpoint — genuine tension detected between [X] and [Y].`

## F. Examples

| Prompt | Words | Complexity | Stakes | Result |
|--------|------:|------------|--------|--------|
| fix typo in README | ~4 | low | low | Ponytail |
| fix auth — tests fail on verifyToken | ~8 | high | low | **Gate** |
| should we use Redis or Postgres for sessions | ~9 | high | high | **Counterpoint** |
| refactor utils in src/utils.ts | ~8 | high | low | **Gate** |
| design the auth system for our new API | ~9 | high | high | **Counterpoint** |
| long feature spec (250+ words, high complexity) | long | high | high | Counterpoint, no gate |
| add a console.log to debug line 42 | ~8 | low | low | Ponytail |
