import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, GraduationCap, Home, Landmark } from "lucide-react";
import { FREQUENCY_OPTIONS, periodInterestOnly } from "../utils/loanMath";

export default function LoanTrackerCard({ loan }) {
  const TypeIcon = loan.loan_type === "home" ? Home : GraduationCap;
  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === (loan.payment_frequency_months || 1))?.label || "Monthly";
  const interestFloor = periodInterestOnly(
    loan.principal_amount,
    loan.interest_rate,
    loan.payment_frequency_months
  );
  const emiTooLow =
    loan.outstanding_override == null && loan.emi_amount > 0 && loan.emi_amount <= interestFloor;
  const remaining = Math.max((loan.total_installments || 0) - (loan.payments_completed_count || 0), 0);
  const progressPct =
    loan.total_installments > 0
      ? Math.min(((loan.payments_completed_count || 0) / loan.total_installments) * 100, 100)
      : 0;

  return (
    <Link to={`/loan-report/${loan.id}`}>
      <motion.div
        whileHover={{ y: -3, boxShadow: "0 12px 24px -12px rgba(0,0,0,0.5)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="rounded-xl border border-white/10 bg-money-950 p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-50">
            <TypeIcon size={15} className="text-gold-400" /> {loan.bank_name || loan.lender_name}
          </span>
          {emiTooLow && (
            <span title="Installment doesn't cover interest">
              <AlertTriangle size={14} className="text-red-400" />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs capitalize text-emerald-300/50">
          {loan.loan_type} loan &middot; {frequencyLabel}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-300/50">Outstanding</p>
            <p className="font-display text-lg font-bold text-gold-300">
              ₹{loan.outstanding_principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-emerald-300/50">Interest Paid</p>
            <p className="font-display text-sm font-semibold text-emerald-200">
              ₹{loan.interest_paid_so_far.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-300/50">
          <span className="flex items-center gap-1">
            <CalendarCheck size={11} /> {loan.payments_completed_count ?? 0}/{loan.total_installments} paid
          </span>
          <span className="flex items-center gap-1">
            <Landmark size={11} /> {remaining} left
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
