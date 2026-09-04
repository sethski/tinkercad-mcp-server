import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/injected", { recursive: true });
cpSync("src/injected/scrape-circuit.js", "dist/injected/scrape-circuit.js");
cpSync("src/injected/set-code.js", "dist/injected/set-code.js");
