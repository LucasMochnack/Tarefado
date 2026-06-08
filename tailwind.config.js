/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — emerald (Midnight Emerald direction). Repurposes `indigo` app-wide.
        indigo: {
          50:  '#e9faf4',
          100: '#c8f3e2',
          200: '#93e7c9',
          300: '#56d6ad',
          400: '#34d399',
          500: '#10b981',
          600: '#0d9f6e',
          700: '#0b8a60',
          800: '#096f4e',
          900: '#064e3b',
          950: '#04140d',
        },
        // Deep slate ramp serving both Midnight (dark) and Daylight (light) directions
        slate: {
          50:  '#eef1f5',
          100: '#e8eef5',
          200: '#d4dbe5',
          300: '#b3c0cf',
          400: '#94a2b4',
          500: '#5d6b7d',
          600: '#3a4654',
          700: '#1a2331',
          800: '#141b26',
          900: '#0f141d',
          950: '#080b11',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(0,0,0,0.45)',
        card: '0 10px 30px -16px rgba(8,11,17,0.55)',
        glow: '0 4px 14px -6px var(--tw-shadow-color)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
