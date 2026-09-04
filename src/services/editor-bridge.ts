import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright";
import {
  CIRCUITS_DASHBOARD_URL,
  EDITOR_READY_TIMEOUT_MS,
  SCREENSHOT_DIR,
  SIMULATION_SETTLE_MS
} from "../constants.js";
import type {
  CircuitComponent,
  CircuitState,
  CircuitWire,
  EditorCapabilities,
  LoginStatus
} from "../types.js";
import { resolveComponent } from "../catalog.js";
import { BridgeError } from "./errors.js";
import { getLastCircuitJson, getPage, gotoTinkercad } from "./browser.js";

const LOGIN_URL_HINTS = ["signin", "login", "accounts.autodesk", "oauth"];
const injectedDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "injected");
const SCRAPE_CIRCUIT_JS = fs.readFileSync(path.join(injectedDir, "scrape-circuit.js"), "utf8");
const SET_CODE_JS = fs.readFileSync(path.join(injectedDir, "set-code.js"), "utf8");

interface ScrapedState {
  url: string;
  title: string;
  editorReady: boolean;
  simulationRunning: boolean;
  code: string;
  serial: string;
  components: CircuitComponent[];
  wires: CircuitWire[];
  capabilities: EditorCapabilities;
}

export async function loginStatus(): Promise<LoginStatus> {
  const page = await getPage();
  const url = page.url();
  const looksLikeLogin = LOGIN_URL_HINTS.some((hint) => url.toLowerCase().includes(hint));
  const signInVisible = await page.getByRole("link", { name: /sign in/i }).first().isVisible().catch(() => false)
    || await page.getByRole("button", { name: /sign in/i }).first().isVisible().catch(() => false);
  const userChrome = await firstVisible(page, [
    '[data-testid="user-menu"]',
    ".user-avatar",
    "img.avatar",
    '[aria-label*="Account" i]',
    '[aria-label*="profile" i]'
  ]);
  const loggedIn = !looksLikeLogin && !signInVisible && Boolean(userChrome || url.includes("/editel"));

  if (looksLikeLogin) {
    return {
      loggedIn: false,
      url,
      message: "Chrome is on an Autodesk sign-in page. Finish login in the opened window, then call tinkercad_login_status again."
    };
  }

  if (!loggedIn) {
    return {
      loggedIn: false,
      url,
      message: `No Tinkercad session detected at ${url}. Keep the Chrome window open, sign in, then retry.`
    };
  }

  return {
    loggedIn: true,
    url,
    message: "Tinkercad session looks active. Use tinkercad_open_circuit to open or create a circuit."
  };
}

export async function openCircuit(target: string): Promise<CircuitState> {
  const page = await gotoTinkercad(target === "new" ? CIRCUITS_DASHBOARD_URL : target);

  if (target === "new") {
    await createNewCircuit(page);
  }

  await waitForEditorOrLogin(page);
  return inspectCircuit();
}

async function createNewCircuit(page: Page): Promise<void> {
  const createButton = page.getByRole("link", { name: /create|new circuit|circuit design/i }).first();
  const createBtnAlt = page.getByRole("button", { name: /create|new circuit|circuit design/i }).first();
  if (await createButton.isVisible().catch(() => false)) {
    await createButton.click();
    return;
  }
  if (await createBtnAlt.isVisible().catch(() => false)) {
    await createBtnAlt.click();
  }
}

async function waitForEditorOrLogin(page: Page): Promise<void> {
  const deadline = Date.now() + EDITOR_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const url = page.url();
    if (LOGIN_URL_HINTS.some((hint) => url.toLowerCase().includes(hint))) {
      throw new BridgeError(
        "Tinkercad asked for login before the editor opened",
        "Sign in inside the Chrome window, then call tinkercad_open_circuit again."
      );
    }
    const ready = await page.locator("#breadboardTab, #CODE_EDITOR_ID, .inspector").first().isVisible().catch(() => false);
    if (ready) {
      await page.waitForTimeout(800);
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new BridgeError(
    "Circuits editor did not become ready in time",
    "Confirm you are logged in and the URL ends with /editel, then retry tinkercad_open_circuit."
  );
}

export async function inspectCircuit(): Promise<CircuitState> {
  const page = await getPage();
  const scraped = await scrapePage(page);
  const merged = mergeCapturedJson(scraped);
  const status = await loginStatus();
  return {
    ...merged,
    loggedIn: status.loggedIn
  };
}

async function scrapePage(page: Page): Promise<ScrapedState> {
  return page.evaluate(SCRAPE_CIRCUIT_JS) as Promise<ScrapedState>;
}

function mergeCapturedJson(scraped: ScrapedState): CircuitState {
  const captured = getLastCircuitJson();
  let source: CircuitState["source"] = scraped.components.length > 0 ? "svg" : "empty";
  if (captured && scraped.components.length === 0) {
    const extracted = extractComponentsFromUnknown(captured);
    if (extracted.components.length > 0) {
      scraped.components = extracted.components;
      scraped.wires = extracted.wires;
      source = "json";
    }
  } else if (captured && scraped.components.length > 0) {
    source = "mixed";
  }

  return {
    url: scraped.url,
    title: scraped.title,
    loggedIn: false,
    editorReady: scraped.editorReady,
    simulationRunning: scraped.simulationRunning,
    code: scraped.code,
    serial: scraped.serial,
    components: scraped.components,
    wires: scraped.wires,
    capabilities: scraped.capabilities,
    source
  };
}

function extractComponentsFromUnknown(data: unknown): { components: CircuitComponent[]; wires: CircuitWire[] } {
  const components: CircuitComponent[] = [];
  const wires: CircuitWire[] = [];
  const visit = (node: unknown, depth: number): void => {
    if (!node || typeof node !== "object" || depth > 6) {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, depth + 1);
      }
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.id === "string" && (record.type || record.name || record.component)) {
      components.push({
        id: record.id,
        name: String(record.name ?? record.title ?? record.id),
        type: String(record.type ?? record.component ?? "unknown"),
        x: Number(record.x ?? 0),
        y: Number(record.y ?? 0),
        width: Number(record.width ?? 0),
        height: Number(record.height ?? 0),
        pins: [],
        attributes: {}
      });
    }
    if (typeof record.from === "string" && typeof record.to === "string") {
      wires.push({
        id: String(record.id ?? `${record.from}-${record.to}`),
        from: record.from,
        to: record.to
      });
    }
    for (const value of Object.values(record)) {
      if (value && typeof value === "object") {
        visit(value, depth + 1);
      }
    }
  };
  visit(data, 0);
  return { components, wires };
}

export async function takeScreenshot(): Promise<{ path: string; base64: string }> {
  const page = await getPage();
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOT_DIR, `circuit-${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  const base64 = fs.readFileSync(filePath).toString("base64");
  return { path: filePath, base64 };
}

export async function addComponent(query: string, x: number, y: number): Promise<CircuitState> {
  const page = await getPage();
  await ensureEditor(page);
  const spec = resolveComponent(query);
  const searchTerm = spec?.search ?? query;

  const searchBox = await findSearchBox(page);
  await searchBox.click({ clickCount: 3 });
  await searchBox.fill(searchTerm);
  await page.waitForTimeout(700);

  const result = page.getByText(spec?.label ?? searchTerm, { exact: false }).first();
  if (!(await result.isVisible().catch(() => false))) {
    throw new BridgeError(
      `No component result visible for "${searchTerm}"`,
      `Call tinkercad_list_components to see known types, then retry with a catalog id such as "led" or "arduino_uno_r3".`
    );
  }

  const before = await inspectCircuit();
  const canvas = page.locator("#breadboardTab svg").first();
  if (await canvas.isVisible().catch(() => false)) {
    await result.dragTo(canvas, { targetPosition: { x, y } });
  } else {
    await result.click();
  }
  await page.waitForTimeout(600);
  const after = await inspectCircuit();
  if (after.components.length <= before.components.length) {
    after.components.push({
      id: `pending-${searchTerm.replace(/\s+/g, "-").toLowerCase()}`,
      name: spec?.label ?? searchTerm,
      type: spec?.id ?? searchTerm,
      x,
      y,
      width: 0,
      height: 0,
      pins: (spec?.defaultPins ?? []).map((name, index) => ({ id: `${name}-${index}`, name, x, y })),
      attributes: { note: "SVG scrape did not assign an id yet; use tinkercad_get_circuit and screenshot to confirm placement." }
    });
  }
  return after;
}

async function findSearchBox(page: Page) {
  const candidates = [
    page.getByPlaceholder(/search/i),
    page.locator('input[type="search"]'),
    page.locator('[aria-label*="Search" i]'),
    page.locator(".editor__sidebar input"),
    page.locator("input").nth(0)
  ];
  for (const locator of candidates) {
    if (await locator.first().isVisible().catch(() => false)) {
      return locator.first();
    }
  }
  throw new BridgeError(
    "Could not find the Circuits component search box",
    "Open the parts panel on the right of the editor, then retry tinkercad_add_component."
  );
}

export async function moveComponent(componentId: string, x: number, y: number): Promise<CircuitState> {
  const page = await getPage();
  const handle = await findComponentHandle(page, componentId);
  const canvas = page.locator("#breadboardTab svg").first();
  await handle.dragTo(canvas, { targetPosition: { x, y } });
  await page.waitForTimeout(400);
  return inspectCircuit();
}

export async function deleteComponent(componentId: string): Promise<CircuitState> {
  const page = await getPage();
  const handle = await findComponentHandle(page, componentId);
  await handle.click();
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  return inspectCircuit();
}

export async function connectPins(fromRef: string, toRef: string): Promise<CircuitState> {
  const page = await getPage();
  await clickPin(page, fromRef);
  await page.waitForTimeout(250);
  await clickPin(page, toRef);
  await page.waitForTimeout(400);
  return inspectCircuit();
}

export async function deleteWire(wireId: string): Promise<CircuitState> {
  const page = await getPage();
  const wire = page.locator(`#${cssEscape(wireId)}, [data-wire="${wireId}"]`).first();
  if (await wire.isVisible().catch(() => false)) {
    await wire.click();
    await page.keyboard.press("Delete");
    return inspectCircuit();
  }
  throw new BridgeError(
    `Wire "${wireId}" was not found`,
    "Call tinkercad_get_circuit and use a wire id from that list."
  );
}

export async function setComponentAttribute(componentId: string, name: string, value: string): Promise<CircuitState> {
  const page = await getPage();
  const handle = await findComponentHandle(page, componentId);
  await handle.click();
  await page.waitForTimeout(300);

  const labeled = page.getByLabel(new RegExp(name, "i")).first();
  if (await labeled.isVisible().catch(() => false)) {
    await labeled.fill(value);
    await labeled.press("Enter");
    return inspectCircuit();
  }

  const inspectorInput = page.locator(".inspector input, .inspector select").first();
  if (await inspectorInput.isVisible().catch(() => false)) {
    const tag = await inspectorInput.evaluate("el => el.tagName.toLowerCase()");
    if (tag === "select") {
      await inspectorInput.selectOption({ label: value }).catch(async () => {
        await inspectorInput.selectOption({ value });
      });
    } else {
      await inspectorInput.fill(value);
      await inspectorInput.press("Enter");
    }
    return inspectCircuit();
  }

  throw new BridgeError(
    `Could not find inspector field "${name}" for ${componentId}`,
    "Select the component in the editor and check the inspector panel. Common fields: resistance, color, value."
  );
}

export async function getCode(): Promise<string> {
  const page = await getPage();
  await openCodePanel(page);
  await switchCodeMode(page, "Text");
  const state = await scrapePage(page);
  if (state.code.trim() === "") {
    throw new BridgeError(
      "Arduino code panel is empty or not readable",
      "Click Code, switch the dropdown to Text, then retry tinkercad_get_code."
    );
  }
  return state.code;
}

export async function setCode(source: string): Promise<void> {
  const page = await getPage();
  await openCodePanel(page);
  await switchCodeMode(page, "Text");

  const applied = await page.evaluate(`${SET_CODE_JS}(${JSON.stringify(source)})`);


  if (applied) {
    return;
  }

  const editor = page.locator(".monaco-editor, .ace_editor, .CodeMirror, #CODE_EDITOR_ID").first();
  if (!(await editor.isVisible().catch(() => false))) {
    throw new BridgeError(
      "Could not find a writable Arduino code editor",
      "Open the Code panel and switch it to Text mode, then retry tinkercad_set_code."
    );
  }
  await editor.click();
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+KeyA`);
  await page.keyboard.insertText(source);
}

export async function startSimulation(): Promise<void> {
  const page = await getPage();
  const button = page.getByRole("button", { name: /start simulation/i }).first();
  if (!(await button.isVisible().catch(() => false))) {
    const alt = page.getByText(/start simulation/i).first();
    if (!(await alt.isVisible().catch(() => false))) {
      throw new BridgeError(
        "Start Simulation control is not visible",
        "Make sure a circuit is open and simulation is not already running."
      );
    }
    await alt.click();
  } else {
    await button.click();
  }
  await page.waitForTimeout(SIMULATION_SETTLE_MS);
}

export async function stopSimulation(): Promise<void> {
  const page = await getPage();
  const button = page.getByRole("button", { name: /stop simulation/i }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return;
  }
  const alt = page.getByText(/stop simulation/i).first();
  if (await alt.isVisible().catch(() => false)) {
    await alt.click();
    return;
  }
  throw new BridgeError(
    "Stop Simulation control is not visible",
    "Simulation may already be stopped. Check with tinkercad_get_circuit."
  );
}

export async function readSerial(waitMs: number): Promise<string> {
  const page = await getPage();
  await openCodePanel(page);
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
  const state = await scrapePage(page);
  if (state.serial.trim() === "") {
    const fallback = await page.locator(".js-code_panel__serial__input, .code_panel__serial, [class*='serial']").allTextContents();
    const text = fallback.join("\n").trim();
    if (text !== "") {
      return text;
    }
    return "";
  }
  return state.serial;
}

async function openCodePanel(page: Page): Promise<void> {
  const already = await page.locator("#CODE_EDITOR_ID, .code_panel, .js-code_panel__serial__input").first().isVisible().catch(() => false);
  if (already) {
    return;
  }
  const codeButton = page.getByRole("button", { name: /^code$/i }).first();
  if (await codeButton.isVisible().catch(() => false)) {
    await codeButton.click();
    await page.waitForTimeout(400);
    return;
  }
  const alt = page.locator("#CODE_EDITOR_ID .circ_btn__txt, [id='CODE_EDITOR_ID']").first();
  if (await alt.isVisible().catch(() => false)) {
    await alt.click();
  }
}

async function switchCodeMode(page: Page, mode: string): Promise<void> {
  const dropdown = page.getByRole("combobox").first();
  if (await dropdown.isVisible().catch(() => false)) {
    await dropdown.selectOption({ label: mode }).catch(async () => {
      await dropdown.click();
      await page.getByRole("option", { name: new RegExp(mode, "i") }).first().click();
    });
    return;
  }
  const textOption = page.getByText(mode, { exact: true }).first();
  if (await textOption.isVisible().catch(() => false)) {
    await textOption.click();
  }
}

async function findComponentHandle(page: Page, componentId: string) {
  const byId = page.locator(`#${cssEscape(componentId)}`).first();
  if (await byId.isVisible().catch(() => false)) {
    return byId;
  }
  const byName = page.getByText(componentId, { exact: false }).first();
  if (await byName.isVisible().catch(() => false)) {
    return byName;
  }
  throw new BridgeError(
    `Component "${componentId}" was not found`,
    "Call tinkercad_get_circuit to list ids, or tinkercad_screenshot to see the canvas."
  );
}

async function clickPin(page: Page, pinRef: string): Promise<void> {
  const [componentId, pinName] = splitPinRef(pinRef);
  const state = await inspectCircuit();
  const component = state.components.find((item) => item.id === componentId || item.name === componentId);
  if (component) {
    const pin = component.pins.find((item) => item.name === pinName || item.id === pinName || item.name.toLowerCase() === pinName.toLowerCase());
    if (pin) {
      await page.mouse.click(pin.x, pin.y);
      return;
    }
    await page.mouse.click(component.x + component.width / 2, component.y + 8);
    return;
  }

  const labeled = page.getByText(pinName, { exact: true }).first();
  if (await labeled.isVisible().catch(() => false)) {
    await labeled.click();
    return;
  }

  throw new BridgeError(
    `Pin "${pinRef}" was not found`,
    "Use componentId.pinName from tinkercad_get_circuit, for example uno.D13 or led1.anode."
  );
}

function splitPinRef(pinRef: string): [string, string] {
  const trimmed = pinRef.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) {
    return [trimmed, trimmed];
  }
  return [trimmed.slice(0, dot), trimmed.slice(dot + 1)];
}

async function firstVisible(page: Page, selectors: string[]): Promise<boolean> {
  for (const selector of selectors) {
    if (await page.locator(selector).first().isVisible().catch(() => false)) {
      return true;
    }
  }
  return false;
}

async function ensureEditor(page: Page): Promise<void> {
  const ready = await page.locator("#breadboardTab, #CODE_EDITOR_ID").first().isVisible().catch(() => false);
  if (!ready) {
    throw new BridgeError(
      "Circuits editor is not open",
      "Call tinkercad_open_circuit with a circuit URL or 'new' first."
    );
  }
}

function cssEscape(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export async function probeEditor(): Promise<ScrapedState> {
  const page = await getPage();
  return scrapePage(page);
}
