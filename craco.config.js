const path = require('path');
const CracoCSSModules = require('craco-css-modules');
const CracoEnvPlugin = require('craco-plugin-env')
const BabelRcPlugin = require('@jackwilsdon/craco-use-babelrc');

const isProd = process.env.APPMODE === "production";

function getModeName() {
    const index = process.argv.indexOf('--mode');
    return index === -1 ? '' : process.argv[index + 1] || ''
}

console.log({buildMode: getModeName()});

const localIdentName = isProd
    ? "[hash:base64:6]"
    : "[name]_[local]__[hash:base64:6]";

const resolve = dir => path.resolve(__dirname, dir);

module.exports = {
    style: {
        modules: {
            localIdentName,
        },
    },

    plugins: [
        { plugin: BabelRcPlugin },
        { plugin: CracoCSSModules },
        { plugin: CracoEnvPlugin, options: {
            envDir: './.environments',
        } },
    ],

    webpack: {
        alias: {
            // aliases used in JS/TS
            '~': resolve('src'),
            '@earn': resolve('src/apps/earn/src'),
            '@learn': resolve('src/apps/learn/src'),
            '@devCenter': resolve('src/apps/dev-center/src'),
            '@gamificationAdmin': resolve('src/apps/gamification-admin/src'),
            '@talentSearch': resolve('src/apps/talent-search/src'),
            '@profiles': resolve('src/apps/profiles/src'),
            '@wallet': resolve('src/apps/wallet/src'),
            '@walletAdmin': resolve('src/apps/wallet-admin/src'),

            '@platform': resolve('src/apps/platform/src'),
            // aliases used in SCSS files
            '@libs/ui/styles': resolve('src/libs/ui/lib/styles'),
        },
    }
}
