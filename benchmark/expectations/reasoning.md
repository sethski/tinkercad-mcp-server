# Reasoning expectations

What good counterpoint output looks like for each fixture in `fixtures/reasoning.json`.

## Evaluation criteria

A reasoning fixture **passes** if the response demonstrates ALL listed expected behaviors.

## Behavior definitions

| Behavior | Pass condition |
|---|---|
| `identifies_axes` | Response explicitly names 2+ decision axes (tensions between competing values) |
| `steelmans_both` | Each position is argued FOR with concrete evidence before being evaluated |
| `steelmans_all_three` | Three positions argued FOR (when three options exist) |
| `doesnt_hedge` | Final recommendation is definitive, not "it depends" without specifics |
| `names_tradeoffs` | Explicitly states what is gained AND lost with the chosen approach |
| `picks_winner` | Provides a single clear recommendation (not "do all of them") |
| `considers_team_size` | Team context factors into the recommendation |
| `doesnt_default_to_popular` | Doesn't recommend the most popular option without justifying WHY for this case |
| `considers_security` | Security implications are addressed when the domain involves auth/data |
| `considers_complexity` | Implementation complexity is weighed against benefits |
| `provides_concrete_recommendation` | Names specific tools/patterns, not just abstract approaches |
| `names_risks` | Identifies what could go wrong with the recommendation |
| `recognizes_obvious` | Doesn't manufacture fake debate when the answer is clear |
| `doesnt_manufacture_debate` | If perspectives agree, says so and moves on |
| `answers_directly` | Gets to the point without unnecessary preamble |
| `early_terminates` | Skips cross-examine/tensions when all perspectives agree |
| `considers_effort_vs_impact` | Weighs implementation effort against expected improvement |
| `doesnt_recommend_all_three` | Picks one or sequences them, doesn't say "do everything" |
| `picks_sequence` | When multiple actions are valid, recommends an order with reasoning |

## Per-fixture expectations

### redis-vs-postgres
Must identify: persistence vs speed axis, operational complexity axis. Must steelman both Redis (speed, TTL) and Postgres (already have it, persistence, no new infra). Should probably recommend Postgres for this case (small scale, already deployed, persistence needed).

### monorepo-decision
Must consider team size (4 is small). Must not default to "monorepo because Google does it." Should weigh coordination cost vs deployment independence.

### auth-design
Must address SSO complexity, RBAC modeling, API key security. Should recommend specific patterns (not just "use a library"). Must flag multi-tenancy isolation as a risk.

### obvious-answer
Must recognize this is not controversial. Should answer "yes, obviously" with brief reasoning. Must NOT spin up a fake debate.

### genuinely-hard
Must steelman all three options. Should recommend based on effort-to-impact ratio. Should suggest sequencing (e.g., optimize queries first as lowest effort, then consider caching/replica).
