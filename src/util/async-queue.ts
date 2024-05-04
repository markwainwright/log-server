import { Queue } from "./queue.js";

const DONE_RESULT: IteratorReturnResult<void> = { value: undefined, done: true };

/**
 * Async iterable iterator FIFO queue where values are delivered exactly-once. Implemented as two
 * linked lists.
 */
export class AsyncQueue<T> implements AsyncIterator<T, void, void>, AsyncIterable<T>, Iterable<T> {
  /** Queued values not received by consumers yet */
  #values = new Queue<T>();

  /** Queued resolve functions of promises returned by `next() when values queue was empty `*/
  #nexts = new Queue<(r: IteratorResult<T, void>) => void>();

  #ended = false;

  enqueue(...values: T[]): void {
    if (this.#ended) {
      throw new Error("Cannot enqueue values after the queue has ended");
    }

    if (values.length === 0) {
      return;
    }

    for (const value of values) {
      const [next] = this.#nexts;

      if (next) {
        next({ value, done: false });
      } else {
        this.#values.enqueue(value);
      }
    }
  }

  getSize(): number {
    return this.#values.getSize();
  }

  purge(): void {
    this.#values.purge();
  }

  end(): void {
    this.purge();

    for (const next of this.#nexts) {
      next(DONE_RESULT);
    }

    this.#ended = true;
  }

  next(): Promise<IteratorResult<T, void>> {
    if (this.#ended) {
      return Promise.resolve(DONE_RESULT);
    }

    const [value] = this.#values;
    if (value !== undefined) {
      return Promise.resolve({ value, done: false });
    }

    return new Promise(resolve => this.#nexts.enqueue(resolve));
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  [Symbol.iterator]() {
    return this.#values;
  }
}
