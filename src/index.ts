import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { setTimeout } from "node:timers/promises";

import { formatAddress, logPrimary, logSecondary } from "./log.js";

const PORT = parseInt(process.env.PORT || "", 10) || 8080;

const PATH_SLEEP = "/sleep/";
const PATH_STATUS = "/status/";

async function sendResponse<R extends IncomingMessage>(req: R, res: ServerResponse<R>) {
  if (req.url?.startsWith(PATH_SLEEP)) {
    await setTimeout(parseInt(req.url.substring(PATH_SLEEP.length), 10));
  } else if (req.url?.startsWith(PATH_STATUS)) {
    res.statusCode = parseInt(req.url.substring(PATH_STATUS.length), 10);
  }

  res.end("ok");
}

const server = createServer();

server.on("request", (req, res) => {
  const { httpVersion, method, rawHeaders, socket, url } = req;

  logPrimary(`${method} ${url} HTTP/${httpVersion}`, socket);

  for (let i = 0; i < rawHeaders.length; i += 2) {
    logSecondary(`${rawHeaders[i]}: ${rawHeaders[i + 1]}`);
  }

  req
    .on("data", chunk => logSecondary(chunk.toString(), true))
    .on("end", () => sendResponse(req, res));
});

server.on("clientError", (err, socket) => {
  logPrimary(err.message, socket);
  socket.end("HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n");
  socket.destroy(err);
});

server.on("connection", socket => {
  logPrimary("Connection opened", socket);
  socket.on("close", () => logPrimary("Connection closed", socket));
});

server.keepAliveTimeout = 0; // Remove `Keep-Alive` response header

server.listen(PORT, () => logPrimary(`Listening on ${formatAddress("http", server.address())}`));
