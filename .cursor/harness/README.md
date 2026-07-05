# Agent harness — reference index

Context library for this workspace. The router lives in `.cursor/rules/counterpoint.mdc` (short); details in `router.md` and `knobs.md`.

## When to open what

| User intent | Read |
|-------------|------|
| Route / classify / QA gate | `router.md` + `knobs.md` |
| Tune thresholds | `knobs.md` |
| Full counterpoint protocol | `counterpoint.md` |
| Perspective selection | `perspectives.md` + `plugins/` |
| Anti-slop check | `anti-slop.md` |
| Confidence calibration | `calibration.md` |
| Implementation ladder | `ladder.md` |
| Upstream sync | `upstream.md` |
| Session state, prompt count | `reference/AGENT.md` |

## Tiers

| Tier | When | Behavior |
|------|------|----------|
| **Ponytail** | Low complexity, low stakes | Fast, direct, YAGNI. No ceremony. |
| **Poteto** | High complexity, low-mid stakes | Structured plan-first. Gather context, plan, execute. |
| **Counterpoint** | High complexity, high stakes | Adversarial reasoning inside extended thinking. Multi-perspective analysis. |

## Maintenance

- **Knobs:** `knobs.md` only (not the MDC).
- **Router logic:** `router.md` + slim `counterpoint.mdc`.
- **Perspectives:** `perspectives.md` for core; `plugins/` for custom.
- **Ladder:** keep `ladder.md` local and testable.
