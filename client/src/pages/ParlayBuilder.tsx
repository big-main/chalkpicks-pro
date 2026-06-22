import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Copy, DollarSign, Zap } from "lucide-react";

interface ParlayLeg {
  id: string;
  description: string;
  odds: number;
  result?: "win" | "loss" | "pending";
}

interface Parlay {
  id: string;
  legs: ParlayLeg[];
  stake: number;
  created: Date;
}

export default function ParlayBuilder() {
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [currentLegs, setCurrentLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState(100);
  const [newLeg, setNewLeg] = useState({ description: "", odds: 0 });

  const addLeg = () => {
    if (newLeg.description && newLeg.odds > 0) {
      setCurrentLegs([
        ...currentLegs,
        {
          id: Math.random().toString(),
          description: newLeg.description,
          odds: newLeg.odds,
          result: "pending",
        },
      ]);
      setNewLeg({ description: "", odds: 0 });
    }
  };

  const removeLeg = (id: string) => {
    setCurrentLegs(currentLegs.filter((leg) => leg.id !== id));
  };

  const saveParlay = () => {
    if (currentLegs.length > 0) {
      setParlays([
        ...parlays,
        {
          id: Math.random().toString(),
          legs: currentLegs,
          stake,
          created: new Date(),
        },
      ]);
      setCurrentLegs([]);
      setStake(100);
    }
  };

  const calculatePayout = (legs: ParlayLeg[], stake: number) => {
    let multiplier = 1;
    for (const leg of legs) {
      // Convert American odds to decimal odds
      let decimalOdds: number;
      if (leg.odds > 0) {
        decimalOdds = (leg.odds + 100) / 100;
      } else {
        decimalOdds = 1 + 100 / Math.abs(leg.odds);
      }
      multiplier *= decimalOdds;
    }
    return stake * multiplier;
  };

  const calculateROI = (legs: ParlayLeg[], stake: number) => {
    const payout = calculatePayout(legs, stake);
    return ((payout - stake) / stake) * 100;
  };

  const payout = calculatePayout(currentLegs, stake);
  const roi = calculateROI(currentLegs, stake);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Parlay Builder</h1>
          <p className="text-cyan-400">Create and analyze multi-leg parlays</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Build Your Parlay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Leg Form */}
                <div className="space-y-3 p-4 bg-slate-700/50 rounded">
                  <div>
                    <label className="text-sm text-slate-300">Leg Description</label>
                    <Input
                      placeholder="e.g., Lakers ML, Over 215.5"
                      value={newLeg.description}
                      onChange={(e) => setNewLeg({ ...newLeg, description: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Odds (American)</label>
                    <Input
                      type="number"
                      placeholder="e.g., -110, +150"
                      value={newLeg.odds || ""}
                      onChange={(e) => setNewLeg({ ...newLeg, odds: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button onClick={addLeg} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leg
                  </Button>
                </div>

                {/* Current Legs */}
                {currentLegs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300">Parlay Legs ({currentLegs.length})</h3>
                    {currentLegs.map((leg, idx) => (
                      <div
                        key={leg.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">{leg.description}</p>
                          <p className="text-xs text-slate-500">
                            {leg.odds > 0 ? "+" : ""}
                            {leg.odds}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLeg(leg.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stake */}
                <div>
                  <label className="text-sm text-slate-300">Stake ($)</label>
                  <Input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={saveParlay}
                    disabled={currentLegs.length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Save Parlay
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentLegs([]);
                      setStake(100);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="bg-slate-800 border-slate-700 sticky top-20">
              <CardHeader>
                <CardTitle>Parlay Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Legs</p>
                  <p className="text-2xl font-bold text-white">{currentLegs.length}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Stake</p>
                  <p className="text-2xl font-bold text-white">${stake.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Potential Payout</p>
                  <p className="text-2xl font-bold text-green-400">${payout.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">ROI</p>
                  <p className={`text-2xl font-bold ${roi > 0 ? "text-green-400" : "text-slate-400"}`}>
                    {roi.toFixed(1)}%
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Parlay Odds</p>
                  <p className="text-sm text-slate-300">
                    {currentLegs.length > 0
                      ? currentLegs
                          .map((leg) => `${leg.odds > 0 ? "+" : ""}${leg.odds}`)
                          .join(" × ")
                      : "No legs added"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Saved Parlays */}
        {parlays.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Saved Parlays</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parlays.map((parlay) => (
                <Card key={parlay.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{parlay.legs.length} Legs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-400">Stake</p>
                      <p className="text-lg font-bold text-white">${parlay.stake.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Potential Payout</p>
                      <p className="text-lg font-bold text-green-400">
                        ${calculatePayout(parlay.legs, parlay.stake).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                      {new Date(parlay.created).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
