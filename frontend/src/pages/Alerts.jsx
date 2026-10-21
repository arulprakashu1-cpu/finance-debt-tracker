import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BellRing, Mail, MessageCircle, Send, Smartphone } from "lucide-react";
import { api } from "../api/client";

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "sms", label: "SMS", icon: Smartphone },
  { value: "email", label: "Email", icon: Mail },
];

const ENTITY_TYPES = ["gold_loan", "chit_fund", "traditional_loan"];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [form, setForm] = useState({
    related_entity_type: ENTITY_TYPES[0],
    related_entity_id: "",
    due_date: new Date().toISOString().slice(0, 10),
    channel: "whatsapp",
    message: "",
  });

  function refresh() {
    api.get("/alerts").then(setAlerts);
    api.get("/alerts/escalations").then(setEscalations);
  }

  useEffect(refresh, []);

  async function send(id) {
    await api.post(`/alerts/${id}/send`);
    refresh();
  }

  async function createAlert(e) {
    e.preventDefault();
    await api.post("/alerts", {
      ...form,
      related_entity_id: parseInt(form.related_entity_id, 10),
    });
    setForm({ ...form, related_entity_id: "", message: "" });
    refresh();
  }

  const statusTone = {
    pending: "bg-white/10 text-emerald-200/70",
    sent: "bg-emerald-500/15 text-emerald-300",
    failed: "bg-red-500/15 text-red-300",
  };

  const inputClass =
    "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-300/30 focus:border-gold-400/60 focus:outline-none focus:ring-1 focus:ring-gold-400/30";

  return (
    <div className="px-6 py-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-50">
        <BellRing size={24} className="text-gold-400" /> Due Date Alert & Notification Engine
      </h1>
      <p className="mt-1 text-sm text-emerald-300/60">
        Default recipient: arulprakashu@gmail.com (email) / +91 95974 70788 (WhatsApp/SMS).
      </p>

      <AnimatePresence>
        {escalations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-300"
          >
            <AlertTriangle size={20} />
            <p className="font-semibold">
              {escalations.length} escalation(s): due date already passed and nothing was sent.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={createAlert}
        className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-money-950 p-4 shadow-lg sm:grid-cols-6"
      >
        <select
          value={form.related_entity_type}
          onChange={(e) => setForm({ ...form, related_entity_type: e.target.value })}
          className={inputClass}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t} className="bg-money-950">
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          placeholder="Entity ID"
          value={form.related_entity_id}
          onChange={(e) => setForm({ ...form, related_entity_id: e.target.value })}
          className={inputClass}
        />
        <input
          required
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          className={inputClass}
        />
        <select
          value={form.channel}
          onChange={(e) => setForm({ ...form, channel: e.target.value })}
          className={inputClass}
        >
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value} className="bg-money-950">
              {c.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${inputClass} sm:col-span-1`}
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="rounded-lg bg-gradient-to-r from-gold-400 to-gold-300 px-4 py-2 text-sm font-semibold text-money-950 shadow-lg hover:brightness-110"
        >
          Schedule alert
        </motion.button>
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-money-950 shadow-lg">
        <table className="w-full text-left text-sm text-emerald-100">
          <thead className="bg-white/5 text-emerald-300/70">
            <tr>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Channel</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {alerts.map((a) => {
                const ChannelIcon = CHANNELS.find((c) => c.value === a.channel)?.icon || Mail;
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-2">
                      {a.related_entity_type} #{a.related_entity_id}
                    </td>
                    <td className="px-4 py-2">{a.due_date}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <ChannelIcon size={14} className="text-emerald-300" /> {a.channel}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{a.message}</td>
                    <td className="px-4 py-2">
                      {a.status !== "sent" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => send(a.id)}
                          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-gold-400 to-gold-300 px-3 py-1 text-xs font-semibold text-money-950 hover:brightness-110"
                        >
                          <Send size={12} /> Send now
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {alerts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-emerald-300/40">
                  No alerts scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
