import assert from "node:assert/strict";
import net from "node:net";
import { after, before, describe, test } from "node:test";

import { startTcpServer } from "../src/start-tcp-server.js";

describe(startTcpServer.name, () => {
  let server: net.Server;
  let port: number;

  before(() => {
    console.log = () => {};
    server = startTcpServer();
    const address = server.address();
    if (address !== null && typeof address === "object") {
      port = address.port;
    }
  });

  after(() => {
    server.close();
  });

  test("port", () => {
    assert.equal(port > 0, true);
  });
});
