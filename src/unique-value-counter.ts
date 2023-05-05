type Index = number;

export class UniqueValueCounter<V> {
  #map: Map<V, Index>;
  #maxValues: number;
  #evictedValueCount = 0;

  /**
   * Creates an instance of `UniqueValueCounter`, which can be used to track the index of unique
   * values in the order in which they were first seen (using reference equality).

   * @param maxValues - Limit the number of values concurrently stored. When this limit is reached,
   *                    the oldest value will be evicted and will receive an incremented index if
   *                    passed to `.get()` again.
   */
  constructor(maxValues: number) {
    this.#map = new Map();
    this.#maxValues = maxValues;
  }

  /**
   * @returns the index of `value` in the order in which it was first seen.
   *
   * @example
   * ```ts
   * const uniqueValueCounter = new UniqueValueCounter(3);
   * uniqueValueCounter.get("a") // 0
   * uniqueValueCounter.get("a") // 0
   * uniqueValueCounter.get("b") // 1
   * uniqueValueCounter.get("c") // 2
   * uniqueValueCounter.get("d") // 3
   * uniqueValueCounter.get("a") // 4
   * ```
   */
  get(value: V): Index {
    const existingValueIndex = this.#map.get(value);
    if (existingValueIndex !== undefined) {
      return existingValueIndex;
    }

    if (this.#map.size === this.#maxValues) {
      this.#map.delete(this.#map.keys().next().value);
      this.#evictedValueCount++;
    }

    const newValueIndex = this.count();
    this.#map.set(value, newValueIndex);
    return newValueIndex;
  }

  /**
   * @returns the number of values that have ever been seen (which may be greater than `maxValues`).
   * This is equivalent to the index of the last unique value seen + 1.
   */
  count(): number {
    return this.#map.size + this.#evictedValueCount;
  }
}
