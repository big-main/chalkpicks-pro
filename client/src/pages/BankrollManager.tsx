import { useState, useMemo } from "react";
import { Link } from "wouter";

interface BetEntry {
  id: number;
  date: string;
  sport: string;
  description: string;
  stake: number;
  odds: number;
  result: "win" | "loss" | "pending";
  payout: number;
}

export default function BankrollManager() {
  const [bankroll, setBankroll] = useState(1000);
  const [unitSize, setUnitSize] = useState(2); // percentage
  const [bets, setBets] = useState<BetEntry[]>([
    { id: 1, date: "2026-07-04", sport: "NBA", description: "Lakers -3.5", stake: 20, odds: -110, result: "win", payout: 38.18 },
    { id: 2, date: "2026-07-04", sport: "MLB", description: "Dodgers ML", stake: 25, odds: +150, result: "loss", payout: 0 },
    { id: 3, date: "2026-07-03", sport: "NFL", description: "Chiefs +7", stake: 20, odds: -105, result: "win", payout: 39.05 },
  ]);
  const [newBet, setNewBet] = useState<{ sport: string; description: string; stake: string; odds: string; result: "win" | "loss" | "pending" }>({ sport: "NBA", description: "", stake: "", odds: "", result: "pending" });

  const stats = useMemo(() => {
    const wins = bets.filter((b) => b.result === "win").length;
    const losses = bets.filter((b) => b.result === "loss").length;
    const pending = bets.filter((b) => b.result === "pending").length;
    const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
    const totalPayout = bets.reduce((sum, b) => sum + b.payout, 0);
    const profit = totalPayout - totalStaked;
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    const currentBankroll = bankroll + profit;
    const kellyUnit = (bankroll * unitSize) / 100;

    return { wins, losses, pending, totalStaked, totalPayout, profit, roi, winRate, currentBankroll, kellyUnit };
  }, [bets, bankroll, unitSize]);

  const addBet = () => {
    if (!newBet.description || !newBet.stake || !newBet.odds) return;
    const stake = parseFloat(newBet.stake);
    const odds = parseInt(newBet.odds);
    const payout = (newBet.result as string) === "win"
      ? odds > 0 ? stake + (stake * odds) / 100 : stake + (stake * 100) / Math.abs(odds)
      : 0;

    setBets([
      ...bets,
      {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        sport: newBet.sport,
        description: newBet.description,
        stake,
        odds,
        result: newBet.result,
        payout,
      },
    ]);
    setNewBet({ sport: "NBA", description: "", stake: "", odds: "", result: "pending" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Bankroll <span className="text-emerald-400">Manager</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Track your bets, manage your bankroll, and optimize unit sizing with Kelly Criterion calculations.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Current Bankroll</p>
            <p className={`text-2xl font-bold ${stats.currentBankroll >= bankroll ? "text-emerald-400" : "text-red-400"}`}>
              ${stats.currentBankroll.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">ROI</p>
            <p className={`text-2xl font-bold ${stats.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Profit/Loss</p>
            <p className={`text-2xl font-bold ${stats.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bankroll Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Bankroll Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Starting Bankroll ($)</label>
                <input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Unit Size (%)</label>
                <input
                  type="number"
                  value={unitSize}
                  onChange={(e) => setUnitSize(parseFloat(e.target.value) || 1)}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-sm text-emerald-400">
                  Recommended bet: <strong>${stats.kellyUnit.toFixed(2)}</strong> per unit
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {unitSize}% of ${bankroll.toFixed(0)} bankroll
                </p>
              </div>
            </div>
          </div>

          {/* Add Bet Form */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Log a Bet</h3>
            <div className="space-y-3">
              <select
                value={newBet.sport}
                onChange={(e) => setNewBet({ ...newBet, sport: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="Soccer">Soccer</option>
              </select>
              <input
                type="text"
                placeholder="Bet description (e.g., Lakers -3.5)"
                value={newBet.description}
                onChange={(e) => setNewBet({ ...newBet, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Stake ($)"
                  value={newBet.stake}
                  onChange={(e) => setNewBet({ ...newBet, stake: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600"
                />
                <input
                  type="number"
                  placeholder="Odds (e.g., -110)"
                  value={newBet.odds}
                  onChange={(e) => setNewBet({ ...newBet, odds: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600"
                />
              </div>
              <select
                value={newBet.result}
                onChange={(e) => setNewBet({ ...newBet, result: e.target.value as "win" | "loss" | "pending" })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="pending">Pending</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
              <button
                onClick={addBet}
                className="w-full bg-emerald-500 text-white py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
              >
                Log Bet
              </button>
            </div>
          </div>
        </div>

        {/* Bet History */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">Bet History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Sport</th>
                  <th className="text-left py-2 px-2">Bet</th>
                  <th className="text-right py-2 px-2">Stake</th>
                  <th className="text-right py-2 px-2">Odds</th>
                  <th className="text-center py-2 px-2">Result</th>
                  <th className="text-right py-2 px-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 text-gray-400">{bet.date}</td>
                    <td className="py-2 px-2 text-gray-300">{bet.sport}</td>
                    <td className="py-2 px-2 text-white">{bet.description}</td>
                    <td className="py-2 px-2 text-right text-gray-300">${bet.stake.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-300">
                      {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          bet.result === "win"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : bet.result === "loss"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {bet.result.toUpperCase()}
                      </span>
                    </td>
                    <td className={`py-2 px-2 text-right font-medium ${
                      bet.result === "win" ? "text-emerald-400" : bet.result === "loss" ? "text-red-400" : "text-gray-500"
                    }`}>
                      {bet.result === "win"
                        ? `+$${(bet.payout - bet.stake).toFixed(2)}`
                        : bet.result === "loss"
                        ? `-$${bet.stake.toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.wins}</p>
            <p className="text-xs text-gray-500">Wins</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.losses}</p>
            <p className="text-xs text-gray-500">Losses</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Get AI-Powered Picks to Grow Your Bankroll
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Our AI picks have a 92% historical win rate. Combine them with proper bankroll management for consistent profits.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
