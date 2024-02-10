import type { Server } from "node:https";
import type { TLSSocket } from "node:tls";

import { logPrimary } from "./util/log.js";

interface TLSSocketWithServername extends TLSSocket {
  servername: string | false;
}

export function configureHttpsServer(server: Server) {
  // TODO: Anything else to log here?
  server.on("secureConnection", (tlsSocket: TLSSocketWithServername) => {
    logPrimary(
      `${tlsSocket.getProtocol()} established; ${
        tlsSocket.servername ? `server name is "${tlsSocket.servername}"` : "no server name given"
      }`,
      tlsSocket
    );
  });

  server.on("tlsClientError", (err, tlsSocket) =>
    logPrimary(`TLS client error: ${err.message}`, tlsSocket)
  );
}
