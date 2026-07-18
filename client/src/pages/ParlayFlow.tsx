import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TrendingUp, DollarSign, Zap, Target } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LegData {
  label: string;
  odds: number;
  sport: string;
  result: "pending" | "win" | "loss" | "push";
  impliedProb: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

function decimalToAmerican(dec: number): string {
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `${Math.round(-100 / (dec - 1))}`;
}

function impliedProb(odds: number): number {
  const dec = americanToDecimal(odds);
  return Math.round((1 / dec) * 100);
}

function resultColor(result: LegData["result"]): string {
  switch (result) {
    case "win": return "bg-emerald-500/20 border-emerald-500 text-emerald-400";
    case "loss": return "bg-red-500/20 border-red-500 text-red-400";
    case "push": return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
    default: return "bg-slate-700/50 border-slate-600 text-slate-300";
  }
}

// ─── Custom Leg Node ──────────────────────────────────────────────────────────
function LegNode({ data, selected }: NodeProps) {
  const leg = data as unknown as LegData;
  return (
    <div
      className={`rounded-xl border-2 p-3 min-w-[180px] shadow-lg transition-all ${
        selected ? "border-amber-400 shadow-amber-400/20" : resultColor(leg.result)
      }`}
      style={{ background: "rgba(15,23,42,0.95)" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !border-slate-900" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{leg.sport}</span>
        <Badge
          variant="outline"
          className={`text-xs px-1 py-0 ${
            leg.result === "win"
              ? "border-emerald-500 text-emerald-400"
              : leg.result === "loss"
              ? "border-red-500 text-red-400"
              : "border-slate-600 text-slate-400"
          }`}
        >
          {leg.result}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-white leading-tight mb-2">{leg.label}</p>
      <div className="flex items-center justify-between">
        <span className="text-amber-400 font-bold text-sm">
          {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
        </span>
        <span className="text-slate-400 text-xs">{leg.impliedProb}% implied</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !border-slate-900" />
    </div>
  );
}

// ─── Stake / Payout Node ─────────────────────────────────────────────────────
function StakeNode({ data }: NodeProps) {
  const d = data as unknown as { stake: number; payout: number; legs: number; trueProb: number };
  return (
    <div
      className="rounded-xl border-2 border-amber-400 p-4 min-w-[200px] shadow-xl shadow-amber-400/10"
      style={{ background: "rgba(15,23,42,0.98)" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !border-slate-900" />
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400 font-bold text-sm uppercase tracking-wide">Parlay Result</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Legs</span>
          <span className="text-white font-semibold">{d.legs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Stake</span>
          <span className="text-white font-semibold">${d.stake}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">True Win Prob</span>
          <span className="text-emerald-400 font-semibold">{d.trueProb}%</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
          <span className="text-slate-300 font-semibold">To Win</span>
          <span className="text-amber-400 font-bold text-base">${d.payout.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { leg: LegNode, stake: StakeNode };

// ─── Main Component ───────────────────────────────────────────────────────────
function ParlayFlowContent() {
  const [stake, setStake] = useState(100);
  const [newLabel, setNewLabel] = useState("");
  const [newOdds, setNewOdds] = useState("");
  const [newSport, setNewSport] = useState("NFL");
  const [legs, setLegs] = useState<LegData[]>([]);

  // Compute parlay stats
  const parlayStats = useMemo(() => {
    if (legs.length === 0) return { payout: 0, trueProb: 0, parlayOdds: "+0" };
    const decimalProduct = legs.reduce(
      (acc, leg) => acc * americanToDecimal(leg.odds),
      1
    );
    const payout = stake * decimalProduct - stake;
    const trueProb = Math.round((1 / decimalProduct) * 100);
    return { payout, trueProb, parlayOdds: decimalToAmerican(decimalProduct) };
  }, [legs, stake]);

  // Build nodes + edges from legs
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const rebuildGraph = useCallback(
    (updatedLegs: LegData[]) => {
      const newNodes: Node[] = updatedLegs.map((leg, i) => ({
        id: `leg-${i}`,
        type: "leg",
        position: { x: 80 + i * 240, y: 160 },
        data: leg as unknown as Record<string, unknown>,
      }));

      // Stake/payout node at the end
      const decProd = updatedLegs.reduce(
        (acc, leg) => acc * americanToDecimal(leg.odds),
        1
      );
      const payout = stake * decProd - stake;
      const trueProb = Math.round((1 / decProd) * 100);

      newNodes.push({
        id: "stake-node",
        type: "stake",
        position: { x: 80 + updatedLegs.length * 240, y: 140 },
        data: {
          stake,
          payout,
          legs: updatedLegs.length,
          trueProb,
        } as unknown as Record<string, unknown>,
      });

      const newEdges: Edge[] = updatedLegs.map((_, i) => ({
        id: `e-${i}`,
        source: i === 0 ? `leg-${i}` : `leg-${i}`,
        target: i === updatedLegs.length - 1 ? "stake-node" : `leg-${i + 1}`,
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [stake, setNodes, setEdges]
  );

  const addLeg = () => {
    const oddsNum = parseInt(newOdds);
    if (!newLabel || isNaN(oddsNum)) return;
    const leg: LegData = {
      label: newLabel,
      odds: oddsNum,
      sport: newSport,
      result: "pending",
      impliedProb: impliedProb(oddsNum),
    };
    const updated = [...legs, leg];
    setLegs(updated);
    rebuildGraph(updated);
    setNewLabel("");
    setNewOdds("");
  };

  const removeLeg = (idx: number) => {
    const updated = legs.filter((_, i) => i !== idx);
    setLegs(updated);
    rebuildGraph(updated);
  };

  const setResult = (idx: number, result: LegData["result"]) => {
    const updated = legs.map((l, i) => (i === idx ? { ...l, result } : l));
    setLegs(updated);
    rebuildGraph(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Visual Parlay Builder</h1>
            <p className="text-slate-400 text-sm">Build and visualize your parlay legs as an interactive flow diagram</p>
          </div>
          {legs.length > 0 && (
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Parlay Odds</p>
                <p className="text-amber-400 font-bold text-lg">{parlayStats.parlayOdds}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">To Win</p>
                <p className="text-emerald-400 font-bold text-lg">${parlayStats.payout.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">True Prob</p>
                <p className="text-white font-bold text-lg">{parlayStats.trueProb}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Leg Form */}
        <Card className="bg-slate-900 border-slate-800 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Leg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <select
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-md px-3 py-2"
              >
                {["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "Soccer"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                placeholder="Leg description (e.g. Chiefs -3.5)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white flex-1 min-w-[200px]"
                onKeyDown={(e) => e.key === "Enter" && addLeg()}
              />
              <Input
                placeholder="Odds (e.g. -110 or +150)"
                value={newOdds}
                onChange={(e) => setNewOdds(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white w-36"
                onKeyDown={(e) => e.key === "Enter" && addLeg()}
              />
              <Input
                type="number"
                placeholder="Stake $"
                value={stake}
                onChange={(e) => {
                  setStake(Number(e.target.value));
                  rebuildGraph(legs);
                }}
                className="bg-slate-800 border-slate-700 text-white w-28"
              />
              <Button onClick={addLeg} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leg List */}
        {legs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {legs.map((leg, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${resultColor(leg.result)}`}
              >
                <span className="text-xs text-slate-400">{leg.sport}</span>
                <span className="font-medium">{leg.label}</span>
                <span className="font-bold">{leg.odds > 0 ? `+${leg.odds}` : leg.odds}</span>
                <div className="flex gap-1 ml-1">
                  {(["win", "loss", "push", "pending"] as LegData["result"][]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResult(i, r)}
                      className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                        leg.result === r
                          ? "bg-amber-500 border-amber-400 text-black"
                          : "border-slate-600 text-slate-400 hover:border-slate-400"
                      }`}
                    >
                      {r[0].toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={() => removeLeg(i)} className="text-slate-500 hover:text-red-400 ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Flow Canvas */}
        <div
          className="rounded-xl border border-slate-800 overflow-hidden"
          style={{ height: legs.length === 0 ? 300 : 420 }}
        >
          {legs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
              <Target className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Add legs above to build your visual parlay flow</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              style={{ background: "#0f172a" }}
            >
              <MiniMap
                style={{ background: "#1e293b" }}
                nodeColor={(n) => {
                  if (n.type === "stake") return "#f59e0b";
                  const d = n.data as unknown as LegData;
                  if (d?.result === "win") return "#10b981";
                  if (d?.result === "loss") return "#ef4444";
                  return "#64748b";
                }}
              />
              <Controls className="[&_button]:bg-slate-800 [&_button]:border-slate-700 [&_button]:text-white" />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            </ReactFlow>
          )}
        </div>

        {/* Stats Row */}
        {legs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Legs", value: legs.length, icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-400" },
              { label: "Parlay Odds", value: parlayStats.parlayOdds, icon: <Zap className="w-4 h-4" />, color: "text-amber-400" },
              { label: "True Win Prob", value: `${parlayStats.trueProb}%`, icon: <Target className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "To Win", value: `$${parlayStats.payout.toFixed(2)}`, icon: <DollarSign className="w-4 h-4" />, color: "text-amber-400" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-slate-900 border-slate-800">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
                  <div>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParlayFlow() {
  return (
    <FeatureGate feature="parlay_builder">
      <ParlayFlowContent />
    </FeatureGate>
  );
}
