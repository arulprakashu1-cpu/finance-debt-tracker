/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        money: {
          950: "#032b1e",
          900: "#04392a",
          800: "#065f46",
          700: "#047857",
          600: "#059669",
          500: "#10b981",
          400: "#34d399",
          100: "#d1fae5",
          50: "#ecfdf5",
        },
        gold: {
          900: "#78350f",
          800: "#92400e",
          700: "#a16207",
          600: "#ca8a04",
          500: "#d4af37",
          400: "#eab308",
          300: "#facc15",
          200: "#fde68a",
        },
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-16px) rotate(8deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
        "count-pop": {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "count-pop": "count-pop 0.4s ease-out",
      },
      backgroundImage: {
        "money-gradient": "linear-gradient(135deg, #032b1e 0%, #065f46 45%, #04392a 100%)",
        "gold-gradient": "linear-gradient(90deg, #ca8a04, #facc15, #ca8a04)",
      },
    },
  },
  plugins: [],
};
