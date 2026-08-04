const path = require('node:path');
const { TextDecoder, TextEncoder } = require('node:util');

// React Router 7 needs these browser globals, which CRA's Jest 27 environment omits.
global.TextDecoder ||= TextDecoder;
global.TextEncoder ||= TextEncoder;

const reactRouterRoot = path.dirname(require.resolve('react-router/package.json'));

module.exports = require(path.join(
    reactRouterRoot,
    'dist/development/dom-export.js',
));
