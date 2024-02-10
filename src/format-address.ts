import type { AddressInfo } from "node:net";

export function formatAddress(address: AddressInfo | string | null, protocol?: string) {
  if (address === null) {
    return "";
  }

  if (typeof address === "string") {
    // Unix socket
    return address;
  }

  const formattedProtocol = protocol ? `${protocol}://` : "";

  if (address.family === "IPv6") {
    return `${formattedProtocol}[${address.address}]:${address.port}`;
  }

  return `${formattedProtocol}${address.address}:${address.port}`;
}
