import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { IterableQueue } from "../../src/util/iterable-queue.js";

describe(IterableQueue.name, () => {
  test("adding elements", () => {
    const queue = new IterableQueue<number>();

    assert.equal(queue.size(), 0);

    queue.enqueue(1);

    assert.equal(queue.size(), 1);

    queue.enqueue(2);
    queue.enqueue(3);

    assert.equal(queue.size(), 3);

    queue.enqueue(4);
    queue.enqueue(5);
    queue.enqueue(6);
    queue.enqueue(7);

    assert.equal(queue.size(), 7);
  });

  test("getting elements", () => {
    const queue = new IterableQueue<number>();

    assert.deepEqual(queue.next(), { value: undefined, done: true });
    assert.deepEqual(queue.next(), { value: undefined, done: true });

    queue.enqueue(1);

    assert.deepEqual(queue.next(), { value: 1, done: false });
    assert.equal(queue.size(), 0);
    assert.deepEqual(queue.next(), { value: undefined, done: true });
    assert.deepEqual(queue.next(), { value: undefined, done: true });

    queue.enqueue(2);
    queue.enqueue(3);

    assert.deepEqual(queue.next(), { value: 2, done: false });
    assert.deepEqual(queue.next(), { value: 3, done: false });
    assert.deepEqual(queue.next(), { value: undefined, done: true });

    queue.enqueue(4);

    assert.deepEqual(queue.next(), { value: 4, done: false });
    assert.deepEqual(queue.next(), { value: undefined, done: true });
  });

  test("clearing", () => {
    const queue = new IterableQueue<number>();
    queue.enqueue(1);
    queue.enqueue(2);

    assert.equal(queue.size(), 2);

    queue.return();

    assert.equal(queue.size(), 0);
    assert.deepEqual(queue.next(), { value: undefined, done: true });
    assert.deepEqual(queue.next(), { value: undefined, done: true });
  });

  test("iterating", () => {
    const queue = new IterableQueue<number>();

    assert.deepEqual([...queue], []);

    queue.enqueue(1);

    assert.deepEqual([...queue], [1]);
    assert.deepEqual([...queue], []);

    queue.enqueue(2);
    queue.next();

    assert.deepEqual([...queue], []);

    queue.enqueue(3);
    queue.enqueue(4);
    queue.enqueue(5);

    assert.deepEqual([...queue], [3, 4, 5]);
    assert.deepEqual([...queue], []);
  });

  test("iterating after clear", () => {
    const queue = new IterableQueue<number>();
    queue.return();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    assert.deepEqual([...queue], [1, 2, 3]);
    assert.deepEqual([...queue], []);
  });

  test("instance state not shared", () => {
    const queue = new IterableQueue<number>();
    queue.enqueue(1);

    assert.equal(new IterableQueue().size(), 0);
    assert.deepEqual(new IterableQueue().next(), { value: undefined, done: true });
  });
});
