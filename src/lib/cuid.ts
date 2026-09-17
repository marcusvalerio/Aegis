import { randomUUID } from "crypto";

export function cuid(): string {
  return randomUUID();
}
