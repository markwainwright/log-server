interface Node<T> {
  readonly value: T;
  next: Node<T> | null;
}

const DONE_RESULT: IteratorReturnResult<void> = { value: undefined, done: true };

/**
 * Iterable iterator FIFO queue. Implemented as a linked list.
 */
export class Queue<T> implements Iterator<T, void, void>, Iterable<T> {
  #head: Node<T> | null = null;
  #tail: Node<T> | null = null;
  #size = 0;

  enqueue(...values: T[]): void {
    for (const value of values) {
      const node = { value, next: null };

      if (this.#tail) {
        this.#tail.next = node;
        this.#tail = node;
      } else {
        this.#head = this.#tail = node;
      }
    }

    this.#size += values.length;
  }

  getSize(): number {
    return this.#size;
  }

  /** Delete all values in queue */
  purge(): void {
    this.#head = this.#tail = null;
    this.#size = 0;
  }

  next(): IteratorResult<T, void> {
    if (!this.#head) {
      return DONE_RESULT;
    }

    this.#size--;

    const { value } = this.#head;

    if (this.#head.next) {
      this.#head = this.#head.next;
    } else {
      this.#head = this.#tail = null;
    }

    return { value, done: false };
  }

  [Symbol.iterator]() {
    return this;
  }
}
