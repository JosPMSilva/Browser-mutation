import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");
const launcherPath = path.join(repoRoot, "scripts", "start-collector.mjs");

async function makeTempDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "browser-mutation-"));
}

function runLauncher(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [launcherPath, ...args], {
      cwd: repoRoot,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Launcher exited with ${code}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Launcher did not print JSON: ${error.message}\n${stdout}`));
      }
    });
  });
}

async function stopCollector(session) {
  if (!session?.pid) {
    return;
  }
  try {
    process.kill(session.pid);
  } catch (error) {
    if (error.code !== "ESRCH") {
      throw error;
    }
  }
}

test("launches a file target through a loopback proxied URL", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const htmlPath = path.join(tempDir, "index.html");
  const sessionFile = path.join(tempDir, "session.json");
  await fs.writeFile(htmlPath, "<!doctype html><html><body><h1>File page</h1></body></html>");

  const session = await runLauncher(["--file", htmlPath, "--session-file", sessionFile]);
  t.after(async () => {
    await stopCollector(session);
  });

  assert.match(session.targetUrl, /^http:\/\/127\.0\.0\.1:\d+\/index\.html$/);
  assert.match(session.proxiedUrl, /^http:\/\/127\.0\.0\.1:\d+\/proxy\?target=/);

  const response = await fetch(session.proxiedUrl);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /File page/);
  assert.match(body, /__browser-mutation\/inject\.js/);
});

test("launches a root target and serves relative assets from that root", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const sessionFile = path.join(tempDir, "session.json");
  await fs.writeFile(path.join(tempDir, "index.html"), "<!doctype html><link rel=\"stylesheet\" href=\"/style.css\"><h1>Root page</h1>");
  await fs.writeFile(path.join(tempDir, "style.css"), "h1 { color: tomato; }");

  const session = await runLauncher(["--root", tempDir, "--session-file", sessionFile]);
  t.after(async () => {
    await stopCollector(session);
  });

  assert.match(session.targetUrl, /^http:\/\/127\.0\.0\.1:\d+\/$/);

  const htmlResponse = await fetch(session.proxiedUrl);
  const html = await htmlResponse.text();
  assert.equal(htmlResponse.status, 200);
  assert.match(html, /Root page/);
  assert.match(html, /__browser-mutation\/inject\.js/);

  const cssResponse = await fetch(new URL("/style.css", session.proxiedUrl));
  const css = await cssResponse.text();
  assert.equal(cssResponse.status, 200);
  assert.equal(css, "h1 { color: tomato; }");
});

test("translates a file URL target into a loopback proxied URL", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const htmlPath = path.join(tempDir, "page.html");
  const sessionFile = path.join(tempDir, "session.json");
  await fs.writeFile(htmlPath, "<!doctype html><main>File URL page</main>");

  const session = await runLauncher(["--target", pathToFileURL(htmlPath).href, "--session-file", sessionFile]);
  t.after(async () => {
    await stopCollector(session);
  });

  assert.match(session.targetUrl, /^http:\/\/127\.0\.0\.1:\d+\/page\.html$/);

  const response = await fetch(session.proxiedUrl);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /File URL page/);
  assert.match(body, /__browser-mutation\/inject\.js/);
});
