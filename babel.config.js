module.exports = function (api) {
  const isProd = process.env.APPMODE === "production";
  api.cache(!isProd);

  const generateScopedName = isProd
    ? "[hash:base64:6]"
    : "self_service_[path][name]___[local]___[hash:base64:6]";
  return {
    presets: ["@babel/preset-env", "@babel/preset-react"],
    plugins: [
      [
        "@babel/plugin-transform-runtime",
        {
          useESModules: true,
          regenerator: false,
        },
      ],
      [
        "react-css-modules",
        {
          filetypes: {
            ".scss": {
              syntax: "postcss-scss",
            },
          },
          generateScopedName,
        },
      ],
      [
        "inline-react-svg",
        {
          "svgo": {
            "plugins": [
              {
                "cleanupIDs": false
              }
            ]
          }
        }
      ],
    ],
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
