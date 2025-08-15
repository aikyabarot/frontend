const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  style: {
    postcss: {
      mode: "extends",
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
};
