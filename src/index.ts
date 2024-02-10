import { startHttpServer } from "./start-http-server.js";
import { startHttpsServer } from "./start-https-server.js";
import { startTcpServer } from "./start-tcp-server.js";

function parseArgs(argv: string[]) {
  const [mode = "http", rawPort] = argv.slice(2);

  if (mode !== "http" && mode !== "https" && mode !== "tcp") {
    throw new Error(`Unknown mode: ${JSON.stringify(mode)}`);
  }

  const port = (rawPort ? parseInt(rawPort, 10) : 0) || undefined;

  return { mode, port } as const;
}

const { mode, port } = parseArgs(process.argv);

switch (mode) {
  case "http":
    startHttpServer(port);
    break;

  case "https":
    await startHttpsServer(port);
    break;

  case "tcp":
    startTcpServer(port);
    break;
}
