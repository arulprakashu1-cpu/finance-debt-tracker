import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calculator } from "lucide-react";
import { api } from "../api/client";
import { calculateEmi, FREQUENCY_OPTIONS, periodInterestOnly } from "../utils/loanMath";

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
const cancelClass =
  "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-white/10";

export default function EditLoanForm({ type, item, onSaved, onCancel }) {
  const [form, setForm] = useState({
    ...item,
    tenure_years: type === "traditional" ? item.tenure_months / 12 : undefined,
    payment_frequency_months: type === "traditional" ? item.payment_frequency_months || 1 : undefined,
    outstanding_override: type === "traditional" ? item.outstanding_override ?? "" : undefined,
  });
  const [saving, setSaving] = useState(false);
  const emiPreview =
    type === "traditional"
      ? calculateEmi(form.principal_amount, form.interest_rate, form.tenure_years, form.payment_frequency_months)
      : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let updated;
      if (type === "gold") {
        updated = await api.put(`/gold-loans/${item.id}`, {
          lender_name: form.lender_name,
          gram_weight: parseFloat(form.gram_weight),
          karat: parseInt(form.karat, 10),
          principal_amount: parseFloat(form.principal_amount),
          ltv_ratio: parseFloat(form.ltv_ratio),
          interest_type: form.interest_type,
          interest_rate: parseFloat(form.interest_rate),
          start_date: form.start_date,
          renewal_due_date: form.renewal_due_date,
          notes: form.notes || null,
        });
      } else if (type === "chit") {
        updated = await api.put(`/chit-funds/${item.id}`, {
          chit_name: form.chit_name,
          foreman_name: form.foreman_name || "",
          total_chit_value: parseFloat(form.total_chit_value),
          number_of_months: parseInt(form.number_of_months, 10),
          total_members: form.total_members ? parseInt(form.total_members, 10) : 0,
          monthly_installment: parseFloat(form.monthly_installment),
          commission_percent: parseFloat(form.commission_percent) || 5,
          auction_frequency_months: parseInt(form.auction_frequency_months, 10) || 1,
          started_on: form.started_on || null,
          auction_date: form.auction_date,
          notes: form.notes || null,
        });
      } else {
        updated = await api.put(`/traditional-loans/${item.id}`, {
          loan_type: form.loan_type,
          lender_name: form.lender_name,
          bank_name: form.bank_name || "",
          principal_amount: parseFloat(form.principal_amount),
          moratorium_months: parseInt(form.moratorium_months, 10),
          emi_amount: Math.round(emiPreview.emi),
          payment_frequency_months: parseInt(form.payment_frequency_months, 10) || 1,
          rate_type: form.rate_type,
          interest_rate: parseFloat(form.interest_rate),
          tenure_months: emiPreview.months,
          start_date: form.start_date,
          outstanding_override:
            form.outstanding_override !== "" && form.outstanding_override != null
              ? parseFloat(form.outstanding_override)
              : null,
          notes: form.notes || null,
        });
      }
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  if (type === "gold") {
    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Lending bank / pawn broker">
          <input className={inputClass} required value={form.lender_name}
            onChange={(e) => setForm({ ...form, lender_name: e.target.value })} />
        </Field>
        <Field label="Gram weight">
          <input type="number" step="0.01" className={inputClass} required value={form.gram_weight}
            onChange={(e) => setForm({ ...form, gram_weight: e.target.value })} />
        </Field>
        <Field label="Karat purity">
          <select className={inputClass} value={form.karat}
            onChange={(e) => setForm({ ...form, karat: e.target.value })}>
            {[14, 18, 22, 24].map((k) => <option key={k} value={k}>{k}K</option>)}
          </select>
        </Field>
        <Field label="Principal amount">
          <input type="number" step="0.01" className={inputClass} required value={form.principal_amount}
            onChange={(e) => setForm({ ...form, principal_amount: e.target.value })} />
        </Field>
        <Field label="LTV ratio (%)">
          <input type="number" step="0.01" className={inputClass} required value={form.ltv_ratio}
            onChange={(e) => setForm({ ...form, ltv_ratio: e.target.value })} />
        </Field>
        <Field label="Interest type">
          <select className={inputClass} value={form.interest_type}
            onChange={(e) => setForm({ ...form, interest_type: e.target.value })}>
            <option value="simple">Simple</option>
            <option value="compounding">Compounding</option>
          </select>
        </Field>
        <Field label="Interest rate (% p.a.)">
          <input type="number" step="0.01" className={inputClass} required value={form.interest_rate}
            onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
        </Field>
        <Field label="Start date">
          <input type="date" className={inputClass} required value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Renewal due date">
          <input type="date" className={inputClass} required value={form.renewal_due_date}
            onChange={(e) => setForm({ ...form, renewal_due_date: e.target.value })} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={cancelClass}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving} className={submitClass}>
            {saving ? "Saving..." : "Save changes"}
          </motion.button>
        </div>
      </form>
    );
  }

  if (type === "chit") {
    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Chit name">
          <input className={inputClass} required value={form.chit_name}
            onChange={(e) => setForm({ ...form, chit_name: e.target.value })} />
        </Field>
        <Field label="Chit owner / foreman name">
          <input className={inputClass} required value={form.foreman_name ?? ""}
            onChange={(e) => setForm({ ...form, foreman_name: e.target.value })} />
        </Field>
        <Field label="Total chit value">
          <input type="number" step="0.01" className={inputClass} required value={form.total_chit_value}
            onChange={(e) => setForm({ ...form, total_chit_value: e.target.value })} />
        </Field>
        <Field label="Number of months">
          <input type="number" className={inputClass} required value={form.number_of_months}
            onChange={(e) => setForm({ ...form, number_of_months: e.target.value })} />
        </Field>
        <Field label="Total members">
          <input type="number" className={inputClass} required value={form.total_members ?? ""}
            onChange={(e) => setForm({ ...form, total_members: e.target.value })} />
        </Field>
        <Field label="Monthly installment">
          <input type="number" step="0.01" className={inputClass} required value={form.monthly_installment}
            onChange={(e) => setForm({ ...form, monthly_installment: e.target.value })} />
        </Field>
        <Field label="Commission (% of each auction's discount)">
          <input type="number" step="0.01" className={inputClass} value={form.commission_percent ?? 5}
            onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} />
        </Field>
        <Field label="Auction frequency (months)">
          <input type="number" className={inputClass} value={form.auction_frequency_months ?? 1}
            onChange={(e) => setForm({ ...form, auction_frequency_months: e.target.value })} />
        </Field>
        <Field label="Started on">
          <input type="date" className={inputClass} value={form.started_on ?? ""}
            onChange={(e) => setForm({ ...form, started_on: e.target.value })} />
        </Field>
        <Field label="Next auction date">
          <input type="date" className={inputClass} required value={form.auction_date}
            onChange={(e) => setForm({ ...form, auction_date: e.target.value })} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={cancelClass}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving} className={submitClass}>
            {saving ? "Saving..." : "Save changes"}
          </motion.button>
        </div>
      </form>
    );
  }

  const interestFloor = periodInterestOnly(form.principal_amount, form.interest_rate, form.payment_frequency_months);
  const emiTooLow = emiPreview.emi > 0 && emiPreview.emi <= interestFloor;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Loan Amount (₹)">
          <AffixInput
            prefix="₹"
            type="number"
            step="0.01"
            required
            value={form.principal_amount}
            onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
          />
        </Field>
        <Field label="Interest Rate (Annual %)">
          <AffixInput
            suffix="%"
            type="number"
            step="0.01"
            required
            value={form.interest_rate}
            onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
          />
        </Field>
        <Field label="Loan Tenure (Years)">
          <AffixInput
            suffix="years"
            type="number"
            step="0.5"
            required
            value={form.tenure_years}
            onChange={(e) => setForm({ ...form, tenure_years: e.target.value })}
          />
        </Field>
        <Field label="Start date">
          <input type="date" className={inputClass} required value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Payment Frequency">
          <select className={inputClass} value={form.payment_frequency_months}
            onChange={(e) => setForm({ ...form, payment_frequency_months: e.target.value })}>
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-50">
          <Calculator size={15} className="text-gold-300" /> Calculation Results
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
            <p className="text-xs font-medium text-sky-300">Installment</p>
            <p className="text-[10px] text-sky-300/60">{emiPreview.numPayments || 0} payments total</p>
            <p className="mt-1 text-sm font-bold text-sky-100">
              ₹{Math.round(emiPreview.emi).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
            <p className="text-xs font-medium text-amber-300">Total Interest</p>
            <p className="mt-1 text-sm font-bold text-amber-100">
              ₹{Math.round(emiPreview.totalInterest).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
            <p className="text-xs font-medium text-emerald-300">Total Payment</p>
            <p className="mt-1 text-sm font-bold text-emerald-100">
              ₹{Math.round(emiPreview.totalPayment).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 p-3">
            <p className="text-xs font-medium text-violet-300">Principal</p>
            <p className="mt-1 text-sm font-bold text-violet-100">
              ₹{(parseFloat(form.principal_amount) || 0).toLocaleString()}
            </p>
          </div>
        </div>
        {emiTooLow && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              This installment (₹{Math.round(emiPreview.emi).toLocaleString()}) doesn&apos;t cover
              the period&apos;s interest (₹{Math.round(interestFloor).toLocaleString()}) — the
              principal will never go down at this rate. Increase the installment or tenure.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Loan type">
          <select className={inputClass} value={form.loan_type}
            onChange={(e) => setForm({ ...form, loan_type: e.target.value })}>
            <option value="home">Home</option>
            <option value="education">Education</option>
          </select>
        </Field>
        <Field label="Rate type">
          <select className={inputClass} value={form.rate_type}
            onChange={(e) => setForm({ ...form, rate_type: e.target.value })}>
            <option value="fixed">Fixed</option>
            <option value="floating">Floating</option>
          </select>
        </Field>
        <Field label="Bank name">
          <input className={inputClass} required value={form.bank_name ?? ""}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
        </Field>
        <Field label="Lender / contact">
          <input className={inputClass} required value={form.lender_name}
            onChange={(e) => setForm({ ...form, lender_name: e.target.value })} />
        </Field>
        <Field label="Moratorium (months)">
          <input type="number" className={inputClass} value={form.moratorium_months}
            onChange={(e) => setForm({ ...form, moratorium_months: e.target.value })} />
        </Field>
      </div>

      <div className="rounded-xl border border-gold-400/30 bg-gold-500/10 p-4">
        <Field
          label="Correct Current Outstanding Balance (₹, optional)"
          hint="Overrides the calculated balance with the real figure from your bank statement — useful when actual payments don't match a clean amortization schedule."
        >
          <input
            type="number"
            step="0.01"
            placeholder="Leave blank to use the calculated balance"
            className={inputClass}
            value={form.outstanding_override}
            onChange={(e) => setForm({ ...form, outstanding_override: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={cancelClass}>
          Cancel
        </button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving} className={submitClass}>
          {saving ? "Saving..." : "Save changes"}
        </motion.button>
      </div>
    </form>
  );
}
