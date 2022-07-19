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
    STRIPE: {
        ADMIN_TOKEN:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoidGVzdDEiLCJleHAiOjI1NjMwNzY2ODksInVzZXJJZCI6IjQwMDUxMzMzIiwiaWF0IjoxNDYzMDc2MDg5LCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwianRpIjoiYjMzYjc3Y2QtYjUyZS00MGZlLTgzN2UtYmViOGUwYWU2YTRhIn0.wKWUe0-SaiFVN-VR_-GwgFlvWaDkSbc8H55ktb9LAVw',
        API_KEY: 'pk_live_m3bCBVSfkfMOEp3unZFRsHXi',
        API_VERSION: '2020-08-27',
        CUSTOMER_TOKEN:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.jl6Lp_friVNwEP8nfsfmL-vrQFzOFp2IfM_HC7AwGcg',
    },
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
