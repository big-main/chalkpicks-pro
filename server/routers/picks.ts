import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { sendEVAlert } from "../pushSender";
import { z } from "zod/v4";
import { getDb } from "../db";
import { picks, playerProps, games, sports } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { afterPickCreated } from "../_core/after-pick-created";
import { TRPCError } from "@trpc/server";

const SPORTS_LIST = [
  { key: "nfl", name: "NFL", icon: "🏈" },
  { key: "nba", name: "NBA", icon: "🏀" },
  { key: "mlb", name: "MLB", icon: "⚾" },
  { key: "nhl", name: "NHL", icon: "🏒" },
  { key: "ncaaf", name: "NCAAF", icon: "🏈" },
  { key: "ncaab", name: "NCAAB", icon: "🏀" },
  { key: "soccer", name: "Soccer", icon: "⚽" },
  { key: "tennis", name: "Tennis", icon: "🎾" },
  { key: "mma", name: "MMA/UFC", icon: "🥊" },
];

// Seed realistic mock picks for demo (dev/fallback only — never invent in prod scheduler)
function generateMockPicks(date: string) {
  const mockPicks = [
    {
      sportKey: "nfl",
      pickDate: date,
      pickType: "spread" as const,
      tier: "free" as const,
      homeTeam: "Kansas City Chiefs",
      awayTeam: "Las Vegas Raiders",
      recommendation: "Chiefs -7.5",
      odds: -110,
      confidenceScore: 87,
      edgeScore: "4.20",
      aiAnalysis:
        "The Chiefs have dominated this matchup historically, covering 8 of the last 10 meetings. Mahomes has a 94.3 passer rating at home this season, and the Raiders defense ranks 28th against the pass. With Hill and Kelce both healthy, expect a comfortable cover.",
      keyFactors: [
        "Home field advantage",
        "Mahomes 94.3 home passer rating",
        "Raiders 28th pass defense",
        "8-2 ATS in last 10 meetings",
      ],
      isFeatured: true,
      result: "win" as const,
    },
    {
      sportKey: "nba",
      pickDate: date,
      pickType: "over_under" as const,
      tier: "free" as const,
      homeTeam: "Boston Celtics",
      awayTeam: "Golden State Warriors",
      recommendation: "Over 224.5",
      odds: -115,
      confidenceScore: 79,
      edgeScore: "3.10",
      aiAnalysis:
        "Both teams rank top-5 in offensive efficiency. The Celtics-Warriors matchup historically goes over 68% of the time. Warriors pace of play (101.2 possessions/game) combined with Celtics 3-point volume creates high-scoring environments.",
      keyFactors: [
        "Both teams top-5 offense",
        "68% historical over rate",
        "Warriors fast pace",
        "No key injuries",
      ],
      isFeatured: false,
      result: "win" as const,
    },
    {
      sportKey: "mlb",
      pickDate: date,
      pickType: "moneyline" as const,
      tier: "premium" as const,
      homeTeam: "Los Angeles Dodgers",
      awayTeam: "San Francisco Giants",
      recommendation: "Dodgers ML",
      odds: -145,
      confidenceScore: 82,
      edgeScore: "5.80",
      aiAnalysis:
        "Shohei Ohtani's 2.31 ERA at home this season is elite. Giants bullpen ERA of 4.89 is exploitable in late innings. Dodgers have won 14 of last 18 home games against NL West rivals.",
      keyFactors: [
        "Ohtani 2.31 home ERA",
        "Giants bullpen 4.89 ERA",
        "14-4 last 18 home vs NL West",
        "Dodgers lineup depth",
      ],
      isFeatured: true,
      result: "pending" as const,
    },
    {
      sportKey: "nhl",
      pickDate: date,
      pickType: "spread" as const,
      tier: "premium" as const,
      homeTeam: "Colorado Avalanche",
      awayTeam: "Minnesota Wild",
      recommendation: "Avalanche -1.5 (+120)",
      odds: 120,
      confidenceScore: 73,
      edgeScore: "6.40",
      aiAnalysis:
        "MacKinnon leads the league in points-per-game at home. Avalanche power play is clicking at 28.4% efficiency. Wild have allowed 3+ goals in 7 of last 10 road games.",
      keyFactors: [
        "MacKinnon home dominance",
        "28.4% power play efficiency",
        "Wild 3+ goals allowed in 7/10 road games",
      ],
      isFeatured: false,
      result: "pending" as const,
    },
    {
      sportKey: "nba",
      pickDate: date,
      pickType: "player_prop" as const,
      tier: "free" as const,
      homeTeam: "Denver Nuggets",
      awayTeam: "Phoenix Suns",
      recommendation: "Nikola Jokic Over 27.5 Points",
      odds: -110,
      confidenceScore: 85,
      edgeScore: "4.90",
      aiAnalysis:
        "Jokic averages 31.2 points in his last 8 games against Phoenix. Suns rank 25th in defending centers. With Murray questionable, Jokic's usage rate increases to 38.2%.",
      keyFactors: [
        "31.2 pts avg vs Phoenix",
        "Suns 25th vs centers",
        "Murray questionable",
        "38.2% usage rate",
      ],
      isFeatured: true,
      result: "win" as const,
    },
    {
      sportKey: "nfl",
      pickDate: date,
      pickType: "over_under" as const,
      tier: "free" as const,
      homeTeam: "Philadelphia Eagles",
      awayTeam: "Dallas Cowboys",
      recommendation: "Under 47.5",
      odds: -108,
      confidenceScore: 76,
      edgeScore: "2.80",
      aiAnalysis:
        "NFC East rivalry games historically trend under 58% of the time. Both defenses rank top-10 in DVOA. Cold weather forecast (28\u00b0F) historically suppresses scoring by 4-6 points.",
      keyFactors: [
        "58% historical under rate",
        "Both defenses top-10 DVOA",
        "28\u00b0F game-time temp",
        "Rivalry game defensive intensity",
      ],
      isFeatured: false,
      result: "loss" as const,
    },
    {
      sportKey: "mlb",
      pickDate: date,
      pickType: "spread" as const,
      tier: "premium" as const,
      homeTeam: "New York Yankees",
      awayTeam: "Boston Red Sox",
      recommendation: "Yankees -1.5 (+105)",
      odds: 105,
      confidenceScore: 71,
      edgeScore: "3.50",
      aiAnalysis:
        "Gerrit Cole's 1.98 ERA at home this season is dominant. Red Sox lineup ranks 22nd in OPS vs right-handed pitching. Yankees have covered -1.5 in 11 of Cole's last 15 home starts.",
      keyFactors: [
        "Cole 1.98 home ERA",
        "Red Sox 22nd vs RHP",
        "11-4 ATS in Cole home starts",
      ],
      isFeatured: false,
      result: "pending" as const,
    },
    {
      sportKey: "soccer",
      pickDate: date,
      pickType: "moneyline" as const,
      tier: "premium" as const,
      homeTeam: "Manchester City",
      awayTeam: "Arsenal",
      recommendation: "Man City ML",
      odds: -130,
      confidenceScore: 80,
      edgeScore: "4.10",
      aiAnalysis:
        "Pep Guardiola's side has won 9 consecutive home Premier League matches. Haaland has scored in 6 of last 8 home appearances. Arsenal missing key midfielder through suspension.",
      keyFactors: [
        "9 consecutive home wins",
        "Haaland 6 goals last 8 home",
        "Arsenal key suspension",
        "City home form 88% win rate",
      ],
      isFeatured: false,
      result: "pending" as const,
    },
  ];
  return mockPicks;
}

export const picksRouter = router({
  list: publicProcedure
    .input(
      z.object({
        sportKey: z.string().optional(),
        tier: z.enum(["free", "premium", "all"]).optional().default("all"),
        date: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const today = input.date ?? new Date().toISOString().split("T")[0];
      const offset = (input.page - 1) * input.limit;

      if (!db) {
        let mockData = generateMockPicks(today);
        if (input.sportKey)
          mockData = mockData.filter(p => p.sportKey === input.sportKey);
        if (input.tier !== "all")
          mockData = mockData.filter(p => p.tier === input.tier);
        if (input.dateFrom)
          mockData = mockData.filter(p => p.pickDate >= input.dateFrom!);
        if (input.dateTo)
          mockData = mockData.filter(p => p.pickDate <= input.dateTo!);
        return {
          picks: mockData
            .slice(offset, offset + input.limit)
            .map((p, i) => ({
              ...p,
              id: i + 1,
              gameId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
            })),
          total: mockData.length,
          sports: SPORTS_LIST,
        };
      }

      const conditions = [eq(picks.isActive, true)];
      if (input.sportKey) conditions.push(eq(picks.sportKey, input.sportKey));
      if (input.tier !== "all") conditions.push(eq(picks.tier, input.tier));
      if (input.dateFrom) {
        conditions.push(gte(picks.pickDate, input.dateFrom));
      } else {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        conditions.push(
          gte(picks.pickDate, sevenDaysAgo.toISOString().split("T")[0])
        );
      }
      if (input.dateTo) conditions.push(lte(picks.pickDate, input.dateTo));

      const [pickList, countResult] = await Promise.all([
        db
          .select()
          .from(picks)
          .where(and(...conditions))
          .orderBy(
            desc(picks.isFeatured),
            desc(picks.edgeScore),
            desc(picks.confidenceScore)
          )
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(picks)
          .where(and(...conditions)),
      ]);

      if (pickList.length === 0) {
        const mockData = generateMockPicks(today);
        const toInsert = mockData.map(p => ({
          ...p,
          gameId: null,
          edgeScore: p.edgeScore,
          keyFactors: p.keyFactors,
          isActive: true,
        }));
        try {
          await db.insert(picks).values(toInsert);
          const seeded = await db
            .select()
            .from(picks)
            .where(eq(picks.isActive, true))
            .orderBy(desc(picks.isFeatured), desc(picks.confidenceScore))
            .limit(input.limit);
          return { picks: seeded, total: seeded.length, sports: SPORTS_LIST };
        } catch {
          return { picks: [], total: 0, sports: SPORTS_LIST };
        }
      }

      return {
        picks: pickList,
        total: countResult[0]?.count ?? 0,
        sports: SPORTS_LIST,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const mockPicks = generateMockPicks(
          new Date().toISOString().split("T")[0]
        );
        const mock = mockPicks[input.id - 1];
        if (!mock) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          ...mock,
          id: input.id,
          gameId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
      }
      const result = await db
        .select()
        .from(picks)
        .where(eq(picks.id, input.id))
        .limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return result[0];
    }),

  generateAI: protectedProcedure
    .input(
      z.object({
        sportKey: z.string(),
        matchup: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const sport = SPORTS_LIST.find(s => s.key === input.sportKey);
      const today = new Date().toISOString().split("T")[0];

      const prompt = `You are an expert sports betting analyst with 20+ years of experience. Analyze the following ${sport?.name ?? input.sportKey} matchup and provide a detailed betting recommendation.\n\nMatchup: ${input.matchup}\nDate: ${today}\nAdditional Context: ${input.context ?? "None provided"}\n\nProvide your analysis in the following JSON format:\n{\n  "recommendation": "specific bet recommendation (e.g., 'Chiefs -7.5', 'Over 224.5', 'Lakers ML')",\n  "pickType": "moneyline|spread|over_under|player_prop",\n  "odds": -110,\n  "confidenceScore": 75,\n  "edgeScore": 3.5,\n  "aiAnalysis": "detailed 2-3 sentence analysis explaining the reasoning",\n  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"]\n}\n\nBe specific, data-driven, and concise. Confidence score should be 60-95 based on signal strength. Edge score represents the % edge over the market (1-10).`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a professional sports betting analyst. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pick_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendation: { type: "string" },
                pickType: {
                  type: "string",
                  enum: ["moneyline", "spread", "over_under", "player_prop"],
                },
                odds: { type: "number" },
                confidenceScore: { type: "number" },
                edgeScore: { type: "number" },
                aiAnalysis: { type: "string" },
                keyFactors: { type: "array", items: { type: "string" } },
              },
              required: [
                "recommendation",
                "pickType",
                "odds",
                "confidenceScore",
                "edgeScore",
                "aiAnalysis",
                "keyFactors",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI generation failed",
        });

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI response parsing failed — invalid JSON returned",
        });
      }
      const [homeTeam, awayTeam] = input.matchup
        .split(" vs ")
        .map(s => s.trim());

      const db = await getDb();
      if (db) {
        const [inserted] = await db.insert(picks).values({
          sportKey: input.sportKey,
          pickDate: today,
          pickType: parsed.pickType,
          tier: "premium",
          homeTeam: homeTeam ?? input.matchup,
          awayTeam: awayTeam ?? "",
          recommendation: parsed.recommendation,
          odds: Math.round(parsed.odds),
          confidenceScore: Math.min(
            95,
            Math.max(50, Math.round(parsed.confidenceScore))
          ),
          edgeScore: String(Math.min(10, Math.max(0, parsed.edgeScore))),
          aiAnalysis: parsed.aiAnalysis,
          keyFactors: parsed.keyFactors,
          result: "pending",
          isActive: true,
          isFeatured: parsed.confidenceScore >= 80,
        });

        // Immutable Pick Ledger lock (parity with scheduler publish path)
        await afterPickCreated(inserted, {
          sportKey: input.sportKey,
          homeTeam: homeTeam ?? input.matchup,
          awayTeam: awayTeam ?? "",
          recommendation: parsed.recommendation,
          pickType: parsed.pickType,
          odds: Math.round(parsed.odds),
          confidenceScore: Math.min(
            95,
            Math.max(50, Math.round(parsed.confidenceScore))
          ),
          pickDate: today,
          tier: "premium",
        });

        const n8nPicksUrl = process.env.N8N_PICKS_WEBHOOK_URL;
        if (n8nPicksUrl) {
          fetch(n8nPicksUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_type: "pick.created",
              pick_id: (inserted as any).insertId,
              sport_key: input.sportKey,
              secret: process.env.N8N_WEBHOOK_SECRET,
            }),
            signal: AbortSignal.timeout(5000),
          }).catch(e => console.warn("[n8n] picks webhook failed:", e));
        }
        const confidence = Math.min(
          95,
          Math.max(50, Math.round(parsed.confidenceScore))
        );
        if (confidence >= 80) {
          sendEVAlert({
            sport: input.sportKey,
            team: parsed.recommendation ?? input.matchup,
            betType: parsed.pickType ?? "pick",
            ev: parsed.edgeScore ? Number(parsed.edgeScore) * 2 : 5,
            odds: Math.round(parsed.odds),
            confidence,
          }).catch(err => console.warn("[picks] EV push alert failed:", err));
        }
        return {
          success: true,
          pick: { ...parsed, id: (inserted as any).insertId },
        };
      }

      return { success: true, pick: parsed };
    }),

  performance: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        overall: {
          wins: 0,
          losses: 0,
          pushes: 0,
          winRate: 0,
          roi: 0,
          totalPicks: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        bySport: [],
        monthlyTrend: [],
        byPickType: [],
      };
    }
    const allPicks = await db
      .select({
        result: picks.result,
        sportKey: picks.sportKey,
        pickType: picks.pickType,
        odds: picks.odds,
        createdAt: picks.createdAt,
      })
      .from(picks)
      .where(eq(picks.isActive, true));
    const settled = allPicks.filter(p => p.result !== "pending");
    const wins = settled.filter(p => p.result === "win").length;
    const losses = settled.filter(p => p.result === "loss").length;
    const pushes = settled.filter(p => p.result === "push").length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

    const totalStaked = total * 100;
    let totalProfit = 0;
    for (const p of settled) {
      if (p.result === "push") continue;
      const o = p.odds ?? -110;
      const profit = o > 0 ? o : 10000 / Math.abs(o);
      if (p.result === "win") totalProfit += profit;
      else totalProfit -= 100;
    }
    const roi =
      totalStaked > 0
        ? Math.round((totalProfit / totalStaked) * 10000) / 100
        : 0;

    const sportMap: Record<
      string,
      {
        wins: number;
        losses: number;
        pushes: number;
        profit: number;
        staked: number;
      }
    > = {};
    for (const p of settled) {
      const s = p.sportKey.toUpperCase();
      if (!sportMap[s])
        sportMap[s] = { wins: 0, losses: 0, pushes: 0, profit: 0, staked: 0 };
      if (p.result === "push") {
        sportMap[s].pushes++;
        continue;
      }
      const o = p.odds ?? -110;
      const payout = o > 0 ? o : 10000 / Math.abs(o);
      if (p.result === "win") {
        sportMap[s].wins++;
        sportMap[s].profit += payout;
        sportMap[s].staked += 100;
      } else {
        sportMap[s].losses++;
        sportMap[s].profit -= 100;
        sportMap[s].staked += 100;
      }
    }
    const bySport = Object.entries(sportMap).map(([sport, s]) => ({
      sport,
      wins: s.wins,
      losses: s.losses,
      pushes: s.pushes,
      winRate:
        s.wins + s.losses > 0
          ? Math.round((s.wins / (s.wins + s.losses)) * 1000) / 10
          : 0,
      roi: s.staked > 0 ? Math.round((s.profit / s.staked) * 10000) / 100 : 0,
    }));

    const typeMap: Record<string, { wins: number; losses: number }> = {};
    for (const p of settled) {
      const t = p.pickType ?? "moneyline";
      if (!typeMap[t]) typeMap[t] = { wins: 0, losses: 0 };
      if (p.result === "win") typeMap[t].wins++;
      else if (p.result === "loss") typeMap[t].losses++;
    }
    const byPickType = Object.entries(typeMap).map(([type, t]) => ({
      type: type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      wins: t.wins,
      losses: t.losses,
      winRate:
        t.wins + t.losses > 0
          ? Math.round((t.wins / (t.wins + t.losses)) * 1000) / 10
          : 0,
    }));

    const monthMap: Record<
      string,
      { wins: number; losses: number; profit: number; staked: number }
    > = {};
    for (const p of settled) {
      const d = new Date(p.createdAt);
      const key = d.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!monthMap[key])
        monthMap[key] = { wins: 0, losses: 0, profit: 0, staked: 0 };
      if (p.result === "push") continue;
      const o = p.odds ?? -110;
      const payout = o > 0 ? o : 10000 / Math.abs(o);
      if (p.result === "win") {
        monthMap[key].wins++;
        monthMap[key].profit += payout;
        monthMap[key].staked += 100;
      } else {
        monthMap[key].losses++;
        monthMap[key].profit -= 100;
        monthMap[key].staked += 100;
      }
    }
    const monthlyTrend = Object.entries(monthMap)
      .slice(-12)
      .map(([month, m]) => ({
        month: month.split(" ")[0],
        winRate:
          m.wins + m.losses > 0
            ? Math.round((m.wins / (m.wins + m.losses)) * 1000) / 10
            : 0,
        roi: m.staked > 0 ? Math.round((m.profit / m.staked) * 10000) / 100 : 0,
        picks: m.wins + m.losses,
      }));

    const sorted = [...settled].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    let currentStreak = 0;
    for (const p of sorted) {
      if (p.result === "win") currentStreak++;
      else if (p.result === "loss") break;
    }
    let longestStreak = 0;
    let runStreak = 0;
    for (const p of [...sorted].reverse()) {
      if (p.result === "win") {
        runStreak++;
        longestStreak = Math.max(longestStreak, runStreak);
      } else if (p.result === "loss") runStreak = 0;
    }

    return {
      overall: {
        wins,
        losses,
        pushes,
        winRate,
        roi,
        totalPicks: allPicks.length,
        currentStreak,
        longestStreak,
      },
      bySport: bySport.length > 0 ? bySport : [],
      monthlyTrend: monthlyTrend.length > 0 ? monthlyTrend : [],
      byPickType: byPickType.length > 0 ? byPickType : [],
    };
  }),

  recentSettled: publicProcedure
    .input(
      z.object({ limit: z.number().min(1).max(20).default(10) }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 10;
      const db = await getDb();
      if (!db) {
        const mock = generateMockPicks(new Date().toISOString().split("T")[0]);
        return {
          picks: mock
            .filter(p => p.result !== "pending")
            .slice(0, limit)
            .map((p, i) => ({
              id: i + 1,
              sportKey: p.sportKey,
              pickType: p.pickType,
              homeTeam: p.homeTeam,
              awayTeam: p.awayTeam,
              recommendation: p.recommendation,
              odds: p.odds,
              confidenceScore: p.confidenceScore,
              edgeScore: p.edgeScore,
              result: p.result,
              tier: p.tier,
              createdAt: new Date(),
            })),
        };
      }
      const recent = await db
        .select({
          id: picks.id,
          sportKey: picks.sportKey,
          pickType: picks.pickType,
          homeTeam: picks.homeTeam,
          awayTeam: picks.awayTeam,
          recommendation: picks.recommendation,
          odds: picks.odds,
          confidenceScore: picks.confidenceScore,
          edgeScore: picks.edgeScore,
          result: picks.result,
          tier: picks.tier,
          createdAt: picks.createdAt,
        })
        .from(picks)
        .where(and(eq(picks.isActive, true), sql`${picks.result} != 'pending'`))
        .orderBy(desc(picks.createdAt))
        .limit(limit);
      return { picks: recent };
    }),

  sports: publicProcedure.query(() => SPORTS_LIST),

  archive: publicProcedure
    .input(
      z.object({
        sportKey: z.string().optional(),
        days: z.number().min(1).max(90).optional().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.days);
      const cutoffStr = cutoff.toISOString().split("T")[0];

      if (!db) {
        const today = new Date().toISOString().split("T")[0];
        let mockData = generateMockPicks(today);
        if (input.sportKey)
          mockData = mockData.filter(p => p.sportKey === input.sportKey);
        return {
          days: [
            {
              date: today,
              picks: mockData.map((p, i) => ({
                id: i + 1,
                pickDate: today,
                sportKey: p.sportKey,
                pickType: p.pickType as string,
                homeTeam: p.homeTeam,
                awayTeam: p.awayTeam,
                recommendation: p.recommendation,
                odds: p.odds,
                confidenceScore: p.confidenceScore,
                result: p.result as string,
                tier: p.tier as string,
              })),
            },
          ],
          sports: SPORTS_LIST,
        };
      }

      const conditions = [
        eq(picks.isActive, true),
        gte(picks.pickDate, cutoffStr),
      ];
      if (input.sportKey) conditions.push(eq(picks.sportKey, input.sportKey));

      const rows = await db
        .select({
          id: picks.id,
          pickDate: picks.pickDate,
          sportKey: picks.sportKey,
          pickType: picks.pickType,
          homeTeam: picks.homeTeam,
          awayTeam: picks.awayTeam,
          recommendation: picks.recommendation,
          odds: picks.odds,
          confidenceScore: picks.confidenceScore,
          result: picks.result,
          tier: picks.tier,
        })
        .from(picks)
        .where(and(...conditions))
        .orderBy(desc(picks.pickDate), desc(picks.confidenceScore))
        .limit(500);

      const byDate = new Map<string, typeof rows>();
      for (const row of rows) {
        const list = byDate.get(row.pickDate) ?? [];
        list.push(row);
        byDate.set(row.pickDate, list);
      }

      return {
        days: Array.from(byDate.entries()).map(([date, dayPicks]) => ({
          date,
          picks: dayPicks,
        })),
        sports: SPORTS_LIST,
      };
    }),

  freeDailyPick: publicProcedure.query(async () => {
    const db = await getDb();
    const today = new Date().toISOString().split("T")[0];
    if (!db) {
      const mock = generateMockPicks(today).filter(p => p.tier === "free");
      if (mock.length === 0) return { pick: null, date: today };
      const best = mock.sort(
        (a, b) => b.confidenceScore - a.confidenceScore
      )[0];
      return {
        pick: {
          ...best,
          id: 1,
          gameId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        date: today,
      };
    }
    const [freePick] = await db
      .select()
      .from(picks)
      .where(
        and(
          eq(picks.tier, "free"),
          eq(picks.isActive, true),
          eq(picks.pickDate, today)
        )
      )
      .orderBy(desc(picks.confidenceScore))
      .limit(1);
    if (!freePick) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const [recentFree] = await db
        .select()
        .from(picks)
        .where(
          and(
            eq(picks.tier, "free"),
            eq(picks.isActive, true),
            gte(picks.pickDate, sevenDaysAgo.toISOString().split("T")[0])
          )
        )
        .orderBy(desc(picks.confidenceScore))
        .limit(1);
      return { pick: recentFree ?? null, date: today };
    }
    return { pick: freePick, date: today };
  }),

  sportCounts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        nfl: 4,
        nba: 3,
        mlb: 5,
        nhl: 2,
        ncaaf: 2,
        ncaab: 2,
        soccer: 1,
        tennis: 1,
        mma: 1,
      } as Record<string, number>;
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const rows = await db
      .select({ sportKey: picks.sportKey, count: sql<number>`count(*)` })
      .from(picks)
      .where(
        and(
          eq(picks.isActive, true),
          gte(picks.pickDate, sevenDaysAgo.toISOString().split("T")[0])
        )
      )
      .groupBy(picks.sportKey);
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.sportKey] = Number(row.count);
    }
    return result;
  }),

  newPickSports: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as string[];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select({ sportKey: picks.sportKey })
      .from(picks)
      .where(and(eq(picks.isActive, true), gte(picks.createdAt, oneDayAgo)))
      .groupBy(picks.sportKey);
    return rows.map(r => r.sportKey);
  }),
});
