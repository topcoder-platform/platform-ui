import { EnvironmentConfigModel } from './environment-config.model'
import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigBrooke: EnvironmentConfigModel = {
    ...EnvironmentConfigDefault,
    ENV: 'brooke',
}
