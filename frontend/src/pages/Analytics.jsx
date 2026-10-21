import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flag, Sparkles, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import DebtStrategyPanel from "../components/DebtStrategyPanel";
import Badge from "../components/Badge";

export default function Analytics() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/analytics/opportunity-cost").then(setResults).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="px-6 py-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
        <Flag size={24} className="text-gold-400" /> Debt-Free Plan
      </h1>
      <p className="mt-1 text-sm text-emerald-300/60">
        Two simple paths to zero debt: the plan if nothing changes, and the plan if every extra
        rupee goes to the right place.
      </p>

      <div className="mt-6">
        <DebtStrategyPanel />
      </div>

      <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-money-950 p-6 shadow-xl">
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-2">
          <Badge className="bg-gradient-to-r from-emerald-400 to-cyan-300">Dividend Optimizer</Badge>
        </div>
        <h2 className="relative mt-3 flex items-center gap-2 font-display text-xl font-bold text-white">
          <Sparkles size={20} className="text-gold-400" /> Liquid Liquidation
        </h2>
        <p className="relative mt-1 text-xs text-emerald-200/70">
          Compares upcoming chit fund dividends against your highest-interest gold loan.
        </p>

        {error && <p className="relative mt-4 text-sm text-red-300">{error}</p>}

        <div className="relative mt-5 space-y-3">
          {results.map((r, i) => (
            <motion.div
              key={`${r.chit_fund_id}-${r.gold_loan_id}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <div>
                  <p className="text-sm font-medium text-emerald-50">{r.recommendation}</p>
                  <p className="mt-1 text-xs text-emerald-300/60">
                    Dividend ₹{r.dividend_amount.toLocaleString()} vs. monthly interest ₹
                    {r.gold_loan_monthly_interest.toLocaleString()} on {r.gold_loan_lender}&apos;s gold
                    loan — {r.pct_of_interest_covered}% covered.
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          {results.length === 0 && !error && (
            <p className="text-sm text-emerald-300/40">
              No opportunities yet — add an active gold loan and a chit fund with a dividend amount to
              see recommendations here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
