import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
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

  // Cache middleware: versioned assets get long-term cache, HTML gets short cache
  app.use((req, res, next) => {
    // Versioned assets (contain hash in filename) get 1 year cache
    if (/\.[a-f0-9]{8}\.(js|css|woff2?|png|jpg|webp|svg)$/.test(req.path)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    }
    // HTML and JSON get short cache (5 minutes)
    else if (/\.(html|json)$/.test(req.path) || !req.path.includes(".")) {
      res.set("Cache-Control", "public, max-age=300, must-revalidate");
    }
    // Other assets get moderate cache (1 hour)
    else {
      res.set("Cache-Control", "public, max-age=3600");
    }
    next();
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
