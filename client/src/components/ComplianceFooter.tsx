/**
 * Responsible-gambling disclaimer for pages that show picks, odds, or betting
 * tools. Uses the same "1-800-GAMBLER" / "21+" language server/routers/blog.ts's
 * hasComplianceFooter() checks for on published articles, so the standard is
 * consistent across content and product surfaces.
 */
export function ComplianceFooter() {
  return (
    <div className="py-6 border-t border-border/50 text-center">
      <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
        ChalkPicks is for informational and entertainment purposes only. We do not guarantee betting outcomes.
        Bet responsibly. Must be 21+ and in an eligible state. Gambling problem? Call 1-800-GAMBLER.
      </p>
    </div>
  );
}
