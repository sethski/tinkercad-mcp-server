import path from "node:path";
import os from "node:os";

export const SERVER_NAME = "tinkercad-mcp-server";
export const SERVER_VERSION = "1.0.0";

export const TINKERCAD_ORIGIN = "https://www.tinkercad.com";
export const CIRCUITS_DASHBOARD_URL = `${TINKERCAD_ORIGIN}/circuits`;
export const NEW_CIRCUIT_URL = `${TINKERCAD_ORIGIN}/circuits`;

export const CHARACTER_LIMIT = 25000;
export const DEFAULT_TIMEOUT_MS = 45_000;
export const EDITOR_READY_TIMEOUT_MS = 90_000;
export const LOGIN_WAIT_TIMEOUT_MS = 180_000;
export const SIMULATION_SETTLE_MS = 1500;

export const PROFILE_DIR =
  process.env.TINKERCAD_PROFILE_DIR ??
  path.join(process.cwd(), ".browser-profile");

export const SCREENSHOT_DIR =
  process.env.TINKERCAD_SCREENSHOT_DIR ??
  path.join(os.tmpdir(), "tinkercad-mcp-screenshots");

export const HEADED = process.env.TINKERCAD_HEADED !== "0";

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}
