import { createServer } from "node:http";

import { configureHttpServer } from "./configure-http-server.js";
import { formatAddress } from "./format-address.js";
import { logPrimary } from "./util/log.js";

export function startHttpServer(port = 8080) {
  const server = createServer();

  configureHttpServer(server);

  server.listen(port, () => logPrimary(`Listening on ${formatAddress(server.address(), "http")}`));
}
