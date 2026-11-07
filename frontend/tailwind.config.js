/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#080C14',
          card: '#0F172A',
          cardLighter: '#131D33',
          border: '#1E293B',
          muted: '#64748B',
        },
        brand: {
          primary: '#38BDF8',   // Soft sky blue
          secondary: '#34D399', // Mint emerald
          accent: '#818CF8',    // Indigo
          glow: 'rgba(56, 189, 248, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow-blue': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'glow-mint': '0 0 25px -5px rgba(52, 211, 153, 0.25)',
      }
    },
  },
  plugins: [],
}
