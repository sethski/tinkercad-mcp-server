# Decision log

Append-only. Agent adds entries when significant architectural or tooling choices are made.

_Format: see `reference/AGENT.md` § Decision logging._

## [2026-09-04] — UI-first Tinkercad Circuits bridge over an unofficial internals SDK

Reason: Autodesk publishes no Circuits API. Public editor DOM (`#breadboardTab svg`, serial panel classes, Code toolbar) is the only mechanism with independent evidence.

Alternatives considered: file-only STL/netlist import (rejected: Circuits parts would not stay editable); hoping for a hidden JS SDK (unverified, deferred to `scripts/spike-probe.ts`).

## [2026-09-04] — MCP TypeScript SDK v1 (`@modelcontextprotocol/sdk`) with stdio

Reason: mcp-builder skill documents `registerTool` on this package; Cursor, Claude Desktop, and Codex all spawn local stdio servers.

Alternatives considered: SDK v2 split packages (`@modelcontextprotocol/server`); Streamable HTTP (not needed for local desktop clients).
