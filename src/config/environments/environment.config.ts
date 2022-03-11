import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigBsouza } from './environment.bsouza.config'
import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigDev } from './environment.dev.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): GlobalConfig {

    switch (process.env.REACT_APP_HOST_ENV) {

        case AppHostEnvironment.bsouza:
            return EnvironmentConfigBsouza

        case AppHostEnvironment.default:
            return EnvironmentConfigDefault

        case AppHostEnvironment.dev:
            return EnvironmentConfigDev

        case AppHostEnvironment.prod:
            return EnvironmentConfigProd

        default:
            throw new Error(`Cannot initialize an invalid host environment: ${process.env.REACT_APP_HOST_ENV}`)
    }
}

const enviromentConfig: GlobalConfig = {
    ...getEnvironmentConfig(),
}

export default enviromentConfig
