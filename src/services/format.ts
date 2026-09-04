import { CHARACTER_LIMIT, ResponseFormat } from "../constants.js";
import type { CircuitState, ComponentSpec } from "../types.js";

export function enforceLimit(text: string, itemCount?: number): string {
  if (text.length <= CHARACTER_LIMIT) {
    return text;
  }
  const trimmed = text.slice(0, CHARACTER_LIMIT);
  const extra = itemCount === undefined
    ? "Reduce include flags or ask for a narrower slice of the circuit."
    : `Response truncated from ${itemCount} items. Add filters or raise specificity.`;
  return `${trimmed}\n\n[truncated] ${extra}`;
}

export function formatCircuit(state: CircuitState, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return enforceLimit(JSON.stringify(state, null, 2), state.components.length);
  }

  const lines = [
    `# ${state.title || "Tinkercad circuit"}`,
    "",
    `- URL: ${state.url}`,
    `- Logged in: ${state.loggedIn}`,
    `- Editor ready: ${state.editorReady}`,
    `- Simulation: ${state.simulationRunning ? "running" : "stopped"}`,
    `- State source: ${state.source}`,
    `- Components: ${state.components.length}`,
    `- Wires: ${state.wires.length}`,
    ""
  ];

  if (state.components.length === 0) {
    lines.push("No components found. If the editor is open, try tinkercad_screenshot and place parts with tinkercad_add_component.");
  }

  for (const component of state.components) {
    lines.push(`## ${component.name} (${component.id})`);
    lines.push(`- Type: ${component.type}`);
    lines.push(`- Position: ${Math.round(component.x)}, ${Math.round(component.y)}`);
    if (component.pins.length > 0) {
      lines.push(`- Pins: ${component.pins.map((pin) => pin.name).join(", ")}`);
    }
    const attrs = Object.entries(component.attributes);
    if (attrs.length > 0) {
      lines.push(`- Attributes: ${attrs.map(([key, value]) => `${key}=${value}`).join(", ")}`);
    }
    lines.push("");
  }

  if (state.wires.length > 0) {
    lines.push("## Wires");
    for (const wire of state.wires) {
      lines.push(`- ${wire.from} -> ${wire.to} (${wire.id})`);
    }
    lines.push("");
  }

  if (state.code.trim() !== "") {
    lines.push("## Arduino code");
    lines.push("```cpp");
    lines.push(state.code.trim());
    lines.push("```");
    lines.push("");
  }

  if (state.serial.trim() !== "") {
    lines.push("## Serial monitor");
    lines.push("```");
    lines.push(state.serial.trim());
    lines.push("```");
  }

  return enforceLimit(lines.join("\n"), state.components.length);
}

export function formatCatalog(items: ComponentSpec[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return enforceLimit(JSON.stringify({ count: items.length, components: items }, null, 2), items.length);
  }
  const lines = [`# Component catalog (${items.length})`, ""];
  for (const item of items) {
    lines.push(`## ${item.label} (${item.id})`);
    lines.push(`- Search: ${item.search}`);
    lines.push(`- Aliases: ${item.aliases.join(", ") || "none"}`);
    lines.push(`- Default pins: ${item.defaultPins.join(", ")}`);
    lines.push("");
  }
  return enforceLimit(lines.join("\n"), items.length);
}

export function formatLogin(status: { loggedIn: boolean; url: string; message: string }, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(status, null, 2);
  }
  return [
    `# Login status`,
    "",
    `- Logged in: ${status.loggedIn}`,
    `- URL: ${status.url}`,
    "",
    status.message
  ].join("\n");
}
