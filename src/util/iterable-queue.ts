const RETURN_RESULT = { value: undefined, done: true } as const;

class Node<T> {
  readonly value: T;
  next: Node<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

/** Iterable LIFO queue, implemented as a linked list */
export class IterableQueue<T> {
  #head: Node<T> | null = null;
  #tail: Node<T> | null = null;

  enqueue(value: T): void {
    const node = new Node(value);

    if (!this.#tail) {
      this.#head = this.#tail = node;
      return;
    }

    this.#tail.next = node;
    this.#tail = node;
  }

  next(): IteratorResult<T, void> {
    const head = this.#head;

    if (!head) {
      return RETURN_RESULT;
    }

    if (head.next) {
      this.#head = head.next;
    } else {
      this.#head = this.#tail = null;
    }

    return { value: head.value, done: false };
  }

  return(): IteratorReturnResult<void> {
    this.#head = this.#tail = null;

    return RETURN_RESULT;
  }

  [Symbol.iterator](): Iterator<T, void, void> {
    return this;
  }
}
