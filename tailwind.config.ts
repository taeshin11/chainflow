import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cf: {
          primary: "#4F8FBF",
          secondary: "#6CB4A8",
          background: "#F5F7FA",
          surface: "#FFFFFF",
          "text-primary": "#1A2332",
          "text-secondary": "#6B7B8D",
          accent: "#E8A945",
          success: "#5CB88A",
          danger: "#D97171",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(26, 35, 50, 0.04)",
        DEFAULT: "0 1px 3px 0 rgba(26, 35, 50, 0.06), 0 1px 2px -1px rgba(26, 35, 50, 0.06)",
        md: "0 4px 6px -1px rgba(26, 35, 50, 0.06), 0 2px 4px -2px rgba(26, 35, 50, 0.04)",
        lg: "0 10px 15px -3px rgba(26, 35, 50, 0.06), 0 4px 6px -4px rgba(26, 35, 50, 0.04)",
        xl: "0 20px 25px -5px rgba(26, 35, 50, 0.08), 0 8px 10px -6px rgba(26, 35, 50, 0.04)",
        glass: "0 8px 32px 0 rgba(26, 35, 50, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-out",
        "fade-in-up": "fadeInUp 300ms ease-out",
        "slide-in-right": "slideInRight 300ms ease-out",
        "slide-in-left": "slideInLeft 300ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
        "spin-slow": "spin 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
