/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#0F6E56',
        'accent-light': '#E1F5EE',
        'accent-dark': '#085041',
        diabetic: { light: '#EEEDFE', DEFAULT: '#534AB7', dark: '#3C3489', text: '#3C3489' },
        general: { light: '#E1F5EE', DEFAULT: '#0F6E56', dark: '#085041', text: '#085041' },
        teen: { light: '#FAEEDA', DEFAULT: '#BA7517', dark: '#633806', text: '#633806' },
        kid: { light: '#FAECE7', DEFAULT: '#D85A30', dark: '#712B13', text: '#712B13' },
        picky: { light: '#FBEAF0', DEFAULT: '#D4537E', dark: '#72243E', text: '#72243E' },
        daily: { light: '#E6F1FB', DEFAULT: '#378ADD', dark: '#0C447C', text: '#0C447C' },
        weekly: { light: '#FAEEDA', DEFAULT: '#BA7517', dark: '#633806', text: '#633806' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
