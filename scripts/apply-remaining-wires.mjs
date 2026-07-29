#!/usr/bin/env node
/**
 * One-shot local patcher for remaining wires (run from repo root):
 *   node scripts/apply-remaining-wires.mjs
 *
 * 1) index.ts → runBootGuards()
 * 2) picks.ts generateAI → afterPickCreated()
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function patchIndex() {
  const file = path.join(root, "server/_core/index.ts");
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("runBootGuards")) {
    console.log("[skip] index.ts already wired");
    return;
  }
  if (!s.includes('from "./indexnow"')) {
    console.error("[fail] index.ts: expected indexnow import");
    process.exit(1);
  }
  s = s.replace(
    'import { registerIndexNowKeyRoute } from "./indexnow";',
    'import { registerIndexNowKeyRoute } from "./indexnow";\nimport { runBootGuards } from "./boot-env";'
  );
  s = s.replace(
    /async function startServer\(\) \{\s*if \(!process\.env\.JWT_SECRET\) \{[\s\S]*?\}\s*/,
    "async function startServer() {\n  runBootGuards();\n"
  );
  fs.writeFileSync(file, s);
  console.log("[ok] index.ts → runBootGuards()");
}

function patchPicks() {
  const file = path.join(root, "server/routers/picks.ts");
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("afterPickCreated")) {
    console.log("[skip] picks.ts already wired");
    return;
  }
  if (!s.includes('from "../_core/llm"')) {
    console.error("[fail] picks.ts: expected llm import");
    process.exit(1);
  }
  s = s.replace(
    'import { invokeLLM } from "../_core/llm";',
    'import { invokeLLM } from "../_core/llm";\nimport { afterPickCreated } from "../_core/after-pick-created";'
  );
  // After insert + n8n block, inject ledger before return success
  const needle =
    "return { success: true, pick: { ...parsed, id: (inserted as any).insertId } };";
  if (!s.includes(needle)) {
    console.error("[fail] picks.ts: generateAI return needle not found");
    process.exit(1);
  }
  const replacement = `await afterPickCreated(inserted, {
          sportKey: input.sportKey,
          homeTeam: homeTeam ?? input.matchup,
          awayTeam: awayTeam ?? "",
          recommendation: parsed.recommendation,
          pickType: parsed.pickType,
          odds: Math.round(parsed.odds),
          confidenceScore: Math.min(95, Math.max(50, Math.round(parsed.confidenceScore))),
          pickDate: today,
          tier: "premium",
        });
        return { success: true, pick: { ...parsed, id: (inserted as any).insertId } };`;
  s = s.replace(needle, replacement);
  fs.writeFileSync(file, s);
  console.log("[ok] picks.ts generateAI → afterPickCreated()");
}

patchIndex();
patchPicks();
console.log("Done. Review git diff, then commit.");
