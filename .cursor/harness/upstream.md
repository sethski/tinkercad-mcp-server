# Upstream references

This harness builds on two projects:

## Afro

[Troy-LL/Afro](https://github.com/Troy-LL/Afro) — Cursor agent harness with routing, knobs, ladder, and session memory.

Counterpoint forks and extends Afro's:
- Routing matrix (added stakes dimension, counterpoint tier)
- Knobs system (added counterpoint-specific settings)
- Reference/session memory (added TENSIONS.md)
- Ladder (used as-is)

## Ponytail

[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) — YAGNI implementation ladder.

The ladder in `.cursor/harness/ladder.md` is the canonical ponytail reference. Keep local and testable.

## Sync policy

- Edit harness for Cursor behavior
- Pull from upstream only when syncing reference wording or adopting new features
- Counterpoint-specific additions (perspectives, anti-slop, calibration, plugins) are original to this project
