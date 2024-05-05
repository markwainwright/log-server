import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:https";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { configureHttpServer } from "./configure-http-server.js";
import { configureHttpsServer } from "./configure-https-server.js";
import { formatAddress } from "./format-address.js";
import { logPrimary } from "./util/log.js";

const thisDir = dirname(fileURLToPath(import.meta.url));

export async function startHttpsServer(port?: number): Promise<Server> {
  const [key, cert] = await Promise.all(
    ["localhost+1-key.pem", "localhost+1.pem"].map(filename =>
      readFile(resolve(thisDir, "../certs", filename), "utf8")
    )
  );

  const server = createServer({ key, cert });

  configureHttpServer(server);
  configureHttpsServer(server);

  server.listen(port, () => logPrimary(`Listening on ${formatAddress(server.address(), "https")}`));

  return server;
}
