# Tinkercad Circuits spike findings

Date: 2026-09-04

Tinkercad ships no public Circuits API. This spike used published editor DOM, Autodesk frontend URLs, and prior automation (serial bookmarklets, TinkercadNetConnector, the Tinkercad Mobile userscript). A live logged-in Playwright probe is in `scripts/spike-probe.ts` for first-run confirmation.

## What is actually scriptable

| Question | Result | Mechanism |
|---|---|---|
| Enumerate circuit state | Partial | SVG scrape of `#breadboardTab svg` plus optional captured save/load JSON. No stable documented object graph. |
| Add a component | UI automation | Search the parts panel, drag the match onto the breadboard SVG. |
| Wire two pins | UI automation | Click a lead, then the destination lead. Pin labels come from the SVG / inspector. |
| Read/write Arduino code | DOM | Open Code, switch to Text, then CodeMirror / Ace / textarea / Monaco (whichever is present). |
| Start/stop simulation | DOM / UI | Toolbar buttons labeled Start Simulation / Stop Simulation. |
| Read serial monitor | DOM | Proven classes: `.js-code_panel__serial__input`, `.js-code_panel__serial__send`, `.code_panel__serial__buttons`. |

## Confirmed selectors and URLs

- Circuit editor: `https://www.tinkercad.com/things/{id}/editel`
- Dashboard: `https://www.tinkercad.com/circuits`
- Editor assets: `https://editor.tinkercad.com/assets_v2_*`
- Canvas: `#breadboardTab svg`
- Code panel host: `#CODE_EDITOR_ID`
- Inspector: `.inspector`
- Sidebar collapse: `.editor__sidebar__collapseButton`
- Loading: `.loading`
- Serial TX field: `.js-code_panel__serial__input`
- Serial send: `.js-code_panel__serial__send`

## Tool → mechanism map

| Tool | Mechanism |
|---|---|
| `tinkercad_open_circuit` | Navigation + wait for `#breadboardTab` or login wall |
| `tinkercad_login_status` | URL, cookies, user-chrome selectors |
| `tinkercad_list_components` | Local catalog (no page needed) |
| `tinkercad_get_circuit` | SVG scrape + last captured circuit JSON + code panel |
| `tinkercad_screenshot` | Playwright screenshot |
| `tinkercad_add_component` | DOM/UI automation |
| `tinkercad_move_component` | DOM/UI drag on SVG |
| `tinkercad_delete_component` | Select + Delete / toolbar |
| `tinkercad_connect_pins` | DOM/UI click-to-wire |
| `tinkercad_delete_wire` | Select wire + Delete |
| `tinkercad_set_component_attribute` | Select + inspector fields |
| `tinkercad_get_code` / `tinkercad_set_code` | DOM (code editor) |
| `tinkercad_start_simulation` / `tinkercad_stop_simulation` | DOM/UI |
| `tinkercad_read_serial` | DOM (serial panel) |
| `tinkercad_build_circuit` | Composed primitives |

## Not feasible (today)

- Calling a supported Autodesk Circuits SDK to mutate the netlist
- Stable component IDs guaranteed across Autodesk deploys
- Headless-first login (Autodesk SSO needs a real window on first run)

## Implication for Phase 2

## Live probe (2026-09-04)

`npm run spike` against `https://www.tinkercad.com/circuits` with a fresh persistent profile:

- Login detection: not signed in (Sign-in chrome present; `/circuits` URL is not treated as a session)
- Editor scrape: runs without `__name` injection errors when scripts are string-evaluated
- Interesting global: `__webpack_editor_public_path__` (editor assets on `editor.tinkercad.com`)
- Breadboard SVG / serial / code panel: absent on the dashboard, as expected until `/editel` is open

