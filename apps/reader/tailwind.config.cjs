/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@wordvrs/theme/tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  plugins: [],
};
