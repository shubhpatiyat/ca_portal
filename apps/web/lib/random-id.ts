export function randomId(): string {
  const availableCrypto = globalThis.crypto;
  if (availableCrypto && typeof availableCrypto.randomUUID === "function") {
    return availableCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (availableCrypto && typeof availableCrypto.getRandomValues === "function") {
    availableCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}
