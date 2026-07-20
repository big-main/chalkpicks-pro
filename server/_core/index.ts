import "dotenv/config";
import express from "express";
import { createServer, Server } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerPrerenderMiddleware } from "../prerender";
import { registerStripeWebhook } from "../webhook";
import { registerStorageProxy } from "./storageProxy";
import { registerPayPalWebhook } from "../paypal-webhook";
import { startScheduler } from "../scheduler";
import { initializeWebSocket } from "../websocket";
import { startLiveDataStreaming } from "./liveDataStreamer";
import { arbitrageRefreshHandler } from "../handlers/arbitrageRefreshHandler";
import { dailySocialPostHandler } from "../handlers/dailySocialPostHandler";
import { weeklyNewsletterHandler } from "../handlers/weeklyNewsletterHandler";
import { welcomeDripHandler } from "../handlers/welcomeDripHandler";
import { blogContentHandler } from "../handlers/blogContentHandler";
import { picksBlogHandler } from "../handlers/picksBlogHandler";
import { discordPostHandler } from "../handlers/discordPostHandler";
import { ollamaWarmupHandler } from "../handlers/ollamaWarmupHandler";
import { registerSecurityMiddleware } from "../middleware/security";
import { registerWorkerRoutes } from "../workerRoutes";
import { apiReference } from "@scalar/express-api-reference";
import compression from "compression";
import { getSitemapXml } from "./sitemap";
import { registerIndexNowKeyRoute } from "./indexnow";

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

  // Gzip/deflate every compressible response (HTML/JS/CSS/JSON). The main JS
  // bundle drops ~70% on the wire; API payloads shrink similarly.
  app.use(compression({ threshold: 1024 }));

  // Body parsers: the 50mb limit is only needed on tRPC (base64 story/OG
  // images). Everything else gets a tight 1mb cap to shrink the DoS surface.
  app.use("/api/trpc", express.json({ limit: "50mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Fast health check endpoint for deployment (responds immediately)
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  // Cloud-computer worker API (token-guarded; see cloud-computer/README.md)
  registerWorkerRoutes(app);

  // Scalar API Reference docs — public endpoint
  app.get("/openapi.json", (_req, res) => {
    res.json({
      openapi: "3.1.0",
      info: {
        title: "ChalkPicks Pro API",
        version: "1.0.0",
        description: "AI-powered sports betting analytics API. Access picks, odds, arbitrage, analytics, and subscription data. All protected endpoints require a valid session cookie obtained by registering or logging in via the auth.register / auth.login tRPC mutations.",
        contact: { name: "ChalkPicks Support", email: "admin@chalkpicks.live", url: "https://chalkpicks.live" },
        license: { name: "Proprietary", url: "https://chalkpicks.live/terms" },
      },
      servers: [
        { url: "https://chalkpicks.live/api", description: "Production" },
        { url: "https://chalkpicks.manus.space/api", description: "Staging" },
      ],
      security: [{ cookieAuth: [] }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "session",
            description: "Session cookie issued after a successful auth.register or auth.login tRPC mutation.",
          },
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token for server-to-server requests. Include as: `Authorization: Bearer <token>`",
          },
        },
        schemas: {
          Pick: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              sport: { type: "string", enum: ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB"], example: "NBA" },
              game: { type: "string", example: "Lakers vs Celtics" },
              pick: { type: "string", example: "Lakers -4.5" },
              confidence: { type: "number", minimum: 0, maximum: 100, example: 78.5 },
              odds: { type: "string", example: "-110" },
              analysis: { type: "string", example: "Strong home court advantage with key injury news favoring LA" },
              result: { type: "string", nullable: true, enum: ["win", "loss", "push", null], example: null },
              gameTime: { type: "string", format: "date-time", example: "2026-07-10T19:30:00Z" },
              createdAt: { type: "string", format: "date-time" },
            },
            required: ["id", "sport", "game", "pick", "confidence", "odds"],
          },
          OddsLine: {
            type: "object",
            properties: {
              gameId: { type: "string", example: "nba_20260710_lal_bos" },
              sport: { type: "string", example: "basketball_nba" },
              homeTeam: { type: "string", example: "Los Angeles Lakers" },
              awayTeam: { type: "string", example: "Boston Celtics" },
              commenceTime: { type: "string", format: "date-time" },
              bookmakers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", example: "draftkings" },
                    title: { type: "string", example: "DraftKings" },
                    markets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string", example: "h2h" },
                          outcomes: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string", example: "Los Angeles Lakers" },
                                price: { type: "number", example: -120 },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          ArbitrageOpportunity: {
            type: "object",
            properties: {
              id: { type: "string", example: "arb_20260710_001" },
              sport: { type: "string", example: "NBA" },
              game: { type: "string", example: "Lakers vs Celtics" },
              profitPercent: { type: "number", example: 2.34 },
              legs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    book: { type: "string", example: "DraftKings" },
                    outcome: { type: "string", example: "Lakers" },
                    odds: { type: "number", example: -120 },
                    stake: { type: "number", example: 52.17 },
                  },
                },
              },
              detectedAt: { type: "string", format: "date-time" },
            },
          },
          BlogPost: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              title: { type: "string", example: "Top NBA Betting Strategies for 2026" },
              slug: { type: "string", example: "top-nba-betting-strategies-2026" },
              excerpt: { type: "string", nullable: true },
              heroImage: { type: "string", format: "uri", nullable: true },
              seoDescription: { type: "string", nullable: true },
              publishedAt: { type: "string", format: "date-time", nullable: true },
              status: { type: "string", enum: ["draft", "published"], example: "published" },
            },
            required: ["id", "title", "slug", "status"],
          },
          SubscriptionPlan: {
            type: "object",
            properties: {
              id: { type: "string", enum: ["basic", "pro", "yearly"], example: "pro" },
              name: { type: "string", example: "Pro" },
              price: { type: "number", example: 19.99 },
              interval: { type: "string", enum: ["month", "year"], example: "month" },
              features: { type: "array", items: { type: "string" }, example: ["Unlimited AI picks", "Live odds", "Arbitrage scanner"] },
              stripePriceId: { type: "string", example: "price_xxx" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "integer", example: 42 },
              name: { type: "string", example: "John Doe" },
              email: { type: "string", format: "email", example: "john@example.com" },
              role: { type: "string", enum: ["user", "admin"], example: "user" },
              tier: { type: "string", enum: ["free", "basic", "pro", "yearly"], example: "pro" },
              subscriptionStatus: { type: "string", nullable: true, example: "active" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  message: { type: "string", example: "UNAUTHORIZED" },
                  code: { type: "integer", example: 401 },
                },
              },
            },
          },
        },
      },
      paths: {
        "/trpc/auth.register": {
          post: {
            summary: "Register a new account",
            description: "Creates a user with email + password and issues a session cookie.",
            tags: ["Authentication"],
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "Jane Bettor" },
                      email: { type: "string", format: "email", example: "jane@example.com" },
                      password: { type: "string", minLength: 8, maxLength: 128 },
                    },
                    required: ["name", "email", "password"],
                  },
                },
              },
            },
            responses: {
              "200": { description: "Account created, session cookie set" },
              "409": { description: "Email already registered", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/auth.login": {
          post: {
            summary: "Log in with email + password",
            description: "Verifies credentials and issues a session cookie.",
            tags: ["Authentication"],
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      email: { type: "string", format: "email" },
                      password: { type: "string" },
                    },
                    required: ["email", "password"],
                  },
                },
              },
            },
            responses: {
              "200": { description: "Session cookie set" },
              "401": { description: "Invalid email or password", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/auth.me": {
          get: {
            summary: "Get current authenticated user",
            description: "Returns the currently authenticated user's profile. Requires a valid session cookie.",
            tags: ["Authentication"],
            security: [{ cookieAuth: [] }],
            parameters: [
              { name: "input", in: "query", schema: { type: "string" }, description: "tRPC input (not required for this query)" },
            ],
            responses: {
              "200": {
                description: "Authenticated user profile",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: { "$ref": "#/components/schemas/User" },
                          },
                        },
                      },
                    },
                    example: { result: { data: { id: 42, name: "John Doe", email: "john@example.com", role: "user", tier: "pro", subscriptionStatus: "active" } } },
                  },
                },
              },
              "401": { description: "Not authenticated", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/picks.today": {
          get: {
            summary: "Get today's AI picks",
            description: "Returns AI-generated picks for today's games with confidence scores. Requires Basic tier or higher.",
            tags: ["Picks"],
            security: [{ cookieAuth: [] }],
            parameters: [
              { name: "input", in: "query", schema: { type: "string" }, description: "Optional JSON: `{\"sport\":\"NBA\"}` to filter by sport" },
            ],
            responses: {
              "200": {
                description: "List of today's AI picks",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: { type: "array", items: { "$ref": "#/components/schemas/Pick" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": { description: "Not authenticated", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
              "403": { description: "Subscription required", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/odds.live": {
          get: {
            summary: "Get live odds from 10+ sportsbooks",
            description: "Returns real-time odds data aggregated from DraftKings, FanDuel, BetMGM, Caesars, and more. Requires Pro tier or higher.",
            tags: ["Odds"],
            security: [{ cookieAuth: [] }],
            parameters: [
              { name: "input", in: "query", schema: { type: "string" }, description: "JSON: `{\"sport\":\"basketball_nba\",\"markets\":[\"h2h\",\"spreads\"]}` " },
            ],
            responses: {
              "200": {
                description: "Live odds data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: { type: "array", items: { "$ref": "#/components/schemas/OddsLine" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": { description: "Not authenticated", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
              "403": { description: "Pro subscription required", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/arbitrage.scan": {
          get: {
            summary: "Scan for arbitrage opportunities",
            description: "Returns current arbitrage opportunities across all tracked sportsbooks. Profit percentages are guaranteed regardless of outcome. Requires Elite tier.",
            tags: ["Arbitrage"],
            security: [{ cookieAuth: [] }],
            responses: {
              "200": {
                description: "Current arbitrage opportunities",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: { type: "array", items: { "$ref": "#/components/schemas/ArbitrageOpportunity" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": { description: "Not authenticated", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
              "403": { description: "Elite subscription required", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/blog.list": {
          get: {
            summary: "List published blog articles",
            description: "Returns paginated published blog articles. Public endpoint — no authentication required.",
            tags: ["Blog"],
            security: [],
            parameters: [
              { name: "input", in: "query", schema: { type: "string" }, description: "JSON: `{\"limit\":9,\"offset\":0}`", example: "{\"limit\":9,\"offset\":0}" },
            ],
            responses: {
              "200": {
                description: "Paginated list of published articles",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: {
                              type: "object",
                              properties: {
                                posts: { type: "array", items: { "$ref": "#/components/schemas/BlogPost" } },
                                total: { type: "integer", example: 12 },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/trpc/blog.getBySlug": {
          get: {
            summary: "Get blog article by slug",
            description: "Returns a single published article including full HTML content and JSON-LD structured data. Public endpoint.",
            tags: ["Blog"],
            security: [],
            parameters: [
              { name: "input", in: "query", required: true, schema: { type: "string" }, description: "JSON: `{\"slug\":\"article-slug\"}`", example: "{\"slug\":\"top-nba-betting-strategies-2026\"}" },
            ],
            responses: {
              "200": {
                description: "Full blog post with content",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: {
                              allOf: [
                                { "$ref": "#/components/schemas/BlogPost" },
                                { type: "object", properties: { contentHtml: { type: "string" }, jsonLd: { type: "string" } } },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "404": { description: "Article not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/trpc/subscription.plans": {
          get: {
            summary: "Get available subscription plans",
            description: "Returns all subscription plans with pricing and features. Public endpoint.",
            tags: ["Subscriptions"],
            security: [],
            responses: {
              "200": {
                description: "Available plans: Basic $9.99/mo, Pro $19.99/mo, Elite $59.99/yr",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: { type: "array", items: { "$ref": "#/components/schemas/SubscriptionPlan" } },
                          },
                        },
                      },
                    },
                    example: {
                      result: {
                        data: [
                          { id: "basic", name: "Basic", price: 9.99, interval: "month", features: ["10 AI picks/day", "Basic stats"] },
                          { id: "pro", name: "Pro", price: 19.99, interval: "month", features: ["Unlimited picks", "Live odds", "Arbitrage scanner"] },
                          { id: "yearly", name: "Elite", price: 59.99, interval: "year", features: ["Everything in Pro", "Priority support", "Advanced analytics"] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/trpc/subscription.createCheckout": {
          post: {
            summary: "Create Stripe Checkout Session",
            description: "Creates a Stripe Checkout Session for the selected plan. Supports the CHALK15 promo code for 15% off. Requires authentication.",
            tags: ["Subscriptions"],
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      "0": {
                        type: "object",
                        properties: {
                          planId: { type: "string", enum: ["basic", "pro", "yearly"], example: "pro" },
                          promoCode: { type: "string", example: "CHALK15", description: "Optional promo code for discount" },
                          successUrl: { type: "string", format: "uri", example: "https://chalkpicks.live/payment-success" },
                          cancelUrl: { type: "string", format: "uri", example: "https://chalkpicks.live/pricing" },
                        },
                        required: ["planId", "successUrl", "cancelUrl"],
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Stripe Checkout Session URL",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: {
                          type: "object",
                          properties: {
                            data: {
                              type: "object",
                              properties: {
                                url: { type: "string", format: "uri", example: "https://checkout.stripe.com/pay/cs_xxx" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": { description: "Not authenticated", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
      },
      tags: [
        { name: "Authentication", description: "Email/password registration, login, and session management" },
        { name: "Picks", description: "AI-generated sports picks with confidence scores" },
        { name: "Odds", description: "Real-time odds from 10+ sportsbooks" },
        { name: "Arbitrage", description: "Guaranteed-profit arbitrage opportunity scanner" },
        { name: "Blog", description: "Sports betting content and analysis" },
        { name: "Subscriptions", description: "Subscription plans and Stripe Checkout" },
      ],
    });
  });

  app.use(
    "/api/docs",
    apiReference({
      spec: { url: "/openapi.json" },
      theme: "saturn",
      layout: "modern",
      defaultHttpClient: { targetKey: "javascript", clientKey: "fetch" },
    })
  );

  // Scheduled cron handlers — must come before SPA catch-all
  app.post("/api/scheduled/refresh-arbitrage", arbitrageRefreshHandler);
  app.post("/api/scheduled/daily-social-post", dailySocialPostHandler);
  app.post("/api/scheduled/weekly-newsletter", weeklyNewsletterHandler);
  app.post("/api/scheduled/welcome-drip", welcomeDripHandler);
  app.post("/api/scheduled/blog-content", blogContentHandler);
  app.post("/api/scheduled/picks-blog", picksBlogHandler);
  app.post("/api/scheduled/discord-post", discordPostHandler);
  app.post("/api/scheduled/ollama-warmup", ollamaWarmupHandler);
  app.post("/api/scheduled/distribute-payouts", async (req, res) => {
    try {
      console.log("[Payout] Weekly distribution triggered");
      res.json({ ok: true, message: "Payout distribution queued" });
    } catch (error) {
      console.error("[Payout] Distribution error:", error);
      res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
    }
  });

  // Dynamic sitemap — merges shared/seo-routes.ts static entries with DB-backed
  // blog post + pick URLs, so a newly published article shows up without a
  // rebuild/deploy. In-memory cache (~15 min); fails open to the static file
  // below on any error (DB down, etc).
  app.get("/sitemap.xml", async (_req, res) => {
    const xml = await getSitemapXml();
    if (xml) {
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=900");
      res.send(xml);
      return;
    }
    // Fail open to the static, build-time-generated sitemap.
    import('path').then(({ resolve, join }) => {
      const publicDir = process.env.NODE_ENV === 'development'
        ? resolve(process.cwd(), 'client', 'public')
        : resolve(import.meta.dirname, 'public');
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.sendFile(join(publicDir, 'sitemap.xml'), (err) => {
        if (err) res.status(404).send('Not found');
      });
    });
  });

  // IndexNow ownership-proof route (GET /<key>.txt) — must come before SPA catch-all
  registerIndexNowKeyRoute(app);

  // Explicit routes for SEO/verification XML files — must come before SPA catch-all
  // (chalkpicks2026indexnow.txt is served by registerIndexNowKeyRoute above)
  const xmlFiles = ['BingSiteAuth.xml', 'sitemap.xsl', 'llms.txt', 'robots.txt'];
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

  // Prerender middleware — must be before Vite/static so bots get HTML+JSON-LD
  registerPrerenderMiddleware(app);
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
