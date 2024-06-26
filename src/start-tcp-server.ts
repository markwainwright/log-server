import { createServer, type Server, type Socket } from "node:net";
import { setTimeout } from "node:timers/promises";

import { formatAddress } from "./format-address.js";
import { AsyncQueue } from "./util/async-queue.js";
import { logPrimary, logSecondary } from "./util/log.js";

const COMMAND_PREFIX_PRINT = "print ";
const COMMAND_PREFIX_SLEEP = "sleep ";
const COMMAND_FIN = "fin";
const COMMAND_RST = "rst";

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function socketWrite(socket: Socket, data: string) {
  if (socket.writable) {
    await new Promise<void>((resolve, reject) =>
      socket.write(data, "utf-8", error => (error ? reject(error) : resolve()))
    );
  }
}

function socketEnd(socket: Socket) {
  return new Promise<void>(socket.end.bind(socket));
}

export function startTcpServer(port?: number): Server {
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

    socket.on("close", () => {
      linesQueue.end(); // break the for loop below
      logPrimary("Connection closed", socket);
    });

    for await (const line of linesQueue) {
      if (line.startsWith(COMMAND_PREFIX_PRINT)) {
        await socketWrite(socket, line.substring(COMMAND_PREFIX_PRINT.length));
      } else if (line.startsWith(COMMAND_PREFIX_SLEEP)) {
        await setTimeout(parseInt(line.substring(COMMAND_PREFIX_SLEEP.length), 10));
      } else if (line === COMMAND_FIN) {
        await socketEnd(socket);
      } else if (line === COMMAND_RST) {
        socket.resetAndDestroy();
      }
    }
  });

  server.listen(port, () => logPrimary(`Listening on ${formatAddress(server.address())}`));

  return server;
}
