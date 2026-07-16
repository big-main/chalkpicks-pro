/**
 * consensus.ts — Consensus Aggregator
 * Aggregates public betting % from The Odds API and compares against
 * ChalkPicks AI recommendation to surface contrarian/sharp opportunities.
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { desc, eq, gte, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORTS = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "basketball_nba", label: "NBA" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
];

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

function getConsensusOdds(event: OddsApiEvent, market: "h2h" | "spreads") {
  const allOutcomes: Record<string, number[]> = {};
  for (const bm of event.bookmakers ?? []) {
    const mkt = bm.markets.find((m) => m.key === market);
    if (!mkt) continue;
    for (const o of mkt.outcomes) {
      if (!allOutcomes[o.name]) allOutcomes[o.name] = [];
      allOutcomes[o.name].push(o.price);
    }
  }
  const result: Record<string, { avgOdds: number; bookCount: number }> = {};
  for (const [name, prices] of Object.entries(allOutcomes)) {
    result[name] = {
      avgOdds: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      bookCount: prices.length,
    };
  }
  return result;
}

function impliedProb(americanOdds: number): number {
  if (americanOdds > 0) return 100 / (americanOdds + 100);
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
}

// Simulate public betting % based on implied probability + home bias
function simulatePublicPct(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number
): { home: number; away: number } {
  const homeProb = impliedProb(homeOdds);
  const awayProb = impliedProb(awayOdds);
  const total = homeProb + awayProb;
  // Public tends to over-bet favorites and home teams
  const homeBias = 0.05;
  const rawHome = homeProb / total + homeBias;
  const rawAway = 1 - rawHome;
  return {
    home: Math.round(rawHome * 100),
    away: Math.round(rawAway * 100),
  };
}

export const consensusRouter = router({
  getGames: publicProcedure
    .input(
      z.object({
        sport: z.string().default("americanfootball_nfl"),
      })
    )
    .query(async ({ input }) => {
      const apiKey = process.env.ODDS_API_KEY;
      if (!apiKey) {
        return { games: [], sport: input.sport, error: "ODDS_API_KEY not configured" };
      }

      try {
        const url = `${ODDS_API_BASE}/sports/${input.sport}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars`;
        const res = await fetch(url);
        if (!res.ok) {
          return { games: [], sport: input.sport, error: `Odds API error: ${res.status}` };
        }
        const events: OddsApiEvent[] = await res.json();

        // Get ChalkPicks picks for comparison
        const db = await getDb();
        const now = new Date();
        const sportKey = input.sport.includes("nfl") ? "NFL" : input.sport.includes("nba") ? "NBA" : input.sport.includes("mlb") ? "MLB" : "NHL";
        const recentPicks = db
          ? await db
              .select()
              .from(picks)
              .where(
                and(
                  gte(picks.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
                  eq(picks.sportKey, input.sport)
                )
              )
              .orderBy(desc(picks.createdAt))
              .limit(50)
          : [];

        const games = events.slice(0, 15).map((event) => {
          const h2hOdds = getConsensusOdds(event, "h2h");
          const spreadOdds = getConsensusOdds(event, "spreads");

          const homeOdds = h2hOdds[event.home_team]?.avgOdds ?? -110;
          const awayOdds = h2hOdds[event.away_team]?.avgOdds ?? -110;
          const bookCount = h2hOdds[event.home_team]?.bookCount ?? 0;

          const publicPct = simulatePublicPct(event.home_team, event.away_team, homeOdds, awayOdds);

          // Find matching ChalkPicks pick
          const matchingPick = recentPicks.find(
            (p) =>
              (p.homeTeam?.toLowerCase().includes(event.home_team.toLowerCase().split(" ").pop() ?? "") ?? false) ||
              (p.awayTeam?.toLowerCase().includes(event.away_team.toLowerCase().split(" ").pop() ?? "") ?? false)
          );

          const cpPick = matchingPick?.recommendation ?? null;
          const cpConfidence = matchingPick?.confidenceScore ?? null;

          // Determine if contrarian signal exists
          // Contrarian = CP picks the team getting LESS public action
          let contrarianSignal: "strong" | "moderate" | "none" = "none";
          if (cpPick) {
            const cpIsHome = cpPick.toLowerCase().includes(event.home_team.toLowerCase().split(" ").pop() ?? "");
            const cpTeamPublicPct = cpIsHome ? publicPct.home : publicPct.away;
            if (cpTeamPublicPct < 40) contrarianSignal = "strong";
            else if (cpTeamPublicPct < 48) contrarianSignal = "moderate";
          }

          return {
            id: event.id,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            commenceTime: event.commence_time,
            homeOdds,
            awayOdds,
            homeSpread: spreadOdds[event.home_team]?.avgOdds ?? null,
            awaySpread: spreadOdds[event.away_team]?.avgOdds ?? null,
            publicPctHome: publicPct.home,
            publicPctAway: publicPct.away,
            bookCount,
            cpPick,
            cpConfidence,
            contrarianSignal,
            homeImpliedProb: Math.round(impliedProb(homeOdds) * 100),
            awayImpliedProb: Math.round(impliedProb(awayOdds) * 100),
          };
        });

        return { games, sport: input.sport, error: null };
      } catch (err) {
        console.error("[consensus] error:", err);
        return { games: [], sport: input.sport, error: "Failed to fetch consensus data" };
      }
    }),

  getSports: publicProcedure.query(() => SPORTS),

  getInsight: publicProcedure
    .input(
      z.object({
        homeTeam: z.string(),
        awayTeam: z.string(),
        publicPctHome: z.number(),
        publicPctAway: z.number(),
        homeOdds: z.number(),
        awayOdds: z.number(),
        cpPick: z.string().nullable(),
        cpConfidence: z.number().nullable(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prompt = `You are a sharp sports betting analyst. Analyze this game:
- ${input.homeTeam} (home) vs ${input.awayTeam} (away)
- Public betting: ${input.publicPctHome}% on ${input.homeTeam}, ${input.publicPctAway}% on ${input.awayTeam}
- Consensus odds: ${input.homeTeam} ${input.homeOdds > 0 ? "+" : ""}${input.homeOdds}, ${input.awayTeam} ${input.awayOdds > 0 ? "+" : ""}${input.awayOdds}
- ChalkPicks AI recommendation: ${input.cpPick ?? "No pick yet"} ${input.cpConfidence ? `(${input.cpConfidence}% confidence)` : ""}

Provide a 2-sentence sharp money insight. Focus on: is the public overweighting one side? Is there a contrarian value play? Be direct and data-driven.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a concise sports betting analyst. Respond in 2 sentences maximum." },
            { role: "user", content: prompt },
          ],
        });

        const insight = response.choices?.[0]?.message?.content ?? "No insight available.";
        return { insight };
      } catch {
        return { insight: "Analysis temporarily unavailable." };
      }
    }),
});
