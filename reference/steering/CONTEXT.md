# Project context

_Agent-maintained stable identity. Written on first-ever scan; patch only when wrong._

## Purpose

Counterpoint is a Cursor Agent Harness that transforms Cursor's reasoning behavior through structured adversarial thinking. It routes queries through three tiers (ponytail/poteto/counterpoint) based on complexity and stakes, applying multi-perspective critical reasoning to high-stakes decisions.

## Stack

Plain markdown files. No runtime dependencies. Works by shaping Cursor's behavior through `.cursor/rules/`, `.cursor/harness/`, `.cursor/prompts/`, and `reference/` directories.

## Constraints

- Must work with any Cursor plan that supports rules and prompts
- No external services, APIs, or build steps
- All reasoning happens inside extended thinking (single-generation)
- Token efficiency matters — max 4 perspectives per query

## Harness role

The repository IS the product. Opening it in Cursor transforms the AI assistant's reasoning from agreeable to adversarial-when-warranted.
