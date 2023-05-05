import { GlobalConfig } from '../../lib'

import { AppHostEnvironmentType } from './app-host-environment.type'

export interface EnvironmentConfigModel extends GlobalConfig {
    // override the ENV var to require that it's defined in the type
    ENV: AppHostEnvironmentType,

    SUBDOMAIN: string,
}
