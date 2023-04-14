import { get } from 'lodash'

import * as DefaultConfig from './default.env'
import * as ProdConfig from './prod.env'
import { GlobalConfig } from './global-config.model'

const env: string = process.env.REACT_APP_HOST_ENV || 'dev'

/* eslint-disable no-console */
console.info(`REACT_APP_HOST_ENV: '${process.env.REACT_APP_HOST_ENV}'`)
console.info(`env: '${env}'`)

// for security reason don't let to require any arbitrary file defined in process.env
const config: GlobalConfig = get({
    dev: DefaultConfig,
    prod: ProdConfig,
    qa: DefaultConfig,
}, env, DefaultConfig)

export default config as GlobalConfig
export type { GlobalConfig }
