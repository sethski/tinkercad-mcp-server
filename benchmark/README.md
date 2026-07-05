# Evaluation benchmark

Verifies that harness changes don't regress reasoning quality.

## How it works

The benchmark uses test prompts (fixtures) with expected behaviors (expectations). Run via readonly subagents that evaluate harness output against criteria.

## Structure

| Path | Purpose |
|------|---------|
| `fixtures/routing.json` | Prompts with expected tier classification |
| `fixtures/reasoning.json` | Prompts requiring counterpoint-depth analysis |
| `fixtures/anti-slop.json` | Prompts designed to trigger slop behaviors |
| `fixtures/calibration.json` | Prompts where confidence should be low |
| `expectations/routing.md` | Expected route for each routing fixture |
| `expectations/reasoning.md` | What good counterpoint output looks like |
| `expectations/anti-slop.md` | Expected: no slop patterns detected |
| `runner.md` | Agent-readable instructions for running the benchmark |
| `results/rollup-latest.json` | Latest pass/fail per discipline |

## Disciplines

| Discipline | What it tests |
|---|---|
| **routing** | Correct tier classification (ponytail/poteto/counterpoint/gate) |
| **reasoning-depth** | Counterpoint responses identify genuine tensions, not fake disagreement |
| **anti-slop** | No suppressed patterns in output |
| **calibration** | Low-confidence situations produce low confidence scores |
| **perspective-activation** | Correct perspectives activate based on domain signals |
| **early-termination** | Obvious questions don't get artificial debate |

## Running

Say `/run-benchmark` or see `runner.md` for the agent-executable procedure.
