import { createServer } from "node:http";
import next from "next";
import nextEnv from "@next/env";
import { WebSocketServer } from "ws";
import { attachAsrWebSocketServer } from "./server/asr-websocket.mjs";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const handleUpgrade = app.getUpgradeHandler();

await app.prepare();

const server = createServer((req, res) => {
  handle(req, res);
});

const wss = new WebSocketServer({ noServer: true });
attachAsrWebSocketServer(wss);

server.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (requestUrl.pathname !== "/ws/asr") {
    void handleUpgrade(request, socket, head);
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
});
