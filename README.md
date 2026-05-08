# Browser Mutation

Browser Mutation captures visual edits made in the Codex in-app browser and turns them into structured implementation intent for Codex.

It is intended for user-owned local development pages such as `http://localhost:5174`, `http://127.0.0.1:3000`, and similar loopback targets. Local HTML files can be served through the built-in loopback static server.

## What It Includes

Browser Mutation is a community MIT project. It ships as:

- a standalone local collector/proxy
- a Codex skill
- a Codex plugin manifest
- an MCP server implementation

<p align="center">
  <img src="https://github.com/user-attachments/assets/bbe3bb60-a4e0-40bd-8089-3dafc930b3c1" alt="Browser Mutation demo" width="100%">
</p>

## Why Browser Mutation

Browser Use can already highlight and annotate browser targets during automation. Browser Mutation is for a different step: turning a visual edit into implementation intent that Codex can apply to source code.

Use Browser Mutation when you need:

- before/after records for text, style, layout, icon, move, resize, reparent, reorder, note, and delete changes
- element identity, selector hints, neighboring layout context, and computed style snapshots
- optional React dev-mode source hints when available
- explicit selected-element or session notes for implementation instructions
- Canva-like move guidance with nearby DOM snapping, spacing labels, axis lock, and center-only snap controls
- a captured edit payload after the user presses **Send**
- repeatable handoff from a human visual edit to a source-code patch

In short: Browser Use is useful for opening, inspecting, and interacting with browser pages. Browser Mutation captures what changed and why, so Codex can translate a visual edit into code.

## Move Mode

Move mode is designed for precise visual alignment without turning the page into a noisy layout editor.

- Snap lines align against nearby DOM elements, including center, edge, and spacing references.
- Spacing guides use a different color from snap lines and are included in the move payload.
- Hold `Shift` while dragging to lock the dominant axis.
- Hold `C` while dragging to prefer center alignment when edge snaps are too close.
- Hold `Alt` while dragging to bypass snapping temporarily.
- Move edits are staged first. The move button changes to a check icon; click it to record the final position. Pressing **Send** also records one pending move before posting the payload.
- Elements moved across stacked surfaces are promoted during the drag so they can be positioned over headers, composers, and other higher layers.

## Quick Start For Codex Users

In a new Codex thread, this should be enough:

```text
Install this Codex skill/plugin:
https://github.com/JosPMSilva/Browser-mutation
```

Requirements: `git`, `node`, and Codex Desktop on Windows, macOS, or Linux.

Clone the repo into the standard local plugin location:

```bash
mkdir -p ~/plugins
git clone https://github.com/JosPMSilva/Browser-mutation.git ~/plugins/browser-mutation
cd ~/plugins/browser-mutation
node scripts/install-codex.mjs
node scripts/doctor.mjs
```

Restart Codex Desktop. In Codex, open **Plugins > Local Codex Tools > Browser Mutation**, click **Add to Codex** or enable **Browser Mutation**, and make sure both **Browser_mutation** and **Mutation** toggles are enabled.

Start a fresh Codex thread after enabling so the skill list and MCP config are reloaded.

## Updating From Git

For an existing install, update the plugin files without rewriting Codex config:

```bash
cd ~/plugins/browser-mutation
git pull
node scripts/update-codex.mjs
```

Do not rerun `node scripts/install-codex.mjs` for normal updates. The installer is for first install or deliberate config repair only.

Then open a local app in the Codex in-app browser and ask:

```text
Use Browser Mutation on this page.
```

## Local Collector

```bash
node scripts/start-collector.mjs --target http://localhost:5174
```

For a static HTML file or folder:

```bash
node scripts/start-collector.mjs --file ./index.html
node scripts/start-collector.mjs --root ./dist
```

The local collector starts a browser proxy for the target page and records the edits sent from the Browser Mutation overlay. See the [usage guide](docs/usage.md) for the full workflow.

The overlay defaults to **Interact** mode so normal app clicks pass through. Use **Select element**, `Alt+Click`, or `Ctrl+Alt+S` only when selecting an element for mutation. Use `Ctrl+Alt+I` to return to Interact and `Ctrl+Alt+D` to dock the panel.

## Documentation

- [Codex install guide](docs/codex-install.md)
- [Usage guide](docs/usage.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Privacy](PRIVACY.md)
- [Terms](TERMS.md)
- [Security](SECURITY.md)

## Development

Run the MCP probe:

```bash
node scripts/doctor.mjs
```

## License

MIT
