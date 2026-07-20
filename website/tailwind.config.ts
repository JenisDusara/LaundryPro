import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — flip with the theme via CSS variables.
        bg: "var(--bg)",
        card: "var(--card)",
        text: "var(--text)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
        // Brand — skill "SaaS (General)" palette, constant across themes.
        // NOTE: token names kept as navy/amber to avoid churn, but values are
        // the skill's trust-blue primary + orange CTA accent.
        navy: {
          DEFAULT: "#2563EB", // trust blue (primary)
          deep: "#1D4ED8", // hover / pressed
          ink: "#1E293B",
        },
        amber: {
          DEFAULT: "#EA580C", // orange CTA (accent)
          deep: "#C2410C",
          soft: "#FFEDD5",
        },
        // Dark surface for the product mockup + CTA panel.
        ink: {
          DEFAULT: "#0F172A",
          soft: "#1E293B",
        },
        wa: {
          DEFAULT: "#25D366",
          deep: "#1EA75B",
          soft: "#E9F7EF",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(37, 99, 235, 0.10)",
        "card-hover": "0 18px 44px -12px rgba(37, 99, 235, 0.20)",
        navy: "0 12px 30px -8px rgba(37, 99, 235, 0.40)",
        "navy-lg": "0 20px 45px -10px rgba(37, 99, 235, 0.50)",
        amber: "0 12px 30px -8px rgba(234, 88, 12, 0.35)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
