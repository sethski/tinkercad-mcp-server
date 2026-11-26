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
  const userChromeSelectors = [
    ".header-avatar",
    ".header-avatar-trigger",
    '[aria-label="User menu"]',
    ".rounded-avatar",
    '[data-testid="user-menu"]',
    ".user-avatar",
    "img.avatar",
    '[aria-label*="Account" i]',
    '[aria-label*="profile" i]'
  ];
  await page
    .locator([...userChromeSelectors, 'a:has-text("Sign in")', 'button:has-text("Sign in")', "#breadboardTab"].join(", "))
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => undefined);

  const url = page.url();
  const looksLikeLogin = LOGIN_URL_HINTS.some((hint) => url.toLowerCase().includes(hint));
  const signInVisible = await page.getByRole("link", { name: /sign in/i }).first().isVisible().catch(() => false)
    || await page.getByRole("button", { name: /sign in/i }).first().isVisible().catch(() => false);
  const userChrome = await firstVisible(page, userChromeSelectors);
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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (page.url().includes("/editel")) {
      return;
    }
    const createDropdown = page.getByRole("button", { name: /^create$/i }).first();
    if (await createDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createDropdown.click();
      const circuitsOption = page.locator("a.button-circuits.dropdown-item, .dropdown-item:has-text('Circuits')").first();
      if (await circuitsOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await circuitsOption.click();
      }
    } else {
      const createButton = page.getByRole("link", { name: /create|new circuit|circuit design/i }).first();
      const createBtnAlt = page.getByRole("button", { name: /create|new circuit|circuit design/i }).first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
      } else if (await createBtnAlt.isVisible().catch(() => false)) {
        await createBtnAlt.click();
      }
    }
    const navigated = await page
      .waitForURL(/\/things\/.+\/editel/i, { timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (navigated) {
      return;
    }
    await page.waitForTimeout(800);
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
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true, mode: 0o700 });
  const filePath = path.join(SCREENSHOT_DIR, `circuit-${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  fs.chmodSync(filePath, 0o600);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return { path: filePath, base64 };
}

export async function addComponent(query: string, x: number, y: number): Promise<CircuitState> {
  const page = await getPage();
  await ensureEditor(page);
  await closeCodePanel(page);
  const spec = resolveComponent(query);
  const searchTerm = spec?.search ?? query;

  const picker = page.locator(".editor__component_picker").first();
  const searchBox = await findSearchBox(page);
  await searchBox.click();
  await searchBox.fill("");
  await searchBox.pressSequentially(searchTerm, { delay: 25 });
  await page.waitForTimeout(700);

  const label = spec?.label ?? searchTerm;
  const pickerVisible = await picker.isVisible().catch(() => false);
  const items = pickerVisible
    ? picker.locator(".editor__component_picker__groups__item.grid__item, .editor__component_picker__groups__item")
    : page.locator(".editor__component_picker__groups__item.grid__item, .editor__component_picker__groups__item");

  let result = items.filter({
    has: page.locator(".editor__component_picker__groups__item__grid__title", {
      hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, "i")
    })
  }).first();
  if (!(await result.isVisible().catch(() => false))) {
    result = items.filter({
      has: page.locator(".editor__component_picker__groups__item__grid__title", {
        hasText: new RegExp(escapeRegExp(label), "i")
      })
    }).first();
  }
  if (!(await result.isVisible().catch(() => false))) {
    result = items.filter({ hasText: new RegExp(escapeRegExp(searchTerm), "i") }).first();
  }
  if (!(await result.isVisible().catch(() => false))) {
    throw new BridgeError(
      `No component result visible in picker for "${searchTerm}"`,
      `Call tinkercad_list_components to see known types, then retry with a catalog id such as "led" or "arduino_uno_r3".`
    );
  }

  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const pickerBox = pickerVisible ? await picker.boundingBox().catch(() => null) : null;
  const searchBoxRect = await searchBox.boundingBox().catch(() => null);
  const rightBoundary = Math.min(
    pickerBox?.x ?? viewport.width - 300,
    searchBoxRect?.x ?? viewport.width - 300
  );
  const dropX = Math.max(80, Math.min(x, Math.max(200, rightBoundary - 80)));
  const dropY = Math.max(130, Math.min(y, viewport.height - 80));

  const before = await inspectCircuit();
  await result.click();
  await page.waitForTimeout(300);
  await page.mouse.move(dropX, dropY, { steps: 10 });
  await page.waitForTimeout(150);
  await page.mouse.click(dropX, dropY);
  await page.waitForTimeout(650);
  const after = await inspectCircuit();
  if (after.components.length <= before.components.length) {
    after.components.push({
      id: `pending-${searchTerm.replace(/\s+/g, "-").toLowerCase()}`,
      name: spec?.label ?? searchTerm,
      type: spec?.id ?? searchTerm,
      x: dropX,
      y: dropY,
      width: 0,
      height: 0,
      pins: (spec?.defaultPins ?? []).map((name, index) => ({ id: `${name}-${index}`, name, x: dropX, y: dropY })),
      attributes: { note: "Component did not register in circuit state yet; use tinkercad_get_circuit and screenshot to confirm placement." }
    });
  }
  return after;
}

async function findSearchBox(page: Page) {
  const candidates = [
    page.locator(".editor__component_picker input#q"),
    page.locator(".editor__component_picker input"),
    page.getByPlaceholder(/search/i),
    page.locator('input[type="search"]'),
    page.locator('[aria-label*="Search" i]'),
    page.locator(".editor__sidebar input")
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
  await closeCodePanel(page);
  const center = await getComponentScreenCenter(componentId);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  return inspectCircuit();
}

export async function deleteComponent(componentId: string): Promise<CircuitState> {
  const page = await getPage();
  await selectComponent(page, componentId);
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  const after = await inspectCircuit();
  if (findComponentInState(after.components, componentId)) {
    const trash = page.locator(".js-delete_button, [aria-label*='Delete' i], [title*='Delete' i]").first();
    if (await trash.isVisible().catch(() => false)) {
      await trash.click();
      await page.waitForTimeout(300);
      return inspectCircuit();
    }
  }
  return after;
}

export async function connectPins(fromRef: string, toRef: string): Promise<CircuitState> {
  const page = await getPage();
  await closeCodePanel(page);
  await zoomToFit(page);
  const before = await inspectCircuit();
  await clickPin(page, fromRef, before);
  await page.waitForTimeout(300);
  await clickPin(page, toRef, before);
  await page.waitForTimeout(500);
  const after = await inspectCircuit();
  if (after.wires.length <= before.wires.length) {
    await page.keyboard.press("Escape").catch(() => undefined);
  }
  return after;
}

export async function deleteWire(wireId: string): Promise<CircuitState> {
  const page = await getPage();
  const removedInModel = await page.evaluate((targetId: string): boolean => {
    const ce = (window as unknown as { circuit_editor?: { circuitEditor?: { data?: { wires?: { forEach: (cb: (w: { local_id?: string; versions_id?: string; kill?: () => void }) => void) => void } } } } }).circuit_editor?.circuitEditor;
    const wires = ce?.data?.wires;
    if (!wires || typeof wires.forEach !== "function") {
      return false;
    }
    let found = false;
    wires.forEach((wire) => {
      if (!found && (wire.local_id === targetId || wire.versions_id === targetId) && typeof wire.kill === "function") {
        wire.kill();
        found = true;
      }
    });
    return found;
  }, wireId);
  if (removedInModel) {
    await page.waitForTimeout(250);
    return inspectCircuit();
  }

  const wire = page.locator(`#${cssEscape(wireId)}, [data-wire=${JSON.stringify(wireId)}]`).first();
  if (await wire.isVisible().catch(() => false)) {
    await wire.click({ force: true });
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
  await selectComponent(page, componentId);

  const inspector = page.locator(".inspector:not(.hidden)").first();
  await inspector.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
  if (!(await inspector.isVisible().catch(() => false))) {
    throw new BridgeError(
      `Inspector did not open for "${componentId}"`,
      "Call tinkercad_get_circuit or tinkercad_screenshot to verify the component is visible on the canvas."
    );
  }

  const fieldLower = name.trim().toLowerCase();
  const parsedUnit = parseValueAndUnit(fieldLower, value);

  const applied = await applyInspectorField(page, fieldLower, value, parsedUnit);
  if (applied) {
    await page.waitForTimeout(350);
    return inspectCircuit();
  }

  throw new BridgeError(
    `Could not find inspector field "${name}" for ${componentId}`,
    "Select the component in the editor and check the inspector panel. Common fields: resistance, color, name, value."
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

  const applied = await page.evaluate((next: string): string => {
    const ce = (window as unknown as {
      circuit_editor?: {
        circuitEditor?: {
          code_editor?: {
            activeDevice?: unknown;
            setCode?: (code: string) => void;
          };
        };
      };
    }).circuit_editor?.circuitEditor;
    if (ce?.code_editor?.activeDevice && typeof ce.code_editor.setCode === "function") {
      ce.code_editor.setCode(next);
      return "circuit_editor";
    }
    const cmHost = document.querySelector(".CodeMirror") as (Element & { CodeMirror?: { setValue: (v: string) => void } }) | null;
    if (cmHost?.CodeMirror) {
      cmHost.CodeMirror.setValue(next);
      return "codemirror";
    }
    const aceEl = document.querySelector(".ace_editor") as (Element & { env?: { editor?: { setValue: (v: string, pos?: number) => void } } }) | null;
    if (aceEl?.env?.editor) {
      aceEl.env.editor.setValue(next, -1);
      return "ace";
    }
    const textarea = document.querySelector<HTMLTextAreaElement>("#CODE_EDITOR_ID textarea, .code_panel textarea");
    if (textarea) {
      textarea.focus();
      textarea.value = next;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      return "textarea";
    }
    return "";
  }, source);

  if (applied) {
    await page.waitForTimeout(500);
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
  const simToggle = page.locator("#SIMULATION_ID, .js-toggleSimulation").first();
  if (await simToggle.isVisible().catch(() => false)) {
    const text = ((await simToggle.textContent().catch(() => "")) ?? "").trim();
    if (/stop simulation/i.test(text)) {
      return;
    }
    await simToggle.click();
    await page.waitForTimeout(SIMULATION_SETTLE_MS);
    return;
  }
  const button = page.getByRole("button", { name: /^start simulation$/i }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    await page.waitForTimeout(SIMULATION_SETTLE_MS);
    return;
  }
  throw new BridgeError(
    "Start Simulation control is not visible",
    "Make sure a circuit is open and simulation is not already running."
  );
}

export async function stopSimulation(): Promise<void> {
  const page = await getPage();
  const simToggle = page.locator("#SIMULATION_ID, .js-toggleSimulation").first();
  if (await simToggle.isVisible().catch(() => false)) {
    const text = ((await simToggle.textContent().catch(() => "")) ?? "").trim();
    if (/start simulation/i.test(text)) {
      return;
    }
    await simToggle.click();
    await page.waitForTimeout(400);
    return;
  }
  const button = page.getByRole("button", { name: /^stop simulation$/i }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return;
  }
  throw new BridgeError(
    "Stop Simulation control is not visible",
    "Simulation may already be stopped. Check with tinkercad_get_circuit."
  );
}

export async function readSerial(waitMs: number): Promise<string> {
  const page = await getPage();
  await openSerialMonitor(page);
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
  const state = await scrapePage(page);
  if (state.serial.trim() !== "") {
    return state.serial;
  }
  const textNode = page.locator(".js-code_panel__serial__text, .code_panel__serial__content__text").first();
  if (await textNode.count().catch(() => 0)) {
    return ((await textNode.textContent().catch(() => "")) ?? "").trim();
  }
  return "";
}

async function isCodePanelOnScreen(page: Page): Promise<boolean> {
  return page.evaluate((): boolean => {
    const ce = (window as unknown as {
      circuit_editor?: { circuitEditor?: { codePanel?: { sidebar?: { visible?: boolean } } } };
    }).circuit_editor?.circuitEditor;
    if (typeof ce?.codePanel?.sidebar?.visible === "boolean") {
      return ce.codePanel.sidebar.visible;
    }
    const codeBtn = document.querySelector("#CODE_EDITOR_ID");
    if (codeBtn && codeBtn.classList.contains("active")) {
      return true;
    }
    const panel = document.querySelector(".js-tpl-target__code_panel > div, .code_panel");
    if (!panel) {
      return false;
    }
    const rect = panel.getBoundingClientRect();
    return rect.width > 100 && rect.x < window.innerWidth - 50;
  }).catch(() => false);
}

async function openCodePanel(page: Page): Promise<void> {
  if (await isCodePanelOnScreen(page)) {
    return;
  }
  const codeToggle = page.locator("#CODE_EDITOR_ID, .js-toggle_code_panel").first();
  if (await codeToggle.isVisible().catch(() => false)) {
    await codeToggle.click();
  } else {
    const codeButton = page.getByRole("button", { name: /^code$/i }).first();
    if (await codeButton.isVisible().catch(() => false)) {
      await codeButton.click();
    }
  }
  for (let i = 0; i < 12; i += 1) {
    if (await isCodePanelOnScreen(page)) {
      await page.waitForTimeout(350);
      return;
    }
    await page.waitForTimeout(200);
  }
}

async function closeCodePanel(page: Page): Promise<void> {
  if (!(await isCodePanelOnScreen(page))) {
    return;
  }
  const codeToggle = page.locator("#CODE_EDITOR_ID, .js-toggle_code_panel").first();
  if (await codeToggle.isVisible().catch(() => false)) {
    await codeToggle.click();
  }
  for (let i = 0; i < 12; i += 1) {
    if (!(await isCodePanelOnScreen(page))) {
      await page.waitForTimeout(350);
      return;
    }
    await page.waitForTimeout(200);
  }
}

async function openSerialMonitor(page: Page): Promise<void> {
  await openCodePanel(page);
  const content = page.locator(".js-code_panel__serial__content").first();
  const box = await content.boundingBox().catch(() => null);
  if (box && box.height >= 30) {
    return;
  }
  const openedViaModel = await page.evaluate((): boolean => {
    const ce = (window as unknown as {
      circuit_editor?: { circuitEditor?: { codePanel?: { showSerial?: () => void } } };
    }).circuit_editor?.circuitEditor;
    if (typeof ce?.codePanel?.showSerial === "function") {
      ce.codePanel.showSerial();
      return true;
    }
    return false;
  }).catch(() => false);
  if (openedViaModel) {
    await page.waitForTimeout(400);
    const afterBox = await content.boundingBox().catch(() => null);
    if (afterBox && afterBox.height >= 30) {
      return;
    }
  }
  const toggle = page.locator("#SERIAL_MONITOR_ID, .js-toggle_serial_monitor").first();
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
    await page.waitForTimeout(450);
  }
}

async function switchCodeMode(page: Page, mode: string): Promise<void> {
  const modeButton = page.locator(".js-tpl-target__code_panel .editor__dropdown__button, .code_panel .editor__dropdown__button, .js-code_panel .editor__dropdown__button").first();
  if (await modeButton.isVisible().catch(() => false)) {
    const current = ((await modeButton.textContent().catch(() => "")) ?? "").trim();
    if (new RegExp(`^${escapeRegExp(mode)}$`, "i").test(current)) {
      return;
    }
    await modeButton.click();
    await page.waitForTimeout(200);
    const option = page.locator(".js-tpl-target__code_panel .editor__dropdown__list__option__value, .code_panel .editor__dropdown__list__option__value, .editor__dropdown__list__option__value")
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(mode)}\\s*$`, "i") })
      .first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
      await page.waitForTimeout(350);
      await acceptCodeModeConfirmDialog(page);
      await page.waitForTimeout(400);
      return;
    }
  }

  const dropdown = page.getByRole("combobox").first();
  if (await dropdown.isVisible().catch(() => false)) {
    await dropdown.selectOption({ label: mode }).catch(async () => {
      await dropdown.click();
      await page.getByRole("option", { name: new RegExp(escapeRegExp(mode), "i") }).first().click();
    });
    await acceptCodeModeConfirmDialog(page);
    return;
  }
  const textOption = page.getByText(mode, { exact: true }).first();
  if (await textOption.isVisible().catch(() => false)) {
    await textOption.click();
    await acceptCodeModeConfirmDialog(page);
  }
}

async function acceptCodeModeConfirmDialog(page: Page): Promise<void> {
  const confirmCandidates = [
    page.locator(".dialogue__btn--confirm, .js-dialogue-confirm, .dialogue a:has-text('Continue'), .dialogue button:has-text('Continue')").first(),
    page.getByRole("button", { name: /^continue$/i }).first(),
    page.getByRole("link", { name: /^continue$/i }).first()
  ];
  for (const candidate of confirmCandidates) {
    if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
      await candidate.click();
      await page.waitForTimeout(400);
      return;
    }
  }
}

function findComponentInState(components: CircuitComponent[], componentId: string): CircuitComponent | undefined {
  const needle = componentId.trim().toLowerCase();
  return (
    components.find((item) => item.id.toLowerCase() === needle) ??
    components.find((item) => item.name.toLowerCase() === needle) ??
    components.find((item) => item.type.toLowerCase() === needle) ??
    components.find((item) => item.name.toLowerCase().includes(needle) || item.type.toLowerCase().includes(needle))
  );
}

async function getComponentScreenCenter(componentId: string): Promise<{ x: number; y: number; component: CircuitComponent }> {
  const state = await inspectCircuit();
  const component = findComponentInState(state.components, componentId);
  if (!component) {
    throw new BridgeError(
      `Component "${componentId}" was not found`,
      "Call tinkercad_get_circuit to list ids, or tinkercad_screenshot to see the canvas."
    );
  }
  const x = component.width > 0 ? component.x + component.width / 2 : component.x;
  const y = component.height > 0 ? component.y + component.height / 2 : component.y;
  return { x, y, component };
}

async function getExactDeviceScreenCenter(page: Page, componentId: string): Promise<{ x: number; y: number; alreadySelected: boolean } | null> {
  return page.evaluate((targetId: string) => {
    const ce = (window as unknown as {
      circuit_editor?: {
        circuitEditor?: {
          breadboardEditor?: { zoomGroup?: SVGGraphicsElement };
          data?: {
            devices?: {
              forEach: (cb: (d: {
                local_id?: string;
                versions_id?: string;
                breadboard?: () => {
                  pos?: () => { x: number; y: number };
                  views?: {
                    _content?: Record<string, {
                      val?: {
                        selected?: boolean;
                        symbolGroup?: { node?: Element } & Element;
                        group?: { node?: Element } & Element;
                        outerGroup?: { node?: Element } & Element;
                      };
                    }>;
                  };
                };
              }) => void) => void;
            };
          };
        };
      };
    }).circuit_editor?.circuitEditor;
    const bb = ce?.breadboardEditor;
    const ctm = bb?.zoomGroup?.getScreenCTM?.();
    let result: { x: number; y: number; alreadySelected: boolean } | null = null;
    ce?.data?.devices?.forEach((d) => {
      if (result || (d.local_id !== targetId && d.versions_id !== targetId)) {
        return;
      }
      const bbEl = typeof d.breadboard === "function" ? d.breadboard() : undefined;
      const entries = Object.values(bbEl?.views?._content ?? {});
      const view = entries[0]?.val;
      const alreadySelected = Boolean(view?.selected);

      const node = view?.symbolGroup?.node ?? view?.symbolGroup ?? view?.group?.node ?? view?.group ?? view?.outerGroup?.node ?? view?.outerGroup;
      if (node && typeof node.getBoundingClientRect === "function") {
        const rect = node.getBoundingClientRect();
        if (rect.width > 4 && rect.height > 4) {
          result = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, alreadySelected };
          return;
        }
      }
      const pos = typeof bbEl?.pos === "function" ? bbEl.pos() : undefined;
      if (pos && ctm) {
        result = {
          x: ctm.a * pos.x + ctm.c * pos.y + ctm.e,
          y: ctm.b * pos.x + ctm.d * pos.y + ctm.f,
          alreadySelected
        };
      }
    });
    return result;
  }, componentId).catch(() => null);
}

async function selectComponent(page: Page, componentId: string): Promise<CircuitComponent> {
  await closeCodePanel(page);
  const { x: fallbackX, y: fallbackY, component } = await getComponentScreenCenter(componentId);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const exact = await getExactDeviceScreenCenter(page, component.id);
    const openInspector = page.locator(".inspector:not(.hidden)").first();
    const inspectorOpen = await openInspector.isVisible().catch(() => false);
    if (inspectorOpen) {
      const title = ((await openInspector.locator(".inspector__title__text").first().textContent().catch(() => "")) ?? "").trim().toLowerCase();
      if (exact?.alreadySelected || (title !== "" && (component.name.toLowerCase().includes(title) || title.includes(component.name.toLowerCase())))) {
        return component;
      }
    }

    if (attempt === 1) {
      await zoomToFit(page);
    }
    const fresh = await getExactDeviceScreenCenter(page, component.id);
    const clickX = fresh?.x ?? fallbackX;
    const clickY = fresh?.y ?? fallbackY;
    await page.mouse.move(clickX, clickY);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(350);

    if (await openInspector.isVisible().catch(() => false)) {
      return component;
    }
  }
  return component;
}

export interface ParsedUnitValue {
  numeric: string;
  unit?: string;
}

export function parseValueAndUnit(fieldName: string, rawValue: string): ParsedUnitValue | undefined {
  const isUnitField = /resist|capacit|induct|volt|curr|freq|ohm/i.test(fieldName);
  const match = rawValue.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*(p|n|u|μ|µ|m|k|K|M|G)?\s*(?:ohms?|Ω|Ω|f|h|v|a|hz)?$/i);
  if (!match) {
    return undefined;
  }
  const [, numeric, rawPrefix] = match;
  if (!rawPrefix && !isUnitField) {
    return undefined;
  }
  if (!rawPrefix) {
    return { numeric, unit: "none" };
  }
  if (rawPrefix === "M") {
    return { numeric, unit: "M" };
  }
  if (rawPrefix === "m") {
    return { numeric, unit: "m" };
  }
  const lower = rawPrefix.toLowerCase();
  if (lower === "μ" || lower === "µ" || lower === "u") {
    return { numeric, unit: "u" };
  }
  if (lower === "k" || lower === "p" || lower === "n") {
    return { numeric, unit: lower };
  }
  if (lower === "g") {
    return { numeric, unit: "G" };
  }
  return { numeric, unit: "none" };
}

async function applyInspectorField(
  page: Page,
  fieldLower: string,
  rawValue: string,
  parsedUnit: ParsedUnitValue | undefined
): Promise<boolean> {
  const inspector = page.locator(".inspector:not(.hidden)").first();
  const unitSelect = inspector.locator("select.js-unit_select").first();
  const hasUnitSelect = await unitSelect.isVisible().catch(() => false);

  // If targeting resistance / unit-bearing field and a unit selector exists, handle both input + unit dropdown.
  if (hasUnitSelect && (/resist|capacit|induct|value/i.test(fieldLower))) {
    const valueInputs = inspector.locator("input.js-valueInput, input[type='text'], input[type='number']");
    const inputCount = await valueInputs.count();
    const targetInput = inputCount >= 2 ? valueInputs.nth(1) : valueInputs.first();
    if (await targetInput.isVisible().catch(() => false)) {
      const numeric = parsedUnit?.numeric ?? rawValue;
      await targetInput.click({ clickCount: 3 });
      await targetInput.fill(numeric);
      await targetInput.press("Enter");
      if (parsedUnit?.unit) {
        await unitSelect.selectOption({ value: parsedUnit.unit }).catch(() => undefined);
      }
      return true;
    }
  }

  // Try matching by label inside the inspector first.
  const labeled = inspector.getByLabel(new RegExp(escapeRegExp(fieldLower), "i")).first();
  if (await labeled.isVisible().catch(() => false)) {
    const tag = await labeled.evaluate((el) => el.tagName.toLowerCase());
    if (tag === "select") {
      await selectOptionCaseInsensitive(labeled, rawValue);
    } else {
      await labeled.fill(parsedUnit?.numeric ?? rawValue);
      await labeled.press("Enter");
    }
    return true;
  }

  // Handle Tinkercad's label-less inspector rows (e.g. Name is input[0], Color is first non-unit select).
  if (fieldLower === "name") {
    const nameInput = inspector.locator("input.js-valueInput, input[type='text']").first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.click({ clickCount: 3 });
      await nameInput.fill(rawValue);
      await nameInput.press("Enter");
      return true;
    }
  }

  const nonUnitSelect = inspector.locator("select:not(.js-unit_select)").first();
  if ((fieldLower === "color" || fieldLower === "colour" || fieldLower === "type" || fieldLower === "mode")
    && await nonUnitSelect.isVisible().catch(() => false)) {
    await selectOptionCaseInsensitive(nonUnitSelect, rawValue);
    return true;
  }

  // Generic fallback: if value matches a non-unit select option, pick it; otherwise fill the last value input.
  if (await nonUnitSelect.isVisible().catch(() => false)) {
    const matched = await selectOptionCaseInsensitive(nonUnitSelect, rawValue).then(() => true).catch(() => false);
    if (matched) {
      return true;
    }
  }
  const fallbackInput = inspector.locator("input.js-valueInput, input").last();
  if (await fallbackInput.isVisible().catch(() => false)) {
    await fallbackInput.click({ clickCount: 3 });
    await fallbackInput.fill(parsedUnit?.numeric ?? rawValue);
    await fallbackInput.press("Enter");
    if (hasUnitSelect && parsedUnit?.unit) {
      await unitSelect.selectOption({ value: parsedUnit.unit }).catch(() => undefined);
    }
    return true;
  }
  return false;
}

async function selectOptionCaseInsensitive(selectLocator: ReturnType<Page["locator"]>, value: string): Promise<void> {
  const options = await selectLocator.evaluate((el) => {
    const select = el as HTMLSelectElement;
    return Array.from(select.options).map((opt) => ({ value: opt.value, label: opt.textContent?.trim() ?? "" }));
  });
  const needle = value.trim().toLowerCase();
  const match =
    options.find((opt) => opt.label.toLowerCase() === needle || opt.value.toLowerCase() === needle) ??
    options.find((opt) => opt.label.toLowerCase().includes(needle) || opt.value.toLowerCase().includes(needle));
  if (match) {
    await selectLocator.selectOption({ value: match.value });
    return;
  }
  await selectLocator.selectOption({ label: value }).catch(async () => {
    await selectLocator.selectOption({ value });
  });
}

const PIN_ALIAS_MAP: Record<string, string[]> = {
  gnd: ["gnd", "gnd1", "gnd2", "gnd3", "ground", "neg", "-"],
  pin1: ["1", "terminal 1", "terminal1", "t1", "pin1"],
  terminal1: ["1", "terminal 1", "terminal1", "t1", "pin1"],
  "terminal 1": ["1", "terminal 1", "terminal1", "t1", "pin1"],
  pin2: ["2", "terminal 2", "terminal2", "t2", "pin2"],
  terminal2: ["2", "terminal 2", "terminal2", "t2", "pin2"],
  "terminal 2": ["2", "terminal 2", "terminal2", "t2", "pin2"],
  anode: ["a", "anode", "pos", "positive", "+"],
  cathode: ["c", "k", "cathode", "neg", "negative", "-"],
  "3.3v": ["3v3", "3.3v"],
  "5v": ["5v", "vcc"],
  vcc: ["vcc", "5v", "pos", "positive", "+"],
  wiper: ["wiper", "w", "2"]
};

export function resolvePin(component: CircuitComponent, pinName: string): { id: string; name: string; x: number; y: number } | undefined {
  const needle = pinName.trim().toLowerCase();
  const exact = component.pins.find(
    (item) => item.name.toLowerCase() === needle || item.id.toLowerCase() === needle
  );
  if (exact) {
    return exact;
  }
  const aliases = PIN_ALIAS_MAP[needle] ?? (/^\d+$/.test(needle) ? [`d${needle}`, needle] : []);
  for (const alias of aliases) {
    const matched = component.pins.find((item) => item.name.toLowerCase() === alias);
    if (matched) {
      return matched;
    }
  }
  return component.pins.find((item) => item.name.toLowerCase().startsWith(needle));
}

async function clickPin(page: Page, pinRef: string, cachedState?: CircuitState): Promise<void> {
  const [componentId, pinName] = splitPinRef(pinRef);
  const state = cachedState ?? await inspectCircuit();
  const component = findComponentInState(state.components, componentId);
  if (component) {
    const pin = resolvePin(component, pinName);
    if (pin) {
      await page.mouse.move(pin.x, pin.y, { steps: 5 });
      await page.waitForTimeout(100);
      await page.mouse.click(pin.x, pin.y);
      return;
    }
    throw new BridgeError(
      `Pin "${pinName}" was not found on ${component.name} (${component.id})`,
      `Available pins: ${component.pins.map((p) => p.name).join(", ") || "none"}.`
    );
  }

  throw new BridgeError(
    `Component "${componentId}" for pin "${pinRef}" was not found`,
    "Call tinkercad_get_circuit and use componentId.pinName (for example Device_0.D13 or Device_1.1)."
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

async function zoomToFit(page: Page): Promise<void> {
  const hudBtn = page.locator(".viewcube__button.js-zoomToFit").first();
  if (await hudBtn.isVisible().catch(() => false)) {
    await hudBtn.click();
    await page.waitForTimeout(600);
    return;
  }
  await page.keyboard.press("f").catch(() => undefined);
  await page.waitForTimeout(600);
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function probeEditor(): Promise<ScrapedState> {
  const page = await getPage();
  return scrapePage(page);
}
