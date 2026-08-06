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
 * Converts CRA's webpack-dev-server v4 hook registrations into v5 middleware entries.
 *
 * @param {Function|undefined} hook - Legacy CRA middleware hook.
 * @param {object} devServer - Active webpack-dev-server instance.
 * @param {string} namePrefix - Stable prefix used for middleware diagnostics.
 * @returns {Array<object>} Middleware entries accepted by webpack-dev-server v5.
 */
function collectLegacyMiddlewares(hook, devServer, namePrefix) {
    if (!hook) {
        return [];
    }

    const originalApp = devServer.app;
    const appProxy = Object.create(originalApp);
    const registrations = [];

    appProxy.use = (...args) => {
        registrations.push(args);
        return appProxy;
    };

    devServer.app = appProxy;
    try {
        hook(devServer);
    } finally {
        devServer.app = originalApp;
    }

    return registrations.flatMap((registration, registrationIndex) => {
        const args = [...registration];
        const path = typeof args[0] === 'string' ? args.shift() : undefined;

        return args.map((middleware, middlewareIndex) => ({
            name: `${namePrefix}-${registrationIndex}-${middlewareIndex}`,
            ...(path ? { path } : {}),
            middleware,
        }));
    });
}

/**
 * Preserves CRA's dev-server static config while disabling public asset watches.
 *
 * @param {object} devServerConfig - CRA webpack-dev-server config passed through CRACO for yarn start.
 * @returns {object} Dev-server config that serves public assets without consuming file watchers for them.
 * @throws This function does not throw.
 */
function configureDevServer(devServerConfig) {
    const {
        https,
        onAfterSetupMiddleware,
        onBeforeSetupMiddleware,
        setupMiddlewares,
        ...supportedConfig
    } = devServerConfig;
    const staticConfig = devServerConfig.static || {};

    return {
        ...supportedConfig,
        ...(https ? {
            server: {
                type: 'https',
                options: typeof https === 'object' ? https : {},
            },
        } : {}),
        static: {
            ...staticConfig,
            watch: false,
        },
        setupMiddlewares: (middlewares, devServer) => {
            // CRA 5 still calls the webpack-dev-server v4 shutdown method.
            if (!devServer.close && devServer.stopCallback) {
                devServer.close = devServer.stopCallback.bind(devServer);
            }

            const configuredMiddlewares = setupMiddlewares
                ? setupMiddlewares(middlewares, devServer)
                : middlewares;
            const beforeMiddlewares = collectLegacyMiddlewares(
                onBeforeSetupMiddleware,
                devServer,
                'cra-before-setup',
            );
            const afterMiddlewares = collectLegacyMiddlewares(
                onAfterSetupMiddleware,
                devServer,
                'cra-after-setup',
            );

            return [
                ...beforeMiddlewares,
                ...configuredMiddlewares,
                ...afterMiddlewares,
            ];
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
    jest: {
        configure: {
            moduleNameMapper: {
                // Jest 27 cannot resolve React Router 7's nested conditional export.
                '^react-router/dom$': '<rootDir>/test/react-router-dom.cjs',
            },
        },
    },

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
