const {
    removeModuleScopePlugin,
    override,
    addPostcssPlugins,
    useBabelRc,
    addWebpackModuleRule,
    adjustStyleLoaders
} = require('customize-cra');
const autoprefixer = require("autoprefixer");
const path = require('path');

const isProd = process.env.APPMODE === "production";
const localIdentName = isProd
    ? "[hash:base64:6]"
    : "[path][name]___[local]___[hash:base64:6]";

const resolve = dir => path.resolve(__dirname, dir);
let cssLocalIdent;
if (process.env.APPMODE == "production") {
  cssLocalIdent = "[hash:base64:6]";
} else {
  cssLocalIdent = "earn_[path][name]___[local]___[hash:base64:6]";
}

module.exports = override(
    useBabelRc(),
    removeModuleScopePlugin(),
    addPostcssPlugins([autoprefixer]),
    
    adjustStyleLoaders(({ use: [, css] }) => {
        if (css.options.modules) {
            css.options.modules.localIdentName = cssLocalIdent;
            css.options.modules.mode = "local";
        }
    }),
    addWebpackModuleRule({
        test: [/\.scss$/],
        include: resolve('node_modules'),
        use: ['style-loader', 'css-loader', 'resolve-url-loader', 'sass-loader', 'postcss-loader']
    }),
    addWebpackModuleRule({
        test: [/src\/earn\/.*\.scss$/],
        use: [
            'style-loader',
            {loader: 'css-loader',
                options: {
                    modules: {
                        mode: "local",
                        localIdentName,
                    }
                }
            },
            'resolve-url-loader',
            'postcss-loader',
            'sass-loader',
        ]
    }),

    (config) => ({
        ...config,
        resolve: {
            ...config.resolve,
            alias: {
                ...config.resolve.alias,
                '@config': resolve('config/'),
                '@earn': resolve('src/earn/'),
            },
            fallback: {
                ...config.resolve.fallback,
                path: require.resolve("path-browserify"),
            },
        }
    }),
);