# Project context

_Agent-maintained stable identity. Written on first-ever scan; patch only when wrong._

## Purpose

Tinkercad Circuits MCP server (TypeScript, stdio, Playwright) plus the Counterpoint agent harness that routes Cursor reasoning.

## Stack

- MCP: `@modelcontextprotocol/sdk`, Zod, Playwright, Node 18+
- Harness: markdown rules under `.cursor/` and `reference/`

## Constraints

- Tinkercad has no public API; editor control is browser UI automation
- Persistent Chrome profile for Autodesk login; do not commit `.browser-profile/`
- stdio only for Cursor / Claude Desktop / Codex
