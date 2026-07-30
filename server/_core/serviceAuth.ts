/**
 * Shared-secret auth for machine-to-machine endpoints (cron runners, n8n,
 * external schedulers).
 *
 * These endpoints are `publicProcedure` — no session, no user — so the shared
 * secret is the *only* access control on them. That makes a hardcoded fallback
 * value actively dangerous: this repository is public, so any committed
 * default is a published credential that lets anyone invoke the endpoint.
 *
 * Hence: fail closed. If the secret isn't configured in the environment,
 * nothing is accepted and the endpoint is simply unavailable until an
 * operator sets it.
 */
import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a caller-supplied secret against the one
 * configured in the environment.
 *
 * @param provided  Secret sent by the caller.
 * @param expected  Value from `process.env.*`; unset/empty means "not
 *                  configured", which rejects every request.
 * @param label     Env var name, used only for the "not configured" log line.
 */
export function verifyServiceSecret(
  provided: string,
  expected: string | undefined,
  label: string
): boolean {
  if (!expected) {
    console.error(
      `[serviceAuth] ${label} is not configured — refusing request. ` +
        `Set it in the environment to enable this endpoint.`
    );
    return false;
  }

  const providedBuf = Buffer.from(provided, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  // timingSafeEqual throws unless both buffers are the same length. Comparing
  // lengths up front only reveals the secret's length, which isn't secret.
  if (providedBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(providedBuf, expectedBuf);
}
