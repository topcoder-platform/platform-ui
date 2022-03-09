import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigLocal: GlobalConfig = {
    ...EnvironmentConfigDefault,
    ENV: 'local',
}
