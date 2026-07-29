/**
 * Game Results Resolver
 *
 * Fetches final scores from ESPN and resolves pending picks.
 * Also grades pick_ledger rows so CLV Skill Rating can update.
 */
import { getDb } from "../db";
import { picks, games } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { fetchLiveScores } from "./dataService";
import { gradeLedgerEntry } from "../_core/pick-ledger";

interface GameResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

export async function resolveGameResults(): Promise<{
  resolved: number;
  wins: number;
  losses: number;
  pushes: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db)
    return {
      resolved: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      errors: ["Database unavailable"],
    };

  const errors: string[] = [];
  let wins = 0,
    losses = 0,
    pushes = 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const pendingPicks = await db
    .select()
    .from(picks)
    .where(
      and(
        eq(picks.result, "pending"),
        eq(picks.isActive, true),
        sql`${picks.pickDate} >= ${sevenDaysAgoStr}`
      )
    );

  if (pendingPicks.length === 0) {
    return { resolved: 0, wins: 0, losses: 0, pushes: 0, errors: [] };
  }

  const sports = Array.from(new Set(pendingPicks.map(p => p.sportKey)));
  const allFinalGames: GameResult[] = [];

  for (const sport of sports) {
    try {
      const scores = await fetchLiveScores(sport);
      const finals = scores.filter(s => s.status === "final");
      allFinalGames.push(
        ...finals.map(s => ({
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          homeScore: s.homeScore,
          awayScore: s.awayScore,
          status: s.status,
        }))
      );
    } catch (err) {
      errors.push(
        `Failed to fetch scores for ${sport}: ${(err as Error).message}`
      );
    }
  }

  for (const pick of pendingPicks) {
    const matchingGame = allFinalGames.find(
      g =>
        (g.homeTeam
          .toLowerCase()
          .includes(pick.homeTeam?.toLowerCase().split(" ").pop() || "___") ||
          pick.homeTeam
            ?.toLowerCase()
            .includes(g.homeTeam.toLowerCase().split(" ").pop() || "___")) &&
        (g.awayTeam
          .toLowerCase()
          .includes(pick.awayTeam?.toLowerCase().split(" ").pop() || "___") ||
          pick.awayTeam
            ?.toLowerCase()
            .includes(g.awayTeam.toLowerCase().split(" ").pop() || "___"))
    );

    if (!matchingGame) continue;

    try {
      const result = determinePickResult(pick, matchingGame);
      if (result) {
        await db.update(picks).set({ result }).where(eq(picks.id, pick.id));

        // Grade immutable ledger (CLV may be null until closing-line job lands)
        void gradeLedgerEntry(pick.id, {
          result,
          closingLine: null,
          clvValue: null,
        }).catch(e => console.warn("[GameResults] ledger grade failed:", e));

        if (result === "win") wins++;
        else if (result === "loss") losses++;
        else if (result === "push") pushes++;
      }
    } catch (err) {
      errors.push(
        `Failed to resolve pick ${pick.id}: ${(err as Error).message}`
      );
    }
  }

  const resolved = wins + losses + pushes;
  console.warn(
    `[GameResults] Resolved ${resolved} picks: ${wins}W / ${losses}L / ${pushes}P`
  );
  return { resolved, wins, losses, pushes, errors };
}

function determinePickResult(
  pick: typeof picks.$inferSelect,
  game: GameResult
): "win" | "loss" | "push" | null {
  const { pickType, recommendation, homeTeam } = pick;
  const { homeScore, awayScore } = game;
  const scoreDiff = homeScore - awayScore;
  const totalScore = homeScore + awayScore;

  if (!recommendation) return null;
  const rec = recommendation.toLowerCase();

  switch (pickType) {
    case "moneyline": {
      const pickedHome = rec.includes(
        homeTeam?.toLowerCase().split(" ").pop() || "___"
      );
      if (pickedHome) {
        return scoreDiff > 0 ? "win" : scoreDiff < 0 ? "loss" : "push";
      } else {
        return scoreDiff < 0 ? "win" : scoreDiff > 0 ? "loss" : "push";
      }
    }

    case "spread": {
      const spreadMatch = rec.match(/([+-]?\d+\.?\d*)/);
      if (!spreadMatch) return null;
      const spread = parseFloat(spreadMatch[1]);
      const pickedHome = rec.includes(
        homeTeam?.toLowerCase().split(" ").pop() || "___"
      );
      const adjustedDiff = pickedHome
        ? scoreDiff + spread
        : -scoreDiff + spread;
      if (adjustedDiff > 0) return "win";
      if (adjustedDiff < 0) return "loss";
      return "push";
    }

    case "over_under": {
      const totalMatch = rec.match(/(\d+\.?\d*)/);
      if (!totalMatch) return null;
      const line = parseFloat(totalMatch[1]);
      const isOver = rec.includes("over");
      if (isOver) {
        return totalScore > line ? "win" : totalScore < line ? "loss" : "push";
      } else {
        return totalScore < line ? "win" : totalScore > line ? "loss" : "push";
      }
    }

    case "player_prop":
      return null;

    default:
      return null;
  }
}

export async function syncGameScores(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const sports = ["nfl", "nba", "mlb", "nhl"];
  let synced = 0;

  for (const sport of sports) {
    try {
      const scores = await fetchLiveScores(sport);
      for (const score of scores) {
        const existing = await db
          .select()
          .from(games)
          .where(eq(games.externalId, score.id))
          .limit(1);

        const statusMap: Record<
          string,
          "scheduled" | "live" | "final" | "postponed" | "cancelled"
        > = {
          scheduled: "scheduled",
          in_progress: "live",
          final: "final",
          postponed: "postponed",
        };

        if (existing.length > 0) {
          await db
            .update(games)
            .set({
              homeScore: score.homeScore,
              awayScore: score.awayScore,
              status: statusMap[score.status] || "scheduled",
            })
            .where(eq(games.id, existing[0].id));
        } else {
          await db.insert(games).values({
            externalId: score.id,
            sportKey: sport,
            homeTeamName: score.homeTeam,
            awayTeamName: score.awayTeam,
            homeScore: score.homeScore,
            awayScore: score.awayScore,
            status: statusMap[score.status] || "scheduled",
            gameTime: new Date(score.startTime || Date.now()),
          });
        }
        synced++;
      }
    } catch (err) {
      console.error(
        `[GameSync] Error syncing ${sport}:`,
        (err as Error).message
      );
    }
  }

  return synced;
}
