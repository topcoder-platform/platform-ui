import { GlobalConfig } from '../lib'

import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigProd: GlobalConfig = {
    ...EnvironmentConfigDefault,
    API: {
        V5: 'https://api.topcoder.com/v5',
    },
    ENV: 'prod',
    TAG_MANAGER_ID: 'GTM-MXXQHG8',
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder.com',
    },
}
