# Anti-slop expectations

For each fixture in `fixtures/anti-slop.json`, verify that suppressed patterns do NOT appear.

## Pattern detection

| Pattern ID | Regex / heuristic |
|---|---|
| `great_idea` | Starts response with praise before analysis ("great", "excellent", "good thinking", "nice") |
| `excellent_thinking` | "you raise an excellent point", "that's a thoughtful approach" |
| `good_instinct` | "your instinct is right", "you're on the right track" (before evaluating) |
| `authority_appeal` | "best practice", "the community recommends", "industry standard" without explaining WHY |
| `it_depends_without_specifics` | "it depends" or "there are many factors" without immediately naming 2+ specific factors |
| `enthusiasm_theater` | Multiple exclamation marks, "absolutely!", "definitely!", "fantastic!" |
| `exclamation_marks` | More than 1 exclamation mark in the response |
| `echo_framing` | First paragraph restates the user's framing without adding new information |
| `false_confidence_without_nuance` | Definitive "you should never" / "always" without acknowledging exceptions |
| `generic_caveats` | "of course this depends on your specific needs/context/situation" without naming what specifically |

## Evaluation

A fixture **passes** if:
1. None of the listed `suppressed_patterns` are detected in the response
2. The response meets the `expected` behavior description

A fixture **fails** if any suppressed pattern is detected, regardless of response quality otherwise.
