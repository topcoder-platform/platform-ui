import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'

const COMMUNITY_WEBSITE: string = 'https://www.topcoder-dev.com'

export const EnvironmentConfigDefault: GlobalConfig = {
    API: {
        FORUM_ACCESS_TOKEN: 'va.JApNvUOx3549h20I6tnl1kOQDc75NDIp.0jG3dA.EE3gZgV',
        FORUM_V2: 'https://vanilla.topcoder-dev.com/api/v2',
        V3: 'https://api.topcoder-dev.com/v3',
        V5: 'https://api.topcoder-dev.com/v5',
    },
    ENV: AppHostEnvironment.default,
    LEARN_SRC: 'https://fcc.topcoder-dev.com:4431',
    LOGGING: {
        PUBLIC_TOKEN: 'puba0825671e469d16f940c5a30dc738f11',
        SERVICE: 'platform-ui',
    },
    REAUTH_OFFSET: 55,
    TAG_MANAGER_ID: undefined,
    TOPCODER_URLS: {
        CHALLENGES_PAGE: `${COMMUNITY_WEBSITE}/challenges`,
        GIGS_PAGE: `${COMMUNITY_WEBSITE}/gigs`,
        USER_PROFILE: `${COMMUNITY_WEBSITE}/members`,
    },
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
