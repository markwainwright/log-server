import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { Queue } from "../../src/util/queue.js";

describe(Queue.name, () => {
  test("enqueue and size", () => {
    const queue = new Queue<number>();
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

  test("purge", () => {
    const queue = new Queue<number>();
    queue.enqueue(1, 2, 3);

    assert.equal(queue.getSize(), 3);

    queue.purge();

    assert.equal(queue.getSize(), 0);
    assert.deepEqual([...queue], []);
    assert.deepEqual([...queue], []);

    queue.enqueue(1, 2);

    assert.equal(queue.getSize(), 2);
    assert.deepEqual([...queue], [1, 2]);
    assert.equal(queue.getSize(), 0);
  });

  test("enqueue then fully iterate", () => {
    const queue = new Queue<number>();
    queue.enqueue(0, 1, 2, 3, 4);

    assert.equal(queue.getSize(), 5);
    assert.deepEqual([...queue], [0, 1, 2, 3, 4]);
    assert.equal(queue.getSize(), 0);
  });

  test("enqueue then fully iterate then enqueue", () => {
    const queue = new Queue<number>();
    queue.enqueue(1, 2, 3);

    assert.equal(queue.getSize(), 3);
    assert.deepEqual([...queue], [1, 2, 3]);
    assert.equal(queue.getSize(), 0);

    queue.enqueue(4, 5, 6);

    assert.equal(queue.getSize(), 3);
    assert.deepEqual([...queue], [4, 5, 6]);
    assert.equal(queue.getSize(), 0);
  });

  test("enqueue then partially iterate then enqueue", () => {
    const queue = new Queue<number>();
    queue.enqueue(1, 2, 3);

    assert.equal(queue.getSize(), 3);

    const [one, two] = queue;
    assert.deepEqual(one, 1);
    assert.deepEqual(two, 2);
    assert.equal(queue.getSize(), 1);

    queue.enqueue(4, 5, 6);

    assert.equal(queue.getSize(), 4);
    assert.deepEqual([...queue], [3, 4, 5, 6]);
    assert.equal(queue.getSize(), 0);
  });

  test("iterate then enqueue", async () => {
    const queue = new Queue<number>();
    assert.deepEqual([...queue], []);

    queue.enqueue(1, 2, 3);

    assert.deepEqual([...queue], [1, 2, 3]);
    assert.equal(queue.getSize(), 0);
  });

  test("iterate and return early", () => {
    const queue = new Queue<number>();
    queue.enqueue(1, 2, 3, 4, 5);
    const [one] = queue;

    assert.deepEqual(one, 1);

    const [two, three] = queue;

    assert.deepEqual(two, 2);
    assert.deepEqual(three, 3);
    assert.equal(queue.getSize(), 2);
  });

  test("iterate and throw", () => {
    const queue = new Queue<number>();
    const values = [];
    queue.enqueue(1, 2, 3, 4, 5);
    try {
      for (const value of queue) {
        values.push(value);
        throw new Error("whoops");
      }
    } catch {}

    assert.deepEqual(values, [1]);
    assert.deepEqual([...queue], [2, 3, 4, 5]);
  });

  test("instance state not shared", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);

    assert.equal(new Queue().getSize(), 0);
    assert.deepEqual([...new Queue()], []);
  });
});
