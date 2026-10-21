import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  Landmark,
  ListChecks,
  Percent,
  PiggyBank,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import CoinBackground from "../components/CoinBackground";
import AnimatedNumber from "../components/AnimatedNumber";
import LoanTrackerCard from "../components/LoanTrackerCard";

const container = {
  animate: { transition: { staggerChildren: 0.06 } },
};

function Metric({ icon: Icon, label, value, tone = "text-emerald-50" }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="shrink-0 text-emerald-300/40" />
      <span className="text-[11px] text-emerald-300/60">{label}</span>
      <span className={`ml-auto text-xs font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function CategoryCard({ to, icon: Icon, iconTone, title, headline, headlineLabel, headlineTone, metrics }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 10px 24px -10px rgba(0,0,0,0.6)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="rounded-xl border border-white/10 bg-money-950 p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-50">
            <Icon size={15} className={iconTone} /> {title}
          </span>
          <ArrowRight size={13} className="text-emerald-300/30" />
        </div>
        <p className={`mt-2 font-display text-xl font-bold ${headlineTone}`}>{headline}</p>
        {headlineLabel && <p className="text-[11px] text-emerald-300/50">{headlineLabel}</p>}
        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
          {metrics.map((m) => (
            <Metric key={m.label} {...m} />
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

export default function Dashboard() {
  const [goldLoans, setGoldLoans] = useState([]);
  const [chitFunds, setChitFunds] = useState([]);
  const [traditionalLoans, setTraditionalLoans] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/gold-loans"),
      api.get("/chit-funds"),
      api.get("/traditional-loans"),
      api.get("/alerts/escalations"),
    ])
      .then(([gold, chit, loans, esc]) => {
        setGoldLoans(gold);
        setChitFunds(chit);
        setTraditionalLoans(loans);
        setEscalations(esc);
      })
      .catch((err) => setError(err.message));
  }, []);

  const totalGoldPrincipal = goldLoans.reduce((sum, l) => sum + l.principal_amount, 0);
  const totalGoldWeight = goldLoans.reduce((sum, l) => sum + l.gram_weight, 0);
  const totalGoldYearlyInterest = goldLoans.reduce(
    (sum, l) => sum + l.principal_amount * (l.interest_rate / 100),
    0
  );
  const totalChitMembers = chitFunds.reduce((sum, c) => sum + (c.total_members || 0), 0);
  const totalChitCompleted = chitFunds.reduce((sum, c) => sum + (c.members_won_count || 0), 0);
  const totalChitRemaining = Math.max(totalChitMembers - totalChitCompleted, 0);
  const totalEmiCompleted = traditionalLoans.reduce((sum, l) => sum + (l.payments_completed_count || 0), 0);
  const totalEmiCount = traditionalLoans.reduce(
    (sum, l) => sum + Math.max(Math.round((l.tenure_months || 0) / (l.payment_frequency_months || 1)), 1),
    0
  );
  const totalEmiRemaining = Math.max(totalEmiCount - totalEmiCompleted, 0);
  const totalOutstandingTraditional = traditionalLoans.reduce(
    (sum, l) => sum + (l.outstanding_principal ?? l.principal_amount),
    0
  );
  // Uses completed_real_auctions (not members_won_count) so a permanent payer's
  // automatic "first yelam" — no real auction, no real money disbursed — doesn't
  // wrongly reduce how much is still owed.
  const chitRemainingObligation = chitFunds.reduce(
    (sum, c) =>
      sum + c.monthly_installment * Math.max((c.total_members || 0) - (c.completed_real_auctions || 0), 0),
    0
  );
  const totalOverallDebt = totalGoldPrincipal + totalOutstandingTraditional + chitRemainingObligation;

  return (
    <div className="px-5 py-5">
      <div className="relative overflow-hidden rounded-xl bg-money-gradient px-5 py-4 text-emerald-50 shadow-lg">
        <CoinBackground count={4} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-200/80">
              <TrendingUp size={13} /> Net worth command center
            </p>
            <h1 className="font-display text-lg font-bold leading-tight">
              Welcome back<span className="text-gold-shimmer">.</span>
            </h1>
          </div>
          <div className="relative rounded-lg border border-white/10 bg-black/10 px-4 py-2 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-200/70">
              Total Overall Debt
            </p>
            <p className="font-display text-xl font-bold text-gold-shimmer">
              <AnimatedNumber value={totalOverallDebt} prefix="₹" />
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-red-300">
          Couldn&apos;t reach the backend API ({error}). Start it with{" "}
          <code>uvicorn app.main:app --reload</code>.
        </p>
      )}

      {escalations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-300"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <p className="text-xs font-medium">
            {escalations.length} missed due date(s) — a chit auction or gold loan renewal needs attention.
          </p>
        </motion.div>
      )}

      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <CategoryCard
          to="/gold-report"
          icon={Coins}
          iconTone="text-gold-400"
          title="Gold Loans"
          headline={`₹${totalGoldPrincipal.toLocaleString()}`}
          headlineLabel="Total principal"
          headlineTone="text-gold-300"
          metrics={[
            { icon: Landmark, label: "Active loans", value: goldLoans.length },
            { icon: Scale, label: "Total weight", value: `${totalGoldWeight.toFixed(1)}g` },
            {
              icon: Percent,
              label: "Yearly interest",
              value: `₹${totalGoldYearlyInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            },
          ]}
        />
        <CategoryCard
          to="/loans?tab=chit"
          icon={PiggyBank}
          iconTone="text-emerald-400"
          title="Chit Funds"
          headline={`₹${chitRemainingObligation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          headlineLabel="Remaining to pay (post-auction)"
          headlineTone="text-gold-300"
          metrics={[
            { icon: PiggyBank, label: "Active chit funds", value: chitFunds.length },
            { icon: CheckCircle2, label: "Auctions completed", value: totalChitCompleted },
            { icon: Clock, label: "Auctions remaining", value: totalChitRemaining },
          ]}
        />
        <CategoryCard
          to="/loans?tab=traditional"
          icon={Landmark}
          iconTone="text-emerald-400"
          title="Home & Education Loans"
          headline={`₹${totalOutstandingTraditional.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          headlineLabel="Outstanding balance"
          headlineTone="text-gold-300"
          metrics={[
            { icon: ListChecks, label: "Total installments", value: totalEmiCount },
            { icon: CheckCircle2, label: "Completed", value: totalEmiCompleted },
            { icon: Clock, label: "Remaining", value: totalEmiRemaining },
          ]}
        />
      </motion.div>

      {traditionalLoans.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 font-display text-sm font-bold text-emerald-50">Loan Tracker</h2>
          <motion.div
            variants={container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {traditionalLoans.map((loan) => (
              <LoanTrackerCard key={loan.id} loan={loan} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
