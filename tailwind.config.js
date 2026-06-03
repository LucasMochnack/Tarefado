/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alto Valor brand colors — override indigo throughout the app (refined emerald)
        indigo: {
          50:  '#e9faf4',
          100: '#c6f2e1',
          200: '#92e6c8',
          300: '#54d4ab',
          400: '#1fbb8e',
          500: '#0b9c75',
          600: '#067a5d',
          700: '#0a624c',
          800: '#0b4e3d',
          900: '#0a4034',
          950: '#03241d',
        },
        // Warm "espresso & paper" neutrals — repurpose slate app-wide for an editorial feel
        slate: {
          50:  '#faf8f4',
          100: '#f3efe8',
          200: '#e8e1d5',
          300: '#d6ccbb',
          400: '#ada291',
          500: '#7d7464',
          600: '#5a5343',
          700: '#423c30',
          800: '#2a2419',
          900: '#1a1610',
          950: '#0f0c07',
        },
        // Warm gold/clay — refined secondary accent
        clay: {
          50:  '#fbf3e6',
          100: '#f6e3c4',
          200: '#eecb92',
          300: '#e3ad5c',
          400: '#d4912f',
          500: '#bd7a25',
          600: '#9c611f',
          700: '#7a4c1d',
          800: '#5e3c1c',
          900: '#4a3018',
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
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(40,30,15,0.05), 0 10px 30px -14px rgba(40,30,15,0.18)',
        card: '0 1px 0 rgba(40,30,15,0.03), 0 2px 8px -3px rgba(40,30,15,0.10)',
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
