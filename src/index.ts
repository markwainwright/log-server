import { startHttpServer } from "./http.js";
import { startTcpServer } from "./tcp.js";

const DEFAULT_PORT = 8080;

function parseArgs(argv: string[]) {
  const [mode = "http", port] = argv.slice(2);

  return {
    mode: mode.toLowerCase(),
    port: port ? parseInt(port, 10) || DEFAULT_PORT : DEFAULT_PORT,
  };
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
