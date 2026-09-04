import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COMPONENT_CATALOG, listCatalogMatches, resolveComponent } from "./catalog.js";

describe("component catalog", () => {
  it("resolves common aliases", () => {
    assert.equal(resolveComponent("arduino")?.id, "arduino_uno_r3");
    assert.equal(resolveComponent("LED")?.id, "led");
    assert.equal(resolveComponent("r")?.id, "resistor");
    assert.equal(resolveComponent("hc-sr04")?.id, "ultrasonic");
  });

  it("filters by query", () => {
    const leds = listCatalogMatches("led");
    assert.ok(leds.some((item) => item.id === "led"));
    assert.equal(listCatalogMatches("no-such-part").length, 0);
  });

  it("has default pins for the blink parts", () => {
    const uno = COMPONENT_CATALOG.find((item) => item.id === "arduino_uno_r3");
    const led = COMPONENT_CATALOG.find((item) => item.id === "led");
    const resistor = COMPONENT_CATALOG.find((item) => item.id === "resistor");
    assert.ok(uno?.defaultPins.includes("D13"));
    assert.ok(uno?.defaultPins.includes("GND"));
    assert.ok(led?.defaultPins.includes("anode"));
    assert.ok(resistor?.defaultPins.includes("pin1"));
  });

  it("matches the catalog evaluation answers", () => {
    assert.equal(resolveComponent("hc-sr04")?.id, "ultrasonic");
    assert.equal(resolveComponent("arduino")?.search, "Arduino Uno R3");
    assert.equal(resolveComponent("servo")?.defaultPins.length, 3);
    assert.equal(resolveComponent("ldr")?.id, "photoresistor");
  });
});
