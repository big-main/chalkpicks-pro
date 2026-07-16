import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import sharp from "sharp";

/**
 * Generates a dynamic OG (Open Graph) image for shared picks
 * Used for Twitter/X, Facebook, Discord card previews
 */
export const ogImageRouter = router({
  generatePickCard: publicProcedure
    .input(z.object({
      pickId: z.string(),
      sport: z.string(),
      team: z.string(),
      pick: z.string(), // e.g., "Over 45.5"
      confidence: z.number().min(0).max(100),
      odds: z.string().optional(), // e.g., "-110"
    }))
    .mutation(async ({ input }) => {
      // Generate a branded OG image card
      const width = 1200;
      const height = 630;
      const bgColor = "#0f172a"; // dark blue
      const accentColor = "#3b82f6"; // bright blue

      // Create SVG template
      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect width="${width}" height="${height}" fill="${bgColor}"/>
          
          <!-- Accent bar -->
          <rect width="8" height="${height}" fill="${accentColor}"/>
          
          <!-- ChalkPicks logo/branding -->
          <text x="60" y="80" font-size="48" font-weight="bold" fill="${accentColor}" font-family="Arial">
            ChalkPicks
          </text>
          
          <!-- Sport badge -->
          <rect x="60" y="120" width="200" height="50" rx="8" fill="${accentColor}" opacity="0.2"/>
          <text x="80" y="155" font-size="28" font-weight="bold" fill="white" font-family="Arial">
            ${input.sport}
          </text>
          
          <!-- Team name -->
          <text x="60" y="240" font-size="36" font-weight="bold" fill="white" font-family="Arial">
            ${input.team}
          </text>
          
          <!-- Pick recommendation -->
          <text x="60" y="310" font-size="32" fill="${accentColor}" font-family="Arial">
            ${input.pick}
          </text>
          
          <!-- Confidence score -->
          <circle cx="950" cy="200" r="80" fill="${accentColor}" opacity="0.1" stroke="${accentColor}" stroke-width="3"/>
          <text x="950" y="210" font-size="48" font-weight="bold" fill="${accentColor}" text-anchor="middle" font-family="Arial">
            ${input.confidence}%
          </text>
          <text x="950" y="240" font-size="20" fill="white" text-anchor="middle" font-family="Arial">
            Confidence
          </text>
          
          <!-- Odds (if provided) -->
          ${input.odds ? `
            <text x="60" y="400" font-size="24" fill="#9ca3af" font-family="Arial">
              Odds: ${input.odds}
            </text>
          ` : ""}
          
          <!-- CTA -->
          <text x="60" y="580" font-size="20" fill="#9ca3af" font-family="Arial">
            View full analysis at chalkpicks.live
          </text>
        </svg>
      `;

      try {
        // Convert SVG to PNG using sharp
        const buffer = await sharp(Buffer.from(svg))
          .png()
          .toBuffer();

        return {
          success: true,
          buffer: buffer.toString("base64"),
          mimeType: "image/png",
          width,
          height,
        };
      } catch (error) {
        console.error("[OG Image] Generation failed:", error);
        return {
          success: false,
          error: "Failed to generate OG image",
        };
      }
    }),
});
