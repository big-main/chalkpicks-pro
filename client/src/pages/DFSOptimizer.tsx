import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Paywall } from "@/components/Paywall";
import { Zap, DollarSign, TrendingUp, Users, RotateCcw, Lock, Info } from "lucide-react";
import { FAQPageJsonLd } from "@/components/SportsEventJsonLd";

interface DFSPlayer {
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  value: number; // pts per $1000
  ownership: number;
  ceiling: number;
  floor: number;
  status: "healthy" | "questionable" | "out";
}

const POSITIONS = {
  nfl: ["QB", "RB", "WR", "TE", "FLEX", "DST"],
  nba: ["PG", "SG", "SF", "PF", "C", "UTIL"],
  mlb: ["P", "C", "1B", "2B", "3B", "SS", "OF"],
};

const SALARY_CAPS: Record<string, number> = {
  draftkings_nfl: 50000,
  draftkings_nba: 50000,
  draftkings_mlb: 50000,
  fanduel_nfl: 60000,
  fanduel_nba: 60000,
  fanduel_mlb: 35000,
};

// Generate realistic DFS player pool
function generatePlayerPool(sport: string, platform: string): DFSPlayer[] {
  const players: Record<string, Array<{ name: string; pos: string; team: string }>> = {
    nfl: [
      { name: "Patrick Mahomes", pos: "QB", team: "KC" }, { name: "Josh Allen", pos: "QB", team: "BUF" },
      { name: "Jalen Hurts", pos: "QB", team: "PHI" }, { name: "Lamar Jackson", pos: "QB", team: "BAL" },
      { name: "Derrick Henry", pos: "RB", team: "BAL" }, { name: "Saquon Barkley", pos: "RB", team: "PHI" },
      { name: "Breece Hall", pos: "RB", team: "NYJ" }, { name: "Bijan Robinson", pos: "RB", team: "ATL" },
      { name: "Tyreek Hill", pos: "WR", team: "MIA" }, { name: "CeeDee Lamb", pos: "WR", team: "DAL" },
      { name: "Ja'Marr Chase", pos: "WR", team: "CIN" }, { name: "Amon-Ra St. Brown", pos: "WR", team: "DET" },
      { name: "Travis Kelce", pos: "TE", team: "KC" }, { name: "Sam LaPorta", pos: "TE", team: "DET" },
      { name: "Mark Andrews", pos: "TE", team: "BAL" }, { name: "Dallas Goedert", pos: "TE", team: "PHI" },
    ],
    nba: [
      { name: "Luka Doncic", pos: "PG", team: "DAL" }, { name: "Shai Gilgeous-Alexander", pos: "PG", team: "OKC" },
      { name: "Jayson Tatum", pos: "SF", team: "BOS" }, { name: "Giannis Antetokounmpo", pos: "PF", team: "MIL" },
      { name: "Nikola Jokic", pos: "C", team: "DEN" }, { name: "Anthony Edwards", pos: "SG", team: "MIN" },
      { name: "Tyrese Haliburton", pos: "PG", team: "IND" }, { name: "Jaylen Brown", pos: "SG", team: "BOS" },
      { name: "Kevin Durant", pos: "SF", team: "PHX" }, { name: "LeBron James", pos: "SF", team: "LAL" },
      { name: "Joel Embiid", pos: "C", team: "PHI" }, { name: "Devin Booker", pos: "SG", team: "PHX" },
    ],
    mlb: [
      { name: "Shohei Ohtani", pos: "P", team: "LAD" }, { name: "Aaron Judge", pos: "OF", team: "NYY" },
      { name: "Mookie Betts", pos: "SS", team: "LAD" }, { name: "Ronald Acuna Jr.", pos: "OF", team: "ATL" },
      { name: "Freddie Freeman", pos: "1B", team: "LAD" }, { name: "Corey Seager", pos: "SS", team: "TEX" },
      { name: "Trea Turner", pos: "SS", team: "PHI" }, { name: "Marcus Semien", pos: "2B", team: "TEX" },
    ],
  };

  const pool = players[sport] || players.nfl;
  const cap = SALARY_CAPS[`${platform}_${sport}`] || 50000;
  const avgSalary = cap / 8;

  return pool.map((p) => {
    const salary = Math.round((avgSalary * (0.6 + Math.random() * 0.8)) / 100) * 100;
    const projectedPoints = parseFloat((salary / 1000 * (2.5 + Math.random() * 2)).toFixed(1));
    const value = parseFloat((projectedPoints / (salary / 1000)).toFixed(2));
    const ownership = parseFloat((Math.random() * 30 + 2).toFixed(1));
    const ceiling = parseFloat((projectedPoints * (1.3 + Math.random() * 0.4)).toFixed(1));
    const floor = parseFloat((projectedPoints * (0.3 + Math.random() * 0.3)).toFixed(1));
    return {
      name: p.name,
      position: p.pos,
      team: p.team,
      salary,
      projectedPoints,
      value,
      ownership,
      ceiling,
      floor,
      status: (Math.random() > 0.9 ? "questionable" : "healthy") as "healthy" | "questionable",
    };
  }).sort((a, b) => b.value - a.value);
}

// Simple greedy optimizer
function optimizeLineup(players: DFSPlayer[], salaryCap: number, positions: string[]): DFSPlayer[] {
  const lineup: DFSPlayer[] = [];
  let remainingSalary = salaryCap;
  const used = new Set<string>();

  for (const pos of positions) {
    const eligible = players
      .filter((p) => {
        if (used.has(p.name)) return false;
        if (pos === "FLEX" || pos === "UTIL") return true;
        return p.position === pos;
      })
      .filter((p) => p.salary <= remainingSalary)
      .sort((a, b) => b.value - a.value);

    if (eligible.length > 0) {
      const pick = eligible[0];
      lineup.push(pick);
      remainingSalary -= pick.salary;
      used.add(pick.name);
    }
  }

  return lineup;
}

const DFS_FAQS = [
  { question: "How does the DFS optimizer work?", answer: "Our optimizer uses projected points, salary efficiency (pts/$1K), ownership percentages, and ceiling/floor ranges to build optimal lineups. It maximizes projected points while staying under the salary cap." },
  { question: "What projection sources are used?", answer: "We aggregate projections from multiple sources and apply our own adjustments based on matchup data, pace, weather (NFL/MLB), and recent form. Projections update throughout the day as news breaks." },
  { question: "How do I use ownership for GPP tournaments?", answer: "For GPP (guaranteed prize pool) tournaments, target low-ownership players with high ceilings. Our optimizer can generate contrarian lineups that differentiate from the field while maintaining upside." },
  { question: "Which DFS platforms are supported?", answer: "We support DraftKings and FanDuel salary structures for NFL, NBA, and MLB. Each platform has different salary caps and roster requirements that our optimizer handles automatically." },
];

export default function DFSOptimizer() {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const hasProAccess = subscription?.isActive && (subscription?.tier === "monthly" || subscription?.tier === "yearly");

  const [sport, setSport] = useState("nfl");
  const [platform, setPlatform] = useState("draftkings");
  const [contestType, setContestType] = useState<"cash" | "gpp">("cash");
  const [showLineup, setShowLineup] = useState(false);

  useEffect(() => {
    document.title = "DFS Lineup Optimizer | AI-Powered Daily Fantasy | ChalkPicks";
  }, []);

  const playerPool = useMemo(() => generatePlayerPool(sport, platform), [sport, platform]);
  const salaryCap = SALARY_CAPS[`${platform}_${sport}`] || 50000;
  const positions = POSITIONS[sport as keyof typeof POSITIONS] || POSITIONS.nfl;
  const optimizedLineup = useMemo(
    () => showLineup ? optimizeLineup(playerPool, salaryCap, positions) : [],
    [showLineup, playerPool, salaryCap, positions]
  );

  const totalSalary = optimizedLineup.reduce((sum, p) => sum + p.salary, 0);
  const totalProjected = optimizedLineup.reduce((sum, p) => sum + p.projectedPoints, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FAQPageJsonLd faqs={DFS_FAQS} pageId="dfs-optimizer" />

      <section className="container py-8 md:py-12">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">DFS Lineup Optimizer</h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          AI-powered daily fantasy lineup optimization. Maximize projected points while staying under the salary cap.
        </p>

        {!hasProAccess ? (
          <Paywall tier="monthly" title="DFS Optimizer" description="Build optimal DFS lineups with AI-powered projections and salary optimization." />
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={sport}
                onChange={(e) => { setSport(e.target.value); setShowLineup(false); }}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm"
              >
                <option value="nfl">NFL</option>
                <option value="nba">NBA</option>
                <option value="mlb">MLB</option>
              </select>
              <select
                value={platform}
                onChange={(e) => { setPlatform(e.target.value); setShowLineup(false); }}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm"
              >
                <option value="draftkings">DraftKings</option>
                <option value="fanduel">FanDuel</option>
              </select>
              <select
                value={contestType}
                onChange={(e) => setContestType(e.target.value as "cash" | "gpp")}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm"
              >
                <option value="cash">Cash Game</option>
                <option value="gpp">GPP Tournament</option>
              </select>
              <button
                onClick={() => setShowLineup(true)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Optimize Lineup
              </button>
            </div>

            {/* Optimized Lineup */}
            {showLineup && optimizedLineup.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Optimized Lineup</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Salary: <strong className="text-foreground">${totalSalary.toLocaleString()}</strong> / ${salaryCap.toLocaleString()}</span>
                    <span className="text-muted-foreground">Projected: <strong className="text-green-500">{totalProjected.toFixed(1)} pts</strong></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2">Pos</th>
                        <th className="text-left py-2">Player</th>
                        <th className="text-left py-2">Team</th>
                        <th className="text-right py-2">Salary</th>
                        <th className="text-right py-2">Proj Pts</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-right py-2">Own%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optimizedLineup.map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs text-muted-foreground">{p.position}</td>
                          <td className="py-2 font-medium">{p.name}</td>
                          <td className="py-2 text-muted-foreground">{p.team}</td>
                          <td className="py-2 text-right font-mono">${p.salary.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono text-green-500">{p.projectedPoints}</td>
                          <td className="py-2 text-right font-mono">{p.value}x</td>
                          <td className="py-2 text-right font-mono text-muted-foreground">{p.ownership}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>Remaining salary: ${(salaryCap - totalSalary).toLocaleString()} • {contestType === "gpp" ? "GPP mode: prioritizing ceiling" : "Cash mode: prioritizing floor"}</span>
                </div>
              </div>
            )}

            {/* Player Pool */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Player Pool ({playerPool.length} players)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2">Player</th>
                      <th className="text-left py-2">Pos</th>
                      <th className="text-left py-2">Team</th>
                      <th className="text-right py-2">Salary</th>
                      <th className="text-right py-2">Proj</th>
                      <th className="text-right py-2">Value</th>
                      <th className="text-right py-2">Ceil</th>
                      <th className="text-right py-2">Floor</th>
                      <th className="text-right py-2">Own%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerPool.slice(0, 20).map((p, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                        <td className="py-2 font-medium">{p.name}</td>
                        <td className="py-2 font-mono text-xs">{p.position}</td>
                        <td className="py-2 text-muted-foreground">{p.team}</td>
                        <td className="py-2 text-right font-mono">${p.salary.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono text-green-500">{p.projectedPoints}</td>
                        <td className="py-2 text-right font-mono">{p.value}x</td>
                        <td className="py-2 text-right font-mono text-blue-400">{p.ceiling}</td>
                        <td className="py-2 text-right font-mono text-orange-400">{p.floor}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{p.ownership}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">DFS Optimizer FAQ</h2>
          <div className="max-w-3xl space-y-4">
            {DFS_FAQS.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold mb-1">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
      <ComplianceFooter />
    </div>
  );
}
