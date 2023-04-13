
import { EarnConfig } from "./EarnConfig.model";

import ProdEarnConfig from "./prod";
import DevEarnConfig from "./dev";

const env = process.env.REACT_APP_HOST_ENV || "dev";
let config: EarnConfig = DevEarnConfig;

console.info(`REACT_APP_HOST_ENV: "${process.env.REACT_APP_HOST_ENV}"`);
console.info(`env: "${env}"`);

// for security reason don't let to require any arbitrary file defined in process.env
if (env === 'prod') {
    config = ProdEarnConfig;
}

export default config;
