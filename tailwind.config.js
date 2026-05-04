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
          tertiary: '#F59E0B',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          error: '#DC2626',
        },
        'button-primary': '#0C4C8A',
        'button-primary-dark': '#093a6a',
        'button-primary-light': '#D1E4FF',
        'primary': '#0C4C8A',
        'danger': '#DC2626',
        'surface': '#FFFFFF',
        'background': '#F8FAFC',
        'text': '#0F172A',
        'text-muted': '#475569'
      },
      space: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "48px",
        "4xl": "64px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "48px",
        "4xl": "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
