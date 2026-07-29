/**
 * Import this FIRST from the bundled server entry if needed.
 * package.json start already runs prod-start-guard.mjs.
 * This module hardens process.env checks for any alternative entry.
 */
import { runBootGuards } from "./boot-env";

try {
  runBootGuards();
} catch (e) {
  console.error("[index-boot]", e);
  if (process.env.NODE_ENV === "production") process.exit(1);
}
