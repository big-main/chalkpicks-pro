import { motion } from "framer-motion";
import { Plus, Trash2, Copy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BetLeg {
  id: string;
  sport: string;
  matchup: string;
  pick: string;
  odds: number;
  ev: number;
}

const mockPicks: BetLeg[] = [
  {
    id: "1",
    sport: "NBA",
    matchup: "Lakers vs Celtics",
    pick: "Lakers -5.5",
    odds: -110,
    ev: 3.2,
  },
  {
    id: "2",
    sport: "NFL",
    matchup: "Chiefs vs Ravens",
    pick: "Over 47.5",
    odds: -110,
    ev: 2.8,
  },
  {
    id: "3",
    sport: "MLB",
    matchup: "Yankees vs Red Sox",
    pick: "Yankees ML",
    odds: -130,
    ev: 4.1,
  },
];

export default function BetSlipBuilder() {
  const [selectedLegs, setSelectedLegs] = useState<BetLeg[]>([]);
  const [wagerAmount, setWagerAmount] = useState(100);

  const addLeg = (leg: BetLeg) => {
    if (!selectedLegs.find((l) => l.id === leg.id)) {
      setSelectedLegs([...selectedLegs, leg]);
    }
  };

  const removeLeg = (legId: string) => {
    setSelectedLegs(selectedLegs.filter((l) => l.id !== legId));
  };

  const calculateParlay = () => {
    if (selectedLegs.length === 0) return { odds: 0, payout: 0, profit: 0 };

    let combinedOdds = 1;
    selectedLegs.forEach((leg) => {
      const decimalOdds = leg.odds < 0 ? 100 / Math.abs(leg.odds) + 1 : leg.odds / 100 + 1;
      combinedOdds *= decimalOdds;
    });

    const payout = wagerAmount * combinedOdds;
    const profit = payout - wagerAmount;

    return {
      odds: ((combinedOdds - 1) * 100).toFixed(0),
      payout: payout.toFixed(2),
      profit: profit.toFixed(2),
    };
  };

  const parlay = calculateParlay();

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Bet Slip Builder
          </h1>
          <p className="text-muted-foreground">Build custom parlays with live odds and +EV analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Picks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-green-400/20 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Available Picks</h2>
              <div className="space-y-3">
                {mockPicks.map((pick, idx) => (
                  <motion.div
                    key={pick.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer border border-green-400/10 hover:border-green-400/30"
                    onClick={() => addLeg(pick)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{pick.matchup}</p>
                        <p className="text-sm text-muted-foreground">{pick.sport}</p>
                      </div>
                      <Button size="sm" className="btn-premium">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Pick</p>
                        <p className="font-semibold text-foreground">{pick.pick}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Odds</p>
                        <p className="font-semibold text-blue-400">{pick.odds}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">+EV</p>
                        <p className="font-semibold text-green-400">+{pick.ev}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Bet Slip */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 sticky top-24 h-fit"
          >
            <Card className="glass-card border-green-400/20 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Bet Slip</h2>

              {selectedLegs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Add picks to build your parlay</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {selectedLegs.map((leg) => (
                    <motion.div
                      key={leg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white/5 rounded-lg flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{leg.pick}</p>
                        <p className="text-xs text-muted-foreground">{leg.matchup}</p>
                      </div>
                      <button
                        onClick={() => removeLeg(leg.id)}
                        className="p-1 hover:bg-red-400/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {selectedLegs.length > 0 && (
                <>
                  {/* Wager Input */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground block mb-2">Wager Amount</label>
                    <Input
                      type="number"
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(Number(e.target.value))}
                      className="bg-white/5 border-green-400/20"
                    />
                  </div>

                  {/* Parlay Summary */}
                  <div className="space-y-2 mb-6 p-4 bg-green-400/10 rounded-lg border border-green-400/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parlay Odds:</span>
                      <span className="font-bold text-green-400">+{parlay.odds}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Potential Payout:</span>
                      <span className="font-bold text-blue-400">${parlay.payout}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profit:</span>
                      <span className="font-bold text-emerald-400">+${parlay.profit}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button className="w-full btn-premium">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Place Bet
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to DraftKings
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
