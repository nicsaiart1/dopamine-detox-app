/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { 
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          50: 'hsl(var(--accent) / 0.05)',
          100: 'hsl(var(--accent) / 0.1)',
          200: 'hsl(var(--accent) / 0.2)',
          300: 'hsl(var(--accent) / 0.3)',
          400: 'hsl(var(--accent) / 0.4)',
          500: 'hsl(var(--accent) / 0.5)',
          600: 'hsl(var(--accent) / 0.6)',
          700: 'hsl(var(--accent) / 0.7)',
          800: 'hsl(var(--accent) / 0.8)',
          900: 'hsl(var(--accent) / 0.9)',
        }
      },
      keyframes: { 
        glow: { 
          '0%, 100%': { filter: 'drop-shadow(0 0 0 var(--g))' }, 
          '50%': { filter: 'drop-shadow(0 0 8px var(--g))' } 
        },
        slideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-4px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        }
      },
      animation: { 
        glow: 'glow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
}