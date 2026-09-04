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

  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  log(`Launching persistent Chrome profile at ${PROFILE_DIR}`);

  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !HEADED,
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
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

function attachNetworkCapture(browserContext: BrowserContext): void {
  browserContext.on("response", (response) => {
    void (async () => {
      try {
        const url = response.url();
        if (!url.includes("tinkercad") && !url.includes("autodesk")) {
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

export function resolveTinkercadUrl(targetUrl: string): string {
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith("tinkercad.com") && !parsed.hostname.endsWith("autodesk.com")) {
      throw new BridgeError(
        `Refusing to open non-Tinkercad URL: ${parsed.hostname}`,
        "Pass a tinkercad.com circuit URL or the word 'new'."
      );
    }
    return parsed.toString();
  }
  if (targetUrl === "new" || targetUrl === "circuits") {
    return CIRCUITS_DASHBOARD_URL;
  }
  if (targetUrl.startsWith("/")) {
    return `${TINKERCAD_ORIGIN}${targetUrl}`;
  }
  return `${TINKERCAD_ORIGIN}/things/${targetUrl}/editel`;
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
