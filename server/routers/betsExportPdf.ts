/**
 * Bet History PDF Export
 * 
 * Generates a formatted PDF report of user's bet history.
 * Uses HTML-to-string approach since we can't use native PDF libs in Node serverless.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userBets } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const betsExportPdfRouter = router({
  /**
   * Generate a structured HTML report for PDF download (client renders to PDF)
   */
  exportReport: protectedProcedure
    .input(z.object({
      format: z.enum(["html", "csv"]).optional().default("html"),
      dateRange: z.enum(["7d", "30d", "90d", "all"]).optional().default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const allBets = await db.select().from(userBets)
        .where(eq(userBets.userId, ctx.user.id as number))
        .orderBy(desc(userBets.createdAt));

      // Filter by date range
      let filteredBets = allBets;
      if (input.dateRange !== "all") {
        const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
        const days = daysMap[input.dateRange];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        filteredBets = allBets.filter(b => {
          const betDate = b.betDate ? new Date(b.betDate) : b.createdAt;
          return betDate >= cutoff;
        });
      }

      // Calculate summary stats
      const totalBets = filteredBets.length;
      const wins = filteredBets.filter(b => b.result === "win").length;
      const losses = filteredBets.filter(b => b.result === "loss").length;
      const pushes = filteredBets.filter(b => b.result === "push").length;
      const pending = filteredBets.filter(b => b.result === "pending").length;
      const totalStaked = filteredBets.reduce((sum, b) => sum + parseFloat(String(b.stake || "0")), 0);
      const totalProfit = filteredBets.reduce((sum, b) => sum + parseFloat(String(b.profit || "0")), 0);
      const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0.0";
      const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : "0.0";

      if (input.format === "csv") {
        const header = ["Date", "Description", "Sport", "Type", "Odds", "Stake", "Payout", "Result", "Profit/Loss", "Notes"];
        const rows = filteredBets.map(b => [
          b.betDate ?? (b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : ""),
          `"${(b.description ?? "").replace(/"/g, '""')}"`,
          b.sportKey ?? "",
          b.betType ?? "",
          b.odds?.toString() ?? "",
          b.stake?.toString() ?? "",
          b.potentialPayout?.toString() ?? "",
          b.result ?? "pending",
          b.profit?.toString() ?? "0",
          `"${(b.notes ?? "").replace(/"/g, '""')}"`,
        ]);
        const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
        return { type: "csv" as const, csv, filename: `chalkpicks-bets-${new Date().toISOString().split("T")[0]}.csv` };
      }

      // Generate HTML report for client-side PDF rendering
      const html = generateReportHtml({
        userName: ctx.user.name || "User",
        dateRange: input.dateRange,
        totalBets,
        wins,
        losses,
        pushes,
        pending,
        totalStaked,
        totalProfit,
        winRate,
        roi,
        bets: filteredBets.map(b => ({
          date: b.betDate ?? (b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : ""),
          description: b.description ?? "",
          sport: b.sportKey ?? "",
          type: b.betType ?? "",
          odds: b.odds ?? 0,
          stake: parseFloat(String(b.stake || "0")),
          payout: parseFloat(String(b.potentialPayout || "0")),
          result: b.result ?? "pending",
          profit: parseFloat(String(b.profit || "0")),
        })),
      });

      return { type: "html" as const, html, filename: `chalkpicks-report-${new Date().toISOString().split("T")[0]}.html` };
    }),
});

function generateReportHtml(data: {
  userName: string;
  dateRange: string;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  totalStaked: number;
  totalProfit: number;
  winRate: string;
  roi: string;
  bets: Array<{
    date: string;
    description: string;
    sport: string;
    type: string;
    odds: number;
    stake: number;
    payout: number;
    result: string;
    profit: number;
  }>;
}): string {
  const dateLabel = data.dateRange === "all" ? "All Time" : `Last ${data.dateRange.replace("d", " Days")}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ChalkPicks Bet History Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c9a227; padding-bottom: 20px; }
    .header h1 { color: #c9a227; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-card .value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .stat-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .profit-positive { color: #22c55e; }
    .profit-negative { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th { background: #1a1a1a; color: white; padding: 10px 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f8f9fa; }
    .result-win { color: #22c55e; font-weight: bold; }
    .result-loss { color: #ef4444; font-weight: bold; }
    .result-push { color: #f59e0b; }
    .result-pending { color: #6b7280; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ChalkPicks Pro</h1>
    <p>Bet History Report — ${data.userName}</p>
    <p>Period: ${dateLabel} | Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="value">${data.totalBets}</div><div class="label">Total Bets</div></div>
    <div class="stat-card"><div class="value">${data.winRate}%</div><div class="label">Win Rate</div></div>
    <div class="stat-card"><div class="value ${data.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">$${data.totalProfit.toFixed(2)}</div><div class="label">Net Profit</div></div>
    <div class="stat-card"><div class="value">${data.roi}%</div><div class="label">ROI</div></div>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="value profit-positive">${data.wins}</div><div class="label">Wins</div></div>
    <div class="stat-card"><div class="value profit-negative">${data.losses}</div><div class="label">Losses</div></div>
    <div class="stat-card"><div class="value">${data.pushes}</div><div class="label">Pushes</div></div>
    <div class="stat-card"><div class="value">$${data.totalStaked.toFixed(2)}</div><div class="label">Total Staked</div></div>
  </div>
  <table>
    <thead>
      <tr><th>Date</th><th>Description</th><th>Sport</th><th>Type</th><th>Odds</th><th>Stake</th><th>Result</th><th>P/L</th></tr>
    </thead>
    <tbody>
      ${data.bets.map(b => `<tr>
        <td>${b.date}</td>
        <td>${b.description}</td>
        <td>${b.sport.toUpperCase()}</td>
        <td>${b.type}</td>
        <td>${b.odds > 0 ? '+' : ''}${b.odds}</td>
        <td>$${b.stake.toFixed(2)}</td>
        <td class="result-${b.result}">${b.result.toUpperCase()}</td>
        <td class="${b.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${b.profit.toFixed(2)}</td>
      </tr>`).join("\n")}
    </tbody>
  </table>
  <div class="footer">
    <p>Generated by ChalkPicks Pro — AI-Powered Sports Betting Analytics</p>
    <p>This report is for personal record-keeping only. Past performance does not guarantee future results.</p>
  </div>
</body>
</html>`;
}
