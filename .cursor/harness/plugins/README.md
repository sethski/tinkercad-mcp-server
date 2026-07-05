# Perspective plugins

Drop a markdown file in this directory to add a custom perspective to the counterpoint tier.

## Format

```markdown
# Perspective: [Name]

## Identity
Optimizes for: [one sentence — what this perspective cares about most]
Sacrifices: [one sentence — what it's willing to give up]
Characteristic question: [the one question it always asks]

## Activation signals
Keywords: [comma-separated terms that activate this perspective]
File patterns: [glob patterns — if conversation touches these files, activate]
Context: [1-2 sentences describing when this is relevant]

## Reasoning style
[2-3 sentences: what it pays attention to, what it ignores, what evidence it finds compelling]

## Example challenge
Given: [example input]
This perspective would ask: [example question/challenge]
```

## Rules

- Custom perspectives join the **domain pool** (same as Security, Performance, Operations, Product)
- They follow the same activation and max-cap rules as built-in domain perspectives
- Core perspectives (Architect, Pragmatist, Adversary, User Advocate) take priority unless a plugin is a clearly stronger match for the specific question
- File must be valid markdown with all four sections present
- Keep activation keywords specific — overly broad keywords dilute the signal
