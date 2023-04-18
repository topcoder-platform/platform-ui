import { get } from 'lodash'

import { EnvironmentConfig } from '~/config'

import { EarnConfig } from './EarnConfig.model'
import DevEarnConfig from './dev'
import ProdEarnConfig from './prod'

// for security reason don't let to require any arbitrary file defined in process.env
const config: EarnConfig = get({
    dev: DevEarnConfig,
    prod: ProdEarnConfig,
    qa: DevEarnConfig,
}, EnvironmentConfig.ENV, DevEarnConfig)

export default config
