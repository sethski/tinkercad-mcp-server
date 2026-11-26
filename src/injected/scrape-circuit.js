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
      document.querySelector(".js-code_panel__serial__text, .code_panel__serial__content__text, .code_panel__serial__out, .serial-monitor")
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

  const ce = window.circuit_editor && window.circuit_editor.circuitEditor;

  let code = "";
  try {
    if (ce && ce.code_editor && ce.code_editor.codeMirror && typeof ce.code_editor.codeMirror.getValue === "function") {
      code = ce.code_editor.codeMirror.getValue() || "";
    }
  } catch {
    // Fall back to DOM editors.
  }
  const cmHost = document.querySelector(".CodeMirror");
  if (!code && cmHost && cmHost.CodeMirror) {
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
    ".js-code_panel__serial__text",
    ".code_panel__serial__content__text",
    ".js-code_editor__serial-monitor__content",
    ".code_panel__serial__out",
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
    if (lower.includes("potentiometer")) return "potentiometer";
    if (lower.includes("photoresistor")) return "photoresistor";
    if (lower.includes("capacitor")) return "capacitor";
    if (lower.includes("battery")) return "battery_9v";
    if (lower.includes("piezo")) return "piezo";
    if (lower.includes("servo")) return "servo";
    if (lower.includes("ultrasonic")) return "ultrasonic";
    if (lower.includes("lcd")) return "lcd_16x2";
    if (lower.includes("multimeter")) return "multimeter";
    if (lower.includes("slide")) return "slide_switch";
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
  const wires = [];
  let usedModel = false;

  try {
    const bb = ce && ce.breadboardEditor;
    const data = ce && ce.data;
    const ctm = bb && bb.zoomGroup && typeof bb.zoomGroup.getScreenCTM === "function"
      ? bb.zoomGroup.getScreenCTM()
      : null;

    if (data && data.devices && typeof data.devices.forEach === "function" && ctm) {
      usedModel = true;
      const toScreen = (pt) => {
        if (!pt || typeof pt.x !== "number" || typeof pt.y !== "number") {
          return null;
        }
        return {
          x: ctm.a * pt.x + ctm.c * pt.y + ctm.e,
          y: ctm.b * pt.x + ctm.d * pt.y + ctm.f
        };
      };

      const terminalIdToRef = new Map();

      data.devices.forEach((device) => {
        const id = device.local_id || device.versions_id || "";
        if (!id) {
          return;
        }
        const desc = typeof device.getDescription === "function" ? device.getDescription() : null;
        const devName = (desc && desc.device && desc.device.name) || id;
        const instanceName = typeof device.name === "function" ? device.name() : (device.name || "");
        const bbEl = typeof device.breadboard === "function" ? device.breadboard() : device.breadboard;
        const rawPos = bbEl && (typeof bbEl.pos === "function" ? bbEl.pos() : bbEl.pos);
        const center = toScreen(rawPos) || { x: 0, y: 0 };

        let x = center.x;
        let y = center.y;
        let width = 0;
        let height = 0;

        const viewContent = bbEl && bbEl.views && bbEl.views._content ? bbEl.views._content : null;
        const firstViewEntry = viewContent ? Object.values(viewContent)[0] : null;
        const bbView = firstViewEntry ? (firstViewEntry.val || firstViewEntry) : null;
        const groupNode = bbView && (
          (bbView.outerGroup && (bbView.outerGroup.node || bbView.outerGroup)) ||
          (bbView.group && (bbView.group.node || bbView.group)) ||
          (bbView.symbolGroup && (bbView.symbolGroup.node || bbView.symbolGroup))
        );
        if (groupNode && typeof groupNode.getBoundingClientRect === "function") {
          const rect = groupNode.getBoundingClientRect();
          if (rect.width > 4 && rect.height > 4) {
            x = rect.x;
            y = rect.y;
            width = rect.width;
            height = rect.height;
          }
        }

        const pins = [];
        const pinMap = device.name2terminal && device.name2terminal._content ? device.name2terminal._content : {};
        for (const [pinName, entry] of Object.entries(pinMap)) {
          const term = entry && (entry.val || entry);
          if (!term) {
            continue;
          }
          const ref = `${id}.${pinName}`;
          if (term.versions_id) {
            terminalIdToRef.set(term.versions_id, ref);
          }
          if (term.local_id) {
            terminalIdToRef.set(term.local_id, ref);
          }
          let pinScreen = null;
          if (typeof term.getBreadboardPos === "function") {
            pinScreen = toScreen(term.getBreadboardPos());
          }
          if (pinScreen) {
            pins.push({
              id: term.local_id || `${id}-${pinName}`,
              name: pinName,
              x: pinScreen.x,
              y: pinScreen.y
            });
          }
        }

        const attributes = {};
        if (instanceName) {
          attributes.name = String(instanceName);
        }
        const json = typeof device.jsonify === "function" ? device.jsonify() : null;
        if (json && json.properties && typeof json.properties === "object") {
          for (const prop of Object.values(json.properties)) {
            if (!prop || typeof prop !== "object" || !prop.name) {
              continue;
            }
            const propName = String(prop.name);
            if (propName.toLowerCase() === "code") {
              continue;
            }
            const prefix = prop.prefix && prop.prefix !== "none" ? prop.prefix : "";
            const isEnum = typeof prop.unit === "string" && prop.unit.includes("[[");
            const unit = !isEnum && typeof prop.unit === "string" ? prop.unit : "";
            const suffix = `${prefix}${unit}`.trim();
            const rawVal = prop.value !== undefined && prop.value !== null ? String(prop.value) : "";
            const cleanVal = isEnum
              ? (prefix || rawVal)
              : (suffix ? `${rawVal} ${suffix}` : rawVal);
            attributes[propName] = cleanVal;
          }
        }

        components.push({
          id,
          name: devName,
          type: guessType(devName),
          x,
          y,
          width,
          height,
          pins,
          attributes
        });
      });

      if (data.wires && typeof data.wires.forEach === "function") {
        data.wires.forEach((wire) => {
          const wJson = typeof wire.jsonify === "function" ? wire.jsonify() : null;
          const fromId = wJson && wJson.begin && wJson.begin.$idref;
          const toId = wJson && wJson.end && wJson.end.$idref;
          wires.push({
            id: wire.local_id || wire.versions_id || `wire-${wires.length}`,
            from: (fromId && terminalIdToRef.get(fromId)) || fromId || "unknown",
            to: (toId && terminalIdToRef.get(toId)) || toId || "unknown"
          });
        });
      }
    }
  } catch {
    usedModel = false;
  }

  const svg = document.querySelector("#breadboardTab svg");
  if (!usedModel && svg) {
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
