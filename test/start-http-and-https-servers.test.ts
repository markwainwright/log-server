import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { after, before, describe, test } from "node:test";

import { startHttpServer } from "../src/start-http-server.js";
import { startHttpsServer } from "../src/start-https-server.js";

for (const startServer of [startHttpsServer, startHttpServer]) {
  const skip =
    startServer === startHttpsServer && !process.env.NODE_EXTRA_CA_CERTS
      ? "skipped because mkcert CA not present"
      : false;

  describe(startServer.name, { skip }, () => {
    let server: http.Server | https.Server;
    let port: number;

    function request(
      options: http.RequestOptions = {},
      body?: string
    ): Promise<[http.IncomingMessage, string]> {
      const module = startServer === startHttpsServer ? https : http;

      return new Promise((resolve, reject) => {
        const request = module
          .request(
            {
              path: "/",
              method: "GET",
              ...options,
              host: "localhost",
              port,
            },
            response => {
              const chunks: string[] = [];
              response.setEncoding("utf-8");
              response.on("data", chunk => {
                chunks.push(chunk);
              });
              response.on("end", () => resolve([response, chunks.join("")]));
            }
          )
          .on("error", err => {
            reject(err);
          });

        if (body) {
          request.setHeader("Content-Length", Buffer.byteLength(body));
        }

        request.end(body);
      });
    }

    before(async () => {
      console.log = () => {};
      server = await startServer();
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

    test("config", () => {
      assert.equal(server.keepAliveTimeout, 0);
    });

    describe("status code", () => {
      test("default", async () => {
        const [{ statusCode }] = await request();
        assert.equal(statusCode, 200);
      });

      test("overridden", async () => {
        const [{ statusCode }] = await request({ path: "/?status=201" });
        assert.equal(statusCode, 201);
      });

      test("overridden to invalid code", async () => {
        const [{ statusCode }] = await request({ path: "/?status=666" });
        assert.equal(statusCode, 666);
      });
    });

    describe("headers", () => {
      test("default", async () => {
        const [{ headersDistinct }] = await request();
        assert.deepEqual(Object.keys(headersDistinct).sort(), [
          "connection",
          "content-length",
          "content-type",
          "date",
          "vary",
        ]);
        assert.deepEqual(headersDistinct["content-type"], ["text/plain; charset=utf-8"]);
        assert.deepEqual(headersDistinct["vary"], ["Accept-Encoding"]);
      });

      test("overridden default headers", async () => {
        const [{ headersDistinct }] = await request({
          path: "/?header=Content-Type:application/json&header=Vary:*",
        });
        assert.deepEqual(Object.keys(headersDistinct).sort(), [
          "connection",
          "content-length",
          "content-type",
          "date",
          "vary",
        ]);
        assert.deepEqual(headersDistinct["content-type"], ["application/json"]);
        assert.deepEqual(headersDistinct["vary"], ["*"]);
      });

      test("added headers", async () => {
        const [{ headersDistinct }] = await request({
          path: "/?header=X-Foo:1&header=X-Foo:2&header=X-Bar:3",
        });
        assert.deepEqual(Object.keys(headersDistinct).sort(), [
          "connection",
          "content-length",
          "content-type",
          "date",
          "vary",
          "x-bar",
          "x-foo",
        ]);
        assert.deepEqual(headersDistinct["x-foo"], ["1", "2"]);
        assert.deepEqual(headersDistinct["x-bar"], ["3"]);
      });
    });

    describe("body", () => {
      test("default", async () => {
        const [{ headers }, responseBody] = await request();
        assert.equal(responseBody, "OK");
        assert.deepEqual(headers["content-length"], "2");
      });

      test("overridden status code", async () => {
        const [{ headers }, responseBody] = await request({ path: "/?status=418" });
        assert.equal(responseBody, "I'm a Teapot");
        assert.deepEqual(headers["content-length"], "12");
      });

      test("overridden unknown status code", async () => {
        const [{ headers }, responseBody] = await request({ path: "/?status=666" });
        assert.equal(responseBody, "Unknown");
        assert.deepEqual(headers["content-length"], "7");
      });

      test("overridden", async () => {
        const [, responseBody] = await request({ path: "/?body=Hello%20world!" });
        assert.equal(responseBody, "Hello world!");
      });
    });

    test("echo", async () => {
      const [{ statusCode, headersDistinct }, responseBody] = await request(
        {
          path: "/?echo=1&header=Content-Type:image/gif",
          headers: { "Content-Type": "text/html" },
        },
        "<h1>hello</h1>"
      );

      assert.equal(statusCode, 200);
      assert.equal(responseBody, "<h1>hello</h1>");
      assert.deepEqual(headersDistinct["content-type"], ["text/html"]);
      assert.deepEqual(headersDistinct["transfer-encoding"], ["chunked"]);
    });
  });
}
