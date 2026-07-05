# Contributing to Counterpoint

## How to contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the benchmark (`benchmark/runner.md`) to verify no regressions
5. Submit a pull request

## What we accept

- New perspective plugins (`.cursor/harness/plugins/`)
- Anti-slop pattern additions (`.cursor/harness/anti-slop.md`)
- Benchmark fixtures (helps verify quality)
- Routing improvements (with benchmark evidence)
- Documentation improvements

## What to avoid

- Changes that require external dependencies or services
- Overly complex reasoning stages that don't measurably improve quality
- "Helpful" additions that increase token consumption without clear benefit
- Persona-style perspectives (we use optimization lenses, not characters)

## Design principles

- Every component must have a measurable purpose
- Token efficiency matters (more tokens does not mean better reasoning)
- Specificity over generality
- If removing something doesn't lose information, remove it
- Test with the benchmark before and after changes

## Perspective plugin guidelines

- Activation keywords should be specific, not broad
- The characteristic question should be genuinely useful, not generic
- The "sacrifices" field should be honest (every optimization has a cost)
- Include a concrete example challenge, not an abstract one

## Style

- No em dashes in documentation
- No exclamation marks
- Direct, evidence-based writing
- Tables over prose when structure helps
