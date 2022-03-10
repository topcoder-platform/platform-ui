import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigBsouza: GlobalConfig = {
    ...EnvironmentConfigDefault,
    ENV: AppHostEnvironment.bsouza,
}
