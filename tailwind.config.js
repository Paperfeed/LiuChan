/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,tsx,css}'],
  theme: {
    colors: {
      blue: {
        50: '#f1f7fe',
        100: '#e2effc',
        200: '#bfddf8',
        300: '#87c1f2',
        400: '#53a8ea',
        500: '#2086d7',
        600: '#126ab7',
        700: '#105494',
        800: '#11487b',
        900: '#143d66',
        950: '#0d2744',
      },
      white: '#fff',
      black: '#101010',
      transparent: 'transparent',
      current: 'currentColor',
      background: 'rgb(var(--background) / <alpha-value>)',
      border: 'rgb(var(--border) / <alpha-value>)',
      tone: {
        1: 'rgb(var(--tone1) / <alpha-value>)',
        2: 'rgb(var(--tone2) / <alpha-value>)',
        3: 'rgb(var(--tone3) / <alpha-value>)',
        4: 'rgb(var(--tone4) / <alpha-value>)',
        5: 'rgb(var(--tone5) / <alpha-value>)',
      },
      brace: 'rgb(var(--brace) / <alpha-value>)',
      pinyin: 'rgb(var(--pinyin) / <alpha-value>)',
    },
    boxShadow: {
      popup: 'var(--box-popup)',
    },
  },
  plugins: [],
}
