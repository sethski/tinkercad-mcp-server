import { writeFileSync } from "node:fs";
import path from "node:path";
import { closeBrowser, launchBrowser } from "../src/services/browser.js";
import { loginStatus, probeEditor } from "../src/services/editor-bridge.js";

async function main(): Promise<void> {
  await launchBrowser();
  const status = await loginStatus();
  let probe: unknown = { skipped: "editor not open" };
  try {
    probe = await probeEditor();
  } catch (error) {
    probe = { error: error instanceof Error ? error.message : String(error) };
  }
  const findings = { status, probe, ts: new Date().toISOString() };
  const out = path.resolve("docs/spike-probe-last.json");
  writeFileSync(out, JSON.stringify(findings, null, 2));
  console.error(`Wrote ${out}`);
  console.error(JSON.stringify(findings, null, 2));
  await closeBrowser();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
