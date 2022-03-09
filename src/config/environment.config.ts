import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigDev } from './environment.dev.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {
    switch (process.env.REACT_APP_HOST_ENV) {
        case 'prod':
            return EnvironmentConfigProd
        case 'dev':
            return EnvironmentConfigDev
        // TODO: other environments
        default:
            return EnvironmentConfigDefault
    }
}

const enviromentConfig: GlobalConfig = {
    ...getEnvironmentConfig(),
}

export default enviromentConfig
