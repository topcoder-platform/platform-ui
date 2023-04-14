import { get } from "lodash";

import { EarnConfig } from "./EarnConfig.model";
import { EnvironmentConfig } from "~/config";

import ProdEarnConfig from "./prod";
import DevEarnConfig from "./dev";

// for security reason don't let to require any arbitrary file defined in process.env
const config: EarnConfig = get({
    dev: DevEarnConfig,
    prod: ProdEarnConfig,
    qa: DevEarnConfig,
}, EnvironmentConfig.ENV, DevEarnConfig)

export default config;
