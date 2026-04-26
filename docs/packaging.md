# Packaging Plan

## Recommendation

Ship one repo that contains both:

- the standalone Browser Mutation collector/proxy
- the Codex plugin and skill files

Do not split the plugin and skill into separate repositories yet. They are small, tightly coupled, and easier for an installing agent to reason about as one package.

## Distribution Levels

### Current Distribution: Git Source

Current public install path:

```bash
git clone https://github.com/JosPMSilva/Browser-mutation.git ~/plugins/browser-mutation
cd ~/plugins/browser-mutation
node scripts/install-codex.mjs
node scripts/doctor.mjs
```

Requirement: the user has `git` and `node` installed on their own machine. The installer discovers and writes that user's actual Node path.

### Optional Future Distribution: npm Package

Publish as `browser-mutation`:

```bash
npm install -g browser-mutation
browser-mutation --serve --target http://localhost:5174
```

Requirement: user has Node installed.

### Optional Future Distribution: Native Binaries

For minimal churn across Windows, macOS, and Linux, publish release binaries:

- `browser-mutation-win-x64.exe`
- `browser-mutation-linux-x64`
- `browser-mutation-macos-x64`
- `browser-mutation-macos-arm64`

The binary should run the same MCP server and support:

```bash
browser-mutation --serve --target http://localhost:5174
browser-mutation
```

With no arguments, it should behave as an MCP stdio server.

## Why Binaries Matter

If Node is missing, a source-only repo forces the user or installing agent to solve runtime setup before using Browser Mutation. Native binaries remove that dependency for normal users.

The repo should still keep the Node source as the reference implementation.

## Codex Plugin Path

The `.codex-plugin/plugin.json`, `.mcp.json`, and `skills/browser/SKILL.md` files stay in the same repo.

Current limitation: Codex may not expose local plugin MCP tools to the model even when the plugin is enabled. The docs and skill therefore make the standalone collector flow the reliable path.

When Codex fixes local plugin MCP registration, the same repo can provide the smoother tool path without changing the overlay architecture.
