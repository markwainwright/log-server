import type { Socket } from "node:net";
import { inspect } from "node:util";

import { UniqueValueCounter } from "./unique-value-counter.js";

const whitespaceForTimestamp = whitespaceFor(new Date());
const uniqueValueCounter = new UniqueValueCounter<string>(100);

function whitespace(length: number) {
  return Array(length).fill(" ").join("");
}

function whitespaceFor(value: any) {
  return whitespace(inspect(value).length);
}

function log(
  message: string,
  socket: Socket | null,
  timestamp: Date | null,
  newlineBefore: boolean
) {
  if (newlineBefore) {
    console.log("");
  }

  // Using the remote address and port instead of the socket object itself because with HTTPS, some
  // events receive a TLSSocket and some receive a Socket, and these are not equal by reference.
  const counterObj = socket ? `${socket.remoteAddress}:${socket.remotePort}` : null;

  console.log(
    timestamp ?? whitespaceForTimestamp,
    counterObj ? uniqueValueCounter.get(counterObj) + 1 : whitespaceFor(uniqueValueCounter.count()),
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
export function logPrimary(message: string, socket?: Socket) {
  log(message, socket ?? null, new Date(), true);
}

/**
 * Logs a message with no timestamp or counter index
 *
 * @param message - The message to print
 * @param newlineBefore - Whether to print a newline before the log message
 */
export function logSecondary(message: string, newlineBefore?: boolean) {
  log(message, null, null, newlineBefore ?? false);
}
