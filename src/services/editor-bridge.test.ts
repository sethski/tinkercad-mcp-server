import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CircuitComponent } from "../types.js";
import { parseValueAndUnit, resolvePin } from "./editor-bridge.js";

describe("editor-bridge helpers", () => {
  it("parses resistance values and SI prefixes", () => {
    assert.deepEqual(parseValueAndUnit("resistance", "220"), { numeric: "220", unit: "none" });
    assert.deepEqual(parseValueAndUnit("resistance", "220 Ω"), { numeric: "220", unit: "none" });
    assert.deepEqual(parseValueAndUnit("resistance", "220 ohm"), { numeric: "220", unit: "none" });
    assert.deepEqual(parseValueAndUnit("resistance", "10k"), { numeric: "10", unit: "k" });
    assert.deepEqual(parseValueAndUnit("resistance", "4.7 kΩ"), { numeric: "4.7", unit: "k" });
    assert.deepEqual(parseValueAndUnit("resistance", "1M"), { numeric: "1", unit: "M" });
    assert.deepEqual(parseValueAndUnit("resistance", "100m"), { numeric: "100", unit: "m" });
    assert.deepEqual(parseValueAndUnit("capacitance", "10uF"), { numeric: "10", unit: "u" });
    assert.equal(parseValueAndUnit("color", "red"), undefined);
  });

  it("resolves Tinkercad pin aliases accurately", () => {
    const uno: CircuitComponent = {
      id: "Device_0",
      name: "Arduino Uno R3",
      type: "arduino_uno_r3",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      attributes: {},
      pins: [
        { id: "Terminal_0", name: "GND1", x: 10, y: 20 },
        { id: "Terminal_1", name: "D13", x: 30, y: 20 },
        { id: "Terminal_2", name: "3V3", x: 50, y: 20 }
      ]
    };
    const resistor: CircuitComponent = {
      id: "Device_1",
      name: "Resistor",
      type: "resistor",
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      attributes: {},
      pins: [
        { id: "Terminal_3", name: "1", x: 100, y: 100 },
        { id: "Terminal_4", name: "2", x: 120, y: 100 }
      ]
    };

    assert.equal(resolvePin(uno, "D13")?.name, "D13");
    assert.equal(resolvePin(uno, "13")?.name, "D13");
    assert.equal(resolvePin(uno, "GND")?.name, "GND1");
    assert.equal(resolvePin(uno, "3.3V")?.name, "3V3");
    assert.equal(resolvePin(resistor, "pin1")?.name, "1");
    assert.equal(resolvePin(resistor, "pin2")?.name, "2");
    assert.equal(resolvePin(resistor, "terminal 2")?.name, "2");
  });
});
