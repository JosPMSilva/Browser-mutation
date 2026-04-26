# Agent Install Instructions

The user should not need a long handoff prompt. This is enough:

```text
Install this Codex skill/plugin:
https://github.com/JosPMSilva/Browser-mutation
```

## What The Agent Must Do

1. Verify `git` and `node` are available.
2. Clone the repo to `~/plugins/browser-mutation`.
3. Run `node scripts/install-codex.mjs`.
4. Run `node scripts/doctor.mjs`.
5. Tell the user the required enablement steps:
   - Restart Codex Desktop.
   - Open **Plugins**.
   - Open **Local Codex Tools**.
   - Open **Browser Mutation**.
   - Click **Add to Codex** or enable **Browser Mutation** if needed.
   - Confirm both **Browser_mutation** MCP server and **Mutation** skill toggles are enabled.
   - Start a fresh thread after enabling.
6. Explain the current Codex limitation clearly:
   - skill visible is expected
   - MCP server may pass `tools/list`
   - model sessions may still not expose `browser_mutation_*`
7. Use `node scripts/start-collector.mjs --target <local-url>` for actual captures unless the MCP tools are already visible.
8. Use the launcher's printed `proxiedUrl` and `latestUrl`. Do not manually detach `browser-mutation-mcp.mjs` or scrape process logs for URLs.

## What The Agent Must Not Do

- Do not copy contributor-local paths into the user's config.
- Do not install Node automatically.
- Do not write a partial Codex config when `node` is missing.
- Do not repeatedly run `tool_search` for Browser Mutation after it returns no tools.
- Do not edit `.mcp.json` with another user's absolute paths.
- Do not ask the user to paste proxy URLs when Browser Use can navigate.
- Do not use Browser Mutation on non-local third-party websites.

## Expected User-Facing Result

After install, tell the user:

- whether `doctor` passed
- that Codex Desktop must be restarted
- that Browser Mutation must be enabled from **Plugins > Local Codex Tools > Browser Mutation**
- that both the **Browser_mutation** MCP server and **Mutation** skill toggles should be enabled
- that a fresh Codex thread should be started after enabling
- that missing `browser_mutation_*` model tools are a known Codex local-plugin limitation, and the standalone collector remains the supported path
