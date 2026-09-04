import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ResponseFormat } from "../constants.js";
import { formatCatalog, formatCircuit, formatLogin } from "./format.js";
import type { CircuitState } from "../types.js";
import { COMPONENT_CATALOG } from "../catalog.js";

const sample: CircuitState = {
  url: "https://www.tinkercad.com/things/sampleblink/editel",
  title: "Arduino LED Blink",
  loggedIn: true,
  editorReady: true,
  simulationRunning: false,
  code: "void setup(){ pinMode(13, OUTPUT); }\nvoid loop(){ digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }",
  serial: "blink",
  components: [
    {
      id: "uno",
      name: "Arduino Uno R3",
      type: "arduino_uno_r3",
      x: 220,
      y: 220,
      width: 180,
      height: 120,
      pins: [{ id: "d13", name: "D13", x: 300, y: 240 }],
      attributes: {}
    },
    {
      id: "led1",
      name: "LED",
      type: "led",
      x: 520,
      y: 220,
      width: 40,
      height: 20,
      pins: [{ id: "a", name: "anode", x: 530, y: 220 }],
      attributes: { color: "red" }
    }
  ],
  wires: [{ id: "w1", from: "uno.D13", to: "led1.anode" }],
  capabilities: {
    hasBreadboardSvg: true,
    hasSerialInput: true,
    hasSerialSend: true,
    hasSerialOutput: true,
    hasCodeMirror: true,
    hasAce: false,
    hasMonaco: false,
    hasCodeTextarea: false,
    hasStartSimulation: true,
    hasStopSimulation: false,
    hasInspector: true,
    interestingGlobals: []
  },
  source: "svg"
};

describe("formatters", () => {
  it("renders markdown circuit summaries", () => {
    const text = formatCircuit(sample, ResponseFormat.MARKDOWN);
    assert.match(text, /Arduino LED Blink/);
    assert.match(text, /led1/);
    assert.match(text, /D13/);
  });

  it("renders json circuit snapshots", () => {
    const parsed = JSON.parse(formatCircuit(sample, ResponseFormat.JSON)) as CircuitState;
    assert.equal(parsed.components.length, 2);
    assert.equal(parsed.wires[0]?.from, "uno.D13");
  });

  it("renders catalog and login", () => {
    assert.match(formatCatalog(COMPONENT_CATALOG, ResponseFormat.MARKDOWN), /arduino_uno_r3/);
    assert.match(formatLogin({ loggedIn: true, url: "https://www.tinkercad.com/circuits", message: "ok" }, ResponseFormat.MARKDOWN), /Logged in: true/);
  });
});
