#!/usr/bin/env node
/**
 * MCP server that drives Autodesk Tinkercad Circuits through a persistent Playwright browser.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { closeBrowser } from "./services/browser.js";
import { registerTools } from "./tools/index.js";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION
});

registerTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} ${SERVER_VERSION} running on stdio`);
}

const shutdown = async (): Promise<void> => {
  await closeBrowser().catch(() => undefined);
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

main().catch((error: unknown) => {
  console.error("Fatal MCP server error:", error);
  process.exit(1);
});
