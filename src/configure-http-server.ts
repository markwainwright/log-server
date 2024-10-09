import { IncomingMessage, Server, ServerResponse, STATUS_CODES } from "node:http";
import { Socket } from "node:net";
import { PassThrough, Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { createBrotliCompress, createDeflate, createGzip } from "node:zlib";

import { logPrimary, logSecondary } from "./util/log.js";

const DEFAULT_RESPONSE_HEADERS = new Map([
  ["Content-Type", "text/plain; charset=utf-8"],
  ["Vary", "Accept-Encoding"],
]);

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
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const { searchParams } = url;

  const status = searchParams.get("status");
  if (status) {
    res.statusCode = parseInt(status, 10);
  }

  for (const header of searchParams.getAll("header")) {
    const delimiter = header.indexOf(":");
    const name = header.slice(0, delimiter).trim();
    const value = header.slice(delimiter + 1).trim();

    try {
      res.appendHeader(name, value);
    } catch (err) {
      if (err instanceof Error) {
        logPrimary(err.message);
      } else {
        throw err;
      }
    }
  }

  for (const [name, value] of DEFAULT_RESPONSE_HEADERS) {
    if (!res.hasHeader(name)) {
      res.setHeader(name, value);
    }
  }

  if (searchParams.has("echo")) {
    if (req.headers["content-type"]) {
      res.setHeader("Content-Type", req.headers["content-type"]);
    }
    await sendResponse(res, req);
    return;
  }

  req.on("end", async () => {
    let body: string | Readable =
      searchParams.get("body") || STATUS_CODES[res.statusCode] || "Unknown";

    const delayHeaders = searchParams.get("delay-headers");
    if (delayHeaders) {
      await setTimeout(parseInt(delayHeaders, 10));
    }

    const delayBody = searchParams.get("delay-body");
    if (delayBody) {
      body = createDelayedReadable(parseInt(delayBody, 10), body);
    }

    await sendResponse(res, body);
  });
}

async function sendResponse(res: ServerResponse, content: Readable | string) {
  const { req } = res;

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
  // TODO: Could make this conditional on `?delay-body`
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

export function configureHttpServer(server: Server) {
  server.on("request", async (req, res) => {
    const { httpVersion, method, rawHeaders, socket, url: path } = req;

    if (req.method !== "GET" || req.url !== "/favicon.ico") {
      logPrimary(`${method} ${path} HTTP/${httpVersion}`, socket);

      for (let i = 0; i < rawHeaders.length; i += 2) {
        logSecondary(`${rawHeaders[i]}: ${rawHeaders[i + 1]}`);
      }

      req.on("data", (chunk: Buffer) => logSecondary(chunk.toString(), true));
    }

    await handleRequest(res);
  });

  server.on("clientError", (err, socket) => {
    logPrimary(`Client error: ${err.message}`, socket instanceof Socket ? socket : undefined);
    socket.end("HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n");
    socket.destroy(err);
  });

  server.on("connection", socket => {
    logPrimary("Connection opened", socket);
    socket.on("close", () => logPrimary("Connection closed", socket));
  });

  server.keepAliveTimeout = 0; // Remove `Keep-Alive` response header
}
