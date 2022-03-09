import { GlobalConfig } from '../lib'

import { AppHostEnvironment } from './app-host-environment.enum'

export const EnvironmentConfigDefault: GlobalConfig = {
    API: {
        V5: 'https://api.topcoder-dev.com/v5',
    },
    ENV: AppHostEnvironment.default,
    LOGGING: {
        PUBLIC_TOKEN: 'puba0825671e469d16f940c5a30dc738f11',
        SERVICE: 'platform-ui',
    },
    REAUTH_OFFSET: 55,
    TAG_MANAGER_ID: undefined,
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
