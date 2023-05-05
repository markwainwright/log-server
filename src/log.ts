import type { AddressInfo } from "node:net";
import { inspect } from "node:util";

import { UniqueValueCounter } from "./unique-value-counter.js";

type CounterObj = object;

const whitespaceForTimestamp = whitespaceFor(new Date());
const uniqueValueTracker = new UniqueValueCounter<CounterObj>(100);

function whitespace(length: number) {
  return Array(length).fill(" ").join("");
}

function whitespaceFor(value: any) {
  return whitespace(inspect(value).length);
}

function log(
  message: any,
  counterObj: CounterObj | null,
  timestamp: Date | null,
  newlineBefore: boolean
) {
  if (newlineBefore) {
    console.log("");
  }

  console.log(
    timestamp ?? whitespaceForTimestamp,

    counterObj ? uniqueValueTracker.get(counterObj) + 1 : whitespaceFor(uniqueValueTracker.count()),

    message
  );
}

/**
 * Logs a message with a timestamp and an optional counter index
 *
 * @param message - The message to print
 * @param counterObj - Print the index of unique values of this object seen (by reference equality).
 *                     100 values are tracked concurrently, so indices will be inaccurate if >100
 *                     unique values are being logged at the same time.
 */
export function logPrimary(message: any, counterObj?: CounterObj) {
  log(message, counterObj ?? null, new Date(), true);
}

/**
 * Logs a message with no timestamp or counter index
 *
 * @param message - The message to print
 * @param newlineBefore - Whether to print a newline before the log message
 */
export function logSecondary(message: any, newlineBefore?: boolean) {
  log(message, null, null, newlineBefore ?? false);
}

export function formatAddress(protocol: string, address: AddressInfo | string | null) {
  if (address === null) {
    return "";
  }

  if (typeof address === "string") {
    // Unix socket
    return address;
  }

  if (address.family === "IPv6") {
    return `${protocol}://[${address.address}]:${address.port}`;
  }

  return `${protocol}://${address.address}:${address.port}`;
}
