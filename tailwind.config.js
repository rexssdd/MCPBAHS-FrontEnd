/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        green: {
          primary:   "#1a5c1a",
          dark:      "#0f3d0f",
          darker:    "#081f08",
          light:     "#f0f7f0",
          lighter:   "#e6f4ea",
          border:    "#e8ede8",
          muted:     "#4a5e4a",
          subtle:    "#7a917a",
          faint:     "#a0b0a0",
        },
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatA: {
          "0%, 100%": { transform: "translateY(0) rotate(-0.5deg)" },
          "50%":      { transform: "translateY(-11px) rotate(0.5deg)" },
        },
        floatB: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-14px)" },
        },
        floatC: {
          "0%, 100%": { transform: "translateY(0) rotate(0.5deg)" },
          "50%":      { transform: "translateY(-9px) rotate(-0.5deg)" },
        },
        floatD: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease forwards",
        floatA:   "floatA 5s ease-in-out infinite",
        floatB:   "floatB 6.5s ease-in-out infinite",
        floatC:   "floatC 7s ease-in-out infinite",
        floatD:   "floatD 5.5s ease-in-out infinite",
        spin:     "spin 0.7s linear infinite",
      },
    },
  },
  plugins: [],
};