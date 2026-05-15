import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        verite: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        accent: {
          cyan: "#06d6a0",
          coral: "#ff6b6b",
          orange: "#ffa62b",
          sky: "#4cc9f0",
          pink: "#f72585",
          lime: "#b5e48c",
        },
        light: {
          50: "#fafbff",
          100: "#f5f6fa",
          200: "#eef0f6",
          300: "#e2e5ee",
        },
        dark: {
          50: "#f9fafb",
          100: "#e5e7eb",
          200: "#d1d5db",
          300: "#9ca3af",
          400: "#6b7280",
          500: "#4b5563",
          600: "#374151",
          700: "#1f2937",
          800: "#111827",
          900: "#030712",
          950: "#030712",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
