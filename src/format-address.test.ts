import test from "ava";
import { formatAddress } from "./format-address.js";

test("null", async t => {
  t.is(formatAddress(null), "");
});

test("socket", async t => {
  t.is(formatAddress("/var/run/mysock"), "/var/run/mysock");
});

test("HTTP IPv6", async t => {
  t.is(formatAddress({ address: "::", family: "ipv6", port: 8080 }, "http"), "http://[::]:8080");
});

test("HTTPS IPv6", async t => {
  t.is(formatAddress({ address: "::", family: "ipv6", port: 8443 }, "https"), "https://[::]:8443");
});

test("no protocol IPv6", async t => {
  t.is(formatAddress({ address: "::", family: "ipv6", port: 8080 }), "[::]:8080");
});

test("HTTP IPv4", async t => {
  t.is(
    formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8080 }, "http"),
    "http://127.0.0.1:8080"
  );
});

test("HTTPS IPv4", async t => {
  t.is(
    formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8443 }, "https"),
    "https://127.0.0.1:8443"
  );
});

test("no protocol IPv4", async t => {
  t.is(formatAddress({ address: "127.0.0.1", family: "ipv4", port: 8443 }), "127.0.0.1:8443");
});
