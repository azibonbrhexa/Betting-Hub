import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function nanoid(size = 21): string {
  const bytes = randomBytes(size);
  let result = "";
  for (let i = 0; i < size; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}
