import { createServer } from "net";

import { formatAddress, logPrimary, logSecondary } from "./log.js";

const PREFIX_ECHO = "echo ";
const PREFIX_FIN = "fin";
const PREFIX_RST = "rst";

const server = createServer();

server.on("connection", socket => {
  logPrimary("Connection opened", socket);
  let dataReceived = false;

  socket.on("data", chunk => {
    const string = chunk.toString();

    string
      .split("\n")
      .filter(Boolean)
      .forEach(line => logSecondary(line, !dataReceived));

    dataReceived = true;

    if (string.startsWith(PREFIX_ECHO)) {
      socket.write(string.substring(PREFIX_ECHO.length));
    } else if (string.startsWith(PREFIX_FIN)) {
      socket.end();
    } else if (string.startsWith(PREFIX_RST)) {
      socket.resetAndDestroy();
    }
  });

  socket.on("close", () => logPrimary("Connection closed", socket));
});

const port = parseInt(process.env.PORT || "", 10) || 8080;
server.listen(port, () => logPrimary(`Listening on ${formatAddress("http", server.address())}`));
