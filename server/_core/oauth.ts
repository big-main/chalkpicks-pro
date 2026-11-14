import { randomBytes } from "node:crypto";
import { parse } from "cookie";
import type { Express, Request } from "express";
import * as db from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

const STATE_COOKIE = "chalkpicks_oauth_state";
function redirectUri(req: Request) {
  const hostname = req.hostname;
  if (hostname === "chalkpicks.pro")
    return "https://chalkpicks.pro/api/oauth/callback";
  if (
    hostname.endsWith(".manus.space") ||
    hostname.endsWith(".manus.computer")
  ) {
    return `https://${req.get("host")}/api/oauth/callback`;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(hostname)
  ) {
    return `http://${req.get("host")}/api/oauth/callback`;
  }
  throw new Error("Unsupported OAuth origin");
}
async function authRequest(path: string, payload: object) {
  const base = process.env.OAUTH_SERVER_URL;
  if (!base) throw new Error("OAuth is not configured");
  const response = await fetch(
    `${base.replace(/\/$/, "")}/webdev.v1.WebDevAuthPublicService/${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!response.ok) throw new Error("OAuth provider rejected the request");
  return response.json();
}
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req, res) => {
    try {
      if (!process.env.VITE_APP_ID || !process.env.VITE_OAUTH_PORTAL_URL) {
        res.status(503).json({ error: "Google sign-in is not configured" });
        return;
      }
      const state = randomBytes(24).toString("base64url");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(STATE_COOKIE, state, { ...cookieOptions, maxAge: 600000 });
      const url = new URL(
        `${process.env.VITE_OAUTH_PORTAL_URL.replace(/\/$/, "")}/app-auth`
      );
      url.searchParams.set("appId", process.env.VITE_APP_ID);
      url.searchParams.set("redirectUri", redirectUri(req));
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      res.redirect(302, url.toString());
    } catch {
      res.status(400).json({ error: "Cannot start sign-in from this origin" });
    }
  });
  app.get("/api/oauth/callback", async (req, res) => {
    const { code, state } = req.query;
    const cookieState = parse(req.headers.cookie || "")[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, getSessionCookieOptions(req));
    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      !cookieState ||
      state !== cookieState
    ) {
      res
        .status(400)
        .json({ error: "Sign-in session expired. Start sign-in again." });
      return;
    }
    try {
      const token = await authRequest("ExchangeToken", {
        clientId: process.env.VITE_APP_ID,
        grantType: "authorization_code",
        code,
        redirectUri: redirectUri(req),
      });
      if (!token.accessToken) throw new Error("Token missing");
      const profile = await authRequest("GetUserInfo", {
        accessToken: token.accessToken,
      });
      if (typeof profile.openId !== "string" || !profile.openId)
        throw new Error("Verified identity missing");
      let user = await db.getUserByOpenId(profile.openId);
      if (!user) {
        // Never merge an unrelated identity into an existing paid/admin account by email alone.
        if (profile.email && (await db.getUserByEmail(profile.email))) {
          res
            .status(409)
            .json({
              error:
                "This email belongs to another sign-in identity. Use the original sign-in account.",
            });
          return;
        }
        user = await db.createOAuthUser({
          openId: profile.openId,
          name: profile.name || "Member",
          email: profile.email || null,
        });
      }
      const session = await sdk.createSessionToken(
        user.id,
        user.name || "Member",
        { expiresInMs: ONE_YEAR_MS }
      );
      res.cookie(COOKIE_NAME, session, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, "/dashboard");
    } catch {
      res
        .status(502)
        .json({ error: "Sign-in could not be completed. Please retry." });
    }
  });
}
