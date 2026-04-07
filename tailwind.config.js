/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand : {
          primary: '#0C4C8A',
          secondary: '#059669',
          tertiary: '#34d399',
        },
        'button-primary': '#0C4C8A',
        'button-primary-dark': '#059669',
        'button-primary-light': '#34d399',
        'primary': '#0C4C8A',
        'danger': '#c93030',

      },
      space: {
        "4xl": "40px",
      },
      spacing: {
        "4xl": "40px",
      },
    },
  },
  plugins: [],
}
