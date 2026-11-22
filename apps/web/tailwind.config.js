/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F4F4",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#612D53",
          hover: "#4D2342",
        },
        secondary: {
          DEFAULT: "#853953",
          hover: "#702F45",
        },
        charcoal: {
          DEFAULT: "#2C2C2C",
          muted: "#5A5A5A",
          light: "#8E8E8E",
        },
        status: {
          alert: "#D93848",
          safe: "#16A34A",
          warning: "#F59E0B",
        },
        border: "#E0E2E2",
      },
    },
  },
  plugins: [],
};

