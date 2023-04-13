const path = require('path');
const CracoCSSModules = require('craco-css-modules');
const BabelRcPlugin = require('@jackwilsdon/craco-use-babelrc');

const isProd = process.env.APPMODE === "production";

const localIdentName = isProd
    ? "[hash:base64:6]"
    : "[name]_[local]__[hash:base64:6]";

const resolve = dir => path.resolve(__dirname, dir);

module.exports = {
    eslint: {
        enable: false,
    },
    
    style: {
        modules: {
            localIdentName,
        },
    },

    plugins: [
        { plugin: BabelRcPlugin },
        { plugin: CracoCSSModules },
    ],

    webpack: {
        alias: {
            // aliases used in JS/TS
            '~': resolve('src'),

            // aliases used in SCSS files
            '@earn': resolve('src/apps/earn/src'),
            '@libs/ui/styles': resolve('src/libs/ui/lib/styles'),
        },
    }
}
