/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./index.tsx", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b6cf6",
          600: "#254ceb",
          700: "#1d39d8",
          800: "#1e30af",
          900: "#1e2e8a",
          950: "#171e53",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 12px 32px -8px rgba(16,24,40,.18)",
      },
    },
  },
  plugins: [],
};
