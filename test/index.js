import 'babel-polyfill';

// Ensure all files in src folder are loaded for proper code coverage analysis.
const srcContext = require.context('../src', true, /.*\.js$/);
srcContext.keys().forEach(srcContext);

const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);
