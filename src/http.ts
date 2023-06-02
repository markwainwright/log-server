import { STATUS_CODES, createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { PassThrough, Readable, type Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { createBrotliCompress, createDeflate, createGzip } from "node:zlib";

import { logPrimary, logSecondary } from "./util/log.js";

const PATH_STATUS = "/status/";
const PATH_SLEEP_BODY = "/sleep/body/";
const PATH_SLEEP_HEADERS = "/sleep/headers/";
const PATH_ECHO_PATH = "/echo/";
const PATH_ECHO_BODY = "/echo";

const RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  Vary: "Accept-Encoding",
};
const RESPONSE_HEADERS_ENTRIES = Object.entries(RESPONSE_HEADERS);

function createDelayedReadable(delay: number, value: any): Readable {
  return Readable.from([setTimeout(delay).then(() => value)]);
}

function parseAcceptEncoding(req: IncomingMessage): [string | null, Transform] {
  const acceptEncoding = req.headersDistinct["accept-encoding"]?.at(-1);

  if (acceptEncoding) {
    if (/\bbr\b/.test(acceptEncoding)) {
      return ["br", createBrotliCompress()];
    }

    if (/\bgzip\b/.test(acceptEncoding)) {
      return ["gzip", createGzip()];
    }

    if (/\bdeflate\b/.test(acceptEncoding)) {
      return ["gzip", createDeflate()];
    }
  }

  return [null, new PassThrough()];
}

async function handleRequest(res: ServerResponse) {
  const { req } = res;
  const path = req.url;

  if (path === PATH_ECHO_BODY) {
    await sendResponse(res, req, req.headers["content-type"] ?? "text/plain; charset=utf-8");
    return;
  }

  req.on("end", async () => {
    let body: string | Readable = "OK";

    if (path) {
      if (path.startsWith(PATH_ECHO_PATH)) {
        body = path.substring(PATH_ECHO_PATH.length);
      } else if (path.startsWith(PATH_SLEEP_HEADERS)) {
        await setTimeout(parseInt(path.substring(PATH_SLEEP_HEADERS.length), 10));
      } else if (path.startsWith(PATH_SLEEP_BODY)) {
        body = createDelayedReadable(parseInt(path.substring(PATH_SLEEP_BODY.length), 10), body);
      } else if (path.startsWith(PATH_STATUS)) {
        res.statusCode = parseInt(path.substring(PATH_STATUS.length), 10);
        body = STATUS_CODES[res.statusCode] || "Unknown";
      }
    }

    await sendResponse(res, body, "text/plain; charset=utf-8");
  });
}

async function sendResponse(res: ServerResponse, content: Readable | string, contentType: string) {
  const { req } = res;

  RESPONSE_HEADERS_ENTRIES.forEach(([name, value]) => res.setHeader(name, value));
  res.setHeader("Content-Type", contentType);

  const [contentEncoding, encodeTransform] = parseAcceptEncoding(req);

  if (typeof content === "string") {
    if (contentEncoding) {
      content = Readable.from([content]);
    } else {
      // Send non-chunked response
      res.end(content);
      return;
    }
  }

  if (contentEncoding) {
    res.setHeader("Content-Encoding", contentEncoding);
  }

  // write("") sends headers immediately, without waiting for first chunk
  // TODO: Could make this conditional on PATH_SLEEP_BODY
  res.writeHead(res.statusCode).write("");

  try {
    await pipeline(content, encodeTransform, res);
  } catch (err) {
    if (err instanceof Error) {
      logPrimary(`Stream error: ${err.message}`, req.socket);
    }
    res.end();
  }
}

export function formatAddress(address: AddressInfo | string | null) {
  if (address === null) {
    return "";
  }

  if (typeof address === "string") {
    // Unix socket
    return address;
  }

  if (address.family === "IPv6") {
    return `http://[${address.address}]:${address.port}`;
  }

  return `http://${address.address}:${address.port}`;
}

export function startHttpServer(port: number) {
  const server = createServer();

  server.on("request", async (req, res) => {
    const { httpVersion, method, rawHeaders, socket, url: path } = req;

    logPrimary(`${method} ${path} HTTP/${httpVersion}`, socket);

    for (let i = 0; i < rawHeaders.length; i += 2) {
      logSecondary(`${rawHeaders[i]}: ${rawHeaders[i + 1]}`);
    }

    req.on("data", (chunk: Buffer) => logSecondary(chunk.toString(), true));

    await handleRequest(res);
  });

  server.on("clientError", (err, socket) => {
    logPrimary(`Client error: ${err.message}`, socket);
    socket.end("HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n");
    socket.destroy(err);
  });

  server.on("connection", socket => {
    logPrimary("Connection opened", socket);
    socket.on("close", () => logPrimary("Connection closed", socket));
  });

  server.keepAliveTimeout = 0; // Remove `Keep-Alive` response header

  server.listen(port, () => logPrimary(`Listening on ${formatAddress(server.address())}`));
}
