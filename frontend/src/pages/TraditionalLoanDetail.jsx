import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Home,
  Landmark,
  ListChecks,
  Pencil,
} from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import EditLoanForm from "../components/EditLoanForm";
import { FREQUENCY_OPTIONS, periodInterestOnly } from "../utils/loanMath";

function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function TraditionalLoanDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [rebasing, setRebasing] = useState(false);
  const [rebaseForm, setRebaseForm] = useState({ as_of_installment: "", balance: "" });

  function refresh() {
    api.get(`/traditional-loans/${id}`).then(setLoan);
    api.get(`/traditional-loans/${id}/payments`).then(setPayments);
  }

  useEffect(refresh, [id]);

  async function togglePaid(payment) {
    setBusyId(payment.id);
    try {
      const updated = await api.put(`/traditional-loans/payments/${payment.id}`, {
        is_paid: !payment.is_paid,
      });
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } finally {
      setBusyId(null);
    }
  }

  async function markPaidThrough(installmentNumber) {
    const updated = await api.post(
      `/traditional-loans/${id}/payments/mark-paid-through/${installmentNumber}`
    );
    setPayments(updated);
  }

  async function applyRebase(e) {
    e.preventDefault();
    const updated = await api.post(`/traditional-loans/${id}/rebase`, {
      as_of_installment: parseInt(rebaseForm.as_of_installment, 10),
      balance: parseFloat(rebaseForm.balance),
    });
    setPayments(updated);
    setRebasing(false);
  }

  if (!loan) {
    return <div className="px-6 py-8 text-emerald-300/50">Loading…</div>;
  }

  const completed = payments.filter((p) => p.is_paid).length;
  const remaining = payments.length - completed;
  const totalPaid = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + p.amount, 0);
  const totalInterestPaid = payments
    .filter((p) => p.is_paid)
    .reduce((sum, p) => sum + p.interest_component, 0);
  const remainingPayable = payments.filter((p) => !p.is_paid).reduce((sum, p) => sum + p.amount, 0);
  const outstandingPrincipal = loan.outstanding_principal ?? loan.principal_amount;
  const isManualOverride = loan.outstanding_override != null;
  const firstDue = addMonths(loan.start_date, loan.moratorium_months);
  const estimatedCompletion = payments.length
    ? payments[payments.length - 1].due_date
    : addMonths(firstDue, loan.tenure_months - 1);
  const TypeIcon = loan.loan_type === "home" ? Home : GraduationCap;
  const interestFloor = periodInterestOnly(
    loan.principal_amount,
    loan.interest_rate,
    loan.payment_frequency_months
  );
  const emiTooLow = !isManualOverride && loan.emi_amount > 0 && loan.emi_amount <= interestFloor;
  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === (loan.payment_frequency_months || 1))?.label || "Monthly";

  return (
    <div className="px-6 py-8">
      <Link
        to="/loans?tab=traditional"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-100"
      >
        <ArrowLeft size={15} /> Back to Loan & Debt Panel
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
          <TypeIcon size={24} className="text-gold-300" /> {loan.bank_name || loan.lender_name}
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium capitalize text-emerald-200">
            {loan.loan_type} loan
          </span>
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-emerald-100 shadow-sm transition-colors hover:bg-white/10"
        >
          <Pencil size={14} /> Edit Loan
        </button>
      </div>
      <p className="mt-1 text-sm text-emerald-200/70">
        Lender: {loan.lender_name} &middot; {frequencyLabel} payments &middot; Started{" "}
        {loan.start_date} &middot; First payment {firstDue} &middot; Est. completion{" "}
        {estimatedCompletion || "—"}
      </p>

      {emiTooLow && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <span>
            This installment (₹{loan.emi_amount.toLocaleString()}) doesn&apos;t cover the interest
            for one {frequencyLabel.toLowerCase()} period (₹{Math.round(interestFloor).toLocaleString()}
            ) on the outstanding principal — at this rate the loan will never pay itself down. Edit
            the loan to recalculate, or set the real outstanding balance manually.
          </span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payments Completed" value={completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Payments Remaining" value={remaining} icon={Clock} tone="gold" />
        <StatCard
          label={isManualOverride ? "Outstanding Principal (manual)" : "Outstanding Principal"}
          value={outstandingPrincipal}
          prefix="₹"
          icon={Landmark}
          tone="gold"
        />
        <StatCard
          label="Interest Paid So Far"
          value={totalInterestPaid}
          prefix="₹"
          icon={CalendarCheck}
          tone="green"
        />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
          <ListChecks size={16} className="text-emerald-300" /> Overview
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Bank Name</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{loan.bank_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Lender / Contact</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{loan.lender_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Principal Amount</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              ₹{loan.principal_amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Installment Amount</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              ₹{loan.emi_amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Payment Frequency</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{frequencyLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Interest Rate</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              {loan.interest_rate}% ({loan.rate_type})
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Tenure</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{loan.tenure_months} months</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Moratorium</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{loan.moratorium_months} months</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Start Date</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{loan.start_date}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Total Paid (cash)</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">₹{totalPaid.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Remaining Payable (cash)</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              ₹{remainingPayable.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Total Payable (full tenure)</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              ₹{(loan.emi_amount * (payments.length || loan.tenure_months)).toLocaleString()}
            </dd>
          </div>
        </dl>
        {isManualOverride && (
          <div className="mt-4 rounded-lg border border-gold-400/30 bg-gold-500/10 p-3 text-xs text-gold-200">
            <p>
              Outstanding principal is set manually to match your real bank statement. Future
              installments below are still a calculated projection off the original principal
              unless you rebase them to this real balance — clear the override in Edit to go back
              to the fully calculated figure instead.
            </p>
            {!rebasing ? (
              <button
                onClick={() => {
                  setRebaseForm({
                    as_of_installment: String(completed),
                    balance: String(loan.outstanding_override),
                  });
                  setRebasing(true);
                }}
                className="mt-2 rounded-lg border border-gold-400/40 bg-white/5 px-3 py-1 font-medium text-gold-200 hover:bg-white/10"
              >
                Rebase future installments to this balance
              </button>
            ) : (
              <form onSubmit={applyRebase} className="mt-2 flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="block text-[11px] font-medium text-gold-300">As of installment #</span>
                  <input
                    type="number"
                    required
                    className="mt-0.5 w-28 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-emerald-50 focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
                    value={rebaseForm.as_of_installment}
                    onChange={(e) => setRebaseForm({ ...rebaseForm, as_of_installment: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-medium text-gold-300">Real balance (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-0.5 w-32 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-emerald-50 focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
                    value={rebaseForm.balance}
                    onChange={(e) => setRebaseForm({ ...rebaseForm, balance: e.target.value })}
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-gradient-to-r from-gold-400 to-gold-300 px-3 py-1 font-semibold text-money-950 hover:brightness-110"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setRebasing(false)}
                  className="rounded-md px-3 py-1 font-medium text-gold-200 hover:bg-white/10"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: payments.length ? `${(completed / payments.length) * 100}%` : "0%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-money-950 shadow-lg">
        <table className="w-full text-left text-sm text-emerald-100">
          <thead className="bg-white/5 text-emerald-300/70">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Installment</th>
              <th className="px-4 py-2">Principal</th>
              <th className="px-4 py-2">Interest</th>
              <th className="px-4 py-2">Balance After</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Paid Date</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {payments.map((p) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-white/10"
                >
                  <td className="px-4 py-2">{p.installment_number}</td>
                  <td className="px-4 py-2">{p.due_date}</td>
                  <td className="px-4 py-2">₹{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-emerald-300">₹{p.principal_component.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gold-300">₹{p.interest_component.toLocaleString()}</td>
                  <td className="px-4 py-2">₹{p.balance_after.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.is_paid ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-emerald-300/40"
                      }`}
                    >
                      {p.is_paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{p.paid_date ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={busyId === p.id}
                        onClick={() => togglePaid(p)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          p.is_paid
                            ? "bg-white/10 text-emerald-200 hover:bg-white/20"
                            : "bg-emerald-500 text-money-950 font-semibold hover:bg-emerald-400"
                        }`}
                      >
                        {p.is_paid ? "Mark unpaid" : "Mark paid"}
                      </motion.button>
                      {!p.is_paid && (
                        <button
                          onClick={() => markPaidThrough(p.installment_number)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-white/10"
                          title="Mark every installment up to this one as paid"
                        >
                          Paid through here
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal open={editing} title="Edit Traditional Loan" onClose={() => setEditing(false)}>
        <EditLoanForm
          type="traditional"
          item={loan}
          onSaved={() => {
            setEditing(false);
            refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}
