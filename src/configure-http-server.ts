import { STATUS_CODES, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { Socket } from "node:net";
import { PassThrough, Readable, type Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { createBrotliCompress, createDeflate, createGzip } from "node:zlib";

import { logPrimary, logSecondary } from "./util/log.js";

const RESPONSE_HEADERS = {
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
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const { searchParams } = url;

  const status = searchParams.get("status");
  if (status) {
    res.statusCode = parseInt(status, 10);
  }

  const headers = searchParams.getAll("header");
  for (const header of headers) {
    const delimiter = header.indexOf(":");
    const name = header.slice(0, delimiter);
    const value = header.slice(delimiter + 1);

    try {
      res.setHeader(name.trim(), value.trim());
    } catch (err) {
      if (err instanceof Error) {
        logPrimary(err.message);
      } else {
        throw err;
      }
    }
  }

  if (searchParams.has("echo")) {
    await sendResponse(res, req, req.headers["content-type"] ?? "text/plain; charset=utf-8");
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
