import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

interface SampleCircuit {
  components: Array<{ attributes?: Record<string, string> }>;
  code: string;
}

describe("sample circuit evaluations", () => {
  const sample = JSON.parse(
    readFileSync(path.resolve("evaluations/sample-circuit.json"), "utf8")
  ) as SampleCircuit;
  const xml = readFileSync(path.resolve("evaluations/tinkercad-circuits.xml"), "utf8");
  const answers = [...xml.matchAll(/<answer>([^<]+)<\/answer>/g)].map((match) => match[1]);

  it("has ten qa pairs", () => {
    assert.equal(answers.length, 10);
  });

  it("agrees with the sample fixture", () => {
    assert.equal(sample.components.length, 3);
    assert.equal(sample.components[1]?.attributes?.color, "red");
    assert.equal(sample.components[2]?.attributes?.resistance, "220");
    assert.match(sample.code, /pinMode\(13/);
    assert.match(sample.code, /Serial\.begin\(9600\)/);
    assert.match(sample.code, /delay\(1000\)/);
    assert.deepEqual(answers.slice(4), ["3", "220", "red", "13", "9600", "1000"]);
  });
});
