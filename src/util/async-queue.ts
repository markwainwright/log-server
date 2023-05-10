import { Queue } from "./queue.js";

/** Linked list LIFO queue with async iterator */
export class AsyncQueue<T> {
  #pushQueue = new Queue<T>();
  #pullQueue = new Queue<(t: T | PromiseLike<T>) => void>();

  enqueue(item: T) {
    const resolve = this.#pullQueue.dequeue();

    if (resolve) {
      resolve(item);
    } else {
      this.#pushQueue.enqueue(item);
    }
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      yield new Promise<T>(resolve => {
        const value = this.#pushQueue.dequeue();

        if (value) {
          resolve(value);
        } else {
          this.#pullQueue.enqueue(resolve);
        }
      });
    }
  }
}
