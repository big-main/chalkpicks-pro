import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

interface BankrollEntry {
  id: string;
  date: string;
  amount: number;
  type: "deposit" | "withdrawal" | "bet_result";
  description: string;
}

interface BankrollSession {
  id: string;
  name: string;
  startBalance: number;
  currentBalance: number;
  entries: BankrollEntry[];
  created: Date;
}

function BankrollTrackerContent() {
  const [sessions, setSessions] = useState<BankrollSession[]>([]);
  const [activeSession, setActiveSession] = useState<BankrollSession | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [startBalance, setStartBalance] = useState(1000);
  const [newEntry, setNewEntry] = useState({ amount: 0, type: "bet_result" as const, description: "" });

  const createSession = () => {
    if (newSessionName && startBalance > 0) {
      const session: BankrollSession = {
        id: Math.random().toString(),
        name: newSessionName,
        startBalance,
        currentBalance: startBalance,
        entries: [],
        created: new Date(),
      };
      setSessions([...sessions, session]);
      setActiveSession(session);
      setNewSessionName("");
      setStartBalance(1000);
      setShowNewSession(false);
    }
  };

  const addEntry = () => {
    if (!activeSession || !newEntry.amount || !newEntry.description) return;

    const updatedSession = {
      ...activeSession,
      entries: [
        ...activeSession.entries,
        {
          id: Math.random().toString(),
          date: new Date().toISOString().split("T")[0],
          amount: newEntry.amount,
          type: newEntry.type,
          description: newEntry.description,
        },
      ],
    };

    // Calculate new balance
    let newBalance = activeSession.startBalance;
    updatedSession.entries.forEach((entry) => {
      if (entry.type === "deposit") newBalance += entry.amount;
      else if (entry.type === "withdrawal") newBalance -= entry.amount;
      else if (entry.type === "bet_result") newBalance += entry.amount;
    });
    updatedSession.currentBalance = newBalance;

    setActiveSession(updatedSession);
    setSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    setNewEntry({ amount: 0, type: "bet_result", description: "" });
  };

  const chartData = activeSession
    ? activeSession.entries
        .reduce(
          (acc, entry) => {
            const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : activeSession.startBalance;
            let newBalance = lastBalance;
            if (entry.type === "deposit") newBalance += entry.amount;
            else if (entry.type === "withdrawal") newBalance -= entry.amount;
            else if (entry.type === "bet_result") newBalance += entry.amount;

            return [
              ...acc,
              {
                date: entry.date,
                balance: newBalance,
                description: entry.description,
              },
            ];
          },
          [] as Array<{ date: string; balance: number; description: string }>
        )
    : [];

  const roi =
    activeSession && activeSession.startBalance > 0
      ? ((activeSession.currentBalance - activeSession.startBalance) / activeSession.startBalance) * 100
      : 0;

  const totalWins = activeSession
    ? activeSession.entries.filter((e) => e.type === "bet_result" && e.amount > 0).reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const totalLosses = activeSession
    ? activeSession.entries.filter((e) => e.type === "bet_result" && e.amount < 0).reduce((sum, e) => sum + e.amount, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bankroll Tracker</h1>
          <p className="text-cyan-400">Monitor your betting bankroll and ROI</p>
        </div>

        {/* Sessions */}
        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="active">Active Session</TabsTrigger>
            <TabsTrigger value="history">All Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeSession ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Session Name</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-white">{activeSession.name}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Starting Bankroll</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-white">${activeSession.startBalance.toFixed(2)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Current Bankroll</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${activeSession.currentBalance >= activeSession.startBalance ? "text-green-400" : "text-red-400"}`}>
                        ${activeSession.currentBalance.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${roi > 0 ? "text-green-400" : "text-red-400"}`}>{roi.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Bankroll Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                          <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Add Entry */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle>Add Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-slate-300">Type</label>
                        <select
                          value={newEntry.type}
                          onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                          <option value="deposit">Deposit</option>
                          <option value="withdrawal">Withdrawal</option>
                          <option value="bet_result">Bet Result</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">Amount ($)</label>
                        <Input
                          type="number"
                          value={newEntry.amount || ""}
                          onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">Description</label>
                        <Input
                          value={newEntry.description}
                          onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                          placeholder="e.g., Daily bets"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={addEntry} className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </CardContent>
                </Card>

                {/* Entries */}
                {activeSession.entries.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 px-2 text-slate-400">Date</th>
                              <th className="text-left py-2 px-2 text-slate-400">Description</th>
                              <th className="text-left py-2 px-2 text-slate-400">Type</th>
                              <th className="text-right py-2 px-2 text-slate-400">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeSession.entries.map((entry) => (
                              <tr key={entry.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="py-2 px-2 text-slate-300">{entry.date}</td>
                                <td className="py-2 px-2 text-slate-300">{entry.description}</td>
                                <td className="py-2 px-2 text-slate-300 capitalize">{entry.type.replace("_", " ")}</td>
                                <td className={`text-right py-2 px-2 ${entry.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                                  {entry.amount > 0 ? "+" : ""}${entry.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400 mb-4">No active session. Create one to get started.</p>
                  <Button onClick={() => setShowNewSession(true)} className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {showNewSession && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle>New Session</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300">Session Name</label>
                      <Input
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        placeholder="e.g., June 2026 Tracking"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">Starting Bankroll ($)</label>
                      <Input
                        type="number"
                        value={startBalance}
                        onChange={(e) => setStartBalance(parseFloat(e.target.value) || 0)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createSession} className="flex-1 bg-green-600 hover:bg-green-700">
                        Create
                      </Button>
                      <Button onClick={() => setShowNewSession(false)} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      className="bg-slate-800 border-slate-700 cursor-pointer hover:border-cyan-500 transition"
                      onClick={() => setActiveSession(session)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-400">Starting</p>
                          <p className="text-sm font-bold text-white">${session.startBalance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className={`text-sm font-bold ${session.currentBalance >= session.startBalance ? "text-green-400" : "text-red-400"}`}>
                            ${session.currentBalance.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">ROI</p>
                          <p className={`text-sm font-bold ${((session.currentBalance - session.startBalance) / session.startBalance) * 100 > 0 ? "text-green-400" : "text-red-400"}`}>
                            {(((session.currentBalance - session.startBalance) / session.startBalance) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                          {session.entries.length} entries
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-400 mb-4">No sessions yet. Create one to start tracking.</p>
                    <Button onClick={() => setShowNewSession(true)} className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function BankrollTracker() {
  return <FeatureGate feature="bankroll_tracker" children={<BankrollTrackerContent />} />;
}
