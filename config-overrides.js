const {
    removeModuleScopePlugin,
    override,
    addPostcssPlugins,
    useBabelRc,
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
    (config) => (console.log(config.module.rules[1]), {
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