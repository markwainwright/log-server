import { createServer, type AddressInfo } from "node:net";
import { setTimeout } from "node:timers/promises";

import { AsyncQueue } from "./util/async-queue.js";
import { logPrimary, logSecondary } from "./util/log.js";

const COMMAND_PREFIX_ECHO = "echo ";
const COMMAND_PREFIX_SLEEP = "sleep ";
const COMMAND_FIN = "fin";
const COMMAND_RST = "rst";

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
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
    return `[${address.address}]:${address.port}`;
  }

  return `${address.address}:${address.port}`;
}

const server = createServer();

server.on("connection", async socket => {
  logPrimary("Connection opened", socket);

  const linesQueue = new AsyncQueue<string>();

  socket.on("data", async chunk => {
    const string = chunk.toString("utf-8");

    logPrimary(JSON.stringify(string).replace(/(?:^"|"$)/g, ""), socket);

    for (const line of string.split(/\r?\n/)) {
      if (line !== "") {
        linesQueue.enqueue(line);
      }
    }
  });

  socket.on("error", error => {
    if (!isNodeError(error) || error.code !== "ECONNRESET") {
      logSecondary(error.message, true);
    }
  });

  socket.on("close", () => logPrimary("Connection closed", socket));

  for await (const line of linesQueue) {
    if (line.startsWith(COMMAND_PREFIX_ECHO)) {
      socket.write(line.substring(COMMAND_PREFIX_ECHO.length));
    } else if (line.startsWith(COMMAND_PREFIX_SLEEP)) {
      await setTimeout(parseInt(line.substring(COMMAND_PREFIX_SLEEP.length), 10));
    } else if (line === COMMAND_FIN) {
      socket.end();
      break;
    } else if (line === COMMAND_RST) {
      socket.resetAndDestroy();
      break;
    }
  }
});

export function createTcpServer(port: number) {
  server.listen(port, () => logPrimary(`Listening on ${formatAddress(server.address())}`));
}
