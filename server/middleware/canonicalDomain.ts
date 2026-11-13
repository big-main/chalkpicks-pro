import type { RequestHandler } from "express";

/** Keep login cookies and public links on the active .live apex domain. */
export const canonicalDomainRedirect: RequestHandler = (req, res, next) => {
  if (req.hostname === "www.chalkpicks.live") {
    res.redirect(308, `https://chalkpicks.live${req.originalUrl}`);
    return;
  }
  next();
};
