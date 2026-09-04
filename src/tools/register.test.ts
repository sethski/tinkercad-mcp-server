import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./index.js";

const EXPECTED = [
  "tinkercad_login_status",
  "tinkercad_open_circuit",
  "tinkercad_get_circuit",
  "tinkercad_screenshot",
  "tinkercad_list_components",
  "tinkercad_add_component",
  "tinkercad_move_component",
  "tinkercad_delete_component",
  "tinkercad_connect_pins",
  "tinkercad_delete_wire",
  "tinkercad_set_component_attribute",
  "tinkercad_get_code",
  "tinkercad_set_code",
  "tinkercad_start_simulation",
  "tinkercad_stop_simulation",
  "tinkercad_read_serial",
  "tinkercad_build_circuit"
];

describe("tool registration", () => {
  it("registers every planned Circuits tool", () => {
    const server = new McpServer({ name: "tinkercad-mcp-server", version: "0.0.0" });
    registerTools(server);
    const registered = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools;
    for (const name of EXPECTED) {
      assert.ok(name in registered, `missing ${name}`);
    }
    assert.equal(Object.keys(registered).length, EXPECTED.length);
  });
});
