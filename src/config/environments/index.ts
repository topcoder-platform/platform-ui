import { get } from 'lodash'

import * as DefaultConfig from './default.env'
import * as LocalConfig from './local.env'
import * as ProdConfig from './prod.env'
import type { GlobalConfig } from './global-config.model'

const env: string = process.env.REACT_APP_HOST_ENV || 'dev'

/* eslint-disable no-console */
console.info(`REACT_APP_HOST_ENV: '${process.env.REACT_APP_HOST_ENV}'`)
console.info(`env: '${env}'`)

// for security reason don't let to require any arbitrary file defined in process.env
const config: GlobalConfig = get(
    {
        dev: DefaultConfig,
        local: LocalConfig,
        prod: ProdConfig,
        qa: DefaultConfig,
    },
    env,
    DefaultConfig,
)

export default config as GlobalConfig
export type { GlobalConfig }
