import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { UniqueValueCounter } from "../../src/util/unique-value-counter.js";

describe(UniqueValueCounter.name, () => {
  test("querying values", () => {
    const counter = new UniqueValueCounter<string>(Infinity);

    assert.equal(counter.get("a"), 0);
    assert.equal(counter.get("a"), 0);

    assert.equal(counter.get("b"), 1);
    assert.equal(counter.get("a"), 0);

    assert.equal(counter.get("c"), 2);
    assert.equal(counter.get("b"), 1);
    assert.equal(counter.get("a"), 0);
  });

  test("expiring old values", () => {
    const counter = new UniqueValueCounter<string>(3);

    assert.equal(counter.get("a"), 0);
    assert.equal(counter.get("b"), 1);
    assert.equal(counter.get("c"), 2);
    assert.equal(counter.get("d"), 3); // evicts "a"

    assert.equal(counter.get("b"), 1);
    assert.equal(counter.get("c"), 2);

    assert.equal(counter.get("a"), 4); // evicts "b"
    assert.equal(counter.get("a"), 4);

    assert.equal(counter.get("c"), 2);
    assert.equal(counter.get("b"), 5); // evicts "c"

    assert.equal(counter.get("c"), 6);
  });
});
