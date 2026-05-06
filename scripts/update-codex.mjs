#!/usr/bin/env node

import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const expectedPluginPath = path.join(os.homedir(), "plugins", "browser-mutation");
const doctorScript = path.join(repoRoot, "scripts", "doctor.mjs");

function runDoctor() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [doctorScript], {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: true
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", (error) => {
      console.error(error.message);
      resolve(1);
    });
  });
}

if (path.resolve(repoRoot) !== path.resolve(expectedPluginPath)) {
  console.log(`Expected local plugin path: ${expectedPluginPath}`);
  console.log(`Current repo path: ${repoRoot}`);
  console.log("Update this repo only if Codex is configured to use this path.");
  console.log("");
}

console.log("Browser Mutation update check");
console.log("This update command does not edit Codex config.");
console.log("");

const code = await runDoctor();
if (code !== 0) {
  process.exitCode = code;
} else {
  console.log("");
  console.log("Update verification complete. Restart Codex Desktop if it was open during the update.");
}
