import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

const toneClasses = {
  money: "border-white/10 bg-money-950 text-emerald-50",
  red: "border-red-400/30 bg-red-500/10 text-red-300",
  green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  gold: "border-gold-400/30 bg-gold-500/10 text-gold-300",
};

export default function StatCard({ label, value, prefix = "", decimals = 0, tone = "money", icon: Icon }) {
  const isNumeric = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 24px -12px rgba(0,0,0,0.5)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`rounded-xl border p-5 shadow-lg ${toneClasses[tone]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-70">{label}</p>
        {Icon && <Icon size={18} className="opacity-50" />}
      </div>
      <p className="mt-2 font-display text-2xl font-bold">
        {isNumeric ? <AnimatedNumber value={value} prefix={prefix} decimals={decimals} /> : value}
      </p>
    </motion.div>
  );
}
