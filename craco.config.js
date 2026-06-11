const path = require('path');
const CracoCSSModules = require('craco-css-modules');
const CracoEnvPlugin = require('craco-plugin-env')
const BabelRcPlugin = require('@jackwilsdon/craco-use-babelrc');

const isProd = process.env.APPMODE === "production";
const nodeModulesWatchIgnore = '**/node_modules/**';
const watchPollInterval = 1000;

/**
 * Appends the node_modules ignore pattern to an existing watch ignore config.
 *
 * @param {RegExp|string|Array<RegExp|string>|undefined} ignored - Existing ignore config from webpack or dev server watches.
 * @returns {Array<RegExp|string>} Watch ignore config with node_modules excluded. Used by CRACO watch overrides.
 * @throws This function does not throw.
 */
function withNodeModulesWatchIgnore(ignored) {
    return [
        ...(Array.isArray(ignored) ? ignored : ignored ? [ignored] : []),
        nodeModulesWatchIgnore,
    ];
}

/**
 * Preserves CRA's dev-server static config while disabling public asset watches.
 *
 * @param {object} devServerConfig - CRA webpack-dev-server config passed through CRACO for yarn start.
 * @returns {object} Dev-server config that serves public assets without consuming file watchers for them.
 * @throws This function does not throw.
 */
function configureDevServer(devServerConfig) {
    const staticConfig = devServerConfig.static || {};

    return {
        ...devServerConfig,
        static: {
            ...staticConfig,
            watch: false,
        },
    };
}

/**
 * Preserves CRA's webpack config while polling watch mode and ignoring node_modules.
 *
 * @param {object} webpackConfig - CRA webpack config passed through CRACO.
 * @returns {object} Webpack config with polling enabled and node_modules excluded from watchOptions.
 * @throws This function does not throw.
 */
function configureWebpack(webpackConfig) {
    return {
        ...webpackConfig,
        watchOptions: {
            ...webpackConfig.watchOptions,
            ignored: withNodeModulesWatchIgnore(webpackConfig.watchOptions?.ignored),
            poll: watchPollInterval,
        },
    };
}

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

    devServer: configureDevServer,

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
            '@engagements': resolve('src/apps/engagements/src'),

            '@platform': resolve('src/apps/platform/src'),
            // aliases used in SCSS files
            '@libs/ui/styles': resolve('src/libs/ui/lib/styles'),
        },
        configure: configureWebpack,
    }
}
