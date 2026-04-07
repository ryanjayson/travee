/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
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
