import "dotenv/config";
import express from "express";
import { createServer, Server } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../webhook";
import { registerStorageProxy } from "./storageProxy";
import { registerPayPalWebhook } from "../paypal-webhook";
import { startScheduler } from "../scheduler";
import { initializeWebSocket } from "../websocket";
import { startLiveDataStreaming } from "./liveDataStreamer";
import { arbitrageRefreshHandler } from "../handlers/arbitrageRefreshHandler";
import { registerSecurityMiddleware } from "../middleware/security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required but not set");
  }
  const app = express();
  app.set("trust proxy", 1); // Trust first proxy (Manus/Cloud Run)
  const server = createServer(app);
  // Register webhooks BEFORE body parsers (needs raw body)
  registerStripeWebhook(app);
  registerPayPalWebhook(app);
  // Storage proxy for uploaded assets
  registerStorageProxy(app);

  // Security middleware (helmet, rate limiting, sanitization)
  registerSecurityMiddleware(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Scheduled cron handler — must come before SPA catch-all
  app.post("/api/scheduled/refresh-arbitrage", arbitrageRefreshHandler);

  // Explicit routes for SEO/verification XML files — must come before SPA catch-all
  const xmlFiles = ['BingSiteAuth.xml', 'sitemap.xml', 'sitemap.xsl', 'chalkpicks2026indexnow.txt'];
  xmlFiles.forEach(filename => {
    app.get(`/${filename}`, (req, res) => {
      import('path').then(({ resolve, join }) => {
        const publicDir = process.env.NODE_ENV === 'development'
          ? resolve(process.cwd(), 'client', 'public')
          : resolve(import.meta.dirname, 'public');
        const filePath = join(publicDir, filename);
        const contentType = filename.endsWith('.xml') ? 'application/xml'
          : filename.endsWith('.xsl') ? 'application/xslt+xml'
          : 'text/plain';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.sendFile(filePath, (err) => {
          if (err) res.status(404).send('Not found');
        });
      });
    });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Initialize WebSocket for real-time updates
    initializeWebSocket(server);
    // Start live data streaming
    startLiveDataStreaming();
    // Start daily picks scheduler
    startScheduler();
  });
}

startServer().catch(console.error);
