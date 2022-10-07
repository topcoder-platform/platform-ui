import { AppHostEnvironmentType } from './app-host-environment.type'
import { EnvironmentConfigModel } from './environment-config.model'
import { EnvironmentConfigBrooke } from './environment.brooke.config'
import { EnvironmentConfigDefault } from './environment.default.config'
import { EnvironmentConfigDev } from './environment.dev.config'
import { EnvironmentConfigProd } from './environment.prod.config'

function getEnvironmentConfig(): EnvironmentConfigModel {

    const environment: AppHostEnvironmentType | undefined
        = process.env.REACT_APP_HOST_ENV as AppHostEnvironmentType | undefined

    switch (environment) {

        case 'brooke':
            return EnvironmentConfigBrooke

        case 'default':
            return EnvironmentConfigDefault

        case 'dev':
            return EnvironmentConfigDev

        case 'prod':
            return EnvironmentConfigProd

        default:
            return EnvironmentConfigDefault
    }
}

const enviromentConfig: EnvironmentConfigModel = {
    ...getEnvironmentConfig(),
}

export default enviromentConfig
