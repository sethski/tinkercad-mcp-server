/**
 * List tools over stdio the same way Cursor, Claude Desktop, and Codex will.
 * Does not open Tinkercad.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"]
  });
  const client = new Client({ name: "tinkercad-mcp-client-check", version: "1.0.0" });
  await client.connect(transport);
  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name);
  console.error(names.join("\n"));
  if (names.length !== 17) {
    throw new Error(`Expected 17 tools, got ${names.length}`);
  }
  await client.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
