# Extending Counterpoint

## Adding a custom perspective

1. Create a markdown file in `.cursor/harness/plugins/`
2. Follow this format:

```markdown
# Perspective: [Name]

## Identity
Optimizes for: [one sentence]
Sacrifices: [one sentence]
Characteristic question: [what it always asks]

## Activation signals
Keywords: [comma-separated]
File patterns: [globs]
Context: [when relevant]

## Reasoning style
[2-3 sentences: how it thinks, what evidence it finds compelling]

## Example challenge
Given: [input]
This perspective would ask: [output]
```

3. That's it. The router detects new plugin files automatically.

## Modifying the routing matrix

Edit `.cursor/harness/router.md` § C. The matrix maps (word band, complexity, stakes) → tier.

If you want to change when counterpoint activates:
- Add/remove keywords in `.cursor/harness/knobs.md` → Stakes detection
- Adjust word thresholds
- Change matrix cells

## Changing the reasoning protocol

The full protocol is in `.cursor/harness/counterpoint.md`. Each stage has:
- A purpose (what it produces)
- A token budget (soft target)
- Anti-patterns to avoid

You can:
- Adjust token budgets to favor depth vs speed
- Add a stage (e.g., "historical context" before decompose)
- Remove a stage (e.g., skip cross-examine for faster responses)
- Change the synthesis format

## Adding a slash command

1. Create a markdown file in `.cursor/prompts/`
2. Add YAML frontmatter with `description`
3. Write the prompt instructions

The file name becomes the command name (e.g., `my-command.md` → `/my-command`).

## Modifying the anti-slop guard

Edit `.cursor/harness/anti-slop.md`. Each row in the table is independently enforceable. You can:
- Add new suppressed patterns
- Remove patterns you disagree with
- Adjust the "Do instead" column

## Adding benchmark fixtures

1. Add entries to the appropriate file in `benchmark/fixtures/`
2. Add corresponding expectations in `benchmark/expectations/`
3. Run the benchmark to verify (`/run-benchmark` or follow `benchmark/runner.md`)

## Forking for your team

Recommended approach:
1. Fork the repository
2. Edit `reference/steering/CONTEXT.md` with your project's identity
3. Add team-specific perspectives in `plugins/`
4. Adjust `knobs.md` thresholds to match your workflow preferences
5. Add domain-specific anti-slop patterns if needed

Keep the core architecture (router → tiers → protocol) intact. It's designed to be extended at the edges, not rewritten in the middle.
