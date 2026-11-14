const BASE = "https://api.sharpapi.io/api/v1";
const KEY_NAMES = ["SHARPAPI_KEY", "SHARPAPI_KEY_2", "SHARPAPI_KEY_3"] as const;
const INVALID_KEY_CODES = new Set([
  "invalid_api_key",
  "expired_api_key",
  "disabled_api_key",
]);
let configuration = "";
let preferredKey = "";
let rejectedKeys = new Set<string>();
let retryAt = 0;

export class SharpApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string
  ) {
    const action =
      code === "tier_restricted"
        ? "Configured SharpAPI account does not have access to this feature. Check the provider plan/add-ons."
        : status === 401
          ? "SharpAPI credentials were rejected. Replace the invalid or expired key in server settings."
          : status === 429
            ? "SharpAPI request limit reached. Wait for the provider's reset window."
            : "SharpAPI request failed. Check provider availability and server settings.";
    super(`${action} (HTTP ${status}, ${code})`);
    this.name = "SharpApiError";
  }
}

export function getSharpApiKeys(): string[] {
  return Array.from(
    new Set(
      KEY_NAMES.map(name => process.env[name]?.trim() ?? "").filter(Boolean)
    )
  );
}
export function hasSharpApiKey(): boolean {
  return getSharpApiKeys().length > 0;
}

async function errorCode(response: Response): Promise<string> {
  try {
    return (await response.clone().json())?.error?.code ?? "upstream_error";
  } catch {
    return "upstream_error";
  }
}

/** All REST and stream requests share this path. Never rotate to bypass 403/429. */
export async function sharpApiRequest(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  // Keep credentials on the one documented upstream, including redirects.
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    new URL(BASE + path).origin !== new URL(BASE).origin
  ) {
    throw new Error("SharpAPI requires a relative API path");
  }
  const keys = getSharpApiKeys();
  const signature = JSON.stringify(keys);
  if (signature !== configuration) {
    configuration = signature;
    preferredKey = "";
    rejectedKeys = new Set();
    retryAt = 0;
  }
  if (!keys.length) throw new SharpApiError(503, "missing_api_key");
  if (Date.now() < retryAt) throw new SharpApiError(429, "rate_limited");
  const candidates = keys
    .filter(key => !rejectedKeys.has(key))
    .sort((a, b) => Number(b === preferredKey) - Number(a === preferredKey));
  if (!candidates.length) throw new SharpApiError(401, "invalid_api_key");
  for (let index = 0; index < candidates.length; index++) {
    const key = candidates[index];
    const headers = new Headers(init.headers);
    headers.delete("Authorization");
    headers.set("X-API-Key", key);
    const response = await fetch(BASE + path, {
      ...init,
      headers,
      redirect: "error",
      signal: init.signal ?? AbortSignal.timeout(10_000),
    });
    if (response.status === 401) {
      const code = await errorCode(response);
      if (INVALID_KEY_CODES.has(code)) {
        rejectedKeys.add(key);
        if (index < candidates.length - 1) {
          await response.body?.cancel();
          continue;
        }
      }
    }
    if (response.ok) preferredKey = key;
    if (response.status === 429) {
      const value = response.headers.get("Retry-After");
      const seconds = value === null ? NaN : Number(value);
      const date = value === null ? NaN : Date.parse(value);
      const reset = Number(response.headers.get("X-RateLimit-Reset")) * 1000;
      retryAt = Number.isFinite(seconds)
        ? Date.now() + Math.max(1, seconds) * 1000
        : Number.isFinite(date)
          ? Math.max(Date.now() + 1000, date)
          : reset > Date.now()
            ? reset
            : Date.now() + 60_000;
    }
    return response;
  }
  throw new SharpApiError(401, "invalid_api_key");
}

/** Error codes are safe; never echo upstream messages, URLs or credentials. */
export async function sharpApiJson(path: string): Promise<any> {
  const response = await sharpApiRequest(path);
  if (!response.ok)
    throw new SharpApiError(response.status, await errorCode(response));
  return response.json();
}
