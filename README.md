# Counterpoint

A Cursor Agent Harness for critical reasoning.

Clone this repository, open it in Cursor, and your AI assistant starts thinking adversarially about high-stakes decisions instead of agreeably producing the first reasonable answer.

## What it does

Counterpoint transforms Cursor's reasoning through three tiers:

| Tier | When | Behavior |
|------|------|----------|
| **Ponytail** | Simple, low-stakes tasks | Fast and direct. No ceremony. |
| **Poteto** | Complex but routine work | Structured plan-first approach. |
| **Counterpoint** | High-stakes decisions | Multi-perspective adversarial reasoning. Surfaces trade-offs. Picks a winner. |

The harness automatically classifies queries by complexity and stakes, routing to the appropriate tier. You can also override manually.

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/counterpoint.git
cd counterpoint
# Open in Cursor — that's it.
```

The `.cursor/rules/counterpoint.mdc` rule activates automatically.

## Manual triggers

| Say this | Get this |
|----------|----------|
| `quick` / `just fix it` | Ponytail (fast, minimal) |
| `poteto` / `structured` | Poteto (plan-first) |
| `counterpoint` / `think harder` / `challenge this` | Counterpoint (adversarial reasoning) |

## Slash commands

| Command | Purpose |
|---------|---------|
| `/counterpoint` | Force counterpoint tier |
| `/steelman [position]` | Strongest argument FOR a position |
| `/challenge [claim]` | Find every way it could be wrong |
| `/tensions` | Show active unresolved trade-offs |
| `/revisit [topic]` | Re-examine a past decision |
| `/calibrate` | Confidence audit of last response |

## What makes counterpoint responses different

Instead of:
> "That's a great approach! Here's how to implement it..."

You get:
> "This decision involves a trade-off between X and Y. The strongest case for X is [evidence]. The strongest case for Y is [evidence]. X wins because [specific reason]. This sacrifices [what you lose]. Revisit if [condition changes]."

## Tuning

Edit `.cursor/harness/knobs.md` to adjust:
- Word-count thresholds for tier classification
- Maximum perspectives per query (default: 4)
- Verbosity level (synthesis / transparent / tensions-only)
- Stakes detection keywords
- Auto-escalation behavior

## Adding custom perspectives

Drop a markdown file in `.cursor/harness/plugins/`. See the [plugin format](/.cursor/harness/plugins/README.md) and existing examples (regulatory, DX, data integrity).

## Architecture

```
.cursor/
    rules/counterpoint.mdc     → Always-on router
    harness/                   → Reasoning protocols and configuration
    prompts/                   → Slash commands
reference/                     → Session memory and project context
benchmark/                     → Evaluation fixtures
docs/                          → Philosophy, usage, extending
```

See [docs/USAGE.md](docs/USAGE.md) for detailed usage and [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) for design principles.

## Credits

Built on [Afro](https://github.com/Troy-LL/Afro) (routing, knobs, session memory) and [Ponytail](https://github.com/DietrichGebert/ponytail) (YAGNI ladder).

## License

MIT
