/* eslint-disable no-console */
import * as DevConfig from './dev.env'
import * as ProdConfig from './prod.env'
import { GlobalConfig } from './global-config.model'

const env: string = process.env.REACT_APP_HOST_ENV || 'dev'
let config: GlobalConfig = DevConfig

console.info(`REACT_APP_HOST_ENV: '${process.env.REACT_APP_HOST_ENV}'`)
console.info(`env: '${env}'`)

// for security reason don't let to require any arbitrary file defined in process.env
if (env === 'prod') {
    config = ProdConfig
}

export default config as GlobalConfig
export type { GlobalConfig }
