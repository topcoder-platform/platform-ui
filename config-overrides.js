const {
    removeModuleScopePlugin,
    override,
    addPostcssPlugins,
    useBabelRc,
    addWebpackModuleRule,
} = require('customize-cra');
const autoprefixer = require("autoprefixer");
const path = require('path');

const isProd = process.env.APPMODE === "production";
const localIdentName = isProd
    ? "[hash:base64:6]"
    : "[path][name]___[local]___[hash:base64:6]";

const resolve = dir => path.resolve(__dirname, dir);

module.exports = override(
    useBabelRc(),
    removeModuleScopePlugin(),
    addPostcssPlugins([autoprefixer]),
    
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
            }
        }
    }),
);