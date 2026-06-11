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
        petrol: {
          50:  '#f0f9f9',
          100: '#d0eeee',
          500: '#2a7f7f',
          600: '#1f6b6b',
          700: '#175757',
          800: '#104545',
          900: '#0a3333',
        },
        brand: {
          orange: '#e85d04',
          teal:   '#1f6b6b',
        },
      },
    },
  },
  plugins: [],
}
export default config
