import { GlobalConfig } from '../lib'

import { EnvironmentConfigBase } from './environment.base.config'

export const EnvironmentConfigDev: GlobalConfig = {
    ...EnvironmentConfigBase,
    API: {
        V5: 'https://api.topcoder-dev.com/v5',
    },
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
