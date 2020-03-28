module.exports = {
  extends: ['4catalyzer', 'prettier'],
  plugins: ['prettier'],
  env: {
    browser: true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
};
