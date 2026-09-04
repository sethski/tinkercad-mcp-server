# Tensions log

Append-only record of unresolved trade-offs surfaced by counterpoint-tier sessions.

Each entry documents a decision made DESPITE genuine tension — preserving the reasoning for future revisitation.

_Format: see `reference/AGENT.md` § Tension logging and `.cursor/harness/counterpoint.md` Stage 4._

---

## [2026-09-04] — Internals injection vs canvas UI automation

Tension: reliability of a hidden editor object graph vs durability of clicking the real UI

Chose: UI automation as the write path, SVG/JSON scrape as the read path, because serial DOM classes and `#breadboardTab svg` are independently documented and an internals SDK is not.

Risk accepted: Autodesk class renames break tools until `src/services/editor-bridge.ts` is updated.

Revisit when: `npm run spike` reports a stable window global that can add components and wires without DOM clicks.
