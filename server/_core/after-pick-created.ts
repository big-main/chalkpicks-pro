/**
 * Shared post-insert hook: lock pick into immutable ledger.
 * Use after every successful picks table insert (scheduler + generateAI).
 */
import { commitPickRowToLedger, extractInsertId } from "./pick-ledger";

export type PickInsertShape = {
  id?: number;
  sportKey: string;
  homeTeam: string | null;
  awayTeam: string | null;
  recommendation: string | null;
  pickType?: string | null;
  odds?: number | null;
  confidenceScore?: number | null;
  pickDate?: string | null;
  tier?: string | null;
};

/**
 * @param insertResult — raw drizzle/mysql insert result
 * @param fields — row fields used for hash (id filled from insert if missing)
 */
export async function afterPickCreated(
  insertResult: unknown,
  fields: PickInsertShape
): Promise<number | null> {
  const id =
    fields.id ??
    extractInsertId(insertResult) ??
    (insertResult as { insertId?: number })?.insertId ??
    null;

  if (id === null || id === undefined || !Number.isFinite(Number(id))) {
    console.warn("[afterPickCreated] no insertId — ledger skipped");
    return null;
  }

  const pickId = Number(id);
  void commitPickRowToLedger({
    id: pickId,
    sportKey: fields.sportKey,
    homeTeam: fields.homeTeam,
    awayTeam: fields.awayTeam,
    recommendation: fields.recommendation,
    pickType: fields.pickType,
    odds: fields.odds,
    confidenceScore: fields.confidenceScore,
    pickDate: fields.pickDate,
    tier: fields.tier,
  }).catch(e => console.warn("[afterPickCreated] ledger failed:", e));

  return pickId;
}
