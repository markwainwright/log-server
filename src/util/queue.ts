class Node<T> {
  readonly value: T;
  next: Node<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
  }
}

/** Linked list LIFO queue */
export class Queue<T> {
  #head: Node<T> | null = null;
  #tail: Node<T> | null = null;

  enqueue(value: T) {
    const node = new Node(value);

    if (!this.#tail) {
      this.#head = this.#tail = node;
      return;
    }

    this.#tail.next = node;
    this.#tail = node;
  }

  dequeue(): T | undefined {
    const head = this.#head;

    if (!head) {
      return;
    }

    this.#head = head.next;

    if (!head.next) {
      this.#tail = null;
    }

    return head.value;
  }
}
