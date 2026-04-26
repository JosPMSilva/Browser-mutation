#!/usr/bin/env node

import crypto from "node:crypto";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const overlayPath = path.join(__dirname, "browser-mutation-overlay.js");
const collectorBasePath = "/__browser-mutation";
const maxBodyBytes = 2 * 1024 * 1024;

const state = {
  token: crypto.randomBytes(18).toString("hex"),
  server: null,
  port: null,
  activeTarget: null,
  latest: null,
  sessions: []
};

function sendMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function sendResult(id, result) {
  sendMessage({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  sendMessage({ jsonrpc: "2.0", id, error: { code, message } });
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function jsonResult(value) {
  return textResult(JSON.stringify(value, null, 2));
}

function hasValidToken(requestUrl, headers) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  return url.searchParams.get("token") === state.token || headers["x-codex-browser-mutation-token"] === state.token;
}

function writeCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-codex-browser-mutation-token");
}

function isLocalTarget(targetUrl) {
  const url = new URL(targetUrl);
  const hostname = url.hostname.toLowerCase();
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".localhost"))
  );
}

function requireLocalTarget(targetUrl) {
  if (!isLocalTarget(targetUrl)) {
    throw new Error("Browser Mutation proxy only supports loopback/local development URLs.");
  }
  return new URL(targetUrl);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error("Mutation payload exceeded 2 MiB.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function serveOverlay(res) {
  const source = await fs.readFile(overlayPath, "utf8");
  const configured = source
    .replaceAll("__CODEX_BROWSER_MUTATION_PORT__", String(state.port))
    .replaceAll("__CODEX_BROWSER_MUTATION_TOKEN__", state.token);
  res.writeHead(200, { "content-type": "application/javascript; charset=utf-8" });
  res.end(configured);
}

function getRequestUrl(req) {
  return new URL(req.url ?? "/", "http://127.0.0.1");
}

function getInjectTag() {
  return `<script src="http://127.0.0.1:${state.port}${collectorBasePath}/inject.js?token=${state.token}"></script>`;
}

function isCollectorPath(pathname) {
  return (
    pathname === `${collectorBasePath}/inject.js` ||
    pathname === `${collectorBasePath}/latest` ||
    pathname === `${collectorBasePath}/mutation`
  );
}

function injectOverlay(html) {
  const tag = getInjectTag();
  if (html.includes(tag)) {
    return html;
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${tag}</body>`);
  }
  return `${html}${tag}`;
}

function copyProxyHeaders(sourceHeaders, res, contentLength) {
  for (const [key, value] of sourceHeaders) {
    const lower = key.toLowerCase();
    if (
      lower === "content-encoding" ||
      lower === "content-length" ||
      lower === "transfer-encoding" ||
      lower === "connection" ||
      lower === "content-security-policy"
    ) {
      continue;
    }
    res.setHeader(key, value);
  }
  if (contentLength != null) {
    res.setHeader("content-length", String(contentLength));
  }
}

async function proxyToTarget(req, res, targetUrl) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) {
      continue;
    }
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length") {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  const response = await fetch(targetUrl, { method: req.method, headers, body, redirect: "manual" });
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const text = injectOverlay(await response.text());
    const buffer = Buffer.from(text, "utf8");
    copyProxyHeaders(response.headers, res, buffer.byteLength);
    res.setHeader("content-type", contentType);
    res.writeHead(response.status);
    res.end(buffer);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  copyProxyHeaders(response.headers, res, buffer.byteLength);
  res.writeHead(response.status);
  res.end(buffer);
}

async function serveProxiedEntry(req, res, url) {
  const target = requireLocalTarget(url.searchParams.get("target") ?? "");
  state.activeTarget = target;
  await proxyToTarget(req, res, target);
}

async function maybeProxyActiveTarget(req, res, url) {
  if (!state.activeTarget || req.method === "OPTIONS") {
    return false;
  }
  const target = new URL(`${url.pathname}${url.search}`, state.activeTarget.origin);
  await proxyToTarget(req, res, target);
  return true;
}

async function handleMutation(req, res) {
  const body = await readBody(req);
  const payload = JSON.parse(body);
  const receivedAt = new Date().toISOString();
  const session = {
    receivedAt,
    page: payload.page ?? null,
    notes: payload.notes ?? "",
    records: Array.isArray(payload.records) ? payload.records : []
  };
  state.latest = session;
  state.sessions.push(session);
  if (state.sessions.length > 20) {
    state.sessions.shift();
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, receivedAt, records: session.records.length }));
}

function startCollector() {
  if (state.server) {
    return Promise.resolve();
  }

  state.server = http.createServer(async (req, res) => {
    writeCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = getRequestUrl(req);
      if (url.pathname === "/proxy") {
        await serveProxiedEntry(req, res, url);
        return;
      }
      if (isCollectorPath(url.pathname) && !hasValidToken(req.url ?? "/", req.headers)) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid browser mutation token." }));
        return;
      }
      if (req.method === "GET" && url.pathname === `${collectorBasePath}/inject.js`) {
        await serveOverlay(res);
        return;
      }
      if (req.method === "GET" && url.pathname === `${collectorBasePath}/latest`) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(state.latest ?? { records: [] }));
        return;
      }
      if (req.method === "POST" && url.pathname === `${collectorBasePath}/mutation`) {
        await handleMutation(req, res);
        return;
      }
      if (await maybeProxyActiveTarget(req, res, url)) {
        return;
      }

      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found." }));
    } catch (error) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  });

  return new Promise((resolve, reject) => {
    state.server.once("error", reject);
    state.server.listen(0, "127.0.0.1", () => {
      const address = state.server.address();
      state.port = typeof address === "object" && address ? address.port : null;
      resolve();
    });
  });
}

async function getInjector(args = {}) {
  await startCollector();
  const url = `http://127.0.0.1:${state.port}${collectorBasePath}/inject.js?token=${state.token}`;
  const latestUrl = `http://127.0.0.1:${state.port}${collectorBasePath}/latest?token=${state.token}`;
  const snippet = `fetch(${JSON.stringify(url)}).then((r) => r.text()).then((code) => (0, eval)(code));`;
  const addressBarJavascript = `javascript:${snippet}`;
  const targetUrl = typeof args.targetUrl === "string" && args.targetUrl.trim() ? args.targetUrl.trim() : null;
  const proxiedUrl = targetUrl
    ? `http://127.0.0.1:${state.port}/proxy?target=${encodeURIComponent(requireLocalTarget(targetUrl).toString())}`
    : null;
  return {
    collectorUrl: `http://127.0.0.1:${state.port}`,
    overlayScriptUrl: url,
    latestUrl,
    proxiedUrl,
    addressBarJavascript,
    browserUseRecipe: [
      "Use the Browser Use plugin with backend \"iab\".",
      proxiedUrl
        ? "Open proxiedUrl in the Codex in-app browser. The overlay is injected automatically."
        : "Open or select the target tab.",
      proxiedUrl
        ? "Use the proxied page as the visual editing surface."
        : "Focus the in-app browser address bar, type addressBarJavascript exactly, and press Enter.",
      "Let the user edit the rendered page with the overlay.",
      "After the user presses Send, call browser_mutation_get_latest."
    ],
    consoleSnippet: snippet,
    bookmarklet: addressBarJavascript,
    instructions: [
      "Open or select the target UI in the Codex in-app browser.",
      proxiedUrl
        ? "Use Browser Use to navigate to proxiedUrl."
        : "Use Browser Use to enter addressBarJavascript in the in-app browser address bar.",
      "Use the Browser Mutation panel to select and edit elements.",
      "Press Send, then ask Codex to read the latest browser mutations."
    ]
  };
}

const tools = [
  {
    name: "browser_mutation_get_injector",
    description: "Start the local collector and return Browser Use-compatible injection data for the mutation overlay.",
    inputSchema: {
      type: "object",
      properties: {
        targetUrl: {
          type: "string",
          description: "Optional loopback/local development URL to open through the Browser Mutation proxy."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "browser_mutation_get_latest",
    description: "Return the latest browser mutation session captured by the local collector.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "browser_mutation_clear",
    description: "Clear captured browser mutation sessions.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

async function callTool(name, args = {}) {
  if (name === "browser_mutation_get_injector") {
    return jsonResult(await getInjector(args));
  }
  if (name === "browser_mutation_get_latest") {
    return jsonResult(state.latest ?? { records: [] });
  }
  if (name === "browser_mutation_clear") {
    state.latest = null;
    state.sessions = [];
    return jsonResult({ ok: true });
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handleRequest(message) {
  if (!message || typeof message !== "object" || !message.method) {
    return;
  }
  if (message.id === undefined) {
    return;
  }

  try {
    if (message.method === "initialize") {
      sendResult(message.id, {
        protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "browser-mutation", version: "0.1.0" }
      });
      return;
    }
    if (message.method === "ping") {
      sendResult(message.id, {});
      return;
    }
    if (message.method === "tools/list") {
      sendResult(message.id, { tools });
      return;
    }
    if (message.method === "tools/call") {
      const result = await callTool(message.params?.name, message.params?.arguments ?? {});
      sendResult(message.id, result);
      return;
    }
    if (message.method === "resources/list") {
      sendResult(message.id, { resources: [] });
      return;
    }
    if (message.method === "resources/templates/list") {
      sendResult(message.id, { resourceTemplates: [] });
      return;
    }
    if (message.method === "prompts/list") {
      sendResult(message.id, { prompts: [] });
      return;
    }
    if (message.method === "logging/setLevel") {
      sendResult(message.id, {});
      return;
    }
    sendError(message.id, -32601, `Unsupported method: ${message.method}`);
  } catch (error) {
    sendError(message.id, -32000, error instanceof Error ? error.message : String(error));
  }
}

let inputBuffer = Buffer.alloc(0);

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1];
}

async function runServeCli() {
  const targetUrl = readArg("--target") ?? readArg("-t");
  const sessionFile = readArg("--session-file");
  const injector = await getInjector({ targetUrl });
  const payload = {
    ...injector,
    pid: process.pid,
    startedAt: new Date().toISOString()
  };
  if (sessionFile) {
    await fs.mkdir(path.dirname(sessionFile), { recursive: true });
    await fs.writeFile(sessionFile, `${JSON.stringify(payload, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.stderr.write(
    targetUrl && payload.proxiedUrl
      ? `Browser Mutation ready. Open this URL in the Codex browser:\n${injector.proxiedUrl}\n`
      : `Browser Mutation ready. Paste bookmarklet into the Codex browser address bar:\n${injector.addressBarJavascript}\n`
  );
  process.stdin.resume();
}

function runMcpServer() {
  process.stdin.on("data", (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);
    while (true) {
      const separator = inputBuffer.indexOf("\r\n\r\n");
      if (separator === -1) {
        return;
      }
      const header = inputBuffer.slice(0, separator).toString("utf8");
      const match = /content-length:\s*(\d+)/i.exec(header);
      if (!match) {
        inputBuffer = inputBuffer.slice(separator + 4);
        continue;
      }
      const length = Number(match[1]);
      const start = separator + 4;
      const end = start + length;
      if (inputBuffer.length < end) {
        return;
      }
      const body = inputBuffer.slice(start, end).toString("utf8");
      inputBuffer = inputBuffer.slice(end);
      handleRequest(JSON.parse(body));
    }
  });

  process.stdin.resume();
}

if (process.argv.includes("--serve")) {
  runServeCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
} else {
  runMcpServer();
}
