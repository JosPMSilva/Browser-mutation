#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const homeDir = os.homedir();
const codexConfigPath = path.join(homeDir, ".codex", "config.toml");
const marketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
const expectedPluginPath = path.join(homeDir, "plugins", "browser-mutation");
const args = new Set(process.argv.slice(2));
const serverHeader = "[mcp_servers.browser_mutation]";
const pluginHeader = '[plugins."browser-mutation@local-codex-tools"]';
const managedHeaders = [serverHeader, pluginHeader];

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

function sectionHeader(line) {
  const match = /^\s*(\[.+\])\s*(?:#.*)?$/.exec(line);
  return match?.[1] ?? null;
}

function lineKey(line) {
  if (/^\s*(#|$)/.test(line)) {
    return null;
  }
  const match = /^\s*([A-Za-z0-9_-]+)\s*=/.exec(line);
  return match?.[1] ?? null;
}

function findTomlSections(source, header) {
  const lines = source.split(/\r?\n/);
  const sections = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (sectionHeader(lines[index]) !== header) {
      continue;
    }
    let end = lines.length;
    for (let next = index + 1; next < lines.length; next += 1) {
      if (sectionHeader(lines[next])) {
        end = next;
        break;
      }
    }
    sections.push({ start: index, end, lines: lines.slice(index, end) });
  }
  return sections;
}

function assertSingleManagedSection(source, header) {
  const sections = findTomlSections(source, header);
  if (sections.length > 1) {
    throw new Error(`Duplicate section ${header} in Codex config. Refusing to edit config.toml automatically.`);
  }
  return sections[0] ?? null;
}

function assertNoDuplicateKeys(section, header) {
  if (!section) {
    return;
  }
  const seen = new Set();
  for (const line of section.lines.slice(1)) {
    const key = lineKey(line);
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      throw new Error(`Duplicate key "${key}" in ${header}. Refusing to edit config.toml automatically.`);
    }
    seen.add(key);
  }
}

export function validateCodexConfig(source) {
  for (const header of managedHeaders) {
    const section = assertSingleManagedSection(source, header);
    assertNoDuplicateKeys(section, header);
  }
}

export function replaceTomlBlock(source, header, block) {
  const section = assertSingleManagedSection(source, header);
  const normalized = block.trimEnd() + "\n\n";
  if (section) {
    const lines = source.split(/\r?\n/);
    lines.splice(section.start, section.end - section.start, ...normalized.trimEnd().split("\n"));
    return `${lines.join("\n").trimEnd()}\n`;
  }
  const prefix = source.trimEnd();
  return `${prefix}${prefix ? "\n\n" : ""}${normalized}`;
}

export function buildCodexConfig(source, options) {
  validateCodexConfig(source);
  let config = source;
  config = replaceTomlBlock(config, serverHeader, [
    serverHeader,
    `command = ${tomlString(options.nodeCommand)}`,
    `args = [${tomlString(options.mcpScript)}]`
  ].join("\n"));

  config = replaceTomlBlock(config, pluginHeader, [
    pluginHeader,
    "enabled = true"
  ].join("\n"));
  validateCodexConfig(config);
  return config;
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
  const mcpScript = toPortablePath(path.join(repoRoot, "scripts", "browser-mutation-mcp.mjs"));
  const nodeCommand = process.execPath;
  const config = buildCodexConfig(await readText(codexConfigPath), { nodeCommand, mcpScript });

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

export async function main() {
  await updateCodexConfig();
  await updateMarketplace();
  console.log("");
  console.log("Next steps:");
  console.log("1. Restart Codex Desktop.");
  console.log("2. Open Plugins.");
  console.log("3. Open Local Codex Tools, then Browser Mutation.");
  console.log("4. Click Add to Codex or enable Browser Mutation if it is not already enabled.");
  console.log("5. Make sure both the Browser_mutation MCP server and Mutation skill toggles are enabled.");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
