
const path = require('path');

function createReactCssModulesPlugin() {
  return [
    "react-css-modules",
    {
      context: "src",
      filetypes: {
        ".scss": {
          syntax: "postcss-scss",
          plugins: [
            [
              "postcss-import-sync2",
              {
                resolve: function (id, basedir, importOptions) {
                  let nextId = id;

                  if (id.substr(0, 2) === "./") {
                    nextId = id.replace("./", "");
                  }

                  if (nextId[0] !== "_") {
                    nextId = `_${nextId}`;
                  }

                  if (nextId.indexOf(".scss") === -1) {
                    nextId = `${nextId}.scss`;
                  }

                  return path.resolve(basedir, nextId);
                },
              },
            ],
            [
              "postcss-nested",
              {
                bubble: ["@include"],
                preserveEmpty: true,
              },
            ],
          ],
        },
      },
      generateScopedName: "[path]___[name]__[local]___[hash:base64:5]",
      webpackHotModuleReloading: true,
      exclude: "node_modules",
      handleMissingStyleName: "throw",
    },
  ];
}



module.exports = function (api) {
  const isProd = process.env.APPMODE === "production";
  api.cache(!isProd);

  const generateScopedName = isProd
    ? "[hash:base64:6]"
    : "self_service_[path][name]___[local]___[hash:base64:6]";
  return {
    presets: ["@babel/preset-env", "@babel/preset-react"],
    plugins: ["@babel/transform-react-jsx", createReactCssModulesPlugin()],
    env: {
      test: {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: "current node",
            },
          ],
        ],
        plugins: [
          "istanbul",
          [
            "module-resolver",
            {
              alias: {
                styles: "./src/styles",
                components: "./src/components",
                hooks: "./src/hooks",
                utils: "./src/utils",
                constants: "./src/constants",
                services: "./src/services",
              },
            },
          ],
        ],
      },
    },
  };
};
