import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9B7EDE',
        accent: '#B794F6',
        secondary: '#C4B5FD',
        'age-0-3': '#9B7EDE',
        'age-3-6': '#B794F6',
        'age-6-12': '#C4B5FD',
        'age-12-24': '#A98AEA',
        'age-24-36': '#B794F6',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
