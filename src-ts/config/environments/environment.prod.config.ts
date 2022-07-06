import { GlobalConfig } from '../../lib'
import { ToolTitle } from '../constants'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigDefault } from './environment.default.config'

const COMMUNITY_WEBSITE: string = 'https://www.topcoder.com'

export const EnvironmentConfigProd: GlobalConfig = {
    ...EnvironmentConfigDefault,
    API: {
        FORUM_V2: 'https://vanilla.topcoder.com/api/v2',
        V3: 'https://api.topcoder.com/v3',
        V5: 'https://api.topcoder.com/v5',
    },
    DISABLED_TOOLS: [ ],
    ENV: AppHostEnvironment.prod,
    LEARN_SRC: 'https://fcc.topcoder.com:4431',
    TAG_MANAGER_ID: 'GTM-MXXQHG8',
    TOPCODER_URLS: {
        CHALLENGES_PAGE: `${COMMUNITY_WEBSITE}/challenges`,
        GIGS_PAGE: `${COMMUNITY_WEBSITE}/gigs`,
        USER_PROFILE: `${COMMUNITY_WEBSITE}/members`,
    },
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder.com',
    },
}
