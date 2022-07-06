/* global process */

module.exports = (() => {
  const env = process.env.REACT_APP_HOST_ENV || "dev";

  console.info(`REACT_APP_HOST_ENV: "${process.env.REACT_APP_HOST_ENV}"`);
  console.info(`env: "${env}"`);

  // for security reason don't let to require any arbitrary file defined in process.env
  if (["prod", "dev"].indexOf(env) < 0) {
    return require("./dev");
  }

  return require("./" + env);
})();
