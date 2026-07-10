
import { Request, Response } from "express";
import { createCanvas, registerFont } from "canvas";
import path from "path";

export async function generateOgImage(req: Request, res: Response) {
  try {
    const { title, subtitle, odds, confidence } = req.query;

    // Create a 1200x630 canvas (standard OG size)
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext("2d");

    // Background - Dark Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#0f172a"); // slate-900
    gradient.addColorStop(1, "#1e293b"); // slate-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Add some accent shapes
    ctx.fillStyle = "rgba(234, 75, 113, 0.1)"; // brand color with low opacity
    ctx.beginPath();
    ctx.arc(1100, 100, 200, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 70px sans-serif";
    ctx.fillText((title as string) || "ChalkPicks Pro", 60, 200);

    // Subtitle
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "40px sans-serif";
    ctx.fillText((subtitle as string) || "AI-Powered Sports Analytics", 60, 280);

    // Odds Badge
    if (odds) {
      ctx.fillStyle = "#ea4b71"; // brand color
      ctx.beginPath();
      ctx.roundRect(60, 350, 250, 80, 10);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(`Odds: ${odds}`, 85, 405);
    }

    // Confidence
    if (confidence) {
      ctx.fillStyle = "#10b981"; // emerald-500
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(`Confidence: ${confidence}%`, odds ? 350 : 60, 405);
    }

    // Footer Branding
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "30px sans-serif";
    ctx.fillText("chalkpicks.live", 60, 570);

    // Convert to buffer and send
    const buffer = canvas.toBuffer("image/png");
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error) {
    console.error("OG Image generation failed:", error);
    res.status(500).send("Failed to generate image");
  }
}
