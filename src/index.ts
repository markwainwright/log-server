import { startHttpServer } from "./http.js";
import { startTcpServer } from "./tcp.js";

function parseArgs(argv: string[]) {
  const [mode = "http", rawPort] = argv.slice(2);
  const port = (rawPort ? parseInt(rawPort, 10) : 0) || (mode === "http" ? 8080 : 4444);

  return { mode, port };
}

(function main() {
  const { mode, port } = parseArgs(process.argv);

  switch (mode) {
    case "http":
      startHttpServer(port);
      return;

    case "tcp":
      startTcpServer(port);
      return;

    default:
      console.error(`Unknown mode: ${JSON.stringify(mode)}`);
      process.exit(1);
  }
})();
