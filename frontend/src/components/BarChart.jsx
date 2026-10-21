import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Single-series horizontal bar chart. One hue, direct value labels, hover
 * tooltip with the exact figure and share of total — no legend needed since
 * there's only one series per chart (identity comes from the row label).
 */
export default function BarChart({ data, color = "#059669", unit = "", formatValue }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const fmt = formatValue || ((v) => v.toLocaleString());

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-emerald-300/40">No data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const share = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0";
        return (
          <div
            key={`${d.label}-${i}`}
            className="relative"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-100">{d.label}</span>
              <span className="tabular-nums text-emerald-300/60">
                {fmt(d.value)}
                {unit}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.04 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            {hoverIndex === i && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-money-950 px-2 py-1 text-xs text-white shadow-lg"
              >
                {fmt(d.value)}
                {unit} &middot; {share}% of total
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
