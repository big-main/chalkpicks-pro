#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "server/routers/picks.ts");
let s = fs.readFileSync(file, "utf8");
if (s.includes("afterPickCreated")) {
  console.log("already wired");
  process.exit(0);
}
if (!s.includes('from "../_core/llm"')) {
  console.error("llm import missing");
  process.exit(1);
}
s = s.replace(
  'import { invokeLLM } from "../_core/llm";',
  'import { invokeLLM } from "../_core/llm";\nimport { afterPickCreated } from "../_core/after-pick-created";'
);
const old = `        return {
          success: true,
          pick: { ...parsed, id: (inserted as any).insertId },
        };`;
const neu = `        await afterPickCreated(inserted, {
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
        return {
          success: true,
          pick: { ...parsed, id: (inserted as any).insertId },
        };`;
if (!s.includes(old)) {
  console.error("return block not found — check picks.ts formatting");
  process.exit(1);
}
s = s.replace(old, neu);
fs.writeFileSync(file, s);
console.log("wired generateAI → afterPickCreated");
