# Codex Install Guide

## Prerequisites

Browser Mutation's current source distribution requires:

- `git`
- `node`

These are user-machine prerequisites, not contributor-local dependencies. If `node` is missing, stop and install Node through the user's normal OS/package-manager workflow before configuring Codex. Do not copy Node paths from another machine.

## Recommended Layout

Clone Browser Mutation into the standard local plugin path:

```bash
mkdir -p ~/plugins
git clone https://github.com/JosPMSilva/Browser-mutation.git ~/plugins/browser-mutation
cd ~/plugins/browser-mutation
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\plugins" | Out-Null
git clone https://github.com/JosPMSilva/Browser-mutation.git "$HOME\plugins\browser-mutation"
Set-Location "$HOME\plugins\browser-mutation"
```

## Configure Codex

Run:

```bash
node scripts/install-codex.mjs
node scripts/doctor.mjs
```

The installer updates:

- `~/.codex/config.toml`
- `~/.agents/plugins/marketplace.json`

It also creates a timestamped backup before changing existing files.

Restart Codex Desktop after installation.

Then enable the plugin in Codex:

1. Open **Plugins**.
2. Open **Local Codex Tools**.
3. Open **Browser Mutation**.
4. Click **Add to Codex** or enable **Browser Mutation** if it is not already enabled.
5. Confirm both **Browser_mutation** MCP server and **Mutation** skill toggles are enabled.
6. Start a fresh Codex thread so the skill list and MCP config are reloaded.

## Current Codex MCP Limitation

Some Codex builds do not expose local plugin MCP tools even when:

- the plugin is enabled
- the skill is visible
- `codex mcp list` shows `browser_mutation`
- the MCP server passes `tools/list`

When this happens, use the standalone collector flow:

```bash
node scripts/start-collector.mjs --target http://localhost:5174
```

For static local HTML, use the same standalone flow with a built-in loopback static server:

```bash
node scripts/start-collector.mjs --file ./index.html
node scripts/start-collector.mjs --root ./dist
```

This is the supported community-install path until Codex reliably mounts local plugin MCP tools into fresh model sessions.

## Manual Config Example

If an agent edits config manually, use absolute paths for the MCP entry:

```toml
[mcp_servers.browser_mutation]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/browser-mutation/scripts/browser-mutation-mcp.mjs"]

[plugins."browser-mutation@local-codex-tools"]
enabled = true
```

Use the user's actual Node path. Do not copy paths from another machine.
