import { IterableQueue } from "./iterable-queue.js";

const RETURN_RESULT = { value: undefined, done: true } as const;

/** Async iterable LIFO queue, implemented with linked lists */
export class AsyncIterableQueue<T> {
  #done = false;
  #pushQueue = new IterableQueue<T>();
  #pullQueue = new IterableQueue<(r: IteratorResult<T, void>) => void>(); // promise resolve fns

  enqueue(item: T): void {
    const nextPull = this.#pullQueue.next();

    if (nextPull.done) {
      this.#pushQueue.enqueue(item);
      return;
    }

    nextPull.value({ value: item, done: false });
  }

  next(): Promise<IteratorResult<T, void>> {
    if (this.#done) {
      return Promise.resolve(RETURN_RESULT);
    }

    const nextPush = this.#pushQueue.next();

    if (nextPush.done) {
      return new Promise(resolve => this.#pullQueue.enqueue(resolve));
    }

    return Promise.resolve({ value: nextPush.value, done: false });
  }

  return(): Promise<IteratorResult<T, void>> {
    this.#done = true;

    this.#pushQueue.return();

    for (const resolve of this.#pullQueue) {
      resolve(RETURN_RESULT);
    }

    return Promise.resolve(RETURN_RESULT);
  }

  [Symbol.asyncIterator](): AsyncIterator<T, void, void> {
    return this;
  }
}
