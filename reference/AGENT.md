# Reference system — agent instructions

Portable session-start procedure. Any harness can point here; paths below are relative to repo root.

**Canonical addresses**

| What | Path |
|------|------|
| Tunables | `reference/knobs.md` |
| Commit thresholds + QA settings | `reference/budget.md` |
| Prompt log | `reference/metrics/sessions.jsonl` |
| Human-readable state | `reference/metrics/state.md` |
| Pending commit draft | `reference/metrics/pending-commit.md` |
| Repo manifest (AI-only) | `reference/steering/CODEBASE.md` |
| Project identity | `reference/steering/CONTEXT.md` |
| Decision log | `reference/steering/DECISIONS.md` |
| Drift log | `reference/steering/DRIFT.md` |
| Tensions log | `reference/steering/TENSIONS.md` |

---

## When to run

At **session start**, before routing or other work — unless the user said `quick` / `ponytail only` / `just fix it` and the task is trivial formatting only.

Also run when the user says **`/refresh-context`** or **`refresh context`** (forces full scan regardless of count).

---

## Mode detection

Read `reference/metrics/sessions.jsonl` (last line = current state) and `reference/metrics/pending-commit.md` if it exists.

| Mode | Condition |
|------|-----------|
| `first_ever` | `sessions.jsonl` missing or empty |
| `commit_draft_pending` | `pending-commit.md` exists and has a suggested message |
| `refresh_due` | `since_refresh` >= Refresh interval in `reference/knobs.md`, OR manual `/refresh-context` |
| `normal` | Otherwise |

**Priority:** `commit_draft_pending` → `first_ever` → `refresh_due` → `normal`

---

## Session counter

Append **one line** to `reference/metrics/sessions.jsonl` per user message.

```json
{"ts": "ISO8601", "session": N, "prompt_total": N, "since_refresh": N, "since_commit_draft": N, "trigger": "first_ever|normal|refresh_done|manual|commit_draft_pending"}
```

**Field rules**

- `session` — increment when starting a new chat thread; same thread keeps the same session number.
- `prompt_total` — monotonic all-time count (+1 each prompt).
- `since_refresh` — +1 each prompt; reset to `0` after a context refresh completes.
- `since_commit_draft` — +1 each prompt; reset to `0` after user confirms/skips a commit draft.
- `trigger` — what mode ran this update.

Rewrite `reference/metrics/state.md` after every counter update (human-readable countdown).

---

## Mode: `first_ever`

1. Ask the user: anything to never include in the codebase map? File patterns to permanently exclude?
2. Merge answers into `reference/knobs.md` → Scan exclusions.
3. Run **full repo scan** (see below).
4. Write `reference/steering/CODEBASE.md`, `CONTEXT.md`; ensure `DECISIONS.md`, `DRIFT.md`, and `TENSIONS.md` scaffolds exist.
5. Append JSONL with `trigger: first_ever`, rewrite `state.md`.
6. Proceed with normal routing.

---

## Mode: `refresh_due`

1. Run **delta scan**.
2. Patch `CODEBASE.md` — prefer delta sections; do not full-rewrite unless badly stale.
3. If `DRIFT.md` is `on` in knobs — append drift entry.
4. Append JSONL with `trigger: refresh_done`, `since_refresh: 0`, rewrite `state.md`.
5. Proceed with normal routing.

---

## Mode: `normal`

1. Append JSONL with `trigger: normal`, increment counters, rewrite `state.md`.
2. Read `reference/steering/CODEBASE.md` and `CONTEXT.md` for ambient context.
3. Proceed with normal routing.

---

## Scan procedures

Read `reference/knobs.md` for **Scan depth** and **Scan exclusions**.

### Full scan

1. Walk repo tree; respect exclusions.
2. For each non-trivial file: one-line purpose summary.
3. Write `CODEBASE.md` in manifest format.
4. Write or update `CONTEXT.md`.

### Delta scan

1. List current tree (same exclusions/depth).
2. Diff against `CODEBASE.md`.
3. Added → append with summaries. Removed → mark removed. Changed → update summary.
4. Update `GENERATED` header and `KNOWN DRIFT` footer.

---

## Decision logging

When `DECISIONS.md` is `on` in `reference/knobs.md`, append when:

- User chose between named approaches
- Agent recommended and user confirmed an architectural pattern
- Significant refactor, migration, or tool choice
- User says `log this` / `log decision`

```markdown
## [DATE] — [One-line summary]
Reason: [why]
Alternatives considered: [if any]
```

---

## Tension logging

When the counterpoint tier surfaces TRADE-OFF tensions (see `.cursor/harness/counterpoint.md` Stage 4), append to `reference/steering/TENSIONS.md`:

```markdown
## [DATE] — [Decision summary]
Tension: [axis of disagreement]
Chose: [option] because [reason]
Risk accepted: [downside of chosen option]
Revisit when: [trigger condition]
```

---

## Manual overrides

| User says | Effect |
|-----------|--------|
| `/refresh-context` | Force full scan now |
| `skip reference` | Skip counter/scan this turn only |
| `log this` / `log decision` | Append to `DECISIONS.md` |
