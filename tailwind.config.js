/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,tsx,css}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      background: 'rgb(var(--background) / <alpha-value>)',
      border: 'rgb(var(--border) / <alpha-value>)',
      tone: {
        1: 'rgb(var(--tone-1) / <alpha-value>)',
        2: 'rgb(var(--tone-2) / <alpha-value>)',
        3: 'rgb(var(--tone-3) / <alpha-value>)',
        4: 'rgb(var(--tone-4) / <alpha-value>)',
        5: 'rgb(var(--tone-5) / <alpha-value>)',
      },
      brace: 'rgb(var(--brace) / <alpha-value>)',
      pinyin: 'rgb(var(--pinyin) / <alpha-value>)',
    },
    extend: {},
  },
  plugins: [],
}
