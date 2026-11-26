import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedTinkercadHost, resolveTinkercadUrl } from "./browser.js";

describe("URL and host validation", () => {
  it("allows exact and subdomain tinkercad/autodesk hosts only", () => {
    assert.equal(isAllowedTinkercadHost("tinkercad.com"), true);
    assert.equal(isAllowedTinkercadHost("www.tinkercad.com"), true);
    assert.equal(isAllowedTinkercadHost("accounts.autodesk.com"), true);

    assert.equal(isAllowedTinkercadHost("eviltinkercad.com"), false);
    assert.equal(isAllowedTinkercadHost("not-tinkercad.com"), false);
    assert.equal(isAllowedTinkercadHost("fakeautodesk.com"), false);
    assert.equal(isAllowedTinkercadHost("tinkercad.com.evil.test"), false);
  });

  it("resolves valid Tinkercad targets", () => {
    assert.equal(resolveTinkercadUrl("new"), "https://www.tinkercad.com/circuits");
    assert.equal(resolveTinkercadUrl("circuits"), "https://www.tinkercad.com/circuits");
    assert.equal(
      resolveTinkercadUrl("ehp0AOfqFDL"),
      "https://www.tinkercad.com/things/ehp0AOfqFDL/editel"
    );
    assert.equal(
      resolveTinkercadUrl("/things/abc123/editel"),
      "https://www.tinkercad.com/things/abc123/editel"
    );
    assert.equal(
      resolveTinkercadUrl("https://www.tinkercad.com/things/abc123/editel"),
      "https://www.tinkercad.com/things/abc123/editel"
    );
  });

  it("rejects domain bypasses, non-HTTPS, credentials, and unsafe paths/ids", () => {
    const blocked = [
      "https://eviltinkercad.com/things/abc/editel",
      "https://notautodesk.com/login",
      "http://www.tinkercad.com/circuits",
      "https://user:pass@www.tinkercad.com/circuits",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "//evil.example/phish",
      "/\\evil.example",
      "../admin",
      "abc123?redirect=evil.example"
    ];

    for (const target of blocked) {
      assert.throws(() => resolveTinkercadUrl(target), `expected rejection for ${target}`);
    }
  });
});
