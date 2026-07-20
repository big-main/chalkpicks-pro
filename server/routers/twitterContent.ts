import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";

const SPORT_EMOJIS: Record<string, string> = {
  americanfootball_nfl: "🏈",
  basketball_nba: "🏀",
  baseball_mlb: "⚾",
  icehockey_nhl: "🏒",
  soccer_epl: "⚽",
  soccer_usa_mls: "⚽",
  mma_mixed_martial_arts: "🥊",
  tennis_atp: "🎾",
  golf_masters_tournament_winner: "⛳",
  default: "🎯",
};

function getSportEmoji(sportKey: string): string {
  return SPORT_EMOJIS[sportKey] ?? SPORT_EMOJIS.default;
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function formatOdds(odds: number | null | undefined): string {
  if (!odds) return "N/A";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const twitterContentRouter = router({
  getDailyContent: publicProcedure
    .input(
      z.object({
        type: z.enum(["morning", "afternoon", "evening", "night"]),
        secret: z.string(),
      })
    )
    .query(async ({ input }) => {
      const expectedSecret = process.env.TWITTER_CONTENT_SECRET ?? "chalkpicks-twitter-2026";
      if (input.secret !== expectedSecret) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const today = getTodayDateStr();
      const yesterday = getYesterdayDateStr();
      const tomorrow = getTomorrowDateStr();

      if (input.type === "morning") {
        const topPick = await db
          .select()
          .from(picks)
          .where(and(eq(picks.pickDate, today), eq(picks.tier, "free"), eq(picks.isActive, true)))
          .orderBy(desc(picks.confidenceScore))
          .limit(1)
          .then((r: typeof picks.$inferSelect[]) => r[0]);

        if (!topPick) {
          return {
            tweet: `🎯 ChalkPicks Free Daily Pick\n\nNo games scheduled today — but our AI is analyzing tomorrow's slate.\n\n📊 Track our record: chalkpicks.live/picks\n\n#SportsBetting #FreePick #ChalkPicks`,
            type: "morning",
          };
        }

        const emoji = getSportEmoji(topPick.sportKey);
        const bar = getConfidenceBar(topPick.confidenceScore);
        const odds = formatOdds(topPick.odds);
        const sportTag = topPick.sportKey.split("_")[1]?.toUpperCase() ?? "SPORTS";

        const tweet = `${emoji} FREE DAILY PICK\n\n🏆 ${topPick.pickType.toUpperCase()}: ${topPick.homeTeam ?? ""} vs ${topPick.awayTeam ?? ""}\n📈 Confidence: ${bar} ${topPick.confidenceScore}%\n💰 Odds: ${odds}\n\n${(topPick.recommendation ?? "").slice(0, 100)}...\n\n🔓 Full analysis: chalkpicks.live/picks\n\n#FreePick #SportsBetting #ChalkPicks #${sportTag}`;

        return { tweet: tweet.slice(0, 280), type: "morning", pickId: topPick.id };
      }

      if (input.type === "afternoon") {
        const topEdgePick = await db
          .select()
          .from(picks)
          .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
          .orderBy(desc(picks.edgeScore))
          .limit(1)
          .then((r: typeof picks.$inferSelect[]) => r[0]);

        if (!topEdgePick) {
          return {
            tweet: `🔥 SHARP MONEY ALERT\n\nOur steam move detector is scanning 40+ sportsbooks for line movement right now.\n\n⚡ Get real-time alerts: chalkpicks.live/sharp-money\n\n#SharpMoney #SteamMove #SportsBetting #ChalkPicks`,
            type: "afternoon",
          };
        }

        const emoji = getSportEmoji(topEdgePick.sportKey);
        const edgeScore = Number(topEdgePick.edgeScore ?? 0);
        const edgeDisplay = edgeScore > 0 ? `+${edgeScore.toFixed(1)}%` : `${edgeScore.toFixed(1)}%`;

        const tweet = `🔥 SHARP MONEY ALERT ${emoji}\n\n${topEdgePick.homeTeam ?? ""} vs ${topEdgePick.awayTeam ?? ""}\n📊 Edge Score: ${edgeDisplay}\n💡 ${(topEdgePick.recommendation ?? "Sharp action detected").slice(0, 100)}...\n\n⚡ Full steam alerts: chalkpicks.live/sharp-money\n🔒 Pro subscribers get real-time alerts\n\n#SharpMoney #SteamMove #SportsBetting #ChalkPicks`;

        return { tweet: tweet.slice(0, 280), type: "afternoon" };
      }

      if (input.type === "evening") {
        const yesterdayPicks = await db
          .select()
          .from(picks)
          .where(eq(picks.pickDate, yesterday))
          .orderBy(desc(picks.confidenceScore));

        const resolved = yesterdayPicks.filter(
          (p: typeof picks.$inferSelect) => p.result && p.result !== "pending"
        );
        const wins = resolved.filter((p: typeof picks.$inferSelect) => p.result === "win").length;
        const losses = resolved.filter((p: typeof picks.$inferSelect) => p.result === "loss").length;
        const pushes = resolved.filter((p: typeof picks.$inferSelect) => p.result === "push").length;
        const total = wins + losses + pushes;
        const winRate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

        if (total === 0) {
          return {
            tweet: `📊 DAILY RESULTS UPDATE\n\nYesterday's picks are still being graded. Check back soon!\n\n📈 Track our full record: chalkpicks.live/picks\n\n#SportsBetting #Results #ChalkPicks`,
            type: "evening",
          };
        }

        const record = `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ""}`;
        const resultEmoji = winRate >= 60 ? "🔥" : winRate >= 50 ? "✅" : "📊";

        const tweet = `${resultEmoji} YESTERDAY'S RESULTS\n\n📊 Record: ${record} (${winRate}% win rate)\n${wins > 0 ? `✅ ${wins} WIN${wins > 1 ? "S" : ""}` : ""}${losses > 0 ? `\n❌ ${losses} LOSS${losses > 1 ? "ES" : ""}` : ""}${pushes > 0 ? `\n➡️ ${pushes} PUSH${pushes > 1 ? "ES" : ""}` : ""}\n\n📈 Full history: chalkpicks.live/picks\n🎯 Today's picks are live!\n\n#SportsBetting #Results #ChalkPicks`;

        return { tweet: tweet.slice(0, 280), type: "evening", wins, losses, pushes };
      }

      // night — tomorrow's preview
      const tomorrowTopPick = await db
        .select()
        .from(picks)
        .where(and(eq(picks.pickDate, tomorrow), eq(picks.isActive, true)))
        .orderBy(desc(picks.confidenceScore))
        .limit(1)
        .then((r: typeof picks.$inferSelect[]) => r[0]);

      if (!tomorrowTopPick) {
        return {
          tweet: `🌙 TOMORROW'S PREVIEW\n\nOur AI is analyzing tomorrow's slate overnight. Free daily pick drops at 8am PT.\n\n🔔 Get notified: chalkpicks.live/launch\n\n#SportsBetting #Preview #ChalkPicks`,
          type: "night",
        };
      }

      const emoji = getSportEmoji(tomorrowTopPick.sportKey);
      const tweet = `🌙 TOMORROW'S TOP GAME ${emoji}\n\n${tomorrowTopPick.homeTeam ?? ""} vs ${tomorrowTopPick.awayTeam ?? ""}\n🎯 Confidence: ${tomorrowTopPick.confidenceScore}%\n\n${(tomorrowTopPick.recommendation ?? "AI analysis coming soon").slice(0, 100)}...\n\n🔓 Full pick drops at 8am PT\nchalkpicks.live/picks\n\n#SportsBetting #Preview #ChalkPicks`;

      return { tweet: tweet.slice(0, 280), type: "night" };
    }),
});
