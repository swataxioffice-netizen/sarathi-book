const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(1.75rem, 6vw, 3rem)', { lineHeight: '1.2' }], // Reduced from 2rem min
        'hero': ['clamp(1.25rem, 4vw, 2rem)', { lineHeight: '1.3' }], // Reduced from 1.5rem min
        'body-fluid': ['clamp(0.875rem, 2vw, 1rem)', { lineHeight: '1.5' }], // Reduced from 1rem min (14px base)
        'caption': ['0.75rem', { lineHeight: '1.4' }], // 12px
        'tiny': ['0.625rem', { lineHeight: '1.2' }], // 10px
      },
      colors: {
        'primary': 'var(--primary)',
        'brand': colors.blue, // Alias brand to standard blue to match 500 scale request
        'heritage-brand': '#0747A6',
        'heritage-accent': '#FFC107',
        'heritage-bg': '#F8F9FA',
        'heritage-text': '#1A1A1A',
        'heritage-secondary': '#6B7280',
        'heritage-border': '#E5E7EB',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'premium-gradient': 'linear-gradient(135deg, #0747A6 0%, #002D72 100%)',
        'accent-gradient': 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'premium': '0 10px 25px -5px rgba(7, 71, 166, 0.2), 0 8px 10px -6px rgba(7, 71, 166, 0.1)',
      },
      borderRadius: {
        'tn-small': '8px',
        'tn-medium': '16px',
        'tn-large': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // New: Pop-in effect
        'pulse-subtle': 'pulseSubtle 2s infinite',
        'progress-indefinite': 'progressIndefinite 1.5s infinite linear', // New: For sleek loaders
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' }, // Increased slide distance slightly
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        progressIndefinite: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
    },
  },
  plugins: [],
}
