import '@babel/polyfill';

import dirtyChai from 'dirty-chai';

global.chai.use(dirtyChai);

// Ensure all files in src folder are loaded for proper code coverage analysis.
const srcContext = require.context('../src', true, /.*\.js$/);
srcContext.keys().forEach(srcContext);

const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);
