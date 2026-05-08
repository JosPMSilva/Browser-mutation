#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const mcpScript = path.join(repoRoot, "scripts", "browser-mutation-mcp.mjs");
const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");

function frame(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}

function parseFrames(output) {
  const results = [];
  let cursor = 0;
  while (cursor < output.length) {
    const separator = output.indexOf("\r\n\r\n", cursor);
    if (separator === -1) {
      break;
    }
    const header = output.slice(cursor, separator);
    const match = /content-length:\s*(\d+)/i.exec(header);
    if (!match) {
      break;
    }
    const length = Number(match[1]);
    const start = separator + 4;
    const end = start + length;
    if (output.length < end) {
      break;
    }
    results.push(JSON.parse(output.slice(start, end)));
    cursor = end;
  }
  return results;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function probeMcp() {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [mcpScript], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => resolve({ ok: false, error: error.message, stderr }));
    child.on("close", () => {
      try {
        const messages = parseFrames(stdout);
        const tools = messages.find((message) => message.id === 2)?.result?.tools ?? [];
        resolve({ ok: tools.length >= 3, tools, stderr });
      } catch (error) {
        resolve({ ok: false, error: error.message, stderr, stdout });
      }
    });
    child.stdin.write(frame({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "browser-mutation-doctor", version: "0.1.3" }
      }
    }));
    child.stdin.write(frame({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }));
    child.stdin.end();
  });
}

const checks = [];
checks.push(["Node", `${process.version} at ${process.execPath}`]);
checks.push(["Repo root", repoRoot]);
checks.push(["MCP script", await exists(mcpScript) ? "found" : "missing"]);
checks.push(["Overlay script", await exists(path.join(repoRoot, "scripts", "browser-mutation-overlay.js")) ? "found" : "missing"]);
checks.push(["Move guide logic", await exists(path.join(repoRoot, "scripts", "browser-mutation-guide-logic.js")) ? "found" : "missing"]);

const probe = await probeMcp();
checks.push(["MCP tools/list", probe.ok ? `ok (${probe.tools.map((tool) => tool.name).join(", ")})` : `failed (${probe.error || probe.stderr || "unknown error"})`]);

const config = await fs.readFile(codexConfigPath, "utf8").catch(() => "");
checks.push(["Codex config", config.includes("[mcp_servers.browser_mutation]") ? "browser_mutation entry found" : "browser_mutation entry missing"]);
checks.push(["Codex local-plugin MCP exposure", "not guaranteed; use standalone collector if browser_mutation_* tools are absent"]);

for (const [name, value] of checks) {
  console.log(`${name}: ${value}`);
}

if (!probe.ok) {
  process.exitCode = 1;
}
