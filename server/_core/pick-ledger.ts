/**
 * Pick Ledger — immutable pre-game lock + public verification helpers.
 *
 * Flow:
 *   1. On publish (before game start): lockPayload → INSERT pick_ledger
 *   2. After lock: hashed fields must not change
 *   3. On settle: gradeLedgerEntry writes closingLine, clvValue, result
 *   4. Public: getLedgerByHash powers /verify/:hash
 */
import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export interface LedgerLockFields {
  pickId: number;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  pickType?: string | null;
  lineAtLock?: number | null;
  oddsAtLock?: number | null;
  gameStartAt?: string | null;
  confidenceScore?: number | null;
}

const CANONICAL_KEYS: (keyof LedgerLockFields)[] = [
  "pickId",
  "sportKey",
  "homeTeam",
  "awayTeam",
  "recommendation",
  "pickType",
  "lineAtLock",
  "oddsAtLock",
  "gameStartAt",
  "confidenceScore",
];

export function buildCanonicalPayload(fields: LedgerLockFields): string {
  const ordered: Record<string, unknown> = {};
  for (const key of CANONICAL_KEYS) {
    const v = fields[key];
    if (v === undefined) continue;
    ordered[key] = v === null ? null : v;
  }
  return JSON.stringify(ordered);
}

export function hashLedgerPayload(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

export function lockPayload(fields: LedgerLockFields): {
  canonicalJson: string;
  contentHash: string;
} {
  const canonicalJson = buildCanonicalPayload(fields);
  return { canonicalJson, contentHash: hashLedgerPayload(canonicalJson) };
}

function extractInsertId(result: unknown): number | null {
  if (!result) return null;
  const r = result as any;
  const id = r.insertId ?? r[0]?.insertId ?? r[0]?.[0]?.insertId ?? null;
  return id !== null ? Number(id) : null;
}

/**
 * Commit a published pick to the ledger. Fire-and-forget safe — never throws.
 * Returns hash + lockedAt on success.
 */
export async function commitPickToLedger(
  fields: LedgerLockFields,
  opts?: { isPublic?: boolean }
): Promise<{ contentHash: string; lockedAt: Date } | null> {
  try {
    if (fields.gameStartAt) {
      const start = new Date(fields.gameStartAt).getTime();
      if (!Number.isNaN(start) && Date.now() >= start) {
        console.warn(
          `[PickLedger] refuse lock for pick ${fields.pickId}: game already started`
        );
        return null;
      }
    }

    const { canonicalJson, contentHash } = lockPayload(fields);
    const lockedAt = new Date();
    const db = await getDb();
    if (!db) return null;

    const isPublic = opts?.isPublic === false ? 0 : 1;

    await db.execute(sql`
      INSERT INTO pick_ledger
        (pickId, contentHash, lockedAt, gameStartAt, payloadJson, recommendation,
         sportKey, homeTeam, awayTeam, lineAtLock, isPublic)
      VALUES
        (${fields.pickId}, ${contentHash}, ${lockedAt},
         ${fields.gameStartAt ? new Date(fields.gameStartAt) : null},
         CAST(${canonicalJson} AS JSON),
         ${fields.recommendation}, ${fields.sportKey}, ${fields.homeTeam},
         ${fields.awayTeam}, ${fields.lineAtLock ?? null}, ${isPublic})
      ON DUPLICATE KEY UPDATE pickId = pickId
    `);

    console.warn(
      `[PickLedger] locked pick ${fields.pickId} hash=${contentHash.slice(0, 12)}…`
    );
    return { contentHash, lockedAt };
  } catch (err) {
    console.warn("[PickLedger] commit failed:", (err as Error)?.message ?? err);
    return null;
  }
}

/** Convenience: lock from a freshly inserted picks row shape. */
export async function commitPickRowToLedger(pick: {
  id: number;
  sportKey: string;
  homeTeam: string | null;
  awayTeam: string | null;
  recommendation: string | null;
  pickType?: string | null;
  odds?: number | null;
  confidenceScore?: number | null;
  pickDate?: string | null;
  tier?: string | null;
}): Promise<{ contentHash: string; lockedAt: Date } | null> {
  if (!pick.id || !pick.recommendation || !pick.homeTeam || !pick.awayTeam) {
    return null;
  }
  return commitPickToLedger(
    {
      pickId: pick.id,
      sportKey: pick.sportKey,
      homeTeam: pick.homeTeam,
      awayTeam: pick.awayTeam,
      recommendation: pick.recommendation,
      pickType: pick.pickType ?? null,
      oddsAtLock: pick.odds ?? null,
      confidenceScore: pick.confidenceScore ?? null,
      gameStartAt: pick.pickDate ? `${pick.pickDate}T23:59:59.000Z` : null,
    },
    { isPublic: pick.tier === "free" || pick.tier === "premium" }
  );
}

export async function getLedgerByHash(contentHash: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db.execute(sql`
      SELECT pickId, contentHash, lockedAt, gameStartAt, payloadJson,
             recommendation, sportKey, homeTeam, awayTeam, lineAtLock,
             closingLine, clvValue, result, gradedAt
      FROM pick_ledger
      WHERE contentHash = ${contentHash} AND isPublic = 1
      LIMIT 1
    `);

    const list = (rows as any)[0] ?? rows;
    const row = Array.isArray(list) ? list[0] : list;
    return row ?? null;
  } catch (err) {
    console.warn(
      "[PickLedger] getByHash failed:",
      (err as Error)?.message ?? err
    );
    return null;
  }
}

export async function gradeLedgerEntry(
  pickId: number,
  data: {
    closingLine?: number | null;
    clvValue?: number | null;
    result: "win" | "loss" | "push" | "void";
  }
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.execute(sql`
      UPDATE pick_ledger
      SET closingLine = COALESCE(${data.closingLine ?? null}, closingLine),
          clvValue = COALESCE(${data.clvValue ?? null}, clvValue),
          result = ${data.result},
          gradedAt = CURRENT_TIMESTAMP
      WHERE pickId = ${pickId} AND result = 'pending'
    `);
    return true;
  } catch (err) {
    console.warn("[PickLedger] grade failed:", (err as Error)?.message ?? err);
    return false;
  }
}

export { extractInsertId };
