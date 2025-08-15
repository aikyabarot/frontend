/* CRACO config to enable Tailwind with CRA (react-scripts) */
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  style: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  }
};