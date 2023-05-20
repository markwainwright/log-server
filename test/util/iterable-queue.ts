import t from "tap";

import { IterableQueue } from "../../src/util/iterable-queue.js";

t.test(IterableQueue.name, async t => {
  let queue: IterableQueue<number>;
  t.beforeEach(() => {
    queue = new IterableQueue();
  });

  t.test("adding elements", async t => {
    t.equal(queue.size(), 0);

    queue.enqueue(1);
    t.equal(queue.size(), 1);

    queue.enqueue(2);
    queue.enqueue(3);
    t.equal(queue.size(), 3);

    queue.enqueue(4);
    queue.enqueue(5);
    queue.enqueue(6);
    queue.enqueue(7);
    t.equal(queue.size(), 7);
  });

  t.test("getting elements", async t => {
    t.same(queue.next(), { value: undefined, done: true });
    t.same(queue.next(), { value: undefined, done: true });

    queue.enqueue(1);
    t.same(queue.next(), { value: 1, done: false });
    t.equal(queue.size(), 0);
    t.same(queue.next(), { value: undefined, done: true });
    t.same(queue.next(), { value: undefined, done: true });

    queue.enqueue(2);
    queue.enqueue(3);
    t.same(queue.next(), { value: 2, done: false });
    t.same(queue.next(), { value: 3, done: false });
    t.same(queue.next(), { value: undefined, done: true });

    queue.enqueue(4);
    t.same(queue.next(), { value: 4, done: false });
    t.same(queue.next(), { value: undefined, done: true });
  });

  t.test("clearing", async t => {
    queue.return();
    t.equal(queue.size(), 0);

    queue.enqueue(1);
    queue.enqueue(2);
    t.equal(queue.size(), 2);
    queue.return();
    t.equal(queue.size(), 0);
    t.same(queue.next(), { value: undefined, done: true });
    t.same(queue.next(), { value: undefined, done: true });
  });

  t.test("iterating", async t => {
    t.same([...queue], []);

    queue.enqueue(1);
    t.same([...queue], [1]);
    t.same([...queue], []);

    queue.enqueue(2);
    queue.next();
    t.same([...queue], []);

    queue.enqueue(3);
    queue.enqueue(4);
    queue.enqueue(5);
    t.same([...queue], [3, 4, 5]);
    t.same([...queue], []);
  });

  t.test("instance state not shared", async t => {
    queue.enqueue(1);
    t.equal(new IterableQueue().size(), 0);
    t.same(new IterableQueue().next(), { value: undefined, done: true });
  });
});
