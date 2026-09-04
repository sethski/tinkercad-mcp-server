import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toAgentError } from "../services/errors.js";

export function textResult(text: string, structured?: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text }],
    ...(structured ? { structuredContent: structured } : {})
  };
}

export function errorResult(error: unknown): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: toAgentError(error) }]
  };
}
