import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LoanDebtPanel from "./pages/LoanDebtPanel";
import BudgetPlanner from "./pages/BudgetPlanner";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import DataEntry from "./pages/DataEntry";
import GoldLoanReport from "./pages/GoldLoanReport";
import ChitFundDetail from "./pages/ChitFundDetail";
import TraditionalLoanDetail from "./pages/TraditionalLoanDetail";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[#07110d]">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/loans" element={<AnimatedPage><LoanDebtPanel /></AnimatedPage>} />
            <Route path="/budget" element={<AnimatedPage><BudgetPlanner /></AnimatedPage>} />
            <Route path="/alerts" element={<AnimatedPage><Alerts /></AnimatedPage>} />
            <Route path="/analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
            <Route path="/data-entry" element={<AnimatedPage><DataEntry /></AnimatedPage>} />
            <Route path="/gold-report" element={<AnimatedPage><GoldLoanReport /></AnimatedPage>} />
            <Route path="/chit-report/:id" element={<AnimatedPage><ChitFundDetail /></AnimatedPage>} />
            <Route path="/loan-report/:id" element={<AnimatedPage><TraditionalLoanDetail /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
