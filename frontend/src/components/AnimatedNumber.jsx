import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";

export default function AnimatedNumber({ value, prefix = "", decimals = 0, duration = 0.9 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    startRef.current = null;
    fromRef.current = display;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useAnimationFrame((t) => {
    if (startRef.current === null) startRef.current = t;
    const elapsed = (t - startRef.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = fromRef.current + (value - fromRef.current) * eased;
    setDisplay(next);
  });

  const formatted = Number.isFinite(display)
    ? display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : "0";

  return (
    <motion.span key={value} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
      {prefix}
      {formatted}
    </motion.span>
  );
}
