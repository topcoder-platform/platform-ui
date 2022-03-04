import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigDev: GlobalConfig = {
    ...EnvironmentConfigDefault,
    API: {
        V5: 'https://api.topcoder-dev.com/v5',
    },
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
