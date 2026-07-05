# Usage guide

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/counterpoint.git
cd counterpoint
# Open in Cursor
```

The always-on rule (`.cursor/rules/counterpoint.mdc`) activates immediately. No configuration required.

## How routing works

Every prompt is classified on three dimensions:

1. **Word count** - short (<= 100 words), mid, or long (>= 200 words)
2. **Complexity** - low (single trivial action) or high (bug, feature, refactor, multi-file)
3. **Stakes** - low (reversible, local impact) or high (architecture, security, irreversible)

The combination determines the tier:

| Words | Complexity | Stakes | Tier |
|-------|-----------|--------|------|
| short | low | low | Ponytail |
| mid | high | high | Counterpoint |
| long | high | high | Counterpoint |
| mid | high | low | Poteto |
| ambiguous | | | Gate (asks you) |

## Overrides

Include these keywords anywhere in your prompt to force a tier:

- `quick`, `ponytail only`, `just fix it` → Ponytail
- `poteto`, `structured` → Poteto
- `counterpoint`, `challenge this`, `debate`, `think harder`, `full reasoning` → Counterpoint

## Slash commands

### `/counterpoint`
Forces counterpoint tier on the current question. Use when the router chose poteto but you want deeper analysis.

### `/steelman [position]`
Generates the strongest possible argument FOR a position. Useful for testing whether an idea holds up before you commit to it.

Example: `/steelman using a monorepo for our 3-service project`

### `/challenge [claim]`
Systematically attacks a specific claim. Finds every way it could be wrong.

Example: `/challenge our assumption that Postgres is fast enough for real-time features`

### `/tensions`
Surfaces all unresolved trade-offs from past counterpoint sessions. Useful for periodic review of accepted risks.

### `/revisit [topic]`
Re-examines a past decision. Checks whether the "revisit when" condition has been met.

Example: `/revisit our decision to use JWT instead of sessions`

### `/calibrate`
Produces a confidence audit of the previous response. Assigns a numeric confidence level, lists evidence, and states what would change the answer.

## Verbosity modes

Edit `.cursor/harness/knobs.md` → `Counterpoint verbosity`:

- **`synthesis`** (default) - Shows only the final recommendation with rejected alternatives and trade-offs
- **`transparent`** - Shows the full reasoning: decision axes, perspectives activated, steelman positions, cross-examine results
- **`tensions-only`** - Minimal: recommendation + trade-offs in 2-3 lines

## Custom perspectives

Create a markdown file in `.cursor/harness/plugins/` following the format in `plugins/README.md`. The perspective will automatically activate when its keywords are detected.

Example: a fintech team might add a `regulatory.md` perspective that activates on GDPR, PCI, SOC2 keywords.

## Session memory

The harness maintains:
- **DECISIONS.md** - Log of architectural choices made
- **TENSIONS.md** - Unresolved trade-offs from counterpoint sessions
- **DRIFT.md** - What changed since last scan
- **CODEBASE.md** - AI-facing repo manifest

These are maintained automatically. Say `/refresh-context` to force a rescan.

## Tuning

All thresholds are in two files:
- `.cursor/harness/knobs.md` - Routing and counterpoint settings
- `reference/knobs.md` - Session memory settings

Common adjustments:
- Lower `Short prompt (words)` if you want more things to route to ponytail
- Raise `Max perspectives` to 5-6 for very complex architectural discussions
- Set `Auto-escalate` to `off` if poteto-to-counterpoint escalation is too aggressive
- Set `Counterpoint verbosity` to `transparent` while learning how the system thinks
