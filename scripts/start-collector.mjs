#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const collectorScript = path.join(__dirname, "browser-mutation-mcp.mjs");
const stateDir = path.join(os.homedir(), ".browser-mutation");
const defaultSessionFile = path.join(stateDir, "latest-session.json");

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJsonWhenReady(filePath, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const text = await fs.readFile(filePath, "utf8");
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      await sleep(100);
    }
  }
  throw new Error(`Collector did not write ${filePath}: ${lastError?.message ?? "timed out"}`);
}

const targetUrl = readArg("--target") ?? readArg("-t");
if (!targetUrl) {
  console.error("Usage: node scripts/start-collector.mjs --target http://localhost:5174");
  process.exit(2);
}

const sessionFile = readArg("--session-file") ?? defaultSessionFile;
await fs.mkdir(path.dirname(sessionFile), { recursive: true });
await fs.rm(sessionFile, { force: true });

const child = spawn(process.execPath, [
  collectorScript,
  "--serve",
  "--target",
  targetUrl,
  "--session-file",
  sessionFile
], {
  detached: true,
  stdio: "ignore",
  windowsHide: true
});

child.unref();

const session = await readJsonWhenReady(sessionFile);
console.log(JSON.stringify({
  sessionFile,
  pid: session.pid,
  proxiedUrl: session.proxiedUrl,
  latestUrl: session.latestUrl,
  targetUrl: session.targetUrl
}, null, 2));
