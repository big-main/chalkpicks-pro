import { describe, expect, it } from "vitest";
import { build } from "esbuild";

describe("Backend deployment dependency graph", () => {
  it("excludes Vite, Tailwind and the listening-server bootstrap", async () => {
    const result = await build({
      entryPoints: ["server/_core/vercelHandler.ts"],
      bundle: true,
      platform: "node",
      packages: "external",
      format: "esm",
      write: false,
      metafile: true,
    });
    const inputs = Object.keys(result.metafile!.inputs);
    expect(inputs).toContain("server/_core/app.ts");
    expect(inputs).not.toContain("server/_core/index.ts");
    expect(
      inputs.some(path =>
        /(?:_core\/vite\.ts|vite\.config|tailwind)/.test(path)
      )
    ).toBe(false);
    const externalImports = Object.values(result.metafile!.outputs).flatMap(
      output => output.imports.map(item => item.path)
    );
    expect(
      externalImports.some(path =>
        /^(?:vite|@tailwindcss\/|tailwindcss)/.test(path)
      )
    ).toBe(false);
  });
});
