/**
 * n8n Webhook Router — ChalkPicks AI Auto-Analysis
 *
 * Replaces the Baserow integration pattern from the original n8n template.
 * These endpoints are called BY n8n (not by the frontend) and are secured
 * with a shared secret (N8N_WEBHOOK_SECRET env var).
 *
 * Adapted workflow pattern:
 *   Baserow webhook trigger    → /api/trpc/n8nWebhook.picksEvent
 *   Table Fields API           → /api/trpc/n8nWebhook.picksSchema
 *   Get Row / List Table API   → /api/trpc/n8nWebhook.getPick / getUnanalyzedPicks
 *   PDF file download          → /api/trpc/n8nWebhook.getPickData (returns game stats + odds)
 *   Update Row (Baserow PATCH) → /api/trpc/n8nWebhook.updatePickAnalysis
 */

import { z } from "zod";
import { eq, isNull, and, or } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { oddsApiCache } from "../services/oddsApiCache";

/** Validate the shared n8n webhook secret */
function validateSecret(secret: string | undefined) {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Unauthorized: N8N_WEBHOOK_SECRET unset in production");
    }
    return; // Not set outside production — skip validation (dev mode)
  }
  if (secret !== expected) {
    throw new Error("Unauthorized: invalid n8n webhook secret");
  }
}

/** Pick fields with AI prompt descriptions — mirrors the Baserow "Table Fields API" pattern */
const PICK_FIELDS_SCHEMA = [
  {
    name: "aiAnalysis",
    type: "text",
    description:
      "Write a detailed 2-3 paragraph sports betting analysis for this pick. Cover: (1) team form and recent results, (2) key matchup factors and injuries, (3) why this bet has positive expected value. Be specific and data-driven.",
  },
  {
    name: "keyFactors",
    type: "json_array",
    description:
      "List 3-5 key factors that support this pick as a JSON array of strings. Each factor should be a concise, specific insight (e.g. 'Chiefs 8-2 ATS as home favorites', 'Mahomes 12-3 vs teams with losing records'). Return ONLY a JSON array.",
  },
  {
    name: "confidenceScore",
    type: "integer_1_to_100",
    description:
      "Rate the confidence level for this pick from 1-100 based on: edge strength, historical ATS trends, injury situation, weather, line movement, and public vs sharp money. 70+ = high confidence, 50-69 = moderate, below 50 = low. Return ONLY an integer.",
  },
  {
    name: "edgeScore",
    type: "decimal",
    description:
      "Calculate the estimated edge percentage for this pick (0.00 to 15.00). Edge = (true win probability - implied probability from odds). Use Kelly Criterion logic. Return ONLY a decimal number like 4.75.",
  },
];

export const n8nWebhookRouter = router({
  /**
   * GET: Returns the schema of pick fields with AI prompt descriptions.
   * Mirrors: Baserow "Table Fields API" + "Get Prompt Fields" code node.
   * n8n calls this once at workflow start to know what fields to fill.
   */
  picksSchema: publicProcedure
    .input(z.object({ secret: z.string().optional() }))
    .query(({ input }) => {
      validateSecret(input.secret);
      return { fields: PICK_FIELDS_SCHEMA };
    }),

  /**
   * GET: Fetch a single pick by ID with full game context.
   * Mirrors: Baserow "Get Row" HTTP Request node.
   */
  getPick: publicProcedure
    .input(z.object({ id: z.number(), secret: z.string().optional() }))
    .query(async ({ input }) => {
      validateSecret(input.secret);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db
        .select()
        .from(picks)
        .where(eq(picks.id, input.id))
        .limit(1);
      if (!result.length) throw new Error(`Pick ${input.id} not found`);
      return result[0];
    }),

  /**
   * GET: Fetch all picks that need AI analysis (aiAnalysis is null/empty).
   * Mirrors: Baserow "List Table API" with filter for rows missing the "File" field.
   * Used for bulk re-analysis when a field schema changes.
   */
  getUnanalyzedPicks: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        sportKey: z.string().optional(),
        secret: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      validateSecret(input.secret);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const conditions = [
        or(isNull(picks.aiAnalysis), eq(picks.aiAnalysis, "")),
        eq(picks.isActive, true),
      ];
      if (input.sportKey) {
        conditions.push(eq(picks.sportKey, input.sportKey));
      }

      const results = await db
        .select({
          id: picks.id,
          sportKey: picks.sportKey,
          pickType: picks.pickType,
          tier: picks.tier,
          homeTeam: picks.homeTeam,
          awayTeam: picks.awayTeam,
          recommendation: picks.recommendation,
          odds: picks.odds,
          confidenceScore: picks.confidenceScore,
          edgeScore: picks.edgeScore,
          aiAnalysis: picks.aiAnalysis,
          keyFactors: picks.keyFactors,
          result: picks.result,
          pickDate: picks.pickDate,
          createdAt: picks.createdAt,
        })
        .from(picks)
        .where(and(...conditions))
        .limit(input.limit);

      return { picks: results, count: results.length };
    }),

  /**
   * GET: Fetch enriched game data for a pick — odds history, team stats, injury context.
   * Mirrors: Baserow "Get File Data" HTTP Request (downloads the PDF for context).
   * Returns structured sports data instead of a PDF.
   */
  getPickData: publicProcedure
    .input(z.object({ id: z.number(), secret: z.string().optional() }))
    .query(async ({ input }) => {
      validateSecret(input.secret);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [pick] = await db
        .select()
        .from(picks)
        .where(eq(picks.id, input.id))
        .limit(1);

      if (!pick) throw new Error(`Pick ${input.id} not found`);

      // Fetch live odds from The Odds API for context (via centralized cache)
      let oddsContext = null;
      try {
        const oddsApiKey = process.env.ODDS_API_KEY;
        if (oddsApiKey && pick.sportKey) {
          const oddsData = await oddsApiCache.fetch(pick.sportKey, {
            markets: "h2h,spreads,totals",
          });
          if (oddsData && oddsData.length > 0) {
            // Find the matching game
            const game = oddsData.find(
              (g: any) =>
                (g.home_team
                  ?.toLowerCase()
                  .includes(pick.homeTeam?.toLowerCase() ?? "") ||
                  g.away_team
                    ?.toLowerCase()
                    .includes(pick.awayTeam?.toLowerCase() ?? "")) &&
                (g.home_team
                  ?.toLowerCase()
                  .includes(pick.awayTeam?.toLowerCase() ?? "") ||
                  g.away_team
                    ?.toLowerCase()
                    .includes(pick.homeTeam?.toLowerCase() ?? "") ||
                  true)
            );
            if (game) {
              oddsContext = {
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                commenceTime: game.commence_time,
                bookmakers: game.bookmakers?.slice(0, 3).map((b: any) => ({
                  name: b.title,
                  markets: b.markets?.map((m: any) => ({
                    key: m.key,
                    outcomes: m.outcomes,
                  })),
                })),
              };
            }
          }
        }
      } catch {
        // Non-blocking — proceed without live odds
      }

      // Build the context string that replaces the PDF text
      const contextText = [
        `=== PICK DETAILS ===`,
        `Sport: ${pick.sportKey}`,
        `Game: ${pick.homeTeam ?? "TBD"} vs ${pick.awayTeam ?? "TBD"}`,
        `Pick Type: ${pick.pickType}`,
        `Recommendation: ${pick.recommendation}`,
        `Odds: ${pick.odds ? (pick.odds > 0 ? `+${pick.odds}` : `${pick.odds}`) : "N/A"}`,
        `Pick Date: ${pick.pickDate}`,
        `Tier: ${pick.tier}`,
        ``,
        `=== CURRENT ANALYSIS STATE ===`,
        `Confidence Score: ${pick.confidenceScore}/100`,
        `Edge Score: ${pick.edgeScore ?? "Not set"}`,
        `AI Analysis: ${pick.aiAnalysis ? "Already written" : "MISSING — needs generation"}`,
        `Key Factors: ${pick.keyFactors ? JSON.stringify(pick.keyFactors) : "MISSING — needs generation"}`,
        ``,
        oddsContext
          ? [
              `=== LIVE ODDS CONTEXT ===`,
              `Home: ${oddsContext.homeTeam} | Away: ${oddsContext.awayTeam}`,
              `Game Time: ${oddsContext.commenceTime}`,
              `Bookmaker Lines:`,
              ...oddsContext.bookmakers.flatMap((b: any) =>
                b.markets.map(
                  (m: any) =>
                    `  ${b.name} - ${m.key}: ${m.outcomes.map((o: any) => `${o.name} ${o.price > 0 ? "+" : ""}${o.price}`).join(" | ")}`
                )
              ),
            ].join("\n")
          : "=== LIVE ODDS: Not available ===",
      ].join("\n");

      return {
        pick,
        contextText,
        hasOdds: !!oddsContext,
        oddsContext,
      };
    }),

  /**
   * MUTATION: Write AI-generated analysis back to a pick.
   * Mirrors: Baserow "Update Row" HTTP PATCH node.
   * Called by n8n after the LLM generates values for each field.
   */
  updatePickAnalysis: publicProcedure
    .input(
      z.object({
        id: z.number(),
        secret: z.string().optional(),
        aiAnalysis: z.string().optional(),
        keyFactors: z.array(z.string()).optional(),
        confidenceScore: z.number().min(1).max(100).optional(),
        edgeScore: z.string().optional(), // decimal as string e.g. "4.75"
      })
    )
    .mutation(async ({ input }) => {
      validateSecret(input.secret);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: Record<string, any> = {};
      if (input.aiAnalysis !== undefined)
        updateData.aiAnalysis = input.aiAnalysis;
      if (input.keyFactors !== undefined)
        updateData.keyFactors = input.keyFactors;
      if (input.confidenceScore !== undefined)
        updateData.confidenceScore = input.confidenceScore;
      if (input.edgeScore !== undefined) updateData.edgeScore = input.edgeScore;

      if (Object.keys(updateData).length === 0) {
        return { updated: false, message: "No fields to update" };
      }

      await db.update(picks).set(updateData).where(eq(picks.id, input.id));

      console.warn(
        `[n8n] Updated pick ${input.id}: ${Object.keys(updateData).join(", ")}`
      );
      return { updated: true, id: input.id, fields: Object.keys(updateData) };
    }),

  /**
   * MUTATION: Receive a ChalkPicks event (pick created/updated).
   * Mirrors: Baserow webhook trigger — this is what n8n polls or listens to.
   * ChalkPicks fires this internally when a new pick is created.
   */
  picksEvent: publicProcedure
    .input(
      z.object({
        event_type: z.enum([
          "pick.created",
          "pick.updated",
          "picks.batch_analyze",
        ]),
        pick_id: z.number().optional(),
        sport_key: z.string().optional(),
        secret: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      validateSecret(input.secret);
      console.warn(
        `[n8n] Picks event: ${input.event_type} | pick_id: ${input.pick_id ?? "batch"}`
      );
      return {
        received: true,
        event_type: input.event_type,
        pick_id: input.pick_id,
        sport_key: input.sport_key,
        timestamp: new Date().toISOString(),
      };
    }),
});
