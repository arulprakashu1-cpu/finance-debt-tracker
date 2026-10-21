import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BarChart3, Coins, ListChecks, PiggyBank, Landmark, Pencil, Trash2, Users } from "lucide-react";
import { api } from "../api/client";
import Modal from "../components/Modal";
import EditLoanForm from "../components/EditLoanForm";
import { FREQUENCY_OPTIONS, periodInterestOnly } from "../utils/loanMath";

const TABS = [
  { label: "Gold Loans", icon: Coins, param: "gold" },
  { label: "Chit Funds", icon: PiggyBank, param: "chit" },
  { label: "Traditional Loans", icon: Landmark, param: "traditional" },
];

const MODAL_TITLES = {
  gold: "Edit Gold Loan",
  chit: "Edit Chit Fund",
  traditional: "Edit Traditional Loan",
};

function EditButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="rounded-md p-1.5 text-emerald-300 transition-colors hover:bg-white/10"
      title="Edit"
    >
      <Pencil size={16} />
    </motion.button>
  );
}

function DeleteButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="rounded-md p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
      title="Delete"
    >
      <Trash2 size={16} />
    </motion.button>
  );
}

export default function LoanDebtPanel() {
  const [searchParams] = useSearchParams();
  const initialTab = TABS.find((t) => t.param === searchParams.get("tab"))?.label ?? TABS[0].label;
  const [tab, setTab] = useState(initialTab);
  const [goldLoans, setGoldLoans] = useState([]);
  const [chitFunds, setChitFunds] = useState([]);
  const [traditionalLoans, setTraditionalLoans] = useState([]);
  const [editing, setEditing] = useState(null); // { type: "gold" | "chit" | "traditional", item }

  function refresh() {
    api.get("/gold-loans").then(setGoldLoans).catch(() => {});
    api.get("/chit-funds").then(setChitFunds).catch(() => {});
    api.get("/traditional-loans").then(setTraditionalLoans).catch(() => {});
  }

  useEffect(refresh, []);

  async function removeGoldLoan(id) {
    await api.del(`/gold-loans/${id}`);
    setGoldLoans((prev) => prev.filter((l) => l.id !== id));
  }
  async function removeChitFund(id) {
    await api.del(`/chit-funds/${id}`);
    setChitFunds((prev) => prev.filter((c) => c.id !== id));
  }
  async function removeTraditionalLoan(id) {
    await api.del(`/traditional-loans/${id}`);
    setTraditionalLoans((prev) => prev.filter((l) => l.id !== id));
  }

  function handleSaved(updated) {
    if (editing.type === "gold") {
      setGoldLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } else if (editing.type === "chit") {
      setChitFunds((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      setTraditionalLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }
    setEditing(null);
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-emerald-50">Loan & Debt Panel</h1>
        {tab === "Gold Loans" && goldLoans.length > 0 && (
          <Link
            to="/gold-report"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-emerald-100 shadow-sm transition-colors hover:bg-white/10"
          >
            <BarChart3 size={15} /> View detailed report
          </Link>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-b border-white/10">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              tab === label ? "text-gold-300" : "text-emerald-300/50 hover:text-emerald-100"
            }`}
          >
            <Icon size={16} />
            {label}
            {tab === label && (
              <motion.span
                layoutId="loan-tab-underline"
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-gold-400"
              />
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-money-950 shadow-lg"
      >
        {tab === "Gold Loans" && (
          <table className="w-full text-left text-sm text-emerald-100">
            <thead className="bg-white/5 text-emerald-300/70">
              <tr>
                <th className="px-4 py-2">Lender</th>
                <th className="px-4 py-2">Gram Weight</th>
                <th className="px-4 py-2">Karat</th>
                <th className="px-4 py-2">LTV</th>
                <th className="px-4 py-2">Interest</th>
                <th className="px-4 py-2">Yearly Interest</th>
                <th className="px-4 py-2">Renewal Due</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {goldLoans.map((l) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-2">{l.lender_name}</td>
                    <td className="px-4 py-2">{l.gram_weight}g</td>
                    <td className="px-4 py-2">{l.karat}K</td>
                    <td className="px-4 py-2">{l.ltv_ratio}%</td>
                    <td className="px-4 py-2">
                      {l.interest_rate}% ({l.interest_type})
                    </td>
                    <td className="px-4 py-2 font-medium text-gold-300">
                      ₹
                      {(l.principal_amount * (l.interest_rate / 100)).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-2">{l.renewal_due_date}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <EditButton onClick={() => setEditing({ type: "gold", item: l })} />
                        <DeleteButton onClick={() => removeGoldLoan(l.id)} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {goldLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-emerald-300/40">
                    No gold loans yet. Add one from Data Entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "Chit Funds" && (
          <table className="w-full text-left text-sm text-emerald-100">
            <thead className="bg-white/5 text-emerald-300/70">
              <tr>
                <th className="px-4 py-2">Chit Name</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Total Value</th>
                <th className="px-4 py-2">Months</th>
                <th className="px-4 py-2">Members (Won/Total)</th>
                <th className="px-4 py-2">Installment</th>
                <th className="px-4 py-2">Auction Every</th>
                <th className="px-4 py-2">Started On</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {chitFunds.map((c) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-2 font-medium text-emerald-50">{c.chit_name}</td>
                    <td className="px-4 py-2">{c.foreman_name || "—"}</td>
                    <td className="px-4 py-2">₹{c.total_chit_value.toLocaleString()}</td>
                    <td className="px-4 py-2">{c.number_of_months}</td>
                    <td className="px-4 py-2">
                      {c.members_won_count ?? 0}/{c.total_members || 0}
                    </td>
                    <td className="px-4 py-2">₹{c.monthly_installment.toLocaleString()}</td>
                    <td className="px-4 py-2">{c.auction_frequency_months || 1} mo</td>
                    <td className="px-4 py-2">{c.started_on || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/chit-report/${c.id}`}
                          className="rounded-md p-1.5 text-emerald-300 transition-colors hover:bg-white/10"
                          title="Manage members / view report"
                        >
                          <Users size={16} />
                        </Link>
                        <EditButton onClick={() => setEditing({ type: "chit", item: c })} />
                        <DeleteButton onClick={() => removeChitFund(c.id)} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {chitFunds.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-emerald-300/40">
                    No chit funds yet. Add one from Data Entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "Traditional Loans" && (
          <table className="w-full text-left text-sm text-emerald-100">
            <thead className="bg-white/5 text-emerald-300/70">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Bank</th>
                <th className="px-4 py-2">Lender</th>
                <th className="px-4 py-2">Principal</th>
                <th className="px-4 py-2">Outstanding</th>
                <th className="px-4 py-2">Installment</th>
                <th className="px-4 py-2">Frequency</th>
                <th className="px-4 py-2">Rate</th>
                <th className="px-4 py-2">Tenure</th>
                <th className="px-4 py-2">Payments (Paid/Total)</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {traditionalLoans.map((l) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-2 capitalize">{l.loan_type}</td>
                    <td className="px-4 py-2">{l.bank_name || "—"}</td>
                    <td className="px-4 py-2">{l.lender_name}</td>
                    <td className="px-4 py-2">₹{l.principal_amount.toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium text-gold-300">
                      <span className="inline-flex items-center gap-1">
                        ₹{(l.outstanding_principal ?? l.principal_amount).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                        {l.outstanding_override == null &&
                          l.emi_amount <=
                            periodInterestOnly(l.principal_amount, l.interest_rate, l.payment_frequency_months) && (
                          <AlertTriangle
                            size={13}
                            className="text-red-400"
                            aria-label="Installment doesn't cover interest"
                          >
                            <title>Installment doesn&apos;t cover interest for the period</title>
                          </AlertTriangle>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2">₹{l.emi_amount.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {FREQUENCY_OPTIONS.find((f) => f.value === (l.payment_frequency_months || 1))?.label ||
                        "Monthly"}
                    </td>
                    <td className="px-4 py-2">
                      {l.interest_rate}% ({l.rate_type})
                    </td>
                    <td className="px-4 py-2">{l.tenure_months} mo</td>
                    <td className="px-4 py-2">
                      {l.payments_completed_count ?? 0}/
                      {Math.max(Math.round(l.tenure_months / (l.payment_frequency_months || 1)), 1)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/loan-report/${l.id}`}
                          className="rounded-md p-1.5 text-emerald-300 transition-colors hover:bg-white/10"
                          title="View payment schedule / report"
                        >
                          <ListChecks size={16} />
                        </Link>
                        <EditButton onClick={() => setEditing({ type: "traditional", item: l })} />
                        <DeleteButton onClick={() => removeTraditionalLoan(l.id)} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {traditionalLoans.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-emerald-300/40">
                    No traditional loans yet. Add one from Data Entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal
        open={!!editing}
        title={editing ? MODAL_TITLES[editing.type] : ""}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <EditLoanForm
            type={editing.type}
            item={editing.item}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
