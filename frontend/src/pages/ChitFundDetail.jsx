import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Gavel,
  Phone,
  PiggyBank,
  Plus,
  Trash2,
  Trophy,
  Undo2,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-300/30 focus:border-gold-400/60 focus:outline-none focus:ring-1 focus:ring-gold-400/30";
const submitClass =
  "rounded-lg bg-gradient-to-r from-gold-400 to-gold-300 px-4 py-2 text-sm font-semibold text-money-950 shadow-lg transition-colors hover:brightness-110";

function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const emptyMember = { name: "", mobile_number: "", participates_in_auction: true };

export default function ChitFundDetail() {
  const { id } = useParams();
  const [chit, setChit] = useState(null);
  const [members, setMembers] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [newMember, setNewMember] = useState(emptyMember);
  const [auctionForm, setAuctionForm] = useState({
    winner_member_id: "",
    auction_date: new Date().toISOString().slice(0, 10),
    winning_bid_amount: "",
  });
  const [expandedCycle, setExpandedCycle] = useState(null);
  const [formError, setFormError] = useState(null);

  function refresh() {
    api.get(`/chit-funds/${id}`).then(setChit);
    api.get(`/chit-funds/${id}/members`).then(setMembers);
    api.get(`/chit-funds/${id}/cycles`).then(setCycles);
  }

  useEffect(refresh, [id]);

  const memberById = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [members]);

  async function addMember(e) {
    e.preventDefault();
    setFormError(null);
    try {
      const member = await api.post(`/chit-funds/${id}/members`, newMember);
      setMembers((prev) => [...prev, member]);
      setNewMember(emptyMember);
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function removeMember(memberId) {
    await api.del(`/chit-funds/members/${memberId}`);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function recordAuction(e) {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post(`/chit-funds/${id}/cycles`, {
        winner_member_id: parseInt(auctionForm.winner_member_id, 10),
        auction_date: auctionForm.auction_date,
        winning_bid_amount: parseFloat(auctionForm.winning_bid_amount),
      });
      setAuctionForm({
        winner_member_id: "",
        auction_date: new Date().toISOString().slice(0, 10),
        winning_bid_amount: "",
      });
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function undoLastCycle(cycleId) {
    setFormError(null);
    try {
      await api.del(`/chit-funds/cycles/${cycleId}`);
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function toggleCyclePayment(payment) {
    await api.put(`/chit-funds/cycles/payments/${payment.id}`, { is_paid: !payment.is_paid });
    setCycles((prev) =>
      prev.map((c) =>
        c.id === payment.cycle_id
          ? {
              ...c,
              payments: c.payments.map((p) =>
                p.id === payment.id ? { ...p, is_paid: !p.is_paid } : p
              ),
            }
          : c
      )
    );
  }

  if (!chit) {
    return <div className="px-6 py-8 text-emerald-300/50">Loading…</div>;
  }

  const won = members.filter((m) => m.has_won).sort((a, b) => (a.won_month ?? 0) - (b.won_month ?? 0));
  const pending = members.filter((m) => !m.has_won);
  const permanentPayers = members.filter((m) => !m.participates_in_auction);
  const eligibleBidders = pending.filter((m) => m.participates_in_auction);
  const remainingAuctions = Math.max(eligibleBidders.length, 0);
  const estimatedCompletion = addMonths(
    chit.started_on,
    (chit.auction_frequency_months || 1) * chit.total_members
  );
  const latestCycleId = cycles.length ? cycles[cycles.length - 1].id : null;

  const bidPreview = parseFloat(auctionForm.winning_bid_amount);
  const selectedWinnerId = parseInt(auctionForm.winner_member_id, 10);
  const dividendRecipients = members.filter(
    (m) => m.participates_in_auction && !m.has_won && m.id !== selectedWinnerId
  );
  const fullPayers = members.filter((m) => !dividendRecipients.includes(m));
  const canPreview = !Number.isNaN(bidPreview) && dividendRecipients.length > 0;
  const discountPreview = canPreview ? chit.total_chit_value - bidPreview : 0;
  // Reference only — the whole discount becomes the dividend pool, nothing is deducted.
  const commissionPreview = canPreview ? discountPreview * (chit.commission_percent / 100) : 0;
  const dividendPerMemberPreview = canPreview ? discountPreview / dividendRecipients.length : 0;
  const theyPayPreview = chit.monthly_installment - dividendPerMemberPreview;
  const totalCollectedPreview = canPreview
    ? fullPayers.length * chit.monthly_installment + dividendRecipients.length * theyPayPreview
    : 0;

  return (
    <div className="px-6 py-8">
      <Link
        to="/loans?tab=chit"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-100"
      >
        <ArrowLeft size={15} /> Back to Loan & Debt Panel
      </Link>

      <h1 className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
        <PiggyBank size={24} className="text-gold-300" /> {chit.chit_name}
      </h1>
      <p className="mt-1 text-sm text-emerald-200/70">
        Owner: {chit.foreman_name || "—"} &middot; Auction every {chit.auction_frequency_months || 1}{" "}
        month(s) &middot; Started {chit.started_on || "—"} &middot; Est. completion{" "}
        {estimatedCompletion || "—"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Members" value={chit.total_members} icon={Users} />
        <StatCard label="Completed Auctions" value={won.length} icon={CheckCircle2} tone="green" />
        <StatCard label="Remaining Auctions" value={remainingAuctions} icon={Clock} tone="gold" />
        <StatCard label="Installment" value={chit.monthly_installment} prefix="₹" icon={CalendarCheck} />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
          <PiggyBank size={16} className="text-emerald-300" /> Overview
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Owner / Foreman</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{chit.foreman_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Total Chit Value</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              ₹{chit.total_chit_value.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Commission Rate (reference only)</dt>
            <dd className="mt-0.5 text-sm font-medium text-gold-300">
              {chit.commission_percent}% of discount — not deducted
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Auction Frequency</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">
              Every {chit.auction_frequency_months || 1} month(s)
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Started On</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{chit.started_on || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-300/50">Est. Completion</dt>
            <dd className="mt-0.5 text-sm font-medium text-emerald-50">{estimatedCompletion || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-money-950 p-5 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
            <UserPlus size={16} className="text-emerald-300" /> Add Member
          </h2>
          <form onSubmit={addMember} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              required
              placeholder="Member name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className={`${inputClass} mt-0 sm:col-span-1`}
            />
            <input
              placeholder="Mobile number"
              value={newMember.mobile_number}
              onChange={(e) => setNewMember({ ...newMember, mobile_number: e.target.value })}
              className={`${inputClass} mt-0 sm:col-span-1`}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className={`${submitClass} flex items-center justify-center gap-1.5`}
            >
              <Plus size={15} /> Add
            </motion.button>
            <label className="col-span-full flex items-center gap-2 text-xs text-emerald-200/70">
              <input
                type="checkbox"
                checked={!newMember.participates_in_auction}
                onChange={(e) =>
                  setNewMember({ ...newMember, participates_in_auction: !e.target.checked })
                }
              />
              Permanent payer slot (e.g. the owner&apos;s own share) — always pays full, never bids,
              never shares in the dividend
            </label>
          </form>
          {pending.length > 0 && (
            <p className="mt-3 text-xs text-emerald-300/50">
              Not yet taken the chit: {pending.map((m) => m.name).join(", ")}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gold-400/30 bg-gold-500/10 p-5 shadow-lg">
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-gold-200">
            <Trophy size={16} /> Members who won the chit ({won.length})
          </h2>
          <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {won.length === 0 && <p className="text-emerald-300/50">No one has taken the chit yet.</p>}
            {won.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1">
                <span className="font-medium text-emerald-100">
                  {m.won_month ? `Cycle ${m.won_month}: ` : ""}
                  {m.name}
                </span>
                <span className="text-gold-300">
                  {m.bid_amount ? `₹${m.bid_amount.toLocaleString()}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
          <Gavel size={16} className="text-emerald-300" /> Record Auction (Yelam)
        </h2>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        )}
        {members.length < 2 ? (
          <p className="text-sm text-emerald-200/70">
            Add at least 2 members before recording an auction — right now there
            {members.length === 1 ? " is only 1 member" : " are no members"} in this chit.
          </p>
        ) : eligibleBidders.length === 0 ? (
          <p className="text-sm text-emerald-200/70">
            Every auction-eligible member has already won — no more auctions to record.
          </p>
        ) : (
          <form onSubmit={recordAuction} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="block text-sm font-medium text-emerald-200/70">Winner</span>
              <select
                required
                className={inputClass}
                value={auctionForm.winner_member_id}
                onChange={(e) => setAuctionForm({ ...auctionForm, winner_member_id: e.target.value })}
              >
                <option value="">Select member</option>
                {eligibleBidders.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-emerald-200/70">Auction date</span>
              <input
                type="date"
                required
                className={inputClass}
                value={auctionForm.auction_date}
                onChange={(e) => setAuctionForm({ ...auctionForm, auction_date: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-emerald-200/70">Winning bid (₹ payout)</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder={`e.g. ${chit.total_chit_value - 25000}`}
                className={inputClass}
                value={auctionForm.winning_bid_amount}
                onChange={(e) => setAuctionForm({ ...auctionForm, winning_bid_amount: e.target.value })}
              />
            </label>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className={`${submitClass} w-full`}
              >
                Record Auction
              </motion.button>
            </div>

            {canPreview && (
              <div className="col-span-full grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-emerald-300/50">Discount (full value − bid)</p>
                  <p className="font-display text-lg font-bold text-emerald-50">
                    ₹{discountPreview.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-300/50">
                    Commission ({chit.commission_percent}%, reference only)
                  </p>
                  <p className="font-display text-lg font-bold text-gold-300">
                    ₹{commissionPreview.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-300/50">
                    Dividend / not-yet-won member ({dividendRecipients.length})
                  </p>
                  <p className="font-display text-lg font-bold text-emerald-300">
                    ₹{dividendPerMemberPreview.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-300/50">They pay this cycle</p>
                  <p className="font-display text-lg font-bold text-emerald-50">
                    ₹
                    {theyPayPreview.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="col-span-full rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-emerald-200/70">
                  <p className="font-mono">
                    ₹{Math.round(theyPayPreview).toLocaleString()} × {dividendRecipients.length}{" "}
                    {dividendRecipients.length === 1 ? "member" : "members"}
                    {fullPayers.length > 0 && (
                      <>
                        {" "}
                        + ₹{chit.monthly_installment.toLocaleString()} × {fullPayers.length} full-pay
                        {fullPayers.length === 1 ? "er" : "ers"} ({fullPayers.map((m) => m.name).join(", ")})
                      </>
                    )}{" "}
                    = ₹{Math.round(totalCollectedPreview).toLocaleString()}
                  </p>
                  <p className="mt-1">
                    That should match the winning bid (₹{Number(bidPreview).toLocaleString()}) — it's
                    what funds the payout.{" "}
                    {Math.abs(totalCollectedPreview - bidPreview) < 1 ? (
                      <span className="font-semibold text-emerald-300">✓ Matches exactly.</span>
                    ) : (
                      <span className="font-semibold text-gold-300">
                        Off by ₹
                        {Math.abs(Math.round(totalCollectedPreview - bidPreview)).toLocaleString()} —
                        rounding only, or check your figures.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-emerald-50">
          <Gavel size={16} className="text-emerald-300" /> Auction History
        </h2>
        {cycles.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-money-950 p-5 text-sm text-emerald-300/50">
            No auctions recorded yet.
          </p>
        )}
        <div className="space-y-3">
          <AnimatePresence>
            {[...cycles].reverse().map((c) => {
              const winner = memberById[c.winner_member_id];
              const isExpanded = expandedCycle === c.id;
              const paidCount = c.payments.filter((p) => p.is_paid).length;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden rounded-xl border border-white/10 bg-money-950 shadow-lg"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedCycle(isExpanded ? null : c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setExpandedCycle(isExpanded ? null : c.id);
                    }}
                    className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-gold-400 to-gold-300 text-sm font-bold text-money-950">
                        {c.cycle_number}
                      </span>
                      <div>
                        <p className="font-medium text-emerald-50">
                          {winner?.name ?? `Member #${c.winner_member_id}`} won &middot; {c.auction_date}
                        </p>
                        <p className="text-xs text-emerald-200/70">
                          Bid ₹{c.winning_bid_amount.toLocaleString()} &middot; Discount ₹
                          {c.discount_amount.toLocaleString()} &middot; Commission ₹
                          {c.commission_amount.toLocaleString()} &middot; Dividend ₹
                          {c.dividend_per_member.toLocaleString()}/member
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-emerald-200">
                        {paidCount}/{c.payments.length} collected
                      </span>
                      {c.id === latestCycleId && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            undoLastCycle(c.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10"
                          title="Undo this auction"
                        >
                          <Undo2 size={13} /> Undo
                        </motion.button>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-emerald-300/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/10 px-5 py-4">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-emerald-300/60">
                          <tr>
                            <th className="py-1 pr-4">Member</th>
                            <th className="py-1 pr-4">Amount Due</th>
                            <th className="py-1 pr-4">Status</th>
                            <th className="py-1" />
                          </tr>
                        </thead>
                        <tbody>
                          {c.payments.map((p) => {
                            const m = memberById[p.member_id];
                            const isWinner = p.member_id === c.winner_member_id;
                            return (
                              <tr key={p.id} className="border-t border-white/10">
                                <td className="py-1.5 pr-4 font-medium text-emerald-100">
                                  {m?.name ?? `#${p.member_id}`}
                                  {isWinner && (
                                    <span className="ml-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-300 px-1.5 py-0.5 text-[10px] font-semibold text-money-950">
                                      Winner
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 pr-4 text-emerald-100">₹{p.amount_due.toLocaleString()}</td>
                                <td className="py-1.5 pr-4">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      p.is_paid
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "bg-white/10 text-emerald-300/50"
                                    }`}
                                  >
                                    {p.is_paid ? "Paid" : "Pending"}
                                  </span>
                                </td>
                                <td className="py-1.5 text-right">
                                  <button
                                    onClick={() => toggleCyclePayment(p)}
                                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                      p.is_paid
                                        ? "bg-white/10 text-emerald-200 hover:bg-white/15"
                                        : "bg-emerald-500 text-money-950 font-semibold hover:bg-emerald-400"
                                    }`}
                                  >
                                    {p.is_paid ? "Mark unpaid" : "Mark paid"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-money-950 shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-emerald-300/70">
            <tr>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Mobile</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {members.map((m) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="border-t border-white/10"
                >
                  <td className="px-4 py-2 font-medium text-emerald-100">
                    {m.name}
                    {!m.participates_in_auction && (
                      <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                        Permanent payer
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {m.mobile_number ? (
                      <span className="inline-flex items-center gap-1 text-emerald-200/70">
                        <Phone size={12} /> {m.mobile_number}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {m.participates_in_auction ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.has_won
                            ? "bg-gold-500/10 text-gold-200 border border-gold-400/30"
                            : "bg-white/10 text-emerald-300/50"
                        }`}
                      >
                        {m.has_won ? "Won" : "Pending"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-emerald-300/50">
                        Always pays full
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => removeMember(m.id)}
                      className="rounded-md p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-emerald-300/50">
                  No members added yet. Add the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
