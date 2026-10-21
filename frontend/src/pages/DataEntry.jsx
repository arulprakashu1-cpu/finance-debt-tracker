import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calculator, CheckCircle2, Coins, FilePlus2, Landmark, PiggyBank } from "lucide-react";
import { api } from "../api/client";
import { calculateEmi, FREQUENCY_OPTIONS, periodInterestOnly } from "../utils/loanMath";

const TABS = [
  { label: "Gold Loan", icon: Coins },
  { label: "Chit Fund", icon: PiggyBank },
  { label: "Traditional Loan", icon: Landmark },
];

const emptyGoldLoan = {
  lender_name: "",
  gram_weight: "",
  karat: "22",
  principal_amount: "",
  ltv_ratio: "75",
  interest_type: "simple",
  interest_rate: "",
  start_date: "",
  renewal_due_date: "",
};

const emptyChitFund = {
  chit_name: "",
  foreman_name: "",
  total_chit_value: "",
  number_of_months: "",
  total_members: "",
  monthly_installment: "",
  commission_percent: "0",
  auction_frequency_months: "1",
  started_on: "",
  auction_date: "",
};

const emptyTraditionalLoan = {
  loan_type: "home",
  lender_name: "",
  bank_name: "",
  principal_amount: "",
  moratorium_months: "0",
  rate_type: "fixed",
  interest_rate: "",
  tenure_years: "",
  payment_frequency_months: "1",
  start_date: "",
};

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-emerald-200/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-emerald-300/50">{hint}</span>}
    </label>
  );
}

function AffixInput({ prefix, suffix, ...props }) {
  return (
    <div className="relative mt-1">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-300/60">
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-white/15 bg-white/5 py-2 text-sm text-emerald-50 placeholder:text-emerald-300/30 focus:border-gold-400/60 focus:outline-none focus:ring-1 focus:ring-gold-400/30 ${
          prefix ? "pl-7" : "pl-3"
        } ${suffix ? "pr-12" : "pr-3"}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-300/60">
          {suffix}
        </span>
      )}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-300/30 focus:border-gold-400/60 focus:outline-none focus:ring-1 focus:ring-gold-400/30";
const submitClass =
  "rounded-lg bg-gradient-to-r from-gold-400 to-gold-300 px-4 py-2 text-sm font-semibold text-money-950 shadow-sm transition-all hover:brightness-110";

export default function DataEntry() {
  const [tab, setTab] = useState(TABS[0].label);
  const [goldLoan, setGoldLoan] = useState(emptyGoldLoan);
  const [chitFund, setChitFund] = useState(emptyChitFund);
  const [traditionalLoan, setTraditionalLoan] = useState(emptyTraditionalLoan);
  const [message, setMessage] = useState(null);

  async function submitGoldLoan(e) {
    e.preventDefault();
    await api.post("/gold-loans", {
      ...goldLoan,
      gram_weight: parseFloat(goldLoan.gram_weight),
      karat: parseInt(goldLoan.karat, 10),
      principal_amount: parseFloat(goldLoan.principal_amount),
      ltv_ratio: parseFloat(goldLoan.ltv_ratio),
      interest_rate: parseFloat(goldLoan.interest_rate),
    });
    setMessage("Gold loan saved.");
    setGoldLoan(emptyGoldLoan);
  }

  async function submitChitFund(e) {
    e.preventDefault();
    await api.post("/chit-funds", {
      chit_name: chitFund.chit_name,
      foreman_name: chitFund.foreman_name,
      total_chit_value: parseFloat(chitFund.total_chit_value),
      number_of_months: parseInt(chitFund.number_of_months, 10),
      total_members: chitFund.total_members ? parseInt(chitFund.total_members, 10) : 0,
      monthly_installment: parseFloat(chitFund.monthly_installment),
      commission_percent: parseFloat(chitFund.commission_percent) || 5,
      auction_frequency_months: parseInt(chitFund.auction_frequency_months, 10) || 1,
      started_on: chitFund.started_on || null,
      auction_date: chitFund.auction_date,
    });
    setMessage("Chit fund saved. Add members next, then record auctions from its report page.");
    setChitFund(emptyChitFund);
  }

  async function submitTraditionalLoan(e) {
    e.preventDefault();
    const { emi, months } = calculateEmi(
      traditionalLoan.principal_amount,
      traditionalLoan.interest_rate,
      traditionalLoan.tenure_years,
      traditionalLoan.payment_frequency_months
    );
    await api.post("/traditional-loans", {
      loan_type: traditionalLoan.loan_type,
      lender_name: traditionalLoan.lender_name,
      bank_name: traditionalLoan.bank_name,
      principal_amount: parseFloat(traditionalLoan.principal_amount),
      moratorium_months: parseInt(traditionalLoan.moratorium_months, 10),
      emi_amount: Math.round(emi),
      payment_frequency_months: parseInt(traditionalLoan.payment_frequency_months, 10),
      rate_type: traditionalLoan.rate_type,
      interest_rate: parseFloat(traditionalLoan.interest_rate),
      tenure_months: months,
      start_date: traditionalLoan.start_date,
    });
    setMessage("Traditional loan saved.");
    setTraditionalLoan(emptyTraditionalLoan);
  }

  const emiPreview = calculateEmi(
    traditionalLoan.principal_amount,
    traditionalLoan.interest_rate,
    traditionalLoan.tenure_years,
    traditionalLoan.payment_frequency_months
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
        <FilePlus2 size={24} className="text-gold-300" /> Financial Record Ingestion
      </h1>

      <div className="mt-4 flex gap-2 border-b border-white/10">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => {
              setTab(label);
              setMessage(null);
            }}
            className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              tab === label ? "text-gold-300" : "text-emerald-300/50 hover:text-emerald-100"
            }`}
          >
            <Icon size={16} />
            {label}
            {tab === label && (
              <motion.span
                layoutId="entry-tab-underline"
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-gold-400"
              />
            )}
          </button>
        ))}
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          <CheckCircle2 size={16} /> {message}
        </motion.p>
      )}

      {tab === "Gold Loan" && (
        <motion.form
          key="gold"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitGoldLoan}
          className="mt-6 grid grid-cols-2 gap-4">
          <Field label="Lending bank / pawn broker">
            <input className={inputClass} required value={goldLoan.lender_name}
              onChange={(e) => setGoldLoan({ ...goldLoan, lender_name: e.target.value })} />
          </Field>
          <Field label="Gram weight">
            <input type="number" step="0.01" className={inputClass} required value={goldLoan.gram_weight}
              onChange={(e) => setGoldLoan({ ...goldLoan, gram_weight: e.target.value })} />
          </Field>
          <Field label="Karat purity">
            <select className={inputClass} value={goldLoan.karat}
              onChange={(e) => setGoldLoan({ ...goldLoan, karat: e.target.value })}>
              {[14, 18, 22, 24].map((k) => <option key={k} value={k}>{k}K</option>)}
            </select>
          </Field>
          <Field label="Principal amount">
            <input type="number" step="0.01" className={inputClass} required value={goldLoan.principal_amount}
              onChange={(e) => setGoldLoan({ ...goldLoan, principal_amount: e.target.value })} />
          </Field>
          <Field label="LTV ratio (%)">
            <input type="number" step="0.01" className={inputClass} required value={goldLoan.ltv_ratio}
              onChange={(e) => setGoldLoan({ ...goldLoan, ltv_ratio: e.target.value })} />
          </Field>
          <Field label="Interest type">
            <select className={inputClass} value={goldLoan.interest_type}
              onChange={(e) => setGoldLoan({ ...goldLoan, interest_type: e.target.value })}>
              <option value="simple">Simple</option>
              <option value="compounding">Compounding</option>
            </select>
          </Field>
          <Field label="Interest rate (% p.a.)">
            <input type="number" step="0.01" className={inputClass} required value={goldLoan.interest_rate}
              onChange={(e) => setGoldLoan({ ...goldLoan, interest_rate: e.target.value })} />
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} required value={goldLoan.start_date}
              onChange={(e) => setGoldLoan({ ...goldLoan, start_date: e.target.value })} />
          </Field>
          <Field label="Renewal due date">
            <input type="date" className={inputClass} required value={goldLoan.renewal_due_date}
              onChange={(e) => setGoldLoan({ ...goldLoan, renewal_due_date: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className={submitClass}>
              Save gold loan
            </motion.button>
          </div>
        </motion.form>
      )}

      {tab === "Chit Fund" && (
        <motion.form
          key="chit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitChitFund}
          className="mt-6 grid grid-cols-2 gap-4">
          <Field label="Chit name">
            <input className={inputClass} required value={chitFund.chit_name}
              onChange={(e) => setChitFund({ ...chitFund, chit_name: e.target.value })} />
          </Field>
          <Field label="Chit owner / foreman name">
            <input className={inputClass} required value={chitFund.foreman_name}
              onChange={(e) => setChitFund({ ...chitFund, foreman_name: e.target.value })} />
          </Field>
          <Field label="Total chit value">
            <input type="number" step="0.01" className={inputClass} required value={chitFund.total_chit_value}
              onChange={(e) => setChitFund({ ...chitFund, total_chit_value: e.target.value })} />
          </Field>
          <Field label="Number of months">
            <input type="number" className={inputClass} required value={chitFund.number_of_months}
              onChange={(e) => setChitFund({ ...chitFund, number_of_months: e.target.value })} />
          </Field>
          <Field label="Total members">
            <input type="number" className={inputClass} required value={chitFund.total_members}
              onChange={(e) => setChitFund({ ...chitFund, total_members: e.target.value })} />
          </Field>
          <Field label="Monthly installment">
            <input type="number" step="0.01" className={inputClass} required value={chitFund.monthly_installment}
              onChange={(e) => setChitFund({ ...chitFund, monthly_installment: e.target.value })} />
          </Field>
          <Field
            label="Commission (% of discount, reference only)"
            hint="Tracked for your records only — it is not subtracted from members' dividends"
          >
            <AffixInput
              suffix="%"
              type="number"
              step="0.01"
              value={chitFund.commission_percent}
              onChange={(e) => setChitFund({ ...chitFund, commission_percent: e.target.value })}
            />
          </Field>
          <Field label="Auction Frequency" hint="How often the auction/collection happens">
            <AffixInput
              suffix="months"
              type="number"
              value={chitFund.auction_frequency_months}
              onChange={(e) => setChitFund({ ...chitFund, auction_frequency_months: e.target.value })}
            />
          </Field>
          <Field label="Started on">
            <input type="date" className={inputClass} required value={chitFund.started_on}
              onChange={(e) => setChitFund({ ...chitFund, started_on: e.target.value })} />
          </Field>
          <Field label="Next auction date">
            <input type="date" className={inputClass} required value={chitFund.auction_date}
              onChange={(e) => setChitFund({ ...chitFund, auction_date: e.target.value })} />
          </Field>
          <p className="col-span-2 text-xs text-emerald-300/50">
            Add members and record each auction (winner, bid amount) from the chit fund&apos;s report
            page after saving — commission and per-member dividends are calculated automatically from
            each auction&apos;s discount.
          </p>
          <div className="col-span-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className={submitClass}>
              Save chit fund
            </motion.button>
          </div>
        </motion.form>
      )}

      {tab === "Traditional Loan" && (
        <motion.form
          key="traditional"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitTraditionalLoan}
          className="mt-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Loan Amount (₹)" hint="The principal amount you wish to borrow">
                <AffixInput
                  prefix="₹"
                  type="number"
                  step="0.01"
                  required
                  value={traditionalLoan.principal_amount}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, principal_amount: e.target.value })}
                />
              </Field>
              <Field label="Interest Rate (Annual %)" hint="Annual interest rate">
                <AffixInput
                  suffix="%"
                  type="number"
                  step="0.01"
                  required
                  value={traditionalLoan.interest_rate}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, interest_rate: e.target.value })}
                />
              </Field>
              <Field label="Loan Tenure (Years)" hint="Loan repayment period">
                <AffixInput
                  suffix="years"
                  type="number"
                  step="0.5"
                  required
                  value={traditionalLoan.tenure_years}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, tenure_years: e.target.value })}
                />
              </Field>
              <Field label="Payment Frequency" hint="How often you actually pay — monthly EMI or a lump sum every few months">
                <select
                  className={inputClass}
                  value={traditionalLoan.payment_frequency_months}
                  onChange={(e) =>
                    setTraditionalLoan({ ...traditionalLoan, payment_frequency_months: e.target.value })
                  }
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start Date" hint="Loan start date for the amortization schedule">
                <input
                  type="date"
                  className={inputClass}
                  required
                  value={traditionalLoan.start_date}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, start_date: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
              <Calculator size={16} className="text-gold-300" /> Calculation Results
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-4">
                <p className="text-sm font-medium text-sky-300">Installment</p>
                <p className="text-xs text-sky-300/60">
                  {FREQUENCY_OPTIONS.find((f) => String(f.value) === String(traditionalLoan.payment_frequency_months))
                    ?.label || "Monthly"}{" "}
                  payment &middot; {emiPreview.numPayments || 0} total
                </p>
                <p className="mt-2 text-right font-display text-2xl font-bold text-sky-100">
                  ₹{Math.round(emiPreview.emi).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-300">Total Interest Payable</p>
                <p className="mt-2 text-right font-display text-2xl font-bold text-amber-100">
                  ₹{Math.round(emiPreview.totalInterest).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-medium text-emerald-300">Total Payment</p>
                <p className="mt-2 text-right font-display text-2xl font-bold text-emerald-100">
                  ₹{Math.round(emiPreview.totalPayment).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 p-4">
                <p className="text-sm font-medium text-violet-300">Principal Amount</p>
                <p className="mt-2 text-right font-display text-2xl font-bold text-violet-100">
                  ₹{(parseFloat(traditionalLoan.principal_amount) || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {emiPreview.emi > 0 &&
              emiPreview.emi <=
                periodInterestOnly(
                  traditionalLoan.principal_amount,
                  traditionalLoan.interest_rate,
                  traditionalLoan.payment_frequency_months
                ) && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    This installment doesn&apos;t cover the period&apos;s interest — the principal
                    will never go down at this rate. Increase the amount or tenure.
                  </span>
                </div>
              )}
          </div>

          <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
            <h3 className="mb-4 font-display text-sm font-semibold text-emerald-50">Loan Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Loan type">
                <select className={inputClass} value={traditionalLoan.loan_type}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, loan_type: e.target.value })}>
                  <option value="home">Home</option>
                  <option value="education">Education</option>
                </select>
              </Field>
              <Field label="Rate type">
                <select className={inputClass} value={traditionalLoan.rate_type}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, rate_type: e.target.value })}>
                  <option value="fixed">Fixed</option>
                  <option value="floating">Floating</option>
                </select>
              </Field>
              <Field label="Bank name">
                <input className={inputClass} required value={traditionalLoan.bank_name}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, bank_name: e.target.value })} />
              </Field>
              <Field label="Lender / contact">
                <input className={inputClass} required value={traditionalLoan.lender_name}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, lender_name: e.target.value })} />
              </Field>
              <Field label="Moratorium (months)">
                <input type="number" className={inputClass} value={traditionalLoan.moratorium_months}
                  onChange={(e) => setTraditionalLoan({ ...traditionalLoan, moratorium_months: e.target.value })} />
              </Field>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className={submitClass}>
            Save traditional loan
          </motion.button>
        </motion.form>
      )}
    </div>
  );
}
