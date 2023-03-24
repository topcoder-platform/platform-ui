const { removeModuleScopePlugin, addWebpackModuleRule, override, addPostcssPlugins, adjustStyleLoaders } = require('customize-cra')
const autoprefixer = require("autoprefixer");
const path = require('path');
const resolve = dir => path.resolve(__dirname, dir);
let cssLocalIdent;
if (process.env.APPMODE == "production") {
  cssLocalIdent = "[hash:base64:6]";
} else {
  cssLocalIdent = "earn_[path][name]___[local]___[hash:base64:6]";
}
module.exports = override(removeModuleScopePlugin(), 
addPostcssPlugins([require("autoprefixer")], ), 

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
    })
);