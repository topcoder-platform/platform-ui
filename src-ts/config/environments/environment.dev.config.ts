import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigDefault } from './environment.default.config'

const COMMUNITY_WEBSITE: string = 'https://www.topcoder-dev.com'

export const EnvironmentConfigDev: GlobalConfig = {
    ...EnvironmentConfigDefault,
    DISABLED_TOOLS: [ ],
    ENV: AppHostEnvironment.dev,
    TAG_MANAGER_ID: 'GTM-W7B537Z',
    TOPCODER_URLS: {
        USER_PROFILE: `${COMMUNITY_WEBSITE}/members`,
        CHALLENGES_PAGE: `${COMMUNITY_WEBSITE}/challenges`,
        GIGS_PAGE: `${COMMUNITY_WEBSITE}/gigs`,
    }
}
