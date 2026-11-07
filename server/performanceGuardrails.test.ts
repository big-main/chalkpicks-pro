import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("performance guardrails", () => {
  it("keeps mobile zoom accessible", () => {
    const html = readProjectFile("client/index.html");
    expect(html).toContain(
      'name="viewport" content="width=device-width, initial-scale=1.0"'
    );
    expect(html).not.toContain("maximum-scale");
  });

  it("defers noncritical global widgets behind an idle boundary", () => {
    const app = readProjectFile("client/src/App.tsx");
    const deferred = readProjectFile(
      "client/src/components/DeferredGlobalWidgets.tsx"
    );
    expect(app).toContain("DeferredGlobalWidgets");
    expect(app).toContain("<Suspense fallback={null}>");
    expect(deferred).toContain("requestIdleCallback");
    expect(deferred).toContain("timeout: 2500");
  });

  it("bounds hero canvas work and cleans up visibility listeners", () => {
    const hero = readProjectFile("client/src/components/HeroBackground.tsx");
    expect(hero).toContain("Math.min(window.devicePixelRatio || 1, 1.5)");
    expect(hero).toMatch(/Math\.min\(\s*36/);
    expect(hero).toContain('document.addEventListener("visibilitychange"');
    expect(hero).toContain('document.removeEventListener("visibilitychange"');
  });
});
