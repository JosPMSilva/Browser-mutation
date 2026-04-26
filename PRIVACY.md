# Privacy

Browser Mutation is a local development tool.

## Data Processed

Browser Mutation can capture structured UI mutation records from user-owned local development pages. Records may include:

- selected element metadata
- CSS selectors and class names
- text snippets from selected elements
- computed style values
- element geometry
- best-effort framework/source hints when available in the browser

## Storage And Network

Browser Mutation runs a local collector on loopback addresses such as `127.0.0.1`.

The tool does not intentionally send captured mutation records to Browser Mutation maintainers or any Browser Mutation-hosted service. Captured records are exposed locally through the collector so Codex can read and apply them.

## User Responsibility

Use Browser Mutation only on local development pages that you own or are authorized to modify. Do not use it on public websites, production systems, or third-party pages.

## Logs

The standalone collector can write local session metadata such as `proxiedUrl`, `latestUrl`, and process id to the user's machine. Users can delete this local data at any time.
