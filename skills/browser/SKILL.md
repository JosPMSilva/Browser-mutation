---
name: mutation
description: Capture live in-app browser UI edits as structured implementation intent for Codex.
---

# Browser Mutation

Use this skill when a user wants to edit a live local web UI in the Codex in-app browser and have Codex translate those edits into source changes.

This skill is designed to work with the built-in Browser Use plugin. It is framework-agnostic at the capture layer. Do not use a separate external browser automation stack unless Browser Use is unavailable.

## Important Codex Limitation

Community installs may show this skill while not exposing the `browser_mutation_*` MCP tools. Treat that as a known Codex host/runtime limitation for local plugin MCP registration.

Do not spend the task repeatedly probing `tool_search`, editing `.mcp.json`, or trying to repair Codex registration when the user asked to use Browser Mutation. Use the standalone collector flow below unless the MCP tools are already visibly available in the current tool surface.

## Preferred Workflow

1. Load and follow the Browser Use skill.
2. Use Browser Use with the `iab` backend to read or open the target local app URL.
3. Confirm the target is loopback/local development URL only.
4. Start the Browser Mutation collector from this plugin root:

```bash
node scripts/start-collector.mjs --target http://localhost:5174
```

The launcher exits after printing JSON with `proxiedUrl`, `latestUrl`, `pid`, and `sessionFile`. The collector keeps running in the background.

Do not manually detach `browser-mutation-mcp.mjs` or scrape process logs for URLs.

5. Navigate the same Codex in-app browser tab to `proxiedUrl`.
6. Tell the user the Mutation panel is ready.
7. Let the user select and edit elements in the overlay, then press `Send`.
8. Fetch `latestUrl` with the local shell.
9. Translate the returned mutation records into source changes.
10. Verify with the target project's normal frontend checks and Browser Use.

Keep the collector process running while using the overlay.

## MCP Shortcut

Only use this path if the tools are already callable in the current session:

1. Call `browser_mutation_get_injector` with `{ "targetUrl": "<local URL>" }`.
2. Navigate Browser Use to the returned `proxiedUrl`.
3. After the user presses `Send`, call `browser_mutation_get_latest`.

If those tools are absent, switch directly to the standalone collector flow. Do not ask the user to debug Codex tool registration during the UI-edit task.

## User Experience Contract

For basic users, do not expose collector ports, bookmarklets, console snippets, or proxy internals unless Browser Use cannot navigate the tab.

Preferred user commands:

- "Start Browser Mutation on this page."
- "Open my local app with Browser Mutation."
- "Apply the latest Browser Mutation edits."

Agent behavior:

- If the current tab is local, reopen it through the Browser Mutation proxy.
- If the current tab is not local, explain that this MVP only supports local/dev pages and ask for the local app URL.
- If Browser Mutation MCP tools are unavailable, use the standalone collector flow and keep the explanation brief.
- Never make the user paste a proxy URL when Browser Use can navigate the tab itself.

## Browser Use Notes

The Browser Use runtime does not expose arbitrary page `evaluate`. Use the local proxy URL from Browser Mutation whenever possible.

Use the Browser Use skill's current setup instructions for the in-app browser runtime. Do not hard-code paths to another user's Codex plugin cache.

## Translation Rules

- Treat the mutation record as implementation intent, not as a literal CSS patch.
- Prefer semantic source edits over absolute positioning.
- Use `react.source` and `identity.cssPath` only as hints. Confirm source ownership before editing.
- Preserve existing component structure and design tokens where possible.
- Do not assume the target uses React, Vite, Tailwind, or any specific framework.
- Keep source changes minimal and readable.
- Do not add broad fallback logic to hide uncertain mapping. If a mutation cannot be mapped safely, state the specific uncertainty.

## Useful MCP Tools

- `browser_mutation_get_injector`: starts the localhost collector and returns Browser Use-compatible injection data. Pass `targetUrl` to get a normal HTTP `proxiedUrl`.
- `browser_mutation_get_latest`: returns the latest captured session.
- `browser_mutation_clear`: clears captured sessions.

Page-injected plugin JavaScript cannot create native Codex annotation chips in the composer. Keep mutation records hidden in the collector and read them through the MCP tool or `latestUrl`.

## Mutation Shape

Each record includes:

- `action`: selected, text, style, state-style, icon-style, icon-swap, icon-import, move, resize, reparent, reorder, capture, delete, or note.
- `before` and `after`: element snapshots.
- `identity`: tag, id, classes, ARIA/test attributes, text sample, and CSS path.
- `react`: best-effort React Fiber source hints when available in dev mode.
- `parent`, `index`, and `siblings`: surrounding layout context.
- `rect` and `styles`: before/after geometry and selected computed styles.
- `extra`: action-specific implementation intent.
- `notes`: optional user notes from the overlay.

## Limits

This MVP is for user-owned local development pages. It captures high-fidelity intent, but it does not guarantee a one-to-one source location. React source hints are best effort and depend on dev-mode metadata.

The proxy is intentionally limited to loopback/local development URLs so it does not bypass Browser Use origin safety. Hot-module reload websockets may not survive proxying; reload the Browser Use tab after source edits when needed.
