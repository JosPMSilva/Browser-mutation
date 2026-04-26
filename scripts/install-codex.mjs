#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const homeDir = os.homedir();
const codexConfigPath = path.join(homeDir, ".codex", "config.toml");
const marketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
const expectedPluginPath = path.join(homeDir, "plugins", "browser-mutation");
const args = new Set(process.argv.slice(2));

function toPortablePath(value) {
  return value.split(path.sep).join("/");
}

function tomlString(value) {
  return JSON.stringify(value);
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function replaceTomlBlock(source, header, block) {
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedHeader}\\r?\\n[\\s\\S]*?(?=^\\[|\\s*$)`, "m");
  const normalized = block.trimEnd() + "\n\n";
  if (pattern.test(source)) {
    return source.replace(pattern, normalized);
  }
  const prefix = source.trimEnd();
  return `${prefix}${prefix ? "\n\n" : ""}${normalized}`;
}

async function writeIfChanged(filePath, text) {
  const existing = await readText(filePath);
  if (existing === text) {
    return false;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (existing) {
    const backup = `${filePath}.bak-${Date.now()}`;
    await fs.writeFile(backup, existing);
  }
  await fs.writeFile(filePath, text);
  return true;
}

async function updateCodexConfig() {
  const serverHeader = "[mcp_servers.browser_mutation]";
  const pluginHeader = '[plugins."browser-mutation@local-codex-tools"]';
  const mcpScript = toPortablePath(path.join(repoRoot, "scripts", "browser-mutation-mcp.mjs"));
  const nodeCommand = process.execPath;
  let config = await readText(codexConfigPath);

  config = replaceTomlBlock(config, serverHeader, [
    serverHeader,
    `command = ${tomlString(nodeCommand)}`,
    `args = [${tomlString(mcpScript)}]`
  ].join("\n"));

  config = replaceTomlBlock(config, pluginHeader, [
    pluginHeader,
    "enabled = true"
  ].join("\n"));

  const changed = await writeIfChanged(codexConfigPath, config);
  console.log(`${changed ? "Updated" : "Already configured"} ${codexConfigPath}`);
}

async function updateMarketplace() {
  if (args.has("--no-marketplace")) {
    console.log("Skipped marketplace update.");
    return;
  }

  let marketplace;
  const existing = await readText(marketplacePath);
  if (existing.trim()) {
    marketplace = JSON.parse(existing);
  } else {
    marketplace = {
      name: "local-codex-tools",
      interface: { displayName: "Local Codex Tools" },
      plugins: []
    };
  }

  marketplace.name ||= "local-codex-tools";
  marketplace.interface ||= { displayName: "Local Codex Tools" };
  marketplace.interface.displayName ||= "Local Codex Tools";
  if (!Array.isArray(marketplace.plugins)) {
    marketplace.plugins = [];
  }

  const entry = {
    name: "browser-mutation",
    source: {
      source: "local",
      path: "./plugins/browser-mutation"
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL"
    },
    category: "Developer Tools"
  };

  const index = marketplace.plugins.findIndex((plugin) => plugin?.name === "browser-mutation");
  if (index >= 0) {
    marketplace.plugins[index] = entry;
  } else {
    marketplace.plugins.push(entry);
  }

  const changed = await writeIfChanged(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
  console.log(`${changed ? "Updated" : "Already configured"} ${marketplacePath}`);

  if (path.resolve(repoRoot) !== path.resolve(expectedPluginPath)) {
    console.warn(`Marketplace entry expects this repo at ${expectedPluginPath}`);
    console.warn(`Current repo path is ${repoRoot}`);
    console.warn("For plugin-list discovery, clone or copy the repo to ~/plugins/browser-mutation, or run with --no-marketplace and manage discovery yourself.");
  }
}

await updateCodexConfig();
await updateMarketplace();
console.log("");
console.log("Next steps:");
console.log("1. Restart Codex Desktop.");
console.log("2. Open Plugins.");
console.log("3. Open Local Codex Tools, then Browser Mutation.");
console.log("4. Click Add to Codex or enable Browser Mutation if it is not already enabled.");
console.log("5. Make sure both the Browser_mutation MCP server and Mutation skill toggles are enabled.");
