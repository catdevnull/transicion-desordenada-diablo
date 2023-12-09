/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.svelte"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0px 35px rgb(0 0 0 / .2)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
