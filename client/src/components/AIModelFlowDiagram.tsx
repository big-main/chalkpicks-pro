import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface FlowNode {
  id: string;
  label: string;
  description: string;
  icon?: string;
  color: string;
  x: number;
  y: number;
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
 * SVG-based flow chart with hover states and animated connections
 */
export function AIModelFlowDiagram({
  nodes,
  edges,
  title,
  height = 400,
}: FlowDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
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
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
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
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
            </div>
            <p className="text-xs text-muted-foreground">
              {hoveredInfo.description}
            </p>
          </div>
        )}
      </div>
    </Card>
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
