module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('@csstools/postcss-color-mix-function'),
    // Strip @supports — they use var() references that react-native-css
    // can't resolve at compile time, producing invalid colors like #NaNNaNNaN80
    function stripSupports(root) {
      root.walkAtRules('supports', (rule) => rule.remove());
    },
  ],
};
