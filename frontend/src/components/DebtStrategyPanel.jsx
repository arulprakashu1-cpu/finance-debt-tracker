import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Coins,
  Gem,
  GraduationCap,
  Home,
  Rocket,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import Badge from "./Badge";

const KIND_ICON = { gold: Coins, home: Home, education: GraduationCap };

function formatMonthYear(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function DebtStrategyPanel() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [extra, setExtra] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const debounceRef = useRef(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = firstLoad.current ? 0 : 300;
    debounceRef.current = setTimeout(() => {
      firstLoad.current = false;
      api
        .get(`/analytics/debt-free-plan?extra_monthly=${extra}`)
        .then(setPlan)
        .catch((e) => setError(e.message));
    }, delay);
    return () => clearTimeout(debounceRef.current);
  }, [extra]);

  if (error) {
    return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }
  if (!plan || plan.loans.length === 0) return null;

  const maxSlider = Math.max(
    20000,
    Math.ceil(plan.loans.reduce((s, l) => s + l.monthly_cost, 0) / 5000) * 5000
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-money-950 p-6 text-emerald-50 shadow-2xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-money-500/25 blur-3xl" />

      <div className="relative flex flex-wrap items-center gap-2">
        <Badge className="bg-gradient-to-r from-gold-400 to-gold-300">Debt Strategy</Badge>
        <Badge className="bg-gradient-to-r from-emerald-400 to-cyan-300">Avalanche Plan</Badge>
      </div>
      <h2 className="relative mt-3 font-display text-xl font-bold leading-tight text-white sm:text-2xl">
        Every data corner, one plan to zero.
      </h2>
      <p className="relative mt-1 max-w-2xl text-xs text-emerald-200/70">
        Gold loans, chit funds, home & education loans — simulated together, ranked by what's
        actually costing you the most. Drag the slider to see how extra cash changes the finish
        line.
      </p>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/60">
            Working Plan
          </p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-100">
            {formatMonthYear(plan.working_debt_free_date)}
          </p>
          <p className="text-[11px] text-emerald-300/50">minimum payments only</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-gold-400/30 bg-gold-500/10 p-4">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gold-300">
            <Rocket size={11} /> Optimistic Plan
          </p>
          <p className="mt-1 font-display text-xl font-bold text-gold-shimmer">
            {formatMonthYear(plan.optimistic_debt_free_date)}
          </p>
          {plan.years_saved > 0 && (
            <p className="text-[11px] font-medium text-gold-300">~{plan.years_saved} yrs sooner</p>
          )}
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
            <SlidersHorizontal size={13} /> Extra monthly payment toward{" "}
            {plan.priority_target_name || "your costliest debt"}
          </p>
          <span className="font-display text-sm font-bold text-gold-300">
            +₹{extra.toLocaleString()}/mo
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxSlider}
          step={500}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="mt-3 w-full accent-gold-400"
        />
        <div className="mt-1 flex justify-between text-[10px] text-emerald-300/50">
          <span>₹0</span>
          <span>₹{maxSlider.toLocaleString()}/mo</span>
        </div>
      </div>

      {plan.priority_target_name && (
        <div className="relative mt-4 flex items-start gap-2.5 rounded-xl border border-gold-400/20 bg-black/20 p-4">
          <Zap className="mt-0.5 shrink-0 text-gold-400" size={16} />
          <p className="text-xs text-emerald-100/90">
            <strong className="text-gold-300">The ₹1 rule:</strong> every spare rupee — bonus, chit
            dividend, or the slider above — hits <strong>{plan.priority_target_name}</strong> first.
            At {plan.priority_target_rate}% it's your costliest debt per rupee outstanding.
          </p>
        </div>
      )}

      <div className="relative mt-5 space-y-2">
        {plan.loans.map((l) => {
          const Icon = KIND_ICON[l.loan_type] || Home;
          const expanded = expandedId === l.id;
          return (
            <div key={l.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : l.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Icon size={15} className="shrink-0 text-gold-300" />
                <span className="w-20 shrink-0 truncate text-sm font-medium text-emerald-50 sm:w-28">
                  {l.name}
                </span>
                <span className="w-10 shrink-0 text-xs font-semibold text-red-300">
                  {l.interest_rate}%
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${l.pct_paid}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] text-emerald-300/70">
                  {l.pct_paid}%
                </span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-emerald-300/50 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="grid grid-cols-2 gap-3 border-t border-white/10 py-3 text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-emerald-300/50">Outstanding</p>
                        <p className="font-semibold text-emerald-50">
                          ₹{Math.round(l.balance).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-300/50">Monthly cost</p>
                        <p className="font-semibold text-emerald-50">
                          ₹{Math.round(l.monthly_cost).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-300/50">Working clears</p>
                        <p className="font-semibold text-emerald-50">
                          {formatMonthYear(l.working_clear_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-300/50">Optimistic clears</p>
                        <p className="font-semibold text-gold-300">
                          {formatMonthYear(l.optimistic_clear_date)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {plan.gold_loans.length > 0 && (
        <div className="relative mt-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/60">
            <Gem size={11} /> Gold loans — renew or redeem, not on the avalanche clock
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {plan.gold_loans.map((g) => (
              <div
                key={g.id}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <p className="text-xs font-semibold text-emerald-50">{g.lender_name}</p>
                <p className="text-[10px] text-emerald-300/60">
                  ₹{g.yearly_interest.toLocaleString()}/yr · renews {formatMonthYear(g.renewal_due_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.freed_up_events.length > 0 && (
        <div className="relative mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/60">
            Cash that frees up along the way
          </p>
          <div className="mt-2 space-y-1">
            {plan.freed_up_events.map((e) => (
              <p key={`${e.source}-${e.date}`} className="text-xs text-emerald-100/80">
                <strong className="text-emerald-50">{e.source}</strong> finishes ~
                {formatMonthYear(e.date)} — redirect ₹{e.amount.toLocaleString()}/mo
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
