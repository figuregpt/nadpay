import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Monad Typography Scale
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }], // 72px
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }], // 60px
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }], // 48px
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }], // 36px
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }], // 30px
        'heading-xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }], // 24px
        'heading-lg': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }], // 20px
        'heading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }], // 18px
        'heading-sm': ['1rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '600' }], // 16px
        'body-xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }], // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }], // 18px
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }], // 14px
        'body-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }], // 12px
      },
      colors: {
        primary: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#9f75ff',
          500: '#836EF9', // Ana mor renk
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#200052', // Dark mode ana renk
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config; 