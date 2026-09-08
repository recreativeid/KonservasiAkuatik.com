module.exports = {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e62fe', // premium vibrant blue matching forecast post mockups
          hover: '#1a55dd',
          glow: 'rgba(30, 98, 254, 0.15)',
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f3f4f6',
          container: '#f9fafb',
        }
      }
    },
  },
  plugins: [],
}
