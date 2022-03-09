import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigDev } from './environment.dev.config'
import { EnvironmentConfigLocal } from './environment.local.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'local':
            return EnvironmentConfigLocal
        case 'dev':
            return EnvironmentConfigDev
        case 'prod':
            return EnvironmentConfigProd
        default:
            return EnvironmentConfigDefault
    }
}

const enviromentConfig: GlobalConfig = {
    ...getEnvironmentConfig(),
}

export default enviromentConfig
