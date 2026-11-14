import "dotenv/config";
import net from "net";
import { createApp } from "./app";
import { serveStatic, setupVite } from "./vite";
import { registerPrerenderMiddleware } from "../prerender";
import { startScheduler } from "../scheduler";
import { initializeWebSocket } from "../websocket";
import { startLiveDataStreaming } from "./liveDataStreamer";
import { shouldRunBackgroundJobs } from "./backgroundJobPolicy";

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
  const { app, server } = await createApp();
  // Prerender middleware — must be before Vite/static so bots get HTML+JSON-LD
  registerPrerenderMiddleware(app);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // In production, NEVER shift ports — the health check and load balancer
  // expect exactly the PORT env var. Only auto-scan in development.
  const port =
    process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.warn(`Server running on http://localhost:${port}/`);
    // Initialize WebSocket for real-time updates
    initializeWebSocket(server);
    if (shouldRunBackgroundJobs()) {
      // Start live data streaming and daily picks scheduler in production only.
      startLiveDataStreaming();
      startScheduler();
    } else {
      console.warn(
        "[BackgroundJobs] Disabled outside production (set ENABLE_BACKGROUND_JOBS=true to opt in)"
      );
    }
  });
}

startServer().catch(console.error);
