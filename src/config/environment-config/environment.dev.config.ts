import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigDev: GlobalConfig = {
    ...EnvironmentConfigDefault,
    ENV: AppHostEnvironment.dev,
    TAG_MANAGER_ID: 'GTM-W7B537Z',
}
