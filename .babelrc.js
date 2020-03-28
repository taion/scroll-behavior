module.exports = (api) => ({
  presets: [
    [
      '@4c',
      {
        targets: {},
        modules: api.env() === 'esm' ? false : 'commonjs',
      },
    ],
  ],
  plugins: [api.env() !== 'esm' && 'add-module-exports'].filter(Boolean),

  env: {
    test: {
      plugins: ['istanbul'],
    },
  },
});
