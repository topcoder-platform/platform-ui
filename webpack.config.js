/* global __dirname process */
const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");
const path = require("path");
const autoprefixer = require("autoprefixer");
const _ = require("lodash");
const config = require("config");

const cssLocalIdent =
  process.env.APPMODE === "production"
    ? "[hash:base64:6]"
    : "self_service_[path][name]___[local]___[hash:base64:6]";

module.exports = (webpackConfigEnv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "topcoder",
    projectName: "mfe-customer-work",
    webpackConfigEnv,
  });

  return webpackMerge.smart(defaultConfig, {
    // to reduce size of bundle
    externals: {
      "react": "react",
      "react-dom": "react-dom",
    },
    output: {
      // path: path.resolve(__dirname, 'dist'),
      publicPath: "self-service-app",
    },
    // modify the webpack config however you'd like to by adding to this object
    module: {
      rules: [
        {
          /* Loads SCSS stylesheets. */
          test: /\.scss/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: cssLocalIdent,
                  auto: true,
                },
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [autoprefixer],
                },
              },
            },
            "resolve-url-loader",
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          oneOf: [
            {
              exclude: [/node_modules/],
              loader: "babel-loader",
            },
            {
              exclude: [/node_modules/],
              loader: require.resolve("file-loader", { paths: [__dirname] }),
            },
          ],
        },
        {
          /* Loads raster images */
          test: /\.(gif|jpe?g|png|pdf)$/,
          exclude: [/node_modules/, /[/\\]assets[/\\]fonts/],
          loader: "file-loader",
          options: {
            outputPath: "icons",
          },
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ]
          }
        },
      ],
    },
    resolve: {
      alias: {
        styles: path.resolve(__dirname, "src/styles"),
        actions: path.resolve(__dirname, "src/actions"),
        assets: path.resolve(__dirname, "src/assets"),
        components: path.resolve(__dirname, "src/components"),
        hooks: path.resolve(__dirname, "src/hooks"),
        utils: path.resolve(__dirname, "src/utils"),
        constants: path.resolve(__dirname, "src/constants"),
        selectors: path.resolve(__dirname, "src/selectors"),
        services: path.resolve(__dirname, "src/services"),
        thunks: path.resolve(__dirname, "src/thunks"),
        hoc: path.resolve(__dirname, "src/hoc"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          ..._.mapValues(config, (value) => JSON.stringify(value)),
          REACT_APP_HOST_ENV: JSON.stringify(process.env.REACT_APP_HOST_ENV),
          APPMODE: JSON.stringify(process.env.APPMODE),
        },
      }),
      // ignore moment locales to reduce bundle size by 64kb gzipped
      // see solution details https://stackoverflow.com/questions/25384360/how-to-prevent-moment-js-from-loading-locales-with-webpack/25426019#25426019
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.ProvidePlugin({
        "React": "react",
      })
    ],
  });
};
