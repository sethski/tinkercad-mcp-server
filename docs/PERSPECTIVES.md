# Perspectives — detailed reference

## Design principles

Perspectives are not personas. They are optimization lenses.

Each perspective is defined by what it optimizes for and what it's willing to sacrifice. This creates natural tension: the Architect wants flexibility, the Pragmatist wants simplicity. Neither is wrong. The counterpoint protocol surfaces where they disagree and helps the user make an informed choice.

## Why max 4 per query

Token efficiency. Each perspective adds ~200-400 tokens of reasoning in Stage 2 (steelman). With 4 perspectives, that's 800-1600 tokens of analysis before cross-examine.

More importantly: more than 4 perspectives produce diminishing returns. The core disagreement in most engineering decisions is between 2-3 fundamental values. Adding more perspectives generates noise, not signal.

## Core perspectives

These are always available for selection. At least 2 will activate on every counterpoint query.

### Architect
**Thinks in terms of:** boundaries, interfaces, coupling, cohesion, change tolerance
**Strongest when:** system design, service boundaries, data modeling, dependency decisions
**Weakest when:** "just ship it" tasks, prototypes, throwaway code
**Common position:** "Add an abstraction layer so we can swap this later"
**Gets challenged by:** Pragmatist ("you aren't gonna need it"), Performance ("that indirection has a cost")

### Pragmatist
**Thinks in terms of:** working software, minimum viable solutions, iteration speed
**Strongest when:** scoping decisions, MVP design, build-vs-buy, "is this necessary?"
**Weakest when:** long-lived systems, security-critical code, multi-team coordination
**Common position:** "Ship the simplest version and iterate"
**Gets challenged by:** Architect ("what happens when requirements change?"), Adversary ("what happens when it breaks?")

### Adversary
**Thinks in terms of:** failure modes, edge cases, malicious actors, race conditions
**Strongest when:** anything with users, state, concurrency, external dependencies, error handling
**Weakest when:** greenfield exploration, brainstorming, happy-path prototypes
**Common position:** "Here are 5 ways this breaks"
**Gets challenged by:** Pragmatist ("are those realistic scenarios?"), User Advocate ("you're optimizing for fear, not users")

### User Advocate
**Thinks in terms of:** friction, confusion, mental models, time-to-value
**Strongest when:** UX, API design, error messages, onboarding, documentation
**Weakest when:** pure backend/infra with no user surface
**Common position:** "The user shouldn't need to understand our internals to use this"
**Gets challenged by:** Architect ("the abstraction leaks because the underlying model is complex"), Performance ("that convenience has a latency cost")

## Domain perspectives

These activate only when their domain signals are detected.

### Security
**Activates on:** auth, tokens, encryption, permissions, user input, file upload, CORS, API keys, PII
**Not relevant for:** pure UI work, documentation, internal tooling with no external surface

### Performance
**Activates on:** database queries, caching, rendering, bundle size, latency targets, streaming, scale
**Not relevant for:** low-traffic admin tools, one-shot scripts, configuration changes

### Operations
**Activates on:** deployment, monitoring, CI/CD, rollback, infrastructure, incidents, observability
**Not relevant for:** local development tooling, single-developer projects, design discussions

### Product
**Activates on:** feature prioritization, roadmap, metrics, A/B testing, user research, market fit
**Not relevant for:** pure technical decisions with no business dimension

## Custom perspectives (plugins)

See `.cursor/harness/plugins/README.md` for the format. Shipped examples:

- **Regulatory** - compliance, audit readiness, data governance
- **Developer Experience** - API ergonomics, time-to-first-success
- **Data Integrity** - schema evolution, consistency guarantees, migration safety
