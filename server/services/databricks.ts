/**
 * Databricks REST API Client
 * 
 * Provides access to Databricks SQL warehouse for:
 * - Backtesting analytics (historical win rates, ROI by sport/bet type)
 * - Advanced statistical models
 * - Large-scale data processing
 * 
 * Env vars:
 *   DATABRICKS_HOST - Workspace URL (e.g., https://xxx.cloud.databricks.com)
 *   DATABRICKS_TOKEN - Personal access token
 *   DATABRICKS_WAREHOUSE_ID - SQL warehouse ID for queries
 * 
 * Docs: https://docs.databricks.com/api/workspace/introduction
 */

interface DatabricksQueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

interface AnalyticsSummary {
  sport: string;
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  avgConfidence: number;
  clvAvg: number;
}

function getConfig() {
  return {
    host: process.env.DATABRICKS_HOST || "",
    token: process.env.DATABRICKS_TOKEN || "",
    warehouseId: process.env.DATABRICKS_WAREHOUSE_ID || "",
  };
}

/**
 * Execute a SQL query against the Databricks SQL warehouse
 */
export async function executeQuery(sql: string): Promise<DatabricksQueryResult | null> {
  const { host, token, warehouseId } = getConfig();
  if (!host || !token || !warehouseId) {
    console.warn("[Databricks] Missing configuration (DATABRICKS_HOST, DATABRICKS_TOKEN, or DATABRICKS_WAREHOUSE_ID)");
    return null;
  }

  const startTime = Date.now();
  try {
    // Submit statement
    const submitResp = await fetch(`${host}/api/2.0/sql/statements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement: sql,
        wait_timeout: "30s",
        disposition: "INLINE",
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!submitResp.ok) {
      console.error(`[Databricks] Query failed: ${submitResp.status} ${submitResp.statusText}`);
      return null;
    }

    const result = (await submitResp.json()) as any;
    
    if (result.status?.state === "FAILED") {
      console.error(`[Databricks] Query error: ${result.status.error?.message}`);
      return null;
    }

    const columns = (result.manifest?.schema?.columns ?? []).map((c: any) => c.name);
    const rows = result.result?.data_array ?? [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime: Date.now() - startTime,
    };
  } catch (err) {
    console.error("[Databricks] Request failed:", err);
    return null;
  }
}

/**
 * Get backtesting analytics by sport and bet type
 */
export async function getBacktestAnalytics(
  sport?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AnalyticsSummary[]> {
  const conditions: string[] = [];
  if (sport && sport !== "all") conditions.push(`sport_key = '${sport}'`);
  if (dateFrom) conditions.push(`game_date >= '${dateFrom}'`);
  if (dateTo) conditions.push(`game_date <= '${dateTo}'`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT 
      sport_key as sport,
      COUNT(*) as total_picks,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) as pushes,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(SUM(profit) / SUM(stake) * 100, 2) as roi,
      ROUND(AVG(confidence_score), 1) as avg_confidence,
      ROUND(AVG(clv_percent), 2) as clv_avg
    FROM picks_history
    ${where}
    GROUP BY sport_key
    ORDER BY total_picks DESC
  `;

  const result = await executeQuery(sql);
  if (!result) return [];

  return result.rows.map((row) => ({
    sport: row[0] ?? "",
    totalPicks: Number(row[1]) || 0,
    wins: Number(row[2]) || 0,
    losses: Number(row[3]) || 0,
    pushes: Number(row[4]) || 0,
    winRate: Number(row[5]) || 0,
    roi: Number(row[6]) || 0,
    avgConfidence: Number(row[7]) || 0,
    clvAvg: Number(row[8]) || 0,
  }));
}

/**
 * Get win rate and ROI dashboard data grouped by sport and bet type
 */
export async function getDashboardAnalytics(): Promise<{
  bySport: AnalyticsSummary[];
  byBetType: { betType: string; winRate: number; roi: number; count: number }[];
  recentTrend: { date: string; winRate: number; roi: number }[];
}> {
  const bySport = await getBacktestAnalytics();

  const byBetTypeResult = await executeQuery(`
    SELECT 
      pick_type,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(SUM(profit) / NULLIF(SUM(stake), 0) * 100, 2) as roi,
      COUNT(*) as count
    FROM picks_history
    GROUP BY pick_type
    ORDER BY count DESC
  `);

  const byBetType = (byBetTypeResult?.rows ?? []).map((row) => ({
    betType: row[0] ?? "",
    winRate: Number(row[1]) || 0,
    roi: Number(row[2]) || 0,
    count: Number(row[3]) || 0,
  }));

  const trendResult = await executeQuery(`
    SELECT 
      DATE_FORMAT(game_date, '%Y-%m-%d') as date,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(SUM(profit) / NULLIF(SUM(stake), 0) * 100, 2) as roi
    FROM picks_history
    WHERE game_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(game_date, '%Y-%m-%d')
    ORDER BY date DESC
    LIMIT 30
  `);

  const recentTrend = (trendResult?.rows ?? []).map((row) => ({
    date: row[0] ?? "",
    winRate: Number(row[1]) || 0,
    roi: Number(row[2]) || 0,
  }));

  return { bySport, byBetType, recentTrend };
}

export default {
  executeQuery,
  getBacktestAnalytics,
  getDashboardAnalytics,
};
