import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: "#F8F5EE",
          surface: "#FFFDF8",
          soft: "#F1EADF",
          line: "#E6DDCD"
        },
        ink: {
          main: "#1F1F1F",
          secondary: "#5F6368",
          muted: "#8B867D"
        },
        accent: {
          blue: "#4C7DFF",
          green: "#7DAA8B",
          gold: "#C7A76C",
          red: "#D98C82"
        }
      },
      boxShadow: {
        paper: "0 18px 50px rgba(57, 43, 26, 0.08)",
        paperSoft: "0 8px 24px rgba(57, 43, 26, 0.06)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
