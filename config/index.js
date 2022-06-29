/* global process */

module.exports = (() => {
  const env = process.env.APPENV || "dev";

  console.info(`APPENV: "${env}"`);

  // for security reason don't let to require any arbitrary file defined in process.env
  if (["prod", "dev"].indexOf(env) < 0) {
    return require("./dev");
  }

  return require("./" + env);
})();
