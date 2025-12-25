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
        sans: ['Korkai', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand': {
          50: '#f0f4fa',
          100: '#dde6f3',
          200: '#c2d2ea',
          300: '#99b5dc',
          400: '#6a91cb',
          500: '#486fba',
          600: '#3858a7',
          700: '#2f4789',
          800: '#2a3d70',
          900: '#26355e',
          950: '#19213c',
        },
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
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
