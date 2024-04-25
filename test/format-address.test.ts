import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatAddress } from "../src/format-address.js";

describe(formatAddress.name, () => {
  test("no address", () => {
    assert.equal(formatAddress(null), "");
  });

  test("socket address", () => {
    assert.equal(formatAddress("/var/run/mysock"), "/var/run/mysock");
  });

  describe("IPv4 address", () => {
    test("HTTP protocol", () => {
      assert.equal(
        formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8080 }, "http"),
        "http://127.0.0.1:8080"
      );
    });

    test("HTTPS protocol", () => {
      assert.equal(
        formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8443 }, "https"),
        "https://127.0.0.1:8443"
      );
    });

    test("no protocol", () => {
      assert.equal(
        formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8443 }),
        "127.0.0.1:8443"
      );
    });
  });

  describe("IPv6 address", () => {
    test("HTTP protocol", () => {
      assert.equal(
        formatAddress({ address: "::", family: "ipv6", port: 8080 }, "http"),
        "http://[::]:8080"
      );
    });

    test("HTTPS protocol", () => {
      assert.equal(
        formatAddress({ address: "::", family: "ipv6", port: 8443 }, "https"),
        "https://[::]:8443"
      );
    });

    test("no protocol", () => {
      assert.equal(formatAddress({ address: "::", family: "ipv6", port: 8080 }), "[::]:8080");
    });
  });
});
