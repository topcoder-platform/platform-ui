import { EnvironmentConfigModel } from './environment-config.model'
import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigBsouza: EnvironmentConfigModel = {
    ...EnvironmentConfigDefault,
    ENV: 'bsouza',
}
