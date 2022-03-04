import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'prod':
            return EnvironmentConfigProd
        // TODO: other environments
        default:
            return EnvironmentConfigDefault
    }
}

export default {
    ...getEnvironmentConfig(),
}
