import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        muted: "#6b7280",
        line: "#e5e7eb",
        panel: "#f8fafc",
        accent: "#2563eb"
      }
    }
  },
  plugins: []
};

export default config;
