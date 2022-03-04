import { GlobalConfig } from '../lib'

import { EnvironmentConfigDev } from './environment.dev.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'dev':
        case 'local':
            return EnvironmentConfigDev
        case 'prod':
            return EnvironmentConfigProd
        default:
            throw new Error(`Cannot start: invalid environment: ${process.env.NODE_ENV}`)
    }
}

export default {
    ...getEnvironmentConfig(),
}
