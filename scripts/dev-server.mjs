import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 5050);
const host = process.env.HOST || "0.0.0.0";

loadEnvFile(".env.local");
loadEnvFile(".env");

const generationsHandler = require(path.join(root, "api", "generations.js"));
const createCheckoutSessionHandler = require(path.join(root, "api", "billing", "create-checkout-session.js"));
const stripeWebhookHandler = require(path.join(root, "api", "billing", "webhook.js"));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function loadEnvFile(filename) {
  const file = path.join(root, filename);
  if (!existsSync(file)) return;

  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function readRequestPayload(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return { rawBody: "", body: {} };

  try {
    return { rawBody: text, body: JSON.parse(text) };
  } catch (error) {
    return { rawBody: text, body: text };
  }
}

async function handleApi(req, res, handler) {
  const payload = await readRequestPayload(req);
  req.rawBody = payload.rawBody;
  req.body = payload.body;
  await handler(req, res);
}

async function handleStatic(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/www/index.html" : url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    if ((req.url || "").startsWith("/api/generations")) {
      await handleApi(req, res, generationsHandler);
      return;
    }

    if ((req.url || "").startsWith("/api/billing/create-checkout-session")) {
      await handleApi(req, res, createCheckoutSessionHandler);
      return;
    }

    if ((req.url || "").startsWith("/api/billing/webhook")) {
      await handleApi(req, res, stripeWebhookHandler);
      return;
    }

    await handleStatic(req, res);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message || "Server error" }));
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`端口 ${port} 已经被占用。请先关闭之前启动的本地服务器，或在命令行按 Ctrl+C 停止旧服务。`);
    console.error(`如果你只是想继续测试，请直接打开：http://127.0.0.1:${port}/app/login.html`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`CopyPilot server is running on ${host}:${port}`);
  console.log(`Local preview: http://127.0.0.1:${port}/app/login.html`);
});
