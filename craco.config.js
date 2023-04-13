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
            '@earn': resolve('src/apps/earn/src'),
            '@learn': resolve('src/apps/learn/src'),
            '@devCenter': resolve('src/apps/dev-center/src'),
            '@gamificationAdmin': resolve('src/apps/gamification-admin/src'),

            '@platform': resolve('src/apps/platform/src'),
            // aliases used in SCSS files
            '@libs/ui/styles': resolve('src/libs/ui/lib/styles'),
        },
    }
}
