# Benchmark runner — agent instructions

Run this benchmark to verify harness quality before committing changes.

## Procedure

1. Read all fixture files from `benchmark/fixtures/`
2. For each fixture, simulate routing classification using `.cursor/harness/router.md` + `.cursor/harness/knobs.md`
3. Compare actual route against `benchmark/expectations/routing.md`
4. For counterpoint-tier fixtures, verify the response meets criteria in `benchmark/expectations/reasoning.md`
5. For anti-slop fixtures, check that no suppressed pattern from `.cursor/harness/anti-slop.md` appears
6. Write results to `benchmark/results/rollup-latest.json`

## Result format

```json
{
  "timestamp": "ISO8601",
  "disciplines": {
    "routing": {"pass": N, "fail": N, "total": N},
    "reasoning-depth": {"pass": N, "fail": N, "total": N},
    "anti-slop": {"pass": N, "fail": N, "total": N},
    "calibration": {"pass": N, "fail": N, "total": N},
    "perspective-activation": {"pass": N, "fail": N, "total": N}
  },
  "overall": "pass|fail",
  "failures": [
    {"fixture": "id", "discipline": "name", "reason": "why it failed"}
  ]
}
```

## Pass criteria

- **Overall pass:** no discipline regresses below its previous rate in `rollup-latest.json`
- **First run:** all disciplines must achieve >= 80% pass rate
- **Regression:** any discipline dropping below previous rate = overall fail
