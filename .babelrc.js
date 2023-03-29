const isProd = process.env.APPMODE === "production";

const generateScopedName = isProd
  ? "[hash:base64:6]"
  : "[path][name]___[local]___[hash:base64:6]";

module.exports = function (api) {
  api.cache(!isProd);

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
    ],
  };
};
