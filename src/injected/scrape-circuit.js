(() => {
  const interesting = Object.getOwnPropertyNames(window)
    .filter((name) => /tinker|circuit|autodesk|editor|breadboard|arduino/i.test(name))
    .slice(0, 40);

  const has = (selector) => Boolean(document.querySelector(selector));

  const capabilities = {
    hasBreadboardSvg: has("#breadboardTab svg"),
    hasSerialInput: has(".js-code_panel__serial__input"),
    hasSerialSend: has(".js-code_panel__serial__send"),
    hasSerialOutput: Boolean(
      document.querySelector(".js-code_panel__serial__content, .code_panel__serial__text, .code_panel__serial__out, .serial-monitor")
    ),
    hasCodeMirror: has(".CodeMirror"),
    hasAce: Boolean(window.ace) || has(".ace_editor"),
    hasMonaco: has(".monaco-editor"),
    hasCodeTextarea: Boolean(document.querySelector("#CODE_EDITOR_ID textarea, .code_panel textarea")),
    hasStartSimulation: Boolean(
      Array.from(document.querySelectorAll("button, a, [role='button']")).find((el) => /start simulation/i.test(el.textContent || ""))
    ),
    hasStopSimulation: Boolean(
      Array.from(document.querySelectorAll("button, a, [role='button']")).find((el) => /stop simulation/i.test(el.textContent || ""))
    ),
    hasInspector: has(".inspector"),
    interestingGlobals: interesting
  };

  const simulationRunning =
    (capabilities.hasStopSimulation && !capabilities.hasStartSimulation) ||
    (Boolean(document.querySelector(".sitemenu__info")) && /stop simulation/i.test(document.body.innerText));

  let code = "";
  const cmHost = document.querySelector(".CodeMirror");
  if (cmHost && cmHost.CodeMirror) {
    code = cmHost.CodeMirror.getValue();
  }
  const aceEl = document.querySelector(".ace_editor");
  if (!code && aceEl && aceEl.env && aceEl.env.editor) {
    code = aceEl.env.editor.getValue();
  }
  const textarea = document.querySelector("#CODE_EDITOR_ID textarea, .code_panel textarea");
  if (!code && textarea) {
    code = textarea.value;
  }

  const serialSelectors = [
    ".js-code_panel__serial__content",
    ".code_panel__serial__text",
    ".code_panel__serial__out",
    ".code_panel__serial",
    "[class*='serial__output']",
    "[class*='serial-output']"
  ];
  let serial = "";
  for (const selector of serialSelectors) {
    const node = document.querySelector(selector);
    if (node && (node.textContent || "").trim().length > 0) {
      serial = (node.textContent || "").trim();
      break;
    }
  }

  function guessType(name) {
    const lower = String(name).toLowerCase();
    if (lower.includes("arduino")) return "arduino_uno_r3";
    if (lower.includes("led")) return "led";
    if (lower.includes("resistor")) return "resistor";
    if (lower.includes("breadboard")) return "breadboard_small";
    if (lower.includes("button")) return "pushbutton";
    return name;
  }

  function collectAttributes(el) {
    const attrs = {};
    for (const attr of Array.from(el.attributes || [])) {
      if (attr.name.startsWith("data-") && attr.name !== "data-id" && attr.name !== "data-component-id") {
        attrs[attr.name.replace(/^data-/, "")] = attr.value;
      }
    }
    return attrs;
  }

  const components = [];
  const svg = document.querySelector("#breadboardTab svg");
  if (svg) {
    const groups = Array.from(svg.querySelectorAll("g[id], g[data-id], g[data-component], [data-component-id]"));
    const seen = new Set();
    for (const group of groups) {
      const id = group.getAttribute("id") || group.getAttribute("data-id") || group.getAttribute("data-component-id") || "";
      if (!id || seen.has(id) || /view|grid|layer|zoom|wire-layer/i.test(id)) {
        continue;
      }
      if (group.closest("#viewcube")) {
        continue;
      }
      seen.add(id);
      const box = group.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) {
        continue;
      }
      const titleNode = group.querySelector("title");
      const title = (titleNode && titleNode.textContent && titleNode.textContent.trim())
        || group.getAttribute("data-name")
        || group.getAttribute("aria-label")
        || id;
      const pins = Array.from(group.querySelectorAll("circle, [data-pin], [class*='pin'], [class*='lead']"))
        .slice(0, 32)
        .map((pin, index) => {
          const pinBox = pin.getBoundingClientRect();
          return {
            id: pin.getAttribute("id") || pin.getAttribute("data-pin") || id + "-pin-" + index,
            name: pin.getAttribute("data-pin") || pin.getAttribute("aria-label") || pin.getAttribute("title") || ("pin" + index),
            x: pinBox.x + pinBox.width / 2,
            y: pinBox.y + pinBox.height / 2
          };
        });
      components.push({
        id,
        name: title,
        type: group.getAttribute("data-type") || group.getAttribute("data-component") || guessType(title),
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        pins,
        attributes: collectAttributes(group)
      });
    }
  }

  const wires = [];
  if (svg) {
    const paths = Array.from(svg.querySelectorAll("path[id], line[id], polyline[id], [data-wire]"));
    paths.forEach((node, index) => {
      const id = node.getAttribute("id") || node.getAttribute("data-wire") || ("wire-" + index);
      if (!/wire|conn|net/i.test(id + (node.getAttribute("class") || ""))) {
        return;
      }
      wires.push({
        id,
        from: node.getAttribute("data-from") || "unknown",
        to: node.getAttribute("data-to") || "unknown"
      });
    });
  }

  return {
    url: location.href,
    title: document.title,
    editorReady: Boolean(svg || document.querySelector("#CODE_EDITOR_ID")),
    simulationRunning,
    code,
    serial,
    components,
    wires,
    capabilities
  };
})()
