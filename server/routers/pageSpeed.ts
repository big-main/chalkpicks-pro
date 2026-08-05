/**
 * PageSpeed Insights router
 * Runs Google Lighthouse audits via the PageSpeed Insights API.
 * Admin-only — never expose raw API key to the frontend.
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

const PSI_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface CategoryScore {
  score: number | null;
}

interface AuditResult {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
}

interface PSIResponse {
  lighthouseResult?: {
    categories?: {
      performance?: CategoryScore;
      accessibility?: CategoryScore;
      "best-practices"?: CategoryScore;
      seo?: CategoryScore;
    };
    audits?: Record<string, AuditResult>;
    fetchTime?: string;
    finalUrl?: string;
  };
  loadingExperience?: {
    overall_category?: string;
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
}

async function runAudit(url: string, strategy: "mobile" | "desktop") {
  const params = new URLSearchParams({
    url,
    strategy,
    key: ENV.pageSpeedApiKey,
    category: "performance",
    category_1: "accessibility",
    category_2: "best-practices",
    category_3: "seo",
  });

  const res = await fetch(`${PSI_BASE}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PageSpeed API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: PSIResponse = await res.json();
  const lr = data.lighthouseResult;
  const cats = lr?.categories ?? {};
  const audits = lr?.audits ?? {};

  // Pull the most actionable failing audits (score < 0.9)
  const failingAudits = Object.values(audits)
    .filter(a => a.score !== null && a.score < 0.9)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 10)
    .map(a => ({
      id: a.id,
      title: a.title,
      score: a.score,
      displayValue: a.displayValue ?? null,
    }));

  // Core Web Vitals from audits
  const cwv = {
    lcp: audits["largest-contentful-paint"]?.displayValue ?? null,
    fid: audits["total-blocking-time"]?.displayValue ?? null,
    cls: audits["cumulative-layout-shift"]?.displayValue ?? null,
    fcp: audits["first-contentful-paint"]?.displayValue ?? null,
    ttfb: audits["server-response-time"]?.displayValue ?? null,
    si: audits["speed-index"]?.displayValue ?? null,
  };

  return {
    url: lr?.finalUrl ?? url,
    strategy,
    fetchTime: lr?.fetchTime ?? new Date().toISOString(),
    scores: {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
    },
    cwv,
    failingAudits,
    fieldData: data.loadingExperience?.overall_category ?? null,
  };
}

export const pageSpeedRouter = router({
  /** Run a Lighthouse audit for a given URL and strategy */
  audit: adminProcedure
    .input(
      z.object({
        url: z.string().url().default("https://www.chalkpicks.pro"),
        strategy: z.enum(["mobile", "desktop"]).default("mobile"),
      })
    )
    .mutation(async ({ input }) => {
      if (!ENV.pageSpeedApiKey) {
        throw new Error("PAGESPEED_API_KEY is not configured");
      }
      return runAudit(input.url, input.strategy);
    }),

  /** Run both mobile and desktop audits in parallel */
  auditBoth: adminProcedure
    .input(
      z.object({
        url: z.string().url().default("https://www.chalkpicks.pro"),
      })
    )
    .mutation(async ({ input }) => {
      if (!ENV.pageSpeedApiKey) {
        throw new Error("PAGESPEED_API_KEY is not configured");
      }
      const [mobile, desktop] = await Promise.all([
        runAudit(input.url, "mobile"),
        runAudit(input.url, "desktop"),
      ]);
      return { mobile, desktop };
    }),
});
