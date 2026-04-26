# New Git Repository Setup

From this folder:

```bash
git init
git add .
git commit -m "Initial Browser Mutation release"
git branch -M main
git remote add origin <git-remote-url>
git push -u origin main
```

Before pushing, run:

```bash
node scripts/doctor.mjs
```

## Suggested Repository Settings

- License: MIT
- Default branch: `main`
- Releases: attach packaged binaries when available
- Topics: `codex`, `mcp`, `browser`, `frontend`, `ui`, `developer-tools`

## Public README Promise

Keep the public promise narrow:

Browser Mutation works as a standalone local collector for user-owned local development pages. Codex plugin integration is included. Automatic `browser_mutation_*` MCP tool exposure depends on Codex builds that support local plugin MCP registration.
