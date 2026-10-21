import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Percent, Scale, Landmark, AlertCircle } from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import BarChart from "../components/BarChart";

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function urgencyClasses(days) {
  if (days < 0) return "border border-red-400/40 bg-red-500/15 text-red-300";
  if (days <= 7) return "border border-red-400/20 bg-red-500/10 text-red-300";
  if (days <= 30) return "border border-gold-400/30 bg-gold-500/10 text-gold-300";
  return "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

export default function GoldLoanReport() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/gold-loans")
      .then(setLoans)
      .finally(() => setLoading(false));
  }, []);

  const totalGramWeight = loans.reduce((sum, l) => sum + l.gram_weight, 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal_amount, 0);
  const totalAnnualInterest = loans.reduce(
    (sum, l) => sum + l.principal_amount * (l.interest_rate / 100),
    0
  );
  const weightedAvgRate = totalPrincipal > 0 ? (totalAnnualInterest / totalPrincipal) * 100 : 0;

  const byLender = {};
  for (const l of loans) {
    const entry = byLender[l.lender_name] || { weight: 0, interest: 0 };
    entry.weight += l.gram_weight;
    entry.interest += l.principal_amount * (l.interest_rate / 100);
    byLender[l.lender_name] = entry;
  }
  const interestChartData = Object.entries(byLender)
    .map(([label, v]) => ({ label, value: Math.round(v.interest) }))
    .sort((a, b) => b.value - a.value);
  const weightChartData = Object.entries(byLender)
    .map(([label, v]) => ({ label, value: Math.round(v.weight * 10) / 10 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300/70 hover:text-emerald-100"
      >
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <h1 className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
        <Coins size={24} className="text-gold-300" /> Gold Loan Report
      </h1>
      <p className="mt-1 text-sm text-emerald-200/70">
        Weight, principal, and yearly interest cost across every active gold loan.
      </p>

      {!loading && loans.length === 0 && (
        <p className="mt-8 text-emerald-300/50">
          No gold loans yet.{" "}
          <Link to="/data-entry" className="text-gold-300 underline">
            Add one from Data Entry
          </Link>
          .
        </p>
      )}

      {loans.length > 0 && (
        <>
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard label="Active Gold Loans" value={loans.length} icon={Coins} />
            <StatCard
              label="Total Gram Weight"
              value={totalGramWeight}
              decimals={1}
              icon={Scale}
              tone="gold"
            />
            <StatCard label="Total Principal" value={totalPrincipal} prefix="₹" icon={Landmark} />
            <StatCard
              label="Total Yearly Interest"
              value={totalAnnualInterest}
              prefix="₹"
              icon={Percent}
              tone="gold"
            />
          </motion.div>

          <p className="mt-3 text-xs text-emerald-300/50">
            Weighted average interest rate across all principal: {weightedAvgRate.toFixed(2)}% p.a.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
              <h2 className="mb-4 font-display text-sm font-semibold text-emerald-50">
                Yearly Interest by Lender (total across loans)
              </h2>
              <BarChart
                data={interestChartData}
                color="#ca8a04"
                formatValue={(v) => `₹${v.toLocaleString()}`}
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
              <h2 className="mb-4 font-display text-sm font-semibold text-emerald-50">
                Gram Weight by Lender (total across loans)
              </h2>
              <BarChart data={weightChartData} color="#059669" unit="g" />
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-money-950 shadow-lg">
            <table className="w-full text-left text-sm text-emerald-100">
              <thead className="bg-white/5 text-emerald-300/70">
                <tr>
                  <th className="px-4 py-2">Lender</th>
                  <th className="px-4 py-2">Gram Weight</th>
                  <th className="px-4 py-2">Karat</th>
                  <th className="px-4 py-2">Principal</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Yearly Interest</th>
                  <th className="px-4 py-2">Renewal Due</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const annualInterest = l.principal_amount * (l.interest_rate / 100);
                  const days = daysUntil(l.renewal_due_date);
                  return (
                    <tr key={l.id} className="border-t border-white/10">
                      <td className="px-4 py-2 font-medium text-emerald-50">{l.lender_name}</td>
                      <td className="px-4 py-2">{l.gram_weight}g</td>
                      <td className="px-4 py-2">{l.karat}K</td>
                      <td className="px-4 py-2">₹{l.principal_amount.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {l.interest_rate}% ({l.interest_type})
                      </td>
                      <td className="px-4 py-2 font-medium text-gold-300">
                        ₹{annualInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${urgencyClasses(
                            days
                          )}`}
                        >
                          {days < 7 && <AlertCircle size={12} className="text-red-400" />}
                          {l.renewal_due_date}
                          {days >= 0 ? ` (${days}d)` : ` (${Math.abs(days)}d overdue)`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
