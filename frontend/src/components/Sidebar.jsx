import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Landmark,
  BellRing,
  LineChart,
  FilePlus2,
  Coins,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/loans", label: "Loan & Debt Panel", icon: Landmark },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/data-entry", label: "Data Entry", icon: FilePlus2 },
];

export default function Sidebar() {
  return (
    <aside className="relative z-20 flex h-screen w-16 shrink-0 flex-col items-center border-r border-white/10 bg-money-gradient py-4 text-emerald-50 shadow-xl">
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        title="Finance Tracker"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-gradient bg-[length:200%_auto] text-money-950 animate-shimmer"
      >
        <Coins size={18} />
      </motion.span>

      <nav className="mt-6 flex flex-1 flex-col items-center gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-y-1 left-0 w-1 rounded-r bg-gold-400"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={19} className={isActive ? "text-gold-400" : ""} />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
