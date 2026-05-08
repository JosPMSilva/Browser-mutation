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
3. Leave the panel in **Interact** mode for normal app use. Plain page clicks pass through to the app.
4. Use **Select element**, `Alt+Click`, or `Ctrl+Alt+S` when you want to select an element for mutation.
5. Change text, style, layout, state styles, icons, or structure.
6. Add implementation notes when useful:
   - With an element selected, **Add note** records an `action: "note"` entry for that element.
   - With no element selected, **Add note** records a session-level note.
   - `Ctrl+Enter` in the notes field also adds the note.
   - If a note is still pending when **Send** is pressed, it is automatically included as a note record.
7. Press **Send**.

Useful overlay shortcuts:

- `Ctrl+Alt+I`: Interact mode
- `Ctrl+Alt+S`: Select element mode
- `Ctrl+Alt+D`: dock the panel to the launcher
- Hold `Shift` while dragging in Move mode to lock movement to the dominant axis.
- Hold `C` while dragging in Move mode to restrict snapping to center alignment.
- Hold `Alt` while dragging in Move mode to temporarily bypass snap guides.

## Precise Move Workflow

Move mode records implementation intent for precise layout changes:

1. Select an element and enable Move mode.
2. Drag near the intended reference element. Browser Mutation shows snap lines for alignment and separate spacing lines for measured gaps.
3. Use `Shift` to preserve one axis while moving along the other axis.
4. Use `C` when center alignment is desired but edge snaps are competing because the two elements are similar in size.
5. Use `Alt` for free movement when a snap would be unhelpful.
6. Click the check icon to record the final move. If a move is still staged, **Send** records it automatically before posting the payload.

Move snapping uses nearby DOM references instead of every descendant on the page. It ignores Browser Mutation's own overlay, avoids individual text characters and SVG internals, and includes nearby landing references in the payload so Codex can understand where the element was placed.

The clear X button opens a compact action menu:

- Clear selection
- Clear notes
- Clear records
- Undo last record
- Mark sent and clear
- Clear all

After a successful send, the notes field is cleared. Sending the exact same payload again is blocked until the user adds or clears records, which prevents accidental duplicate latest payloads.

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

Note records use `action: "note"` and `extra.noteOnly: true`. `extra.scope` is `"element"` for selected-element notes and `"session"` for session notes. Do not rely on top-level payload notes when records are present.

Move records use `action: "move"`. Their `extra` object includes start/end points, the final delta, axis lock state, center-only state, snap matches, measured spacing, nearby landing references, candidate counts, and snap thresholds.

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
