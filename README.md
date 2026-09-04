# Tinkercad Circuits MCP

Let Cursor, Claude, or Codex build circuits in [Tinkercad Circuits](https://www.tinkercad.com/circuits): place parts, wire pins, write Arduino code, run the simulator, and read the serial monitor.

Tinkercad has no public API. This server opens a real Chrome window, keeps you logged in, and drives the editor for the AI.

## What you need

- [Node.js 18+](https://nodejs.org/)
- A free [Tinkercad / Autodesk](https://www.tinkercad.com/) account
- Git, if you are cloning this repo

## Setup (do this once)

### 1. Get the code

```bash
git clone https://github.com/sethski/tinkercad-mcp-server.git
cd tinkercad-mcp-server
```

### 2. Install and build

```bash
npm install
npx playwright install chromium
npm run build
```

`npm run build` creates `dist/index.js`. That file is what Cursor, Claude, and Codex will launch.

### 3. Sign in to Tinkercad

```bash
npm start
```

A Chrome window opens. Sign in with your Autodesk account, then close the terminal with Ctrl+C.

You only do this once. The login is saved in `.browser-profile/` (not committed to git). Later, the MCP server reuses that session.

If `npm start` says you are not logged in, leave Chrome open, finish sign-in, and run `npm start` again. Or from the AI, call `tinkercad_login_status`.

### 4. Copy your server path

You need the **full path** to `dist/index.js`.

- Windows example: `C:/Users/you/tinkercad-mcp-server/dist/index.js`
- macOS / Linux example: `/Users/you/tinkercad-mcp-server/dist/index.js`

In the configs below, replace `REPLACE_WITH_FULL_PATH_TO_dist/index.js` with that path. Use forward slashes even on Windows.

### 5. Connect an AI client

Pick the app you use. You can add more than one.

#### Cursor

1. Open Cursor Settings → MCP
2. Or create `.cursor/mcp.json` in this project (a template is already there)
3. Paste:

```json
{
  "mcpServers": {
    "tinkercad-circuits": {
      "command": "node",
      "args": ["REPLACE_WITH_FULL_PATH_TO_dist/index.js"]
    }
  }
}
```

4. Save, then reload MCP servers (or restart Cursor)
5. Confirm `tinkercad-circuits` is on and lists tools

#### Claude Desktop

1. Open the Claude Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Merge the `mcpServers` block from [`clients/claude-desktop.json`](clients/claude-desktop.json)
3. Put your real `dist/index.js` path in `args`
4. Restart Claude Desktop

#### Codex

1. Open `~/.codex/config.toml` (or your project Codex config)
2. Copy [`clients/codex-config.toml`](clients/codex-config.toml)
3. Put your real `dist/index.js` path in `args`
4. Restart Codex

### 6. Check that it works

From this folder:

```bash
npm run list-tools
```

You should see 17 tools, including `tinkercad_login_status` and `tinkercad_build_circuit`.

Then in Cursor / Claude / Codex, ask:

> Check Tinkercad login status, then open a new circuit.

If login is missing, sign in in the Chrome window that appears and ask again.

## First circuit to try

Ask the AI:

> Build a blink circuit in Tinkercad: Arduino Uno, red LED, 220 ohm resistor. Wire D13 to the LED anode, LED cathode to the resistor, resistor to GND. Write blink code that also prints HIGH/LOW to serial, start the simulation, and read the serial monitor.

That uses `tinkercad_open_circuit`, `tinkercad_build_circuit` (or the smaller tools), `tinkercad_start_simulation`, and `tinkercad_read_serial`.

Keep Chrome visible the first few times so you can see parts land on the canvas.

## Tools

| What you want | Tool |
|---|---|
| Am I signed in? | `tinkercad_login_status` |
| Open or create a circuit | `tinkercad_open_circuit` (`target` = URL, thing id, or `new`) |
| See parts, wires, code | `tinkercad_get_circuit` |
| Screenshot the editor | `tinkercad_screenshot` |
| Known part names | `tinkercad_list_components` |
| Add / move / delete a part | `tinkercad_add_component`, `tinkercad_move_component`, `tinkercad_delete_component` |
| Wire or unwire | `tinkercad_connect_pins`, `tinkercad_delete_wire` |
| Resistance, color, etc. | `tinkercad_set_component_attribute` |
| Read or write Arduino code | `tinkercad_get_code`, `tinkercad_set_code` |
| Run / stop sim, read serial | `tinkercad_start_simulation`, `tinkercad_stop_simulation`, `tinkercad_read_serial` |
| Place, wire, and code in one go | `tinkercad_build_circuit` |

Pin names look like `uno.D13` or `led1.anode`. Call `tinkercad_get_circuit` after placing parts so you use real ids.

## Optional settings

| Variable | Meaning |
|---|---|
| `TINKERCAD_PROFILE_DIR` | Chrome profile folder (default: `.browser-profile/` in this repo) |
| `TINKERCAD_SCREENSHOT_DIR` | Where screenshots are saved |
| `TINKERCAD_HEADED=0` | Hide Chrome after you have already logged in. First login should stay headed. |

## Extra commands

```bash
npm test              # unit tests, no Tinkercad login
npm run list-tools    # stdio handshake, same as Cursor/Claude/Codex
npm run spike         # dump what the live page exposes
npm run e2e           # live blink circuit (needs login)
npm run inspector     # MCP Inspector UI
```

## How it works

```
Cursor / Claude / Codex
        │  stdio
        ▼
tinkercad-mcp-server (Node)
        │  Playwright
        ▼
Chrome (saved login) → tinkercad.com Circuits editor
```

Details of what is scriptable: [docs/spike-findings.md](docs/spike-findings.md).

Autodesk can change the editor HTML. Selector updates stay in `src/services/editor-bridge.ts` and `src/injected/`.

## Limits

- Circuits only (3D design and Codeblocks are not in this version)
- You must stay logged in; there is no official Autodesk API key
- Place and wire are UI automation, so they can break when Tinkercad ships a new editor
- One Chrome profile at a time; do not commit `.browser-profile/`

## Evaluations

Read-only questions live in [evaluations/tinkercad-circuits.xml](evaluations/tinkercad-circuits.xml). Catalog questions work with no circuit open. Circuit questions assume [evaluations/SAMPLE_CIRCUIT.md](evaluations/SAMPLE_CIRCUIT.md).

## License

MIT. See [LICENSE](LICENSE).
