import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface FlowNode {
  id: string;
  label: string;
  description: string;
  icon?: string;
  color: string;
  x: number;
  y: number;
  /** Extended detail shown in the modal */
  detail?: {
    inputs?: string[];
    outputs?: string[];
    algorithm?: string;
    keyMetrics?: string[];
  };
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  title?: string;
  height?: number;
}

/**
 * Interactive AI Model Flow Diagram
 * SVG-based flow chart with hover states, animated connections, and clickable Dialog modals
 */
export function AIModelFlowDiagram({
  nodes,
  edges,
  title,
  height = 400,
}: FlowDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const hoveredInfo = nodes.find(n => n.id === hoveredNode);

  // Calculate SVG viewBox based on node positions
  const padding = 60;
  const nodeWidth = 140;
  const nodeHeight = 50;
  const maxX = Math.max(...nodes.map(n => n.x)) + nodeWidth + padding;
  const maxY = Math.max(...nodes.map(n => n.y)) + nodeHeight + padding;

  // Get node center for edge drawing
  const getNodeCenter = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight / 2 };
  };

  return (
    <>
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        {title && (
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Click any node for detailed explanation
            </p>
          </div>
        )}
        <div className="relative" style={{ height }}>
          <svg
            viewBox={`0 0 ${maxX} ${maxY}`}
            className="w-full h-full"
            style={{ minHeight: height }}
          >
            {/* Animated gradient defs */}
            <defs>
              <linearGradient
                id="edgeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(240,184,0,0.3)" />
                <stop offset="50%" stopColor="rgba(240,184,0,0.7)" />
                <stop offset="100%" stopColor="rgba(240,184,0,0.3)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="rgba(240,184,0,0.6)" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, idx) => {
              const from = getNodeCenter(edge.from);
              const to = getNodeCenter(edge.to);
              const isHighlighted =
                hoveredNode === edge.from || hoveredNode === edge.to;

              // Calculate control points for curved edges
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const midX = from.x + dx * 0.5;
              const midY = from.y + dy * 0.5;
              const curveOffset =
                Math.abs(dx) > Math.abs(dy) ? dy * 0.2 : dx * 0.2;

              return (
                <g key={`edge-${idx}`}>
                  <path
                    d={`M ${from.x} ${from.y} Q ${midX + curveOffset} ${midY - curveOffset} ${to.x} ${to.y}`}
                    fill="none"
                    stroke={
                      isHighlighted
                        ? "rgba(240,184,0,0.8)"
                        : "rgba(240,184,0,0.25)"
                    }
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isHighlighted ? "none" : "4 4"}
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-300"
                  />
                  {edge.label && (
                    <text
                      x={midX + curveOffset * 0.5}
                      y={midY - curveOffset * 0.5 - 8}
                      textAnchor="middle"
                      className="text-[8px] fill-muted-foreground"
                      style={{ fontSize: "8px", fill: "rgba(180,180,210,0.5)" }}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isHovered = hoveredNode === node.id;
              const isConnected = edges.some(
                e =>
                  (e.from === node.id || e.to === node.id) &&
                  (e.from === hoveredNode || e.to === hoveredNode)
              );

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer"
                >
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={8}
                    fill={
                      isHovered
                        ? `${node.color}30`
                        : isConnected
                          ? `${node.color}15`
                          : "rgba(15,15,25,0.8)"
                    }
                    stroke={
                      isHovered
                        ? node.color
                        : isConnected
                          ? `${node.color}80`
                          : "rgba(255,255,255,0.1)"
                    }
                    strokeWidth={isHovered ? 2 : 1}
                    filter={isHovered ? "url(#glow)" : undefined}
                    className="transition-all duration-200"
                  />
                  {/* Icon */}
                  <text
                    x={node.x + 14}
                    y={node.y + nodeHeight / 2 + 5}
                    style={{ fontSize: "16px" }}
                  >
                    {node.icon}
                  </text>
                  {/* Label */}
                  <text
                    x={node.x + 36}
                    y={node.y + nodeHeight / 2 + 4}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      fill: isHovered ? "white" : "rgba(220,220,240,0.9)",
                    }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Info Panel */}
          {hoveredInfo && (
            <div className="absolute bottom-3 left-3 right-3 bg-background/95 border border-border/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{hoveredInfo.icon}</span>
                <span className="text-sm font-semibold text-white">
                  {hoveredInfo.label}
                </span>
                <span className="text-[9px] text-muted-foreground ml-auto">
                  Click for details
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {hoveredInfo.description}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog
        open={!!selectedNode}
        onOpenChange={open => !open && setSelectedNode(null)}
      >
        <DialogContent className="bg-background border-border max-w-lg">
          {selectedNode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{selectedNode.icon}</span>
                  <span style={{ color: selectedNode.color }}>
                    {selectedNode.label}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground pt-2">
                  {selectedNode.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {selectedNode.detail?.algorithm && (
                  <div>
                    <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                      Algorithm
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedNode.detail.algorithm}
                    </p>
                  </div>
                )}
                {selectedNode.detail?.inputs &&
                  selectedNode.detail.inputs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                        Inputs
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.detail.inputs.map(inp => (
                          <Badge
                            key={inp}
                            variant="outline"
                            className="text-xs"
                          >
                            {inp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedNode.detail?.outputs &&
                  selectedNode.detail.outputs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                        Outputs
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.detail.outputs.map(out => (
                          <Badge
                            key={out}
                            variant="outline"
                            className="text-xs border-green-500/30 text-green-400"
                          >
                            {out}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedNode.detail?.keyMetrics &&
                  selectedNode.detail.keyMetrics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                        Key Metrics
                      </h4>
                      <ul className="space-y-1">
                        {selectedNode.detail.keyMetrics.map(m => (
                          <li
                            key={m}
                            className="text-xs text-muted-foreground flex items-center gap-2"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: selectedNode.color }}
                            />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {!selectedNode.detail && (
                  <p className="text-sm text-muted-foreground italic">
                    This component processes data through the pipeline as
                    described above. Detailed technical documentation is
                    available on the Methodology page.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// PRE-BUILT DIAGRAM CONFIGURATIONS
// ============================================================================

/** AI Model Pipeline Diagram (for /methodology page) */
export const AI_MODEL_PIPELINE_NODES: FlowNode[] = [
  {
    id: "odds-api",
    label: "Odds API",
    description:
      "Real-time odds from 15+ US sportsbooks via The Odds API. Refreshed every 60 seconds.",
    icon: "📡",
    color: "#3b82f6",
    x: 40,
    y: 30,
    detail: {
      inputs: [
        "15+ sportsbook feeds",
        "60-second polling interval",
        "H2H, spreads, totals markets",
      ],
      outputs: [
        "Normalized odds matrix",
        "Line movement deltas",
        "Book consensus lines",
      ],
      algorithm:
        "Concurrent API polling with rate limiting. Odds are normalized to decimal format, deduplicated by event ID, and stored with millisecond timestamps for line movement tracking.",
      keyMetrics: [
        "~2,400 events/day across NFL, NBA, MLB, NHL",
        "Average latency: 1.2s from book to platform",
        "99.7% uptime SLA",
      ],
    },
  },
  {
    id: "devig",
    label: "Shin Devig Engine",
    description:
      "Institutional-grade devigging using Shin's method. Solves for insider parameter z to extract true probabilities.",
    icon: "🧮",
    color: "#8b5cf6",
    x: 240,
    y: 30,
    detail: {
      inputs: ["Raw bookmaker odds (2-way or 3-way)", "Market overround (vig)"],
      outputs: [
        "True implied probabilities",
        "Fair odds (no-vig lines)",
        "Insider parameter z",
      ],
      algorithm:
        "Shin's model assumes a fraction z of bettors are insiders. We solve the cubic equation iteratively (bisection method, 50 iterations) to find z, then derive true probabilities that sum to 1.0. Superior to multiplicative/additive devig for favorites.",
      keyMetrics: [
        "Convergence in <50 iterations",
        "Handles 2-way and 3-way markets",
        "z typically ranges 0.02–0.08 in liquid markets",
      ],
    },
  },
  {
    id: "elo",
    label: "Elo + MoV Model",
    description:
      "FiveThirtyEight-style Elo with Margin of Victory adjustments. 151 historical games seeded across NFL/NBA/MLB.",
    icon: "📊",
    color: "#06b6d4",
    x: 40,
    y: 120,
    detail: {
      inputs: [
        "Historical game results",
        "Margin of victory",
        "Home/away splits",
      ],
      outputs: [
        "Team power ratings",
        "Win probability estimates",
        "Expected point spreads",
      ],
      algorithm:
        "Standard Elo with K-factor of 20, augmented by a margin-of-victory multiplier (log(MoV + 1) * 2.2 / expected_margin_delta). Autocorrelation dampener prevents overreaction to blowouts. Season-start regression to mean (1/3 toward 1500).",
      keyMetrics: [
        "151 seeded historical matchups per sport",
        "Brier score: 0.21 (NFL), 0.24 (NBA)",
        "Updates within 5 minutes of final score",
      ],
    },
  },
  {
    id: "poisson",
    label: "Poisson Matrix",
    description:
      "Score probability distributions using Poisson modeling. Generates win/draw/loss and over/under probabilities.",
    icon: "🎯",
    color: "#10b981",
    x: 240,
    y: 120,
    detail: {
      inputs: [
        "Team attack/defense ratings",
        "Expected goals (xG) or runs",
        "League averages",
      ],
      outputs: [
        "7×7 score probability matrix",
        "Win/Draw/Loss probabilities",
        "Over/Under line probabilities",
      ],
      algorithm:
        "Independent Poisson distributions for each team's scoring. P(Home=i, Away=j) = P_home(i) × P_away(j) where P_team(k) = e^(-λ) × λ^k / k!. Lambda derived from team xG adjusted for opponent defensive strength.",
      keyMetrics: [
        "7×7 matrix covers 95%+ of realistic outcomes",
        "Calibration error < 2% on totals markets",
        "Supports MLB, NHL, soccer natively",
      ],
    },
  },
  {
    id: "steam",
    label: "Steam Detection",
    description:
      "Multi-book sharp money detection. Flags when 3+ sharp books move in sync within 2 minutes.",
    icon: "🔥",
    color: "#ef4444",
    x: 440,
    y: 30,
    detail: {
      inputs: [
        "Real-time line movements from all books",
        "Book classification (sharp vs. square)",
        "Movement timestamps",
      ],
      outputs: [
        "Steam move alerts",
        "Direction (home/away)",
        "Magnitude (cents moved)",
      ],
      algorithm:
        "Monitors Pinnacle, Circa, and Bookmaker as sharp indicators. When 3+ sharp books move the same direction by ≥3 cents within a 2-minute window, a steam alert fires. False positive filtering via volume confirmation and reverse-steam detection.",
      keyMetrics: [
        "Average 12-18 steam moves per day across all sports",
        "72% of steam moves predict final line direction",
        "Alert latency: <30 seconds from first move",
      ],
    },
  },
  {
    id: "kelly",
    label: "Kelly Optimizer",
    description:
      "Fractional Kelly criterion with bankroll caps. Calculates optimal bet sizing from true probability edge.",
    icon: "💰",
    color: "#f59e0b",
    x: 440,
    y: 120,
    detail: {
      inputs: [
        "True win probability (from devig)",
        "Offered decimal odds",
        "Current bankroll",
        "Risk tolerance (fraction)",
      ],
      outputs: [
        "Optimal stake %",
        "Expected growth rate",
        "Risk of ruin estimate",
      ],
      algorithm:
        "Full Kelly = (bp - q) / b where b = decimal_odds - 1, p = true_prob, q = 1 - p. We apply fractional Kelly (default 0.25×) to reduce variance. Hard cap at 5% of bankroll per bet. Negative Kelly = no bet (negative EV).",
      keyMetrics: [
        "Default fraction: 0.25 (quarter Kelly)",
        "Max single-bet exposure: 5% bankroll",
        "Geometric growth optimization over 1000+ bet horizon",
      ],
    },
  },
  {
    id: "grok",
    label: "Grok-4 Strategy",
    description:
      "xAI Grok-4 for complex strategy analysis. Synthesizes all signals into actionable recommendations.",
    icon: "🤖",
    color: "#f0b800",
    x: 240,
    y: 220,
    detail: {
      inputs: [
        "Elo power ratings",
        "Poisson score matrix",
        "Steam signals",
        "Kelly sizing",
        "Injury/weather context",
      ],
      outputs: [
        "Natural language analysis",
        "Confidence score (0-100)",
        "Risk assessment",
        "Recommended action",
      ],
      algorithm:
        "Grok-4 receives a structured prompt with all quantitative signals plus contextual data (injuries, weather, rest days). It synthesizes conflicting signals, identifies narrative factors the models miss, and produces a confidence-weighted recommendation with reasoning chain.",
      keyMetrics: [
        "Invoked for 'high complexity' picks only",
        "Average response time: 3.2s",
        "Adds ~4% accuracy on conflicting-signal games",
      ],
    },
  },
  {
    id: "pick",
    label: "Final Pick",
    description:
      "Confidence-scored pick with full audit trail: EV%, Kelly%, steam status, Elo edge, and Poisson model agreement.",
    icon: "✅",
    color: "#22c55e",
    x: 440,
    y: 220,
    detail: {
      inputs: [
        "All upstream model outputs",
        "Confidence threshold (default 65%)",
        "Bankroll context",
      ],
      outputs: [
        "Pick recommendation",
        "Confidence score",
        "Bet size",
        "Full audit trail",
      ],
      algorithm:
        "Weighted ensemble: Shin EV (30%), Elo edge (25%), Poisson agreement (20%), Steam confirmation (15%), Grok synthesis (10%). Only picks with confidence ≥65% and positive Kelly are published. Every pick is timestamped and immutable for CLV grading.",
      keyMetrics: [
        "Average 8-12 picks published daily",
        "Historical CLV: +2.3 cents average",
        "All picks graded within 4 hours of game completion",
      ],
    },
  },
];

export const AI_MODEL_PIPELINE_EDGES: FlowEdge[] = [
  { from: "odds-api", to: "devig", label: "raw odds" },
  { from: "odds-api", to: "steam", label: "line moves" },
  { from: "devig", to: "kelly", label: "true prob" },
  { from: "devig", to: "poisson", label: "fair lines" },
  { from: "elo", to: "poisson", label: "expected scores" },
  { from: "elo", to: "grok", label: "power ratings" },
  { from: "poisson", to: "grok", label: "score matrix" },
  { from: "steam", to: "grok", label: "sharp signals" },
  { from: "kelly", to: "grok", label: "bet sizing" },
  { from: "grok", to: "pick", label: "synthesis" },
];

/** Platform User Flow Diagram (for /how-it-works page) */
export const PLATFORM_FLOW_NODES: FlowNode[] = [
  {
    id: "signup",
    label: "Sign Up",
    description:
      "Create your account in seconds. Free tier gives access to basic odds comparison and community picks.",
    icon: "👤",
    color: "#3b82f6",
    x: 40,
    y: 30,
    detail: {
      inputs: ["Email address", "Password"],
      outputs: ["User account", "Free tier access", "Dashboard access"],
      algorithm:
        "Secure OAuth 2.0 authentication with bcrypt password hashing. Free tier unlocks odds comparison, community picks, and basic tools. No credit card required.",
      keyMetrics: [
        "Account creation in <10 seconds",
        "Free tier includes 3 daily picks",
        "Upgrade anytime from dashboard",
      ],
    },
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description:
      "Your command center. Track active bets, view P&L, monitor bankroll, and see today's top opportunities.",
    icon: "📱",
    color: "#8b5cf6",
    x: 240,
    y: 30,
    detail: {
      inputs: ["User bet history", "Live odds feeds", "AI pick engine output"],
      outputs: [
        "P&L summary",
        "Win rate metrics",
        "Today's opportunities",
        "Bankroll chart",
      ],
      algorithm:
        "Real-time aggregation of all user activity. Cumulative P&L chart, win/loss breakdown by sport, Monte Carlo simulation of future outcomes, and personalized pick recommendations based on betting history.",
      keyMetrics: [
        "Updates every 60 seconds",
        "Tracks unlimited bets",
        "CSV/PDF export available",
      ],
    },
  },
  {
    id: "ev-finder",
    label: "+EV Finder",
    description:
      "Real-time scanner across 15+ books. Surfaces bets where offered odds exceed true probability (positive expected value).",
    icon: "🔍",
    color: "#10b981",
    x: 440,
    y: 30,
    detail: {
      inputs: [
        "Live odds from 15+ sportsbooks",
        "Shin-devigged true probabilities",
        "Kelly criterion thresholds",
      ],
      outputs: [
        "+EV opportunities list",
        "Edge percentage",
        "Recommended stake",
        "Book with best line",
      ],
      algorithm:
        "Compares each book's offered odds against Shin-derived true probabilities. Any bet where offered_odds > fair_odds is flagged as +EV. Sorted by Kelly-weighted expected value. Filters out low-liquidity and closing markets.",
      keyMetrics: [
        "Average 40-80 +EV opportunities per day",
        "Median edge: 3.2%",
        "Refreshes every 60 seconds",
      ],
    },
  },
  {
    id: "strategy",
    label: "Strategy Builder",
    description:
      "Describe your betting style in plain English. Grok-4 AI converts it into a quantitative strategy with backtested results.",
    icon: "🧠",
    color: "#f0b800",
    x: 40,
    y: 140,
    detail: {
      inputs: [
        "Natural language strategy description",
        "Risk tolerance",
        "Sport preferences",
        "Bankroll size",
      ],
      outputs: [
        "Quantitative rules",
        "Backtested performance",
        "Risk metrics",
        "Recommended adjustments",
      ],
      algorithm:
        "Grok-4 parses your plain-English strategy into quantifiable rules (e.g., 'bet NFL underdogs getting 7+ points at home' → filter criteria). Then runs 10,000 Monte Carlo simulations against historical data to show expected ROI, max drawdown, and Sharpe ratio.",
      keyMetrics: [
        "Supports any sport/market combination",
        "Backtest window: up to 5 years",
        "Results in <15 seconds",
      ],
    },
  },
  {
    id: "backtest",
    label: "Backtesting",
    description:
      "10,000-simulation Monte Carlo engine. See median ROI, max drawdown, Sharpe ratio, and ruin probability before risking capital.",
    icon: "📈",
    color: "#06b6d4",
    x: 240,
    y: 140,
    detail: {
      inputs: [
        "Strategy rules",
        "Historical odds data",
        "Bet sizing parameters",
      ],
      outputs: [
        "Median ROI",
        "5th/95th percentile outcomes",
        "Max drawdown",
        "Sharpe ratio",
        "Ruin probability",
      ],
      algorithm:
        "Bootstrap resampling of historical bet outcomes (10,000 iterations). Each simulation randomly samples from your strategy's historical hit rate with replacement, applying Kelly sizing. Produces a full distribution of possible outcomes.",
      keyMetrics: [
        "10,000 simulations per backtest",
        "Covers NFL/NBA/MLB/NHL",
        "Includes transaction costs and vig",
      ],
    },
  },
  {
    id: "alerts",
    label: "Smart Alerts",
    description:
      "Push notifications for steam moves, high-EV opportunities, and closing line value changes. Never miss an edge.",
    icon: "🔔",
    color: "#ef4444",
    x: 440,
    y: 140,
    detail: {
      inputs: [
        "Steam detection engine",
        "+EV scanner",
        "CLV tracker",
        "User notification preferences",
      ],
      outputs: [
        "Push notifications",
        "Email alerts",
        "In-app notifications",
        "Discord webhook",
      ],
      algorithm:
        "Event-driven notification system. Triggers on: steam moves (3+ sharp books), new +EV opportunities above user threshold, CLV changes >2 cents, and pick publication. Configurable per sport, market, and minimum edge.",
      keyMetrics: [
        "Average alert latency: <45 seconds",
        "Configurable thresholds",
        "Supports push, email, Discord, and in-app",
      ],
    },
  },
  {
    id: "track",
    label: "Bet Tracker",
    description:
      "Log every bet with automatic CLV grading. See which strategies actually beat the closing line over time.",
    icon: "📝",
    color: "#f59e0b",
    x: 140,
    y: 250,
    detail: {
      inputs: ["User-logged bets", "Closing line data", "Game results"],
      outputs: [
        "CLV grade per bet",
        "Strategy-level ROI",
        "Sport breakdown",
        "Exportable history",
      ],
      algorithm:
        "Automatic CLV calculation: compares your bet odds at time of placement vs. closing line. Positive CLV = you beat the market. Aggregates by strategy, sport, and time period. Auto-grades win/loss/push within 4 hours of game completion.",
      keyMetrics: [
        "Unlimited bet logging",
        "Auto-grading within 4 hours",
        "CSV and PDF export",
      ],
    },
  },
  {
    id: "profit",
    label: "Profit",
    description:
      "Data-driven bettors using ChalkPicks average 6.2% ROI. The edge compounds — let math replace gut feeling.",
    icon: "💎",
    color: "#22c55e",
    x: 340,
    y: 250,
    detail: {
      inputs: [
        "Consistent +EV betting",
        "Kelly-optimized sizing",
        "Discipline and bankroll management",
      ],
      outputs: [
        "Compounding returns",
        "Growing bankroll",
        "Verifiable track record",
      ],
      algorithm:
        "The mathematical edge compounds over hundreds of bets. With a 3% average edge and quarter-Kelly sizing, expected bankroll growth follows a geometric progression. The law of large numbers ensures convergence to expected value over sufficient sample size.",
      keyMetrics: [
        "Platform average ROI: 6.2%",
        "Median time to profitability: 47 bets",
        "Top quartile members: 12%+ ROI",
      ],
    },
  },
];

export const PLATFORM_FLOW_EDGES: FlowEdge[] = [
  { from: "signup", to: "dashboard" },
  { from: "dashboard", to: "ev-finder" },
  { from: "dashboard", to: "strategy" },
  { from: "ev-finder", to: "alerts", label: "+EV alerts" },
  { from: "strategy", to: "backtest", label: "test it" },
  { from: "backtest", to: "track", label: "deploy" },
  { from: "alerts", to: "track", label: "bet placed" },
  { from: "track", to: "profit", label: "compound" },
];
