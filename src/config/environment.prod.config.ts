import { GlobalConfig } from '../lib'

import { EnvironmentConfigBase } from './environment.base.config'

export const EnvironmentConfigProd: GlobalConfig = {
    ...EnvironmentConfigBase,
    API: {
        V5: 'https://api.topcoder.com/v5',
    },
    TAG_MANAGER_ID: 'GTM-MXXQHG8',
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder.com',
    },
}
