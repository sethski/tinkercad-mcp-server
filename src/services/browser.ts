import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import {
  CIRCUITS_DASHBOARD_URL,
  DEFAULT_TIMEOUT_MS,
  HEADED,
  PROFILE_DIR,
  TINKERCAD_ORIGIN
} from "../constants.js";
import { BridgeError } from "./errors.js";

let context: BrowserContext | undefined;
let page: Page | undefined;
let lastCircuitJson: unknown;

function log(message: string): void {
  console.error(`[tinkercad-mcp] ${message}`);
}

export function getLastCircuitJson(): unknown {
  return lastCircuitJson;
}

export async function getPage(): Promise<Page> {
  if (page && !page.isClosed()) {
    return page;
  }
  await launchBrowser();
  if (!page) {
    throw new BridgeError(
      "Browser page is not available",
      "Call tinkercad_open_circuit after the Chrome window appears."
    );
  }
  return page;
}

export async function launchBrowser(): Promise<Page> {
  if (context && page && !page.isClosed()) {
    return page;
  }

  fs.mkdirSync(PROFILE_DIR, { recursive: true, mode: 0o700 });
  log(`Launching persistent Chrome profile at ${PROFILE_DIR}`);

  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !HEADED,
    viewport: { width: 1440, height: 900 },
    acceptDownloads: false,
    args: ["--disable-blink-features=AutomationControlled"]
  });

  attachNetworkCapture(context);

  page = context.pages()[0] ?? await context.newPage();
  page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT_MS);

  page.on("close", () => {
    page = undefined;
  });

  if (!page.url() || page.url() === "about:blank") {
    await page.goto(CIRCUITS_DASHBOARD_URL, { waitUntil: "domcontentloaded" });
  }

  return page;
}

export function isAllowedTinkercadHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "tinkercad.com" ||
    lower.endsWith(".tinkercad.com") ||
    lower === "autodesk.com" ||
    lower.endsWith(".autodesk.com")
  );
}

function attachNetworkCapture(browserContext: BrowserContext): void {
  browserContext.on("response", (response) => {
    void (async () => {
      try {
        const parsed = new URL(response.url());
        if (parsed.protocol !== "https:" || !isAllowedTinkercadHost(parsed.hostname)) {
          return;
        }
        const contentType = response.headers()["content-type"] ?? "";
        if (!contentType.includes("application/json")) {
          return;
        }
        const data: unknown = await response.json();
        if (looksLikeCircuitPayload(data)) {
          lastCircuitJson = data;
        }
      } catch {
        // Ignore non-JSON or already-consumed bodies.
      }
    })();
  });
}

function looksLikeCircuitPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }
  const record = data as Record<string, unknown>;
  const keys = Object.keys(record).map((key) => key.toLowerCase());
  const hints = ["components", "wires", "circuit", "breadboard", "arduino", "netlist"];
  return hints.some((hint) => keys.includes(hint));
}

export async function gotoTinkercad(targetUrl: string): Promise<Page> {
  const active = await getPage();
  const resolved = resolveTinkercadUrl(targetUrl);
  if (active.url() !== resolved) {
    await active.goto(resolved, { waitUntil: "domcontentloaded" });
  }
  return active;
}

const THING_ID_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;

export function resolveTinkercadUrl(targetUrl: string): string {
  const trimmed = targetUrl.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BridgeError(
        `Invalid Tinkercad URL: ${trimmed}`,
        "Pass an https://www.tinkercad.com circuit URL, a thing id, or 'new'."
      );
    }
    if (parsed.protocol !== "https:") {
      throw new BridgeError(
        `Refusing non-HTTPS URL protocol: ${parsed.protocol}`,
        "Use an https:// URL on tinkercad.com."
      );
    }
    if (parsed.username || parsed.password) {
      throw new BridgeError(
        "Refusing URL with embedded credentials",
        "Pass a clean tinkercad.com circuit URL."
      );
    }
    if (!isAllowedTinkercadHost(parsed.hostname)) {
      throw new BridgeError(
        `Refusing to open non-Tinkercad URL: ${parsed.hostname}`,
        "Pass a tinkercad.com circuit URL or the word 'new'."
      );
    }
    return parsed.toString();
  }
  if (trimmed === "new" || trimmed === "circuits") {
    return CIRCUITS_DASHBOARD_URL;
  }
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.includes("\\")) {
      throw new BridgeError(
        `Refusing unsafe relative path: ${trimmed}`,
        "Pass a Tinkercad path like /things/<id>/editel or a thing id."
      );
    }
    const parsed = new URL(trimmed, TINKERCAD_ORIGIN);
    if (parsed.origin !== TINKERCAD_ORIGIN) {
      throw new BridgeError(
        `Refusing cross-origin relative path: ${trimmed}`,
        "Pass a valid path on tinkercad.com."
      );
    }
    return parsed.toString();
  }
  if (!THING_ID_PATTERN.test(trimmed)) {
    throw new BridgeError(
      `Invalid Tinkercad thing id: "${trimmed}"`,
      "Pass an alphanumeric thing id, a full https://www.tinkercad.com URL, or 'new'."
    );
  }
  return `${TINKERCAD_ORIGIN}/things/${trimmed}/editel`;
}

export function profilePath(): string {
  return path.resolve(PROFILE_DIR);
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
  }
  context = undefined;
  page = undefined;
}
