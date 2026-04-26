# Browser Mutation Agent Instructions

Be direct and execution-focused.

If the user asks to install this repo as a Codex skill, plugin, or tool, do not ask for a longer handoff prompt. Install it.

## Portability Rules

- Treat this as a production plugin, not as a local developer experiment.
- Do not reference or copy any contributor-local path into user instructions or config.
- Use `~`, `$HOME`, `%USERPROFILE%`, or paths discovered on the user's machine.
- The current source distribution requires `git` and `node` to be installed on the user's machine.
- If `node` is missing, stop with a clear prerequisite message. Do not install Node automatically and do not create a partial Codex config.

## Install Contract

1. Clone this repository to `~/plugins/browser-mutation`.
2. From the repo root, run:

```bash
node scripts/install-codex.mjs
node scripts/doctor.mjs
```

3. Report the `doctor` output.
4. Tell the user to restart Codex Desktop.
5. Tell the user to enable the plugin in Codex:
   - Open **Plugins**.
   - Open **Local Codex Tools**.
   - Open **Browser Mutation**.
   - Click **Add to Codex** or enable **Browser Mutation** if it is not already enabled.
   - Confirm both **Browser_mutation** MCP server and **Mutation** skill toggles are enabled.
6. Tell the user to start a fresh Codex thread after enabling so the skill list and MCP config are reloaded.

The installer writes user-specific absolute paths into the user's own Codex config.

## Runtime Use

Known Codex limitation: a Codex session may show the Browser Mutation skill while not exposing `browser_mutation_*` MCP tools. Do not spend time repeatedly debugging local plugin MCP registration during a user's UI-edit task. If the tools are absent, start the collector with:

```bash
node scripts/start-collector.mjs --target <local-url>
```

The launcher prints JSON with `proxiedUrl`, `latestUrl`, `pid`, and `sessionFile`, then exits while the collector keeps running in the background. Use Browser Use to navigate the Codex in-app browser to `proxiedUrl`. After the user presses Send in the overlay, fetch `latestUrl` from the local shell.

Do not manually detach `browser-mutation-mcp.mjs` or scrape background process logs for URLs.

Only operate on user-owned local development URLs. Do not use the proxy for public websites or third-party pages.
