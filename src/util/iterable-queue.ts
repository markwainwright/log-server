const RETURN_RESULT = { value: undefined, done: true } as const;

interface Node<T> {
  readonly value: T;
  next: Node<T> | null;
}

/** Iterable LIFO queue, implemented as a linked list */
export class IterableQueue<T> {
  #head: Node<T> | null = null;
  #tail: Node<T> | null = null;
  #size = 0;

  enqueue(value: T): void {
    const node = { value, next: null };

    this.#size++;

    if (!this.#tail) {
      this.#head = this.#tail = node;
      return;
    }

    this.#tail.next = node;
    this.#tail = node;
  }

  size() {
    return this.#size;
  }

  next(): IteratorResult<T, void> {
    const head = this.#head;

    if (!head) {
      return RETURN_RESULT;
    }

    this.#size--;

    if (head.next) {
      this.#head = head.next;
    } else {
      this.#head = this.#tail = null;
    }

    return { value: head.value, done: false };
  }

  return(): IteratorReturnResult<void> {
    this.#head = this.#tail = null;
    this.#size = 0;

    return RETURN_RESULT;
  }

  [Symbol.iterator](): Iterator<T, void, void> {
    return this;
  }
}
