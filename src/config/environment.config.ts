import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigLocal } from './environment.local.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'prod':
            return EnvironmentConfigProd
        case 'local':
            return EnvironmentConfigLocal
        // TODO: other environments
        default:
            return EnvironmentConfigDefault
    }
}

const enviromentConfig: GlobalConfig = {
    ...getEnvironmentConfig(),
}

export default enviromentConfig
