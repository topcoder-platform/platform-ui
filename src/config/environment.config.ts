import { GlobalConfig } from '../lib'

// TODO: env-specific config
export const EnvironmentConfig: GlobalConfig = {
    API: {
        V5: 'https://api.topcoder-dev.com/v5',
    },
    REAUTH_OFFSET: 55,
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
