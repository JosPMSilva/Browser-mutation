# Usage Guide

## Browser Use Annotation Vs Browser Mutation

Browser Use annotations are useful for pointing at elements and making browser automation easier to follow.

Browser Mutation is useful when the user wants to edit the rendered UI and have Codex turn that edit into source changes. It records structured mutation intent, including before/after element snapshots, style values, layout context, selector hints, notes, and optional React dev-mode source hints.

Use Browser Mutation after the visual decision has been made and the next step is source implementation.

## Start A Capture

Start your local app first, then run:

```bash
node scripts/start-collector.mjs --target http://localhost:5174
```

For static local HTML, let Browser Mutation serve it from loopback HTTP:

```bash
node scripts/start-collector.mjs --file ./index.html
node scripts/start-collector.mjs --root ./dist
node scripts/start-collector.mjs --target file:///path/to/index.html
```

The command starts the collector in the background and prints JSON containing:

- `proxiedUrl`: open this in the Codex in-app browser
- `latestUrl`: fetch this after pressing Send in the overlay
- `collectorUrl`: local collector base URL
- `pid`: background collector process id
- `sessionFile`: local JSON file containing the same launch data

Do not manually detach `browser-mutation-mcp.mjs` or scrape process logs for URLs.

## Edit The Page

1. Navigate the Codex in-app browser to `proxiedUrl`.
2. Use the Browser Mutation launcher/panel.
3. Select an element.
4. Change text, style, layout, state styles, icons, or structure.
5. Press **Send**.

## Read Captured Mutations

Fetch the latest payload:

```bash
curl "<latestUrl>"
```

On PowerShell:

```powershell
Invoke-RestMethod '<latestUrl>'
```

Codex should treat the records as implementation intent, not literal patches.

## Supported Targets

Supported:

- `http://localhost:*`
- `http://127.0.0.1:*`
- other loopback local development URLs
- local files and folders passed with `--file`, `--root`, or `file://`, served back through `127.0.0.1`

Not supported:

- public websites
- production apps
- third-party pages
- private apps that the user does not own

## Browser Use Pairing

When using Codex, pair this skill with Browser Use:

1. Open or select the local app in the in-app browser.
2. Start the Browser Mutation collector.
3. Use Browser Use to navigate the same tab to `proxiedUrl`.
4. After edits are sent, fetch `latestUrl`.
5. Patch source code.
6. Verify with Browser Use and the project's normal tests.
