import test from "ava";

import { IterableQueue } from "./iterable-queue.js";

test("adding elements", async t => {
  const queue = new IterableQueue<number>();

  t.is(queue.size(), 0);

  queue.enqueue(1);
  t.is(queue.size(), 1);

  queue.enqueue(2);
  queue.enqueue(3);
  t.is(queue.size(), 3);

  queue.enqueue(4);
  queue.enqueue(5);
  queue.enqueue(6);
  queue.enqueue(7);
  t.is(queue.size(), 7);
});

test("getting elements", async t => {
  const queue = new IterableQueue<number>();

  t.deepEqual(queue.next(), { value: undefined, done: true });
  t.deepEqual(queue.next(), { value: undefined, done: true });

  queue.enqueue(1);
  t.deepEqual(queue.next(), { value: 1, done: false });
  t.is(queue.size(), 0);
  t.deepEqual(queue.next(), { value: undefined, done: true });
  t.deepEqual(queue.next(), { value: undefined, done: true });

  queue.enqueue(2);
  queue.enqueue(3);
  t.deepEqual(queue.next(), { value: 2, done: false });
  t.deepEqual(queue.next(), { value: 3, done: false });
  t.deepEqual(queue.next(), { value: undefined, done: true });

  queue.enqueue(4);
  t.deepEqual(queue.next(), { value: 4, done: false });
  t.deepEqual(queue.next(), { value: undefined, done: true });
});

test("clearing", async t => {
  const queue = new IterableQueue<number>();

  queue.return();
  t.is(queue.size(), 0);

  queue.enqueue(1);
  queue.enqueue(2);
  t.is(queue.size(), 2);
  queue.return();
  t.is(queue.size(), 0);
  t.deepEqual(queue.next(), { value: undefined, done: true });
  t.deepEqual(queue.next(), { value: undefined, done: true });
});

test("iterating", async t => {
  const queue = new IterableQueue<number>();

  t.deepEqual([...queue], []);

  queue.enqueue(1);
  t.deepEqual([...queue], [1]);
  t.deepEqual([...queue], []);

  queue.enqueue(2);
  queue.next();
  t.deepEqual([...queue], []);

  queue.enqueue(3);
  queue.enqueue(4);
  queue.enqueue(5);
  t.deepEqual([...queue], [3, 4, 5]);
  t.deepEqual([...queue], []);
});

test("instance state not shared", async t => {
  const queue = new IterableQueue<number>();

  queue.enqueue(1);
  t.is(new IterableQueue().size(), 0);
  t.deepEqual(new IterableQueue().next(), { value: undefined, done: true });
});
