import type { RequestHandler } from "express";

/** Keep public links and login cookies on the active .pro apex domain. */
export const canonicalDomainRedirect: RequestHandler = (req, res, next) => {
  if (
    ["www.chalkpicks.pro", "chalkpicks.live", "www.chalkpicks.live"].includes(
      req.hostname
    )
  ) {
    res.redirect(308, `https://chalkpicks.pro${req.originalUrl}`);
    return;
  }
  next();
};
