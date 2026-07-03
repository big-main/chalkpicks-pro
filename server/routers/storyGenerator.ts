import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import sharp from "sharp";

/**
 * ChalkPicks Instagram Story Generator
 * Generates branded 1080×1920 story images for @chalkpicks
 * Brand: dark #0d0f14 bg, metallic gold #d4a017 headers, neon green #39ff14 accents
 */

const SPORT_EMOJI: Record<string, string> = {
  nfl: "🏈", nba: "🏀", mlb: "⚾", nhl: "🏒",
  ncaaf: "🏈", ncaab: "🏀", soccer: "⚽", tennis: "🎾", mma: "🥊",
};

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildStorySvg(opts: {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  odds: number;
  confidenceScore: number;
  pickType: string;
  aiAnalysis?: string;
  result?: string;
  date: string;
}): string {
  const {
    sport, homeTeam, awayTeam, recommendation, odds,
    confidenceScore, pickType, aiAnalysis, result, date,
  } = opts;

  const sportEmoji = SPORT_EMOJI[sport.toLowerCase()] ?? "🎯";
  const oddsStr = odds > 0 ? `+${odds}` : String(odds);
  const confColor = confidenceScore >= 80 ? "#39ff14" : confidenceScore >= 65 ? "#f0b800" : "#e63946";

  // Result overlay colors
  const resultBg = result === "win"
    ? "rgba(57,255,20,0.18)"
    : result === "loss"
    ? "rgba(230,57,70,0.18)"
    : "none";
  const resultText = result === "win" ? "✅ WIN" : result === "loss" ? "❌ LOSS" : "";
  const resultColor = result === "win" ? "#39ff14" : "#e63946";

  // Truncate analysis to fit
  const analysisText = aiAnalysis
    ? aiAnalysis.length > 160 ? aiAnalysis.slice(0, 157) + "…" : aiAnalysis
    : "AI-powered analysis based on historical trends, matchup data, and real-time line movement.";

  // Wrap long text into lines (~28 chars per line for analysis at font-size 28)
  function wrapText(text: string, maxChars: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length <= maxChars) {
        current = (current + " " + word).trim();
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const analysisLines = wrapText(analysisText, 38);
  const matchup = `${escapeXml(awayTeam)} @ ${escapeXml(homeTeam)}`;
  const matchupLines = wrapText(matchup, 28);

  // Gold logo text (crown + CHALKPICKS)
  const goldLogoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-gold-nCsATHVv3wk3X9VKdpDRvo.png";

  return `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d0f14"/>
      <stop offset="40%" stop-color="#0d1520"/>
      <stop offset="100%" stop-color="#0a0c10"/>
    </linearGradient>
    <!-- Gold shimmer gradient -->
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a07010"/>
      <stop offset="35%" stop-color="#f0b800"/>
      <stop offset="65%" stop-color="#d4a017"/>
      <stop offset="100%" stop-color="#a07010"/>
    </linearGradient>
    <!-- Green glow filter -->
    <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Gold glow filter -->
    <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Subtle noise pattern -->
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
      <feComposite in="blend" in2="SourceGraphic" operator="in"/>
    </filter>
    <clipPath id="roundedCard">
      <rect x="60" y="380" width="960" height="440" rx="24"/>
    </clipPath>
    <clipPath id="roundedConfCard">
      <rect x="60" y="860" width="460" height="200" rx="20"/>
    </clipPath>
    <clipPath id="roundedOddsCard">
      <rect x="560" y="860" width="460" height="200" rx="20"/>
    </clipPath>
  </defs>

  <!-- ═══ BACKGROUND ═══ -->
  <rect width="1080" height="1920" fill="url(#bgGrad)"/>

  <!-- Subtle radial glow top-center (green) -->
  <ellipse cx="540" cy="300" rx="500" ry="300" fill="rgba(57,255,20,0.04)"/>
  <!-- Subtle radial glow bottom (gold) -->
  <ellipse cx="540" cy="1700" rx="600" ry="280" fill="rgba(212,160,23,0.05)"/>

  <!-- ═══ TOP HEADER BAR ═══ -->
  <rect x="0" y="0" width="1080" height="140" fill="rgba(13,15,20,0.95)"/>
  <rect x="0" y="138" width="1080" height="2" fill="url(#goldGrad)" opacity="0.7"/>

  <!-- Logo area (text fallback since SVG can't load external images reliably) -->
  <!-- Crown icon SVG path -->
  <g transform="translate(60, 28)">
    <!-- Crown shape -->
    <path d="M40 80 L10 30 L25 55 L40 20 L55 55 L70 30 L60 80 Z" fill="url(#goldGrad)" stroke="#a07010" stroke-width="1.5"/>
    <!-- Crown base -->
    <rect x="8" y="78" width="64" height="12" rx="4" fill="url(#goldGrad)"/>
    <!-- Jewels -->
    <circle cx="40" cy="22" r="5" fill="#39ff14" opacity="0.9"/>
    <circle cx="12" cy="32" r="4" fill="#e63946" opacity="0.8"/>
    <circle cx="68" cy="32" r="4" fill="#1e90ff" opacity="0.8"/>
  </g>
  <!-- CHALKPICKS text -->
  <text x="160" y="75" font-family="Arial Black, Arial" font-weight="900" font-size="48" fill="url(#goldGrad)" letter-spacing="4">CHALK</text>
  <text x="160" y="120" font-family="Arial Black, Arial" font-weight="900" font-size="48" fill="#f0f2f5" letter-spacing="4">PICKS</text>

  <!-- @chalkpicks handle (right side) -->
  <text x="1020" y="80" font-family="Arial" font-size="26" fill="rgba(200,210,230,0.6)" text-anchor="end">@chalkpicks</text>
  <text x="1020" y="112" font-family="Arial" font-size="22" fill="rgba(200,210,230,0.4)" text-anchor="end">${escapeXml(date)}</text>

  <!-- ═══ SPORT BADGE ═══ -->
  <rect x="60" y="180" width="220" height="60" rx="30" fill="rgba(57,255,20,0.1)" stroke="#39ff14" stroke-width="1.5"/>
  <text x="150" y="220" font-family="Arial Black, Arial" font-weight="900" font-size="26" fill="#39ff14" text-anchor="middle" letter-spacing="3">${sportEmoji} ${escapeXml(sport.toUpperCase())}</text>

  <!-- Pick type badge -->
  <rect x="300" y="180" width="260" height="60" rx="30" fill="rgba(212,160,23,0.1)" stroke="#d4a017" stroke-width="1.5"/>
  <text x="430" y="220" font-family="Arial" font-size="24" fill="#f0b800" text-anchor="middle" letter-spacing="2">${escapeXml(pickType.toUpperCase())}</text>

  <!-- ═══ MATCHUP SECTION ═══ -->
  <text x="540" y="330" font-family="Arial" font-size="30" fill="rgba(200,210,230,0.55)" text-anchor="middle" letter-spacing="1">MATCHUP</text>
  ${matchupLines.map((line, i) =>
    `<text x="540" y="${370 + i * 46}" font-family="Arial Black, Arial" font-weight="900" font-size="40" fill="#f0f2f5" text-anchor="middle">${escapeXml(line)}</text>`
  ).join("\n  ")}

  <!-- ═══ PICK CARD ═══ -->
  <rect x="60" y="${340 + matchupLines.length * 46}" width="960" height="200" rx="24" fill="rgba(21,28,42,0.9)" stroke="rgba(57,255,20,0.25)" stroke-width="2"/>
  <!-- Green left accent bar -->
  <rect x="60" y="${340 + matchupLines.length * 46}" width="8" height="200" rx="4" fill="#39ff14"/>

  <text x="540" y="${395 + matchupLines.length * 46}" font-family="Arial" font-size="22" fill="rgba(200,210,230,0.5)" text-anchor="middle" letter-spacing="3">TODAY'S PICK</text>
  <text x="540" y="${480 + matchupLines.length * 46}" font-family="Arial Black, Arial" font-weight="900" font-size="56" fill="#39ff14" text-anchor="middle" filter="url(#greenGlow)">${escapeXml(recommendation)}</text>

  <!-- ═══ STATS ROW ═══ -->
  <!-- Confidence card -->
  <rect x="60" y="${570 + matchupLines.length * 46}" width="460" height="200" rx="20" fill="rgba(21,28,42,0.85)" stroke="rgba(212,160,23,0.2)" stroke-width="1.5"/>
  <text x="290" y="${620 + matchupLines.length * 46}" font-family="Arial" font-size="22" fill="rgba(200,210,230,0.5)" text-anchor="middle" letter-spacing="2">CONFIDENCE</text>
  <text x="290" y="${710 + matchupLines.length * 46}" font-family="Arial Black, Arial" font-weight="900" font-size="72" fill="${confColor}" text-anchor="middle">${confidenceScore}%</text>

  <!-- Odds card -->
  <rect x="560" y="${570 + matchupLines.length * 46}" width="460" height="200" rx="20" fill="rgba(21,28,42,0.85)" stroke="rgba(212,160,23,0.2)" stroke-width="1.5"/>
  <text x="790" y="${620 + matchupLines.length * 46}" font-family="Arial" font-size="22" fill="rgba(200,210,230,0.5)" text-anchor="middle" letter-spacing="2">ODDS</text>
  <text x="790" y="${710 + matchupLines.length * 46}" font-family="Arial Black, Arial" font-weight="900" font-size="72" fill="${odds > 0 ? "#39ff14" : "#f0f2f5"}" text-anchor="middle">${escapeXml(oddsStr)}</text>

  <!-- ═══ AI ANALYSIS CARD ═══ -->
  <rect x="60" y="${800 + matchupLines.length * 46}" width="960" height="${60 + analysisLines.length * 38 + 40}" rx="20" fill="rgba(21,28,42,0.7)" stroke="rgba(30,144,255,0.2)" stroke-width="1.5"/>
  <text x="140" y="${850 + matchupLines.length * 46}" font-family="Arial" font-size="22" fill="#1e90ff" letter-spacing="2">🤖 AI ANALYSIS</text>
  ${analysisLines.map((line, i) =>
    `<text x="90" y="${890 + matchupLines.length * 46 + i * 38}" font-family="Arial" font-size="26" fill="rgba(200,210,230,0.75)">${escapeXml(line)}</text>`
  ).join("\n  ")}

  <!-- ═══ RESULT BADGE (if settled) ═══ -->
  ${result && result !== "pending" ? `
  <rect x="60" y="${1040 + matchupLines.length * 46 + analysisLines.length * 38}" width="960" height="100" rx="20" fill="${resultBg}" stroke="${resultColor}" stroke-width="2"/>
  <text x="540" y="${1105 + matchupLines.length * 46 + analysisLines.length * 38}" font-family="Arial Black, Arial" font-weight="900" font-size="52" fill="${resultColor}" text-anchor="middle">${resultText}</text>
  ` : ""}

  <!-- ═══ DIVIDER ═══ -->
  <rect x="60" y="1760" width="960" height="1" fill="url(#goldGrad)" opacity="0.4"/>

  <!-- ═══ FOOTER ═══ -->
  <text x="540" y="1820" font-family="Arial Black, Arial" font-weight="900" font-size="34" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="2">chalkpicks.live</text>
  <text x="540" y="1870" font-family="Arial" font-size="22" fill="rgba(200,210,230,0.35)" text-anchor="middle">For entertainment purposes only. Bet responsibly.</text>

  <!-- ═══ BOTTOM ACCENT LINE ═══ -->
  <rect x="0" y="1910" width="1080" height="10" fill="url(#goldGrad)" opacity="0.6"/>
</svg>`;
}

export const storyGeneratorRouter = router({
  /**
   * Generate a branded Instagram story image for a pick
   * Returns base64-encoded PNG (1080×1920)
   */
  generateStory: publicProcedure
    .input(z.object({
      sport: z.string(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      recommendation: z.string(),
      odds: z.number(),
      confidenceScore: z.number().min(0).max(100),
      pickType: z.string(),
      aiAnalysis: z.string().optional(),
      result: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const date = new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

      const svg = buildStorySvg({ ...input, date });

      try {
        const buffer = await sharp(Buffer.from(svg))
          .resize(1080, 1920, { fit: "fill" })
          .png({ quality: 95 })
          .toBuffer();

        return {
          success: true,
          buffer: buffer.toString("base64"),
          mimeType: "image/png",
          width: 1080,
          height: 1920,
          filename: `chalkpicks-story-${input.sport}-${Date.now()}.png`,
        };
      } catch (error) {
        console.error("[StoryGenerator] SVG→PNG failed:", error);
        return {
          success: false,
          error: "Failed to generate story image",
        };
      }
    }),
});
