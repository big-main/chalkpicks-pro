/**
 * CLV Skill Rating — chess-style skill derived only from Closing Line Value.
 *
 * Why CLV (not win rate):
 *   Wins are noisy; beating the close is the accepted proxy for long-term edge.
 *   Rating moves only when a pick is graded with a measurable CLV.
 *
 * Model rating (platform):
 *   Starts at 1500. Each graded ledger pick adjusts rating by
 *     Δ = K * tanh(clvPercent / SCALE)
 *   where clvPercent is percentage points vs the close (e.g. +2.5 = 2.5%).
 *
 * Display:
 *   Integer skill + graded sample size + avg CLV. Public, citable, hard to fake.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export const CLV_SKILL_BASE = 1500;
export const CLV_SKILL_K = 16; // max move per pick at extreme CLV
export const CLV_SKILL_SCALE = 4; // tanh soft-caps around ±4%

export interface ClvSkillSnapshot {
  skillRating: number;
  gradedPicks: number;
  avgClv: number | null;
  positiveClvRate: number | null; // 0–100
  lastGradedAt: string | null;
  tier: "unranked" | "developing" | "solid" | "sharp" | "elite";
}

export function tierFromSkill(
  skill: number,
  n: number
): ClvSkillSnapshot["tier"] {
  if (n < 20) return "unranked";
  if (skill >= 1700) return "elite";
  if (skill >= 1600) return "sharp";
  if (skill >= 1520) return "solid";
  return "developing";
}

/** Single-pick rating delta from CLV percentage points. */
export function clvRatingDelta(clvPercent: number): number {
  return CLV_SKILL_K * Math.tanh(clvPercent / CLV_SKILL_SCALE);
}

/** Replay a sequence of CLV values into a skill rating (order matters lightly). */
export function skillFromClvSeries(clvValues: number[]): number {
  let skill = CLV_SKILL_BASE;
  for (const clv of clvValues) {
    if (!Number.isFinite(clv)) continue;
    skill += clvRatingDelta(clv);
  }
  return Math.round(skill);
}

/**
 * Platform model skill from pick_ledger graded rows.
 * Fail-open: returns unranked defaults if table missing / empty.
 */
export async function getModelClvSkill(): Promise<ClvSkillSnapshot> {
  const empty: ClvSkillSnapshot = {
    skillRating: CLV_SKILL_BASE,
    gradedPicks: 0,
    avgClv: null,
    positiveClvRate: null,
    lastGradedAt: null,
    tier: "unranked",
  };

  try {
    const db = await getDb();
    if (!db) return empty;

    const rows = await db.execute(sql`
      SELECT clvValue, gradedAt
      FROM pick_ledger
      WHERE result IN ('win', 'loss', 'push')
        AND clvValue IS NOT NULL
      ORDER BY gradedAt ASC, id ASC
      LIMIT 5000
    `);

    const list: any[] = Array.isArray((rows as any)[0])
      ? (rows as any)[0]
      : Array.isArray(rows)
        ? (rows as any)
        : [];

    if (list.length === 0) return empty;

    const clvs = list
      .map(r => Number(r.clvValue))
      .filter(v => Number.isFinite(v));

    if (clvs.length === 0) return empty;

    const skillRating = skillFromClvSeries(clvs);
    const avgClv =
      Math.round((clvs.reduce((a, b) => a + b, 0) / clvs.length) * 100) / 100;
    const positiveClvRate =
      Math.round((clvs.filter(v => v > 0).length / clvs.length) * 1000) / 10;
    const last = list[list.length - 1]?.gradedAt;
    const lastGradedAt = last ? new Date(last).toISOString() : null;

    return {
      skillRating,
      gradedPicks: clvs.length,
      avgClv,
      positiveClvRate,
      lastGradedAt,
      tier: tierFromSkill(skillRating, clvs.length),
    };
  } catch (err) {
    console.warn(
      "[ClvSkill] getModelClvSkill failed:",
      (err as Error)?.message ?? err
    );
    return empty;
  }
}

/**
 * Estimate CLV when only open odds and a rough close are known.
 * American odds → implied fair-ish edge in percentage points (crude).
 * Positive = locked odds better than close for the bettor.
 */
export function estimateClvFromAmericanOdds(
  oddsAtLock: number,
  closingOdds: number
): number {
  const implied = (o: number) =>
    o > 0 ? 100 / (o + 100) : Math.abs(o) / (Math.abs(o) + 100);
  const lockImp = implied(oddsAtLock);
  const closeImp = implied(closingOdds);
  // Better price at lock ⇒ lower implied for same side ⇒ positive CLV
  return Math.round((closeImp - lockImp) * 10000) / 100; // percentage points
}
