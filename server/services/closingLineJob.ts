/**
 * Closing Line Job — fills pick_ledger.closingLine + clvValue after lock.
 *
 * Runs after games approach start / after settle. Uses live odds API when
 * available; falls back to the pick's own odds as a neutral CLV=0 close so
 * the skill series still has structure until true closes are wired.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { estimateClvFromAmericanOdds } from "../_core/clv-skill";
import { fetchOdds } from "./dataService";

export async function runClosingLineJob(): Promise<{ updated: number }> {
  const db = await getDb();
  if (!db) return { updated: 0 };

  let updated = 0;

  try {
    // Pending ledger rows that have a result or are past game start and still lack CLV
    const rows = await db.execute(sql`
      SELECT pl.id, pl.pickId, pl.sportKey, pl.homeTeam, pl.awayTeam,
             pl.recommendation, pl.lineAtLock, p.odds AS pickOdds, p.pickType
      FROM pick_ledger pl
      JOIN picks p ON p.id = pl.pickId
      WHERE pl.clvValue IS NULL
        AND (
          pl.result IN ('win', 'loss', 'push')
          OR (pl.gameStartAt IS NOT NULL AND pl.gameStartAt <= NOW())
        )
      ORDER BY pl.id DESC
      LIMIT 100
    `);

    const list: any[] = Array.isArray((rows as any)[0])
      ? (rows as any)[0]
      : Array.isArray(rows)
        ? (rows as any)
        : [];

    for (const row of list) {
      try {
        const oddsAtLock =
          row.lineAtLock !== null
            ? Number(row.lineAtLock)
            : row.pickOdds !== null
              ? Number(row.pickOdds)
              : null;

        let closingOdds: number | null = null;

        // Best-effort: scan current book odds for a matching event (post-close this may be empty)
        if (row.sportKey && row.homeTeam) {
          try {
            const events = await fetchOdds(String(row.sportKey));
            const event = events.find(
              e =>
                e.homeTeam
                  ?.toLowerCase()
                  .includes(
                    String(row.homeTeam).toLowerCase().split(" ").pop() || "___"
                  ) ||
                String(row.homeTeam)
                  .toLowerCase()
                  .includes(e.homeTeam?.toLowerCase().split(" ").pop() || "___")
            );
            const book = event?.bookmakers?.[0];
            const h2h = book?.markets?.find((m: any) => m.key === "h2h");
            const outcome = h2h?.outcomes?.[0];
            if (outcome && outcome.price !== null)
              closingOdds = Number(outcome.price);
          } catch {
            /* ignore per-row odds failures */
          }
        }

        // Neutral fallback: treat close == lock so skill doesn't invent edge
        if (closingOdds === null && oddsAtLock !== null) {
          closingOdds = oddsAtLock;
        }

        if (oddsAtLock === null || closingOdds === null) continue;

        const clv = estimateClvFromAmericanOdds(oddsAtLock, closingOdds);

        await db.execute(sql`
          UPDATE pick_ledger
          SET closingLine = ${closingOdds},
              clvValue = ${clv},
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ${row.id} AND clvValue IS NULL
        `);
        updated++;
      } catch (err) {
        console.warn(
          "[ClosingLine] row failed:",
          row?.pickId,
          (err as Error)?.message ?? err
        );
      }
    }
  } catch (err) {
    console.warn("[ClosingLine] job failed:", (err as Error)?.message ?? err);
  }

  console.warn(`[ClosingLine] updated ${updated} ledger rows`);
  return { updated };
}
