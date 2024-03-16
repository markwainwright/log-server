import test from "ava";

import { UniqueValueCounter } from "./unique-value-counter.js";

test("querying values", async t => {
  const counter = new UniqueValueCounter<string>(Infinity);

  t.is(counter.get("a"), 0);
  t.is(counter.get("a"), 0);

  t.is(counter.get("b"), 1);
  t.is(counter.get("a"), 0);

  t.is(counter.get("c"), 2);
  t.is(counter.get("b"), 1);
  t.is(counter.get("a"), 0);
});

test("expiring old values", async t => {
  const counter = new UniqueValueCounter<string>(3);

  t.is(counter.get("a"), 0);
  t.is(counter.get("b"), 1);
  t.is(counter.get("c"), 2);
  t.is(counter.get("d"), 3); // evicts "a"

  t.is(counter.get("b"), 1);
  t.is(counter.get("c"), 2);

  t.is(counter.get("a"), 4); // evicts "b"
  t.is(counter.get("a"), 4);

  t.is(counter.get("c"), 2);
  t.is(counter.get("b"), 5); // evicts "c"

  t.is(counter.get("c"), 6);
});
