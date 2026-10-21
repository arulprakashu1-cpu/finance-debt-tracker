import { motion } from "framer-motion";

const SYMBOLS = ["₹", "$", "€", "₹", "¥", "₹"];

export default function CoinBackground({ count = 6 }) {
  const coins = Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: SYMBOLS[i % SYMBOLS.length],
    left: `${(i * 97) % 100}%`,
    delay: (i * 0.7) % 4,
    duration: 5 + ((i * 1.3) % 4),
    size: 22 + ((i * 11) % 20),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {coins.map((c) => (
        <motion.span
          key={c.id}
          className="absolute select-none font-display font-bold text-gold-300/30"
          style={{ left: c.left, top: "-10%", fontSize: c.size }}
          animate={{ y: ["0%", "480%"], rotate: [0, 20, -10, 0], opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: c.duration + 6,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {c.symbol}
        </motion.span>
      ))}
    </div>
  );
}
