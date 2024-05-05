import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { AsyncQueue } from "../../src/util/async-queue.js";

describe(AsyncQueue.name, () => {
  test("enqueue and size", () => {
    const queue = new AsyncQueue<number>();
    queue.enqueue();
    queue.enqueue();

    assert.equal(queue.getSize(), 0);

    queue.enqueue(1);

    assert.equal(queue.getSize(), 1);

    queue.enqueue(2);
    queue.enqueue(3);

    assert.equal(queue.getSize(), 3);

    queue.enqueue(4, 5, 6);
    queue.enqueue(7);

    assert.equal(queue.getSize(), 7);
  });

  test("purge", async () => {
    const queue = new AsyncQueue<number>();
    const values: number[] = [];
    const iterator = (async () => {
      for await (const value of queue) {
        values.push(value);
        if (values.length === 3) break;
      }
    })();

    queue.enqueue(1, 2, 3);
    queue.purge();
    queue.enqueue(4, 5);
    await iterator;

    assert.deepEqual(values, [1, 4, 5]);
  });

  test("end", async () => {
    const queue1 = new AsyncQueue<number>();
    const next = queue1.next();
    queue1.end();

    await next; // Should have been resolved by the call to end() and not hang

    const queue2 = new AsyncQueue<number>();
    const iterator = (async () => {
      for await (const _ of queue2) {
        throw "Should not iterate";
      }
    })();
    queue2.end();

    await iterator; // Should have been resolved by the call to end() and not hang
    assert.equal(queue2.getSize(), 0);
  });

  test("end then enqueue", () => {
    const queue = new AsyncQueue<number>();
    queue.end();
    assert.throws(() => queue.enqueue(1));
  });

  test("enqueue then fully iterate", async () => {
    const queue = new AsyncQueue<number>();
    const values = [];
    queue.enqueue(0, 1, 2, 3, 4);
    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [0, 1, 2, 3, 4]);
    assert.equal(queue.getSize(), 0);
  });

  test("enqueue then fully iterate then enqueue", async () => {
    const queue = new AsyncQueue<number>();
    const values: number[] = [];
    queue.enqueue(1, 2, 3);
    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [1, 2, 3]);
    assert.equal(queue.getSize(), 0);

    queue.enqueue(4, 5, 6);
    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [1, 2, 3, 4, 5, 6]);
  });

  test("enqueue then partially iterate then enqueue", async () => {
    const queue = new AsyncQueue<number>();
    const values: number[] = [];
    queue.enqueue(1, 2, 3);
    for await (const value of queue) {
      values.push(value);
      if (values.length === 2) break;
    }

    assert.deepEqual(values, [1, 2]);
    assert.equal(queue.getSize(), 1);

    queue.enqueue(4, 5, 6);
    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [1, 2, 3, 4, 5, 6]);
  });

  test("fully iterate then enqueue", async () => {
    const queue = new AsyncQueue<number>();
    const values: number[] = [];
    const iterator = (async () => {
      for await (const value of queue) {
        values.push(value);
        if (queue.getSize() === 0) break;
      }
    })();
    queue.enqueue(1, 2, 3);
    await iterator;

    assert.deepEqual(values, [1, 2, 3]);
    assert.equal(queue.getSize(), 0);
  });

  test("partially iterate then enqueue then fully iterate", async () => {
    const queue = new AsyncQueue<number>();
    const values: number[] = [];
    const iterator = (async () => {
      for await (const value of queue) {
        values.push(value);
        if (values.length === 2) break;
      }
    })();
    queue.enqueue(1, 2, 3, 4, 5);
    await iterator;

    assert.deepEqual(values, [1, 2]);
    assert.equal(queue.getSize(), 3);

    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [1, 2, 3, 4, 5]);
  });

  test("iterate and return early", async () => {
    const queue = new AsyncQueue<number>();
    queue.enqueue(1, 2, 3, 4, 5);
    const values = [];
    for await (const value of queue) {
      values.push(value);
      break;
    }

    assert.deepEqual(values, [1]);

    for await (const value of queue) {
      values.push(value);
      if (values.length === 3) break;
    }

    assert.deepEqual(values, [1, 2, 3]);
    assert.equal(queue.getSize(), 2);
  });

  test("iterate and throw", async () => {
    const queue = new AsyncQueue<number>();
    const values = [];
    queue.enqueue(1, 2, 3, 4, 5);
    try {
      for await (const value of queue) {
        values.push(value);
        throw new Error("whoops");
      }
    } catch {}

    assert.deepEqual(values, [1]);

    for await (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [1, 2, 3, 4, 5]);
  });

  test("multiple iterators", async () => {
    const queue = new AsyncQueue<number>();
    const values: Record<string, number[]> = {};
    const iterators = ["a", "b", "c"].map(async name => {
      for await (const value of queue) {
        (values[name] ??= []).push(value);
        if (queue.getSize() === 0) break;
      }
    });
    queue.enqueue(1, 2, 3, 4, 5, 6, 7, 8);
    await Promise.all(iterators);

    assert.deepEqual(values, {
      a: [1, 4, 7],
      b: [2, 5, 8],
      c: [3, 6],
    });
  });

  test("sync iterable", async () => {
    const queue = new AsyncQueue<number>();
    const values = [];
    for (const value of queue) {
      values.push(value);
    }

    assert.equal(values.length, 0);

    queue.enqueue(1, 2, 3, 4);
    await queue.next();

    for (const value of queue) {
      values.push(value);
      if (queue.getSize() === 0) break;
    }

    assert.deepEqual(values, [2, 3, 4]);
    assert.equal(queue.getSize(), 0);
  });

  test("instance state not shared", () => {
    const queue = new AsyncQueue<number>();

    queue.enqueue(1);
    assert.equal(new AsyncQueue().getSize(), 0);
  });
});
