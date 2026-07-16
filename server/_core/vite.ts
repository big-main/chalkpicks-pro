import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Dynamic imports: vite + nanoid are devDependencies. Static imports here
  // would force them into the production bundle's require graph, so a
  // `pnpm install --prod` deploy would crash at boot.
  const { createServer: createViteServer } = await import("vite");
  const { nanoid } = await import("nanoid");
  const viteConfig = (await import("../../vite.config")).default;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Cache policy:
  //  - Vite emits content-hashed files as /assets/Name-Hash.ext → immutable 1yr
  //    (previous regex expected ".hexhash." and matched nothing, so every JS/CSS
  //    file was re-validated hourly).
  //  - HTML / navigations → no-cache so deploys show up immediately.
  //  - Everything else → 1 hour.
  const HASHED_ASSET = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|jpe?g|webp|avif|svg|map)$/;
  app.use((req, res, next) => {
    if (HASHED_ASSET.test(req.path)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (/\.(html)$/.test(req.path) || !req.path.includes(".")) {
      res.set("Cache-Control", "no-cache");
    } else {
      res.set("Cache-Control", "public, max-age=3600");
    }
    next();
  });

  app.use(express.static(distPath));

  // Explicit routes for verification and SEO files that must not be caught by SPA fallback
  app.get("/BingSiteAuth.xml", (_req, res) => {
    const filePath = path.resolve(distPath, "BingSiteAuth.xml");
    if (fs.existsSync(filePath)) {
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=86400");
      res.sendFile(filePath);
    } else {
      res.status(404).send("Not found");
    }
  });

  // API routes that fall through are true 404s — never answer them with the
  // SPA shell (a JSON client receiving HTML with status 200 is a debugging trap).
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
