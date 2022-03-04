import { GlobalConfig } from '../lib'

import { EnvironmentConfig as DevConfig } from './environment.dev.config'
import { EnvironmentConfig as ProdConfig } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'dev':
        case 'local':
            return DevConfig
        case 'prod':
            return ProdConfig
        default:
            throw new Error(`Cannot start: invalid environment: ${process.env.NODE_ENV}`)
    }
}

export default {
    ...getEnvironmentConfig(),
}
