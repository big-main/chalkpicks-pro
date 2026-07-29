/**
 * Lazy-loaded Recharts chart component for the homepage.
 * Extracted to reduce initial bundle TBT (Total Blocking Time).
 * Recharts is ~200KB and not needed for initial render.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const performanceData = [
  { month: "Oct", roi: 12.1 },
  { month: "Nov", roi: 15.3 },
  { month: "Dec", roi: 19.7 },
  { month: "Jan", roi: 18.4 },
  { month: "Feb", roi: 21.3 },
  { month: "Mar", roi: 23.1 },
];

export default function LazyRechartsChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={performanceData}>
        <defs>
          <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39ff14" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          itemStyle={{ color: "#39ff14" }}
        />
        <Area type="monotone" dataKey="roi" stroke="#39ff14" strokeWidth={2.5} fill="url(#roiGradient)" dot={{ fill: "#39ff14", r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
