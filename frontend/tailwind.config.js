/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: "#090d16",
          900: "#0f1626",
          800: "#1e293b",
          700: "#334155",
        },
        healthy: "#10b981",    // emerald-500
        warning: "#eab308",    // amber-500
        critical: "#f97316",   // orange-500
        dangerous: "#ef4444",  // red-500
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-green": "glowGreen 2s ease-in-out infinite alternate",
        "glow-yellow": "glowYellow 2s ease-in-out infinite alternate",
        "glow-orange": "glowOrange 2s ease-in-out infinite alternate",
        "glow-red": "glowRed 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glowGreen: {
          "0%": { boxShadow: "0 0 5px rgba(16, 185, 129, 0.2), 0 0 10px rgba(16, 185, 129, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.6), 0 0 25px rgba(16, 185, 129, 0.3)" },
        },
        glowYellow: {
          "0%": { boxShadow: "0 0 5px rgba(234, 179, 8, 0.2), 0 0 10px rgba(234, 179, 8, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(234, 179, 8, 0.6), 0 0 25px rgba(234, 179, 8, 0.3)" },
        },
        glowOrange: {
          "0%": { boxShadow: "0 0 5px rgba(249, 115, 22, 0.2), 0 0 10px rgba(249, 115, 22, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(249, 115, 22, 0.6), 0 0 25px rgba(249, 115, 22, 0.3)" },
        },
        glowRed: {
          "0%": { boxShadow: "0 0 5px rgba(239, 68, 68, 0.2), 0 0 10px rgba(239, 68, 68, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(239, 68, 68, 0.6), 0 0 25px rgba(239, 68, 68, 0.3)" },
        },
      },
    },
  },
  plugins: [],
}
