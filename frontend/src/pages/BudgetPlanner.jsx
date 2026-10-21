import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";

const CATEGORIES = [
  { value: "fixed_need", label: "Fixed Need (Rent, EMI, Utilities)" },
  { value: "want", label: "Want" },
];

export default function BudgetPlanner() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [burndown, setBurndown] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [netIncome, setNetIncome] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "fixed_need",
    amount: "",
    spent_on: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    api.get("/budget/plans").then((data) => {
      setPlans(data);
      if (data.length > 0) setSelectedPlanId(data[0].id);
    });
  }, []);

  function refreshPlan() {
    if (!selectedPlanId) return;
    api.get(`/budget/plans/${selectedPlanId}/burndown`).then(setBurndown);
    api.get(`/budget/plans/${selectedPlanId}/expenses`).then(setExpenses);
  }

  useEffect(refreshPlan, [selectedPlanId]);

  async function createPlan(e) {
    e.preventDefault();
    const plan = await api.post("/budget/plans", {
      month: new Date().toISOString().slice(0, 10),
      net_income: parseFloat(netIncome),
    });
    setPlans((prev) => [plan, ...prev]);
    setSelectedPlanId(plan.id);
    setNetIncome("");
  }

  async function addExpense(e) {
    e.preventDefault();
    await api.post("/budget/expenses", {
      budget_plan_id: selectedPlanId,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      spent_on: expenseForm.spent_on,
    });
    setExpenseForm({ ...expenseForm, description: "", amount: "" });
    refreshPlan();
  }

  const spentPct = burndown && burndown.net_income > 0
    ? Math.min((burndown.total_spent / burndown.net_income) * 100, 100)
    : 0;

  return (
    <div className="px-6 py-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-money-900">
        <Wallet size={24} className="text-money-600" /> Monthly Budget & Expense Planner
      </h1>

      <form onSubmit={createPlan} className="mt-4 flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">Net income for this month</label>
          <input
            type="number"
            required
            value={netIncome}
            onChange={(e) => setNetIncome(e.target.value)}
            className="mt-1 w-48 rounded-lg border border-money-200 px-3 py-2 focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100"
            placeholder="e.g. 60000"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="rounded-lg bg-money-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-money-800"
        >
          Start budget
        </motion.button>
      </form>

      {plans.length > 0 && (
        <select
          value={selectedPlanId || ""}
          onChange={(e) => setSelectedPlanId(Number(e.target.value))}
          className="mt-4 rounded-lg border border-money-200 px-3 py-2 text-sm"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.month}
            </option>
          ))}
        </select>
      )}

      {burndown && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Net Income" value={burndown.net_income} prefix="₹" />
            <StatCard label="Spent So Far" value={burndown.total_spent} prefix="₹" tone="gold" />
            <StatCard
              label="Remaining"
              value={burndown.remaining}
              prefix="₹"
              tone={burndown.remaining >= 0 ? "green" : "red"}
            />
            <StatCard label="Fixed Needs" value={burndown.fixed_needs} prefix="₹" tone="green" />
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-slate-600">Burndown</p>
            <div className="h-4 w-full overflow-hidden rounded-full bg-money-50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  spentPct < 80 ? "bg-money-500" : spentPct < 100 ? "bg-gold-400" : "bg-red-500"
                }`}
              />
            </div>
          </div>

          <form onSubmit={addExpense} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              required
              placeholder="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="rounded-lg border border-money-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="rounded-lg border border-money-200 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              step="0.01"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="rounded-lg border border-money-200 px-3 py-2 text-sm"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="rounded-lg bg-money-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-money-800"
            >
              Add expense
            </motion.button>
          </form>

          <div className="mt-4 overflow-hidden rounded-xl border border-money-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-money-50 text-money-700">
                <tr>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-money-50">
                    <td className="px-4 py-2">{e.description}</td>
                    <td className="px-4 py-2 capitalize">{e.category.replace("_", " ")}</td>
                    <td className="px-4 py-2">₹{e.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">{e.spent_on}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No expenses logged this month yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
