# Router knobs

Edit this file to tune routing. The always-on rule reads values from here — no hardcoded thresholds in the MDC.

## Routing

| Setting | Value | Options |
|---------|-------|---------|
| **Default** | `auto` | `auto` / `poteto` / `ponytail` / `counterpoint` / `both` |
| **Short prompt (words)** | `100` | At or under → lean ponytail when complexity is low |
| **Long prompt (words)** | `200` | At or over → lean poteto/counterpoint when complexity is high |
| **QA gate** | `on` | `on` / `off` |
| **Gate once per thread** | `on` | `on` / `off` |

## Counterpoint

| Setting | Value | Options |
|---------|-------|---------|
| **Max perspectives** | `4` | Cap for token efficiency; router selects most relevant |
| **Counterpoint verbosity** | `synthesis` | `synthesis` (final only) / `transparent` (show reasoning stages) / `tensions-only` (just trade-offs) |
| **Auto-escalate** | `on` | `on` / `off` — poteto escalates to counterpoint when genuine tension found |
| **Early termination** | `on` | `on` / `off` — skip cross-examine if all perspectives agree |
| **Confidence display** | `on` | `on` / `off` — show confidence band in counterpoint responses |

## Stakes detection

| Setting | Value |
|---------|-------|
| **High-stakes keywords** | `architecture`, `security`, `migration`, `should we`, `design decision`, `trade-off`, `strategy`, `which approach`, `production`, `data model`, `API contract`, `breaking change`, `encrypt`, `auth`, `irreversible` |

## Overrides (in any prompt)

| Say | Effect |
|-----|--------|
| `quick`, `ponytail only`, `just fix it` | Ponytail, no gate |
| `poteto`, `structured` | Poteto, no gate |
| `counterpoint`, `challenge this`, `debate`, `full reasoning`, `think harder` | Counterpoint, no gate |
| `both`, `full stack` | Counterpoint + ladder on every edit |
| `auto` | Reset to auto-classification |

Count words in the **user's latest message only**. Attachments and `@`-files add complexity weight, not word count.

**Forced default** (not `auto`) skips classification and gate.
