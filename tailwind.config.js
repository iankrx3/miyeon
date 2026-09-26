/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // MIYEON is a mobile-first product: desktop and tablet render the same 390px-style
    // layout, centered in App.tsx. The default breakpoints are pushed out of reach so the
    // legacy `sm:`/`md:`/`lg:` desktop variants sitting in components never activate.
    screens: {
      sm: '99999px',
      md: '99999px',
      lg: '99999px',
      xl: '99999px',
      '2xl': '99999px',
    },
    extend: {
      fontSize: {
        xs: ['var(--fs-xs)', { lineHeight: '1.4' }],
        sm: ['var(--fs-sm)', { lineHeight: '1.5' }],
        base: ['var(--fs-base)', { lineHeight: '1.5' }],
        lg: ['var(--fs-lg)', { lineHeight: '1.5' }],
        xl: ['var(--fs-xl)', { lineHeight: '1.4' }],
        '2xl': ['var(--fs-2xl)', { lineHeight: '1.3' }],
        '3xl': ['var(--fs-3xl)', { lineHeight: '1.25' }],
        '4xl': ['var(--fs-4xl)', { lineHeight: '1.2' }],
      },
      colors: {
        'miyeon-main': '#5A514D',
        'miyeon-sub1': '#D49A9A',
        'miyeon-sub2': '#F7E6E6',
        'miyeon-neutral': '#F3EDE6',
        'miyeon-base': '#FFFFFF',
        'miyeon-ink': '#2B2523',
        'miyeon-accent': '#E2637F',
        'miyeon-accent-dark': '#CF3F61',
        'miyeon-accent-soft': '#FDF1F4',
        'miyeon-surface': '#FAF8F8',
        'miyeon-line': '#EEEAEA',
      },
      fontFamily: {
        display: ['DM Sans', 'Pretendard', 'sans-serif'],
        sans: ['DM Sans', 'Pretendard', 'sans-serif'],
        wordmark: ['Outfit', 'Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
