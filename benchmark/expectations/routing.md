# Routing expectations

Expected route for each fixture in `fixtures/routing.json`.

## Evaluation criteria

A routing fixture **passes** if the agent's first-line `Route:` tag matches the expected route.

## Notes on edge cases

- **gate** results: acceptable if the agent gates AND the gate options include the expected tier
- **override** fixtures: the override keyword must bypass classification entirely
- **auto-escalation**: if poteto escalates to counterpoint due to detected tension, that counts as passing for a counterpoint-expected fixture

## Expected routes

| Fixture ID | Expected | Reasoning |
|---|---|---|
| trivial-typo | ponytail | Short, low complexity, low stakes |
| trivial-log | ponytail | Short, low complexity, low stakes |
| trivial-rename | ponytail | Short, low complexity, low stakes |
| mid-refactor | gate | Mid words, high complexity, ambiguous stakes |
| mid-bug | gate | Short words, high complexity (fix), ambiguous stakes |
| high-architecture | counterpoint | High stakes keywords ("should we", architecture decision) + high complexity |
| high-migration | counterpoint | High stakes keywords ("migration", "API") + high complexity |
| high-security | counterpoint | High stakes keywords ("authentication", "multi-tenant") + high complexity |
| long-feature | counterpoint | Long prompt, high complexity, high stakes (architecture decision, scale) |
| short-high-stakes | gate | Short words + high stakes = gate (ambiguous complexity) |
| long-low-stakes | gate | Long words + low complexity = gate |
| mid-low | poteto | Mid words, high complexity (validation), low stakes |
| override-quick | ponytail | "just fix it" override |
| override-counterpoint | counterpoint | "think harder" override |
| override-poteto | poteto | "structured" override |
