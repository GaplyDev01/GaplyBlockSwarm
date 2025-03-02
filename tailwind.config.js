/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './presentation/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sapphire: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#0e1729',
          900: '#070e1a',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#00FF80', // Main brand color
          500: '#00CC66',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        neon: {
          red: '#FF3D5A',
          blue: '#3DFBFF',
          purple: '#B467FF',
          yellow: '#FFD23D',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'pulse-glow': {
          '0%, 100%': { 
            'box-shadow': '0 0 8px 2px rgba(0, 255, 128, 0.3)',
            'border-color': 'rgba(0, 255, 128, 0.5)',
          },
          '50%': { 
            'box-shadow': '0 0 16px 4px rgba(0, 255, 128, 0.5)',
            'border-color': 'rgba(0, 255, 128, 0.8)',
          },
        },
        'text-flicker': {
          '0%, 100%': { 
            opacity: '1',
          },
          '33%': { 
            opacity: '0.9',
          },
          '66%': { 
            opacity: '0.95',
          },
          '77%': { 
            opacity: '0.85',
          },
        },
        'scanner': {
          '0%, 100%': { 
            backgroundPosition: '0% 0%',
          },
          '50%': { 
            backgroundPosition: '100% 100%',
          },
        },
        'glitch': {
          '0%': { 
            transform: 'translate(0)',
          },
          '20%': { 
            transform: 'translate(-2px, 2px)',
          },
          '40%': { 
            transform: 'translate(-2px, -2px)',
          },
          '60%': { 
            transform: 'translate(2px, 2px)',
          },
          '80%': { 
            transform: 'translate(2px, -2px)',
          },
          '100%': { 
            transform: 'translate(0)',
          },
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0)',
          },
          '50%': { 
            transform: 'translateY(-10px)',
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'pulse-glow': 'pulse-glow 2s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'text-flicker': 'text-flicker 2s infinite',
        'scanner': 'scanner 2s linear infinite',
        'glitch': 'glitch 0.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
        cyber: ['var(--font-orbitron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'tech-pattern': "url('/images/tech-pattern.svg')",
        'particles-bg': "url('/images/particles-bg.png')",
        'circuit-pattern': "url('/images/circuit-pattern.svg')",
        'grid-lines': "url('/images/grid-lines.svg')",
      },
      boxShadow: {
        'neon-sm': '0 0 5px rgba(0, 255, 128, 0.5)',
        'neon': '0 0 10px rgba(0, 255, 128, 0.5)',
        'neon-lg': '0 0 20px rgba(0, 255, 128, 0.5)',
        'neon-red': '0 0 10px rgba(255, 61, 90, 0.5)',
        'neon-blue': '0 0 10px rgba(61, 251, 255, 0.5)',
        'neon-purple': '0 0 10px rgba(180, 103, 255, 0.5)',
      },
      textShadow: {
        'neon': '0 0 5px rgba(0, 255, 128, 0.5)',
        'neon-lg': '0 0 10px rgba(0, 255, 128, 0.7)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-neon': {
          textShadow: '0 0 5px rgba(0, 255, 128, 0.5)',
        },
        '.text-shadow-neon-lg': {
          textShadow: '0 0 10px rgba(0, 255, 128, 0.7)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.shadow-neon': {
          boxShadow: '0 0 10px rgba(0, 255, 128, 0.5)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}