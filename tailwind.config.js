/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
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
