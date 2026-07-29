/** Side-effect free boot helpers imported early from index.ts */
import { assertProductionSecrets } from "./env";

export function runBootGuards(): void {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required but not set");
  }
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.JWT_SECRET?.length ?? 0) < 32
  ) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  assertProductionSecrets();
}
